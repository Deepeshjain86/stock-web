import React from 'react';
import { motion } from 'framer-motion';
import { SunIcon, MoonIcon } from '@heroicons/react/24/solid';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { toggleTheme } from '../../store/slices/themeSlice';

const ThemeToggle = ({ className = '' }) => {
  const dispatch = useAppDispatch();
  const { isDarkMode } = useAppSelector((state) => state.theme);

  const handleToggle = (e) => {
    e.stopPropagation();
    dispatch(toggleTheme());
  };

  return (
    <motion.button
      type="button"
      onClick={handleToggle}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`relative inline-flex items-center h-8 w-[62px] p-1 rounded-full cursor-pointer transition-colors duration-300 select-none shadow-sm ${
        isDarkMode
          ? 'bg-slate-900 border border-slate-700/80 shadow-slate-950/60'
          : 'bg-slate-200/90 border border-slate-300/80 shadow-inner'
      } ${className}`}
      title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      aria-label="Toggle Theme"
    >
      {/* Sliding Glow Thumb */}
      <motion.div
        className={`absolute top-[3px] w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 shadow-md ${
          isDarkMode
            ? 'bg-gradient-to-tr from-indigo-600 to-violet-500 border border-indigo-400/40 shadow-[0_0_10px_rgba(99,102,241,0.5)]'
            : 'bg-white border border-slate-200 shadow-[0_2px_5px_rgba(0,0,0,0.12)]'
        }`}
        animate={{
          x: isDarkMode ? 31 : 2,
        }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      >
        {isDarkMode ? (
          <MoonIcon className="w-3.5 h-3.5 text-indigo-100 drop-shadow-sm" />
        ) : (
          <SunIcon className="w-3.5 h-3.5 text-amber-500 drop-shadow-sm" />
        )}
      </motion.div>

      {/* Sun Icon Track Side */}
      <div className="w-6 h-6 flex items-center justify-center ml-0.5 pointer-events-none">
        <SunIcon
          className={`w-3.5 h-3.5 transition-all duration-200 ${
            !isDarkMode ? 'opacity-0 scale-75' : 'text-slate-500 opacity-60'
          }`}
        />
      </div>

      {/* Moon Icon Track Side */}
      <div className="w-6 h-6 flex items-center justify-center ml-auto mr-0.5 pointer-events-none">
        <MoonIcon
          className={`w-3.5 h-3.5 transition-all duration-200 ${
            isDarkMode ? 'opacity-0 scale-75' : 'text-slate-400 opacity-60'
          }`}
        />
      </div>
    </motion.button>
  );
};

export default ThemeToggle;
