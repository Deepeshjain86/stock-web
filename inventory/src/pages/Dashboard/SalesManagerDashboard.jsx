import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  CurrencyRupeeIcon,
  ShoppingBagIcon,
  UserGroupIcon,
  BookOpenIcon,
  ArrowPathIcon,
  ArrowTrendingUpIcon,
  PlusIcon,
  BuildingStorefrontIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import { useAppSelector } from '../../store/hooks';
import { reportsAPI, salesAPI, customersAPI, borrowAPI } from '../../services/api';
import Loader from '../../components/common/Loader';

const SalesManagerDashboard = () => {
  const { user } = useAppSelector((state) => state.auth);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [kpis, setKpis] = useState({
    totalSales: 0,
    totalOrders: 0,
    totalCustomers: 0,
    totalUdharOutstanding: 0,
    dailyRevenue: 0
  });

  const [recentSales, setRecentSales] = useState([]);
  const [salesTrend, setSalesTrend] = useState([
    { day: 'Mon', Sales: 24000, Udhar: 4000 },
    { day: 'Tue', Sales: 32000, Udhar: 6000 },
    { day: 'Wed', Sales: 28000, Udhar: 3500 },
    { day: 'Thu', Sales: 41000, Udhar: 8000 },
    { day: 'Fri', Sales: 48000, Udhar: 5200 },
    { day: 'Sat', Sales: 62000, Udhar: 9100 },
    { day: 'Sun', Sales: 55000, Udhar: 7400 },
  ]);

  const loadSalesData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const [kpiRes, salesRes, customerRes, borrowRes] = await Promise.all([
        reportsAPI.getKPIs().catch(() => null),
        salesAPI.getAll().catch(() => null),
        customersAPI.getAll().catch(() => null),
        borrowAPI.getSummary().catch(() => null)
      ]);

      if (kpiRes?.success && kpiRes.kpis) {
        setKpis(prev => ({
          ...prev,
          totalSales: kpiRes.kpis.totalSales || prev.totalSales,
          totalOrders: kpiRes.kpis.totalOrders || prev.totalOrders,
          totalCustomers: kpiRes.kpis.totalCustomers || prev.totalCustomers
        }));
      }

      if (salesRes?.success && salesRes.sales) {
        setRecentSales(salesRes.sales.slice(0, 5));
        setKpis(prev => ({
          ...prev,
          totalOrders: salesRes.sales.length
        }));
      }

      if (customerRes?.success && customerRes.customers) {
        setKpis(prev => ({ ...prev, totalCustomers: customerRes.customers.length }));
      }

      if (borrowRes?.success) {
        const udharTotal = borrowRes.summaryTotals?.total_pending || (borrowRes.summary || []).reduce((acc, curr) => acc + Number(curr.balance || 0), 0);
        setKpis(prev => ({ ...prev, totalUdharOutstanding: Number(udharTotal || 0) }));
      }
    } catch (err) {
      console.error('Sales Dashboard fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadSalesData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader size="lg" text="Loading Sales Operations..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 p-6 text-white shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-blue-500/20 px-3 py-1 text-xs font-semibold text-blue-300 border border-blue-500/30">
              SALES & POS BILLING HEADQUARTERS
            </span>
          </div>
          <h1 className="mt-2 text-2xl font-black tracking-tight text-white sm:text-3xl">
            Sales Operations Dashboard
          </h1>
          <p className="mt-1 text-sm text-blue-100/80">
            Welcome back, <span className="font-bold text-white">{user?.name}</span>. Monitor live sales revenues, counter POS billing, customer ledgers, and Udhaar collections.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => loadSalesData(true)}
            disabled={refreshing}
            className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-sm font-semibold text-white backdrop-blur-md hover:bg-white/20 active:scale-95 transition-all"
          >
            <ArrowPathIcon className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => navigate('/dashboard/sales')}
            className="flex items-center gap-2 rounded-xl bg-blue-500 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-500/30 hover:bg-blue-400 active:scale-95 transition-all"
          >
            <PlusIcon className="h-5 w-5" />
            Open POS Register
          </button>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Total Sales Revenue</span>
            <div className="rounded-xl bg-blue-100 dark:bg-blue-950/50 p-2.5 text-blue-600 dark:text-blue-400">
              <CurrencyRupeeIcon className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-slate-900 dark:text-white">₹{kpis.totalSales.toLocaleString('en-IN')}</span>
            <p className="mt-1 text-xs text-slate-500">Gross counter billing revenue</p>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Invoices Billed</span>
            <div className="rounded-xl bg-indigo-100 dark:bg-indigo-950/50 p-2.5 text-indigo-600 dark:text-indigo-400">
              <ShoppingBagIcon className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-slate-900 dark:text-white">{kpis.totalOrders} orders</span>
            <p className="mt-1 text-xs text-slate-500">Completed counter checkout transactions</p>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Udhaar Outstanding</span>
            <div className="rounded-xl bg-rose-100 dark:bg-rose-950/50 p-2.5 text-rose-600 dark:text-rose-400">
              <BookOpenIcon className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-rose-600 dark:text-rose-400">₹{kpis.totalUdharOutstanding.toLocaleString('en-IN')}</span>
            <p className="mt-1 text-xs text-slate-500">Pending customer debt balance</p>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Customer Base</span>
            <div className="rounded-xl bg-purple-100 dark:bg-purple-950/50 p-2.5 text-purple-600 dark:text-purple-400">
              <UserGroupIcon className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-slate-900 dark:text-white">{kpis.totalCustomers} profiles</span>
            <p className="mt-1 text-xs text-slate-500">Registered store customers</p>
          </div>
        </motion.div>
      </div>

      {/* Analytics Chart & Recent Bills */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Daily Sales & Udhaar Trend</h3>
              <p className="text-xs text-slate-500">Revenue split between cash/UPI vs credit udhaar billing</p>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesTrend}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <XAxis dataKey="day" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip />
                <Area type="monotone" dataKey="Sales" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} />
                <Area type="monotone" dataKey="Udhar" stroke="#f43f5e" fill="#f43f5e" fillOpacity={0.2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Recent POS Invoices</h3>
            <button onClick={() => navigate('/dashboard/sales')} className="text-xs font-bold text-blue-600 hover:underline">View All</button>
          </div>

          <div className="space-y-3">
            {recentSales.length === 0 ? (
              <p className="text-sm text-slate-500 py-8 text-center">No recent POS billing records found.</p>
            ) : (
              recentSales.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                  <div>
                    <p className="font-semibold text-sm text-slate-800 dark:text-slate-200">{item.invoice_number || `INV-#${item.id}`}</p>
                    <p className="text-xs text-slate-500">{item.customer_name || 'Walk-in Customer'} • {item.payment_mode || 'Cash'}</p>
                  </div>
                  <span className="font-bold text-sm text-emerald-600 dark:text-emerald-400">₹{Number(item.total_amount || item.total || 0).toLocaleString('en-IN')}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Quick Action Navigation Buttons */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <button onClick={() => navigate('/dashboard/sales')} className="flex items-center gap-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 hover:border-blue-500 hover:shadow-md transition-all">
          <div className="rounded-xl bg-blue-100 dark:bg-blue-950/50 p-3 text-blue-600">
            <ShoppingBagIcon className="h-6 w-6" />
          </div>
          <div className="text-left">
            <p className="font-bold text-sm text-slate-900 dark:text-white">POS Billing Register</p>
            <p className="text-xs text-slate-500">Checkout & Print Receipts</p>
          </div>
        </button>

        <button onClick={() => navigate('/dashboard/borrow')} className="flex items-center gap-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 hover:border-rose-500 hover:shadow-md transition-all">
          <div className="rounded-xl bg-rose-100 dark:bg-rose-950/50 p-3 text-rose-600">
            <BookOpenIcon className="h-6 w-6" />
          </div>
          <div className="text-left">
            <p className="font-bold text-sm text-slate-900 dark:text-white">Udhaar Management</p>
            <p className="text-xs text-slate-500">Customer Debt & Paybacks</p>
          </div>
        </button>

        <button onClick={() => navigate('/dashboard/customers')} className="flex items-center gap-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 hover:border-purple-500 hover:shadow-md transition-all">
          <div className="rounded-xl bg-purple-100 dark:bg-purple-950/50 p-3 text-purple-600">
            <UserGroupIcon className="h-6 w-6" />
          </div>
          <div className="text-left">
            <p className="font-bold text-sm text-slate-900 dark:text-white">Customer Master</p>
            <p className="text-xs text-slate-500">Customer Profiles & Logs</p>
          </div>
        </button>

        <button onClick={() => navigate('/dashboard/reports')} className="flex items-center gap-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 hover:border-emerald-500 hover:shadow-md transition-all">
          <div className="rounded-xl bg-emerald-100 dark:bg-emerald-950/50 p-3 text-emerald-600">
            <ChartBarIcon className="h-6 w-6" />
          </div>
          <div className="text-left">
            <p className="font-bold text-sm text-slate-900 dark:text-white">Sales Reports</p>
            <p className="text-xs text-slate-500">Revenue Analytics & Margins</p>
          </div>
        </button>
      </div>
    </div>
  );
};

export default SalesManagerDashboard;
