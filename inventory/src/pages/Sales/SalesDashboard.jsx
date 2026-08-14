import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  CurrencyDollarIcon,
  ShoppingBagIcon,
  ArrowTrendingUpIcon,
  ArrowPathIcon,
  ArrowDownTrayIcon,
  UserGroupIcon,
  ExclamationCircleIcon,
  ArrowUturnLeftIcon
} from '@heroicons/react/24/outline';
import StatsCard from '../../components/common/StatsCard';
import Loader from '../../components/common/Loader';
import { useAppSelector } from '../../store/hooks';
import API, { reportsAPI, usersAPI, customersAPI, productsAPI } from '../../services/api';

const SalesDashboard = () => {
  const { user } = useAppSelector((state) => state.auth);
  const { isDarkMode } = useAppSelector((state) => state.theme);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters State
  const [dateRange, setDateRange] = useState('30days'); // 'today', '7days', '30days', 'custom'
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState('all');
  const [selectedCustomer, setSelectedCustomer] = useState('all');
  const [selectedProduct, setSelectedProduct] = useState('all');
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState('all');

  // Metadata for filter dropdowns
  const [employees, setEmployees] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);

  // Dashboard Data State
  const [kpis, setKpis] = useState({
    todaySales: 0,
    todayRevenue: 0,
    todayOrders: 0,
    todayProfit: 0,
    todayReturns: 0,
    monthlySales: 0,
    monthlyRevenue: 0,
    monthlyProfit: 0,
    monthlyGrowth: 0,
    monthlyOrders: 0
  });

  const [charts, setCharts] = useState({
    daily: [],
    weekly: [],
    monthly: [],
    quarterly: [],
    yearly: [],
    topProducts: [],
    topCustomers: [],
    paymentDistribution: [],
    salesByEmployee: [],
    pendingInvoices: [],
    returnedOrders: []
  });

  const [trendScale, setTrendScale] = useState('daily'); // 'daily', 'weekly', 'monthly', 'quarterly', 'yearly'

  // Fetch filter metadata
  const fetchMetadata = async () => {
    try {
      const canManageUsers = user?.role === 'Admin' || user?.permissions?.includes('manage_users') || user?.permissions?.includes('view_staff');
      const [usersRes, custRes, prodRes] = await Promise.all([
        canManageUsers ? usersAPI.getAll().catch(() => ({ success: false, users: [] })) : Promise.resolve({ success: true, users: [] }),
        customersAPI.getAll().catch(() => ({ success: false })),
        productsAPI.getAll().catch(() => ({ success: false }))
      ]);

      if (usersRes?.success && Array.isArray(usersRes.users)) {
        // Filter users to only employee/manager level in Sales department
        setEmployees(usersRes.users.filter(u => u.role_name === 'Employee' || u.department === 'Sales'));
      }
      if (custRes.success) {
        setCustomers(custRes.customers || custRes.data || []);
      }
      if (prodRes.success) {
        setProducts(prodRes.products || prodRes.data || []);
      }
    } catch (err) {
      console.error('Failed to load filter metadata:', err);
    }
  };

  // Build query parameters for Sales Dashboard API
  const getFilterParams = () => {
    const params = {};

    let computedStart = startDate;
    let computedEnd = endDate;

    if (dateRange !== 'custom') {
      const end = new Date();
      let start = new Date();

      if (dateRange === 'today') {
        start.setHours(0, 0, 0, 0);
      } else if (dateRange === '7days') {
        start.setDate(end.getDate() - 7);
      } else if (dateRange === '30days') {
        start.setDate(end.getDate() - 30);
      }

      computedStart = start.toISOString().split('T')[0];
      computedEnd = end.toISOString().split('T')[0];
    }

    if (computedStart) params.startDate = computedStart;
    if (computedEnd) params.endDate = computedEnd;
    if (selectedEmployee !== 'all') params.employeeId = selectedEmployee;
    if (selectedCustomer !== 'all') params.customerId = selectedCustomer;
    if (selectedProduct !== 'all') params.productId = selectedProduct;
    if (selectedPaymentStatus !== 'all') params.paymentStatus = selectedPaymentStatus;

    return params;
  };

  const fetchDashboardData = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);

    try {
      const params = getFilterParams();
      const response = await API.get('/reports/sales-dashboard', { params });

      if (response.data.success) {
        setKpis(response.data.kpis);
        setCharts(response.data.charts);

        // Auto-scale trend chart label based on dateRange selection
        if (dateRange === 'today') setTrendScale('daily');
        else if (dateRange === '7days') setTrendScale('daily');
        else if (dateRange === '30days') setTrendScale('weekly');
        else setTrendScale('monthly');
      }
    } catch (err) {
      console.error('Failed to fetch sales dashboard data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMetadata();
  }, []);

  useEffect(() => {
    fetchDashboardData();
    const handleEventUpdate = () => {
      fetchDashboardData(true);
    };
    window.addEventListener('stock-changed', handleEventUpdate);
    window.addEventListener('inventory-updated', handleEventUpdate);
    window.addEventListener('sales-updated', handleEventUpdate);
    return () => {
      window.removeEventListener('stock-changed', handleEventUpdate);
      window.removeEventListener('inventory-updated', handleEventUpdate);
      window.removeEventListener('sales-updated', handleEventUpdate);
    };
  }, [dateRange, startDate, endDate, selectedEmployee, selectedCustomer, selectedProduct, selectedPaymentStatus]);

  // Export filtered transactions to CSV
  const handleExportCSV = () => {
    const data = charts.pendingInvoices.concat(charts.returnedOrders);
    if (data.length === 0) {
      alert('No sales transaction data available to export.');
      return;
    }

    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'Invoice No,Date,Customer/Product,Amount,Status/Reason\n';

    charts.pendingInvoices.forEach(inv => {
      csvContent += `${inv.invoice_no},${inv.date},${inv.customer_name},₹${inv.total},${inv.payment_status}\n`;
    });

    charts.returnedOrders.forEach(ret => {
      csvContent += `${ret.invoice_no},${new Date(ret.created_at).toLocaleDateString()},${ret.product_name},₹${ret.refund_amount},Return: ${ret.reason}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `sales_dashboard_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] gap-3">
        <Loader size="lg" />
        <p className="text-sm font-semibold text-slate-500 animate-pulse">Loading Sales Dashboard Metrics...</p>
      </div>
    );
  }

  // Get active trend data
  const trendData = charts[trendScale] || charts.daily;

  return (
    <div className="space-y-6 pb-12 select-none font-sans">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 border border-slate-200/80 rounded-2xl shadow-sm">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            📊 Sales Analytics Dashboard
            {refreshing && <ArrowPathIcon className="w-5 h-5 animate-spin text-indigo-500" />}
          </h1>
          <p className="text-xs font-medium text-slate-500 mt-0.5">Real-time daily & monthly sales KPIs, leaderboards, and tracking</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchDashboardData(true)}
            className="p-2 hover:bg-slate-100 text-slate-600 rounded-xl transition-colors border border-slate-200"
            title="Refresh Data"
          >
            <ArrowPathIcon className="w-4 h-4" />
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md shadow-indigo-500/20 active:scale-95 transition-all"
          >
            <ArrowDownTrayIcon className="w-4 h-4" /> Export Report CSV
          </button>
        </div>
      </div>

      {/* FILTER CONTROL HUB */}
      <div className="bg-white p-5 border border-slate-200 rounded-2xl shadow-sm space-y-4">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Filter Dashboard Focus</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
          
          {/* Date Preset Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Date Preset</label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 font-bold bg-slate-50"
            >
              <option value="today">Today</option>
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
              <option value="custom">Custom Date Range</option>
            </select>
          </div>

          {/* Employee Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Sales Operator</label>
            <select
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
              className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 font-semibold bg-slate-50"
            >
              <option value="all">All Employees</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.name} ({emp.department || 'Sales'})</option>
              ))}
            </select>
          </div>

          {/* Customer Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Customer</label>
            <select
              value={selectedCustomer}
              onChange={(e) => setSelectedCustomer(e.target.value)}
              className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 font-semibold bg-slate-50"
            >
              <option value="all">All Customers</option>
              {customers.map(cust => (
                <option key={cust.id} value={cust.id}>{cust.name} ({cust.phone})</option>
              ))}
            </select>
          </div>

          {/* Product Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Product sold</label>
            <select
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 font-semibold bg-slate-50"
            >
              <option value="all">All Products</option>
              {products.map(prod => (
                <option key={prod.id} value={prod.id}>{prod.name}</option>
              ))}
            </select>
          </div>

          {/* Payment Status Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Payment Status</label>
            <select
              value={selectedPaymentStatus}
              onChange={(e) => setSelectedPaymentStatus(e.target.value)}
              className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 font-bold bg-slate-50"
            >
              <option value="all">All Statuses</option>
              <option value="Paid">Paid Only</option>
              <option value="Pending">Pending / Unpaid</option>
              <option value="Failed">Failed</option>
            </select>
          </div>
        </div>

        {/* Custom Date Inputs */}
        {dateRange === 'custom' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="flex items-center gap-3 pt-3 border-t border-slate-100"
          >
            <div>
              <label className="block text-[10px] font-bold text-slate-550 uppercase tracking-wider mb-1">From Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-1.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 font-bold bg-slate-50"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-550 uppercase tracking-wider mb-1">To Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-1.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 font-bold bg-slate-50"
              />
            </div>
          </motion.div>
        )}
      </div>

      {/* SALES KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Today's Revenue" value={`₹${(kpis.todayRevenue || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`} icon={CurrencyDollarIcon} subtext="Daily Inflow Revenue" color="green" />
        <StatsCard title="Today's Orders" value={kpis.todaySales || 0} icon={ShoppingBagIcon} subtext="Receipts printed today" color="blue" />
        <StatsCard title="Today's Returns" value={`₹${(kpis.todayReturns || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`} icon={ArrowUturnLeftIcon} subtext="Refunded customer returns" color="orange" />
        <StatsCard title="Today's Profit" value={`₹${(kpis.todayProfit || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`} icon={ArrowTrendingUpIcon} subtext="Revenue - Product Cost" color="purple" />
        
        <StatsCard title="Monthly Revenue" value={`₹${(kpis.monthlyRevenue || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`} icon={CurrencyDollarIcon} subtext="This Month Overall" color="green" />
        <StatsCard title="Monthly Profit" value={`₹${(kpis.monthlyProfit || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`} icon={ArrowTrendingUpIcon} subtext="Gross margin estimate" color="purple" />
        <StatsCard title="Monthly Growth" value={`${(kpis.monthlyGrowth || 0).toFixed(1)}%`} icon={ArrowTrendingUpIcon} subtext="Growth vs Last Month" color={kpis.monthlyGrowth >= 0 ? "green" : "red"} />
        <StatsCard title="Monthly Orders" value={kpis.monthlySales || 0} icon={ShoppingBagIcon} subtext="Total receipt counts" color="blue" />
      </div>

      {/* TREND CHART LAYER */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Filtered Revenue Trends</h3>
            <p className="text-xs text-slate-400 font-medium">Interactive sales chart across time metrics</p>
          </div>
          
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
            {['daily', 'weekly', 'monthly', 'quarterly', 'yearly'].map(scale => (
              <button
                key={scale}
                onClick={() => setTrendScale(scale)}
                className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase transition-all ${
                  trendScale === scale 
                    ? 'bg-white text-indigo-600 shadow-sm' 
                    : 'text-slate-400 hover:text-slate-700'
                }`}
              >
                {scale}
              </button>
            ))}
          </div>
        </div>

        <div className="h-72">
          {trendData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSalesRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#334155' : '#E2E8F0'} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: isDarkMode ? '#CBD5E1' : '#334155', fontWeight: 600 }} stroke={isDarkMode ? '#475569' : '#94A3B8'} />
                <YAxis tick={{ fontSize: 11, fill: isDarkMode ? '#CBD5E1' : '#334155', fontWeight: 600 }} stroke={isDarkMode ? '#475569' : '#94A3B8'} />
                <Tooltip
                  formatter={(value) => `₹${value}`}
                  contentStyle={{
                    backgroundColor: isDarkMode ? '#0F172A' : '#FFFFFF',
                    borderColor: isDarkMode ? '#334155' : '#E2E8F0',
                    color: isDarkMode ? '#F8FAFC' : '#0F172A',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: '600'
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px', color: isDarkMode ? '#CBD5E1' : '#334155' }} />
                <Area type="monotone" dataKey="revenue" name="Sales Revenue" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorSalesRev)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-slate-400 font-bold">No sales logged in selected period.</div>
          )}
        </div>
      </div>

      {/* MIDDLE CHARTS ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Top selling products */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4">Top 10 Selling Products</h3>
          <div className="h-72">
            {charts.topProducts.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.topProducts} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#334155' : '#E2E8F0'} />
                  <XAxis dataKey="name" tick={{ fontSize: 9, fill: isDarkMode ? '#CBD5E1' : '#334155', fontWeight: 600 }} stroke={isDarkMode ? '#475569' : '#94A3B8'} />
                  <YAxis tick={{ fontSize: 11, fill: isDarkMode ? '#CBD5E1' : '#334155', fontWeight: 600 }} stroke={isDarkMode ? '#475569' : '#94A3B8'} />
                  <Tooltip
                    formatter={(value) => `₹${value}`}
                    contentStyle={{
                      backgroundColor: isDarkMode ? '#0F172A' : '#FFFFFF',
                      borderColor: isDarkMode ? '#334155' : '#E2E8F0',
                      color: isDarkMode ? '#F8FAFC' : '#0F172A',
                      borderRadius: '12px',
                      fontSize: '12px'
                    }}
                  />
                  <Bar dataKey="total_sales" fill="#3b82f6" name="Total Revenue" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-slate-400 font-bold">No products sold in selected period.</div>
            )}
          </div>
        </div>

        {/* Payment Methods */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">Payment Methods Distribution</h3>
          <div className="h-72 flex flex-col sm:flex-row items-center justify-center gap-4">
            <div className="w-full sm:w-1/2 h-full">
              {charts.paymentDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={charts.paymentDistribution} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={4} dataKey="value">
                      {charts.paymentDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-slate-400 font-bold">No payment method logs found.</div>
              )}
            </div>
            <div className="w-full sm:w-1/2 flex flex-col gap-2">
              {charts.paymentDistribution.map((item, idx) => (
                <div key={item.name} className="flex items-center justify-between text-xs font-semibold">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                    <span className="text-slate-600">{item.name}</span>
                  </div>
                  <span className="text-slate-900 font-bold">₹{Number(item.amount).toLocaleString()} ({item.value} tx)</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* SALES OPERATORS & LEADERBOARD */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Leaderboard */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm lg:col-span-1">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
            🏆 Employee Performance
          </h3>
          <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin">
            {charts.salesByEmployee.length > 0 ? (
              charts.salesByEmployee.map((emp, index) => (
                <div key={emp.id} className="flex items-center justify-between border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-extrabold ${
                      index === 0 ? 'bg-amber-100 text-amber-800' : index === 1 ? 'bg-slate-100 text-slate-800' : 'bg-orange-50 text-orange-800'
                    }`}>
                      {index + 1}
                    </span>
                    <div>
                      <p className="text-xs font-bold text-slate-900">{emp.name}</p>
                      <p className="text-[10px] text-slate-400 font-medium">{emp.orders_count} Receipts Printed</p>
                    </div>
                  </div>
                  <span className="text-xs font-black text-slate-900">₹{Number(emp.total_sales).toLocaleString()}</span>
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-slate-400 text-xs font-bold">No employee sales logged yet.</div>
            )}
          </div>
        </div>

        {/* Pending Invoices */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Pending / Partial Customer Payments</h3>
              <p className="text-xs text-slate-400 font-medium">Sales bills requiring payment clearance or follow-ups</p>
            </div>
            <span className="px-2 py-0.5 text-[10px] font-bold text-amber-700 bg-amber-50 rounded border border-amber-200">
              Credit Control
            </span>
          </div>

          <div className="overflow-x-auto max-h-[300px] overflow-y-auto scrollbar-thin">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/50">
                  <th className="py-2.5 px-3">Invoice No</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Customer</th>
                  <th className="py-2.5 px-3 text-right">Total Amount</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-650">
                {charts.pendingInvoices.length > 0 ? (
                  charts.pendingInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-2.5 px-3 font-bold text-indigo-600">{inv.invoice_no}</td>
                      <td className="py-2.5 px-3 text-slate-400">{new Date(inv.date).toLocaleDateString()}</td>
                      <td className="py-2.5 px-3 font-semibold text-slate-900">{inv.customer_name}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-900">₹{Number(inv.total).toLocaleString()}</td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                          inv.payment_status === 'Pending' ? 'bg-rose-50 text-rose-700 border border-rose-100' : 'bg-amber-50 text-amber-700 border border-amber-100'
                        }`}>
                          {inv.payment_status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="py-8 text-center text-slate-400 text-xs font-medium">All bills cleared! No pending customer collections.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* CUSTOMER SALES RETURNS TABLE */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Customer Returned Orders Logs</h3>
            <p className="text-xs text-slate-400 font-medium">Listing of returned items, refund values, and return reasons</p>
          </div>
          <span className="px-2 py-0.5 text-[10px] font-bold text-orange-700 bg-orange-50 rounded border border-orange-200">
            Returns Audit
          </span>
        </div>

        <div className="overflow-x-auto max-h-[300px] overflow-y-auto scrollbar-thin">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/50">
                <th className="py-2.5 px-3">Invoice No</th>
                <th className="py-2.5 px-3">Return Date</th>
                <th className="py-2.5 px-3">Product Name</th>
                <th className="py-2.5 px-3 text-center">Quantity</th>
                <th className="py-2.5 px-3 text-right">Refund Amount</th>
                <th className="py-2.5 px-3">Reason Code</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-650">
              {charts.returnedOrders.length > 0 ? (
                charts.returnedOrders.map((ret) => (
                  <tr key={ret.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-2.5 px-3 font-bold text-slate-900">{ret.invoice_no}</td>
                    <td className="py-2.5 px-3 text-slate-400">{new Date(ret.created_at).toLocaleDateString()}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900">{ret.product_name}</td>
                    <td className="py-2.5 px-3 text-center font-bold text-slate-600">{ret.quantity}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-red-600">₹{Number(ret.refund_amount).toLocaleString()}</td>
                    <td className="py-2.5 px-3 font-bold text-slate-500">{ret.reason}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-400 text-xs font-medium">No customer returns logged yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SalesDashboard;
