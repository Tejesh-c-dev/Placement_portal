/**
 * @file Announcement.js
 * @description Announcement model for placement-related notifications and updates.
 * Supports targeted announcements by role, batch, and branch with scheduling,
 * expiry, pinning, and email notification capabilities.
 */

const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Announcement title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    content: {
      type: String,
      required: [true, 'Announcement content is required'],
      maxlength: [5000, 'Content cannot exceed 5000 characters'],
    },
    type: {
      type: String,
      enum: ['general', 'placement-drive', 'deadline', 'result', 'important', 'event'],
      default: 'general',
      index: true,
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    // Target audience
    targetRoles: [{
      type: String,
      enum: ['student', 'recruiter', 'all'],
    }],
    targetBatches: [{
      type: Number,
    }],
    targetBranches: [{
      type: String,
      enum: ['CSE', 'ECE', 'EEE', 'ME', 'CE', 'IT', 'CSE-AI', 'CSE-DS', 'BT', 'CH', 'All'],
    }],
    // Related entities
    relatedJob: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
    },
    relatedCompany: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
    },
    // Author
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // Attachments
    attachments: [{
      name: String,
      path: String,
      size: Number,
      uploadedAt: Date,
    }],
    // Links
    links: [{
      title: String,
      url: String,
    }],
    // Scheduling
    publishAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: Date,
    // Status
    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'published',
      index: true,
    },
    // Tracking
    isPinned: {
      type: Boolean,
      default: false,
    },
    viewCount: {
      type: Number,
      default: 0,
    },
    // Email notification settings
    sendEmail: {
      type: Boolean,
      default: false,
    },
    emailSentAt: Date,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
announcementSchema.index({ status: 1, publishAt: -1 });
announcementSchema.index({ type: 1, status: 1 });
announcementSchema.index({ targetBatches: 1, targetBranches: 1 });
announcementSchema.index({ title: 'text', content: 'text' });

// Virtual to check if announcement is active
announcementSchema.virtual('isActive').get(function () {
  const now = new Date();
  const isPublished = this.status === 'published';
  const isStarted = !this.publishAt || this.publishAt <= now;
  const isNotExpired = !this.expiresAt || this.expiresAt > now;
  return isPublished && isStarted && isNotExpired;
});

// Static method to get active announcements for a user
announcementSchema.statics.getActiveForUser = async function (user, studentProfile = null) {
  const query = {
    status: 'published',
    $or: [
      { publishAt: { $exists: false } },
      { publishAt: { $lte: new Date() } },
    ],
    $and: [
      {
        $or: [
          { expiresAt: { $exists: false } },
          { expiresAt: { $gt: new Date() } },
        ],
      },
    ],
  };

  // Filter by role
  if (user.role === 'student') {
    query.$and.push({
      $or: [
        { targetRoles: { $in: ['student', 'all'] } },
        { targetRoles: { $size: 0 } },
      ],
    });

    // Filter by batch and branch if student profile exists
    if (studentProfile) {
      query.$and.push({
        $or: [
          { targetBatches: { $in: [studentProfile.batch] } },
          { targetBatches: { $size: 0 } },
        ],
      });
      query.$and.push({
        $or: [
          { targetBranches: { $in: [studentProfile.branch, 'All'] } },
          { targetBranches: { $size: 0 } },
        ],
      });
    }
  } else if (user.role === 'recruiter') {
    query.$and.push({
      $or: [
        { targetRoles: { $in: ['recruiter', 'all'] } },
        { targetRoles: { $size: 0 } },
      ],
    });
  }

  return this.find(query)
    .sort({ isPinned: -1, priority: -1, publishAt: -1 })
    .populate('createdBy', 'firstName lastName')
    .populate('relatedCompany', 'name logo')
    .populate('relatedJob', 'title');
};

// Increment view count
announcementSchema.methods.incrementViewCount = async function () {
  this.viewCount += 1;
  return this.save();
};

const Announcement = mongoose.model('Announcement', announcementSchema);

module.exports = Announcement;
