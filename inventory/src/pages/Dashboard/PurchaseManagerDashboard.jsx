import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  TruckIcon,
  ExclamationTriangleIcon,
  CubeIcon,
  ArrowPathIcon,
  CurrencyRupeeIcon,
  PlusIcon,
  DocumentTextIcon,
  ClipboardDocumentCheckIcon
} from '@heroicons/react/24/outline';
import { useAppSelector } from '../../store/hooks';
import { reportsAPI, stockAPI, purchasesAPI, vendorsAPI } from '../../services/api';
import Loader from '../../components/common/Loader';

const PurchaseManagerDashboard = () => {
  const { user } = useAppSelector((state) => state.auth);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [kpis, setKpis] = useState({
    totalPurchases: 0,
    inventoryValuation: 0,
    lowStock: 0,
    outOfStock: 0,
    totalVendors: 0,
    pendingInvoices: 0
  });

  const [alerts, setAlerts] = useState([]);
  const [purchaseTrend, setPurchaseTrend] = useState([
    { day: 'Mon', Purchases: 15000, GRN: 12000 },
    { day: 'Tue', Purchases: 22000, GRN: 18000 },
    { day: 'Wed', Purchases: 18000, GRN: 16000 },
    { day: 'Thu', Purchases: 29000, GRN: 24000 },
    { day: 'Fri', Purchases: 35000, GRN: 31000 },
    { day: 'Sat', Purchases: 42000, GRN: 38000 },
    { day: 'Sun', Purchases: 25000, GRN: 21000 },
  ]);

  const loadPurchaseData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const [kpiRes, alertRes, purchaseRes, vendorRes] = await Promise.all([
        reportsAPI.getKPIs().catch(() => null),
        stockAPI.getAlerts().catch(() => null),
        purchasesAPI.getAll().catch(() => null),
        vendorsAPI.getAll().catch(() => null)
      ]);

      if (kpiRes?.success && kpiRes.kpis) {
        setKpis(prev => ({
          ...prev,
          totalPurchases: kpiRes.kpis.totalPurchases ?? prev.totalPurchases,
          inventoryValuation: kpiRes.kpis.inventoryValuation ?? prev.inventoryValuation,
          lowStock: kpiRes.kpis.lowStock ?? prev.lowStock,
          outOfStock: kpiRes.kpis.outOfStock ?? prev.outOfStock,
          totalVendors: kpiRes.kpis.totalVendors ?? prev.totalVendors
        }));
      }

      if (alertRes?.success && alertRes.alerts) {
        const alertList = Array.isArray(alertRes.alerts)
          ? alertRes.alerts
          : (alertRes.alerts.lowStock || []);
        setAlerts(alertList.slice(0, 5));
      }

      if (purchaseRes?.success && purchaseRes.purchases) {
        setKpis(prev => ({
          ...prev,
          pendingInvoices: purchaseRes.purchases.filter(p => p.payment_status === 'Pending').length
        }));
      }

      if (vendorRes?.success && vendorRes.vendors) {
        setKpis(prev => ({ ...prev, totalVendors: vendorRes.vendors.length }));
      }
    } catch (err) {
      console.error('Purchase Dashboard fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadPurchaseData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader size="lg" text="Loading Purchase Manager Operations..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-900 p-6 text-white shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-300 border border-emerald-500/30">
              PURCHASE & INVENTORY MANAGEMENT CENTER
            </span>
          </div>
          <h1 className="mt-2 text-2xl font-black tracking-tight text-white sm:text-3xl">
            Purchase Operations Dashboard
          </h1>
          <p className="mt-1 text-sm text-emerald-100/80">
            Welcome back, <span className="font-bold text-white">{user?.name}</span>. Manage procurement, vendor accounts, and warehouse inventory receipts.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => loadPurchaseData(true)}
            disabled={refreshing}
            className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-sm font-semibold text-white backdrop-blur-md hover:bg-white/20 active:scale-95 transition-all"
          >
            <ArrowPathIcon className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => navigate('/dashboard/purchases')}
            className="flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-500/30 hover:bg-emerald-400 active:scale-95 transition-all"
          >
            <PlusIcon className="h-5 w-5" />
            New Purchase GRN
          </button>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Total Purchase Value</span>
            <div className="rounded-xl bg-emerald-100 dark:bg-emerald-950/50 p-2.5 text-emerald-600 dark:text-emerald-400">
              <CurrencyRupeeIcon className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-slate-900 dark:text-white">₹{kpis.totalPurchases.toLocaleString('en-IN')}</span>
            <p className="mt-1 text-xs text-slate-500">Cumulative procurement cost</p>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Inventory Valuation</span>
            <div className="rounded-xl bg-teal-100 dark:bg-teal-950/50 p-2.5 text-teal-600 dark:text-teal-400">
              <CubeIcon className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-slate-900 dark:text-white">₹{kpis.inventoryValuation.toLocaleString('en-IN')}</span>
            <p className="mt-1 text-xs text-slate-500">Total warehouse stock value</p>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Low Stock Alerts</span>
            <div className="rounded-xl bg-amber-100 dark:bg-amber-950/50 p-2.5 text-amber-600 dark:text-amber-400">
              <ExclamationTriangleIcon className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-amber-600 dark:text-amber-400">{kpis.lowStock} items</span>
            <p className="mt-1 text-xs text-slate-500">Requires immediate reorder</p>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Active Suppliers</span>
            <div className="rounded-xl bg-blue-100 dark:bg-blue-950/50 p-2.5 text-blue-600 dark:text-blue-400">
              <TruckIcon className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-slate-900 dark:text-white">{kpis.totalVendors} vendors</span>
            <p className="mt-1 text-xs text-slate-500">Registered supplier network</p>
          </div>
        </motion.div>
      </div>

      {/* Analytics Chart & Low Stock Warnings */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Procurement & GRN Trend</h3>
              <p className="text-xs text-slate-500">Weekly breakdown of purchases vs warehouse inward receipts</p>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={purchaseTrend}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <XAxis dataKey="day" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip />
                <Bar dataKey="Purchases" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="GRN" fill="#0d9488" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Urgent Reorder Alerts</h3>
            <button onClick={() => navigate('/dashboard/stock')} className="text-xs font-bold text-emerald-600 hover:underline">View All</button>
          </div>

          <div className="space-y-3">
            {alerts.length === 0 ? (
              <p className="text-sm text-slate-500 py-8 text-center">No urgent reorder alerts found.</p>
            ) : (
              alerts.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                  <div>
                    <p className="font-semibold text-sm text-slate-800 dark:text-slate-200">{item.name}</p>
                    <p className="text-xs text-slate-500">Stock: <span className="font-bold text-amber-600">{item.current_stock}</span> / Min: {item.min_stock_level}</p>
                  </div>
                  <button onClick={() => navigate('/dashboard/purchases')} className="px-3 py-1 text-xs font-bold rounded-lg bg-emerald-500 text-white hover:bg-emerald-600">Reorder</button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Quick Action Navigation Buttons */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <button onClick={() => navigate('/dashboard/purchases')} className="flex items-center gap-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 hover:border-emerald-500 hover:shadow-md transition-all">
          <div className="rounded-xl bg-emerald-100 dark:bg-emerald-950/50 p-3 text-emerald-600">
            <DocumentTextIcon className="h-6 w-6" />
          </div>
          <div className="text-left">
            <p className="font-bold text-sm text-slate-900 dark:text-white">Purchase Orders</p>
            <p className="text-xs text-slate-500">View & Create Invoices</p>
          </div>
        </button>

        <button onClick={() => navigate('/dashboard/stock')} className="flex items-center gap-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 hover:border-emerald-500 hover:shadow-md transition-all">
          <div className="rounded-xl bg-teal-100 dark:bg-teal-950/50 p-3 text-teal-600">
            <CubeIcon className="h-6 w-6" />
          </div>
          <div className="text-left">
            <p className="font-bold text-sm text-slate-900 dark:text-white">Stock Management</p>
            <p className="text-xs text-slate-500">Inventory Audits & GRN</p>
          </div>
        </button>

        <button onClick={() => navigate('/dashboard/vendors')} className="flex items-center gap-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 hover:border-emerald-500 hover:shadow-md transition-all">
          <div className="rounded-xl bg-blue-100 dark:bg-blue-950/50 p-3 text-blue-600">
            <TruckIcon className="h-6 w-6" />
          </div>
          <div className="text-left">
            <p className="font-bold text-sm text-slate-900 dark:text-white">Supplier Master</p>
            <p className="text-xs text-slate-500">Manage Vendor Accounts</p>
          </div>
        </button>

        <button onClick={() => navigate('/dashboard/reports')} className="flex items-center gap-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 hover:border-emerald-500 hover:shadow-md transition-all">
          <div className="rounded-xl bg-purple-100 dark:bg-purple-950/50 p-3 text-purple-600">
            <ClipboardDocumentCheckIcon className="h-6 w-6" />
          </div>
          <div className="text-left">
            <p className="font-bold text-sm text-slate-900 dark:text-white">Purchase Reports</p>
            <p className="text-xs text-slate-500">Analytics & Stock Logs</p>
          </div>
        </button>
      </div>
    </div>
  );
};

export default PurchaseManagerDashboard;
