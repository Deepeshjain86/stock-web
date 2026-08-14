import { useState, useEffect } from 'react';

const CategoryForm = ({ category, onSubmit, onCancel }) => {
  
  const defaultState = {
    name: '',
    slug: '',
    sub_category: '',
    brand_name: '',
    description: '',
  };

  const [formData, setFormData] = useState({
    ...defaultState,
  });

  useEffect(() => {
    if (category) {
      setFormData({
        ...defaultState,
        ...category,
        sub_category: category.sub_category || '',
        brand_name: category.brand_name || '',
      });
    } else {
      setFormData({
        ...defaultState,
      });
    }
  }, [category]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'name') {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
        slug: value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 font-sans select-none p-2">
      
      {/* Category Name */}
      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1">Category Name <span className="text-rose-500">*</span></label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="e.g. Beverages"
          className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 bg-slate-50/50 font-semibold outline-none text-slate-800"
          required
        />
      </div>

      {/* Slug */}
      <div>
        <label className="block text-xs font-bold text-slate-550 mb-1">Slug URL Identifier</label>
        <input
          type="text"
          name="slug"
          value={formData.slug}
          readOnly
          placeholder="Generated automatically"
          className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-100/80 font-mono text-slate-500 outline-none"
        />
      </div>

      {/* Sub Category (Optional) */}
      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1">Sub Category <span className="text-slate-400 font-normal">(Optional)</span></label>
        <input
          type="text"
          name="sub_category"
          value={formData.sub_category}
          onChange={handleChange}
          placeholder="Sub Categorys"
          className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 bg-slate-50/50 font-semibold outline-none text-slate-800"
        />
      </div>

      {/* Company / Brand Name (Optional) */}
      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1">Company / Brand Name <span className="text-slate-400 font-normal">(Optional)</span></label>
        <input
          type="text"
          name="brand_name"
          value={formData.brand_name}
          onChange={handleChange}
          placeholder="e.g. Coca-Cola, Pepsi, Britannia"
          className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 bg-slate-50/50 font-semibold outline-none text-slate-800"
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Enter category description..."
          rows="3"
          className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 bg-slate-50/50 font-semibold outline-none text-slate-800 resize-none"
        />
      </div>



      {/* Form Buttons */}
      <div className="flex gap-3 justify-end pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-100 transition-colors text-xs font-bold active:scale-95 transition-all"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-[#1B6E4C] hover:bg-[#14523A] text-white rounded-xl transition-colors text-xs font-black shadow active:scale-95 transition-all"
        >
          {category ? 'Update' : 'Add'} Category
        </button>
      </div>
    </form>
  );
};

export default CategoryForm;
