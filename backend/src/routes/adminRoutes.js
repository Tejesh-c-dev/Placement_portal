/**
 * @file adminRoutes.js
 * @description Admin routes for administrative operations.
 * Provides dashboard analytics, user management, placement statistics,
 * data exports, activity logs, notifications, and system settings.
 */

const express = require('express');
const { adminController } = require('../controllers');
const { authenticate, authorize } = require('../middleware/auth');
const config = require('../config');

const router = express.Router();

// All routes require admin authentication
router.use(authenticate);
router.use(authorize(config.ROLES.ADMIN, config.ROLES.SUPERADMIN));

// Dashboard
router.get('/dashboard', adminController.getDashboardAnalytics);

// User management
router.get('/users', adminController.getAllUsers);
router.get('/users/:id', adminController.getUserById);
router.patch('/users/:id/status', adminController.updateUserStatus);
router.patch('/users/:id/role', adminController.changeUserRole);
router.delete('/users/:id', adminController.deleteUser);

// Statistics
router.get('/stats/placements', adminController.getPlacementStats);
router.get('/stats/branch-wise', adminController.getBranchWiseAnalytics);
router.get('/stats/batch-trends', adminController.getBatchTrends);

// Students
router.get('/students/unplaced', adminController.getUnplacedStudents);

// Companies
router.get('/companies', adminController.getAllCompanies);
router.get('/companies/top-recruiters', adminController.getTopRecruiters);

// Reports & Exports
router.get('/reports/placement', adminController.generatePlacementReport);
router.get('/export/students', adminController.exportStudentsCSV);
router.get('/export/placements', adminController.exportPlacementsCSV);

// Logs & Audit
router.get('/logs', adminController.getActivityLogs);
router.get('/audit', adminController.getAuditTrail);

// Notifications
router.post('/notifications/send', adminController.sendBulkNotification);

// System settings (superadmin only)
router.get(
  '/settings',
  authorize(config.ROLES.SUPERADMIN),
  adminController.getSystemSettings
);

router.patch(
  '/settings',
  authorize(config.ROLES.SUPERADMIN),
  adminController.updateSystemSettings
);

module.exports = router;
