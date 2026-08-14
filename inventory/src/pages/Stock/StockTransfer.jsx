import { useState, useEffect, useMemo } from 'react';
import {
  ArrowPathIcon,
  ArrowsRightLeftIcon,
  TruckIcon,
  CheckCircleIcon,
  ClockIcon,
  CurrencyRupeeIcon,
  BuildingOffice2Icon,
  MagnifyingGlassIcon,
  EyeIcon,
  PrinterIcon,
  NoSymbolIcon,
  ShieldCheckIcon,
  CubeIcon,
  ExclamationTriangleIcon,
  CheckIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import StatsCard from '../../components/common/StatsCard';
import Modal from '../../components/common/Modal';
import { stockAPI, stockDestroyAPI, productsAPI } from '../../services/api';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { fetchStockSummary, fetchStockAlerts } from '../../store/slices/stockSlice';
import { fetchProducts } from '../../store/slices/productSlice';
import { fetchInventorySummary } from '../../store/slices/reportSlice';

const StockTransfer = ({ onStockChanged }) => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const isReadOnly = user?.role === 'Super Admin';
  const isAdmin = (user?.role === 'Admin' || user?.role === 'Super Admin') && !isReadOnly;

  // Master Data
  const [warehouses, setWarehouses] = useState([]);
  const [productsList, setProductsList] = useState([]);
  const [transfersList, setDestTransfersList] = useState([]);
  const [availableBatches, setAvailableBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingBatches, setLoadingBatches] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Add Warehouse Modal State
  const [addWhModalOpen, setAddWhModalOpen] = useState(false);
  const [newWhName, setNewWhName] = useState('');
  const [newWhLocation, setNewWhLocation] = useState('');
  const [creatingWh, setCreatingWh] = useState(false);
  const [whError, setWhError] = useState('');

  // Inline Destination Store Creation State
  const [toWarehouseMode, setToWarehouseMode] = useState('existing'); // 'existing' | 'new'
  const [customDestinationName, setCustomDestinationName] = useState('');
  const [customDestinationLocation, setCustomDestinationLocation] = useState('');

  // KPIs State
  const [kpis, setKpis] = useState({
    inTransitCount: 0,
    inTransitQty: 0,
    inTransitValue: 0,
    completedCount: 0,
    todayTransfers: 0
  });

  // Form State
  const [formData, setFormData] = useState({
    transferNo: `TRSF-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-0001`,
    productId: '',
    productName: '',
    barcode: '',
    sku: '',
    fromWarehouseId: '1',
    toWarehouseId: '2',
    batchId: '',
    batchNo: 'DEFAULT',
    availableStock: 0,
    batchAvailableStock: null,
    quantity: '',
    unit: 'Pcs',
    unitCost: 0,
    purchasePrice: 0,
    reason: 'Inter-Warehouse Movement',
    remarks: ''
  });

  const [formErrors, setFormErrors] = useState({});
  const [successMsg, setSuccessMsg] = useState('');

  // Confirmation Modal
  const [summaryModalOpen, setSummaryModalOpen] = useState(false);
  const [pendingStatus, setPendingStatus] = useState('In Transit');

  // Receive Transfer Modal State
  const [receivingTransfer, setReceivingTransfer] = useState(null);
  const [receiveNotesInput, setReceiveNotesInput] = useState('');

  // Cancel Transfer Modal State
  const [cancellingTransfer, setCancellingTransfer] = useState(null);
  const [cancelReasonInput, setCancelReasonInput] = useState('');
  const [cancelError, setCancelError] = useState('');

  // Details Modal
  const [viewingTransfer, setViewingTransfer] = useState(null);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('All');
  const [selectedFromWhFilter, setSelectedFromWhFilter] = useState('All');
  const [selectedToWhFilter, setSelectedToWhFilter] = useState('All');

  // Broadcast realtime updates across application
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
      console.warn('Stock Transfer broadcast warning:', e);
    }
  };

  // Load Metadata and History Data
  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [whRes, listRes, kpiRes, prodRes, stockRes] = await Promise.all([
        stockAPI.getWarehouses(),
        stockAPI.getTransfers({
          search: searchQuery,
          status: selectedStatusFilter,
          fromWarehouseId: selectedFromWhFilter,
          toWarehouseId: selectedToWhFilter
        }),
        stockAPI.getTransferKPIs(),
        productsAPI.getAll(),
        stockAPI.getSummary()
      ]);

      if (whRes.success && whRes.warehouses) {
        const validWhs = whRes.warehouses;
        setWarehouses(validWhs);

        if (validWhs.length > 1) {
          const firstWhId = String(validWhs[0].id);
          setFormData(prev => {
            const fromExists = validWhs.some(w => String(w.id) === String(prev.fromWarehouseId));
            const newFromId = fromExists ? String(prev.fromWarehouseId) : firstWhId;

            const toExists = validWhs.some(w => String(w.id) === String(prev.toWarehouseId) && String(w.id) !== newFromId);
            const fallbackToWh = validWhs.find(w => String(w.id) !== newFromId);
            const newToId = toExists ? String(prev.toWarehouseId) : (fallbackToWh ? String(fallbackToWh.id) : '');

            return {
              ...prev,
              fromWarehouseId: newFromId,
              toWarehouseId: newToId
            };
          });
        } else if (validWhs.length === 1) {
          setFormData(prev => ({
            ...prev,
            fromWarehouseId: String(validWhs[0].id),
            toWarehouseId: ''
          }));
        }
      }

      if (listRes.success) setDestTransfersList(listRes.transfers || []);
      if (kpiRes.success) setKpis(kpiRes.kpis || {});

      let prods = [];
      if (prodRes.success) prods = prodRes.products || [];

      // Map stock level by product & warehouse
      if (stockRes.success && stockRes.stock) {
        const stockByProductWh = {};
        stockRes.stock.forEach(s => {
          const key = `${s.product_id}_${s.warehouse_id}`;
          stockByProductWh[key] = Number(s.quantity || 0);
        });

        prods = prods.map(p => ({
          ...p,
          stockByWarehouse: stockByProductWh
        }));
      }

      setProductsList(prods);
    } catch (err) {
      console.warn('Failed to load stock transfer data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, [selectedStatusFilter, selectedFromWhFilter, selectedToWhFilter]);

  // Handle Product Change
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
        unit: 'Pcs'
      }));
      setAvailableBatches([]);
      return;
    }

    const prod = productsList.find(p => String(p.id) === String(pId));
    if (prod) {
      const whKey = `${prod.id}_${formData.fromWarehouseId}`;
      const whStock = prod.stockByWarehouse ? (prod.stockByWarehouse[whKey] || 0) : Number(prod.currentStock || prod.total_stock || 0);
      const pCost = Number(prod.purchase_price || prod.price || 0);

      setFormData(prev => ({
        ...prev,
        productId: prod.id,
        productName: prod.name,
        barcode: prod.barcode || 'N/A',
        sku: prod.sku || 'N/A',
        batchId: '',
        batchNo: 'DEFAULT',
        availableStock: whStock,
        batchAvailableStock: null,
        unitCost: pCost,
        purchasePrice: pCost,
        unit: prod.unit || 'Pcs'
      }));
      setFormErrors(prev => ({ ...prev, quantity: null, productId: null }));

      // Fetch active batches
      setLoadingBatches(true);
      try {
        const bRes = await stockDestroyAPI.getBatches(prod.id);
        if (bRes.success && bRes.batches) {
          setAvailableBatches(bRes.batches);
        } else {
          setAvailableBatches([]);
        }
      } catch (err) {
        setAvailableBatches([]);
      } finally {
        setLoadingBatches(false);
      }
    }
  };

  // Handle Warehouse Change
  const handleFromWhChange = (e) => {
    const whId = e.target.value;
    setFormData(prev => {
      let newToId = prev.toWarehouseId;
      if (whId === newToId) {
        const otherWh = warehouses.find(w => String(w.id) !== String(whId));
        if (otherWh) newToId = String(otherWh.id);
      }

      let newAvail = prev.availableStock;
      if (prev.productId) {
        const prod = productsList.find(p => String(p.id) === String(prev.productId));
        if (prod && prod.stockByWarehouse) {
          newAvail = prod.stockByWarehouse[`${prod.id}_${whId}`] || 0;
        }
      }

      return {
        ...prev,
        fromWarehouseId: whId,
        toWarehouseId: newToId,
        availableStock: newAvail
      };
    });
    setFormErrors(prev => ({ ...prev, fromWarehouseId: null, toWarehouseId: null }));
  };

  // Handle Batch Change
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

  // Form Validation
  const validateForm = () => {
    const errors = {};
    if (!formData.productId) errors.productId = 'Product selection is required';
    if (!formData.fromWarehouseId) errors.fromWarehouseId = 'Source warehouse is required';

    if (toWarehouseMode === 'new') {
      if (!customDestinationName || customDestinationName.trim() === '') {
        errors.customDestinationName = 'New store / warehouse name is required';
      }
    } else {
      if (!formData.toWarehouseId) errors.toWarehouseId = 'Destination warehouse selection is required';
      if (String(formData.fromWarehouseId) === String(formData.toWarehouseId)) {
        errors.toWarehouseId = 'Source and Destination warehouses cannot be identical';
      }
    }

    if (!formData.quantity) {
      errors.quantity = 'Transfer quantity is required';
    } else {
      const qty = Number(formData.quantity);
      if (isNaN(qty) || qty <= 0) {
        errors.quantity = 'Quantity must be a positive number';
      } else if (qty > formData.availableStock) {
        errors.quantity = `Quantity (${qty}) exceeds available stock in source warehouse (${formData.availableStock} ${formData.unit})`;
      } else if (formData.batchAvailableStock !== null && qty > formData.batchAvailableStock) {
        errors.quantity = `Quantity (${qty}) exceeds batch available stock (${formData.batchAvailableStock} ${formData.unit})`;
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFormSubmit = (e, statusChoice = 'In Transit') => {
    e.preventDefault();
    if (!validateForm()) return;
    setPendingStatus(statusChoice);
    setSummaryModalOpen(true);
  };

  // Handle Create New Warehouse / Store
  const handleCreateWarehouse = async (e) => {
    e.preventDefault();
    if (!newWhName || newWhName.trim() === '') {
      setWhError('Store / Warehouse name is required');
      return;
    }

    setCreatingWh(true);
    setWhError('');
    try {
      const res = await stockAPI.createWarehouse({
        name: newWhName,
        location: newWhLocation
      });

      if (res.success && res.warehouse) {
        const newWh = res.warehouse;
        setWarehouses(prev => [...prev, newWh]);
        setFormData(prev => ({
          ...prev,
          toWarehouseId: String(newWh.id)
        }));
        setToWarehouseMode('existing');
        setAddWhModalOpen(false);
        setNewWhName('');
        setNewWhLocation('');
        setSuccessMsg(`✓ Store / Warehouse "${newWh.name}" created successfully and selected!`);
        broadcastStockUpdate();
        setTimeout(() => setSuccessMsg(''), 5000);
      }
    } catch (err) {
      setWhError(err.response?.data?.message || 'Failed to create warehouse.');
    } finally {
      setCreatingWh(false);
    }
  };

  // Final Confirmed Execution
  const executeSubmission = async () => {
    setSubmitting(true);
    setSuccessMsg('');
    try {
      let targetToWhId = Number(formData.toWarehouseId);

      // If user typed a new store inline, create it dynamically first
      if (toWarehouseMode === 'new') {
        const whRes = await stockAPI.createWarehouse({
          name: customDestinationName.trim(),
          location: customDestinationLocation.trim() || 'Main Building'
        });

        if (whRes.success && whRes.warehouse) {
          targetToWhId = whRes.warehouse.id;
          setWarehouses(prev => [...prev, whRes.warehouse]);
          setFormData(prev => ({ ...prev, toWarehouseId: String(targetToWhId) }));
          setToWarehouseMode('existing');
          setCustomDestinationName('');
          setCustomDestinationLocation('');
        } else {
          alert(whRes.message || 'Failed to create new destination store.');
          setSubmitting(false);
          return;
        }
      }

      if (!targetToWhId || isNaN(targetToWhId) || targetToWhId <= 0) {
        alert('Validation Error: Destination Warehouse selection is invalid or missing. Please select or create a destination store.');
        setSubmitting(false);
        return;
      }

      const payload = {
        product_id: Number(formData.productId),
        from_warehouse_id: Number(formData.fromWarehouseId),
        to_warehouse_id: targetToWhId,
        quantity: Number(formData.quantity),
        batch_id: formData.batchId ? Number(formData.batchId) : null,
        batch_no: formData.batchNo || 'DEFAULT',
        remarks: formData.remarks || '',
        status: pendingStatus
      };

      const res = await stockAPI.createTransfer(payload);

      if (res.success) {
        setSummaryModalOpen(false);
        setSuccessMsg(
          pendingStatus === 'In Transit'
            ? `✓ Stock Transfer ${res.transferNo || formData.transferNo} initiated! Stock is now In-Transit.`
            : `✓ Stock Transfer draft ${res.transferNo || formData.transferNo} saved.`
        );

        // Reset Form
        setFormData(prev => ({
          ...prev,
          quantity: '',
          remarks: ''
        }));

        broadcastStockUpdate();
        await fetchAllData();
        setTimeout(() => setSuccessMsg(''), 6000);
      }
    } catch (err) {
      console.error('Stock transfer error:', err);
      const serverErr = err.response?.data?.message || err.message || 'Failed to execute stock transfer.';
      alert(`Stock Transfer Error: ${serverErr}`);
    } finally {
      setSubmitting(false);
    }
  };

  // Receive Transfer Action
  const handleConfirmReceive = async () => {
    if (!receivingTransfer) return;
    setSubmitting(true);
    try {
      const res = await stockAPI.receiveTransfer(receivingTransfer.id, { remarks: receiveNotesInput });
      if (res.success) {
        alert(`✓ Transfer ${receivingTransfer.transfer_no} successfully received at ${receivingTransfer.to_warehouse_name}! Destination stock updated.`);
        setReceivingTransfer(null);
        setReceiveNotesInput('');
        broadcastStockUpdate();
        await fetchAllData();
      }
    } catch (err) {
      console.error('Receive transfer failed:', err);
      alert(err.response?.data?.message || 'Failed to receive stock transfer.');
    } finally {
      setSubmitting(false);
    }
  };

  // Cancel Transfer Action
  const handleConfirmCancel = async () => {
    if (!cancellingTransfer) return;
    if (!cancelReasonInput || cancelReasonInput.trim() === '') {
      setCancelError('Please enter a mandatory cancellation reason.');
      return;
    }

    setSubmitting(true);
    setCancelError('');
    try {
      const res = await stockAPI.cancelTransfer(cancellingTransfer.id, { cancel_reason: cancelReasonInput });
      if (res.success) {
        alert(`Stock Transfer ${cancellingTransfer.transfer_no} cancelled. Stock restored to ${cancellingTransfer.from_warehouse_name}.`);
        setCancellingTransfer(null);
        setCancelReasonInput('');
        broadcastStockUpdate();
        await fetchAllData();
      }
    } catch (err) {
      console.error('Cancel transfer failed:', err);
      setCancelError(err.response?.data?.message || 'Failed to cancel transfer.');
    } finally {
      setSubmitting(false);
    }
  };

  // Ship Draft Transfer Action
  const handleShipDraft = async (transfer) => {
    if (!window.confirm(`Are you sure you want to ship draft Transfer ${transfer.transfer_no}? Stock will be deducted from ${transfer.from_warehouse_name} and moved In-Transit.`)) {
      return;
    }
    setSubmitting(true);
    try {
      const res = await stockAPI.shipTransfer(transfer.id);
      if (res.success) {
        alert(`Stock Transfer ${transfer.transfer_no} shipped successfully!`);
        broadcastStockUpdate();
        await fetchAllData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to ship draft transfer.');
    } finally {
      setSubmitting(false);
    }
  };

  const estimatedValue = useMemo(() => {
    const qty = Number(formData.quantity || 0);
    const cost = Number(formData.unitCost || 0);
    return Number((qty * cost).toFixed(2));
  }, [formData.quantity, formData.unitCost]);

  const filteredTransfers = useMemo(() => {
    return transfersList.filter(t => {
      const matchesSearch = !searchQuery ||
        t.transfer_no?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.product_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.batch_no?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.from_warehouse_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.to_warehouse_name?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = selectedStatusFilter === 'All' || t.status === selectedStatusFilter;
      const matchesFromWh = selectedFromWhFilter === 'All' || String(t.from_warehouse_id) === String(selectedFromWhFilter);
      const matchesToWh = selectedToWhFilter === 'All' || String(t.to_warehouse_id) === String(selectedToWhFilter);

      return matchesSearch && matchesStatus && matchesFromWh && matchesToWh;
    });
  }, [transfersList, searchQuery, selectedStatusFilter, selectedFromWhFilter, selectedToWhFilter]);

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-indigo-900 via-slate-900 to-blue-950 p-6 rounded-2xl shadow-xl border border-indigo-800/40 text-white">
        <div>
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-indigo-500/20 backdrop-blur-md border border-indigo-400/30 rounded-xl">
              <ArrowsRightLeftIcon className="w-8 h-8 text-indigo-300" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight">Multi-Warehouse Stock Transfer</h1>
              <p className="text-sm text-indigo-200/80 mt-1">
                Inter-Warehouse Logistics • In-Transit Workflow • Batch & FIFO Valuation Shift
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
            <span>Refresh Data</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatsCard
          title="In-Transit Shipments"
          value={kpis.inTransitCount}
          subtitle="Shipments currently in transit"
          icon={TruckIcon}
          color="amber"
        />
        <StatsCard
          title="In-Transit Qty"
          value={`${kpis.inTransitQty.toLocaleString()} Pcs`}
          subtitle="Quantity pending receipt"
          icon={CubeIcon}
          color="blue"
        />
        <StatsCard
          title="In-Transit Value"
          value={`₹${kpis.inTransitValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
          subtitle="Inventory value moving"
          icon={CurrencyRupeeIcon}
          color="indigo"
        />
        <StatsCard
          title="Completed Transfers"
          value={kpis.completedCount}
          subtitle="Successfully received transfers"
          icon={CheckCircleIcon}
          color="emerald"
        />
        <StatsCard
          title="Today's Transfers"
          value={kpis.todayTransfers}
          subtitle="Transfers initiated today"
          icon={ClockIcon}
          color="violet"
        />
      </div>

      {/* Main Content: Form & History */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Entry Form */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-md border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-gray-100 dark:border-gray-700">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <BuildingOffice2Icon className="w-5 h-5 text-indigo-500" />
                Initiate Inter-Warehouse Transfer
              </h2>
              <span className="px-2.5 py-1 text-xs font-semibold text-indigo-700 bg-indigo-50 dark:bg-indigo-950/40 dark:text-indigo-300 rounded-full border border-indigo-200 dark:border-indigo-800">
                In-Transit Workflow
              </span>
            </div>

            {successMsg && (
              <div className="p-4 mb-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-sm rounded-xl flex items-start space-x-2">
                <CheckCircleIcon className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={(e) => handleFormSubmit(e, 'In Transit')} className="space-y-4">
              {/* Warehouse Selectors */}
              <div className="grid grid-cols-2 gap-3 bg-indigo-50/50 dark:bg-indigo-950/20 p-3.5 rounded-xl border border-indigo-100 dark:border-indigo-900/40">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Source Warehouse <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.fromWarehouseId}
                    onChange={handleFromWhChange}
                    className="w-full px-2.5 py-2 text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 font-medium"
                  >
                    {warehouses.map(w => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                      Destination Warehouse <span className="text-red-500">*</span>
                    </label>
                    <div className="flex items-center space-x-1 text-[10px]">
                      <button
                        type="button"
                        onClick={() => setToWarehouseMode('existing')}
                        className={`px-1.5 py-0.5 rounded font-bold transition ${
                          toWarehouseMode === 'existing' ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:text-indigo-600'
                        }`}
                      >
                        Select Store
                      </button>
                      <button
                        type="button"
                        onClick={() => setToWarehouseMode('new')}
                        className={`px-1.5 py-0.5 rounded font-bold transition ${
                          toWarehouseMode === 'new' ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:text-indigo-600'
                        }`}
                      >
                        + Create Store
                      </button>
                    </div>
                  </div>

                  {toWarehouseMode === 'existing' ? (
                    <>
                      <select
                        value={formData.toWarehouseId}
                        onChange={(e) => {
                          if (e.target.value === '__add_new__') {
                            setAddWhModalOpen(true);
                            setWhError('');
                            setNewWhName('');
                            setNewWhLocation('');
                            return;
                          }
                          setFormData(prev => ({ ...prev, toWarehouseId: e.target.value }));
                          setFormErrors(prev => ({ ...prev, toWarehouseId: null }));
                        }}
                        className={`w-full px-2.5 py-2 text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg border ${
                          formErrors.toWarehouseId ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                        } focus:ring-2 focus:ring-indigo-500 font-medium`}
                      >
                        {warehouses.length <= 1 && (
                          <option value="">-- Choose or Add Destination Store --</option>
                        )}
                        {warehouses.map(w => (
                          <option key={w.id} value={w.id} disabled={String(w.id) === String(formData.fromWarehouseId)}>
                            {w.name} {String(w.id) === String(formData.fromWarehouseId) ? '(Same Source)' : ''}
                          </option>
                        ))}
                        <option value="__add_new__" className="font-bold text-indigo-600">+ Add New Store / Warehouse...</option>
                      </select>
                      {formErrors.toWarehouseId && (
                        <p className="text-[11px] text-red-500 mt-1">{formErrors.toWarehouseId}</p>
                      )}
                    </>
                  ) : (
                    <div className="space-y-2 bg-indigo-50/70 dark:bg-indigo-950/40 p-2.5 rounded-lg border border-indigo-200 dark:border-indigo-800">
                      <div>
                        <input
                          type="text"
                          placeholder="Type New Store Name (e.g. Branch Outlet 2)... *"
                          value={customDestinationName}
                          onChange={(e) => {
                            setCustomDestinationName(e.target.value);
                            setFormErrors(prev => ({ ...prev, customDestinationName: null }));
                          }}
                          className={`w-full px-2.5 py-1.5 text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md border ${
                            formErrors.customDestinationName ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                          } focus:ring-2 focus:ring-indigo-500 font-bold`}
                        />
                        {formErrors.customDestinationName && (
                          <p className="text-[10px] text-red-500 mt-0.5">{formErrors.customDestinationName}</p>
                        )}
                      </div>
                      <div>
                        <input
                          type="text"
                          placeholder="Location / Address (Optional)"
                          value={customDestinationLocation}
                          onChange={(e) => setCustomDestinationLocation(e.target.value)}
                          className="w-full px-2.5 py-1 text-[11px] bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md border border-gray-300 dark:border-gray-600"
                        />
                      </div>
                      <div className="text-[10px] text-emerald-700 dark:text-emerald-300 font-medium">
                        ✓ Store will be automatically created & selected when submitting transfer.
                      </div>
                    </div>
                  )}
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
                  } focus:ring-2 focus:ring-indigo-500`}
                >
                  <option value="">-- Choose Product from Catalogue --</option>
                  {productsList.map(p => {
                    const whStock = p.stockByWarehouse ? (p.stockByWarehouse[`${p.id}_${formData.fromWarehouseId}`] || 0) : Number(p.currentStock || 0);
                    return (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.barcode || p.sku || 'No Barcode'}) - Src Stock: {whStock} {p.unit || 'Pcs'}
                      </option>
                    );
                  })}
                </select>
                {formErrors.productId && <p className="text-[11px] text-red-500 mt-1">{formErrors.productId}</p>}
              </div>

              {/* Batch Selector */}
              {formData.productId && (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1 flex items-center justify-between">
                    <span>Batch / Lot Selection (FIFO)</span>
                    {loadingBatches && <span className="text-[10px] text-indigo-500 animate-pulse">Loading batches...</span>}
                  </label>
                  <select
                    value={formData.batchId}
                    onChange={handleBatchChange}
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500"
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
                      ✓ Selected Batch Remaining Stock: <strong>{formData.batchAvailableStock} {formData.unit}</strong>
                    </p>
                  )}
                </div>
              )}

              {/* Source Stock Banner */}
              {formData.productId && (
                <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-800 text-xs">
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Available Stock in Source Wh:</span>{' '}
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

              {/* Quantity & Unit */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Transfer Quantity <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0.001"
                  step="any"
                  placeholder={`Qty in ${formData.unit}`}
                  value={formData.quantity}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, quantity: e.target.value }));
                    setFormErrors(prev => ({ ...prev, quantity: null }));
                  }}
                  className={`w-full px-3 py-2 text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg border ${
                    formErrors.quantity ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  } focus:ring-2 focus:ring-indigo-500 font-bold`}
                />
                {formErrors.quantity && (
                  <p className="text-[11px] text-red-500 mt-1">{formErrors.quantity}</p>
                )}
              </div>

              {/* Value Shift Preview */}
              {estimatedValue > 0 && (
                <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl border border-indigo-200 dark:border-indigo-800 text-xs flex items-center justify-between">
                  <span className="font-medium text-indigo-900 dark:text-indigo-300">Location Inventory Valuation Shift:</span>
                  <span className="font-extrabold text-sm text-indigo-700 dark:text-indigo-400">
                    ₹{estimatedValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              )}

              {/* Remarks */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Transfer Notes / Remarks
                </label>
                <textarea
                  rows="2"
                  placeholder="Enter transfer reason, truck/driver details, or instructions..."
                  value={formData.remarks}
                  onChange={(e) => setFormData(prev => ({ ...prev, remarks: e.target.value }))}
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Form Action Buttons */}
              <div className="pt-2 flex items-center space-x-3">
                <button
                  type="button"
                  disabled={submitting || isReadOnly}
                  onClick={(e) => handleFormSubmit(e, 'In Transit')}
                  className="flex-1 py-3 px-4 bg-gradient-to-r from-indigo-600 to-blue-700 hover:from-indigo-700 hover:to-blue-800 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/30 transition disabled:opacity-50 text-xs flex items-center justify-center space-x-2"
                >
                  <TruckIcon className="w-4 h-4" />
                  <span>Ship Stock (In-Transit)</span>
                </button>
                <button
                  type="button"
                  disabled={submitting || isReadOnly}
                  onClick={(e) => handleFormSubmit(e, 'Draft')}
                  className="py-3 px-4 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-semibold rounded-xl transition disabled:opacity-50 text-xs border border-gray-300 dark:border-gray-600"
                >
                  Save Draft
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* History & In-Transit Management */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-md border border-gray-200 dark:border-gray-700">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-gray-100 dark:border-gray-700">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <TruckIcon className="w-5 h-5 text-indigo-500" />
                Inter-Warehouse Stock Transfer History
              </h2>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {filteredTransfers.length} record(s) found
              </span>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
              <div className="relative">
                <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search ref, product, warehouse..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <select
                  value={selectedStatusFilter}
                  onChange={(e) => setSelectedStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl border border-gray-200 dark:border-gray-600"
                >
                  <option value="All">All Statuses</option>
                  <option value="In Transit">In Transit</option>
                  <option value="Completed">Completed</option>
                  <option value="Draft">Draft</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <select
                  value={selectedFromWhFilter}
                  onChange={(e) => setSelectedFromWhFilter(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl border border-gray-200 dark:border-gray-600"
                >
                  <option value="All">All Source Warehouses</option>
                  {warehouses.map(w => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="p-3">Transfer Ref / Date</th>
                    <th className="p-3">Product / Batch</th>
                    <th className="p-3">Source → Destination</th>
                    <th className="p-3">Qty & Unit</th>
                    <th className="p-3">Total Value</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700 text-gray-700 dark:text-gray-300">
                  {loading ? (
                    <tr>
                      <td colSpan="7" className="p-8 text-center text-gray-500">
                        <ArrowPathIcon className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" />
                        Loading Stock Transfers...
                      </td>
                    </tr>
                  ) : filteredTransfers.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="p-8 text-center text-gray-400">
                        No stock transfers found matching filters.
                      </td>
                    </tr>
                  ) : (
                    filteredTransfers.map(item => (
                      <tr key={item.id} className="hover:bg-gray-50/80 dark:hover:bg-gray-700/40 transition">
                        <td className="p-3">
                          <div className="font-mono font-bold text-gray-900 dark:text-white">{item.transfer_no}</div>
                          <div className="text-[11px] text-gray-400">{new Date(item.created_at).toLocaleDateString()}</div>
                        </td>
                        <td className="p-3">
                          <div className="font-semibold text-gray-900 dark:text-white">{item.product_name}</div>
                          <div className="text-[10px] text-gray-400">
                            Batch: <span className="font-mono">{item.batch_no || 'DEFAULT'}</span>
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="font-medium text-gray-900 dark:text-white">{item.from_warehouse_name}</div>
                          <div className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold">
                            → {item.to_warehouse_name}
                          </div>
                        </td>
                        <td className="p-3">
                          <span className="font-extrabold text-gray-900 dark:text-white">
                            {Number(item.quantity)} {item.unit || 'Pcs'}
                          </span>
                        </td>
                        <td className="p-3 font-semibold text-indigo-700 dark:text-indigo-300">
                          ₹{Number(item.total_value || 0).toFixed(2)}
                        </td>
                        <td className="p-3">
                          <span
                            className={`inline-block px-2.5 py-1 text-[10px] font-extrabold rounded-full ${
                              item.status === 'Completed'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                : item.status === 'In Transit'
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 animate-pulse'
                                : item.status === 'Draft'
                                ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                                : 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300'
                            }`}
                          >
                            {item.status}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end space-x-1">
                            <button
                              onClick={() => setViewingTransfer(item)}
                              title="View Details"
                              className="p-1.5 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-gray-700 rounded-lg transition"
                            >
                              <EyeIcon className="w-4 h-4" />
                            </button>

                            {item.status === 'Draft' && !isReadOnly && (
                              <button
                                onClick={() => handleShipDraft(item)}
                                title="Ship Stock (In Transit)"
                                className="px-2 py-1 bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-bold rounded-md transition"
                              >
                                Ship
                              </button>
                            )}

                            {item.status === 'In Transit' && !isReadOnly && (
                              <button
                                onClick={() => {
                                  setReceivingTransfer(item);
                                  setReceiveNotesInput('');
                                }}
                                title="Receive Transfer"
                                className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold rounded-md transition"
                              >
                                Receive
                              </button>
                            )}

                            {(item.status === 'In Transit' || item.status === 'Draft') && isAdmin && (
                              <button
                                onClick={() => {
                                  setCancellingTransfer(item);
                                  setCancelReasonInput('');
                                  setCancelError('');
                                }}
                                title="Cancel Transfer"
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
        title="Confirm Stock Transfer"
      >
        <div className="space-y-4">
          <div className="p-4 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 rounded-xl text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Transfer Ref Number:</span>
              <span className="font-mono font-bold text-gray-900 dark:text-white">{formData.transferNo}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Product Name:</span>
              <span className="font-bold text-gray-900 dark:text-white">{formData.productName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Source Warehouse:</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {warehouses.find(w => String(w.id) === String(formData.fromWarehouseId))?.name}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Destination Warehouse:</span>
              <span className="font-bold text-indigo-600 dark:text-indigo-400">
                {toWarehouseMode === 'new'
                  ? `${customDestinationName} (New Store)`
                  : warehouses.find(w => String(w.id) === String(formData.toWarehouseId))?.name || 'Selected Store'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Selected Batch:</span>
              <span className="font-mono font-semibold">{formData.batchNo}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Transfer Quantity:</span>
              <span className="font-extrabold text-indigo-700 dark:text-indigo-300">
                {formData.quantity} {formData.unit}
              </span>
            </div>
            <div className="flex justify-between pt-2 border-t border-indigo-200 dark:border-indigo-800">
              <span className="font-bold text-gray-800 dark:text-gray-200">Location Valuation Shift:</span>
              <span className="font-extrabold text-sm text-indigo-700 dark:text-indigo-400">
                ₹{estimatedValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-3 pt-2">
            <button
              onClick={executeSubmission}
              disabled={submitting}
              className="flex-1 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition"
            >
              {submitting ? 'Processing...' : `Confirm & Ship In-Transit`}
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

      {/* Receive Transfer Modal */}
      {receivingTransfer && (
        <Modal
          isOpen={!!receivingTransfer}
          onClose={() => setReceivingTransfer(null)}
          title={`Receive Stock Transfer - ${receivingTransfer.transfer_no}`}
        >
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 rounded-xl border border-emerald-200 dark:border-emerald-800 space-y-1">
              <div className="font-bold">Receiving Shipment:</div>
              <div>Product: <strong>{receivingTransfer.product_name}</strong></div>
              <div>Quantity: <strong>{receivingTransfer.quantity} {receivingTransfer.unit}</strong></div>
              <div>Source: <strong>{receivingTransfer.from_warehouse_name}</strong> → Destination: <strong className="text-emerald-700 dark:text-emerald-300">{receivingTransfer.to_warehouse_name}</strong></div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Inspection / Receiving Remarks (Optional)
              </label>
              <textarea
                rows="3"
                placeholder="Enter condition notes upon receiving shipment..."
                value={receiveNotesInput}
                onChange={(e) => setReceiveNotesInput(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex items-center space-x-3 pt-2">
              <button
                onClick={handleConfirmReceive}
                disabled={submitting}
                className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition"
              >
                {submitting ? 'Receiving...' : 'Confirm Receipt & Increase Stock'}
              </button>
              <button
                onClick={() => setReceivingTransfer(null)}
                className="py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Cancel Transfer Modal */}
      {cancellingTransfer && (
        <Modal
          isOpen={!!cancellingTransfer}
          onClose={() => setCancellingTransfer(null)}
          title={`Cancel Stock Transfer - ${cancellingTransfer.transfer_no}`}
        >
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-200 rounded-xl border border-red-200 dark:border-red-800">
              Warning: Cancelling this transfer will restore <strong>{cancellingTransfer.quantity} {cancellingTransfer.unit}</strong> back to Source Warehouse (<strong>{cancellingTransfer.from_warehouse_name}</strong>).
            </div>

            {cancelError && <p className="text-red-500 font-semibold">{cancelError}</p>}

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Mandatory Cancellation Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                rows="3"
                placeholder="Enter detailed reason for cancelling this transfer..."
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
                onClick={() => setCancellingTransfer(null)}
                className="py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Viewing Record Modal */}
      {viewingTransfer && (
        <Modal
          isOpen={!!viewingTransfer}
          onClose={() => setViewingTransfer(null)}
          title={`Stock Transfer Details - ${viewingTransfer.transfer_no}`}
        >
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-xl">
              <div>
                <span className="text-gray-400 block">Product:</span>
                <span className="font-bold text-gray-900 dark:text-white">{viewingTransfer.product_name}</span>
              </div>
              <div>
                <span className="text-gray-400 block">Barcode / SKU:</span>
                <span className="font-mono">{viewingTransfer.barcode} / {viewingTransfer.sku}</span>
              </div>
              <div>
                <span className="text-gray-400 block">Source Warehouse:</span>
                <span className="font-semibold text-gray-900 dark:text-white">{viewingTransfer.from_warehouse_name}</span>
              </div>
              <div>
                <span className="text-gray-400 block">Destination Warehouse:</span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400">{viewingTransfer.to_warehouse_name}</span>
              </div>
              <div>
                <span className="text-gray-400 block">Transfer Quantity:</span>
                <span className="font-extrabold text-indigo-700 dark:text-indigo-300">
                  {viewingTransfer.quantity} {viewingTransfer.unit}
                </span>
              </div>
              <div>
                <span className="text-gray-400 block">Unit Cost / Total Value:</span>
                <span className="font-bold text-emerald-600">
                  ₹{Number(viewingTransfer.unit_cost || 0).toFixed(2)} / ₹{Number(viewingTransfer.total_value || 0).toFixed(2)}
                </span>
              </div>
              <div>
                <span className="text-gray-400 block">Batch Number:</span>
                <span className="font-mono font-semibold">{viewingTransfer.batch_no || 'DEFAULT'}</span>
              </div>
              <div>
                <span className="text-gray-400 block">Status:</span>
                <span className="font-bold text-indigo-600">{viewingTransfer.status}</span>
              </div>
            </div>

            <div>
              <span className="text-gray-400 block mb-1">Remarks & Log Notes:</span>
              <div className="p-2.5 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-700 dark:text-gray-300">
                {viewingTransfer.remarks || 'No remarks recorded.'}
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Add New Store / Warehouse Modal */}
      {addWhModalOpen && (
        <Modal
          isOpen={addWhModalOpen}
          onClose={() => setAddWhModalOpen(false)}
          title="Add New Store / Warehouse"
        >
          <form onSubmit={handleCreateWarehouse} className="space-y-4 text-xs">
            {whError && (
              <div className="p-3 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 rounded-lg border border-red-200">
                {whError}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Store / Warehouse Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Retail Outlet Sector 14, Warehouse C..."
                value={newWhName}
                onChange={(e) => setNewWhName(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Location / Address
              </label>
              <input
                type="text"
                placeholder="e.g. Ground Floor, Commercial Complex, Delhi..."
                value={newWhLocation}
                onChange={(e) => setNewWhLocation(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center space-x-3 pt-2">
              <button
                type="submit"
                disabled={creatingWh}
                className="flex-1 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition shadow-md"
              >
                {creatingWh ? 'Creating...' : 'Save & Select Store'}
              </button>
              <button
                type="button"
                onClick={() => setAddWhModalOpen(false)}
                className="py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default StockTransfer;
