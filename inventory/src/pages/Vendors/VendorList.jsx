import { useState, useEffect, useMemo } from 'react';
import { 
  PlusIcon, 
  MagnifyingGlassIcon, 
  UserIcon, 
  CreditCardIcon, 
  ArrowPathIcon,
  PrinterIcon,
  TagIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  InboxIcon,
  ArrowLeftIcon,
  BuildingOfficeIcon,
  IdentificationIcon,
  ClipboardDocumentCheckIcon,
  ArrowRightOnRectangleIcon,
  DocumentTextIcon,
  BanknotesIcon,
  ScaleIcon,
  EyeIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ClockIcon,
  PencilSquareIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import Modal from '../../components/common/Modal';
import VendorForm from '../../components/forms/VendorForm';

import StatsCard from '../../components/common/StatsCard';
import { vendorsAPI, purchasesAPI, purchaseOrdersAPI, vendorReturnsAPI } from '../../services/api';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { showToast } from '../../store/slices/notificationSlice';

const fallbackVendors = [
  { 
    id: 1, 
    supplier_code: 'SUP-0001',
    name: 'Balaji Wholesale Traders', 
    company_name: 'Balaji Wholesale Traders Pvt Ltd',
    contact_person: 'Ramesh Patel',
    phone: '9876543211', 
    alternate_phone: '9811002233',
    email: 'sales@balajitraders.com', 
    gstin: '07AAAAA1111A1Z1', 
    pan: 'AAAAA1111A',
    address: '124, Ghee Mandi, New Delhi', 
    city: 'New Delhi',
    state: 'Delhi',
    pincode: '110002',
    categories_supplied: 'Groceries, Edible Oils',
    payment_terms: 'Net 30',
    credit_limit: 100000.00,
    opening_balance: 0.00,
    opening_balance_type: 'Payable',
    bank_name: 'HDFC Bank',
    account_number: '5010099881234',
    ifsc_code: 'HDFC0000124',
    total_purchases: 48500.00,
    total_paid: 36000.00,
    outstanding_balance: 12500.00,
    payment_status: 'Partial',
    status: 'Active',
    created_at: new Date(Date.now() - 30 * 24 * 3600000).toISOString()
  },
  { 
    id: 2, 
    supplier_code: 'SUP-0002',
    name: 'Shivam Dairy Supply', 
    company_name: 'Shivam Dairy Supply Co',
    contact_person: 'Aman Sharma',
    phone: '9826012345', 
    email: 'delivery@shivamdairy.com', 
    gstin: '07BBBBB2222B2Z2', 
    pan: 'BBBBB2222B',
    address: 'Plot 4, Dairy Colony, Outer Bypass', 
    city: 'Ahmedabad',
    state: 'Gujarat',
    pincode: '380001',
    categories_supplied: 'Dairy Products',
    payment_terms: 'Due on Receipt',
    credit_limit: 50000.00,
    opening_balance: 150.00,
    opening_balance_type: 'Payable',
    bank_name: 'ICICI Bank',
    account_number: '001205567890',
    ifsc_code: 'ICIC0000012',
    total_purchases: 18500.00,
    total_paid: 18650.00,
    outstanding_balance: 0.00,
    payment_status: 'Paid',
    status: 'Active',
    created_at: new Date(Date.now() - 60 * 24 * 3600000).toISOString()
  }
];

const VendorList = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  // Strict read-only for Viewer role, Super Admin role, or Super Admin Monitoring Mode
  const isReadOnly = user?.role === 'Viewer' || user?.role === 'Super Admin' || !!localStorage.getItem('monitoredTenant');

  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [dbOffline, setDbOffline] = useState(false);

  // Read-Only View Profile Modal State
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewVendorObj, setViewVendorObj] = useState(null);

  // Profile & Vendor Ledger Workspace States
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'profile'
  const [activeTab, setActiveTab] = useState('ledger'); // 'overview', 'orders', 'invoices', 'payments', 'ledger', 'history'
  const [profileData, setProfileData] = useState(null);
  const [ledgerData, setLedgerData] = useState(null);
  const [paymentsList, setPaymentsList] = useState([]);
  const [invoicesList, setInvoicesList] = useState([]);
  const [ordersList, setOrdersList] = useState([]);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileId, setProfileId] = useState(null);
  const [dateFromFilter, setDateFromFilter] = useState('');
  const [dateToFilter, setDateToFilter] = useState('');

  // Record Payment Dedicated State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);
  const [paymentVendor, setPaymentVendor] = useState(null);
  const [paymentInvoices, setPaymentInvoices] = useState([]);
  const [paymentForm, setPaymentForm] = useState({
    purchase_id: '',
    amount: '',
    payment_date: new Date().toISOString().split('T')[0],
    payment_mode: 'Cash',
    reference_no: '',
    bank_account: '',
    remarks: ''
  });

  // Payment Receipt Modal State
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  // Purchase Return Modal State
  const [showPurchaseReturnModal, setShowPurchaseReturnModal] = useState(false);
  const [returnVendorObj, setReturnVendorObj] = useState(null);
  const [vendorInvoices, setVendorInvoices] = useState([]);
  const [selectedPurchaseId, setSelectedPurchaseId] = useState('');
  const [selectedPurchaseObj, setSelectedPurchaseObj] = useState(null);
  const [returnItemsState, setReturnItemsState] = useState({});
  const [returnReason, setReturnReason] = useState('Damaged Goods');
  const [returnType, setReturnType] = useState('Refund');
  const [returnRemarks, setReturnRemarks] = useState('');
  const [returnSubmitting, setReturnSubmitting] = useState(false);
  const [vendorReturnsList, setVendorReturnsList] = useState([]);

  const fetchVendors = async () => {
    setLoading(true);
    try {
      const data = await vendorsAPI.getAll();
      if (data.success) {
        setVendors(data.vendors);
      }
      setDbOffline(false);
    } catch (err) {
      console.warn('Vendors API failed, loading fallback data.', err);
      setDbOffline(true);
      setVendors(fallbackVendors);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, []);

  // Compute Summary KPI totals
  const summaryMetrics = useMemo(() => {
    const totalVendorsCount = vendors.length;
    const totalPurchases = vendors.reduce((sum, v) => sum + Number(v.total_purchases || 0), 0);
    const totalReturns = vendors.reduce((sum, v) => sum + Number(v.total_returns || 0), 0);
    const totalNetPurchases = vendors.reduce((sum, v) => sum + Number(v.net_purchases ?? Math.max(0, Number(v.total_purchases || 0) - Number(v.total_returns || 0))), 0);
    const totalPaid = vendors.reduce((sum, v) => sum + Number(v.total_paid || 0), 0);
    const totalOutstanding = vendors.reduce((sum, v) => sum + Number(v.outstanding_balance || 0), 0);
    const totalAdvance = vendors.reduce((sum, v) => sum + Number(v.advance_balance || 0), 0);
    return {
      totalVendorsCount,
      totalPurchases,
      totalReturns,
      totalNetPurchases,
      totalPaid,
      totalOutstanding,
      totalAdvance
    };
  }, [vendors]);

  const filteredVendors = useMemo(() => {
    return vendors.filter((v) => {
      const matchesSearch = 
        v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (v.supplier_code && v.supplier_code.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (v.company_name && v.company_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (v.gstin && v.gstin.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (v.phone && v.phone.includes(searchTerm));

      const matchesStatus = !filterStatus || v.status === filterStatus;
      
      return matchesSearch && matchesStatus;
    });
  }, [vendors, searchTerm, filterStatus]);

  const handleAddVendor = () => {
    if (isReadOnly) return;
    setSelectedVendor(null);
    setShowModal(true);
  };

  const handleEditVendor = (vendor) => {
    if (isReadOnly) return;
    setSelectedVendor(vendor);
    setShowModal(true);
  };

  const handleViewSupplierDetail = (vendor) => {
    setViewVendorObj(vendor);
    setShowViewModal(true);
  };

  const handleToggleStatus = async (vendor) => {
    if (isReadOnly) return;
    const currentStatus = vendor.status || 'Active';
    const targetStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';

    if (currentStatus === 'Active') {
      const outstanding = Number(vendor.outstanding_balance || 0);

      let hasPendingOrders = false;
      try {
        const ordersRes = await purchaseOrdersAPI.getAll({ vendorId: vendor.id, status: 'Pending' });
        if (ordersRes && ordersRes.success && (ordersRes.orders || ordersRes.purchaseOrders)?.length > 0) {
          hasPendingOrders = true;
        }
      } catch (e) {}

      let confirmMsg = `Are you sure you want to change supplier "${vendor.name}" status to INACTIVE?`;
      if (outstanding > 0 && hasPendingOrders) {
        confirmMsg = `⚠️ ERP ALERT: Supplier "${vendor.name}" has an unpaid balance of ₹${outstanding.toLocaleString('en-IN', { minimumFractionDigits: 2 })} AND pending purchase orders. Mark as Inactive anyway?`;
      } else if (outstanding > 0) {
        confirmMsg = `⚠️ ERP ALERT: Supplier "${vendor.name}" has an unpaid balance of ₹${outstanding.toLocaleString('en-IN', { minimumFractionDigits: 2 })}. Mark as Inactive anyway?`;
      } else if (hasPendingOrders) {
        confirmMsg = `⚠️ ERP ALERT: Supplier "${vendor.name}" has pending purchase orders. Mark as Inactive anyway?`;
      }

      if (!window.confirm(confirmMsg)) {
        return;
      }
    }

    try {
      if (!dbOffline) {
        const res = await vendorsAPI.toggleStatus(vendor.id, targetStatus);
        if (res.success) {
          dispatch(showToast({ msg: res.message || `Supplier "${vendor.name}" status updated to ${targetStatus}`, type: 'success' }));
          fetchVendors();
        }
      } else {
        setVendors(vendors.map(v => v.id === vendor.id ? { ...v, status: targetStatus } : v));
        dispatch(showToast({ msg: `Supplier "${vendor.name}" status updated to ${targetStatus}`, type: 'success' }));
      }
    } catch (err) {
      console.error('Failed to toggle supplier status:', err);
      dispatch(showToast({ msg: err.response?.data?.message || 'Failed to update supplier status', type: 'error' }));
    }
  };

  const handleSubmit = async (formData) => {
    try {
      if (!dbOffline) {
        if (selectedVendor) {
          await vendorsAPI.update(selectedVendor.id, formData);
        } else {
          await vendorsAPI.create(formData);
        }
        fetchVendors();
      } else {
        if (selectedVendor) {
          setVendors(vendors.map(v => v.id === selectedVendor.id ? { ...v, ...formData } : v));
        } else {
          const newV = {
            ...formData,
            id: Math.max(...vendors.map(v => v.id), 0) + 1,
            supplier_code: `SUP-${String(Math.max(...vendors.map(v => v.id), 0) + 1).padStart(4, '0')}`,
            outstanding_balance: Number(formData.opening_balance || 0),
            created_at: new Date().toISOString()
          };
          setVendors([...vendors, newV]);
        }
      }
      dispatch(showToast({ msg: selectedVendor ? 'Supplier profile updated successfully!' : 'New Supplier Partner added successfully!', type: 'success' }));
      setShowModal(false);
      setSelectedVendor(null);
    } catch (err) {
      console.error('Error saving supplier:', err);
      dispatch(showToast({ msg: err.response?.data?.message || 'Error saving supplier profile', type: 'error' }));
      throw err;
    }
  };

  // Vendor Detail / Ledger Workspace Loader
  const handleOpenVendorWorkspace = async (vId, tab = 'ledger') => {
    setProfileId(vId);
    setActiveTab(tab);
    setProfileLoading(true);
    setViewMode('profile');

    const vObj = vendors.find(item => String(item.id) === String(vId)) || fallbackVendors[0];

    try {
      const results = await Promise.allSettled([
        vendorsAPI.getProfile(vId, { date_from: dateFromFilter, date_to: dateToFilter }),
        vendorsAPI.getLedger(vId, { date_from: dateFromFilter, date_to: dateToFilter }),
        vendorsAPI.getPayments(vId),
        vendorsAPI.getInvoices(vId),
        purchaseOrdersAPI.getAll({ vendorId: vId }),
        vendorReturnsAPI.getAll({ vendor_id: vId })
      ]);

      const [profileRes, ledgerRes, paymentsRes, invoicesRes, ordersRes, returnsRes] = results;

      if (profileRes.status === 'fulfilled' && profileRes.value?.success) {
        setProfileData(profileRes.value.profile);
      } else {
        setProfileData({
          vendor: vObj,
          totalOrders: 0,
          totalAmount: 0,
          lastPurchaseDate: null,
          mostPurchasedProducts: [],
          returnHistory: []
        });
      }

      if (ledgerRes.status === 'fulfilled' && ledgerRes.value?.success) {
        setLedgerData(ledgerRes.value);
      } else {
        setLedgerData({
          summary: {
            vendor_id: vObj.id,
            supplier_code: vObj.supplier_code || `SUP-${String(vObj.id).padStart(4, '0')}`,
            name: vObj.name,
            company_name: vObj.company_name,
            phone: vObj.phone,
            email: vObj.email,
            gstin: vObj.gstin,
            address: vObj.address,
            payment_terms: vObj.payment_terms || 'Net 30',
            credit_limit: vObj.credit_limit || 50000,
            opening_balance: vObj.opening_balance || 0,
            total_purchases: vObj.total_purchases || 0,
            total_returns: vObj.total_returns || 0,
            net_purchases: vObj.net_purchases || 0,
            total_paid: vObj.total_paid || 0,
            outstanding_balance: vObj.outstanding_balance || 0,
            payment_status: (vObj.outstanding_balance || 0) > 0 ? 'Partial' : 'Paid'
          },
          ledger: []
        });
      }

      if (paymentsRes.status === 'fulfilled' && paymentsRes.value?.success) {
        setPaymentsList(paymentsRes.value.payments || []);
      } else {
        setPaymentsList([]);
      }

      if (invoicesRes.status === 'fulfilled' && invoicesRes.value?.success) {
        setInvoicesList(invoicesRes.value.invoices || []);
      } else {
        setInvoicesList([]);
      }

      if (ordersRes.status === 'fulfilled' && ordersRes.value?.success) {
        setOrdersList(ordersRes.value.orders || ordersRes.value.purchaseOrders || []);
      } else {
        setOrdersList([]);
      }

      if (returnsRes.status === 'fulfilled' && returnsRes.value?.success) {
        setVendorReturnsList(returnsRes.value.returns || []);
      } else {
        setVendorReturnsList([]);
      }

    } catch (err) {
      console.warn('Backend API error loading vendor workspace.', err);
    } finally {
      setProfileLoading(false);
    }
  };

  useEffect(() => {
    if (viewMode === 'profile' && profileId) {
      handleOpenVendorWorkspace(profileId, activeTab);
    }
  }, [dateFromFilter, dateToFilter]);

  // Handle Record Payment Modal Trigger
  const handleOpenRecordPayment = async (targetVendorOrId, purchaseId = '') => {
    if (isReadOnly) return;

    let targetVendor = null;
    if (typeof targetVendorOrId === 'object' && targetVendorOrId !== null) {
      targetVendor = targetVendorOrId;
    } else if (targetVendorOrId) {
      targetVendor = vendors.find(v => String(v.id) === String(targetVendorOrId));
    }

    if (!targetVendor && profileId) {
      targetVendor = ledgerData?.summary || profileData?.vendor || vendors.find(v => String(v.id) === String(profileId));
    }

    if (!targetVendor && vendors.length > 0) {
      targetVendor = vendors[0];
    }

    setPaymentVendor(targetVendor);
    setPaymentInvoices([]);

    setPaymentForm({
      purchase_id: purchaseId,
      amount: String(targetVendor?.outstanding_balance || ''),
      payment_date: new Date().toISOString().split('T')[0],
      payment_mode: 'Cash',
      reference_no: '',
      bank_account: '',
      remarks: ''
    });

    if (targetVendor?.id) {
      try {
        const invRes = await vendorsAPI.getInvoices(targetVendor.id);
        if (invRes.success && invRes.invoices) {
          setPaymentInvoices(invRes.invoices);
          if (purchaseId) {
            const selectedInv = invRes.invoices.find(i => String(i.id) === String(purchaseId));
            if (selectedInv) {
              setPaymentForm(prev => ({ ...prev, amount: String(selectedInv.due_amount || selectedInv.total || 0) }));
            }
          }
        }
      } catch (err) {
        console.warn('Error fetching supplier invoices for payment modal:', err);
      }
    }

    setShowPaymentModal(true);
  };

  const handleFillFullBalance = () => {
    if (paymentForm.purchase_id && paymentInvoices.length > 0) {
      const inv = paymentInvoices.find(i => String(i.id) === String(paymentForm.purchase_id));
      if (inv) {
        setPaymentForm(prev => ({ ...prev, amount: String(inv.due_amount || 0) }));
        return;
      }
    }
    setPaymentForm(prev => ({ ...prev, amount: String(paymentVendor?.outstanding_balance || 0) }));
  };

  const handleSavePayment = async (e) => {
    e.preventDefault();
    const amountNum = Number(paymentForm.amount);
    if (!amountNum || amountNum <= 0) {
      dispatch(showToast({ msg: 'Please enter a valid payment amount greater than zero', type: 'error' }));
      return;
    }

    if (!paymentVendor?.id) {
      dispatch(showToast({ msg: 'Target supplier not selected', type: 'error' }));
      return;
    }

    setPaymentSubmitting(true);
    try {
      const res = await vendorsAPI.recordPayment(paymentVendor.id, paymentForm);
      if (res.success) {
        dispatch(showToast({ msg: res.message || 'Supplier payment recorded successfully!', type: 'success' }));
        setShowPaymentModal(false);
        if (viewMode === 'profile' && profileId) {
          handleOpenVendorWorkspace(profileId, 'ledger');
        }
        fetchVendors();
      }
    } catch (err) {
      console.error('Failed to record supplier payment:', err);
      dispatch(showToast({ msg: err.response?.data?.message || 'Failed to record supplier payment', type: 'error' }));
    } finally {
      setPaymentSubmitting(false);
    }
  };

  const handleViewReceipt = async (payment) => {
    try {
      const res = await vendorsAPI.getPaymentReceipt(payment.id);
      if (res.success) {
        setSelectedReceipt(res.receipt);
      } else {
        setSelectedReceipt(payment);
      }
    } catch {
      setSelectedReceipt(payment);
    }
    setShowReceiptModal(true);
  };

  const handleOpenPurchaseReturnModal = async (vendor = null) => {
    if (isReadOnly) return;
    const initialVendor = vendor || (vendors.length > 0 ? vendors[0] : null);
    setReturnVendorObj(initialVendor);
    setSelectedPurchaseId('');
    setSelectedPurchaseObj(null);
    setReturnItemsState({});
    setReturnReason('Damaged Goods');
    setReturnType('Refund');
    setReturnRemarks('');
    setShowPurchaseReturnModal(true);

    if (initialVendor) {
      loadVendorInvoicesForReturn(initialVendor.id);
    }
  };

  const loadVendorInvoicesForReturn = async (vId) => {
    try {
      const res = await purchasesAPI.getAll({ vendor_id: vId, vendorId: vId });
      if (res && res.success && res.purchases && res.purchases.length > 0) {
        setVendorInvoices(res.purchases);
        handlePurchaseInvoiceChange(res.purchases[0].id, res.purchases[0]);
      } else {
        setVendorInvoices([]);
        setSelectedPurchaseId('');
        setSelectedPurchaseObj(null);
        setReturnItemsState({});
      }
    } catch (err) {
      console.error('Failed to load vendor purchase invoices for return:', err);
    }
  };

  const handlePurchaseInvoiceChange = async (purchaseId, directObj = null) => {
    setSelectedPurchaseId(purchaseId);
    if (!purchaseId) {
      setSelectedPurchaseObj(null);
      setReturnItemsState({});
      return;
    }

    try {
      let purchObj = directObj;
      if (!purchObj) {
        const res = await purchasesAPI.getById(purchaseId);
        if (res && res.success) {
          purchObj = res.purchase;
        }
      }

      if (purchObj) {
        setSelectedPurchaseObj(purchObj);
        const initialState = {};
        if (purchObj.items) {
          purchObj.items.forEach(item => {
            const purchasedQty = Number(item.quantity);
            const returnedQty = Number(item.returnedQuantity || 0);
            const maxQty = Math.max(0, purchasedQty - returnedQty);

            initialState[item.product_id] = {
              checked: false,
              returnQty: 1,
              maxQty,
              unitPrice: Number(item.purchase_price || item.unit_price || 0),
              productName: item.product_name
            };
          });
        }
        setReturnItemsState(initialState);
      }
    } catch (err) {
      console.error('Failed to load purchase invoice details for return:', err);
    }
  };

  const handleReturnItemCheck = (productId, checked) => {
    setReturnItemsState(prev => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        checked
      }
    }));
  };

  const handleReturnQtyChange = (productId, qty) => {
    const maxQty = returnItemsState[productId]?.maxQty || 1;
    const parsedQty = Math.max(1, Math.min(maxQty, Number(qty) || 1));
    setReturnItemsState(prev => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        returnQty: parsedQty
      }
    }));
  };

  const calculatedTotalReturnVal = Object.keys(returnItemsState).reduce((sum, pId) => {
    const item = returnItemsState[pId];
    if (item.checked) {
      return sum + (item.unitPrice * item.returnQty);
    }
    return sum;
  }, 0);

  const handlePurchaseReturnSubmit = async (e) => {
    e.preventDefault();
    if (!returnVendorObj) return;

    const checkedProductIds = Object.keys(returnItemsState).filter(pId => returnItemsState[pId].checked);
    if (checkedProductIds.length === 0) {
      dispatch(showToast({ msg: 'Please select at least one item to return to supplier', type: 'error' }));
      return;
    }

    const itemsToReturn = checkedProductIds.map(pId => ({
      product_id: Number(pId),
      quantity: Number(returnItemsState[pId].returnQty),
      return_price: Number(returnItemsState[pId].unitPrice)
    }));

    setReturnSubmitting(true);
    try {
      const payload = {
        vendor_id: returnVendorObj.id,
        purchase_id: selectedPurchaseId ? Number(selectedPurchaseId) : null,
        reason: returnReason,
        return_type: returnType,
        remarks: returnRemarks,
        items: itemsToReturn
      };

      const res = await vendorReturnsAPI.create(payload);
      if (res && res.success) {
        dispatch(showToast({ msg: `Purchase Return Note ${res.vrn || ''} posted successfully!`, type: 'success' }));
        setShowPurchaseReturnModal(false);

        if (viewMode === 'profile' && profileId) {
          handleOpenVendorWorkspace(profileId, activeTab);
        }
        fetchVendors();
      }
    } catch (err) {
      console.error('Failed to create purchase return:', err);
      dispatch(showToast({ msg: err.response?.data?.message || 'Failed to post purchase return', type: 'error' }));
    } finally {
      setReturnSubmitting(false);
    }
  };

  const currentVendorObj = ledgerData?.summary || profileData?.vendor || vendors.find(v => String(v.id) === String(profileId));

  return (
    <div className="space-y-6 pb-12 select-none font-sans bg-slate-50 dark:bg-slate-950 p-4 rounded-3xl print:bg-white print:p-0">
      
      {viewMode === 'list' ? (
        <>
          {/* HEADER LIST VIEW */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm">
            <div>
              <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                <span className="p-1.5 bg-[#1B6E4C] rounded-lg text-white">🚚</span>
                Supplier Master & Vendor Management Panel
              </h1>
              <p className="text-xs font-semibold text-slate-500 mt-0.5">
                Manage distributor accounts, view profile details, edit supplier info, track orders, invoices, payables, and record manual payments.
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleOpenPurchaseReturnModal()}
                className="flex items-center gap-2 px-4 py-2.5 bg-amber-600 dark:bg-amber-600 hover:bg-amber-700 dark:hover:bg-amber-500 text-white font-bold rounded-xl shadow-md transition-all active:scale-95 text-xs cursor-pointer"
              >
                <ArrowPathIcon className="w-4 h-4 stroke-[2.5]" />
                Purchase Returns
              </button>
              {!isReadOnly && (
                <button
                  onClick={handleAddVendor}
                  className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 dark:bg-emerald-600 hover:bg-emerald-700 dark:hover:bg-emerald-500 text-white font-bold rounded-xl shadow-md transition-all active:scale-95 text-xs cursor-pointer"
                >
                  <PlusIcon className="w-4 h-4 stroke-[2.5]" />
                  Add Supplier Partner
                </button>
              )}
            </div>
          </div>

          {/* SUMMARY KPIS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard
              title="Total Active Suppliers"
              value={summaryMetrics.totalVendorsCount}
              icon={BuildingOfficeIcon}
              color="indigo"
            />
            <StatsCard
              title="Net Purchase Volume"
              value={`₹${summaryMetrics.totalNetPurchases.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
              icon={DocumentTextIcon}
              color="blue"
            />
            <StatsCard
              title="Total Amount Paid"
              value={`₹${summaryMetrics.totalPaid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
              icon={BanknotesIcon}
              color="emerald"
            />
            <StatsCard
              title="Total Supplier Payables"
              value={`₹${summaryMetrics.totalOutstanding.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
              icon={ScaleIcon}
              color="rose"
            />
          </div>

          {dbOffline && (
            <div className="bg-amber-50 border border-amber-300 rounded-xl p-3 text-amber-850 text-xs font-semibold">
              ⚠️ Running in Offline Simulation Mode. Changes will write to local memory.
            </div>
          )}

          {/* TABLE CONTAINER CARD */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
            
            {/* Filter controls */}
            <div className="mb-6 flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search suppliers by code, name, phone, company, GSTIN..."
                  className="w-full pl-10 pr-4 py-2 text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-950 focus:outline-none focus:border-emerald-600 font-bold text-slate-800 dark:text-slate-250"
                />
              </div>

              <div>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-2 text-xs border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-emerald-600 bg-slate-50/50 dark:bg-slate-950 font-bold text-slate-800 dark:text-slate-250 cursor-pointer"
                >
                  <option value="">All Statuses</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div className="py-16 flex justify-center items-center">
                <span className="text-sm font-semibold text-slate-500 animate-pulse uppercase tracking-wider">Loading Supplier Master...</span>
              </div>
            ) : filteredVendors.length === 0 ? (
              <div className="py-16 flex flex-col justify-center items-center text-center">
                <InboxIcon className="w-12 h-12 text-slate-300 stroke-[1.2] mb-2" />
                <p className="text-sm font-black text-slate-450 uppercase tracking-wider">No suppliers found</p>
                <p className="text-[10px] text-slate-400 font-semibold mt-1">Add a new supplier to start tracking purchases and payments.</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
                <table className="w-full text-left border-collapse min-w-[1200px]">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-950 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider leading-none">
                      <th className="py-4 px-3.5 whitespace-nowrap min-w-[110px]">Supplier Code</th>
                      <th className="py-4 px-3.5 whitespace-nowrap min-w-[160px]">Supplier Name</th>
                      <th className="py-4 px-3.5 whitespace-nowrap min-w-[150px]">Company Name</th>
                      <th className="py-4 px-3.5 whitespace-nowrap min-w-[110px]">Mobile</th>
                      <th className="py-4 px-3.5 text-right whitespace-nowrap min-w-[130px]">Total Purchases</th>
                      <th className="py-4 px-3.5 text-right whitespace-nowrap min-w-[130px]">Purchase Return</th>
                      <th className="py-4 px-3.5 text-right whitespace-nowrap min-w-[130px]">Net Purchases</th>
                      <th className="py-4 px-3.5 text-right whitespace-nowrap min-w-[130px]">Total Paid</th>
                      <th className="py-4 px-4 text-right whitespace-nowrap min-w-[190px]">Outstanding Balance</th>
                      <th className="py-4 px-3.5 text-center whitespace-nowrap min-w-[100px]">Status</th>
                      <th className="py-4 px-3.5 text-center whitespace-nowrap min-w-[130px]">Payment Status</th>
                      <th className="py-4 px-3.5 text-center whitespace-nowrap min-w-[320px]">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {filteredVendors.map((vendor) => {
                      const gross = Number(vendor.total_purchases || 0);
                      const returns = Number(vendor.total_returns || 0);
                      const net = Number(vendor.net_purchases ?? Math.max(0, gross - returns));
                      const paid = Number(vendor.total_paid || 0);
                      const outstanding = Number(vendor.outstanding_balance || 0);
                      const advance = Number(vendor.advance_balance || 0);
                      const pStatus = vendor.payment_status || (outstanding > 0 ? (paid > 0 ? 'Partial' : 'Pending') : advance > 0 ? 'Advance' : 'Paid');
                      const mStatus = vendor.status || 'Active';

                      return (
                        <tr key={vendor.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-950/40 transition-colors">
                          <td className="py-3.5 px-3.5 font-mono font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                            {vendor.supplier_code || `SUP-${String(vendor.id).padStart(4, '0')}`}
                          </td>
                          <td 
                            onClick={() => handleOpenVendorWorkspace(vendor.id, 'ledger')}
                            className="py-3.5 px-3.5 font-black text-[#1B6E4C] dark:text-emerald-400 hover:underline cursor-pointer whitespace-nowrap"
                          >
                            {vendor.name}
                          </td>
                          <td className="py-3.5 px-3.5 text-slate-700 dark:text-slate-300 font-bold whitespace-nowrap">{vendor.company_name || 'N/A'}</td>
                          <td className="py-3.5 px-3.5 text-slate-600 dark:text-slate-400 tabular-nums whitespace-nowrap">{vendor.phone}</td>
                          <td className="py-3.5 px-3.5 text-right font-bold text-slate-800 dark:text-slate-200 tabular-nums whitespace-nowrap">
                            ₹{gross.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-3.5 px-3.5 text-right font-bold text-amber-600 dark:text-amber-400 tabular-nums whitespace-nowrap">
                            ₹{returns.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-3.5 px-3.5 text-right font-black text-indigo-600 dark:text-indigo-400 tabular-nums whitespace-nowrap">
                            ₹{net.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-3.5 px-3.5 text-right font-bold text-emerald-600 dark:text-emerald-400 tabular-nums whitespace-nowrap">
                            ₹{paid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-3.5 px-4 text-right font-black tabular-nums whitespace-nowrap min-w-[190px]">
                            {outstanding > 0 ? (
                              <span className="inline-block text-rose-600 bg-rose-50 dark:bg-rose-950/40 px-3 py-1 rounded-lg border border-rose-200 dark:border-rose-900/40 font-black">
                                ₹{outstanding.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                              </span>
                            ) : advance > 0 ? (
                              <span className="inline-block text-blue-600 bg-blue-50 dark:bg-blue-950/40 px-3 py-1 rounded-lg border border-blue-200 dark:border-blue-900/40 font-black">
                                Adv: ₹{advance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                              </span>
                            ) : (
                              <span className="text-emerald-600 dark:text-emerald-400 font-bold">₹0.00</span>
                            )}
                          </td>
                          <td className="py-3.5 px-3.5 text-center whitespace-nowrap">
                            <span className={`px-2.5 py-1 rounded-full text-[9px] font-extrabold uppercase tracking-wider border ${
                              mStatus === 'Active'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-250 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800'
                                : 'bg-slate-100 text-slate-600 border-slate-300 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                            }`}>
                              {mStatus}
                            </span>
                          </td>
                          <td className="py-3.5 px-3.5 text-center whitespace-nowrap">
                            <span className={`px-2.5 py-1 rounded-full text-[9px] font-extrabold uppercase tracking-wider border ${
                              pStatus === 'Paid'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-250 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800'
                                : pStatus === 'Partial'
                                ? 'bg-amber-50 text-amber-700 border-amber-250 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800'
                                : pStatus === 'Advance'
                                ? 'bg-blue-50 text-blue-700 border-blue-250 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800'
                                : 'bg-rose-50 text-rose-700 border-rose-250 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800'
                            }`}>
                              {pStatus}
                            </span>
                          </td>
                          <td className="py-3.5 px-3.5 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => handleOpenVendorWorkspace(vendor.id, 'ledger')}
                                title="Open Supplier Ledger"
                                className="px-3.5 py-1.5 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 font-bold rounded-xl text-xs hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-all cursor-pointer shadow-xs"
                              >
                                Ledger
                              </button>
                              {!isReadOnly && (
                                <>
                                  <button
                                    onClick={() => handleOpenRecordPayment(vendor)}
                                    title="Record Manual Supplier Payment"
                                    className="px-3.5 py-1.5 bg-emerald-600 dark:bg-emerald-600 hover:bg-emerald-700 dark:hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-all cursor-pointer shadow-xs"
                                  >
                                    Record Pay
                                  </button>
                                  <button
                                    onClick={() => handleOpenPurchaseReturnModal(vendor)}
                                    title="Process Purchase Return to Supplier"
                                    className="px-3.5 py-1.5 bg-amber-600 dark:bg-amber-600 hover:bg-amber-700 dark:hover:bg-amber-500 text-white font-bold rounded-xl text-xs transition-all cursor-pointer shadow-xs"
                                  >
                                    Return
                                  </button>
                                  <button
                                    onClick={() => handleEditVendor(vendor)}
                                    title="Edit Supplier Profile"
                                    className="px-3.5 py-1.5 bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 font-bold rounded-xl text-xs hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-all cursor-pointer shadow-xs"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleToggleStatus(vendor)}
                                    title={mStatus === 'Active' ? 'Deactivate Supplier' : 'Activate Supplier'}
                                    className={`px-3 py-1.5 font-bold rounded-xl text-xs transition-all cursor-pointer shadow-xs border ${
                                      mStatus === 'Active'
                                        ? 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100 dark:bg-rose-950/50 dark:border-rose-800 dark:text-rose-300'
                                        : 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:border-emerald-800 dark:text-emerald-300'
                                    }`}
                                  >
                                    {mStatus === 'Active' ? 'Deactivate' : 'Activate'}
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : (
        /* ══════════════════════════════════════════════════════════
           SUPPLIER MASTER & VENDOR LEDGER WORKSPACE VIEW
        ══════════════════════════════════════════════════════════ */
        <div className="space-y-6">
          {/* Top Bar Navigation & Actions */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setViewMode('list')}
                className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl transition-all cursor-pointer"
              >
                <ArrowLeftIcon className="w-5 h-5" />
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                    {currentVendorObj?.name}
                  </h1>
                  <span className="font-mono text-xs font-black bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                    {currentVendorObj?.supplier_code || `SUP-${String(currentVendorObj?.id || profileId).padStart(4, '0')}`}
                  </span>
                </div>
                <p className="text-xs font-bold text-slate-500 mt-0.5">
                  {currentVendorObj?.company_name || 'Independent Supplier'} • Mobile: {currentVendorObj?.phone || 'N/A'} • GSTIN: {currentVendorObj?.gstin || 'Unregistered'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {!isReadOnly && (
                <>
                  <button
                    onClick={() => handleEditVendor(currentVendorObj)}
                    className="flex items-center gap-1.5 px-3 py-2.5 bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    Edit Supplier
                  </button>
                  <button
                    onClick={() => handleOpenRecordPayment(currentVendorObj)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 dark:bg-emerald-600 hover:bg-emerald-700 dark:hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-all shadow-md active:scale-95 cursor-pointer"
                  >
                    <BanknotesIcon className="w-4 h-4" />
                    Record Payment
                  </button>
                </>
              )}
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-3 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all border border-slate-200 dark:border-slate-700 cursor-pointer"
              >
                <PrinterIcon className="w-4 h-4" />
                Print Statement
              </button>
            </div>
          </div>

          {/* Supplier Financial Header Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Gross Purchases</span>
              <p className="text-lg font-black text-slate-900 dark:text-white mt-1 tabular-nums">
                ₹{Number(ledgerData?.summary?.total_purchases || currentVendorObj?.total_purchases || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm">
              <span className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-wider">Purchase Returns</span>
              <p className="text-lg font-black text-amber-600 dark:text-amber-400 mt-1 tabular-nums">
                ₹{Number(ledgerData?.summary?.total_returns || currentVendorObj?.total_returns || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm">
              <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Net Purchases</span>
              <p className="text-lg font-black text-indigo-600 dark:text-indigo-400 mt-1 tabular-nums">
                ₹{Number(ledgerData?.summary?.net_purchases || (Number(ledgerData?.summary?.total_purchases || 0) - Number(ledgerData?.summary?.total_returns || 0))).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm">
              <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Total Amount Paid</span>
              <p className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-1 tabular-nums">
                ₹{Number(ledgerData?.summary?.total_paid || currentVendorObj?.total_paid || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Outstanding / Advance</span>
              <p className={`text-lg font-black mt-1 tabular-nums ${
                (ledgerData?.summary?.advance_balance || currentVendorObj?.advance_balance || 0) > 0 
                  ? 'text-blue-600 dark:text-blue-400' 
                  : (ledgerData?.summary?.outstanding_balance || currentVendorObj?.outstanding_balance || 0) > 0 
                  ? 'text-rose-600 dark:text-rose-400' 
                  : 'text-emerald-600 dark:text-emerald-400'
              }`}>
                {(ledgerData?.summary?.advance_balance || currentVendorObj?.advance_balance || 0) > 0 
                  ? `Adv: ₹${Number(ledgerData?.summary?.advance_balance || currentVendorObj?.advance_balance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` 
                  : `₹${Number(ledgerData?.summary?.outstanding_balance || currentVendorObj?.outstanding_balance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
            <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 overflow-x-auto">
              {[
                { id: 'overview', label: 'Overview & Profile' },
                { id: 'orders', label: `Purchase Orders (${ordersList.length})` },
                { id: 'invoices', label: `Purchase Invoices (${invoicesList.length})` },
                { id: 'payments', label: `Payments (${paymentsList.length})` },
                { id: 'returns', label: `Purchase Returns (${vendorReturnsList.length})` },
                { id: 'ledger', label: 'Outstanding Ledger' },
                { id: 'history', label: 'Activity History' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-5 py-3.5 text-xs font-black uppercase tracking-wider border-b-2 whitespace-nowrap transition-all cursor-pointer ${
                    activeTab === tab.id
                      ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400 bg-white dark:bg-slate-900'
                      : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="p-6">
              {profileLoading ? (
                <div className="py-16 flex justify-center items-center">
                  <span className="text-sm font-semibold text-slate-500 animate-pulse uppercase tracking-wider">Loading Supplier Details...</span>
                </div>
              ) : (
                <>
                  {/* TAB 1: OVERVIEW */}
                  {activeTab === 'overview' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-slate-50 dark:bg-slate-950 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                        <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider border-b border-slate-200 dark:border-slate-800 pb-2">
                          Business & Contact Information
                        </h3>
                        <div className="space-y-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                          <p><span className="text-slate-400">Supplier Name:</span> {currentVendorObj?.name}</p>
                          <p><span className="text-slate-400">Company Name:</span> {currentVendorObj?.company_name || 'N/A'}</p>
                          <p><span className="text-slate-400">Contact Person:</span> {currentVendorObj?.contact_person || 'N/A'}</p>
                          <p><span className="text-slate-400">Phone:</span> {currentVendorObj?.phone}</p>
                          <p><span className="text-slate-400">Alternate Phone:</span> {currentVendorObj?.alternate_phone || 'N/A'}</p>
                          <p><span className="text-slate-400">Email:</span> {currentVendorObj?.email || 'N/A'}</p>
                          <p><span className="text-slate-400">GSTIN:</span> {currentVendorObj?.gstin || 'N/A'}</p>
                          <p><span className="text-slate-400">PAN:</span> {currentVendorObj?.pan || 'N/A'}</p>
                          <p><span className="text-slate-400">Address:</span> {currentVendorObj?.address}, {currentVendorObj?.city}, {currentVendorObj?.state} - {currentVendorObj?.pincode}</p>
                        </div>
                      </div>

                      <div className="bg-slate-50 dark:bg-slate-950 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                        <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider border-b border-slate-200 dark:border-slate-800 pb-2">
                          Banking & Credit Parameters
                        </h3>
                        <div className="space-y-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                          <p><span className="text-slate-400">Bank Name:</span> {currentVendorObj?.bank_name || 'N/A'}</p>
                          <p><span className="text-slate-400">Account Number:</span> {currentVendorObj?.account_number || 'N/A'}</p>
                          <p><span className="text-slate-400">IFSC Code:</span> {currentVendorObj?.ifsc_code || 'N/A'}</p>
                          <p><span className="text-slate-400">Payment Terms:</span> {currentVendorObj?.payment_terms || 'Net 30'}</p>
                          <p><span className="text-slate-400">Credit Limit:</span> ₹{Number(currentVendorObj?.credit_limit || 0).toLocaleString('en-IN')}</p>
                          <p><span className="text-slate-400">Opening Balance:</span> ₹{Number(currentVendorObj?.opening_balance || 0).toLocaleString('en-IN')} ({currentVendorObj?.opening_balance_type || 'Payable'})</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 2: PURCHASE ORDERS */}
                  {activeTab === 'orders' && (
                    <div className="space-y-4">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-950 text-[10px] font-black text-slate-500 uppercase tracking-wider">
                              <th className="py-3 px-4">PO Number</th>
                              <th className="py-3 px-4">PO Date</th>
                              <th className="py-3 px-4 text-right">Total Amount</th>
                              <th className="py-3 px-4 text-center">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-semibold">
                            {ordersList.length > 0 ? (
                              ordersList.map(po => (
                                <tr key={po.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/20">
                                  <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">{po.po_number || po.purchase_no}</td>
                                  <td className="py-3 px-4 text-slate-600 dark:text-slate-400 font-mono">{new Date(po.date || po.created_at).toLocaleDateString('en-IN')}</td>
                                  <td className="py-3 px-4 text-right font-bold text-slate-900 dark:text-white tabular-nums">
                                    ₹{Number(po.total || po.total_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                  </td>
                                  <td className="py-3 px-4 text-center">
                                    <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400">
                                      {po.status || 'Ordered'}
                                    </span>
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan="4" className="py-10 text-center text-slate-400 font-bold">
                                  No purchase orders found for this supplier.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* TAB 3: PURCHASE INVOICES */}
                  {activeTab === 'invoices' && (
                    <div className="space-y-4">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-950 text-[10px] font-black text-slate-500 uppercase tracking-wider">
                              <th className="py-3 px-4">Invoice No</th>
                              <th className="py-3 px-4">Invoice Date</th>
                              <th className="py-3 px-4 text-right">Invoice Total</th>
                              <th className="py-3 px-4 text-right">Paid Amount</th>
                              <th className="py-3 px-4 text-right">Due Balance</th>
                              <th className="py-3 px-4 text-center">Status</th>
                              <th className="py-3 px-4 text-right">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-semibold">
                            {invoicesList.map(inv => {
                              const due = Number(inv.due_amount ?? (inv.total - (inv.paid_amount || 0)));
                              return (
                                <tr key={inv.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/20">
                                  <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">{inv.purchase_no}</td>
                                  <td className="py-3 px-4 text-slate-600 dark:text-slate-400 font-mono">{new Date(inv.date).toLocaleDateString('en-IN')}</td>
                                  <td className="py-3 px-4 text-right font-bold text-slate-900 dark:text-white tabular-nums">
                                    ₹{Number(inv.total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                  </td>
                                  <td className="py-3 px-4 text-right font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                                    ₹{Number(inv.paid_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                  </td>
                                  <td className="py-3 px-4 text-right font-black tabular-nums">
                                    <span className={due > 0 ? 'text-rose-600' : 'text-emerald-600'}>
                                      ₹{due.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                    </span>
                                  </td>
                                  <td className="py-3 px-4 text-center">
                                    <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                                      inv.payment_status === 'Paid'
                                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                                        : inv.payment_status === 'Partial'
                                        ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
                                        : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400'
                                    }`}>
                                      {inv.payment_status}
                                    </span>
                                  </td>
                                  <td className="py-3 px-4 text-right">
                                    {due > 0 && !isReadOnly && (
                                      <button
                                        onClick={() => handleOpenRecordPayment(currentVendorObj, inv.id)}
                                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold cursor-pointer transition-all"
                                      >
                                        Pay Invoice
                                      </button>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* TAB 4: PAYMENTS HISTORY */}
                  {activeTab === 'payments' && (
                    <div className="space-y-4">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-950 text-[10px] font-black text-slate-500 uppercase tracking-wider">
                              <th className="py-3 px-4">Payment No</th>
                              <th className="py-3 px-4">Payment Date</th>
                              <th className="py-3 px-4">Mode</th>
                              <th className="py-3 px-4">Ref No / UTR</th>
                              <th className="py-3 px-4">Bank Account</th>
                              <th className="py-3 px-4 text-right">Amount Paid</th>
                              <th className="py-3 px-4 text-right">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-semibold">
                            {paymentsList.map(pay => (
                              <tr key={pay.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/20">
                                <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">{pay.payment_no}</td>
                                <td className="py-3 px-4 text-slate-600 dark:text-slate-400 font-mono">{new Date(pay.payment_date).toLocaleDateString('en-IN')}</td>
                                <td className="py-3 px-4 font-bold text-indigo-600 dark:text-indigo-400">{pay.payment_mode}</td>
                                <td className="py-3 px-4 text-slate-700 dark:text-slate-300 font-mono">{pay.reference_no || 'N/A'}</td>
                                <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{pay.bank_account || 'N/A'}</td>
                                <td className="py-3 px-4 text-right font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
                                  ₹{Number(pay.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </td>
                                <td className="py-3 px-4 text-right">
                                  <button
                                    onClick={() => handleViewReceipt(pay)}
                                    className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-lg text-[10px] font-bold cursor-pointer transition-all border border-slate-200 dark:border-slate-700"
                                  >
                                    View Receipt
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* TAB 5: PURCHASE RETURNS HISTORY */}
                  {activeTab === 'returns' && (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center pb-2">
                        <h3 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                          Supplier Purchase Returns History ({vendorReturnsList.length})
                        </h3>
                        {!isReadOnly && (
                          <button
                            onClick={() => handleOpenPurchaseReturnModal(currentVendorObj)}
                            className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs shadow-xs cursor-pointer"
                          >
                            + New Purchase Return Note
                          </button>
                        )}
                      </div>

                      <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                        <table className="w-full text-left text-xs font-semibold">
                          <thead>
                            <tr className="bg-slate-50 dark:bg-slate-950 text-slate-500 border-b border-slate-200 dark:border-slate-800">
                              <th className="p-3.5">VRN No</th>
                              <th className="p-3.5">Purchase Invoice</th>
                              <th className="p-3.5">Date</th>
                              <th className="p-3.5">Product Name</th>
                              <th className="p-3.5 text-center">Returned Qty</th>
                              <th className="p-3.5">Reason</th>
                              <th className="p-3.5 text-right">Return Amount</th>
                              <th className="p-3.5 text-center">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                            {vendorReturnsList.length === 0 ? (
                              <tr>
                                <td colSpan="8" className="p-8 text-center text-xs font-bold text-slate-400">
                                  No purchase returns recorded for this supplier.
                                </td>
                              </tr>
                            ) : (
                              vendorReturnsList.map((ret) => (
                                <tr key={ret.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/20">
                                  <td className="p-3.5 font-mono font-bold text-amber-600 dark:text-amber-400">{ret.return_no || `VRN-${ret.id}`}</td>
                                  <td className="p-3.5 font-bold text-slate-900 dark:text-white">{ret.purchase_no || 'N/A'}</td>
                                  <td className="p-3.5 text-slate-600 dark:text-slate-400">{new Date(ret.created_at).toLocaleDateString('en-IN')}</td>
                                  <td className="p-3.5 font-bold text-slate-900 dark:text-white">{ret.product_name || 'Product'}</td>
                                  <td className="p-3.5 text-center font-black text-slate-800 dark:text-slate-200">{ret.quantity}</td>
                                  <td className="p-3.5 text-slate-600 dark:text-slate-400">{ret.reason}</td>
                                  <td className="p-3.5 text-right font-black text-amber-600 dark:text-amber-400">
                                    ₹{Number(ret.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                  </td>
                                  <td className="p-3.5 text-center">
                                    <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                                      {ret.status || 'Approved'}
                                    </span>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* TAB 6: OUTSTANDING LEDGER STATEMENT */}
                  {activeTab === 'ledger' && (
                    <div className="space-y-4">
                      {/* Date Filter Bar */}
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Statement Date Filter:</span>
                          <input
                            type="date"
                            value={dateFromFilter}
                            onChange={(e) => setDateFromFilter(e.target.value)}
                            className="px-3 py-1.5 text-xs border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 font-bold text-slate-800 dark:text-white"
                          />
                          <span className="text-xs font-bold text-slate-400">to</span>
                          <input
                            type="date"
                            value={dateToFilter}
                            onChange={(e) => setDateToFilter(e.target.value)}
                            className="px-3 py-1.5 text-xs border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 font-bold text-slate-800 dark:text-white"
                          />
                        </div>
                        {(dateFromFilter || dateToFilter) && (
                          <button
                            onClick={() => { setDateFromFilter(''); setDateToFilter(''); }}
                            className="text-xs font-bold text-rose-600 hover:underline cursor-pointer"
                          >
                            Reset Dates
                          </button>
                        )}
                      </div>

                      {/* Ledger Table */}
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-950 text-[10px] font-black text-slate-500 uppercase tracking-wider">
                              <th className="py-3 px-4">Date</th>
                              <th className="py-3 px-4">Voucher Type</th>
                              <th className="py-3 px-4">Voucher No</th>
                              <th className="py-3 px-4">Particulars / Description</th>
                              <th className="py-3 px-4 text-right">Debit (Invoice ₹)</th>
                              <th className="py-3 px-4 text-right">Credit (Paid ₹)</th>
                              <th className="py-3 px-4 text-right">Running Balance (₹)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-semibold">
                            {ledgerData?.ledger && ledgerData.ledger.length > 0 ? (
                              ledgerData.ledger.map((row, idx) => (
                                <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/20 transition-colors">
                                  <td className="py-3 px-4 text-slate-600 dark:text-slate-400 font-mono">
                                    {new Date(row.date).toLocaleDateString('en-IN')}
                                  </td>
                                  <td className="py-3 px-4">
                                    <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                                      row.transaction_type === 'PURCHASE_INVOICE'
                                        ? 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-400'
                                        : row.transaction_type === 'SUPPLIER_PAYMENT'
                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400'
                                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                                    }`}>
                                      {row.transaction_type.replace('_', ' ')}
                                    </span>
                                  </td>
                                  <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                                    {row.reference_no}
                                  </td>
                                  <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                                    {row.description}
                                  </td>
                                  <td className="py-3 px-4 text-right font-bold text-slate-900 dark:text-white tabular-nums">
                                    {Number(row.debit_amount || 0) > 0 ? `₹${Number(row.debit_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '-'}
                                  </td>
                                  <td className="py-3 px-4 text-right font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                                    {Number(row.credit_amount || 0) > 0 ? `₹${Number(row.credit_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '-'}
                                  </td>
                                  <td className="py-3 px-4 text-right font-black text-slate-900 dark:text-white tabular-nums">
                                    ₹{Number(row.running_balance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan="7" className="py-12 text-center text-slate-400 font-bold">
                                  No ledger entries recorded for this supplier.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* TAB 6: ACTIVITY HISTORY */}
                  {activeTab === 'history' && (
                    <div className="space-y-4">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-950 text-[10px] font-black text-slate-500 uppercase tracking-wider">
                              <th className="py-3 px-4">Date</th>
                              <th className="py-3 px-4">Action</th>
                              <th className="py-3 px-4">Module</th>
                              <th className="py-3 px-4">Details</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-semibold">
                            {ledgerData?.ledger && ledgerData.ledger.length > 0 ? (
                              ledgerData.ledger.map((l, i) => (
                                <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/20">
                                  <td className="py-3 px-4 text-slate-500 font-mono">{new Date(l.date).toLocaleString('en-IN')}</td>
                                  <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{l.transaction_type}</td>
                                  <td className="py-3 px-4 text-slate-600 dark:text-slate-400">Vendors / Purchases</td>
                                  <td className="py-3 px-4 text-slate-700 dark:text-slate-300">{l.description}</td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan="4" className="py-10 text-center text-slate-400 font-bold">
                                  No audit history logged for this supplier.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* READ-ONLY SUPPLIER PROFILE VIEW MODAL */}
      {showViewModal && viewVendorObj && (
        <Modal
          isOpen={true}
          title={`Supplier Profile - ${viewVendorObj.name}`}
          onClose={() => { setShowViewModal(false); setViewVendorObj(null); }}
        >
          <div className="p-6 space-y-6 select-none max-h-[80vh] overflow-y-auto font-sans">
            <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
              <div>
                <h2 className="text-lg font-black text-slate-900 dark:text-white">{viewVendorObj.name}</h2>
                <p className="text-xs font-bold text-slate-500">{viewVendorObj.company_name || 'Individual Supplier'}</p>
              </div>
              <span className="font-mono text-xs font-black bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 px-3 py-1 rounded-xl border border-emerald-200 dark:border-emerald-800">
                {viewVendorObj.supplier_code || `SUP-${String(viewVendorObj.id).padStart(4, '0')}`}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-bold text-slate-700 dark:text-slate-300">
              <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800 pb-1">Contact & Legal Details</h4>
                <p><span className="text-slate-400">Mobile:</span> {viewVendorObj.phone}</p>
                <p><span className="text-slate-400">Alt Mobile:</span> {viewVendorObj.alternate_phone || 'N/A'}</p>
                <p><span className="text-slate-400">Email:</span> {viewVendorObj.email || 'N/A'}</p>
                <p><span className="text-slate-400">GSTIN:</span> {viewVendorObj.gstin || 'N/A'}</p>
                <p><span className="text-slate-400">PAN:</span> {viewVendorObj.pan || 'N/A'}</p>
                <p><span className="text-slate-400">Address:</span> {viewVendorObj.address}, {viewVendorObj.city}, {viewVendorObj.state} - {viewVendorObj.pincode}</p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800 pb-1">Terms & Banking Details</h4>
                <p><span className="text-slate-400">Payment Terms:</span> {viewVendorObj.payment_terms || 'Net 30'}</p>
                <p><span className="text-slate-400">Credit Limit:</span> ₹{Number(viewVendorObj.credit_limit || 0).toLocaleString('en-IN')}</p>
                <p><span className="text-slate-400">Opening Balance:</span> ₹{Number(viewVendorObj.opening_balance || 0).toLocaleString('en-IN')} ({viewVendorObj.opening_balance_type || 'Payable'})</p>
                <p><span className="text-slate-400">Bank Name:</span> {viewVendorObj.bank_name || 'N/A'}</p>
                <p><span className="text-slate-400">Account No:</span> {viewVendorObj.account_number || 'N/A'}</p>
                <p><span className="text-slate-400">IFSC Code:</span> {viewVendorObj.ifsc_code || 'N/A'}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
              <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] font-black text-slate-500 uppercase">Gross Purchases</span>
                <p className="text-sm font-black text-slate-900 dark:text-white mt-1">₹{Number(viewVendorObj.total_purchases || 0).toLocaleString('en-IN')}</p>
              </div>
              <div className="bg-amber-50 dark:bg-amber-950/30 p-3 rounded-xl border border-amber-200 dark:border-amber-800">
                <span className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase">Purchase Return</span>
                <p className="text-sm font-black text-amber-900 dark:text-amber-200 mt-1">₹{Number(viewVendorObj.total_returns || 0).toLocaleString('en-IN')}</p>
              </div>
              <div className="bg-indigo-50 dark:bg-indigo-950/30 p-3 rounded-xl border border-indigo-200 dark:border-indigo-800">
                <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase">Net Purchases</span>
                <p className="text-sm font-black text-indigo-900 dark:text-indigo-200 mt-1">₹{Number(viewVendorObj.net_purchases ?? (Number(viewVendorObj.total_purchases || 0) - Number(viewVendorObj.total_returns || 0))).toLocaleString('en-IN')}</p>
              </div>
              <div className="bg-emerald-50 dark:bg-emerald-950/30 p-3 rounded-xl border border-emerald-200 dark:border-emerald-800">
                <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase">Total Paid</span>
                <p className="text-sm font-black text-emerald-900 dark:text-emerald-200 mt-1">₹{Number(viewVendorObj.total_paid || 0).toLocaleString('en-IN')}</p>
              </div>
              <div className="bg-rose-50 dark:bg-rose-950/30 p-3 rounded-xl border border-rose-200 dark:border-rose-800 col-span-2 sm:col-span-1">
                <span className="text-[10px] font-black text-rose-600 dark:text-rose-400 uppercase">Outstanding / Adv</span>
                <p className="text-sm font-black text-rose-900 dark:text-rose-200 mt-1">
                  {Number(viewVendorObj.advance_balance || 0) > 0 
                    ? `Adv: ₹${Number(viewVendorObj.advance_balance).toLocaleString('en-IN')}` 
                    : `₹${Number(viewVendorObj.outstanding_balance || 0).toLocaleString('en-IN')}`}
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => { setShowViewModal(false); handleOpenRecordPayment(viewVendorObj); }}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Record Payment
              </button>
              <button
                onClick={() => { setShowViewModal(false); handleOpenVendorWorkspace(viewVendorObj.id, 'ledger'); }}
                className="px-3.5 py-2 bg-[#1B6E4C] hover:bg-emerald-800 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Open Full Ledger
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL 1: ADD / EDIT SUPPLIER FORM MODAL */}
      {showModal && (
        <Modal
          isOpen={true}
          title={selectedVendor ? `Edit Supplier - ${selectedVendor.name}` : 'Add New Supplier Partner'}
          onClose={() => { setShowModal(false); setSelectedVendor(null); }}
        >
          <VendorForm
            vendor={selectedVendor}
            onSubmit={handleSubmit}
            onCancel={() => { setShowModal(false); setSelectedVendor(null); }}
          />
        </Modal>
      )}

      {/* MODAL 2: RECORD SUPPLIER PAYMENT MODAL */}
      {showPaymentModal && paymentVendor && (
        <Modal
          isOpen={true}
          title={`Record Payment to ${paymentVendor.name}`}
          onClose={() => setShowPaymentModal(false)}
        >
          <form onSubmit={handleSavePayment} className="p-6 space-y-4 select-none">
            <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs font-bold">
              <div>
                <p className="text-slate-500 text-[10px] uppercase font-black">Supplier Name</p>
                <p className="text-slate-900 dark:text-white font-black">{paymentVendor.name} ({paymentVendor.supplier_code || `SUP-${paymentVendor.id}`})</p>
              </div>
              <div className="text-right">
                <p className="text-slate-500 text-[10px] uppercase font-black">Outstanding Payable</p>
                <p className="text-rose-600 dark:text-rose-400 font-black text-sm">₹{Number(paymentVendor.outstanding_balance || 0).toLocaleString('en-IN')}</p>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">
                Select Target Purchase Invoice (Optional)
              </label>
              <select
                value={paymentForm.purchase_id}
                onChange={(e) => {
                  const pid = e.target.value;
                  setPaymentForm(prev => ({ ...prev, purchase_id: pid }));
                  if (pid && paymentInvoices.length > 0) {
                    const inv = paymentInvoices.find(i => String(i.id) === String(pid));
                    if (inv) {
                      setPaymentForm(prev => ({ ...prev, amount: String(inv.due_amount || 0) }));
                    }
                  }
                }}
                className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-950 font-bold text-slate-800 dark:text-white focus:outline-none focus:border-emerald-600"
              >
                <option value="">Bulk Account Settlement (FIFO Allocation)</option>
                {paymentInvoices.filter(i => i.payment_status !== 'Paid').map(inv => (
                  <option key={inv.id} value={inv.id}>
                    {inv.purchase_no} - Total: ₹{Number(inv.total).toLocaleString('en-IN')} (Due: ₹{Number(inv.due_amount || inv.total).toLocaleString('en-IN')})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">
                  Payment Amount (₹) <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={handleFillFullBalance}
                  className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                >
                  Pay Full Balance
                </button>
              </div>
              <input
                type="number"
                step="0.01"
                required
                value={paymentForm.amount}
                onChange={(e) => setPaymentForm(prev => ({ ...prev, amount: e.target.value }))}
                placeholder="Enter payment amount"
                className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-950 font-black text-emerald-600 dark:text-emerald-400 text-sm focus:outline-none focus:border-emerald-600"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Payment Date</label>
                <input
                  type="date"
                  required
                  value={paymentForm.payment_date}
                  onChange={(e) => setPaymentForm(prev => ({ ...prev, payment_date: e.target.value }))}
                  className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-950 font-bold text-slate-800 dark:text-white focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Payment Mode</label>
                <select
                  value={paymentForm.payment_mode}
                  onChange={(e) => setPaymentForm(prev => ({ ...prev, payment_mode: e.target.value }))}
                  className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-950 font-bold text-slate-800 dark:text-white focus:outline-none focus:border-emerald-600"
                >
                  <option value="Cash">Cash</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="UPI">UPI</option>
                  <option value="Cheque">Cheque</option>
                  <option value="NEFT/RTGS">NEFT / RTGS</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Transaction Ref / UTR / Cheque No</label>
                <input
                  type="text"
                  value={paymentForm.reference_no}
                  onChange={(e) => setPaymentForm(prev => ({ ...prev, reference_no: e.target.value }))}
                  placeholder="UTR / Ref number"
                  className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-950 font-bold text-slate-800 dark:text-white focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Bank Account</label>
                <input
                  type="text"
                  value={paymentForm.bank_account}
                  onChange={(e) => setPaymentForm(prev => ({ ...prev, bank_account: e.target.value }))}
                  placeholder="Bank / Account details"
                  className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-950 font-bold text-slate-800 dark:text-white focus:outline-none focus:border-emerald-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Remarks / Payment Notes</label>
              <textarea
                rows="2"
                value={paymentForm.remarks}
                onChange={(e) => setPaymentForm(prev => ({ ...prev, remarks: e.target.value }))}
                placeholder="Payment settlement notes..."
                className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-950 font-bold text-slate-800 dark:text-white focus:outline-none focus:border-emerald-600"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowPaymentModal(false)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={paymentSubmitting}
                className="px-5 py-2 bg-emerald-600 dark:bg-emerald-600 hover:bg-emerald-700 dark:hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer disabled:opacity-50"
              >
                {paymentSubmitting ? 'Recording...' : 'Confirm & Post Payment'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL 3: PAYMENT RECEIPT PRINT MODAL */}
      {showReceiptModal && selectedReceipt && (
        <Modal
          isOpen={true}
          title={`Payment Receipt Voucher - ${selectedReceipt.payment_no}`}
          onClose={() => setShowReceiptModal(false)}
        >
          <div className="p-6 space-y-4 font-sans select-none print:p-0">
            <div className="border border-slate-200 dark:border-slate-700 p-6 rounded-2xl space-y-4 bg-white dark:bg-slate-900">
              <div className="flex justify-between items-start border-b border-slate-200 dark:border-slate-800 pb-4">
                <div>
                  <h2 className="text-lg font-black text-[#1B6E4C] dark:text-emerald-400">SUPPLIER PAYMENT RECEIPT VOUCHER</h2>
                  <p className="text-xs font-bold text-slate-500">Voucher No: {selectedReceipt.payment_no}</p>
                </div>
                <div className="text-right text-xs font-bold text-slate-600 dark:text-slate-300">
                  <p>Date: {new Date(selectedReceipt.payment_date).toLocaleDateString('en-IN')}</p>
                  <p className="text-emerald-600 font-black">{selectedReceipt.payment_mode}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs font-bold text-slate-700 dark:text-slate-300">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase">Paid To (Supplier):</p>
                  <p className="text-sm font-black text-slate-900 dark:text-white">{selectedReceipt.vendor_name || currentVendorObj?.name}</p>
                  <p>{selectedReceipt.company_name || currentVendorObj?.company_name}</p>
                  <p>GSTIN: {selectedReceipt.vendor_gstin || currentVendorObj?.gstin || 'N/A'}</p>
                </div>

                <div className="text-right">
                  <p className="text-[10px] font-black text-slate-400 uppercase">Payment Reference:</p>
                  <p>Ref / UTR: {selectedReceipt.reference_no || 'N/A'}</p>
                  <p>Bank: {selectedReceipt.bank_account || 'N/A'}</p>
                  {selectedReceipt.purchase_no && <p>Invoice: {selectedReceipt.purchase_no}</p>}
                </div>
              </div>

              <div className="bg-emerald-50 dark:bg-emerald-950/40 p-4 rounded-xl border border-emerald-200 dark:border-emerald-800 flex justify-between items-center">
                <span className="text-xs font-black text-emerald-800 dark:text-emerald-300 uppercase">Amount Paid:</span>
                <span className="text-2xl font-black text-emerald-700 dark:text-emerald-400 tabular-nums">
                  ₹{Number(selectedReceipt.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>

              {selectedReceipt.remarks && (
                <div className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                  <span className="font-bold text-slate-800 dark:text-slate-200">Remarks:</span> {selectedReceipt.remarks}
                </div>
              )}

              <div className="pt-8 flex justify-between items-end text-[10px] font-bold text-slate-400 border-t border-slate-100 dark:border-slate-800">
                <div>Prepared By: System Admin</div>
                <div>Authorized Signatory</div>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-emerald-600 dark:bg-emerald-600 hover:bg-emerald-700 dark:hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                <PrinterIcon className="w-4 h-4" />
                Print Voucher
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL 4: PURCHASE RETURN MODAL */}
      {showPurchaseReturnModal && returnVendorObj && (
        <Modal
          isOpen={true}
          title={`Process Purchase Return — ${returnVendorObj.name}`}
          onClose={() => setShowPurchaseReturnModal(false)}
        >
          <form onSubmit={handlePurchaseReturnSubmit} className="p-6 space-y-5 font-sans select-none text-slate-800 dark:text-slate-200">
            {/* Header Specs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold">
              <div>
                <span className="text-[10px] font-black text-slate-400 uppercase block">Supplier Name</span>
                <select
                  value={returnVendorObj?.id || ''}
                  onChange={(e) => {
                    const found = vendors.find(v => String(v.id) === String(e.target.value));
                    if (found) {
                      setReturnVendorObj(found);
                      loadVendorInvoicesForReturn(found.id);
                    }
                  }}
                  className="w-full mt-1 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-600 cursor-pointer"
                >
                  {vendors.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.name} ({v.company_name || 'Supplier'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <span className="text-[10px] font-black text-slate-400 uppercase block">Purchase Invoice</span>
                <select
                  value={selectedPurchaseId}
                  onChange={(e) => handlePurchaseInvoiceChange(e.target.value)}
                  className="w-full mt-1 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-600 cursor-pointer"
                >
                  <option value="">Select Invoice...</option>
                  {vendorInvoices.map(inv => (
                    <option key={inv.id} value={inv.id}>
                      {inv.purchase_no} — ₹{Number(inv.total).toLocaleString('en-IN')} ({new Date(inv.date).toLocaleDateString('en-IN')})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <span className="text-[10px] font-black text-slate-400 uppercase block">Return Date</span>
                <span className="text-sm font-black text-slate-900 dark:text-white">{new Date().toLocaleDateString('en-IN')} (Today)</span>
              </div>
            </div>

            {/* Purchased Items Table */}
            {selectedPurchaseObj ? (
              <div className="space-y-2">
                <span className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider block">
                  Select Item(s) to Return to Supplier:
                </span>
                <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                  <table className="w-full text-left text-xs font-semibold">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-950 text-slate-500 border-b border-slate-200 dark:border-slate-800">
                        <th className="p-3 w-10 text-center">Select</th>
                        <th className="p-3">Product Name</th>
                        <th className="p-3 text-center">Purchased Qty</th>
                        <th className="p-3 text-center">Returned Qty</th>
                        <th className="p-3 text-center">Available Return Qty</th>
                        <th className="p-3 text-right">Unit Price</th>
                        <th className="p-3 w-28 text-center">Return Qty</th>
                        <th className="p-3 text-right">Return Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                      {selectedPurchaseObj.items && selectedPurchaseObj.items.map(item => {
                        const stateItem = returnItemsState[item.product_id] || {};
                        const isChecked = stateItem.checked || false;
                        const returnQty = stateItem.returnQty || 1;
                        const purchasedQty = Number(item.quantity);
                        const returnedQty = Number(item.returnedQuantity || 0);
                        const availableQty = Math.max(0, purchasedQty - returnedQty);
                        const unitPrice = Number(item.purchase_price || item.unit_price || 0);
                        const lineTotal = unitPrice * returnQty;

                        return (
                          <tr key={item.product_id} className={`hover:bg-amber-50/20 dark:hover:bg-amber-950/20 ${isChecked ? 'bg-amber-50/40 dark:bg-amber-950/40' : ''}`}>
                            <td className="p-3 text-center">
                              <input
                                type="checkbox"
                                disabled={availableQty <= 0}
                                checked={isChecked}
                                onChange={(e) => handleReturnItemCheck(item.product_id, e.target.checked)}
                                className="h-4 w-4 rounded border-slate-300 dark:border-slate-700 text-amber-600 focus:ring-0 cursor-pointer disabled:opacity-40"
                              />
                            </td>
                            <td className="p-3 font-bold text-slate-900 dark:text-white">{item.product_name}</td>
                            <td className="p-3 text-center font-bold text-slate-700 dark:text-slate-300">{purchasedQty}</td>
                            <td className="p-3 text-center text-amber-600 font-bold">{returnedQty}</td>
                            <td className="p-3 text-center font-black text-emerald-600 dark:text-emerald-400">{availableQty}</td>
                            <td className="p-3 text-right font-bold text-slate-800 dark:text-slate-200">₹{unitPrice.toLocaleString('en-IN')}</td>
                            <td className="p-3 text-center">
                              <input
                                type="number"
                                min={1}
                                max={availableQty}
                                disabled={!isChecked || availableQty <= 0}
                                value={returnQty}
                                onChange={(e) => handleReturnQtyChange(item.product_id, e.target.value)}
                                className="w-20 px-2 py-1 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-900 dark:text-white disabled:opacity-40 focus:outline-none focus:border-amber-600 text-center"
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
            ) : (
              <div className="py-8 text-center text-xs font-bold text-slate-400">
                Please select a Purchase Invoice above to load itemized products.
              </div>
            )}

            {/* Return Reason & Settlement Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">
                  Return Reason <span className="text-rose-500">*</span>
                </label>
                <select
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-950 font-bold text-slate-800 dark:text-white focus:outline-none focus:border-amber-600 cursor-pointer"
                >
                  <option value="Damaged Goods">Damaged Goods</option>
                  <option value="Wrong Product Received">Wrong Product Received</option>
                  <option value="Wrong Quantity Received">Wrong Quantity Received</option>
                  <option value="Product Not Required">Product Not Required</option>
                  <option value="Quality Issue">Quality Issue</option>
                  <option value="Partial Return">Partial Return</option>
                  <option value="Expired Item">Expired Item</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">
                  Return Type / Settlement
                </label>
                <select
                  value={returnType}
                  onChange={(e) => setReturnType(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-950 font-bold text-slate-800 dark:text-white focus:outline-none focus:border-amber-600 cursor-pointer"
                >
                  <option value="Refund">Refund / Reduce Outstanding Payable</option>
                  <option value="Replacement">Replacement Item from Supplier</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Remarks (Optional)</label>
              <input
                type="text"
                value={returnRemarks}
                onChange={(e) => setReturnRemarks(e.target.value)}
                placeholder="Log notes about physical return condition..."
                className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-950 font-bold text-slate-800 dark:text-white focus:outline-none focus:border-amber-600"
              />
            </div>

            {/* Total Return Settlement Summary */}
            <div className="bg-amber-50/60 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 p-4 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black text-amber-800 dark:text-amber-300 uppercase block">Total Return Amount:</span>
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  Will reduce Outstanding Balance or add Supplier Credit.
                </span>
              </div>
              <span className="text-xl font-black text-amber-700 dark:text-amber-400 tabular-nums">
                ₹{calculatedTotalReturnVal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowPurchaseReturnModal(false)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={returnSubmitting || calculatedTotalReturnVal <= 0}
                className="px-5 py-2.5 bg-amber-600 dark:bg-amber-600 hover:bg-amber-700 dark:hover:bg-amber-500 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer disabled:opacity-50"
              >
                {returnSubmitting ? 'Posting Return Note...' : 'Confirm & Post Purchase Return'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default VendorList;
