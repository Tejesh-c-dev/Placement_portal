/**
 * @file companyRoutes.js
 * @description Company routes for company registration and management.
 * Defines public routes (search), recruiter routes (register, update, HR contacts),
 * and admin routes (approval workflow, statistics).
 */

const express = require('express');
const { companyController } = require('../controllers');
const { validate } = require('../middleware/validate');
const { companySchemas } = require('../validators');
const { authenticate, authorize, optionalAuth } = require('../middleware/auth');
const { uploadLogo } = require('../middleware/upload');
const config = require('../config');

const router = express.Router();

// Public routes
router.get(
  '/search',
  optionalAuth,
  companyController.searchCompanies
);

// Protected routes
router.use(authenticate);

// Recruiter routes
router.post(
  '/',
  authorize(config.ROLES.RECRUITER),
  validate(companySchemas.registerCompany),
  companyController.registerCompany
);

router.get(
  '/my-companies',
  authorize(config.ROLES.RECRUITER),
  companyController.getMyCompanies
);

router.patch(
  '/:id',
  authorize(config.ROLES.RECRUITER, config.ROLES.ADMIN, config.ROLES.SUPERADMIN),
  validate(companySchemas.updateCompany),
  companyController.updateCompany
);

router.post(
  '/:id/hr-contacts',
  authorize(config.ROLES.RECRUITER, config.ROLES.ADMIN),
  companyController.addHRContact
);

// Admin routes
router.get(
  '/pending',
  authorize(config.ROLES.ADMIN, config.ROLES.SUPERADMIN),
  companyController.getPendingCompanies
);

router.patch(
  '/:id/approve',
  authorize(config.ROLES.ADMIN, config.ROLES.SUPERADMIN),
  companyController.approveCompany
);

router.patch(
  '/:id/reject',
  authorize(config.ROLES.ADMIN, config.ROLES.SUPERADMIN),
  companyController.rejectCompany
);

router.get(
  '/stats',
  authorize(config.ROLES.ADMIN, config.ROLES.SUPERADMIN),
  companyController.getCompanyStats
);

router.get(
  '/stats/industry',
  authorize(config.ROLES.ADMIN, config.ROLES.SUPERADMIN),
  companyController.getIndustryDistribution
);

// Common routes
router.get(
  '/',
  companyController.getApprovedCompanies
);

router.get(
  '/slug/:slug',
  companyController.getCompanyBySlug
);

router.get(
  '/:id',
  companyController.getCompanyById
);

module.exports = router;
