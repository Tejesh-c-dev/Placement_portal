/**
 * @file app.js
 * @description Express application configuration and middleware setup.
 * Configures security middleware (Helmet, CORS), rate limiting, body parsing,
 * static file serving, HTTP request logging, and route mounting.
 * Exports the configured Express app instance.
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');

const config = require('./config');
const logger = require('./utils/logger');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

// Import routes
const routes = require('./routes');

const app = express();

// Trust proxy (for rate limiting behind reverse proxy)
app.set('trust proxy', 1);

// Security middlewares
app.use(helmet());
app.use(cors(config.cors));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  message: {
    status: 'error',
    message: 'Too many requests, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

// Stricter rate limit for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  message: {
    status: 'error',
    message: 'Too many authentication attempts, please try again later.',
  },
});
app.use('/api/auth', authLimiter);

// Body parsing
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Static files (for uploaded resumes)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// HTTP request logging
const morganFormat = config.nodeEnv === 'development' ? 'dev' : 'combined';
app.use(morgan(morganFormat, {
  stream: {
    write: (message) => logger.http(message.trim()),
  },
}));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
  });
});

// API routes
app.use('/api', routes);

// Handle 404 routes
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

module.exports = app;
