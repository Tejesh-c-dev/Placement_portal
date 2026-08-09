/**
 * @file applicationController.js
 * @description Application controller handling HTTP requests for job applications.
 * Manages application submission, status updates, bulk operations,
 * withdrawal, interview rounds, and statistics endpoints.
 */

const { applicationService } = require('../services');
const { companyRepository } = require('../repositories');
const { parsePagination, buildPaginationResponse } = require('../utils/helpers');
const config = require('../config');

/**
 * Async handler wrapper to catch errors and pass to error middleware.
 * @param {Function} fn - Async function to wrap
 * @returns {Function} - Express middleware function
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Apply to a job
 * POST /api/applications
 */
const applyToJob = asyncHandler(async (req, res) => {
  const { jobId, coverLetter, customAnswers } = req.body;
  
  const application = await applicationService.applyToJob(
    req.user._id,
    jobId,
    { coverLetter, customAnswers }
  );
  
  res.status(201).json({
    status: 'success',
    message: 'Application submitted successfully',
    data: { application },
  });
});

/**
 * Get application by ID
 * GET /api/applications/:id
 */
const getApplicationById = asyncHandler(async (req, res) => {
  const application = await applicationService.getApplicationById(
    req.params.id,
    req.user._id,
    req.user.role
  );
  
  res.status(200).json({
    status: 'success',
    data: { application },
  });
});

/**
 * Get student's applications
 * GET /api/applications/my-applications
 */
const getMyApplications = asyncHandler(async (req, res) => {
  const { page, limit } = parsePagination(req.query);
  const { status } = req.query;
  
  const options = { page, limit };
  if (status) options.filter = { status };
  
  const result = await applicationService.getStudentApplications(req.user._id, options);
  
  res.status(200).json({
    status: 'success',
    data: buildPaginationResponse(result.data, result.total, page, limit),
  });
});

/**
 * Get applications for a job (recruiter)
 * GET /api/applications/job/:jobId
 */
const getJobApplications = asyncHandler(async (req, res) => {
  const { page, limit } = parsePagination(req.query);
  const { status } = req.query;
  
  const options = { page, limit };
  if (status) options.filter = { status };
  
  const result = await applicationService.getJobApplications(
    req.params.jobId,
    req.user._id,
    options
  );
  
  res.status(200).json({
    status: 'success',
    data: buildPaginationResponse(result.data, result.total, page, limit),
  });
});

/**
 * Update application status (recruiter)
 * PATCH /api/applications/:id/status
 */
const updateStatus = asyncHandler(async (req, res) => {
  const { status, remarks } = req.body;
  
  const application = await applicationService.updateStatus(
    req.params.id,
    req.user._id,
    status,
    remarks
  );
  
  res.status(200).json({
    status: 'success',
    message: 'Application status updated',
    data: { application },
  });
});

/**
 * Bulk update application status
 * PATCH /api/applications/bulk-status
 */
const bulkUpdateStatus = asyncHandler(async (req, res) => {
  const { applicationIds, status, remarks } = req.body;
  
  const result = await applicationService.bulkUpdateStatus(
    applicationIds,
    req.user._id,
    status,
    remarks
  );
  
  res.status(200).json({
    status: 'success',
    message: `${result.modifiedCount} applications updated`,
  });
});

/**
 * Withdraw application (student)
 * DELETE /api/applications/:id
 */
const withdrawApplication = asyncHandler(async (req, res) => {
  const result = await applicationService.withdrawApplication(req.params.id, req.user._id);
  
  res.status(200).json({
    status: 'success',
    message: result.message,
  });
});

/**
 * Add interview round
 * POST /api/applications/:id/interview
 */
const addInterviewRound = asyncHandler(async (req, res) => {
  const application = await applicationService.addInterviewRound(
    req.params.id,
    req.user._id,
    req.body
  );
  
  res.status(200).json({
    status: 'success',
    message: 'Interview round added',
    data: { application },
  });
});

/**
 * Get application statistics
 * GET /api/applications/stats
 */
const getApplicationStats = asyncHandler(async (req, res) => {
  const { jobId, companyId } = req.query;
  const filters = {};

  if (req.user.role === config.ROLES.STUDENT) {
    filters.student = req.user._id;
  } else if (req.user.role === config.ROLES.RECRUITER) {
    if (jobId) filters.job = jobId;
    if (companyId) filters.company = companyId;
    if (!filters.company && !filters.job) {
      const companyResult = await companyRepository.findByRecruiter(req.user._id);
      const companies = companyResult?.data || companyResult;
      if (Array.isArray(companies) && companies.length > 0) {
        filters.company = companies[0]._id;
      }
    }
  } else {
    if (jobId) filters.job = jobId;
    if (companyId) filters.company = companyId;
  }
  
  const stats = await applicationService.getApplicationStats(filters);
  
  res.status(200).json({
    status: 'success',
    data: stats,
  });
});

/**
 * Get student's application history
 * GET /api/applications/history
 */
const getApplicationHistory = asyncHandler(async (req, res) => {
  const history = await applicationService.getStudentApplicationHistory(req.user._id);
  
  res.status(200).json({
    status: 'success',
    data: { history },
  });
});

module.exports = {
  applyToJob,
  getApplicationById,
  getMyApplications,
  getJobApplications,
  updateStatus,
  bulkUpdateStatus,
  withdrawApplication,
  addInterviewRound,
  getApplicationStats,
  getApplicationHistory,
};
