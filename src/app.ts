import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';

// IMPORTANT: Load env before importing other files
dotenv.config();

import authRoutes from './routes/authRoutes';
import oauthRoutes from './routes/oauthRoutes';
import productRoutes from './routes/productRoutes';
import orderRoutes from './routes/orderRoutes';
import paymentRoutes from './routes/paymentRoutes';
import userRoutes from './routes/userRoutes';
import uploadRoutes from './routes/uploadRoutes';
import { generalLimiter } from './middleware/rateLimiter';
import {
  helmetConfig,
  sanitizeData,
  xssProtection,
  securityHeaders,
  hppProtection,
  csrfProtection,
} from './middleware/security';

const app = express();

// Security Middleware - Apply in order
app.use(helmetConfig); // HTTP Security Headers
app.use(securityHeaders); // Additional security headers
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400,
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Data Sanitization
app.use(sanitizeData); // NoSQL injection protection
app.use(xssProtection); // XSS protection
app.use(hppProtection); // HTTP Parameter Pollution protection
app.use(csrfProtection); // CSRF token generation

app.use(morgan('dev'));

// Apply general rate limiting to all API requests
app.use('/api/', generalLimiter);

app.use('/api/auth', authRoutes);
app.use('/api/auth/google', oauthRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/upload', uploadRoutes);

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date() });
});

// Global error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: err.message || 'Internal Server Error' });
});

export default app;
