import { useState, useEffect, useRef, useMemo } from 'react';
import {
  ExclamationTriangleIcon,
  TrashIcon,
  PrinterIcon,
  ArrowDownTrayIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  XMarkIcon,
  PhotoIcon,
  CheckCircleIcon,
  BuildingStorefrontIcon,
  DocumentTextIcon,
  CubeIcon,
  ArrowPathIcon,
  CurrencyRupeeIcon,
  CalendarIcon,
  UserIcon,
  NoSymbolIcon
} from '@heroicons/react/24/outline';
import StatsCard from '../../components/common/StatsCard';
import Modal from '../../components/common/Modal';
import { stockDestroyAPI, productsAPI, stockAPI } from '../../services/api';
import { useAppSelector } from '../../store/hooks';

const REASON_OPTIONS = [
  'Expired',
  'Damaged',
  'Broken',
  'Leakage',
  'Quality Issue',
  'Pest/Insect Damage',
  'Fire Damage',
  'Water Damage',
  'Theft Recovery Disposal',
  'Manufacturing Defect',
  'Other'
];

const StockDestroy = () => {
  const { user } = useAppSelector((state) => state.auth);
  const isReadOnly = user?.role === 'Super Admin';
  const isAdmin = (user?.role === 'Admin' || user?.role === 'Super Admin') && !isReadOnly;

  // KPI States
  const [kpis, setKpis] = useState({
    todayEntries: 0,
    totalDestroyedQty: 0,
    totalDestroyedValue: 0,
    monthRecords: 0
  });

  // Master Data
  const [productsList, setProductsList] = useState([]);
  const [destroysList, setDestroysList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    destroyNo: `DST-${new Date().getFullYear()}-0001`,
    destroyDate: new Date().toISOString().split('T')[0],
    productId: '',
    productName: '',
    barcode: '',
    sku: '',
    batchNo: 'DEFAULT',
    warehouseName: 'Main Storage',
    availableStock: 0,
    destroyQuantity: '',
    unit: 'Pcs',
    purchasePrice: 0,
    sellingPrice: 0,
    reason: 'Expired',
    remarks: '',
    evidenceImage: null
  });

  const [formErrors, setFormErrors] = useState({});
  const [successMsg, setSuccessMsg] = useState('');

  // History Panel Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReasonFilter, setSelectedReasonFilter] = useState('All');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('All');

  // Modals & View States
  const [viewingRecord, setViewingRecord] = useState(null);
  const [printingRecord, setPrintingRecord] = useState(null);
  const [cancellingRecord, setCancellingRecord] = useState(null);
  const [cancelReasonInput, setCancelReasonInput] = useState('');
  const [cancelError, setCancelError] = useState('');
  const [lightboxImage, setLightboxImage] = useState(null);

  const reportPrintRef = useRef();

  // Load Metadata & Initial Data
  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [kpiRes, listRes, prodRes, stockRes] = await Promise.all([
        stockDestroyAPI.getKPIs(),
        stockDestroyAPI.getAll(),
        productsAPI.getAll(),
        stockAPI.getSummary()
      ]);

      if (kpiRes.success) setKpis(kpiRes.kpis);
      if (listRes.success) setDestroysList(listRes.destroys);
      
      let prods = [];
      if (prodRes.success) prods = prodRes.products;

      // Merge current stock level from stock summary into products list
      if (stockRes.success && stockRes.stock) {
        const stockMap = {};
        stockRes.stock.forEach(s => {
          stockMap[s.product_id] = (stockMap[s.product_id] || 0) + Number(s.quantity || 0);
        });
        prods = prods.map(p => ({
          ...p,
          currentStock: stockMap[p.id] !== undefined ? stockMap[p.id] : Number(p.current_stock || 0)
        }));
      }

      setProductsList(prods);

      // Auto-generate Destroy No based on next ID
      if (listRes.destroys) {
        const nextId = listRes.destroys.length + 1;
        setFormData(prev => ({
          ...prev,
          destroyNo: `DST-${new Date().getFullYear()}-${String(nextId).padStart(4, '0')}`
        }));
      }
    } catch (err) {
      console.warn('Stock Destroy data load warning:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // Handle Product Selection and Auto-fill Metadata
  const handleProductChange = (e) => {
    const pId = e.target.value;
    if (!pId) {
      setFormData(prev => ({
        ...prev,
        productId: '',
        productName: '',
        barcode: '',
        sku: '',
        availableStock: 0,
        purchasePrice: 0,
        sellingPrice: 0,
        unit: 'Pcs'
      }));
      return;
    }

    const prod = productsList.find(p => String(p.id) === String(pId));
    if (prod) {
      setFormData(prev => ({
        ...prev,
        productId: prod.id,
        productName: prod.name,
        barcode: prod.barcode || prod.bar_code || 'N/A',
        sku: prod.sku || 'N/A',
        availableStock: Number(prod.currentStock || prod.stock || 0),
        purchasePrice: Number(prod.purchase_price || prod.price || 0),
        sellingPrice: Number(prod.selling_price || prod.mrp || 0),
        unit: prod.unit || 'Pcs'
      }));
      setFormErrors(prev => ({ ...prev, destroyQuantity: null, productId: null }));
    }
  };

  // Image Upload Handler
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('File size exceeds 5MB limit.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, evidenceImage: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Validation
  const validateForm = () => {
    const errors = {};
    if (!formData.productId) errors.productId = 'Product selection is required';
    if (!formData.destroyQuantity) {
      errors.destroyQuantity = 'Destroy quantity is required';
    } else {
      const qty = Number(formData.destroyQuantity);
      if (isNaN(qty) || qty <= 0) {
        errors.destroyQuantity = 'Quantity must be greater than zero';
      } else if (qty > formData.availableStock) {
        errors.destroyQuantity = `Destroy quantity (${qty}) cannot exceed available stock (${formData.availableStock} ${formData.unit})`;
      }
    }
    if (!formData.reason) errors.reason = 'Destruction reason is required';
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit Stock Destroy Form
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    setSuccessMsg('');

    try {
      const payload = {
        product_id: formData.productId,
        destroy_date: formData.destroyDate,
        destroy_quantity: Number(formData.destroyQuantity),
        reason: formData.reason,
        remarks: formData.remarks,
        evidence_image: formData.evidenceImage,
        warehouse_name: formData.warehouseName,
        batch_no: formData.batchNo
      };

      const res = await stockDestroyAPI.create(payload);

      if (res.success) {
        setSuccessMsg(`✓ Stock Destroy Entry ${res.destroyNo || formData.destroyNo} confirmed successfully! Inventory deducted.`);
        
        // Reset Form
        setFormData(prev => ({
          destroyNo: `DST-${new Date().getFullYear()}-${String(destroysList.length + 2).padStart(4, '0')}`,
          destroyDate: new Date().toISOString().split('T')[0],
          productId: '',
          productName: '',
          barcode: '',
          sku: '',
          batchNo: 'DEFAULT',
          warehouseName: 'Main Storage',
          availableStock: 0,
          destroyQuantity: '',
          unit: 'Pcs',
          purchasePrice: 0,
          sellingPrice: 0,
          reason: 'Expired',
          remarks: '',
          evidenceImage: null
        }));

        // Refresh Data
        await fetchAllData();

        setTimeout(() => setSuccessMsg(''), 5000);
      }
    } catch (err) {
      console.error('Failed to save stock destroy record:', err);
      const msg = err.response?.data?.message || 'Failed to confirm stock destruction. Please check input parameters.';
      alert(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Cancellation (Admin Only)
  const handleConfirmCancel = async () => {
    if (!cancelReasonInput || cancelReasonInput.trim() === '') {
      setCancelError('Please enter a mandatory cancellation reason.');
      return;
    }

    setSubmitting(true);
    setCancelError('');
    try {
      const res = await stockDestroyAPI.cancel(cancellingRecord.id, { cancel_reason: cancelReasonInput });
      if (res.success) {
        alert(`Stock Destroy Record ${cancellingRecord.destroy_no} cancelled. Stock restored successfully.`);
        setCancellingRecord(null);
        setCancelReasonInput('');
        await fetchAllData();
      }
    } catch (err) {
      console.error('Cancellation failed:', err);
      setCancelError(err.response?.data?.message || 'Failed to cancel record.');
    } finally {
      setSubmitting(false);
    }
  };

  // Filter History Records
  const filteredDestroys = useMemo(() => {
    return destroysList.filter(item => {
      const matchSearch = !searchQuery.trim() ||
        item.destroy_no.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.barcode && item.barcode.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.destroyed_by_name && item.destroyed_by_name.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchReason = selectedReasonFilter === 'All' || item.reason === selectedReasonFilter;
      const matchStatus = selectedStatusFilter === 'All' || item.status === selectedStatusFilter;

      return matchSearch && matchReason && matchStatus;
    });
  }, [destroysList, searchQuery, selectedReasonFilter, selectedStatusFilter]);

  // Export to CSV
  const handleExportCSV = () => {
    if (filteredDestroys.length === 0) {
      alert('No destroy records available to export.');
      return;
    }

    const headers = ['Destroy ID', 'Date', 'Product Name', 'Barcode', 'Batch', 'Warehouse', 'Qty', 'Unit', 'Reason', 'Value (INR)', 'Destroyed By', 'Status'];
    const rows = filteredDestroys.map(d => [
      d.destroy_no,
      d.created_at ? d.created_at.slice(0, 10) : '',
      `"${d.product_name.replace(/"/g, '""')}"`,
      d.barcode || 'N/A',
      d.batch_no || 'DEFAULT',
      d.warehouse_name || 'Main Storage',
      d.destroy_quantity,
      d.unit || 'Pcs',
      d.reason,
      Number(d.destroy_value || 0).toFixed(2),
      `"${(d.destroyed_by_name || 'Staff').replace(/"/g, '""')}"`,
      d.status
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Stock_Destruction_Report_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print A4 Stock Destruction Report
  const triggerPrintReport = (record) => {
    setPrintingRecord(record);
    setTimeout(() => {
      const printContent = reportPrintRef.current?.innerHTML;
      if (!printContent) return;
      const win = window.open('', '_blank');
      win.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Stock Destruction Report – ${record.destroy_no}</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            @page { size: A4 portrait; margin: 0.4in; }
            @media print {
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background: #fff !important; margin: 0; padding: 0; }
              .no-print { display: none !important; }
            }
            *{box-sizing:border-box;}
            body { font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0f172a; background: #fff; margin: 0; padding: 0; }
          </style>
        </head>
        <body class="bg-white p-2">
          <div class="w-full max-w-full">${printContent}</div>
        </body>
        </html>
      `);
      win.document.close();
      win.focus();
      setTimeout(() => { win.print(); win.close(); }, 500);
    }, 150);
  };

  const calculatedLossValue = useMemo(() => {
    const qty = Number(formData.destroyQuantity || 0);
    return (qty * formData.purchasePrice).toFixed(2);
  }, [formData.destroyQuantity, formData.purchasePrice]);

  return (
    <div className="space-y-6 select-none">
      
      {/* ── TOP KPI SUMMARY CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Today's Destroy Entries"
          value={kpis.todayEntries}
          icon={TrashIcon}
          subtext="Today's Logged Incidents"
          color="orange"
        />
        <StatsCard
          title="Total Destroyed Quantity"
          value={`${kpis.totalDestroyedQty.toLocaleString('en-IN')} Pcs`}
          icon={CubeIcon}
          subtext="Aggregated Permanent Loss"
          color="red"
        />
        <StatsCard
          title="Total Destroyed Value"
          value={`₹${kpis.totalDestroyedValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`}
          icon={CurrencyRupeeIcon}
          subtext="Cost Basis Inventory Write-off"
          color="purple"
        />
        <StatsCard
          title="This Month's Records"
          value={kpis.monthRecords}
          icon={CalendarIcon}
          subtext="Current Month Destruction Count"
          color="blue"
        />
      </div>

      {/* ── MAIN TWO-COLUMN LAYOUT ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* ── LEFT COLUMN: STOCK DESTROY FORM (5 COLS) ── */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white border border-slate-200/90 rounded-2xl shadow-sm overflow-hidden">
            
            {/* Header */}
            <div className="bg-gradient-to-r from-rose-900 to-rose-800 px-5 py-4 flex items-center justify-between text-white">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/10 rounded-xl border border-white/20">
                  <ExclamationTriangleIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-sm font-black tracking-wide uppercase">Stock Destroy Form</h2>
                  <p className="text-[10px] text-rose-200 font-medium">Permanent Damaged / Expired Inventory Disposal</p>
                </div>
              </div>
              <span className="font-mono text-xs font-bold bg-white/15 px-3 py-1 rounded-lg border border-white/20">
                {formData.destroyNo}
              </span>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
              
              {successMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 font-bold flex items-center gap-2">
                  <CheckCircleIcon className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* Destroy ID & Date Row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 uppercase mb-1 text-[10px]">Destroy Ref ID</label>
                  <input
                    type="text"
                    value={formData.destroyNo}
                    readOnly
                    className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 font-mono font-bold text-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 uppercase mb-1 text-[10px]">Destroy Date *</label>
                  <input
                    type="date"
                    value={formData.destroyDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, destroyDate: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-400"
                  />
                </div>
              </div>

              {/* Product Search Select */}
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1 text-[10px]">
                  Select Product *
                </label>
                <select
                  value={formData.productId}
                  onChange={handleProductChange}
                  className={`w-full bg-slate-50 border rounded-xl px-3 py-2.5 font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-400 ${
                    formErrors.productId ? 'border-rose-500 bg-rose-50' : 'border-slate-200'
                  }`}
                >
                  <option value="">— Search &amp; Select Product from Master —</option>
                  {productsList.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.barcode || 'No Barcode'}) — Available: {p.currentStock || 0} {p.unit || 'Pcs'}
                    </option>
                  ))}
                </select>
                {formErrors.productId && <p className="text-[10px] font-bold text-rose-600 mt-1">⚠ {formErrors.productId}</p>}
              </div>

              {/* Auto-filled Metadata Box */}
              {formData.productId && (
                <div className="p-3.5 bg-rose-50/40 border border-rose-100 rounded-xl grid grid-cols-2 gap-2 text-[11px]">
                  <div><span className="text-slate-500 font-medium">Barcode:</span> <strong className="font-mono text-slate-900">{formData.barcode}</strong></div>
                  <div><span className="text-slate-500 font-medium">SKU:</span> <strong className="font-mono text-slate-900">{formData.sku}</strong></div>
                  <div><span className="text-slate-500 font-medium">Batch:</span> <strong className="font-bold text-slate-900">{formData.batchNo}</strong></div>
                  <div><span className="text-slate-500 font-medium">Warehouse:</span> <strong className="font-bold text-slate-900">{formData.warehouseName}</strong></div>
                  <div><span className="text-slate-500 font-medium">Avail. Stock:</span> <strong className="font-bold text-emerald-700">{formData.availableStock} {formData.unit}</strong></div>
                  <div><span className="text-slate-500 font-medium">Cost Basis:</span> <strong className="font-mono font-bold text-slate-900">₹{formData.purchasePrice}</strong></div>
                </div>
              )}

              {/* Destroy Quantity & Reason Row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1 text-[10px]">
                    Destroy Quantity *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      step="any"
                      placeholder="e.g. 5"
                      value={formData.destroyQuantity}
                      onChange={(e) => setFormData(prev => ({ ...prev, destroyQuantity: e.target.value }))}
                      className={`w-full bg-slate-50 border rounded-xl px-3 py-2.5 font-bold font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-400 ${
                        formErrors.destroyQuantity ? 'border-rose-500 bg-rose-50 text-rose-900' : 'border-slate-200'
                      }`}
                    />
                    <span className="absolute right-3 top-2.5 text-[10px] font-bold text-slate-400">
                      {formData.unit}
                    </span>
                  </div>
                  {formErrors.destroyQuantity && (
                    <p className="text-[10px] font-bold text-rose-600 mt-1">⚠ {formErrors.destroyQuantity}</p>
                  )}
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1 text-[10px]">
                    Reason *
                  </label>
                  <select
                    value={formData.reason}
                    onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-400"
                  >
                    {REASON_OPTIONS.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Estimated Loss Value Display */}
              {Number(formData.destroyQuantity) > 0 && (
                <div className="p-3 bg-slate-900 text-white rounded-xl flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-300">Estimated Valuation Write-off Loss:</span>
                  <span className="text-base font-mono font-black text-rose-400">₹{calculatedLossValue}</span>
                </div>
              )}

              {/* Remarks */}
              <div>
                <label className="block font-bold text-slate-600 uppercase mb-1 text-[10px]">Remarks / Notes (Optional)</label>
                <textarea
                  rows="2"
                  placeholder="Additional inspection notes or disposal details..."
                  value={formData.remarks}
                  onChange={(e) => setFormData(prev => ({ ...prev, remarks: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-400"
                ></textarea>
              </div>

              {/* Approved By & Evidence Image */}
              <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-100">
                <div>
                  <label className="block font-bold text-slate-500 uppercase mb-1 text-[10px]">Approved / Destroyed By</label>
                  <input
                    type="text"
                    value={user?.name || 'Authorized Operator'}
                    readOnly
                    className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-700 text-[11px]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-600 uppercase mb-1 text-[10px]">Evidence Photo (Optional)</label>
                  <label className="flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl cursor-pointer text-[10px] font-bold text-slate-700 transition-all">
                    <PhotoIcon className="w-4 h-4 text-slate-500" />
                    <span>{formData.evidenceImage ? 'Change Image' : 'Attach Photo'}</span>
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  </label>
                </div>
              </div>

              {formData.evidenceImage && (
                <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-slate-300">
                  <img src={formData.evidenceImage} alt="Evidence Preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, evidenceImage: null }))}
                    className="absolute top-1 right-1 p-0.5 bg-rose-600 text-white rounded-full"
                  >
                    <XMarkIcon className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Submit Button */}
              {!isReadOnly ? (
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3 bg-gradient-to-r from-rose-700 to-rose-800 hover:from-rose-800 hover:to-rose-900 text-white rounded-xl font-bold shadow-lg shadow-rose-700/20 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <ExclamationTriangleIcon className="w-4 h-4 text-rose-200" />
                    <span>{submitting ? 'Processing Stock Deduction...' : 'Confirm Stock Destroy & Deduct'}</span>
                  </button>
                </div>
              ) : (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-center text-[11px] font-bold text-amber-700 dark:text-amber-300">
                  👁️ Monitoring Mode (Read-Only): Stock destruction entry is disabled.
                </div>
              )}

            </form>
          </div>
        </div>

        {/* ── RIGHT COLUMN: DESTROY HISTORY PANEL (7 COLS) ── */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white border border-slate-200/90 rounded-2xl shadow-sm p-5 space-y-4">
            
            {/* History Header & Filters */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <DocumentTextIcon className="w-5 h-5 text-rose-600" />
                  Stock Destruction Audit History
                </h3>
                <p className="text-[11px] text-slate-500 font-semibold mt-0.5">
                  Permanent record of written-off stock and destruction logs.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportCSV}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer"
                >
                  <ArrowDownTrayIcon className="w-3.5 h-3.5" />
                  Export Excel
                </button>
              </div>
            </div>

            {/* Filter controls */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Search */}
              <div className="relative">
                <MagnifyingGlassIcon className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search Destroy ID or Product..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs font-semibold focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Reason Filter */}
              <select
                value={selectedReasonFilter}
                onChange={(e) => setSelectedReasonFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:border-indigo-500"
              >
                <option value="All">All Reasons</option>
                {REASON_OPTIONS.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>

              {/* Status Filter */}
              <select
                value={selectedStatusFilter}
                onChange={(e) => setSelectedStatusFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:border-indigo-500"
              >
                <option value="All">All Statuses</option>
                <option value="Confirmed">Confirmed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>

            {/* Table Records */}
            {loading ? (
              <div className="py-12 flex justify-center">
                <span className="text-xs font-bold text-slate-400 animate-pulse">Loading Destroy Audit Logs...</span>
              </div>
            ) : filteredDestroys.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs font-bold bg-slate-50/50 rounded-xl border border-slate-100">
                No stock destruction entries match the current filter selection.
              </div>
            ) : (
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black text-slate-500 uppercase tracking-wider">
                      <th className="py-3 px-3">Destroy ID</th>
                      <th className="py-3 px-3">Date</th>
                      <th className="py-3 px-3">Product Description</th>
                      <th className="py-3 px-3 text-center">Qty</th>
                      <th className="py-3 px-3">Reason</th>
                      <th className="py-3 px-3 text-right">Loss Value</th>
                      <th className="py-3 px-3 text-center">Status</th>
                      <th className="py-3 px-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {filteredDestroys.map(item => (
                      <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-3 font-mono font-bold text-slate-900">{item.destroy_no}</td>
                        <td className="py-3 px-3 text-slate-500 whitespace-nowrap">{item.created_at ? item.created_at.slice(0, 10) : ''}</td>
                        <td className="py-3 px-3 font-bold text-slate-900">
                          {item.product_name}
                          {item.barcode && <div className="text-[10px] text-slate-400 font-mono font-normal">{item.barcode}</div>}
                        </td>
                        <td className="py-3 px-3 text-center font-bold font-mono text-rose-700">
                          {item.destroy_quantity} <span className="text-[10px] font-normal text-slate-400">{item.unit || 'Pcs'}</span>
                        </td>
                        <td className="py-3 px-3 font-semibold text-slate-700">
                          <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-800 border border-rose-100 text-[10px] font-bold">
                            {item.reason}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-black text-slate-900">
                          ₹{Number(item.destroy_value || 0).toFixed(2)}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            item.status === 'Cancelled' ? 'bg-slate-100 text-slate-600 border border-slate-200 line-through' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            {/* View Modal */}
                            <button
                              onClick={() => setViewingRecord(item)}
                              title="View Details"
                              className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                            >
                              <EyeIcon className="w-4 h-4" />
                            </button>

                            {/* Print Report */}
                            <button
                              onClick={() => triggerPrintReport(item)}
                              title="Print A4 Report"
                              className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                            >
                              <PrinterIcon className="w-4 h-4" />
                            </button>

                            {/* Cancel Entry (Admin only safeguard) */}
                            {isAdmin && item.status !== 'Cancelled' && (
                              <button
                                onClick={() => setCancellingRecord(item)}
                                title="Cancel Destruction (Restore Stock)"
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                              >
                                <NoSymbolIcon className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

          </div>
        </div>

      </div>

      {/* ── PROFESSIONAL ERP AUDIT RECORD DETAILS MODAL ── */}
      {viewingRecord && (
        <Modal
          isOpen={!!viewingRecord}
          onClose={() => setViewingRecord(null)}
          title={`Stock Destruction Record — ${viewingRecord.destroy_no}`}
          size="5xl"
          noPadding={true}
          showCloseButton={true}
        >
          <div className="bg-slate-100 dark:bg-slate-950 flex flex-col max-h-[88vh] overflow-hidden select-none">
            
            {/* STICKY TOP HEADER */}
            <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 text-white px-6 py-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-rose-600/20 text-rose-400 rounded-xl border border-rose-500/30">
                  <ExclamationTriangleIcon className="w-6 h-6 stroke-[2]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Audit Log Reference</span>
                    <span className={`px-2.5 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider ${
                      viewingRecord.status === 'Cancelled' ? 'bg-slate-800 text-slate-300 border border-slate-700 line-through' : 'bg-rose-900/80 text-rose-200 border border-rose-700'
                    }`}>
                      {viewingRecord.status}
                    </span>
                  </div>
                  <h2 className="text-lg font-black text-white tracking-tight font-mono">{viewingRecord.destroy_no}</h2>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => triggerPrintReport(viewingRecord)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold active:scale-95 transition-all shadow-sm cursor-pointer"
                >
                  <PrinterIcon className="w-4 h-4" />
                  Print A4 Report
                </button>
                <button
                  onClick={() => setViewingRecord(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold active:scale-95 transition-all cursor-pointer border border-slate-700"
                >
                  Close
                </button>
              </div>
            </div>

            {/* SCROLLABLE MAIN CONTENT BODY */}
            <div className="flex-1 overflow-y-auto p-5 md:p-6 space-y-5">

              {/* ── 2-COLUMN RESPONSIVE CARDS GRID ── */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

                {/* CARD 1: PRODUCT MASTER INFORMATION */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
                      <CubeIcon className="w-4.5 h-4.5 text-indigo-600" />
                      Product Master Information
                    </h3>
                    <span className="text-[10px] font-bold text-slate-400 font-mono">ID: #{viewingRecord.product_id}</span>
                  </div>

                  <div className="space-y-2.5 text-xs">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Product Name</span>
                      <p className="text-sm font-black text-slate-950 dark:text-white leading-tight">{viewingRecord.product_name}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Barcode / SKU</span>
                        <p className="font-mono font-bold text-slate-900 dark:text-slate-200 text-xs">{viewingRecord.barcode || viewingRecord.sku || 'N/A'}</p>
                      </div>

                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Batch Number</span>
                        <p className="font-bold text-slate-900 dark:text-slate-200 text-xs">{viewingRecord.batch_no || 'DEFAULT'}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Storage Warehouse</span>
                        <p className="font-bold text-slate-900 dark:text-slate-200 text-xs">{viewingRecord.warehouse_name || 'Main Storage'}</p>
                      </div>

                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Unit of Measurement</span>
                        <p className="font-bold text-slate-900 dark:text-slate-200 text-xs">{viewingRecord.unit || 'Pcs'}</p>
                      </div>
                    </div>

                    {viewingRecord.available_stock !== undefined && (
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs">
                        <span className="text-slate-500 font-semibold">Pre-Destruction Stock Level:</span>
                        <span className="font-bold font-mono text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                          {viewingRecord.available_stock} {viewingRecord.unit || 'Pcs'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* CARD 2: DESTRUCTION & FINANCIAL VALUATION DETAILS */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
                      <ExclamationTriangleIcon className="w-4.5 h-4.5 text-rose-600" />
                      Destruction &amp; Financial Loss Details
                    </h3>
                    <span className="px-2.5 py-0.5 rounded bg-rose-50 text-rose-800 border border-rose-200 text-[10px] font-extrabold uppercase">
                      {viewingRecord.reason}
                    </span>
                  </div>

                  <div className="space-y-2.5 text-xs">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Quantity Destroyed</span>
                        <p className="text-base font-black font-mono text-rose-600">
                          {viewingRecord.destroy_quantity} <span className="text-xs font-normal text-slate-500">{viewingRecord.unit || 'Pcs'}</span>
                        </p>
                      </div>

                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Purchase Cost Basis</span>
                        <p className="text-sm font-black font-mono text-slate-900 dark:text-slate-200">
                          ₹{Number(viewingRecord.purchase_price || 0).toFixed(2)}
                        </p>
                      </div>
                    </div>

                    {/* Prominent Financial Valuation Loss Box */}
                    <div className="bg-gradient-to-br from-slate-900 to-rose-950 text-white rounded-xl p-3.5 shadow-md flex items-center justify-between">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-rose-300 tracking-wider block">Total Inventory Write-off Loss</span>
                        <p className="text-[10px] text-slate-400 font-medium">Cost basis valuation reduction</p>
                      </div>
                      <span className="text-xl font-black font-mono text-rose-400">
                        ₹{Number(viewingRecord.destroy_value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Destruction Date &amp; Time</span>
                        <p className="font-bold text-slate-900 dark:text-slate-200 text-xs">
                          {viewingRecord.created_at ? viewingRecord.created_at.slice(0, 19).replace('T', ' ') : 'N/A'}
                        </p>
                      </div>

                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Logged / Approved By</span>
                        <p className="font-bold text-slate-900 dark:text-slate-200 text-xs">
                          {viewingRecord.destroyed_by_name || 'Authorized Staff'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* REMARKS / NOTES SECTION */}
              {viewingRecord.remarks && (
                <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 text-xs space-y-1">
                  <span className="text-[10px] font-black text-amber-800 uppercase tracking-widest block">Inspection Remarks / Disposal Notes</span>
                  <p className="text-amber-950 font-medium leading-relaxed">{viewingRecord.remarks}</p>
                </div>
              )}

              {/* CANCELLATION DETAILS (IF CANCELLED) */}
              {viewingRecord.status === 'Cancelled' && (
                <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-xs space-y-1 text-rose-900">
                  <span className="text-[10px] font-black text-rose-800 uppercase tracking-widest block">Stock Destruction Cancellation Audit</span>
                  <p className="font-bold">Cancelled By: {viewingRecord.cancelled_by_name || 'Admin'}</p>
                  <p className="text-xs font-medium">Mandatory Cancellation Reason: {viewingRecord.cancel_reason}</p>
                </div>
              )}

              {/* ── PHOTO EVIDENCE THUMBNAIL & LIGHTBOX PREVIEW ── */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <PhotoIcon className="w-4.5 h-4.5 text-indigo-600" />
                    Attached Photo Evidence
                  </h3>
                  {viewingRecord.evidence_image && (
                    <span className="text-[10px] font-bold text-slate-400">Click image to expand full screen</span>
                  )}
                </div>

                {viewingRecord.evidence_image ? (
                  <div className="flex flex-col items-center">
                    <div
                      onClick={() => setLightboxImage(viewingRecord.evidence_image)}
                      className="relative h-48 max-h-52 w-full max-w-md bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 flex items-center justify-center cursor-pointer group shadow-md"
                    >
                      <img
                        src={viewingRecord.evidence_image}
                        alt="Stock Destruction Evidence"
                        className="max-h-full w-auto object-contain transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white font-bold text-xs">
                        <MagnifyingGlassIcon className="w-5 h-5 text-white" />
                        <span>Click for Fullscreen View</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-50 dark:bg-slate-800/40 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col items-center justify-center text-center">
                    <PhotoIcon className="w-8 h-8 text-slate-300 mb-1.5" />
                    <p className="text-xs font-bold text-slate-600 dark:text-slate-300">No Photo Evidence Attached</p>
                    <p className="text-[10px] text-slate-400 font-medium mt-0.5">This destruction log was recorded without attaching an image.</p>
                  </div>
                )}
              </div>

              {/* AUDIT METADATA BAR */}
              <div className="bg-slate-200/60 dark:bg-slate-800/60 border border-slate-300/60 dark:border-slate-800 rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-2 text-[10px] font-medium text-slate-600 dark:text-slate-400">
                <span>Audit Ref: <strong className="font-mono font-bold text-slate-900 dark:text-white">{viewingRecord.destroy_no}</strong></span>
                <span>Logged By: <strong className="font-bold text-slate-900 dark:text-white">{viewingRecord.destroyed_by_name || 'Staff'}</strong></span>
                <span>Created: <strong className="font-bold text-slate-900 dark:text-white">{viewingRecord.created_at ? viewingRecord.created_at.slice(0, 10) : ''}</strong></span>
                <span>Verification Status: <strong className="text-emerald-700 font-bold uppercase">{viewingRecord.status}</strong></span>
              </div>

            </div>

            {/* STICKY BOTTOM ACTION FOOTER */}
            <div className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-6 py-3.5 flex items-center justify-between shrink-0">
              <div className="text-xs font-bold text-slate-500">
                Document: <span className="font-mono text-slate-900 dark:text-white">{viewingRecord.destroy_no}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => triggerPrintReport(viewingRecord)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold active:scale-95 transition-all shadow-sm cursor-pointer"
                >
                  <PrinterIcon className="w-4 h-4" />
                  Print A4 Report
                </button>
                <button
                  onClick={() => setViewingRecord(null)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>

          </div>
        </Modal>
      )}

      {/* ── CANCELLATION SAFEGUARD MODAL (ADMIN) ── */}
      {cancellingRecord && (
        <Modal
          isOpen={!!cancellingRecord}
          onClose={() => { setCancellingRecord(null); setCancelError(''); }}
          title={`Cancel Stock Destruction – ${cancellingRecord.destroy_no}`}
          size="md"
        >
          <div className="space-y-4 text-xs">
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 space-y-1">
              <p className="font-bold flex items-center gap-1.5 text-rose-700">
                <ExclamationTriangleIcon className="w-4 h-4 shrink-0" />
                Confirm Stock Destruction Cancellation
              </p>
              <p className="text-[11px]">
                Cancelling this record will restore <strong>{cancellingRecord.destroy_quantity} {cancellingRecord.unit}</strong> of <strong>{cancellingRecord.product_name}</strong> back into available store stock.
              </p>
            </div>

            {cancelError && (
              <p className="text-xs font-bold text-rose-600 bg-rose-50 p-2 rounded-lg border border-rose-200">
                ⚠ {cancelError}
              </p>
            )}

            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1 text-[10px]">
                Mandatory Cancellation Reason *
              </label>
              <textarea
                rows="3"
                placeholder="Enter mandatory reason for reversing this destruction log..."
                value={cancelReasonInput}
                onChange={(e) => setCancelReasonInput(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-400 text-xs"
              ></textarea>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => { setCancellingRecord(null); setCancelError(''); }}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold"
              >
                Keep Record
              </button>
              <button
                onClick={handleConfirmCancel}
                disabled={submitting}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold active:scale-95 transition-all disabled:opacity-50"
              >
                {submitting ? 'Restoring Stock...' : 'Confirm Cancellation & Restore Stock'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── HIDDEN PRINT CONTAINER FOR A4 STOCK DESTRUCTION REPORT ── */}
      <div className="hidden">
        {printingRecord && (
          <div ref={reportPrintRef} className="p-8 space-y-6 text-slate-900 font-sans">
            
            {/* Report Header */}
            <div className="flex justify-between items-start border-b-2 border-slate-900 pb-6">
              <div>
                <h1 className="text-2xl font-black text-slate-950 uppercase tracking-tight">KIRANA MART ERP</h1>
                <p className="text-xs text-slate-600 font-medium">102, Malviya Nagar, Main Commercial Market, New Delhi - 110017</p>
                <p className="text-xs text-slate-600 font-medium">GSTIN: 07AAAAA1111A1Z1 • Phone: +91 98765 43210</p>
              </div>

              <div className="text-right">
                <div className="inline-block bg-rose-900 text-white px-4 py-1.5 rounded text-xs font-black uppercase tracking-widest mb-2">
                  STOCK DESTRUCTION REPORT
                </div>
                <p className="text-xs font-bold text-slate-900">Report Ref: <span className="font-mono">{printingRecord.destroy_no}</span></p>
                <p className="text-xs text-slate-600">Date: {printingRecord.created_at ? printingRecord.created_at.slice(0, 10) : ''}</p>
              </div>
            </div>

            {/* Record Details Table */}
            <div className="border border-slate-300 rounded-xl overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <tbody>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <td className="py-2.5 px-4 font-bold text-slate-600 w-1/3">Product Name:</td>
                    <td className="py-2.5 px-4 font-black text-slate-950 text-sm">{printingRecord.product_name}</td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <td className="py-2.5 px-4 font-bold text-slate-600">Barcode / SKU:</td>
                    <td className="py-2.5 px-4 font-mono font-bold">{printingRecord.barcode || printingRecord.sku || 'N/A'}</td>
                  </tr>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <td className="py-2.5 px-4 font-bold text-slate-600">Batch Number &amp; Warehouse:</td>
                    <td className="py-2.5 px-4 font-semibold">{printingRecord.batch_no || 'DEFAULT'} ({printingRecord.warehouse_name || 'Main Storage'})</td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <td className="py-2.5 px-4 font-bold text-slate-600">Quantity Destroyed:</td>
                    <td className="py-2.5 px-4 font-bold font-mono text-rose-700 text-sm">{printingRecord.destroy_quantity} {printingRecord.unit || 'Pcs'}</td>
                  </tr>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <td className="py-2.5 px-4 font-bold text-slate-600">Destruction Reason:</td>
                    <td className="py-2.5 px-4 font-bold text-slate-900">{printingRecord.reason}</td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <td className="py-2.5 px-4 font-bold text-slate-600">Purchase Cost Basis:</td>
                    <td className="py-2.5 px-4 font-mono">₹{Number(printingRecord.purchase_price || 0).toFixed(2)} / {printingRecord.unit || 'Pcs'}</td>
                  </tr>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <td className="py-2.5 px-4 font-bold text-slate-600">Estimated Inventory Valuation Loss:</td>
                    <td className="py-2.5 px-4 font-mono font-black text-rose-700 text-base">₹{Number(printingRecord.destroy_value || 0).toFixed(2)}</td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <td className="py-2.5 px-4 font-bold text-slate-600">Destroyed / Logged By:</td>
                    <td className="py-2.5 px-4 font-bold">{printingRecord.destroyed_by_name || 'Store Staff'}</td>
                  </tr>
                  <tr className="bg-slate-50">
                    <td className="py-2.5 px-4 font-bold text-slate-600">Disposal Remarks:</td>
                    <td className="py-2.5 px-4 font-medium">{printingRecord.remarks || 'Stock write-off confirmed and removed from physical inventory.'}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {printingRecord.evidence_image && (
              <div className="border border-slate-300 rounded-xl p-4 space-y-2">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Attached Photo Evidence</p>
                <div className="h-44 max-h-48 rounded-lg overflow-hidden border border-slate-200 bg-slate-100 flex items-center justify-center">
                  <img src={printingRecord.evidence_image} alt="Photo Evidence" className="max-h-full max-w-full object-contain" />
                </div>
              </div>
            )}

            {/* Signature Blocks */}
            <div className="mt-12 pt-8 border-t border-slate-300 grid grid-cols-3 gap-6 text-center text-xs">
              <div className="flex flex-col items-center justify-end h-20">
                <div className="w-4/5 border-b border-slate-400 border-dashed mb-2"></div>
                <p className="font-bold text-slate-900">Destroyed Staff Signature</p>
                <p className="text-[10px] text-slate-500">Initiated By</p>
              </div>

              <div className="flex flex-col items-center justify-center">
                <div className="w-20 h-20 border-2 border-dashed border-slate-400 rounded-full flex items-center justify-center text-[9px] font-black text-slate-400 uppercase p-2 text-center">
                  Official Store Stamp
                </div>
              </div>

              <div className="flex flex-col items-center justify-end h-20">
                <div className="w-4/5 border-b border-slate-400 border-dashed mb-2"></div>
                <p className="font-bold text-slate-900">Store Manager / Auditor</p>
                <p className="text-[10px] text-slate-500">Authorized Verification</p>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-8 pt-4 border-t border-slate-200 text-center text-[10px] text-slate-500 uppercase font-semibold">
              Generated by Kirana ERP Inventory Management System • Audit Ref: {printingRecord.destroy_no}
            </div>

          </div>
        )}
      </div>

      {/* ── FULLSCREEN EVIDENCE PHOTO LIGHTBOX MODAL ── */}
      {lightboxImage && (
        <Modal
          isOpen={!!lightboxImage}
          onClose={() => setLightboxImage(null)}
          title="Photo Evidence — Fullscreen View"
          size="full"
          noPadding={true}
        >
          <div className="bg-slate-950 text-white flex flex-col h-full overflow-hidden select-none">
            <div className="bg-slate-900 px-6 py-3.5 flex justify-between items-center border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
                <PhotoIcon className="w-5 h-5 text-rose-400" />
                <span>Stock Destruction Photo Evidence Lightbox</span>
              </div>
              <button
                onClick={() => setLightboxImage(null)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer border border-slate-700"
              >
                Close Fullscreen
              </button>
            </div>
            <div className="flex-1 overflow-auto p-6 flex items-center justify-center bg-black">
              <img
                src={lightboxImage}
                alt="Full Photo Evidence"
                className="max-h-full max-w-full object-contain rounded-xl shadow-2xl"
              />
            </div>
          </div>
        </Modal>
      )}

    </div>
  );
};

export default StockDestroy;
