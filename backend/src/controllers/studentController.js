/**
 * @file studentController.js
 * @description Student controller handling HTTP requests for student profile operations.
 * Manages profile CRUD, resume upload/delete, placement statistics,
 * student search, and batch/branch filtering endpoints.
 */

const { studentService } = require('../services');
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
 * Create student profile
 * POST /api/students/profile
 */
const createProfile = asyncHandler(async (req, res) => {
  const profile = await studentService.createProfile(req.user._id, req.body);
  
  res.status(201).json({
    status: 'success',
    message: 'Profile created successfully',
    data: { profile },
  });
});

/**
 * Get own profile
 * GET /api/students/profile
 */
const getProfile = asyncHandler(async (req, res) => {
  const profile = await studentService.getProfileByUserId(req.user._id);
  
  res.status(200).json({
    status: 'success',
    data: { profile },
  });
});

/**
 * Get profile by user ID (admin)
 * GET /api/students/profile/:userId
 */
const getProfileByUserId = asyncHandler(async (req, res) => {
  const profile = await studentService.getProfileByUserId(req.params.userId);
  
  res.status(200).json({
    status: 'success',
    data: { profile },
  });
});

/**
 * Update profile
 * PATCH /api/students/profile
 */
const updateProfile = asyncHandler(async (req, res) => {
  const profile = await studentService.updateProfile(req.user._id, req.body);
  
  res.status(200).json({
    status: 'success',
    message: 'Profile updated successfully',
    data: { profile },
  });
});

/**
 * Upload resume
 * POST /api/students/profile/resume
 */
const uploadResume = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      status: 'fail',
      message: 'Please upload a PDF file',
    });
  }

  const profile = await studentService.uploadResume(req.user._id, req.file);
  
  res.status(200).json({
    status: 'success',
    message: 'Resume uploaded successfully',
    data: { profile },
  });
});

/**
 * Delete resume
 * DELETE /api/students/profile/resume
 */
const deleteResume = asyncHandler(async (req, res) => {
  const result = await studentService.deleteResume(req.user._id);
  
  res.status(200).json({
    status: 'success',
    message: result.message,
  });
});

/**
 * Get all students (admin)
 * GET /api/students
 */
const getAllStudents = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const result = await studentService.getAllStudents({ page, limit });
  
  res.status(200).json({
    status: 'success',
    data: buildPaginationResponse(result.data, result.total, page, limit),
  });
});

/**
 * Search students
 * GET /api/students/search
 */
const searchStudents = asyncHandler(async (req, res) => {
  const { q } = req.query;
  const { page, limit } = parsePagination(req.query);
  
  const result = await studentService.searchStudents(q, { page, limit });
  
  res.status(200).json({
    status: 'success',
    data: buildPaginationResponse(result.data, result.total, page, limit),
  });
});

/**
 * Get students by batch and branch
 * GET /api/students/filter
 */
const getStudentsByFilter = asyncHandler(async (req, res) => {
  const { batch, branch } = req.query;
  const { page, limit } = parsePagination(req.query);
  
  const result = await studentService.getStudentsByBatchAndBranch(
    batch ? parseInt(batch) : null,
    branch,
    { page, limit }
  );
  
  res.status(200).json({
    status: 'success',
    data: buildPaginationResponse(result.data, result.total, page, limit),
  });
});

/**
 * Get profile suggestions
 * GET /api/students/profile/suggestions
 */
const getProfileSuggestions = asyncHandler(async (req, res) => {
  const suggestions = await studentService.getProfileSuggestions(req.user._id);
  
  res.status(200).json({
    status: 'success',
    data: suggestions,
  });
});

/**
 * Opt out of placements
 * POST /api/students/opt-out
 */
const optOut = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  const result = await studentService.optOutOfPlacements(req.user._id, reason);
  
  res.status(200).json({
    status: 'success',
    message: result.message,
  });
});

/**
 * Get placement stats
 * GET /api/students/stats/placement
 */
const getPlacementStats = asyncHandler(async (req, res) => {
  const { batch } = req.query;
  const stats = await studentService.getPlacementStats(batch);
  
  res.status(200).json({
    status: 'success',
    data: { stats },
  });
});

/**
 * Get batch stats
 * GET /api/students/stats/batch
 */
const getBatchStats = asyncHandler(async (req, res) => {
  const stats = await studentService.getBatchStats();
  
  res.status(200).json({
    status: 'success',
    data: { stats },
  });
});

/**
 * Get skills distribution
 * GET /api/students/stats/skills
 */
const getSkillsDistribution = asyncHandler(async (req, res) => {
  const { batch } = req.query;
  const distribution = await studentService.getSkillsDistribution(batch);
  
  res.status(200).json({
    status: 'success',
    data: { distribution },
  });
});

module.exports = {
  createProfile,
  getProfile,
  getProfileByUserId,
  updateProfile,
  uploadResume,
  deleteResume,
  getAllStudents,
  searchStudents,
  getStudentsByFilter,
  getProfileSuggestions,
  optOut,
  getPlacementStats,
  getBatchStats,
  getSkillsDistribution,
};
