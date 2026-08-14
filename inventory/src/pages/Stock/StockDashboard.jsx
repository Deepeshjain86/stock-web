import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowPathIcon,
  MagnifyingGlassIcon,
  CircleStackIcon,
  ExclamationTriangleIcon,
  MinusCircleIcon,
  ClockIcon,
  CurrencyRupeeIcon,
  AdjustmentsHorizontalIcon,
  DocumentTextIcon,
  CubeIcon,
  TruckIcon,
  TrashIcon
} from '@heroicons/react/24/outline';

// Import child components
import StockAdjustment from './StockAdjustment';
import StockHistory from './StockHistory';
import StockIn from './StockIn';
import StockOut from './StockOut';
import VendorReturnManagement from './VendorReturnManagement';
import StockDestroy from './StockDestroy';
import StockTransfer from './StockTransfer';
import PurchaseList from '../Purchase/PurchaseList';
import PurchaseOrderList from '../Purchase/PurchaseOrderList';

import StatsCard from '../../components/common/StatsCard';
import { stockAPI } from '../../services/api';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { fetchStockSummary, fetchStockAlerts } from '../../store/slices/stockSlice';
import { fetchProducts } from '../../store/slices/productSlice';

const StockDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();

  // Read stock data from shared Redux state
  const { stockSummary: reduxStockSummary } = useAppSelector((s) => s.stock);

  // Local mapped state derived from Redux data
  const [stockSummary, setStockSummary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dbOffline, setDbOffline] = useState(false);

  // Filters state (for Current Stock tab)
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Map paths to active tabs
  const getTabFromPath = (path) => {
    if (path.includes('/stock/destroy')) return 'stock-destroy';
    if (path.includes('/stock/adjustment')) return 'stock-adjustment';
    if (path.includes('/purchase/orders')) return 'purchase-order';
    if (path.includes('/purchase')) return 'purchase';
    if (path.includes('/stock/returns')) return 'stock-return';
    if (path.includes('/stock/history')) return 'stock-history';
    if (path.includes('/stock/in') || path.includes('/stock/out')) return 'stock-transfer';
    return 'current-stock';
  };

  const activeTab = getTabFromPath(location.pathname);
  const isOutwardTransfer = location.pathname.includes('/stock/out');

  const handleTabChange = (tabId) => {
    switch (tabId) {
      case 'stock-destroy':
        navigate('/dashboard/stock/destroy');
        break;
      case 'stock-adjustment':
        navigate('/dashboard/stock/adjustment');
        break;
      case 'purchase-order':
        navigate('/dashboard/purchase/orders');
        break;
      case 'purchase':
        navigate('/dashboard/purchase');
        break;
      case 'stock-return':
        navigate('/dashboard/stock/returns');
        break;
      case 'stock-transfer':
        navigate('/dashboard/stock/in');
        break;
      case 'stock-history':
        navigate('/dashboard/stock/history');
        break;
      default:
        navigate('/dashboard/stock');
    }
  };

  const fetchStockData = async () => {
    setLoading(true);
    try {
      const summaryRes = await stockAPI.getSummary();
      if (summaryRes.success) {
        // Group by product_id to guarantee zero duplicate product rows
        const productMap = {};
        summaryRes.stock.forEach(s => {
          const key = s.product_id || s.product_name;
          const qty = Number(s.quantity || 0);
          const val = Number(s.stock_valuation || 0);
          const minStock = Number(s.min_stock || 0);

          if (!productMap[key]) {
            productMap[key] = {
              id: s.id,
              productId: s.product_id,
              name: s.product_name,
              sku: s.barcode || s.sku || 'N/A',
              unit: s.unit || 'Pcs',
              currentStock: qty,
              minimumStock: minStock,
              warehouse: s.warehouse_name || 'Main Storage',
              valuation: val
            };
          } else {
            productMap[key].currentStock += qty;
            productMap[key].valuation += val;
          }
        });

        const mapped = Object.values(productMap).map(p => ({
          ...p,
          status: p.currentStock <= 0 ? 'Out Of Stock' : p.currentStock <= p.minimumStock ? 'Low Stock' : 'In Stock'
        }));

        setStockSummary(mapped);
      }
    } catch (err) {
      console.error('Stock APIs error:', err);
      setDbOffline(false);
      setStockSummary([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'current-stock') {
      fetchStockData();
    }
    const handleEventUpdate = () => {
      handleStockChanged();
    };
    window.addEventListener('stock-changed', handleEventUpdate);
    window.addEventListener('inventory-updated', handleEventUpdate);
    return () => {
      window.removeEventListener('stock-changed', handleEventUpdate);
      window.removeEventListener('inventory-updated', handleEventUpdate);
    };
  }, [activeTab]);

  // Called by any child tab after a stock-mutating operation
  // Dispatches Redux thunks so all subscribers update immediately
  const handleStockChanged = () => {
    dispatch(fetchStockSummary());
    dispatch(fetchStockAlerts());
    dispatch(fetchProducts());
    fetchStockData(); // also refresh local view
  };

  // Keep local stockSummary in sync with Redux when it changes from another source
  useEffect(() => {
    if (reduxStockSummary && reduxStockSummary.length > 0) {
      const productMap = {};
      reduxStockSummary.forEach(s => {
        const key = s.product_id || s.product_name;
        const qty = Number(s.quantity || 0);
        const val = Number(s.stock_valuation || 0);
        const minStock = Number(s.min_stock || 0);
        if (!productMap[key]) {
          productMap[key] = {
            id: s.id, productId: s.product_id, name: s.product_name,
            sku: s.barcode || s.sku || 'N/A', unit: s.unit || 'Pcs',
            currentStock: qty, minimumStock: minStock,
            warehouse: s.warehouse_name || 'Main Storage', valuation: val
          };
        } else {
          productMap[key].currentStock += qty;
          productMap[key].valuation += val;
        }
      });
      const mapped = Object.values(productMap).map(p => ({
        ...p,
        status: p.currentStock <= 0 ? 'Out Of Stock' : p.currentStock <= p.minimumStock ? 'Low Stock' : 'In Stock'
      }));
      setStockSummary(mapped);
      setLoading(false);
    }
  }, [reduxStockSummary]);

  // Filter computations for Current Stock
  const processedStock = useMemo(() => {
    return stockSummary.filter(s => {
      const matchSearch = searchQuery.trim() === '' ||
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.sku.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchStatus = statusFilter === 'All' || s.status === statusFilter;

      return matchSearch && matchStatus;
    });
  }, [stockSummary, searchQuery, statusFilter]);

  const totalValuation = useMemo(() => {
    return stockSummary.reduce((sum, item) => sum + (item.valuation || (item.currentStock * item.purchasePrice)), 0);
  }, [stockSummary]);

  const totalQty = useMemo(() => {
    return stockSummary.reduce((sum, item) => sum + item.currentStock, 0);
  }, [stockSummary]);

  const lowCount = stockSummary.filter(s => s.status === 'Low Stock').length;
  const outCount = stockSummary.filter(s => s.status === 'Out Of Stock').length;

  const handleResetFilters = () => {
    setSearchQuery('');
    setStatusFilter('All');
  };

  const getStatusChipStyles = (status) => {
    switch (status) {
      case 'In Stock': return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
      case 'Low Stock': return 'bg-amber-50 text-amber-700 border border-amber-200 animate-pulse';
      case 'Out Of Stock': return 'bg-rose-50 text-rose-700 border border-rose-200';
      case 'Near Expiry': return 'bg-orange-50 text-orange-700 border border-orange-200';
      case 'Expired': return 'bg-purple-50 text-purple-700 border border-purple-200';
      default: return 'bg-slate-50 text-slate-700 border border-slate-200';
    }
  };

  const { user } = useAppSelector((state) => state.auth);
  const isPurchaseEmployee = user?.role === 'Purchase Employee' || (user?.role === 'Employee' && user?.department === 'Purchase');

  const allTabs = [
    { id: 'current-stock', label: 'Current Stock', icon: CircleStackIcon },
    { id: 'purchase-order', label: 'Purchase Orders', icon: DocumentTextIcon },
    { id: 'purchase', label: 'Purchase Invoices', icon: DocumentTextIcon },
    { id: 'stock-return', label: 'Stock Returns', icon: ArrowPathIcon },
    { id: 'stock-destroy', label: 'Stock Destroy', icon: TrashIcon },
    { id: 'stock-adjustment', label: 'Stock Adjustment', icon: AdjustmentsHorizontalIcon },
    { id: 'stock-transfer', label: 'Stock Transfers', icon: TruckIcon },
    { id: 'stock-history', label: 'Stock History', icon: ClockIcon }
  ];

  const tabs = isPurchaseEmployee
    ? allTabs.filter(t => !['stock-destroy', 'stock-adjustment'].includes(t.id))
    : allTabs;

  return (
    <div className="space-y-5 pb-12 select-none">
      
      {/* TABS HEADER BAR */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm shrink-0">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <div className="p-1.5 bg-indigo-600 rounded-lg text-white">
                <CubeIcon className="w-5 h-5" />
              </div>
              Inventory Control Center
            </h1>
            <p className="text-[11px] font-semibold text-slate-500 mt-0.5">
              Unified hub for stock levels, purchases, adjustments, transfers, and return ledgers.
            </p>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 border-t border-slate-100 mt-4 pt-3.5">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer border ${
                  isActive 
                    ? 'bg-slate-900 border-slate-900 text-white shadow-soft' 
                    : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50/80'
                }`}
              >
                <Icon className="w-4 h-4 stroke-[2]" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* RENDER ACTIVE SUB-PANELS */}
      <div className="w-full">
        {activeTab === 'current-stock' && (
          <div className="space-y-5">
            {/* Stats row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatsCard title="Total Stock Units" value={totalQty} icon={CircleStackIcon} subtext="Aggregated Pieces Hand" color="green" />
              <StatsCard title="Inventory Valuation" value={`₹${totalValuation.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`} icon={CurrencyRupeeIcon} subtext="Purchased Cost Basis" color="purple" />
              <StatsCard title="Low Stock Warns" value={lowCount} icon={ExclamationTriangleIcon} subtext="Under Buffer Limit" color="orange" />
              <StatsCard title="Out Of Stock Products" value={outCount} icon={MinusCircleIcon} subtext="Zero Available Lines" color="red" />
            </div>

            {/* Stock Levels Filters & Table */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
              <div className="flex flex-col gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <MagnifyingGlassIcon className="w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search inventory items by product name or barcode..."
                    className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-indigo-500 font-medium"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="bg-slate-50/50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 font-bold"
                  >
                    <option value="All">All Stock Statuses</option>
                    <option value="In Stock">In Stock</option>
                    <option value="Low Stock">Low Stock</option>
                    <option value="Out Of Stock">Out Of Stock</option>
                  </select>

                  <button
                    onClick={handleResetFilters}
                    className="px-4 py-2 text-xs font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all active:scale-95"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>

              {loading ? (
                <div className="py-12 flex justify-center">
                  <span className="text-sm font-semibold text-slate-500 animate-pulse">Loading stock lists...</span>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/50">
                        <th className="py-3 px-4">Barcode</th>
                        <th className="py-3 px-4">Product Name</th>
                        <th className="py-3 px-4 text-center">Available stock</th>
                        <th className="py-3 px-4 text-center">Min. Stock</th>
                        <th className="py-3 px-4 text-right">Valuation (Cost)</th>
                        <th className="py-3 px-4 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-600">
                      {processedStock.map((prod) => (
                        <tr key={prod.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-slate-950">{prod.sku}</td>
                          <td className="py-3 px-4 font-semibold text-slate-900">{prod.name}</td>
                          <td className={`py-3 px-4 text-center font-bold tabular-nums ${prod.currentStock <= prod.minimumStock ? 'text-red-500' : 'text-slate-950'}`}>
                            {prod.currentStock} <span className="text-[10px] text-slate-400 font-normal">{prod.unit || 'Pcs'}</span>
                          </td>
                          <td className="py-3 px-4 text-center text-slate-400 tabular-nums">{prod.minimumStock}</td>
                          <td className="py-3 px-4 text-right font-bold text-slate-900 tabular-nums">
                            ₹{prod.valuation?.toFixed(2) || (prod.currentStock * prod.purchasePrice).toFixed(2)}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${getStatusChipStyles(prod.status)}`}>
                              {prod.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'stock-adjustment' && <StockAdjustment onStockChanged={handleStockChanged} />}
        
        {activeTab === 'purchase-order' && <PurchaseOrderList />}

        {activeTab === 'purchase' && <PurchaseList />}
        
        {activeTab === 'stock-return' && <VendorReturnManagement onStockChanged={handleStockChanged} />}
        
        {activeTab === 'stock-destroy' && <StockDestroy onStockChanged={handleStockChanged} />}
        
        {activeTab === 'stock-transfer' && <StockTransfer onStockChanged={handleStockChanged} />}
        
        {activeTab === 'stock-history' && <StockHistory />}
      </div>

    </div>
  );
};

export default StockDashboard;