/**
 * @file offerController.js
 * @description Offer controller handling HTTP requests for job offer operations.
 * Manages offer creation, acceptance, decline, revocation,
 * expiring offers, and statistics endpoints.
 */

const { offerRepository, applicationRepository, studentProfileRepository } = require('../repositories');
const { parsePagination, buildPaginationResponse } = require('../utils/helpers');
const AppError = require('../utils/AppError');

/**
 * Async handler wrapper to catch errors and pass to error middleware.
 * @param {Function} fn - Async function to wrap
 * @returns {Function} - Express middleware function
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Create offer
 * POST /api/offers
 */
const createOffer = asyncHandler(async (req, res) => {
  const { applicationId, ctc, joiningDate, offerLetterUrl, expiresAt } = req.body;
  
  // Verify application exists and is in selected status
  const application = await applicationRepository.findById(applicationId);
  if (!application) {
    throw new AppError('Application not found', 404);
  }
  
  if (application.status !== 'selected') {
    throw new AppError('Can only create offer for selected applications', 400);
  }
  
  // Check if offer already exists
  const existingOffer = await offerRepository.findByApplicationId(applicationId);
  if (existingOffer) {
    throw new AppError('Offer already exists for this application', 400);
  }
  
  const offer = await offerRepository.create({
    application: applicationId,
    student: application.student,
    job: application.job,
    company: application.company,
    ctc,
    joiningDate,
    offerLetterUrl,
    expiresAt: expiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default 7 days
    issuedBy: req.user._id,
  });
  
  res.status(201).json({
    status: 'success',
    message: 'Offer created successfully',
    data: { offer },
  });
});

/**
 * Get offer by ID
 * GET /api/offers/:id
 */
const getOfferById = asyncHandler(async (req, res) => {
  const offer = await offerRepository.findById(req.params.id, [
    { path: 'job', select: 'postedBy title' },
    { path: 'company', select: 'registeredBy name' },
  ]);
  
  if (!offer) {
    throw new AppError('Offer not found', 404);
  }

  const { role, _id: userId } = req.user;
  const isStudentOwner = role === 'student' && offer.student.toString() === userId.toString();
  const isJobOwner = role === 'recruiter' && (
    (offer.job && offer.job.postedBy && offer.job.postedBy.toString() === userId.toString()) ||
    (offer.company && offer.company.registeredBy && offer.company.registeredBy.toString() === userId.toString())
  );
  const isAdmin = ['admin', 'superadmin'].includes(role);

  if (!isStudentOwner && !isJobOwner && !isAdmin) {
    throw new AppError('You do not have permission to access this offer', 403);
  }
  
  res.status(200).json({
    status: 'success',
    data: { offer },
  });
});

/**
 * Get offers for student
 * GET /api/offers/my-offers
 */
const getMyOffers = asyncHandler(async (req, res) => {
  const { page, limit } = parsePagination(req.query);
  const result = await offerRepository.findByStudent(req.user._id, { page, limit });
  
  res.status(200).json({
    status: 'success',
    data: buildPaginationResponse(result.data, result.total, page, limit),
  });
});

/**
 * Get offers by job
 * GET /api/offers/job/:jobId
 */
const getOffersByJob = asyncHandler(async (req, res) => {
  const { page, limit } = parsePagination(req.query);
  const result = await offerRepository.findByJob(req.params.jobId, { page, limit });
  
  res.status(200).json({
    status: 'success',
    data: buildPaginationResponse(result.data, result.total, page, limit),
  });
});

/**
 * Accept offer
 * PATCH /api/offers/:id/accept
 */
const acceptOffer = asyncHandler(async (req, res) => {
  const offer = await offerRepository.findById(req.params.id);
  
  if (!offer) {
    throw new AppError('Offer not found', 404);
  }
  
  if (offer.student.toString() !== req.user._id.toString()) {
    throw new AppError('You can only accept your own offers', 403);
  }
  
  if (offer.status !== 'pending') {
    throw new AppError(`Cannot accept offer with status: ${offer.status}`, 400);
  }
  
  if (new Date(offer.expiresAt) < new Date()) {
    throw new AppError('Offer has expired', 400);
  }
  
  const updatedOffer = await offerRepository.updateById(req.params.id, {
    status: 'accepted',
    respondedAt: new Date(),
  });
  
  // Update student placement status
  await studentProfileRepository.updateByUserId(req.user._id, {
    placementStatus: 'placed',
    'placement.company': offer.company,
    'placement.job': offer.job,
    'placement.ctc': offer.ctc,
    'placement.joiningDate': offer.joiningDate,
  });
  
  res.status(200).json({
    status: 'success',
    message: 'Offer accepted successfully',
    data: { offer: updatedOffer },
  });
});

/**
 * Decline offer
 * PATCH /api/offers/:id/decline
 */
const declineOffer = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  const offer = await offerRepository.findById(req.params.id);
  
  if (!offer) {
    throw new AppError('Offer not found', 404);
  }
  
  if (offer.student.toString() !== req.user._id.toString()) {
    throw new AppError('You can only decline your own offers', 403);
  }
  
  if (offer.status !== 'pending') {
    throw new AppError(`Cannot decline offer with status: ${offer.status}`, 400);
  }
  
  const updatedOffer = await offerRepository.updateById(req.params.id, {
    status: 'declined',
    respondedAt: new Date(),
    declineReason: reason,
  });
  
  res.status(200).json({
    status: 'success',
    message: 'Offer declined',
    data: { offer: updatedOffer },
  });
});

/**
 * Revoke offer
 * PATCH /api/offers/:id/revoke
 */
const revokeOffer = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  const offer = await offerRepository.findById(req.params.id);
  
  if (!offer) {
    throw new AppError('Offer not found', 404);
  }
  
  if (!['pending', 'accepted'].includes(offer.status)) {
    throw new AppError(`Cannot revoke offer with status: ${offer.status}`, 400);
  }
  
  const updatedOffer = await offerRepository.updateById(req.params.id, {
    status: 'revoked',
    revokedReason: reason,
    revokedAt: new Date(),
    revokedBy: req.user._id,
  });
  
  // If offer was accepted, update student status back
  if (offer.status === 'accepted') {
    await studentProfileRepository.updateByUserId(offer.student, {
      placementStatus: 'not_placed',
      $unset: { placement: 1 },
    });
  }
  
  res.status(200).json({
    status: 'success',
    message: 'Offer revoked',
    data: { offer: updatedOffer },
  });
});

/**
 * Get offer statistics
 * GET /api/offers/stats
 */
const getOfferStats = asyncHandler(async (req, res) => {
  const { batch, branch } = req.query;
  const stats = await offerRepository.getOfferStats({ batch, branch });
  
  res.status(200).json({
    status: 'success',
    data: { stats },
  });
});

/**
 * Get pending offers (admin)
 * GET /api/offers/pending
 */
const getPendingOffers = asyncHandler(async (req, res) => {
  const { page, limit } = parsePagination(req.query);
  const result = await offerRepository.findByCondition(
    { status: 'pending' },
    { page, limit, sort: { expiresAt: 1 } }
  );
  
  res.status(200).json({
    status: 'success',
    data: buildPaginationResponse(result.data, result.total, page, limit),
  });
});

/**
 * Get expiring offers
 * GET /api/offers/expiring
 */
const getExpiringOffers = asyncHandler(async (req, res) => {
  const { days = 3 } = req.query;
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + parseInt(days));
  
  const offers = await offerRepository.findByCondition({
    status: 'pending',
    expiresAt: { $lte: expiryDate, $gte: new Date() },
  });
  
  res.status(200).json({
    status: 'success',
    data: { offers },
  });
});

module.exports = {
  createOffer,
  getOfferById,
  getMyOffers,
  getOffersByJob,
  acceptOffer,
  declineOffer,
  revokeOffer,
  getOfferStats,
  getPendingOffers,
  getExpiringOffers,
};
