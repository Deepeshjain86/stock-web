import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

const ConfirmDialog = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  onClose,
  type = 'warning',
}) => {
  const handleCancel = onCancel || onClose || (() => {});

  const typeConfig = {
    warning: {
      icon: ExclamationTriangleIcon,
      iconColor: 'text-amber-600 dark:text-amber-400',
      buttonColor: 'bg-amber-600 hover:bg-amber-700 dark:bg-amber-600 dark:hover:bg-emerald-500 text-white font-bold',
    },
    danger: {
      icon: ExclamationTriangleIcon,
      iconColor: 'text-rose-600 dark:text-rose-400',
      buttonColor: 'bg-rose-600 hover:bg-rose-700 dark:bg-rose-600 dark:hover:bg-rose-500 text-white font-bold',
    },
    info: {
      icon: ExclamationTriangleIcon,
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      buttonColor: 'bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-bold',
    },
  };

  const config = typeConfig[type] || typeConfig.warning;
  const Icon = config.icon;

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleCancel();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, handleCancel]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleCancel}
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-[10000]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                handleCancel();
              }
            }}
            className="fixed inset-0 z-[10001] flex items-center justify-center p-4"
          >
            <div className="max-w-sm w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden">
              <div className="p-6">
                <div className="flex items-center justify-center mb-4">
                  <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    <Icon className={`w-6 h-6 ${config.iconColor}`} />
                  </div>
                </div>

                <h3 className="text-base font-black text-center text-slate-900 dark:text-white tracking-tight mb-2">
                  {title}
                </h3>
                <p className="text-xs font-semibold text-center text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
                  {message}
                </p>

                <div className="flex gap-2.5 justify-end">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="flex-1 px-4 py-2.5 border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all cursor-pointer"
                  >
                    {cancelLabel}
                  </button>
                  <button
                    type="button"
                    onClick={onConfirm}
                    className={`flex-1 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer ${config.buttonColor}`}
                  >
                    {confirmLabel}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default ConfirmDialog;
