import { useState, useEffect } from 'react';
import { 
  DocumentArrowDownIcon, 
  ArrowPathIcon,
  PresentationChartLineIcon,
  CalendarIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import API, { reportsAPI, stockAPI, productsAPI, vendorsAPI, customersAPI, usersAPI, categoriesAPI, salesAPI, purchasesAPI } from '../../services/api';
import { useAppSelector } from '../../store/hooks';

// Static fallback data in case database is offline
const fallbackInventoryReport = [
  { sku: 'GRO-FORT-SOY', name: 'Fortune Soyabean Oil 1L', category: 'Spices & Groceries', purchase_price: 110.00, selling_price: 135.00, stock_level: 12, valuation: 1320.00 },
  { sku: 'GRO-TATA-SLT', name: 'Tata Salt 1kg', category: 'Spices & Groceries', purchase_price: 20.00, selling_price: 26.00, stock_level: 115, valuation: 2300.00 }
];

const fallbackSalesReport = [
  { invoice_no: 'INV-2026-0001', date: '2026-07-02', customer: 'Walk-in Customer', subtotal: 365.00, gst_amount: 48.60, discount: 15.00, total: 398.60, payment_method: 'UPI' }
];

const fallbackPurchaseReport = [
  { purchase_no: 'PUR-001-2026', date: '2026-06-15', vendor: 'Balaji Wholesale Traders', subtotal: 7340.00, gst_amount: 1141.20, discount: 300.00, total: 8181.20, payment_status: 'Paid' }
];

const Reports = () => {
  const { user } = useAppSelector((state) => state.auth);
  const { isDarkMode } = useAppSelector((state) => state.theme);
  const [activeTab, setActiveTab] = useState('inventory');
  const [loading, setLoading] = useState(true);
  const [dataList, setDataList] = useState([]);
  const [dbOffline, setDbOffline] = useState(false);

  // --- Graphical Analytics States ---
  const [analyticsScope, setAnalyticsScope] = useState('overall'); // 'overall', 'product'
  const [selectedProduct, setSelectedProduct] = useState('');
  const [datePreset, setDatePreset] = useState('30days'); // 'today', '7days', '30days', 'year', 'custom'
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [timeScale, setTimeScale] = useState('daily'); // 'daily', 'monthly', 'yearly'
  
  // Extra filters
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [selectedVendor, setSelectedVendor] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [comparePeriod, setComparePeriod] = useState(false);

  // Metadata dropdown state
  const [productsList, setProductsList] = useState([]);
  const [categoriesList, setCategoriesList] = useState([]);
  const [vendorsList, setVendorsList] = useState([]);
  const [customersList, setCustomersList] = useState([]);
  const [employeesList, setEmployeesList] = useState([]);
  const [brandsList, setBrandsList] = useState([]);

  // Analytics API Data state
  const [analyticsData, setAnalyticsData] = useState({
    kpis: {},
    charts: { trends: [], topProducts: [], movementCounts: [], movementLogs: [] }
  });

  const tabs = [
    { id: 'inventory', label: 'Inventory Valuation' },
    { id: 'sales', label: 'Sales & GST Report' },
    { id: 'purchase', label: 'Purchases & Expenses' },
    { id: 'lowstock', label: 'Low Stock Report' },
    { id: 'analytics', label: '📊 Graphical Analytics' }
  ];

  // Fetch Filter Dropdowns metadata
  const loadMetadata = async () => {
    try {
      const canManageUsers = user?.role === 'Admin' || user?.permissions?.includes('manage_users') || user?.permissions?.includes('view_staff');
      const [prodRes, vendRes, custRes, empRes] = await Promise.all([
        productsAPI.getAll().catch(() => ({ success: false })),
        vendorsAPI.getAll().catch(() => ({ success: false })),
        customersAPI.getAll().catch(() => ({ success: false })),
        canManageUsers ? usersAPI.getAll().catch(() => ({ success: false, users: [] })) : Promise.resolve({ success: true, users: [] })
      ]);

      if (prodRes?.success) {
        setProductsList(prodRes.products || []);
        const brands = [...new Set((prodRes.products || []).map(p => p.brand).filter(Boolean))];
        setBrandsList(brands);
      }
      if (vendRes?.success) setVendorsList(vendRes.vendors || []);
      if (custRes?.success) setCustomersList(custRes.customers || []);
      if (empRes?.success) setEmployeesList(empRes.users || []);

      const catRes = await categoriesAPI.getAll().catch(() => ({ success: false }));
      if (catRes?.success) {
        setCategoriesList(catRes.categories || []);
      }
    } catch (err) {
      console.error('Failed to load filters metadata:', err);
    }
  };

  const getComputedDates = () => {
    if (datePreset === 'custom') {
      return { start: startDate, end: endDate, compStart: null, compEnd: null };
    }

    const end = new Date();
    let start = new Date();
    let compStart = new Date();
    let compEnd = new Date();

    if (datePreset === 'today') {
      start.setHours(0,0,0,0);
      compStart.setDate(end.getDate() - 1);
      compStart.setHours(0,0,0,0);
      compEnd.setDate(end.getDate() - 1);
    } else if (datePreset === '7days') {
      start.setDate(end.getDate() - 7);
      compStart.setDate(end.getDate() - 14);
      compEnd.setDate(end.getDate() - 7);
    } else if (datePreset === '30days') {
      start.setDate(end.getDate() - 30);
      compStart.setDate(end.getDate() - 60);
      compEnd.setDate(end.getDate() - 30);
    } else if (datePreset === 'year') {
      start.setMonth(0, 1); // Jan 1st
      compStart.setFullYear(end.getFullYear() - 1);
      compStart.setMonth(0, 1);
      compEnd.setFullYear(end.getFullYear() - 1);
      compEnd.setMonth(11, 31);
    }

    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0],
      compStart: compStart.toISOString().split('T')[0],
      compEnd: compEnd.toISOString().split('T')[0]
    };
  };

  // Fetch Analytics data
  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const dates = getComputedDates();
      const params = {
        scope: analyticsScope,
        productId: selectedProduct,
        categoryId: selectedCategory,
        brand: selectedBrand,
        brandId: selectedBrand,
        vendorId: selectedVendor,
        customerId: selectedCustomer,
        employeeId: selectedEmployee,
        timeScale,
        startDate: dates.start,
        endDate: dates.end
      };

      if (comparePeriod && dates.compStart && dates.compEnd) {
        params.compareStartDate = dates.compStart;
        params.compareEndDate = dates.compEnd;
      }
      const response = await API.get('/reports/advanced-analytics', { params });
 
       if (response.data.success) {
         setAnalyticsData(response.data);
       }
    } catch (err) {
      console.error('Failed to load advanced analytics reports:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchReportData = async () => {
    if (activeTab === 'analytics') {
      await fetchAnalytics();
      return;
    }

    setLoading(true);
    try {
      const dates = getComputedDates();
      const params = {
        startDate: dates.start,
        endDate: dates.end,
        categoryId: selectedCategory,
        brandId: selectedBrand,
        vendorId: selectedVendor,
        customerId: selectedCustomer,
        employeeId: selectedEmployee
      };

      if (activeTab === 'inventory') {
        const res = await reportsAPI.getInventoryReport(params);
        if (res.success) setDataList(res.report);
      } else if (activeTab === 'sales') {
        const res = await reportsAPI.getSalesReport(params);
        if (res.success) setDataList(res.report);
      } else if (activeTab === 'purchase') {
        const res = await reportsAPI.getPurchaseReport(params);
        if (res.success) setDataList(res.report);
      } else if (activeTab === 'lowstock') {
        const res = await stockAPI.getAlerts();
        if (res.success && res.alerts && Array.isArray(res.alerts.lowStock)) {
          const mapped = res.alerts.lowStock.map(p => {
            const qty = Number(p.current_stock ?? p.total_stock ?? 0);
            return {
              barcode: p.barcode || 'N/A',
              name: p.product_name || p.name,
              min_stock: p.min_stock || 0,
              current_stock: qty,
              reorder_status: qty <= 0 ? 'Critical' : 'Need Reorder'
            };
          });
          setDataList(mapped);
        } else {
          setDataList([]);
        }
      }
      setDbOffline(false);
    } catch (err) {
      console.warn(`Reports API for tab ${activeTab} failed, loading fallback.`, err);
      setDbOffline(true);
      if (activeTab === 'inventory') setDataList(fallbackInventoryReport);
      else if (activeTab === 'sales') setDataList(fallbackSalesReport);
      else if (activeTab === 'purchase') setDataList(fallbackPurchaseReport);
      else if (activeTab === 'lowstock') {
        setDataList([
          { barcode: '8906007281224', name: 'Fortune Soyabean Oil 1L', min_stock: 5, current_stock: 2, reorder_status: 'Need Reorder' }
        ]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMetadata();
  }, []);

  useEffect(() => {
    fetchReportData();
  }, [activeTab]);

  // Trigger load when analytics filters change
  useEffect(() => {
    if (activeTab === 'analytics') {
      // Auto pre-populate first product if switching to product scope
      if (analyticsScope === 'product' && !selectedProduct && productsList.length > 0) {
        setSelectedProduct(productsList[0].id);
        return;
      }
      fetchAnalytics();
    }
  }, [activeTab, analyticsScope, selectedProduct, datePreset, startDate, endDate, timeScale, selectedCategory, selectedBrand, selectedVendor, selectedCustomer, selectedEmployee, comparePeriod]);

  // Generic Client-side CSV Exporter
  const handleExportCSV = () => {
    if (activeTab === 'analytics') {
      const data = analyticsData.charts.trends;
      if (!data || data.length === 0) return;
      
      let csvContent = 'data:text/csv;charset=utf-8,';
      if (analyticsScope === 'product') {
        csvContent += 'Period,Revenue (INR),Units Sold\n';
        data.forEach(t => {
          csvContent += `${t.label},₹${t.revenue},${t.units_sold}\n`;
        });
      } else {
        csvContent += 'Period,Sales Revenue (INR),Purchases Expenses (INR)\n';
        data.forEach(t => {
          csvContent += `${t.label},₹${t.revenue},₹${t.expenses}\n`;
        });
      }

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `Kirana_ERP_Analytics_Export_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }

    if (!dataList || dataList.length === 0) return;
    const headers = Object.keys(dataList[0]);
    const csvRows = [];
    csvRows.push(headers.join(','));
    for (const row of dataList) {
      const values = headers.map(header => {
        const escaped = ('' + (row[header] ?? '')).replace(/"/g, '\\"');
        return `"${escaped}"`;
      });
      csvRows.push(values.join(','));
    }
    const csvContent = 'data:text/csv;charset=utf-8,' + csvRows.join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Kirana_ERP_${activeTab}_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // PDF Print Trigger
  const handlePrintPDF = () => {
    window.print();
  };

  // --- Void Action Handlers ---
  const handleVoidSalesEntry = async (row) => {
    if (!window.confirm(`Are you sure you want to VOID Sales Invoice "${row.invoice_no}"?\nThis action will reverse the transaction and restore product stock to inventory.`)) return;
    try {
      setLoading(true);
      const res = await salesAPI.delete(row.id);
      if (res.success) {
        alert(`Sales invoice "${row.invoice_no}" voided successfully and stock restored.`);
        fetchReportData();
      } else {
        alert(res.message || 'Failed to void sales invoice.');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error voiding sales invoice.');
    } finally {
      setLoading(false);
    }
  };

  const handleVoidPurchaseEntry = async (row) => {
    if (!window.confirm(`Are you sure you want to VOID Purchase Invoice "${row.purchase_no}"?\nThis action will reverse the purchase and deduct stock/balances.`)) return;
    try {
      setLoading(true);
      const res = await purchasesAPI.delete(row.id);
      if (res.success) {
        alert(`Purchase invoice "${row.purchase_no}" voided successfully.`);
        fetchReportData();
      } else {
        alert(res.message || 'Failed to void purchase invoice.');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error voiding purchase invoice.');
    } finally {
      setLoading(false);
    }
  };

  const handleVoidInventoryEntry = async (row) => {
    const prodId = row.id || row.product_id;
    if (!window.confirm(`Are you sure you want to VOID Inventory Entry for "${row.name}"?\nThis will set its active stock to 0.`)) return;
    try {
      setLoading(true);
      const res = await stockAPI.adjust({
        product_id: prodId,
        warehouse_id: 1,
        type: 'set',
        quantity: 0,
        reason: 'Voided from Inventory Valuation Report'
      });
      if (res.success) {
        alert(`Inventory entry for "${row.name}" voided successfully (Stock set to 0).`);
        fetchReportData();
      } else {
        alert(res.message || 'Failed to void inventory entry.');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error voiding inventory entry.');
    } finally {
      setLoading(false);
    }
  };

  const getColumns = () => {
    if (activeTab === 'inventory') {
      return [
        { key: 'barcode', label: 'Barcode' },
        { key: 'name', label: 'Product Description' },
        { key: 'category', label: 'Category' },
        { key: 'purchase_price', label: 'Purchase Cost', render: (val) => `₹${Number(val).toFixed(2)}` },
        { key: 'selling_price', label: 'Selling Price', render: (val) => `₹${Number(val).toFixed(2)}` },
        { key: 'stock_level', label: 'Stock Count' },
        { key: 'valuation', label: 'Total Valuation', render: (val) => `₹${Number(val).toFixed(2)}` },
        {
          key: 'action',
          label: 'Action',
          render: (_, row) => (
            <button
              onClick={() => handleVoidInventoryEntry(row)}
              className="px-2 py-1 text-[10px] font-bold text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg transition-colors flex items-center gap-1 shadow-xs"
            >
              🚫 Void Entry
            </button>
          )
        }
      ];
    }
    if (activeTab === 'sales') {
      return [
        { key: 'invoice_no', label: 'Invoice No.' },
        { key: 'date', label: 'Date', render: (val) => val ? val.slice(0, 10) : '' },
        { key: 'customer', label: 'Customer' },
        { key: 'subtotal', label: 'Subtotal', render: (val) => `₹${Number(val).toFixed(2)}` },
        { key: 'gst_amount', label: 'GST Tax', render: (val) => `₹${Number(val).toFixed(2)}` },
        { key: 'discount', label: 'Discount', render: (val) => `₹${Number(val).toFixed(2)}` },
        { key: 'total', label: 'Final Total', render: (val) => `₹${Number(val).toFixed(2)}` },
        { key: 'payment_method', label: 'Method' },
        {
          key: 'action',
          label: 'Action',
          render: (_, row) => (
            <button
              onClick={() => handleVoidSalesEntry(row)}
              className="px-2 py-1 text-[10px] font-bold text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg transition-colors flex items-center gap-1 shadow-xs"
            >
              🚫 Void Entry
            </button>
          )
        }
      ];
    }
    if (activeTab === 'purchase') {
      return [
        { key: 'purchase_no', label: 'Purchase No.' },
        { key: 'date', label: 'Date', render: (val) => val ? val.slice(0, 10) : '' },
        { key: 'vendor', label: 'Supplier Vendor' },
        { key: 'subtotal', label: 'Subtotal', render: (val) => `₹${Number(val).toFixed(2)}` },
        { key: 'gst_amount', label: 'GST Tax', render: (val) => `₹${Number(val).toFixed(2)}` },
        { key: 'discount', label: 'Discount', render: (val) => `₹${Number(val).toFixed(2)}` },
        { key: 'total', label: 'Total Paid', render: (val) => `₹${Number(val).toFixed(2)}` },
        { key: 'payment_status', label: 'Payment status', render: (val) => <StatusBadge status={val} /> },
        {
          key: 'action',
          label: 'Action',
          render: (_, row) => (
            <button
              onClick={() => handleVoidPurchaseEntry(row)}
              className="px-2 py-1 text-[10px] font-bold text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg transition-colors flex items-center gap-1 shadow-xs"
            >
              🚫 Void Entry
            </button>
          )
        }
      ];
    }
    if (activeTab === 'lowstock') {
      return [
        { key: 'barcode', label: 'Barcode' },
        { key: 'name', label: 'Product Description' },
        { key: 'min_stock', label: 'Min. Buffer' },
        { key: 'current_stock', label: 'Current Level' },
        { key: 'reorder_status', label: 'Replenish Status', render: (val) => (
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
            val === 'Critical' ? 'bg-red-50 text-red-700 border border-red-100 animate-pulse' : 'bg-amber-50 text-amber-700 border border-amber-100'
          }`}>
            {val}
          </span>
        )}
      ];
    }
    return [];
  };

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <div className="space-y-6 select-none font-sans print:p-0">
      
      {/* HEADER SECTION */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-900 print:hidden p-5 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-sm">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            📊 Business Reports & Analytics
          </h1>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">Valuation ledger, sales accounting, tax sheets, and interactive dashboards</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handlePrintPDF}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all font-bold text-xs shadow-xs bg-white dark:bg-slate-850"
          >
            🖨️ PDF Report
          </button>
          <button
            onClick={handleExportCSV}
            disabled={loading || (activeTab !== 'analytics' && dataList.length === 0)}
            className="flex items-center gap-2 px-3 py-1.5 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all font-bold text-xs shadow-xs disabled:opacity-50 bg-white dark:bg-slate-850"
          >
            <DocumentArrowDownIcon className="w-4 h-4" />
            Export CSV
          </button>
          <button
            onClick={fetchReportData}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all font-bold text-xs shadow-xs bg-white dark:bg-slate-850"
          >
            <ArrowPathIcon className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {dbOffline && (
        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-xl p-3 text-amber-850 dark:text-amber-300 text-xs font-semibold print:hidden">
          ⚠️ Running in Offline Simulation Mode. Reports represent simulated datasets.
        </div>
      )}

      {/* TABS BAR */}
      <div className="border-b border-slate-200 dark:border-slate-800 print:hidden">
        <nav className="flex gap-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-3 px-1 border-b-2 font-bold text-xs transition-all ${
                activeTab === tab.id
                  ? 'border-indigo-600 dark:border-indigo-400 text-indigo-600 dark:text-indigo-400 font-black'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* REPORT CONTENT WRAPPER */}
      {activeTab === 'analytics' ? (
        <div className="space-y-6">
          
          {/* GRAPHICAL FILTERS CONTROL BLOCK */}
          <div className="bg-white dark:bg-slate-900 p-5 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-4 print:hidden">
            <div className="flex items-center gap-1.5">
              <FunnelIcon className="w-4 h-4 text-slate-450 dark:text-slate-400" />
              <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">Analytics Filter Hub</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              
              {/* Analytics Scope */}
              <div>
                <label className="block text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Scope</label>
                <select
                  value={analyticsScope}
                  onChange={(e) => setAnalyticsScope(e.target.value)}
                  className="w-full px-2 py-1.5 text-xs border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 font-bold bg-slate-50 dark:bg-slate-950 dark:text-slate-200"
                >
                  <option value="overall">Overall Performance</option>
                  <option value="product">Specific Product Performance</option>
                </select>
              </div>

              {/* Product Selector */}
              {analyticsScope === 'product' && (
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Choose Product</label>
                  <select
                    value={selectedProduct}
                    onChange={(e) => setSelectedProduct(e.target.value)}
                    className="w-full px-2 py-1.5 text-xs border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 font-semibold bg-slate-50 dark:bg-slate-950 dark:text-slate-200"
                  >
                    {productsList.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Date Preset */}
              <div>
                <label className="block text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Date Preset</label>
                <select
                  value={datePreset}
                  onChange={(e) => setDatePreset(e.target.value)}
                  className="w-full px-2 py-1.5 text-xs border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 font-bold bg-slate-50 dark:bg-slate-950 dark:text-slate-200"
                >
                  <option value="today">Today</option>
                  <option value="7days">Last 7 Days</option>
                  <option value="30days">Last 30 Days</option>
                  <option value="year">This Year</option>
                  <option value="custom">Custom Date Range</option>
                </select>
              </div>

              {/* Time scale */}
              <div>
                <label className="block text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Time Scale</label>
                <select
                  value={timeScale}
                  onChange={(e) => setTimeScale(e.target.value)}
                  className="w-full px-2 py-1.5 text-xs border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 font-bold bg-slate-50 dark:bg-slate-950 dark:text-slate-200"
                >
                  <option value="daily">Daily View</option>
                  <option value="monthly">Monthly View</option>
                  <option value="yearly">Yearly View</option>
                </select>
              </div>

              {/* Category Filter */}
              <div>
                <label className="block text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Category</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-2 py-1.5 text-xs border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 font-semibold bg-slate-50 dark:bg-slate-950 dark:text-slate-200"
                >
                  <option value="">All Categories</option>
                  {categoriesList.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Brand Filter */}
              <div>
                <label className="block text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Brand</label>
                <select
                  value={selectedBrand}
                  onChange={(e) => setSelectedBrand(e.target.value)}
                  className="w-full px-2 py-1.5 text-xs border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 font-semibold bg-slate-50 dark:bg-slate-950 dark:text-slate-200"
                >
                  <option value="">All Brands</option>
                  {brandsList.map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Sub filters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              {/* Supplier Filter */}
              <div>
                <label className="block text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Supplier / Vendor</label>
                <select
                  value={selectedVendor}
                  onChange={(e) => setSelectedVendor(e.target.value)}
                  className="w-full px-2 py-1.5 text-xs border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 font-semibold bg-slate-50 dark:bg-slate-950 dark:text-slate-200"
                >
                  <option value="">All Suppliers</option>
                  {vendorsList.map(v => (
                    <option key={v.id} value={v.id}>{v.company_name || v.name}</option>
                  ))}
                </select>
              </div>

              {/* Customer Filter */}
              <div>
                <label className="block text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Customer Profile</label>
                <select
                  value={selectedCustomer}
                  onChange={(e) => setSelectedCustomer(e.target.value)}
                  className="w-full px-2 py-1.5 text-xs border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 font-semibold bg-slate-50 dark:bg-slate-950 dark:text-slate-200"
                >
                  <option value="">All Customers</option>
                  {customersList.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Operator/Cashier Filter */}
              <div>
                <label className="block text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Cashier / Staff</label>
                <select
                  value={selectedEmployee}
                  onChange={(e) => setSelectedEmployee(e.target.value)}
                  className="w-full px-2 py-1.5 text-xs border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 font-semibold bg-slate-50 dark:bg-slate-950 dark:text-slate-200"
                >
                  <option value="">All Operators</option>
                  {employeesList.map(e => (
                    <option key={e.id} value={e.id}>{e.name}</option>
                  ))}
                </select>
              </div>

              {/* Comparison Checkbox */}
              <div className="flex items-center gap-2 pt-5">
                <input
                  type="checkbox"
                  id="comparePeriodCheckbox"
                  checked={comparePeriod}
                  onChange={(e) => setComparePeriod(e.target.checked)}
                  className="w-3.5 h-3.5 text-indigo-600 border-slate-200 dark:border-slate-800 rounded focus:ring-indigo-500"
                />
                <label htmlFor="comparePeriodCheckbox" className="text-xs font-bold text-slate-650 dark:text-slate-300 cursor-pointer select-none">
                  Compare with Prior Period
                </label>
              </div>
            </div>

            {/* Custom Dates Inputs */}
            {datePreset === 'custom' && (
              <div className="flex items-center gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">From Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="px-3 py-1 text-xs border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 font-bold bg-slate-50 dark:bg-slate-950 dark:text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">To Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="px-3 py-1 text-xs border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 font-bold bg-slate-50 dark:bg-slate-950 dark:text-slate-200"
                  />
                </div>
              </div>
            )}
          </div>

          {/* LOADER */}
          {loading ? (
            <div className="min-h-[300px] flex flex-col items-center justify-center gap-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
              <span className="text-sm font-semibold text-slate-500 dark:text-slate-400 animate-pulse">Running advanced statistical queries...</span>
            </div>
          ) : (
            <div className="space-y-6">
              
              {/* KPI CARDS GRID */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 print:grid-cols-6">
                {analyticsScope === 'overall' ? (
                  <>
                    <div className="bg-white dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
                      <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">Total Sales (Net)</h4>
                      <p className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-1">₹{Number(analyticsData.kpis?.totalSales || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                      <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 mt-1 flex flex-col gap-0.5">
                        <span>{analyticsData.kpis?.salesCount || 0} Bills Settled</span>
                        {Number(analyticsData.kpis?.salesReturns || 0) > 0 && (
                          <span className="text-rose-500 font-bold">Returns Refunded: -₹{Number(analyticsData.kpis?.salesReturns).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        )}
                      </div>
                    </div>
                    <div className="bg-white dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
                      <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">Purchases (Net Paid)</h4>
                      <p className="text-lg font-black text-slate-900 dark:text-white mt-1">₹{Number(analyticsData.kpis?.totalPurchases || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                      <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 mt-1 flex flex-col gap-0.5">
                        <span>Subtotal (Excl. Tax): ₹{Number(analyticsData.kpis?.netPurchaseSubtotalExclTax || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        <span className="text-indigo-600 dark:text-indigo-400 font-bold">GST Tax: +₹{Number(analyticsData.kpis?.purchaseGst || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })} | Returns: -₹{Number(analyticsData.kpis?.vendorReturns || 0).toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                    <div className="bg-white dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
                      <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">Net Profit & Margin</h4>
                      <p className="text-lg font-black text-indigo-600 dark:text-indigo-400 mt-1">₹{Number(analyticsData.kpis?.profit || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                      <div className="text-[10px] font-bold text-indigo-500 dark:text-indigo-300 mt-1 flex flex-col gap-0.5">
                        <span>Sales (₹{Number(analyticsData.kpis?.totalSales || 0).toLocaleString('en-IN')}) - COGS (₹{Number(analyticsData.kpis?.cogs || 0).toLocaleString('en-IN')})</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">Net Margin: {analyticsData.kpis?.profitMargin || 0}%</span>
                      </div>
                    </div>
                    <div className="bg-white dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
                      <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">Inventory Valuation (Excl. Tax)</h4>
                      <p className="text-lg font-black text-blue-600 dark:text-blue-400 mt-1">₹{Number(analyticsData.kpis?.inventoryValue || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                      <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mt-1 flex flex-col gap-0.5">
                        <span className={Number(analyticsData.kpis?.inventoryValue || 0) === Number(analyticsData.kpis?.netPurchaseSubtotalExclTax || 0) ? "text-emerald-600 dark:text-emerald-400 font-bold" : "text-slate-500 dark:text-slate-400 font-semibold"}>
                          {Number(analyticsData.kpis?.inventoryValue || 0) === Number(analyticsData.kpis?.netPurchaseSubtotalExclTax || 0)
                            ? `✓ Matches Net Purchases Subtotal 100%`
                            : `+ Sold COGS (₹${Number(analyticsData.kpis?.cogs || 0).toLocaleString('en-IN')}) = Subtotal (₹${Number(analyticsData.kpis?.netPurchaseSubtotalExclTax || 0).toLocaleString('en-IN')})`}
                        </span>
                        <span>GST Credit: +₹{Number(analyticsData.kpis?.stockGst || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })} | Incl. Tax: ₹{(Number(analyticsData.kpis?.inventoryValue || 0) + Number(analyticsData.kpis?.stockGst || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      </div>
                    </div>
                    <div className="bg-white dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
                      <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">Borrow (Udhaar) Ledger</h4>
                      <p className="text-lg font-black text-amber-600 dark:text-amber-400 mt-1">₹{Number(analyticsData.kpis?.borrowOutstanding || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                      <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 mt-1 flex flex-col gap-0.5">
                        <span>Total Credit Issued: ₹{Number(analyticsData.kpis?.totalBorrow || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">Recovered Paybacks: ₹{Number(analyticsData.kpis?.totalPaid || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      </div>
                    </div>
                    <div className="bg-white dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
                      <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">Returns & Wastage Loss</h4>
                      <p className="text-lg font-black text-rose-600 dark:text-rose-400 mt-1">₹{(Number(analyticsData.kpis?.salesReturns || 0) + Number(analyticsData.kpis?.stockDestroyCost || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                      <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 mt-1">Refunds & Stock Destroy</div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="bg-white dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
                      <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">Units Billed (Sold)</h4>
                      <p className="text-lg font-black text-slate-900 dark:text-white mt-1">{(analyticsData.kpis?.unitsSold || 0).toLocaleString()}</p>
                      <div className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 mt-1">Revenue: ₹{Number(analyticsData.kpis?.revenue || 0).toLocaleString()}</div>
                    </div>
                    <div className="bg-white dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
                      <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">Units Procured (Purchased)</h4>
                      <p className="text-lg font-black text-slate-900 dark:text-white mt-1">{(analyticsData.kpis?.unitsPurchased || 0).toLocaleString()}</p>
                      <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 mt-1">Added to inventory registry</div>
                    </div>
                    <div className="bg-white dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
                      <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">Current Stock Count</h4>
                      <p className="text-lg font-black text-slate-900 dark:text-white mt-1">{(analyticsData.kpis?.currentStock || 0).toLocaleString()}</p>
                      <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 mt-1">Available across warehouses</div>
                    </div>
                    <div className="bg-white dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
                      <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">Product Returns</h4>
                      <p className="text-lg font-black text-rose-600 dark:text-rose-400 mt-1">{(analyticsData.kpis?.returnsQty || 0).toLocaleString()} Units</p>
                      <div className="text-[10px] font-bold text-rose-600 dark:text-rose-400 mt-1">Refund Value: ₹{Number(analyticsData.kpis?.returnsAmount || 0).toLocaleString()}</div>
                    </div>
                  </>
                )}
              </div>

              {/* GROWTH & COMPARISON CARD */}
              {comparePeriod && (
                <div className="bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 rounded-2xl p-4 flex items-center justify-between">
                  <div>
                    <h4 className="text-[10px] font-black text-indigo-700 dark:text-indigo-300 uppercase tracking-wider">Comparative Analytics Growth</h4>
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mt-1">Period growth vs previous matching period</p>
                  </div>
                  <span className={`px-3 py-1 rounded-xl text-xs font-black ${
                    (analyticsData.kpis?.growth || 0) >= 0 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                  }`}>
                    {(analyticsData.kpis?.growth || 0) >= 0 ? '▲' : '▼'} {Math.abs(analyticsData.kpis?.growth || 0).toFixed(1)}%
                  </span>
                </div>
              )}

              {/* CHARTS CONTAINER LAYOUT */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 print:grid-cols-1">
                
                {/* Main Trend line/area chart (2/3 width) */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm lg:col-span-2">
                  <h3 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-4">
                    {analyticsScope === 'overall' ? 'Revenue, Expenses & Net Profit Trends' : 'Product Sales Volume Trend'}
                  </h3>
                  <div className="h-72">
                    {analyticsData.charts?.trends && analyticsData.charts.trends.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={analyticsData.charts.trends} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10b981" stopOpacity={0.25}/>
                              <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.25}/>
                              <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25}/>
                              <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#334155' : '#E2E8F0'} />
                          <XAxis
                            dataKey="label"
                            tick={{ fontSize: 10, fill: isDarkMode ? '#CBD5E1' : '#334155', fontWeight: 600 }}
                            stroke={isDarkMode ? '#475569' : '#94A3B8'}
                          />
                          <YAxis
                            tick={{ fontSize: 10, fill: isDarkMode ? '#CBD5E1' : '#334155', fontWeight: 600 }}
                            stroke={isDarkMode ? '#475569' : '#94A3B8'}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: isDarkMode ? '#0F172A' : '#FFFFFF',
                              borderColor: isDarkMode ? '#334155' : '#E2E8F0',
                              color: isDarkMode ? '#F8FAFC' : '#0F172A',
                              borderRadius: '0.75rem',
                              fontSize: '11px',
                              fontWeight: '600',
                              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                            }}
                            formatter={(value) => `₹${Number(value).toLocaleString('en-IN')}`}
                          />
                          <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px', color: isDarkMode ? '#CBD5E1' : '#334155' }} />
                          <Area type="monotone" dataKey="revenue" name="Sales Revenue" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
                          {analyticsScope === 'overall' && (
                            <>
                              <Area type="monotone" dataKey="expenses" name="Purchase Cost" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorExpenses)" />
                              <Area type="monotone" dataKey="profit" name="Net Profit" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorProfit)" />
                            </>
                          )}
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-slate-400 font-bold">No data matches query filters.</div>
                    )}
                  </div>
                </div>

                {/* Secondary Donut / Category Distribution Chart (1/3 width) */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
                  {analyticsScope === 'overall' ? (
                    <>
                      <h3 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-4">Category Sales Distribution</h3>
                      <div className="h-72 flex flex-col items-center justify-center">
                        {analyticsData.charts?.categoryDist && analyticsData.charts.categoryDist.length > 0 ? (
                          <div className="w-full h-full flex flex-col justify-between">
                            <div className="w-full h-44">
                              <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                  <Pie
                                    data={analyticsData.charts.categoryDist}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={45}
                                    outerRadius={65}
                                    paddingAngle={3}
                                    dataKey="value"
                                  >
                                    {analyticsData.charts.categoryDist.map((entry, index) => (
                                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                  </Pie>
                                  <Tooltip formatter={(value) => `₹${Number(value).toLocaleString('en-IN')}`} />
                                </PieChart>
                              </ResponsiveContainer>
                            </div>
                            <div className="w-full max-h-24 overflow-y-auto space-y-1.5 text-[11px] font-bold scrollbar-thin">
                              {analyticsData.charts.categoryDist.slice(0, 5).map((cat, idx) => (
                                <div key={idx} className="flex items-center justify-between">
                                  <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                                    {cat.name}
                                  </span>
                                  <span className="text-slate-900 dark:text-white">₹{Number(cat.value).toLocaleString('en-IN')}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="flex h-full items-center justify-center text-xs text-slate-400 font-semibold">No category distribution data.</div>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-4">Quantity Traded Share</h3>
                      <div className="h-72 flex flex-col items-center justify-center">
                        <div className="w-full h-44">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={[
                                  { name: 'Sold', value: analyticsData.kpis?.unitsSold || 0 },
                                  { name: 'Purchased', value: analyticsData.kpis?.unitsPurchased || 0 },
                                  { name: 'Stock', value: analyticsData.kpis?.currentStock || 0 }
                                ]}
                                cx="50%"
                                cy="50%"
                                innerRadius={45}
                                outerRadius={65}
                                paddingAngle={3}
                                dataKey="value"
                              >
                                <Cell fill="#10b981" />
                                <Cell fill="#f59e0b" />
                                <Cell fill="#3b82f6" />
                              </Pie>
                              <Tooltip />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                        <div className="w-full space-y-2 mt-4 text-[11px] font-bold text-slate-700 dark:text-slate-300">
                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Billed Sales</span>
                            <span>{analyticsData.kpis?.unitsSold || 0}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Procurements</span>
                            <span>{analyticsData.kpis?.unitsPurchased || 0}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-indigo-500" /> Current Stock</span>
                            <span>{analyticsData.kpis?.currentStock || 0}</span>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* SECONDARY ROW: TOP PRODUCTS & TOP SUPPLIERS/CUSTOMERS */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                
                {/* Top Selling Products */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
                  <h3 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-4">Top 5 Selling Items</h3>
                  <div className="h-64">
                    {analyticsData.charts?.topProducts && analyticsData.charts.topProducts.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={analyticsData.charts.topProducts.slice(0, 5)} layout="vertical" margin={{ top: 10, right: 15, left: 10, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#334155' : '#E2E8F0'} />
                          <XAxis type="number" tick={{ fontSize: 10, fill: isDarkMode ? '#CBD5E1' : '#334155' }} stroke={isDarkMode ? '#475569' : '#94A3B8'} />
                          <YAxis dataKey="name" type="category" width={110} tick={{ fontSize: 10, fill: isDarkMode ? '#F8FAFC' : '#1E293B', fontWeight: 600 }} stroke={isDarkMode ? '#475569' : '#94A3B8'} />
                          <Tooltip formatter={(value) => `₹${Number(value).toLocaleString('en-IN')}`} />
                          <Bar dataKey="revenue" fill="#3b82f6" radius={[0, 4, 4, 0]} name="Sales Revenue" />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-slate-400 font-semibold">No sales records found.</div>
                    )}
                  </div>
                </div>

                {/* Top Procured Products */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
                  <h3 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-4">Top 5 Procured Items</h3>
                  <div className="h-64">
                    {analyticsData.charts?.topPurchasedProducts && analyticsData.charts.topPurchasedProducts.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={analyticsData.charts.topPurchasedProducts.slice(0, 5)} layout="vertical" margin={{ top: 10, right: 15, left: 10, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#334155' : '#E2E8F0'} />
                          <XAxis type="number" tick={{ fontSize: 10, fill: isDarkMode ? '#CBD5E1' : '#334155' }} stroke={isDarkMode ? '#475569' : '#94A3B8'} />
                          <YAxis dataKey="name" type="category" width={110} tick={{ fontSize: 10, fill: isDarkMode ? '#F8FAFC' : '#1E293B', fontWeight: 600 }} stroke={isDarkMode ? '#475569' : '#94A3B8'} />
                          <Tooltip formatter={(value) => `₹${Number(value).toLocaleString('en-IN')}`} />
                          <Bar dataKey="total_expenses" fill="#f59e0b" radius={[0, 4, 4, 0]} name="Purchase Cost" />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-slate-400 font-semibold">No procurement records found.</div>
                    )}
                  </div>
                </div>

                {/* Top Customers & Top Suppliers Overview */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
                  <h3 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider">Top Financial Entities</h3>
                  
                  {/* Top Customers */}
                  <div>
                    <h4 className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Top Customers by Revenue</h4>
                    <div className="space-y-2">
                      {analyticsData.charts?.topCustomers && analyticsData.charts.topCustomers.length > 0 ? (
                        analyticsData.charts.topCustomers.map((c, idx) => (
                          <div key={idx} className="flex items-center justify-between text-xs p-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
                            <div>
                              <div className="font-bold text-slate-900 dark:text-white">{c.name}</div>
                              <div className="text-[10px] text-slate-500 dark:text-slate-400">{c.sales_count} Transactions</div>
                            </div>
                            <span className="font-black text-emerald-600 dark:text-emerald-400">₹{Number(c.total_spent).toLocaleString('en-IN')}</span>
                          </div>
                        ))
                      ) : (
                        <div className="text-xs text-slate-400 font-medium">No customer data.</div>
                      )}
                    </div>
                  </div>

                  {/* Top Suppliers */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                    <h4 className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Top Suppliers by Volume</h4>
                    <div className="space-y-2">
                      {analyticsData.charts?.topSuppliers && analyticsData.charts.topSuppliers.length > 0 ? (
                        analyticsData.charts.topSuppliers.map((v, idx) => (
                          <div key={idx} className="flex items-center justify-between text-xs p-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
                            <div>
                              <div className="font-bold text-slate-900 dark:text-white">{v.name}</div>
                              <div className="text-[10px] text-slate-500 dark:text-slate-400">{v.purchase_count} Orders</div>
                            </div>
                            <span className="font-black text-amber-600 dark:text-amber-400">₹{Number(v.total_procured).toLocaleString('en-IN')}</span>
                          </div>
                        ))
                      ) : (
                        <div className="text-xs text-slate-400 font-medium">No supplier data.</div>
                      )}
                    </div>
                  </div>
                </div>

              </div>

              {/* BOTTOM DETAIL SHEETS (STOCK MOVEMENT HISTORY) */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
                <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-4">Stock Movement & Audit Logs</h3>
                <div className="overflow-x-auto max-h-[300px] overflow-y-auto scrollbar-thin">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/50 dark:bg-slate-950/50">
                        <th className="py-2.5 px-3 text-slate-600 dark:text-slate-300">Timestamp</th>
                        <th className="py-2.5 px-3 text-slate-600 dark:text-slate-300">Action Type</th>
                        <th className="py-2.5 px-3 text-slate-600 dark:text-slate-300">Quantity</th>
                        <th className="py-2.5 px-3 text-slate-600 dark:text-slate-300">Product</th>
                        <th className="py-2.5 px-3 text-slate-600 dark:text-slate-300">Warehouse</th>
                        <th className="py-2.5 px-3 text-slate-600 dark:text-slate-300">Reference / Invoice</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-medium text-slate-650 dark:text-slate-300">
                      {analyticsData.charts?.movementLogs && analyticsData.charts.movementLogs.length > 0 ? (
                        analyticsData.charts.movementLogs.map((log, index) => (
                          <tr key={index} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/60 transition-colors">
                            <td className="py-2.5 px-3 text-slate-400 dark:text-slate-500">{new Date(log.created_at).toLocaleString()}</td>
                            <td className="py-2.5 px-3 font-bold">
                              <span className={`px-2 py-0.5 rounded text-[10px] ${
                                log.type === 'Stock In' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' : log.type === 'Stock Out' ? 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                              }`}>
                                {log.type}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">{log.quantity} Units</td>
                            <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-200">{log.product_name || 'N/A'}</td>
                            <td className="py-2.5 px-3 text-slate-550 dark:text-slate-400">{log.warehouse_name || 'General Warehouse'}</td>
                            <td className="py-2.5 px-3 font-semibold text-indigo-600 dark:text-indigo-400">{log.reference_no}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="6" className="py-8 text-center text-slate-450 dark:text-slate-500 text-xs font-medium">No stock movement logs found for selected filters.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* TABLE REPORT VIEW */
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-soft">
          {loading ? (
            <div className="py-12 flex justify-center">
              <span className="text-sm font-semibold text-slate-500 dark:text-slate-400 animate-pulse">Generating report dataset...</span>
            </div>
          ) : (
            <DataTable
              columns={getColumns()}
              data={dataList}
              itemsPerPage={10}
              striped={true}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default Reports;
