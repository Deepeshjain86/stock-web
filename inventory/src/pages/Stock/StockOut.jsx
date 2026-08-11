import { useState, useEffect } from 'react';
import { productsAPI, stockAPI } from '../../services/api';
import { useAppSelector } from '../../store/hooks';

const StockOut = ({ onStockChanged }) => {
  const { user } = useAppSelector((state) => state.auth);
  const isReadOnly = user?.role === 'Super Admin';

  const [formData, setFormData] = useState({
    productId: '',
    warehouseId: '1', // default Main Storage
    quantity: '',
    reference: '',
    notes: '',
  });
  const [records, setRecords] = useState([]);
  const [productList, setProductList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [dbOffline, setDbOffline] = useState(false);

  const fetchProductsAndLogs = async () => {
    setLoading(true);
    try {
      const prodRes = await productsAPI.getAll();
      if (prodRes.success) {
        setProductList(prodRes.products);
      }
      
      const logsRes = await stockAPI.getLogs({ type: 'Stock Out', limit: 20 });
      if (logsRes.success) {
        setRecords(logsRes.logs);
      }
    } catch (err) {
      console.error('StockOut API error:', err);
      setDbOffline(false);
      setProductList([]);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductsAndLogs();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isReadOnly || !formData.productId || !formData.quantity) return;

    setSubmitting(true);
    try {
      if (!dbOffline) {
        await stockAPI.adjust({
          product_id: Number(formData.productId),
          warehouse_id: Number(formData.warehouseId),
          type: 'subtract',
          quantity: Number(formData.quantity),
          notes: formData.notes || `Issued out: Ref ${formData.reference}`
        });
        fetchProductsAndLogs();
        // Notify parent to refresh the stock summary table
        if (onStockChanged) onStockChanged();
      } else {
        const matchedProd = productList.find(p => p.id === Number(formData.productId));
        const newRecord = {
          id: records.length + 1,
          product_name: matchedProd ? matchedProd.name : 'Unknown Product',
          sku: matchedProd ? matchedProd.sku : 'N/A',
          warehouse_name: formData.warehouseId === '1' ? 'Main Storage' : 'Retail Shelf',
          quantity: -Number(formData.quantity),
          notes: formData.notes,
          created_at: new Date().toISOString()
        };
        setRecords([newRecord, ...records]);
      }
      setFormData({ productId: '', warehouseId: '1', quantity: '', reference: '', notes: '' });
    } catch (err) {
      console.error('Stock Out failed:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Stock Outbound</h1>
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">Deduct goods or write-off expired stock out of warehouse storage inventory</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="lg:col-span-1 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-soft h-fit">
          <h2 className="text-base font-bold text-slate-900 dark:text-white mb-4 uppercase tracking-wider">Stock Outbound Release</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">Select Product</label>
              <select
                name="productId"
                value={formData.productId}
                onChange={handleChange}
                disabled={isReadOnly}
                className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 bg-slate-50 dark:bg-slate-800 font-bold text-slate-900 dark:text-white"
                required
              >
                <option value="">Choose item...</option>
                {productList.map((p) => (
                  <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">Warehouse Location</label>
              <select
                name="warehouseId"
                value={formData.warehouseId}
                onChange={handleChange}
                disabled={isReadOnly}
                className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 bg-slate-50 dark:bg-slate-800 font-bold text-slate-900 dark:text-white"
              >
                <option value="1">Main Storage</option>
                <option value="2">Retail Counter Shelf</option>
                <option value="3">Cold Storage</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">Quantity</label>
              <input
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                disabled={isReadOnly}
                placeholder="Enter outbound count"
                className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 bg-slate-50 dark:bg-slate-800 font-bold text-slate-900 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">Reference (Sales / Damaged / Expiry)</label>
              <input
                type="text"
                name="reference"
                value={formData.reference}
                onChange={handleChange}
                disabled={isReadOnly}
                placeholder="e.g. Sales checkout / Spoiled waste write-off"
                className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 bg-slate-50 dark:bg-slate-800 font-semibold text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">Outbound Notes</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                disabled={isReadOnly}
                rows="3"
                placeholder="Write optional notes..."
                className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 bg-slate-50 dark:bg-slate-800 font-semibold text-slate-900 dark:text-white"
              />
            </div>

            {!isReadOnly ? (
              <button
                type="submit"
                disabled={submitting}
                className="w-full px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all active:scale-[0.99] cursor-pointer"
              >
                {submitting ? 'Confirming...' : 'Confirm Stock Release'}
              </button>
            ) : (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-center text-[11px] font-bold text-amber-700 dark:text-amber-300">
                👁️ Monitoring Mode (Read-Only): Stock Outbound entry is disabled.
              </div>
            )}
          </form>
        </div>

        {/* Records */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-soft">
          <h2 className="text-base font-bold text-slate-900 dark:text-white mb-4 uppercase tracking-wider">Recent Stock Outbound Entries</h2>
          {loading ? (
            <div className="py-12 text-center text-slate-400 font-semibold animate-pulse text-xs">Loading records...</div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {records.map((record) => (
                <div key={record.id} className="border border-slate-100 dark:border-slate-800 rounded-xl p-4 bg-slate-50/50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-black text-slate-900 dark:text-white text-xs">{record.product_name || record.product}</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold mt-0.5">
                        Location: {record.warehouse_name} • {new Date(record.created_at).toLocaleString('en-IN')}
                      </p>
                    </div>
                    <span className="text-md font-bold text-rose-600 dark:text-rose-400">{record.quantity} Pcs</span>
                  </div>
                  {record.notes && (
                    <p className="text-xs text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-900 p-2 rounded-lg font-medium">{record.notes}</p>
                  )}
                </div>
              ))}
              {records.length === 0 && (
                <p className="text-center text-slate-400 py-8 text-xs font-semibold">No stock outbound movements logged yet.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StockOut;
