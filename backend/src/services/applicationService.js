/**
 * @file applicationService.js
 * @description Application service handling job application lifecycle.
 * Manages application submission, status transitions, bulk updates,
 * withdrawal, interview rounds, and application statistics.
 */

const {
  applicationRepository,
  jobRepository,
  studentProfileRepository,
  offerRepository,
} = require('../repositories');
const { NotFoundError, ValidationError, AuthorizationError, ConflictError } = require('../utils/AppError');
const emailService = require('./emailService');
const config = require('../config');

class ApplicationService {
  /**
   * Apply to a job
   */
  async applyToJob(studentId, jobId, applicationData = {}) {
    // Get job
    const job = await jobRepository.findById(jobId, [{ path: 'company', select: 'name' }]);
    
    if (!job) {
      throw new NotFoundError('Job');
    }

    // Check if job is open
    if (job.status !== 'open') {
      throw new ValidationError('This job is not accepting applications');
    }

    // Check if deadline has passed
    if (new Date() > job.applicationDeadline) {
      throw new ValidationError('Application deadline has passed');
    }

    // Get student profile
    const studentProfile = await studentProfileRepository.findByUserId(studentId);
    
    if (!studentProfile) {
      throw new NotFoundError('Student profile. Please complete your profile first');
    }

    // Check eligibility
    const eligibilityCheck = job.checkEligibility(studentProfile);
    
    if (!eligibilityCheck.isEligible) {
      throw new ValidationError(`You are not eligible for this job: ${eligibilityCheck.errors.join(', ')}`);
    }

    // Check for duplicate application
    const existingApplication = await applicationRepository.findByStudentAndJob(studentId, jobId);
    
    if (existingApplication) {
      throw new ConflictError('You have already applied to this job');
    }

    // Check if student has resume
    if (!studentProfile.resume || !studentProfile.resume.path) {
      throw new ValidationError('Please upload your resume before applying');
    }

    // Create application
    const application = await applicationRepository.create({
      student: studentId,
      studentProfile: studentProfile._id,
      job: jobId,
      company: job.company._id,
      coverLetter: applicationData.coverLetter,
      customAnswers: applicationData.customAnswers,
      resumeSnapshot: { ...studentProfile.resume },
      profileSnapshot: {
        cgpa: studentProfile.cgpa,
        branch: studentProfile.branch,
        batch: studentProfile.batch,
        skills: [...studentProfile.skills],
      },
      eligibilityCheck,
    });

    // Update job application stats
    await jobRepository.updateApplicationStats(jobId);

    return application;
  }

  /**
   * Get application by ID
   */
  async getApplicationById(applicationId, userId, role) {
    const application = await applicationRepository.findById(applicationId, [
      { path: 'student', select: 'firstName lastName email phone' },
      { path: 'studentProfile' },
      { path: 'job', select: 'title jobType package location selectionProcess postedBy' },
      { path: 'company', select: 'name logo' },
    ]);
    
    if (!application) {
      throw new NotFoundError('Application');
    }

    // Verify access
    if (role === 'student' && application.student._id.toString() !== userId.toString()) {
      throw new AuthorizationError('You can only view your own applications');
    }

    if (role === 'recruiter') {
      const isJobOwner = application.job && application.job.postedBy && application.job.postedBy.toString() === userId.toString();
      if (!isJobOwner) {
        throw new AuthorizationError('You can only view applications for your own jobs');
      }
    }

    return application;
  }

  /**
   * Get applications by student
   */
  async getStudentApplications(studentId, options = {}) {
    return applicationRepository.findByStudent(studentId, options);
  }

  /**
   * Get applications for a job
   */
  async getJobApplications(jobId, recruiterId, options = {}) {
    const job = await jobRepository.findById(jobId);
    
    if (!job) {
      throw new NotFoundError('Job');
    }

    // Verify recruiter owns the job
    if (job.postedBy.toString() !== recruiterId.toString()) {
      throw new AuthorizationError('You can only view applications for your own jobs');
    }

    return applicationRepository.findByJob(jobId, options);
  }

  /**
   * Update application status
   */
  async updateStatus(applicationId, recruiterId, status, remarks) {
    const application = await applicationRepository.findById(applicationId, [
      { path: 'job' },
      { path: 'student', select: 'firstName lastName email' },
      { path: 'company', select: 'name' },
    ]);
    
    if (!application) {
      throw new NotFoundError('Application');
    }

    // Verify recruiter owns the job
    if (application.job.postedBy.toString() !== recruiterId.toString()) {
      throw new AuthorizationError('You can only update applications for your own jobs');
    }

    // Validate status transition
    const validTransitions = {
      [config.applicationStatus.APPLIED]: [config.applicationStatus.SHORTLISTED, config.applicationStatus.REJECTED],
      [config.applicationStatus.SHORTLISTED]: [config.applicationStatus.INTERVIEW, config.applicationStatus.REJECTED],
      [config.applicationStatus.INTERVIEW]: [config.applicationStatus.SELECTED, config.applicationStatus.REJECTED, config.applicationStatus.INTERVIEW],
      [config.applicationStatus.SELECTED]: [],
      [config.applicationStatus.REJECTED]: [],
    };

    if (!validTransitions[application.status]?.includes(status)) {
      throw new ValidationError(`Cannot transition from ${application.status} to ${status}`);
    }

    // Update status
    const updatedApplication = await applicationRepository.updateStatus(
      applicationId,
      status,
      recruiterId,
      remarks
    );

    // Update job stats
    await jobRepository.updateApplicationStats(application.job._id);

    // Send email notification
    try {
      await emailService.sendApplicationStatusEmail(
        application.student.email,
        application.student.firstName,
        application.job.title,
        application.company.name,
        status
      );
    } catch (error) {
      console.error('Failed to send status email:', error);
    }

    return updatedApplication;
  }

  /**
   * Bulk update application status
   */
  async bulkUpdateStatus(applicationIds, recruiterId, status, remarks) {
    // Verify all applications belong to recruiter's jobs
    for (const applicationId of applicationIds) {
      const application = await applicationRepository.findById(applicationId, [{ path: 'job' }]);
      
      if (!application) {
        throw new NotFoundError(`Application ${applicationId}`);
      }

      if (application.job.postedBy.toString() !== recruiterId.toString()) {
        throw new AuthorizationError('You can only update applications for your own jobs');
      }
    }

    const result = await applicationRepository.bulkUpdateStatus(applicationIds, status, recruiterId, remarks);
    return result;
  }

  /**
   * Withdraw application (student)
   */
  async withdrawApplication(applicationId, studentId) {
    const application = await applicationRepository.findById(applicationId);
    
    if (!application) {
      throw new NotFoundError('Application');
    }

    if (application.student.toString() !== studentId.toString()) {
      throw new AuthorizationError('You can only withdraw your own applications');
    }

    // Can only withdraw if status is 'applied'
    if (application.status !== config.applicationStatus.APPLIED) {
      throw new ValidationError('Cannot withdraw application after being shortlisted');
    }

    await applicationRepository.deleteById(applicationId);

    // Update job stats
    await jobRepository.updateApplicationStats(application.job);

    return { message: 'Application withdrawn successfully' };
  }

  /**
   * Add interview round to application
   */
  async addInterviewRound(applicationId, recruiterId, interviewData) {
    const application = await applicationRepository.findById(applicationId, [{ path: 'job' }]);
    
    if (!application) {
      throw new NotFoundError('Application');
    }

    if (application.job.postedBy.toString() !== recruiterId.toString()) {
      throw new AuthorizationError('You can only update applications for your own jobs');
    }

    application.interviews.push({
      round: application.interviews.length + 1,
      ...interviewData,
    });
    application.currentRound = application.interviews.length;

    if (application.status !== config.applicationStatus.INTERVIEW) {
      application.status = config.applicationStatus.INTERVIEW;
    }

    await application.save();
    return application;
  }

  /**
   * Get application statistics
   */
  async getApplicationStats(filters = {}) {
    return applicationRepository.getApplicationStats(filters);
  }

  /**
   * Get recent applications
   */
  async getRecentApplications(limit = 10) {
    return applicationRepository.getRecentApplications(limit);
  }

  /**
   * Get application trends
   */
  async getApplicationTrends(days = 30) {
    return applicationRepository.getApplicationTrends(days);
  }

  /**
   * Get student application history
   */
  async getStudentApplicationHistory(studentId) {
    return applicationRepository.getStudentApplicationHistory(studentId);
  }
}

module.exports = new ApplicationService();
