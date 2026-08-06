import { useState, useEffect, useCallback, useRef } from 'react';
import { NavLink } from 'react-router-dom';
import {
  HomeIcon,
  ShoppingCartIcon,
  TagIcon,
  TruckIcon,
  CubeIcon,
  CurrencyDollarIcon,
  BookOpenIcon,
  UserGroupIcon,
  DocumentChartBarIcon,
  CreditCardIcon,
  XMarkIcon,
  BuildingStorefrontIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchInventorySummary } from '../../store/slices/reportSlice';
import { togglePin, setSidebarOpen } from '../../store/slices/sidebarSlice';
import { settingsAPI } from '../../services/api';
import { showToast } from '../../store/slices/notificationSlice';

/* ─────────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────────── */
const SIDEBAR_COLLAPSED_W = 72;
const SIDEBAR_EXPANDED_W  = 260;
const MOBILE_BREAKPOINT   = 768;

/* ─────────────────────────────────────────────
   Pin Icons
───────────────────────────────────────────── */
const PinFilledIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z" />
  </svg>
);

const PinOutlineIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" strokeWidth={2} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z" />
  </svg>
);

/* ─────────────────────────────────────────────
   Helper: compress image to fit localStorage
───────────────────────────────────────────── */
function compressImage(file, maxWidth = 200, maxHeight = 200, quality = 0.7) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/* ─────────────────────────────────────────────
   SIDEBAR
───────────────────────────────────────────── */
const Sidebar = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { inventorySummary, loadingSummary } = useAppSelector((state) => state.reports);
  const { isPinned, isOpen } = useAppSelector((state) => state.sidebar);

  const [isHovered, setIsHovered] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < MOBILE_BREAKPOINT);
  const [activeLogo, setActiveLogo] = useState(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const fileInputRef = useRef(null);

  // Load logo from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(`store_logo_${user?.id || 'default'}`);
    if (stored) setActiveLogo(stored);
  }, [user]);

  // Persist logo changes – catch quota errors
  const persistLogo = (logoData) => {
    try {
      localStorage.setItem(`store_logo_${user?.id || 'default'}`, logoData);
    } catch (e) {
      if (e.name === 'QuotaExceededError') {
        console.warn('Logo too large, storing only in memory (will reset on reload)');
        // Notify user but keep the logo in state
        dispatch(showToast({ msg: 'Logo is too large for local storage – will not persist after refresh.', type: 'warning' }));
      } else {
        console.error('Failed to store logo:', e);
      }
    }
  };

  // Sync with backend (optional)
  useEffect(() => {
    const syncFromBackend = async () => {
      try {
        const res = await settingsAPI.getAll();
        if (res.success && res.settings?.logo_url) {
          setActiveLogo(res.settings.logo_url);
          persistLogo(res.settings.logo_url);
        }
      } catch {
        // silent fallback
      }
    };
    syncFromBackend();
  }, [user]);

  /* ── Logo handlers ── */
  const handleLogoClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      dispatch(showToast({ msg: 'Please select an image file.', type: 'error' }));
      e.target.value = '';
      return;
    }

    setUploadingLogo(true);

    // Immediate preview using object URL
    const objectUrl = URL.createObjectURL(file);
    setActiveLogo(objectUrl);

    try {
      // Compress and convert to base64 (for localStorage)
      const compressedBase64 = await compressImage(file, 150, 150, 0.6);
      setActiveLogo(compressedBase64);
      persistLogo(compressedBase64);

      // Upload to backend (full resolution)
      const formData = new FormData();
      formData.append('logo', file);
      const res = await settingsAPI.uploadLogo(formData);
      if (res.success && res.logo_url) {
        setActiveLogo(res.logo_url);
        persistLogo(res.logo_url);
        dispatch(showToast({ msg: 'Shop logo updated successfully!', type: 'success' }));
      } else {
        // Backend failed, but we have compressed local copy
        dispatch(showToast({ msg: 'Logo saved locally (backend sync failed).', type: 'warning' }));
      }
    } catch (error) {
      console.error('Logo processing error:', error);
      dispatch(showToast({ msg: 'Failed to process logo. Please try a smaller image.', type: 'error' }));
    } finally {
      setUploadingLogo(false);
      e.target.value = '';
      setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    }
  };

  /* ── Expansion logic ── */
  const isExpanded = isMobile ? isOpen : (isPinned || isHovered);

  /* ── Resize ── */
  useEffect(() => {
    const onResize = () => {
      const mobile = window.innerWidth < MOBILE_BREAKPOINT;
      setIsMobile(mobile);
      if (!mobile) dispatch(setSidebarOpen(false));
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [dispatch]);

  /* ── Inventory summary ── */
  const monitoredTenant = localStorage.getItem('monitoredTenant');
  useEffect(() => {
    if (user && isExpanded) dispatch(fetchInventorySummary());
  }, [dispatch, user, isExpanded, monitoredTenant]);

  /* ── Handlers ── */
  const handleMouseEnter = useCallback(() => {
    if (!isMobile && !isPinned) setIsHovered(true);
  }, [isMobile, isPinned]);

  const handleMouseLeave = useCallback(() => {
    if (!isMobile && !isPinned) setIsHovered(false);
  }, [isMobile, isPinned]);

  const handlePinToggle = useCallback(() => {
    dispatch(togglePin());
    setIsHovered(false);
  }, [dispatch]);

  const handleClose = useCallback(() => dispatch(setSidebarOpen(false)), [dispatch]);
  const handleMobileMenuClick = useCallback(() => {
    if (isMobile) handleClose();
  }, [isMobile, handleClose]);

  /* ── Store name ── */
  const storeDisplayName = (() => {
    if (user?.role === 'Super Admin') {
      const monitored = localStorage.getItem('monitoredTenant');
      if (monitored) {
        try { return JSON.parse(monitored).name || 'Store Monitor'; }
        catch { return 'Super Admin'; }
      }
      return 'SaaS Portal';
    }
    return user?.store_name || 'Kirana ERP';
  })();

  /* ── Menu items ── */
  const menuItems = [
    { label: 'Dashboard',            path: '/dashboard',          icon: HomeIcon },
    { label: 'Products',             path: '/dashboard/products', icon: ShoppingCartIcon },
    { label: 'Categories',           path: '/dashboard/categories', icon: TagIcon },
    { label: 'Supplier Master',      path: '/dashboard/vendors',  icon: TruckIcon },
    { label: 'Stock Management',     path: '/dashboard/stock',    icon: CubeIcon },
    { label: 'Sales',                path: '/dashboard/sales',    icon: CurrencyDollarIcon },
    { label: 'Borrow Ledger',        path: '/dashboard/borrow',   icon: BookOpenIcon },
    { label: 'Staff Management',     path: '/dashboard/staff',    icon: UserGroupIcon },
    { label: 'Reports',              path: '/dashboard/reports',  icon: DocumentChartBarIcon },
    { label: 'Billing & Subscriptions', path: '/dashboard/billing', icon: CreditCardIcon },
  ];

  const filteredItems = (() => {
    if (!user) return [];
    const isMonitoring = user.role === 'Super Admin' && localStorage.getItem('monitoredTenant');
    if (user.role === 'Super Admin' && !isMonitoring) {
      return menuItems.filter(i => ['Dashboard', 'Billing & Subscriptions'].includes(i.label));
    }
    if (user.role === 'Admin' || isMonitoring) return menuItems;

    // Purchase Department Roles
    if (user.role === 'Purchase Manager') {
      return menuItems.filter(i => ['Dashboard', 'Products', 'Categories', 'Supplier Master', 'Stock Management', 'Staff Management', 'Reports'].includes(i.label));
    }
    if (user.role === 'Purchase Employee' || (user.role === 'Employee' && user.department === 'Purchase')) {
      return menuItems.filter(i => ['Dashboard', 'Products', 'Categories', 'Supplier Master', 'Stock Management', 'Reports'].includes(i.label));
    }

    // Sales Department Roles
    if (user.role === 'Sales Manager') {
      return menuItems.filter(i => ['Dashboard', 'Sales', 'Borrow Ledger', 'Staff Management', 'Reports'].includes(i.label));
    }
    if (user.role === 'Sales Employee' || (user.role === 'Employee' && user.department === 'Sales')) {
      return menuItems.filter(i => ['Dashboard', 'Sales', 'Borrow Ledger'].includes(i.label));
    }

    // General Operations Employee (Sales + Purchase + Stock + Reports, NO Staff Management)
    if (user.role === 'Employee') {
      return menuItems.filter(i => ['Dashboard', 'Products', 'Categories', 'Supplier Master', 'Stock Management', 'Sales', 'Borrow Ledger', 'Reports'].includes(i.label));
    }

    const perms = user.permissions || [];
    return menuItems.filter(item => {
      if (item.label === 'Dashboard')            return perms.includes('view_dashboard');
      if (item.label === 'Products')             return perms.includes('view_products');
      if (item.label === 'Categories')           return perms.includes('view_categories');
      if (item.label === 'Supplier Master')      return perms.includes('view_products');
      if (item.label === 'Stock Management')     return perms.includes('view_stock');
      if (item.label === 'Sales')                return perms.includes('view_sales');
      if (item.label === 'Borrow Ledger')        return perms.includes('view_borrow');
      if (item.label === 'Staff Management')     return perms.includes('manage_users');
      if (item.label === 'Reports')              return perms.includes('view_reports');
      if (item.label === 'Billing & Subscriptions') return perms.includes('view_billing');
      return false;
    });
  })();

  const sidebarWidth = isMobile
    ? SIDEBAR_EXPANDED_W
    : (isExpanded ? SIDEBAR_EXPANDED_W : SIDEBAR_COLLAPSED_W);
  const translateX = isMobile ? (isOpen ? 0 : -SIDEBAR_EXPANDED_W) : 0;

  return (
    <>
      {/* Mobile backdrop */}
      {isMobile && isOpen && (
        <div
          onClick={handleClose}
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40"
          aria-hidden="true"
        />
      )}

      <aside
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          width: `${sidebarWidth}px`,
          transform: `translateX(${translateX}px)`,
        }}
        className={[
          'fixed left-0 top-0 bottom-0 h-screen z-50',
          'flex flex-col overflow-hidden',
          'transition-[width,transform] duration-[250ms] ease-[cubic-bezier(0.25,0.1,0.25,1)]',
          isExpanded
            ? 'bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 shadow-xl dark:shadow-slate-900/50'
            : 'bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800',
        ].join(' ')}
        aria-label="Application sidebar"
      >

        {/* ══ HEADER ══ */}
        <div className="flex items-center justify-between px-3 h-[75px] flex-shrink-0 border-b border-slate-100 dark:border-slate-800/60 overflow-hidden">
          <div className={`flex items-center gap-3 min-w-0 ${!isExpanded ? 'w-full justify-center' : ''}`}>
            <div
              onClick={handleLogoClick}
              className={`flex flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#1B6E4C] to-emerald-700 text-white font-black shadow-md shadow-[#1B6E4C]/20 border border-slate-200 dark:border-slate-800 select-none cursor-pointer hover:scale-105 active:scale-95 transition-all relative overflow-hidden group ${
                isExpanded ? 'h-11 w-11' : 'h-10 w-10'
              }`}
              title="Click to update shop logo from PC"
            >
              {activeLogo ? (
                <img
                  src={activeLogo}
                  alt="Shop Logo"
                  className="w-full h-full object-cover rounded-2xl"
                  onError={() => setActiveLogo(null)}
                />
              ) : (
                <BuildingStorefrontIcon className={`${isExpanded ? 'w-6 h-6' : 'w-5 h-5'} text-white`} />
              )}

              {uploadingLogo && (
                <div className="absolute inset-0 bg-slate-950/60 flex items-center justify-center">
                  <ArrowPathIcon className="w-4 h-4 text-white animate-spin" />
                </div>
              )}

              {!uploadingLogo && (
                <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-[9px] font-black text-white uppercase tracking-wider text-center p-0.5">
                  Upload
                </div>
              )}
            </div>

            <div
              className="flex flex-col min-w-0 overflow-hidden"
              style={{
                opacity: isExpanded ? 1 : 0,
                width: isExpanded ? 'auto' : 0,
                transition: 'opacity 150ms ease, width 250ms ease',
                pointerEvents: isExpanded ? 'auto' : 'none',
              }}
            >
              <h1 className="text-sm font-black text-[#1B6E4C] dark:text-[#4FBE8C] tracking-wide leading-tight truncate whitespace-nowrap">
                {storeDisplayName}
              </h1>
              <span className="text-[9px] font-black bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-emerald-400 px-1.5 py-0.5 rounded w-max uppercase tracking-wider mt-1 whitespace-nowrap">
                {user?.role || 'Admin'}
              </span>
            </div>
          </div>

          <div
            style={{
              opacity: isExpanded ? 1 : 0,
              display: isExpanded ? 'block' : 'none',
              transition: 'opacity 150ms ease',
              flexShrink: 0,
            }}
          >
            {isMobile ? (
              <button
                onClick={handleClose}
                className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                aria-label="Close menu"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={handlePinToggle}
                title={isPinned ? 'Unpin sidebar' : 'Pin sidebar open'}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                aria-label={isPinned ? 'Unpin sidebar' : 'Pin sidebar open'}
              >
                {isPinned ? (
                  <PinFilledIcon className="w-4 h-4 text-[#1B6E4C] dark:text-emerald-400" />
                ) : (
                  <PinOutlineIcon className="w-4 h-4 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200" />
                )}
              </button>
            )}
          </div>
        </div>

        {/* ══ NAVIGATION ══ */}
        <nav
          className="flex-1 overflow-y-auto overflow-x-hidden py-3 px-2 space-y-1 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800"
          aria-label="Main navigation"
        >
          {filteredItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={handleMobileMenuClick}
                title={!isExpanded ? item.label : undefined}
                className={({ isActive }) =>
                  `group flex items-center p-2.5 rounded-xl transition-colors duration-150 border ${
                    !isExpanded ? 'justify-center' : ''
                  } ${
                    isActive
                      ? 'bg-[#1B6E4C]/10 text-[#1B6E4C] border-[#1B6E4C]/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20 font-bold'
                      : 'text-slate-500 dark:text-slate-400 border-transparent hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60 font-semibold'
                  }`
                }
              >
                <div className="flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 flex-shrink-0 transition-colors group-hover:text-[#1B6E4C] dark:group-hover:text-emerald-400" />
                </div>
                <span
                  className="whitespace-nowrap font-bold text-xs ml-3 overflow-hidden"
                  style={{
                    opacity: isExpanded ? 1 : 0,
                    maxWidth: isExpanded ? '180px' : '0px',
                    transition: 'opacity 150ms ease, max-width 250ms ease',
                    display: isExpanded ? 'block' : 'none',
                  }}
                >
                  {item.label}
                </span>
              </NavLink>
            );
          })}
        </nav>

        {/* ══ INVENTORY SUMMARY ══ */}
        <div
          className="border-t border-slate-200 dark:border-slate-800/80 flex-shrink-0 overflow-hidden"
          style={{
            maxHeight: isExpanded ? '280px' : '0px',
            opacity: isExpanded ? 1 : 0,
            transition: 'max-height 250ms ease, opacity 200ms ease',
          }}
        >
          <div className="p-4 bg-slate-50/50 dark:bg-slate-950/40 print:hidden">
            <div className="p-3 bg-slate-100/50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-2xl">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm">📊</span>
                <p className="text-[10px] font-black text-slate-800 dark:text-white tracking-wider uppercase flex items-center justify-between w-full">
                  <span>Inventory Summary</span>
                  {loadingSummary && (
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                  )}
                </p>
              </div>

              {loadingSummary && !inventorySummary ? (
                <div className="space-y-2 py-1">
                  <div className="h-2.5 bg-slate-200 dark:bg-slate-700 rounded w-full animate-pulse" />
                  <div className="h-2.5 bg-slate-200 dark:bg-slate-700 rounded w-5/6 animate-pulse" />
                  <div className="h-2.5 bg-slate-200 dark:bg-slate-700 rounded w-4/5 animate-pulse" />
                </div>
              ) : (
                <div className="space-y-1.5 text-[10px] font-bold">
                  {[
                    { label: 'Total Products',  value: inventorySummary?.totalProducts ?? 0 },
                    { label: 'Total Stock Qty', value: inventorySummary?.totalStockQty ?? 0 },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between items-center text-slate-500 dark:text-slate-400">
                      <span>{label}</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{value}</span>
                    </div>
                  ))}
                  {[
                    { label: 'Low Stock',  value: inventorySummary?.lowStockProducts ?? 0,   warn: 'amber' },
                    { label: 'Out of Stock', value: inventorySummary?.outOfStockProducts ?? 0, warn: 'rose'  },
                    { label: 'Near Expiry', value: inventorySummary?.nearExpiryProducts ?? 0, warn: 'amber' },
                  ].map(({ label, value, warn }) => (
                    <div key={label} className="flex justify-between items-center text-slate-500 dark:text-slate-400">
                      <span>{label}</span>
                      <span className={`font-bold px-1.5 rounded ${
                        value > 0
                          ? warn === 'amber' ? 'text-amber-600 bg-amber-500/10' : 'text-rose-600 bg-rose-500/10'
                          : 'text-slate-800 dark:text-slate-200'
                      }`}>{value}</span>
                    </div>
                  ))}
                  <div className="flex justify-between items-center text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-700 pt-1.5 mt-1.5">
                    <span>Est. Valuation</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      ₹{(inventorySummary?.totalInventoryValue ?? 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Hidden file input */}
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
        />
      </aside>
    </>
  );
};

export default Sidebar;