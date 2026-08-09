/**
 * @file companyRepository.js
 * @description Company repository for managing company data access.
 * Provides methods for company approval workflow, search functionality,
 * recruiter-specific queries, and industry distribution analytics.
 */

const BaseRepository = require('./BaseRepository');
const Company = require('../models/Company');
const config = require('../config');

class CompanyRepository extends BaseRepository {
  constructor() {
    super(Company);
  }

  async findBySlug(slug) {
    return this.model.findOne({ slug: slug.toLowerCase() });
  }

  async findByRecruiter(recruiterId, options = {}) {
    return this.findAll({ registeredBy: recruiterId }, options);
  }

  async findApprovedCompanies(options = {}) {
    return this.findAll({ status: config.companyStatus.APPROVED, isActive: true }, options);
  }

  async findPendingCompanies(options = {}) {
    return this.findAll({ status: config.companyStatus.PENDING }, options);
  }

  async approveCompany(companyId, adminId) {
    return this.model.findByIdAndUpdate(
      companyId,
      {
        status: config.companyStatus.APPROVED,
        approvedBy: adminId,
        approvedAt: new Date(),
      },
      { new: true }
    );
  }

  async rejectCompany(companyId, adminId, reason) {
    return this.model.findByIdAndUpdate(
      companyId,
      {
        status: config.companyStatus.REJECTED,
        approvedBy: adminId,
        approvedAt: new Date(),
        rejectionReason: reason,
      },
      { new: true }
    );
  }

  async searchCompanies(searchTerm, options = {}) {
    const filter = {
      status: config.companyStatus.APPROVED,
      $or: [
        { name: { $regex: searchTerm, $options: 'i' } },
        { industry: { $regex: searchTerm, $options: 'i' } },
        { tags: { $in: [new RegExp(searchTerm, 'i')] } },
      ],
    };

    return this.findAll(filter, options);
  }

  async getCompanyStats() {
    return this.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);
  }

  async getIndustryDistribution() {
    return this.aggregate([
      { $match: { status: config.companyStatus.APPROVED } },
      {
        $group: {
          _id: '$industry',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      {
        $project: {
          industry: '$_id',
          count: 1,
          _id: 0,
        },
      },
    ]);
  }
}

module.exports = new CompanyRepository();
