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
  NoSymbolIcon,
  ArrowRightIcon,
  ShieldExclamationIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import StatsCard from '../../components/common/StatsCard';
import Modal from '../../components/common/Modal';
import { stockDestroyAPI, productsAPI, stockAPI } from '../../services/api';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { fetchStockSummary, fetchStockAlerts } from '../../store/slices/stockSlice';
import { fetchProducts } from '../../store/slices/productSlice';
import { fetchInventorySummary } from '../../store/slices/reportSlice';

const REASON_OPTIONS = [
  'Damaged',
  'Expired',
  'Defective',
  'Broken',
  'Spoiled',
  'Lost',
  'Quality Issue',
  'Other'
];

const StockDestroy = ({ onStockChanged }) => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const isReadOnly = user?.role === 'Super Admin';
  const isAdmin = (user?.role === 'Admin' || user?.role === 'Super Admin') && !isReadOnly;

  // KPI States
  const [kpis, setKpis] = useState({
    todayEntries: 0,
    totalDestroyedQty: 0,
    totalDestroyedValue: 0,
    monthRecords: 0,
    draftCount: 0
  });

  // Master Data
  const [productsList, setProductsList] = useState([]);
  const [destroysList, setDestroysList] = useState([]);
  const [availableBatches, setAvailableBatches] = useState([]);
  const [loadingBatches, setLoadingBatches] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    destroyNo: `SCRAP-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-0001`,
    destroyDate: new Date().toISOString().split('T')[0],
    productId: '',
    productName: '',
    barcode: '',
    sku: '',
    batchId: '',
    batchNo: 'DEFAULT',
    warehouseName: 'Main Storage',
    sourceLocation: 'Main Storage',
    scrapLocation: 'Scrap / Inventory Loss Location',
    availableStock: 0,
    batchAvailableStock: null,
    destroyQuantity: '',
    unit: 'Pcs',
    unitCost: 0,
    purchasePrice: 0,
    sellingPrice: 0,
    reason: 'Damaged',
    remarks: '',
    evidenceImage: null
  });

  const [formErrors, setFormErrors] = useState({});
  const [successMsg, setSuccessMsg] = useState('');

  // Confirmation Summary Modal State
  const [summaryModalOpen, setSummaryModalOpen] = useState(false);
  const [pendingStatus, setPendingStatus] = useState('Confirmed');

  // History Panel Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReasonFilter, setSelectedReasonFilter] = useState('All');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('All');
  const [selectedBatchFilter, setSelectedBatchFilter] = useState('All');
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');

  // Modals & View States
  const [viewingRecord, setViewingRecord] = useState(null);
  const [printingRecord, setPrintingRecord] = useState(null);
  const [cancellingRecord, setCancellingRecord] = useState(null);
  const [cancelReasonInput, setCancelReasonInput] = useState('');
  const [cancelError, setCancelError] = useState('');
  const [lightboxImage, setLightboxImage] = useState(null);

  const reportPrintRef = useRef();

  // Broadcast stock update to Redux store & global window events
  const broadcastStockUpdate = () => {
    try {
      dispatch(fetchStockSummary());
      dispatch(fetchStockAlerts());
      dispatch(fetchProducts());
      dispatch(fetchInventorySummary());
      if (onStockChanged) onStockChanged();
      window.dispatchEvent(new CustomEvent('stock-changed'));
      window.dispatchEvent(new CustomEvent('inventory-updated'));
    } catch (e) {
      console.warn('Broadcasting stock update warning:', e);
    }
  };

  // Load Metadata & Initial Data
  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [kpiRes, listRes, prodRes, stockRes] = await Promise.all([
        stockDestroyAPI.getKPIs(),
        stockDestroyAPI.getAll({
          search: searchQuery,
          reason: selectedReasonFilter,
          status: selectedStatusFilter,
          batchNo: selectedBatchFilter,
          startDate: startDateFilter,
          endDate: endDateFilter
        }),
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
          currentStock: stockMap[p.id] !== undefined ? stockMap[p.id] : Number(p.currentStock || p.total_stock || p.stock || 0)
        }));
      }

      setProductsList(prods);

      if (listRes.destroys) {
        const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const nextId = listRes.destroys.length + 1;
        setFormData(prev => ({
          ...prev,
          destroyNo: `SCRAP-${dateStr}-${String(nextId).padStart(4, '0')}`
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
  }, [selectedReasonFilter, selectedStatusFilter, selectedBatchFilter, startDateFilter, endDateFilter]);

  // Handle Product Selection and fetch Batches
  const handleProductChange = async (e) => {
    const pId = e.target.value;
    if (!pId) {
      setFormData(prev => ({
        ...prev,
        productId: '',
        productName: '',
        barcode: '',
        sku: '',
        batchId: '',
        batchNo: 'DEFAULT',
        availableStock: 0,
        batchAvailableStock: null,
        unitCost: 0,
        purchasePrice: 0,
        sellingPrice: 0,
        unit: 'Pcs'
      }));
      setAvailableBatches([]);
      return;
    }

    const prod = productsList.find(p => String(p.id) === String(pId));
    if (prod) {
      const pCost = Number(prod.purchase_price || prod.price || 0);
      setFormData(prev => ({
        ...prev,
        productId: prod.id,
        productName: prod.name,
        barcode: prod.barcode || prod.bar_code || 'N/A',
        sku: prod.sku || 'N/A',
        batchId: '',
        batchNo: 'DEFAULT',
        availableStock: Number(prod.currentStock || prod.stock || 0),
        batchAvailableStock: null,
        unitCost: pCost,
        purchasePrice: pCost,
        sellingPrice: Number(prod.selling_price || prod.mrp || 0),
        unit: prod.unit || 'Pcs'
      }));
      setFormErrors(prev => ({ ...prev, destroyQuantity: null, productId: null }));

      // Fetch active batches for selected product
      setLoadingBatches(true);
      try {
        const bRes = await stockDestroyAPI.getBatches(prod.id);
        if (bRes.success && bRes.batches) {
          setAvailableBatches(bRes.batches);
        } else {
          setAvailableBatches([]);
        }
      } catch (err) {
        console.warn('Failed to load batches for product:', err);
        setAvailableBatches([]);
      } finally {
        setLoadingBatches(false);
      }
    }
  };

  // Handle Batch Selection
  const handleBatchChange = (e) => {
    const bId = e.target.value;
    if (!bId) {
      setFormData(prev => ({
        ...prev,
        batchId: '',
        batchNo: 'DEFAULT',
        batchAvailableStock: null,
        unitCost: prev.purchasePrice
      }));
      return;
    }

    const selectedB = availableBatches.find(b => String(b.id) === String(bId));
    if (selectedB) {
      const bPrice = Number(selectedB.purchase_price || 0);
      setFormData(prev => ({
        ...prev,
        batchId: selectedB.id,
        batchNo: selectedB.batch_number || 'DEFAULT',
        batchAvailableStock: Number(selectedB.remaining_quantity || 0),
        unitCost: bPrice > 0 ? bPrice : prev.purchasePrice
      }));
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
        errors.destroyQuantity = `Quantity (${qty}) cannot exceed total available stock (${formData.availableStock} ${formData.unit})`;
      } else if (formData.batchAvailableStock !== null && qty > formData.batchAvailableStock) {
        errors.destroyQuantity = `Quantity (${qty}) cannot exceed selected batch stock (${formData.batchAvailableStock} ${formData.unit})`;
      }
    }
    if (!formData.reason) errors.reason = 'Destruction reason is required';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Trigger Summary Modal
  const handleFormSubmit = (e, statusChoice = 'Confirmed') => {
    e.preventDefault();
    if (!validateForm()) return;
    setPendingStatus(statusChoice);
    setSummaryModalOpen(true);
  };

  // Final Confirmed Execution
  const executeSubmission = async () => {
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
        source_location: formData.sourceLocation,
        scrap_location: formData.scrapLocation,
        batch_id: formData.batchId || null,
        batch_no: formData.batchNo,
        status: pendingStatus
      };

      const res = await stockDestroyAPI.create(payload);

      if (res.success) {
        setSummaryModalOpen(false);
        setSuccessMsg(
          pendingStatus === 'Confirmed'
            ? `✓ Scrap transaction ${res.destroyNo || formData.destroyNo} confirmed successfully! Inventory moved to Scrap Location.`
            : `✓ Stock Destroy draft ${res.destroyNo || formData.destroyNo} saved.`
        );

        // Reset Form
        const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        setFormData(prev => ({
          destroyNo: `SCRAP-${dateStr}-${String(destroysList.length + 2).padStart(4, '0')}`,
          destroyDate: new Date().toISOString().split('T')[0],
          productId: '',
          productName: '',
          barcode: '',
          sku: '',
          batchId: '',
          batchNo: 'DEFAULT',
          warehouseName: 'Main Storage',
          sourceLocation: 'Main Storage',
          scrapLocation: 'Scrap / Inventory Loss Location',
          availableStock: 0,
          batchAvailableStock: null,
          destroyQuantity: '',
          unit: 'Pcs',
          unitCost: 0,
          purchasePrice: 0,
          sellingPrice: 0,
          reason: 'Damaged',
          remarks: '',
          evidenceImage: null
        }));
        setAvailableBatches([]);

        // Dynamic Realtime Broadcast & Fetch
        broadcastStockUpdate();
        await fetchAllData();
        setTimeout(() => setSuccessMsg(''), 6000);
      }
    } catch (err) {
      console.error('Failed to save stock destroy record:', err);
      const msg = err.response?.data?.message || 'Failed to submit stock destruction request.';
      alert(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // Confirm Draft Action
  const handleConfirmDraft = async (record) => {
    if (!window.confirm(`Are you sure you want to confirm and validate Scrap record ${record.destroy_no}? Stock will be moved to Scrap Location immediately.`)) {
      return;
    }

    setSubmitting(true);
    try {
      const res = await stockDestroyAPI.confirm(record.id);
      if (res.success) {
        alert(`Scrap record ${record.destroy_no} confirmed and inventory stock updated!`);
        broadcastStockUpdate();
        await fetchAllData();
      }
    } catch (err) {
      console.error('Failed to confirm draft:', err);
      alert(err.response?.data?.message || 'Failed to confirm draft scrap record.');
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
        broadcastStockUpdate();
        await fetchAllData();
      }
    } catch (err) {
      console.error('Cancellation failed:', err);
      setCancelError(err.response?.data?.message || 'Failed to cancel record.');
    } finally {
      setSubmitting(false);
    }
  };

  // Filtered Destroy History
  const filteredDestroys = useMemo(() => {
    return destroysList.filter(item => {
      const matchesSearch =
        !searchQuery ||
        item.destroy_no?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.product_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.barcode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.batch_no?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.remarks?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesReason = selectedReasonFilter === 'All' || item.reason === selectedReasonFilter;
      const matchesStatus = selectedStatusFilter === 'All' || item.status === selectedStatusFilter;
      const matchesBatch = selectedBatchFilter === 'All' || item.batch_no === selectedBatchFilter;

      return matchesSearch && matchesReason && matchesStatus && matchesBatch;
    });
  }, [destroysList, searchQuery, selectedReasonFilter, selectedStatusFilter, selectedBatchFilter]);

  const estimatedLoss = useMemo(() => {
    const qty = Number(formData.destroyQuantity || 0);
    const cost = Number(formData.unitCost || 0);
    return Number((qty * cost).toFixed(2));
  }, [formData.destroyQuantity, formData.unitCost]);

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-red-900 via-rose-950 to-slate-900 p-6 rounded-2xl shadow-xl border border-red-800/40 text-white">
        <div>
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-red-600/20 backdrop-blur-md border border-red-500/30 rounded-xl">
              <TrashIcon className="w-8 h-8 text-red-400" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight">Stock Destroy & Scrap Management</h1>
              <p className="text-sm text-red-200/80 mt-1">
                Odoo 19 Scrap Inventory Logic • Source Location → Virtual Scrap Location Stock Movements
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => {
              broadcastStockUpdate();
              fetchAllData();
            }}
            className="flex items-center space-x-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-medium transition backdrop-blur-sm border border-white/10"
          >
            <ArrowPathIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatsCard
          title="Today's Scrap Entries"
          value={kpis.todayEntries}
          subtitle="Validated entries today"
          icon={CalendarIcon}
          color="emerald"
        />
        <StatsCard
          title="Total Scrapped Qty"
          value={`${kpis.totalDestroyedQty.toLocaleString()} Pcs`}
          subtitle="All-time destroyed stock"
          icon={CubeIcon}
          color="orange"
        />
        <StatsCard
          title="Total Scrapped Value"
          value={`₹${kpis.totalDestroyedValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
          subtitle="Direct inventory valuation loss"
          icon={CurrencyRupeeIcon}
          color="rose"
        />
        <StatsCard
          title="This Month Records"
          value={kpis.monthRecords}
          subtitle="Total scrap logs this month"
          icon={DocumentTextIcon}
          color="blue"
        />
        <StatsCard
          title="Draft Scrap Entries"
          value={kpis.draftCount}
          subtitle="Pending confirmation"
          icon={ClockIcon}
          color="amber"
        />
      </div>

      {/* Main Content: Form & History */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Entry Form */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-md border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-gray-100 dark:border-gray-700">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <ShieldExclamationIcon className="w-5 h-5 text-red-500" />
                New Scrap / Destroy Transaction
              </h2>
              <span className="px-2.5 py-1 text-xs font-semibold text-rose-700 bg-rose-50 dark:bg-rose-950/40 dark:text-rose-300 rounded-full border border-rose-200 dark:border-rose-800">
                Odoo Stock Movement
              </span>
            </div>

            {successMsg && (
              <div className="p-4 mb-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-sm rounded-xl flex items-start space-x-2">
                <CheckCircleIcon className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={(e) => handleFormSubmit(e, 'Confirmed')} className="space-y-4">
              {/* Reference No & Date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Scrap Ref No
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={formData.destroyNo}
                    className="w-full px-3 py-2 text-xs font-mono bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg border border-gray-300 dark:border-gray-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Destroy Date
                  </label>
                  <input
                    type="date"
                    value={formData.destroyDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, destroyDate: e.target.value }))}
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>

              {/* Product Selection */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Select Product <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.productId}
                  onChange={handleProductChange}
                  className={`w-full px-3 py-2.5 text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg border ${
                    formErrors.productId ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  } focus:ring-2 focus:ring-red-500`}
                >
                  <option value="">-- Choose Product from Catalogue --</option>
                  {productsList.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.barcode || p.sku || 'No Barcode'}) - Stock: {p.currentStock || 0} {p.unit || 'Pcs'}
                    </option>
                  ))}
                </select>
                {formErrors.productId && <p className="text-[11px] text-red-500 mt-1">{formErrors.productId}</p>}
              </div>

              {/* Locations */}
              <div className="grid grid-cols-2 gap-3 bg-gray-50 dark:bg-gray-900/50 p-3 rounded-xl border border-gray-200 dark:border-gray-700">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1">
                    Source Location
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={formData.sourceLocation}
                    className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded border border-gray-200 dark:border-gray-700 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-red-600 dark:text-red-400 mb-1">
                    Destination Scrap Location
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={formData.scrapLocation}
                    className="w-full px-2.5 py-1.5 text-xs bg-red-50 dark:bg-red-950/40 text-red-900 dark:text-red-200 rounded border border-red-200 dark:border-red-800 font-semibold"
                  />
                </div>
              </div>

              {/* Batch/Lot Selector */}
              {formData.productId && (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1 flex items-center justify-between">
                    <span>Batch / Lot Selection (FIFO)</span>
                    {loadingBatches && <span className="text-[10px] text-amber-500 animate-pulse">Loading batches...</span>}
                  </label>
                  <select
                    value={formData.batchId}
                    onChange={handleBatchChange}
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-red-500"
                  >
                    <option value="">-- All Batches (Auto FIFO Deduction) --</option>
                    {availableBatches.map(b => (
                      <option key={b.id} value={b.id}>
                        Batch: {b.batch_number || 'DEFAULT'} | Rem: {b.remaining_quantity} | Cost: ₹{b.purchase_price || formData.purchasePrice} | Exp: {b.expiry_date ? new Date(b.expiry_date).toLocaleDateString() : 'N/A'}
                      </option>
                    ))}
                  </select>
                  {formData.batchAvailableStock !== null && (
                    <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 font-medium">
                      ✓ Selected Batch Remaining Stock: <strong>{formData.batchAvailableStock} {formData.unit}</strong> (Unit Cost: ₹{formData.unitCost})
                    </p>
                  )}
                </div>
              )}

              {/* Stock Info Banner */}
              {formData.productId && (
                <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-800 text-xs">
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Total System Stock:</span>{' '}
                    <span className="font-bold text-blue-700 dark:text-blue-300">
                      {formData.availableStock} {formData.unit}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Unit Valuation Cost:</span>{' '}
                    <span className="font-bold text-emerald-700 dark:text-emerald-300">
                      ₹{formData.unitCost}
                    </span>
                  </div>
                </div>
              )}

              {/* Destroy Quantity & Reason */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Destroy Quantity <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0.001"
                    step="any"
                    placeholder={`Qty in ${formData.unit}`}
                    value={formData.destroyQuantity}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, destroyQuantity: e.target.value }));
                      setFormErrors(prev => ({ ...prev, destroyQuantity: null }));
                    }}
                    className={`w-full px-3 py-2 text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg border ${
                      formErrors.destroyQuantity ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    } focus:ring-2 focus:ring-red-500 font-bold`}
                  />
                  {formErrors.destroyQuantity && (
                    <p className="text-[11px] text-red-500 mt-1">{formErrors.destroyQuantity}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Reason <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.reason}
                    onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-red-500"
                  >
                    {REASON_OPTIONS.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Estimated Valuation Impact Preview */}
              {estimatedLoss > 0 && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/40 rounded-xl border border-rose-200 dark:border-rose-800 text-xs flex items-center justify-between">
                  <span className="font-medium text-rose-800 dark:text-rose-300">Inventory Valuation Loss:</span>
                  <span className="font-extrabold text-sm text-rose-700 dark:text-rose-400">
                    -₹{estimatedLoss.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              )}

              {/* Remarks */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Notes / Remarks
                </label>
                <textarea
                  rows="2"
                  placeholder="Enter detailed reason or incident report..."
                  value={formData.remarks}
                  onChange={(e) => setFormData(prev => ({ ...prev, remarks: e.target.value }))}
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-red-500"
                />
              </div>

              {/* Evidence Upload */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Evidence Photo (Optional)
                </label>
                <div className="flex items-center space-x-3">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="block w-full text-xs text-gray-500 dark:text-gray-400 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100 dark:file:bg-red-950/50 dark:file:text-red-300"
                  />
                  {formData.evidenceImage && (
                    <img
                      src={formData.evidenceImage}
                      alt="Preview"
                      className="w-10 h-10 object-cover rounded-lg border border-gray-300 shadow-sm cursor-pointer"
                      onClick={() => setLightboxImage(formData.evidenceImage)}
                    />
                  )}
                </div>
              </div>

              {/* Form Buttons */}
              <div className="pt-2 flex items-center space-x-3">
                <button
                  type="button"
                  disabled={submitting || isReadOnly}
                  onClick={(e) => handleFormSubmit(e, 'Confirmed')}
                  className="flex-1 py-3 px-4 bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-700 hover:to-rose-800 text-white font-bold rounded-xl shadow-lg shadow-red-600/30 transition disabled:opacity-50 text-xs flex items-center justify-center space-x-2"
                >
                  <ShieldExclamationIcon className="w-4 h-4" />
                  <span>Confirm Scrap (Deduct Stock)</span>
                </button>
                <button
                  type="button"
                  disabled={submitting || isReadOnly}
                  onClick={(e) => handleFormSubmit(e, 'Draft')}
                  className="py-3 px-4 bg-amber-100 hover:bg-amber-200 dark:bg-amber-950/50 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-200 font-semibold rounded-xl transition disabled:opacity-50 text-xs border border-amber-300 dark:border-amber-700"
                >
                  Save Draft
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* History Panel & Filters */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-md border border-gray-200 dark:border-gray-700">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-gray-100 dark:border-gray-700">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <DocumentTextIcon className="w-5 h-5 text-gray-500" />
                Scrap & Destroy Audit History
              </h2>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {filteredDestroys.length} record(s) found
              </span>
            </div>

            {/* Filter Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
              <div className="relative">
                <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search ref no, product, barcode..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div>
                <select
                  value={selectedReasonFilter}
                  onChange={(e) => setSelectedReasonFilter(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl border border-gray-200 dark:border-gray-600"
                >
                  <option value="All">All Reasons</option>
                  {REASON_OPTIONS.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              <div>
                <select
                  value={selectedStatusFilter}
                  onChange={(e) => setSelectedStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl border border-gray-200 dark:border-gray-600"
                >
                  <option value="All">All Statuses</option>
                  <option value="Confirmed">Confirmed</option>
                  <option value="Draft">Draft</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="p-3">Ref No / Date</th>
                    <th className="p-3">Product / Batch</th>
                    <th className="p-3">Qty & Unit</th>
                    <th className="p-3">Valuation Loss</th>
                    <th className="p-3">Reason</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700 text-gray-700 dark:text-gray-300">
                  {loading ? (
                    <tr>
                      <td colSpan="7" className="p-8 text-center text-gray-500">
                        <ArrowPathIcon className="w-6 h-6 animate-spin mx-auto mb-2 text-red-500" />
                        Loading Scrap logs...
                      </td>
                    </tr>
                  ) : filteredDestroys.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="p-8 text-center text-gray-400">
                        No scrap records matching filters.
                      </td>
                    </tr>
                  ) : (
                    filteredDestroys.map(item => (
                      <tr key={item.id} className="hover:bg-gray-50/80 dark:hover:bg-gray-700/40 transition">
                        <td className="p-3">
                          <div className="font-mono font-bold text-gray-900 dark:text-white">{item.destroy_no}</div>
                          <div className="text-[11px] text-gray-400">{new Date(item.created_at).toLocaleDateString()}</div>
                        </td>
                        <td className="p-3">
                          <div className="font-semibold text-gray-900 dark:text-white">{item.product_name}</div>
                          <div className="text-[10px] text-gray-400">
                            Batch: <span className="font-mono">{item.batch_no || 'DEFAULT'}</span>
                          </div>
                        </td>
                        <td className="p-3">
                          <span className="font-extrabold text-red-600 dark:text-red-400">
                            -{Number(item.destroy_quantity)} {item.unit || 'Pcs'}
                          </span>
                        </td>
                        <td className="p-3 font-semibold text-rose-700 dark:text-rose-400">
                          ₹{Number(item.destroy_value || 0).toFixed(2)}
                        </td>
                        <td className="p-3">
                          <span className="inline-block px-2 py-0.5 text-[10px] font-semibold bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">
                            {item.reason}
                          </span>
                        </td>
                        <td className="p-3">
                          <span
                            className={`inline-block px-2.5 py-1 text-[10px] font-extrabold rounded-full ${
                              item.status === 'Confirmed'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                : item.status === 'Draft'
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                                : 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300'
                            }`}
                          >
                            {item.status}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end space-x-1">
                            <button
                              onClick={() => setViewingRecord(item)}
                              title="View Details"
                              className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-gray-700 rounded-lg transition"
                            >
                              <EyeIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setPrintingRecord(item)}
                              title="Print Voucher"
                              className="p-1.5 text-gray-600 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-gray-700 rounded-lg transition"
                            >
                              <PrinterIcon className="w-4 h-4" />
                            </button>
                            {item.status === 'Draft' && (isAdmin || !isReadOnly) && (
                              <button
                                onClick={() => handleConfirmDraft(item)}
                                title="Confirm & Deduct Stock"
                                className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold rounded-md transition"
                              >
                                Confirm
                              </button>
                            )}
                            {item.status === 'Confirmed' && isAdmin && (
                              <button
                                onClick={() => {
                                  setCancellingRecord(item);
                                  setCancelReasonInput('');
                                  setCancelError('');
                                }}
                                title="Cancel & Restore Stock"
                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-gray-700 rounded-lg transition"
                              >
                                <NoSymbolIcon className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Summary Modal */}
      <Modal
        isOpen={summaryModalOpen}
        onClose={() => setSummaryModalOpen(false)}
        title="Confirm Scrap Transaction"
      >
        <div className="space-y-4">
          <div className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Scrap Ref Number:</span>
              <span className="font-mono font-bold text-gray-900 dark:text-white">{formData.destroyNo}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Product Name:</span>
              <span className="font-bold text-gray-900 dark:text-white">{formData.productName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Source Location:</span>
              <span className="font-medium text-gray-800 dark:text-gray-200">{formData.sourceLocation}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Scrap Destination:</span>
              <span className="font-bold text-red-600 dark:text-red-400">{formData.scrapLocation}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Selected Batch:</span>
              <span className="font-mono font-semibold">{formData.batchNo}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Quantity to Scrap:</span>
              <span className="font-extrabold text-red-600 dark:text-red-400">
                {formData.destroyQuantity} {formData.unit}
              </span>
            </div>
            <div className="flex justify-between pt-2 border-t border-red-200 dark:border-red-800">
              <span className="font-bold text-gray-800 dark:text-gray-200">Total Valuation Reduction:</span>
              <span className="font-extrabold text-sm text-rose-700 dark:text-rose-400">
                ₹{estimatedLoss.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-3 pt-2">
            <button
              onClick={executeSubmission}
              disabled={submitting}
              className="flex-1 py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs transition"
            >
              {submitting ? 'Processing...' : `Confirm & Move Stock to Scrap`}
            </button>
            <button
              onClick={() => setSummaryModalOpen(false)}
              className="py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl text-xs transition"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>

      {/* Viewing Record Modal */}
      {viewingRecord && (
        <Modal
          isOpen={!!viewingRecord}
          onClose={() => setViewingRecord(null)}
          title={`Scrap Voucher Details - ${viewingRecord.destroy_no}`}
        >
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-xl">
              <div>
                <span className="text-gray-400 block">Product:</span>
                <span className="font-bold text-gray-900 dark:text-white">{viewingRecord.product_name}</span>
              </div>
              <div>
                <span className="text-gray-400 block">Barcode / SKU:</span>
                <span className="font-mono">{viewingRecord.barcode} / {viewingRecord.sku}</span>
              </div>
              <div>
                <span className="text-gray-400 block">Movement:</span>
                <span className="font-medium text-gray-800 dark:text-gray-200">
                  {viewingRecord.source_location || 'Main Storage'} → {viewingRecord.scrap_location || 'Scrap Location'}
                </span>
              </div>
              <div>
                <span className="text-gray-400 block">Batch Number:</span>
                <span className="font-mono font-semibold">{viewingRecord.batch_no || 'DEFAULT'}</span>
              </div>
              <div>
                <span className="text-gray-400 block">Scrapped Quantity:</span>
                <span className="font-extrabold text-red-600">
                  {viewingRecord.destroy_quantity} {viewingRecord.unit}
                </span>
              </div>
              <div>
                <span className="text-gray-400 block">Unit Cost / Valuation Loss:</span>
                <span className="font-bold text-rose-600">
                  ₹{Number(viewingRecord.unit_cost || viewingRecord.purchase_price || 0).toFixed(2)} / ₹{Number(viewingRecord.destroy_value || 0).toFixed(2)}
                </span>
              </div>
            </div>

            <div>
              <span className="text-gray-400 block mb-1">Reason & Remarks:</span>
              <div className="p-2.5 bg-gray-100 dark:bg-gray-700 rounded-lg">
                <p className="font-semibold text-gray-800 dark:text-gray-200">{viewingRecord.reason}</p>
                <p className="text-gray-600 dark:text-gray-400 mt-1">{viewingRecord.remarks || 'No notes provided.'}</p>
              </div>
            </div>

            {viewingRecord.evidence_image && (
              <div>
                <span className="text-gray-400 block mb-1">Evidence Photo:</span>
                <img
                  src={viewingRecord.evidence_image}
                  alt="Evidence"
                  className="w-full max-h-48 object-contain rounded-lg border border-gray-300"
                />
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Cancellation Reason Modal */}
      {cancellingRecord && (
        <Modal
          isOpen={!!cancellingRecord}
          onClose={() => setCancellingRecord(null)}
          title={`Cancel Scrap Entry - ${cancellingRecord.destroy_no}`}
        >
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-200 rounded-xl border border-red-200 dark:border-red-800">
              Warning: Cancelling this entry will restore <strong>{cancellingRecord.destroy_quantity} {cancellingRecord.unit}</strong> back into available inventory and reverse the valuation loss.
            </div>

            {cancelError && <p className="text-red-500 font-semibold">{cancelError}</p>}

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Mandatory Cancellation Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                rows="3"
                placeholder="Enter detailed reason for restoring this scrap record..."
                value={cancelReasonInput}
                onChange={(e) => setCancelReasonInput(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div className="flex items-center space-x-3 pt-2">
              <button
                onClick={handleConfirmCancel}
                disabled={submitting}
                className="flex-1 py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition"
              >
                {submitting ? 'Cancelling...' : 'Confirm Restoration'}
              </button>
              <button
                onClick={() => setCancellingRecord(null)}
                className="py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Lightbox Image Modal */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setLightboxImage(null)}
        >
          <img src={lightboxImage} alt="Evidence Large" className="max-w-full max-h-full rounded-2xl shadow-2xl" />
        </div>
      )}
    </div>
  );
};

export default StockDestroy;
