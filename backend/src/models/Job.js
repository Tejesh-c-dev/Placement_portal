/**
 * @file Job.js
 * @description Job posting model for campus recruitment opportunities.
 * Includes eligibility criteria, selection process rounds, package details,
 * application statistics, and student eligibility checking functionality.
 */

const mongoose = require('mongoose');

const eligibilityCriteriaSchema = new mongoose.Schema({
  minCGPA: {
    type: Number,
    required: true,
    min: 0,
    max: 10,
    default: 6.0,
  },
  maxActiveBacklogs: {
    type: Number,
    default: 0,
    min: 0,
  },
  maxTotalBacklogs: {
    type: Number,
    default: 2,
    min: 0,
  },
  allowedBranches: [{
    type: String,
    enum: [
      'CSE',
      'ECE',
      'EEE',
      'ME',
      'CE',
      'IT',
      'CSE-AI',
      'CSE-DS',
      'BT',
      'CH',
      'All',
    ],
  }],
  allowedBatches: [{
    type: Number,
  }],
  minTenthPercentage: {
    type: Number,
    min: 0,
    max: 100,
    default: 60,
  },
  minTwelfthPercentage: {
    type: Number,
    min: 0,
    max: 100,
    default: 60,
  },
  gender: {
    type: String,
    enum: ['all', 'male', 'female'],
    default: 'all',
  },
  otherRequirements: String,
}, { _id: false });

const selectionProcessSchema = new mongoose.Schema({
  round: {
    type: Number,
    required: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  type: {
    type: String,
    enum: [
      'aptitude',
      'technical-test',
      'coding-round',
      'group-discussion',
      'technical-interview',
      'hr-interview',
      'assignment',
      'presentation',
      'other',
    ],
    required: true,
  },
  description: String,
  duration: String,
  mode: {
    type: String,
    enum: ['online', 'offline', 'hybrid'],
    default: 'online',
  },
  scheduledDate: Date,
  venue: String,
}, { _id: false });

const jobSchema = new mongoose.Schema(
  {
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true,
    },
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Job title is required'],
      trim: true,
      maxlength: [150, 'Job title cannot exceed 150 characters'],
      index: true,
    },
    description: {
      type: String,
      required: [true, 'Job description is required'],
      maxlength: [5000, 'Description cannot exceed 5000 characters'],
    },
    jobType: {
      type: String,
      enum: ['full-time', 'internship', 'ppo', 'internship+ppo'],
      required: true,
      index: true,
    },
    location: {
      type: String,
      required: true,
      trim: true,
    },
    workMode: {
      type: String,
      enum: ['onsite', 'remote', 'hybrid'],
      default: 'onsite',
    },
    // Package details
    package: {
      ctc: {
        type: Number,
        required: [true, 'CTC is required'],
        min: 0,
      },
      ctcBreakdown: {
        fixed: Number,
        variable: Number,
        bonus: Number,
        stocks: Number,
      },
      currency: {
        type: String,
        default: 'INR',
      },
      // For internships
      stipend: Number,
      stipendDuration: String, // e.g., "per month"
    },
    // For internships
    duration: {
      months: Number,
      description: String,
    },
    // Job roles/positions
    roles: [{
      type: String,
      trim: true,
    }],
    // Skills required
    skillsRequired: [{
      type: String,
      trim: true,
    }],
    responsibilities: [String],
    // Benefits
    benefits: [String],
    // Number of positions
    openings: {
      type: Number,
      default: 1,
      min: 1,
    },
    eligibility: eligibilityCriteriaSchema,
    selectionProcess: [selectionProcessSchema],
    applicationDeadline: {
      type: Date,
      required: [true, 'Application deadline is required'],
      index: true,
    },
    driveDate: {
      type: Date,
      index: true,
    },
    status: {
      type: String,
      enum: ['draft', 'open', 'closed', 'on-hold', 'completed'],
      default: 'draft',
      index: true,
    },
    // Applications tracking
    applicationStats: {
      total: {
        type: Number,
        default: 0,
      },
      shortlisted: {
        type: Number,
        default: 0,
      },
      selected: {
        type: Number,
        default: 0,
      },
      rejected: {
        type: Number,
        default: 0,
      },
    },
    // Attachments (JD, brochure)
    attachments: [{
      name: String,
      path: String,
      uploadedAt: Date,
    }],
    // Additional notes from placement cell
    adminNotes: String,
    // Priority for display
    priority: {
      type: Number,
      default: 0,
      min: 0,
      max: 10,
    },
    // Featured job
    isFeatured: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound indexes for common queries
jobSchema.index({ status: 1, applicationDeadline: -1 });
jobSchema.index({ 'package.ctc': -1, status: 1 });
jobSchema.index({ company: 1, status: 1 });
jobSchema.index({ 'eligibility.minCGPA': 1, 'eligibility.allowedBranches': 1 });

// Text index for search
jobSchema.index({ title: 'text', description: 'text', 'roles': 'text', 'skillsRequired': 'text' });

// Virtual for checking if deadline has passed
jobSchema.virtual('isDeadlinePassed').get(function () {
  return new Date() > this.applicationDeadline;
});

// Virtual for company details
jobSchema.virtual('companyDetails', {
  ref: 'Company',
  localField: 'company',
  foreignField: '_id',
  justOne: true,
});

// Method to check if student is eligible
jobSchema.methods.checkEligibility = function (studentProfile) {
  const criteria = this.eligibility;
  const errors = [];

  // Check CGPA
  if (studentProfile.cgpa < criteria.minCGPA) {
    errors.push(`Minimum CGPA required: ${criteria.minCGPA}, yours: ${studentProfile.cgpa}`);
  }

  // Check active backlogs
  if (studentProfile.activeBacklogs > criteria.maxActiveBacklogs) {
    errors.push(`Maximum active backlogs allowed: ${criteria.maxActiveBacklogs}, yours: ${studentProfile.activeBacklogs}`);
  }

  // Check branch
  if (criteria.allowedBranches.length > 0 && 
      !criteria.allowedBranches.includes('All') && 
      !criteria.allowedBranches.includes(studentProfile.branch)) {
    errors.push(`Your branch (${studentProfile.branch}) is not eligible for this job`);
  }

  // Check batch
  if (criteria.allowedBatches.length > 0 && 
      !criteria.allowedBatches.includes(studentProfile.batch)) {
    errors.push(`Your batch (${studentProfile.batch}) is not eligible for this job`);
  }

  // Check 10th percentage
  if (studentProfile.tenthPercentage < criteria.minTenthPercentage) {
    errors.push(`Minimum 10th percentage required: ${criteria.minTenthPercentage}%`);
  }

  // Check 12th percentage
  if (studentProfile.twelfthPercentage < criteria.minTwelfthPercentage) {
    errors.push(`Minimum 12th percentage required: ${criteria.minTwelfthPercentage}%`);
  }

  return {
    isEligible: errors.length === 0,
    errors,
  };
};

const Job = mongoose.model('Job', jobSchema);

module.exports = Job;
