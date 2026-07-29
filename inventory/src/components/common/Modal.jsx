import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon } from '@heroicons/react/24/outline';

const Modal = ({ isOpen = true, onClose, title, children, size = 'md', showCloseButton = true, noPadding = false }) => {
  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-3xl',
    '2xl': 'max-w-4xl',
    '3xl': 'max-w-5xl',
    '4xl': 'max-w-6xl',
    '5xl': 'max-w-[92vw]',
    '6xl': 'max-w-[94vw]',
    '7xl': 'max-w-[96vw]',
    'full': 'max-w-[98vw] h-[95vh]',
  };

  useEffect(() => {
    if (!isOpen) return;

    // Lock page background body scrolling
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalStyle;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] overflow-hidden flex items-center justify-center p-4 sm:p-6">
          {/* 1. Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />

          {/* 2. Modal Wrapper Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', duration: 0.3 }}
            className={`relative w-full ${sizeClasses[size] || 'max-w-md'} bg-white dark:bg-slate-900 rounded-3xl shadow-2xl flex flex-col max-h-[85vh] sm:max-h-[90vh] overflow-hidden border border-slate-200 dark:border-slate-800`}
          >
            {/* FIXED HEADER */}
            <div className="flex-shrink-0 flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-white tracking-tight">
                {title}
              </h2>
              {showCloseButton && (
                <button
                  onClick={onClose}
                  className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all active:scale-95 text-slate-500 hover:text-slate-800 dark:hover:text-slate-250 cursor-pointer"
                >
                  <XMarkIcon className="w-5 h-5 stroke-[2.5]" />
                </button>
              )}
            </div>

            {/* SCROLLABLE INDEPENDENT BODY (or full-height noPadding mode) */}
            {noPadding ? (
              <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
                {children}
              </div>
            ) : (
              <div className="flex-grow overflow-y-auto min-h-0 bg-white dark:bg-slate-900">
                {children}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default Modal;
