/**
 * @file index.js
 * @description Central export file for all Mongoose models.
 * Provides a single import point for User, StudentProfile, Company, Job,
 * Application, Offer, and Announcement models.
 */

const User = require('./User');
const StudentProfile = require('./StudentProfile');
const Company = require('./Company');
const Job = require('./Job');
const Application = require('./Application');
const Offer = require('./Offer');
const Announcement = require('./Announcement');

module.exports = {
  User,
  StudentProfile,
  Company,
  Job,
  Application,
  Offer,
  Announcement,
};
