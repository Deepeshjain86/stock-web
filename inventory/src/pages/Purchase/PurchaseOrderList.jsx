import { useState, useEffect, useMemo } from 'react';
import {
  DocumentPlusIcon,
  PrinterIcon,
  MagnifyingGlassIcon,
  ArchiveBoxIcon,
  CurrencyRupeeIcon,
  TrashIcon,
  PlusIcon,
  CheckCircleIcon,
  XCircleIcon,
  InboxArrowDownIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import { purchaseOrdersAPI, purchasesAPI, settingsAPI } from '../../services/api';
import PurchaseOrderForm from '../../components/forms/PurchaseOrderForm';
import GRNForm from '../../components/forms/GRNForm';
import PurchaseForm from '../../components/forms/PurchaseForm';
import Modal from '../../components/common/Modal';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { showToast } from '../../store/slices/notificationSlice';

const PurchaseOrderList = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const isReadOnly = user?.role === 'Super Admin';
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modal triggers
  const [showPOForm, setShowPOForm] = useState(false);
  const [showGRNForm, setShowGRNForm] = useState(false);
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [selectedPO, setSelectedPO] = useState(null);
  const [viewingPO, setViewingPO] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [storeSettings, setStoreSettings] = useState({
    storeName: 'Kirana Mart Enterprise',
    storeAddress: 'Main Market, City Center',
    storePhone: '+91-98765-43210',
    storeEmail: 'support@kiranamart.com',
    gstin: '07AAAAA1111A1Z1',
    shopRegNo: 'REG-123456789'
  });

  const fetchStoreSettings = async () => {
    try {
      const res = await settingsAPI.getAll();
      if (res.success && res.settings) {
        setStoreSettings({
          storeName: res.settings.store_name || 'Kirana Mart Enterprise',
          storeAddress: res.settings.store_address || 'Main Market, City Center',
          storePhone: res.settings.store_phone || '+91-98765-43210',
          storeEmail: res.settings.store_email || 'support@kiranamart.com',
          gstin: res.settings.gstin || '07AAAAA1111A1Z1',
          shopRegNo: res.settings.shop_reg_no || 'REG-123456789'
        });
      }
    } catch (err) {
      console.warn('Failed to load store settings', err);
    }
  };

  const fetchPurchaseOrders = async () => {
    setLoading(true);
    try {
      const res = await purchaseOrdersAPI.getAll();
      if (res.success) {
        setPurchaseOrders(res.purchaseOrders);
      }
    } catch (err) {
      console.error('Failed to load purchase orders', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPurchaseOrders();
    fetchStoreSettings();
  }, []);

  const handleCreatePO = async (data) => {
    try {
      const res = await purchaseOrdersAPI.create(data);
      if (res.success) {
        setShowPOForm(false);
        fetchPurchaseOrders();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateGRN = async (data) => {
    try {
      const res = await purchaseOrdersAPI.createGRN(selectedPO.id, data);
      if (res.success) {
        setShowGRNForm(false);
        setSelectedPO(null);
        fetchPurchaseOrders();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateInvoice = async (data) => {
    try {
      const itemsMapped = (data.items || []).map(item => ({
        product_id: Number(item.productId || item.product_id || item.id),
        quantity: Number(item.quantity) || 1,
        purchase_price: Number(item.price ?? item.purchase_price ?? item.purchasePrice ?? 0),
        mrp: Number(item.mrp) || 0,
        gst: Number(item.gstPercent ?? item.gst ?? 0),
        total: Number(item.total) || 0
      }));

      const payload = {
        vendor_id: Number(data.vendorId || selectedPO?.vendor_id || selectedPO?.vendorId || 1),
        warehouse_id: Number(data.warehouseId || selectedPO?.warehouse_id || selectedPO?.warehouseId || 1),
        date: data.purchaseDate || new Date().toISOString().split('T')[0],
        subtotal: Number(data.subtotal) || 0,
        discount: Number(data.discountAmount) || 0,
        gst_amount: Number(data.tax) || 0,
        total: Number(data.total) || 0,
        payment_status: data.paymentStatus || 'Pending',
        delivery_status: data.deliveryStatus || 'Received',
        payment_method: data.paymentMode || 'Cash',
        purchase_order_id: selectedPO?.id || null,
        items: itemsMapped
      };

      const res = await purchasesAPI.create(payload);
      if (res.success) {
        if (selectedPO?.id) {
          await purchaseOrdersAPI.updateStatus(selectedPO.id, { status: 'Completed' });
        }
        toast.success('Purchase invoice created successfully!');
        setShowInvoiceForm(false);
        setSelectedPO(null);
        fetchPurchaseOrders();
        // Notify Dashboard that purchase/inventory data changed
        window.dispatchEvent(new CustomEvent('inventory-updated'));
        window.dispatchEvent(new CustomEvent('stock-changed'));
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Error creating purchase invoice');
    }
  };

  const handleCancelPO = async (id) => {
    if (window.confirm('Are you sure you want to cancel this Purchase Order?')) {
      try {
        const res = await purchaseOrdersAPI.updateStatus(id, { status: 'Cancelled' });
        if (res.success) {
          fetchPurchaseOrders();
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleDeletePO = async (id) => {
    if (window.confirm('Are you sure you want to permanently delete this Purchase Order?')) {
      try {
        const res = await purchaseOrdersAPI.delete(id);
        if (res.success) {
          fetchPurchaseOrders();
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleOpenGRN = async (po) => {
    if (loadingDetails) return;
    setLoadingDetails(true);
    try {
      const res = await purchaseOrdersAPI.getById(po.id);
      if (res.success && res.order) {
        setSelectedPO(res.order);
        setShowGRNForm(true);
      } else {
        dispatch(showToast({ msg: res.message || 'Failed to load purchase order details.', type: 'error' }));
      }
    } catch (err) {
      console.error(err);
      dispatch(showToast({ msg: 'An error occurred while fetching purchase order details.', type: 'error' }));
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleOpenInvoice = async (po) => {
    if (loadingDetails) return;
    setLoadingDetails(true);
    try {
      const res = await purchaseOrdersAPI.getById(po.id);
      if (res.success && res.order) {
        setSelectedPO(res.order);
        setShowInvoiceForm(true);
      } else {
        dispatch(showToast({ msg: res.message || 'Failed to load purchase order details.', type: 'error' }));
      }
    } catch (err) {
      console.error(err);
      dispatch(showToast({ msg: 'An error occurred while fetching purchase order details.', type: 'error' }));
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleViewDetails = async (po) => {
    if (loadingDetails) return;
    setLoadingDetails(true);
    try {
      const res = await purchaseOrdersAPI.getById(po.id);
      if (res.success && res.order) {
        setViewingPO(res.order);
      } else {
        dispatch(showToast({ msg: res.message || 'Failed to load purchase order details.', type: 'error' }));
      }
    } catch (err) {
      console.error(err);
      dispatch(showToast({ msg: 'An error occurred while fetching purchase order details.', type: 'error' }));
    } finally {
      setLoadingDetails(false);
    }
  };

  const filteredOrders = useMemo(() => {
    return purchaseOrders.filter((po) => {
      const matchSearch =
        po.purchase_order_no.toLowerCase().includes(searchQuery.toLowerCase()) ||
        po.vendor_name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus = statusFilter === 'all' || po.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [purchaseOrders, searchQuery, statusFilter]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Draft':
        return 'bg-slate-100 text-slate-700 border border-slate-200';
      case 'Sent':
        return 'bg-blue-50 text-blue-700 border border-blue-200';
      case 'Confirmed':
        return 'bg-amber-50 text-amber-700 border border-amber-200';
      case 'Partially Received':
        return 'bg-orange-50 text-orange-700 border border-orange-200';
      case 'Completed':
        return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
      case 'Cancelled':
        return 'bg-rose-50 text-rose-700 border border-rose-200';
      default:
        return 'bg-slate-50 text-slate-700 border border-slate-200';
    }
  };

  const handlePrintPO = (po) => {
    const win = window.open('', '_blank');
    const subtotal = Number(po.subtotal || 0);
    const gstAmount = Number(po.gst_amount || 0);
    const discount = Number(po.discount || 0);
    const total = Number(po.total || 0);
    
    const itemsHtml = po.items.map((item, idx) => `
      <tr>
        <td style="text-align: center; border: 1px solid #cbd5e1; padding: 6px;">${idx + 1}</td>
        <td style="border: 1px solid #cbd5e1; padding: 6px; font-weight: bold;">${item.product_name || 'Product'}</td>
        <td style="border: 1px solid #cbd5e1; padding: 6px; text-align: center; font-family: monospace; font-size: 9px;">${item.barcode || '—'}</td>
        <td style="border: 1px solid #cbd5e1; padding: 6px; text-align: center;">${item.category || 'General'}</td>
        <td style="text-align: center; border: 1px solid #cbd5e1; padding: 6px;">${item.quantity}</td>
        <td style="border: 1px solid #cbd5e1; padding: 6px; text-align: center;">${item.unit || 'Pcs'}</td>
        <td style="text-align: right; border: 1px solid #cbd5e1; padding: 6px;">₹${Number(item.purchase_price || 0).toFixed(2)}</td>
        <td style="text-align: center; border: 1px solid #cbd5e1; padding: 6px;">${item.gst || 0}%</td>
        <td style="text-align: right; border: 1px solid #cbd5e1; padding: 6px;">₹0.00</td>
        <td style="text-align: right; border: 1px solid #cbd5e1; padding: 6px; font-weight: bold;">₹${Number(item.total || 0).toFixed(2)}</td>
        <td style="border: 1px solid #cbd5e1; padding: 6px; text-align: center; color: #64748b; font-size: 9px;">${item.remarks || '—'}</td>
      </tr>
    `).join('');

    win.document.write(`
      <html>
      <head>
        <title>Purchase Order - ${po.purchase_order_no}</title>
        <style>
          @page { size: A4 portrait; margin: 0.4in; }
          body { font-family: 'Segoe UI', system-ui, sans-serif; color: #1e293b; line-height: 1.4; margin: 0; background: #fff; font-size: 10px; }
          .container { width: 100%; max-width: 800px; margin: 0 auto; padding: 10px; }
          
          .header-grid { display: grid; grid-template-columns: 3fr 2fr; gap: 20px; border-bottom: 2px solid #1B6E4C; padding-bottom: 15px; margin-bottom: 20px; }
          .logo-container { display: flex; align-items: center; gap: 12px; }
          .store-name { font-size: 20px; font-weight: 900; text-transform: uppercase; color: #1B6E4C; margin: 0; letter-spacing: -0.5px; }
          .store-details { font-size: 9.5px; color: #475569; margin: 3px 0 0 0; line-height: 1.3; }
          .document-title-block { text-align: right; }
          .document-title { font-size: 24px; font-weight: 900; color: #1B6E4C; margin: 0; letter-spacing: 0.5px; }
          .document-no { font-size: 14px; font-weight: 700; color: #0f172a; margin-top: 5px; font-family: monospace; }
          
          .po-meta-banner { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 15px; display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 20px; }
          .meta-item { font-size: 10px; font-weight: 600; color: #475569; }
          .meta-item span { display: block; font-size: 11px; font-weight: 800; color: #0f172a; margin-top: 2px; }
          .meta-item .status-badge { display: inline-block; background: #EAF3EE; color: #1B6E4C; padding: 1px 6px; border-radius: 4px; font-size: 9px; font-weight: 900; border: 1px solid #cbd5e1; margin-top: 2px; text-transform: uppercase; }
          
          .info-section { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
          .info-box { border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; background: #ffffff; }
          .info-title { font-size: 9px; font-weight: 850; text-transform: uppercase; color: #1B6E4C; margin-bottom: 8px; border-bottom: 1.5px solid #1B6E4C; padding-bottom: 4px; letter-spacing: 0.5px; }
          .info-row { margin: 4px 0; font-weight: 600; color: #475569; font-size: 9.5px; }
          .info-row span { color: #0f172a; font-weight: 700; }
          
          .product-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 9.5px; }
          .product-table th { background: #EAF3EE; border: 1px solid #cbd5e1; color: #1B6E4C; font-weight: 850; text-transform: uppercase; font-size: 8px; padding: 8px 5px; text-align: center; }
          .product-table td { padding: 6px 5px; border: 1px solid #cbd5e1; }
          
          .totals-section { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 25px; gap: 20px; }
          .terms-box { width: 58%; font-size: 9px; color: #475569; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; background: #f8fafc; }
          .terms-title { font-weight: 850; text-transform: uppercase; color: #1B6E4C; font-size: 9px; margin-bottom: 6px; letter-spacing: 0.5px; }
          .totals-box { width: 38%; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; background: #f8fafc; font-size: 10.5px; }
          .total-row { display: flex; justify-content: space-between; margin: 4px 0; font-weight: 650; }
          .total-row.grand { border-top: 1.5px solid #cbd5e1; padding-top: 6px; margin-top: 6px; font-weight: 850; font-size: 13px; color: #1B6E4C; }
          
          .sig-seal-section { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 45px; }
          .signatures-grid { width: 72%; display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; text-align: center; }
          .sig-line { border-top: 1px solid #cbd5e1; padding-top: 6px; font-weight: 700; font-size: 8.5px; color: #475569; text-transform: uppercase; letter-spacing: 0.5px; }
          .sig-value { font-weight: 800; font-size: 9.5px; color: #0f172a; margin-bottom: 35px; }
          .seal-box { width: 25%; text-align: center; }
          .seal-ring { border: 1.5px dashed #cbd5e1; border-radius: 50%; width: 68px; height: 68px; margin: 0 auto 8px auto; display: flex; align-items: center; justify-content: center; font-size: 8px; font-weight: 850; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; line-height: 1.1; }
          .seal-title { font-weight: 700; font-size: 8.5px; color: #475569; text-transform: uppercase; }
          
          .footer { text-align: center; margin-top: 35px; font-size: 8px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 10px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header-grid">
            <div class="logo-container">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#1B6E4C" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                <polyline points="9 22 9 12 15 12 15 22"></polyline>
              </svg>
              <div>
                <h1 class="store-name">${storeSettings.storeName}</h1>
                <div class="store-details">${storeSettings.storeAddress}</div>
                <div class="store-details">📞 Ph: ${storeSettings.storePhone} | ✉ Email: ${storeSettings.storeEmail}</div>
              </div>
            </div>
            <div class="document-title-block">
              <h2 class="document-title">PURCHASE ORDER</h2>
              <div class="document-no">No: ${po.purchase_order_no}</div>
              <div class="store-details" style="margin-top: 5px;"><strong>GSTIN:</strong> ${storeSettings.gstin} | <strong>Reg No:</strong> ${storeSettings.shopRegNo}</div>
            </div>
          </div>
          
          <div class="po-meta-banner">
            <div class="meta-item">Order Date <span>${new Date(po.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span></div>
            <div class="meta-item">Expected Delivery <span>${po.expected_delivery_date ? new Date(po.expected_delivery_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Immediate'}</span></div>
            <div class="meta-item">Prepared By <span>${po.prepared_by || 'Admin'}</span></div>
            <div class="meta-item">Order Status <span class="status-badge">${po.status}</span></div>
          </div>
          
          <div class="info-section">
            <div class="info-box">
              <div class="info-title">Vendor Information</div>
              <div class="info-row">Company Name: <span>${po.vendor_name || 'Vendor Company'}</span></div>
              <div class="info-row">Contact Person: <span>${po.vendor_name || '—'}</span></div>
              <div class="info-row">Mobile Number: <span>${po.vendor_phone || '—'}</span></div>
              <div class="info-row">Email Address: <span>${po.vendor_email || '—'}</span></div>
              <div class="info-row">GST Number: <span>${po.vendor_gstin || '—'}</span></div>
              <div class="info-row">Complete Address: <span>${po.vendor_address || '—'}</span></div>
              <div class="info-row">Payment Terms: <span>Net 30 days</span></div>
            </div>
            <div class="info-box">
              <div class="info-title">Delivery Details</div>
              <div class="info-row">Delivery Address: <span>${storeSettings.storeAddress}</span></div>
              <div class="info-row">Delivery Contact Person: <span>Store Manager</span></div>
              <div class="info-row">Special Instructions: <span>${po.notes || 'Please deliver during business hours. Verify items count.'}</span></div>
            </div>
          </div>
          
          <table class="product-table">
            <thead>
              <tr>
                <th style="width: 5%;">Sr. No.</th>
                <th style="width: 25%; text-align: left;">Product Name</th>
                <th style="width: 13%;">SKU/Barcode</th>
                <th style="width: 10%;">Category</th>
                <th style="width: 7%;">Qty</th>
                <th style="width: 6%;">Unit</th>
                <th style="width: 9%;">Rate</th>
                <th style="width: 6%;">GST %</th>
                <th style="width: 8%;">Discount</th>
                <th style="width: 11%;">Total Amount</th>
                <th style="width: 10%;">Remarks</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
          
          <div class="totals-section">
            <div class="terms-box">
              <div class="terms-title">Terms & Conditions</div>
              <div style="margin-bottom: 3.5px;">1. Please reference the PO number on all invoices and packaging slips.</div>
              <div style="margin-bottom: 3.5px;">2. Deliveries must contain precise count of items listed above.</div>
              <div style="margin-bottom: 3.5px;">3. Notify the store immediately if any items are out of stock or delayed.</div>
              <div>4. Damaged or sub-standard goods will be returned at the vendor's cost.</div>
            </div>
            <div class="totals-box">
              <div class="total-row"><span>Subtotal:</span><span>₹${subtotal.toFixed(2)}</span></div>
              <div class="total-row"><span>GST Amount:</span><span>₹${gstAmount.toFixed(2)}</span></div>
              <div class="total-row"><span>Discount Amount:</span><span>-₹${discount.toFixed(2)}</span></div>
              <div class="total-row grand"><span>Grand Total:</span><span>₹${total.toFixed(2)}</span></div>
            </div>
          </div>
          
          <div class="sig-seal-section">
            <div class="signatures-grid">
              <div>
                <div class="sig-value">${po.prepared_by || 'Admin'}</div>
                <div class="sig-line">Prepared By</div>
              </div>
              <div>
                <div class="sig-value" style="height: 35px;"></div>
                <div class="sig-line">Authorized Signatory</div>
              </div>
              <div>
                <div class="sig-value" style="height: 35px;"></div>
                <div class="sig-line">Vendor Signature</div>
              </div>
            </div>
            <div class="seal-box">
              <div class="seal-ring">Company Seal</div>
              <div class="seal-title">Official Seal</div>
            </div>
          </div>
          
          <div class="footer">
            <p>This is an official system-generated Purchase Order.</p>
            <p>Generated on: ${new Date().toLocaleString('en-IN')}</p>
          </div>
        </div>
      </body>
      </html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => {
      win.print();
      win.close();
    }, 450);
  };

  return (
    <div className="space-y-5 select-none">
      
      {/* 1. Header Toolbar */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
            <DocumentPlusIcon className="w-5 h-5 stroke-[2]" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight">Purchase Orders (PO)</h2>
            <p className="text-[10px] font-semibold text-slate-500">Draft or place stock requests to supplier catalog lines</p>
          </div>
        </div>
        
        {!isReadOnly && (
          <button
            onClick={() => {
              setSelectedPO(null);
              setShowPOForm(true);
            }}
            className="flex items-center justify-center gap-1.5 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-md shadow-slate-900/10 active:scale-95 transition-all cursor-pointer"
          >
            <PlusIcon className="w-5 h-5 stroke-[2.5]" />
            Create Purchase Order
          </button>
        )}
      </div>

      {/* 2. Filters */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="relative flex items-center col-span-2">
          <MagnifyingGlassIcon className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by PO number or vendor..."
            className="w-full bg-slate-50/50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-indigo-500 font-semibold"
          />
        </div>
        
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-slate-50/50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 font-bold"
        >
          <option value="all">All Statuses</option>
          <option value="Draft">Draft</option>
          <option value="Sent">Sent</option>
          <option value="Confirmed">Confirmed</option>
          <option value="Partially Received">Partially Received</option>
          <option value="Completed">Completed</option>
          <option value="Cancelled">Cancelled</option>
        </select>
      </div>

      {/* 3. Orders List Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
        {loading ? (
          <div className="py-12 flex justify-center">
            <span className="text-sm font-semibold text-slate-500 animate-pulse">Loading orders...</span>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="py-12 text-center text-slate-450 font-bold text-xs">
            No purchase orders found matching filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/50">
                  <th className="py-3 px-4">PO Number</th>
                  <th className="py-3 px-4">Vendor</th>
                  <th className="py-3 px-4">Order Date</th>
                  <th className="py-3 px-4">Expected Delivery</th>
                  <th className="py-3 px-4 text-right">Total Amount</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-600">
                {filteredOrders.map((po) => (
                  <tr key={po.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-950">
                      <button onClick={() => handleViewDetails(po)} className="hover:text-indigo-650 hover:underline">
                        {po.purchase_order_no}
                      </button>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">{po.vendor_name}</td>
                    <td className="py-3.5 px-4">{new Date(po.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {po.expected_delivery_date 
                        ? new Date(po.expected_delivery_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                        : '—'}
                    </td>
                    <td className="py-3.5 px-4 text-right font-black text-slate-950 tabular-nums">
                      ₹{Number(po.total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${getStatusBadge(po.status)}`}>
                        {po.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center justify-center gap-2">
                        {/* View Details */}
                        <button
                          onClick={() => handleViewDetails(po)}
                          title="View Details"
                          className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg active:scale-90 transition-all cursor-pointer"
                        >
                          <EyeIcon className="w-4 h-4 stroke-[2]" />
                        </button>

                        {/* GRN goods inward */}
                        {!isReadOnly && ['Draft', 'Sent', 'Confirmed', 'Partially Received'].includes(po.status) && (
                          <button
                            onClick={() => handleOpenGRN(po)}
                            title="Receive Shipment (GRN)"
                            className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg active:scale-90 transition-all cursor-pointer"
                          >
                            <InboxArrowDownIcon className="w-4 h-4 stroke-[2]" />
                          </button>
                        )}

                        {/* Invoice conversion - Available on all active PO statuses */}
                        {!isReadOnly && ['Draft', 'Sent', 'Confirmed', 'Partially Received', 'Completed'].includes(po.status) && (
                          <button
                            onClick={() => handleOpenInvoice(po)}
                            title="Create Invoice (PI) - Update Supplier Balance & Stock"
                            className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg active:scale-90 transition-all cursor-pointer"
                          >
                            <CurrencyRupeeIcon className="w-4 h-4 stroke-[2]" />
                          </button>
                        )}

                        {/* Cancel order */}
                        {!isReadOnly && ['Draft', 'Sent', 'Confirmed'].includes(po.status) && (
                          <button
                            onClick={() => handleCancelPO(po.id)}
                            title="Cancel Order"
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-650 rounded-lg active:scale-90 transition-all cursor-pointer"
                          >
                            <XCircleIcon className="w-4 h-4 stroke-[2]" />
                          </button>
                        )}

                        {/* Delete PO */}
                        {!isReadOnly && ['Draft', 'Cancelled'].includes(po.status) && (
                          <button
                            onClick={() => handleDeletePO(po.id)}
                            title="Delete Permanently"
                            className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg active:scale-90 transition-all cursor-pointer"
                          >
                            <TrashIcon className="w-4 h-4" />
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
      {/* MODAL 1: CREATE PO FORM */}
      <Modal
        isOpen={showPOForm}
        onClose={() => setShowPOForm(false)}
        title="Draft New Purchase Order Request"
        size="2xl"
        noPadding={true}
      >
        <div className="p-6 overflow-hidden flex flex-col min-h-0 flex-1">
          <PurchaseOrderForm
            onSubmit={handleCreatePO}
            onCancel={() => setShowPOForm(false)}
          />
        </div>
      </Modal>

      {/* MODAL 2: GRN GOODS RECEIVING FORM */}
      <Modal
        isOpen={showGRNForm && !!selectedPO}
        onClose={() => {
          setShowGRNForm(false);
          setSelectedPO(null);
        }}
        title="Verify Supplier Shipment - Goods Received Note (GRN)"
        size="2xl"
        noPadding={true}
      >
        <div className="p-6 overflow-hidden flex flex-col min-h-0 flex-1">
          <GRNForm
            purchaseOrder={selectedPO}
            onSubmit={handleCreateGRN}
            onCancel={() => {
              setShowGRNForm(false);
              setSelectedPO(null);
            }}
          />
        </div>
      </Modal>

      {/* MODAL 3: INVOICE GENERATION FORM */}
      <Modal
        isOpen={showInvoiceForm && !!selectedPO}
        onClose={() => {
          setShowInvoiceForm(false);
          setSelectedPO(null);
        }}
        title={`Record Purchase Invoice from Order #${selectedPO?.purchase_order_no}`}
        size="2xl"
        noPadding={true}
      >
        <PurchaseForm
          purchaseOrder={selectedPO}
          onSubmit={handleCreateInvoice}
          onCancel={() => {
            setShowInvoiceForm(false);
            setSelectedPO(null);
          }}
        />
      </Modal>

      {/* MODAL 4: VIEW PO SUMMARY SHEET */}
      <Modal
        isOpen={!!viewingPO}
        onClose={() => setViewingPO(null)}
        title="Official Purchase Order Document"
        size="3xl"
        noPadding={true}
      >
        {viewingPO && (
          <div className="flex flex-col max-h-[85vh] overflow-y-auto bg-slate-100 font-sans select-none text-slate-800">
            
            {/* Document Container */}
            <div className="bg-white m-6 p-8 border border-slate-200 rounded-2xl shadow-sm space-y-6">
              
              {/* store details logo grid */}
              <div className="flex justify-between items-start gap-4 pb-4 border-b-2 border-emerald-700">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-200">
                    <svg className="w-9 h-9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                      <polyline points="9 22 9 12 15 12 15 22" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-slate-900 tracking-tight">{storeSettings.storeName}</h2>
                    <p className="text-xs font-semibold text-slate-500 max-w-sm mt-0.5">{storeSettings.storeAddress}</p>
                    <p className="text-[10px] font-bold text-slate-400 mt-1">📞 Ph: {storeSettings.storePhone} | ✉ {storeSettings.storeEmail}</p>
                  </div>
                </div>
                <div className="text-right">
                  <h1 className="text-2xl font-black text-emerald-800 tracking-wider">PURCHASE ORDER</h1>
                  <p className="text-xs font-mono font-bold text-slate-500 mt-1">Order ID: #{viewingPO.purchase_order_no}</p>
                  <p className="text-[10px] font-bold text-slate-400 mt-1">GSTIN: {storeSettings.gstin} | Reg: {storeSettings.shopRegNo}</p>
                </div>
              </div>

              {/* PO metadata columns */}
              <div className="grid grid-cols-4 gap-4 bg-slate-50 p-4 border border-slate-200/80 rounded-xl">
                <div>
                  <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Order Date</div>
                  <div className="text-xs font-bold text-slate-900 mt-0.5">{new Date(viewingPO.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                </div>
                <div>
                  <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Expected Delivery</div>
                  <div className="text-xs font-bold text-slate-900 mt-0.5">{viewingPO.expected_delivery_date ? new Date(viewingPO.expected_delivery_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Immediate'}</div>
                </div>
                <div>
                  <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Prepared By</div>
                  <div className="text-xs font-bold text-slate-900 mt-0.5">{viewingPO.prepared_by || 'Admin'}</div>
                </div>
                <div>
                  <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Order Status</div>
                  <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold mt-0.5 ${getStatusBadge(viewingPO.status)}`}>
                    {viewingPO.status}
                  </span>
                </div>
              </div>

              {/* info billing columns */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="border border-slate-200 rounded-xl p-4 space-y-2">
                  <h4 className="text-[10px] font-black text-emerald-850 uppercase tracking-widest border-b border-slate-100 pb-1.5">Vendor Information</h4>
                  <div className="text-xs font-semibold text-slate-650 space-y-1">
                    <div>Vendor Name: <span className="text-slate-900 font-bold">{viewingPO.vendor_name || 'Vendor Company'}</span></div>
                    <div>Contact Person: <span className="text-slate-900">{viewingPO.vendor_name || '—'}</span></div>
                    <div>Mobile Number: <span className="text-slate-900 font-mono">{viewingPO.vendor_phone || '—'}</span></div>
                    <div>Email Address: <span className="text-slate-900">{viewingPO.vendor_email || '—'}</span></div>
                    <div>GST Number: <span className="text-slate-900 font-mono">{viewingPO.vendor_gstin || '—'}</span></div>
                    <div>Complete Address: <span className="text-slate-900">{viewingPO.vendor_address || '—'}</span></div>
                    <div>Payment Terms: <span className="text-slate-900">Net 30 days</span></div>
                  </div>
                </div>
                <div className="border border-slate-200 rounded-xl p-4 space-y-2">
                  <h4 className="text-[10px] font-black text-emerald-850 uppercase tracking-widest border-b border-slate-100 pb-1.5">Delivery Details</h4>
                  <div className="text-xs font-semibold text-slate-650 space-y-1">
                    <div>Delivery Address: <span className="text-slate-900">{storeSettings.storeAddress}</span></div>
                    <div>Delivery Contact Person: <span className="text-slate-900 font-bold">Store Manager</span></div>
                    <div>Special Instructions: <span className="text-slate-900 italic">{viewingPO.notes || 'Please deliver during business hours. Verify items count.'}</span></div>
                  </div>
                </div>
              </div>

              {/* products table layout */}
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-[10px] font-bold text-slate-450 uppercase border-b border-slate-200">
                      <th className="py-2.5 px-4 text-center">Sr. No.</th>
                      <th className="py-2.5 px-4">Product Name</th>
                      <th className="py-2.5 px-4 text-center">SKU/Barcode</th>
                      <th className="py-2.5 px-4 text-center">Category</th>
                      <th className="py-2.5 px-4 text-center">Ordered Qty</th>
                      <th className="py-2.5 px-4 text-center">Unit</th>
                      <th className="py-2.5 px-4 text-right">Purchase Rate</th>
                      <th className="py-2.5 px-4 text-center">GST %</th>
                      <th className="py-2.5 px-4 text-right">Discount</th>
                      <th className="py-2.5 px-4 text-right">Total Amount</th>
                      <th className="py-2.5 px-4 text-center">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                    {viewingPO.items.map((item, index) => (
                      <tr key={index} className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-4 text-center text-slate-400 font-mono text-[10px]">{index + 1}</td>
                        <td className="py-2.5 px-4 text-slate-900 font-bold">{item.product_name}</td>
                        <td className="py-2.5 px-4 text-center text-slate-500 font-mono">{item.barcode || '—'}</td>
                        <td className="py-2.5 px-4 text-center text-slate-500">{item.category || 'General'}</td>
                        <td className="py-2.5 px-4 text-center tabular-nums">{item.quantity}</td>
                        <td className="py-2.5 px-4 text-center text-slate-450">{item.unit || 'Pcs'}</td>
                        <td className="py-2.5 px-4 text-right tabular-nums">₹{Number(item.purchase_price).toFixed(2)}</td>
                        <td className="py-2.5 px-4 text-center tabular-nums text-slate-500">{item.gst || 0}%</td>
                        <td className="py-2.5 px-4 text-right tabular-nums text-rose-500">₹0.00</td>
                        <td className="py-2.5 px-4 text-right font-black text-slate-900 tabular-nums">₹{Number(item.total).toFixed(2)}</td>
                        <td className="py-2.5 px-4 text-center text-slate-400 italic text-[11px]">{item.remarks || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* terms notes totals layout */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-5 items-start">
                <div className="md:col-span-3 border border-slate-200 rounded-xl p-4 space-y-2 text-xs text-slate-500">
                  <h5 className="font-extrabold text-emerald-800 text-[10px] uppercase tracking-wider mb-1">Terms & Conditions</h5>
                  <div className="leading-relaxed">1. Please reference the PO number on all invoices and packaging slips.</div>
                  <div className="leading-relaxed">2. Deliveries must contain precise count of items listed above.</div>
                  <div className="leading-relaxed">3. Notify the store immediately if any items are out of stock or delayed.</div>
                  <div className="leading-relaxed">4. Damaged or sub-standard goods will be returned at the vendor's cost.</div>
                </div>

                <div className="md:col-span-2 bg-emerald-950 text-white rounded-xl p-4 shadow-sm space-y-2.5 text-xs font-semibold">
                  <div className="flex justify-between"><span>Subtotal:</span><span className="font-mono text-slate-200">₹{Number(viewingPO.subtotal).toFixed(2)}</span></div>
                  <div className="flex justify-between"><span>GST Amount:</span><span className="font-mono text-slate-200">₹{Number(viewingPO.gst_amount).toFixed(2)}</span></div>
                  <div className="flex justify-between"><span>Discount Amount:</span><span className="font-mono text-rose-300">-₹{Number(viewingPO.discount || 0).toFixed(2)}</span></div>
                  <div className="border-t border-emerald-800/80 pt-2 flex justify-between items-center font-extrabold text-sm text-emerald-300">
                    <span>Grand Total:</span>
                    <span className="font-mono text-base font-black">₹{Number(viewingPO.total).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* signature layout */}
              <div className="flex justify-between items-end pt-4">
                <div className="w-3/4 grid grid-cols-3 gap-4 text-center text-[10px] font-bold text-slate-400 uppercase">
                  <div>
                    <div className="text-slate-900 font-bold text-xs mb-8">{viewingPO.prepared_by || 'Admin'}</div>
                    <div className="border-t border-slate-200 pt-1.5">Prepared By</div>
                  </div>
                  <div>
                    <div className="h-10 mb-2"></div>
                    <div className="border-t border-slate-200 pt-1.5">Authorized Signatory</div>
                  </div>
                  <div>
                    <div className="h-10 mb-2"></div>
                    <div className="border-t border-slate-200 pt-1.5">Vendor Signature</div>
                  </div>
                </div>
                <div className="w-1/4 flex flex-col items-center">
                  <div className="border-2 border-dashed border-slate-200 rounded-full w-16 h-16 flex items-center justify-center text-[9px] font-black text-slate-350 uppercase text-center leading-3 select-none">Company<br/>Seal</div>
                  <div className="text-[9px] font-bold text-slate-400 uppercase mt-2">Official Seal</div>
                </div>
              </div>

            </div>

            {/* Footer Actions */}
            <div className="bg-white border-t border-slate-200/80 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-xl">
                <span className="text-xs">💡</span>
                <span className="text-[11px] font-semibold text-indigo-900">
                  Purchase Order is an order request. Click <strong>Convert to Invoice</strong> to post bill &amp; update supplier balance.
                </span>
              </div>
              <div className="flex items-center gap-2">
                {!isReadOnly && (
                  <button
                    onClick={() => {
                      const poToConvert = viewingPO;
                      setViewingPO(null);
                      handleOpenInvoice(poToConvert);
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all active:scale-95 cursor-pointer"
                  >
                    <CurrencyRupeeIcon className="w-4 h-4 text-white stroke-[2.5]" /> Convert to Invoice (PI)
                  </button>
                )}
                <button
                  onClick={() => handlePrintPO(viewingPO)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-soft transition-all active:scale-95 cursor-pointer"
                >
                  <PrinterIcon className="w-4 h-4 text-emerald-100 stroke-[2.5]" /> Print Order
                </button>
                <button
                  onClick={() => setViewingPO(null)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* LOADER OVERLAY FOR FETCHING DETAILS */}
      {loadingDetails && (
        <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-xs flex items-center justify-center z-[99999] animate-fade-in animate-duration-200">
          <div className="bg-white px-6 py-4 rounded-2xl shadow-xl flex items-center gap-3 border border-slate-100">
            <svg className="animate-spin h-5 w-5 text-indigo-650" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span className="text-xs font-bold text-slate-700">Loading purchase order details...</span>
          </div>
        </div>
      )}

    </div>
  );
};

export default PurchaseOrderList;
