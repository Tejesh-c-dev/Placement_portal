/**
 * @file applicationRoutes.js
 * @description Application routes for job application management.
 * Defines student routes (apply, my applications, withdraw),
 * recruiter routes (view, status updates, bulk actions, interviews),
 * and admin routes (statistics).
 */

const express = require('express');
const { applicationController } = require('../controllers');
const { validate } = require('../middleware/validate');
const { applicationSchemas } = require('../validators');
const { authenticate, authorize } = require('../middleware/auth');
const config = require('../config');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Student routes
router.post(
  '/',
  authorize(config.ROLES.STUDENT),
  validate(applicationSchemas.applyToJob),
  applicationController.applyToJob
);

router.get(
  '/my-applications',
  authorize(config.ROLES.STUDENT),
  applicationController.getMyApplications
);

router.patch(
  '/:id/withdraw',
  authorize(config.ROLES.STUDENT),
  applicationController.withdrawApplication
);

// Recruiter routes
router.get(
  '/job/:jobId',
  authorize(config.ROLES.RECRUITER, config.ROLES.ADMIN, config.ROLES.SUPERADMIN),
  applicationController.getJobApplications
);

router.patch(
  '/:id/status',
  authorize(config.ROLES.RECRUITER, config.ROLES.ADMIN, config.ROLES.SUPERADMIN),
  validate(applicationSchemas.updateStatus),
  applicationController.updateStatus
);

router.patch(
  '/bulk-status',
  authorize(config.ROLES.RECRUITER, config.ROLES.ADMIN, config.ROLES.SUPERADMIN),
  validate(applicationSchemas.bulkUpdateStatus),
  applicationController.bulkUpdateStatus
);

router.post(
  '/:id/interview-round',
  authorize(config.ROLES.RECRUITER, config.ROLES.ADMIN, config.ROLES.SUPERADMIN),
  validate(applicationSchemas.addInterviewRound),
  applicationController.addInterviewRound
);

// Common / statistics routes
router.get(
  '/stats',
  applicationController.getApplicationStats
);

// Common routes
router.get(
  '/:id',
  applicationController.getApplicationById
);

module.exports = router;
