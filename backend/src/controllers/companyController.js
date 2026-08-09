/**
 * @file companyController.js
 * @description Company controller handling HTTP requests for company operations.
 * Manages company registration, updates, approval workflow,
 * HR contacts, search, and statistics endpoints.
 */

const { companyService } = require('../services');
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
 * Register company
 * POST /api/companies
 */
const registerCompany = asyncHandler(async (req, res) => {
  const company = await companyService.registerCompany(req.user._id, req.body);
  
  res.status(201).json({
    status: 'success',
    message: 'Company registered successfully. Awaiting admin approval.',
    data: { company },
  });
});

/**
 * Get company by ID
 * GET /api/companies/:id
 */
const getCompanyById = asyncHandler(async (req, res) => {
  const company = await companyService.getCompanyById(req.params.id);
  
  res.status(200).json({
    status: 'success',
    data: { company },
  });
});

/**
 * Get company by slug
 * GET /api/companies/slug/:slug
 */
const getCompanyBySlug = asyncHandler(async (req, res) => {
  const company = await companyService.getCompanyBySlug(req.params.slug);
  
  res.status(200).json({
    status: 'success',
    data: { company },
  });
});

/**
 * Update company
 * PATCH /api/companies/:id
 */
const updateCompany = asyncHandler(async (req, res) => {
  const company = await companyService.updateCompany(req.params.id, req.user._id, req.body, req.user?.role);
  
  res.status(200).json({
    status: 'success',
    message: 'Company updated successfully',
    data: { company },
  });
});

/**
 * Get recruiter's companies
 * GET /api/companies/my-companies
 */
const getMyCompanies = asyncHandler(async (req, res) => {
  const { page, limit } = parsePagination(req.query);
  const result = await companyService.getCompaniesByRecruiter(req.user._id, { page, limit });
  
  res.status(200).json({
    status: 'success',
    data: buildPaginationResponse(result.data, result.total, page, limit),
  });
});

/**
 * Get all approved companies
 * GET /api/companies
 */
const getApprovedCompanies = asyncHandler(async (req, res) => {
  const { page, limit } = parsePagination(req.query);
  const result = await companyService.getApprovedCompanies({ page, limit });
  
  res.status(200).json({
    status: 'success',
    data: buildPaginationResponse(result.data, result.total, page, limit),
  });
});

/**
 * Search companies
 * GET /api/companies/search
 */
const searchCompanies = asyncHandler(async (req, res) => {
  const { q } = req.query;
  const { page, limit } = parsePagination(req.query);
  
  const result = await companyService.searchCompanies(q || '', { page, limit });
  
  res.status(200).json({
    status: 'success',
    data: buildPaginationResponse(result.data, result.total, page, limit),
  });
});

/**
 * Get pending companies (admin)
 * GET /api/companies/pending
 */
const getPendingCompanies = asyncHandler(async (req, res) => {
  const { page, limit } = parsePagination(req.query);
  const result = await companyService.getPendingCompanies({ page, limit });
  
  res.status(200).json({
    status: 'success',
    data: buildPaginationResponse(result.data, result.total, page, limit),
  });
});

/**
 * Approve company (admin)
 * PATCH /api/companies/:id/approve
 */
const approveCompany = asyncHandler(async (req, res) => {
  const company = await companyService.approveCompany(req.params.id, req.user._id);
  
  res.status(200).json({
    status: 'success',
    message: 'Company approved successfully',
    data: { company },
  });
});

/**
 * Reject company (admin)
 * PATCH /api/companies/:id/reject
 */
const rejectCompany = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  const company = await companyService.rejectCompany(req.params.id, req.user._id, reason);
  
  res.status(200).json({
    status: 'success',
    message: 'Company rejected',
    data: { company },
  });
});

/**
 * Add HR contact
 * POST /api/companies/:id/hr-contacts
 */
const addHRContact = asyncHandler(async (req, res) => {
  const company = await companyService.addHRContact(req.params.id, req.user._id, req.body, req.user?.role);
  
  res.status(200).json({
    status: 'success',
    message: 'HR contact added',
    data: { company },
  });
});

/**
 * Get company statistics
 * GET /api/companies/stats
 */
const getCompanyStats = asyncHandler(async (req, res) => {
  const stats = await companyService.getCompanyStats();
  
  res.status(200).json({
    status: 'success',
    data: { stats },
  });
});

/**
 * Get industry distribution
 * GET /api/companies/stats/industry
 */
const getIndustryDistribution = asyncHandler(async (req, res) => {
  const distribution = await companyService.getIndustryDistribution();
  
  res.status(200).json({
    status: 'success',
    data: { distribution },
  });
});

module.exports = {
  registerCompany,
  getCompanyById,
  getCompanyBySlug,
  updateCompany,
  getMyCompanies,
  getApprovedCompanies,
  searchCompanies,
  getPendingCompanies,
  approveCompany,
  rejectCompany,
  addHRContact,
  getCompanyStats,
  getIndustryDistribution,
};
