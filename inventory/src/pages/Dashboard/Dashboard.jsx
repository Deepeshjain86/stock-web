import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from 'recharts';
import {
  CurrencyRupeeIcon,
  ExclamationTriangleIcon,
  ShoppingBagIcon,
  UserGroupIcon,
  CalendarDaysIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  BuildingStorefrontIcon,
  ChartBarIcon,
  ArrowPathIcon,
  CubeIcon,
} from '@heroicons/react/24/outline';
import { useAppSelector } from '../../store/hooks';
import { reportsAPI, stockAPI } from '../../services/api';
import Loader from '../../components/common/Loader';
import PurchaseManagerDashboard from './PurchaseManagerDashboard';
import SalesManagerDashboard from './SalesManagerDashboard';
import PurchaseEmployeeDashboard from './PurchaseEmployeeDashboard';
import SalesEmployeeDashboard from './SalesEmployeeDashboard';
import GeneralEmployeeDashboard from './GeneralEmployeeDashboard';

const Dashboard = () => {
  const { user } = useAppSelector((state) => state.auth);
  const { isDarkMode } = useAppSelector((state) => state.theme);
  const navigate = useNavigate();

  if (user?.role === 'Purchase Manager') {
    return <PurchaseManagerDashboard />;
  }
  if (user?.role === 'Sales Manager') {
    return <SalesManagerDashboard />;
  }
  if (user?.role === 'Purchase Employee') {
    return <PurchaseEmployeeDashboard />;
  }
  if (user?.role === 'Sales Employee') {
    return <SalesEmployeeDashboard />;
  }
  if (user?.role === 'Employee') {
    if (user?.department === 'Purchase') {
      return <PurchaseEmployeeDashboard />;
    }
    if (user?.department === 'Sales') {
      return <SalesEmployeeDashboard />;
    }
    return <GeneralEmployeeDashboard />;
  }

  const [loading, setLoading] = useState(true);
  const [dbOffline, setDbOffline] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [kpis, setKpis] = useState({
    totalSales: 0,
    totalPurchases: 0,
    lowStock: 0,
    outOfStock: 0,
    totalOrders: 0,
    totalCustomers: 0,
    inventoryValuation: 0,
    profit: 0,
    nearExpiry: 0,
    inventoryAdjustmentGain: 0,
    inventoryAdjustmentLoss: 0,
    netInventoryAdjustment: 0,
  });

  const [todayKpis, setTodayKpis] = useState({ totalSales: 0, totalOrders: 0, profit: 0 });

  const [categoryBreakdownData, setCategoryBreakdownData] = useState([]);
  const [monthlySalesTrend, setMonthlySalesTrend] = useState([]);

  const fetchDashboardData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    const todayStr = (() => {
      const d = new Date();
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    })();

    try {
      const [kpiRes, alertRes, chartRes, todayKpiRes] = await Promise.all([
        reportsAPI.getKPIs(),
        stockAPI.getAlerts(),
        reportsAPI.getCharts().catch(() => null),
        reportsAPI.getKPIs({ startDate: todayStr, endDate: todayStr }).catch(() => null),
      ]);

      let updatedKpis = { ...kpis };

      if (kpiRes?.success && kpiRes.kpis) {
        updatedKpis = {
          totalSales: kpiRes.kpis.totalSales ?? 0,
          totalPurchases: kpiRes.kpis.totalPurchases ?? 0,
          totalOrders: kpiRes.kpis.totalOrders ?? 0,
          totalCustomers: kpiRes.kpis.totalCustomers ?? 0,
          inventoryValuation: kpiRes.kpis.inventoryValuation ?? 0,
          profit: kpiRes.kpis.profit ?? 0,
          lowStock: kpiRes.kpis.lowStock ?? 0,
          outOfStock: kpiRes.kpis.outOfStock ?? 0,
          nearExpiry: kpiRes.kpis.nearExpiry ?? 0,
          inventoryAdjustmentGain: kpiRes.kpis.inventoryAdjustmentGain ?? 0,
          inventoryAdjustmentLoss: kpiRes.kpis.inventoryAdjustmentLoss ?? 0,
          netInventoryAdjustment: kpiRes.kpis.netInventoryAdjustment ?? 0,
        };

        const catDistList = kpiRes.categoryDist || chartRes?.charts?.categoryDist;
        if (catDistList && catDistList.length > 0) {
          const colors = ['#6366F1', '#F59E0B', '#10B981', '#3B82F6', '#EC4899', '#8B5CF6'];
          const mappedDist = catDistList
            .filter(c => Number(c.value) > 0)
            .map((c, i) => ({ name: c.name, value: Number(c.value), color: colors[i % colors.length] }));
          setCategoryBreakdownData(mappedDist);
        } else {
          setCategoryBreakdownData([]);
        }
      } else {
        setCategoryBreakdownData([]);
      }

      if (alertRes?.success && alertRes.alerts) {
        if (alertRes.alerts.lowStock) {
          updatedKpis.lowStock = alertRes.alerts.lowStock.length;
        }
        if (alertRes.alerts.outOfStock) {
          updatedKpis.outOfStock = alertRes.alerts.outOfStock.length;
        }
        if (alertRes.alerts.nearExpiry) {
          updatedKpis.nearExpiry = alertRes.alerts.nearExpiry.length;
        }
      }

      if (chartRes?.success && Array.isArray(chartRes.charts?.monthlyTrends) && chartRes.charts.monthlyTrends.length > 0) {
        setMonthlySalesTrend(chartRes.charts.monthlyTrends);
      } else {
        setMonthlySalesTrend([]);
      }

      // Update Today's Store Summary KPIs
      if (todayKpiRes?.success && todayKpiRes.kpis) {
        setTodayKpis({
          totalSales: todayKpiRes.kpis.totalSales ?? 0,
          totalOrders: todayKpiRes.kpis.totalOrders ?? 0,
          profit: todayKpiRes.kpis.profit ?? 0,
        });
      }

      setKpis(updatedKpis);
      setDbOffline(false);
    } catch (error) {
      console.warn('Dashboard API failed', error);
      setDbOffline(true);
      setCategoryBreakdownData([]);
      setMonthlySalesTrend([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const handleEventUpdate = () => {
      fetchDashboardData(true);
    };
    window.addEventListener('stock-changed', handleEventUpdate);
    window.addEventListener('inventory-updated', handleEventUpdate);
    window.addEventListener('sales-updated', handleEventUpdate);

    // Auto-poll every 60 seconds as guaranteed real-time fallback
    const pollingInterval = setInterval(() => {
      fetchDashboardData(true);
    }, 60000);

    return () => {
      window.removeEventListener('stock-changed', handleEventUpdate);
      window.removeEventListener('inventory-updated', handleEventUpdate);
      window.removeEventListener('sales-updated', handleEventUpdate);
      clearInterval(pollingInterval);
    };
  }, []);

  const totalCategoryProducts = useMemo(() =>
    categoryBreakdownData.reduce((sum, item) => sum + item.value, 0),
    [categoryBreakdownData]
  );

  const categoryBreakdownWithPercentages = useMemo(() =>
    categoryBreakdownData.map(item => ({
      ...item,
      percentage: totalCategoryProducts > 0 ? Math.round((item.value / totalCategoryProducts) * 100) : 0,
    })),
    [categoryBreakdownData, totalCategoryProducts]
  );

  const topCategoryPct = useMemo(() => {
    if (totalCategoryProducts === 0) return '0%';
    const maxVal = Math.max(...categoryBreakdownData.map(i => i.value), 0);
    return `${Math.round((maxVal / totalCategoryProducts) * 100)}%`;
  }, [categoryBreakdownData, totalCategoryProducts]);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.06 } },
  };
  const cardVariants = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 90, damping: 14 } },
  };

  if (loading && !dbOffline) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] gap-3">
        <Loader size="lg" />
        <p className="text-sm font-semibold text-slate-500 animate-pulse">Loading Dashboard...</p>
      </div>
    );
  }

  // KPI card definitions with 100% dynamic values
  const kpiCards = [
    {
      label: "Total Revenue",
      value: `₹${(kpis.totalSales || 0).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
      icon: CurrencyRupeeIcon,
      iconBg: 'bg-indigo-50 text-indigo-600 border-indigo-100',
      bar: { color: 'from-indigo-500 to-violet-500', width: kpis.totalSales > 0 ? '100%' : '0%' },
      badge: { text: kpis.totalSales > 0 ? '✓ Net Sales' : '0 Sales Billed', color: kpis.totalSales > 0 ? 'text-emerald-600' : 'text-slate-400' },
      badgeSub: '',
      onClick: () => navigate('/dashboard/reports'),
    },
    {
      label: "Total Purchases",
      value: `₹${(kpis.totalPurchases || 0).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
      icon: ShoppingBagIcon,
      iconBg: 'bg-blue-50 text-blue-600 border-blue-100',
      bar: { color: 'bg-blue-500', width: kpis.totalPurchases > 0 ? '100%' : '0%' },
      badge: { text: `${kpis.totalOrders || 0} Orders`, color: 'text-blue-600' },
      badgeSub: 'total invoices',
      onClick: () => navigate('/dashboard/purchase'),
    },
    {
      label: "Low Stock Alerts",
      value: `${kpis.lowStock} Items`,
      icon: ExclamationTriangleIcon,
      iconBg: 'bg-amber-50 text-amber-600 border-amber-100',
      bar: { color: 'bg-amber-500', width: `${Math.min(kpis.lowStock * 10, 100)}%` },
      badge: { text: kpis.lowStock > 0 ? '⚠ Action Required' : '✓ Stock Healthy', color: kpis.lowStock > 0 ? 'text-amber-600' : 'text-emerald-600' },
      badgeSub: '',
      onClick: () => navigate('/dashboard/stock'),
    },
    {
      label: "Total Customers",
      value: (kpis.totalCustomers || 0).toLocaleString('en-IN'),
      icon: UserGroupIcon,
      iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-100',
      bar: { color: 'bg-emerald-500', width: kpis.totalCustomers > 0 ? '100%' : '0%' },
      badge: { text: kpis.totalCustomers > 0 ? `${kpis.totalCustomers} Registered` : '0 Customers', color: 'text-emerald-600' },
      badgeSub: '',
      onClick: () => navigate('/dashboard/customers'),
    },
  ];

  return (
    <motion.div
      className="space-y-6 pb-10 font-sans"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      {/* ── PAGE HEADER ── */}
      <motion.div
        variants={cardVariants}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white border border-slate-200 rounded-2xl px-6 py-5 shadow-sm"
      >
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Dashboard
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Welcome back, <span className="font-semibold text-slate-700">{user?.name?.split(' ')[0] || 'Admin'}</span> 👋 — Here's your store at a glance.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {dbOffline && (
            <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl">
              ⚡ Showing cached data
            </span>
          )}
          <button
            onClick={() => fetchDashboardData(true)}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all disabled:opacity-50"
          >
            <ArrowPathIcon className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>

          <div className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-600">
            <CalendarDaysIcon className="w-4 h-4 text-slate-400" />
            <span>{new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
          </div>
        </div>
      </motion.div>

      {/* ── KPI CARDS ── */}
      <motion.div variants={containerVariants} className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {kpiCards.map((card) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.label}
              variants={cardVariants}
              whileHover={{ y: -4, boxShadow: '0 8px 24px -8px rgba(0,0,0,0.10)' }}
              onClick={card.onClick}
              className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm cursor-pointer transition-all duration-200 flex flex-col justify-between h-[148px]"
            >
              <div className="flex items-start justify-between">
                <span className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase">{card.label}</span>
                <div className={`h-9 w-9 rounded-xl flex items-center justify-center border flex-shrink-0 ${card.iconBg}`}>
                  <Icon className="w-5 h-5 stroke-[1.8]" />
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-slate-900 tracking-tight leading-none">{card.value}</h3>
                <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden mt-2.5 mb-2">
                  <div className={`h-full rounded-full ${card.bar.color.startsWith('from-') ? `bg-gradient-to-r ${card.bar.color}` : card.bar.color}`} style={{ width: card.bar.width }} />
                </div>
                <p className="text-[11px] font-semibold flex items-center gap-1">
                  <span className={card.badge.color}>{card.badge.text}</span>
                  {card.badgeSub && <span className="text-slate-400">{card.badgeSub}</span>}
                </p>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      <motion.div variants={containerVariants} className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Inventory Value', value: `₹${Number(kpis.inventoryValuation || 0).toLocaleString('en-IN')}`, icon: CubeIcon, color: 'text-violet-600 bg-violet-50 border-violet-100' },
          { label: 'Gross Profit', value: `₹${Number(kpis.profit || 0).toLocaleString('en-IN')}`, icon: ArrowTrendingUpIcon, color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
          { label: 'Out of Stock', value: `${kpis.outOfStock}`, icon: ArrowTrendingDownIcon, color: 'text-red-600 bg-red-50 border-red-100' },
          { label: 'Near Expiry', value: `${kpis.nearExpiry} Items`, icon: CalendarDaysIcon, color: 'text-orange-600 bg-orange-50 border-orange-100' },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={item.label}
              variants={cardVariants}
              className="bg-white border border-slate-200 rounded-xl px-4 py-3.5 shadow-sm flex items-center gap-3"
            >
              <div className={`h-9 w-9 rounded-xl flex items-center justify-center border flex-shrink-0 ${item.color}`}>
                <Icon className="w-4.5 h-4.5 stroke-[1.8]" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-medium text-slate-400 truncate">{item.label}</p>
                <p className="text-sm font-bold text-slate-800 leading-tight">{item.value}</p>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* ── INVENTORY ADJUSTMENT BREAKDOWN SECTION ── */}
      <motion.div variants={cardVariants} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 border-b border-slate-100 pb-2.5 gap-2">
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Inventory Adjustment Ledger</h3>
            <p className="text-[10px] text-slate-500 font-medium">Independent stock recount gains &amp; loss variations (Separated from Purchases &amp; Sales)</p>
          </div>
          <button onClick={() => navigate('/dashboard/stock-adjustment')} className="text-xs text-indigo-600 hover:text-indigo-800 font-bold self-start sm:self-auto cursor-pointer">
            View Adjustment Logs →
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-emerald-50/60 border border-emerald-100 rounded-xl p-3.5 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">Adjustment Gain</span>
              <span className="text-lg font-black text-emerald-800 font-mono">+₹{Number(kpis.inventoryAdjustmentGain || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
            <span className="p-2 bg-emerald-100 text-emerald-800 rounded-lg text-xs font-bold">Gain</span>
          </div>

          <div className="bg-rose-50/60 border border-rose-100 rounded-xl p-3.5 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider block">Adjustment Loss</span>
              <span className="text-lg font-black text-rose-800 font-mono">-₹{Number(kpis.inventoryAdjustmentLoss || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
            <span className="p-2 bg-rose-100 text-rose-800 rounded-lg text-xs font-bold">Loss</span>
          </div>

          <div className="bg-indigo-50/60 border border-indigo-100 rounded-xl p-3.5 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider block">Net Adjustment</span>
              <span className={`text-lg font-black font-mono ${kpis.netInventoryAdjustment >= 0 ? 'text-indigo-900' : 'text-rose-700'}`}>
                {kpis.netInventoryAdjustment >= 0 ? '+' : ''}₹{Number(kpis.netInventoryAdjustment || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <span className="p-2 bg-indigo-100 text-indigo-800 rounded-lg text-xs font-bold">Net</span>
          </div>
        </div>
      </motion.div>

      {/* ── CHARTS ROW ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Sales vs Purchases Trend Chart */}
        <motion.div
          variants={cardVariants}
          className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm lg:col-span-2"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">Performance</p>
              <h2 className="text-sm font-bold text-slate-900 mt-0.5">Sales & Purchase Overview</h2>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block" />Sales
              </div>
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />Purchases
              </div>
            </div>
          </div>
          <div className="h-[1px] bg-slate-100 mb-4" />
          <div className="h-64 w-full">
            {monthlySalesTrend.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <ChartBarIcon className="w-10 h-10 text-slate-300 mb-2 stroke-1" />
                <p className="text-sm font-semibold text-slate-600">No Sales or Purchase Data Yet</p>
                <p className="text-xs text-slate-400 mt-1 max-w-xs">
                  Record sales bills or purchase invoices to display dynamic performance trends.
                </p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlySalesTrend} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366F1" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradPurchases" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#334155' : '#E2E8F0'} vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: isDarkMode ? '#CBD5E1' : '#334155', fontWeight: 600 }} stroke={isDarkMode ? '#475569' : '#94A3B8'} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: isDarkMode ? '#CBD5E1' : '#334155', fontWeight: 600 }} stroke={isDarkMode ? '#475569' : '#94A3B8'} tickLine={false} axisLine={false} tickFormatter={v => `₹${v.toLocaleString('en-IN')}`} />
                  <Tooltip
                    formatter={(v, n) => [`₹${Number(v).toLocaleString('en-IN')}`, n]}
                    contentStyle={{
                      backgroundColor: isDarkMode ? '#0F172A' : '#FFFFFF',
                      borderColor: isDarkMode ? '#334155' : '#E2E8F0',
                      color: isDarkMode ? '#F8FAFC' : '#0F172A',
                      borderRadius: 12,
                      fontSize: 11,
                      fontWeight: 600,
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                    }}
                  />
                  <Area type="monotone" dataKey="Sales" stroke="#6366F1" strokeWidth={2.5} fill="url(#gradSales)" dot={false} />
                  <Area type="monotone" dataKey="Purchases" stroke="#F59E0B" strokeWidth={2.5} fill="url(#gradPurchases)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </motion.div>

        {/* Category Donut Chart */}
        <motion.div
          variants={cardVariants}
          className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm"
        >
          <div className="mb-4">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">Inventory</p>
            <h2 className="text-sm font-bold text-slate-900 mt-0.5">Category Breakdown</h2>
          </div>
          <div className="h-[1px] bg-slate-100 mb-4" />

          {categoryBreakdownData.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <CubeIcon className="w-10 h-10 text-slate-300 mb-2 stroke-1" />
              <p className="text-sm font-semibold text-slate-600">No Category Data</p>
              <p className="text-xs text-slate-400 mt-1 max-w-xs">
                Add products with assigned categories to view stock distribution.
              </p>
            </div>
          ) : (
            <>
              <div className="h-48 relative flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryBreakdownWithPercentages}
                      cx="50%"
                      cy="50%"
                      innerRadius={56}
                      outerRadius={76}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {categoryBreakdownWithPercentages.map((entry, i) => (
                        <Cell key={`cell-${i}`} fill={entry.color} stroke="none" />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v, n, p) => [`${v} Products (${p.payload.percentage}%)`, 'Volume']} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Top</span>
                  <span className="text-2xl font-bold text-slate-900 leading-none mt-0.5">{topCategoryPct}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-3">
                {categoryBreakdownWithPercentages.map((item) => (
                  <div key={item.name} className="flex items-center gap-1.5 text-[11px] font-medium text-slate-600 bg-slate-50 border border-slate-100 px-2.5 py-1.5 rounded-xl">
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="truncate">{item.name}</span>
                    <span className="ml-auto font-bold text-slate-800 flex-shrink-0">{item.percentage}%</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </motion.div>
      </div>

      {/* ── STORE SUMMARY BANNER ── */}
      <motion.div
        variants={cardVariants}
        className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm"
      >
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center">
              <BuildingStorefrontIcon className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Store Summary</p>
                <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-50 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] font-bold text-emerald-600">LIVE</span>
                </span>
              </div>
              <p className="text-sm font-bold text-slate-800 mt-0.5">
                {user?.store_name || 'Your Kirana Store'} — {new Date().toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Today's Revenue", value: `₹${Number(todayKpis.totalSales || 0).toLocaleString('en-IN')}`, color: 'text-emerald-700' },
              { label: "Today's Orders", value: (todayKpis.totalOrders || 0).toLocaleString('en-IN'), color: 'text-indigo-700' },
              { label: "Today's Profit", value: `₹${Number(todayKpis.profit || 0).toLocaleString('en-IN')}`, color: 'text-violet-700' },
            ].map(item => (
              <div key={item.label} className="text-center px-4 border-r border-slate-100 last:border-0">
                <p className={`text-base font-bold ${item.color}`}>{item.value}</p>
                <p className="text-[11px] font-medium text-slate-400 mt-0.5">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

    </motion.div>
  );
};

export default Dashboard;