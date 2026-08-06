import { useState, useEffect } from 'react';
import { 
  BuildingStorefrontIcon, 
  XMarkIcon,
  ArrowPathIcon,
  PlusCircleIcon
} from '@heroicons/react/24/outline';
import { categoriesAPI, subCategoriesAPI, brandsAPI } from '../../services/api';

const ProductForm = ({ product, categories = [], onSubmit, onCancel, readOnly = false }) => {
  
  const defaultState = {
    name: '',
    category: '',
    category_id: '',
    sub_category: '',
    sub_category_id: '',
    brand: '',
    brand_id: '',
    unit: 'Packet',
    measurement_value: '',
    description: '',
    image: '📦',
    purchasePrice: '',
    sellingPrice: '',
    mrp: '',
    gst: '0',
    openingStock: '0',
    minimumStock: '5',
    maximumStock: '100',
    manufacturingDate: '',
    expiryDate: '',
  };

  const [formData, setFormData] = useState({ ...defaultState });
  const [errors, setErrors] = useState({});
  const [dbCategories, setDbCategories] = useState([]);
  const [dbSubCategories, setDbSubCategories] = useState([]);
  const [dbBrands, setDbBrands] = useState([]);
  const [loadingMasters, setLoadingMasters] = useState(true);
  const [masterFetchError, setMasterFetchError] = useState(null);
  const [isCustomSubCategory, setIsCustomSubCategory] = useState(false);
  const [isCustomBrand, setIsCustomBrand] = useState(false);

  const fetchMasters = async () => {
    setLoadingMasters(true);
    setMasterFetchError(null);
    try {
      const [catRes, subRes, brandRes] = await Promise.all([
        categoriesAPI.getAll({ status: 'Active' }),
        subCategoriesAPI.getAll({ status: 'Active' }),
        brandsAPI.getAll({ status: 'Active' })
      ]);
      const cats = catRes.success ? (catRes.categories || []) : [];
      const subs = subRes.success ? (subRes.subCategories || []) : [];
      const brands = brandRes.success ? (brandRes.brands || []) : [];
      setDbCategories(cats);
      setDbSubCategories(subs);
      setDbBrands(brands);
    } catch (err) {
      console.error('Failed to load ProductForm dropdown masters:', err);
      setMasterFetchError('Failed to load master dropdown data from server.');
    } finally {
      setLoadingMasters(false);
    }
  };

  useEffect(() => {
    fetchMasters();
  }, []);

  // Selected Main Category Object
  const selectedCatObj = dbCategories.find(c => 
    (formData.category_id && String(c.id) === String(formData.category_id)) ||
    (formData.category && c.name.toLowerCase() === formData.category.toLowerCase())
  );

  // Active Sub Categories belonging to selected Main Category
  const activeSubCategories = selectedCatObj
    ? dbSubCategories.filter(s => String(s.category_id) === String(selectedCatObj.id))
    : [];

  // Parse incoming product props and pre-fill form
  useEffect(() => {
    if (product) {
      const catMatch = dbCategories.find(c => 
        (product.category_id && String(c.id) === String(product.category_id)) || 
        (product.category && c.name.toLowerCase() === product.category.toLowerCase()) ||
        (product.category_name && c.name.toLowerCase() === product.category_name.toLowerCase())
      );

      const subMatch = dbSubCategories.find(s => 
        (product.sub_category_id && String(s.id) === String(product.sub_category_id)) ||
        (product.sub_category && s.name.toLowerCase() === product.sub_category.toLowerCase())
      );

      const brandMatch = dbBrands.find(b => 
        (product.brand_id && String(b.id) === String(product.brand_id)) ||
        (product.brand && b.name.toLowerCase() === product.brand.toLowerCase())
      );

      const catName = catMatch ? catMatch.name : (product.category_name || product.category || '');
      const catId = catMatch ? catMatch.id : (product.category_id || '');

      const subName = subMatch ? subMatch.name : (product.sub_category || '');
      const subId = subMatch ? subMatch.id : (product.sub_category_id || '');

      const brandName = brandMatch ? brandMatch.name : (product.brand || '');
      const brandId = brandMatch ? brandMatch.id : (product.brand_id || '');

      setFormData({
        ...defaultState,
        ...product,
        category: catName,
        category_id: catId,
        sub_category: subName,
        sub_category_id: subId,
        brand: brandName,
        brand_id: brandId,
        measurement_value: product.measurement_value || '',
        purchasePrice: product.purchasePrice ?? product.purchase_price ?? '',
        sellingPrice: product.sellingPrice ?? product.selling_price ?? '',
        minimumStock: product.minimumStock ?? product.min_stock ?? '5',
        maximumStock: product.maximumStock ?? product.max_stock ?? '100',
        manufacturingDate: product.manufacturingDate ?? (product.manufacturing_date ? product.manufacturing_date.substring(0, 10) : ''),
        expiryDate: product.expiryDate ?? (product.expiry_date ? product.expiry_date.substring(0, 10) : ''),
      });

      if (subName && !subMatch && dbSubCategories.length > 0) {
        setIsCustomSubCategory(true);
      } else {
        setIsCustomSubCategory(false);
      }

      if (brandName && !brandMatch && dbBrands.length > 0) {
        setIsCustomBrand(true);
      } else {
        setIsCustomBrand(false);
      }
    } else {
      setFormData(defaultState);
      setIsCustomBrand(false);
      setIsCustomSubCategory(false);
    }
    setErrors({});
  }, [product, dbCategories, dbSubCategories, dbBrands]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'category_id' || name === 'category') {
      const selectedCat = dbCategories.find(c => String(c.id) === String(value) || c.name === value);
      setFormData((prev) => ({ 
        ...prev, 
        category: selectedCat ? selectedCat.name : '', 
        category_id: selectedCat ? selectedCat.id : '',
        sub_category: '',
        sub_category_id: '',
      }));
      setIsCustomSubCategory(false);
    } else if (name === 'sub_category_id' || name === 'sub_category') {
      if (value === 'Custom') {
        setIsCustomSubCategory(true);
        setFormData((prev) => ({ 
          ...prev, 
          sub_category: '',
          sub_category_id: ''
        }));
      } else {
        setIsCustomSubCategory(false);
        const selectedSub = dbSubCategories.find(s => String(s.id) === String(value) || s.name === value);
        setFormData((prev) => ({ 
          ...prev, 
          sub_category: selectedSub ? selectedSub.name : value,
          sub_category_id: selectedSub ? selectedSub.id : ''
        }));
      }
    } else if (name === 'customSubCategory') {
      setFormData((prev) => ({ ...prev, sub_category: value, sub_category_id: '' }));
    } else if (name === 'brand_select' || name === 'brand') {
      if (value === 'Custom') {
        setIsCustomBrand(true);
        setFormData((prev) => ({ 
          ...prev, 
          brand: '',
          brand_id: ''
        }));
      } else {
        setIsCustomBrand(false);
        const selectedBr = dbBrands.find(b => String(b.id) === String(value) || b.name === value);
        setFormData((prev) => ({ 
          ...prev, 
          brand: selectedBr ? selectedBr.name : value,
          brand_id: selectedBr ? selectedBr.id : ''
        }));
      }
    } else if (name === 'customBrand') {
      setFormData((prev) => ({ ...prev, brand: value, brand_id: '' }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }

    if (errors[name] || (name === 'category_id' && errors.category) || (name === 'brand_select' && errors.brand)) {
      setErrors((prev) => ({ ...prev, [name]: null, category: null, brand: null }));
    }
  };

  const handleReset = () => {
    if (product) {
      setFormData({ ...defaultState, ...product });
    } else {
      setFormData(defaultState);
      setIsCustomBrand(false);
      setIsCustomSubCategory(false);
    }
    setErrors({});
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Product name is required';
    if (!formData.category_id && !formData.category) newErrors.category = 'Main Category is required';
    if (!formData.brand_id && !formData.brand) newErrors.brand = 'Brand is required';
    if (!formData.unit) newErrors.unit = 'Unit is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      const firstError = Object.keys(newErrors)[0];
      const element = document.getElementsByName(firstError)[0];
      if (element) element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    onSubmit({
      ...formData,
      openingStock: formData.openingStock || '0',
    });
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 select-none">
      
      {/* Scrollable Form Body Container */}
      <fieldset disabled={readOnly} className="flex-grow p-6 space-y-6 overflow-y-visible bg-slate-50/30 dark:bg-slate-950/20">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* CARD 1: BASIC PRODUCT INFORMATION (Full Width) */}
          <div className="md:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm space-y-4">
            <h3 className="text-xs font-black text-[#1B6E4C] dark:text-[#4FBE8B] uppercase tracking-wider pb-2 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
              <span>📋</span> Basic Product Information
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              
              {/* Product Name */}
              <div className="sm:col-span-2 md:col-span-3">
                <label className="block text-[10px] font-black text-slate-505 dark:text-slate-400 uppercase tracking-widest mb-1">
                  Product Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Product Name"
                  className={`w-full px-3 py-2 text-xs border rounded-xl focus:outline-none focus:border-emerald-500 dark:focus:border-emerald-500 font-semibold bg-slate-50/50 dark:bg-slate-950/20 text-slate-800 dark:text-slate-100 placeholder-slate-400 outline-none ${errors.name ? 'border-rose-500 bg-rose-50/20' : 'border-slate-200 dark:border-slate-850'}`}
                />
                {errors.name && <p className="text-[10px] font-bold text-rose-600 mt-1">{errors.name}</p>}
              </div>

              {/* Unit */}
              <div>
                <label className="block text-[10px] font-black text-slate-505 dark:text-slate-400 uppercase tracking-widest mb-1">
                  Unit (Measurement Parameter) <span className="text-rose-500">*</span>
                </label>
                <select
                  name="unit"
                  value={formData.unit}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-emerald-500 dark:focus:border-emerald-500 bg-slate-50/50 dark:bg-slate-950/20 font-bold text-slate-800 dark:text-slate-205 outline-none cursor-pointer"
                >
                  <option value="Packet">Packet</option>
                  <option value="Bottle">Bottle</option>
                  <option value="Box">Box</option>
                  <option value="Kg">Kg (Kilogram)</option>
                  <option value="Grams">Grams (g)</option>
                  <option value="Litre">Litre (L)</option>
                  <option value="Ml">Ml (Millilitre)</option>
                  <option value="Sachet">Sachet</option>
                  <option value="Piece">Piece / Pcs</option>
                  <option value="Carton">Carton</option>
                  <option value="Dozen">Dozen</option>
                  <option value="Meter">Meter</option>
                </select>
              </div>


              {/* Product Image File */}
              <div className="sm:col-span-1 md:col-span-1">
                <label className="block text-[10px] font-black text-slate-505 dark:text-slate-400 uppercase tracking-widest mb-1">Product Image File</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      if (file.size > 25 * 1024 * 1024) {
                        toast.error('Selected image exceeds 25MB limit.');
                        e.target.value = '';
                        return;
                      }
                      setFormData((prev) => ({ ...prev, imageFile: file, image: file.name }));
                    }
                  }}
                  className="w-full px-3 py-1.5 text-xs border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-emerald-500 dark:focus:border-emerald-500 bg-slate-50/50 dark:bg-slate-950/20 text-slate-600 dark:text-slate-455 font-semibold outline-none cursor-pointer"
                />
              </div>

            </div>
          </div>

          {/* CARD 2: CATEGORY & CLASSIFICATION (Full Width) */}
          <div className="md:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm space-y-4">
            <h3 className="text-xs font-black text-[#1B6E4C] dark:text-[#4FBE8B] uppercase tracking-wider pb-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
              <span className="flex items-center gap-2">🏷️ Category &amp; Classification</span>
              {loadingMasters && <span className="text-[10px] font-bold text-amber-600 animate-pulse">Loading active masters...</span>}
            </h3>
            
            {masterFetchError && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between text-xs text-rose-700 font-bold">
                <span>{masterFetchError}</span>
                <button type="button" onClick={fetchMasters} className="underline hover:text-rose-900">Retry</button>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              
              {/* 1. Main Category Dropdown */}
              <div>
                <label className="block text-[10px] font-black text-slate-505 dark:text-slate-400 uppercase tracking-widest mb-1">
                  Main Category <span className="text-rose-500">*</span>
                </label>
                <select
                  name="category_id"
                  value={formData.category_id || (selectedCatObj ? selectedCatObj.id : '')}
                  onChange={handleChange}
                  disabled={loadingMasters}
                  className={`w-full px-3 py-2 text-xs border rounded-xl focus:outline-none focus:border-emerald-500 dark:focus:border-emerald-500 bg-slate-50/50 dark:bg-slate-950/20 font-semibold text-slate-800 dark:text-slate-100 outline-none cursor-pointer disabled:opacity-50 ${errors.category ? 'border-rose-500 bg-rose-50/20' : 'border-slate-200 dark:border-slate-850'}`}
                >
                  <option value="">Select Main Category</option>
                  {dbCategories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
                {errors.category && <p className="text-[10px] font-bold text-rose-600 mt-1">{errors.category}</p>}
              </div>

              {/* 2. Sub Category Dropdown */}
              <div>
                <label className="block text-[10px] font-black text-slate-505 dark:text-slate-400 uppercase tracking-widest mb-1">
                  Sub Category
                </label>
                <select
                  name="sub_category_id"
                  value={isCustomSubCategory ? 'Custom' : (formData.sub_category_id || (dbSubCategories.find(s => s.name === formData.sub_category)?.id || ''))}
                  onChange={handleChange}
                  disabled={!formData.category_id && !formData.category}
                  className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-emerald-500 dark:focus:border-emerald-500 bg-slate-50/50 dark:bg-slate-950/20 font-semibold text-slate-800 dark:text-slate-100 outline-none disabled:opacity-50 cursor-pointer"
                >
                  {!formData.category_id && !formData.category ? (
                    <option value="">Select Main Category First</option>
                  ) : activeSubCategories.length === 0 ? (
                    <option value="" disabled>No Sub Categories Available</option>
                  ) : (
                    <option value="">Select Sub Category</option>
                  )}
                  
                  {activeSubCategories.map((sub) => (
                    <option key={sub.id} value={sub.id}>{sub.name}</option>
                  ))}
                  
                  {(formData.category_id || formData.category) && (
                    <option value="Custom">+ Add Custom Sub Category...</option>
                  )}
                </select>

                {isCustomSubCategory && (
                  <input
                    type="text"
                    name="customSubCategory"
                    value={formData.sub_category}
                    onChange={handleChange}
                    placeholder="Enter custom sub category..."
                    className="w-full px-3 py-2 mt-2 text-xs border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-emerald-500 dark:focus:border-emerald-500 bg-white dark:bg-slate-900 font-semibold text-slate-800 dark:text-slate-100 outline-none"
                  />
                )}
              </div>

              {/* 3. Brand Dropdown (Mandatory) */}
              <div>
                <label className="block text-[10px] font-black text-slate-505 dark:text-slate-400 uppercase tracking-widest mb-1">
                  Brand Name <span className="text-rose-500">*</span>
                </label>
                <select
                  name="brand_select"
                  value={isCustomBrand ? 'Custom' : (formData.brand_id || (dbBrands.find(b => b.name === formData.brand)?.id || ''))}
                  onChange={handleChange}
                  disabled={loadingMasters}
                  className={`w-full px-3 py-2 text-xs border rounded-xl focus:outline-none focus:border-emerald-500 dark:focus:border-emerald-500 bg-slate-50/50 dark:bg-slate-950/20 font-semibold text-slate-800 dark:text-slate-100 outline-none cursor-pointer disabled:opacity-50 ${errors.brand ? 'border-rose-500 bg-rose-50/20' : 'border-slate-200 dark:border-slate-850'}`}
                >
                  <option value="">Select Brand</option>
                  {dbBrands.map((br) => (
                    <option key={br.id} value={br.id}>{br.name}</option>
                  ))}
                  <option value="Custom">+ Add Custom Brand...</option>
                </select>
                {errors.brand && <p className="text-[10px] font-bold text-rose-600 mt-1">{errors.brand}</p>}

                {isCustomBrand && (
                  <input
                    type="text"
                    name="customBrand"
                    value={formData.brand}
                    onChange={handleChange}
                    placeholder="Enter custom brand name..."
                    className="w-full px-3 py-2 mt-2 text-xs border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-emerald-500 dark:focus:border-emerald-500 bg-white dark:bg-slate-900 font-semibold text-slate-800 dark:text-slate-100 outline-none"
                  />
                )}
              </div>

            </div>
          </div>

          {/* CARD 3: PRICING & TAX */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm space-y-4">
            <h3 className="text-xs font-black text-[#1B6E4C] dark:text-[#4FBE8B] uppercase tracking-wider pb-2 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
              <span>💰</span> Pricing &amp; Tax Parameters
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              {/* Purchase Price */}
              <div>
                <label className="block text-[10px] font-black text-slate-505 dark:text-slate-400 uppercase tracking-widest mb-1">Purchase Price (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  name="purchasePrice"
                  value={formData.purchasePrice}
                  onChange={handleChange}
                  placeholder="0.00"
                  className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-emerald-500 dark:focus:border-emerald-500 bg-slate-50/50 dark:bg-slate-950/20 font-semibold text-slate-808 dark:text-slate-100 placeholder-slate-400 outline-none"
                />
              </div>

              {/* Selling Price */}
              <div>
                <label className="block text-[10px] font-black text-slate-505 dark:text-slate-400 uppercase tracking-widest mb-1">Selling Price (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  name="sellingPrice"
                  value={formData.sellingPrice}
                  onChange={handleChange}
                  placeholder="0.00"
                  className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-emerald-500 dark:focus:border-emerald-500 bg-slate-50/50 dark:bg-slate-950/20 font-semibold text-slate-808 dark:text-slate-100 placeholder-slate-400 outline-none"
                />
              </div>

              {/* MRP */}
              <div>
                <label className="block text-[10px] font-black text-slate-505 dark:text-slate-400 uppercase tracking-widest mb-1">MRP (Max Retail Price ₹)</label>
                <input
                  type="number"
                  step="0.01"
                  name="mrp"
                  value={formData.mrp}
                  onChange={handleChange}
                  placeholder="0.00"
                  className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-emerald-500 dark:focus:border-emerald-500 bg-slate-50/50 dark:bg-slate-950/20 font-semibold text-slate-808 dark:text-slate-100 placeholder-slate-400 outline-none"
                />
              </div>

              {/* GST */}
              <div>
                <label className="block text-[10px] font-black text-slate-505 dark:text-slate-400 uppercase tracking-widest mb-1">GST Rate (%)</label>
                <select
                  name="gst"
                  value={formData.gst}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-emerald-500 dark:focus:border-emerald-500 bg-slate-50/50 dark:bg-slate-950/20 font-semibold text-slate-808 dark:text-slate-205 outline-none cursor-pointer"
                >
                  <option value="0">0% (GST Exempt)</option>
                  <option value="5">5%</option>
                  <option value="12">12%</option>
                  <option value="18">18%</option>
                  <option value="28">28%</option>
                </select>
              </div>
            </div>
          </div>

          {/* CARD 4: INVENTORY DETAILS (Full Width) */}
          <div className="md:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm space-y-4">
            <h3 className="text-xs font-black text-[#1B6E4C] dark:text-[#4FBE8B] uppercase tracking-wider pb-2 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
              <span>📦</span> Stock Control
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Minimum Alert Stock */}
              <div>
                <label className="block text-[10px] font-black text-slate-505 dark:text-slate-400 uppercase tracking-widest mb-1">Min Stock Alert Threshold</label>
                <input
                  type="number"
                  name="minimumStock"
                  value={formData.minimumStock}
                  onChange={handleChange}
                  placeholder="5"
                  className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-emerald-500 dark:focus:border-emerald-500 bg-slate-50/50 dark:bg-slate-950/20 font-semibold text-slate-800 dark:text-slate-100 placeholder-slate-400 outline-none"
                />
              </div>

              {/* Maximum Capacity Stock */}
              <div>
                <label className="block text-[10px] font-black text-slate-505 dark:text-slate-400 uppercase tracking-widest mb-1">Max Storage Capacity</label>
                <input
                  type="number"
                  name="maximumStock"
                  value={formData.maximumStock}
                  onChange={handleChange}
                  placeholder="100"
                  className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-emerald-500 dark:focus:border-emerald-500 bg-slate-50/50 dark:bg-slate-950/20 font-semibold text-slate-800 dark:text-slate-100 placeholder-slate-400 outline-none"
                />
              </div>
            </div>
          </div>

          {/* CARD 5: ADDITIONAL INFORMATION (Full Width) */}
          <div className="md:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm space-y-4">
            <h3 className="text-xs font-black text-[#1B6E4C] dark:text-[#4FBE8B] uppercase tracking-wider pb-2 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
              <span>✍️</span> Storage Description Notes
            </h3>
            
            <div>
              <label className="block text-[10px] font-black text-slate-550 dark:text-slate-400 uppercase tracking-widest mb-1">Product Description Notes</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="2"
                placeholder="Enter dynamic storage instructions, pack benefits, or description notes..."
                className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-emerald-500 dark:focus:border-emerald-500 bg-slate-50/50 dark:bg-slate-950/20 font-semibold text-slate-800 dark:text-slate-100 placeholder-slate-400 outline-none resize-none"
              />
            </div>
          </div>

        </div>
      </fieldset>

      {/* STICKY FOOTER ACTIONS */}
      <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 bg-slate-50 dark:bg-slate-950/50 border-t border-slate-200 dark:border-slate-800 sticky bottom-0 z-30 shadow-[0_-4px_12px_rgba(0,0,0,0.02)]">
        {!readOnly ? (
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 transition-all cursor-pointer bg-white dark:bg-slate-900"
          >
            <ArrowPathIcon className="w-4 h-4 stroke-[2]" /> Reset Form
          </button>
        ) : (
          <div className="text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200/50 px-3 py-1.5 rounded-xl">
            ⚠️ Viewing in Read-Only Mode
          </div>
        )}
        
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-350 rounded-xl text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 transition-all cursor-pointer bg-white dark:bg-slate-900"
          >
            Close View
          </button>
          {!readOnly && (
            <button
              type="button"
              onClick={handleSubmit}
              className="flex items-center gap-1.5 px-5 py-2 bg-[#1B6E4C] hover:bg-[#14523A] text-white rounded-xl text-xs font-bold shadow-md shadow-[#1B6E4C]/10 active:scale-95 transition-all cursor-pointer"
            >
              <PlusCircleIcon className="w-4 h-4 stroke-[2]" /> Save Product Record
            </button>
          )}
        </div>
      </div>

    </div>
  );
};

export default ProductForm;