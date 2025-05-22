import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../supabase/supabaseClient';
import { Session, User as SupabaseUser } from '@supabase/supabase-js';

interface User {
  id: string;
  email?: string;
  name?: string;
  role?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isBDA: boolean;
  loading: boolean;
  logout: () => Promise<void>;
  session: Session | null;
  userName: string | null; // Exposing the user's name for UI components
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [role, setRole] = useState<string | null>(null);
  const [name, setName] = useState<string | null>(null);

  // Function to update user with profile data
  const updateUserWithProfile = (baseUser: SupabaseUser | null, userRole: string | null, displayName: string | null) => {
    if (!baseUser) {
      setUser(null);
      return;
    }
    
    // Update user with profile data including name
    setUser({
      id: baseUser.id,
      email: baseUser.email || undefined,
      name: displayName || undefined,
      role: userRole || undefined,
    });

    // Update name state variable for use in other contexts
    setName(displayName);
  };

  // Function to fetch user profile
  const fetchUserProfile = async (userId: string, userEmail?: string) => {
    try {
      setProfileLoading(true);
      console.log('Fetching profile for user:', userId);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

      if (error) {
        // If the profile doesn't exist (error code PGRST116: no rows returned)
        if (error.code === 'PGRST116') {
          console.log('Profile not found, creating default profile');
          const defaultRole = userEmail === 'admin@example.com' ? 'admin' : 'bda';
          const { error: upsertError } = await supabase
            .from('profiles')
            .upsert({
              id: userId,
              email: userEmail,
              role: defaultRole,
            });

          if (upsertError) {
            console.error('Error creating user profile:', upsertError);
            setRole(null);
            setName(null);
          } else {
            console.log('Profile created with role:', defaultRole);
            const displayName = userEmail ? userEmail.split('@')[0] : null;
            setRole(defaultRole);
            setName(displayName);
            updateUserWithProfile(session?.user || null, defaultRole, displayName);
          }
        } else {
          console.error('Error fetching user profile:', error);
          setRole(null);
          setName(null);
        }
      } else {
        console.log('Profile found with role:', data?.role);
        const displayName = userEmail ? userEmail.split('@')[0] : null;
        setRole(data?.role || null);
        setName(displayName);
        updateUserWithProfile(session?.user || null, data?.role || null, displayName);
      }
    } catch (error) {
      console.error('Unexpected error in fetchUserProfile:', error);
    } finally {
      setProfileLoading(false);
    }
  };

  // Initialize auth state and session
  useEffect(() => {
    console.log('Initializing auth state...');
    let authListener: { subscription: { unsubscribe: () => void } } | null = null;
    
    const initializeAuth = async () => {
      try {
        // Get current session
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          setLoading(false);
          return;
        }

        console.log('Session retrieved:', data.session ? 'Session exists' : 'No session');
        setSession(data.session);
        
        if (data.session?.user) {
          await fetchUserProfile(
            data.session.user.id, 
            data.session.user.email || undefined
          );
        } else {
          setUser(null);
          setRole(null);
          setName(null);
        }

        // Listen for auth state changes
        const { data: listener } = supabase.auth.onAuthStateChange(async (event, newSession) => {
          console.log('Auth state changed:', event);
          setSession(newSession);
          
          if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            if (newSession?.user) {
              await fetchUserProfile(
                newSession.user.id,
                newSession.user.email || undefined
              );
            }
          } else if (event === 'SIGNED_OUT') {
            setUser(null);
            setRole(null);
            setName(null);
          }
        });

        authListener = listener;
        setLoading(false);
      } catch (error) {
        console.error('Unexpected error during auth initialization:', error);
        setLoading(false);
      }
    };

    initializeAuth();

    // Cleanup function
    return () => {
      if (authListener?.subscription) {
        console.log('Cleaning up auth listener');
        authListener.subscription.unsubscribe();
      }
    };
  }, []);

  const isAuthenticated = !!user && !!session;
  const isAdmin = role === 'admin';
  const isBDA = role === 'bda';

  const logout = async () => {
    console.log('Logging out...');
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error signing out:', error);
      } else {
        console.log('Successfully signed out');
        setUser(null);
        setSession(null);
        setRole(null);
        setName(null);
      }
    } catch (error) {
      console.error('Unexpected error during logout:', error);
    }
  };

  // Combine loading states
  const isLoading = loading || profileLoading;

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        session, 
        isAuthenticated, 
        isAdmin, 
        isBDA, 
        loading: isLoading, 
        logout,
        userName: name // Providing the user's name to consumers of the context
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}