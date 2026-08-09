

/**
 * @file auth.js
 * @description Authentication middleware for route protection and authorization.
 * Provides JWT token validation, role-based access control,
 * resource ownership verification, and optional authentication.
 */

const jwt = require('jsonwebtoken');
const config = require('../config');
const User = require('../models/User');
const { AuthenticationError, AuthorizationError } = require('../utils/AppError');
const logger = require('../utils/logger');

/**
 * Middleware to protect routes - validates JWT token
 */
const protect = async (req, res, next) => {
  try {
    // 1) Get token from header
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      logger.warn(`Missing auth token for ${req.method} ${req.originalUrl}`);
      throw new AuthenticationError('You are not logged in. Please log in to access this resource.');
    }

    // 2) Verify token
    const decoded = jwt.verify(token, config.jwt.accessSecret);

    // 3) Check if user still exists
    const user = await User.findById(decoded.userId).select('+isActive');
    
    if (!user) {
      throw new AuthenticationError('The user belonging to this token no longer exists.');
    }

    // 4) Check if user is active
    if (!user.isActive) {
      throw new AuthenticationError('Your account has been deactivated. Please contact support.');
    }

    // 5) Check if user changed password after token was issued
    if (user.changedPasswordAfter(decoded.iat)) {
      throw new AuthenticationError('User recently changed password. Please log in again.');
    }

    // 6) Grant access to protected route
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      logger.warn(`Invalid JWT for ${req.method} ${req.originalUrl}`);
      return next(new AuthenticationError('Invalid token. Please log in again.'));
    }
    if (error.name === 'TokenExpiredError') {
      logger.warn(`Expired JWT for ${req.method} ${req.originalUrl}`);
      return next(new AuthenticationError('Your token has expired. Please log in again.'));
    }
    next(error);
  }
};

/**
 * Middleware to restrict access to specific roles
 */
const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      logger.warn(
        `Access denied for user ${req.user?._id || 'unknown'} with role ${req.user?.role || 'unknown'} on ${req.method} ${req.originalUrl}; required roles: ${roles.join(', ')}`
      );
      return next(new AuthorizationError('You do not have permission to perform this action'));
    }
    next();
  };
};

/**
 * Middleware to check if user owns the resource or is admin
 */
const ownerOrAdmin = (resourceUserIdField = 'userId') => {
  return (req, res, next) => {
    const resourceUserId = req.params[resourceUserIdField] || req.body[resourceUserIdField];
    const isOwner = resourceUserId && resourceUserId.toString() === req.user._id.toString();
    const isAdmin = ['admin', 'superadmin'].includes(req.user.role);

    if (!isOwner && !isAdmin) {
      logger.warn(
        `Ownership check failed for user ${req.user?._id || 'unknown'} on ${req.method} ${req.originalUrl}`
      );
      return next(new AuthorizationError('You do not have permission to access this resource'));
    }
    next();
  };
};

/**
 * Optional auth - attaches user to request if token exists, but doesn't require it
 */
const optionalAuth = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      const decoded = jwt.verify(token, config.jwt.accessSecret);
      const user = await User.findById(decoded.userId).select('+isActive');
      
      if (user && user.isActive) {
        req.user = user;
      }
    }
    next();
  } catch (error) {
    // Token invalid or expired, continue without user
    next();
  }
};

module.exports = {
  protect,
  authenticate: protect, // Alias for consistency
  restrictTo,
  authorize: restrictTo, // Alias for consistency
  ownerOrAdmin,
  optionalAuth,
};
