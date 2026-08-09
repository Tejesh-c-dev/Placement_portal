/**
 * @file announcementController.js
 * @description Announcement controller handling HTTP requests for announcements.
 * Manages announcement CRUD, pinning, activation, urgent announcements,
 * email notifications, and statistics endpoints.
 */

const { announcementService } = require('../services');
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
 * Create announcement
 * POST /api/announcements
 */
const createAnnouncement = asyncHandler(async (req, res) => {
  const announcement = await announcementService.createAnnouncement(req.user._id, req.body);
  
  res.status(201).json({
    status: 'success',
    message: 'Announcement created successfully',
    data: { announcement },
  });
});

/**
 * Get all announcements (admin)
 * GET /api/announcements/all
 */
const getAllAnnouncements = asyncHandler(async (req, res) => {
  const { page, limit } = parsePagination(req.query);
  const { type, priority, isActive } = req.query;
  
  const result = await announcementService.getAllAnnouncements({
    page,
    limit,
    type,
    priority,
    isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
  });
  
  res.status(200).json({
    status: 'success',
    data: buildPaginationResponse(result.data, result.total, page, limit),
  });
});

/**
 * Get announcements for user
 * GET /api/announcements
 */
const getAnnouncementsForUser = asyncHandler(async (req, res) => {
  const { page, limit } = parsePagination(req.query);
  const announcements = await announcementService.getAnnouncementsForUser(req.user._id, { page, limit });
  
  res.status(200).json({
    status: 'success',
    data: buildPaginationResponse(announcements.data, announcements.total, page, limit),
  });
});

/**
 * Get announcement by ID
 * GET /api/announcements/:id
 */
const getAnnouncementById = asyncHandler(async (req, res) => {
  const announcement = await announcementService.getAnnouncementById(req.params.id, req.user);
  
  res.status(200).json({
    status: 'success',
    data: { announcement },
  });
});

/**
 * Update announcement
 * PATCH /api/announcements/:id
 */
const updateAnnouncement = asyncHandler(async (req, res) => {
  const announcement = await announcementService.updateAnnouncement(req.params.id, req.body);
  
  res.status(200).json({
    status: 'success',
    message: 'Announcement updated successfully',
    data: { announcement },
  });
});

/**
 * Delete announcement
 * DELETE /api/announcements/:id
 */
const deleteAnnouncement = asyncHandler(async (req, res) => {
  await announcementService.deleteAnnouncement(req.params.id);
  
  res.status(200).json({
    status: 'success',
    message: 'Announcement deleted successfully',
  });
});

/**
 * Toggle announcement active status
 * PATCH /api/announcements/:id/toggle-active
 */
const toggleActive = asyncHandler(async (req, res) => {
  const announcement = await announcementService.toggleActive(req.params.id);
  
  res.status(200).json({
    status: 'success',
    message: `Announcement ${announcement.isActive ? 'activated' : 'deactivated'}`,
    data: { announcement },
  });
});

/**
 * Pin announcement
 * PATCH /api/announcements/:id/pin
 */
const pinAnnouncement = asyncHandler(async (req, res) => {
  const announcement = await announcementService.pinAnnouncement(req.params.id);
  
  res.status(200).json({
    status: 'success',
    message: 'Announcement pinned',
    data: { announcement },
  });
});

/**
 * Unpin announcement
 * PATCH /api/announcements/:id/unpin
 */
const unpinAnnouncement = asyncHandler(async (req, res) => {
  const announcement = await announcementService.unpinAnnouncement(req.params.id);
  
  res.status(200).json({
    status: 'success',
    message: 'Announcement unpinned',
    data: { announcement },
  });
});

/**
 * Get urgent announcements
 * GET /api/announcements/urgent
 */
const getUrgentAnnouncements = asyncHandler(async (req, res) => {
  const announcements = await announcementService.getUrgentAnnouncements();
  
  res.status(200).json({
    status: 'success',
    data: { announcements },
  });
});

/**
 * Get announcement statistics
 * GET /api/announcements/stats
 */
const getAnnouncementStats = asyncHandler(async (req, res) => {
  const stats = await announcementService.getAnnouncementStats();
  
  res.status(200).json({
    status: 'success',
    data: { stats },
  });
});

/**
 * Send announcement email notification
 * POST /api/announcements/:id/send-email
 */
const sendAnnouncementEmail = asyncHandler(async (req, res) => {
  await announcementService.sendAnnouncementEmail(req.params.id);
  
  res.status(200).json({
    status: 'success',
    message: 'Email notification queued successfully',
  });
});

module.exports = {
  createAnnouncement,
  getAllAnnouncements,
  getAnnouncementsForUser,
  getAnnouncementById,
  updateAnnouncement,
  deleteAnnouncement,
  toggleActive,
  pinAnnouncement,
  unpinAnnouncement,
  getUrgentAnnouncements,
  getAnnouncementStats,
  sendAnnouncementEmail,
};
