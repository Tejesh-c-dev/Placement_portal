/**
 * @file jobRepository.js
 * @description Job repository handling job posting data access and queries.
 * Supports active job filtering, eligibility-based job matching for students,
 * job search, application statistics updates, and salary analytics.
 */

const BaseRepository = require('./BaseRepository');
const Job = require('../models/Job');

class JobRepository extends BaseRepository {
  constructor() {
    super(Job);
  }

  async findActiveJobs(options = {}) {
    const filter = {
      status: 'open',
      applicationDeadline: { $gt: new Date() },
    };

    return this.findAll(filter, {
      ...options,
      populate: [{ path: 'company', select: 'name logo industry slug' }],
      sort: { isFeatured: -1, priority: -1, createdAt: -1 },
    });
  }

  async findByCompany(companyId, options = {}) {
    return this.findAll({ company: companyId }, {
      ...options,
      populate: [{ path: 'company', select: 'name logo industry' }],
    });
  }

  async findByRecruiter(recruiterId, options = {}) {
    return this.findAll({ postedBy: recruiterId }, {
      ...options,
      populate: [{ path: 'company', select: 'name logo industry' }],
    });
  }

  async findEligibleJobsForStudent(studentProfile, options = {}) {
    const filter = {
      status: 'open',
      applicationDeadline: { $gt: new Date() },
      'eligibility.minCGPA': { $lte: studentProfile.cgpa },
      'eligibility.maxActiveBacklogs': { $gte: studentProfile.activeBacklogs },
      $or: [
        { 'eligibility.allowedBranches': { $in: [studentProfile.branch, 'All'] } },
        { 'eligibility.allowedBranches': { $size: 0 } },
      ],
    };

    // Check batch eligibility
    if (studentProfile.batch) {
      filter.$and = [
        {
          $or: [
            { 'eligibility.allowedBatches': { $in: [studentProfile.batch] } },
            { 'eligibility.allowedBatches': { $size: 0 } },
          ],
        },
      ];
    }

    return this.findAll(filter, {
      ...options,
      populate: [{ path: 'company', select: 'name logo industry slug' }],
      sort: { isFeatured: -1, priority: -1, 'package.ctc': -1 },
    });
  }

  async searchJobs(searchTerm, filters = {}, options = {}) {
    const query = {
      status: 'open',
      applicationDeadline: { $gt: new Date() },
      $or: [
        { title: { $regex: searchTerm, $options: 'i' } },
        { roles: { $in: [new RegExp(searchTerm, 'i')] } },
        { skillsRequired: { $in: [new RegExp(searchTerm, 'i')] } },
      ],
    };

    if (filters.jobType) {
      query.jobType = filters.jobType;
    }

    if (filters.minCTC) {
      query['package.ctc'] = { $gte: parseInt(filters.minCTC) };
    }

    if (filters.location) {
      query.location = { $regex: filters.location, $options: 'i' };
    }

    if (filters.workMode) {
      query.workMode = filters.workMode;
    }

    return this.findAll(query, {
      ...options,
      populate: [{ path: 'company', select: 'name logo industry' }],
    });
  }

  async updateApplicationStats(jobId) {
    const Application = require('../models/Application');
    
    const stats = await Application.aggregate([
      { $match: { job: jobId } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    const applicationStats = {
      total: 0,
      shortlisted: 0,
      selected: 0,
      rejected: 0,
    };

    stats.forEach((stat) => {
      applicationStats.total += stat.count;
      if (stat._id === 'shortlisted') applicationStats.shortlisted = stat.count;
      if (stat._id === 'selected') applicationStats.selected = stat.count;
      if (stat._id === 'rejected') applicationStats.rejected = stat.count;
    });

    return this.updateById(jobId, { applicationStats });
  }

  async getJobStats(filters = {}) {
    const matchStage = {};
    
    if (filters.company) {
      matchStage.company = filters.company;
    }

    return this.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalOpenings: { $sum: '$openings' },
          avgCTC: { $avg: '$package.ctc' },
        },
      },
    ]);
  }

  async getTopPayingJobs(limit = 10) {
    return this.model
      .find({
        status: 'open',
        applicationDeadline: { $gt: new Date() },
      })
      .sort({ 'package.ctc': -1 })
      .limit(limit)
      .populate('company', 'name logo industry')
      .exec();
  }

  async getJobTypeDistribution() {
    return this.aggregate([
      { $match: { status: 'open' } },
      {
        $group: {
          _id: '$jobType',
          count: { $sum: 1 },
          avgCTC: { $avg: '$package.ctc' },
        },
      },
      {
        $project: {
          jobType: '$_id',
          count: 1,
          avgCTC: { $round: ['$avgCTC', 0] },
          _id: 0,
        },
      },
    ]);
  }

  async closeExpiredJobs() {
    return this.model.updateMany(
      {
        status: 'open',
        applicationDeadline: { $lt: new Date() },
      },
      { status: 'closed' }
    );
  }
}

module.exports = new JobRepository();
