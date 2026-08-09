/**
 * @file Offer.js
 * @description Job offer model tracking offers extended to selected students.
 * Manages offer lifecycle (pending -> accepted/declined/revoked/expired),
 * CTC details, joining date, and bond information.
 */

const mongoose = require('mongoose');

const offerSchema = new mongoose.Schema(
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
    application: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Application',
      required: true,
      unique: true,
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
    // Offer details
    offeredRole: {
      type: String,
      required: [true, 'Offered role is required'],
      trim: true,
    },
    offeredCTC: {
      type: Number,
      required: [true, 'Offered CTC is required'],
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
    location: {
      type: String,
      trim: true,
    },
    joiningDate: {
      type: Date,
      required: [true, 'Joining date is required'],
    },
    // Offer letter
    offerLetter: {
      filename: String,
      path: String,
      uploadedAt: Date,
    },
    // Status
    status: {
      type: String,
      enum: ['pending', 'accepted', 'declined', 'revoked', 'expired'],
      default: 'pending',
      index: true,
    },
    // Expiry
    expiresAt: {
      type: Date,
      required: true,
    },
    // Student response
    respondedAt: Date,
    declineReason: String,
    // Revocation
    revokedAt: Date,
    revokedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    revocationReason: String,
    // Additional details
    specialConditions: String,
    benefits: [String],
    bondDetails: {
      hasBond: {
        type: Boolean,
        default: false,
      },
      duration: String,
      amount: Number,
    },
    // Verification
    isVerified: {
      type: Boolean,
      default: false,
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    verifiedAt: Date,
    // Notes
    recruiterNotes: String,
    adminNotes: String,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
offerSchema.index({ student: 1, status: 1 });
offerSchema.index({ company: 1, status: 1 });
offerSchema.index({ createdAt: -1 });

// Check if offer is expired
offerSchema.virtual('isExpired').get(function () {
  return this.status === 'pending' && new Date() > this.expiresAt;
});

// Pre-save hook to check expiry
offerSchema.pre('save', function (next) {
  if (this.status === 'pending' && this.expiresAt && new Date() > this.expiresAt) {
    this.status = 'expired';
  }
  next();
});

// Method to accept offer
offerSchema.methods.accept = async function () {
  this.status = 'accepted';
  this.respondedAt = new Date();
  return this.save();
};

// Method to decline offer
offerSchema.methods.decline = async function (reason) {
  this.status = 'declined';
  this.respondedAt = new Date();
  this.declineReason = reason;
  return this.save();
};

// Static method to get offers statistics
offerSchema.statics.getStats = async function (query = {}) {
  return this.aggregate([
    { $match: query },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalCTC: { $sum: '$offeredCTC' },
        avgCTC: { $avg: '$offeredCTC' },
      },
    },
  ]);
};

const Offer = mongoose.model('Offer', offerSchema);

module.exports = Offer;
