/**
 * @file Application.js
 * @description Job application model tracking student applications to job postings.
 * Manages application status workflow (applied -> shortlisted -> interview -> selected/rejected),
 * interview rounds, status history, and offer handling.
 */

const mongoose = require('mongoose');
const config = require('../config');

const statusHistorySchema = new mongoose.Schema({
  status: {
    type: String,
    enum: Object.values(config.applicationStatus),
    required: true,
  },
  changedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  changedAt: {
    type: Date,
    default: Date.now,
  },
  remarks: String,
}, { _id: false });

const interviewSchema = new mongoose.Schema({
  round: {
    type: Number,
    required: true,
  },
  roundName: String,
  scheduledAt: Date,
  mode: {
    type: String,
    enum: ['online', 'offline'],
    default: 'online',
  },
  meetingLink: String,
  venue: String,
  interviewers: [String],
  feedback: String,
  rating: {
    type: Number,
    min: 1,
    max: 5,
  },
  result: {
    type: String,
    enum: ['pending', 'passed', 'failed'],
    default: 'pending',
  },
  completedAt: Date,
});

const applicationSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    studentProfile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StudentProfile',
      required: true,
    },
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      required: true,
      index: true,
    },
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(config.applicationStatus),
      default: config.applicationStatus.APPLIED,
      index: true,
    },
    statusHistory: [statusHistorySchema],
    // Resume submitted with application (snapshot)
    resumeSnapshot: {
      filename: String,
      originalName: String,
      path: String,
    },
    // Student's profile snapshot at application time
    profileSnapshot: {
      cgpa: Number,
      branch: String,
      batch: Number,
      skills: [String],
    },
    // Cover letter or additional info
    coverLetter: {
      type: String,
      maxlength: 2000,
    },
    // Answers to custom questions
    customAnswers: [{
      question: String,
      answer: String,
    }],
    // Interview details
    interviews: [interviewSchema],
    // Current interview round
    currentRound: {
      type: Number,
      default: 0,
    },
    // Shortlist details
    shortlistedAt: Date,
    shortlistedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    shortlistRemarks: String,
    // Selection details
    selectedAt: Date,
    selectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    // Rejection details
    rejectedAt: Date,
    rejectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    rejectionReason: String,
    rejectionStage: String,
    // Offer details (if selected)
    offerDetails: {
      offeredCTC: Number,
      offeredRole: String,
      joiningDate: Date,
      offerLetterPath: String,
      offerExpiryDate: Date,
    },
    // Student's response to offer
    offerResponse: {
      type: String,
      enum: ['pending', 'accepted', 'declined'],
      default: 'pending',
    },
    offerResponseDate: Date,
    offerDeclineReason: String,
    // Eligibility check result at application time
    eligibilityCheck: {
      isEligible: Boolean,
      errors: [String],
    },
    // Notes/remarks
    recruiterNotes: String,
    adminNotes: String,
    // Score/ranking
    score: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound unique index to prevent duplicate applications
applicationSchema.index({ student: 1, job: 1 }, { unique: true });

// Indexes for common queries
applicationSchema.index({ job: 1, status: 1 });
applicationSchema.index({ student: 1, status: 1 });
applicationSchema.index({ company: 1, status: 1 });
applicationSchema.index({ createdAt: -1 });

// Pre-save hook to update status history
applicationSchema.pre('save', function (next) {
  if (this.isModified('status')) {
    this.statusHistory.push({
      status: this.status,
      changedAt: new Date(),
    });

    // Update relevant timestamps
    switch (this.status) {
      case config.applicationStatus.SHORTLISTED:
        if (!this.shortlistedAt) this.shortlistedAt = new Date();
        break;
      case config.applicationStatus.SELECTED:
        if (!this.selectedAt) this.selectedAt = new Date();
        break;
      case config.applicationStatus.REJECTED:
        if (!this.rejectedAt) this.rejectedAt = new Date();
        break;
    }
  }
  next();
});

// Virtual for student details
applicationSchema.virtual('studentDetails', {
  ref: 'User',
  localField: 'student',
  foreignField: '_id',
  justOne: true,
});

// Virtual for job details
applicationSchema.virtual('jobDetails', {
  ref: 'Job',
  localField: 'job',
  foreignField: '_id',
  justOne: true,
});

// Method to update status with history
applicationSchema.methods.updateStatus = async function (newStatus, userId, remarks) {
  this.status = newStatus;
  this.statusHistory.push({
    status: newStatus,
    changedBy: userId,
    changedAt: new Date(),
    remarks,
  });
  return this.save();
};

// Static method to get application statistics
applicationSchema.statics.getStats = async function (query = {}) {
  const stats = await this.aggregate([
    { $match: query },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
      },
    },
  ]);

  const result = {
    total: 0,
    applied: 0,
    pending: 0,
    shortlisted: 0,
    interview: 0,
    selected: 0,
    offers: 0,
    rejected: 0,
  };

  stats.forEach((stat) => {
    result[stat._id] = stat.count;
    result.total += stat.count;
  });

  result.pending = result.applied;
  result.offers = result.selected;

  return result;
};

const Application = mongoose.model('Application', applicationSchema);

module.exports = Application;
