import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  ArrowPathIcon, 
  MagnifyingGlassIcon, 
  PrinterIcon, 
  CheckCircleIcon, 
  DocumentTextIcon, 
  FunnelIcon, 
  EyeIcon, 
  CurrencyRupeeIcon, 
  BanknotesIcon, 
  ExclamationTriangleIcon,
  XMarkIcon,
  ShoppingBagIcon,
  UserIcon,
  CreditCardIcon,
  CheckBadgeIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { salesReturnsAPI, productsAPI } from '../../services/api';
import Modal from '../../components/common/Modal';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { showToast } from '../../store/slices/notificationSlice';
import { fetchCustomers } from '../../store/slices/customerSlice';
import { fetchStockSummary, fetchStockAlerts } from '../../store/slices/stockSlice';
import { fetchProducts } from '../../store/slices/productSlice';
import { fetchInventorySummary } from '../../store/slices/reportSlice';
import { fetchSales } from '../../store/slices/salesSlice';

const SalesReturn = () => {
  const [searchParams] = useSearchParams();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const isReadOnly = user?.role === 'Viewer' || user?.role === 'Super Admin' || !!localStorage.getItem('monitoredTenant');

  const [activeTab, setActiveTab] = useState('process'); // 'process' | 'history'

  // --- PROCESS RETURN STATES ---
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchInvoices, setSearchInvoices] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  // Return Form State
  const [selectedItems, setSelectedItems] = useState({}); // { productId: { checked: bool, returnQty: number } }
  const [returnReason, setReturnReason] = useState('Wrong Item Purchased');
  const [returnType, setReturnType] = useState('Refund'); // 'Refund', 'Credit Adjustment (Udhaar Credit Note)', 'Exchange', 'Cancel Item from Invoice', 'Store Credit'
  const [refundMethod, setRefundMethod] = useState('Cash'); // 'Cash', 'UPI', 'Bank', 'Same Payment Method'
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Exchange replacement product states
  const [productsList, setProductsList] = useState([]);
  const [replacementProductId, setReplacementProductId] = useState('');
  const [replacementQty, setReplacementQty] = useState(1);

  // --- RETURN HISTORY STATES ---
  const [returnsHistory, setReturnsHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historySearch, setHistorySearch] = useState('');
  const [historyDate, setHistoryDate] = useState('');
  const [historyCustomer, setHistoryCustomer] = useState('');
  const [historyReturnType, setHistoryReturnType] = useState('all');

  // --- VOUCHER PRINT & CONFIRMATION MODALS ---
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingPayload, setPendingPayload] = useState(null);
  const [showVoucherModal, setShowVoucherModal] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState(null);

  const returnReasonsList = [
    'Wrong Item Purchased',
    'Customer Changed Mind',
    'Already Available at Home',
    'Damaged Product',
    'Defective Product',
    'Expired Product',
    'Exchange',
    'Other'
  ];

  const returnTypesList = [
    'Refund',
    'Credit Adjustment (Udhaar Credit Note)',
    'Exchange',
    'Cancel Item from Invoice',
    'Store Credit'
  ];

  const refundMethodsList = [
    'Cash',
    'UPI',
    'Bank',
    'Same Payment Method'
  ];

  useEffect(() => {
    if (activeTab === 'history') {
      fetchHistory();
    }
  }, [activeTab, historySearch, historyDate, historyCustomer, historyReturnType]);

  useEffect(() => {
    const invoiceNoParam = searchParams.get('invoiceNo') || searchParams.get('invoiceId');
    if (invoiceNoParam) {
      setSearchQuery(invoiceNoParam);
      autoLoadInvoice(invoiceNoParam);
    }
  }, [searchParams]);

  const autoLoadInvoice = async (queryStr) => {
    setSearching(true);
    setSelectedInvoice(null);
    setSelectedItems({});
    try {
      const res = await salesReturnsAPI.searchInvoice(queryStr.trim());
      if (res && res.success && res.invoices && res.invoices.length > 0) {
        setSearchInvoices(res.invoices);
        selectInvoice(res.invoices[0]);
      }
    } catch (err) {
      console.error('Auto loading invoice failed:', err);
    } finally {
      setSearching(false);
    }
  };

  useEffect(() => {
    if (returnType === 'Exchange' && productsList.length === 0) {
      fetchProducts();
    }
  }, [returnType]);

  const fetchProducts = async () => {
    try {
      const res = await productsAPI.getAll();
      if (res && res.success) {
        setProductsList(res.products || []);
      }
    } catch (err) {
      console.error('Failed to load products for exchange:', err);
    }
  };

  const handleSearchInvoice = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      dispatch(showToast({ msg: 'Please enter invoice number, customer name, or phone number', type: 'error' }));
      return;
    }

    setSearching(true);
    setSelectedInvoice(null);
    setSelectedItems({});
    try {
      const res = await salesReturnsAPI.searchInvoice(searchQuery.trim());
      if (res && res.success && res.invoices && res.invoices.length > 0) {
        setSearchInvoices(res.invoices);
        if (res.invoices.length === 1) {
          selectInvoice(res.invoices[0]);
        }
      } else {
        setSearchInvoices([]);
        dispatch(showToast({ msg: 'No matching sales invoice found', type: 'error' }));
      }
    } catch (err) {
      setSearchInvoices([]);
      dispatch(showToast({ msg: err.response?.data?.message || 'Invoice search failed', type: 'error' }));
    } finally {
      setSearching(false);
    }
  };

  const selectInvoice = (invoice) => {
    setSelectedInvoice(invoice);
    const initialItems = {};
    if (invoice.items && Array.isArray(invoice.items)) {
      invoice.items.forEach((item, index) => {
        const lineKey = item.sale_item_id ? String(item.sale_item_id) : `${item.product_id}-${index}`;
        const eligible = Number(item.remaining_qty) || 0;
        initialItems[lineKey] = {
          lineKey,
          sale_item_id: item.sale_item_id,
          product_id: item.product_id,
          checked: false,
          returnQty: eligible > 0 ? 1 : 0,
          maxQty: eligible,
          unitPrice: item.unit_price,
          productName: item.product_name
        };
      });
    }
    setSelectedItems(initialItems);

    // Auto set ERP Return Type: If Borrow customer with outstanding due, default to Credit Adjustment
    const isBorrow = invoice.customer_type === 'Borrow' || Number(invoice.due_amount) > 0;
    if (isBorrow) {
      setReturnType('Credit Adjustment (Udhaar Credit Note)');
    } else {
      setReturnType('Refund');
    }
  };

  const handleItemCheck = (lineKey, checked) => {
    setSelectedItems(prev => ({
      ...prev,
      [lineKey]: {
        ...prev[lineKey],
        checked
      }
    }));
  };

  const handleQtyChange = (lineKey, qty) => {
    const max = selectedItems[lineKey]?.maxQty || 0;
    const parsedQty = Math.max(0, Math.min(max, Number(qty) || 0));
    setSelectedItems(prev => ({
      ...prev,
      [lineKey]: {
        ...prev[lineKey],
        returnQty: parsedQty
      }
    }));
  };

  const prevMax = (lineKey) => selectedItems[lineKey]?.maxQty || 0;

  // Calculate Total Refund Amount
  const totalCalculatedRefund = Object.keys(selectedItems).reduce((sum, lineKey) => {
    const item = selectedItems[lineKey];
    if (item && item.checked) {
      return sum + (item.unitPrice * item.returnQty);
    }
    return sum;
  }, 0);

  // Price Difference for Exchange
  const selectedReplacementProduct = productsList.find(p => p.id === Number(replacementProductId));
  const replacementPrice = selectedReplacementProduct ? Number(selectedReplacementProduct.selling_price || selectedReplacementProduct.price || 0) : 0;
  const replacementTotal = replacementPrice * replacementQty;
  const priceDifference = replacementTotal - totalCalculatedRefund;

  const isBorrowInvoice = selectedInvoice && (selectedInvoice.customer_type === 'Borrow' || Number(selectedInvoice.due_amount) > 0);
  const currentInvoiceDue = selectedInvoice ? Number(selectedInvoice.invoice_borrow_remaining ?? selectedInvoice.due_amount ?? 0) : 0;
  const newInvoiceDuePreview = Math.max(0, currentInvoiceDue - totalCalculatedRefund);

  const handleProcessReturnSubmit = async (e) => {
    e.preventDefault();
    if (!selectedInvoice) return;

    if (selectedInvoice.is_policy_eligible === false) {
      dispatch(showToast({
        msg: `3-Day Return Policy Expired: Returns are only accepted within 3 days of purchase. Invoice was issued ${selectedInvoice.days_since_sale || 'over 3'} days ago.`,
        type: 'error'
      }));
      return;
    }

    // Validate at least one item is checked and has valid return quantity
    const checkedKeys = Object.keys(selectedItems).filter(
      k => selectedItems[k].checked && selectedItems[k].returnQty > 0 && selectedItems[k].maxQty > 0
    );
    if (checkedKeys.length === 0) {
      dispatch(showToast({ msg: 'Please select at least one eligible item with available return quantity > 0', type: 'error' }));
      return;
    }

    const firstKey = checkedKeys[0];
    const firstItem = selectedItems[firstKey];

    if (firstItem.returnQty > firstItem.maxQty || firstItem.returnQty <= 0) {
      dispatch(showToast({ msg: `Return quantity (${firstItem.returnQty}) must be between 1 and remaining sold quantity (${firstItem.maxQty})`, type: 'error' }));
      return;
    }

    const returnItemsList = checkedKeys.map(k => ({
      sale_item_id: selectedItems[k].sale_item_id,
      product_id: Number(selectedItems[k].product_id),
      quantity: selectedItems[k].returnQty,
      productName: selectedItems[k].productName,
      unitPrice: selectedItems[k].unitPrice
    }));

    const payload = {
      sale_id: selectedInvoice.sale_id,
      items: returnItemsList,
      product_id: Number(firstItem.product_id),
      quantity: firstItem.returnQty,
      reason: returnReason,
      return_type: returnType,
      refund_method: isBorrowInvoice ? 'Credit Note / Udhaar Settlement' : refundMethod,
      remarks,
      replacement_product_id: returnType === 'Exchange' && replacementProductId ? Number(replacementProductId) : null,
      replacement_quantity: returnType === 'Exchange' ? Number(replacementQty) : 0,
      price_difference: returnType === 'Exchange' ? priceDifference : 0
    };

    setPendingPayload(payload);
    setShowConfirmModal(true);
  };

  const executeProcessReturn = async () => {
    if (!pendingPayload) return;
    setSubmitting(true);
    setShowConfirmModal(false);

    try {
      const res = await salesReturnsAPI.create(pendingPayload);
      if (res && res.success) {
        dispatch(showToast({ msg: res.message || `Sales Return Voucher ${res.returnNo} processed successfully!`, type: 'success' }));
        
        // Refresh all global Redux slices immediately across ERP
        dispatch(fetchCustomers());
        dispatch(fetchStockSummary());
        dispatch(fetchStockAlerts());
        dispatch(fetchProducts());
        dispatch(fetchInventorySummary());
        dispatch(fetchSales());

        // Fetch full return voucher details to display print modal
        if (res.returnId) {
          const vRes = await salesReturnsAPI.getById(res.returnId);
          if (vRes && vRes.success) {
            setSelectedVoucher(vRes.salesReturn);
            setShowVoucherModal(true);
          }
        }

        // Reset form
        setSelectedInvoice(null);
        setSearchInvoices([]);
        setSelectedItems({});
        setRemarks('');
        setPendingPayload(null);
      }
    } catch (err) {
      dispatch(showToast({ msg: err.response?.data?.message || 'Failed to process sales return', type: 'error' }));
    } finally {
      setSubmitting(false);
    }
  };

  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const params = {
        search: historySearch,
        date: historyDate,
        customer: historyCustomer,
        returnType: historyReturnType
      };
      const res = await salesReturnsAPI.getAll(params);
      if (res && res.success) {
        setReturnsHistory(res.returns || []);
      }
    } catch (err) {
      console.error('Failed to fetch sales returns history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleOpenVoucher = async (returnId) => {
    try {
      const vRes = await salesReturnsAPI.getById(returnId);
      if (vRes && vRes.success && vRes.salesReturn) {
        setSelectedVoucher(vRes.salesReturn);
        setShowVoucherModal(true);
      } else {
        const found = returnsHistory.find(r => r.id === returnId);
        if (found) {
          setSelectedVoucher(found);
          setShowVoucherModal(true);
        } else {
          dispatch(showToast({ msg: 'Voucher details not found', type: 'error' }));
        }
      }
    } catch (err) {
      const found = returnsHistory.find(r => r.id === returnId);
      if (found) {
        setSelectedVoucher(found);
        setShowVoucherModal(true);
      } else {
        dispatch(showToast({ msg: 'Failed to open voucher receipt', type: 'error' }));
      }
    }
  };

  const handleNavigateToInvoice = (invoiceNo) => {
    if (!invoiceNo) return;
    setActiveTab('process');
    setSearchQuery(invoiceNo);
    salesReturnsAPI.searchInvoice(invoiceNo).then(res => {
      if (res && res.success && res.invoices && res.invoices.length > 0) {
        setSearchInvoices(res.invoices);
        selectInvoice(res.invoices[0]);
      }
    }).catch(err => console.error(err));
  };

  const handleVoidReturn = async (returnId, returnNo) => {
    if (isReadOnly) return;
    if (window.confirm(`Are you sure you want to void Sales Return Voucher ${returnNo || returnId}? This will restore the unreturned quantity on the invoice and adjust stock/ledger balances.`)) {
      try {
        const res = await salesReturnsAPI.delete(returnId);
        if (res && res.success) {
          dispatch(showToast({ msg: res.message || `Return Voucher ${returnNo} voided successfully!`, type: 'success' }));
          fetchHistory();
          // Refresh global Redux slices
          dispatch(fetchCustomers());
          dispatch(fetchStockSummary());
          dispatch(fetchProducts());
          dispatch(fetchSales());
        } else {
          dispatch(showToast({ msg: res?.message || 'Voiding return voucher failed', type: 'error' }));
        }
      } catch (err) {
        dispatch(showToast({ msg: err.response?.data?.message || 'Failed to void sales return', type: 'error' }));
      }
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 select-none font-sans bg-slate-50 dark:bg-slate-950 min-h-screen">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-xs">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <div className="p-2 bg-emerald-600 rounded-xl text-white shadow-md">
              <ArrowPathIcon className="w-6 h-6 stroke-[2.5]" />
            </div>
            Customer Sales Return Management
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-1">
            Process returns, adjust Udhaar balances, manage exchanges, and keep inventory & customer ledgers synchronized.
          </p>
        </div>

        {/* TOP TAB SWITCHER */}
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 self-start md:self-auto">
          <button
            onClick={() => setActiveTab('process')}
            className={`px-4 py-2 rounded-lg text-xs font-black transition-all cursor-pointer ${
              activeTab === 'process'
                ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs border border-slate-200 dark:border-slate-800'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Process Return
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-lg text-xs font-black transition-all cursor-pointer ${
              activeTab === 'history'
                ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs border border-slate-200 dark:border-slate-800'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Return Logs & History
          </button>
        </div>
      </div>

      {/* TAB 1: PROCESS RETURN WORKFLOW */}
      {activeTab === 'process' && (
        <div className="space-y-6">
          
          {/* STEP 1: INVOICE SEARCH BAR */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-xs space-y-4">
            <h2 className="text-xs font-black text-slate-400 dark:text-slate-400 uppercase tracking-wider">
              Step 1: Search Original Sales Invoice
            </h2>
            <form onSubmit={handleSearchInvoice} className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Enter Invoice No (e.g. INV-2026-0001), Customer Name, or Phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-emerald-600"
                />
              </div>
              <button
                type="submit"
                disabled={searching}
                className="px-6 py-2.5 bg-emerald-600 dark:bg-emerald-600 hover:bg-emerald-700 dark:hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-50"
              >
                {searching ? 'Searching Invoice...' : 'Find Invoice'}
              </button>
            </form>

            {/* SEARCH RESULTS LIST IF MULTIPLE FOUND */}
            {searchInvoices.length > 1 && !selectedInvoice && (
              <div className="mt-4 border border-slate-200 dark:border-slate-800 rounded-xl divide-y divide-slate-100 dark:divide-slate-800 max-h-60 overflow-y-auto">
                <div className="p-2 bg-slate-50 dark:bg-slate-950 text-[10px] font-black text-slate-400 uppercase">
                  Select Invoice from Search Matches ({searchInvoices.length})
                </div>
                {searchInvoices.map((inv) => (
                  <div
                    key={inv.sale_id}
                    onClick={() => selectInvoice(inv)}
                    className="p-3 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/30 cursor-pointer flex items-center justify-between transition-colors"
                  >
                    <div>
                      <span className="text-xs font-black text-slate-900 dark:text-white">{inv.invoice_no}</span>
                      <span className="text-[11px] font-bold text-slate-500 ml-3">Customer: {inv.customer_name} ({inv.customer_phone})</span>
                      <span className={`ml-2 px-2 py-0.5 rounded text-[9px] font-extrabold ${inv.customer_type === 'Borrow' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'}`}>
                        {inv.customer_type}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">₹{Number(inv.grand_total).toLocaleString('en-IN')}</span>
                      <span className="text-[10px] font-bold text-slate-400 block">{new Date(inv.sale_date).toLocaleDateString('en-IN')}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* STEP 2 & 3: INVOICE DETAILS & ITEM RETURN SELECTION */}
          {selectedInvoice && (
            <form
              onSubmit={handleProcessReturnSubmit}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
                  e.preventDefault();
                }
              }}
              className="space-y-6 animate-[fadeIn_0.2s_ease-out]"
            >
              
              {/* INVOICE HEADER AUTO SUMMARY */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <h2 className="text-xs font-black text-slate-400 dark:text-slate-400 uppercase tracking-wider">
                    Step 2: Selected Invoice Specs & Customer Classification
                  </h2>
                  <button
                    type="button"
                    onClick={() => setSelectedInvoice(null)}
                    className="text-xs font-bold text-rose-600 hover:underline cursor-pointer"
                  >
                    Change Invoice
                  </button>
                </div>

                {/* 3-DAY RETURN POLICY STATUS BANNER */}
                <div className={`p-4 rounded-xl border flex items-start sm:items-center gap-3 text-xs font-bold ${
                  selectedInvoice.is_policy_eligible !== false
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                    : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200'
                }`}>
                  <CheckBadgeIcon className={`w-5 h-5 flex-shrink-0 mt-0.5 sm:mt-0 ${selectedInvoice.is_policy_eligible !== false ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`} />
                  <div className="flex-1">
                    <span className="font-black block uppercase text-[10px] tracking-wider">
                      {selectedInvoice.is_policy_eligible !== false ? '✓ 3-Day Store Return Policy Active' : '⚠️ 3-Day Store Return Period Expired'}
                    </span>
                    <span>{selectedInvoice.policy_message || 'Invoice eligible under 3-day return policy'}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 text-xs font-bold text-slate-700 dark:text-slate-300">
                  <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] font-black text-slate-400 uppercase block">Invoice Number</span>
                    <span className="text-sm font-black text-slate-900 dark:text-white">{selectedInvoice.invoice_no}</span>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] font-black text-slate-400 uppercase block">Customer & Type</span>
                    <span className="text-sm font-black text-slate-900 dark:text-white">{selectedInvoice.customer_name}</span>
                    <span className={`mt-1 inline-block px-2 py-0.5 rounded text-[9px] font-black ${isBorrowInvoice ? 'bg-amber-500 text-white' : 'bg-emerald-600 text-white'}`}>
                      {isBorrowInvoice ? 'Borrow (Udhaar Customer)' : 'Paid / Walk-in Customer'}
                    </span>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] font-black text-slate-400 uppercase block">Invoice Total / Paid</span>
                    <span className="text-sm font-black text-slate-900 dark:text-white">₹{Number(selectedInvoice.grand_total).toLocaleString('en-IN')}</span>
                    <span className="text-[10px] text-emerald-600 font-bold block">Paid: ₹{Number(selectedInvoice.amount_paid).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] font-black text-slate-400 uppercase block">Current Invoice Due</span>
                    <span className={`text-sm font-black ${currentInvoiceDue > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600'}`}>
                      ₹{currentInvoiceDue.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] font-black text-slate-400 uppercase block">Total Udhaar Balance</span>
                    <span className="text-sm font-black text-rose-600 dark:text-rose-400">
                      ₹{Number(selectedInvoice.customer_outstanding_balance || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                {/* PURCHASED ITEMS TABLE */}
                <div className="pt-2">
                  <h3 className="text-xs font-black text-slate-800 dark:text-slate-200 mb-3">
                    Select Item(s) to Return:
                  </h3>
                  <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                    <table className="w-full text-left text-xs font-semibold">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                          <th className="p-3 w-10 text-center">Select</th>
                          <th className="p-3">Item Name</th>
                          <th className="p-3">Sold Qty</th>
                          <th className="p-3">Already Returned</th>
                          <th className="p-3">Eligible Return Qty</th>
                          <th className="p-3">Unit Price</th>
                          <th className="p-3 w-32">Return Qty</th>
                          <th className="p-3 text-right">Return Value Line</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                        {selectedInvoice.items && selectedInvoice.items.map((item, index) => {
                          const lineKey = item.sale_item_id ? String(item.sale_item_id) : `${item.product_id}-${index}`;
                          const stateItem = selectedItems[lineKey] || {};
                          const isChecked = stateItem.checked || false;
                          const returnQty = stateItem.returnQty || 0;
                          const lineTotal = item.unit_price * returnQty;
                          const isEligible = item.remaining_qty > 0 && selectedInvoice.is_policy_eligible !== false;

                          return (
                            <tr key={lineKey} className={`hover:bg-slate-50/50 dark:hover:bg-slate-950/30 ${isChecked ? 'bg-emerald-50/20 dark:bg-emerald-950/20' : ''}`}>
                              <td className="p-3 text-center">
                                <input
                                  type="checkbox"
                                  disabled={!isEligible}
                                  checked={isChecked}
                                  onChange={(e) => handleItemCheck(lineKey, e.target.checked)}
                                  className="h-4 w-4 rounded border-slate-300 dark:border-slate-700 text-emerald-600 focus:ring-0 cursor-pointer disabled:opacity-40"
                                />
                              </td>
                              <td className="p-3 font-bold text-slate-900 dark:text-white">
                                {item.product_name}
                                <span className="text-[10px] font-medium text-slate-400 block">{item.barcode || 'N/A'}</span>
                              </td>
                              <td className="p-3 text-slate-700 dark:text-slate-300 font-bold">{item.sold_qty}</td>
                              <td className="p-3 text-amber-600 font-bold">{item.returned_qty}</td>
                              <td className="p-3 font-black">
                                {item.remaining_qty > 0 ? (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                                    {item.remaining_qty} Available
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-black bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300">
                                    Fully Returned (0)
                                  </span>
                                )}
                              </td>
                              <td className="p-3 font-bold text-slate-800 dark:text-slate-200">₹{item.unit_price.toLocaleString('en-IN')}</td>
                              <td className="p-3">
                                <input
                                  type="number"
                                  min={0}
                                  max={item.remaining_qty}
                                  disabled={!isChecked || !isEligible}
                                  value={returnQty}
                                  onChange={(e) => handleQtyChange(lineKey, e.target.value)}
                                  className="w-20 px-2 py-1 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-900 dark:text-white disabled:opacity-40 focus:outline-none focus:border-emerald-600"
                                />
                              </td>
                              <td className="p-3 text-right font-black text-slate-900 dark:text-white">
                                {isChecked ? `₹${lineTotal.toLocaleString('en-IN')}` : '—'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* STEP 3: RETURN TYPE, REASON & REFUND METRICS */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-xs space-y-6">
                <h2 className="text-xs font-black text-slate-400 dark:text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-3">
                  Step 3: ERP Business Logic & Settlement Settlement
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  
                  {/* RETURN REASON */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      Return Reason <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={returnReason}
                      onChange={(e) => setReturnReason(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-emerald-600 cursor-pointer"
                    >
                      {returnReasonsList.map(r => (
                        <option key={r} value={r} className="bg-white dark:bg-slate-900">{r}</option>
                      ))}
                    </select>
                  </div>

                  {/* RETURN TYPE */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      Return Type / Action Mode <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={returnType}
                      onChange={(e) => setReturnType(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-emerald-600 cursor-pointer"
                    >
                      {returnTypesList.map(t => (
                        <option key={t} value={t} className="bg-white dark:bg-slate-900">{t}</option>
                      ))}
                    </select>
                  </div>

                  {/* DYNAMIC FIELD: REFUND METHOD (Only for Walk-in or Fully Paid) */}
                  {!isBorrowInvoice && returnType === 'Refund' && (
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                        Refund Payment Method <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={refundMethod}
                        onChange={(e) => setRefundMethod(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-emerald-600 cursor-pointer"
                      >
                        {refundMethodsList.map(m => (
                          <option key={m} value={m} className="bg-white dark:bg-slate-900">{m}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* DYNAMIC FIELD: EXCHANGE REPLACEMENT PRODUCT */}
                  {returnType === 'Exchange' && (
                    <>
                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                          Replacement Product
                        </label>
                        <select
                          value={replacementProductId}
                          onChange={(e) => setReplacementProductId(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-emerald-600 cursor-pointer"
                        >
                          <option value="">Select Replacement Item...</option>
                          {productsList.map(p => (
                            <option key={p.id} value={p.id} className="bg-white dark:bg-slate-900">
                              {p.name} — ₹{Number(p.selling_price || p.price || 0).toLocaleString('en-IN')}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                          Replacement Quantity
                        </label>
                        <input
                          type="number"
                          min={1}
                          value={replacementQty}
                          onChange={(e) => setReplacementQty(Math.max(1, Number(e.target.value) || 1))}
                          className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-emerald-600"
                        />
                      </div>
                    </>
                  )}
                </div>

                {/* REMARKS TEXTAREA */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Remarks / Audit Notes (Optional)
                  </label>
                  <input
                    type="text"
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="Log key remarks or conditions..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-emerald-600"
                  />
                </div>

                {/* UDHAAR ADJUSTMENT BREAKDOWN CARD FOR BORROW CUSTOMERS */}
                {isBorrowInvoice ? (
                  <div className="bg-amber-50/60 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 p-5 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-amber-900 dark:text-amber-300 uppercase tracking-wider flex items-center gap-2">
                        <CreditCardIcon className="w-4 h-4 stroke-[2.5]" />
                        Udhaar Credit Adjustment Breakdown
                      </span>
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-black ${newInvoiceDuePreview === 0 ? 'bg-emerald-600 text-white' : 'bg-amber-600 text-white'}`}>
                        {newInvoiceDuePreview === 0 ? '✓ Invoice Will Be Paid / Settled' : 'Partial Adjustment'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-bold">
                      <div className="bg-white/80 dark:bg-slate-900/80 p-3 rounded-xl border border-amber-100 dark:border-amber-900">
                        <span className="text-[10px] text-slate-400 block uppercase font-black">Current Invoice Due</span>
                        <span className="text-sm font-black text-slate-900 dark:text-white">₹{currentInvoiceDue.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="bg-white/80 dark:bg-slate-900/80 p-3 rounded-xl border border-amber-100 dark:border-amber-900">
                        <span className="text-[10px] text-slate-400 block uppercase font-black">Returned Product Value</span>
                        <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">- ₹{totalCalculatedRefund.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="bg-white/80 dark:bg-slate-900/80 p-3 rounded-xl border border-amber-100 dark:border-amber-900">
                        <span className="text-[10px] text-slate-400 block uppercase font-black">New Remaining Invoice Due</span>
                        <span className="text-sm font-black text-amber-600 dark:text-amber-400">₹{newInvoiceDuePreview.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* REFUND SUMMARY CARD FOR PAID / WALK-IN CUSTOMERS */
                  <div className="bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                      <span className="text-[10px] font-black text-emerald-800 dark:text-emerald-300 uppercase tracking-wider block">
                        Total Calculated Refund Settlement
                      </span>
                      <p className="text-xs text-slate-600 dark:text-slate-400 font-bold mt-0.5">
                        Selected Items Return Total: ₹{totalCalculatedRefund.toLocaleString('en-IN')}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                        ₹{totalCalculatedRefund.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                )}

                {/* SUBMIT BUTTON */}
                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={submitting || totalCalculatedRefund <= 0}
                    className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-black rounded-xl text-xs shadow-lg transition-all active:scale-95 cursor-pointer disabled:opacity-40"
                  >
                    {submitting ? 'Processing Return...' : `Confirm & Complete Return Voucher`}
                  </button>
                </div>
              </div>

            </form>
          )}
        </div>
      )}

      {/* TAB 2: RETURN LOGS & HISTORY */}
      {activeTab === 'history' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-xs space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                Sales Return History Logs
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Complete audit trail of all processed customer returns and replacements.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
            <table className="w-full text-left text-xs font-semibold">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                  <th className="p-3">Voucher #</th>
                  <th className="p-3">Invoice #</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Product</th>
                  <th className="p-3">Qty</th>
                  <th className="p-3">Refund / Value</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Reason</th>
                  <th className="p-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                {loadingHistory ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-400 font-bold">
                      Loading sales return history logs...
                    </td>
                  </tr>
                ) : returnsHistory.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-400 font-bold">
                      No sales return history records found.
                    </td>
                  </tr>
                ) : (
                  returnsHistory.map((ret) => (
                    <tr key={ret.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/30">
                      <td className="p-3 font-black">
                        <button
                          type="button"
                          onClick={() => handleOpenVoucher(ret.id)}
                          className="text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer focus:outline-none text-left"
                          title="Click to View Voucher Receipt"
                        >
                          {ret.return_no}
                        </button>
                      </td>
                      <td className="p-3 font-bold">
                        <button
                          type="button"
                          onClick={() => handleNavigateToInvoice(ret.invoice_no)}
                          className="text-slate-800 dark:text-slate-200 hover:text-emerald-600 hover:underline cursor-pointer focus:outline-none text-left"
                          title="Click to Load Original Invoice"
                        >
                          {ret.invoice_no}
                        </button>
                      </td>
                      <td className="p-3 font-bold text-slate-900 dark:text-white">
                        {ret.customer_name}
                        <span className="text-[10px] text-slate-400 block">{ret.customer_phone}</span>
                      </td>
                      <td className="p-3 font-bold text-slate-800 dark:text-slate-200">{ret.product_name}</td>
                      <td className="p-3 font-bold text-slate-900 dark:text-white">{ret.quantity}</td>
                      <td className="p-3 font-black text-emerald-600 dark:text-emerald-400">₹{Number(ret.refund_amount).toLocaleString('en-IN')}</td>
                      <td className="p-3 font-bold">
                        <span className="px-2 py-0.5 rounded text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {ret.return_type}
                        </span>
                      </td>
                      <td className="p-3 text-slate-500 font-bold">{ret.reason}</td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleOpenVoucher(ret.id)}
                            className="p-1.5 text-slate-600 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            title="View Voucher Receipt"
                          >
                            <EyeIcon className="w-4 h-4" />
                          </button>
                          {!isReadOnly && (
                            <button
                              onClick={() => handleVoidReturn(ret.id, ret.return_no)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                              title="Void / Cancel Return Voucher"
                            >
                              <TrashIcon className="w-4 h-4" />
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
      )}

      {/* CONFIRMATION MODAL BEFORE PROCESSING RETURN */}
      <Modal
        isOpen={showConfirmModal}
        onClose={() => {
          setShowConfirmModal(false);
          setPendingPayload(null);
        }}
        title="⚠️ Confirm Sales Return & Inventory Stock Restoration"
      >
        {pendingPayload && selectedInvoice && (
          <div className="space-y-4 text-xs font-semibold text-slate-800 dark:text-slate-200">
            <div className="p-4 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-800 flex items-start gap-3">
              <ExclamationTriangleIcon className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-black text-amber-900 dark:text-amber-200 uppercase text-[11px]">
                  Confirm Stock Return Action
                </h4>
                <p className="text-amber-800 dark:text-amber-300 font-bold mt-0.5">
                  Are you sure you want to complete this return? Stock levels in warehouse inventory and customer ledger balance will be updated now.
                </p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-2">
                <span className="font-black text-slate-900 dark:text-white text-sm">Invoice #: {selectedInvoice.invoice_no}</span>
                <span className="text-emerald-600 font-black text-sm">Total Refund: ₹{totalCalculatedRefund.toLocaleString('en-IN')}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-slate-600 dark:text-slate-400 pt-1">
                <div>Customer: <strong className="text-slate-900 dark:text-white">{selectedInvoice.customer_name} ({selectedInvoice.customer_phone})</strong></div>
                <div>Return Reason: <strong className="text-slate-900 dark:text-white">{returnReason}</strong></div>
                <div>Return Mode: <strong className="text-slate-900 dark:text-white">{returnType}</strong></div>
                <div>Refund Method: <strong className="text-slate-900 dark:text-white">{isBorrowInvoice ? 'Udhaar Credit Settlement' : refundMethod}</strong></div>
              </div>

              {pendingPayload.items && pendingPayload.items.length > 0 && (
                <div className="pt-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase block mb-1">Items To Return:</span>
                  <div className="space-y-1">
                    {pendingPayload.items.map((it, idx) => (
                      <div key={idx} className="flex justify-between bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-800">
                        <span>{it.productName || `Product #${it.product_id}`} (x{it.quantity})</span>
                        <span className="font-black text-emerald-600">₹{((it.unitPrice || 0) * it.quantity).toLocaleString('en-IN')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowConfirmModal(false);
                  setPendingPayload(null);
                }}
                className="px-5 py-2.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold rounded-xl text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={executeProcessReturn}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 text-white font-black rounded-xl text-xs shadow-lg transition-all active:scale-95 cursor-pointer disabled:opacity-50 flex items-center gap-2"
              >
                <CheckCircleIcon className="w-4 h-4" />
                {submitting ? 'Processing Return...' : 'Yes, Confirm & Complete Return Voucher'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* VOUCHER PRINT MODAL */}
      <Modal
        isOpen={showVoucherModal}
        onClose={() => setShowVoucherModal(false)}
        title="Sales Return Credit Voucher Receipt"
      >
        {selectedVoucher && (
          <div className="space-y-4 text-xs font-semibold text-slate-800 dark:text-slate-200">
            <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-2">
                <span className="font-black text-slate-900 dark:text-white text-sm">Voucher #: {selectedVoucher.return_no}</span>
                <span className="text-emerald-600 font-black">₹{Number(selectedVoucher.refund_amount).toLocaleString('en-IN')}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-slate-600 dark:text-slate-400">
                <div>Original Invoice: <strong className="text-slate-900 dark:text-white">{selectedVoucher.invoice_no}</strong></div>
                <div>Customer: <strong className="text-slate-900 dark:text-white">{selectedVoucher.customer_name}</strong></div>
                <div>Product: <strong className="text-slate-900 dark:text-white">{selectedVoucher.product_name} (x{selectedVoucher.quantity})</strong></div>
                <div>Reason: <strong className="text-slate-900 dark:text-white">{selectedVoucher.reason}</strong></div>
                <div>Type: <strong className="text-slate-900 dark:text-white">{selectedVoucher.return_type}</strong></div>
                <div>Mode: <strong className="text-slate-900 dark:text-white">{selectedVoucher.refund_method}</strong></div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <PrinterIcon className="w-4 h-4" /> Print Voucher
              </button>
            </div>
          </div>
        )}
      </Modal>

    </div>
  );
};

export default SalesReturn;
