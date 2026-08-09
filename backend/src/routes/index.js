/**
 * @file index.js
 * @description Main router configuration mounting all API routes.
 * Provides health check, version info, and mounts sub-routers for:
 * auth, users, students, jobs, applications, companies, offers, announcements, admin.
 */

const express = require('express');
const authRoutes = require('./authRoutes');
const studentRoutes = require('./studentRoutes');
const jobRoutes = require('./jobRoutes');
const applicationRoutes = require('./applicationRoutes');
const companyRoutes = require('./companyRoutes');
const adminRoutes = require('./adminRoutes');
const announcementRoutes = require('./announcementRoutes');
const offerRoutes = require('./offerRoutes');
const userRoutes = require('./userRoutes');

const router = express.Router();

// Health check
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'API is running',
    timestamp: new Date().toISOString(),
  });
});

// API version info
router.get('/version', (req, res) => {
  res.status(200).json({
    status: 'success',
    data: {
      version: '1.0.0',
      name: 'College Placement Portal API',
    },
  });
});

// Mount routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/students', studentRoutes);
router.use('/jobs', jobRoutes);
router.use('/applications', applicationRoutes);
router.use('/companies', companyRoutes);
router.use('/offers', offerRoutes);
router.use('/announcements', announcementRoutes);
router.use('/admin', adminRoutes);

module.exports = router;
