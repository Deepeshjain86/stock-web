import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BuildingStorefrontIcon, 
  ArrowLeftIcon,
  PlusIcon,
  PencilSquareIcon,
  NoSymbolIcon,
  CheckCircleIcon,
  XMarkIcon,
  EyeIcon,
  SunIcon,
  MoonIcon,
  CreditCardIcon,
  ArrowDownTrayIcon,
  CalendarIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { superAdminAPI } from '../../services/api';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { toggleTheme } from '../../store/slices/themeSlice';
import Loader from '../../components/common/Loader';
import ThemeToggle from '../../components/common/ThemeToggle';

const StoreManagement = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { theme, isDarkMode } = useAppSelector((state) => state.theme);
  const toggleThemeAction = () => dispatch(toggleTheme());
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modals state
  const [showModal, setShowModal] = useState(false);
  const [selectedStore, setSelectedStore] = useState(null);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  // Subscription Action Modal state
  const [showSubModal, setShowSubModal] = useState(false);
  const [activeStoreForSub, setActiveStoreForSub] = useState(null);
  
  // Subscription Action form states
  const [subActionPlan, setSubActionPlan] = useState('Monthly');
  const [subActionDays, setSubActionDays] = useState('7');
  const [subSubmitting, setSubSubmitting] = useState(false);

  // Form states for Store Add/Edit
  const [form, setForm] = useState({
    store_name: '',
    owner_name: '',
    email: '',
    phone: '',
    address: '',
    gstin: '',
    subscription_plan: 'Trial',
    subscription_expires_at: '',
    password: '',
    admin_id: ''
  });

  const loadStores = async () => {
    try {
      setLoading(true);
      const res = await superAdminAPI.getStores();
      if (res.success) {
        setStores(res.stores);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch stores');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStores();
  }, []);

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedStore(null);
    setFormError('');
    setSubmitting(false);
    setForm({
      store_name: '',
      owner_name: '',
      email: '',
      phone: '',
      address: '',
      gstin: '',
      subscription_plan: 'Trial',
      subscription_expires_at: '',
      password: '',
      admin_id: ''
    });
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Only close on Escape when no input/select/textarea is currently focused
      if (e.key === 'Escape') {
        const tag = document.activeElement?.tagName;
        const isInputFocused = ['INPUT', 'SELECT', 'TEXTAREA'].includes(tag);
        if (!isInputFocused) {
          handleCloseModal();
          setShowSubModal(false);
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleMonitorStore = (store) => {
    localStorage.setItem('monitoredTenant', JSON.stringify({
      id: store.id,
      name: store.store_name
    }));
    navigate('/dashboard');
  };

  const handleOpenAdd = () => {
    setSelectedStore(null);
    setForm({
      store_name: '',
      owner_name: '',
      email: '',
      phone: '',
      address: '',
      gstin: '',
      subscription_plan: 'Trial',
      subscription_expires_at: '',
      password: '',
      admin_id: ''
    });
    setShowModal(true);
  };

  const handleOpenEdit = (store) => {
    setSelectedStore(store);
    setForm({
      store_name: store.store_name,
      owner_name: store.owner_name,
      email: store.email,
      phone: store.phone || '',
      address: store.address || '',
      gstin: store.gstin || '',
      subscription_plan: store.subscription_plan,
      subscription_expires_at: store.subscription_expires_at ? store.subscription_expires_at.substring(0, 10) : '',
      password: '', 
      admin_id: store.admin_id || ''
    });
    setShowModal(true);
  };

  const handleOpenSubscriptionManager = (store) => {
    setActiveStoreForSub(store);
    setShowSubModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    // Client-side validation — show inline errors, never close form
    if (!form.store_name.trim()) { setFormError('Store Name is required.'); return; }
    if (!form.owner_name.trim()) { setFormError('Owner Full Name is required.'); return; }
    if (!form.email.trim()) { setFormError('Owner Email is required.'); return; }
    if (form.phone && form.phone.replace(/\D/g, '').length !== 10) { setFormError('Mobile / Phone number must be exactly 10 digits.'); return; }
    if (!selectedStore && !form.admin_id.trim()) { setFormError('Admin ID is required.'); return; }
    if (!selectedStore && !form.password.trim()) { setFormError('Admin Password is required.'); return; }
    if (!selectedStore && form.password.length < 6) { setFormError('Password must be at least 6 characters.'); return; }

    setFormError('');
    setSubmitting(true);
    try {
      if (selectedStore) {
        const updatePayload = { ...form };
        if (!updatePayload.password || !updatePayload.password.trim()) {
          delete updatePayload.password;
        }
        const res = await superAdminAPI.updateStore(selectedStore.id, updatePayload);
        if (res.success) {
          handleCloseModal();
          loadStores();
        }
      } else {
        const res = await superAdminAPI.createStore(form);
        if (res.success) {
          handleCloseModal();
          loadStores();
        }
      }
    } catch (err) {
      // Show error inline — do NOT close the form
      setFormError(err.response?.data?.message || 'Error processing request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubscriptionOverride = async (action) => {
    if (!activeStoreForSub) return;
    
    const confirmMsg = `Are you sure you want to perform manual override action: "${action.toUpperCase()}" on store "${activeStoreForSub.store_name}"?`;
    if (!window.confirm(confirmMsg)) return;

    try {
      setSubSubmitting(true);
      const res = await superAdminAPI.updateSubscription(activeStoreForSub.id, {
        action,
        planName: subActionPlan,
        days: subActionDays
      });
      if (res.success) {
        alert(res.message || 'Subscription override successful');
        setShowSubModal(false);
        loadStores();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Override operation failed');
    } finally {
      setSubSubmitting(false);
    }
  };

  const handleToggleStatus = async (store) => {
    const isCurrentlyActive = store.subscription_status === 'Active' || store.subscription_status === 'Trial';
    const targetStatus = isCurrentlyActive ? 'Inactive' : 'Active';
    const confirmMsg = isCurrentlyActive
      ? `Are you sure you want to DEACTIVATE store "${store.store_name}"? All users belonging to this store will be blocked from logging in immediately.`
      : `Are you sure you want to RE-ACTIVATE store "${store.store_name}"? Users of this store will automatically regain access.`;

    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await superAdminAPI.toggleStoreStatus(store.id, targetStatus);
      if (res.success) {
        setStores(prev => prev.map(s => s.id === store.id ? {
          ...s,
          subscription_status: targetStatus
        } : s));
        loadStores();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error updating store status.');
    }
  };

  const remainingDays = (storeOrExpiresAt) => {
    if (!storeOrExpiresAt) return 0;
    if (typeof storeOrExpiresAt === 'object') {
      if (storeOrExpiresAt.subscription_status === 'Expired' || storeOrExpiresAt.subscription_status === 'Inactive') return 0;
      const expiresAt = storeOrExpiresAt.subscription_expires_at || storeOrExpiresAt.trial_ended_at;
      if (!expiresAt) return 0;
      const expiry = new Date(expiresAt);
      const diffTime = expiry - new Date();
      return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    }
    const expiry = new Date(storeOrExpiresAt);
    const diffTime = expiry - new Date();
    return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  };

  return (
    <div className="min-h-screen w-screen bg-[#F8FAFC] dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans select-none overflow-x-hidden relative">
      
      {/* Ambient background glows */}
      <div className="absolute top-20 left-1/4 w-96 h-96 rounded-full bg-gradient-to-tr from-pink-300/5 to-indigo-500/10 blur-[120px] pointer-events-none z-0" />
      <div className="absolute bottom-20 right-1/4 w-[400px] h-[400px] rounded-full bg-gradient-to-br from-indigo-300/5 to-purple-500/10 blur-[150px] pointer-events-none z-0" />
      
      <div className="relative z-10 flex flex-col flex-1 w-full min-h-screen">
        
        {/* HEADER SECTION */}
        <header className="sticky top-0 z-40 bg-white border-b border-slate-200/80 dark:bg-slate-900/80 dark:border-slate-800 px-6 py-4 flex items-center justify-between backdrop-blur-md">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate('/superadmin')}
              className="p-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-850 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-750 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors rounded-lg"
            >
              <ArrowLeftIcon className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-sm sm:text-base font-black tracking-tight text-slate-900 dark:text-white uppercase leading-none">Store Tenant Registers</h1>
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mt-0.5">Add, Suspend, or Modify Platform Stores</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Theme Mode Toggle Button */}
            <ThemeToggle />

            <button 
              onClick={handleOpenAdd}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95"
            >
              <PlusIcon className="w-4 h-4 stroke-[3]" /> Register New Store
            </button>
          </div>
        </header>

        {/* RENDER TABLE VIEWPORT */}
        <main className="flex-1 max-w-[1450px] w-full mx-auto p-6">
          
          {loading ? (
            <div className="flex justify-center py-20">
              <Loader size="md" />
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl p-5 shadow-sm dark:shadow-2xl space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-semibold">
                  <thead>
                    <tr className="text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800 pb-3">
                      <th className="pb-3 pl-2">Store Details</th>
                      <th className="pb-3">Database Name</th>
                      <th className="pb-3">Admin ID / Owner</th>
                      <th className="pb-3">Plan Mappings</th>
                      <th className="pb-3">Remaining Days</th>
                      <th className="pb-3">Status</th>
                      <th className="pb-3 pr-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                    {stores.map(store => (
                      <tr key={store.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="py-3.5 pl-2">
                          <div className="flex items-center gap-3">
                            <span className="text-xl bg-slate-50 dark:bg-slate-800 p-2 rounded-lg border border-slate-200/60 dark:border-slate-700">🏬</span>
                            <div>
                              <p className="font-bold text-slate-800 dark:text-slate-200">{store.store_name}</p>
                              <p className="text-[10px] text-slate-400 dark:text-slate-500">{store.address || 'Address not listed'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 font-mono text-[11px] text-slate-500 dark:text-slate-400">{store.database_name}</td>
                        <td className="py-3.5">
                          <p className="text-slate-750 dark:text-slate-350">{store.owner_name}</p>
                          <p className="text-[10px] text-slate-450 dark:text-slate-500">{store.email} • {store.phone || 'No Mobile'}</p>
                          {store.admin_id && (
                            <p className="text-[10px] text-indigo-650 dark:text-indigo-450 font-black mt-0.5">Admin: {store.admin_id}</p>
                          )}
                        </td>
                        <td className="py-3.5">
                          <p className="text-slate-800 dark:text-slate-200 font-bold text-[10px] uppercase tracking-wider">{store.subscription_plan} Plan</p>
                          <p className="text-[10px] text-slate-450 dark:text-slate-550 mt-0.5 font-bold">Expires: {store.subscription_expires_at ? new Date(store.subscription_expires_at).toLocaleDateString('en-IN') : 'Lifetime'}</p>
                        </td>
                        <td className="py-3.5 font-bold">
                          <span className={`px-2.5 py-1 rounded-xl text-xs ${
                            store.subscription_status === 'Expired' || remainingDays(store) <= 3 
                              ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/20' 
                              : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20'
                          }`}>
                            {remainingDays(store)} Days
                          </span>
                        </td>
                        <td className="py-3.5">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                            store.subscription_status === 'Active' 
                              ? 'bg-emerald-55 text-emerald-700 border border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-450 dark:border-emerald-500/20' 
                              : store.subscription_status === 'Trial'
                                ? 'bg-indigo-50 text-indigo-600 border border-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20'
                                : 'bg-rose-50 text-rose-600 border border-rose-100 dark:bg-rose-500/10 dark:text-rose-455 dark:border-rose-500/20'
                          }`}>
                            {store.subscription_status}
                          </span>
                        </td>
                        <td className="py-3.5 pr-2 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleMonitorStore(store)}
                              title="Monitor Store (Live Console)"
                              className="p-1.5 bg-slate-50 hover:bg-indigo-50 text-indigo-650 border border-slate-200 dark:bg-slate-800 dark:hover:bg-indigo-950 dark:text-indigo-400 dark:border-slate-700 rounded-lg transition-all"
                            >
                              <EyeIcon className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => handleOpenSubscriptionManager(store)}
                              title="Manage SaaS Subscription"
                              className="p-1.5 bg-slate-50 hover:bg-indigo-50 text-indigo-600 border border-slate-200 dark:bg-slate-800 dark:hover:bg-indigo-950 dark:text-indigo-400 dark:border-slate-700 rounded-lg transition-all"
                            >
                              <CreditCardIcon className="w-4 h-4" />
                            </button>
                            
                            <button
                              onClick={() => handleOpenEdit(store)}
                              title="Edit Store Specs"
                              className="p-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 dark:bg-slate-800 dark:hover:bg-slate-700 dark:border-slate-700 dark:text-slate-350 dark:hover:text-white rounded-lg transition-all"
                            >
                              <PencilSquareIcon className="w-4 h-4" />
                            </button>
                            
                            <button
                              onClick={() => handleToggleStatus(store)}
                              title={store.subscription_status === 'Inactive' || store.subscription_status === 'Disabled' ? 'Activate Store Account' : 'Deactivate Store Account'}
                              className={`p-1.5 border rounded-lg transition-all ${
                                store.subscription_status === 'Inactive' || store.subscription_status === 'Disabled'
                                  ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 dark:text-emerald-400 dark:border-emerald-800'
                                  : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 dark:text-rose-400 dark:border-rose-800'
                              }`}
                            >
                              {store.subscription_status === 'Inactive' || store.subscription_status === 'Disabled' ? (
                                <CheckCircleIcon className="w-4 h-4 text-emerald-600" />
                              ) : (
                                <NoSymbolIcon className="w-4 h-4 text-rose-600" />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {stores.length === 0 && (
                      <tr>
                        <td colSpan={7} className="text-center py-12 text-slate-400 dark:text-slate-500">No stores registered on platform.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>

        {/* REGISTRATION MODAL */}
        <AnimatePresence>
          {showModal && (
            <>
              {/* Backdrop — separate element, behind modal card, click closes modal */}
              <div
                className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
                onClick={handleCloseModal}
                aria-hidden="true"
              />
              {/* Modal card — stopPropagation prevents backdrop from firing on inside clicks */}
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  onClick={(e) => e.stopPropagation()}
                  className="bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-800 rounded-2xl w-full max-w-[650px] shadow-2xl overflow-hidden pointer-events-auto"
                >
                  {/* Modal Header */}
                  <div className="bg-slate-50 dark:bg-slate-950 px-6 py-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                      {selectedStore ? 'Modify Store Specifications' : 'Register New Tenant Store'}
                    </h3>
                    <button onClick={handleCloseModal} className="text-slate-450 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white p-1">
                      <XMarkIcon className="w-5 h-5" />
                    </button>
                  </div>

                  <form onSubmit={handleSubmit} noValidate className="p-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider mb-1">Store Name *</label>
                        <input
                          type="text" placeholder="e.g. Aggarwal Super Mart"
                          value={form.store_name}
                          onChange={(e) => { setForm({...form, store_name: e.target.value}); setFormError(''); }}
                          className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 focus:border-indigo-500 rounded-xl font-semibold outline-none text-slate-800 dark:text-slate-200"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider mb-1">Owner Full Name *</label>
                        <input
                          type="text" placeholder="e.g. Ramesh Kumar"
                          value={form.owner_name}
                          onChange={(e) => { 
                            const val = e.target.value;
                            setForm((prev) => {
                              const firstWord = val.trim().split(' ')[0].toUpperCase().replace(/[^A-Z]/g, '');
                              let autoId = '';
                              if (firstWord && firstWord.length >= 2) {
                                let maxSeq = 0;
                                for (const s of stores) {
                                  const adminId = String(s.admin_id || '').toUpperCase();
                                  const match = adminId.match(new RegExp(`^${firstWord}(\\d+)$`));
                                  if (match && match[1]) {
                                    const seq = parseInt(match[1], 10);
                                    if (!isNaN(seq) && seq > maxSeq) {
                                      maxSeq = seq;
                                    }
                                  }
                                }
                                autoId = `${firstWord}${String(maxSeq + 1).padStart(3, '0')}`;
                              }
                              return {
                                ...prev,
                                owner_name: val,
                                admin_id: !selectedStore ? (autoId || prev.admin_id) : prev.admin_id
                              };
                            }); 
                            setFormError(''); 
                          }}
                          className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 focus:border-indigo-500 rounded-xl font-semibold outline-none text-slate-800 dark:text-slate-200"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider mb-1">Owner Email *</label>
                        <input
                          type="email" placeholder="owner@mart.com"
                          value={form.email}
                          onChange={(e) => { setForm({...form, email: e.target.value}); setFormError(''); }}
                          disabled={!!selectedStore}
                          autoComplete="off"
                          className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 focus:border-indigo-500 rounded-xl font-semibold outline-none text-slate-800 dark:text-slate-200 disabled:opacity-45"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-455 dark:text-slate-500 uppercase tracking-wider mb-1">Mobile / Phone (10 digits)</label>
                        <input
                          type="text" placeholder="9876543210"
                          value={form.phone}
                          onChange={(e) => setForm({...form, phone: e.target.value.replace(/\D/g, '').slice(0, 10)})}
                          maxLength={10}
                          className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 focus:border-indigo-500 rounded-xl font-semibold outline-none text-slate-800 dark:text-slate-200 font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider mb-1">GSTIN Number</label>
                        <input
                          type="text" placeholder="07AAAAA1111A1Z1"
                          value={form.gstin}
                          onChange={(e) => setForm({...form, gstin: e.target.value})}
                          className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 focus:border-indigo-500 rounded-xl font-semibold outline-none text-slate-800 dark:text-slate-200 font-mono"
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider">Admin ID *</label>
                          {!selectedStore && <span className="text-[9px] text-indigo-600 dark:text-indigo-400 font-extrabold uppercase tracking-wide bg-indigo-50 dark:bg-indigo-950/60 px-1.5 py-0.5 rounded-md border border-indigo-200/60 dark:border-indigo-800/40">Auto-Generated</span>}
                        </div>
                        <input
                          type="text" placeholder="e.g. RAMESH001"
                          value={form.admin_id}
                          onChange={(e) => { setForm({...form, admin_id: e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, '')}); setFormError(''); }}
                          disabled={!!selectedStore}
                          className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 focus:border-indigo-500 rounded-xl font-bold font-mono outline-none text-indigo-950 dark:text-indigo-200 uppercase disabled:opacity-45 tracking-wider"
                        />
                      </div>

                      {!selectedStore && (
                        <div className="md:col-span-2">
                          <label className="block text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider mb-1">Admin Password *</label>
                          <input
                            type="password" placeholder="••••••••"
                            value={form.password}
                            onChange={(e) => { setForm({...form, password: e.target.value}); setFormError(''); }}
                            autoComplete="new-password"
                            className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 focus:border-indigo-500 rounded-xl font-semibold outline-none text-slate-800 dark:text-slate-200"
                          />
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider mb-1">Store Physical Address</label>
                      <textarea
                        rows="2" placeholder="Enter complete store physical location..."
                        value={form.address}
                        onChange={(e) => setForm({...form, address: e.target.value})}
                        className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 focus:border-indigo-500 rounded-xl font-semibold outline-none text-slate-800 dark:text-slate-200 resize-none"
                      />
                    </div>

                    {/* Inline error banner — never closes the form */}
                    {formError && (
                      <div className="flex items-center gap-2 px-4 py-2.5 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/50 rounded-xl">
                        <span className="text-rose-500 text-sm flex-shrink-0">⚠</span>
                        <p className="text-[11px] font-bold text-rose-700 dark:text-rose-400">{formError}</p>
                      </div>
                    )}

                    <div className="flex gap-2 justify-end pt-4 border-t border-slate-100 dark:border-slate-850">
                      <button
                        type="button" onClick={handleCloseModal}
                        disabled={submitting}
                        className="px-4 py-2 border border-slate-200 text-slate-500 hover:text-slate-900 dark:border-slate-800 dark:text-slate-400 dark:hover:text-white rounded-xl text-xs font-bold transition-all active:scale-95 bg-white dark:bg-slate-900 disabled:opacity-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={submitting}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                      >
                        {submitting && <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
                        {submitting ? 'Saving...' : (selectedStore ? 'Update Store' : 'Register Store')}
                      </button>
                    </div>
                  </form>
                </motion.div>
              </div>
            </>
          )}
        </AnimatePresence>

        {/* SUBSCRIPTION MANUAL ACTIONS MODAL */}
        <AnimatePresence>
          {showSubModal && activeStoreForSub && (
            <div 
              onClick={(e) => {
                if (e.target === e.currentTarget) setShowSubModal(false);
              }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            >
              <motion.div 
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-800 rounded-2xl w-full max-w-[850px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
              >
                <div className="bg-slate-50 dark:bg-slate-950 px-6 py-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                      SaaS License Override & History
                    </h3>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold mt-0.5">{activeStoreForSub.store_name} ({activeStoreForSub.database_name})</p>
                  </div>
                  <button onClick={() => setShowSubModal(false)} className="text-slate-450 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white p-1">
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-6 space-y-6 overflow-y-auto flex-1">
                  
                  {/* Detailed Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800">
                      <p className="text-[9px] font-bold text-slate-400 uppercase">Database Name</p>
                      <p className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200 mt-1">{activeStoreForSub.database_name}</p>
                    </div>
                    <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800">
                      <p className="text-[9px] font-bold text-slate-400 uppercase">Admin login ID</p>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1">{activeStoreForSub.admin_id}</p>
                    </div>
                    <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800">
                      <p className="text-[9px] font-bold text-slate-400 uppercase">Active plan / status</p>
                      <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 mt-1 uppercase tracking-wider">{activeStoreForSub.subscription_plan} Plan ({activeStoreForSub.subscription_status})</p>
                    </div>
                    <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800">
                      <p className="text-[9px] font-bold text-slate-400 uppercase">Remaining term</p>
                      <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-1">{remainingDays(activeStoreForSub.subscription_expires_at)} Days left</p>
                    </div>
                  </div>

                  {/* Manual Controls Panel */}
                  <div className="p-5 bg-indigo-50/50 dark:bg-slate-850/50 border border-indigo-100/50 dark:border-slate-800/80 rounded-2xl space-y-4">
                    <h4 className="text-xs font-black uppercase text-indigo-800 dark:text-indigo-400 tracking-wider">Super Admin Override Console</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      
                      {/* Action Option 1 */}
                      <div className="flex items-center gap-3 p-3 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-xl justify-between">
                        <div>
                          <p className="text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase">Select plan mapping</p>
                          <select 
                            value={subActionPlan}
                            onChange={(e) => setSubActionPlan(e.target.value)}
                            className="bg-transparent text-xs font-bold border-none outline-none mt-1"
                          >
                            <option value="Monthly">Monthly Plan (₹800)</option>
                            <option value="Quarterly">Quarterly Plan (₹2100)</option>
                            <option value="Half-Yearly">Half-Yearly Plan (₹3600)</option>
                            <option value="Yearly">Yearly Plan (₹6000)</option>
                          </select>
                        </div>
                        <button
                          disabled={subSubmitting}
                          onClick={() => handleSubscriptionOverride('activate')}
                          className="px-3.5 py-2 bg-indigo-650 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-black uppercase tracking-wider transition-all disabled:opacity-40"
                        >
                          Activate/Renew
                        </button>
                      </div>

                      {/* Action Option 2 */}
                      <div className="flex items-center gap-3 p-3 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-xl justify-between">
                        <div>
                          <p className="text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase">Extension Term (Days)</p>
                          <input 
                            type="number"
                            value={subActionDays}
                            onChange={(e) => setSubActionDays(e.target.value)}
                            className="bg-transparent text-xs font-bold border-none outline-none mt-1 w-20"
                            placeholder="e.g. 7"
                          />
                        </div>
                        <button
                          disabled={subSubmitting}
                          onClick={() => handleSubscriptionOverride('extend')}
                          className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-black uppercase tracking-wider transition-all disabled:opacity-40"
                        >
                          Extend License
                        </button>
                      </div>

                    </div>

                    <div className="flex gap-2 pt-2">
                      <button
                        disabled={subSubmitting}
                        onClick={() => handleSubscriptionOverride('suspend')}
                        className="flex-1 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all disabled:opacity-40"
                      >
                        Suspend Access
                      </button>
                      <button
                        disabled={subSubmitting}
                        onClick={() => handleSubscriptionOverride('cancel')}
                        className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all disabled:opacity-40"
                      >
                        Cancel & Expire
                      </button>
                    </div>
                  </div>

                  {/* Payment History & Invoices */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-black uppercase text-slate-800 dark:text-slate-350 tracking-wider">Payment History & Tax Invoices</h4>
                    
                    <div className="border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden">
                      <table className="w-full text-left text-[11px] font-semibold">
                        <thead className="bg-slate-50 dark:bg-slate-950 text-slate-400 dark:text-slate-500 uppercase tracking-wider text-[9px] border-b border-slate-100 dark:border-slate-800">
                          <tr>
                            <th className="py-2.5 px-4">Transaction / Order ID</th>
                            <th className="py-2.5 px-4">Plan Name</th>
                            <th className="py-2.5 px-4">Amount</th>
                            <th className="py-2.5 px-4">Billing Date</th>
                            <th className="py-2.5 px-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                          {activeStoreForSub.invoices && activeStoreForSub.invoices.map((inv) => (
                            <tr key={inv.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                              <td className="py-3 px-4 font-mono text-[10px] text-slate-800 dark:text-slate-300">{inv.transaction_id}</td>
                              <td className="py-3 px-4 uppercase font-bold text-slate-700 dark:text-slate-300">{inv.plan}</td>
                              <td className="py-3 px-4 font-black">₹{Number(inv.amount).toLocaleString('en-IN')}</td>
                              <td className="py-3 px-4 text-slate-500">
                                {new Date(inv.billing_date).toLocaleDateString('en-IN', { dateStyle: 'short' })}
                              </td>
                              <td className="py-3 px-4 text-right">
                                <a
                                  href={`/api/billing/invoice/${inv.id}/download`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-indigo-650 hover:text-indigo-800"
                                >
                                  <ArrowDownTrayIcon className="w-3 h-3 stroke-[2.5]" /> Download
                                </a>
                              </td>
                            </tr>
                          ))}
                          {(!activeStoreForSub.invoices || activeStoreForSub.invoices.length === 0) && (
                            <tr>
                              <td colSpan={5} className="text-center py-6 text-slate-400 dark:text-slate-500 text-[10px]">No invoice records found for this store.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Subscription Log History */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-black uppercase text-slate-800 dark:text-slate-350 tracking-wider">Subscription Lifecycle Changes</h4>
                    
                    <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl space-y-3 max-h-[180px] overflow-y-auto">
                      {activeStoreForSub.subscriptions && activeStoreForSub.subscriptions.map((log) => (
                        <div key={log.id} className="flex items-start gap-2.5 text-[11px] leading-relaxed">
                          <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="font-bold text-slate-800 dark:text-slate-200">
                              Plan: {log.plan} • status: <span className="font-mono text-indigo-600">{log.status}</span> ({log.payment_status})
                            </p>
                            <p className="text-[10px] text-slate-400 mt-0.5">
                              Created At: {new Date(log.created_at).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                              {log.subscription_expiry_date && ` • Expiry: ${new Date(log.subscription_expiry_date).toLocaleDateString('en-IN')}`}
                              {log.payment_id && ` • Payment ID: ${log.payment_id}`}
                            </p>
                          </div>
                        </div>
                      ))}
                      {(!activeStoreForSub.subscriptions || activeStoreForSub.subscriptions.length === 0) && (
                        <p className="text-center py-4 text-slate-400 dark:text-slate-500 text-[10px]">No historical change entries found.</p>
                      )}
                    </div>
                  </div>

                </div>

                <div className="bg-slate-50 dark:bg-slate-950 px-6 py-4 flex gap-2 justify-end border-t border-slate-200 dark:border-slate-800">
                  <button
                    onClick={() => setShowSubModal(false)}
                    className="px-4 py-2 border border-slate-200 text-slate-500 hover:text-slate-900 dark:border-slate-800 dark:text-slate-400 dark:hover:text-white rounded-xl text-xs font-bold bg-white dark:bg-slate-900"
                  >
                    Close console
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
      
    </div>
  );
};

export default StoreManagement;
