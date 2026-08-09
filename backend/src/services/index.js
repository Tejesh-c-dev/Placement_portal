/**
 * @file index.js
 * @description Central export file for all service modules.
 * Provides a single import point for auth, email, student, job,
 * application, company, admin, and announcement services.
 */

const authService = require('./authService');
const emailService = require('./emailService');
const studentService = require('./studentService');
const jobService = require('./jobService');
const applicationService = require('./applicationService');
const companyService = require('./companyService');
const adminService = require('./adminService');
const announcementService = require('./announcementService');

module.exports = {
  authService,
  emailService,
  studentService,
  jobService,
  applicationService,
  companyService,
  adminService,
  announcementService,
};
