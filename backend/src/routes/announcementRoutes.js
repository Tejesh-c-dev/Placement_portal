/**
 * @file announcementRoutes.js
 * @description Announcement routes for placement announcements.
 * Defines user routes (list, urgent), admin routes (CRUD, statistics,
 * pin/unpin, toggle active, email notifications).
 */

const express = require('express');
const { announcementController } = require('../controllers');
const { validate } = require('../middleware/validate');
const { announcementSchemas } = require('../validators');
const { authenticate, authorize } = require('../middleware/auth');
const config = require('../config');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Student routes
router.get(
  '/',
  announcementController.getAnnouncementsForUser
);

router.get(
  '/urgent',
  announcementController.getUrgentAnnouncements
);

// Admin routes
router.post(
  '/',
  authorize(config.ROLES.ADMIN, config.ROLES.SUPERADMIN),
  validate(announcementSchemas.createAnnouncement),
  announcementController.createAnnouncement
);

router.get(
  '/all',
  authorize(config.ROLES.ADMIN, config.ROLES.SUPERADMIN),
  announcementController.getAllAnnouncements
);

router.get(
  '/stats',
  authorize(config.ROLES.ADMIN, config.ROLES.SUPERADMIN),
  announcementController.getAnnouncementStats
);

router.patch(
  '/:id',
  authorize(config.ROLES.ADMIN, config.ROLES.SUPERADMIN),
  validate(announcementSchemas.updateAnnouncement),
  announcementController.updateAnnouncement
);

router.delete(
  '/:id',
  authorize(config.ROLES.ADMIN, config.ROLES.SUPERADMIN),
  announcementController.deleteAnnouncement
);

router.patch(
  '/:id/toggle-active',
  authorize(config.ROLES.ADMIN, config.ROLES.SUPERADMIN),
  announcementController.toggleActive
);

router.patch(
  '/:id/pin',
  authorize(config.ROLES.ADMIN, config.ROLES.SUPERADMIN),
  announcementController.pinAnnouncement
);

router.patch(
  '/:id/unpin',
  authorize(config.ROLES.ADMIN, config.ROLES.SUPERADMIN),
  announcementController.unpinAnnouncement
);

router.post(
  '/:id/send-email',
  authorize(config.ROLES.ADMIN, config.ROLES.SUPERADMIN),
  announcementController.sendAnnouncementEmail
);

// Common routes
router.get(
  '/:id',
  announcementController.getAnnouncementById
);

module.exports = router;
