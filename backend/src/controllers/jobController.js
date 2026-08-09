/**
 * @file jobController.js
 * @description Job controller handling HTTP requests for job posting operations.
 * Manages job CRUD, publishing, closing, eligibility checks,
 * job search, featured jobs, and statistics endpoints.
 */

const { jobService } = require('../services');
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
 * Create job
 * POST /api/jobs
 */
const createJob = asyncHandler(async (req, res) => {
  const job = await jobService.createJob(req.user._id, req.body);
  
  res.status(201).json({
    status: 'success',
    message: 'Job created successfully',
    data: { job },
  });
});

/**
 * Get all active jobs
 * GET /api/jobs
 */
const getActiveJobs = asyncHandler(async (req, res) => {
  const { page, limit } = parsePagination(req.query);
  const result = await jobService.getActiveJobs({}, { page, limit });
  
  res.status(200).json({
    status: 'success',
    data: buildPaginationResponse(result.data, result.total, page, limit),
  });
});

/**
 * Get job by ID
 * GET /api/jobs/:id
 */
const getJobById = asyncHandler(async (req, res) => {
  const job = await jobService.getJobById(req.params.id, req.user);
  
  res.status(200).json({
    status: 'success',
    data: { job },
  });
});

/**
 * Update job
 * PATCH /api/jobs/:id
 */
const updateJob = asyncHandler(async (req, res) => {
  const job = await jobService.updateJob(req.params.id, req.user._id, req.body, req.user?.role);
  
  res.status(200).json({
    status: 'success',
    message: 'Job updated successfully',
    data: { job },
  });
});

/**
 * Delete job
 * DELETE /api/jobs/:id
 */
const deleteJob = asyncHandler(async (req, res) => {
  const result = await jobService.deleteJob(req.params.id, req.user._id, req.user?.role);
  
  res.status(200).json({
    status: 'success',
    message: result.message,
  });
});

/**
 * Get jobs by company
 * GET /api/jobs/company/:companyId
 */
const getJobsByCompany = asyncHandler(async (req, res) => {
  const { page, limit } = parsePagination(req.query);
  const result = await jobService.getJobsByCompany(req.params.companyId, { page, limit });
  
  res.status(200).json({
    status: 'success',
    data: buildPaginationResponse(result.data, result.total, page, limit),
  });
});

/**
 * Get recruiter's jobs
 * GET /api/jobs/my-jobs
 */
const getMyJobs = asyncHandler(async (req, res) => {
  const { page, limit } = parsePagination(req.query);
  const result = await jobService.getJobsByRecruiter(req.user._id, { page, limit });
  
  res.status(200).json({
    status: 'success',
    data: buildPaginationResponse(result.data, result.total, page, limit),
  });
});

/**
 * Get eligible jobs for student
 * GET /api/jobs/eligible
 */
const getEligibleJobs = asyncHandler(async (req, res) => {
  const { page, limit } = parsePagination(req.query);
  const result = await jobService.getEligibleJobsForStudent(req.user._id, { page, limit });
  
  res.status(200).json({
    status: 'success',
    data: buildPaginationResponse(result.data, result.total, page, limit),
  });
});

/**
 * Search jobs
 * GET /api/jobs/search
 */
const searchJobs = asyncHandler(async (req, res) => {
  const { q, jobType, minCTC, location, workMode } = req.query;
  const { page, limit } = parsePagination(req.query);
  
  const result = await jobService.searchJobs(
    q || '',
    { jobType, minCTC, location, workMode },
    { page, limit }
  );
  
  res.status(200).json({
    status: 'success',
    data: buildPaginationResponse(result.data, result.total, page, limit),
  });
});

/**
 * Check eligibility for a job
 * GET /api/jobs/:id/eligibility
 */
const checkEligibility = asyncHandler(async (req, res) => {
  const result = await jobService.checkEligibility(req.params.id, req.user._id);
  
  res.status(200).json({
    status: 'success',
    data: result,
  });
});

/**
 * Close job
 * PATCH /api/jobs/:id/close
 */
const closeJob = asyncHandler(async (req, res) => {
  const job = await jobService.closeJob(req.params.id, req.user._id, req.user?.role);
  
  res.status(200).json({
    status: 'success',
    message: 'Job closed successfully',
    data: { job },
  });
});

/**
 * Publish job
 * PATCH /api/jobs/:id/publish
 */
const publishJob = asyncHandler(async (req, res) => {
  const job = await jobService.publishJob(req.params.id, req.user._id, req.user?.role);
  
  res.status(200).json({
    status: 'success',
    message: 'Job published successfully',
    data: { job },
  });
});

/**
 * Get featured jobs
 * GET /api/jobs/featured
 */
const getFeaturedJobs = asyncHandler(async (req, res) => {
  const result = await jobService.getFeaturedJobs(5);
  
  res.status(200).json({
    status: 'success',
    data: { jobs: result.data },
  });
});

/**
 * Get jobs expiring soon
 * GET /api/jobs/expiring-soon
 */
const getExpiringJobs = asyncHandler(async (req, res) => {
  const { days = 3 } = req.query;
  const result = await jobService.getJobsExpiringSoon(parseInt(days));
  
  res.status(200).json({
    status: 'success',
    data: { jobs: result.data },
  });
});

/**
 * Get top paying jobs
 * GET /api/jobs/top-paying
 */
const getTopPayingJobs = asyncHandler(async (req, res) => {
  const { limit = 10 } = req.query;
  const jobs = await jobService.getTopPayingJobs(parseInt(limit));
  
  res.status(200).json({
    status: 'success',
    data: { jobs },
  });
});

/**
 * Get job stats
 * GET /api/jobs/stats
 */
const getJobStats = asyncHandler(async (req, res) => {
  const stats = await jobService.getJobStats();
  
  res.status(200).json({
    status: 'success',
    data: { stats },
  });
});

module.exports = {
  createJob,
  getActiveJobs,
  getJobById,
  updateJob,
  deleteJob,
  getJobsByCompany,
  getMyJobs,
  getEligibleJobs,
  searchJobs,
  checkEligibility,
  closeJob,
  publishJob,
  getFeaturedJobs,
  getExpiringJobs,
  getTopPayingJobs,
  getJobStats,
};
