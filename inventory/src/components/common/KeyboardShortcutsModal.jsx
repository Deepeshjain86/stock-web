import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CommandLineIcon, 
  XMarkIcon, 
  SparklesIcon, 
  ShoppingBagIcon, 
  ArrowPathIcon, 
  MagnifyingGlassIcon, 
  UserGroupIcon, 
  ReceiptPercentIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

const shortcutsList = [
  {
    category: '🚀 Quick Navigation & Modules',
    shortcuts: [
      { key: 'F2 / Alt + N', desc: 'Open POS Sales & New Billing', icon: ShoppingBagIcon, color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950 dark:text-indigo-400' },
      { key: 'F3 / Alt + R', desc: 'Open Sales Return Management', icon: ArrowPathIcon, color: 'text-rose-600 bg-rose-50 dark:bg-rose-950 dark:text-rose-400' },
      { key: 'F4 / Alt + S', desc: 'Open Stock & Products Catalog', icon: MagnifyingGlassIcon, color: 'text-amber-600 bg-amber-50 dark:bg-amber-950 dark:text-amber-400' },
      { key: 'F6 / Alt + B', desc: 'Open Borrow & Udhaar Ledger', icon: UserGroupIcon, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950 dark:text-emerald-400' },
      { key: 'F7 / Alt + P', desc: 'Open Purchase Orders & Stock In', icon: ReceiptPercentIcon, color: 'text-purple-600 bg-purple-50 dark:bg-purple-950 dark:text-purple-400' },
    ]
  },
  {
    category: '🛒 POS Billing & Checkout Actions',
    shortcuts: [
      { key: 'F8', desc: 'Focus Customer Search / Selection Input', icon: UserGroupIcon, color: 'text-blue-600 bg-blue-50 dark:bg-blue-950 dark:text-blue-400' },
      { key: 'F9 / Ctrl + Enter', desc: 'Complete Invoice & Print Receipt', icon: CheckCircleIcon, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950 dark:text-emerald-400' },
      { key: 'Esc', desc: 'Close Active Modal / Reset Search', icon: XMarkIcon, color: 'text-slate-600 bg-slate-100 dark:bg-slate-800 dark:text-slate-300' },
      { key: 'Shift + ? / Alt + K', desc: 'Open / Close Shortcuts Help Guide', icon: CommandLineIcon, color: 'text-sky-600 bg-sky-50 dark:bg-sky-950 dark:text-sky-400' }
    ]
  }
];

const KeyboardShortcutsModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div 
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 select-none"
      >
        <motion.div 
          initial={{ scale: 0.95, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 15 }}
          transition={{ type: "spring", duration: 0.3 }}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
        >
          {/* MODAL HEADER */}
          <div className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 p-6 text-white flex items-center justify-between relative overflow-hidden">
            <div className="absolute right-0 top-0 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
            <div className="flex items-center gap-3.5 z-10">
              <div className="p-3 bg-white/15 backdrop-blur-md rounded-2xl border border-white/20">
                <CommandLineIcon className="w-6 h-6 text-white stroke-[2.5]" />
              </div>
              <div>
                <h3 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
                  Keyboard Shortcuts Guide
                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 uppercase font-black tracking-wider">
                    Super Fast Mode
                  </span>
                </h3>
                <p className="text-xs text-indigo-100 font-medium">Use hotkeys to complete billing & store tasks instantly without clicking</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-xl transition-all cursor-pointer z-10"
            >
              <XMarkIcon className="w-5 h-5 stroke-[2.5]" />
            </button>
          </div>

          {/* MODAL BODY */}
          <div className="p-6 overflow-y-auto space-y-6 flex-1">
            {shortcutsList.map((sec) => (
              <div key={sec.category} className="space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800/80 pb-2">
                  {sec.category}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {sec.shortcuts.map((sc) => {
                    const Icon = sc.icon;
                    return (
                      <div 
                        key={sc.key}
                        className="flex items-center justify-between p-3.5 bg-slate-50/80 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700/50 rounded-2xl transition-all"
                      >
                        <div className="flex items-center gap-3 min-w-0 pr-2">
                          <div className={`p-2 rounded-xl ${sc.color} flex-shrink-0`}>
                            <Icon className="w-4 h-4 stroke-[2]" />
                          </div>
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate">
                            {sc.desc}
                          </span>
                        </div>
                        <kbd className="px-2.5 py-1 bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 font-mono text-[11px] font-black rounded-lg border border-slate-200 dark:border-slate-700 shadow-xs flex-shrink-0">
                          {sc.key}
                        </kbd>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* MODAL FOOTER */}
          <div className="bg-slate-50 dark:bg-slate-950 px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
              <SparklesIcon className="w-4 h-4 text-amber-500" /> Tip: Press <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 font-mono text-[10px] font-bold">Shift + ?</kbd> anywhere to open this guide.
            </span>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-md shadow-indigo-500/20 cursor-pointer active:scale-95 transition-all"
            >
              Got It
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default KeyboardShortcutsModal;
