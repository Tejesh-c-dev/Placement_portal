/**
 * @file announcementService.js
 * @description Announcement service managing placement announcements.
 * Handles announcement creation, updates, deletion, targeted delivery,
 * pinning/archiving, email notifications, and statistics.
 */

const { announcementRepository, studentProfileRepository, userRepository } = require('../repositories');
const { NotFoundError, ValidationError, AuthorizationError } = require('../utils/AppError');
const emailService = require('./emailService');

class AnnouncementService {
  /**
   * Create announcement
   */
  async createAnnouncement(adminId, announcementData) {
    const announcement = await announcementRepository.create({
      ...announcementData,
      createdBy: adminId,
    });

    // Send email if requested
    if (announcementData.sendEmail) {
      this.sendAnnouncementEmails(announcement);
    }

    return announcement;
  }

  /**
   * Get announcements for the authenticated user.
   */
  async getAnnouncementsForUser(userId, options = {}) {
    const user = await userRepository.findById(userId);

    if (!user) {
      throw new NotFoundError('User');
    }

    if (user.role === 'student') {
      return this.getAnnouncementsForStudent(userId, options);
    }

    if (user.role === 'recruiter') {
      return this.getAnnouncementsForRecruiter(options);
    }

    return this.getActiveAnnouncements(options);
  }

  /**
   * Send announcement emails (async background)
   */
  async sendAnnouncementEmails(announcement) {
    try {
      // Get target users
      const filter = { isActive: true };
      
      if (announcement.targetRoles?.length > 0 && !announcement.targetRoles.includes('all')) {
        filter.role = { $in: announcement.targetRoles };
      }

      const users = await userRepository.findAll(filter, { limit: 10000, select: 'email' });
      const emails = users.data.map((u) => u.email);

      if (emails.length > 0) {
        await emailService.sendAnnouncementEmail(emails, announcement);
        
        // Update announcement
        announcement.emailSentAt = new Date();
        await announcement.save();
      }
    } catch (error) {
      console.error('Failed to send announcement emails:', error);
    }
  }

  /**
   * Get announcement by ID
   */
  async getAnnouncementById(announcementId, user = null) {
    const announcement = await announcementRepository.findById(announcementId, [
      { path: 'createdBy', select: 'firstName lastName' },
      { path: 'relatedCompany', select: 'name logo' },
      { path: 'relatedJob', select: 'title' },
    ]);
    
    if (!announcement) {
      throw new NotFoundError('Announcement');
    }

    if (user) {
      if (user.role === 'student') {
        if (announcement.status !== 'published') {
          throw new NotFoundError('Announcement');
        }
        if (announcement.targetRoles && announcement.targetRoles.length > 0 && !announcement.targetRoles.includes('all') && !announcement.targetRoles.includes('student')) {
          throw new AuthorizationError('You do not have permission to view this announcement');
        }
      } else if (user.role === 'recruiter') {
        const isCreator = announcement.createdBy && announcement.createdBy._id.toString() === user._id.toString();
        if (announcement.status !== 'published' && !isCreator) {
          throw new NotFoundError('Announcement');
        }
        if (announcement.targetRoles && announcement.targetRoles.length > 0 && !announcement.targetRoles.includes('all') && !announcement.targetRoles.includes('recruiter') && !isCreator) {
          throw new AuthorizationError('You do not have permission to view this announcement');
        }
      }
    }

    // Increment view count
    await announcementRepository.incrementViewCount(announcementId);

    return announcement;
  }

  /**
   * Update announcement
   */
  async updateAnnouncement(announcementId, adminIdOrUpdateData, maybeUpdateData) {
    const updateData = maybeUpdateData || adminIdOrUpdateData;
    const announcement = await announcementRepository.findById(announcementId);
    
    if (!announcement) {
      throw new NotFoundError('Announcement');
    }

    const updatedAnnouncement = await announcementRepository.updateById(announcementId, updateData);
    return updatedAnnouncement;
  }

  /**
   * Delete announcement
   */
  async deleteAnnouncement(announcementId) {
    const announcement = await announcementRepository.findById(announcementId);
    
    if (!announcement) {
      throw new NotFoundError('Announcement');
    }

    await announcementRepository.deleteById(announcementId);
    return { message: 'Announcement deleted successfully' };
  }

  /**
   * Get all announcements (admin)
   */
  async getAllAnnouncements(options = {}) {
    return announcementRepository.findAll({}, {
      ...options,
      populate: [{ path: 'createdBy', select: 'firstName lastName' }],
      sort: { createdAt: -1 },
    });
  }

  /**
   * Get active announcements
   */
  async getActiveAnnouncements(options = {}) {
    return announcementRepository.findActiveAnnouncements(options);
  }

  /**
   * Get urgent announcements.
   */
  async getUrgentAnnouncements(options = {}) {
    return announcementRepository.findAll(
      {
        status: 'published',
        priority: 'urgent',
      },
      {
        ...options,
        populate: [
          { path: 'createdBy', select: 'firstName lastName' },
          { path: 'relatedCompany', select: 'name logo' },
          { path: 'relatedJob', select: 'title' },
        ],
        sort: { isPinned: -1, publishAt: -1 },
      }
    );
  }

  /**
   * Get announcements for student
   */
  async getAnnouncementsForStudent(studentId, options = {}) {
    const studentProfile = await studentProfileRepository.findByUserId(studentId);
    return announcementRepository.findForStudent(studentProfile, options);
  }

  /**
   * Get announcements for recruiter
   */
  async getAnnouncementsForRecruiter(options = {}) {
    return announcementRepository.findForRecruiter(options);
  }

  /**
   * Activate or archive an announcement.
   */
  async toggleActive(announcementId) {
    const announcement = await announcementRepository.findById(announcementId);

    if (!announcement) {
      throw new NotFoundError('Announcement');
    }

    announcement.status = announcement.status === 'published' ? 'archived' : 'published';
    await announcement.save();

    return announcement;
  }

  /**
   * Pin an announcement.
   */
  async pinAnnouncement(announcementId) {
    const announcement = await announcementRepository.findById(announcementId);

    if (!announcement) {
      throw new NotFoundError('Announcement');
    }

    announcement.isPinned = true;
    await announcement.save();

    return announcement;
  }

  /**
   * Unpin an announcement.
   */
  async unpinAnnouncement(announcementId) {
    const announcement = await announcementRepository.findById(announcementId);

    if (!announcement) {
      throw new NotFoundError('Announcement');
    }

    announcement.isPinned = false;
    await announcement.save();

    return announcement;
  }

  /**
   * Send announcement email notification.
   */
  async sendAnnouncementEmail(announcementId) {
    const announcement = await announcementRepository.findById(announcementId);

    if (!announcement) {
      throw new NotFoundError('Announcement');
    }

    await this.sendAnnouncementEmails(announcement);
    return announcement;
  }

  /**
   * Pin/Unpin announcement
   */
  async togglePin(announcementId) {
    const announcement = await announcementRepository.findById(announcementId);
    
    if (!announcement) {
      throw new NotFoundError('Announcement');
    }

    announcement.isPinned = !announcement.isPinned;
    await announcement.save();

    return announcement;
  }

  /**
   * Archive announcement
   */
  async archiveAnnouncement(announcementId) {
    const announcement = await announcementRepository.findById(announcementId);
    
    if (!announcement) {
      throw new NotFoundError('Announcement');
    }

    announcement.status = 'archived';
    await announcement.save();

    return announcement;
  }

  /**
   * Get announcement statistics
   */
  async getAnnouncementStats() {
    return announcementRepository.getAnnouncementStats();
  }
}

module.exports = new AnnouncementService();
