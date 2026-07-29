import { motion } from 'framer-motion';
import { ArrowUpRightIcon, ArrowDownRightIcon, MinusIcon } from '@heroicons/react/24/solid';

const StatsCard = ({
  title,
  value,
  icon: Icon,
  subtext,
  trend,
  trendType = 'neutral', // 'positive' | 'negative' | 'neutral'
  color = 'blue',        // 'blue' | 'green' | 'orange' | 'red' | 'purple'
  loading = false,
  onClick,
}) => {
  
  // Premium ERP Color Theme Mapping for Dynamic Contexts
  const colorThemes = {
    blue: {
      gradient: 'from-indigo-500 to-indigo-600 shadow-indigo-500/20',
      iconText: 'text-white',
      borderHover: 'hover:border-indigo-200 dark:hover:border-indigo-800',
    },
    green: {
      gradient: 'from-emerald-500 to-green-600 shadow-emerald-500/20',
      iconText: 'text-white',
      borderHover: 'hover:border-emerald-200 dark:hover:border-emerald-800',
    },
    orange: {
      gradient: 'from-amber-500 to-orange-600 shadow-amber-500/20',
      iconText: 'text-white',
      borderHover: 'hover:border-amber-200 dark:hover:border-amber-800',
    },
    red: {
      gradient: 'from-rose-500 to-red-600 shadow-rose-500/20',
      iconText: 'text-white',
      borderHover: 'hover:border-red-200 dark:hover:border-red-800',
    },
    purple: {
      gradient: 'from-purple-500 to-indigo-700 shadow-purple-500/20',
      iconText: 'text-white',
      borderHover: 'hover:border-purple-200 dark:hover:border-purple-800',
    },
  };

  const selectedTheme = colorThemes[color] || colorThemes.blue;

  // Render Skeleton Loader state when data is fetching
  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex items-center justify-between animate-pulse w-full">
        <div className="space-y-3 flex-1">
          <div className="h-3.5 bg-slate-200 dark:bg-slate-800 rounded-md w-1/2" />
          <div className="h-7 bg-slate-200 dark:bg-slate-800 rounded-md w-3/4" />
          <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded-md w-2/3" />
        </div>
        <div className="h-12 w-12 rounded-full bg-slate-200 dark:bg-slate-800 ml-4 flex-shrink-0" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.25, 1, 0.5, 1] }}
      whileHover={{ y: -4, scale: 1.015 }}
      onClick={onClick}
      className={`bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm dark:shadow-slate-950/50 select-none transition-all duration-300 w-full relative overflow-hidden flex items-center justify-between group ${
        onClick ? 'cursor-pointer' : ''
      } ${selectedTheme.borderHover} hover:shadow-xl hover:shadow-slate-100/80 dark:hover:shadow-slate-950/80`}
    >
      {/* LEFT SIDE: Core Text Content & Performance Trend Matrix */}
      <div className="flex-1 min-w-0 pr-2">
        <p className="text-slate-500 dark:text-slate-400 text-[11px] font-black tracking-wider uppercase leading-tight">
          {title}
        </p>
        <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white mt-1 tracking-tight tabular-nums break-words">
          {value}
        </h3>
        
        {/* Dynamic Multi-Variant ERP Trend Flag Indicator */}
        {(trend || subtext) && (
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
            {trend && (
              <span
                className={`flex items-center gap-0.5 px-2 py-0.5 font-bold rounded-lg border tabular-nums ${
                  trendType === 'positive'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                    : trendType === 'negative'
                    ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800'
                    : 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                }`}
              >
                {trendType === 'positive' && <ArrowUpRightIcon className="w-3 h-3 stroke-[3]" />}
                {trendType === 'negative' && <ArrowDownRightIcon className="w-3 h-3 stroke-[3]" />}
                {trendType === 'neutral' && <MinusIcon className="w-3 h-3 stroke-[3]" />}
                {trend}
              </span>
            )}
            {subtext && (
              <span className="text-slate-500 dark:text-slate-400 font-semibold truncate text-[11px]">
                {subtext}
              </span>
            )}
          </div>
        )}
      </div>

      {/* RIGHT SIDE: Circular Visual Anchor with Dynamic Premium Gradients */}
      {Icon && (
        <div
          className={`h-12 w-12 rounded-full bg-gradient-to-br flex items-center justify-center shadow-md flex-shrink-0 ml-4 transform transition-all duration-300 group-hover:scale-110 group-hover:rotate-12 ${selectedTheme.gradient}`}
        >
          <Icon className={`w-6 h-6 ${selectedTheme.iconText}`} />
        </div>
      )}
    </motion.div>
  );
};

export default StatsCard;