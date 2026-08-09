/**
 * @file index.js
 * @description Central configuration file for the application.
 * Loads environment variables and exports configuration settings for:
 * - Server settings (port, environment)
 * - MongoDB connection options
 * - JWT authentication tokens
 * - Password reset settings
 * - CORS policies
 * - Rate limiting
 * - File upload constraints
 * - Email service configuration
 * - Redis cache settings
 * - Pagination defaults
 * - User roles and application status enums
 */

require('dotenv').config();

module.exports = {
  // Server
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 5000,

  // MongoDB
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/placement_portal',
    options: {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    }
  },

  // JWT
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    accessExpiry: process.env.JWT_ACCESS_EXPIRY || process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    refreshExpiry: process.env.JWT_REFRESH_EXPIRY || process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },

  // Password Reset
  resetPassword: {
    expiry: parseInt(process.env.RESET_PASSWORD_EXPIRY, 10) || 3600000, // 1 hour
  },

  // CORS
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
    credentials: true,
  },

  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 900000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100,
  },

  // File Upload
  upload: {
    maxSize: parseInt(process.env.MAX_FILE_SIZE, 10) || 5 * 1024 * 1024, // 5MB
    path: process.env.UPLOAD_PATH || './uploads',
    allowedMimeTypes: ['application/pdf'],
    allowedExtensions: ['.pdf'],
  },

  // Email
  email: {
    host: process.env.SMTP_HOST || process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || process.env.EMAIL_PORT, 10) || 587,
    user: process.env.SMTP_USER || process.env.EMAIL_USER,
    password: process.env.SMTP_PASSWORD || process.env.EMAIL_PASS,
    from: process.env.EMAIL_FROM || 'noreply@placementportal.com',
  },

  // Redis
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
  },

  // Pagination
  pagination: {
    defaultPageSize: parseInt(process.env.DEFAULT_PAGE_SIZE, 10) || 10,
    maxPageSize: parseInt(process.env.MAX_PAGE_SIZE, 10) || 100,
  },

  // Frontend URL
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',

  // Roles
  ROLES: {
    STUDENT: 'student',
    RECRUITER: 'recruiter',
    ADMIN: 'admin',
    SUPERADMIN: 'superadmin',
  },

  // Application Status
  applicationStatus: {
    APPLIED: 'applied',
    SHORTLISTED: 'shortlisted',
    INTERVIEW: 'interview',
    SELECTED: 'selected',
    REJECTED: 'rejected',
  },

  // Company Status
  companyStatus: {
    PENDING: 'pending',
    APPROVED: 'approved',
    REJECTED: 'rejected',
  },
};
