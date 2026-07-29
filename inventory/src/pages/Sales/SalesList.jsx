import { useState, useMemo, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PlusIcon,
  PrinterIcon,
  ArrowPathIcon,
  MagnifyingGlassIcon,
  BanknotesIcon,
  ClockIcon,
  CheckCircleIcon,
  BriefcaseIcon,
  ArrowTrendingUpIcon
} from '@heroicons/react/24/outline';
import Modal from '../../components/common/Modal';
import SalesForm from '../../components/forms/SalesForm';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import StatsCard from '../../components/common/StatsCard';
import { salesAPI, settingsAPI } from '../../services/api';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { fetchStockSummary, fetchStockAlerts } from '../../store/slices/stockSlice';

const fallbackSalesData = [
  {
    id: 1,
    invoiceNo: 'INV-2026-0001',
    date: '2026-07-02',
    customerName: 'Walk-in Customer',
    productsSummary: 'Coca-Cola 1.5L (x2), Taj Mahal Tea (x1)',
    quantity: 3,
    subtotal: 365.00,
    gst: 48.60,
    discount: 15.00,
    total: 398.60,
    paymentMethod: 'UPI',
    paymentStatus: 'Paid',
    status: 'Completed',
    warehouseName: 'Main Store Shelf',
    time: '12:00 PM'
  },
  {
    id: 2,
    invoiceNo: 'INV-2026-0002',
    date: '2026-07-03',
    customerName: 'Rahul Sharma',
    productsSummary: 'Maggi 2-Min Noodles (x1)',
    quantity: 1,
    subtotal: 230.00,
    gst: 41.40,
    discount: 0.00,
    total: 271.40,
    paymentMethod: 'Cash',
    paymentStatus: 'Paid',
    status: 'Completed',
    warehouseName: 'Back Warehouse',
    time: '04:30 PM'
  }
];

const SalesList = () => {
  const { user } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const isReadOnly = user?.role === 'Super Admin';

  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isPOSMode, setIsPOSMode] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, id: null });
  const [dbOffline, setDbOffline] = useState(false);
  const [viewingSale, setViewingSale] = useState(null);
  
  const [storeSettings, setStoreSettings] = useState({
    storeName: 'Kirana Mart Enterprise',
    storeAddress: 'Main Market, City Center',
    storePhone: '+91-98765-43210',
    storeEmail: 'support@kiranamart.com',
    gstin: '07AAAAA1111A1Z1',
    shopRegNo: 'REG-123456789'
  });

  const viewPrintRef = useRef();

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

  const handlePrintPastSale = () => {
    if (!viewingSale) return;
    const win = window.open('', '_blank');
    const itemsHtml = (viewingSale.items || []).map((item, idx) => `
      <tr>
        <td style="text-align: center; border: 1px solid #cbd5e1; padding: 6px;">${idx + 1}</td>
        <td style="border: 1px solid #cbd5e1; padding: 6px;">
          <div style="font-weight: bold;">${item.productName || item.name || item.product_name}</div>
          ${item.barcode ? `<div style="font-size: 8px; color: #64748b; font-family: monospace;">${item.barcode}</div>` : ''}
        </td>
        <td style="text-align: center; border: 1px solid #cbd5e1; padding: 6px;">${item.quantity} ${item.unit || 'Pcs'}</td>
        <td style="text-align: right; border: 1px solid #cbd5e1; padding: 6px;">₹${Number(item.sellingPrice || item.price || item.selling_price || 0).toFixed(2)}</td>
        <td style="text-align: center; border: 1px solid #cbd5e1; padding: 6px;">${item.gst || 0}%</td>
        <td style="text-align: right; border: 1px solid #cbd5e1; padding: 6px; font-weight: bold;">₹${Number(item.total || 0).toFixed(2)}</td>
      </tr>
    `).join('');

    win.document.write(`
      <html>
      <head>
        <title>Sales Invoice – ${viewingSale.invoiceNo || viewingSale.invoice_no}</title>
        <style>
          @page { size: A4 portrait; margin: 0.4in; }
          body { font-family: 'Segoe UI', system-ui, sans-serif; color: #1e293b; line-height: 1.4; margin: 0; background: #fff; font-size: 11px; }
          .container { width: 100%; max-width: 800px; margin: 0 auto; padding: 10px; }
          .store-header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #e2e8f0; padding-bottom: 12px; }
          .store-name { font-size: 24px; font-weight: 800; text-transform: uppercase; letter-spacing: -0.5px; color: #1B6E4C; margin: 0; }
          .store-details { font-size: 10px; color: #475569; margin: 2px 0; }
          
          .invoice-banner { background: #1B6E4C; color: #fff; padding: 12px 18px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
          .invoice-title { font-size: 18px; font-weight: 800; margin: 0; letter-spacing: 0.5px; }
          .invoice-meta { text-align: right; font-size: 10px; }
          
          .details-section { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
          .details-box { border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; background: #f8fafc; }
          .details-title { font-size: 9px; font-weight: 800; text-transform: uppercase; color: #1B6E4C; margin-bottom: 8px; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; letter-spacing: 0.5px; }
          .details-row { margin: 4px 0; font-weight: 600; color: #334155; }
          .details-row span { color: #0f172a; font-weight: 700; }
          
          .items-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 10px; }
          .items-table th { background: #EAF3EE; border: 1px solid #cbd5e1; color: #1B6E4C; font-weight: 800; text-transform: uppercase; font-size: 8px; padding: 8px 6px; text-align: center; }
          
          .summary-container { display: flex; justify-content: space-between; align-items: flex-start; }
          .greetings-box { width: 55%; font-size: 9.5px; color: #475569; padding: 10px; border: 1px dashed #cbd5e1; border-radius: 8px; }
          .summary-box { width: 40%; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; background: #f8fafc; font-size: 11px; }
          .summary-row { display: flex; justify-content: space-between; margin: 4px 0; font-weight: 650; }
          .summary-row.grand { border-top: 1.5px solid #cbd5e1; padding-top: 6px; margin-top: 6px; font-weight: 800; font-size: 14px; color: #1B6E4C; }
          
          .footer { text-align: center; margin-top: 50px; font-size: 8px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 10px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="store-header">
            <h1 class="store-name">${storeSettings.storeName}</h1>
            <p class="store-details">${storeSettings.storeAddress} | Ph: ${storeSettings.storePhone} | Email: ${storeSettings.storeEmail}</p>
            <p class="store-details"><strong>GSTIN:</strong> ${storeSettings.gstin} | <strong>Shop Reg No:</strong> ${storeSettings.shopRegNo}</p>
          </div>
          
          <div class="invoice-banner">
            <div>
              <h2 class="invoice-title">TAX INVOICE</h2>
            </div>
            <div class="invoice-meta">
              <div><strong>Invoice No:</strong> ${viewingSale.invoiceNo || viewingSale.invoice_no}</div>
              <div><strong>Date:</strong> ${viewingSale.date}</div>
              <div><strong>Fulfillment:</strong> ${viewingSale.warehouseName || 'Retail Desk'}</div>
            </div>
          </div>
          
          <div class="details-section">
            <div class="details-box">
              <div class="details-title">Customer details</div>
              <div class="details-row">Name: <span>${viewingSale.customerName || 'Walk-in Customer'}</span></div>
              <div class="details-row">Mobile: <span>${viewingSale.customerPhone || '—'}</span></div>
              <div class="details-row">Email: <span>${viewingSale.customerEmail || '—'}</span></div>
              <div class="details-row">Address: <span>${viewingSale.customerAddress || '—'}</span></div>
            </div>
            <div class="details-box">
              <div class="details-title">Payment Breakdown</div>
              ${viewingSale.payments && viewingSale.payments.length > 0 
                ? viewingSale.payments.map(p => `<div class="details-row">${p.paymentMethod}${p.referenceNo ? ` (${p.referenceNo})` : ''}: <span>₹${Number(p.amount || 0).toFixed(2)}</span></div>`).join('')
                : `<div class="details-row">Method: <span>${viewingSale.paymentMethod || 'Cash'}</span></div>`
              }
              <div class="details-row">Status: <span style="color: ${viewingSale.paymentStatus === 'Paid' ? '#1b6e4c' : '#b45309'};">${viewingSale.paymentStatus}</span></div>
              <div class="details-row">Settled Amount: <span>₹${Number(viewingSale.amountPaid || viewingSale.total || 0).toFixed(2)}</span></div>
            </div>
          </div>
          
          <table class="items-table">
            <thead>
              <tr>
                <th style="width: 5%;">#</th>
                <th style="width: 45%; text-align: left;">Product Description</th>
                <th style="width: 12%;">Qty</th>
                <th style="width: 13%;">Rate</th>
                <th style="width: 10%;">GST</th>
                <th style="width: 15%;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
          
          <div class="summary-container">
            <div class="greetings-box">
              <strong>Thank you for shopping with us!</strong>
              <div style="margin-top: 4px;">1. Goods once sold cannot be taken back or exchanged.</div>
              <div>2. This is a computer generated invoice and requires no physical signature.</div>
            </div>
            <div class="summary-box">
              <div class="summary-row"><span>Subtotal:</span><span>₹${Number(viewingSale.subtotal || 0).toFixed(2)}</span></div>
              <div class="summary-row"><span>Discounts:</span><span>-₹${Number(viewingSale.discount || 0).toFixed(2)}</span></div>
              <div class="summary-row"><span>Tax (GST):</span><span>+₹${Number(viewingSale.gstAmount || viewingSale.gst_amount || 0).toFixed(2)}</span></div>
              <div class="summary-row grand"><span>Grand Total:</span><span>₹${Number(viewingSale.total || 0).toFixed(2)}</span></div>
            </div>
          </div>
          
          <div class="footer">
            <p>This is a system-generated Invoice.</p>
            <p>Generated on: ${new Date().toLocaleString('en-IN')}</p>
          </div>
        </div>
      </body>
      </html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 450);
  };

  // Filter conditions search matrix state engine
  const [searchQuery, setSearchQuery] = useState('');
  const [customerFilter, setCustomerFilter] = useState('All');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('All');
  const [dateRangeFilter, setDateRangeFilter] = useState('All');

  const fetchSales = async () => {
    setLoading(true);
    try {
      const data = await salesAPI.getAll();
      if (data.success) {
        // Read camelCase response properties directly (standardized)
        const mapped = data.sales.map(s => ({
          id: s.id,
          invoiceNo: s.invoiceNo,
          date: s.date ? s.date.slice(0, 10) : '',
          customerName: s.customerName || 'Walk-in Customer',
          productsSummary: s.productSummary || 'General items checkout',
          quantity: s.totalItems || 1,
          subtotal: Number(s.subtotal),
          gst: Number(s.gstAmount),
          discount: Number(s.discount),
          total: Number(s.total),
          paymentMethod: s.paymentMethod,
          paymentStatus: s.paymentStatus,
          status: 'Completed',
          warehouseName: s.warehouseName || 'Retail Shelf',
          time: s.createdAt ? new Date(s.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : ''
        }));
        setSales(mapped);
      }
      setDbOffline(false);
    } catch (err) {
      console.warn('Sales API failed, loading fallback data.', err);
      setDbOffline(true);
      setSales(fallbackSalesData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
    fetchStoreSettings();
  }, []);

  // Extract unique customers
  const uniqueCustomers = useMemo(() => {
    return ['All', ...new Set(sales.map(s => s.customerName))];
  }, [sales]);

  // Dynamic Tally stats for cards
  const statsSummary = useMemo(() => {
    const totalVolume = sales.reduce((sum, s) => sum + s.total, 0);
    const totalTransactions = sales.length;
    const unpaidCount = sales.filter(s => s.paymentStatus !== 'Paid').length;
    const avgTicket = totalTransactions > 0 ? (totalVolume / totalTransactions) : 0;

    return {
      volume: totalVolume.toLocaleString('en-IN', { maximumFractionDigits: 2 }),
      transactions: totalTransactions,
      unpaid: unpaidCount,
      avgInvoice: avgTicket.toLocaleString('en-IN', { maximumFractionDigits: 2 })
    };
  }, [sales]);

  // Filtering list — always sorted by Grand Total descending (highest first)
  const processedSales = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return sales
      .filter((s) => {
        const matchSearch = searchQuery.trim() === '' ||
          s.invoiceNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.customerName.toLowerCase().includes(searchQuery.toLowerCase());

        const matchCust = customerFilter === 'All' || s.customerName === customerFilter;
        const matchPayment = paymentStatusFilter === 'All' || s.paymentStatus === paymentStatusFilter;

        let matchDate = true;
        if (dateRangeFilter === 'Today') matchDate = s.date === today;

        return matchSearch && matchCust && matchPayment && matchDate;
      })
      .sort((a, b) => b.total - a.total); // Always highest Grand Total first
  }, [sales, searchQuery, customerFilter, paymentStatusFilter, dateRangeFilter]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setCustomerFilter('All');
    setPaymentStatusFilter('All');
    setDateRangeFilter('All');
  };

  const handleAddSaleClick = () => {
    setIsPOSMode(true);
  };

  const handleOpenDeleteConfirm = (id) => {
    setDeleteConfirm({ open: true, id });
  };

  const executeSaleDeletion = async () => {
    try {
      if (!dbOffline) {
        const res = await salesAPI.delete(deleteConfirm.id);
        if (res.success) {
          fetchSales();
          // Stock is restored on sale cancellation — refresh stock views
          dispatch(fetchStockSummary());
          dispatch(fetchStockAlerts());
        }
      } else {
        setSales(sales.filter((s) => s.id !== deleteConfirm.id));
      }
    } catch (err) {
      console.error('Failed to cancel sales invoice:', err);
      alert(err.response?.data?.message || 'Cancellation failed');
    } finally {
      setDeleteConfirm({ open: false, id: null });
    }
  };

  const handleFormSubmission = async (formData) => {
    try {
      if (!dbOffline) {
        // Standardized camelCase payload is passed directly
        const itemsMapped = formData.items.map(item => ({
          productId: Number(item.productId || item.product_id || 1),
          quantity: Number(item.quantity) || 1,
          sellingPrice: Number(item.price || item.sellingPrice || item.selling_price || 0),
          mrp: Number(item.mrp || 0),
          batchNumber: item.batchNumber || item.batch_number || '',
          gst: Number(item.gst || 0),
          total: Number(item.total || 0)
        }));

        const payload = {
          invoiceNo: formData.invoiceNo || '',
          customerId: Number(formData.customerId || 1),
          customerType: formData.customerType || 'Walk-in',
          customerName: formData.customerName || '',
          customerPhone: formData.customerPhone || '',
          dueDate: formData.dueDate || null,
          amountPaid: Number(formData.amountPaid) || 0,
          warehouseId: Number(formData.warehouseId || 1), // Main Storage default
          date: formData.date || new Date().toISOString().split('T')[0],
          subtotal: Number(formData.subtotal) || 0,
          discount: Number(formData.discount) || 0,
          gstAmount: Number(formData.gstAmount || 0),
          total: Number(formData.total) || 0,
          paymentStatus: formData.paymentStatus || 'Paid',
          paymentMethod: formData.paymentMethod || 'Cash',
          items: itemsMapped
        };

        const res = await salesAPI.create(payload);
        if (res.success) {
          fetchSales();
          // Immediately refresh stock views so Stock Management page shows updated quantities
          dispatch(fetchStockSummary());
          dispatch(fetchStockAlerts());
        }
      } else {
        // Fallback simulation
        const nextId = Math.max(...sales.map((s) => s.id), 0) + 1;
        const parsedNewNode = {
          id: nextId,
          invoiceNo: formData.invoiceNo || `INV-2026-${String(nextId).padStart(3, '0')}`,
          date: formData.date || new Date().toISOString().split('T')[0],
          customerName: formData.customerName || 'Walk-in Customer',
          productsSummary: formData.productsSummary || 'General Grocery Items',
          quantity: Number(formData.quantity) || 1,
          subtotal: Number(formData.subtotal) || Number(formData.total) || 0,
          gst: Number(formData.gst) || 0,
          discount: Number(formData.discount) || 0,
          total: Number(formData.total) || 0,
          paymentMethod: formData.paymentMethod || 'Cash',
          paymentStatus: formData.paymentStatus || 'Paid',
          status: 'Completed',
          warehouseName: 'Counter display Shelf',
          time: 'Just Now'
        };
        setSales([parsedNewNode, ...sales]);
      }
    } catch (err) {
      console.error('Error saving sales checkout:', err);
      alert(err.response?.data?.message || 'Error processing sales checkout');
    } finally {
      setIsPOSMode(false);
    }
  };

  const fetchStatusStyle = (val) => {
    switch (val) {
      case 'Paid':
      case 'Completed':
        return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
      case 'Pending':
      case 'Partial':
        return 'bg-amber-50 text-amber-750 border border-amber-200';
      case 'Cancelled':
        return 'bg-rose-50 text-rose-700 border border-rose-200';
      default:
        return 'bg-slate-50 text-slate-700 border border-slate-200';
    }
  };

  if (isPOSMode) {
    return (
      <SalesForm
        onSubmit={handleFormSubmission}
        onCancel={() => setIsPOSMode(false)}
      />
    );
  }

  return (
    <div className="space-y-6 pb-12 select-none font-sans">
      
      {/* PAGE HEADER BAR SECTION CONTAINER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 border border-slate-200/80 rounded-2xl shadow-sm">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">Sales Invoices</h1>
          <p className="text-xs font-medium text-slate-500 mt-0.5">POS Checkouts and retail billing statements</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/dashboard/sales/returns"
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold bg-amber-600 dark:bg-amber-600 text-white rounded-xl shadow-md hover:bg-amber-700 dark:hover:bg-amber-500 active:scale-95 transition-all cursor-pointer"
          >
            <ArrowPathIcon className="w-4 h-4 stroke-[2.5]" /> Sales Returns
          </Link>
          {!isReadOnly && (
            <button
              onClick={handleAddSaleClick}
              className="flex items-center gap-2 px-4 py-2 text-xs font-bold bg-indigo-600 text-white rounded-xl shadow-md shadow-indigo-500/20 hover:bg-indigo-700 active:scale-95 transition-all cursor-pointer"
            >
              <PlusIcon className="w-4 h-4 stroke-[3]" /> POS Checkouts Billing
            </button>
          )}
        </div>
      </div>

      {/* STATS OVERVIEW CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Billing Volume" value={`₹${statsSummary.volume}`} icon={BanknotesIcon} subtext="Total Sales Volume" color="green" />
        <StatsCard title="Invoices Count" value={statsSummary.transactions} icon={BriefcaseIcon} subtext="Receipts Generated" color="blue" />
        <StatsCard title="Unpaid Invoices" value={statsSummary.unpaid} icon={ClockIcon} subtext="Credit Sales Pending" color="orange" />
        <StatsCard title="Average Ticket Size" value={`₹${statsSummary.avgInvoice}`} icon={ArrowTrendingUpIcon} subtext="Average Billing Value" color="purple" />
      </div>

      {/* SALES HISTORY GRID */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex items-center gap-3">
            <MagnifyingGlassIcon className="w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by invoice number or customer name..."
              className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-indigo-500 font-medium"
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <select
              value={customerFilter}
              onChange={(e) => setCustomerFilter(e.target.value)}
              className="bg-slate-50/50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 font-bold"
            >
              <option value="All">All Customers</option>
              {uniqueCustomers.filter(c => c !== 'All').map(cust => (
                <option key={cust} value={cust}>{cust}</option>
              ))}
            </select>

            <select
              value={paymentStatusFilter}
              onChange={(e) => setPaymentStatusFilter(e.target.value)}
              className="bg-slate-50/50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 font-bold"
            >
              <option value="All">All Payments</option>
              <option value="Paid">Paid</option>
              <option value="Pending">Pending</option>
            </select>

            <select
              value={dateRangeFilter}
              onChange={(e) => setDateRangeFilter(e.target.value)}
              className="bg-slate-50/50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 font-bold"
            >
              <option value="All">All Dates</option>
              <option value="Today">Today</option>
            </select>

            <button
              onClick={handleResetFilters}
              className="px-4 py-2 text-xs font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 hover:text-slate-900 rounded-xl transition-all active:scale-95 cursor-pointer"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-semibold text-slate-400 animate-pulse">Loading billing ledger...</span>
          </div>
        ) : processedSales.length === 0 ? (
          <div className="py-16 flex flex-col items-center justify-center gap-4 text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center">
              <BriefcaseIcon className="w-8 h-8 text-slate-300" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-800 tracking-tight">No Sales Records Found</h3>
              <p className="text-xs text-slate-400 font-medium mt-1 max-w-xs">
                {dateRangeFilter === 'Today'
                  ? "No invoices were billed today. Try switching to 'All Dates' to see the full history."
                  : 'No invoices match the selected filters. Try adjusting Customer, Payment, or Search criteria.'}
              </p>
            </div>
            <button
              onClick={handleResetFilters}
              className="px-4 py-2 text-xs font-bold text-indigo-600 bg-indigo-50 border border-indigo-200 rounded-xl hover:bg-indigo-100 transition-colors cursor-pointer"
            >
              Clear All Filters
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/50">
                  <th className="py-3 px-4">#</th>
                  <th className="py-3 px-4">Invoice No.</th>
                  <th className="py-3 px-4">Customer Details</th>
                  <th className="py-3 px-4">Warehouse</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Product Summary</th>
                  <th className="py-3 px-4 text-center">Total Items</th>
                  <th className="py-3 px-4 text-right">↓ Grand Total</th>
                  <th className="py-3 px-4 text-center">Method</th>
                  <th className="py-3 px-4 text-center">Payment Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-650">
                {processedSales.map((sale, idx) => (
                  <tr key={sale.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 text-slate-400 font-mono text-[10px]">{idx + 1}</td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-950">{sale.invoiceNo}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{sale.customerName}</td>
                    <td className="py-3 px-4 text-slate-500 font-semibold">{sale.warehouseName}</td>
                    <td className="py-3 px-4 text-slate-405">{sale.date} <span className="text-[10px] ml-1 text-slate-400">{sale.time}</span></td>
                    <td className="py-3 px-4 max-w-[200px] truncate text-slate-500" title={sale.productsSummary}>
                      {sale.productsSummary}
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-slate-700">{sale.quantity}</td>
                    <td className="py-3 px-4 text-right font-black text-slate-900 tabular-nums">₹{sale.total?.toFixed(2)}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[10px] font-bold">{sale.paymentMethod}</span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${fetchStatusStyle(sale.paymentStatus)}`}>
                        {sale.paymentStatus}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={async () => {
                            try {
                              const res = await salesAPI.getById(sale.id);
                              if (res.success && res.sale) {
                                setViewingSale(res.sale);
                              }
                            } catch {
                              setViewingSale({
                                ...sale,
                                items: [
                                  { productName: sale.productsSummary || 'General Grocery Item', quantity: sale.quantity, sellingPrice: sale.total / sale.quantity, gst: 18, total: sale.total }
                                ]
                              });
                            }
                          }}
                          className="px-2.5 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-md text-[10px] font-bold border border-indigo-100 transition-colors cursor-pointer"
                        >
                          View Invoice
                        </button>
                        {!isReadOnly && (
                          <Link
                            to={`/dashboard/sales/returns?invoiceNo=${encodeURIComponent(sale.invoiceNo)}`}
                            className="px-2.5 py-1 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-md text-[10px] font-bold border border-amber-200 transition-colors cursor-pointer flex items-center gap-1"
                          >
                            <ArrowPathIcon className="w-3 h-3 stroke-[2.5]" /> Return
                          </Link>
                        )}
                        {!isReadOnly ? (
                          <button
                            onClick={() => handleOpenDeleteConfirm(sale.id)}
                            className="px-2 py-1 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-md text-[10px] font-bold border border-rose-100 transition-colors cursor-pointer"
                          >
                            Void Invoice
                          </button>
                        ) : (
                          <span className="text-[10px] font-bold text-slate-400 self-center">Locked</span>
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



      <ConfirmDialog
        isOpen={deleteConfirm.open}
        title="Void Sales Invoice"
        message="Are you sure you want to void this sales receipt? This will automatically reverse (increment) the sold quantities back to counter shelf stocks."
        confirmLabel="Void Receipt"
        cancelLabel="Cancel"
        type="danger"
        onConfirm={executeSaleDeletion}
        onCancel={() => setDeleteConfirm({ open: false, id: null })}
      />

      {/* ── GREEN-THEMED PAST INVOICE DETAIL MODAL ── */}
      {viewingSale && (
        <Modal
          isOpen={!!viewingSale}
          onClose={() => setViewingSale(null)}
          title="Tax Invoice details"
          size="2xl"
          noPadding={true}
          showCloseButton={true}
        >
          <div className="bg-slate-50 flex flex-col max-h-[85vh] overflow-y-auto font-sans select-none text-slate-800">
            
            {/* Header section (Gradient green) */}
            <div className="bg-gradient-to-r from-emerald-800 to-green-700 text-white p-6 flex justify-between items-center relative overflow-hidden">
              <div className="flex items-center gap-4.5">
                <div className="w-11 h-11 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20 shadow-inner">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-black tracking-tight text-white">{storeSettings.storeName}</h2>
                  <p className="text-xs text-emerald-100/90 font-semibold mt-0.5">Tax Invoice Statement Summary</p>
                </div>
              </div>
              <div className="text-right flex items-center gap-3">
                <span className="text-xs font-black bg-white/15 text-white border border-white/25 px-3.5 py-1.5 rounded-xl">
                  #{viewingSale.invoiceNo || viewingSale.invoice_no}
                </span>
              </div>
            </div>

            {/* Store Information Overview */}
            <div className="bg-white border-b border-slate-200/80 px-6 py-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold text-slate-500">
              <div>
                <p className="text-slate-900 font-bold uppercase text-[9px] tracking-wider mb-1">Store Location & Contact</p>
                <p>{storeSettings.storeAddress}</p>
                <p>Phone: {storeSettings.storePhone} | Email: {storeSettings.storeEmail}</p>
              </div>
              <div className="sm:text-right">
                <p className="text-slate-900 font-bold uppercase text-[9px] tracking-wider mb-1">Registration details</p>
                <p>GSTIN: <span className="font-mono text-slate-700 font-bold">{storeSettings.gstin}</span></p>
                <p>Shop Reg No: <span className="font-mono text-slate-700 font-bold">{storeSettings.shopRegNo}</span></p>
              </div>
            </div>

            {/* Content Body Metadata Grid */}
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* LEFT COLUMN: Customer Card & Payment Details */}
              <div className="space-y-4">
                <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-2">
                  <h4 className="text-[10px] font-black text-indigo-650 uppercase tracking-widest border-b border-slate-100 pb-1.5">Billed To (Customer Details)</h4>
                  <div className="text-xs font-semibold space-y-1">
                    <div>Name: <span className="text-slate-900 font-bold">{viewingSale.customerName || 'Walk-in Customer'}</span></div>
                    <div>Mobile: <span className="text-slate-900 font-mono">{viewingSale.customerPhone || '—'}</span></div>
                    <div>Email: <span className="text-slate-900">{viewingSale.customerEmail || '—'}</span></div>
                    <div>Address: <span className="text-slate-900">{viewingSale.customerAddress || '—'}</span></div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-2">
                  <h4 className="text-[10px] font-black text-indigo-650 uppercase tracking-widest border-b border-slate-100 pb-1.5">Fulfillment & Time</h4>
                  <div className="text-xs font-semibold space-y-1">
                    <div>Warehouse: <span className="text-slate-900 font-bold">{viewingSale.warehouseName || 'Retail Shelf'}</span></div>
                    <div>Fulfillment Date: <span className="text-slate-900 font-mono">{viewingSale.date}</span></div>
                    {viewingSale.createdAt && <div>Transaction Time: <span className="text-slate-900 font-mono">{new Date(viewingSale.createdAt).toLocaleTimeString()}</span></div>}
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN: Payments & Calculations */}
              <div className="space-y-3.5">
                <div className="flex items-center justify-between p-3 bg-white rounded-2xl border border-slate-200 shadow-sm">
                  <span className="text-xs font-bold text-slate-800">Subtotal:</span>
                  <span className="font-mono text-xs font-black text-slate-800">₹{Number(viewingSale.subtotal || 0).toFixed(2)}</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-white rounded-2xl border border-slate-200 shadow-sm">
                  <span className="text-xs font-bold text-slate-800">Coupon Discount:</span>
                  <span className="font-mono text-xs font-black text-rose-600">- ₹{Number(viewingSale.discount || 0).toFixed(2)}</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-white rounded-2xl border border-slate-200 shadow-sm">
                  <span className="text-xs font-bold text-slate-800">GST Amount:</span>
                  <span className="font-mono text-xs font-black text-slate-800">₹{Number(viewingSale.gstAmount || viewingSale.gst_amount || 0).toFixed(2)}</span>
                </div>

                <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex items-center justify-between shadow-sm">
                  <div>
                    <h3 className="text-sm font-black text-emerald-900">Grand Total</h3>
                    <p className="text-[9px] text-emerald-600 font-bold">Inclusive of all taxes</p>
                  </div>
                  <span className="font-mono text-lg font-black text-emerald-700">
                    ₹{Number(viewingSale.total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-1.5">
                  <div className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Payment Breakdown & Modes</div>
                  {viewingSale.payments && viewingSale.payments.length > 0 ? (
                    viewingSale.payments.map((p, i) => (
                      <div key={i} className="flex items-center justify-between text-xs font-semibold">
                        <span className="text-slate-700">{p.paymentMethod}{p.referenceNo ? ` (${p.referenceNo})` : ''}:</span>
                        <span className="font-mono font-bold text-slate-900">₹{Number(p.amount || 0).toFixed(2)}</span>
                      </div>
                    ))
                  ) : (
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-slate-700">{viewingSale.paymentMethod || 'Cash'}:</span>
                      <span className="font-mono font-bold text-slate-900">₹{Number(viewingSale.amountPaid || viewingSale.total || 0).toFixed(2)}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between p-3 bg-emerald-50/50 rounded-2xl border border-emerald-200 shadow-sm">
                  <span className="text-xs font-bold text-slate-800">Payment Status:</span>
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold ${fetchStatusStyle(viewingSale.paymentStatus)}`}>
                    {viewingSale.paymentStatus}
                  </span>
                </div>

                {viewingSale.paymentStatus !== 'Paid' && (
                  <>
                    <div className="flex items-center justify-between p-3 bg-white rounded-2xl border border-slate-200 shadow-sm">
                      <span className="text-xs font-bold text-slate-800">Amount Paid:</span>
                      <span className="font-mono text-xs font-black text-emerald-600">₹{Number(viewingSale.amountPaid || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-white rounded-2xl border border-slate-200 shadow-sm">
                      <span className="text-xs font-bold text-slate-800">Due/Remaining Amount:</span>
                      <span className="font-mono text-xs font-black text-rose-600">₹{Number(viewingSale.dueAmount || 0).toFixed(2)}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Products Table (Full Width) */}
            <div className="px-6 pb-6">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Itemized Products Table</h3>
                  <span className="text-[10px] font-bold text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full">
                    {viewingSale.items?.length || 0} Items
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50/50 text-[10px] font-bold text-slate-400 uppercase border-b border-slate-100">
                        <th className="py-2.5 px-4 text-center">#</th>
                        <th className="py-2.5 px-4">Product Name</th>
                        <th className="py-2.5 px-4 text-center">Batch No</th>
                        <th className="py-2.5 px-4 text-right">MRP</th>
                        <th className="py-2.5 px-4 text-center">Qty</th>
                        <th className="py-2.5 px-4 text-right">Selling Price</th>
                        <th className="py-2.5 px-4 text-center">GST %</th>
                        <th className="py-2.5 px-4 text-right">Total Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                      {(viewingSale.items || []).map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="py-2.5 px-4 text-center text-slate-400 font-mono text-[10px]">{idx + 1}</td>
                          <td className="py-2.5 px-4">
                            <span className="font-bold text-slate-900 block">{item.productName || item.name || item.product_name}</span>
                            {item.barcode && <span className="text-[9px] font-mono text-slate-400 block">{item.barcode}</span>}
                          </td>
                          <td className="py-2.5 px-4 text-center">
                            <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-800 rounded font-mono font-bold text-[10px] border border-emerald-200/60">
                              {item.batchNumber || item.batch_number || 'DEFAULT'}
                            </span>
                          </td>
                          <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-800">
                            ₹{Number(item.mrp || item.sellingPrice || 0).toFixed(2)}
                          </td>
                          <td className="py-2.5 px-4 text-center tabular-nums">{item.quantity} {item.unit || 'Pcs'}</td>
                          <td className="py-2.5 px-4 text-right tabular-nums">₹{Number(item.sellingPrice || item.price || item.selling_price || 0).toFixed(2)}</td>
                          <td className="py-2.5 px-4 text-center tabular-nums text-slate-500">{item.gst || 0}%</td>
                          <td className="py-2.5 px-4 text-right font-black text-slate-900 tabular-nums">₹{Number(item.total || 0).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Bottom Footer Action Bar */}
            <div className="bg-emerald-50/25 px-6 py-4 flex items-center justify-between border-t border-slate-150">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-800">
                <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Billed under store counter POS system.</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrintPastSale}
                  className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/10 active:scale-95 transition-all cursor-pointer"
                >
                  <PrinterIcon className="w-4 h-4 text-emerald-100 stroke-[2.5]" />
                  Print Invoice
                </button>
                <button
                  onClick={() => setViewingSale(null)}
                  className="px-5 py-2.5 bg-slate-950 hover:bg-slate-900 text-white rounded-xl text-xs font-bold active:scale-95 transition-all cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>

          </div>
        </Modal>
      )}
    </div>
  );
};

export default SalesList;