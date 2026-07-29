import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import profileReducer from './slices/profileSlice';
import themeReducer from './slices/themeSlice';
import sidebarReducer from './slices/sidebarSlice';
import dashboardReducer from './slices/dashboardSlice';
import productReducer from './slices/productSlice';
import categoryReducer from './slices/categorySlice';
import subCategoryReducer from './slices/subCategorySlice';
import supplierReducer from './slices/supplierSlice';
import customerReducer from './slices/customerSlice';
import stockReducer from './slices/stockSlice';
import purchaseReducer from './slices/purchaseSlice';
import salesReducer from './slices/salesSlice';
import reportReducer from './slices/reportSlice';
import notificationReducer from './slices/notificationSlice';
import activityLogReducer from './slices/activityLogSlice';
import staffReducer from './slices/staffSlice';
import billingReducer from './slices/billingSlice';
import monitoringReducer from './slices/monitoringSlice';
import permissionReducer from './slices/permissionSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    profile: profileReducer,
    theme: themeReducer,
    sidebar: sidebarReducer,
    dashboard: dashboardReducer,
    products: productReducer,
    categories: categoryReducer,
    subCategories: subCategoryReducer,
    suppliers: supplierReducer,
    customers: customerReducer,
    stock: stockReducer,
    purchase: purchaseReducer,
    sales: salesReducer,
    reports: reportReducer,
    notifications: notificationReducer,
    activityLogs: activityLogReducer,
    staff: staffReducer,
    billing: billingReducer,
    monitoring: monitoringReducer,
    permissions: permissionReducer,
  }
});
