import { useState, useEffect, useRef } from 'react';

const VendorForm = ({ vendor, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    company_name: '',
    contact_person: '',
    phone: '',
    alternate_phone: '',
    email: '',
    gstin: '',
    pan: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    categories_supplied: '',
    payment_terms: 'Net 30',
    credit_limit: '0.00',
    opening_balance: '0.00',
    opening_balance_type: 'Payable',
    status: 'Active',
    notes: '',
    bank_name: '',
    account_number: '',
    ifsc_code: ''
  });

  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Field Refs for focusing cursor on validation error
  const nameRef = useRef(null);
  const companyNameRef = useRef(null);
  const phoneRef = useRef(null);
  const emailRef = useRef(null);
  const gstinRef = useRef(null);
  const panRef = useRef(null);

  useEffect(() => {
    if (vendor) {
      setFormData({
        name: vendor.name || '',
        company_name: vendor.company_name || '',
        contact_person: vendor.contact_person || '',
        phone: vendor.phone || '',
        alternate_phone: vendor.alternate_phone || '',
        email: vendor.email || '',
        gstin: vendor.gstin || '',
        pan: vendor.pan || '',
        address: vendor.address || '',
        city: vendor.city || '',
        state: vendor.state || '',
        pincode: vendor.pincode || '',
        categories_supplied: vendor.categories_supplied || '',
        payment_terms: vendor.payment_terms || 'Net 30',
        credit_limit: vendor.credit_limit || '0.00',
        opening_balance: vendor.opening_balance || '0.00',
        opening_balance_type: vendor.opening_balance_type || 'Payable',
        status: vendor.status || 'Active',
        notes: vendor.notes || '',
        bank_name: vendor.bank_name || '',
        account_number: vendor.account_number || '',
        ifsc_code: vendor.ifsc_code || ''
      });
    }
  }, [vendor]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
    if (formError) {
      setFormError('');
    }
  };

  const focusAndScrollToField = (fieldName) => {
    const refMap = {
      name: nameRef,
      company_name: companyNameRef,
      phone: phoneRef,
      email: emailRef,
      gstin: gstinRef,
      pan: panRef
    };
    const targetRef = refMap[fieldName];
    if (targetRef && targetRef.current) {
      targetRef.current.focus();
      targetRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setErrors({});

    // Client-side quick validations
    const newErrors = {};

    if (!formData.name?.trim()) {
      newErrors.name = 'Supplier name is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      const firstInvalidField = Object.keys(newErrors)[0];
      focusAndScrollToField(firstInvalidField);
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(formData);
    } catch (err) {
      const apiMsg = err.response?.data?.message || err.message || 'Error saving supplier profile';
      const returnedField = err.response?.data?.field || null;
      setFormError(apiMsg);

      let targetField = returnedField;
      if (!targetField) {
        const lowerMsg = apiMsg.toLowerCase();
        if (lowerMsg.includes('gstin')) targetField = 'gstin';
        else if (lowerMsg.includes('mobile') || lowerMsg.includes('phone')) targetField = 'phone';
        else if (lowerMsg.includes('email')) targetField = 'email';
        else if (lowerMsg.includes('name')) targetField = 'name';
        else if (lowerMsg.includes('pan')) targetField = 'pan';
      }

      if (targetField) {
        setErrors({ [targetField]: apiMsg });
        focusAndScrollToField(targetField);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleFormSubmit} className="p-6 space-y-5 select-none overflow-y-auto max-h-[75vh]">
      {/* Top Error Banner */}
      {formError && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold text-rose-700 flex items-center justify-between shadow-sm animate-pulse">
          <div className="flex items-center gap-2">
            <span className="text-base">⚠️</span>
            <span>{formError}</span>
          </div>
        </div>
      )}

      {/* Basic Info Grid */}
      <div className="space-y-3">
        <h4 className="text-xs font-black text-emerald-800 uppercase tracking-wider border-b border-slate-100 pb-1">Supplier Profile Attributes</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">
              Supplier / Contact Person <span className="text-rose-500">*</span>
            </label>
            <input
              ref={nameRef}
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Contact person name"
              className={`w-full px-3 py-2 text-xs border rounded-xl focus:outline-none bg-slate-50/50 font-bold transition-all ${
                errors.name ? 'border-rose-500 ring-2 ring-rose-200 text-rose-900 bg-rose-50/30' : 'border-slate-200 focus:border-emerald-600 text-slate-800'
              }`}
            />
            {errors.name && (
              <p className="text-[10px] font-bold text-rose-600 mt-1 flex items-center gap-1">
                <span>⚠️</span> {errors.name}
              </p>
            )}
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">
              Company / Business Name <span className="text-rose-500">*</span>
            </label>
            <input
              ref={companyNameRef}
              type="text"
              name="company_name"
              value={formData.company_name || ''}
              onChange={handleChange}
              placeholder="Company / Business name"
              className={`w-full px-3 py-2 text-xs border rounded-xl focus:outline-none bg-slate-50/50 font-bold transition-all ${
                errors.company_name ? 'border-rose-500 ring-2 ring-rose-200 text-rose-900 bg-rose-50/30' : 'border-slate-200 focus:border-emerald-600 text-slate-800'
              }`}
            />
            {errors.company_name && (
              <p className="text-[10px] font-bold text-rose-600 mt-1 flex items-center gap-1">
                <span>⚠️</span> {errors.company_name}
              </p>
            )}
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Authorized Contact Person</label>
            <input
              type="text"
              name="contact_person"
              value={formData.contact_person || ''}
              onChange={handleChange}
              placeholder="Authorized contact person"
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600 bg-slate-50/50 font-bold text-slate-800"
            />
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">
              Mobile / Phone Number <span className="text-rose-500">*</span>
            </label>
            <input
              ref={phoneRef}
              type="text"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="10-digit mobile number"
              className={`w-full px-3 py-2 text-xs border rounded-xl focus:outline-none bg-slate-50/50 font-bold transition-all ${
                errors.phone ? 'border-rose-500 ring-2 ring-rose-200 text-rose-900 bg-rose-50/30' : 'border-slate-200 focus:border-emerald-600 text-slate-800'
              }`}
            />
            {errors.phone && (
              <p className="text-[10px] font-bold text-rose-600 mt-1 flex items-center gap-1">
                <span>⚠️</span> {errors.phone}
              </p>
            )}
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Alternate Mobile Number</label>
            <input
              type="text"
              name="alternate_phone"
              value={formData.alternate_phone || ''}
              onChange={handleChange}
              placeholder="Alternate mobile number"
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600 bg-slate-50/50 font-bold text-slate-800"
            />
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Email Address</label>
            <input
              ref={emailRef}
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Email address"
              className={`w-full px-3 py-2 text-xs border rounded-xl focus:outline-none bg-slate-50/50 font-bold transition-all ${
                errors.email ? 'border-rose-500 ring-2 ring-rose-200 text-rose-900 bg-rose-50/30' : 'border-slate-200 focus:border-emerald-600 text-slate-800'
              }`}
            />
            {errors.email && (
              <p className="text-[10px] font-bold text-rose-600 mt-1 flex items-center gap-1">
                <span>⚠️</span> {errors.email}
              </p>
            )}
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">GSTIN (Taxes) Registration</label>
            <input
              ref={gstinRef}
              type="text"
              name="gstin"
              value={formData.gstin || ''}
              onChange={handleChange}
              placeholder="15-digit GSTIN"
              className={`w-full px-3 py-2 text-xs border rounded-xl focus:outline-none bg-slate-50/50 font-mono font-bold transition-all ${
                errors.gstin ? 'border-rose-500 ring-2 ring-rose-200 text-rose-900 bg-rose-50/30' : 'border-slate-200 focus:border-emerald-600 text-slate-850'
              }`}
            />
            {errors.gstin && (
              <p className="text-[10px] font-bold text-rose-600 mt-1 flex items-center gap-1">
                <span>⚠️</span> {errors.gstin}
              </p>
            )}
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">PAN Card Number</label>
            <input
              ref={panRef}
              type="text"
              name="pan"
              value={formData.pan || ''}
              onChange={handleChange}
              placeholder="10-character PAN"
              className={`w-full px-3 py-2 text-xs border rounded-xl focus:outline-none bg-slate-50/50 font-mono font-bold transition-all ${
                errors.pan ? 'border-rose-500 ring-2 ring-rose-200 text-rose-900 bg-rose-50/30' : 'border-slate-200 focus:border-emerald-600 text-slate-850'
              }`}
            />
            {errors.pan && (
              <p className="text-[10px] font-bold text-rose-600 mt-1 flex items-center gap-1">
                <span>⚠️</span> {errors.pan}
              </p>
            )}
          </div>

          <div className="md:col-span-2">
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Product Categories Supplied</label>
            <input
              type="text"
              name="categories_supplied"
              value={formData.categories_supplied || ''}
              onChange={handleChange}
              placeholder="Product categories"
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600 bg-slate-50/50 font-bold text-slate-800"
            />
          </div>
        </div>
      </div>

      {/* Address & Locations */}
      <div className="space-y-3">
        <h4 className="text-xs font-black text-emerald-800 uppercase tracking-wider border-b border-slate-100 pb-1">Geographical Parameters</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="md:col-span-3">
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Complete Address</label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="Street / Shop address"
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600 bg-slate-50/50 font-bold text-slate-800"
            />
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">City</label>
            <input
              type="text"
              name="city"
              value={formData.city || ''}
              onChange={handleChange}
              placeholder="City"
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600 bg-slate-50/50 font-bold text-slate-800"
            />
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">State</label>
            <input
              type="text"
              name="state"
              value={formData.state || ''}
              onChange={handleChange}
              placeholder="State"
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600 bg-slate-50/50 font-bold text-slate-800"
            />
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Pincode</label>
            <input
              type="text"
              name="pincode"
              value={formData.pincode || ''}
              onChange={handleChange}
              placeholder="6-digit pincode"
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600 bg-slate-50/50 font-bold text-slate-800"
            />
          </div>
        </div>
      </div>

      {/* Payment & Status */}
      <div className="space-y-3">
        <h4 className="text-xs font-black text-emerald-800 uppercase tracking-wider border-b border-slate-100 pb-1">Payment & Status Specifications</h4>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Payment Terms</label>
            <select
              name="payment_terms"
              value={formData.payment_terms}
              onChange={handleChange}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600 bg-slate-50/50 font-bold text-slate-800"
            >
              <option value="Due on Receipt">Due on Receipt</option>
              <option value="Net 15">Net 15</option>
              <option value="Net 30">Net 30</option>
              <option value="Net 45">Net 45</option>
              <option value="Net 60">Net 60</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Credit Limit (₹)</label>
            <input
              type="number"
              step="0.01"
              name="credit_limit"
              value={formData.credit_limit || ''}
              onChange={handleChange}
              placeholder="Credit limit"
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600 bg-slate-50/50 font-bold text-slate-850"
            />
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Opening Balance (₹)</label>
            <input
              type="number"
              step="0.01"
              name="opening_balance"
              value={formData.opening_balance || ''}
              onChange={handleChange}
              placeholder="Opening balance"
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600 bg-slate-50/50 font-bold text-slate-850"
            />
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Balance Type</label>
            <select
              name="opening_balance_type"
              value={formData.opening_balance_type || 'Payable'}
              onChange={handleChange}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600 bg-slate-50/50 font-bold text-slate-850"
            >
              <option value="Payable">Payable (Credit Outstanding)</option>
              <option value="Advance">Advance Paid (Debit)</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Supplier Status</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600 bg-slate-50/50 font-bold text-slate-850"
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Financial Bank Details */}
      <div className="space-y-3">
        <h4 className="text-xs font-black text-emerald-800 uppercase tracking-wider border-b border-slate-100 pb-1">Settlement & Bank Details</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Bank Name</label>
            <input
              type="text"
              name="bank_name"
              value={formData.bank_name || ''}
              onChange={handleChange}
              placeholder="Bank name"
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600 bg-slate-50/50 font-bold text-slate-800"
            />
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Account Number</label>
            <input
              type="text"
              name="account_number"
              value={formData.account_number || ''}
              onChange={handleChange}
              placeholder="Account number"
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600 bg-slate-50/50 font-bold text-slate-800 font-mono"
            />
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">IFSC Code</label>
            <input
              type="text"
              name="ifsc_code"
              value={formData.ifsc_code || ''}
              onChange={handleChange}
              placeholder="IFSC code"
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600 bg-slate-50/50 font-bold text-slate-800 font-mono"
            />
          </div>
        </div>
      </div>

      {/* Notes Textarea */}
      <div>
        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Internal Administrative Notes</label>
        <textarea
          name="notes"
          value={formData.notes || ''}
          onChange={handleChange}
          rows="2"
          placeholder="Administrative notes..."
          className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600 bg-slate-50/50 font-bold text-slate-800"
        />
      </div>

      {/* Form Buttons */}
      <div className="flex gap-2 justify-end pt-4 border-t border-slate-100 dark:border-slate-800 sticky bottom-0 bg-white dark:bg-slate-900 py-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 transition-all cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="px-5 py-2 bg-emerald-600 dark:bg-emerald-600 hover:bg-emerald-700 dark:hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-all shadow-md active:scale-95 cursor-pointer disabled:opacity-50"
        >
          {submitting ? 'Saving...' : vendor ? 'Update Supplier Specs' : 'Save Supplier Partner'}
        </button>
      </div>
    </form>
  );
};

export default VendorForm;
