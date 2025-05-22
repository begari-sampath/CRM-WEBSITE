import { useState, useEffect, FormEvent } from 'react';
import { toast } from 'react-hot-toast';
import { supabase } from '../../supabase/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const LoginPage = () => {
  const { setAuthState } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [redirectRole, setRedirectRole] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (redirectRole === 'admin') {
      navigate('/admin/dashboard');
    } else if (redirectRole === 'bda') {
      navigate('/bda/dashboard');
    }
  }, [redirectRole, navigate]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter both email and password');
      return;
    }
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        toast.error(`Login failed: ${error.message}`);
        return;
      }
      if (!data.user) {
        toast.error('No user returned');
        return;
      }
      // Fetch the user's role from the 'profiles' table
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single();
      if (profileError || !profile) {
        toast.error('Failed to fetch user profile');
        return;
      }
      setAuthState({ ...data.user, role: profile.role }, profile.role);
      toast.success('Login successful! Redirecting...');
      setRedirectRole(profile.role);
    } catch (err) {
      toast.error('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
      <form className="space-y-6" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-slate-700">
            Email address
          </label>
          <input
            id="email"
            type="email"
            value={email}
            required
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm"
            placeholder="Enter your email"
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-slate-700">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            required
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm"
            placeholder="Enter your password"
          />
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className={`w-full py-2 px-4 rounded-md text-white font-medium ${isLoading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'}`}
        >
          {isLoading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>
    </div>
  );
};

export default LoginPage;