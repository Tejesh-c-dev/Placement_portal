/**
 * @file userController.js
 * @description User controller handling HTTP requests for user profile operations.
 * Manages user profile updates, avatar upload, notifications,
 * preferences, activity history, and account management.
 */

const { userRepository } = require('../repositories');
const { parsePagination, buildPaginationResponse } = require('../utils/helpers');
const AppError = require('../utils/AppError');

/**
 * Async handler wrapper to catch errors and pass to error middleware.
 * @param {Function} fn - Async function to wrap
 * @returns {Function} - Express middleware function
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Get current user profile
 * GET /api/users/me
 */
const getMe = asyncHandler(async (req, res) => {
  const user = await userRepository.findById(req.user._id);
  
  res.status(200).json({
    status: 'success',
    data: { user },
  });
});

/**
 * Update current user profile
 * PATCH /api/users/me
 */
const updateMe = asyncHandler(async (req, res) => {
  const { firstName, lastName, phone, avatar } = req.body;
  
  const user = await userRepository.updateById(req.user._id, {
    firstName,
    lastName,
    phone,
    avatar,
  });
  
  res.status(200).json({
    status: 'success',
    message: 'Profile updated successfully',
    data: { user },
  });
});

/**
 * Get user notifications
 * GET /api/users/notifications
 */
const getNotifications = asyncHandler(async (req, res) => {
  const { page, limit } = parsePagination(req.query);
  const { unreadOnly } = req.query;
  
  // This would typically use a notification repository
  // For now, returning placeholder structure
  res.status(200).json({
    status: 'success',
    data: {
      notifications: [],
      total: 0,
      page,
      limit,
      totalPages: 0,
      hasMore: false,
    },
  });
});

/**
 * Mark notification as read
 * PATCH /api/users/notifications/:id/read
 */
const markNotificationRead = asyncHandler(async (req, res) => {
  // Placeholder - would update notification status
  res.status(200).json({
    status: 'success',
    message: 'Notification marked as read',
  });
});

/**
 * Mark all notifications as read
 * PATCH /api/users/notifications/read-all
 */
const markAllNotificationsRead = asyncHandler(async (req, res) => {
  // Placeholder - would update all notifications
  res.status(200).json({
    status: 'success',
    message: 'All notifications marked as read',
  });
});

/**
 * Get user preferences
 * GET /api/users/preferences
 */
const getPreferences = asyncHandler(async (req, res) => {
  const user = await userRepository.findById(req.user._id);
  
  res.status(200).json({
    status: 'success',
    data: { preferences: user.preferences || {} },
  });
});

/**
 * Update user preferences
 * PATCH /api/users/preferences
 */
const updatePreferences = asyncHandler(async (req, res) => {
  const { emailNotifications, smsNotifications, darkMode, language } = req.body;
  
  const user = await userRepository.updateById(req.user._id, {
    'preferences.emailNotifications': emailNotifications,
    'preferences.smsNotifications': smsNotifications,
    'preferences.darkMode': darkMode,
    'preferences.language': language,
  });
  
  res.status(200).json({
    status: 'success',
    message: 'Preferences updated',
    data: { preferences: user.preferences },
  });
});

/**
 * Upload avatar
 * POST /api/users/avatar
 */
const uploadAvatar = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new AppError('Please upload an image', 400);
  }
  
  const avatarUrl = `/uploads/avatars/${req.file.filename}`;
  
  const user = await userRepository.updateById(req.user._id, {
    avatar: avatarUrl,
  });
  
  res.status(200).json({
    status: 'success',
    message: 'Avatar uploaded successfully',
    data: { avatar: user.avatar },
  });
});

/**
 * Delete avatar
 * DELETE /api/users/avatar
 */
const deleteAvatar = asyncHandler(async (req, res) => {
  await userRepository.updateById(req.user._id, {
    avatar: null,
  });
  
  res.status(200).json({
    status: 'success',
    message: 'Avatar deleted',
  });
});

/**
 * Get user activity
 * GET /api/users/activity
 */
const getActivity = asyncHandler(async (req, res) => {
  const { page, limit } = parsePagination(req.query);
  
  // Placeholder - would fetch user activity log
  res.status(200).json({
    status: 'success',
    data: {
      activities: [],
      total: 0,
      page,
      limit,
    },
  });
});

/**
 * Request account deletion
 * POST /api/users/request-deletion
 */
const requestAccountDeletion = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  
  // Mark account for deletion (would be processed by admin)
  await userRepository.updateById(req.user._id, {
    deletionRequested: true,
    deletionRequestedAt: new Date(),
    deletionReason: reason,
  });
  
  res.status(200).json({
    status: 'success',
    message: 'Account deletion request submitted. An admin will process your request.',
  });
});

/**
 * Get login history
 * GET /api/users/login-history
 */
const getLoginHistory = asyncHandler(async (req, res) => {
  const user = await userRepository.findById(req.user._id);
  
  res.status(200).json({
    status: 'success',
    data: {
      lastLogin: user.lastLogin,
      loginAttempts: user.loginAttempts,
      lockUntil: user.lockUntil,
    },
  });
});

module.exports = {
  getMe,
  updateMe,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  getPreferences,
  updatePreferences,
  uploadAvatar,
  deleteAvatar,
  getActivity,
  requestAccountDeletion,
  getLoginHistory,
};
