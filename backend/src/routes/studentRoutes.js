/**
 * @file studentRoutes.js
 * @description Student routes for profile management and academic operations.
 * Defines student routes (profile CRUD, resume, suggestions)
 * and admin/recruiter routes (list, search, filter students).
 */

const express = require('express');
const { studentController } = require('../controllers');
const { validate } = require('../middleware/validate');
const { studentSchemas } = require('../validators');
const { authenticate, authorize } = require('../middleware/auth');
const { uploadResume } = require('../middleware/upload');
const config = require('../config');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Student routes
router.post(
  '/profile',
  authorize(config.ROLES.STUDENT),
  validate(studentSchemas.createProfile),
  studentController.createProfile
);

router.get(
  '/profile',
  authorize(config.ROLES.STUDENT),
  studentController.getProfile
);

router.patch(
  '/profile',
  authorize(config.ROLES.STUDENT),
  validate(studentSchemas.updateProfile),
  studentController.updateProfile
);

router.post(
  '/profile/resume',
  authorize(config.ROLES.STUDENT),
  uploadResume,
  studentController.uploadResume
);

router.delete(
  '/profile/resume',
  authorize(config.ROLES.STUDENT),
  studentController.deleteResume
);

router.get(
  '/profile/suggestions',
  authorize(config.ROLES.STUDENT),
  studentController.getProfileSuggestions
);

router.patch(
  '/profile/opt-out',
  authorize(config.ROLES.STUDENT),
  studentController.optOut
);

router.get(
  '/stats',
  authorize(config.ROLES.STUDENT),
  studentController.getPlacementStats
);

// Admin/Recruiter routes for viewing students
router.get(
  '/',
  authorize(config.ROLES.ADMIN, config.ROLES.RECRUITER, config.ROLES.SUPERADMIN),
  studentController.getAllStudents
);

router.get(
  '/search',
  authorize(config.ROLES.ADMIN, config.ROLES.RECRUITER, config.ROLES.SUPERADMIN),
  studentController.searchStudents
);

router.get(
  '/stats/placement',
  authorize(config.ROLES.ADMIN, config.ROLES.SUPERADMIN),
  studentController.getPlacementStats
);

router.get(
  '/:userId',
  authorize(config.ROLES.ADMIN, config.ROLES.RECRUITER, config.ROLES.SUPERADMIN),
  studentController.getProfileByUserId
);

module.exports = router;
