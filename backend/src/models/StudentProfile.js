/**
 * @file StudentProfile.js
 * @description Student profile model with academic details, skills, projects, experience,
 * certifications, and placement status. Includes nested schemas for projects, education,
 * experience, and certifications. Auto-calculates profile completeness percentage.
 */

const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500,
  },
  technologies: [String],
  link: {
    type: String,
    trim: true,
  },
  startDate: Date,
  endDate: Date,
});

const educationSchema = new mongoose.Schema({
  institution: {
    type: String,
    required: true,
    trim: true,
  },
  degree: {
    type: String,
    required: true,
    trim: true,
  },
  field: {
    type: String,
    trim: true,
  },
  startYear: {
    type: Number,
    required: true,
  },
  endYear: Number,
  grade: String,
  percentage: Number,
});

const experienceSchema = new mongoose.Schema({
  company: {
    type: String,
    required: true,
    trim: true,
  },
  position: {
    type: String,
    required: true,
    trim: true,
  },
  type: {
    type: String,
    enum: ['internship', 'full-time', 'part-time', 'contract'],
    default: 'internship',
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: Date,
  isCurrent: {
    type: Boolean,
    default: false,
  },
  description: {
    type: String,
    maxlength: 1000,
  },
});

const certificationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  issuer: {
    type: String,
    required: true,
    trim: true,
  },
  issueDate: Date,
  expiryDate: Date,
  credentialId: String,
  credentialUrl: String,
});

const studentProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    rollNumber: {
      type: String,
      required: [true, 'Roll number is required'],
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    dateOfBirth: {
      type: Date,
      required: [true, 'Date of birth is required'],
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other', 'prefer-not-to-say'],
      required: true,
    },
    branch: {
      type: String,
      required: [true, 'Branch is required'],
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
        'Other',
      ],
      index: true,
    },
    batch: {
      type: Number,
      required: [true, 'Batch year is required'],
      index: true,
    },
    cgpa: {
      type: Number,
      required: [true, 'CGPA is required'],
      min: [0, 'CGPA cannot be negative'],
      max: [10, 'CGPA cannot exceed 10'],
      index: true,
    },
    activeBacklogs: {
      type: Number,
      default: 0,
      min: 0,
      index: true,
    },
    totalBacklogs: {
      type: Number,
      default: 0,
      min: 0,
    },
    tenthPercentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    twelfthPercentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    diplomaPercentage: {
      type: Number,
      min: 0,
      max: 100,
    },
    skills: [{
      type: String,
      trim: true,
    }],
    projects: [projectSchema],
    education: [educationSchema],
    experience: [experienceSchema],
    certifications: [certificationSchema],
    resume: {
      filename: String,
      originalName: String,
      path: String,
      uploadedAt: Date,
      size: Number,
    },
    linkedIn: {
      type: String,
      trim: true,
      validate: {
        validator: function (v) {
          return !v || /^https?:\/\/(www\.)?linkedin\.com\/in\/[\w-]+\/?$/.test(v);
        },
        message: 'Please provide a valid LinkedIn URL',
      },
    },
    github: {
      type: String,
      trim: true,
      validate: {
        validator: function (v) {
          return !v || /^https?:\/\/(www\.)?github\.com\/[\w-]+\/?$/.test(v);
        },
        message: 'Please provide a valid GitHub URL',
      },
    },
    portfolio: {
      type: String,
      trim: true,
    },
    address: {
      street: String,
      city: String,
      state: String,
      pincode: String,
      country: {
        type: String,
        default: 'India',
      },
    },
    isPlaced: {
      type: Boolean,
      default: false,
      index: true,
    },
    placementStatus: {
      type: String,
      enum: ['not-placed', 'offer-received', 'offer-accepted', 'multi-offer'],
      default: 'not-placed',
    },
    isProfileComplete: {
      type: Boolean,
      default: false,
    },
    profileCompleteness: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    isEligibleForPlacements: {
      type: Boolean,
      default: true,
    },
    optOutReason: String,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for common queries
studentProfileSchema.index({ cgpa: -1, branch: 1, activeBacklogs: 1 });
studentProfileSchema.index({ batch: 1, isPlaced: 1 });
studentProfileSchema.index({ skills: 1 });

// Calculate profile completeness before saving
studentProfileSchema.pre('save', function (next) {
  let completeness = 0;
  const weights = {
    rollNumber: 5,
    dateOfBirth: 5,
    gender: 5,
    branch: 5,
    batch: 5,
    cgpa: 10,
    tenthPercentage: 5,
    twelfthPercentage: 5,
    skills: 15,
    projects: 15,
    resume: 15,
    linkedIn: 5,
    github: 5,
    experience: 5,
  };

  if (this.rollNumber) completeness += weights.rollNumber;
  if (this.dateOfBirth) completeness += weights.dateOfBirth;
  if (this.gender) completeness += weights.gender;
  if (this.branch) completeness += weights.branch;
  if (this.batch) completeness += weights.batch;
  if (this.cgpa) completeness += weights.cgpa;
  if (this.tenthPercentage) completeness += weights.tenthPercentage;
  if (this.twelfthPercentage) completeness += weights.twelfthPercentage;
  if (this.skills && this.skills.length > 0) completeness += weights.skills;
  if (this.projects && this.projects.length > 0) completeness += weights.projects;
  if (this.resume && this.resume.path) completeness += weights.resume;
  if (this.linkedIn) completeness += weights.linkedIn;
  if (this.github) completeness += weights.github;
  if (this.experience && this.experience.length > 0) completeness += weights.experience;

  this.profileCompleteness = completeness;
  this.isProfileComplete = completeness >= 80;
  
  next();
});

// Virtual to get user details
studentProfileSchema.virtual('userDetails', {
  ref: 'User',
  localField: 'user',
  foreignField: '_id',
  justOne: true,
});

const StudentProfile = mongoose.model('StudentProfile', studentProfileSchema);

module.exports = StudentProfile;
