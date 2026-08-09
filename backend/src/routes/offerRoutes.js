/**
 * @file offerRoutes.js
 * @description Offer routes for job offer management.
 * Defines student routes (my offers, accept, decline),
 * recruiter routes (create, view by job, revoke),
 * and admin routes (pending, expiring offers, statistics).
 */

const express = require('express');
const { offerController } = require('../controllers');
const { validate } = require('../middleware/validate');
const { offerSchemas } = require('../validators');
const { authenticate, authorize } = require('../middleware/auth');
const config = require('../config');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Student routes
router.get(
  '/my-offers',
  authorize(config.ROLES.STUDENT),
  offerController.getMyOffers
);

router.patch(
  '/:id/accept',
  authorize(config.ROLES.STUDENT),
  offerController.acceptOffer
);

router.patch(
  '/:id/decline',
  authorize(config.ROLES.STUDENT),
  offerController.declineOffer
);

// Recruiter routes
router.post(
  '/',
  authorize(config.ROLES.RECRUITER, config.ROLES.ADMIN, config.ROLES.SUPERADMIN),
  validate(offerSchemas.createOffer),
  offerController.createOffer
);

router.get(
  '/job/:jobId',
  authorize(config.ROLES.RECRUITER, config.ROLES.ADMIN, config.ROLES.SUPERADMIN),
  offerController.getOffersByJob
);

router.patch(
  '/:id/revoke',
  authorize(config.ROLES.RECRUITER, config.ROLES.ADMIN, config.ROLES.SUPERADMIN),
  offerController.revokeOffer
);

// Admin routes
router.get(
  '/pending',
  authorize(config.ROLES.ADMIN, config.ROLES.SUPERADMIN),
  offerController.getPendingOffers
);

router.get(
  '/expiring',
  authorize(config.ROLES.ADMIN, config.ROLES.SUPERADMIN),
  offerController.getExpiringOffers
);

router.get(
  '/stats',
  authorize(config.ROLES.ADMIN, config.ROLES.SUPERADMIN),
  offerController.getOfferStats
);

// Common routes
router.get(
  '/:id',
  offerController.getOfferById
);

module.exports = router;
