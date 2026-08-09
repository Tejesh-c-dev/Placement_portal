/**
 * @file index.js
 * @description Central export file for all repository modules.
 * Provides a single import point for user, studentProfile, company, job,
 * application, offer, and announcement repositories.
 */

const userRepository = require('./userRepository');
const studentProfileRepository = require('./studentProfileRepository');
const companyRepository = require('./companyRepository');
const jobRepository = require('./jobRepository');
const applicationRepository = require('./applicationRepository');
const offerRepository = require('./offerRepository');
const announcementRepository = require('./announcementRepository');

module.exports = {
  userRepository,
  studentProfileRepository,
  companyRepository,
  jobRepository,
  applicationRepository,
  offerRepository,
  announcementRepository,
};
