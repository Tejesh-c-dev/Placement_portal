/**
 * @file authRoutes.js
 * @description Authentication routes for user registration, login, and account management.
 * Defines public routes (register, login, password reset, email verification)
 * and protected routes (logout, change password, resend verification).
 */

const express = require('express');
const { authController } = require('../controllers');
const { validate } = require('../middleware/validate');
const { authSchemas } = require('../validators');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.post(
  '/register',
  validate(authSchemas.register),
  authController.register
);

router.post(
  '/login',
  validate(authSchemas.login),
  authController.login
);

router.post(
  '/refresh-token',
  validate(authSchemas.refreshToken),
  authController.refreshToken
);

router.post(
  '/forgot-password',
  validate(authSchemas.forgotPassword),
  authController.forgotPassword
);

router.post(
  '/reset-password/:token',
  validate(authSchemas.resetPassword),
  authController.resetPassword
);

router.get(
  '/verify-email/:token',
  authController.verifyEmail
);

// Protected routes
router.use(authenticate);

router.post('/logout', authController.logout);

router.post(
  '/change-password',
  validate(authSchemas.changePassword),
  authController.changePassword
);

router.post('/resend-verification', authController.resendVerification);

router.get('/me', authController.getMe);

module.exports = router;
