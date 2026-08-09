/**
 * @file adminController.js
 * @description Admin controller handling HTTP requests for administrative operations.
 * Manages dashboard analytics, user management, placement statistics,
 * data exports, activity logs, system settings, and report generation.
 */

const { adminService, companyService, studentService, jobService, applicationService, announcementService } = require('../services');
const { parsePagination, buildPaginationResponse } = require('../utils/helpers');

/**
 * Async handler wrapper to catch errors and pass to error middleware.
 * @param {Function} fn - Async function to wrap
 * @returns {Function} - Express middleware function
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Get dashboard analytics
 * GET /api/admin/dashboard
 */
const getDashboardAnalytics = asyncHandler(async (req, res) => {
  const analytics = await adminService.getDashboardAnalytics();
  
  res.status(200).json({
    status: 'success',
    data: { analytics },
  });
});

/**
 * Get placement statistics
 * GET /api/admin/stats/placements
 */
const getPlacementStats = asyncHandler(async (req, res) => {
  const { batch, branch } = req.query;
  const stats = await adminService.getPlacementStats({ batch, branch });
  
  res.status(200).json({
    status: 'success',
    data: { stats },
  });
});

/**
 * Get branch-wise analytics
 * GET /api/admin/stats/branch-wise
 */
const getBranchWiseAnalytics = asyncHandler(async (req, res) => {
  const { batch } = req.query;
  const analytics = await adminService.getBranchWiseAnalytics(batch);
  
  res.status(200).json({
    status: 'success',
    data: { analytics },
  });
});

/**
 * Get batch-wise trends
 * GET /api/admin/stats/batch-trends
 */
const getBatchTrends = asyncHandler(async (req, res) => {
  const trends = await adminService.getBatchTrends();
  
  res.status(200).json({
    status: 'success',
    data: { trends },
  });
});

/**
 * Get all users
 * GET /api/admin/users
 */
const getAllUsers = asyncHandler(async (req, res) => {
  const { page, limit } = parsePagination(req.query);
  const { role, status, isActive, search } = req.query;

  const result = await adminService.getAllUsers({ role, status, isActive, search }, { page, limit });
  const counts = await adminService.getUserCounts();

  res.status(200).json({
    status: 'success',
    data: {
      users: result.data,
      total: result.total,
      activeCount: counts.active,
      studentCount: counts.student,
      recruiterCount: counts.recruiter,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
      hasNextPage: result.hasNextPage,
      hasPrevPage: result.hasPrevPage,
    },
  });
});

/**
 * Get user by ID
 * GET /api/admin/users/:id
 */
const getUserById = asyncHandler(async (req, res) => {
  const user = await adminService.getUserById(req.params.id);
  
  res.status(200).json({
    status: 'success',
    data: { user },
  });
});

/**
 * Update user status
 * PATCH /api/admin/users/:id/status
 */
const updateUserStatus = asyncHandler(async (req, res) => {
  const { isActive, reason } = req.body;
  const user = await adminService.updateUserStatus(req.params.id, isActive, reason);
  
  res.status(200).json({
    status: 'success',
    message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
    data: { user },
  });
});

/**
 * Change user role
 * PATCH /api/admin/users/:id/role
 */
const changeUserRole = asyncHandler(async (req, res) => {
  const { role } = req.body;
  const user = await adminService.changeUserRole(req.params.id, role);
  
  res.status(200).json({
    status: 'success',
    message: 'User role updated successfully',
    data: { user },
  });
});

/**
 * Delete user
 * DELETE /api/admin/users/:id
 */
const deleteUser = asyncHandler(async (req, res) => {
  await adminService.deleteUser(req.params.id);
  
  res.status(200).json({
    status: 'success',
    message: 'User deleted successfully',
  });
});

/**
 * Export students to CSV
 * GET /api/admin/export/students
 */
const exportStudentsCSV = asyncHandler(async (req, res) => {
  const { batch, branch, placementStatus } = req.query;
  const csvPath = await adminService.exportStudentsToCSV({ batch, branch, placementStatus });
  
  res.download(csvPath, 'students.csv', (err) => {
    if (err) {
      console.error('Error downloading CSV:', err);
    }
  });
});

/**
 * Export placements to CSV
 * GET /api/admin/export/placements
 */
const exportPlacementsCSV = asyncHandler(async (req, res) => {
  const { batch, branch } = req.query;
  const csvPath = await adminService.exportPlacementsToCSV({ batch, branch });
  
  res.download(csvPath, 'placements.csv', (err) => {
    if (err) {
      console.error('Error downloading CSV:', err);
    }
  });
});

/**
 * Get activity logs
 * GET /api/admin/logs
 */
const getActivityLogs = asyncHandler(async (req, res) => {
  const { page, limit } = parsePagination(req.query);
  const { type, userId, startDate, endDate } = req.query;
  
  const result = await adminService.getActivityLogs({
    page,
    limit,
    type,
    userId,
    startDate,
    endDate,
  });
  
  res.status(200).json({
    status: 'success',
    data: buildPaginationResponse(result.data, result.total, page, limit),
  });
});

/**
 * Send bulk notification
 * POST /api/admin/notifications/send
 */
const sendBulkNotification = asyncHandler(async (req, res) => {
  const { recipients, subject, message, type } = req.body;
  
  await adminService.sendBulkNotification({
    recipients,
    subject,
    message,
    type,
    sentBy: req.user._id,
  });
  
  res.status(200).json({
    status: 'success',
    message: 'Notification sent successfully',
  });
});

/**
 * Get system settings
 * GET /api/admin/settings
 */
const getSystemSettings = asyncHandler(async (req, res) => {
  const settings = await adminService.getSystemSettings();
  
  res.status(200).json({
    status: 'success',
    data: { settings },
  });
});

/**
 * Update system settings
 * PATCH /api/admin/settings
 */
const updateSystemSettings = asyncHandler(async (req, res) => {
  const settings = await adminService.updateSystemSettings(req.body);
  
  res.status(200).json({
    status: 'success',
    message: 'Settings updated successfully',
    data: { settings },
  });
});

/**
 * Get audit trail
 * GET /api/admin/audit
 */
const getAuditTrail = asyncHandler(async (req, res) => {
  const { page, limit } = parsePagination(req.query);
  const { entity, action, startDate, endDate } = req.query;
  
  const result = await adminService.getAuditTrail({
    page,
    limit,
    entity,
    action,
    startDate,
    endDate,
  });
  
  res.status(200).json({
    status: 'success',
    data: buildPaginationResponse(result.data, result.total, page, limit),
  });
});

/**
 * Get unplaced students
 * GET /api/admin/students/unplaced
 */
const getUnplacedStudents = asyncHandler(async (req, res) => {
  const { page, limit } = parsePagination(req.query);
  const { batch, branch, minCGPA } = req.query;
  
  const result = await studentService.getUnplacedStudents({
    page,
    limit,
    batch,
    branch,
    minCGPA: minCGPA ? parseFloat(minCGPA) : undefined,
  });
  
  res.status(200).json({
    status: 'success',
    data: buildPaginationResponse(result.data, result.total, page, limit),
  });
});

/**
 * Get top recruiters
 * GET /api/admin/companies/top-recruiters
 */
const getTopRecruiters = asyncHandler(async (req, res) => {
  const { batch, topN } = req.query;
  const companies = await adminService.getTopRecruiters(batch, parseInt(topN) || 10);

  res.status(200).json({
    status: 'success',
    data: { companies },
  });
});

/**
 * Get all companies (admin)
 * GET /api/admin/companies
 */
const getAllCompanies = asyncHandler(async (req, res) => {
  const { page, limit } = parsePagination(req.query);
  const { status, search } = req.query;

  const result = await adminService.getAllCompanies({ status, search }, { page, limit });

  res.status(200).json({
    status: 'success',
    data: {
      companies: result.data,
      pendingCount: result.pendingCount,
      approvedCount: result.approvedCount,
      rejectedCount: result.rejectedCount,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
      hasNextPage: result.hasNextPage,
      hasPrevPage: result.hasPrevPage,
    },
  });
});

/**
 * Generate placement report
 * GET /api/admin/reports/placement
 */
const generatePlacementReport = asyncHandler(async (req, res) => {
  const { batch, format = 'json' } = req.query;
  
  const report = await adminService.generatePlacementReport(batch);
  
  if (format === 'pdf') {
    // PDF generation would be implemented here
    res.status(501).json({
      status: 'error',
      message: 'PDF generation not yet implemented',
    });
    return;
  }
  
  res.status(200).json({
    status: 'success',
    data: { report },
  });
});

module.exports = {
  getDashboardAnalytics,
  getPlacementStats,
  getBranchWiseAnalytics,
  getBatchTrends,
  getAllUsers,
  getUserById,
  updateUserStatus,
  changeUserRole,
  deleteUser,
  exportStudentsCSV,
  exportPlacementsCSV,
  getActivityLogs,
  sendBulkNotification,
  getSystemSettings,
  updateSystemSettings,
  getAuditTrail,
  getUnplacedStudents,
  getTopRecruiters,
  getAllCompanies,
  generatePlacementReport,
};
