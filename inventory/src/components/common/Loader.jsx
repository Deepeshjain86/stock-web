import { motion } from 'framer-motion';

const Loader = ({ size = 'md', fullScreen = false }) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  };

  const loader = (
    <motion.div
      className={`${sizeClasses[size]} rounded-full border-4 border-slate-200 border-t-primary-600`}
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
    />
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white bg-opacity-80 z-50">
        {loader}
      </div>
    );
  }

  return <div className="flex justify-center items-center py-8">{loader}</div>;
};

export default Loader;
