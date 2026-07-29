import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { EnvelopeIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import { authAPI } from '../../services/api';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [simulatedToken, setSimulatedToken] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setError('');

    try {
      const data = await authAPI.forgotPassword({ email });
      if (data.success) {
        setSuccess(true);
        // Store the token from response for simulation convenience
        setSimulatedToken(data.resetToken);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Email address not found');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-gradient-to-tr from-slate-900 via-indigo-950 to-slate-900 p-4 font-sans select-none overflow-hidden relative text-white">
      <div className="absolute top-1/4 left-1/4 h-[300px] w-[300px] bg-indigo-500/10 rounded-full blur-[100px] animate-pulse" />
      
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-[460px] bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl relative z-10"
      >
        <div className="mb-6">
          <Link to="/login" className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition-colors">
            <ArrowLeftIcon className="w-4 h-4" />
            Back to Login
          </Link>
        </div>

        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold tracking-tight">Recover Password</h2>
          <p className="text-sm font-medium text-slate-400 mt-2">
            Enter your email to request database credentials reset
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/15 border border-red-500/30 text-red-200 text-xs font-semibold rounded-2xl">
            ❌ {error}
          </div>
        )}

        {success ? (
          <div className="space-y-6">
            <div className="p-4 bg-emerald-500/15 border border-emerald-500/30 text-emerald-200 text-xs font-semibold rounded-2xl space-y-2">
              <p>✓ Reset token generated successfully in database!</p>
              <p className="text-[10px] text-slate-400">In production, this email resets security tokens. For simulation, use this temporary code below.</p>
            </div>

            <div className="bg-white/5 border border-white/10 p-4 rounded-2xl">
              <p className="text-xs text-slate-400 font-medium">Temporary Code (JWT):</p>
              <p className="text-[10px] font-mono break-all text-indigo-300 mt-1 select-text bg-black/20 p-2 rounded-lg">{simulatedToken}</p>
            </div>

            <button
              onClick={() => navigate('/reset-password', { state: { token: simulatedToken } })}
              className="w-full py-3 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white rounded-2xl text-sm font-bold shadow-lg shadow-indigo-500/20 active:scale-[0.99] transition-all"
            >
              Go to Password Reset Screen
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                Registrated Email
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <EnvelopeIcon className="w-5 h-5 text-slate-500" />
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@kiranamart.com"
                  className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder-slate-600 font-medium text-white"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white rounded-2xl text-sm font-bold shadow-lg shadow-indigo-500/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2"
            >
              {loading ? 'Generating Code...' : 'Request Reset Code'}
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
};

export default ForgotPassword;
