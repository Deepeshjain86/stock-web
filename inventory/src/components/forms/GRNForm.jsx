import { useState } from 'react';
import {
  CalendarIcon,
  DocumentTextIcon,
  ArchiveBoxArrowDownIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';

const GRNForm = ({ purchaseOrder, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    notes: '',
    items: purchaseOrder.items.map((item) => ({
      product_id: item.product_id,
      name: item.product_name,
      ordered_quantity: item.quantity,
      previously_received: item.received_quantity || 0,
      quantity_received: 0,
      quantity_damaged: 0,
      quantity_rejected: 0,
      batch_number: '',
      mrp: item.mrp || item.max_retail_price || '',
      expiry_date: '',
    })),
  });

  const [errors, setErrors] = useState({});

  const handleItemChange = (index, field, value) => {
    const updated = [...formData.items];
    updated[index][field] = value;
    setFormData({ ...formData, items: updated });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const tempErrors = {};
    
    // Validate: At least one item should have positive quantity_received
    let totalReceived = 0;
    formData.items.forEach((item, idx) => {
      const rec = Number(item.quantity_received) || 0;
      const prev = Number(item.previously_received) || 0;
      const ord = Number(item.ordered_quantity) || 0;
      
      if (rec < 0) {
        tempErrors[`item_${idx}_received`] = 'Quantity cannot be negative';
      }
      if (rec + prev > ord) {
        tempErrors[`item_${idx}_received`] = `Total received (${rec + prev}) exceeds ordered quantity (${ord})`;
      }
      totalReceived += rec;
    });

    if (totalReceived <= 0) {
      tempErrors.items = 'Please receive at least one quantity for any product';
    }

    if (Object.keys(tempErrors).length > 0) {
      setErrors(tempErrors);
      return;
    }

    onSubmit({
      date: formData.date,
      notes: formData.notes,
      items: formData.items.map((item) => ({
        product_id: item.product_id,
        quantity_received: Number(item.quantity_received) || 0,
        quantity_damaged: Number(item.quantity_damaged) || 0,
        quantity_rejected: Number(item.quantity_rejected) || 0,
        batch_number: item.batch_number || null,
        mrp: item.mrp ? Number(item.mrp) : null,
        expiry_date: item.expiry_date || null,
      })),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-h-[85vh] overflow-y-auto px-1 pr-3 select-none">
      
      {/* Header Info */}
      <div className="bg-slate-50/50 border border-slate-200/80 rounded-2xl p-5 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Linked Purchase Order</span>
          <p className="text-xs font-black text-slate-850 mt-1">#{purchaseOrder.purchase_order_no}</p>
        </div>
        <div>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Supplier (Vendor)</span>
          <p className="text-xs font-black text-slate-850 mt-1">{purchaseOrder.vendor_name}</p>
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">GRN Receipt Date *</label>
          <input
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold focus:outline-none focus:border-indigo-500 mt-1"
          />
        </div>
      </div>

      {/* Items Receiving Details Grid */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 space-y-4">
        <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-1.5">
          <ArchiveBoxArrowDownIcon className="w-5 h-5 text-emerald-600" />
          Verify Delivered Quantities
        </h3>

        {errors.items && (
          <div className="bg-rose-50 border border-rose-100 rounded-xl p-3 flex items-center gap-2 text-[11px] font-bold text-rose-600">
            <ExclamationCircleIcon className="w-5 h-5 text-rose-500" />
            {errors.items}
          </div>
        )}

        <div className="space-y-4 divide-y divide-slate-100">
          {formData.items.map((item, idx) => {
            const remaining = item.ordered_quantity - item.previously_received;
            return (
              <div key={idx} className={`pt-4 first:pt-0 grid grid-cols-1 md:grid-cols-12 gap-3 items-start`}>
                
                {/* Product Name Label */}
                <div className="md:col-span-3">
                  <p className="text-xs font-bold text-slate-900 leading-snug">{item.name}</p>
                  <div className="flex flex-wrap items-center gap-1.5 mt-1 text-[10px] font-semibold">
                    <span className="bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">Ordered: {item.ordered_quantity}</span>
                    <span className="bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded">Received: {item.previously_received}</span>
                    <span className="bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded">Remaining: {remaining}</span>
                  </div>
                </div>

                {/* Received Qty */}
                <div className="md:col-span-2 space-y-1">
                  <label className="text-[10px] font-black text-slate-400">Qty Received *</label>
                  <input
                    type="number"
                    min="0"
                    max={remaining}
                    value={item.quantity_received}
                    onChange={(e) => handleItemChange(idx, 'quantity_received', Number(e.target.value) || 0)}
                    className="w-full bg-slate-50/50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold focus:outline-none focus:border-indigo-500"
                  />
                  {errors[`item_${idx}_received`] && (
                    <p className="text-[9px] font-black text-rose-500 leading-tight">{errors[`item_${idx}_received`]}</p>
                  )}
                </div>

                {/* Damaged Qty */}
                <div className="md:col-span-1 space-y-1">
                  <label className="text-[10px] font-black text-slate-400">Damaged</label>
                  <input
                    type="number"
                    min="0"
                    value={item.quantity_damaged}
                    onChange={(e) => handleItemChange(idx, 'quantity_damaged', Number(e.target.value) || 0)}
                    className="w-full bg-slate-50/50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-semibold focus:outline-none focus:border-indigo-500 text-center font-mono"
                  />
                </div>

                {/* Batch Number */}
                <div className="md:col-span-2 space-y-1">
                  <label className="text-[10px] font-black text-slate-400">Batch Number</label>
                  <input
                    type="text"
                    value={item.batch_number}
                    onChange={(e) => handleItemChange(idx, 'batch_number', e.target.value)}
                    placeholder="e.g. B-01"
                    className="w-full bg-slate-50/50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>

                {/* Batch MRP (Optional) */}
                <div className="md:col-span-2 space-y-1">
                  <label className="text-[10px] font-black text-slate-400 flex items-center justify-between">
                    <span>Batch MRP (₹)</span>
                    <span className="text-[8px] text-slate-400 font-normal">Optional</span>
                  </label>
                  <input
                    type="number"
                    value={item.mrp}
                    onChange={(e) => handleItemChange(idx, 'mrp', e.target.value)}
                    placeholder="e.g. 50.00"
                    className="w-full bg-slate-50/50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>

                {/* Expiry Date */}
                <div className="md:col-span-2 space-y-1">
                  <label className="text-[10px] font-black text-slate-400">Expiry Date</label>
                  <input
                    type="date"
                    value={item.expiry_date}
                    onChange={(e) => handleItemChange(idx, 'expiry_date', e.target.value)}
                    className="w-full bg-slate-50/50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-semibold focus:outline-none focus:border-indigo-500"
                  />
                </div>

              </div>
            );
          })}
        </div>
      </div>

      {/* Notes / Comments */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
          <DocumentTextIcon className="w-4 h-4 text-slate-400" />
          Delivery Verification Notes (Optional)
        </label>
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Log notes about delivery conditions, damaged item details, etc..."
          rows={3}
          className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:border-indigo-500 resize-none"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end items-center gap-3 border-t border-slate-100 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-5 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/10 transition-all active:scale-95 cursor-pointer"
        >
          Receive Goods (GRN)
        </button>
      </div>

    </form>
  );
};

export default GRNForm;
