import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ShieldExclamationIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

const AccessDenied = () => {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-center min-h-[75vh] px-4 py-12 select-none">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 text-center shadow-xl dark:shadow-2xl relative overflow-hidden"
      >
        {/* Decorative background grid and gradients */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-rose-500 via-amber-500 to-rose-500" />
        <div className="absolute -top-16 -left-16 w-32 h-32 bg-rose-500/10 dark:bg-rose-500/5 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-16 -right-16 w-32 h-32 bg-emerald-500/10 dark:bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />

        {/* Shield Icon with glowing ring animation */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-rose-500/20 dark:bg-rose-500/10 animate-ping" style={{ animationDuration: '3s' }} />
            <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-rose-50 dark:bg-rose-950/20 text-rose-500 border border-rose-100 dark:border-rose-900/50 shadow-md">
              <ShieldExclamationIcon className="w-10 h-10 stroke-[1.8]" />
            </div>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-2">
          Access Denied
        </h1>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">
          Error Code: 403 Forbidden
        </p>

        {/* Informative message */}
        <p className="text-xs font-semibold text-slate-550 dark:text-slate-400 leading-relaxed mb-8 px-2">
          Your account does not possess the custom rights or permissions required to view this module. 
          Please contact your administrator or store owner to update your permission set.
        </p>

        {/* Action Button */}
        <div className="flex flex-col gap-2">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all active:scale-[0.99] shadow-lg shadow-emerald-600/20 cursor-pointer"
          >
            <ArrowLeftIcon className="w-4 h-4 stroke-[2.5]" />
            Return to Dashboard
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default AccessDenied;
