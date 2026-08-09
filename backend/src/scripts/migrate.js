/**
 * @file migrate.js
 * @description Synchronizes MongoDB indexes for all application models.
 */

const connectDB = require('../config/database');
const logger = require('../utils/logger');
const { User, StudentProfile, Company, Job, Application, Offer, Announcement } = require('../models');

const models = [User, StudentProfile, Company, Job, Application, Offer, Announcement];

const run = async () => {
  try {
    await connectDB();

    for (const model of models) {
      await model.syncIndexes();
    }

    logger.info('Database migration completed successfully');
    process.exit(0);
  } catch (error) {
    logger.error('Database migration failed:', error);
    process.exit(1);
  }
};

run();
