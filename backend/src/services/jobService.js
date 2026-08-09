/**
 * @file jobService.js
 * @description Job service managing job postings lifecycle.
 * Handles job creation, updates, deletion, publishing, closing,
 * eligibility checking, job search, and job statistics.
 */

const {
  jobRepository,
  companyRepository,
  applicationRepository,
  studentProfileRepository,
} = require('../repositories');
const { NotFoundError, ValidationError, AuthorizationError, ConflictError } = require('../utils/AppError');
const config = require('../config');

class JobService {
  /**
   * Create a new job posting
   */
  async createJob(recruiterId, jobData) {
    // Verify company exists and is approved
    const company = await companyRepository.findById(jobData.company);
    
    if (!company) {
      throw new NotFoundError('Company');
    }

    if (!company.isApproved()) {
      throw new ValidationError('Company is not approved yet');
    }

    // Verify recruiter owns the company
    if (company.registeredBy.toString() !== recruiterId.toString()) {
      throw new AuthorizationError('You can only post jobs for your own company');
    }

    // Create job
    const job = await jobRepository.create({
      ...jobData,
      postedBy: recruiterId,
    });

    return job;
  }

  /**
   * Get job by ID
   */
  async getJobById(jobId, user = null, includeCompany = true) {
    const populate = includeCompany
      ? [{ path: 'company', select: 'name logo industry website description slug' }]
      : [];

    const job = await jobRepository.findById(jobId, populate);
    
    if (!job) {
      throw new NotFoundError('Job');
    }

    if (user) {
      if (user.role === 'student' && job.status === 'draft') {
        throw new NotFoundError('Job');
      }
      if (user.role === 'recruiter' && job.status === 'draft' && job.postedBy.toString() !== user._id.toString()) {
        throw new AuthorizationError('You do not have permission to view this draft job');
      }
    }

    return job;
  }

  /**
   * Update job
   */
  async updateJob(jobId, recruiterId, updateData, userRole = null) {
    const job = await jobRepository.findById(jobId);
    
    if (!job) {
      throw new NotFoundError('Job');
    }

    const isAdmin = ['admin', 'superadmin'].includes(userRole);
    // Verify owner if not admin
    if (!isAdmin && job.postedBy.toString() !== recruiterId.toString()) {
      throw new AuthorizationError('You can only update your own job postings');
    }

    // Prevent updating certain fields if job has applications
    if (job.applicationStats.total > 0) {
      const restrictedFields = ['eligibility', 'company'];
      restrictedFields.forEach((field) => {
        if (updateData[field]) {
          throw new ValidationError(`Cannot update ${field} after applications have been received`);
        }
      });
    }

    const updatedJob = await jobRepository.updateById(jobId, updateData);
    return updatedJob;
  }

  /**
   * Delete job
   */
  async deleteJob(jobId, recruiterId, userRole = null) {
    const job = await jobRepository.findById(jobId);
    
    if (!job) {
      throw new NotFoundError('Job');
    }

    const isAdmin = ['admin', 'superadmin'].includes(userRole);
    // Verify owner if not admin
    if (!isAdmin && job.postedBy.toString() !== recruiterId.toString()) {
      throw new AuthorizationError('You can only delete your own job postings');
    }

    // Prevent deleting if job has applications
    if (job.applicationStats.total > 0) {
      throw new ValidationError('Cannot delete job with existing applications. Consider closing instead.');
    }

    await jobRepository.deleteById(jobId);
    return { message: 'Job deleted successfully' };
  }

  /**
   * Get all active jobs with filters
   */
  async getActiveJobs(filters = {}, options = {}) {
    return jobRepository.findActiveJobs(options);
  }

  /**
   * Get jobs by company
   */
  async getJobsByCompany(companyId, options = {}) {
    return jobRepository.findByCompany(companyId, options);
  }

  /**
   * Get jobs by recruiter
   */
  async getJobsByRecruiter(recruiterId, options = {}) {
    return jobRepository.findByRecruiter(recruiterId, options);
  }

  /**
   * Get eligible jobs for a student
   */
  async getEligibleJobsForStudent(studentId, options = {}) {
    const studentProfile = await studentProfileRepository.findByUserId(studentId);
    
    if (!studentProfile) {
      return { data: [], total: 0 };
    }

    return jobRepository.findEligibleJobsForStudent(studentProfile, options);
  }

  /**
   * Search jobs
   */
  async searchJobs(searchTerm, filters = {}, options = {}) {
    return jobRepository.searchJobs(searchTerm, filters, options);
  }

  /**
   * Check student eligibility for a job
   */
  async checkEligibility(jobId, studentId) {
    const job = await jobRepository.findById(jobId);
    
    if (!job) {
      throw new NotFoundError('Job');
    }

    const studentProfile = await studentProfileRepository.findByUserId(studentId);
    
    if (!studentProfile) {
      throw new NotFoundError('Student profile');
    }

    return job.checkEligibility(studentProfile);
  }

  /**
   * Close a job
   */
  async closeJob(jobId, recruiterId, userRole = null) {
    const job = await jobRepository.findById(jobId);
    
    if (!job) {
      throw new NotFoundError('Job');
    }

    const isAdmin = ['admin', 'superadmin'].includes(userRole);
    if (!isAdmin && job.postedBy.toString() !== recruiterId.toString()) {
      throw new AuthorizationError('You can only close your own job postings');
    }

    job.status = 'closed';
    await job.save();

    return job;
  }

  /**
   * Publish job (change from draft to open)
   */
  async publishJob(jobId, recruiterId, userRole = null) {
    const job = await jobRepository.findById(jobId);
    
    if (!job) {
      throw new NotFoundError('Job');
    }

    const isAdmin = ['admin', 'superadmin'].includes(userRole);
    if (!isAdmin && job.postedBy.toString() !== recruiterId.toString()) {
      throw new AuthorizationError('You can only publish your own job postings');
    }

    if (job.status !== 'draft') {
      throw new ValidationError('Only draft jobs can be published');
    }

    job.status = 'open';
    await job.save();

    return job;
  }

  /**
   * Get job statistics
   */
  async getJobStats(filters = {}) {
    return jobRepository.getJobStats(filters);
  }

  /**
   * Get top paying jobs
   */
  async getTopPayingJobs(limit = 10) {
    return jobRepository.getTopPayingJobs(limit);
  }

  /**
   * Get job type distribution
   */
  async getJobTypeDistribution() {
    return jobRepository.getJobTypeDistribution();
  }

  /**
   * Get featured jobs
   */
  async getFeaturedJobs(limit = 5) {
    return jobRepository.findAll(
      {
        status: 'open',
        isFeatured: true,
        applicationDeadline: { $gt: new Date() },
      },
      {
        limit,
        populate: [{ path: 'company', select: 'name logo industry' }],
        sort: { priority: -1, 'package.ctc': -1 },
      }
    );
  }

  /**
   * Get jobs expiring soon
   */
  async getJobsExpiringSoon(days = 3) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    return jobRepository.findAll(
      {
        status: 'open',
        applicationDeadline: {
          $gt: new Date(),
          $lt: futureDate,
        },
      },
      {
        populate: [{ path: 'company', select: 'name logo' }],
        sort: { applicationDeadline: 1 },
      }
    );
  }
}

module.exports = new JobService();
