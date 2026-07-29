import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  ShoppingBagIcon,
  TruckIcon,
  CubeIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  PlusIcon,
  CurrencyRupeeIcon,
  DocumentTextIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';
import { useAppSelector } from '../../store/hooks';
import { reportsAPI, salesAPI, purchasesAPI, stockAPI } from '../../services/api';
import Loader from '../../components/common/Loader';

const GeneralEmployeeDashboard = () => {
  const { user } = useAppSelector((state) => state.auth);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [kpis, setKpis] = useState({
    mySalesToday: 0,
    totalPurchasesToday: 0,
    totalOrdersToday: 0,
    lowStockCount: 0,
  });

  const [recentSales, setRecentSales] = useState([]);
  const [recentPurchases, setRecentPurchases] = useState([]);
  const [lowStockAlerts, setLowStockAlerts] = useState([]);

  const loadData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const [kpiRes, salesRes, purchaseRes, stockAlertRes] = await Promise.all([
        reportsAPI.getKPIs().catch(() => null),
        salesAPI.getAll().catch(() => null),
        purchasesAPI.getAll().catch(() => null),
        stockAPI.getAlerts().catch(() => null)
      ]);

      let salesTotal = 0;
      let salesCount = 0;
      if (salesRes?.success && salesRes.sales) {
        const salesList = salesRes.sales || [];
        salesCount = salesList.length;
        salesTotal = salesList.reduce((acc, curr) => acc + Number(curr.grand_total || curr.total || 0), 0);
        setRecentSales(salesList.slice(0, 5));
      }

      let purchaseTotal = 0;
      if (purchaseRes?.success && purchaseRes.purchases) {
        const purList = purchaseRes.purchases || [];
        purchaseTotal = purList.reduce((acc, curr) => acc + Number(curr.total || 0), 0);
        setRecentPurchases(purList.slice(0, 5));
      }

      let lowStockItems = [];
      if (stockAlertRes?.success && stockAlertRes.alerts) {
        lowStockItems = Array.isArray(stockAlertRes.alerts)
          ? stockAlertRes.alerts
          : (stockAlertRes.alerts.lowStock || []);
        setLowStockAlerts(lowStockItems.slice(0, 5));
      }

      setKpis({
        mySalesToday: salesTotal || kpiRes?.kpis?.totalSales || 0,
        totalPurchasesToday: purchaseTotal || kpiRes?.kpis?.totalPurchases || 0,
        totalOrdersToday: salesCount || kpiRes?.kpis?.totalOrders || 0,
        lowStockCount: lowStockItems.length || kpiRes?.kpis?.lowStock || 0,
      });

    } catch (err) {
      console.error('General Employee Dashboard load error:', err);
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
        <Loader size="lg" text="Loading Store Operations Workspace..." />
      </div>
    );
  }

  return (
    <div className="space-y-6 select-none font-sans">
      {/* ── HEADER BANNER ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl bg-gradient-to-r from-emerald-800 via-teal-800 to-indigo-900 p-6 text-white shadow-xl border border-emerald-700/50">
        <div>
          <span className="rounded-full bg-emerald-400/20 px-3 py-1 text-xs font-black tracking-widest text-emerald-200 border border-emerald-400/30 uppercase">
            OPERATIONS &amp; STORE DESK
          </span>
          <h1 className="mt-2 text-2xl font-black tracking-tight text-white sm:text-3xl">
            Store Staff Operations Desk
          </h1>
          <p className="mt-1 text-xs text-emerald-100/90 font-medium">
            Staff Operator: <span className="font-bold text-white">{user?.name}</span> • Access: <span className="font-bold text-emerald-300">Sales &amp; Purchase Operations</span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="flex items-center gap-1.5 rounded-xl bg-white/10 px-3.5 py-2 text-xs font-bold text-white backdrop-blur-md hover:bg-white/20 active:scale-95 transition-all"
          >
            <ArrowPathIcon className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>

          <button
            onClick={() => navigate('/dashboard/sales')}
            className="flex items-center gap-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 px-4 py-2 text-xs font-black text-white shadow-lg active:scale-95 transition-all cursor-pointer"
          >
            <PlusIcon className="w-4 h-4 stroke-[3]" />
            New POS Sale
          </button>

          <button
            onClick={() => navigate('/dashboard/stock')}
            className="flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-xs font-black text-white shadow-lg active:scale-95 transition-all cursor-pointer"
          >
            <PlusIcon className="w-4 h-4 stroke-[3]" />
            Purchase / Stock Entry
          </button>
        </div>
      </div>

      {/* ── 4 CORE OPERATIONAL KPIS ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* KPI 1: Today's Sales */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm hover:shadow-md transition-all"
        >
          <div className="flex items-center justify-between">
            <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/60 p-3 border border-emerald-100 dark:border-emerald-800">
              <CurrencyRupeeIcon className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <span className="text-[10px] font-black text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-full uppercase">
              Sales Output
            </span>
          </div>
          <p className="mt-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Sales Desk</p>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">
            ₹{kpis.mySalesToday.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </motion.div>

        {/* KPI 2: Today's Purchases */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm hover:shadow-md transition-all"
        >
          <div className="flex items-center justify-between">
            <div className="rounded-xl bg-indigo-50 dark:bg-indigo-950/60 p-3 border border-indigo-100 dark:border-indigo-800">
              <TruckIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <span className="text-[10px] font-black text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-1 rounded-full uppercase">
              Purchase Inward
            </span>
          </div>
          <p className="mt-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Purchases Inward</p>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">
            ₹{kpis.totalPurchasesToday.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </motion.div>

        {/* KPI 3: Orders Count */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm hover:shadow-md transition-all"
        >
          <div className="flex items-center justify-between">
            <div className="rounded-xl bg-blue-50 dark:bg-blue-950/60 p-3 border border-blue-100 dark:border-blue-800">
              <ShoppingBagIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <span className="text-[10px] font-black text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 px-2.5 py-1 rounded-full uppercase">
              Transactions
            </span>
          </div>
          <p className="mt-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Sales Orders</p>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">
            {kpis.totalOrdersToday} Invoices
          </p>
        </motion.div>

        {/* KPI 4: Low Stock Alert */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-2xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/30 p-5 shadow-sm hover:shadow-md transition-all"
        >
          <div className="flex items-center justify-between">
            <div className="rounded-xl bg-amber-100 dark:bg-amber-900/60 p-3 border border-amber-200 dark:border-amber-800">
              <ExclamationTriangleIcon className="w-6 h-6 text-amber-700 dark:text-amber-300" />
            </div>
            <span className="text-[10px] font-black text-amber-800 dark:text-amber-200 bg-amber-100 dark:bg-amber-900/60 px-2.5 py-1 rounded-full uppercase">
              Stock Warning
            </span>
          </div>
          <p className="mt-4 text-xs font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider">Low Stock Items</p>
          <p className="text-2xl font-black text-amber-900 dark:text-amber-100 mt-0.5">
            {kpis.lowStockCount} Products
          </p>
        </motion.div>
      </div>

      {/* ── TWO COLUMN LAYOUT: RECENT SALES & RECENT PURCHASES ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Sales Register */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                <ShoppingBagIcon className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">Recent POS Counter Sales</h3>
            </div>
            <button onClick={() => navigate('/dashboard/sales')} className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline">
              View All Sales →
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-[10px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                  <th className="pb-2">Invoice #</th>
                  <th className="pb-2">Date</th>
                  <th className="pb-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-semibold text-slate-700 dark:text-slate-300">
                {recentSales.map((s, idx) => (
                  <tr key={s.id || idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-2.5 font-bold text-slate-900 dark:text-white">{s.invoice_no || s.invoiceNo || `INV-${s.id}`}</td>
                    <td className="py-2.5 text-slate-500">{s.created_at ? new Date(s.created_at).toLocaleDateString() : 'Today'}</td>
                    <td className="py-2.5 text-right font-black text-emerald-600 dark:text-emerald-400">₹{Number(s.grand_total || s.total || 0).toFixed(2)}</td>
                  </tr>
                ))}
                {recentSales.length === 0 && (
                  <tr>
                    <td colSpan={3} className="py-6 text-center text-slate-400">No sales transactions logged today.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Purchase Entries */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                <TruckIcon className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">Recent Purchase &amp; GRN Receipts</h3>
            </div>
            <button onClick={() => navigate('/dashboard/stock')} className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
              Manage Stock →
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-[10px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                  <th className="pb-2">Purchase #</th>
                  <th className="pb-2">Vendor</th>
                  <th className="pb-2 text-right">Total Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-semibold text-slate-700 dark:text-slate-300">
                {recentPurchases.map((p, idx) => (
                  <tr key={p.id || idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-2.5 font-bold text-slate-900 dark:text-white">{p.purchase_no || p.purchaseNo || `PUR-${p.id}`}</td>
                    <td className="py-2.5 text-slate-500">{p.vendor_name || p.vendor || 'Supplier'}</td>
                    <td className="py-2.5 text-right font-black text-indigo-600 dark:text-indigo-400">₹{Number(p.total || 0).toFixed(2)}</td>
                  </tr>
                ))}
                {recentPurchases.length === 0 && (
                  <tr>
                    <td colSpan={3} className="py-6 text-center text-slate-400">No purchase receipts logged today.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GeneralEmployeeDashboard;
