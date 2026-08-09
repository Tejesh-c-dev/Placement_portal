/**
 * @file Company.js
 * @description Company model for organizations participating in campus placements.
 * Stores company details, HR contacts, placement history, verification documents,
 * and approval status. Auto-generates URL-friendly slugs from company names.
 */

const mongoose = require('mongoose');
const slugify = require('slugify');
const config = require('../config');

const companySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true,
      maxlength: [100, 'Company name cannot exceed 100 characters'],
      index: true,
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      index: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    industry: {
      type: String,
      required: [true, 'Industry is required'],
      enum: [
        'Information Technology',
        'Finance/Banking',
        'Consulting',
        'E-Commerce',
        'Manufacturing',
        'Healthcare',
        'Education',
        'Telecommunications',
        'Automobile',
        'FMCG',
        'Real Estate',
        'Energy',
        'Media/Entertainment',
        'Other',
      ],
      index: true,
    },
    type: {
      type: String,
      enum: ['startup', 'mnc', 'psu', 'private', 'government'],
      default: 'private',
    },
    website: {
      type: String,
      trim: true,
      validate: {
        validator: function (v) {
          return !v || /^https?:\/\/.+\..+/.test(v);
        },
        message: 'Please provide a valid website URL',
      },
    },
    logo: {
      filename: String,
      path: String,
    },
    headquarters: {
      city: String,
      state: String,
      country: {
        type: String,
        default: 'India',
      },
    },
    foundedYear: {
      type: Number,
      min: 1800,
      max: new Date().getFullYear(),
    },
    employeeCount: {
      type: String,
      enum: ['1-50', '51-200', '201-500', '501-1000', '1001-5000', '5000+'],
    },
    linkedIn: {
      type: String,
      trim: true,
    },
    // Recruiter who registered this company
    registeredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    // HR contacts for this company
    hrContacts: [{
      name: String,
      email: String,
      phone: String,
      designation: String,
    }],
    status: {
      type: String,
      enum: Object.values(config.companyStatus),
      default: config.companyStatus.PENDING,
      index: true,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    approvedAt: Date,
    rejectionReason: String,
    // Placement stats for previous years
    placementHistory: [{
      year: Number,
      studentsHired: Number,
      averagePackage: Number,
      highestPackage: Number,
    }],
    // Verification documents
    verificationDocuments: [{
      name: String,
      path: String,
      uploadedAt: Date,
    }],
    // Tags for searchability
    tags: [String],
    // Whether company is actively recruiting
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
companySchema.index({ name: 'text', description: 'text', tags: 'text' });
companySchema.index({ status: 1, industry: 1 });

// Generate slug before saving
companySchema.pre('save', function (next) {
  if (this.isModified('name')) {
    this.slug = slugify(this.name, { lower: true, strict: true });
  }
  next();
});

// Virtual for active jobs count
companySchema.virtual('activeJobsCount', {
  ref: 'Job',
  localField: '_id',
  foreignField: 'company',
  count: true,
  match: { status: 'open', applicationDeadline: { $gt: new Date() } },
});

// Virtual for total hires
companySchema.virtual('totalHires').get(function () {
  if (!this.placementHistory || this.placementHistory.length === 0) return 0;
  return this.placementHistory.reduce((sum, year) => sum + (year.studentsHired || 0), 0);
});

// Method to check if company is approved
companySchema.methods.isApproved = function () {
  return this.status === config.companyStatus.APPROVED;
};

const Company = mongoose.model('Company', companySchema);

module.exports = Company;
