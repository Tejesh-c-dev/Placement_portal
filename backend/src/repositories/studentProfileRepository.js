/**
 * @file studentProfileRepository.js
 * @description Student profile repository with academic and placement-related queries.
 * Supports eligibility filtering, batch/branch queries, placement statistics,
 * skills distribution analysis, and resume management.
 */

const BaseRepository = require('./BaseRepository');
const StudentProfile = require('../models/StudentProfile');

class StudentProfileRepository extends BaseRepository {
  constructor() {
    super(StudentProfile);
  }

  async findByUserId(userId) {
    return this.model.findOne({ user: userId }).populate('user', 'firstName lastName email phone');
  }

  async findByRollNumber(rollNumber) {
    return this.model.findOne({ rollNumber: rollNumber.toUpperCase() });
  }

  async findEligibleStudents(criteria, options = {}) {
    const filter = {
      isEligibleForPlacements: true,
      cgpa: { $gte: criteria.minCGPA || 0 },
      activeBacklogs: { $lte: criteria.maxActiveBacklogs || 999 },
    };

    if (criteria.allowedBranches && criteria.allowedBranches.length > 0 && !criteria.allowedBranches.includes('All')) {
      filter.branch = { $in: criteria.allowedBranches };
    }

    if (criteria.allowedBatches && criteria.allowedBatches.length > 0) {
      filter.batch = { $in: criteria.allowedBatches };
    }

    if (criteria.minTenthPercentage) {
      filter.tenthPercentage = { $gte: criteria.minTenthPercentage };
    }

    if (criteria.minTwelfthPercentage) {
      filter.twelfthPercentage = { $gte: criteria.minTwelfthPercentage };
    }

    return this.findAll(filter, {
      ...options,
      populate: [{ path: 'user', select: 'firstName lastName email' }],
    });
  }

  async findByBatchAndBranch(batch, branch, options = {}) {
    const filter = {};
    if (batch) filter.batch = batch;
    if (branch) filter.branch = branch;

    return this.findAll(filter, {
      ...options,
      populate: [{ path: 'user', select: 'firstName lastName email' }],
    });
  }

  async updateResume(userId, resumeData) {
    return this.model.findOneAndUpdate(
      { user: userId },
      { resume: resumeData },
      { new: true }
    );
  }

  async updatePlacementStatus(userId, status, isPlaced = false) {
    return this.model.findOneAndUpdate(
      { user: userId },
      { placementStatus: status, isPlaced },
      { new: true }
    );
  }

  async getPlacementStats(batch) {
    const matchStage = batch ? { $match: { batch: parseInt(batch) } } : { $match: {} };

    return this.aggregate([
      matchStage,
      {
        $group: {
          _id: {
            branch: '$branch',
            isPlaced: '$isPlaced',
          },
          count: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: '$_id.branch',
          total: { $sum: '$count' },
          placed: {
            $sum: {
              $cond: ['$_id.isPlaced', '$count', 0],
            },
          },
        },
      },
      {
        $project: {
          branch: '$_id',
          total: 1,
          placed: 1,
          placementRate: {
            $multiply: [
              { $divide: ['$placed', '$total'] },
              100,
            ],
          },
        },
      },
      { $sort: { branch: 1 } },
    ]);
  }

  async getBatchStats() {
    return this.aggregate([
      {
        $group: {
          _id: '$batch',
          total: { $sum: 1 },
          placed: {
            $sum: { $cond: ['$isPlaced', 1, 0] },
          },
          avgCGPA: { $avg: '$cgpa' },
        },
      },
      {
        $project: {
          batch: '$_id',
          total: 1,
          placed: 1,
          avgCGPA: { $round: ['$avgCGPA', 2] },
          placementRate: {
            $round: [
              { $multiply: [{ $divide: ['$placed', '$total'] }, 100] },
              2,
            ],
          },
        },
      },
      { $sort: { batch: -1 } },
    ]);
  }

  async searchProfiles(searchTerm, options = {}) {
    const filter = {
      $or: [
        { rollNumber: { $regex: searchTerm, $options: 'i' } },
        { skills: { $in: [new RegExp(searchTerm, 'i')] } },
      ],
    };

    return this.findAll(filter, {
      ...options,
      populate: [{ path: 'user', select: 'firstName lastName email' }],
    });
  }

  async getSkillsDistribution(batch) {
    const matchStage = batch ? { $match: { batch: parseInt(batch) } } : { $match: {} };

    return this.aggregate([
      matchStage,
      { $unwind: '$skills' },
      {
        $group: {
          _id: { $toLower: '$skills' },
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 20 },
      {
        $project: {
          skill: '$_id',
          count: 1,
          _id: 0,
        },
      },
    ]);
  }
}

module.exports = new StudentProfileRepository();
