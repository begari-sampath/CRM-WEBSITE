// import { useState, FormEvent } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { toast } from 'react-hot-toast';
// import { supabase } from '../../supabase/supabaseClient';

// const LoginPage = () => {
//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('');
//   const [isLoading, setIsLoading] = useState(false);
//   const navigate = useNavigate();

//   const handleSubmit = async (e: FormEvent) => {
//     e.preventDefault();

//     if (!email || !password) {
//       toast.error('Please enter both email and password');
//       return;
//     }

//     setIsLoading(true);

//     try {
//       const { data, error } = await supabase.auth.signInWithPassword({
//         email,
//         password,
//       });

//       if (error || !data.user) {
//         toast.error(error?.message || 'Invalid email or password');
//         return;
//       }

//       // ✅ Optional: Check user role from profiles table
//       const { data: profile, error: profileError } = await supabase
//         .from('profiles') // replace with your table name
//         .select('role')
//         .eq('id', data.user.id)
//         .single();

//       if (profileError || !profile) {
//         toast.error('Unable to fetch user role');
//         return;
//       }

//       const isAdmin = profile.role === 'admin';

//       navigate(isAdmin ? '/admin/dashboard' : '/bda/dashboard');
//     } catch (error) {
//       toast.error('An error occurred during login');
//       console.error('Login error:', error);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   return (
//     <div>
//       <form className="space-y-6" onSubmit={handleSubmit}>
//         <div>
//           <label htmlFor="email" className="block text-sm font-medium text-slate-700">
//             Email address
//           </label>
//           <div className="mt-1">
//             <input
//               id="email"
//               name="email"
//               type="email"
//               autoComplete="email"
//               required
//               value={email}
//               onChange={(e) => setEmail(e.target.value)}
//               className="appearance-none block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm 
//                          placeholder-slate-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
//               placeholder="Enter your email"
//             />
//           </div>
//         </div>

//         <div>
//           <label htmlFor="password" className="block text-sm font-medium text-slate-700">
//             Password
//           </label>
//           <div className="mt-1">
//             <input
//               id="password"
//               name="password"
//               type="password"
//               autoComplete="current-password"
//               required
//               value={password}
//               onChange={(e) => setPassword(e.target.value)}
//               className="appearance-none block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm 
//                          placeholder-slate-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
//               placeholder="Enter your password"
//             />
//           </div>
//         </div>

//         <div className="flex items-center justify-between">
//           <div className="text-sm">
//             <div className="text-blue-600 hover:text-blue-500">
//               Demo Accounts:
//             </div>
//           </div>
//         </div>

//         <div className="flex flex-col space-y-2 text-sm text-slate-600">
//           <div className="px-3 py-1.5 bg-slate-100 rounded-md">
//             <div className="font-medium">Admin:</div>
//             <div>Email: admin@example.com</div>
//             <div>Password: (use any password)</div>
//           </div>
//           <div className="px-3 py-1.5 bg-slate-100 rounded-md">
//             <div className="font-medium">BDA:</div>
//             <div>Email: john@example.com or sarah@example.com</div>
//             <div>Password: (use any password)</div>
//           </div>
//         </div>

//         <div>
//           <button
//             type="submit"
//             disabled={isLoading}
//             className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white 
//                        ${isLoading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'} 
//                        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors`}
//           >
//             {isLoading ? 'Logging in...' : 'Sign in'}
//           </button>
//         </div>
//       </form>
//     </div>
//   );
// };

// export default LoginPage;


import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { supabase } from '../../supabase/supabaseClient';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error('Please enter both email and password');
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log("Login response:", data, error);

      if (error) {
        toast.error(`Login failed: ${error.message}`);
        return;
      }

      if (!data.user) {
        toast.error("No user returned");
        return;
      }

      // Fetch the user's role from the 'profiles' table
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .single();

      if (profileError || !profile) {
        toast.error("Failed to fetch user profile");
        console.error("Profile fetch error:", profileError);
        return;
      }

      console.log("User role:", profile.role);

      // Redirect based on role
      if (profile.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/bda/dashboard');
      }

    } catch (err) {
      console.error("Unexpected error:", err);
      toast.error("An unexpected error occurred");
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
          className={`w-full py-2 px-4 rounded-md text-white font-medium ${
            isLoading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {isLoading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>
    </div>
  );
};

export default LoginPage;
