/**
 * @file jobRoutes.js
 * @description Job routes for job postings management.
 * Defines public routes (featured, top-paying), student routes (eligible jobs, eligibility check),
 * recruiter routes (CRUD, my jobs), and common routes (list, search, details).
 */

const express = require('express');
const { jobController } = require('../controllers');
const { validate } = require('../middleware/validate');
const { jobSchemas } = require('../validators');
const { authenticate, authorize, optionalAuth } = require('../middleware/auth');
const config = require('../config');

const router = express.Router();

// Public routes (with optional auth)
router.get(
  '/featured',
  optionalAuth,
  jobController.getFeaturedJobs
);

router.get(
  '/top-paying',
  optionalAuth,
  jobController.getTopPayingJobs
);

// Protected routes
router.use(authenticate);

// Student routes
router.get(
  '/eligible',
  authorize(config.ROLES.STUDENT),
  jobController.getEligibleJobs
);

router.get(
  '/:id/check-eligibility',
  authorize(config.ROLES.STUDENT),
  jobController.checkEligibility
);

// Recruiter routes
router.post(
  '/',
  authorize(config.ROLES.RECRUITER, config.ROLES.ADMIN, config.ROLES.SUPERADMIN),
  validate(jobSchemas.createJob),
  jobController.createJob
);

router.get(
  '/my-jobs',
  authorize(config.ROLES.RECRUITER),
  jobController.getMyJobs
);

router.patch(
  '/:id',
  authorize(config.ROLES.RECRUITER, config.ROLES.ADMIN, config.ROLES.SUPERADMIN),
  validate(jobSchemas.updateJob),
  jobController.updateJob
);

router.delete(
  '/:id',
  authorize(config.ROLES.RECRUITER, config.ROLES.ADMIN, config.ROLES.SUPERADMIN),
  jobController.deleteJob
);

router.patch(
  '/:id/publish',
  authorize(config.ROLES.ADMIN, config.ROLES.SUPERADMIN),
  jobController.publishJob
);

router.patch(
  '/:id/close',
  authorize(config.ROLES.RECRUITER, config.ROLES.ADMIN, config.ROLES.SUPERADMIN),
  jobController.closeJob
);

// Common routes
router.get(
  '/',
  jobController.getActiveJobs
);

router.get(
  '/search',
  jobController.searchJobs
);

router.get(
  '/stats',
  authorize(config.ROLES.ADMIN, config.ROLES.SUPERADMIN),
  jobController.getJobStats
);

router.get(
  '/:id',
  jobController.getJobById
);

module.exports = router;
