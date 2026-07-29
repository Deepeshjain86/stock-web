import { useState, useEffect } from 'react';
import {
  UserGroupIcon,
  CalculatorIcon,
  PlusIcon,
  TrashIcon,
  BuildingStorefrontIcon,
  ReceiptPercentIcon,
  CalendarIcon,
  TagIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import { vendorsAPI, productsAPI } from '../../services/api';

const normProduct = (p) => ({
  id: p.id,
  name: p.name,
  barcode: p.barcode || p.bar_code || '',
  category: p.category_name || p.category || 'General',
  purchasePrice: Number(p.purchase_price ?? p.purchasePrice ?? 0),
  unit: p.unit || 'Pcs',
  gst: Number(p.gst ?? 18),
});

const PurchaseOrderForm = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    vendorId: '',
    warehouseId: '1', // Default Warehouse
    date: new Date().toISOString().split('T')[0],
    expectedDeliveryDate: '',
    items: [],
    notes: '',
  });

  const [dbVendors, setDbVendors] = useState([]);
  const [dbProducts, setDbProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [customPrice, setCustomPrice] = useState('');
  const [itemGst, setItemGst] = useState(18);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const loadFormData = async () => {
      try {
        const vRes = await vendorsAPI.getAll({ status: 'Active' });
        if (vRes.success) setDbVendors((vRes.vendors || []).filter((v) => v.status === 'Active'));
        const pRes = await productsAPI.getAll();
        if (pRes.success) setDbProducts((pRes.products || []).map(normProduct));
      } catch (err) {
        console.error('Failed to load vendors/products for purchase order form:', err);
        setDbVendors([]);
        setDbProducts([]);
      }
    };
    loadFormData();
  }, []);

  const handleAddItem = () => {
    if (!selectedProduct) return;

    const product = dbProducts.find((p) => String(p.id) === String(selectedProduct));
    if (!product) return;

    const rawPrice = customPrice !== '' ? parseFloat(customPrice) : product.purchasePrice;
    const price = isNaN(rawPrice) || rawPrice <= 0 ? 0 : rawPrice;
    const qty = Number(quantity) || 1;

    // Check duplicate
    const existsIndex = formData.items.findIndex(
      (item) => String(item.product_id) === String(selectedProduct)
    );

    if (existsIndex > -1) {
      const updated = [...formData.items];
      updated[existsIndex].quantity += qty;
      updated[existsIndex].total = updated[existsIndex].quantity * updated[existsIndex].purchase_price * (1 + updated[existsIndex].gst / 100);
      setFormData({ ...formData, items: updated });
    } else {
      const total = price * qty * (1 + itemGst / 100);
      const newItem = {
        product_id: product.id,
        name: product.name,
        barcode: product.barcode,
        quantity: qty,
        purchase_price: price,
        gst: itemGst,
        unit: product.unit,
        total,
      };
      setFormData({ ...formData, items: [...formData.items, newItem] });
    }

    // Reset item input
    setSelectedProduct('');
    setQuantity(1);
    setCustomPrice('');
    setItemGst(18);
  };

  const handleRemoveItem = (index) => {
    const updated = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: updated });
  };

  const calculateTotals = () => {
    let subtotal = 0;
    let gstAmount = 0;

    formData.items.forEach((item) => {
      const base = item.purchase_price * item.quantity;
      subtotal += base;
      gstAmount += base * (item.gst / 100);
    });

    const total = subtotal + gstAmount;

    return {
      subtotal,
      gstAmount,
      total,
    };
  };

  const { subtotal, gstAmount, total } = calculateTotals();

  const handleProductSelect = (prodId) => {
    setSelectedProduct(prodId);
    const p = dbProducts.find((x) => String(x.id) === String(prodId));
    if (p) {
      setCustomPrice(p.purchasePrice.toString());
      setItemGst(p.gst);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const tempErrors = {};
    if (!formData.vendorId) tempErrors.vendorId = 'Please select a vendor';
    if (formData.items.length === 0) tempErrors.items = 'Please add at least one item to order';

    if (Object.keys(tempErrors).length > 0) {
      setErrors(tempErrors);
      return;
    }

    onSubmit({
      vendor_id: Number(formData.vendorId),
      warehouse_id: Number(formData.warehouseId),
      date: formData.date,
      expected_delivery_date: formData.expectedDeliveryDate || null,
      subtotal,
      discount: 0,
      gst_amount: gstAmount,
      total,
      notes: formData.notes,
      items: formData.items,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-h-[85vh] overflow-y-auto px-1 pr-3 select-none">
      
      {/* 1. Header Metadata Section */}
      <div className="bg-slate-50/50 border border-slate-200/80 rounded-2xl p-5 grid grid-cols-1 md:grid-cols-4 gap-4">
        
        {/* Vendor */}
        <div className="space-y-1.5 col-span-1 md:col-span-2">
          <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <UserGroupIcon className="w-4 h-4 text-slate-400" />
            Select Vendor (Supplier) *
          </label>
          <select
            value={formData.vendorId}
            onChange={(e) => setFormData({ ...formData, vendorId: e.target.value })}
            className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:border-indigo-500"
          >
            <option value="">-- Choose Supplier --</option>
            {dbVendors.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name} {v.company_name ? `(${v.company_name})` : ''}
              </option>
            ))}
          </select>
          {errors.vendorId && <p className="text-[10px] font-black text-rose-500">{errors.vendorId}</p>}
        </div>

        {/* PO Date */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <CalendarIcon className="w-4 h-4 text-slate-400" />
            Order Date *
          </label>
          <input
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Expected Delivery Date */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <CalendarIcon className="w-4 h-4 text-slate-400" />
            Expected Delivery
          </label>
          <input
            type="date"
            value={formData.expectedDeliveryDate}
            onChange={(e) => setFormData({ ...formData, expectedDeliveryDate: e.target.value })}
            className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* 2. Item Entry Block */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 space-y-4">
        <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-1.5">
          <BuildingStorefrontIcon className="w-5 h-5 text-indigo-500" />
          Add Items to Order
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5 items-end">
          {/* Select Product */}
          <div className="sm:col-span-5 space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500">Product Name</label>
            <select
              value={selectedProduct}
              onChange={(e) => handleProductSelect(e.target.value)}
              className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-indigo-500"
            >
              <option value="">-- Choose Product --</option>
              {dbProducts.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} {p.barcode ? `(${p.barcode})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Expected Price */}
          <div className="sm:col-span-3 space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500">Expected Purchase Price (₹)</label>
            <input
              type="number"
              step="any"
              value={customPrice}
              onChange={(e) => setCustomPrice(e.target.value)}
              placeholder="Price"
              className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Quantity */}
          <div className="sm:col-span-2 space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500">Quantity</label>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value) || 1)}
              className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Add Button */}
          <div className="sm:col-span-2">
            <button
              type="button"
              onClick={handleAddItem}
              className="w-full flex items-center justify-center gap-1.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer"
            >
              <PlusIcon className="w-4 h-4 stroke-[2.5]" />
              Add
            </button>
          </div>
        </div>

        {errors.items && <p className="text-[10px] font-black text-rose-500 mt-1">{errors.items}</p>}

        {/* Items Table */}
        {formData.items.length > 0 && (
          <div className="border border-slate-100 rounded-xl overflow-hidden mt-3">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[10px] font-black text-slate-450 uppercase tracking-wider border-b border-slate-100">
                  <th className="py-2.5 px-3.5">#</th>
                  <th className="py-2.5 px-3.5">Product</th>
                  <th className="py-2.5 px-3.5 text-center">Qty</th>
                  <th className="py-2.5 px-3.5 text-right">Price</th>
                  <th className="py-2.5 px-3.5 text-center">GST %</th>
                  <th className="py-2.5 px-3.5 text-right">Total</th>
                  <th className="py-2.5 px-3.5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-bold text-slate-600">
                {formData.items.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/40">
                    <td className="py-2.5 px-3.5 text-slate-400 font-mono">{idx + 1}</td>
                    <td className="py-2.5 px-3.5 text-slate-850">
                      <p className="font-bold">{item.name}</p>
                      {item.barcode && <span className="text-[10px] font-semibold text-slate-400 font-mono">{item.barcode}</span>}
                    </td>
                    <td className="py-2.5 px-3.5 text-center tabular-nums text-slate-900">{item.quantity} {item.unit}</td>
                    <td className="py-2.5 px-3.5 text-right tabular-nums text-slate-900">₹{item.purchase_price.toFixed(2)}</td>
                    <td className="py-2.5 px-3.5 text-center tabular-nums text-slate-500">{item.gst}%</td>
                    <td className="py-2.5 px-3.5 text-right tabular-nums text-slate-900">₹{item.total.toFixed(2)}</td>
                    <td className="py-2.5 px-3.5 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="text-rose-500 hover:text-rose-700 active:scale-90 transition-all p-1 cursor-pointer"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 3. Bottom Summary & Notes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Notes */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <DocumentTextIcon className="w-4 h-4 text-slate-400" />
            Internal / Supplier Notes (Optional)
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Add special requests or terms to send to your supplier..."
            rows={4}
            className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:border-indigo-500 resize-none"
          />
        </div>

        {/* Totals card */}
        <div className="bg-slate-50/50 border border-slate-200/80 rounded-2xl p-5 space-y-3">
          <div className="flex justify-between items-center text-xs font-bold text-slate-500">
            <span>Sub Total:</span>
            <span className="font-mono text-slate-900">₹{subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center text-xs font-bold text-slate-500">
            <span>Tax (GST):</span>
            <span className="font-mono text-slate-900">₹{gstAmount.toFixed(2)}</span>
          </div>
          <hr className="border-slate-200/80" />
          <div className="flex justify-between items-center text-sm font-black text-slate-800">
            <span>Estimated Total:</span>
            <span className="font-mono text-indigo-650 text-base">₹{total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex justify-end items-center gap-3.5 border-t border-slate-100 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-5 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-655/10 transition-all active:scale-95 cursor-pointer"
        >
          Create Purchase Order
        </button>
      </div>

    </form>
  );
};

export default PurchaseOrderForm;
