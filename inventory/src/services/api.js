import axios from 'axios';
import { store } from '../store';
import { showToast } from '../store/slices/notificationSlice';

// Create base axios instance using environment variable if present
const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Inject JWT token from localStorage
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Inject dynamic tenant routing context if Super Admin is monitoring a store
    const monitoredTenant = localStorage.getItem('monitoredTenant');
    if (monitoredTenant) {
      try {
        const tenantData = JSON.parse(monitoredTenant);
        if (tenantData && tenantData.id) {
          config.headers['x-tenant-id'] = tenantData.id;
        }
      } catch (e) {
        console.error('Failed to parse monitored tenant details', e);
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle auth failures and global errors
API.interceptors.response.use(
  (response) => response,
  (error) => {
    let msg = 'An unexpected error occurred. Please try again.';
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      msg = 'Network connection timed out. Please check your internet connection.';
    } else if (error.message === 'Network Error') {
      msg = 'Network error. Please check if the backend server is running.';
    } else if (error.response?.data?.message) {
      msg = error.response.data.message;
    }
    
    // Dispatch global Redux toast notification
    store.dispatch(showToast({ msg, type: 'error' }));

    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    if (error.response && error.response.status === 402) {
      if (!window.location.pathname.includes('/dashboard/billing')) {
        window.location.href = '/dashboard/billing';
      }
    }
    return Promise.reject(error);
  }
);

// Auth Services
export const authAPI = {
  login: async (credentials) => {
    const response = await API.post('/auth/login', credentials);
    return response.data;
  },
  registerStore: async (data) => {
    const response = await API.post('/auth/register-store', data);
    return response.data;
  },
  logout: async () => {
    const response = await API.post('/auth/logout');
    return response.data;
  },
  forgotPassword: async (data) => {
    const response = await API.post('/auth/forgot-password', data);
    return response.data;
  },
  resetPassword: async (data) => {
    const response = await API.post('/auth/reset-password', data);
    return response.data;
  },
  changePassword: async (data) => {
    const response = await API.post('/auth/change-password', data);
    return response.data;
  },
  getProfile: async () => {
    const response = await API.get('/auth/profile');
    return response.data;
  },
  updateProfile: async (data) => {
    const response = await API.put('/auth/profile', data);
    return response.data;
  },
};

// Products Services
export const productsAPI = {
  getAll: async (params) => {
    const response = await API.get('/products', { params });
    return response.data;
  },
  getById: async (id) => {
    const response = await API.get(`/products/${id}`);
    return response.data;
  },
  create: async (formData) => {
    const response = await API.post('/products', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
  bulkImport: async (products, options = {}) => {
    const response = await API.post('/products/bulk-import', { products, options });
    return response.data;
  },
  update: async (id, formData) => {
    const response = await API.put(`/products/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
  delete: async (id) => {
    const response = await API.delete(`/products/${id}`);
    return response.data;
  },
};

// Categories Services
export const categoriesAPI = {
  getAll: async (params) => {
    const response = await API.get('/categories', { params });
    return response.data;
  },
  getTree: async () => {
    const response = await API.get('/categories/tree');
    return response.data;
  },
  create: async (data) => {
    const response = await API.post('/categories', data);
    return response.data;
  },
  update: async (id, data) => {
    const response = await API.put(`/categories/${id}`, data);
    return response.data;
  },
  toggleStatus: async (id, status) => {
    const response = await API.patch(`/categories/${id}/status`, { status });
    return response.data;
  },
};

// Sub-Categories Services
export const subCategoriesAPI = {
  getAll: async (params) => {
    const response = await API.get('/sub-categories', { params });
    return response.data;
  },
  create: async (data) => {
    const response = await API.post('/sub-categories', data);
    return response.data;
  },
  update: async (id, data) => {
    const response = await API.put(`/sub-categories/${id}`, data);
    return response.data;
  },
  toggleStatus: async (id, status) => {
    const response = await API.patch(`/sub-categories/${id}/status`, { status });
    return response.data;
  },
};

// Brands Services
export const brandsAPI = {
  getAll: async (params) => {
    const response = await API.get('/brands', { params });
    return response.data;
  },
  create: async (data) => {
    const response = await API.post('/brands', data);
    return response.data;
  },
  update: async (id, data) => {
    const response = await API.put(`/brands/${id}`, data);
    return response.data;
  },
  toggleStatus: async (id, status) => {
    const response = await API.patch(`/brands/${id}/status`, { status });
    return response.data;
  },
};

// Stock Services
export const stockAPI = {
  getSummary: async () => {
    const response = await API.get('/stock');
    return response.data;
  },
  getLogs: async (params) => {
    const response = await API.get('/stock/logs', { params });
    return response.data;
  },
  getAlerts: async () => {
    const response = await API.get('/stock/alerts');
    return response.data;
  },
  adjust: async (data) => {
    const response = await API.post('/stock/adjust', data);
    return response.data;
  },
  transfer: async (data) => {
    const response = await API.post('/stock/transfer', data);
    return response.data;
  },
};

// Stock Destroy Services
export const stockDestroyAPI = {
  getAll: async (params) => {
    const response = await API.get('/stock/destroy', { params });
    return response.data;
  },
  getKPIs: async () => {
    const response = await API.get('/stock/destroy/kpis');
    return response.data;
  },
  create: async (data) => {
    const response = await API.post('/stock/destroy/create', data);
    return response.data;
  },
  cancel: async (id, data) => {
    const response = await API.post(`/stock/destroy/${id}/cancel`, data);
    return response.data;
  },
};

// Vendors Services
export const vendorsAPI = {
  getAll: async (params) => {
    try {
      const response = await API.get('/vendors', { params });
      return response.data;
    } catch (err) {
      if (err.response?.status === 403 || err.response?.status === 401) {
        return { success: false, vendors: [], count: 0, message: err.response?.data?.message || 'Access restricted' };
      }
      throw err;
    }
  },
  getById: async (id) => {
    const response = await API.get(`/vendors/${id}`);
    return response.data;
  },
  create: async (data) => {
    const response = await API.post('/vendors', data);
    return response.data;
  },
  update: async (id, data) => {
    const response = await API.put(`/vendors/${id}`, data);
    return response.data;
  },
  toggleStatus: async (id, status) => {
    const response = await API.patch(`/vendors/${id}/status`, { status });
    return response.data;
  },
  delete: async (id) => {
    const response = await API.delete(`/vendors/${id}`);
    return response.data;
  },
  getProfile: async (id, params) => {
    const response = await API.get(`/vendors/${id}/profile`, { params });
    return response.data;
  },
  getLedger: async (id, params) => {
    const response = await API.get(`/vendors/${id}/ledger`, { params });
    return response.data;
  },
  getPayments: async (id) => {
    const response = await API.get(`/vendors/${id}/payments`);
    return response.data;
  },
  getInvoices: async (id) => {
    const response = await API.get(`/vendors/${id}/invoices`);
    return response.data;
  },
  recordPayment: async (id, data) => {
    const response = await API.post(`/vendors/${id}/payments`, data);
    return response.data;
  },
  getPaymentReceipt: async (paymentId) => {
    const response = await API.get(`/vendors/payments/${paymentId}/receipt`);
    return response.data;
  },
};

// Customers Services
export const customersAPI = {
  getAll: async () => {
    const response = await API.get('/customers');
    return response.data;
  },
  getById: async (id) => {
    const response = await API.get(`/customers/${id}`);
    return response.data;
  },
  create: async (data) => {
    const response = await API.post('/customers', data);
    return response.data;
  },
  update: async (id, data) => {
    const response = await API.put(`/customers/${id}`, data);
    return response.data;
  },
  delete: async (id) => {
    const response = await API.delete(`/customers/${id}`);
    return response.data;
  },
};

// Purchase Invoices Services
export const purchasesAPI = {
  getAll: async (params) => {
    const response = await API.get('/purchases', { params });
    return response.data;
  },
  getById: async (id) => {
    const response = await API.get(`/purchases/${id}`);
    return response.data;
  },
  create: async (data) => {
    const response = await API.post('/purchases', data);
    return response.data;
  },
  delete: async (id) => {
    const response = await API.delete(`/purchases/${id}`);
    return response.data;
  },
};

// Purchase Orders Services
export const purchaseOrdersAPI = {
  getAll: async (params) => {
    const response = await API.get('/purchases/orders', { params });
    return response.data;
  },
  getById: async (id) => {
    const response = await API.get(`/purchases/orders/${id}`);
    return response.data;
  },
  create: async (data) => {
    const response = await API.post('/purchases/orders', data);
    return response.data;
  },
  updateStatus: async (id, data) => {
    const response = await API.put(`/purchases/orders/${id}/status`, data);
    return response.data;
  },
  delete: async (id) => {
    const response = await API.delete(`/purchases/orders/${id}`);
    return response.data;
  },
  createGRN: async (id, data) => {
    const response = await API.post(`/purchases/orders/${id}/grn`, data);
    return response.data;
  },
  getGRNs: async (id) => {
    const response = await API.get(`/purchases/orders/${id}/grns`);
    return response.data;
  },
};

// Sales Invoices Services
export const salesAPI = {
  getAll: async (params) => {
    const response = await API.get('/sales', { params });
    return response.data;
  },
  getById: async (id) => {
    const response = await API.get(`/sales/${id}`);
    return response.data;
  },
  create: async (data) => {
    const response = await API.post('/sales', data);
    return response.data;
  },
  delete: async (id) => {
    const response = await API.delete(`/sales/${id}`);
    return response.data;
  },
};

// Customer Sales Returns Services
export const salesReturnsAPI = {
  searchInvoice: async (query) => {
    const response = await API.get('/sales-returns/search-invoice', { params: { query } });
    return response.data;
  },
  getAll: async (params) => {
    const response = await API.get('/sales-returns', { params });
    return response.data;
  },
  getById: async (id) => {
    const response = await API.get(`/sales-returns/${id}`);
    return response.data;
  },
  create: async (data) => {
    const response = await API.post('/sales-returns', data);
    return response.data;
  },
  delete: async (id) => {
    const response = await API.delete(`/sales-returns/${id}`);
    return response.data;
  }
};

// Vendor Stock Returns Services
export const vendorReturnsAPI = {
  getAll: async (params) => {
    const response = await API.get('/vendor-returns', { params });
    return response.data;
  },
  getById: async (id) => {
    const response = await API.get(`/vendor-returns/${id}`);
    return response.data;
  },
  getAvailableStock: async (vendorId, productId) => {
    const response = await API.get('/vendor-returns/available-stock', { params: { vendor_id: vendorId, product_id: productId } });
    return response.data;
  },
  create: async (data) => {
    const response = await API.post('/vendor-returns', data);
    return response.data;
  },
  updateStatus: async (id, status, notes) => {
    const response = await API.put(`/vendor-returns/${id}/status`, { status, notes });
    return response.data;
  },
  getLedger: async (vendorId) => {
    const response = await API.get(`/vendor-returns/ledger/${vendorId}`);
    return response.data;
  },
  getProductsPurchased: async (vendorId) => {
    const response = await API.get('/vendor-returns/products-purchased', { params: { vendor_id: vendorId } });
    return response.data;
  },
  getPurchasesByProduct: async (vendorId, productId) => {
    const response = await API.get('/vendor-returns/purchases-by-product', { params: { vendor_id: vendorId, product_id: productId } });
    return response.data;
  },
  delete: async (id) => {
    const response = await API.delete(`/vendor-returns/${id}`);
    return response.data;
  }
};

// Borrow / Udhaar Services
export const borrowAPI = {
  getAll: async (params) => {
    const response = await API.get('/borrow', { params });
    return response.data;
  },
  getSummary: async () => {
    const response = await API.get('/borrow/summary');
    return response.data;
  },
  create: async (data) => {
    const response = await API.post('/borrow', data);
    return response.data;
  },
  recordPayment: async (id, data) => {
    const response = await API.post(`/borrow/${id}/payment`, data);
    return response.data;
  }
};

// Reports Analytics Services
export const reportsAPI = {
  getKPIs: async (params) => {
    const response = await API.get('/reports/dashboard-kpis', { params });
    return response.data;
  },
  getCharts: async (params) => {
    const response = await API.get('/reports/dashboard-charts', { params });
    return response.data;
  },
  getInventoryReport: async (params) => {
    const response = await API.get('/reports/inventory', { params });
    return response.data;
  },
  getSalesReport: async (params) => {
    const response = await API.get('/reports/sales', { params });
    return response.data;
  },
  getPurchaseReport: async (params) => {
    const response = await API.get('/reports/purchases', { params });
    return response.data;
  },
};

// System Settings Services
export const settingsAPI = {
  getAll: async () => {
    const response = await API.get('/settings');
    return response.data;
  },
  update: async (data) => {
    const response = await API.put('/settings', data);
    return response.data;
  },
  uploadLogo: async (formData) => {
    const response = await API.post('/settings/upload-logo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },
  getWarehouses: async () => {
    const response = await API.get('/settings/warehouses');
    return response.data;
  },
};

// System Notifications Services
export const notificationsAPI = {
  getAll: async (params) => {
    const response = await API.get('/notifications', { params });
    return response.data;
  },
  getUnreadCount: async () => {
    const response = await API.get('/notifications/unread-count');
    return response.data;
  },
  markRead: async (id) => {
    const response = await API.put(`/notifications/${id}/read`);
    return response.data;
  },
  markUnread: async (id) => {
    const response = await API.put(`/notifications/${id}/unread`);
    return response.data;
  },
  markAllRead: async () => {
    const response = await API.put('/notifications/read-all');
    return response.data;
  },
  delete: async (id) => {
    const response = await API.delete(`/notifications/${id}`);
    return response.data;
  },
  clearAll: async (readOnly = false) => {
    const response = await API.delete('/notifications/clear-all', { params: { readOnly } });
    return response.data;
  },
  create: async (data) => {
    const response = await API.post('/notifications', data);
    return response.data;
  }
};

// User Management Services
export const usersAPI = {
  getAll: async () => {
    const response = await API.get('/users');
    return response.data;
  },
  create: async (data) => {
    const response = await API.post('/users', data);
    return response.data;
  },
  update: async (id, data) => {
    const response = await API.put(`/users/${id}`, data);
    return response.data;
  },
  toggleStatus: async (id, status) => {
    const response = await API.patch(`/users/${id}/status`, { status });
    return response.data;
  },
  delete: async (id) => {
    console.warn('Physical deletion is disabled per ERP standards. Use toggleStatus instead.');
    const response = await API.delete(`/users/${id}`);
    return response.data;
  },
  getRoles: async () => {
    const response = await API.get('/users/roles');
    return response.data;
  },
  updateRolePermissions: async (roleId, data) => {
    const response = await API.put(`/users/roles/${roleId}`, data);
    return response.data;
  },
  getActivityLogs: async () => {
    const response = await API.get('/users/activity-logs');
    return response.data;
  },
};

// Super Admin Services
export const superAdminAPI = {
  getKPIs: async () => {
    const response = await API.get('/superadmin/kpis');
    return response.data;
  },
  getStores: async () => {
    const response = await API.get('/superadmin/stores');
    return response.data;
  },
  createStore: async (data) => {
    const response = await API.post('/superadmin/stores', data);
    return response.data;
  },
  updateStore: async (id, data) => {
    const response = await API.put(`/superadmin/stores/${id}`, data);
    return response.data;
  },
  toggleStoreStatus: async (id, status) => {
    const response = await API.patch(`/superadmin/stores/${id}/status`, { status });
    return response.data;
  },
  deleteStore: async (id) => {
    console.warn('Physical deletion is disabled per SaaS ERP standards. Use toggleStoreStatus instead.');
    const response = await API.delete(`/superadmin/stores/${id}`);
    return response.data;
  },
  updateSubscription: async (id, data) => {
    const response = await API.post(`/superadmin/stores/${id}/subscription-action`, data);
    return response.data;
  },
};

// Billing & Subscription Services
export const billingAPI = {
  getStatus: async () => {
    const response = await API.get('/billing/status');
    return response.data;
  },
  subscribe: async (data) => {
    const response = await API.post('/billing/subscribe', data);
    return response.data;
  },
  cancel: async () => {
    const response = await API.post('/billing/cancel');
    return response.data;
  },
  createOrder: async (data) => {
    const response = await API.post('/billing/create-order', data);
    return response.data;
  },
  getHistoryLogs: async () => {
    const response = await API.get('/billing/history');
    return response.data;
  },
  verifyPayment: async (data) => {
    const response = await API.post('/billing/verify-payment', data);
    return response.data;
  },
};

// Activity Logs Services
export const activityLogsAPI = {
  getAll: async (params = {}) => {
    const response = await API.get('/activity-logs', { params });
    return response.data;
  },
};

export default API;
