import { motion } from 'framer-motion';

const EmptyState = ({ icon: Icon, title, description, action, actionLabel }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 px-6"
    >
      {Icon && <Icon className="w-16 h-16 text-slate-300 mb-4" />}
      <h3 className="text-lg font-semibold text-slate-900 mb-2">{title}</h3>
      {description && <p className="text-sm text-slate-500 mb-6 text-center max-w-sm">{description}</p>}
      {action && (
        <button
          onClick={action}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
        >
          {actionLabel || 'Take Action'}
        </button>
      )}
    </motion.div>
  );
};

export default EmptyState;
