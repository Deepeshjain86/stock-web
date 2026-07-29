import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BellIcon, 
  MagnifyingGlassIcon, 
  FunnelIcon, 
  TrashIcon, 
  CheckIcon, 
  ArrowPathIcon,
  Cog8ToothIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  PlusCircleIcon,
  ReceiptPercentIcon,
  CreditCardIcon,
  UserIcon,
  ArrowLeftIcon,
  InformationCircleIcon,
  EyeIcon,
  EnvelopeOpenIcon,
  ShieldExclamationIcon,
  UserGroupIcon,
  TruckIcon
} from '@heroicons/react/24/outline';
import { notificationsAPI, settingsAPI } from '../../services/api';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Modal from '../../components/common/Modal';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { 
  showToast, 
  markNotificationRead, 
  markNotificationUnread, 
  markAllNotificationsRead, 
  deleteNotificationThunk, 
  clearAllNotificationsThunk,
  fetchUnreadCount 
} from '../../store/slices/notificationSlice';

/**
 * Returns the list of module filter options a user is allowed to see based on
 * their role/department. This mirrors the backend RBAC rules so users only
 * encounter filter options that will actually return results.
 */
const getRoleModuleOptions = (role, department) => {
  const isAdmin      = role === 'Admin' || role === 'Super Admin';
  const isPurchMgr   = role === 'Purchase Manager';
  const isSalesMgr   = role === 'Sales Manager';
  const isPurchEmp   = role === 'Purchase Employee' || department === 'Purchase';
  const isSalesEmp   = role === 'Sales Employee' || department === 'Sales';

  const purchaseOptions = [
    { value: 'Inventory', label: 'Inventory & Stock' },
    { value: 'Purchases', label: 'Purchase Orders' },
    { value: 'Supplier',  label: 'Supplier Master' },
  ];
  const salesOptions = [
    { value: 'Sales',    label: 'Sales & POS' },
    { value: 'Customer', label: 'Customer & Udhaar' },
  ];
  const adminOnlyOptions = [
    { value: 'Staff',   label: 'Staff & Users' },
    { value: 'Auth',    label: 'Security & Login' },
    { value: 'Billing', label: 'SaaS Subscriptions' },
  ];

  if (isAdmin) {
    return [...purchaseOptions, ...salesOptions, ...adminOnlyOptions];
  }
  if (isPurchMgr || isPurchEmp) {
    return purchaseOptions;
  }
  if (isSalesMgr || isSalesEmp) {
    return salesOptions;
  }
  // General Employee — show all operational modules
  return [...purchaseOptions, ...salesOptions];
};

const NotificationHistory = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);

  const [notifications, setNotifications] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [moduleFilter, setModuleFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [statusTab, setStatusTab] = useState('all'); // 'all', 'unread', 'read'
  const [page, setPage] = useState(1);
  const [limit] = useState(12);

  // View Details Modal State
  const [selectedNotif, setSelectedNotif] = useState(null);
  
  // Confirmation Dialog States
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, id: null, title: '' });
  const [clearAllConfirm, setClearAllConfirm] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [clearingAll, setClearingAll] = useState(false);

  // Settings configurations for Admin retention policy
  const [archiveDays, setArchiveDays] = useState(30);
  const [savingSettings, setSavingSettings] = useState(false);

  // Compute role-aware module filter options
  const moduleOptions = getRoleModuleOptions(user?.role, user?.department);

  const fetchNotificationsData = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit,
        search,
        module: moduleFilter,
        priority: priorityFilter,
        unreadOnly: statusTab === 'unread' ? 'true' : 'false'
      };
      
      const res = await notificationsAPI.getAll(params);
      if (res && res.success) {
        let list = res.notifications || [];
        let count = res.total || 0;

        if (statusTab === 'read') {
          list = list.filter(n => n.is_read);
          count = list.length;
        }

        setNotifications(list);
        setTotalCount(count);
      }
    } catch (err) {
      console.error('Error fetching notification logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    if (user?.role !== 'Admin') return;
    try {
      const res = await settingsAPI.getAll();
      if (res && res.success && res.settings && res.settings.notification_archive_days) {
        setArchiveDays(parseInt(res.settings.notification_archive_days) || 30);
      }
    } catch (err) {
      console.error('Failed to load notification settings:', err);
    }
  };

  useEffect(() => {
    fetchNotificationsData();
  }, [page, search, moduleFilter, priorityFilter, statusTab]);

  useEffect(() => {
    fetchSettings();
  }, [user?.role]);

  const handleMarkRead = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      await dispatch(markNotificationRead(id)).unwrap();
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      dispatch(showToast({ msg: 'Notification marked as read', type: 'success' }));
    } catch (err) {
      dispatch(showToast({ msg: 'Failed to update notification status', type: 'error' }));
    }
  };

  const handleMarkUnread = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      await dispatch(markNotificationUnread(id)).unwrap();
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: false } : n));
      dispatch(showToast({ msg: 'Notification marked as unread', type: 'success' }));
    } catch (err) {
      dispatch(showToast({ msg: 'Failed to update notification status', type: 'error' }));
    }
  };

  const handleItemClick = (notif) => {
    if (!notif.is_read) {
      handleMarkRead(notif.id);
    }
    setSelectedNotif(notif);
  };

  const handleNavigateToModule = (notif) => {
    const mod = (notif.module || notif.related_module || '').toLowerCase();
    const type = (notif.type || '').toLowerCase();

    if (mod === 'sales' || type.includes('sale')) {
      navigate('/dashboard/sales');
    } else if (mod === 'purchases' || mod === 'purchase' || type.includes('purchase')) {
      navigate('/dashboard/purchase');
    } else if (mod === 'inventory' || mod === 'stock' || type.includes('stock')) {
      navigate('/dashboard/products');
    } else if (mod === 'returns') {
      navigate('/dashboard/stock/returns');
    } else if (mod === 'billing' || mod === 'subscription') {
      navigate('/dashboard/billing');
    } else if (mod === 'supplier' || mod === 'vendor') {
      navigate('/dashboard/vendors');
    } else if (mod === 'customer' || type.includes('customer') || type.includes('borrow')) {
      navigate('/dashboard/customers');
    } else if (mod === 'staff' || mod === 'auth' || mod === 'security') {
      navigate('/dashboard/staff');
    } else {
      navigate('/dashboard');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await dispatch(markAllNotificationsRead()).unwrap();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      dispatch(showToast({ msg: 'All notifications marked as read', type: 'success' }));
    } catch (err) {
      dispatch(showToast({ msg: 'Failed to mark all as read', type: 'error' }));
    }
  };

  const triggerDelete = (notif, e) => {
    if (e) e.stopPropagation();
    setDeleteConfirm({
      open: true,
      id: notif.id,
      title: notif.title
    });
  };

  const confirmDeleteNotification = async () => {
    const targetId = deleteConfirm.id;
    if (!targetId || deletingId) return;

    setDeletingId(targetId);
    try {
      await dispatch(deleteNotificationThunk(targetId)).unwrap();
      setNotifications(prev => prev.filter(n => n.id !== targetId));
      setTotalCount(prev => Math.max(0, prev - 1));
      dispatch(showToast({ msg: 'Notification deleted permanently', type: 'success' }));
      if (selectedNotif?.id === targetId) {
        setSelectedNotif(null);
      }
    } catch (err) {
      dispatch(showToast({ msg: 'Failed to delete notification', type: 'error' }));
    } finally {
      setDeletingId(null);
      setDeleteConfirm({ open: false, id: null, title: '' });
    }
  };

  const triggerClearAll = () => {
    setClearAllConfirm(true);
  };

  const confirmClearAllNotifications = async () => {
    if (clearingAll) return;
    setClearingAll(true);
    try {
      await dispatch(clearAllNotificationsThunk(false)).unwrap();
      setNotifications([]);
      setTotalCount(0);
      dispatch(showToast({ msg: 'All notifications cleared successfully', type: 'success' }));
    } catch (err) {
      dispatch(showToast({ msg: 'Failed to clear notifications', type: 'error' }));
    } finally {
      setClearingAll(false);
      setClearAllConfirm(false);
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const res = await settingsAPI.update({
        notification_archive_days: String(archiveDays)
      });
      if (res && res.success) {
        dispatch(showToast({ msg: 'Retention policy updated successfully', type: 'success' }));
      }
    } catch (err) {
      dispatch(showToast({ msg: 'Failed to update retention configuration', type: 'error' }));
    } finally {
      setSavingSettings(false);
    }
  };

  const timeAgo = (dateStr) => {
    if (!dateStr) return 'Recently';
    const date = new Date(dateStr);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    if (isNaN(seconds) || seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getNotificationConfig = (moduleName, typeName) => {
    const lowerModule = (moduleName || '').toLowerCase();
    const lowerType = (typeName || '').toLowerCase();
    
    if (lowerType === 'out of stock' || lowerType === 'failed login' || lowerType === 'subscription expired') {
      return {
        icon: XCircleIcon,
        iconBg: 'bg-rose-100 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900/50'
      };
    }
    if (lowerType === 'low stock' || lowerType.includes('warning')) {
      return {
        icon: ExclamationTriangleIcon,
        iconBg: 'bg-amber-100 text-amber-800 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/50'
      };
    }
    if (lowerModule === 'sales') {
      return {
        icon: ReceiptPercentIcon,
        iconBg: 'bg-indigo-100 text-indigo-800 border border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-400 dark:border-indigo-900/50'
      };
    }
    if (lowerModule === 'purchases' || lowerModule === 'purchase') {
      return {
        icon: PlusCircleIcon,
        iconBg: 'bg-emerald-100 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/50'
      };
    }
    if (lowerModule === 'supplier' || lowerModule === 'vendor') {
      return {
        icon: TruckIcon,
        iconBg: 'bg-teal-100 text-teal-800 border border-teal-200 dark:bg-teal-950/40 dark:text-teal-400 dark:border-teal-900/50'
      };
    }
    if (lowerModule === 'customer') {
      return {
        icon: UserGroupIcon,
        iconBg: 'bg-cyan-100 text-cyan-800 border border-cyan-200 dark:bg-cyan-950/40 dark:text-cyan-400 dark:border-cyan-900/50'
      };
    }
    if (lowerModule === 'staff' || lowerModule === 'auth' || lowerModule === 'security') {
      return {
        icon: ShieldExclamationIcon,
        iconBg: 'bg-blue-100 text-blue-800 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900/50'
      };
    }
    if (lowerModule === 'returns') {
      return {
        icon: ArrowPathIcon,
        iconBg: 'bg-rose-100 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900/50'
      };
    }
    if (lowerModule === 'billing' || lowerModule === 'subscription') {
      return {
        icon: CreditCardIcon,
        iconBg: 'bg-purple-100 text-purple-800 border border-purple-200 dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-900/50'
      };
    }
    return {
      icon: BellIcon,
      iconBg: 'bg-slate-100 text-slate-800 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
    };
  };

  const totalPages = Math.ceil(totalCount / limit) || 1;

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 select-none font-sans bg-slate-50 dark:bg-slate-950 min-h-screen">
      
      {/* DELETE SINGLE CONFIRMATION DIALOG */}
      <ConfirmDialog
        isOpen={deleteConfirm.open}
        type="danger"
        title="Delete Notification Log"
        message={`Are you sure you want to permanently delete "${deleteConfirm.title}" from the database? This action cannot be undone.`}
        confirmLabel={deletingId ? "Deleting..." : "Delete Permanently"}
        cancelLabel="Cancel"
        onConfirm={confirmDeleteNotification}
        onCancel={() => setDeleteConfirm({ open: false, id: null, title: '' })}
      />

      {/* BULK CLEAR ALL CONFIRMATION DIALOG */}
      <ConfirmDialog
        isOpen={clearAllConfirm}
        type="danger"
        title="Clear All Notifications"
        message="Are you sure you want to permanently delete all notification logs from the database? This action cannot be undone."
        confirmLabel={clearingAll ? "Clearing..." : "Clear All Permanently"}
        cancelLabel="Cancel"
        onConfirm={confirmClearAllNotifications}
        onCancel={() => setClearAllConfirm(false)}
      />

      {/* NOTIFICATION DETAILS MODAL */}
      {selectedNotif && (
        <Modal
          isOpen={Boolean(selectedNotif)}
          onClose={() => setSelectedNotif(null)}
          title="Notification Details"
          size="md"
        >
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
              {(() => {
                const { icon: NotifIcon, iconBg } = getNotificationConfig(selectedNotif.module || selectedNotif.related_module, selectedNotif.type);
                const SafeIcon = NotifIcon || BellIcon;
                return (
                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
                    <SafeIcon className="w-5 h-5" />
                  </div>
                );
              })()}
              <div>
                <h3 className="text-sm font-extrabold text-slate-950 dark:text-white">{selectedNotif.title}</h3>
                <div className="flex items-center gap-2 mt-1 text-[11px] font-semibold text-slate-500">
                  <span>Module: {selectedNotif.module || selectedNotif.related_module || 'General'}</span>
                  <span>•</span>
                  <span>Priority: {selectedNotif.priority || 'Medium'}</span>
                </div>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-extrabold uppercase text-slate-500 tracking-wider block mb-1">Message Content</label>
              <div className="p-3.5 bg-slate-50 dark:bg-slate-900/80 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-800 dark:text-slate-200 leading-relaxed">
                {selectedNotif.message}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Triggered At</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">
                  {selectedNotif.created_at ? new Date(selectedNotif.created_at).toLocaleString('en-IN') : 'N/A'}
                </span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Actor / Performer</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">
                  {selectedNotif.actor_name || selectedNotif.related_user || 'System'}
                </span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Actor Role</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">
                  {selectedNotif.actor_role || 'Staff'}
                </span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Action / Type</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">
                  {selectedNotif.action || selectedNotif.type || 'Activity'}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => handleNavigateToModule(selectedNotif)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <EyeIcon className="w-4 h-4 stroke-[2]" /> View Related Module
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* HEADER WITH ARCHIVE RETENTION CONFIG */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 md:p-6 rounded-2xl shadow-sm">
        <div className="flex items-start gap-3">
          <button
            onClick={() => navigate(-1)}
            className="mt-1 p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl border border-slate-200 dark:border-slate-700 transition-all cursor-pointer shadow-xs"
            title="Go Back"
          >
            <ArrowLeftIcon className="w-5 h-5 stroke-[2.5]" />
          </button>
          <div>
            <h1 className="text-xl md:text-2xl font-black text-slate-950 dark:text-white tracking-tight flex items-center gap-2.5">
              <div className="p-2 bg-indigo-600 rounded-xl text-white shadow-md">
                <BellIcon className="w-6 h-6 stroke-[2]" />
              </div>
              Notification Control Center
            </h1>
            <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold mt-1">
              Operational alerts, security logs, and inventory warnings across your Kirana ERP tenant.
            </p>
          </div>
        </div>

        {/* SETTINGS CARD FOR ADMIN */}
        {user?.role === 'Admin' && (
          <form onSubmit={handleSaveSettings} className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 shadow-xs flex items-center gap-3 self-start md:self-auto">
            <div className="flex items-center gap-2">
              <Cog8ToothIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400 stroke-[2]" />
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block leading-tight">Retention Policy</span>
                <select
                  value={archiveDays}
                  onChange={(e) => setArchiveDays(Number(e.target.value))}
                  className="text-xs font-bold text-slate-900 dark:text-slate-200 bg-transparent focus:outline-none cursor-pointer"
                >
                  <option value={7} className="bg-white dark:bg-slate-900">Auto-delete older than 7 Days</option>
                  <option value={15} className="bg-white dark:bg-slate-900">Auto-delete older than 15 Days</option>
                  <option value={30} className="bg-white dark:bg-slate-900">Auto-delete older than 30 Days</option>
                  <option value={90} className="bg-white dark:bg-slate-900">Auto-delete older than 90 Days</option>
                </select>
              </div>
            </div>
            <button
              type="submit"
              disabled={savingSettings}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-bold shadow-xs cursor-pointer disabled:opacity-50"
            >
              {savingSettings ? 'Saving...' : 'Apply'}
            </button>
          </form>
        )}
      </div>

      {/* SEARCH AND ACTION BAR */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm">
        
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search alerts by title or content..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:border-indigo-500 bg-slate-50/70 dark:bg-slate-950 font-bold text-slate-900 dark:text-slate-200"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2.5 items-center justify-end w-full md:w-auto">
          {/* Module filter — options are role-aware, matching backend RBAC rules */}
          <div className="flex items-center gap-1.5">
            <FunnelIcon className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={moduleFilter}
              onChange={(e) => {
                setModuleFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold bg-slate-50/70 dark:bg-slate-950 text-slate-900 dark:text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="all" className="bg-white dark:bg-slate-900">All Modules</option>
              {moduleOptions.map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-white dark:bg-slate-900">
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Priority filter */}
          <select
            value={priorityFilter}
            onChange={(e) => {
              setPriorityFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold bg-slate-50/70 dark:bg-slate-950 text-slate-900 dark:text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="all" className="bg-white dark:bg-slate-900">All Priorities</option>
            <option value="High" className="bg-white dark:bg-slate-900">🔴 High Priority</option>
            <option value="Medium" className="bg-white dark:bg-slate-900">🟡 Medium Priority</option>
            <option value="Low" className="bg-white dark:bg-slate-900">🟢 Low Priority</option>
          </select>

          {/* Mark All Read */}
          <button
            onClick={handleMarkAllRead}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-all cursor-pointer shadow-xs"
          >
            <CheckIcon className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 stroke-[2.5]" /> Mark all read
          </button>

          {/* Clear All Bulk Delete */}
          <button
            onClick={triggerClearAll}
            disabled={notifications.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-xl hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-all cursor-pointer shadow-xs disabled:opacity-50"
          >
            <TrashIcon className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 stroke-[2]" /> Clear All
          </button>
        </div>
      </div>

      {/* TABS & NOTIFICATIONS INBOX BOARD */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        
        {/* Status Tabs */}
        <div className="flex border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/40 p-2.5 gap-2">
          {['all', 'unread', 'read'].map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setStatusTab(tab);
                setPage(1);
              }}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all capitalize cursor-pointer ${
                statusTab === tab 
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs border border-slate-200 dark:border-slate-700 font-extrabold' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-slate-200'
              }`}
            >
              {tab} Alerts
            </button>
          ))}
        </div>

        {/* Notifications list / Skeleton */}
        {loading ? (
          <div className="p-6 space-y-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="animate-pulse flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800">
                <div className="flex gap-4 items-center">
                  <div className="w-10 h-10 bg-slate-200 dark:bg-slate-800 rounded-xl" />
                  <div className="space-y-2">
                    <div className="w-48 h-3 bg-slate-200 dark:bg-slate-800 rounded" />
                    <div className="w-72 h-3 bg-slate-200 dark:bg-slate-800 rounded" />
                  </div>
                </div>
                <div className="w-20 h-6 bg-slate-200 dark:bg-slate-800 rounded-lg" />
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-20 text-center flex flex-col items-center justify-center gap-2 bg-white dark:bg-slate-900">
            <BellIcon className="w-12 h-12 text-slate-300 dark:text-slate-700 stroke-[1.5]" />
            <h3 className="font-extrabold text-slate-800 dark:text-slate-300 text-sm mt-2">All clear! No notifications found</h3>
            <p className="text-[11px] text-slate-500 font-semibold max-w-xs leading-normal">
              No matching alerts or operations warnings recorded in this selection.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800/80 bg-white dark:bg-slate-900">
            {notifications.map((notif) => {
              const moduleVal = notif.module || notif.related_module || 'General';
              const { icon: NotifIcon, iconBg } = getNotificationConfig(moduleVal, notif.type);
              const SafeIcon = NotifIcon || BellIcon;
              return (
                <div 
                  key={notif.id}
                  onClick={() => handleItemClick(notif)}
                  className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-950/40 ${
                    !notif.is_read ? 'bg-slate-50/90 dark:bg-indigo-950/20' : ''
                  }`}
                >
                  <div className="flex gap-3.5 items-start">
                    {/* Icon wrapper */}
                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 shadow-xs ${iconBg}`}>
                      <SafeIcon className="w-5 h-5" />
                    </div>
                    {/* Content */}
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-xs font-bold text-slate-950 dark:text-white">{notif.title}</h4>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                          notif.priority === 'High' 
                            ? 'bg-rose-100 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900/40' 
                            : notif.priority === 'Medium'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/40'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/40'
                        }`}>
                          {notif.priority || 'Medium'}
                        </span>
                        {moduleVal && (
                          <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                            {moduleVal}
                          </span>
                        )}
                        {!notif.is_read && (
                          <span className="text-[9px] font-extrabold text-white bg-indigo-600 px-1.5 py-0.2 rounded-full leading-normal">
                            New
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-700 dark:text-slate-300 font-medium mt-1 leading-relaxed">
                        {notif.message}
                      </p>
                      <div className="flex flex-wrap items-center gap-3 mt-2 text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                        <span>Triggered: {timeAgo(notif.created_at)}</span>
                        <span>•</span>
                        <span>Actor: {notif.actor_name || notif.related_user || 'System'}{notif.actor_role ? ` (${notif.actor_role})` : ''}</span>
                        {notif.action && (
                          <>
                            <span>•</span>
                            <span>Action: {notif.action}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions buttons */}
                  <div className="flex items-center gap-2 sm:self-center self-end">
                    <button
                      onClick={(e) => { e.stopPropagation(); setSelectedNotif(notif); }}
                      title="View Details"
                      className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 transition-colors cursor-pointer"
                    >
                      <InformationCircleIcon className="w-4 h-4 stroke-[2]" />
                    </button>
                    {!notif.is_read ? (
                      <button
                        onClick={(e) => handleMarkRead(notif.id, e)}
                        title="Mark as read"
                        className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 transition-colors cursor-pointer"
                      >
                        <CheckIcon className="w-4 h-4 stroke-[2.5]" />
                      </button>
                    ) : (
                      <button
                        onClick={(e) => handleMarkUnread(notif.id, e)}
                        title="Mark as unread"
                        className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-amber-950/50 text-amber-600 dark:text-amber-400 transition-colors cursor-pointer"
                      >
                        <EnvelopeOpenIcon className="w-4 h-4 stroke-[2]" />
                      </button>
                    )}
                    <button
                      onClick={(e) => triggerDelete(notif, e)}
                      title="Delete notification log"
                      className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/50 text-rose-600 dark:text-rose-400 transition-colors cursor-pointer"
                    >
                      <TrashIcon className="w-4 h-4 stroke-[2]" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer controls & pagination */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/40 flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
            Total records: {totalCount}
          </span>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3.5 py-1.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg text-xs font-bold text-slate-800 dark:text-slate-200 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              Prev
            </button>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-300">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3.5 py-1.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg text-xs font-bold text-slate-800 dark:text-slate-200 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default NotificationHistory;
