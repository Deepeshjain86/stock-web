import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { 
  PlusIcon, 
  PencilSquareIcon, 
  MagnifyingGlassIcon,
  FunnelIcon,
  TagIcon,
  Squares2X2Icon,
  BuildingStorefrontIcon,
  XMarkIcon,
  CheckCircleIcon,
  ArrowPathRoundedSquareIcon
} from '@heroicons/react/24/outline';
import StatusBadge from '../../components/common/StatusBadge';
import { categoriesAPI, subCategoriesAPI, brandsAPI } from '../../services/api';
import { useAppSelector } from '../../store/hooks';

const CategoryList = () => {
  const { isDarkMode } = useAppSelector((state) => state.theme);
  
  // Navigation Tabs: 'main' (Add Category), 'sub' (Sub Category), 'brand' (Brand)
  const [activeTab, setActiveTab] = useState('main');

  // Loading States
  const [loading, setLoading] = useState(false);
  const [btnLoading, setBtnLoading] = useState(false);

  // Error & Toast Message
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Search & Filter States per tab
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Data Lists
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [brands, setBrands] = useState([]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [editId, setEditId] = useState(null);

  // Form Fields State
  const [formData, setFormData] = useState({
    name: '',
    category_id: '',
    description: '',
    status: 'Active'
  });

  // Load Data based on active tab
  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      if (activeTab === 'main') {
        const res = await categoriesAPI.getAll({ search: searchQuery, status: statusFilter });
        if (res.success) setCategories(res.categories || []);
      } else if (activeTab === 'sub') {
        const [subRes, catRes] = await Promise.all([
          subCategoriesAPI.getAll({ search: searchQuery, status: statusFilter }),
          categoriesAPI.getAll({ status: 'Active' })
        ]);
        if (subRes.success) setSubCategories(subRes.subCategories || []);
        if (catRes.success) setCategories(catRes.categories || []);
      } else if (activeTab === 'brand') {
        const res = await brandsAPI.getAll({ search: searchQuery, status: statusFilter });
        if (res.success) setBrands(res.brands || []);
      }
    } catch (err) {
      console.error('Failed to load master records:', err);
      setError(err.response?.data?.message || 'Failed to fetch database records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab, searchQuery, statusFilter]);

  // Open Modal for Add
  const handleOpenAddModal = () => {
    setModalMode('add');
    setEditId(null);
    setFormData({
      name: '',
      category_id: categories.length > 0 ? categories[0].id : '',
      description: '',
      status: 'Active'
    });
    setError('');
    setIsModalOpen(true);
  };

  // Open Modal for Edit
  const handleOpenEditModal = (item) => {
    setModalMode('edit');
    setEditId(item.id);
    setFormData({
      name: item.name || '',
      category_id: item.category_id || (categories.length > 0 ? categories[0].id : ''),
      description: item.description || '',
      status: item.status || 'Active'
    });
    setError('');
    setIsModalOpen(true);
  };

  // Close Modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setError('');
  };

  // Toast message helper
  const showSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  // Submit Form
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Name is required.');
      return;
    }
    if (activeTab === 'sub' && !formData.category_id) {
      setError('Parent Main Category is required.');
      return;
    }

    setBtnLoading(true);
    setError('');

    try {
      if (activeTab === 'main') {
        if (modalMode === 'add') {
          const res = await categoriesAPI.create({
            name: formData.name.trim(),
            description: formData.description,
            status: formData.status
          });
          if (res.success) showSuccess('Main Category created successfully!');
        } else {
          const res = await categoriesAPI.update(editId, {
            name: formData.name.trim(),
            description: formData.description,
            status: formData.status
          });
          if (res.success) showSuccess('Main Category updated successfully!');
        }
      } else if (activeTab === 'sub') {
        if (modalMode === 'add') {
          const res = await subCategoriesAPI.create({
            name: formData.name.trim(),
            category_id: formData.category_id,
            description: formData.description,
            status: formData.status
          });
          if (res.success) showSuccess('Sub Category created successfully!');
        } else {
          const res = await subCategoriesAPI.update(editId, {
            name: formData.name.trim(),
            category_id: formData.category_id,
            description: formData.description,
            status: formData.status
          });
          if (res.success) showSuccess('Sub Category updated successfully!');
        }
      } else if (activeTab === 'brand') {
        if (modalMode === 'add') {
          const res = await brandsAPI.create({
            name: formData.name.trim(),
            description: formData.description,
            status: formData.status
          });
          if (res.success) showSuccess('Brand created successfully!');
        } else {
          const res = await brandsAPI.update(editId, {
            name: formData.name.trim(),
            description: formData.description,
            status: formData.status
          });
          if (res.success) showSuccess('Brand updated successfully!');
        }
      }

      handleCloseModal();
      loadData();
    } catch (err) {
      console.error('Submit Master Error:', err);
      setError(err.response?.data?.message || 'Operation failed. Please check form values.');
    } finally {
      setBtnLoading(false);
    }
  };

  // Status Toggle Handler (Replaces Delete)
  const handleToggleStatus = async (id, currentStatus, name) => {
    const targetStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
    try {
      if (activeTab === 'main') {
        const res = await categoriesAPI.toggleStatus(id, targetStatus);
        if (res.success) showSuccess(`Main Category "${name}" status changed to ${targetStatus}`);
      } else if (activeTab === 'sub') {
        const res = await subCategoriesAPI.toggleStatus(id, targetStatus);
        if (res.success) showSuccess(`Sub Category "${name}" status changed to ${targetStatus}`);
      } else if (activeTab === 'brand') {
        const res = await brandsAPI.toggleStatus(id, targetStatus);
        if (res.success) showSuccess(`Brand "${name}" status changed to ${targetStatus}`);
      }
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to toggle status');
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {successMsg && (
        <div className="bg-emerald-500 text-white px-4 py-3 rounded-2xl shadow-lg flex items-center justify-between animate-slide-down">
          <div className="flex items-center gap-2 text-sm font-bold">
            <CheckCircleIcon className="w-5 h-5" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg('')} className="hover:opacity-75">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-2xl">
                <Squares2X2Icon className="w-6 h-6" />
              </span>
              <h1 className="text-xl font-black text-slate-900 dark:text-white">Category & Brand Masters</h1>
            </div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1 ml-10">
              Protected ERP Masters — Delete disabled to safeguard historical transaction records
            </p>
          </div>

          {/* Add Button */}
          <button
            onClick={handleOpenAddModal}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-2xl transition-all shadow-md shadow-indigo-200 dark:shadow-none"
          >
            <PlusIcon className="w-4 h-4 stroke-[3]" />
            <span>
              {activeTab === 'main' && 'Add Main Category'}
              {activeTab === 'sub' && 'Add Sub Category'}
              {activeTab === 'brand' && 'Add Brand'}
            </span>
          </button>
        </div>

        {/* NAVIGATION TABS */}
        <div className="flex items-center gap-2 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={() => { setActiveTab('main'); setSearchQuery(''); setStatusFilter(''); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
              activeTab === 'main'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <Squares2X2Icon className="w-4 h-4" />
            <span>Main Category</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] ${activeTab === 'main' ? 'bg-indigo-800 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'}`}>
              {categories.length}
            </span>
          </button>

          <button
            onClick={() => { setActiveTab('sub'); setSearchQuery(''); setStatusFilter(''); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
              activeTab === 'sub'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <TagIcon className="w-4 h-4" />
            <span>Sub Category</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] ${activeTab === 'sub' ? 'bg-indigo-800 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'}`}>
              {subCategories.length}
            </span>
          </button>

          <button
            onClick={() => { setActiveTab('brand'); setSearchQuery(''); setStatusFilter(''); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
              activeTab === 'brand'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <BuildingStorefrontIcon className="w-4 h-4" />
            <span>Brand Master</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] ${activeTab === 'brand' ? 'bg-indigo-800 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'}`}>
              {brands.length}
            </span>
          </button>
        </div>
      </div>

      {/* FILTER HUB & CONTROLS */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Search Box */}
          <div className="sm:col-span-2 relative">
            <MagnifyingGlassIcon className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder={`Search ${activeTab === 'main' ? 'Main Categories' : activeTab === 'sub' ? 'Sub Categories' : 'Brands'} by name...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs border border-slate-200 dark:border-slate-800 rounded-2xl focus:outline-none focus:border-indigo-500 font-semibold bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <FunnelIcon className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-800 rounded-2xl focus:outline-none focus:border-indigo-500 font-semibold bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
            >
              <option value="">All Statuses</option>
              <option value="Active">Active Only</option>
              <option value="Inactive">Inactive Only</option>
            </select>
          </div>
        </div>

        {/* LISTING TABLES */}
        <div className="overflow-x-auto rounded-2xl border border-slate-100 dark:border-slate-800">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 text-[10px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                <th className="py-3 px-4 w-16">S.No</th>
                <th className="py-3 px-4">
                  {activeTab === 'main' && 'Category Name'}
                  {activeTab === 'sub' && 'Sub Category Name'}
                  {activeTab === 'brand' && 'Brand Name'}
                </th>
                {activeTab === 'sub' && <th className="py-3 px-4">Parent Category</th>}
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4 w-32">Status</th>
                <th className="py-3 px-4 text-right w-36">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={activeTab === 'sub' ? 6 : 5} className="py-12 text-center text-slate-400 font-semibold animate-pulse">
                    Loading {activeTab} master records...
                  </td>
                </tr>
              ) : activeTab === 'main' ? (
                categories.length > 0 ? (
                  categories.map((cat, idx) => (
                    <tr key={cat.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-400">{idx + 1}</td>
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{cat.name}</td>
                      <td className="py-3 px-4 text-slate-500 max-w-xs truncate">{cat.description || '—'}</td>
                      <td className="py-3 px-4"><StatusBadge status={cat.status} /></td>
                      <td className="py-3 px-4 text-right space-x-2">
                        <button
                          onClick={() => handleOpenEditModal(cat)}
                          title="Edit Details"
                          className="px-2.5 py-1 text-slate-600 dark:text-slate-300 hover:text-indigo-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold inline-flex items-center gap-1"
                        >
                          <PencilSquareIcon className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>

                        <button
                          onClick={() => handleToggleStatus(cat.id, cat.status, cat.name)}
                          title="Toggle Active/Inactive"
                          className={`px-2.5 py-1 rounded-lg border font-bold inline-flex items-center gap-1 transition-all ${
                            cat.status === 'Active'
                              ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                          }`}
                        >
                          <ArrowPathRoundedSquareIcon className="w-3.5 h-3.5" />
                          <span>{cat.status === 'Active' ? 'Deactivate' : 'Activate'}</span>
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="py-12 text-center text-slate-400 font-semibold">No Main Categories found. Click "Add Main Category" to create one.</td>
                  </tr>
                )
              ) : activeTab === 'sub' ? (
                subCategories.length > 0 ? (
                  subCategories.map((sub, idx) => (
                    <tr key={sub.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-400">{idx + 1}</td>
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{sub.name}</td>
                      <td className="py-3 px-4 font-bold text-indigo-600 dark:text-indigo-400">{sub.category_name}</td>
                      <td className="py-3 px-4 text-slate-500 max-w-xs truncate">{sub.description || '—'}</td>
                      <td className="py-3 px-4"><StatusBadge status={sub.status} /></td>
                      <td className="py-3 px-4 text-right space-x-2">
                        <button
                          onClick={() => handleOpenEditModal(sub)}
                          title="Edit Details"
                          className="px-2.5 py-1 text-slate-600 dark:text-slate-300 hover:text-indigo-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold inline-flex items-center gap-1"
                        >
                          <PencilSquareIcon className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>

                        <button
                          onClick={() => handleToggleStatus(sub.id, sub.status, sub.name)}
                          title="Toggle Active/Inactive"
                          className={`px-2.5 py-1 rounded-lg border font-bold inline-flex items-center gap-1 transition-all ${
                            sub.status === 'Active'
                              ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                          }`}
                        >
                          <ArrowPathRoundedSquareIcon className="w-3.5 h-3.5" />
                          <span>{sub.status === 'Active' ? 'Deactivate' : 'Activate'}</span>
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="py-12 text-center text-slate-400 font-semibold">No Sub Categories found. Click "Add Sub Category" to create one.</td>
                  </tr>
                )
              ) : (
                brands.length > 0 ? (
                  brands.map((b, idx) => (
                    <tr key={b.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-400">{idx + 1}</td>
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{b.name}</td>
                      <td className="py-3 px-4 text-slate-500 max-w-xs truncate">{b.description || '—'}</td>
                      <td className="py-3 px-4"><StatusBadge status={b.status} /></td>
                      <td className="py-3 px-4 text-right space-x-2">
                        <button
                          onClick={() => handleOpenEditModal(b)}
                          title="Edit Details"
                          className="px-2.5 py-1 text-slate-600 dark:text-slate-300 hover:text-indigo-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold inline-flex items-center gap-1"
                        >
                          <PencilSquareIcon className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>

                        <button
                          onClick={() => handleToggleStatus(b.id, b.status, b.name)}
                          title="Toggle Active/Inactive"
                          className={`px-2.5 py-1 rounded-lg border font-bold inline-flex items-center gap-1 transition-all ${
                            b.status === 'Active'
                              ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                          }`}
                        >
                          <ArrowPathRoundedSquareIcon className="w-3.5 h-3.5" />
                          <span>{b.status === 'Active' ? 'Deactivate' : 'Activate'}</span>
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="py-12 text-center text-slate-400 font-semibold">No Brands found. Click "Add Brand" to create one.</td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl max-w-md w-full space-y-4 animate-scale-up">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                {modalMode === 'add' ? 'Add New' : 'Edit'}{' '}
                {activeTab === 'main' && 'Main Category'}
                {activeTab === 'sub' && 'Sub Category'}
                {activeTab === 'brand' && 'Brand Master'}
              </h3>
              <button onClick={handleCloseModal} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Error inside modal */}
            {error && (
              <div className="bg-rose-50 text-rose-700 text-xs font-bold p-3 rounded-xl border border-rose-200">
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name Field */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  {activeTab === 'main' && 'Category Name'}
                  {activeTab === 'sub' && 'Sub Category Name'}
                  {activeTab === 'brand' && 'Brand Name'} <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder={`Enter ${activeTab === 'main' ? 'Category' : activeTab === 'sub' ? 'Sub Category' : 'Brand'} Name...`}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 font-bold bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              {/* Parent Category Field (Only for Sub Category) */}
              {activeTab === 'sub' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Parent Category <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 font-bold bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="">Select Active Parent Category</option>
                    {categories.filter(c => c.status === 'Active').map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Status Field */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 font-bold bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              {/* Description Field */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Description
                </label>
                <textarea
                  rows="3"
                  placeholder="Optional brief description..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 font-medium bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 dark:text-slate-400 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={btnLoading}
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-md shadow-indigo-200 dark:shadow-none disabled:opacity-50"
                >
                  {btnLoading ? 'Saving...' : modalMode === 'add' ? 'Save Record' : 'Update Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryList;