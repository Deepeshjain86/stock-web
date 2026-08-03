import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpenIcon, 
  ArrowTrendingUpIcon, 
  ArrowTrendingDownIcon, 
  UserGroupIcon, 
  PlusIcon, 
  XMarkIcon,
  MagnifyingGlassIcon,
  CalendarIcon,
  CurrencyRupeeIcon
} from '@heroicons/react/24/outline';
import API from '../../services/api';
import Loader from '../../components/common/Loader';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { showToast } from '../../store/slices/notificationSlice';

const BorrowLedger = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const isReadOnly = user?.role === 'Viewer' || user?.role === 'Super Admin' || !!localStorage.getItem('monitoredTenant');

  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState([]);
  const [history, setHistory] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  
  // Modal states
  const [showTxModal, setShowTxModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Confirmation states
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, id: null });
  const [deletingId, setDeletingId] = useState(null);
  
  // Form states – type is now always 'Payback'
  const [txForm, setTxForm] = useState({
    customer_id: '',
    amount: '',
    // CHANGED: removed 'type' from initial state (we'll hardcode it)
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  useEffect(() => {
    if (!showTxModal && !showHistoryModal) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setShowTxModal(false);
        setShowHistoryModal(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showTxModal, showHistoryModal]);

  const loadSummary = async () => {
    try {
      setLoading(true);
      const res = await API.get('/borrow');
      if (res.data?.success) {
        setSummary(res.data.summary);
      }
    } catch (err) {
      console.error('Failed to load borrow summary', err);
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async (customerId) => {
    try {
      const res = await API.get(`/borrow/history?customerId=${customerId}`);
      if (res.data?.success) {
        setHistory(res.data.history);
      }
    } catch (err) {
      console.error('Failed to load customer statement history', err);
    }
  };

  useEffect(() => {
    loadSummary();
  }, []);

  const handleOpenTx = (customer) => {
    setSelectedCustomer(customer);
    setTxForm({
      customer_id: customer.id,
      amount: '',
      // CHANGED: type is no longer stored in form; we always send payback
      date: new Date().toISOString().split('T')[0],
      notes: ''
    });
    setShowTxModal(true);
  };

  const handleOpenHistory = async (customer) => {
    setSelectedCustomer(customer);
    setHistory([]);
    setShowHistoryModal(true);
    await loadHistory(customer.id);
  };

  // CHANGED: Simplified to only handle payback
  const handleTxSubmit = async (e) => {
    e.preventDefault();
    if (!txForm.amount || Number(txForm.amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    try {
      const payload = {
        customer_id: selectedCustomer.id,
        amount: Number(txForm.amount),
        date: txForm.date,
        remarks: txForm.notes || ''
      };
      const res = await API.post('/borrow/payback', payload);

      if (res.data?.success) {
        toast.success('Payback recorded successfully');
        setShowTxModal(false);
        loadSummary();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to record payback');
    }
  };

  const triggerDeleteEntry = (id) => {
    setDeleteConfirm({ open: true, id });
  };

  const confirmDeleteEntry = async () => {
    const targetId = deleteConfirm.id;
    if (!targetId || deletingId) return;

    setDeletingId(targetId);
    try {
      const res = await API.delete(`/borrow/${targetId}`);
      if (res.data?.success) {
        setHistory(prev => prev.filter(h => h.id !== targetId));
        if (selectedCustomer) {
          loadHistory(selectedCustomer.id);
        }
        loadSummary();
        dispatch(showToast({ msg: 'Transaction voided successfully', type: 'success' }));
      } else {
        dispatch(showToast({ msg: res.data?.message || 'Failed to delete transaction log', type: 'error' }));
      }
    } catch (err) {
      dispatch(showToast({ msg: err.response?.data?.message || 'Failed to delete transaction log', type: 'error' }));
    } finally {
      setDeletingId(null);
      setDeleteConfirm({ open: false, id: null });
    }
  };

  const filteredSummary = summary.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (item.phone && item.phone.includes(searchTerm))
  );

  // Compute KPI cards totals
  const totalOutstanding = summary.reduce((sum, item) => sum + Number(item.balance), 0);
  const debtorCount = summary.filter(item => Number(item.balance) > 0).length;

  return (
    <div className="space-y-6">
      
      {/* CONFIRM DELETE DIALOG */}
      <ConfirmDialog
        isOpen={deleteConfirm.open}
        type="danger"
        title="Void Transaction Log"
        message="Are you sure you want to permanently delete/void this transaction log entry from the customer statement ledger?"
        confirmLabel={deletingId ? "Voiding..." : "Void Entry"}
        cancelLabel="Cancel"
        onConfirm={confirmDeleteEntry}
        onCancel={() => setDeleteConfirm({ open: false, id: null })}
      />
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight">Customer Borrow Ledger</h2>
          <p className="text-xs font-semibold text-slate-500 mt-0.5">Manage customer credits, accounts receivables, and record paybacks (Udhaar)</p>
        </div>
      </div>

      {/* KPI METRICS OVERVIEW */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Outstanding Due</span>
            <p className="text-2xl font-black text-rose-600">₹{totalOutstanding.toLocaleString('en-IN')}</p>
            <span className="text-[10px] font-semibold text-slate-500 block">Active credit balance to recover</span>
          </div>
          <div className="p-3 rounded-xl bg-rose-50 text-rose-600">
            <ArrowTrendingUpIcon className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Debtors Count</span>
            <p className="text-2xl font-black text-slate-800">{debtorCount}</p>
            <span className="text-[10px] font-semibold text-slate-500 block">Customers owing outstanding credits</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 text-slate-700">
            <UserGroupIcon className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Default Status</span>
            <p className="text-2xl font-black text-emerald-600">Good standing</p>
            <span className="text-[10px] font-semibold text-slate-500 block">Payment recovery active</span>
          </div>
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
            <ArrowTrendingDownIcon className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* FILTER SEARCH BAR */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 border border-slate-200 rounded-2xl shadow-sm">
        <div className="relative w-full sm:max-w-xs">
          <MagnifyingGlassIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search customer name or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 bg-slate-50/50 font-semibold"
          />
        </div>
      </div>

      {/* MAIN DATA LEDGER */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader size="md" />
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-semibold">
              <thead>
                <tr className="bg-slate-50 text-slate-500 border-b border-slate-200">
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Contact Details</th>
                  <th className="py-3 px-4">Address</th>
                  <th className="py-3 px-4 text-right">Outstanding Balance</th>
                  <th className="py-3 px-4 text-center">Ledger Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSummary.map((customer) => (
                  <tr key={customer.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-800">{customer.name}</td>
                    <td className="py-3 px-4">
                      <p className="text-slate-700">{customer.phone || 'No Phone'}</p>
                      <p className="text-[10px] text-slate-400">{customer.email || ''}</p>
                    </td>
                    <td className="py-3 px-4 text-slate-500">{customer.address || 'Counter Billing'}</td>
                    <td className="py-3 px-4 text-right">
                      <span className={`text-sm font-black ${Number(customer.balance) > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                        ₹{Number(customer.balance).toLocaleString('en-IN')}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-2">
                        {!isReadOnly && (
                          <button
                            onClick={() => handleOpenTx(customer)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white rounded-lg transition-all"
                          >
                            <PlusIcon className="w-3.5 h-3.5 stroke-[2.5]" /> Record Payback
                          </button>
                        )}
                        <button
                          onClick={() => handleOpenHistory(customer)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-lg transition-all"
                        >
                          View Ledger
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredSummary.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-slate-400 font-medium">No customer accounts registered. Go to Sales POS to add new profiles.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* RECORD PAYBACK MODAL – CHANGED: only payback, no type toggle */}
      <AnimatePresence>
        {showTxModal && selectedCustomer && (
          <div 
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowTxModal(false);
              }
            }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden"
            >
              {/* CHANGED: heading to "Record Payback" */}
              <div className="bg-slate-900 px-6 py-4 flex items-center justify-between text-white">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider">Record Payback</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">Customer: {selectedCustomer.name}</p>
                </div>
                <button onClick={() => setShowTxModal(false)} className="text-slate-400 hover:text-white p-1">
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleTxSubmit} className="p-6 space-y-4">
                {/* REMOVED: transaction type toggle section */}

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Amount (₹) *</label>
                  <div className="relative">
                    <CurrencyRupeeIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="number"
                      required
                      placeholder="0.00"
                      value={txForm.amount}
                      onChange={(e) => setTxForm({...txForm, amount: e.target.value})}
                      className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 font-bold font-mono text-slate-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Transaction Date *</label>
                  <input
                    type="date"
                    required
                    value={txForm.date}
                    onChange={(e) => setTxForm({...txForm, date: e.target.value})}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Remarks / Notes</label>
                  <textarea
                    rows="2"
                    placeholder="Enter payback reference..."
                    value={txForm.notes}
                    onChange={(e) => setTxForm({...txForm, notes: e.target.value})}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 font-semibold resize-none"
                  />
                </div>

                <div className="flex gap-2 justify-end pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowTxModal(false)}
                    className="px-4 py-2 border border-slate-200 text-slate-500 hover:text-slate-800 rounded-xl text-xs font-bold"
                  >
                    Cancel
                  </button>
                  {/* CHANGED: button label */}
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md"
                  >
                    Record Payback
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* VIEW STATEMENT HISTORY MODAL – unchanged */}
      <AnimatePresence>
        {showHistoryModal && selectedCustomer && (
          <div 
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowHistoryModal(false);
              }
            }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden"
            >
              <div className="bg-slate-900 px-6 py-4 flex items-center justify-between text-white">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider">Customer Statement Account</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">Statement sheet for {selectedCustomer.name}</p>
                </div>
                <button onClick={() => setShowHistoryModal(false)} className="text-slate-400 hover:text-white p-1">
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="max-h-[350px] overflow-y-auto pr-1">
                  <table className="w-full text-left text-xs font-semibold">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 border-b border-slate-200">
                        <th className="py-2 px-3">Date</th>
                        <th className="py-2 px-3">Type</th>
                        <th className="py-2 px-3">Amount</th>
                        <th className="py-2 px-3">Remarks</th>
                        <th className="py-2 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {history.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50/40">
                          <td className="py-3 px-3 text-slate-600">{new Date(log.date).toLocaleDateString()}</td>
                          <td className="py-3 px-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              log.type === 'Borrow' ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'
                            }`}>
                              {log.type === 'Borrow' ? 'Borrow' : 'Payback'}
                            </span>
                          </td>
                          <td className="py-3 px-3 font-bold text-slate-800">₹{Number(log.amount).toLocaleString('en-IN')}</td>
                          <td className="py-3 px-3 text-slate-500">{log.notes || '—'}</td>
                          <td className="py-3 px-3 text-right">
                            {!isReadOnly && (
                              <button
                                onClick={() => triggerDeleteEntry(log.id)}
                                className="text-rose-500 hover:text-rose-700 text-[10px] font-bold cursor-pointer"
                              >
                                Void Entry
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                      {history.length === 0 && (
                        <tr>
                          <td colSpan={5} className="text-center py-8 text-slate-400">No transaction ledger entries recorded.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-end pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowHistoryModal(false)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                  >
                    Close Sheet
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default BorrowLedger;