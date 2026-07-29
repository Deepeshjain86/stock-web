import { useState, useEffect, useMemo, useRef, Fragment } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import {
  ArrowPathIcon,
  MagnifyingGlassIcon,
  CircleStackIcon,
  ClockIcon,
  CurrencyRupeeIcon,
  PrinterIcon,
  DocumentArrowDownIcon,
  CalendarIcon,
  UserIcon,
  BuildingStorefrontIcon,
  TagIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  InboxIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import { stockAPI, productsAPI, usersAPI } from '../../services/api';
import { useAppSelector } from '../../store/hooks';
import StatsCard from '../../components/common/StatsCard';

const StockHistory = () => {
  const { user } = useAppSelector((state) => state.auth);
  
  // Products list for selector
  const [productList, setProductList] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [searchProductQuery, setSearchProductQuery] = useState('');
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  
  // Users list for filters
  const [usersList, setUsersList] = useState([]);

  // Log records state
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dbOffline, setDbOffline] = useState(false);

  // Filters state
  const [filterType, setFilterType] = useState('');
  const [filterUser, setFilterUser] = useState('');
  const [filterDateRange, setFilterDateRange] = useState('all'); // all, today, week, month, custom
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Row expansion state
  const [expandedRows, setExpandedRows] = useState({});

  // Toast alert
  const [toastAlert, setToastAlert] = useState({ show: false, message: '', type: 'success' });
  
  const productDropdownRef = useRef(null);

  const triggerToast = (message, type = 'success') => {
    setToastAlert({ show: true, message, type });
    setTimeout(() => setToastAlert({ show: false, message: '', type: 'success' }), 3000);
  };

  // Click outside to close product dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (productDropdownRef.current && !productDropdownRef.current.contains(e.target)) {
        setShowProductDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch initial setup data
  useEffect(() => {
    const loadSetupData = async () => {
      try {
        const prodRes = await productsAPI.getAll().catch(() => ({ success: false }));
        if (prodRes?.success) {
          setProductList(prodRes.products || []);
        }
        const canManageUsers = user?.role === 'Admin' || user?.permissions?.includes('manage_users') || user?.permissions?.includes('view_staff');
        if (canManageUsers) {
          const userRes = await usersAPI.getAll().catch(() => ({ success: false }));
          if (userRes?.success) {
            setUsersList(userRes.users || []);
          }
        }
      } catch (err) {
        console.warn('API setup failed, loading simulation catalogs.', err);
        setDbOffline(true);
        setProductList([
          { id: 1, name: 'Fortune Soyabean Oil 1L', sku: 'GRO-FORT-SOY', barcode: '8901234567890', category: 'Spices & Groceries', unit: 'Pcs', stock: 12, purchasePrice: 110, valuation: 1320 },
          { id: 2, name: 'Tata Salt 1kg', sku: 'GRO-TATA-SLT', barcode: '8902345678901', category: 'Spices & Groceries', unit: 'Pcs', stock: 115, purchasePrice: 20, valuation: 2300 },
          { id: 3, name: 'Maggi 2-Min Noodles 12-Pack', sku: 'SNA-MAGG-12P', barcode: '8903456789012', category: 'Snacks & Packaged Foods', unit: 'Pcs', stock: 47, purchasePrice: 145, valuation: 6815 }
        ]);
        setUsersList([
          { id: 1, name: 'Deepesh Jain', department: 'Admin' },
          { id: 2, name: 'Ramesh Patel', department: 'Sales' }
        ]);
      }
    };
    loadSetupData();
  }, []);

  // Fetch audit logs for selected product
  const fetchAuditLogs = async (pId) => {
    if (!pId) return;
    setLoading(true);
    try {
      const logsRes = await stockAPI.getLogs({ product_id: pId });
      if (logsRes.success) {
        setRecords(logsRes.logs);
      }
      setDbOffline(false);
    } catch (err) {
      console.warn('Logs API connection failed, simulating logs.', err);
      setDbOffline(true);
      // Generate some simulated logs for the selected product
      const p = productList.find(item => item.id === Number(pId));
      setRecords([
        {
          id: 1,
          created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
          product_name: p?.name || 'Item Name',
          sku: p?.sku || 'N/A',
          barcode: p?.barcode || 'N/A',
          category_name: p?.category || 'General',
          warehouse_name: 'Main Storage',
          type: 'Stock Out',
          quantity: -5,
          previous_quantity: 17,
          new_quantity: 12,
          reference_no: 'INV-2026-0039',
          notes: 'Sales Billing Entry',
          user_name: 'Ramesh Patel',
          user_department: 'Sales',
          customer_name: 'Aman Kumar',
          vendor_name: null,
          unit: p?.unit || 'Pcs'
        },
        {
          id: 2,
          created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
          product_name: p?.name || 'Item Name',
          sku: p?.sku || 'N/A',
          barcode: p?.barcode || 'N/A',
          category_name: p?.category || 'General',
          warehouse_name: 'Main Storage',
          type: 'Stock In',
          quantity: 20,
          previous_quantity: 0,
          new_quantity: 20,
          reference_no: 'PUR-0029-2026',
          notes: 'Purchase Invoice Entry',
          user_name: 'Deepesh Jain',
          user_department: 'Admin',
          customer_name: null,
          vendor_name: 'Adani Wilmar Ltd',
          unit: p?.unit || 'Pcs'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectProduct = (prod) => {
    setSelectedProductId(prod.id);
    setSearchProductQuery(prod.name);
    setShowProductDropdown(false);
    setExpandedRows({});
    fetchAuditLogs(prod.id);
  };

  const toggleRowExpansion = (rowId) => {
    setExpandedRows(prev => ({ ...prev, [rowId]: !prev[rowId] }));
  };

  const selectedProduct = useMemo(() => {
    return productList.find(p => p.id === Number(selectedProductId));
  }, [productList, selectedProductId]);

  // Date Presets computations
  useEffect(() => {
    if (filterDateRange === 'all') {
      setFilterDateFrom('');
      setFilterDateTo('');
    } else if (filterDateRange === 'today') {
      const todayStr = new Date().toISOString().split('T')[0];
      setFilterDateFrom(todayStr);
      setFilterDateTo(todayStr);
    } else if (filterDateRange === 'week') {
      const lastWeek = new Date(Date.now() - 7 * 24 * 3600000).toISOString().split('T')[0];
      const todayStr = new Date().toISOString().split('T')[0];
      setFilterDateFrom(lastWeek);
      setFilterDateTo(todayStr);
    } else if (filterDateRange === 'month') {
      const lastMonth = new Date(Date.now() - 30 * 24 * 3600000).toISOString().split('T')[0];
      const todayStr = new Date().toISOString().split('T')[0];
      setFilterDateFrom(lastMonth);
      setFilterDateTo(todayStr);
    }
  }, [filterDateRange]);

  // Client side filters application
  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      const matchSearch = searchTerm.trim() === '' || 
        r.reference_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.notes?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchUser = !filterUser || r.user_name === filterUser;
      
      let matchType = true;
      if (filterType) {
        if (filterType === 'Purchase') matchType = r.type === 'Stock In' && r.reference_no?.startsWith('PUR');
        else if (filterType === 'Sale') matchType = r.type === 'Stock Out' && r.reference_no?.startsWith('INV');
        else if (filterType === 'Return') matchType = r.notes?.toLowerCase().includes('return') || r.reference_no?.startsWith('VRN');
        else if (filterType === 'Adjustment') matchType = r.type === 'Adjustment';
      }

      let matchDate = true;
      if (filterDateFrom) {
        matchDate = matchDate && new Date(r.created_at) >= new Date(filterDateFrom);
      }
      if (filterDateTo) {
        matchDate = matchDate && new Date(r.created_at) <= new Date(filterDateTo + 'T23:59:59');
      }

      return matchSearch && matchUser && matchType && matchDate;
    });
  }, [records, searchTerm, filterUser, filterType, filterDateFrom, filterDateTo]);

  // Stats summary panel calculations
  const stats = useMemo(() => {
    if (filteredRecords.length === 0) {
      return {
        purchased: 0,
        sold: 0,
        returned: 0,
        adjusted: 0,
        transferred: 0,
        currentStock: selectedProduct?.stock || 0,
        valuation: (selectedProduct?.stock || 0) * (selectedProduct?.purchasePrice || 0),
        lastActivity: 'No Activities Recorded'
      };
    }

    let purchased = 0;
    let sold = 0;
    let returned = 0;
    let adjusted = 0;
    let transferred = 0;

    filteredRecords.forEach(r => {
      const qty = Number(r.quantity);
      if (r.type === 'Stock In') {
        if (r.reference_no?.startsWith('PUR')) {
          purchased += qty;
        } else if (r.notes?.toLowerCase().includes('return')) {
          returned += qty; // Customer return restores stock
        } else {
          adjusted += qty;
        }
      } else if (r.type === 'Stock Out') {
        if (r.reference_no?.startsWith('INV')) {
          sold += Math.abs(qty);
        } else if (r.reference_no?.startsWith('VRN') || r.notes?.toLowerCase().includes('return')) {
          returned += Math.abs(qty); // Vendor return reduces stock
        } else {
          adjusted += qty;
        }
      } else if (r.type === 'Adjustment') {
        adjusted += qty;
      } else if (r.type === 'Transfer') {
        transferred += Math.abs(qty);
      }
    });

    const currentStock = filteredRecords[0]?.new_quantity || selectedProduct?.stock || 0;
    const price = selectedProduct?.purchasePrice || 0;
    const latestAct = filteredRecords[0];
    const latestDate = latestAct ? new Date(latestAct.created_at).toLocaleDateString() : '';
    const lastActivity = latestAct ? `${latestAct.type} (${latestDate})` : 'N/A';

    return {
      purchased,
      sold,
      returned,
      adjusted,
      transferred,
      currentStock,
      valuation: currentStock * price,
      lastActivity
    };
  }, [filteredRecords, selectedProduct]);

  // Chart data format: oldest first for time sequence line
  const chartData = useMemo(() => {
    return [...filteredRecords]
      .reverse()
      .map(r => ({
        name: new Date(r.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        Stock: r.new_quantity
      }));
  }, [filteredRecords]);

  // Color mappings
  const getBadgeClasses = (type, ref) => {
    const reference = ref || '';
    if (type === 'Stock In') {
      if (reference.startsWith('PUR')) return 'bg-emerald-50 text-emerald-700 border border-emerald-250 font-bold';
      return 'bg-emerald-50 text-emerald-600 border border-emerald-150 font-semibold';
    }
    if (type === 'Stock Out') {
      if (reference.startsWith('INV')) return 'bg-rose-50 text-rose-700 border border-rose-250 font-bold';
      return 'bg-rose-50 text-rose-600 border border-rose-150 font-semibold';
    }
    if (type === 'Adjustment') return 'bg-amber-50 text-amber-700 border border-amber-250 font-bold';
    if (type === 'Transfer') return 'bg-indigo-50 text-indigo-700 border border-indigo-250 font-bold';
    return 'bg-slate-50 text-slate-700 border border-slate-200';
  };

  const getTransactionTypeLabel = (type, ref, notes) => {
    const reference = ref || '';
    const notesStr = notes || '';
    if (type === 'Stock In') {
      if (reference.startsWith('PUR')) return 'Purchase Intake';
      if (notesStr.toLowerCase().includes('return')) return 'Customer Return';
      return 'Inward Correction';
    }
    if (type === 'Stock Out') {
      if (reference.startsWith('INV')) return 'POS Checkout';
      if (reference.startsWith('VRN') || notesStr.toLowerCase().includes('return')) return 'Vendor Return';
      return 'Write-off / Waste';
    }
    if (type === 'Transfer') {
      if (reference === 'TRANSFER-IN') return 'Transfer Inward';
      return 'Transfer Outward';
    }
    return type;
  };

  // Export to Excel / CSV Simulated
  const handleExportCSV = () => {
    if (filteredRecords.length === 0) {
      triggerToast('No records available to export', 'error');
      return;
    }

    const headers = ['Date', 'Reference', 'Type', 'Previous Stock', 'Quantity Delta', 'New Stock', 'Operator', 'Remarks', 'Partner'];
    const rows = filteredRecords.map(r => [
      new Date(r.created_at).toLocaleString(),
      r.reference_no || 'N/A',
      getTransactionTypeLabel(r.type, r.reference_no, r.notes),
      r.previous_quantity,
      r.quantity > 0 ? `+${r.quantity}` : r.quantity,
      r.new_quantity,
      `${r.user_name || 'System'} (${r.user_department || 'General'})`,
      r.notes || '',
      r.vendor_name || r.customer_name || 'N/A'
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `inventory_audit_${selectedProduct?.barcode || 'product'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerToast('Audit trail exported successfully as CSV!', 'success');
  };

  // Print view
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-12 select-none font-sans bg-slate-50 dark:bg-slate-950 p-4 rounded-3xl print:bg-white print:p-0">
      
      {/* Toast Alert */}
      <AnimatePresence>
        {toastAlert.show && (
          <motion.div 
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl border shadow-lg font-bold text-xs ${
              toastAlert.type === 'success' 
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}
          >
            <ShieldCheckIcon className="w-4 h-4" />
            {toastAlert.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/85 p-6 rounded-2xl shadow-sm print:hidden">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <span className="p-1.5 bg-[#1B6E4C] rounded-lg text-white">📋</span>
            Inventory Audit Trail
          </h1>
          <p className="text-xs font-semibold text-slate-500 mt-0.5">Inspect product life history, running totals, and operational checkpoints.</p>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={() => fetchAuditLogs(selectedProductId)} 
            disabled={!selectedProductId || loading}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            <ArrowPathIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh Trail
          </button>
        </div>
      </div>

      {/* PRODUCT SELECTOR AREA */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm space-y-4 print:hidden">
        <h3 className="text-xs font-black text-[#1B6E4C] uppercase tracking-wider">1. Search & Select Inventory Product</h3>
        
        <div className="relative max-w-xl" ref={productDropdownRef}>
          <div className="relative">
            <input
              type="text"
              placeholder="Search by product name or barcode..."
              value={searchProductQuery}
              onChange={(e) => {
                setSearchProductQuery(e.target.value);
                setShowProductDropdown(true);
              }}
              onFocus={() => setShowProductDropdown(true)}
              className="w-full pl-10 pr-4 py-2.5 text-xs border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-emerald-600 bg-slate-50/50 dark:bg-slate-950 font-bold text-slate-900 dark:text-white"
            />
            <MagnifyingGlassIcon className="w-5 h-5 text-slate-400 absolute left-3 top-2.5" />
            {searchProductQuery && (
              <button 
                type="button" 
                onClick={() => { setSelectedProductId(''); setSearchProductQuery(''); setRecords([]); }}
                className="absolute right-3 top-2.5 text-xs font-bold text-slate-400 hover:text-slate-650"
              >
                ✕
              </button>
            )}
          </div>

          {/* Autocomplete Dropdown */}
          {showProductDropdown && (
            <div className="absolute z-30 w-full mt-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg max-h-56 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-850">
              {productList
                .filter(p => p.name.toLowerCase().includes(searchProductQuery.toLowerCase()) || (p.barcode && p.barcode.includes(searchProductQuery)))
                .map(prod => (
                  <div
                    key={prod.id}
                    onClick={() => handleSelectProduct(prod)}
                    className="p-3 text-xs hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer flex justify-between items-center font-bold"
                  >
                    <div>
                      <span className="text-slate-900 dark:text-white block">{prod.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono mt-0.5">Barcode: {prod.barcode || 'N/A'}</span>
                    </div>
                    <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded font-mono">Stock: {prod.stock || 0}</span>
                  </div>
                ))}
              {productList.filter(p => p.name.toLowerCase().includes(searchProductQuery.toLowerCase())).length === 0 && (
                <div className="p-4 text-xs text-slate-400 text-center font-semibold">No matching catalog items found</div>
              )}
            </div>
          )}
        </div>
      </div>

      {selectedProductId ? (
        <div className="space-y-6">
          
          {/* VISUAL ANALYTICS SPARKLINE */}
          {chartData.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm print:hidden"
            >
              <h3 className="text-xs font-black text-[#1B6E4C] uppercase tracking-wider mb-4 flex items-center gap-1.5">
                📈 Stock Level Trend
              </h3>
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorStock" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#1B6E4C" stopOpacity={0.25}/>
                        <stop offset="95%" stopColor="#1B6E4C" stopOpacity={0.01}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" className="dark:stroke-slate-800" />
                    <XAxis dataKey="name" tick={{ fontSize: 9, fontWeight: 700 }} stroke="#94A3B8" />
                    <YAxis tick={{ fontSize: 9, fontWeight: 700 }} stroke="#94A3B8" />
                    <Tooltip contentStyle={{ fontSize: 11, borderRadius: 12, fontWeight: 700 }} />
                    <Area type="monotone" dataKey="Stock" stroke="#1B6E4C" strokeWidth={3} fillOpacity={1} fill="url(#colorStock)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          )}

          {/* STATISTICS GRID PANEL */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 print:grid-cols-4">
            <StatsCard title="Current Stock" value={`${stats.currentStock} ${selectedProduct?.unit || 'Pcs'}`} icon={CircleStackIcon} subtext="Total In Warehouses" color="blue" />
            <StatsCard title="Inventory Valuation" value={`₹${stats.valuation.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`} icon={CurrencyRupeeIcon} subtext="Purchase Value basis" color="green" />
            <StatsCard title="Purchased Units" value={`+${stats.purchased}`} icon={ClockIcon} subtext="Sum of Purchase Intake" color="purple" />
            <StatsCard title="Sold Units" value={`-${stats.sold}`} icon={ClockIcon} subtext="Deducted at Register" color="orange" />
          </div>

          {/* AUDIT LOGS TIMELINE SECTION */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-6 space-y-6">
            
            {/* Filter controls and exports */}
            <div className="flex flex-col gap-4 border-b border-slate-100 dark:border-slate-800 pb-5 print:hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h3 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider">
                  Audit logs timeline records
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleExportCSV}
                    className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-250 dark:border-slate-800 text-[10px] font-black tracking-wider uppercase rounded-xl hover:bg-slate-50 dark:hover:bg-slate-805 text-slate-700 dark:text-slate-350 cursor-pointer bg-white"
                  >
                    <DocumentArrowDownIcon className="w-3.5 h-3.5" /> Export Excel
                  </button>
                  <button
                    onClick={handlePrint}
                    className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-250 dark:border-slate-800 text-[10px] font-black tracking-wider uppercase rounded-xl hover:bg-slate-50 dark:hover:bg-slate-805 text-slate-700 dark:text-slate-350 cursor-pointer bg-white"
                  >
                    <PrinterIcon className="w-3.5 h-3.5" /> Print Trail
                  </button>
                </div>
              </div>

              {/* Advanced Filter grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                
                {/* Search in Reference */}
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-[9px] font-bold text-slate-400 uppercase mb-0.5">Reference Search</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Invoice / Notes"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-7 pr-2.5 py-1.5 border border-slate-200 dark:border-slate-800 rounded-lg text-[10px] font-bold bg-white dark:bg-slate-900 focus:outline-none text-slate-800 dark:text-white"
                    />
                    <MagnifyingGlassIcon className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-2" />
                  </div>
                </div>

                {/* Transaction Type */}
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase mb-0.5">Transaction Type</label>
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="w-full px-2 py-1.5 border border-slate-200 dark:border-slate-800 rounded-lg text-[10px] font-bold bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:outline-none"
                  >
                    <option value="">All Types</option>
                    <option value="Purchase">Purchase (Intake)</option>
                    <option value="Sale">Sale (POS Check)</option>
                    <option value="Return">Returns (Ledger)</option>
                    <option value="Adjustment">Manual Adjustments</option>
                  </select>
                </div>

                {/* Operator Filter */}
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase mb-0.5">Operator (User)</label>
                  <select
                    value={filterUser}
                    onChange={(e) => setFilterUser(e.target.value)}
                    className="w-full px-2 py-1.5 border border-slate-200 dark:border-slate-800 rounded-lg text-[10px] font-bold bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:outline-none"
                  >
                    <option value="">All Staff</option>
                    {usersList.map(u => (
                      <option key={u.id} value={u.name}>{u.name}</option>
                    ))}
                  </select>
                </div>

                {/* Date presets */}
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase mb-0.5">Date Range</label>
                  <select
                    value={filterDateRange}
                    onChange={(e) => setFilterDateRange(e.target.value)}
                    className="w-full px-2 py-1.5 border border-slate-200 dark:border-slate-800 rounded-lg text-[10px] font-bold bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:outline-none"
                  >
                    <option value="all">Lifetime History</option>
                    <option value="today">Today</option>
                    <option value="week">This Week</option>
                    <option value="month">This Month</option>
                    <option value="custom">Custom Range</option>
                  </select>
                </div>

              </div>

              {/* Custom Date Filters */}
              {filterDateRange === 'custom' && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="grid grid-cols-2 gap-4 max-w-md pt-2"
                >
                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase mb-0.5">From Date</label>
                    <input
                      type="date"
                      value={filterDateFrom}
                      onChange={(e) => setFilterDateFrom(e.target.value)}
                      className="w-full px-2.5 py-1 text-[10px] border border-slate-200 rounded-lg text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase mb-0.5">To Date</label>
                    <input
                      type="date"
                      value={filterDateTo}
                      onChange={(e) => setFilterDateTo(e.target.value)}
                      className="w-full px-2.5 py-1 text-[10px] border border-slate-200 rounded-lg text-slate-800"
                    />
                  </div>
                </motion.div>
              )}

            </div>

            {/* Print Header */}
            <div className="hidden print:block border-b-2 border-slate-800 pb-4 mb-4">
              <h2 className="text-xl font-bold text-slate-950">Kirana ERP - Inventory Audit Trail Report</h2>
              <div className="grid grid-cols-2 text-xs font-semibold mt-2 text-slate-600 gap-1">
                <p>Product: <span className="text-slate-950 font-black">{selectedProduct?.name}</span></p>
                <p>Barcode: <span className="text-slate-950 font-black">{selectedProduct?.barcode || 'N/A'}</span></p>
                <p>Generated At: <span className="text-slate-950 font-black">{new Date().toLocaleString()}</span></p>
                <p>Total movements: <span className="text-slate-950 font-black">{filteredRecords.length} records</span></p>
              </div>
            </div>

            {/* Audit Logs Trail Viewport */}
            {loading ? (
              <div className="py-16 flex justify-center items-center">
                <span className="text-sm font-bold text-slate-500 animate-pulse uppercase tracking-wider">
                  Loading Audit Trail checkpoints...
                </span>
              </div>
            ) : filteredRecords.length === 0 ? (
              <div className="py-16 flex flex-col justify-center items-center text-center">
                <InboxIcon className="w-12 h-12 text-slate-300 stroke-[1.2] mb-2" />
                <p className="text-sm font-black text-slate-450 uppercase tracking-wider">No Transaction logs matching filters</p>
                <p className="text-[10px] text-slate-400 font-semibold mt-1">Try relaxing filters or search terms.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse select-none">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 dark:bg-slate-950/30 text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">
                      <th className="py-3 px-4">Date & Time</th>
                      <th className="py-3 px-4">Transaction Type</th>
                      <th className="py-3 px-4">Reference No.</th>
                      <th className="py-3 px-4 text-center">Previous Stock</th>
                      <th className="py-3 px-4 text-center">Change</th>
                      <th className="py-3 px-4 text-center bg-emerald-50/20 dark:bg-emerald-950/5 text-emerald-800 dark:text-emerald-400">Current Stock</th>
                      <th className="py-3 px-4">Operator</th>
                      <th className="py-3 px-4 flex justify-end print:hidden">Audit Detail</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-semibold text-slate-650">
                    {filteredRecords.map((log) => {
                      const isExpanded = !!expandedRows[log.id];
                      return (
                        <Fragment key={log.id}>
                          <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-950/10 transition-colors">
                            <td className="py-3 px-4 whitespace-nowrap text-slate-450 dark:text-slate-400 tabular-nums">
                              {new Date(log.created_at).toLocaleString(undefined, {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </td>
                            <td className="py-3 px-4 whitespace-nowrap">
                              <span className={`px-2.5 py-0.5 rounded-md text-[9px] ${getBadgeClasses(log.type, log.reference_no)} uppercase tracking-wider`}>
                                {getTransactionTypeLabel(log.type, log.reference_no, log.notes)}
                              </span>
                            </td>
                            <td className="py-3 px-4 font-mono font-bold text-slate-800 dark:text-slate-200">
                              {log.reference_no || 'N/A'}
                            </td>
                            <td className="py-3 px-4 text-center font-bold text-slate-400 tabular-nums">
                              {log.previous_quantity}
                            </td>
                            <td className={`py-3 px-4 text-center font-black tabular-nums ${log.quantity < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                              {log.quantity > 0 ? `+${log.quantity}` : log.quantity}
                            </td>
                            <td className="py-3 px-4 text-center font-black text-slate-900 dark:text-white bg-emerald-50/10 dark:bg-emerald-950/5 tabular-nums">
                              {log.new_quantity} <span className="text-[9px] font-normal text-slate-400">{log.unit || 'Pcs'}</span>
                            </td>
                            <td className="py-3 px-4 whitespace-nowrap text-slate-500">
                              <div className="flex items-center gap-1.5">
                                <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                                <span>{log.user_name || 'System'}</span>
                                {log.user_department && (
                                  <span className="text-[9px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-850 px-1 py-0.2 rounded font-mono">
                                    {log.user_department}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-4 flex justify-end items-center print:hidden">
                              <button
                                onClick={() => toggleRowExpansion(log.id)}
                                className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-650 transition-colors"
                              >
                                {isExpanded ? <ChevronUpIcon className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />}
                              </button>
                            </td>
                          </tr>

                          {/* Expanded Details Row */}
                          {isExpanded && (
                            <tr className="bg-slate-50/30 dark:bg-slate-950/5 print:hidden">
                              <td colSpan="8" className="p-4 border-t border-slate-100">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-slate-600 dark:text-slate-350">
                                  
                                  {/* Left block: product specs */}
                                  <div className="space-y-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5">
                                    <h5 className="text-[10px] font-black text-emerald-600 uppercase tracking-wider mb-1 flex items-center gap-1"><TagIcon className="w-3.5 h-3.5" /> Product Specs</h5>
                                    <p>Barcode: <span className="text-slate-900 dark:text-white font-mono font-bold">{selectedProduct?.barcode || 'N/A'}</span></p>
                                    <p>Category: <span className="text-slate-900 dark:text-white font-bold">{log.category_name || 'General'}</span></p>
                                  </div>

                                  {/* Right block: transaction details */}
                                  <div className="space-y-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5">
                                    <h5 className="text-[10px] font-black text-emerald-600 uppercase tracking-wider mb-1 flex items-center gap-1">🛠️ Operations Notes</h5>
                                    <p className="font-semibold text-slate-800 dark:text-slate-200">{log.notes || 'No manual log details recorded.'}</p>
                                    <p>Date & Time: <span className="font-bold text-slate-700 dark:text-slate-200">{new Date(log.created_at).toLocaleString()}</span></p>
                                    <p>Log Record ID: <span className="font-mono text-slate-700 dark:text-slate-200">#LOG-{log.id}</span></p>
                                  </div>

                                  {/* Right block: billing entity details */}
                                  <div className="space-y-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5">
                                    <h5 className="text-[10px] font-black text-emerald-600 uppercase tracking-wider mb-1 flex items-center gap-1">🤝 Associate Ledger</h5>
                                    {log.vendor_name ? (
                                      <>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase">Vendor Supplier</p>
                                        <p className="text-slate-900 dark:text-white font-bold">{log.vendor_name}</p>
                                        <p className="text-[9px] text-indigo-500 font-semibold bg-indigo-50 dark:bg-indigo-950/20 px-1.5 py-0.5 rounded w-fit">Supplier Ledger Updated</p>
                                      </>
                                    ) : log.customer_name ? (
                                      <>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase">Customer POS</p>
                                        <p className="text-slate-900 dark:text-white font-bold">{log.customer_name}</p>
                                        <p className="text-[9px] text-emerald-500 font-semibold bg-emerald-50 dark:bg-emerald-950/20 px-1.5 py-0.5 rounded w-fit text-center">Retail Invoice Linked</p>
                                      </>
                                    ) : (
                                      <p className="text-slate-450 italic mt-2">No associated external vendor or customer ledger for this adjustment.</p>
                                    )}
                                  </div>

                                </div>
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

          </div>

        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-16 flex flex-col justify-center items-center text-center shadow-sm">
          <div className="h-16 w-16 bg-slate-50 dark:bg-slate-950 flex items-center justify-center rounded-2xl text-slate-400 border border-slate-100 dark:border-slate-850 shadow-soft mb-4">
            <ClockIcon className="w-8 h-8 stroke-[1.2]" />
          </div>
          <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider mb-1">Generate Inventory Audit Trail</h3>
          <p className="text-xs text-slate-400 max-w-sm leading-relaxed font-semibold">
            Search and select a product listing from the dropdown above to view its lifetime stock movements history and summary statistics analytics.
          </p>
        </div>
      )}

    </div>
  );
};

export default StockHistory;
