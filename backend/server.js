import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';

import authRoutes from './routes/authRoutes.js';
import productRoutes from './routes/productRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import stockRoutes from './routes/stockRoutes.js';
import salesRoutes from './routes/salesRoutes.js';
import purchaseRoutes from './routes/purchaseRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import vendorRoutes from './routes/vendorRoutes.js';
import customerRoutes from './routes/customerRoutes.js';
import borrowRoutes from './routes/borrowRoutes.js';
import salesReturnRoutes from './routes/salesReturnRoutes.js';
import vendorReturnRoutes from './routes/vendorReturnRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import userRoutes from './routes/userRoutes.js';
import activityLogRoutes from './routes/activityLogRoutes.js';
import stockDestroyRoutes from './routes/stockDestroyRoutes.js';
import billingRoutes from './routes/billingRoutes.js';
import superAdminRoutes from './routes/superAdminRoutes.js';

import subCategoryRoutes from './routes/subCategoryRoutes.js';
import brandRoutes from './routes/brandRoutes.js';

import { errorHandler } from './middleware/errorMiddleware.js';
import { initializeTenantPools } from './config/tenantDb.js';
import { startCleanupScheduler } from './services/cleanupService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS setup
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-tenant-id']
}));

// HTTP Request Logger
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Serve uploaded static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/sub-categories', subCategoryRoutes);
app.use('/api/brands', brandRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/purchases', purchaseRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/vendors', vendorRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/borrow', borrowRoutes);
app.use('/api/sales-returns', salesReturnRoutes);
app.use('/api/vendor-returns', vendorReturnRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/users', userRoutes);
app.use('/api/activity-logs', activityLogRoutes);
app.use('/api/stock-destroy', stockDestroyRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/superadmin', superAdminRoutes);
app.use('/api/super-admin', superAdminRoutes);

// Root Health Check Route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', timestamp: new Date() });
});

// Handle undefined routes
app.use('*', (req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// Centralized error handler
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`Kirana ERP server running on http://localhost:${PORT}`);
  console.log(`Press Ctrl+C to terminate the process`);
  console.log(`====================================================`);
  initializeTenantPools();
  startCleanupScheduler();
});
