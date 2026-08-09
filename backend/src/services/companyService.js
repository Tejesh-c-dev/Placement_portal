/**
 * @file companyService.js
 * @description Company service managing company registration and management.
 * Handles company CRUD operations, admin approval workflow, HR contact management,
 * company search, and company statistics.
 */

const { companyRepository, userRepository } = require('../repositories');
const { NotFoundError, ValidationError, AuthorizationError, ConflictError } = require('../utils/AppError');
const config = require('../config');

class CompanyService {
  /**
   * Register a new company
   */
  async registerCompany(recruiterId, companyData) {
    // Check if company with same name exists
    const existingCompany = await companyRepository.findOne({ 
      name: { $regex: new RegExp(`^${companyData.name}$`, 'i') }
    });
    
    if (existingCompany) {
      throw new ConflictError('A company with this name already exists');
    }

    // Create company
    const company = await companyRepository.create({
      ...companyData,
      registeredBy: recruiterId,
      status: config.companyStatus.PENDING,
    });

    return company;
  }

  /**
   * Get company by ID
   */
  async getCompanyById(companyId) {
    const company = await companyRepository.findById(companyId);
    
    if (!company) {
      throw new NotFoundError('Company');
    }

    return company;
  }

  /**
   * Get company by slug
   */
  async getCompanyBySlug(slug) {
    const company = await companyRepository.findBySlug(slug);
    
    if (!company) {
      throw new NotFoundError('Company');
    }

    return company;
  }

  /**
   * Update company
   */
  async updateCompany(companyId, recruiterId, updateData, userRole = null) {
    const company = await companyRepository.findById(companyId);
    
    if (!company) {
      throw new NotFoundError('Company');
    }

    const isAdmin = ['admin', 'superadmin'].includes(userRole);
    // Verify ownership if not admin
    if (!isAdmin && company.registeredBy.toString() !== recruiterId.toString()) {
      throw new AuthorizationError('You can only update your own company');
    }

    const updatedCompany = await companyRepository.updateById(companyId, updateData);
    return updatedCompany;
  }

  /**
   * Get companies by recruiter
   */
  async getCompaniesByRecruiter(recruiterId, options = {}) {
    return companyRepository.findByRecruiter(recruiterId, options);
  }

  /**
   * Get all approved companies
   */
  async getApprovedCompanies(options = {}) {
    return companyRepository.findApprovedCompanies(options);
  }

  /**
   * Get pending companies (admin)
   */
  async getPendingCompanies(options = {}) {
    return companyRepository.findPendingCompanies(options);
  }

  /**
   * Approve company (admin)
   */
  async approveCompany(companyId, adminId) {
    const company = await companyRepository.findById(companyId);
    
    if (!company) {
      throw new NotFoundError('Company');
    }

    if (company.status !== config.companyStatus.PENDING) {
      throw new ValidationError('Company is not pending approval');
    }

    return companyRepository.approveCompany(companyId, adminId);
  }

  /**
   * Reject company (admin)
   */
  async rejectCompany(companyId, adminId, reason) {
    const company = await companyRepository.findById(companyId);
    
    if (!company) {
      throw new NotFoundError('Company');
    }

    if (company.status !== config.companyStatus.PENDING) {
      throw new ValidationError('Company is not pending approval');
    }

    return companyRepository.rejectCompany(companyId, adminId, reason);
  }

  /**
   * Search companies
   */
  async searchCompanies(searchTerm, options = {}) {
    return companyRepository.searchCompanies(searchTerm, options);
  }

  /**
   * Get company statistics
   */
  async getCompanyStats() {
    return companyRepository.getCompanyStats();
  }

  /**
   * Get industry distribution
   */
  async getIndustryDistribution() {
    return companyRepository.getIndustryDistribution();
  }

  /**
   * Add HR contact
   */
  async addHRContact(companyId, recruiterId, contactData, userRole = null) {
    const company = await companyRepository.findById(companyId);
    
    if (!company) {
      throw new NotFoundError('Company');
    }

    const isAdmin = ['admin', 'superadmin'].includes(userRole);
    if (!isAdmin && company.registeredBy.toString() !== recruiterId.toString()) {
      throw new AuthorizationError('You can only update your own company');
    }

    company.hrContacts.push(contactData);
    await company.save();

    return company;
  }

  /**
   * Remove HR contact
   */
  async removeHRContact(companyId, recruiterId, contactIndex, userRole = null) {
    const company = await companyRepository.findById(companyId);
    
    if (!company) {
      throw new NotFoundError('Company');
    }

    const isAdmin = ['admin', 'superadmin'].includes(userRole);
    if (!isAdmin && company.registeredBy.toString() !== recruiterId.toString()) {
      throw new AuthorizationError('You can only update your own company');
    }

    company.hrContacts.splice(contactIndex, 1);
    await company.save();

    return company;
  }

  /**
   * Toggle company active status
   */
  async toggleCompanyStatus(companyId, recruiterId, userRole = null) {
    const company = await companyRepository.findById(companyId);
    
    if (!company) {
      throw new NotFoundError('Company');
    }

    const isAdmin = ['admin', 'superadmin'].includes(userRole);
    if (!isAdmin && company.registeredBy.toString() !== recruiterId.toString()) {
      throw new AuthorizationError('You can only update your own company');
    }

    company.isActive = !company.isActive;
    await company.save();

    return company;
  }
}

module.exports = new CompanyService();
