import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import { sendSuccess, sendError } from './utils/apiResponse.js';

// Module routes
import authRoutes from './modules/auth/routes.js';
import userRoutes from './modules/users/routes.js';
import taxRoutes from './modules/taxes/routes.js';
import productRoutes from './modules/products/routes.js';
import planRoutes from './modules/plans/routes.js';
import quotationRoutes from './modules/quotations/routes.js';
import subscriptionRoutes from './modules/subscriptions/routes.js';
import billingRoutes from './modules/billing/routes.js';
import invoiceRoutes from './modules/invoices/routes.js';
import discountRoutes from './modules/discounts/routes.js';
import paymentRoutes from './modules/payments/routes.js';
import dashboardRoutes from './modules/dashboard/routes.js';

dotenv.config();

const app = express();

// Middleware
const allowedOrigin = process.env.CLIENT_URL || 'http://localhost:5173';
app.use(cors({
  origin: [
    allowedOrigin,
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:5174',
    'http://127.0.0.1:5174',
    'http://localhost:5175',
    'http://127.0.0.1:5175',
  ],
  credentials: true,
}));
app.use(express.json());

// Base Health Check
app.get('/api/health', (req, res) => {
  return sendSuccess(res, 'Brightloop API is active and healthy', {
    service: 'brightloop-backend',
    status: 'OK',
    timestamp: new Date().toISOString(),
  });
});

// Central Route Registration
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/taxes', taxRoutes);
app.use('/api/products', productRoutes);
app.use('/api/plans', planRoutes);
app.use('/api/quotations', quotationRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/discounts', discountRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/dashboard', dashboardRoutes);

// 404 Handler for undefined API routes
app.use('/api/*', (req, res) => {
  return sendError(res, `API route not found: ${req.method} ${req.originalUrl}`, 404);
});

// Global Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  return sendError(
    res,
    err.message || 'Internal Server Error',
    err.status || 500,
    process.env.NODE_ENV === 'development' ? [err.stack] : []
  );
});

export default app;
