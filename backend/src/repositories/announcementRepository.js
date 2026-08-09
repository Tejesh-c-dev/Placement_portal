/**
 * @file announcementRepository.js
 * @description Announcement repository for managing announcement data access.
 * Supports targeted announcement filtering by role/batch/branch, view count tracking,
 * announcement archival, and statistics aggregation.
 */

const BaseRepository = require('./BaseRepository');
const Announcement = require('../models/Announcement');

class AnnouncementRepository extends BaseRepository {
  constructor() {
    super(Announcement);
  }

  async findActiveAnnouncements(options = {}) {
    const now = new Date();
    
    const filter = {
      status: 'published',
      $or: [
        { publishAt: { $exists: false } },
        { publishAt: { $lte: now } },
      ],
      $and: [
        {
          $or: [
            { expiresAt: { $exists: false } },
            { expiresAt: { $gt: now } },
          ],
        },
      ],
    };

    return this.findAll(filter, {
      ...options,
      populate: [
        { path: 'createdBy', select: 'firstName lastName' },
        { path: 'relatedCompany', select: 'name logo' },
        { path: 'relatedJob', select: 'title' },
      ],
      sort: { isPinned: -1, priority: -1, publishAt: -1 },
    });
  }

  async findForStudent(studentProfile, options = {}) {
    const now = new Date();
    
    const filter = {
      status: 'published',
      $or: [
        { publishAt: { $exists: false } },
        { publishAt: { $lte: now } },
      ],
      $and: [
        {
          $or: [
            { expiresAt: { $exists: false } },
            { expiresAt: { $gt: now } },
          ],
        },
        {
          $or: [
            { targetRoles: { $in: ['student', 'all'] } },
            { targetRoles: { $size: 0 } },
          ],
        },
      ],
    };

    if (studentProfile) {
      filter.$and.push({
        $or: [
          { targetBatches: { $in: [studentProfile.batch] } },
          { targetBatches: { $size: 0 } },
        ],
      });
      filter.$and.push({
        $or: [
          { targetBranches: { $in: [studentProfile.branch, 'All'] } },
          { targetBranches: { $size: 0 } },
        ],
      });
    }

    return this.findAll(filter, {
      ...options,
      populate: [
        { path: 'createdBy', select: 'firstName lastName' },
        { path: 'relatedCompany', select: 'name logo' },
        { path: 'relatedJob', select: 'title' },
      ],
      sort: { isPinned: -1, priority: -1, publishAt: -1 },
    });
  }

  async findForRecruiter(options = {}) {
    const now = new Date();
    
    const filter = {
      status: 'published',
      $or: [
        { publishAt: { $exists: false } },
        { publishAt: { $lte: now } },
      ],
      $and: [
        {
          $or: [
            { expiresAt: { $exists: false } },
            { expiresAt: { $gt: now } },
          ],
        },
        {
          $or: [
            { targetRoles: { $in: ['recruiter', 'all'] } },
            { targetRoles: { $size: 0 } },
          ],
        },
      ],
    };

    return this.findAll(filter, {
      ...options,
      populate: [
        { path: 'createdBy', select: 'firstName lastName' },
      ],
      sort: { isPinned: -1, priority: -1, publishAt: -1 },
    });
  }

  async incrementViewCount(announcementId) {
    return this.model.findByIdAndUpdate(
      announcementId,
      { $inc: { viewCount: 1 } },
      { new: true }
    );
  }

  async archiveExpired() {
    return this.model.updateMany(
      {
        status: 'published',
        expiresAt: { $lt: new Date() },
      },
      { status: 'archived' }
    );
  }

  async getAnnouncementStats() {
    return this.aggregate([
      {
        $group: {
          _id: {
            type: '$type',
            status: '$status',
          },
          count: { $sum: 1 },
          totalViews: { $sum: '$viewCount' },
        },
      },
      {
        $group: {
          _id: '$_id.type',
          statuses: {
            $push: {
              status: '$_id.status',
              count: '$count',
            },
          },
          totalViews: { $sum: '$totalViews' },
          total: { $sum: '$count' },
        },
      },
      {
        $project: {
          type: '$_id',
          statuses: 1,
          totalViews: 1,
          total: 1,
          _id: 0,
        },
      },
    ]);
  }
}

module.exports = new AnnouncementRepository();
