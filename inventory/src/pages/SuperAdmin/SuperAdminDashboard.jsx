import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  BuildingStorefrontIcon, 
  UserGroupIcon, 
  CurrencyRupeeIcon, 
  ChartBarIcon, 
  ArrowRightOnRectangleIcon, 
  ShieldCheckIcon,
  PlusIcon,
  SunIcon,
  MoonIcon
} from '@heroicons/react/24/outline';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { logoutUser } from '../../store/slices/authSlice';
import { toggleTheme } from '../../store/slices/themeSlice';
import { superAdminAPI } from '../../services/api';
import Loader from '../../components/common/Loader';
import ThemeToggle from '../../components/common/ThemeToggle';

const SuperAdminDashboard = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { theme, isDarkMode } = useAppSelector((state) => state.theme);
  const toggleThemeAction = () => dispatch(toggleTheme());
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await superAdminAPI.getKPIs();
      if (res.success) {
        setData(res);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch Super Admin KPIs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleLogout = async () => {
    await dispatch(logoutUser());
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader size="lg" />
      </div>
    );
  }

  const kpis = data?.kpis || {
    totalStores: 0,
    activeStores: 0,
    suspendedStores: 0,
    inactiveStores: 0,
    totalUsers: 0,
    totalEmployees: 0,
    totalProducts: 0,
    totalSales: 0,
    platformRevenue: 0
  };

  return (
    <div className="min-h-screen w-screen bg-[#F8FAFC] dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans select-none overflow-x-hidden relative">
      
      {/* Ambient background glows matching landing page theme */}
      <div className="absolute top-20 left-1/4 w-96 h-96 rounded-full bg-gradient-to-tr from-pink-300/5 to-indigo-500/10 blur-[120px] pointer-events-none z-0" />
      <div className="absolute bottom-20 right-1/4 w-[400px] h-[400px] rounded-full bg-gradient-to-br from-indigo-300/5 to-purple-500/10 blur-[150px] pointer-events-none z-0" />
      
      <div className="relative z-10 flex flex-col flex-1 w-full min-h-screen">
        {/* HEADER NAVBAR */}
        <header className="sticky top-0 z-50 bg-white border-b border-slate-200/80 dark:bg-slate-900/80 dark:border-slate-800 px-6 py-4 flex items-center justify-between backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-650 text-indigo-600 dark:text-white rounded-xl shadow-sm border border-indigo-100/50 dark:border-transparent">
              <ShieldCheckIcon className="w-6 h-6 stroke-[2]" />
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-black tracking-tight text-slate-900 dark:text-white uppercase leading-none">Kirana SaaS Portal</h1>
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mt-0.5">SaaS Super Administration Center</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Theme Mode Toggle Button */}
            <ThemeToggle />

            <div className="hidden sm:block text-right">
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{user?.name || 'Super Admin'}</p>
              <p className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Root Operator</p>
            </div>
            
            <button 
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 text-slate-700 hover:text-rose-700 dark:bg-slate-800 dark:hover:bg-rose-950 dark:border-slate-700 dark:hover:border-rose-800 rounded-xl text-xs font-bold transition-all dark:text-slate-300 dark:hover:text-white cursor-pointer"
            >
              <ArrowRightOnRectangleIcon className="w-4 h-4" /> Log Out
            </button>
          </div>
        </header>

        {/* DASHBOARD CONTENT PORTAL */}
        <main className="flex-1 max-w-[1400px] w-full mx-auto p-6 space-y-6">
          
          {/* TOP PANEL TITLE */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight">Platform Overview</h2>
              <p className="text-xs font-medium text-slate-405 dark:text-slate-500 mt-0.5">Real-time statistics of registered store properties and subscription statuses</p>
            </div>
            <button
              onClick={() => navigate('/superadmin/stores')}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-500/20 active:scale-95 transition-all w-fit"
            >
              <PlusIcon className="w-4 h-4 stroke-[3]" /> Register Store
            </button>
          </div>

          {/* METRICS KPI GRID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Store Tenants', value: kpis.totalStores, sub: `${kpis.activeStores} Active / ${kpis.inactiveStores || kpis.suspendedStores || 0} Inactive`, icon: BuildingStorefrontIcon, color: 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100/50 dark:border-transparent' },
              { label: 'Platform Users Count', value: kpis.totalUsers, sub: `${kpis.activeUsers ?? kpis.totalUsers} Active / ${kpis.inactiveUsers ?? 0} Inactive Staff`, icon: UserGroupIcon, color: 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100/50 dark:border-transparent' },
              { label: 'Monthly SaaS Income', value: `₹${kpis.platformRevenue.toLocaleString('en-IN')}`, sub: 'Active Paid Subscriptions', icon: CurrencyRupeeIcon, color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100/50 dark:border-transparent' },
              { label: 'Cumulative Store Sales', value: `₹${kpis.totalSales.toLocaleString('en-IN')}`, sub: `${kpis.totalTransactions ?? 0} Completed Transactions`, icon: ChartBarIcon, color: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-100/50 dark:border-transparent' }
            ].map((card, i) => {
              const Icon = card.icon;
              return (
                <motion.div 
                  key={card.label}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl p-5 shadow-sm dark:shadow-xl flex items-center justify-between hover:shadow-md transition-shadow"
                >
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{card.label}</span>
                    <p className="text-xl md:text-2xl font-black text-slate-900 dark:text-white">{card.value}</p>
                    <span className="text-[10px] font-semibold text-slate-550 dark:text-slate-500 block">{card.sub}</span>
                  </div>
                  <div className={`p-3 rounded-xl ${card.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                </motion.div>
              );
            })}
          </div>

          <div className="w-full">
            {/* RECENT STORES LIST (FULL WIDTH) */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl p-6 shadow-sm dark:shadow-xl space-y-4">
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">Recent Registered Stores</h3>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">Full specifications of active merchant tenants on the platform</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-semibold border-collapse">
                  <thead>
                    <tr className="text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-850 pb-3 uppercase tracking-wider text-[10px]">
                      <th className="pb-3 pr-4">Store Name</th>
                      <th className="pb-3 pr-4">Tenant ID</th>
                      <th className="pb-3 pr-4">Owner Name</th>
                      <th className="pb-3 pr-4">Email Address</th>
                      <th className="pb-3 pr-4">Plan</th>
                      <th className="pb-3 pr-4 text-center">Trial Status</th>
                      <th className="pb-3 pr-4">Registration</th>
                      <th className="pb-3 pr-4">Expiry Date</th>
                      <th className="pb-3 pr-4 text-center">Active Users</th>
                      <th className="pb-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                    {data?.recentStores?.map(store => (
                      <tr key={store.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="py-4 pr-4">
                          <p className="font-bold text-slate-850 dark:text-slate-200">{store.store_name}</p>
                        </td>
                        <td className="py-4 pr-4">
                          <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-950 px-2 py-0.5 rounded border border-slate-200/50 dark:border-slate-800">{store.id}</span>
                        </td>
                        <td className="py-4 pr-4">
                          <p className="text-slate-700 dark:text-slate-300 font-bold">{store.owner_name}</p>
                        </td>
                        <td className="py-4 pr-4 text-slate-500 dark:text-slate-400 font-medium">
                          {store.email}
                        </td>
                        <td className="py-4 pr-4">
                          <span className="px-2 py-0.5 rounded-md text-[9px] bg-indigo-50/60 text-indigo-700 border border-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20 font-bold uppercase tracking-wider">{store.subscription_plan}</span>
                        </td>
                        <td className="py-4 pr-4 text-center">
                          <span className={`text-[10px] font-bold ${store.trial_used ? 'text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded' : 'text-slate-400 dark:text-slate-600'}`}>
                            {store.trial_used ? 'Trial Active' : 'No'}
                          </span>
                        </td>
                        <td className="py-4 pr-4 text-slate-500 dark:text-slate-400 font-medium">
                          {store.created_at ? new Date(store.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                        </td>
                        <td className="py-4 pr-4 text-slate-500 dark:text-slate-400 font-medium">
                          {store.subscription_expires_at ? new Date(store.subscription_expires_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                        </td>
                        <td className="py-4 pr-4 text-center font-bold text-slate-700 dark:text-slate-300">
                          {store.active_users !== undefined ? store.active_users : '0'}
                        </td>
                        <td className="py-4 text-right">
                          <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                            store.subscription_status === 'Active' 
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-250 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20' 
                              : 'bg-rose-50 text-rose-700 border border-rose-250 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20'
                          }`}>
                            {store.subscription_status}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {(!data?.recentStores || data.recentStores.length === 0) && (
                      <tr>
                        <td colSpan={10} className="text-center py-10 text-slate-400 dark:text-slate-500 font-bold italic">No stores registered yet.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

        </main>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
