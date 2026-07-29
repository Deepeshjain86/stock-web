import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  ShoppingBagIcon,
  UserGroupIcon,
  BookOpenIcon,
  ArrowPathIcon,
  PlusIcon,
  CurrencyRupeeIcon
} from '@heroicons/react/24/outline';
import { useAppSelector } from '../../store/hooks';
import { reportsAPI, salesAPI, customersAPI, borrowAPI } from '../../services/api';
import Loader from '../../components/common/Loader';

const SalesEmployeeDashboard = () => {
  const { user } = useAppSelector((state) => state.auth);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [kpis, setKpis] = useState({
    mySalesToday: 0,
    totalBillsToday: 0,
    totalCustomers: 0
  });

  const [recentSales, setRecentSales] = useState([]);

  const loadData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const [kpiRes, salesRes, customerRes] = await Promise.all([
        reportsAPI.getKPIs().catch(() => null),
        salesAPI.getAll().catch(() => null),
        customersAPI.getAll().catch(() => null)
      ]);

      if (kpiRes?.success && kpiRes.kpis) {
        setKpis(prev => ({
          ...prev,
          mySalesToday: kpiRes.kpis.totalSales || prev.mySalesToday,
          totalBillsToday: kpiRes.kpis.totalOrders || prev.totalBillsToday,
          totalCustomers: kpiRes.kpis.totalCustomers || prev.totalCustomers
        }));
      }

      if (salesRes?.success && salesRes.sales) {
        setRecentSales(salesRes.sales.slice(0, 5));
        setKpis(prev => ({
          ...prev,
          totalBillsToday: salesRes.sales.length
        }));
      }

      if (customerRes?.success && customerRes.customers) {
        setKpis(prev => ({ ...prev, totalCustomers: customerRes.customers.length }));
      }
    } catch (err) {
      console.error('Sales Employee Dashboard error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader size="lg" text="Loading POS Counter..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl bg-gradient-to-r from-blue-800 to-indigo-900 p-6 text-white shadow-xl">
        <div>
          <span className="rounded-full bg-blue-500/20 px-3 py-1 text-xs font-semibold text-blue-300 border border-blue-500/30">
            POS COUNTER REGISTER
          </span>
          <h1 className="mt-2 text-2xl font-black tracking-tight text-white sm:text-3xl">
            Counter POS Billing Desk
          </h1>
          <p className="mt-1 text-sm text-blue-100/80">
            Cashier: <span className="font-bold text-white">{user?.name}</span> ({user?.department || 'Sales'} Department)
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => loadData(true)}
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
            Open Billing POS
          </button>
        </div>
      </div>

      {/* Operational KPI Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Counter Revenue</span>
            <div className="rounded-xl bg-emerald-100 dark:bg-emerald-950/50 p-2.5 text-emerald-600">
              <CurrencyRupeeIcon className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-slate-900 dark:text-white">₹{kpis.mySalesToday.toLocaleString('en-IN')}</span>
            <p className="mt-1 text-xs text-slate-500">Total processed billings</p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Billed Invoices</span>
            <div className="rounded-xl bg-blue-100 dark:bg-blue-950/50 p-2.5 text-blue-600">
              <ShoppingBagIcon className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-slate-900 dark:text-white">{kpis.totalBillsToday} bills</span>
            <p className="mt-1 text-xs text-slate-500">Counter transactions</p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Store Customers</span>
            <div className="rounded-xl bg-purple-100 dark:bg-purple-950/50 p-2.5 text-purple-600">
              <UserGroupIcon className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-slate-900 dark:text-white">{kpis.totalCustomers} profiles</span>
            <p className="mt-1 text-xs text-slate-500">Registered store customer profiles</p>
          </div>
        </div>
      </div>

      {/* Quick Action Navigation & Recent Counter Receipts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Recent POS Billing Receipts</h3>
            <button onClick={() => navigate('/dashboard/sales')} className="text-xs font-bold text-blue-600 hover:underline">View All</button>
          </div>

          <div className="space-y-3">
            {recentSales.length === 0 ? (
              <p className="text-sm text-slate-500 py-8 text-center">No counter billing records found.</p>
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

        <div className="space-y-4">
          <button onClick={() => navigate('/dashboard/sales')} className="w-full flex items-center gap-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 hover:border-blue-500 hover:shadow-lg transition-all text-left">
            <div className="rounded-xl bg-blue-500 p-3 text-white">
              <ShoppingBagIcon className="h-6 w-6" />
            </div>
            <div>
              <p className="font-bold text-base text-slate-900 dark:text-white">Start POS Billing</p>
              <p className="text-xs text-slate-500">Scan barcodes & checkout bills</p>
            </div>
          </button>

          <button onClick={() => navigate('/dashboard/borrow')} className="w-full flex items-center gap-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 hover:border-rose-500 hover:shadow-lg transition-all text-left">
            <div className="rounded-xl bg-rose-500 p-3 text-white">
              <BookOpenIcon className="h-6 w-6" />
            </div>
            <div>
              <p className="font-bold text-base text-slate-900 dark:text-white">Record Udhaar</p>
              <p className="text-xs text-slate-500">Log customer credit borrowing</p>
            </div>
          </button>

          <button onClick={() => navigate('/dashboard/customers')} className="w-full flex items-center gap-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 hover:border-purple-500 hover:shadow-lg transition-all text-left">
            <div className="rounded-xl bg-purple-500 p-3 text-white">
              <UserGroupIcon className="h-6 w-6" />
            </div>
            <div>
              <p className="font-bold text-base text-slate-900 dark:text-white">Add New Customer</p>
              <p className="text-xs text-slate-500">Register customer account</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SalesEmployeeDashboard;
