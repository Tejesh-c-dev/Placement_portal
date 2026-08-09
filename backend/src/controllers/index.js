/**
 * @file index.js
 * @description Central export file for all controller modules.
 * Provides a single import point for auth, student, job, application,
 * company, admin, announcement, offer, and user controllers.
 */

const authController = require('./authController');
const studentController = require('./studentController');
const jobController = require('./jobController');
const applicationController = require('./applicationController');
const companyController = require('./companyController');
const adminController = require('./adminController');
const announcementController = require('./announcementController');
const offerController = require('./offerController');
const userController = require('./userController');

module.exports = {
  authController,
  studentController,
  jobController,
  applicationController,
  companyController,
  adminController,
  announcementController,
  offerController,
  userController,
};
