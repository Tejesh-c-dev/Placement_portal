/**
 * @file seed.js
 * @description Seeds a default superadmin account if one does not already exist.
 */

const connectDB = require('../config/database');
const logger = require('../utils/logger');
const { User } = require('../models');

// Read bootstrap credentials from .env; fall back to defaults if unset
const SUPERADMIN_EMAIL = process.env.SUPERADMIN_EMAIL || 'admin@placement.edu';
const SUPERADMIN_PASSWORD = process.env.SUPERADMIN_PASSWORD || 'Admin@123';

const run = async () => {
  try {
    await connectDB();

    const existingUser = await User.findOne({ email: SUPERADMIN_EMAIL });

    if (!existingUser) {
      await User.create({
        email: SUPERADMIN_EMAIL,
        password: SUPERADMIN_PASSWORD,
        firstName: 'Super',
        lastName: 'Admin',
        role: 'superadmin',
        isActive: true,
        isEmailVerified: true,
      });

      logger.info('Created default superadmin account');
    } else {
      logger.info('Default superadmin account already exists');
    }

    process.exit(0);
  } catch (error) {
    logger.error('Database seed failed:', error);
    process.exit(1);
  }
};

run();
