import { useState, useMemo, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PlusIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  ArrowPathIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  EllipsisVerticalIcon,
  EyeIcon,
  PencilIcon,
  DocumentDuplicateIcon,
  PrinterIcon,
  ArrowDownOnSquareIcon,
  ArrowUpOnSquareIcon,
  TrashIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ShoppingCartIcon,
  CurrencyDollarIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import Modal from '../../components/common/Modal';
import ProductForm from '../../components/forms/ProductForm';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import StatsCard from '../../components/common/StatsCard';
import ProductImportWizardModal from '../../components/products/ProductImportWizardModal';
import { productsAPI, categoriesAPI, stockAPI } from '../../services/api';
import { useAppSelector } from '../../store/hooks';
import { getImageUrl } from '../../utils/logoHelper';
const formatExpiryDate = (dateStr) => {
  if (!dateStr || dateStr === 'N/A' || dateStr === 'null' || dateStr === '0000-00-00') return 'N/A';
  const str = String(dateStr).trim();
  if (/^\d{2}[-/]\d{2}[-/]\d{4}/.test(str)) {
    return str.replace(/-/g, '/');
  }
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
    const parts = str.substring(0, 10).split('-');
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  const d = new Date(str);
  if (isNaN(d.getTime()) || d.getFullYear() < 2000) return 'N/A';
  return d.toLocaleDateString('en-IN');
};

const ProductList = () => {
  const { user } = useAppSelector((state) => state.auth);
  const isReadOnly = user?.role === 'Super Admin';

  const [products, setProducts] = useState([]);
  const [categoriesList, setCategoriesList] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, id: null });
  const [activeActionsMenu, setActiveActionsMenu] = useState(null);
  const [dbOffline, setDbOffline] = useState(false);
  const [loading, setLoading] = useState(true);

  // Search & Filter state variables
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [brandFilter, setBrandFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [priceRange, setPriceRange] = useState('All');
  const [sortBy, setSortBy] = useState('name-asc');

  // Pagination states
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Row selection & Import controls
  const [selectedRowIds, setSelectedRowIds] = useState([]);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  // Fetch products and categories directly from API
  const fetchProductsAndCategories = async () => {
    setLoading(true);
    try {
      try {
        const catData = await categoriesAPI.getAll();
        if (catData.success) {
          setCategoriesList(Array.isArray(catData.categories) ? catData.categories : []);
        }
      } catch (categoryError) {
        console.warn('Category list could not be loaded. Product registry will still load.', categoryError);
      }
      
      const prodData = await productsAPI.getAll();
      if (prodData.success) {
        const today = new Date();
        const productRows = Array.isArray(prodData.products) ? prodData.products : [];
        const mapped = productRows.map((p) => {
          const currentStock = Number(p.total_stock ?? 0);
          const minimumStock = Number(p.min_stock ?? 0);

          const isOut = currentStock <= 0;
          const isLow = currentStock > 0 && currentStock <= minimumStock;

          let isNear = false;
          let isExp = false;
          const expDateVal = currentStock > 0 ? (p.grn_expiry_date || p.expiry_date) : 'N/A';
          if (currentStock > 0 && expDateVal && expDateVal !== 'N/A') {
            const exp = new Date(expDateVal);
            if (!isNaN(exp.getTime())) {
              const diffTime = exp.getTime() - today.getTime();
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              if (diffDays <= 0) {
                isExp = true;
              } else if (diffDays <= 30) {
                isNear = true;
              }
            }
          }

          let status = 'In Stock';
          if (isOut) status = 'Out Of Stock';
          else if (isExp) status = 'Expired';
          else if (isLow) status = 'Low Stock';
          else if (isNear) status = 'Near Expiry';

          return {
            ...p,
            name: p.name || 'Unnamed Product',
            currentStock,
            minimumStock,
            purchasePrice: Number(p.purchase_price ?? 0),
            sellingPrice: Number(p.selling_price ?? 0),
            mrp: Number(p.grn_mrp || p.active_batch_mrp || p.mrp || 0),
            category: p.category_name,
            image: p.image_url || '📦',
            expiryDate: expDateVal,
            isOut,
            isLow,
            isNear,
            isExp,
            status
          };
        });
        setProducts(mapped);
      } else {
        setProducts([]);
      }
      setDbOffline(false);
    } catch (error) {
      console.error('Backend products API error:', error);
      setDbOffline(false);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductsAndCategories();
    const handleFocus = () => {
      fetchProductsAndCategories();
    };
    window.addEventListener('focus', handleFocus);
    window.addEventListener('stock-changed', handleFocus);
    window.addEventListener('inventory-updated', handleFocus);
    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('stock-changed', handleFocus);
      window.removeEventListener('inventory-updated', handleFocus);
    };
  }, []);

  // Filter pickers arrays
  const uniqueCategories = useMemo(() => ['All', ...new Set(products.map((p) => p.category).filter(Boolean))], [products]);
  const uniqueBrands = useMemo(() => ['All', ...new Set(products.map((p) => p.brand).filter(Boolean))], [products]);

  // Statistics counters
  const summaryCounters = useMemo(() => {
    let totalValuation = 0;
    let lowCount = 0;
    let outCount = 0;
    let nearExpCount = 0;

    products.forEach((p) => {
      totalValuation += (p.purchasePrice || 0) * (p.currentStock || 0);
      if (p.isLow || p.status === 'Low Stock') lowCount++;
      if (p.isOut || p.status === 'Out Of Stock') outCount++;
      if (p.isNear || p.status === 'Near Expiry') nearExpCount++;
    });

    return {
      total: products.length,
      valuation: totalValuation.toLocaleString('en-IN'),
      low: lowCount,
      out: outCount,
      nearExpiry: nearExpCount,
    };
  }, [products]);

  // Filter & search pipeline
  const processedProducts = useMemo(() => {
    let output = [...products];

    // Search Name, SKU, Barcode, or Brand
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      output = output.filter(
        (p) =>
          (p.name || '').toLowerCase().includes(q) ||
          (p.barcode && p.barcode.includes(q)) ||
          (p.brand && p.brand.toLowerCase().includes(q))
      );
    }

    // Direct Category Filter
    if (categoryFilter !== 'All') {
      output = output.filter((p) => p.category === categoryFilter);
    }

    // Direct Brand Filter
    if (brandFilter !== 'All') {
      output = output.filter((p) => p.brand === brandFilter);
    }

    // Direct Status Chip Flag Filter
    if (statusFilter !== 'All') {
      if (statusFilter === 'Low Stock') {
        output = output.filter((p) => p.isLow || p.status === 'Low Stock');
      } else if (statusFilter === 'Out Of Stock') {
        output = output.filter((p) => p.isOut || p.status === 'Out Of Stock');
      } else if (statusFilter === 'Near Expiry') {
        output = output.filter((p) => p.isNear || p.status === 'Near Expiry');
      } else if (statusFilter === 'Expired') {
        output = output.filter((p) => p.isExp || p.status === 'Expired');
      } else {
        output = output.filter((p) => p.status === statusFilter);
      }
    }

    // Price Range Filter
    if (priceRange !== 'All') {
      if (priceRange === 'under-50') output = output.filter((p) => p.sellingPrice < 50);
      else if (priceRange === '50-200') output = output.filter((p) => p.sellingPrice >= 50 && p.sellingPrice <= 200);
      else if (priceRange === 'above-200') output = output.filter((p) => p.sellingPrice > 200);
    }

    // Sorting options
    output.sort((a, b) => {
      if (sortBy === 'name-asc') return (a.name || '').localeCompare(b.name || '');
      if (sortBy === 'name-desc') return (b.name || '').localeCompare(a.name || '');
      if (sortBy === 'stock-desc') return b.currentStock - a.currentStock;
      if (sortBy === 'stock-asc') return a.currentStock - b.currentStock;
      if (sortBy === 'price-desc') return b.sellingPrice - a.sellingPrice;
      if (sortBy === 'price-asc') return a.sellingPrice - b.sellingPrice;
      return 0;
    });

    return output;
  }, [products, searchQuery, categoryFilter, brandFilter, statusFilter, priceRange, sortBy]);

  // Paginated viewport products
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    return processedProducts.slice(startIndex, startIndex + rowsPerPage);
  }, [processedProducts, currentPage, rowsPerPage]);

  const totalPages = Math.ceil(processedProducts.length / rowsPerPage) || 1;

  const handleResetFilters = () => {
    setSearchQuery('');
    setCategoryFilter('All');
    setBrandFilter('All');
    setStatusFilter('All');
    setPriceRange('All');
    setSortBy('name-asc');
    setCurrentPage(1);
  };

  const handleOpenAddForm = () => {
    setSelectedProduct(null);
    setShowModal(true);
  };

  const handleOpenEditForm = (product) => {
    setSelectedProduct(product);
    setShowModal(true);
    setActiveActionsMenu(null);
  };

  const handleDuplicateProduct = async (product) => {
    if (isReadOnly) return;
    try {
      const data = new FormData();
      data.append('name', `${product.name} (Copy)`);
      data.append('barcode', product.barcode ? `${product.barcode}99` : '');
      data.append('brand', product.brand || '');
      data.append('category_id', product.category_id || 1);
      data.append('unit', product.unit || 'Packet');
      data.append('sub_category', product.sub_category || '');
      data.append('measurement_value', product.measurement_value || '');
      data.append('purchase_price', product.purchasePrice || 0);
      data.append('selling_price', product.sellingPrice || 0);
      data.append('mrp', product.mrp || product.sellingPrice || 0);
      data.append('gst', product.gst || 0);
      data.append('min_stock', product.minimumStock || 5);
      data.append('max_stock', product.max_stock || 100);
      data.append('opening_stock', 0);
      data.append('description', product.description || '');

      await productsAPI.create(data);
      toast.success('Product duplicated successfully');
      fetchProductsAndCategories();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Duplicate failed');
    } finally {
      setActiveActionsMenu(null);
    }
  };

  const handleOpenDeleteConfirm = (product) => {
    setDeleteConfirm({ open: true, id: product.id });
    setActiveActionsMenu(null);
  };

  const executeProductDeletion = async () => {
    try {
      const res = await productsAPI.delete(deleteConfirm.id);
      if (res.success) {
        toast.success('Product deleted successfully');
        fetchProductsAndCategories();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Deletion failed. Historical sale/purchase records lock.');
    } finally {
      setDeleteConfirm({ open: false, id: null });
    }
  };

  const handleQuickStockIn = async (product) => {
    if (isReadOnly) return;
    try {
      await stockAPI.adjust({
        product_id: product.id,
        warehouse_id: 1,
        type: 'add',
        quantity: 10,
        notes: 'Quick Adjust In'
      });
      fetchProductsAndCategories();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Quick Stock In failed');
    } finally {
      setActiveActionsMenu(null);
    }
  };

  const handleQuickStockOut = async (product) => {
    if (isReadOnly) return;
    try {
      await stockAPI.adjust({
        product_id: product.id,
        warehouse_id: 1,
        type: 'subtract',
        quantity: 10,
        notes: 'Quick Adjust Out'
      });
      fetchProductsAndCategories();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Quick Stock Out failed');
    } finally {
      setActiveActionsMenu(null);
    }
  };

  const handleFormSubmission = async (formData) => {
    try {
      const data = new FormData();
      data.append('name', formData.name);
      data.append('barcode', formData.barcode || '');
      data.append('brand', formData.brand || '');
      if (formData.brand_id) data.append('brand_id', formData.brand_id);
      
      const matchedCat = categoriesList.find(c => String(c.id) === String(formData.category_id) || c.name === formData.category);
      const categoryId = formData.category_id || (matchedCat ? matchedCat.id : '');
      if (categoryId) data.append('category_id', categoryId);
      data.append('category', formData.category || (matchedCat ? matchedCat.name : ''));
      
      data.append('unit', formData.unit);
      data.append('sub_category', formData.sub_category || '');
      if (formData.sub_category_id) data.append('sub_category_id', formData.sub_category_id);
      data.append('measurement_value', formData.measurement_value || '');
      
      data.append('purchase_price', formData.purchasePrice || 0);
      data.append('selling_price', formData.sellingPrice || 0);
      data.append('mrp', formData.mrp || formData.sellingPrice || 0);
      data.append('gst', formData.gst || 0);
      data.append('min_stock', formData.minimumStock || 5);
      data.append('max_stock', formData.maximumStock || 100);
      data.append('expiry_date', formData.expiryDate || '');
      data.append('description', formData.description || '');
      data.append('opening_stock', formData.openingStock || 0);
      data.append('warehouse_id', 1);

      if (formData.imageFile) {
        data.append('image', formData.imageFile);
      }

      if (selectedProduct) {
        await productsAPI.update(selectedProduct.id, data);
        toast.success('Product details updated successfully');
      } else {
        await productsAPI.create(data);
        toast.success('New product added successfully');
      }
      fetchProductsAndCategories();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Save record failed');
    } finally {
      setShowModal(false);
      setSelectedProduct(null);
    }
  };

  // CSV Parsing Logic
  const parseCSV = (text) => {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    if (lines.length <= 1) return [];
    
    const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, ''));
    const parsed = [];
    
    for (let i = 1; i < lines.length; i++) {
      const row = lines[i].split(',').map(cell => cell.trim().replace(/^["']|["']$/g, ''));
      if (row.length === headers.length) {
        const obj = {};
        headers.forEach((header, index) => {
          obj[header] = row[index];
        });
        parsed.push(obj);
      }
    }
    return parsed;
  };

  const handleImportClick = () => {
    setShowImportModal(true);
  };

  // NATIVE EXPORT OPERATIONS
  const handleExportCSV = () => {
    const csvRows = [
      ["ID", "Name", "Barcode", "Category", "Sub Category", "Brand", "Unit", "Measurement Value", "Purchase Price", "Selling Price", "MRP", "GST", "Stock", "Expiry Date"]
    ];
    processedProducts.forEach(p => {
      csvRows.push([
        p.id,
        `"${p.name}"`,
        `"${p.barcode || ''}"`,
        `"${p.category || ''}"`,
        `"${p.sub_category || ''}"`,
        `"${p.brand || ''}"`,
        `"${p.unit || ''}"`,
        `"${p.measurement_value || ''}"`,
        p.purchasePrice || 0,
        p.sellingPrice || 0,
        p.mrp || 0,
        p.gst || 0,
        p.currentStock || 0,
        p.expiryDate || ''
      ]);
    });
    
    const csvContent = "data:text/csv;charset=utf-8," + csvRows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `products_export_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowExportMenu(false);
  };

  const handleExportExcel = () => {
    let excelTemplate = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Products</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head>
    <body><table>
      <tr>
        <th>ID</th><th>Name</th><th>Barcode</th><th>Category</th><th>Sub Category</th><th>Brand</th><th>Unit</th><th>Measurement Value</th><th>Purchase Price</th><th>Selling Price</th><th>MRP</th><th>GST</th><th>Stock</th>
      </tr>`;
    processedProducts.forEach(p => {
      excelTemplate += `<tr>
        <td>${p.id}</td><td>${p.name}</td><td>${p.barcode || ''}</td><td>${p.category || ''}</td><td>${p.sub_category || ''}</td><td>${p.brand || ''}</td><td>${p.unit || ''}</td><td>${p.measurement_value || ''}</td><td>${p.purchasePrice || 0}</td><td>${p.sellingPrice || 0}</td><td>${p.mrp || 0}</td><td>${p.gst || 0}</td><td>${p.currentStock || 0}</td>
      </tr>`;
    });
    excelTemplate += `</table></body></html>`;
    
    const blob = new Blob([excelTemplate], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `products_export_${new Date().toISOString().substring(0, 10)}.xls`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setShowExportMenu(false);
  };

  const handleExportPDF = () => {
    const printWindow = window.open('', '_blank');
    let printHtml = `<html><head><title>Product Catalog Report</title><style>
      body { font-family: sans-serif; padding: 20px; color: #182A20; }
      h1 { color: #1B6E4C; border-bottom: 2px solid #1B6E4C; padding-bottom: 8px; }
      table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 11px; }
      th { background: #EAF3EE; color: #1B6E4C; padding: 8px; text-align: left; border: 1px solid #DCEBE1; }
      td { padding: 8px; border: 1px solid #DCEBE1; }
      tr:nth-child(even) { background: #F6F7F2; }
      .footer { margin-top: 30px; font-size: 10px; color: #5C7A6B; text-align: center; }
    </style></head><body>
    <h1>Kirana ERP Product Catalog Report</h1>
    <p><strong>Generated On:</strong> ${new Date().toLocaleDateString('en-IN')}</p>
    <table>
      <thead>
        <tr>
          <th>Barcode</th><th>Name</th><th>Category</th><th>Brand</th><th>Stock</th><th>Purchase Price</th><th>Selling Price</th><th>MRP</th>
        </tr>
      </thead>
      <tbody>`;
    
    processedProducts.forEach(p => {
      printHtml += `<tr>
        <td>${p.barcode || ''}</td><td>${p.name}</td><td>${p.category || ''}</td><td>${p.brand || ''}</td><td>${p.currentStock || 0}</td><td>₹${p.purchasePrice || 0}</td><td>₹${p.sellingPrice || 0}</td><td>₹${p.mrp || 0}</td>
      </tr>`;
    });
    
    printHtml += `</tbody></table><div class="footer">Kirana ERP system report. Generated dynamically.</div></body></html>`;
    printWindow.document.write(printHtml);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
    setShowExportMenu(false);
  };

  // BARCODE PRINTER DIALOG
  const handlePrintBarcode = (p) => {
    const printWindow = window.open('', '_blank');
    const printHtml = `<html><head><title>Print Barcode Label</title><style>
      body { font-family: monospace; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 30px; }
      .label-card { border: 2px dashed #000; padding: 20px; text-align: center; width: 280px; border-radius: 12px; }
      .brand { font-size: 12px; font-weight: bold; margin-bottom: 2px; }
      .name { font-size: 14px; font-weight: 900; margin-bottom: 8px; }
      .barcode-lines { font-size: 28px; letter-spacing: 4px; margin: 10px 0; }
      .num { font-size: 11px; font-weight: bold; }
      .price { font-size: 16px; font-weight: bold; margin-top: 8px; color: #1B6E4C; }
    </style></head><body>
      <div class="label-card">
        <div class="brand">${p.brand || 'Kirana Store'}</div>
        <div class="name">${p.name}</div>
        <div class="barcode-lines">|||||I|||II|||II||||</div>
        <div class="num">${p.barcode || p.sku}</div>
        <div class="price">MRP: ₹${p.mrp || p.sellingPrice}</div>
      </div>
    </body></html>`;
    
    printWindow.document.write(printHtml);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
    setActiveActionsMenu(null);
  };

  // BULK OPERATIONS
  const handleBulkDelete = async () => {
    if (isReadOnly) return;
    const confirmMsg = `Are you sure you want to delete the ${selectedRowIds.length} selected products? This action will permanently remove their records.`;
    if (!window.confirm(confirmMsg)) return;

    setLoading(true);
    try {
      for (const id of selectedRowIds) {
        await productsAPI.delete(id);
      }
      toast.success(`Successfully deleted ${selectedRowIds.length} products.`);
      setSelectedRowIds([]);
      fetchProductsAndCategories();
    } catch (err) {
      toast.error('Error deleting one or more products: ' + (err.response?.data?.message || err.message));
      fetchProductsAndCategories();
    }
  };

  const handleRowSelectToggle = (id) => {
    if (selectedRowIds.includes(id)) {
      setSelectedRowIds(selectedRowIds.filter(rid => rid !== id));
    } else {
      setSelectedRowIds([...selectedRowIds, id]);
    }
  };

  const handleSelectAllToggle = () => {
    const paginatedIds = paginatedProducts.map(p => p.id);
    const allSelected = paginatedIds.every(id => selectedRowIds.includes(id));
    if (allSelected) {
      setSelectedRowIds(selectedRowIds.filter(id => !paginatedIds.includes(id)));
    } else {
      const newSelected = [...selectedRowIds];
      paginatedIds.forEach(id => {
        if (!newSelected.includes(id)) newSelected.push(id);
      });
      setSelectedRowIds(newSelected);
    }
  };

  const isAllPaginatedSelected = useMemo(() => {
    if (paginatedProducts.length === 0) return false;
    return paginatedProducts.map(p => p.id).every(id => selectedRowIds.includes(id));
  }, [paginatedProducts, selectedRowIds]);

  const fetchStatusChipStyles = (status) => {
    switch (status) {
      case 'In Stock':
        return 'bg-emerald-50 text-emerald-700 border border-emerald-250';
      case 'Low Stock':
        return 'bg-amber-50 text-amber-700 border border-amber-250 animate-pulse';
      case 'Out Of Stock':
        return 'bg-rose-50 text-rose-700 border border-rose-250';
      case 'Near Expiry':
        return 'bg-orange-50 text-orange-700 border border-orange-255';
      case 'Expired':
        return 'bg-purple-50 text-purple-700 border border-purple-255';
      default:
        return 'bg-slate-50 text-slate-700 border border-slate-250';
    }
  };

  return (
    <div className="space-y-6 pb-10 select-none">

      {/* APP HEADER WRAPPER CONTAINER BLOCK */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 border border-slate-200/80 rounded-2xl shadow-sm">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">Products</h1>
          <p className="text-xs font-medium text-slate-500 mt-0.5">Manage all inventory items</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {!isReadOnly && (
            <>
              <button 
                onClick={handleOpenAddForm}
                className="flex items-center gap-2 px-4 py-2 text-xs font-bold bg-[#1B6E4C] hover:bg-[#14523A] text-white rounded-xl shadow-md active:scale-95 transition-all"
              >
                <PlusIcon className="w-4 h-4 stroke-[3]" /> Add Product
              </button>
              <button 
                onClick={handleImportClick}
                className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold bg-slate-900 text-white rounded-xl hover:bg-slate-800 active:scale-95 transition-all"
              >
                <ArrowDownTrayIcon className="w-4 h-4" /> Import
              </button>
            </>
          )}

          {/* Export dropdown menu wrapper */}
          <div className="relative">
            <button 
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold bg-white text-slate-700 border border-slate-200 rounded-xl hover:bg-slate-50 active:scale-95 transition-all"
            >
              <ArrowUpTrayIcon className="w-4 h-4 text-slate-400" /> Export List
            </button>
            
            {showExportMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowExportMenu(false)} />
                <div className="absolute right-0 mt-2 w-44 bg-white border border-slate-200 rounded-xl shadow-lg z-50 py-1.5 transform origin-top-right transition-all">
                  <button onClick={handleExportCSV} className="w-full text-left px-4 py-2 hover:bg-slate-50 text-xs font-bold text-slate-650">Export as CSV</button>
                  <button onClick={handleExportExcel} className="w-full text-left px-4 py-2 hover:bg-slate-50 text-xs font-bold text-slate-650">Export as Excel</button>
                  <button onClick={handleExportPDF} className="w-full text-left px-4 py-2 hover:bg-slate-50 text-xs font-bold text-slate-650">Export as PDF (Print)</button>
                </div>
              </>
            )}
          </div>

          <button 
            onClick={fetchProductsAndCategories}
            className="p-2 bg-white text-slate-500 border border-slate-200 rounded-xl hover:text-slate-900 hover:bg-slate-50 transition-colors"
            title="Refresh Grid Data"
          >
            <ArrowPathIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* TOP SUMMARY CARDS AREA GRID */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4"
      >
        <StatsCard title="Total Products" value={summaryCounters.total} icon={ShoppingCartIcon} subtext="Catalog Lines" color="blue" />
        <StatsCard title="Inventory Value" value={`₹${summaryCounters.valuation}`} icon={CurrencyDollarIcon} subtext="Stock Worth" color="green" />
        <StatsCard title="Low Stock" value={summaryCounters.low} icon={ExclamationTriangleIcon} subtext="Action Required" color="orange" />
        <StatsCard title="Out Of Stock" value={summaryCounters.out} icon={ExclamationTriangleIcon} subtext="Zero Available" color="red" />
        <StatsCard title="Near Expiry" value={summaryCounters.nearExpiry} icon={ArrowPathIcon} subtext="Perishables" color="purple" />
      </motion.div>

      {/* STICKY BULK ACTIONS BANNER */}
      {selectedRowIds.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-indigo-50 border border-indigo-150 p-4 rounded-xl flex items-center justify-between shadow-sm select-none"
        >
          <span className="text-xs font-bold text-indigo-750">
            Selected {selectedRowIds.length} Products from catalog list
          </span>
          <div className="flex items-center gap-2">
            {!isReadOnly && (
              <button
                onClick={handleBulkDelete}
                className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[10px] font-black uppercase active:scale-95 transition-all flex items-center gap-1.5 shadow"
              >
                <TrashIcon className="w-3.5 h-3.5" /> Bulk Delete
              </button>
            )}
            <button
              onClick={() => setSelectedRowIds([])}
              className="px-3.5 py-1.5 border border-indigo-200 text-indigo-650 hover:bg-indigo-100/50 bg-white rounded-lg text-[10px] font-bold active:scale-95 transition-all"
            >
              Cancel Selection
            </button>
          </div>
        </motion.div>
      )}

      {/* FILTER CONTROLS HUB BLOCK PANEL */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4"
      >
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <FunnelIcon className="w-4 h-4 text-slate-400" />
          <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Advanced Inventory Search Matrix</h2>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          
          {/* Global Search Subsystem */}
          <div className="relative lg:col-span-2">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <MagnifyingGlassIcon className="w-4 h-4 text-slate-400" />
            </span>
            <input
              type="text"
              className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 bg-slate-50/50 text-slate-900 placeholder-slate-400 font-semibold outline-none"
              placeholder="Search by Product, Barcode, Brand..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            />
          </div>

          {/* Category Dropdown Picker */}
          <div>
            <select
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 bg-slate-50/50 text-slate-700 font-semibold"
              value={categoryFilter}
              onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
            >
              <option value="All">All Categories</option>
              {uniqueCategories.filter(c => c !== 'All').map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Brand Dropdown Picker */}
          <div>
            <select
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 bg-slate-50/50 text-[#4A6357] font-semibold"
              value={brandFilter}
              onChange={(e) => { setBrandFilter(e.target.value); setCurrentPage(1); }}
            >
              <option value="All">All Brands</option>
              {uniqueBrands.filter(b => b !== 'All').map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          {/* Stock Status Selector */}
          <div>
            <select
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 bg-slate-50/50 text-slate-700 font-semibold"
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            >
              <option value="All">All Statuses</option>
              <option value="In Stock">In Stock</option>
              <option value="Low Stock">Low Stock</option>
              <option value="Out Of Stock">Out Of Stock</option>
              <option value="Near Expiry">Near Expiry</option>
              <option value="Expired">Expired</option>
            </select>
          </div>

          {/* Price Range Segmentation */}
          <div>
            <select
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 bg-slate-50/50 text-slate-700 font-semibold"
              value={priceRange}
              onChange={(e) => { setPriceRange(e.target.value); setCurrentPage(1); }}
            >
              <option value="All">All Prices</option>
              <option value="under-50">Under ₹50</option>
              <option value="50-200">₹50 - ₹200</option>
              <option value="above-200">Above ₹200</option>
            </select>
          </div>

        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Sort By:</span>
            <select
              className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 bg-white text-slate-700 font-medium"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="name-asc">Product Name (A-Z)</option>
              <option value="name-desc">Product Name (Z-A)</option>
              <option value="stock-desc">Stock Vol (High-Low)</option>
              <option value="stock-asc">Stock Vol (Low-High)</option>
              <option value="price-desc">Price (High-Low)</option>
              <option value="price-asc">Price (Low-High)</option>
            </select>
          </div>
          <button
            onClick={handleResetFilters}
            className="w-full sm:w-auto px-4 py-1.5 text-xs font-bold text-red-650 hover:text-red-700 hover:bg-red-50/60 border border-slate-200 rounded-xl transition-all text-center"
          >
            Reset Filters
          </button>
        </div>
      </motion.div>

      {/* DATA GRID TABLE */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow shadow-sm overflow-hidden relative">
        {loading ? (
          <div className="flex flex-col justify-center items-center py-20 gap-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1B6E4C]" />
            <p className="text-xs font-bold text-slate-450">Loading product registry...</p>
          </div>
        ) : (
          <div className="overflow-x-auto min-h-[300px]">
            <table className="w-full text-left border-collapse table-auto">
              
              {/* TABLE HEADERS */}
              <thead className="sticky top-0 z-10 bg-slate-50 border-b border-slate-200/80 text-[11px] font-black text-slate-500 uppercase tracking-wider select-none">
                <tr>
                  <th className="py-3.5 px-4 text-center w-12 bg-slate-50">
                    <input 
                      type="checkbox" 
                      checked={isAllPaginatedSelected} 
                      onChange={handleSelectAllToggle}
                      className="rounded border-slate-300 text-[#1B6E4C] focus:ring-0 cursor-pointer h-4 w-4"
                    />
                  </th>
                  <th className="py-3.5 px-4 text-center w-12 bg-slate-50">Image</th>
                  <th className="py-3.5 px-4 min-w-[200px] bg-slate-50">Product Name</th>
                  <th className="py-3.5 px-4 bg-slate-50">Barcode</th>
                  <th className="py-3.5 px-4 bg-slate-50">Category</th>
                  <th className="py-3.5 px-4 bg-slate-50">Sub Category</th>
                  <th className="py-3.5 px-4 bg-slate-50">Brand</th>
                  <th className="py-3.5 px-4 text-right bg-slate-50">Purchase Price</th>
                  <th className="py-3.5 px-4 text-right bg-slate-50">Selling Price</th>
                  <th className="py-3.5 px-4 text-right bg-slate-50">MRP</th>
                  <th className="py-3.5 px-4 text-center bg-slate-50">GST</th>
                  <th className="py-3.5 px-4 text-center bg-slate-50">Current Stock</th>
                  <th className="py-3.5 px-4 whitespace-nowrap bg-slate-50">Expiry Date</th>
                  <th className="py-3.5 px-4 text-center bg-slate-50">Status</th>
                  <th className="py-3.5 px-4 text-center sticky right-0 bg-slate-50 shadow-[-6px_0_10px_-4px_rgba(0,0,0,0.04)] w-14 z-20">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-650">
                <AnimatePresence mode="popLayout">
                  {processedProducts.length > 0 ? (
                    paginatedProducts.map((p) => (
                      <motion.tr
                        key={p.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="hover:bg-slate-50/50 transition-colors duration-150 group"
                      >
                        <td className="py-3 px-4 text-center">
                          <input 
                            type="checkbox"
                            checked={selectedRowIds.includes(p.id)}
                            onChange={() => handleRowSelectToggle(p.id)}
                            className="rounded border-slate-300 text-[#1B6E4C] focus:ring-0 cursor-pointer h-4 w-4"
                          />
                        </td>
                        <td className="py-3 px-4 text-center">
                          {p.image_url ? (
                            <div className="relative w-16 h-16 mx-auto">
                              <img 
                                src={getImageUrl(p.image_url)} 
                                alt={p.name}
                                className="w-16 h-16 object-cover rounded-xl border border-slate-200 shadow-sm"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  if (e.target.nextSibling) {
                                    e.target.nextSibling.style.display = 'flex';
                                  }
                                }}
                              />
                              <div 
                                style={{ display: 'none' }}
                                className="w-16 h-16 items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200/80 text-xl font-normal text-slate-500"
                              >
                                📦
                              </div>
                            </div>
                          ) : (
                            <div className="w-16 h-16 flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200/80 mx-auto text-xl font-normal text-slate-500">
                              📦
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-800 group-hover:text-indigo-650 transition-colors">
                          <div>{p.name}</div>
                          <div className="text-[10px] font-semibold text-slate-400">
                            {p.measurement_value ? `${p.unit} (${p.measurement_value})` : p.unit}
                          </div>
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-500 text-[11px] tracking-tight">{p.barcode || 'N/A'}</td>
                        <td className="py-3 px-4 text-slate-600 font-semibold">{p.category}</td>
                        <td className="py-3 px-4 text-slate-500 font-medium">{p.sub_category || 'N/A'}</td>
                        <td className="py-3 px-4 text-slate-600">{p.brand || 'N/A'}</td>
                        <td className="py-3 px-4 text-right tabular-nums">₹{p.purchasePrice}</td>
                        <td className="py-3 px-4 text-right tabular-nums text-indigo-650 font-bold">₹{p.sellingPrice}</td>
                        <td className="py-3 px-4 text-right tabular-nums text-slate-400 line-through">₹{p.mrp}</td>
                        <td className="py-3 px-4 text-center text-slate-550 tabular-nums">{p.gst}%</td>
                        <td className={`py-3 px-4 text-center font-bold tabular-nums ${ (p.currentStock ?? 0) <= p.minimumStock ? 'text-rose-600' : 'text-slate-800'}`}>
                          {p.currentStock ?? 0}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-500 whitespace-nowrap">
                          {formatExpiryDate(p.expiryDate)}
                        </td>
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          <span className={`inline-block px-2.5 py-0.5 rounded-md text-[10px] font-bold tracking-tight ${fetchStatusChipStyles(p.status)}`}>
                            {p.status}
                          </span>
                        </td>
                        
                        {/* ROW ACTIONS MENU */}
                        <td className="py-3 px-4 text-center sticky right-0 bg-white group-hover:bg-slate-50/90 shadow-[-6px_0_10px_-4px_rgba(0,0,0,0.04)] transition-colors z-10">
                          <div className="relative inline-block text-left">
                            <button
                              onClick={() => setActiveActionsMenu(activeActionsMenu === p.id ? null : p.id)}
                              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60"
                            >
                              <EllipsisVerticalIcon className="w-4 h-4" />
                            </button>
                            
                            {activeActionsMenu === p.id && (
                              <>
                                <div className="fixed inset-0 z-40" onClick={() => setActiveActionsMenu(null)} />
                                <div className="absolute right-0 mt-1 w-44 bg-white rounded-xl shadow-xl border border-slate-200/85 z-50 py-1.5 text-left transform origin-top-right transition-all">
                                  {!isReadOnly && (
                                    <>
                                      <button onClick={() => handleOpenEditForm(p)} className="flex items-center gap-2 w-full px-3 py-1.5 hover:bg-slate-50 text-slate-700 text-[11px] font-semibold">
                                        <PencilIcon className="w-3.5 h-3.5 text-indigo-500" /> Edit details
                                      </button>
                                      <button onClick={() => handleDuplicateProduct(p)} className="flex items-center gap-2 w-full px-3 py-1.5 hover:bg-slate-50 text-slate-700 text-[11px] font-semibold">
                                        <DocumentDuplicateIcon className="w-3.5 h-3.5 text-emerald-500" /> Duplicate
                                      </button>
                                    </>
                                  )}
                                  <button onClick={() => handlePrintBarcode(p)} className="flex items-center gap-2 w-full px-3 py-1.5 hover:bg-slate-50 text-slate-700 text-[11px] font-semibold">
                                    <PrinterIcon className="w-3.5 h-3.5 text-purple-500" /> Print label
                                  </button>
                                  {!isReadOnly && (
                                    <>
                                      <div className="h-px bg-slate-100 my-1" />
                                      <button onClick={() => handleOpenDeleteConfirm(p)} className="flex items-center gap-2 w-full px-3 py-1.5 hover:bg-rose-50 text-rose-600 text-[11px] font-bold">
                                        <TrashIcon className="w-3.5 h-3.5" /> Delete product
                                      </button>
                                    </>
                                  )}
                                </div>
                              </>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={18} className="py-16 px-4 text-center">
                        <div className="max-w-md mx-auto flex flex-col items-center justify-center space-y-3">
                          <span className="text-5xl">📦</span>
                          <h3 className="text-sm font-bold text-slate-900 tracking-tight">No Products Found</h3>
                          <p className="text-xs text-slate-400 leading-normal">No items match your filters or search query parameters.</p>
                          {!isReadOnly && (
                            <button
                              onClick={handleOpenAddForm}
                              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-[#1B6E4C] hover:bg-[#14523A] text-white rounded-xl shadow transition-colors"
                            >
                              <PlusIcon className="w-3.5 h-3.5 stroke-[3]" /> Add Product
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </AnimatePresence>
              </tbody>

            </table>
          </div>
        )}

        {/* DATA TABLE PAGINATION NAV ENGINE BAR */}
        <div className="bg-slate-50/50 px-6 py-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-medium text-slate-500 select-none font-semibold">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span>Rows Per Page:</span>
              <select
                className="px-2 py-1 border border-slate-200 rounded-lg bg-white font-semibold text-slate-700 focus:outline-none focus:border-indigo-500"
                value={rowsPerPage}
                onChange={(e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}
              >
                {[10, 25, 50, 100].map((rows) => (
                  <option key={rows} value={rows}>{rows}</option>
                ))}
              </select>
            </div>
            <span>
              Showing <span className="text-slate-900 font-bold">{processedProducts.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1}</span> to{' '}
              <span className="text-slate-900 font-bold">{Math.min(currentPage * rowsPerPage, processedProducts.length)}</span> of{' '}
              <span className="text-slate-900 font-bold">{processedProducts.length}</span> entries
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((c) => Math.max(c - 1, 1))}
              disabled={currentPage === 1}
              className="p-1.5 border border-slate-200 rounded-lg bg-white text-slate-655 hover:bg-slate-50 disabled:opacity-45 disabled:pointer-events-none transition-colors"
            >
              <ChevronLeftIcon className="w-4 h-4" />
            </button>
            
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-7 h-7 font-bold rounded-lg border text-center flex items-center justify-center transition-all ${
                  currentPage === page
                    ? 'bg-[#1B6E4C] text-white border-[#1B6E4C] shadow-md'
                    : 'bg-white text-slate-650 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {page}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage((c) => Math.min(c + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-1.5 border border-slate-200 rounded-lg bg-white text-slate-655 hover:bg-slate-50 disabled:opacity-45 disabled:pointer-events-none transition-colors"
            >
              <ChevronRightIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>

      {/* ADD/EDIT MODAL PORTAL */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setSelectedProduct(null);
        }}
        title={
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/40 text-[#1B6E4C] rounded-xl shadow-sm">
              <span className="text-lg">📦</span>
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-white tracking-tight">
                {selectedProduct ? 'Modify Product Specifications' : 'Register New Inventory Product'}
              </h2>
              <p className="text-[10px] font-bold text-slate-405 dark:text-slate-500 mt-0.5">Kirana Store Inventory ERP Control</p>
            </div>
          </div>
        }
        size="6xl"
      >
        <ProductForm
          product={selectedProduct}
          categories={categoriesList}
          onSubmit={handleFormSubmission}
          readOnly={isReadOnly}
          onCancel={() => {
            setShowModal(false);
            setSelectedProduct(null);
          }}
        />
      </Modal>

      {/* ENTERPRISE PRODUCT IMPORT WIZARD MODAL */}
      <ProductImportWizardModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onSuccess={fetchProductsAndCategories}
      />

      {/* COMPREHENSIVE ACTION DELETION DIALOG */}
      <ConfirmDialog
        isOpen={deleteConfirm.open}
        title="Confirm Catalog Deletion"
        message="Are you certain you wish to purge this product node from the ERP register? All stock totals, valuation figures, and configurations will be permanently removed. This configuration mapping step cannot be undone."
        confirmLabel="Purge Product Record"
        cancelLabel="Abort Action"
        type="danger"
        onConfirm={executeProductDeletion}
        onCancel={() => setDeleteConfirm({ open: false, id: null })}
      />

    </div>
  );
};

export default ProductList;
