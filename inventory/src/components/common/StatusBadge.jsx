const StatusBadge = ({ status, label }) => {
  const statusConfig = {
    active: {
      bg: 'bg-success-100',
      text: 'text-success-700',
      border: 'border-success-300',
    },
    inactive: {
      bg: 'bg-slate-100',
      text: 'text-slate-700',
      border: 'border-slate-300',
    },
    pending: {
      bg: 'bg-warning-100',
      text: 'text-warning-700',
      border: 'border-warning-300',
    },
    completed: {
      bg: 'bg-success-100',
      text: 'text-success-700',
      border: 'border-success-300',
    },
    'low-stock': {
      bg: 'bg-warning-100',
      text: 'text-warning-700',
      border: 'border-warning-300',
    },
    'out-of-stock': {
      bg: 'bg-danger-100',
      text: 'text-danger-700',
      border: 'border-danger-300',
    },
    'in-transit': {
      bg: 'bg-primary-100',
      text: 'text-primary-700',
      border: 'border-primary-300',
    },
    delivered: {
      bg: 'bg-success-100',
      text: 'text-success-700',
      border: 'border-success-300',
    },
    paid: {
      bg: 'bg-success-100',
      text: 'text-success-700',
      border: 'border-success-300',
    },
  };

  const config = statusConfig[status] || statusConfig.inactive;

  return (
    <span
      className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${config.bg} ${config.text} ${config.border}`}
    >
      {label || status}
    </span>
  );
};

export default StatusBadge;
