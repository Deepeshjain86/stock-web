import { useState, useEffect, useMemo } from 'react';
import { 
  PlusIcon, 
  MagnifyingGlassIcon, 
  UserIcon, 
  CreditCardIcon, 
  ArrowPathIcon,
  TagIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ArrowLeftIcon,
  BuildingOfficeIcon,
  IdentificationIcon,
  ClipboardDocumentCheckIcon,
  CalendarIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  XMarkIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ArrowTrendingUpIcon,
  UserGroupIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import StatsCard from '../../components/common/StatsCard';
import Loader from '../../components/common/Loader';
import { customersAPI } from '../../services/api';
import API from '../../services/api'; // Direct imports for borrow features
import { useAppSelector } from '../../store/hooks';

const CustomerList = () => {
  const { user } = useAppSelector((state) => state.auth);
  const isReadOnly = user?.role === 'Super Admin';

  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Dashboard Metrics
  const [kpis, setKpis] = useState({
    totalCustomers: 0,
    walkinCustomers: 0,
    borrowCustomers: 0,
    totalOutstandingAmount: 0,
    pendingBorrowAmount: 0,
    overdueCustomers: 0,
    todaysCollections: 0
  });

  // Modal / Form States
  const [showFormModal, setShowFormModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, id: null, name: '' });
  
  // Transaction Modal States (Udhaar Payback / New Borrow record)
  const [showPaybackModal, setShowPaybackModal] = useState(false);
  const [showNewBorrowModal, setShowNewBorrowModal] = useState(false);
  const [selectedTx, setSelectedTx] = useState(null); // specific transaction payload
  const [paybackForm, setPaybackForm] = useState({
    amount: '',
    date: new Date().toISOString().split('T')[0],
    remarks: ''
  });
  const [newBorrowForm, setNewBorrowForm] = useState({
    invoice_no: '',
    total_amount: '',
    borrow_date: new Date().toISOString().split('T')[0],
    due_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    remarks: ''
  });

  const [form, setForm] = useState({
    name: '',
    phone: '',
    address: '',
    customer_type: 'Borrow',
    status: 'Active',
    payment_mode: 'Cash'
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Profile / Details View States
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'profile'
  const [profileData, setProfileData] = useState(null);
  const [borrowTxList, setBorrowTxList] = useState([]);
  const [ledgerHistory, setLedgerHistory] = useState([]);
  const [profileLoading, setProfileLoading] = useState(false);

  const fetchKPIs = async () => {
    try {
      const res = await API.get('/borrow/kpis');
      if (res.data?.success) {
        setKpis(res.data.stats);
      }
    } catch (err) {
      console.error('Failed to load borrow KPIs', err);
    }
  };

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const data = await customersAPI.getAll();
      if (data.success) {
        setCustomers(data.customers);
      }
    } catch (err) {
      console.error('Failed to fetch customers list', err);
    } finally {
      setLoading(false);
    }
  };

  const loadProfileDetails = async (id) => {
    setProfileLoading(true);
    try {
      const [custRes, txRes, ledgerRes] = await Promise.all([
        customersAPI.getById(id),
        API.get(`/borrow/transactions?customerId=${id}`),
        API.get(`/borrow/history?customerId=${id}`)
      ]);

      if (custRes.success) setProfileData(custRes.customer);
      if (txRes.data?.success) setBorrowTxList(txRes.data.transactions);
      if (ledgerRes.data?.success) setLedgerHistory(ledgerRes.data.history);
    } catch (err) {
      console.error('Failed to fetch customer profile details', err);
    } finally {
      setProfileLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
    fetchKPIs();
  }, []);

  const handleOpenAdd = () => {
    setSelectedCustomer(null);
    setForm({
      name: '',
      phone: '',
      address: '',
      customer_type: 'Borrow',
      status: 'Active',
      payment_mode: 'Cash'
    });
    setShowFormModal(true);
  };

  const handleOpenEdit = (customer) => {
    setSelectedCustomer(customer);
    setForm({
      name: customer.name,
      phone: customer.phone || '',
      address: customer.address || '',
      customer_type: customer.customer_type,
      status: customer.status,
      payment_mode: customer.payment_mode || 'Cash'
    });
    setShowFormModal(true);
  };

  const handleOpenProfile = (customer) => {
    setViewMode('profile');
    loadProfileDetails(customer.id);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (isReadOnly) return;
    try {
      if (selectedCustomer) {
        const res = await customersAPI.update(selectedCustomer.id, form);
        if (res.success) {
          alert('Customer profile updated successfully');
        }
      } else {
        const res = await customersAPI.create(form);
        if (res.success) {
          alert('New customer registered successfully');
        }
      }
      setShowFormModal(false);
      fetchCustomers();
      fetchKPIs();
      if (viewMode === 'profile' && selectedCustomer) {
        loadProfileDetails(selectedCustomer.id);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error processing request');
    }
  };

  const handleDeleteClick = (customer) => {
    setDeleteConfirm({ open: true, id: customer.id, name: customer.name });
  };

  const executeDelete = async () => {
    if (isReadOnly) return;
    try {
      const res = await customersAPI.delete(deleteConfirm.id);
      if (res.success) {
        alert('Customer profile deleted successfully');
        fetchCustomers();
        fetchKPIs();
        setViewMode('list');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to remove customer profile');
    } finally {
      setDeleteConfirm({ open: false, id: null, name: '' });
    }
  };

  const toggleStatus = async (customer) => {
    if (!customer || isReadOnly) return;
    if (customer.id === 1) {
      alert('Cannot modify system default Walk-in Customer profile');
      return;
    }
    const newStatus = customer.status === 'Active' ? 'Inactive' : 'Active';
    try {
      const res = await customersAPI.update(customer.id, {
        name: customer.name,
        phone: customer.phone,
        address: customer.address,
        customer_type: customer.customer_type,
        status: newStatus,
        payment_mode: customer.payment_mode
      });
      if (res.success) {
        fetchCustomers();
        fetchKPIs();
        if (viewMode === 'profile' && profileData && profileData.id === customer.id) {
          loadProfileDetails(customer.id);
        }
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to toggle customer status');
    }
  };

  // Udhaar actions handlers
  const handleOpenNewBorrow = () => {
    setNewBorrowForm({
      invoice_no: '',
      total_amount: '',
      borrow_date: new Date().toISOString().split('T')[0],
      due_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      remarks: ''
    });
    setShowNewBorrowModal(true);
  };

  const submitNewBorrow = async (e) => {
    e.preventDefault();
    if (!profileData) return;
    try {
      const payload = {
        customer_id: profileData.id,
        ...newBorrowForm
      };
      const res = await API.post('/borrow/transactions', payload);
      if (res.data?.success) {
        alert('Credit Udhaar transaction recorded successfully');
        setShowNewBorrowModal(false);
        loadProfileDetails(profileData.id);
        fetchKPIs();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save transaction');
    }
  };

  const handleOpenPayback = (tx = null) => {
    setSelectedTx(tx);
    setPaybackForm({
      amount: tx ? String(tx.remaining_amount) : '',
      date: new Date().toISOString().split('T')[0],
      remarks: tx ? `Payment against Invoice ${tx.invoice_no}` : ''
    });
    setShowPaybackModal(true);
  };

  const submitPayback = async (e) => {
    e.preventDefault();
    if (!profileData) return;
    try {
      const payload = {
        customer_id: profileData.id,
        amount: Number(paybackForm.amount),
        date: paybackForm.date,
        remarks: paybackForm.remarks || null,
        transaction_id: selectedTx ? selectedTx.id : null
      };
      const res = await API.post('/borrow/payback', payload);
      if (res.data?.success) {
        alert('Payment received and credited successfully');
        setShowPaybackModal(false);
        loadProfileDetails(profileData.id);
        fetchKPIs();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Payback entry failed');
    }
  };

  const filteredCustomers = useMemo(() => {
    return customers.filter(c => {
      const matchSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (c.phone && c.phone.includes(searchTerm)) ||
                          (c.customer_code && c.customer_code.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchType = filterType ? c.customer_type === filterType : true;
      const matchStatus = filterStatus ? c.status === filterStatus : true;
      return matchSearch && matchType && matchStatus;
    });
  }, [customers, searchTerm, filterType, filterStatus]);

  // Export functions (Simulated clean print ledger formatting)
  const handlePrintLedger = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      
      {viewMode === 'list' ? (
        <>
          {/* HEADER SECTION */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-xl md:text-2xl font-black text-slate-800 dark:text-white tracking-tight">Customer Master</h2>
              <p className="text-xs font-semibold text-slate-500 mt-0.5">Define walk-in buyers, manage credit borrow lines, balances, and recover receivables.</p>
            </div>
            {!isReadOnly && (
              <button 
                onClick={handleOpenAdd}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-[#1B6E4C] hover:bg-[#155339] text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 self-start"
              >
                <PlusIcon className="w-4 h-4 stroke-[3]" /> Register Customer
              </button>
            )}
          </div>

          {/* DASHBOARD STATS METRICS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard 
              title="Total Active Clients" 
              value={kpis.totalCustomers} 
              desc={`${kpis.borrowCustomers} Borrow / ${kpis.walkinCustomers} Walk-in`} 
              icon={UserGroupIcon} 
              color="indigo" 
            />
            <StatsCard 
              title="Outstanding Credit Balance" 
              value={`₹${(kpis.totalOutstandingAmount || 0).toLocaleString('en-IN')}`} 
              desc="Active Udhaar awaiting recovery" 
              icon={ArrowTrendingUpIcon} 
              color="rose" 
            />
            <StatsCard 
              title="Overdue Accounts" 
              value={kpis.overdueCustomers} 
              desc="Passed credit due limits" 
              icon={ExclamationCircleIcon} 
              color="amber" 
            />
            <StatsCard 
              title="Today's Collections" 
              value={`₹${(kpis.todaysCollections || 0).toLocaleString('en-IN')}`} 
              desc="Payments settled today" 
              icon={CheckCircleIcon} 
              color="emerald" 
            />
          </div>

          {/* FILTERS & SEARCH ROW */}
          <div className="flex flex-col sm:flex-row items-center gap-3 bg-white dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
            <div className="relative w-full sm:max-w-xs">
              <MagnifyingGlassIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search name, mobile, ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 dark:border-slate-850 rounded-xl focus:outline-none focus:border-indigo-500 bg-slate-50/50 dark:bg-slate-950/20 text-slate-800 dark:text-slate-100 font-semibold"
              />
            </div>
            
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-2 text-xs border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 font-semibold bg-slate-50/50 dark:bg-slate-950/20 text-slate-700 dark:text-slate-200 cursor-pointer"
              >
                <option value="">All Types</option>
                <option value="Walk-in">Walk-in Customer</option>
                <option value="Borrow">Borrow (Credit)</option>
              </select>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 text-xs border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 font-semibold bg-slate-50/50 dark:bg-slate-950/20 text-slate-700 dark:text-slate-200 cursor-pointer"
              >
                <option value="">All Status</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          {/* CUSTOMERS DATA TABLE */}
          {loading ? (
            <div className="flex justify-center py-20">
              <Loader size="md" />
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-semibold">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                      <th className="py-3 px-4">Client ID</th>
                      <th className="py-3 px-4">Client Details</th>
                      <th className="py-3 px-4">Type</th>
                      <th className="py-3 px-4">Payment Mode</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      <th className="py-3 px-4 text-right">Outstanding</th>
                      <th className="py-3 px-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                    {filteredCustomers.map((customer) => (
                      <tr key={customer.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                        <td className="py-3.5 px-4 font-mono text-slate-500 dark:text-slate-400 font-bold">
                          {customer.customer_code || '—'}
                        </td>
                        <td className="py-3.5 px-4">
                          <p className="font-bold text-slate-800 dark:text-slate-200">{customer.name}</p>
                          <p className="text-[10px] text-slate-450 dark:text-slate-500">{customer.phone || 'No Mobile'}</p>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            customer.customer_type === 'Borrow' 
                              ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400 border border-rose-100/50' 
                              : 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/20 dark:text-indigo-400 border border-indigo-100/50'
                          }`}>
                            {customer.customer_type}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-550 dark:text-slate-350 font-bold">
                          {customer.payment_mode || 'Cash'}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <button
                            onClick={() => toggleStatus(customer)}
                            disabled={isReadOnly || customer.id === 1}
                            className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border cursor-pointer select-none transition-colors ${
                              customer.status === 'Active' 
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-250 hover:bg-emerald-100 disabled:hover:bg-emerald-50 disabled:cursor-not-allowed' 
                                : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100 disabled:hover:bg-slate-50 disabled:cursor-not-allowed'
                            }`}
                          >
                            {customer.status || 'Active'}
                          </button>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          {customer.customer_type === 'Borrow' ? (
                            <span className="font-bold text-rose-600 dark:text-rose-455">
                              ₹{(customer.outstanding_balance || 0).toLocaleString('en-IN')}
                            </span>
                          ) : (
                            <span className="text-slate-300 dark:text-slate-700">—</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center justify-center gap-2">
                            {customer.customer_type === 'Borrow' ? (
                              <button
                                onClick={() => handleOpenProfile(customer)}
                                className="px-2.5 py-1.5 bg-indigo-50 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-600 hover:text-white rounded-lg transition-all"
                              >
                                View Ledger
                              </button>
                            ) : (
                              <span className="text-[10px] text-slate-400 font-semibold italic">Walk-in</span>
                            )}
                            {!isReadOnly && customer.id !== 1 && (
                              <>
                                <button
                                  onClick={() => handleOpenEdit(customer)}
                                  className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-350 rounded-lg transition-colors"
                                  title="Edit Profile"
                                >
                                  ✎
                                </button>
                                <button
                                  onClick={() => handleDeleteClick(customer)}
                                  className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-650 rounded-lg transition-colors"
                                  title="Delete Profile"
                                >
                                  🗑
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredCustomers.length === 0 && (
                      <tr>
                        <td colSpan={7} className="text-center py-12 text-slate-400 dark:text-slate-500 font-semibold">No customer profile matching filters found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      ) : (
        /* PROFILE DETAIL LEDGER VIEW */
        <div className="space-y-6">
          {/* Profile Header */}
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-850 pb-4">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => { setViewMode('list'); setSelectedCustomer(null); setProfileData(null); fetchCustomers(); fetchKPIs(); }}
                className="p-1.5 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg transition-colors"
              >
                <ArrowLeftIcon className="w-4 h-4 text-slate-500" />
              </button>
              <div>
                <h3 className="text-lg font-black text-slate-800 dark:text-white leading-none">
                  {profileLoading ? 'Loading Profile...' : profileData?.name}
                </h3>
                <p className="text-[10px] text-indigo-650 font-bold mt-1 uppercase tracking-wider">
                  Client Ledger & Udhaar Books ({profileData?.customer_code})
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handlePrintLedger}
                className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 rounded-xl text-xs font-bold"
              >
                Print Ledger
              </button>
              {!isReadOnly && (
                <>
                  <button
                    onClick={handleOpenNewBorrow}
                    className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-500/10"
                  >
                    + Record Udhaar (Credit)
                  </button>
                  <button
                    onClick={() => handleOpenPayback()}
                    className="px-3.5 py-2 bg-[#1B6E4C] hover:bg-[#155339] text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-500/10"
                  >
                    Settlement (Payback)
                  </button>
                </>
              )}
            </div>
          </div>

          {profileLoading ? (
            <div className="flex justify-center py-20"><Loader size="md" /></div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Profile Card Summary (Left Col) */}
              <div className="space-y-6 lg:col-span-1">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
                  <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                    <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-850 flex items-center justify-center text-lg">👤</div>
                    <div>
                      <h4 className="font-bold text-slate-800 dark:text-white text-sm">{profileData?.name}</h4>
                      <p className="text-[10px] text-slate-400 font-mono font-bold mt-0.5">{profileData?.customer_code}</p>
                    </div>
                  </div>

                  <div className="space-y-3.5 text-xs font-medium text-left">
                    <div className="flex items-center gap-2.5 text-slate-650 dark:text-slate-350">
                      <PhoneIcon className="w-4 h-4 text-slate-400" />
                      <span>{profileData?.phone || 'No Mobile Number'}</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-slate-650 dark:text-slate-350">
                      <CreditCardIcon className="w-4 h-4 text-slate-400" />
                      <span>Payment Mode: <strong className="text-slate-800 dark:text-slate-200">{profileData?.payment_mode || 'Cash'}</strong></span>
                    </div>
                    <div className="flex items-start gap-2.5 text-slate-650 dark:text-slate-350">
                      <MapPinIcon className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="whitespace-pre-wrap">{profileData?.address || 'No physical delivery address listed.'}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-3 text-[10px] uppercase font-bold text-slate-400">
                      <span>Customer Type:</span>
                      <span className="text-slate-700 dark:text-slate-300 font-extrabold">{profileData?.customer_type}</span>
                    </div>
                    <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-3 text-[10px] uppercase font-bold text-slate-400">
                      <span>Status:</span>
                      <button
                        onClick={() => toggleStatus(profileData)}
                        disabled={isReadOnly || profileData?.id === 1}
                        className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border cursor-pointer select-none transition-colors ${
                          profileData?.status === 'Active' 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-250 hover:bg-emerald-100 disabled:hover:bg-emerald-50 disabled:cursor-not-allowed' 
                            : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100 disabled:hover:bg-slate-50 disabled:cursor-not-allowed'
                        }`}
                      >
                        {profileData?.status || 'Active'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Outstanding Alert Summary */}
                <div className="bg-rose-50/50 dark:bg-rose-950/10 border border-rose-150/40 dark:border-rose-900/30 rounded-2xl p-5 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-450 dark:text-slate-400 uppercase tracking-wide">Receivable balance</span>
                    <span className="text-[10px] font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/50 px-2 py-0.5 rounded">Recoverable</span>
                  </div>
                  <h4 className="text-3xl font-black text-rose-600 font-mono">
                    ₹{(borrowTxList.reduce((sum, tx) => sum + Number(tx.remaining_amount), 0)).toLocaleString('en-IN')}
                  </h4>
                  <p className="text-[10px] font-semibold text-slate-500 leading-normal">
                    Total outstanding remaining credits spanning across {borrowTxList.filter(tx => tx.payment_status !== 'Paid').length} invoices.
                  </p>
                </div>
              </div>

              {/* Transactions Tabbed & Details View (Right Col) */}
              <div className="space-y-6 lg:col-span-2">
                
                {/* Active Borrow Credit Invoices */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
                  <h4 className="text-xs font-black uppercase text-[#1B6E4C] tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2">Active Borrow Credit Invoices</h4>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-semibold">
                      <thead>
                        <tr className="text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-2 text-[10px] uppercase">
                          <th className="pb-2">Invoice No</th>
                          <th className="pb-2">Borrow Date</th>
                          <th className="pb-2">Due Date</th>
                          <th className="pb-2 text-right">Total</th>
                          <th className="pb-2 text-right">Remaining</th>
                          <th className="pb-2 text-center">Status</th>
                          <th className="pb-2 text-right">Settle</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40">
                        {borrowTxList.map((tx) => {
                          const isOverdue = tx.payment_status === 'Overdue';
                          return (
                            <tr key={tx.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                              <td className="py-3 font-mono font-bold text-slate-800 dark:text-slate-350">{tx.invoice_no || 'Manual'}</td>
                              <td className="py-3 text-slate-500 dark:text-slate-400">{new Date(tx.borrow_date).toLocaleDateString('en-IN')}</td>
                              <td className={`py-3 ${isOverdue ? 'text-rose-600 font-bold' : 'text-slate-500'}`}>
                                {new Date(tx.due_date).toLocaleDateString('en-IN')}
                                {isOverdue && <span className="block text-[8px] uppercase tracking-wide">Overdue</span>}
                              </td>
                              <td className="py-3 text-right font-mono text-slate-800 dark:text-slate-355">₹{Number(tx.total_amount).toFixed(2)}</td>
                              <td className="py-3 text-right font-mono font-bold text-rose-600">₹{Number(tx.remaining_amount).toFixed(2)}</td>
                              <td className="py-3 text-center">
                                <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                  tx.payment_status === 'Paid' 
                                    ? 'bg-emerald-50 text-emerald-700' 
                                    : tx.payment_status === 'Overdue'
                                      ? 'bg-rose-50 text-rose-700'
                                      : 'bg-amber-50 text-amber-700'
                                }`}>
                                  {tx.payment_status}
                                </span>
                              </td>
                              <td className="py-3 text-right">
                                {tx.payment_status !== 'Paid' && !isReadOnly && (
                                  <button
                                    onClick={() => handleOpenPayback(tx)}
                                    className="px-2 py-1 bg-emerald-50 hover:bg-emerald-600 hover:text-white text-emerald-700 rounded text-[10px] font-bold transition-all"
                                  >
                                    Pay
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                        {borrowTxList.length === 0 && (
                          <tr>
                            <td colSpan={7} className="py-8 text-center text-slate-400 text-[10px]">No active credit invoices recorded.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Ledger Historical Statement (Udhaar Timeline) */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
                  <h4 className="text-xs font-black uppercase text-slate-800 dark:text-slate-300 tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2">Customer Ledger Statement</h4>
                  
                  <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                    {ledgerHistory.map((item) => (
                      <div key={item.id} className="flex items-start gap-3 border-l-2 border-slate-100 dark:border-slate-800 pl-4 py-0.5 hover:border-indigo-500 transition-colors">
                        <div className={`mt-1.5 h-2 w-2 rounded-full ${item.type === 'Borrow' ? 'bg-rose-500' : 'bg-emerald-500'} flex-shrink-0`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                              {item.type === 'Borrow' ? 'Credit Recorded (Udhaar)' : 'Payment Received (Payback)'}
                            </p>
                            <span className={`text-xs font-black ${item.type === 'Borrow' ? 'text-rose-600' : 'text-emerald-600'}`}>
                              {item.type === 'Borrow' ? '+' : '-'} ₹{Number(item.amount).toFixed(2)}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            {new Date(item.date).toLocaleDateString('en-IN')} • {item.notes || 'No remarks recorded'}
                          </p>
                        </div>
                      </div>
                    ))}
                    {ledgerHistory.length === 0 && (
                      <p className="text-center py-6 text-slate-400 text-[10px]">No logs registered in ledger statement.</p>
                    )}
                  </div>
                </div>

              </div>
            </div>
          )}
        </div>
      )}

      {/* REGISTRATION MODAL FORM */}
      <AnimatePresence>
        {showFormModal && (
          <div 
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowFormModal(false);
            }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-800 rounded-2xl w-full max-w-[650px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="bg-slate-50 dark:bg-slate-950 px-6 py-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  {selectedCustomer ? 'Modify Customer Profile' : 'Register New Client'}
                </h3>
                <button onClick={() => setShowFormModal(false)} className="text-slate-450 hover:text-slate-950 dark:text-slate-400 dark:hover:text-white p-1">
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleFormSubmit} className="p-6 space-y-4 text-left">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-450 dark:text-slate-550 uppercase tracking-wider mb-1">Customer Type *</label>
                    <select
                      value={form.customer_type} required
                      onChange={(e) => setForm({ ...form, customer_type: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-semibold outline-none text-slate-850 dark:text-slate-200"
                    >
                      <option value="Borrow">Borrow Customer (Udhaar)</option>
                      <option value="Walk-in">Walk-in Customer</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-450 dark:text-slate-550 uppercase tracking-wider mb-1">Payment Mode *</label>
                    <select
                      value={form.payment_mode || 'Cash'} required
                      onChange={(e) => setForm({ ...form, payment_mode: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-semibold outline-none text-slate-850 dark:text-slate-200"
                    >
                      <option value="Cash">Cash</option>
                      <option value="UPI">UPI</option>
                      <option value="Card">Card</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                      <option value="Credit (Borrow)">Credit (Borrow)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-450 dark:text-slate-550 uppercase tracking-wider mb-1">Customer Full Name *</label>
                    <input
                      type="text" required placeholder="e.g. Ramesh Kumar"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-semibold outline-none text-slate-850 dark:text-slate-200"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-450 dark:text-slate-550 uppercase tracking-wider mb-1">Mobile / Phone Number *</label>
                    <input
                      type="text" required placeholder="e.g. 9876543210 (10 digits)"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-semibold outline-none text-slate-850 dark:text-slate-200"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-450 dark:text-slate-550 uppercase tracking-wider mb-1">Complete Physical Address</label>
                  <textarea
                    rows="3" placeholder="Enter complete home or store delivery physical address details..."
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-semibold outline-none text-slate-850 dark:text-slate-200 resize-none"
                  />
                </div>

                <div className="flex gap-2 justify-end pt-4 border-t border-slate-100 dark:border-slate-850">
                  <button
                    type="button" onClick={() => setShowFormModal(false)}
                    className="px-4 py-2 border border-slate-200 dark:border-slate-850 text-slate-500 hover:text-slate-950 dark:text-slate-450 dark:hover:text-white rounded-xl text-xs font-bold bg-white dark:bg-slate-900"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#1B6E4C] hover:bg-[#155339] text-white rounded-xl text-xs font-bold transition-all"
                  >
                    {selectedCustomer ? 'Update Profile' : 'Register Customer'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* RECORD PAYBACK MODAL */}
      <AnimatePresence>
        {showPaybackModal && (
          <div 
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowPaybackModal(false);
            }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden"
            >
              <div className="bg-slate-900 px-6 py-4 flex items-center justify-between text-white">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider">Record Udhaar Payback</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">Settle customer debt balances</p>
                </div>
                <button onClick={() => setShowPaybackModal(false)} className="text-slate-400 hover:text-white p-1">
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={submitPayback} className="p-6 space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Payback Amount (₹) *</label>
                  <input
                    type="number" required placeholder="e.g. 500"
                    value={paybackForm.amount}
                    onChange={(e) => setPaybackForm({ ...paybackForm, amount: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-bold outline-none text-slate-800 dark:text-slate-200"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Payment Date *</label>
                  <input
                    type="date" required
                    value={paybackForm.date}
                    onChange={(e) => setPaybackForm({ ...paybackForm, date: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-bold outline-none text-slate-800 dark:text-slate-200"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Remarks / Reference</label>
                  <input
                    type="text" placeholder="e.g. UPI, cash receipt, bank tx no..."
                    value={paybackForm.remarks}
                    onChange={(e) => setPaybackForm({ ...paybackForm, remarks: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-semibold outline-none text-slate-800 dark:text-slate-200"
                  />
                </div>

                <div className="flex gap-2 justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button" onClick={() => setShowPaybackModal(false)}
                    className="px-4 py-2 border border-slate-200 dark:border-slate-850 text-slate-500 hover:text-slate-950 dark:text-slate-450 dark:hover:text-white rounded-xl text-xs font-bold bg-white dark:bg-slate-900"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#1B6E4C] hover:bg-[#155339] text-white rounded-xl text-xs font-bold shadow-md"
                  >
                    Submit Payback
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* RECORD NEW BORROW TRANSACTION MODAL */}
      <AnimatePresence>
        {showNewBorrowModal && (
          <div 
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowNewBorrowModal(false);
            }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden"
            >
              <div className="bg-slate-950 px-6 py-4 flex items-center justify-between text-white">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider">Record Udhaar Credit</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">Add outstanding balance invoice</p>
                </div>
                <button onClick={() => setShowNewBorrowModal(false)} className="text-slate-400 hover:text-white p-1">
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={submitNewBorrow} className="p-6 space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Invoice Number (Optional)</label>
                  <input
                    type="text" placeholder="e.g. INV-2026-0035"
                    value={newBorrowForm.invoice_no}
                    onChange={(e) => setNewBorrowForm({ ...newBorrowForm, invoice_no: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-bold outline-none text-slate-800 dark:text-slate-200"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Borrow Date *</label>
                    <input
                      type="date" required
                      value={newBorrowForm.borrow_date}
                      onChange={(e) => setNewBorrowForm({ ...newBorrowForm, borrow_date: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-bold outline-none text-slate-800 dark:text-slate-200"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Due Date *</label>
                    <input
                      type="date" required
                      value={newBorrowForm.due_date}
                      onChange={(e) => setNewBorrowForm({ ...newBorrowForm, due_date: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-bold outline-none text-slate-800 dark:text-slate-200"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Credit Amount (₹) *</label>
                  <input
                    type="number" required placeholder="e.g. 1500"
                    value={newBorrowForm.total_amount}
                    onChange={(e) => setNewBorrowForm({ ...newBorrowForm, total_amount: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-bold outline-none text-slate-800 dark:text-slate-200"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Remarks / Remarks</label>
                  <input
                    type="text" placeholder="e.g. grocery bills credit..."
                    value={newBorrowForm.remarks}
                    onChange={(e) => setNewBorrowForm({ ...newBorrowForm, remarks: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-semibold outline-none text-slate-800 dark:text-slate-200"
                  />
                </div>

                <div className="flex gap-2 justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button" onClick={() => setShowNewBorrowModal(false)}
                    className="px-4 py-2 border border-slate-200 dark:border-slate-850 text-slate-500 hover:text-slate-950 dark:text-slate-450 dark:hover:text-white rounded-xl text-xs font-bold bg-white dark:bg-slate-900"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md"
                  >
                    Record Credit
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CONFIRM DELETE DIALOG */}
      <ConfirmDialog 
        isOpen={deleteConfirm.open} 
        onClose={() => setDeleteConfirm({ open: false, id: null, name: '' })} 
        onConfirm={executeDelete} 
        title="Remove Customer Profile" 
        message={`Are you completely sure you want to permanently remove customer profile "${deleteConfirm.name}"? This action cannot be reverted.`} 
      />

    </div>
  );
};

export default CustomerList;
