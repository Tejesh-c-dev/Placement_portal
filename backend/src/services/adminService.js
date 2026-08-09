/**
 * @file adminService.js
 * @description Admin service providing administrative functionalities.
 * Handles dashboard analytics, placement reports, user management,
 * data exports (CSV), company analytics, audit logs, and system settings.
 */

const { createObjectCsvWriter } = require('csv-writer');
const path = require('path');
const fs = require('fs').promises;
const emailService = require('./emailService');
const {
  userRepository,
  studentProfileRepository,
  companyRepository,
  jobRepository,
  applicationRepository,
  offerRepository,
  announcementRepository,
} = require('../repositories');
const { NotFoundError, ValidationError } = require('../utils/AppError');

class AdminService {
  constructor() {
    this.systemSettings = {};
    this.auditTrail = [];
  }

  /**
   * Get dashboard statistics
   */
  async getDashboardStats() {
    const [
      userStats,
      companyStats,
      jobStats,
      applicationStats,
      offerStats,
    ] = await Promise.all([
      userRepository.getUserStats(),
      companyRepository.getCompanyStats(),
      jobRepository.getJobStats(),
      applicationRepository.getApplicationStats(),
      offerRepository.getOfferStats(),
    ]);

    return {
      users: userStats,
      companies: companyStats,
      jobs: jobStats,
      applications: applicationStats,
      offers: offerStats,
    };
  }

  async getDashboardAnalytics() {
    const [dashboardStats, placementAnalytics, companyAnalytics, jobAnalytics] = await Promise.all([
      this.getDashboardStats(),
      this.getPlacementAnalytics(),
      this.getCompanyAnalytics(),
      this.getJobAnalytics(),
    ]);

    return {
      ...dashboardStats,
      placementAnalytics,
      companyAnalytics,
      jobAnalytics,
    };
  }

  /**
   * Get placement analytics
   */
  async getPlacementAnalytics(batch) {
    const [
      placementStats,
      branchWiseStats,
      batchStats,
      topOffers,
      skillsDistribution,
    ] = await Promise.all([
      offerRepository.getPlacementStats(batch),
      studentProfileRepository.getPlacementStats(batch),
      studentProfileRepository.getBatchStats(),
      offerRepository.getTopOffers(10),
      studentProfileRepository.getSkillsDistribution(batch),
    ]);

    // Calculate overall placement percentage
    let totalStudents = 0;
    let placedStudents = 0;
    let totalPackage = 0;

    branchWiseStats.forEach((stat) => {
      totalStudents += stat.total;
      placedStudents += stat.placed;
    });

    placementStats.forEach((stat) => {
      totalPackage += stat.totalCTC || 0;
    });

    const overallPlacementPercentage = totalStudents > 0 
      ? ((placedStudents / totalStudents) * 100).toFixed(2) 
      : 0;

    const averagePackage = placedStudents > 0 
      ? Math.round(totalPackage / placedStudents) 
      : 0;

    return {
      overview: {
        totalStudents,
        placedStudents,
        placementPercentage: parseFloat(overallPlacementPercentage),
        averagePackage,
        highestPackage: topOffers[0]?.offeredCTC || 0,
      },
      branchWise: branchWiseStats,
      batchWise: batchStats,
      topOffers,
      skillsDistribution,
      packageDistribution: placementStats,
    };
  }

  async getPlacementStats(filters = {}) {
    const stats = await studentProfileRepository.getPlacementStats(filters.batch);

    if (filters.branch) {
      return stats.filter((stat) => stat.branch === filters.branch);
    }

    return stats;
  }

  async getBranchWiseAnalytics(batch) {
    return studentProfileRepository.getPlacementStats(batch);
  }

  async getBatchTrends() {
    return studentProfileRepository.getBatchStats();
  }

  /**
   * Get company analytics
   */
  async getCompanyAnalytics() {
    const [
      industryDistribution,
      companyStats,
      topHiringCompanies,
    ] = await Promise.all([
      companyRepository.getIndustryDistribution(),
      companyRepository.getCompanyStats(),
      this.getTopHiringCompanies(),
    ]);

    return {
      industryDistribution,
      companyStats,
      topHiringCompanies,
    };
  }

  async getTopRecruiters(batch, limit = 10) {
    const recruiters = await this.getTopHiringCompanies(limit);

    if (!batch) {
      return recruiters;
    }

    return recruiters;
  }

  /**
   * Get top hiring companies
   */
  async getTopHiringCompanies(limit = 10) {
    return offerRepository.aggregate([
      { $match: { status: 'accepted' } },
      {
        $group: {
          _id: '$company',
          hires: { $sum: 1 },
          avgCTC: { $avg: '$offeredCTC' },
          totalCTC: { $sum: '$offeredCTC' },
        },
      },
      { $sort: { hires: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: 'companies',
          localField: '_id',
          foreignField: '_id',
          as: 'company',
        },
      },
      { $unwind: '$company' },
      {
        $project: {
          _id: 0,
          companyId: '$_id',
          name: '$company.name',
          logo: '$company.logo',
          industry: '$company.industry',
          hires: 1,
          avgCTC: { $round: ['$avgCTC', 0] },
          totalCTC: 1,
        },
      },
    ]);
  }

  /**
   * Get job analytics
   */
  async getJobAnalytics() {
    const [
      jobTypeDistribution,
      jobStats,
      topPayingJobs,
      applicationTrends,
    ] = await Promise.all([
      jobRepository.getJobTypeDistribution(),
      jobRepository.getJobStats(),
      jobRepository.getTopPayingJobs(10),
      applicationRepository.getApplicationTrends(30),
    ]);

    return {
      jobTypeDistribution,
      jobStats,
      topPayingJobs,
      applicationTrends,
    };
  }

  /**
   * Export students data to CSV
   */
  async exportStudentsCSV(filters = {}) {
    const students = await studentProfileRepository.findAll(filters, {
      limit: 10000,
      populate: [{ path: 'user', select: 'firstName lastName email phone' }],
    });

    const filename = `students_export_${Date.now()}.csv`;
    const filePath = path.join(__dirname, '../../exports', filename);

    // Ensure exports directory exists
    await fs.mkdir(path.dirname(filePath), { recursive: true });

    const csvWriter = createObjectCsvWriter({
      path: filePath,
      header: [
        { id: 'rollNumber', title: 'Roll Number' },
        { id: 'name', title: 'Name' },
        { id: 'email', title: 'Email' },
        { id: 'phone', title: 'Phone' },
        { id: 'branch', title: 'Branch' },
        { id: 'batch', title: 'Batch' },
        { id: 'cgpa', title: 'CGPA' },
        { id: 'tenthPercentage', title: '10th %' },
        { id: 'twelfthPercentage', title: '12th %' },
        { id: 'activeBacklogs', title: 'Active Backlogs' },
        { id: 'isPlaced', title: 'Placed' },
        { id: 'placementStatus', title: 'Placement Status' },
        { id: 'skills', title: 'Skills' },
      ],
    });

    const records = students.data.map((s) => ({
      rollNumber: s.rollNumber,
      name: s.user ? `${s.user.firstName} ${s.user.lastName}` : '',
      email: s.user?.email || '',
      phone: s.user?.phone || '',
      branch: s.branch,
      batch: s.batch,
      cgpa: s.cgpa,
      tenthPercentage: s.tenthPercentage,
      twelfthPercentage: s.twelfthPercentage,
      activeBacklogs: s.activeBacklogs,
      isPlaced: s.isPlaced ? 'Yes' : 'No',
      placementStatus: s.placementStatus,
      skills: s.skills?.join(', ') || '',
    }));

    await csvWriter.writeRecords(records);

    return { filename, filePath, count: records.length };
  }

  /**
   * Export placements data to CSV
   */
  async exportPlacementsCSV(batch) {
    const offers = await offerRepository.findAll(
      { status: 'accepted' },
      {
        limit: 10000,
        populate: [
          { path: 'student', select: 'firstName lastName email' },
          { path: 'studentProfile', select: 'rollNumber branch batch' },
          { path: 'company', select: 'name industry' },
          { path: 'job', select: 'title jobType' },
        ],
      }
    );

    const filename = `placements_export_${Date.now()}.csv`;
    const filePath = path.join(__dirname, '../../exports', filename);

    await fs.mkdir(path.dirname(filePath), { recursive: true });

    const csvWriter = createObjectCsvWriter({
      path: filePath,
      header: [
        { id: 'rollNumber', title: 'Roll Number' },
        { id: 'studentName', title: 'Student Name' },
        { id: 'email', title: 'Email' },
        { id: 'branch', title: 'Branch' },
        { id: 'batch', title: 'Batch' },
        { id: 'company', title: 'Company' },
        { id: 'industry', title: 'Industry' },
        { id: 'role', title: 'Role' },
        { id: 'jobType', title: 'Job Type' },
        { id: 'ctc', title: 'CTC (LPA)' },
        { id: 'joiningDate', title: 'Joining Date' },
      ],
    });

    const records = offers.data.map((o) => ({
      rollNumber: o.studentProfile?.rollNumber || '',
      studentName: o.student ? `${o.student.firstName} ${o.student.lastName}` : '',
      email: o.student?.email || '',
      branch: o.studentProfile?.branch || '',
      batch: o.studentProfile?.batch || '',
      company: o.company?.name || '',
      industry: o.company?.industry || '',
      role: o.offeredRole,
      jobType: o.job?.jobType || '',
      ctc: o.offeredCTC ? (o.offeredCTC / 100000).toFixed(2) : '',
      joiningDate: o.joiningDate ? new Date(o.joiningDate).toLocaleDateString() : '',
    }));

    await csvWriter.writeRecords(records);

    return { filename, filePath, count: records.length };
  }

  /**
   * Get all users with filters
   */
  async getAllUsers(filters = {}, options = {}) {
    const query = {};

    if (filters.role) {
      query.role = filters.role;
    }

    // Frontend sends `isActive` as a string ('true'/'false'); keep `status`
    // ('active'/'inactive') for API compatibility with other callers.
    if (filters.status === 'active' || filters.isActive === 'true') {
      query.isActive = true;
    } else if (filters.status === 'inactive' || filters.isActive === 'false') {
      query.isActive = false;
    }

    // `isActive` is excluded by default in the model; explicitly include it so
    // the admin UI can render the status column and toggle correctly.
    const listOptions = { ...options, select: '+isActive' };

    if (filters.search) {
      return userRepository.searchUsers(filters.search, listOptions);
    }

    return userRepository.findAll(query, listOptions);
  }

  /**
   * Get aggregate user counts (total, active, by role) for admin stats cards
   */
  async getUserCounts() {
    const stats = await userRepository.getUserStats();

    const counts = {
      active: 0,
      student: 0,
      recruiter: 0,
      admin: 0,
      superadmin: 0,
    };

    stats.forEach((s) => {
      counts.active += s.active;
      if (counts[s._id] !== undefined) {
        counts[s._id] = s.count;
      }
    });

    return counts;
  }

  /**
   * Get all companies for admin, with optional status/search filter,
   * plus per-status counts for the admin dashboard cards.
   */
  async getAllCompanies(filters = {}, options = {}) {
    const query = {};

    if (filters.status) {
      query.status = filters.status;
    }

    if (filters.search) {
      query.$or = [
        { name: { $regex: filters.search, $options: 'i' } },
        { industry: { $regex: filters.search, $options: 'i' } },
      ];
    }

    const result = await companyRepository.findAll(query, {
      ...options,
      populate: [{ path: 'registeredBy', select: 'firstName lastName email' }],
    });

    const statusCounts = await companyRepository.getCompanyStats();
    const counts = { pending: 0, approved: 0, rejected: 0 };
    statusCounts.forEach((c) => {
      if (counts[c._id] !== undefined) {
        counts[c._id] = c.count;
      }
    });

    return {
      ...result,
      pendingCount: counts.pending,
      approvedCount: counts.approved,
      rejectedCount: counts.rejected,
    };
  }

  async getUserById(userId) {
    const user = await userRepository.findById(userId);

    if (!user) {
      throw new NotFoundError('User');
    }

    return user;
  }

  /**
   * Deactivate user
   */
  async deactivateUser(userId) {
    const user = await userRepository.findById(userId);
    
    if (!user) {
      throw new NotFoundError('User');
    }

    user.isActive = false;
    await user.save();

    return { message: 'User deactivated successfully' };
  }

  async updateUserStatus(userId, isActive) {
    return isActive ? this.activateUser(userId) : this.deactivateUser(userId);
  }

  async changeUserRole(userId, role) {
    const user = await userRepository.findById(userId);

    if (!user) {
      throw new NotFoundError('User');
    }

    user.role = role;
    await user.save();

    return user;
  }

  async deleteUser(userId) {
    const user = await userRepository.findById(userId);

    if (!user) {
      throw new NotFoundError('User');
    }

    await userRepository.deleteById(userId);
    return { message: 'User deleted successfully' };
  }

  async exportStudentsToCSV(filters = {}) {
    return this.exportStudentsCSV(filters);
  }

  async exportPlacementsToCSV(filters = {}) {
    return this.exportPlacementsCSV(filters.batch);
  }

  async getActivityLogs(filters = {}) {
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const start = (page - 1) * limit;
    const data = this.auditTrail.slice(start, start + limit);

    return {
      data,
      total: this.auditTrail.length,
      page,
      limit,
    };
  }

  async sendBulkNotification({ recipients = [], subject, message, type, sentBy }) {
    if (Array.isArray(recipients) && recipients.length > 0) {
      await Promise.all(
        recipients.map((recipient) => emailService.sendEmail(recipient, subject || 'Placement Portal Notification', `<p>${message || ''}</p>`))
      );
    }

    this.auditTrail.unshift({
      type: type || 'notification',
      action: 'sendBulkNotification',
      sentBy,
      createdAt: new Date().toISOString(),
    });

    return { message: 'Notification sent successfully' };
  }

  async getSystemSettings() {
    return {
      ...this.systemSettings,
    };
  }

  async updateSystemSettings(settings) {
    this.systemSettings = {
      ...this.systemSettings,
      ...settings,
    };

    this.auditTrail.unshift({
      type: 'settings',
      action: 'updateSystemSettings',
      createdAt: new Date().toISOString(),
    });

    return this.getSystemSettings();
  }

  async getAuditTrail(filters = {}) {
    return this.getActivityLogs(filters);
  }

  async generatePlacementReport(batch) {
    const [dashboardStats, placementAnalytics, companyAnalytics, jobAnalytics] = await Promise.all([
      this.getDashboardStats(),
      this.getPlacementAnalytics(batch),
      this.getCompanyAnalytics(),
      this.getJobAnalytics(),
    ]);

    return {
      generatedAt: new Date().toISOString(),
      batch: batch || null,
      dashboardStats,
      placementAnalytics,
      companyAnalytics,
      jobAnalytics,
    };
  }

  /**
   * Activate user
   */
  async activateUser(userId) {
    const user = await userRepository.findById(userId, []);
    
    if (!user) {
      throw new NotFoundError('User');
    }

    user.isActive = true;
    await user.save();

    return { message: 'User activated successfully' };
  }

  /**
   * Get pending approvals
   */
  async getPendingApprovals() {
    const [companies] = await Promise.all([
      companyRepository.findPendingCompanies({ limit: 50 }),
    ]);

    return {
      companies: companies.data,
      total: companies.total,
    };
  }
}

module.exports = new AdminService();
