import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  BellIcon,
  Bars3Icon,
  ChevronDownIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  PlusCircleIcon,
  ReceiptPercentIcon,
  CreditCardIcon,
  ClockIcon,
  UserIcon,
  ArrowLeftOnRectangleIcon,
  SunIcon,
  MoonIcon,
  ArrowPathIcon,
  XMarkIcon,
  ShieldCheckIcon,
  EnvelopeIcon,
  PhoneIcon,
  BuildingOfficeIcon,
  IdentificationIcon,
  CalendarDaysIcon,
  LockClosedIcon,
  CheckCircleIcon,
  PencilSquareIcon,
  PhotoIcon,
  CommandLineIcon
} from '@heroicons/react/24/outline';
import SearchBar from '../common/SearchBar';
import ThemeToggle from '../common/ThemeToggle';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { logoutUser } from '../../store/slices/authSlice';
import { toggleTheme } from '../../store/slices/themeSlice';
import { toggleSidebar } from '../../store/slices/sidebarSlice';
import { 
  fetchNotifications as fetchNotificationsThunk, 
  markNotificationRead, 
  markAllNotificationsRead 
} from '../../store/slices/notificationSlice';
import { notificationsAPI, authAPI } from '../../services/api';
import Modal from '../common/Modal';
import { useStoreLogo, getLogoUrl } from '../../utils/logoHelper';
// ──────────────────────────────────────────────
const ProfileModal = ({ onClose }) => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [form, setForm] = useState({
    name: '',
  });

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const displayData = profile || user;

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await authAPI.getProfile();
        if (res.success) {
          setProfile(res.user);
          setForm({
            name: res.user.name || '',
          });
        }
      } catch (err) {
        setProfile(user);
        setForm({ name: user?.name || '' });
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      showToast('Name is required.', 'error');
      return;
    }
    setSaving(true);
    try {
      const payload = { 
        name: form.name, 
      };
      const res = await authAPI.updateProfile(payload);
      if (res.success) {
        setProfile(prev => ({ 
          ...prev, 
          name: form.name, 
        }));
        showToast('Profile updated successfully.');
        setEditMode(false);
      } else {
        showToast(res.message || 'Update failed.', 'error');
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Update failed.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleTriggerForgot = async () => {
    const email = displayData?.email;
    if (!email) return;
    try {
      const res = await authAPI.forgotPassword({ email });
      if (res.success) {
        showToast('Password reset link sent to email!', 'success');
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Password reset request failed', 'error');
    }
  };

  const getRoleBadgeColor = (role) => {
    const map = {
      'Super Admin': 'bg-violet-50 text-violet-700 border-violet-250 dark:bg-violet-500/10 dark:text-violet-400 dark:border-violet-500/20',
      'Admin': 'bg-indigo-50 text-indigo-750 border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20',
      'Sales Manager': 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20',
      'Purchase Manager': 'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-500/10 dark:text-cyan-400 dark:border-cyan-500/20',
      'Employee': 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20',
    };
    return map[role] || 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700';
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="User Profile"
      size="sm"
    >
      <div className="relative p-5 space-y-4">
        {/* Toast Notification inside modal */}
        {toast && (
          <div className={`absolute top-2 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black tracking-wide shadow-xl border ${
            toast.type === 'error' 
              ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/20 dark:text-rose-450 dark:border-rose-500/20' 
              : 'bg-emerald-50 text-emerald-707 border-emerald-250 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-500/20'
          }`}>
            {toast.type === 'error' ? <XCircleIcon className="w-3.5 h-3.5 text-rose-500" /> : <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-500" />}
            {toast.msg}
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-2">
            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Loading details...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Centered Avatar and Role */}
            <div className="flex flex-col items-center text-center space-y-2">
              <div className="relative">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-white flex items-center justify-center font-black text-xl uppercase shadow-md select-none">
                  {(displayData?.name || displayData?.email || 'U').charAt(0)}
                </div>
                <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
              </div>
              <div>
                <h3 className="text-xs font-black text-slate-900 dark:text-white leading-none">{displayData?.name || 'User'}</h3>
                <span className={`inline-block mt-1 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${getRoleBadgeColor(displayData?.role)}`}>
                  {displayData?.role || 'Staff'}
                </span>
              </div>
            </div>

            {/* Fields Container */}
            <div className="space-y-3 pt-2">
              {/* Employee/Admin ID field */}
              <div>
                <label className="block text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">Employee ID</label>
                <div className="px-3 py-2 text-xs border border-slate-100 dark:border-slate-800/60 rounded-xl bg-slate-50/50 dark:bg-slate-950/20 text-slate-500 dark:text-slate-400 font-bold font-mono">
                  {displayData?.id ? `#${displayData.id}` : '—'}
                </div>
              </div>

              {/* Email field (Read-only) */}
              <div>
                <label className="block text-[9px] font-black text-slate-400 dark:text-slate-550 uppercase tracking-widest mb-1.5">Email Address</label>
                <div className="px-3 py-2 text-xs border border-slate-100 dark:border-slate-800/60 rounded-xl bg-slate-50/50 dark:bg-slate-950/20 text-slate-505 dark:text-slate-400 font-semibold truncate">
                  {displayData?.email || '—'}
                </div>
              </div>

              {/* Name field (Editable) */}
              <div>
                <label className="block text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">Full Name</label>
                {editMode ? (
                  <form onSubmit={handleSave} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={form.name}
                      onChange={e => setForm({ name: e.target.value })}
                      className="flex-1 px-3 py-2 text-xs border border-indigo-200 dark:border-indigo-800 rounded-xl focus:outline-none focus:border-indigo-500 bg-white dark:bg-slate-900 text-slate-800 dark:text-white font-bold"
                      placeholder="Enter Full Name"
                      required
                      autoFocus
                    />
                    <button 
                      type="submit" 
                      disabled={saving}
                      className="px-3 py-2 bg-indigo-650 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-bold shadow disabled:opacity-50"
                    >
                      {saving ? 'Saving...' : 'Save'}
                    </button>
                  </form>
                ) : (
                  <div className="flex items-center justify-between px-3 py-2 text-xs border border-slate-100 dark:border-slate-800/60 rounded-xl bg-slate-50/50 dark:bg-slate-950/20 text-slate-800 dark:text-white font-bold">
                    <span>{displayData?.name || '—'}</span>
                    <button 
                      onClick={() => setEditMode(true)}
                      className="text-[10px] text-indigo-600 hover:text-indigo-705 font-black uppercase tracking-wider"
                    >
                      Edit
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Forgot Password Security button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleTriggerForgot}
                className="w-full py-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-950/25 dark:hover:bg-slate-950/50 border border-slate-200 dark:border-slate-800 text-[10px] font-black text-slate-700 dark:text-slate-350 uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5"
              >
                <LockClosedIcon className="w-3.5 h-3.5 text-indigo-500" />
                Forgot Password / Reset
              </button>
            </div>
            
            {/* Modal Actions */}
            <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800/60">
              <button 
                type="button"
                onClick={onClose} 
                className="px-4 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-750 transition-all cursor-pointer shadow-sm"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

/* ──────────────────────────────────────────────
   MAIN HEADER COMPONENT
   ────────────────────────────────────────────── */
const Header = ({ onOpenShortcuts }) => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const [headerLogo] = useStoreLogo(user);
  const resolvedHeaderLogo = getLogoUrl(headerLogo);
  const { theme, isDarkMode } = useAppSelector((state) => state.theme);
  const navigate = useNavigate();
  const location = useLocation();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [greeting, setGreeting] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());

  const profileMenuRef = useRef(null);
  const notificationsRef = useRef(null);

  const { notifications = [], unreadCount = 0 } = useAppSelector((state) => state.notifications);

  useEffect(() => {
    dispatch(fetchNotificationsThunk({ limit: 50 }));
    const interval = setInterval(() => {
      dispatch(fetchNotificationsThunk({ limit: 50 }));
    }, 15000);
    return () => clearInterval(interval);
  }, [dispatch]);

  const handleMarkRead = (id) => {
    dispatch(markNotificationRead(id));
  };

  const handleClearAll = () => {
    dispatch(markAllNotificationsRead());
  };

  const timeAgo = (dateStr) => {
    const seconds = Math.floor((new Date() - new Date(dateStr)) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  const getNotificationConfig = (module, type) => {
    const lt = (type || '').toLowerCase();
    const lm = (module || '').toLowerCase();
    if (lt === 'out of stock' || lt === 'failed login') return { icon: XCircleIcon, iconBg: 'bg-red-50 text-red-600 border border-red-200' };
    if (lt === 'low stock') return { icon: ExclamationTriangleIcon, iconBg: 'bg-amber-50 text-amber-600 border border-amber-200' };
    if (lm === 'sales') return { icon: ReceiptPercentIcon, iconBg: 'bg-indigo-50 text-indigo-600 border border-indigo-200' };
    if (lm === 'purchases') return { icon: PlusCircleIcon, iconBg: 'bg-emerald-50 text-emerald-600 border border-emerald-200' };
    if (lm === 'billing') return { icon: CreditCardIcon, iconBg: 'bg-purple-50 text-purple-600 border border-purple-200' };
    if (lm === 'auth') return { icon: UserIcon, iconBg: 'bg-blue-50 text-blue-600 border border-blue-200' };
    return { icon: BellIcon, iconBg: 'bg-slate-50 text-slate-600 border border-slate-200' };
  };

  const handleNotificationClick = (notif) => {
    handleMarkRead(notif.id);
    setShowNotifications(false);
    
    const mod = (notif.related_module || '').toLowerCase();
    const type = (notif.type || '').toLowerCase();
    
    if (mod === 'sales' || type.includes('sale')) {
      navigate('/dashboard/sales');
    } else if (mod === 'purchases' || type.includes('purchase')) {
      navigate('/dashboard/purchase');
    } else if (mod === 'inventory' || mod === 'stock' || type.includes('stock')) {
      navigate('/dashboard/products');
    } else if (mod === 'billing') {
      navigate('/dashboard/billing');
    } else if (mod === 'auth') {
      navigate('/dashboard/staff');
    } else {
      navigate('/dashboard/notifications');
    }
  };
  const monitoredTenantStr = localStorage.getItem('monitoredTenant');
  const monitoredTenant = monitoredTenantStr ? JSON.parse(monitoredTenantStr) : null;

  const handleExitMonitor = () => {
    localStorage.removeItem('monitoredTenant');
    navigate('/superadmin');
  };

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setCurrentTime(now);
      const h = now.getHours();
      setGreeting(h < 12 ? 'Good Morning' : h < 17 ? 'Good Afternoon' : 'Good Evening');
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    setShowProfileMenu(false);
    setShowNotifications(false);
  }, [location]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showProfileMenu && profileMenuRef.current && !profileMenuRef.current.contains(e.target)) setShowProfileMenu(false);
      if (showNotifications && notificationsRef.current && !notificationsRef.current.contains(e.target)) setShowNotifications(false);
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') { setShowProfileMenu(false); setShowNotifications(false); }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => { document.removeEventListener('mousedown', handleClickOutside); document.removeEventListener('keydown', handleKeyDown); };
  }, [showProfileMenu, showNotifications]);

  const dateStr = currentTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  const timeStr = currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });

  return (
    <>
      {/* Profile Modal Portal */}
      {showProfileModal && <ProfileModal onClose={() => setShowProfileModal(false)} />}

      <div className="w-full flex flex-col sticky top-0 z-30">
        {/* Monitoring mode banner */}
        {monitoredTenant && (
          <div className="bg-gradient-to-r from-amber-500 to-orange-600 text-slate-950 font-bold px-4 py-2.5 text-xs flex flex-col sm:flex-row gap-2 items-center justify-between shadow-md">
            <div className="flex items-center gap-2">
              <span className="text-sm">⚠️</span>
              <span><strong>MONITORING MODE:</strong> You are viewing <strong>{monitoredTenant.name}</strong> ERP in real-time read-only mode.</span>
            </div>
            <button onClick={handleExitMonitor} className="px-3.5 py-1 bg-slate-950 hover:bg-slate-900 text-white rounded-lg text-[11px] font-bold shadow active:scale-95">
              Exit Monitoring Panel
            </button>
          </div>
        )}

        <header className="bg-white border-b border-slate-200/80 dark:bg-slate-900 dark:border-slate-800 shadow-sm h-[75px] flex items-center transition-all">
          <div className="flex items-center justify-between w-full px-4 sm:px-6">

            {/* LEFT */}
            <div className="flex items-center gap-3 md:gap-4 flex-shrink-0">
              <button onClick={() => dispatch(toggleSidebar())} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 text-slate-700 dark:text-slate-300 rounded-xl md:hidden transition-all border border-slate-200/60 dark:border-slate-800">
                <Bars3Icon className="w-6 h-6" />
              </button>
              <div className="hidden sm:block">
                <h1 className="text-base md:text-lg font-extrabold text-slate-900 dark:text-white tracking-tight leading-none">
                  {greeting}, <span className="text-indigo-600 dark:text-indigo-400">{user?.name?.split(' ')[0] || 'User'}</span>
                </h1>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">Manage your Stock Management Inventory</p>
              </div>
            </div>



            {/* RIGHT */}
            <div className="flex items-center gap-3 sm:gap-4 ml-auto flex-shrink-0">

              {/* Clock */}
              <div className="hidden lg:flex flex-col items-end pr-2 border-r border-slate-200/80">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                  <ClockIcon className="w-3.5 h-3.5 text-indigo-500" />
                  <span className="tabular-nums uppercase">{timeStr}</span>
                </div>
                <span className="text-[11px] font-medium text-slate-400 mt-0.5">{dateStr}</span>
              </div>

              {/* Subscription Plan Status Badge */}
              {user?.role !== 'Super Admin' && (
                <button
                  onClick={() => navigate('/dashboard/billing')}
                  title="Manage Store Subscription Plan"
                  className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all border shadow-2xs cursor-pointer active:scale-95 ${
                    user?.subscription_status === 'Expired'
                      ? 'bg-rose-50 hover:bg-rose-100 border-rose-200 text-rose-700 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-300 animate-pulse'
                      : 'bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-700 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300'
                  }`}
                >
                  <CreditCardIcon className="w-4 h-4 stroke-[2.5]" />
                  <span>{user?.subscription_status === 'Expired' ? 'Expired — Upgrade Plan' : 'Subscription Plan'}</span>
                </button>
              )}

              {/* Keyboard Shortcuts Trigger */}
              <button
                onClick={onOpenShortcuts}
                title="Keyboard Shortcuts (F1, Alt + K, Shift + ?)"
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-indigo-50 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-white rounded-xl text-xs font-bold transition-all border border-slate-200/80 dark:border-slate-700 shadow-2xs cursor-pointer active:scale-95"
              >
                <CommandLineIcon className="w-4 h-4 text-indigo-600 dark:text-indigo-400 stroke-[2.5]" />
                <span className="font-mono text-[10px] bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 font-black">Shortcut Key</span>
              </button>

              {/* Theme Toggle */}
              <ThemeToggle />

              {/* Notifications */}
              <div className="relative" ref={notificationsRef}>
                <button
                  onClick={() => {
                    const nextShow = !showNotifications;
                    setShowNotifications(nextShow);
                    setShowProfileMenu(false);
                    if (nextShow) {
                      dispatch(fetchNotificationsThunk({ limit: 50 }));
                    }
                  }}
                  className={`relative p-2.5 rounded-xl transition-all border ${showNotifications ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-slate-50 border-slate-200/60 text-slate-600 hover:bg-slate-100'}`}
                >
                  <BellIcon className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute right-0 mt-2.5 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 z-50 overflow-hidden animate-[fadeInScale_0.15s_ease-out]">
                    <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/80">
                      <div>
                        <h3 className="font-extrabold text-slate-950 dark:text-white text-sm tracking-tight">Activity Alerts</h3>
                        <p className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Updates across your grocery unit</p>
                      </div>
                      {unreadCount > 0 && (
                        <span className="text-[10px] font-black text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-700">{unreadCount} Unread</span>
                      )}
                    </div>
                    <div className="max-h-[360px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
                      {notifications.length === 0 ? (
                        <div className="p-6 text-center text-xs font-bold text-slate-500 dark:text-slate-400">No notifications available</div>
                      ) : (
                        notifications.map((notif) => {
                          const moduleVal = notif.module || notif.related_module || 'General';
                          const { icon: NotifIcon, iconBg } = getNotificationConfig(moduleVal, notif.type);
                          const actorDisplay = notif.actor_name || notif.related_user || 'System';
                          const roleDisplay = notif.actor_role ? ` (${notif.actor_role})` : '';
                          return (
                            <div
                              key={notif.id}
                              onClick={() => handleNotificationClick(notif)}
                              className={`p-3.5 flex gap-3 cursor-pointer transition-colors ${
                                !notif.is_read 
                                  ? 'bg-slate-50/90 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800/80' 
                                  : 'hover:bg-slate-50/60 dark:hover:bg-slate-800/40'
                              }`}
                            >
                              <div className={`h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0 shadow-xs ${iconBg}`}>
                                <NotifIcon className="w-4 h-4" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-1">
                                  <p className="text-xs font-bold text-slate-950 dark:text-slate-100 truncate">{notif.title}</p>
                                  {!notif.is_read && <span className="h-2 w-2 rounded-full bg-emerald-500 flex-shrink-0 ring-2 ring-emerald-200 dark:ring-emerald-900" />}
                                </div>
                                <p className="text-[11px] text-slate-700 dark:text-slate-300 mt-0.5 leading-snug font-medium">{notif.message}</p>
                                <div className="flex flex-wrap items-center gap-1.5 mt-1.5 text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                                  <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.2 rounded text-slate-700 dark:text-slate-300 font-bold">{moduleVal}</span>
                                  <span>•</span>
                                  <span>By {actorDisplay}{roleDisplay}</span>
                                  <span>•</span>
                                  <span>{timeAgo(notif.created_at)}</span>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-900/90 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                      <button onClick={handleClearAll} disabled={unreadCount === 0} className="text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white disabled:opacity-40 flex-1 py-1 text-center">
                        Mark all read
                      </button>
                      <span className="text-slate-300 dark:text-slate-700">|</span>
                      <button onClick={() => { setShowNotifications(false); navigate('/dashboard/notifications'); }} className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 flex-1 py-1 text-center">
                        View all alerts
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Profile Dropdown — Profile + Logout ONLY */}
              <div className="relative" ref={profileMenuRef}>
                <button
                  onClick={() => { setShowProfileMenu(!showProfileMenu); setShowNotifications(false); }}
                  className="flex items-center gap-2.5 p-1.5 pr-3 hover:bg-slate-50 border border-transparent hover:border-slate-200/60 rounded-xl transition-all group"
                >
                  <div className="relative">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white flex items-center justify-center font-black text-sm uppercase shadow-sm">
                      {(user?.email || user?.name || 'A').charAt(0).toUpperCase()}
                    </div>
                    <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
                  </div>
                  <div className="hidden md:block">
                    <p className="text-xs font-bold text-slate-900 leading-tight">{user?.name || 'Admin User'}</p>
                    <p className="text-[10px] font-medium text-slate-400 capitalize">{user?.role || 'Administrator'}</p>
                  </div>
                  <ChevronDownIcon className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ml-1 ${showProfileMenu ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown — only Profile & Logout */}
                {showProfileMenu && (
                  <div className="absolute right-0 mt-2.5 w-52 bg-white rounded-2xl shadow-xl border border-slate-200/80 z-50 py-2 animate-[fadeInDown_0.15s_ease-out] overflow-hidden">
                    {/* Mini user info */}
                    <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
                      <p className="text-xs font-bold text-slate-900 truncate">{user?.name || 'Admin User'}</p>
                      <p className="text-[10px] font-medium text-slate-400 truncate">{user?.email}</p>
                    </div>

                    <div className="py-1">
                      <button
                        onClick={() => { setShowProfileMenu(false); setShowProfileModal(true); }}
                        className="flex items-center gap-2.5 w-full px-4 py-2.5 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition-colors text-left"
                      >
                        <div className="h-6 w-6 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                          <UserIcon className="w-3.5 h-3.5 text-indigo-600" />
                        </div>
                        Profile
                      </button>
                    </div>

                    <div className="h-px bg-slate-100 mx-3" />

                    <div className="py-1">
                      <button
                        onClick={async () => { await dispatch(logoutUser()); navigate('/login'); }}
                        className="flex items-center gap-2.5 w-full px-4 py-2.5 text-xs font-semibold text-red-600 hover:bg-red-50/60 transition-colors text-left"
                      >
                        <div className="h-6 w-6 rounded-lg bg-red-50 border border-red-100 flex items-center justify-center">
                          <ArrowLeftOnRectangleIcon className="w-3.5 h-3.5 text-red-500" />
                        </div>
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>
        </header>

        <style>{`
          @keyframes fadeInScale {
            from { opacity: 0; transform: scale(0.95) translateY(-5px); }
            to { opacity: 1; transform: scale(1) translateY(0); }
          }
          @keyframes fadeInDown {
            from { opacity: 0; transform: translateY(-8px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>
      </div>
    </>
  );
};

export default Header;