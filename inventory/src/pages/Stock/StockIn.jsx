import { useState, useEffect } from 'react';
import { productsAPI, stockAPI } from '../../services/api';
import { useAppSelector } from '../../store/hooks';

const StockIn = ({ onStockChanged }) => {
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
      
      const logsRes = await stockAPI.getLogs({ type: 'Stock In', limit: 20 });
      if (logsRes.success) {
        setRecords(logsRes.logs);
      }
    } catch (err) {
      console.error('StockIn API error:', err);
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
      const payload = {
        productId: Number(formData.productId),
        warehouseId: Number(formData.warehouseId),
        quantity: Number(formData.quantity),
        reason: 'Stock In Record',
        remarks: `${formData.reference ? `Ref: ${formData.reference}. ` : ''}${formData.notes}`
      };

      const res = await stockAPI.adjust(payload);
      if (res.success) {
        setFormData({
          productId: '',
          warehouseId: '1',
          quantity: '',
          reference: '',
          notes: ''
        });
        fetchProductsAndLogs();
        // Notify parent to refresh the stock summary table
        if (onStockChanged) onStockChanged();
      }
    } catch (err) {
      console.error('Failed to log stock intake', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* FORM SIDE */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-soft h-fit">
          <h2 className="text-base font-bold text-slate-900 dark:text-white mb-4 uppercase tracking-wider">Record Stock Intake</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">Select Product *</label>
              <select
                name="productId"
                value={formData.productId}
                onChange={handleChange}
                disabled={isReadOnly}
                className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                required
              >
                <option value="">Choose item from catalogue...</option>
                {productList.map((prod) => (
                  <option key={prod.id} value={prod.id}>
                    {prod.name} ({prod.sku})
                  </option>
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
                className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
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
                placeholder="Enter intake count"
                className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">Reference (PO / Invoice)</label>
              <input
                type="text"
                name="reference"
                value={formData.reference}
                onChange={handleChange}
                disabled={isReadOnly}
                placeholder="e.g. PO-001 / Balaji Invoice"
                className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">Intake Notes</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                disabled={isReadOnly}
                rows="3"
                placeholder="Write optional notes..."
                className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
              />
            </div>

            {!isReadOnly ? (
              <button
                type="submit"
                disabled={submitting}
                className="w-full px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all active:scale-[0.99] cursor-pointer"
              >
                {submitting ? 'Confirming...' : 'Confirm Stock Intake'}
              </button>
            ) : (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-center text-[11px] font-bold text-amber-700 dark:text-amber-300">
                👁️ Monitoring Mode (Read-Only): Stock Intake entry is disabled.
              </div>
            )}
          </form>
        </div>

        {/* LOGS SIDE */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-soft">
          <h2 className="text-base font-bold text-slate-900 dark:text-white mb-4 uppercase tracking-wider">Recent Stock Intake Logs</h2>

          {loading ? (
            <p className="text-xs font-semibold text-slate-400">Loading intake logs...</p>
          ) : records.length === 0 ? (
            <p className="text-xs font-semibold text-slate-400">No stock intake transactions recorded yet.</p>
          ) : (
            <div className="space-y-3">
              {records.map((record) => (
                <div
                  key={record.id}
                  className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800 flex justify-between items-center"
                >
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white text-xs">{record.product_name || record.product}</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">{new Date(record.created_at || Date.now()).toLocaleString('en-IN')}</p>
                  </div>
                  <div className="text-right">
                    <span className="inline-block px-2 py-0.5 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 font-bold rounded text-xs">
                      +{record.quantity} Pcs
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default StockIn;
