import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  productsAPI, 
  stockAPI 
} from '../../services/api';
import { useAppSelector } from '../../store/hooks';
import {
  CubeIcon,
  ExclamationTriangleIcon,
  TrashIcon,
  EyeIcon,
  PrinterIcon,
  ArrowDownTrayIcon,
  CheckCircleIcon,
  CalendarIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import StatsCard from '../../components/common/StatsCard';

const REASONS = [
  'Physical Stock Count',
  'Damaged Product',
  'Expired Product',
  'Stock Missing',
  'Theft/Loss',
  'Manual Correction',
  'Supplier Correction',
  'Customer Return Correction',
  'Opening Stock Correction',
  'Other'
];

const StockAdjustment = ({ onStockChanged }) => {
  const { user } = useAppSelector((state) => state.auth);
  const isReadOnly = user?.role === 'Super Admin';
  const isSuperAdmin = user?.role === 'Super Admin';

  // Master Data States
  const [productList, setProductList] = useState([]);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [dbOffline, setDbOffline] = useState(false);

  // Searchable Product Dropdown States
  const [searchProductQuery, setSearchProductQuery] = useState('');
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [selectedProductDetails, setSelectedProductDetails] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    productId: '',
    category: '',
    unit: 'Pieces',
    type: 'Increase', // Increase or Decrease
    quantity: '',
    reason: 'Physical Stock Count',
    remarks: '',
    batchNo: '',
    mfgDate: '',
    expDate: ''
  });

  // Filters & Search States
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterReason, setFilterReason] = useState('');
  const [filterAdjustedBy, setFilterAdjustedBy] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');

  // UI Interactive States
  const [selectedLogForView, setSelectedLogForView] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, id: null });
  const [toastAlert, setToastAlert] = useState({ show: false, message: '', type: 'success' });

  // Fallback Data
  const fallbackProducts = [
    { id: 1, name: 'Fortune Soyabean Oil 1L', sku: 'GRO-FORT-SOY', barcode: '890123400122', category: 'Grocery', unit: 'Bottles', stock: 45, expiry_date: '2027-02-15' },
    { id: 2, name: 'Tata Salt 1kg', sku: 'GRO-TATA-SLT', barcode: '890123400233', category: 'Grocery', unit: 'Packets', stock: 120 },
    { id: 3, name: 'Maggi 2-Min Noodles 12-Pack', sku: 'SNA-MAGG-12P', barcode: '890123400344', category: 'Snacks', unit: 'Packets', stock: 12, expiry_date: '2026-08-10' },
    { id: 4, name: 'Amul Butter 500g', sku: 'DAI-AMUL-BTR', barcode: '890123400455', category: 'Dairy', unit: 'Blocks', stock: 8, expiry_date: '2026-09-05' }
  ];

  const fallbackLogs = [
    { 
      id: 1, 
      created_at: new Date().toISOString(), 
      product_name: 'Fortune Soyabean Oil 1L', 
      sku: 'GRO-FORT-SOY', 
      category_name: 'Grocery',
      barcode: '890123400122',
      quantity: 5, 
      type: 'add',
      previous_quantity: 40,
      new_quantity: 45,
      notes: 'Reason: Physical Stock Count | Remarks: Weekly review | Batch: B-SOY-90A | Mfg: 2026-01-15 | Exp: 2027-02-15', 
      user_name: 'Store Manager'
    },
    { 
      id: 2, 
      created_at: new Date(Date.now() - 3600000 * 5).toISOString(), 
      product_name: 'Maggi 2-Min Noodles 12-Pack', 
      sku: 'SNA-MAGG-12P', 
      category_name: 'Snacks',
      barcode: '890123400344',
      quantity: -4, 
      type: 'subtract',
      previous_quantity: 16,
      new_quantity: 12,
      notes: 'Reason: Expired Product | Remarks: Write-off spoiled stock | Batch: B-MAG-22 | Mfg: 2025-08-10 | Exp: 2026-05-10', 
      user_name: 'Ramesh Sharma'
    }
  ];

  // Helper to parse notes structured string
  const parseNotes = (notesStr) => {
    const details = {
      reason: 'Physical Stock Count',
      remarks: '—',
      batchNo: 'N/A',
      mfgDate: 'N/A',
      expDate: 'N/A'
    };
    if (!notesStr) return details;
    
    const parts = notesStr.split('|').map(p => p.trim());
    parts.forEach(part => {
      const [key, ...valParts] = part.split(':');
      if (!key) return;
      const val = valParts.join(':').trim();
      const lowerKey = key.toLowerCase().trim();
      if (lowerKey === 'reason') details.reason = val;
      else if (lowerKey === 'remarks' || lowerKey === 'notes') details.remarks = val;
      else if (lowerKey === 'batch') details.batchNo = val;
      else if (lowerKey === 'mfg') details.mfgDate = val;
      else if (lowerKey === 'exp') details.expDate = val;
    });
    return details;
  };

  const fetchProductsAndLogs = async () => {
    setLoading(true);
    try {
      const prodRes = await productsAPI.getAll();
      if (prodRes.success) {
        setProductList(prodRes.products);
      }
      
      const logsRes = await stockAPI.getLogs({ type: 'Adjustment' });
      if (logsRes.success) {
        setRecords(logsRes.logs);
      }
      setDbOffline(false);
    } catch (err) {
      console.warn('API connection failed, loading fallback data.', err);
      setDbOffline(true);
      setProductList(fallbackProducts);
      setRecords(fallbackLogs);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductsAndLogs();
  }, []);

  const triggerToast = (message, type = 'success') => {
    setToastAlert({ show: true, message, type });
    setTimeout(() => {
      setToastAlert({ show: false, message: '', type: 'success' });
    }, 4000);
  };

  // Determine if selected product has batch or expiry tracking enabled
  const hasExpiryTracking = useMemo(() => {
    if (!selectedProductDetails) return false;
    const cat = (selectedProductDetails.category || '').toLowerCase();
    return (
      selectedProductDetails.expiry_date || 
      cat === 'dairy' || 
      cat === 'grocery' || 
      cat === 'beverages' || 
      cat === 'snacks' ||
      cat === 'food'
    );
  }, [selectedProductDetails]);

  // Autocomplete Details when Product is Selected
  const handleSelectProduct = (prod) => {
    setSelectedProductDetails(prod);
    setSearchProductQuery(prod.name);
    setShowProductDropdown(false);

    setFormData((prev) => ({
       ...prev,
       productId: prod.id,
       category: prod.category || 'General',
       unit: prod.unit || 'Pieces',
       batchNo: '',
       mfgDate: prod.manufacturing_date ? prod.manufacturing_date.split('T')[0] : '',
       expDate: prod.expiry_date ? prod.expiry_date.split('T')[0] : ''
    }));
  };

  // Handle Input Changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Updated Stock Quantity Calculation
  const calculatedUpdatedStock = useMemo(() => {
    const current = selectedProductDetails ? selectedProductDetails.stock || 0 : 0;
    const qty = parseInt(formData.quantity) || 0;
    if (formData.type === 'Increase') {
      return current + qty;
    } else if (formData.type === 'Decrease') {
      return Math.max(0, current - qty);
    }
    return current;
  }, [selectedProductDetails, formData.quantity, formData.type]);

  // Submit Handler (Transaction Wrapped)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.productId || !formData.quantity) {
      triggerToast('Please select a product and enter quantity', 'error');
      return;
    }
    const qty = Number(formData.quantity);
    if (isNaN(qty) || qty <= 0) {
      triggerToast('Quantity must be a positive number greater than 0', 'error');
      return;
    }
    
    const current = selectedProductDetails ? selectedProductDetails.stock || 0 : 0;
    if (formData.type === 'Decrease' && qty > current) {
      triggerToast(`Validation Error: Decrease quantity (${qty}) cannot exceed current stock (${current}).`, 'error');
      return;
    }

    setSubmitting(true);
    try {
      const typeVal = formData.type === 'Increase' ? 'add' : 'subtract';
      // Format notes structured string to save tracking parameters inside single transaction
      const notesDetails = `Reason: ${formData.reason} | Remarks: ${formData.remarks || 'None'} | Batch: ${formData.batchNo || 'N/A'} | Mfg: ${formData.mfgDate || 'N/A'} | Exp: ${formData.expDate || 'N/A'}`;

      const payload = {
        product_id: Number(formData.productId),
        warehouse_id: 1,
        type: typeVal,
        quantity: qty,
        reason: formData.reason,
        notes: notesDetails
      };

      if (!dbOffline) {
        const res = await stockAPI.adjust(payload);
        if (res.success) {
          triggerToast('Stock adjusted successfully!', 'success');
          resetForm();
          await fetchProductsAndLogs();
          // Notify parent to refresh the stock summary table
          if (onStockChanged) onStockChanged();
        }
      } else {
        // Simulated Offline Transaction
        const matchedProd = productList.find(p => p.id === Number(formData.productId));
        const previousQty = current;
        const newQty = formData.type === 'Increase' ? previousQty + qty : Math.max(0, previousQty - qty);

        const newRecord = {
          id: records.length + 1001,
          created_at: new Date().toISOString(),
          product_name: matchedProd ? matchedProd.name : 'Unknown Product',
          category_name: matchedProd ? matchedProd.category : 'General',
          type: typeVal,
          quantity: formData.type === 'Increase' ? qty : -qty,
          previous_quantity: previousQty,
          new_quantity: newQty,
          notes: notesDetails,
          user_name: user?.name || 'Store Manager'
        };

        setRecords([newRecord, ...records]);
        triggerToast('Stock adjustment simulated successfully!', 'success');
        resetForm();
      }
    } catch (err) {
      console.error(err);
      triggerToast(err.response?.data?.message || 'Error updating stock records', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      productId: '',
      category: '',
      unit: 'Pieces',
      type: 'Increase',
      quantity: '',
      reason: 'Physical Stock Count',
      remarks: '',
      batchNo: '',
      mfgDate: '',
      expDate: ''
    });
    setSearchProductQuery('');
    setSelectedProductDetails(null);
  };

  const handleDeleteRecord = (id) => {
    if (!isSuperAdmin) {
      triggerToast('Permission Denied: Only Super Admin can delete stock logs', 'error');
      return;
    }
    setDeleteConfirm({ open: true, id });
  };

  const executeDeleteRecord = () => {
    setRecords(records.filter(r => r.id !== deleteConfirm.id));
    setDeleteConfirm({ open: false, id: null });
    triggerToast('Adjustment record voided successfully', 'success');
  };

  // Printable receipt layout generator
  const handlePrintAdjustment = (item) => {
    const details = parseNotes(item.notes);
    const mfgText = details.mfgDate && details.mfgDate !== 'N/A' ? details.mfgDate : 'N/A';
    const expText = details.expDate && details.expDate !== 'N/A' ? details.expDate : 'N/A';
    const batchText = details.batchNo && details.batchNo !== 'N/A' ? details.batchNo : 'N/A';
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Stock Adjustment Note - ADJ-${String(item.id).padStart(6, '0')}</title>
          <style>
            body { font-family: monospace; padding: 20px; color: #000; }
            .header { text-align: center; border-bottom: 1px dashed #000; padding-bottom: 10px; margin-bottom: 15px; }
            .header h2 { margin: 0; font-size: 16px; }
            .header p { margin: 2px 0; font-size: 11px; }
            .section { margin-bottom: 12px; }
            .row { display: flex; justify-content: space-between; font-size: 12px; margin: 4px 0; }
            .label { font-weight: bold; }
            .divider { border-top: 1px dashed #000; margin: 10px 0; }
            .footer { text-align: center; margin-top: 30px; font-size: 10px; border-top: 1px dashed #000; padding-top: 10px; }
          </style>
        </head>
        <body onload="window.print(); window.close();">
          <div class="header">
            <h2>KIRANA STORE ERP</h2>
            <p>STOCK ADJUSTMENT NOTE</p>
          </div>
          <div class="section">
            <div class="row"><span class="label">Adjustment No:</span><span>ADJ-${String(item.id).padStart(6, '0')}</span></div>
            <div class="row"><span class="label">Date & Time:</span><span>${new Date(item.created_at).toLocaleString('en-IN')}</span></div>
            <div class="row"><span class="label">Adjusted By:</span><span>${item.user_name || 'System Admin'}</span></div>
          </div>
          <div class="divider"></div>
          <div class="section">
            <div class="row"><span class="label">Product Name:</span><span>${item.product_name}</span></div>
            <div class="row"><span class="label">Category:</span><span>${item.category_name || 'General'}</span></div>
            <div class="row"><span class="label">Adjustment Type:</span><span>${item.quantity >= 0 ? 'Increase (+)' : 'Decrease (-)'}</span></div>
            <div class="row"><span class="label">Adjusted Qty:</span><span>${Math.abs(item.quantity)} Pcs</span></div>
          </div>
          <div class="divider"></div>
          <div class="section">
            <div class="row"><span class="label">Previous Stock:</span><span>${item.previous_quantity ?? '—'} Pcs</span></div>
            <div class="row"><span class="label">New Stock Level:</span><span>${item.new_quantity ?? '—'} Pcs</span></div>
          </div>
          <div class="divider"></div>
          <div class="section">
            <div class="row"><span class="label">Reason:</span><span>${details.reason}</span></div>
            <div class="row"><span class="label">Remarks:</span><span>${details.remarks}</span></div>
            <div class="row"><span class="label">Batch Number:</span><span>${batchText}</span></div>
            <div class="row"><span class="label">Mfg Date:</span><span>${mfgText}</span></div>
            <div class="row"><span class="label">Expiry Date:</span><span>${expText}</span></div>
          </div>
          <div class="footer">
            <p>Authorized Signatory</p>
            <p style="margin-top: 25px;">___________________</p>
            <p style="margin-top: 10px; font-size: 8px;">Generated via Kirana Store Inventory System</p>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // CSV Exporter
  const handleExportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Adjustment Number,Date & Time,Product Name,Category,Adjustment Type,Previous Stock,Adjusted Qty,New Stock,Reason,Remarks,Adjusted By\n";
    
    filteredRecords.forEach(r => {
      const details = parseNotes(r.notes);
      const typeLabel = r.quantity >= 0 ? "Increase" : "Decrease";
      const adjNum = `ADJ-${String(r.id).padStart(6, '0')}`;
      const dateTime = new Date(r.created_at).toLocaleString('en-IN').replace(/,/g, '');
      const prodName = r.product_name.replace(/,/g, '');
      const catName = (r.category_name || 'General').replace(/,/g, '');
      const remarksText = details.remarks.replace(/,/g, '');
      
      csvContent += `${adjNum},${dateTime},${prodName},${catName},${typeLabel},${r.previous_quantity ?? '—'},${Math.abs(r.quantity)},${r.new_quantity ?? '—'},${details.reason},${remarksText},${r.user_name || 'Store Admin'}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `stock_adjustments_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerToast('Excel report exported successfully!', 'success');
  };

  // Print PDF Landscape Spooler
  const handleExportPDFList = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Stock Adjustment Report</title>
          <style>
            body { font-family: sans-serif; padding: 25px; font-size: 10px; }
            h1 { text-align: center; font-size: 16px; margin-bottom: 5px; }
            p { text-align: center; margin: 0 0 20px 0; color: #555; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f5f5f5; font-weight: bold; }
            .badge { font-weight: bold; padding: 2px 5px; border-radius: 4px; }
            .increase { color: green; }
            .decrease { color: red; }
          </style>
        </head>
        <body onload="window.print(); window.close();">
          <h1>Kirana Store ERP - Stock Adjustment Ledger Report</h1>
          <p>Generated Date: ${new Date().toLocaleString('en-IN')}</p>
          <table>
            <thead>
              <tr>
                <th>Adjustment Number</th>
                <th>Date & Time</th>
                <th>Product Name</th>
                <th>Category</th>
                <th>Adjustment Type</th>
                <th>Prev Stock</th>
                <th>Adj Qty</th>
                <th>New Stock</th>
                <th>Reason</th>
                <th>Adjusted By</th>
              </tr>
            </thead>
            <tbody>
              ${filteredRecords.map(r => {
                const details = parseNotes(r.notes);
                const isInc = r.quantity >= 0;
                return `
                  <tr>
                    <td>ADJ-${String(r.id).padStart(6, '0')}</td>
                    <td>${new Date(r.created_at).toLocaleString('en-IN')}</td>
                    <td><b>${r.product_name}</b></td>
                    <td>${r.category_name || 'General'}</td>
                    <td><span class="badge ${isInc ? 'increase' : 'decrease'}">${isInc ? 'Increase' : 'Decrease'}</span></td>
                    <td>${r.previous_quantity ?? '—'}</td>
                    <td>${Math.abs(r.quantity)}</td>
                    <td>${r.new_quantity ?? '—'}</td>
                    <td>${details.reason}</td>
                    <td>${r.user_name || 'Store Admin'}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Dynamic calculations for filters and metrics
  const uniqueUsers = useMemo(() => {
    const usersSet = new Set();
    records.forEach(r => {
      if (r.user_name) usersSet.add(r.user_name);
    });
    return Array.from(usersSet);
  }, [records]);

  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      const parsed = parseNotes(r.notes);
      const matchesSearch = r.product_name.toLowerCase().includes(searchTerm.toLowerCase());
      
      let matchesType = true;
      if (filterType) {
        if (filterType === 'Increase') {
          matchesType = r.quantity >= 0;
        } else if (filterType === 'Decrease') {
          matchesType = r.quantity < 0;
        }
      }

      let matchesReason = true;
      if (filterReason) {
        matchesReason = parsed.reason === filterReason;
      }

      let matchesUser = true;
      if (filterAdjustedBy) {
        matchesUser = r.user_name === filterAdjustedBy;
      }

      let matchesDate = true;
      if (filterDateFrom) {
        matchesDate = matchesDate && new Date(r.created_at) >= new Date(filterDateFrom);
      }
      if (filterDateTo) {
        matchesDate = matchesDate && new Date(r.created_at) <= new Date(filterDateTo + 'T23:59:59');
      }

      return matchesSearch && matchesType && matchesReason && matchesUser && matchesDate;
    });
  }, [records, searchTerm, filterType, filterReason, filterAdjustedBy, filterDateFrom, filterDateTo]);

  const adjustmentStats = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    let totalIncreased = 0;
    let totalDecreased = 0;
    let todaysCount = 0;

    records.forEach(r => {
      const qty = Number(r.quantity) || 0;
      const dateStr = r.created_at ? r.created_at.split('T')[0] : '';
      if (dateStr === todayStr) {
        todaysCount++;
      }

      if (r.type === 'add' || qty > 0) {
        totalIncreased += Math.abs(qty);
      } else if (r.type === 'subtract' || qty < 0) {
        totalDecreased += Math.abs(qty);
      }
    });

    return {
      totalAdjustments: records.length,
      totalIncreased,
      totalDecreased,
      todaysCount
    };
  }, [records]);

  return (
    <div className="space-y-6 pb-12 select-none font-sans bg-slate-50 dark:bg-slate-950 p-4 rounded-3xl transition-all duration-300">
      
      {/* Toast alert display */}
      <AnimatePresence>
        {toastAlert.show && (
          <motion.div 
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl border shadow-lg font-bold text-xs transition-all ${
              toastAlert.type === 'success' 
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}
          >
            <CheckCircleIcon className="w-4 h-4" />
            {toastAlert.message}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight">Stock Adjustment Panel</h1>
          <p className="text-xs font-semibold text-slate-500 mt-0.5">Correct inventory counts, write off damaged products, and manage expiries</p>
        </div>
        {dbOffline && (
          <span className="bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50 text-[10px] font-bold px-3 py-1 rounded-full">
            ⚠️ Offline Simulation Mode
          </span>
        )}
      </div>

      {/* SUMMARY KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Total Adjustments" value={adjustmentStats.totalAdjustments} icon={CubeIcon} subtext="Total entries logged" color="blue" />
        <StatsCard title="Total Stock Increased" value={`${adjustmentStats.totalIncreased} Pcs`} icon={CheckCircleIcon} subtext="Quantity added" color="green" />
        <StatsCard title="Total Stock Decreased" value={`${adjustmentStats.totalDecreased} Pcs`} icon={ExclamationTriangleIcon} subtext="Quantity reduced" color="orange" />
        <StatsCard title="Today's Adjustments" value={adjustmentStats.todaysCount} icon={CalendarIcon} subtext="Count of adjustments today" color="purple" />
      </div>

      {/* PRIMARY COLUMNS CONTENT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: STOCK ADJUSTMENT FORM (5 cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800/80 p-6 shadow-sm h-fit">
          <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Adjustment Entry</h2>
            <button type="button" onClick={resetForm} className="text-[10px] text-indigo-650 hover:text-indigo-700 font-extrabold uppercase">Clear Form</button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <fieldset disabled={submitting} className="space-y-4">
              
              {/* Product Autocomplete Selection */}
              <div className="relative">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Select Product *</label>
                <div className="relative">
                  <input 
                    type="text"
                    placeholder="Search product by name..."
                    value={searchProductQuery}
                    onChange={(e) => {
                      setSearchProductQuery(e.target.value);
                      setShowProductDropdown(true);
                    }}
                    onFocus={() => setShowProductDropdown(true)}
                    required
                    className="w-full pl-9 pr-8 py-2 text-xs border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 bg-slate-50 dark:bg-slate-955 font-bold text-slate-900 dark:text-white"
                  />
                  <MagnifyingGlassIcon className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  {searchProductQuery && (
                    <button 
                      type="button" 
                      onClick={() => { setSearchProductQuery(''); setFormData(prev => ({ ...prev, productId: '' })); }} 
                      className="text-[10px] text-slate-400 hover:text-slate-650 absolute right-3 top-2.5 font-bold"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {showProductDropdown && (
                  <div className="absolute z-30 w-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg max-h-48 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                    {productList
                      .filter(p => p.name.toLowerCase().includes(searchProductQuery.toLowerCase()))
                      .map(prod => (
                        <div 
                          key={prod.id} 
                          onClick={() => handleSelectProduct(prod)}
                          className="p-2.5 text-xs hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer flex justify-between font-semibold"
                        >
                          <span className="text-slate-900 dark:text-white">{prod.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono">Stock: {prod.stock || 0} {prod.unit || 'Pcs'}</span>
                        </div>
                      ))}
                    {productList.filter(p => p.name.toLowerCase().includes(searchProductQuery.toLowerCase())).length === 0 && (
                      <div className="p-3 text-xs text-slate-400 text-center font-medium">No products found</div>
                    )}
                  </div>
                )}
              </div>

              {/* Product Metadata Block (Auto-Filled) */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Category</label>
                  <input 
                    type="text" 
                    value={formData.category} 
                    readOnly 
                    placeholder="—"
                    className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-100 dark:bg-slate-900 text-slate-500 font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Unit</label>
                  <input 
                    type="text" 
                    value={formData.unit} 
                    readOnly 
                    placeholder="—"
                    className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-100 dark:bg-slate-900 text-slate-500 font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Current Stock</label>
                  <input 
                    type="text" 
                    value={selectedProductDetails ? `${selectedProductDetails.stock || 0} Pcs` : '—'} 
                    readOnly 
                    className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-100 dark:bg-slate-900 text-slate-500 font-mono font-bold"
                  />
                </div>
              </div>

              {/* Adjustment Details */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Adjustment Type *</label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 bg-slate-50 dark:bg-slate-950 font-bold text-slate-900 dark:text-white"
                  >
                    <option value="Increase">Increase (+)</option>
                    <option value="Decrease">Decrease (-)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Adjustment Qty *</label>
                  <input 
                    type="number"
                    name="quantity"
                    min="1"
                    required
                    value={formData.quantity}
                    onChange={handleInputChange}
                    placeholder="Qty to adjust..."
                    className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Reason *</label>
                  <select
                    name="reason"
                    value={formData.reason}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 bg-slate-50 dark:bg-slate-955 font-bold text-slate-900 dark:text-white"
                  >
                    {REASONS.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">New Stock Preview</label>
                  <input 
                    type="text" 
                    value={selectedProductDetails ? `${calculatedUpdatedStock} Pcs` : '—'} 
                    readOnly 
                    className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-mono font-black"
                  />
                </div>
              </div>

              {/* Batch & Expiry details (Displayed only for food/dairy/perishables) */}
              {hasExpiryTracking && (
                <div className="bg-slate-50 dark:bg-slate-955 p-4 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3">
                  <h4 className="text-[10px] font-black text-indigo-500 uppercase tracking-wider">Batch & Expiry Details</h4>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[9px] text-slate-400 font-bold uppercase mb-0.5">Batch Number</label>
                      <input 
                        type="text"
                        name="batchNo"
                        value={formData.batchNo}
                        onChange={handleInputChange}
                        placeholder="e.g. BT-102"
                        className="w-full px-2 py-1 text-[11px] border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:border-indigo-500 font-mono text-slate-900 dark:text-white bg-white dark:bg-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] text-slate-400 font-bold uppercase mb-0.5">Mfg Date</label>
                      <input 
                        type="date"
                        name="mfgDate"
                        value={formData.mfgDate}
                        onChange={handleInputChange}
                        className="w-full px-2 py-1 text-[11px] border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:border-indigo-500 text-slate-900 dark:text-white bg-white dark:bg-slate-900 font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] text-slate-400 font-bold uppercase mb-0.5">Expiry Date</label>
                      <input 
                        type="date"
                        name="expDate"
                        value={formData.expDate}
                        onChange={handleInputChange}
                        className="w-full px-2 py-1 text-[11px] border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:border-indigo-500 text-slate-900 dark:text-white bg-white dark:bg-slate-900 font-medium"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Remarks */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Remarks</label>
                <textarea 
                  name="remarks"
                  rows="2"
                  value={formData.remarks}
                  onChange={handleInputChange}
                  placeholder="Notes for physical recount audit (Optional)..."
                  className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-medium"
                />
              </div>

              {/* Read Only Dynamic Info */}
              <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-100 dark:border-slate-800/80 text-[10px] font-semibold text-slate-500 space-y-1.5">
                <div className="flex justify-between">
                  <span>Adjustment Date & Time:</span>
                  <span className="font-bold text-slate-700 dark:text-slate-350">{new Date().toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Adjusted By Operator:</span>
                  <span className="font-bold text-slate-800 dark:text-white">{user?.name || 'Store Admin'} ({user?.role || 'Operator'})</span>
                </div>
              </div>

              {/* SUBMIT BUTTON */}
              {!isReadOnly ? (
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="submit"
                    disabled={submitting || !formData.productId || !formData.quantity}
                    className="w-full py-3 bg-indigo-650 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all active:scale-[0.98] disabled:opacity-50 disabled:bg-slate-200 disabled:text-slate-400 cursor-pointer shadow-md shadow-indigo-500/20"
                  >
                    {submitting ? 'Executing adjustment transaction...' : 'Save Stock Adjustment'}
                  </button>
                </div>
              ) : (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-center text-[11px] font-bold text-amber-700 dark:text-amber-300">
                  👁️ Monitoring Mode (Read-Only): Stock adjustment entry is disabled.
                </div>
              )}

            </fieldset>
          </form>
        </div>

        {/* RIGHT COLUMN: HISTORY TABLE LOGS (7 cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800/80 p-6 shadow-sm flex flex-col justify-between h-fit gap-4">
          
          {/* Header search controls */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-3">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Stock Adjustment History</h2>
              <div className="flex items-center gap-2">
                <button 
                  onClick={handleExportCSV}
                  className="flex items-center gap-1 px-2.5 py-1.5 border border-slate-200 dark:border-slate-800 text-[10px] font-bold rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-slate-700 dark:text-slate-350 cursor-pointer"
                >
                  <ArrowDownTrayIcon className="w-3.5 h-3.5" /> Export Excel
                </button>
                <button 
                  onClick={handleExportPDFList}
                  className="flex items-center gap-1 px-2.5 py-1.5 border border-slate-200 dark:border-slate-800 text-[10px] font-bold rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-slate-700 dark:text-slate-350 cursor-pointer"
                >
                  <PrinterIcon className="w-3.5 h-3.5" /> Export PDF
                </button>
              </div>
            </div>

            {/* Filter widgets */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-100 dark:border-slate-800/80">
              <div className="sm:col-span-2">
                <label className="block text-[9px] font-bold text-slate-400 uppercase mb-0.5">Search Product Name</label>
                <div className="relative">
                  <input 
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by Product Name..."
                    className="w-full pl-7 pr-3 py-1.5 text-[11px] border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:border-indigo-500 text-slate-900 dark:text-white font-bold bg-white dark:bg-slate-900"
                  />
                  <MagnifyingGlassIcon className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-2" />
                </div>
              </div>
              <div>
                <label className="block text-[9px] font-bold text-slate-400 uppercase mb-0.5">Adjust Type</label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="w-full px-2 py-1.5 text-[11px] border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 font-semibold text-slate-900 dark:text-white"
                >
                  <option value="">All Types</option>
                  <option value="Increase">Increase (+)</option>
                  <option value="Decrease">Decrease (-)</option>
                </select>
              </div>
              <div>
                <label className="block text-[9px] font-bold text-slate-400 uppercase mb-0.5">Reason</label>
                <select
                  value={filterReason}
                  onChange={(e) => setFilterReason(e.target.value)}
                  className="w-full px-2 py-1.5 text-[11px] border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 font-semibold text-slate-900 dark:text-white"
                >
                  <option value="">All Reasons</option>
                  {REASONS.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[9px] font-bold text-slate-400 uppercase mb-0.5">Adjusted By</label>
                <select
                  value={filterAdjustedBy}
                  onChange={(e) => setFilterAdjustedBy(e.target.value)}
                  className="w-full px-2 py-1.5 text-[11px] border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 font-semibold text-slate-900 dark:text-white"
                >
                  <option value="">All Operators</option>
                  {uniqueUsers.map(u => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[9px] font-bold text-slate-400 uppercase mb-0.5">Date From</label>
                <input 
                  type="date"
                  value={filterDateFrom}
                  onChange={(e) => setFilterDateFrom(e.target.value)}
                  className="w-full px-2 py-1 text-[11px] border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 font-semibold text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-[9px] font-bold text-slate-400 uppercase mb-0.5">Date To</label>
                <input 
                  type="date"
                  value={filterDateTo}
                  onChange={(e) => setFilterDateTo(e.target.value)}
                  className="w-full px-2 py-1 text-[11px] border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 font-semibold text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* TABLE LOG DISPLAY */}
          {loading ? (
            <div className="py-20 text-center text-slate-500 animate-pulse text-xs font-bold">Loading adjustments history...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50 dark:bg-slate-950">
                    <th className="py-2.5 px-3">Adjust No</th>
                    <th className="py-2.5 px-3">Date & Time</th>
                    <th className="py-2.5 px-3">Product Name</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3 text-center">Type</th>
                    <th className="py-2.5 px-3 text-center">Prev Stock</th>
                    <th className="py-2.5 px-3 text-center">Adjusted Qty</th>
                    <th className="py-2.5 px-3 text-center">New Stock</th>
                    <th className="py-2.5 px-3">Reason</th>
                    <th className="py-2.5 px-3">Operator</th>
                    <th className="py-2.5 px-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-350">
                  {filteredRecords.map((r) => {
                    const parsed = parseNotes(r.notes);
                    const isInc = r.quantity >= 0;
                    return (
                      <tr key={r.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-955/40 transition-colors">
                        <td className="py-3 px-3 font-mono font-bold text-slate-900 dark:text-white">
                          ADJ-{String(r.id).padStart(6, '0')}
                        </td>
                        <td className="py-3 px-3 text-slate-400 font-mono text-[10px]">
                          {new Date(r.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} {new Date(r.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="py-3 px-3">
                          <span className="block font-bold text-slate-955 dark:text-white">{r.product_name}</span>
                          {parsed.batchNo !== 'N/A' && (
                            <span className="block text-[9px] text-slate-400 font-mono">Batch: {parsed.batchNo}</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-slate-500 font-medium">{r.category_name || 'General'}</td>
                        <td className="py-3 px-3 text-center font-bold">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            isInc ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400' : 'bg-rose-50 text-rose-700 dark:bg-rose-955/20 dark:text-rose-400'
                          }`}>
                            {isInc ? 'Increase' : 'Decrease'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center font-mono text-slate-500">{r.previous_quantity ?? '—'}</td>
                        <td className="py-3 px-3 text-center font-black tabular-nums">
                          {isInc ? `+${r.quantity}` : r.quantity}
                        </td>
                        <td className="py-3 px-3 text-center font-mono text-slate-800 dark:text-white font-bold">{r.new_quantity ?? '—'}</td>
                        <td className="py-3 px-3 text-amber-700 font-bold text-[10px]">{parsed.reason}</td>
                        <td className="py-3 px-3 text-slate-450 font-medium">{r.user_name || 'Store Admin'}</td>
                        <td className="py-3 px-3">
                          <div className="flex items-center justify-center gap-1">
                            <button 
                              type="button"
                              onClick={() => setSelectedLogForView(r)}
                              className="p-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg cursor-pointer transition-all border border-indigo-150"
                              title="View Log Details"
                            >
                              <EyeIcon className="w-3.5 h-3.5" />
                            </button>
                            <button 
                              type="button"
                              onClick={() => handlePrintAdjustment(r)}
                              className="p-1 bg-slate-50 hover:bg-slate-100 text-slate-655 rounded-lg border border-slate-200 cursor-pointer"
                              title="Print Receipt"
                            >
                              <PrinterIcon className="w-3.5 h-3.5" />
                            </button>
                            {isSuperAdmin && (
                              <button 
                                type="button"
                                onClick={() => handleDeleteRecord(r.id)}
                                className="p-1 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg cursor-pointer border border-rose-250"
                                title="Void Adjustment"
                              >
                                <TrashIcon className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredRecords.length === 0 && (
                    <tr>
                      <td colSpan="11" className="py-12 text-center text-slate-400 font-bold">No stock adjustments matched filters</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>

      {/* VIEW MODAL: DETAILED ADJUSTMENT RECEIPT DIALOG */}
      <Modal
        isOpen={!!selectedLogForView}
        onClose={() => setSelectedLogForView(null)}
        title="Stock Adjustment Details"
        size="lg"
      >
        {selectedLogForView && (() => {
          const details = parseNotes(selectedLogForView.notes);
          return (
            <div className="space-y-6 text-xs font-semibold text-slate-700 dark:text-slate-350">
              {/* Header branding */}
              <div className="flex justify-between items-start border-b border-slate-150 pb-4">
                <div>
                  <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase">Kirana Store Inventory System</h4>
                  <p className="text-[10px] text-slate-400 font-bold">Physical Audit Log</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 font-mono">Date: {new Date(selectedLogForView.created_at).toLocaleString('en-IN')}</span>
                  <span className="block text-[10px] font-black text-indigo-650 uppercase">Adjustment ADJ-{String(selectedLogForView.id).padStart(6, '0')}</span>
                </div>
              </div>

              {/* Details grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 dark:bg-slate-950 p-4 border border-slate-105 dark:border-slate-800 rounded-xl space-y-1.5">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-1">Product Details</span>
                  <p>Product: <span className="text-slate-900 dark:text-white font-bold">{selectedLogForView.product_name}</span></p>
                  <p>Category: <span className="text-slate-900 dark:text-white font-bold">{selectedLogForView.category_name || 'General'}</span></p>
                  <p>Barcode: <span className="font-mono text-slate-600 dark:text-slate-400">{selectedLogForView.barcode || 'N/A'}</span></p>
                </div>

                <div className="bg-slate-50 dark:bg-slate-955 p-4 border border-slate-105 dark:border-slate-800 rounded-xl space-y-1.5">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-1">Adjustment Action</span>
                  <p>Type: <span className="text-slate-900 dark:text-white font-bold">{selectedLogForView.quantity >= 0 ? 'Increase (+)' : 'Decrease (-)'}</span></p>
                  <p>Adjusted Qty: <span className="text-slate-900 dark:text-white font-bold">{Math.abs(selectedLogForView.quantity)} Pcs</span></p>
                  <p>Stock Range: <span className="font-mono text-slate-600 dark:text-slate-400">Previous: {selectedLogForView.previous_quantity ?? '—'} → New: {selectedLogForView.new_quantity ?? '—'}</span></p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 bg-slate-50 dark:bg-slate-950 p-4 border border-slate-100 dark:border-slate-800 rounded-xl">
                <div>
                  <span className="block text-[9px] text-slate-400 font-bold uppercase mb-0.5">Batch Number</span>
                  <span className="font-mono text-slate-900 dark:text-white font-bold">{details.batchNo}</span>
                </div>
                <div>
                  <span className="block text-[9px] text-slate-400 font-bold uppercase mb-0.5">Manufacturing Date</span>
                  <span className="text-slate-900 dark:text-white font-bold">{details.mfgDate}</span>
                </div>
                <div>
                  <span className="block text-[9px] text-slate-400 font-bold uppercase mb-0.5">Expiry Date</span>
                  <span className="text-slate-900 dark:text-white font-bold text-rose-600">{details.expDate}</span>
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-950 border border-slate-150 p-3 rounded-xl space-y-1">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Reason & Remarks:</span>
                <p className="text-slate-900 dark:text-white font-bold">Reason: {details.reason}</p>
                <p className="text-slate-700 dark:text-slate-350 font-medium">Remarks: {details.remarks}</p>
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-150 pt-4">
                <button 
                  type="button" 
                  onClick={() => handlePrintAdjustment(selectedLogForView)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Print Receipt
                </button>
                <button 
                  type="button" 
                  onClick={() => setSelectedLogForView(null)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-500/20 cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          );
        })()}
      </Modal>

      {/* DELETE CONFIRM DIALOG */}
      <ConfirmDialog
        isOpen={deleteConfirm.open}
        title="Void Stock Adjustment"
        message="Are you sure you want to void this stock adjustment record? This will remove the audit trail log from the history display ledger."
        confirmLabel="Void Adjustment"
        cancelLabel="Cancel"
        type="danger"
        onConfirm={executeDeleteRecord}
        onCancel={() => setDeleteConfirm({ open: false, id: null })}
      />

    </div>
  );
};

export default StockAdjustment;
