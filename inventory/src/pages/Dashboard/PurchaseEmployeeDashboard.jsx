import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  TruckIcon,
  ExclamationTriangleIcon,
  CubeIcon,
  ArrowPathIcon,
  PlusIcon,
  DocumentTextIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { useAppSelector } from '../../store/hooks';
import { reportsAPI, stockAPI, purchasesAPI, vendorsAPI, purchaseOrdersAPI } from '../../services/api';
import Loader from '../../components/common/Loader';

const PurchaseEmployeeDashboard = () => {
  const { user } = useAppSelector((state) => state.auth);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [kpis, setKpis] = useState({
    lowStock: 0,
    outOfStock: 0,
    totalVendors: 0,
    totalGRNs: 0,
    totalPurchases: 0
  });

  const [alerts, setAlerts] = useState([]);
  const [recentPurchases, setRecentPurchases] = useState([]);

  const loadData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const [kpiRes, alertRes, purchaseRes, vendorRes, poRes] = await Promise.all([
        reportsAPI.getKPIs().catch(() => null),
        stockAPI.getAlerts().catch(() => null),
        purchasesAPI.getAll().catch(() => null),
        vendorsAPI.getAll().catch(() => null),
        purchaseOrdersAPI.getAll().catch(() => null)
      ]);

      if (kpiRes?.success && kpiRes.kpis) {
        setKpis(prev => ({
          ...prev,
          lowStock: kpiRes.kpis.lowStock ?? prev.lowStock,
          outOfStock: kpiRes.kpis.outOfStock ?? prev.outOfStock,
          totalVendors: kpiRes.kpis.totalVendors ?? prev.totalVendors,
          totalPurchases: kpiRes.kpis.totalPurchases ?? prev.totalPurchases
        }));
      }

      if (alertRes?.success && alertRes.alerts) {
        const lowStockItems = Array.isArray(alertRes.alerts)
          ? alertRes.alerts
          : (alertRes.alerts.lowStock || []);
        setAlerts(lowStockItems.slice(0, 6));
        
        if (!kpiRes?.success) {
          setKpis(prev => ({
            ...prev,
            lowStock: lowStockItems.length,
            outOfStock: (alertRes.alerts.outOfStock || []).length
          }));
        }
      }

      if (purchaseRes?.success && purchaseRes.purchases) {
        setRecentPurchases(purchaseRes.purchases.slice(0, 5));
        setKpis(prev => ({ 
          ...prev, 
          totalGRNs: purchaseRes.purchases.length 
        }));
      }

      if (vendorRes?.success && vendorRes.vendors) {
        setKpis(prev => ({ ...prev, totalVendors: vendorRes.vendors.length }));
      }
    } catch (err) {
      console.error('Purchase Employee Dashboard error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader size="lg" text="Loading Purchase Operations Desk..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl bg-gradient-to-r from-teal-800 to-slate-900 p-6 text-white shadow-xl">
        <div>
          <span className="rounded-full bg-teal-500/20 px-3 py-1 text-xs font-semibold text-teal-300 border border-teal-500/30">
            PURCHASE & INVENTORY DESK
          </span>
          <h1 className="mt-2 text-2xl font-black tracking-tight text-white sm:text-3xl">
            Purchase Operations Desk
          </h1>
          <p className="mt-1 text-sm text-teal-100/80">
            Operator: <span className="font-bold text-white">{user?.name}</span> ({user?.department || 'Purchase'} Department)
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-sm font-semibold text-white backdrop-blur-md hover:bg-white/20 active:scale-95 transition-all"
          >
            <ArrowPathIcon className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh Data
          </button>
          <button
            onClick={() => navigate('/dashboard/purchases')}
            className="flex items-center gap-2 rounded-xl bg-teal-500 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-teal-500/30 hover:bg-teal-400 active:scale-95 transition-all"
          >
            <PlusIcon className="h-5 w-5" />
            Record GRN Receipt
          </button>
        </div>
      </div>

      {/* Operational KPI Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Low Stock Reorders</span>
            <div className="rounded-xl bg-amber-100 dark:bg-amber-950/50 p-2.5 text-amber-600">
              <ExclamationTriangleIcon className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-amber-600">{kpis.lowStock} items</span>
            <p className="mt-1 text-xs text-slate-500">Items below minimum stock threshold</p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Registered Suppliers</span>
            <div className="rounded-xl bg-teal-100 dark:bg-teal-950/50 p-2.5 text-teal-600">
              <TruckIcon className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-slate-900 dark:text-white">{kpis.totalVendors} vendors</span>
            <p className="mt-1 text-xs text-slate-500">Active supplier directory</p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Purchase Records</span>
            <div className="rounded-xl bg-blue-100 dark:bg-blue-950/50 p-2.5 text-blue-600">
              <DocumentTextIcon className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-slate-900 dark:text-white">{kpis.totalGRNs} GRNs</span>
            <p className="mt-1 text-xs text-slate-500">Recorded intake invoices</p>
          </div>
        </div>
      </div>

      {/* Operational Task List & Reorder List */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Low Stock Reorder Alert List</h3>
            <button onClick={() => navigate('/dashboard/stock')} className="text-xs font-bold text-teal-600 hover:underline">View Stock</button>
          </div>

          <div className="space-y-3">
            {alerts.length === 0 ? (
              <div className="py-8 text-center">
                <CheckCircleIcon className="mx-auto h-8 w-8 text-teal-500 opacity-60 mb-2" />
                <p className="text-sm font-medium text-slate-500">All stock levels are optimal.</p>
              </div>
            ) : (
              alerts.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                  <div>
                    <p className="font-semibold text-sm text-slate-800 dark:text-slate-200">{item.product_name || item.name}</p>
                    <p className="text-xs text-slate-500">SKU: {item.sku || 'N/A'} • Stock: <span className="font-bold text-amber-600">{item.current_stock}</span> {item.unit || 'units'}</p>
                  </div>
                  <button onClick={() => navigate('/dashboard/purchases')} className="px-3 py-1 text-xs font-bold rounded-lg bg-teal-600 text-white hover:bg-teal-700 active:scale-95 transition-all">Add GRN</button>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Recent GRN Purchase Invoices</h3>
            <button onClick={() => navigate('/dashboard/purchases')} className="text-xs font-bold text-teal-600 hover:underline">View All</button>
          </div>

          <div className="space-y-3">
            {recentPurchases.length === 0 ? (
              <p className="text-sm text-slate-500 py-8 text-center">No purchase invoices recorded yet.</p>
            ) : (
              recentPurchases.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                  <div>
                    <p className="font-semibold text-sm text-slate-800 dark:text-slate-200">{item.purchase_no || item.invoice_number || `GRN-#${item.id}`}</p>
                    <p className="text-xs text-slate-500">Supplier: <span className="font-semibold text-slate-700 dark:text-slate-300">{item.vendor_name || 'Supplier'}</span></p>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-sm text-slate-900 dark:text-white">₹{Number(item.total || item.total_amount || 0).toLocaleString('en-IN')}</span>
                    <p className="text-[10px] text-teal-600 dark:text-teal-400 font-semibold">{item.payment_status || 'Recorded'}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PurchaseEmployeeDashboard;
