/**
 * @file userRoutes.js
 * @description User routes for user profile and preferences management.
 * Provides profile CRUD, avatar upload, notifications,
 * preferences, activity history, and account deletion.
 */

const express = require('express');
const { userController } = require('../controllers');
const { authenticate } = require('../middleware/auth');
const { uploadAvatar } = require('../middleware/upload');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Profile
router.get('/me', userController.getMe);
router.patch('/me', userController.updateMe);

// Avatar
router.post('/avatar', uploadAvatar, userController.uploadAvatar);
router.delete('/avatar', userController.deleteAvatar);

// Notifications
router.get('/notifications', userController.getNotifications);
router.patch('/notifications/:id/read', userController.markNotificationRead);
router.patch('/notifications/read-all', userController.markAllNotificationsRead);

// Preferences
router.get('/preferences', userController.getPreferences);
router.patch('/preferences', userController.updatePreferences);

// Activity & History
router.get('/activity', userController.getActivity);
router.get('/login-history', userController.getLoginHistory);

// Account management
router.post('/request-deletion', userController.requestAccountDeletion);

module.exports = router;
