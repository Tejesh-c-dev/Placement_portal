/**
 * @file studentService.js
 * @description Student service handling student profile management.
 * Provides profile CRUD operations, resume upload/delete, placement status updates,
 * profile completeness suggestions, and student statistics.
 */

const path = require('path');
const fs = require('fs').promises;
const { studentProfileRepository, userRepository } = require('../repositories');
const { NotFoundError, ValidationError, ConflictError } = require('../utils/AppError');
const config = require('../config');

class StudentService {
  /**
   * Create student profile
   */
  async createProfile(userId, profileData) {
    // Check if profile already exists
    const existingProfile = await studentProfileRepository.findByUserId(userId);
    if (existingProfile) {
      throw new ConflictError('Student profile already exists');
    }

    // Check if roll number is taken
    const existingRollNumber = await studentProfileRepository.findByRollNumber(profileData.rollNumber);
    if (existingRollNumber) {
      throw new ConflictError('Roll number is already registered');
    }

    // Create profile
    const profile = await studentProfileRepository.create({
      user: userId,
      ...profileData,
    });

    return profile;
  }

  /**
   * Get student profile by user ID
   */
  async getProfileByUserId(userId) {
    const profile = await studentProfileRepository.findByUserId(userId);

    return profile;
  }

  /**
   * Update student profile
   */
  async updateProfile(userId, updateData) {
    const profile = await studentProfileRepository.findByUserId(userId);
    
    if (!profile) {
      throw new NotFoundError('Student profile');
    }

    // Update profile
    Object.keys(updateData).forEach((key) => {
      if (updateData[key] !== undefined) {
        profile[key] = updateData[key];
      }
    });

    await profile.save();
    return profile;
  }

  /**
   * Upload resume
   */
  async uploadResume(userId, file) {
    const profile = await studentProfileRepository.findByUserId(userId);
    
    if (!profile) {
      throw new NotFoundError('Student profile');
    }

    // Delete old resume if exists
    if (profile.resume && profile.resume.path) {
      try {
        await fs.unlink(profile.resume.path);
      } catch (error) {
        console.error('Error deleting old resume:', error);
      }
    }

    // Update resume info
    const resumeData = {
      filename: file.filename,
      originalName: file.originalname,
      path: file.path,
      uploadedAt: new Date(),
      size: file.size,
    };

    const updatedProfile = await studentProfileRepository.updateResume(userId, resumeData);
    return updatedProfile;
  }

  /**
   * Delete resume
   */
  async deleteResume(userId) {
    const profile = await studentProfileRepository.findByUserId(userId);
    
    if (!profile) {
      throw new NotFoundError('Student profile');
    }

    if (!profile.resume || !profile.resume.path) {
      throw new ValidationError('No resume found to delete');
    }

    // Delete file
    try {
      await fs.unlink(profile.resume.path);
    } catch (error) {
      console.error('Error deleting resume file:', error);
    }

    // Update profile
    profile.resume = undefined;
    await profile.save();

    return { message: 'Resume deleted successfully' };
  }

  /**
   * Get all students with pagination
   */
  async getAllStudents(options = {}) {
    return studentProfileRepository.findAll({}, {
      ...options,
      populate: [{ path: 'user', select: 'firstName lastName email phone avatar isActive' }],
    });
  }

  /**
   * Get students who are not placed yet.
   */
  async getUnplacedStudents(options = {}) {
    const filter = {
      isPlaced: false,
      placementStatus: 'not-placed',
    };

    if (options.batch) {
      filter.batch = parseInt(options.batch, 10);
    }

    if (options.branch) {
      filter.branch = options.branch;
    }

    if (options.minCGPA !== undefined) {
      filter.cgpa = { $gte: options.minCGPA };
    }

    return studentProfileRepository.findAll(filter, {
      ...options,
      populate: [{ path: 'user', select: 'firstName lastName email phone avatar isActive' }],
    });
  }

  /**
   * Get students by batch and branch
   */
  async getStudentsByBatchAndBranch(batch, branch, options = {}) {
    return studentProfileRepository.findByBatchAndBranch(batch, branch, options);
  }

  /**
   * Search students
   */
  async searchStudents(searchTerm, options = {}) {
    return studentProfileRepository.searchProfiles(searchTerm, options);
  }

  /**
   * Get eligible students for a job
   */
  async getEligibleStudents(criteria, options = {}) {
    return studentProfileRepository.findEligibleStudents(criteria, options);
  }

  /**
   * Update placement status
   */
  async updatePlacementStatus(userId, status, isPlaced) {
    const profile = await studentProfileRepository.findByUserId(userId);
    
    if (!profile) {
      throw new NotFoundError('Student profile');
    }

    return studentProfileRepository.updatePlacementStatus(userId, status, isPlaced);
  }

  /**
   * Get placement statistics
   */
  async getPlacementStats(batch) {
    return studentProfileRepository.getPlacementStats(batch);
  }

  /**
   * Get batch statistics
   */
  async getBatchStats() {
    return studentProfileRepository.getBatchStats();
  }

  /**
   * Get skills distribution
   */
  async getSkillsDistribution(batch) {
    return studentProfileRepository.getSkillsDistribution(batch);
  }

  /**
   * Opt out of placements
   */
  async optOutOfPlacements(userId, reason) {
    const profile = await studentProfileRepository.findByUserId(userId);
    
    if (!profile) {
      throw new NotFoundError('Student profile');
    }

    profile.isEligibleForPlacements = false;
    profile.optOutReason = reason;
    await profile.save();

    return { message: 'Opted out of placements successfully' };
  }

  /**
   * Get profile completion suggestions
   */
  async getProfileSuggestions(userId) {
    const profile = await studentProfileRepository.findByUserId(userId);
    
    if (!profile) {
      throw new NotFoundError('Student profile');
    }

    const suggestions = [];

    if (!profile.resume || !profile.resume.path) {
      suggestions.push({
        field: 'resume',
        message: 'Upload your resume to improve visibility to recruiters',
        priority: 'high',
      });
    }

    if (!profile.skills || profile.skills.length < 5) {
      suggestions.push({
        field: 'skills',
        message: 'Add more skills to your profile (recommended: at least 5)',
        priority: 'high',
      });
    }

    if (!profile.projects || profile.projects.length === 0) {
      suggestions.push({
        field: 'projects',
        message: 'Add projects to showcase your work',
        priority: 'medium',
      });
    }

    if (!profile.linkedIn) {
      suggestions.push({
        field: 'linkedIn',
        message: 'Add your LinkedIn profile URL',
        priority: 'low',
      });
    }

    if (!profile.github) {
      suggestions.push({
        field: 'github',
        message: 'Add your GitHub profile URL',
        priority: 'low',
      });
    }

    if (!profile.experience || profile.experience.length === 0) {
      suggestions.push({
        field: 'experience',
        message: 'Add any internship or work experience',
        priority: 'medium',
      });
    }

    return {
      profileCompleteness: profile.profileCompleteness,
      suggestions,
    };
  }
}

module.exports = new StudentService();
