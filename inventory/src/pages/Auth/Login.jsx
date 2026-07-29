import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  EyeIcon, 
  EyeSlashIcon, 
  LockClosedIcon, 
  EnvelopeIcon, 
  ShieldCheckIcon 
} from '@heroicons/react/24/outline';
import { useAppDispatch } from '../../store/hooks';
import { loginUser } from '../../store/slices/authSlice';
import ThemeToggle from '../../components/common/ThemeToggle';

const Login = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const from = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter your email/ID and security password');
      return;
    }

    setLoading(true);
    setError('');

    const resultAction = await dispatch(loginUser({ email, password, rememberMe }));
    
    if (loginUser.fulfilled.match(resultAction)) {
      const user = resultAction.payload.user;
      if (user.role === 'Super Admin') {
        navigate('/superadmin', { replace: true });
      } else {
        navigate(from === '/' ? '/dashboard' : from, { replace: true });
      }
    } else {
      setError(resultAction.payload || 'Invalid login credentials. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-4 font-sans select-none overflow-hidden relative transition-colors duration-300">
      
      {/* Floating Theme Toggle Switch */}
      <div className="absolute top-5 right-5 z-20">
        <ThemeToggle />
      </div>
      
      {/* Decorative backdrop ambient glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-emerald-500/10 dark:bg-emerald-500/15 blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[350px] h-[350px] rounded-full bg-indigo-500/10 dark:bg-indigo-500/15 blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.25, 1, 0.5, 1] }}
        className="w-full max-w-[440px] bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-8 rounded-3xl shadow-xl relative z-10"
      >
        {/* Header Title (Logo Completely Removed as requested) */}
        <div className="text-center mb-7">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-400 text-[11px] font-black tracking-wide uppercase mb-3">
            <ShieldCheckIcon className="w-3.5 h-3.5 stroke-[2.5]" />
            Encrypted Enterprise Access
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white leading-none">
            Stock Management
          </h1>
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-2">
            Secure Administrator & Staff Portal
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-5 p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-bold rounded-2xl flex items-center gap-2"
          >
            <span className="text-sm">⚠️</span>
            <p>{error}</p>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email / Login ID field */}
          <div className="space-y-1">
            <label className="block text-[11px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider">
              Email or Login ID
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <EnvelopeIcon className="w-4 h-4" />
              </span>
              <input
                type="text"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@kiranamart.com or user ID"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-emerald-600 dark:focus:border-emerald-500 focus:outline-none rounded-xl text-xs font-bold text-slate-800 dark:text-white placeholder-slate-400 transition-all"
              />
            </div>
          </div>

          {/* Password field */}
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label className="block text-[11px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                Security Password
              </label>
              <Link
                to="/forgot-password"
                className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline transition-colors"
              >
                Forgot?
              </Link>
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <LockClosedIcon className="w-4 h-4" />
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-emerald-600 dark:focus:border-emerald-500 focus:outline-none rounded-xl text-xs font-bold text-slate-800 dark:text-white placeholder-slate-400 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                {showPassword ? (
                  <EyeSlashIcon className="w-4 h-4" />
                ) : (
                  <EyeIcon className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Remember me checkbox */}
          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-emerald-600 focus:ring-0 cursor-pointer h-4 w-4"
              />
              <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Remember session credentials</span>
            </label>
          </div>

          {/* Primary Login Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white rounded-xl text-xs font-black shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer mt-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                <span>Authenticating Session...</span>
              </>
            ) : (
              <span>Proceed to Dashboard</span>
            )}
          </button>
        </form>

        <div className="text-center mt-6 text-[10px] font-bold text-slate-400 dark:text-slate-500">
          Stock Management v1.0.0 © 2026. All permissions encrypted.
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
