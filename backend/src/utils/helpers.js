/**
 * @file helpers.js
 * @description Utility helper functions for common operations.
 * Provides token generation/hashing, pagination parsing/building,
 * sort/filter query builders, user data sanitization, and async error wrapping.
 */

const crypto = require('crypto');
const config = require('../config');

/**
 * Generate a random token
 */
const generateToken = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

/**
 * Hash a token using SHA256
 */
const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

/**
 * Parse pagination parameters
 */
const parsePagination = (query) => {
  let page = parseInt(query.page, 10) || 1;
  let limit = parseInt(query.limit, 10) || config.pagination.defaultPageSize;
  
  page = Math.max(1, page);
  limit = Math.min(Math.max(1, limit), config.pagination.maxPageSize);
  
  const skip = (page - 1) * limit;
  
  return { page, limit, skip };
};

/**
 * Build pagination response
 */
const buildPaginationResponse = (data, total, page, limit) => {
  const totalPages = Math.ceil(total / limit);
  return {
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
};

/**
 * Parse sort parameters
 */
const parseSort = (sortString, allowedFields = []) => {
  if (!sortString) return { createdAt: -1 };
  
  const sortObj = {};
  const sortFields = sortString.split(',');
  
  sortFields.forEach((field) => {
    const order = field.startsWith('-') ? -1 : 1;
    const fieldName = field.replace(/^-/, '');
    
    if (allowedFields.length === 0 || allowedFields.includes(fieldName)) {
      sortObj[fieldName] = order;
    }
  });
  
  return Object.keys(sortObj).length > 0 ? sortObj : { createdAt: -1 };
};

/**
 * Build filter query from request query params
 */
const buildFilterQuery = (queryParams, allowedFilters = []) => {
  const filter = {};
  
  Object.keys(queryParams).forEach((key) => {
    if (allowedFilters.includes(key) && queryParams[key]) {
      // Handle special operators
      if (key.endsWith('_gte')) {
        const field = key.replace('_gte', '');
        filter[field] = { ...filter[field], $gte: queryParams[key] };
      } else if (key.endsWith('_lte')) {
        const field = key.replace('_lte', '');
        filter[field] = { ...filter[field], $lte: queryParams[key] };
      } else if (key.endsWith('_in')) {
        const field = key.replace('_in', '');
        filter[field] = { $in: queryParams[key].split(',') };
      } else {
        filter[key] = queryParams[key];
      }
    }
  });
  
  return filter;
};

/**
 * Sanitize user object for response (remove sensitive data)
 */
const sanitizeUser = (user) => {
  if (!user) return null;
  
  const userObject = user.toObject ? user.toObject() : { ...user };
  delete userObject.password;
  delete userObject.refreshToken;
  delete userObject.passwordResetToken;
  delete userObject.passwordResetExpires;
  
  return userObject;
};

/**
 * Calculate age from date of birth
 */
const calculateAge = (dateOfBirth) => {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
};

/**
 * Format currency in INR
 */
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

/**
 * Validate email format
 */
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Generate slug from string
 */
const generateSlug = (str) => {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

module.exports = {
  generateToken,
  hashToken,
  parsePagination,
  buildPaginationResponse,
  parseSort,
  buildFilterQuery,
  sanitizeUser,
  calculateAge,
  formatCurrency,
  isValidEmail,
  generateSlug,
};
