import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { PlusIcon, PrinterIcon } from '@heroicons/react/24/outline';
import Modal from '../../components/common/Modal';
import DataTable from '../../components/common/DataTable';
import PurchaseForm from '../../components/forms/PurchaseForm';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import StatusBadge from '../../components/common/StatusBadge';
import SearchBar from '../../components/common/SearchBar';
import { purchasesAPI } from '../../services/api';
import { useAppSelector } from '../../store/hooks';
import PurchaseInvoicePrintTemplate from '../../components/common/PurchaseInvoicePrintTemplate';

// Fallback data in case server is offline
const fallbackPurchases = [
  {
    id: 1,
    purchaseNo: 'PUR-001-2026',
    date: '2026-06-15',
    vendor: 'Balaji Wholesale Traders',
    total: 8181.20,
    paymentStatus: 'Paid',
    deliveryStatus: 'Received'
  },
  {
    id: 2,
    purchaseNo: 'PUR-002-2026',
    date: '2026-07-01',
    vendor: 'Metro Cash & Carry',
    total: 13070.00,
    paymentStatus: 'Pending',
    deliveryStatus: 'Pending'
  }
];

const PurchaseList = () => {
  const { user } = useAppSelector((state) => state.auth);
  const isReadOnly = user?.role === 'Super Admin';

  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dbOffline, setDbOffline] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, id: null });
  const [viewingPurchase, setViewingPurchase] = useState(null);
  const printRef = useRef();

  const handlePrintPastPurchase = () => {
    const printContent = printRef.current?.innerHTML;
    if (!printContent) return;
    const win = window.open('', '_blank');
    win.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Purchase Invoice – ${viewingPurchase?.purchaseNo || viewingPurchase?.purchase_no || 'Draft'}</title>
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
  };

  const fetchPurchases = async () => {
    setLoading(true);
    try {
      const data = await purchasesAPI.getAll();
      if (data.success) {
        // Map database response to columns format
        const mapped = data.purchases.map(p => ({
          id: p.id,
          purchaseNo: p.purchase_no,
          date: p.date ? p.date.slice(0, 10) : '',
          vendor: p.vendor_name,
          total: Number(p.total),
          paymentStatus: p.payment_status,
          deliveryStatus: p.delivery_status
        }));
        setPurchases(mapped);
      }
      setDbOffline(false);
    } catch (err) {
      console.warn('Purchases API failed, loading fallback data.', err);
      setDbOffline(true);
      setPurchases(fallbackPurchases);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPurchases();
  }, []);

  const filteredPurchases = purchases.filter((p) =>
    p.vendor.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.purchaseNo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddPurchase = () => {
    setShowModal(true);
  };

  const handleDeletePurchase = (purchase) => {
    setDeleteConfirm({ open: true, id: purchase.id });
  };

  const confirmDelete = async () => {
    try {
      if (!dbOffline) {
        await purchasesAPI.delete(deleteConfirm.id);
        fetchPurchases();
      } else {
        setPurchases(purchases.filter((p) => p.id !== deleteConfirm.id));
      }
    } catch (err) {
      console.error('Failed to cancel purchase invoice:', err);
      toast.error(err.response?.data?.message || 'Cancellation failed');
    } finally {
      setDeleteConfirm({ open: false, id: null });
    }
  };

  const handleSubmit = async (formData) => {
    try {
      if (!dbOffline) {
        // In the form: items is array of product details
        // backend expects items to be array of { product_id, quantity, purchase_price, gst, total }
        const itemsMapped = formData.items.map(item => ({
          product_id: item.productId || 1,
          quantity: Number(item.quantity) || 1,
          purchase_price: Number(item.price) || 0,
          gst: Number(item.gstPercent) || 0,
          total: Number(item.total) || 0
        }));

        const payload = {
          vendor_id: formData.vendorId || 1,
          warehouse_id: formData.warehouseId || 1,
          date: formData.purchaseDate || new Date().toISOString().split('T')[0],
          subtotal: Number(formData.subtotal) || 0,
          discount: Number(formData.discountAmount) || 0,
          gst_amount: Number(formData.tax) || 0,
          total: Number(formData.total) || 0,
          payment_status: formData.paymentStatus || 'Pending',
          delivery_status: formData.deliveryStatus || 'Received',
          payment_method: formData.paymentMode || 'Cash',
          items: itemsMapped
        };

        await purchasesAPI.create(payload);
        toast.success('Purchase invoice recorded successfully!');
        setShowModal(false);
        fetchPurchases();
      } else {
        // Local simulation fallback
        const newPurchase = {
          ...formData,
          id: Math.max(...purchases.map((p) => p.id), 0) + 1,
          purchaseNo: `PUR-${String(purchases.length + 1).padStart(3, '0')}-2026`,
          vendor: formData.vendorName || 'Unknown Vendor',
          total: Number(formData.total) || 0,
          paymentStatus: formData.paymentStatus || 'Pending',
          deliveryStatus: formData.deliveryStatus || 'Received',
          date: formData.date || new Date().toISOString().split('T')[0],
        };
        setPurchases([newPurchase, ...purchases]);
        toast.success('Purchase invoice recorded locally');
      }
    } catch (err) {
      console.error('Error saving purchase order:', err);
      toast.error(err.response?.data?.message || 'Error processing purchase order');
    } finally {
      setShowModal(false);
    }
  };

  const columns = [
    { key: 'purchaseNo', label: 'Purchase No.' },
    { key: 'date', label: 'Date' },
    { key: 'vendor', label: 'Vendor' },
    { key: 'total', label: 'Total Amount', render: (val) => `₹${Number(val).toFixed(2)}` },
    {
      key: 'paymentStatus',
      label: 'Payment status',
      render: (val) => <StatusBadge status={val} />,
    },
    {
      key: 'deliveryStatus',
      label: 'Delivery status',
      render: (val) => <StatusBadge status={val} />,
    },
  ];

  const actions = [
    {
      label: 'View Invoice',
      className: 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-xs font-bold px-2 py-1 rounded-md transition-colors border border-indigo-100',
      handler: async (purchase) => {
        try {
          const res = await purchasesAPI.getById(purchase.id);
          if (res.success) {
            setViewingPurchase(res.purchase);
          }
        } catch {
          setViewingPurchase({
            ...purchase,
            items: [
              { name: 'Stock Product Line Item', quantity: 10, purchase_price: purchase.total / 10, gst: 18, total: purchase.total }
            ]
          });
        }
      }
    },
    ...(!isReadOnly ? [{
      label: 'Void Order',
      className: 'bg-danger-100 text-danger-700 hover:bg-danger-200 text-xs font-bold px-2 py-1 rounded-md transition-colors',
      handler: (purchase) => handleDeletePurchase(purchase),
    }] : [])
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Purchase Invoices</h1>
          <p className="text-slate-600 mt-1">Manage vendor purchases and stock intakes</p>
        </div>
        {!isReadOnly && (
          <button
            onClick={handleAddPurchase}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium shadow-soft"
          >
            <PlusIcon className="w-5 h-5" />
            Add Purchase Order
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-soft">
        <div className="mb-6">
          <SearchBar
            placeholder="Search by vendor name or purchase no..."
            onSearch={setSearchTerm}
          />
        </div>

        {loading ? (
          <div className="py-12 flex justify-center">
            <span className="text-sm font-semibold text-slate-500 animate-pulse">Loading purchase history...</span>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={filteredPurchases}
            actions={actions}
            itemsPerPage={10}
          />
        )}
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Record Supplier Purchase Invoice"
        size="3xl"
        noPadding={true}
      >
        <PurchaseForm
          onSubmit={handleSubmit}
          onCancel={() => setShowModal(false)}
        />
      </Modal>

      <ConfirmDialog
        isOpen={deleteConfirm.open}
        title="Void Purchase Order"
        message="Are you sure you want to void this purchase invoice? This will automatically reverse (deduct) the received quantities from the warehouse stock."
        confirmLabel="Void Invoice"
        cancelLabel="Cancel"
        type="danger"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirm({ open: false, id: null })}
      />

      {/* ── PROFESSIONAL ERP A4 PURCHASE INVOICE PREVIEW MODAL ── */}
      {viewingPurchase && (
        <Modal
          isOpen={!!viewingPurchase}
          onClose={() => setViewingPurchase(null)}
          title={`Purchase Invoice Document — ${viewingPurchase.purchaseNo || viewingPurchase.purchase_no || ''}`}
          size="5xl"
          noPadding={true}
          showCloseButton={true}
        >
          <div className="bg-slate-800/80 dark:bg-slate-950 flex flex-col max-h-[88vh] overflow-hidden">
            
            {/* Top Action Bar (Fixed) */}
            <div className="flex flex-wrap justify-between items-center bg-slate-900 text-white px-5 py-3.5 border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-600/20 text-emerald-400 rounded-lg border border-emerald-500/30">
                  <PrinterIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-white tracking-tight">Invoice Viewer &amp; Print Studio</h3>
                  <p className="text-[10px] text-slate-400 font-medium">Standard A4 Portrait PDF Format • Single Unified Component</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrintPastPurchase}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold active:scale-95 transition-all shadow-md shadow-emerald-600/20 cursor-pointer"
                >
                  <PrinterIcon className="w-4 h-4 text-emerald-100" />
                  Print A4 Invoice
                </button>
                <button
                  onClick={() => setViewingPurchase(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold active:scale-95 transition-all cursor-pointer border border-slate-700"
                >
                  Close
                </button>
              </div>
            </div>

            {/* Scrollable Document Container Backdrop */}
            <div className="flex-1 overflow-y-auto p-4 md:p-8 flex flex-col items-center justify-start bg-slate-700/30 dark:bg-slate-950/80">
              <div className="w-full max-w-[880px] shadow-2xl transition-all">
                <PurchaseInvoicePrintTemplate purchase={viewingPurchase} />
              </div>
            </div>

            {/* Hidden, print-ready document structure */}
            <div className="hidden">
              <div ref={printRef}>
                <PurchaseInvoicePrintTemplate purchase={viewingPurchase} />
              </div>
            </div>

          </div>
        </Modal>
      )}
    </div>
  );
};

export default PurchaseList;
