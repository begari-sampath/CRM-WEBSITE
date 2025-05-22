import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { supabase } from '../supabase/supabaseClient';

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
  logout: () => void;
  role: string | null;
  refreshSession: () => Promise<void>;
  setAuthState: (user: User, role: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);


  const updateUserState = useCallback((newRole: string | null, userData: User | null) => {
    console.log('🔄 Updating user state:', {
      hasUser: !!userData,
      newRole,
      currentPath: window.location.pathname
    });
    
    // First set the role
    setRole(newRole);
    
    if (userData) {
      const updatedUser = {
        ...userData,
        role: newRole || undefined
      };
      
      console.log('👤 Setting user with role:', newRole);
      setUser(updatedUser);
      
      // Update the auth state with the role
      const isAdminRole = newRole === 'admin';
      const isBDARole = newRole === 'bda';
      
      // Only update state if we have a valid role
      if (isAdminRole || isBDARole) {
        const authState = {
          user: updatedUser,
          isAuthenticated: true,
          isAdmin: isAdminRole,
          isBDA: isBDARole,
          loading: false,
          role: newRole
        };
        
        console.log('🔑 Updated auth state:', authState);
      } else {
        console.log('⚠️ Invalid role, not updating auth state');
      }
    } else {
      console.log('👤 Clearing user state');
      setUser(null);
    }
  }, []);

  const createNewProfile = useCallback(async (userData: User) => {
    try {
      const defaultRole = 'bda'; // Default role for new users
      const displayName = userData.email?.split('@')[0] || '';
      
      console.log('Creating new profile with role:', defaultRole);
      
      const { error: upsertError } = await supabase
        .from('profiles')
        .upsert({
          id: userData.id,
          email: userData.email,
          role: defaultRole,
          updated_at: new Date().toISOString(),
        });

      if (upsertError) throw upsertError;
      
      updateUserState(defaultRole, {
        ...userData,
        role: defaultRole,
        name: displayName
      });
    } catch (error) {
      console.error('Error creating profile:', error);
      throw error;
    }
  }, [updateUserState]);

  const fetchProfile = useCallback(async (userData: User) => {
    let timeout: NodeJS.Timeout | null = null;
    try {
      console.log('[fetchProfile] Start for user:', userData);
      setLoading(true);
      let didTimeout = false;
      // Setup a timeout
      const timeoutPromise = new Promise((_, reject) => {
        timeout = setTimeout(() => {
          didTimeout = true;
          reject(new Error('Supabase profile fetch timed out after 10 seconds'));
        }, 10000);
      });
      let data, error;
      try {
        console.log('[fetchProfile] Awaiting Supabase profile fetch...');
        const res = await Promise.race([
          supabase
            .from('profiles')
            .select('role')
            .eq('id', userData.id)
            .single(),
          timeoutPromise
        ]);
        if (didTimeout) throw new Error('Supabase profile fetch timed out');
        data = (res as any).data;
        error = (res as any).error;
        console.log('[fetchProfile] Supabase fetch complete:', { data, error });
      } catch (err) {
        error = err;
        if (err && typeof err === 'object' && 'status' in err) {
          console.error('[fetchProfile] Error or timeout in Supabase fetch:', err, 'Status:', err.status, 'Details:', err.message || err.error_description || err.details || '');
        } else {
          console.error('[fetchProfile] Error or timeout in Supabase fetch:', err);
        }
      }
      if (timeout) clearTimeout(timeout);
      if (error) {
        // Defensive: check for error code/message on any error object
        const errorCode = typeof error === 'object' && error !== null && 'code' in error ? (error as any).code : undefined;
        const errorMessage = typeof error === 'object' && error !== null && 'message' in error ? (error as any).message : '';
        if (errorCode === 'PGRST116' || errorMessage.includes('Row not found')) {
          // Profile missing, try to create
          try {
            await createNewProfile(userData);
            return;
          } catch (createError) {
            console.error('❌ Failed to create missing profile:', createError);
            updateUserState(null, null);
            setLoading(false);
            return;
          }
        } else {
          console.error('❌ Error fetching profile:', error);
          updateUserState(null, null);
          setLoading(false);
          return;
        }
      }
      if (data) {
        console.log('✅ Found existing profile with role:', data.role);
        updateUserState(data.role, userData);
      } else {
        console.log('⚠️ No profile data returned');
        updateUserState(null, null);
      }
    } catch (error) {
      console.error('❌ Error in fetchProfile:', error);
      updateUserState(null, null);
      setUser(null);
      setRole(null);
    } finally {
      setLoading(false);
      console.log('[fetchProfile] End. user:', user, 'role:', role, 'loading:', loading);
    }
  }, [createNewProfile, updateUserState]);

  // Fetch session from Supabase and update user/profile, always set loading=false at end
  const fetchSession = async () => {
    setLoading(true);
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      console.log('[fetchSession] session:', session, 'error:', error);
      if (error) throw error;
      if (session?.user) {
        setUser(session.user);
        console.log('[fetchSession] setUser:', session.user);
        await fetchProfile(session.user);
      } else {
        setUser(null);
        setRole(null);
        console.log('[fetchSession] No session user. Cleared user and role.');
      }
    } catch (error) {
      setUser(null);
      setRole(null);
      console.error('[fetchSession] error:', error);
    } finally {
      setLoading(false);
      console.log('[fetchSession] FINAL. user:', user, 'role:', role, 'loading:', loading);
    }
  };

  // On mount, fetch session ONCE, and listen for auth state changes
  useEffect(() => {
    // Prevent infinite loop by only fetching session once
    let isMounted = true;
    fetchSession();
    const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[onAuthStateChange] event:', event, 'session:', session);
      if (session?.user) {
        setUser(session.user);
        console.log('[onAuthStateChange] setUser:', session.user);
        await fetchProfile(session.user);
      } else {
        setUser(null);
        setRole(null);
        console.log('[onAuthStateChange] User signed out. Cleared user and role.');
      }
      setLoading(false);
      console.log('[onAuthStateChange] FINAL. user:', user, 'role:', role, 'loading:', loading);
    });
    return () => {
      if (data?.subscription) data.subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const logout = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
      setRole(null);
    } catch (error) {
      console.error('Error logging out:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshSession = async () => {
    await fetchSession();
  };

  const setAuthState = (user: User, role: string) => {
    setUser(user);
    setRole(role);
  };

  const authState = {
    user,
    isAuthenticated: !!user,
    isAdmin: role === 'admin',
    isBDA: role === 'bda',
    loading,
    logout,
    role,
    refreshSession,
    setAuthState
  };

  return (
    <AuthContext.Provider value={authState}>
      {children}
      {loading && (
        <div className="fixed inset-0 flex items-center justify-center bg-white bg-opacity-75 z-50">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      )}
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