/**
 * @file authController.js
 * @description Authentication controller handling HTTP requests for user auth operations.
 * Manages registration, login, logout, token refresh, password reset,
 * email verification, and current user retrieval endpoints.
 */

const { authService } = require('../services');
const { sanitizeUser } = require('../utils/helpers');

/**
 * Async handler wrapper to catch errors and pass to error middleware.
 * @param {Function} fn - Async function to wrap
 * @returns {Function} - Express middleware function
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Register new user
 * POST /api/auth/register
 */
const register = asyncHandler(async (req, res) => {
  const result = await authService.register(req.body);
  
  res.status(201).json({
    status: 'success',
    message: 'Registration successful. Please verify your email.',
    data: result,
  });
});

/**
 * Login user
 * POST /api/auth/login
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const result = await authService.login(email, password);
  
  res.status(200).json({
    status: 'success',
    message: 'Login successful',
    data: result,
  });
});

/**
 * Refresh access token
 * POST /api/auth/refresh-token
 */
const refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  const tokens = await authService.refreshToken(refreshToken);
  
  res.status(200).json({
    status: 'success',
    data: tokens,
  });
});

/**
 * Logout user
 * POST /api/auth/logout
 */
const logout = asyncHandler(async (req, res) => {
  await authService.logout(req.user._id);
  
  res.status(200).json({
    status: 'success',
    message: 'Logged out successfully',
  });
});

/**
 * Forgot password
 * POST /api/auth/forgot-password
 */
const forgotPassword = asyncHandler(async (req, res) => {
  const result = await authService.forgotPassword(req.body.email);
  
  res.status(200).json({
    status: 'success',
    message: result.message,
  });
});

/**
 * Reset password
 * POST /api/auth/reset-password
 */
const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;
  const result = await authService.resetPassword(token, password);
  
  res.status(200).json({
    status: 'success',
    message: result.message,
  });
});

/**
 * Change password
 * POST /api/auth/change-password
 */
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const result = await authService.changePassword(req.user._id, currentPassword, newPassword);
  
  res.status(200).json({
    status: 'success',
    message: result.message,
  });
});

/**
 * Verify email
 * GET /api/auth/verify-email/:token
 */
const verifyEmail = asyncHandler(async (req, res) => {
  const result = await authService.verifyEmail(req.params.token);
  
  res.status(200).json({
    status: 'success',
    message: result.message,
  });
});

/**
 * Resend verification email
 * POST /api/auth/resend-verification
 */
const resendVerification = asyncHandler(async (req, res) => {
  const result = await authService.resendVerificationEmail(req.user._id);
  
  res.status(200).json({
    status: 'success',
    message: result.message,
  });
});

/**
 * Get current user
 * GET /api/auth/me
 */
const getMe = asyncHandler(async (req, res) => {
  res.status(200).json({
    status: 'success',
    data: {
      user: sanitizeUser(req.user),
    },
  });
});

module.exports = {
  register,
  login,
  refreshToken,
  logout,
  forgotPassword,
  resetPassword,
  changePassword,
  verifyEmail,
  resendVerification,
  getMe,
};
