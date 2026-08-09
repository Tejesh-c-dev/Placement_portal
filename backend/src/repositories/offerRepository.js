/**
 * @file offerRepository.js
 * @description Offer repository managing job offer data access.
 * Handles offer lifecycle operations (accept/decline), expiry management,
 * placement statistics by branch/batch, and top offer queries.
 */

const BaseRepository = require('./BaseRepository');
const Offer = require('../models/Offer');

class OfferRepository extends BaseRepository {
  constructor() {
    super(Offer);
  }

  async findByStudent(studentId, options = {}) {
    return this.findAll({ student: studentId }, {
      ...options,
      populate: [
        { path: 'job', select: 'title jobType' },
        { path: 'company', select: 'name logo industry' },
      ],
      sort: { createdAt: -1 },
    });
  }

  async findByCompany(companyId, options = {}) {
    return this.findAll({ company: companyId }, {
      ...options,
      populate: [
        { path: 'student', select: 'firstName lastName email' },
        { path: 'job', select: 'title' },
      ],
    });
  }

  async findPendingOffers(studentId) {
    return this.model
      .find({
        student: studentId,
        status: 'pending',
        expiresAt: { $gt: new Date() },
      })
      .populate('company', 'name logo')
      .populate('job', 'title')
      .sort({ expiresAt: 1 });
  }

  async acceptOffer(offerId, studentId) {
    return this.model.findOneAndUpdate(
      { _id: offerId, student: studentId },
      {
        status: 'accepted',
        respondedAt: new Date(),
      },
      { new: true }
    );
  }

  async declineOffer(offerId, studentId, reason) {
    return this.model.findOneAndUpdate(
      { _id: offerId, student: studentId },
      {
        status: 'declined',
        respondedAt: new Date(),
        declineReason: reason,
      },
      { new: true }
    );
  }

  async getOfferStats(filters = {}) {
    const matchStage = {};
    if (filters.company) matchStage.company = filters.company;
    if (filters.batch) {
      // Need to join with studentProfile
    }

    return this.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalCTC: { $sum: '$offeredCTC' },
          avgCTC: { $avg: '$offeredCTC' },
          maxCTC: { $max: '$offeredCTC' },
          minCTC: { $min: '$offeredCTC' },
        },
      },
      {
        $project: {
          status: '$_id',
          count: 1,
          totalCTC: 1,
          avgCTC: { $round: ['$avgCTC', 0] },
          maxCTC: 1,
          minCTC: 1,
          _id: 0,
        },
      },
    ]);
  }

  async getPlacementStats(batch) {
    const pipeline = [
      {
        $lookup: {
          from: 'studentprofiles',
          localField: 'studentProfile',
          foreignField: '_id',
          as: 'profile',
        },
      },
      { $unwind: '$profile' },
    ];

    if (batch) {
      pipeline.push({ $match: { 'profile.batch': parseInt(batch) } });
    }

    pipeline.push(
      { $match: { status: 'accepted' } },
      {
        $group: {
          _id: '$profile.branch',
          count: { $sum: 1 },
          avgCTC: { $avg: '$offeredCTC' },
          maxCTC: { $max: '$offeredCTC' },
          totalCTC: { $sum: '$offeredCTC' },
        },
      },
      {
        $project: {
          branch: '$_id',
          count: 1,
          avgCTC: { $round: ['$avgCTC', 0] },
          maxCTC: 1,
          totalCTC: 1,
          _id: 0,
        },
      },
      { $sort: { avgCTC: -1 } }
    );

    return this.aggregate(pipeline);
  }

  async expireOffers() {
    return this.model.updateMany(
      {
        status: 'pending',
        expiresAt: { $lt: new Date() },
      },
      { status: 'expired' }
    );
  }

  async getTopOffers(limit = 10) {
    return this.model
      .find({ status: 'accepted' })
      .sort({ offeredCTC: -1 })
      .limit(limit)
      .populate('student', 'firstName lastName')
      .populate('company', 'name logo')
      .populate('studentProfile', 'branch batch')
      .lean();
  }
}

module.exports = new OfferRepository();
