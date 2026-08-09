/**
 * @file applicationRepository.js
 * @description Application repository managing job application data access.
 * Handles application status updates, bulk operations, statistics aggregation,
 * application trends analysis, and student application history.
 */

const mongoose = require('mongoose');
const BaseRepository = require('./BaseRepository');
const Application = require('../models/Application');
const config = require('../config');

class ApplicationRepository extends BaseRepository {
  constructor() {
    super(Application);
  }

  async findByStudentAndJob(studentId, jobId) {
    return this.model.findOne({ student: studentId, job: jobId });
  }

  async findByStudent(studentId, options = {}) {
    return this.findAll({ student: studentId }, {
      ...options,
      populate: [
        { path: 'job', select: 'title jobType package location applicationDeadline status' },
        { path: 'company', select: 'name logo industry' },
      ],
      sort: { createdAt: -1 },
    });
  }

  async findByJob(jobId, options = {}) {
    return this.findAll({ job: jobId }, {
      ...options,
      populate: [
        { path: 'student', select: 'firstName lastName email' },
        { path: 'studentProfile', select: 'rollNumber branch cgpa batch skills' },
      ],
      sort: { createdAt: -1 },
    });
  }

  async findByCompany(companyId, options = {}) {
    return this.findAll({ company: companyId }, {
      ...options,
      populate: [
        { path: 'student', select: 'firstName lastName email' },
        { path: 'job', select: 'title jobType' },
        { path: 'studentProfile', select: 'rollNumber branch cgpa' },
      ],
    });
  }

  async findByStatus(status, options = {}) {
    return this.findAll({ status }, {
      ...options,
      populate: [
        { path: 'student', select: 'firstName lastName email' },
        { path: 'job', select: 'title company' },
      ],
    });
  }

  async updateStatus(applicationId, status, userId, remarks) {
    const updateData = {
      status,
      $push: {
        statusHistory: {
          status,
          changedBy: userId,
          changedAt: new Date(),
          remarks,
        },
      },
    };

    switch (status) {
      case config.applicationStatus.SHORTLISTED:
        updateData.shortlistedAt = new Date();
        updateData.shortlistedBy = userId;
        updateData.shortlistRemarks = remarks;
        break;
      case config.applicationStatus.SELECTED:
        updateData.selectedAt = new Date();
        updateData.selectedBy = userId;
        break;
      case config.applicationStatus.REJECTED:
        updateData.rejectedAt = new Date();
        updateData.rejectedBy = userId;
        updateData.rejectionReason = remarks;
        break;
    }

    return this.model.findByIdAndUpdate(applicationId, updateData, { new: true });
  }

  async bulkUpdateStatus(applicationIds, status, userId, remarks) {
    const updateData = {
      status,
      $push: {
        statusHistory: {
          status,
          changedBy: userId,
          changedAt: new Date(),
          remarks,
        },
      },
    };

    return this.model.updateMany(
      { _id: { $in: applicationIds } },
      updateData
    );
  }

  async getApplicationStats(filters = {}) {
    const matchStage = {};
    
    if (filters.job) {
      matchStage.job = mongoose.Types.ObjectId.isValid(filters.job)
        ? new mongoose.Types.ObjectId(filters.job)
        : filters.job;
    }
    if (filters.company) {
      matchStage.company = mongoose.Types.ObjectId.isValid(filters.company)
        ? new mongoose.Types.ObjectId(filters.company)
        : filters.company;
    }
    if (filters.student) {
      matchStage.student = mongoose.Types.ObjectId.isValid(filters.student)
        ? new mongoose.Types.ObjectId(filters.student)
        : filters.student;
    }

    return Application.getStats(matchStage);
  }

  async getStudentApplicationHistory(studentId) {
    return this.model
      .find({ student: studentId })
      .populate('job', 'title jobType package company')
      .populate('company', 'name logo')
      .sort({ createdAt: -1 })
      .lean();
  }

  async getRecentApplications(limit = 10) {
    return this.model
      .find()
      .populate('student', 'firstName lastName')
      .populate('job', 'title')
      .populate('company', 'name')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
  }

  async getApplicationTrends(days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return this.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          date: '$_id',
          count: 1,
          _id: 0,
        },
      },
    ]);
  }

  async checkDuplicateApplication(studentId, jobId) {
    return this.model.exists({ student: studentId, job: jobId });
  }
}

module.exports = new ApplicationRepository();
