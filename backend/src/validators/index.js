/**
 * @file validators/index.js
 * @description Joi validation schemas for all API endpoints.
 * Exports schemas for auth, user, student, company, job,
 * application, announcement, and offer operations.
 */

const Joi = require('joi');

// Common validation schemas
const objectId = Joi.string().pattern(/^[0-9a-fA-F]{24}$/);
const password = Joi.string().min(8).max(50).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).messages({
  'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
});

// Auth validation schemas
const authSchemas = {
  register: {
    body: Joi.object({
      email: Joi.string().email().required().lowercase().trim(),
      password: password.required(),
      confirmPassword: Joi.string().valid(Joi.ref('password')).required().messages({
        'any.only': 'Passwords do not match',
      }),
      firstName: Joi.string().required().trim().max(50),
      lastName: Joi.string().required().trim().max(50),
      phone: Joi.string().pattern(/^\+?[\d\s-]{10,15}$/).allow('', null),
      role: Joi.string().valid('student', 'recruiter').default('student'),
    }),
  },

  login: {
    body: Joi.object({
      email: Joi.string().email().required().lowercase().trim(),
      password: Joi.string().required(),
    }),
  },

  forgotPassword: {
    body: Joi.object({
      email: Joi.string().email().required().lowercase().trim(),
    }),
  },

  resetPassword: {
    body: Joi.object({
      token: Joi.string().required(),
      password: password.required(),
      confirmPassword: Joi.string().valid(Joi.ref('password')).required().messages({
        'any.only': 'Passwords do not match',
      }),
    }),
  },

  changePassword: {
    body: Joi.object({
      currentPassword: Joi.string().required(),
      newPassword: password.required(),
      confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required().messages({
        'any.only': 'Passwords do not match',
      }),
    }),
  },

  refreshToken: {
    body: Joi.object({
      refreshToken: Joi.string().required(),
    }),
  },
};

// User validation schemas
const userSchemas = {
  updateProfile: {
    body: Joi.object({
      firstName: Joi.string().trim().max(50),
      lastName: Joi.string().trim().max(50),
      phone: Joi.string().pattern(/^\+?[\d\s-]{10,15}$/).allow('', null),
    }),
  },

  getById: {
    params: Joi.object({
      id: objectId.required(),
    }),
  },
};

// Student profile validation schemas
const studentSchemas = {
  createProfile: {
    body: Joi.object({
      rollNumber: Joi.string().required().trim().uppercase(),
      dateOfBirth: Joi.date().required().max('now'),
      gender: Joi.string().valid('male', 'female', 'other', 'prefer-not-to-say').required(),
      branch: Joi.string().valid('CSE', 'ECE', 'EEE', 'ME', 'CE', 'IT', 'CSE-AI', 'CSE-DS', 'BT', 'CH', 'Other').required(),
      batch: Joi.number().required().min(2000).max(2100),
      cgpa: Joi.number().required().min(0).max(10),
      activeBacklogs: Joi.number().min(0).default(0),
      totalBacklogs: Joi.number().min(0).default(0),
      tenthPercentage: Joi.number().required().min(0).max(100),
      twelfthPercentage: Joi.number().required().min(0).max(100),
      diplomaPercentage: Joi.number().min(0).max(100),
      skills: Joi.array().items(Joi.string().trim()).default([]),
      linkedIn: Joi.string().uri().allow('', null),
      github: Joi.string().uri().allow('', null),
      portfolio: Joi.string().uri().allow('', null),
      address: Joi.object({
        street: Joi.string().allow('', null),
        city: Joi.string().allow('', null),
        state: Joi.string().allow('', null),
        pincode: Joi.string().allow('', null),
        country: Joi.string().default('India'),
      }),
    }),
  },

  updateProfile: {
    body: Joi.object({
      cgpa: Joi.number().min(0).max(10),
      activeBacklogs: Joi.number().min(0),
      totalBacklogs: Joi.number().min(0),
      skills: Joi.array().items(Joi.string().trim()),
      projects: Joi.array().items(Joi.object({
        title: Joi.string().required().trim().max(100),
        description: Joi.string().trim().max(500),
        technologies: Joi.array().items(Joi.string()),
        link: Joi.string().uri().allow('', null),
        startDate: Joi.date(),
        endDate: Joi.date(),
      })),
      experience: Joi.array().items(Joi.object({
        company: Joi.string().required().trim(),
        position: Joi.string().required().trim(),
        type: Joi.string().valid('internship', 'full-time', 'part-time', 'contract'),
        startDate: Joi.date().required(),
        endDate: Joi.date(),
        isCurrent: Joi.boolean(),
        description: Joi.string().max(1000),
      })),
      certifications: Joi.array().items(Joi.object({
        name: Joi.string().required().trim(),
        issuer: Joi.string().required().trim(),
        issueDate: Joi.date(),
        expiryDate: Joi.date(),
        credentialId: Joi.string(),
        credentialUrl: Joi.string().uri(),
      })),
      linkedIn: Joi.string().uri().allow('', null),
      github: Joi.string().uri().allow('', null),
      portfolio: Joi.string().uri().allow('', null),
      address: Joi.object({
        street: Joi.string().allow('', null),
        city: Joi.string().allow('', null),
        state: Joi.string().allow('', null),
        pincode: Joi.string().allow('', null),
        country: Joi.string(),
      }),
    }),
  },
};

// Company validation schemas
const companySchemas = {
  create: {
    body: Joi.object({
      name: Joi.string().required().trim().max(100),
      description: Joi.string().trim().max(2000),
      industry: Joi.string().required().valid(
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
        'Other'
      ),
      type: Joi.string().valid('startup', 'mnc', 'psu', 'private', 'government'),
      website: Joi.string().uri().allow('', null),
      headquarters: Joi.object({
        city: Joi.string(),
        state: Joi.string(),
        country: Joi.string(),
      }),
      foundedYear: Joi.number().min(1800).max(new Date().getFullYear()),
      employeeCount: Joi.string().valid('1-50', '51-200', '201-500', '501-1000', '1001-5000', '5000+'),
      linkedIn: Joi.string().uri().allow('', null),
      hrContacts: Joi.array().items(Joi.object({
        name: Joi.string().required(),
        email: Joi.string().email().required(),
        phone: Joi.string(),
        designation: Joi.string(),
      })),
      tags: Joi.array().items(Joi.string()),
    }),
  },

  update: {
    params: Joi.object({
      id: objectId.required(),
    }),
    body: Joi.object({
      name: Joi.string().trim().max(100),
      description: Joi.string().trim().max(2000),
      industry: Joi.string().valid(
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
        'Other'
      ),
      type: Joi.string().valid('startup', 'mnc', 'psu', 'private', 'government'),
      website: Joi.string().uri().allow('', null),
      headquarters: Joi.object({
        city: Joi.string(),
        state: Joi.string(),
        country: Joi.string(),
      }),
      employeeCount: Joi.string().valid('1-50', '51-200', '201-500', '501-1000', '1001-5000', '5000+'),
      linkedIn: Joi.string().uri().allow('', null),
      hrContacts: Joi.array().items(Joi.object({
        name: Joi.string().required(),
        email: Joi.string().email().required(),
        phone: Joi.string(),
        designation: Joi.string(),
      })),
      tags: Joi.array().items(Joi.string()),
    }),
  },
};

// Job validation schemas
const jobSchemas = {
  create: {
    body: Joi.object({
      company: objectId.required(),
      title: Joi.string().required().trim().max(150),
      description: Joi.string().required().max(5000),
      jobType: Joi.string().required().valid('full-time', 'internship', 'ppo', 'internship+ppo'),
      location: Joi.string().required().trim(),
      workMode: Joi.string().valid('onsite', 'remote', 'hybrid').default('onsite'),
      package: Joi.object({
        ctc: Joi.number().required().min(0),
        ctcBreakdown: Joi.object({
          fixed: Joi.number().min(0),
          variable: Joi.number().min(0),
          bonus: Joi.number().min(0),
          stocks: Joi.number().min(0),
        }),
        currency: Joi.string().default('INR'),
        stipend: Joi.number().min(0),
        stipendDuration: Joi.string(),
      }).required(),
      duration: Joi.object({
        months: Joi.number().min(1),
        description: Joi.string(),
      }),
      roles: Joi.array().items(Joi.string().trim()),
      skillsRequired: Joi.array().items(Joi.string().trim()),
      responsibilities: Joi.array().items(Joi.string()),
      benefits: Joi.array().items(Joi.string()),
      openings: Joi.number().min(1).default(1),
      eligibility: Joi.object({
        minCGPA: Joi.number().min(0).max(10).default(6.0),
        maxActiveBacklogs: Joi.number().min(0).default(0),
        maxTotalBacklogs: Joi.number().min(0).default(2),
        allowedBranches: Joi.array().items(Joi.string().valid('CSE', 'ECE', 'EEE', 'ME', 'CE', 'IT', 'CSE-AI', 'CSE-DS', 'BT', 'CH', 'All')),
        allowedBatches: Joi.array().items(Joi.number()),
        minTenthPercentage: Joi.number().min(0).max(100).default(60),
        minTwelfthPercentage: Joi.number().min(0).max(100).default(60),
        gender: Joi.string().valid('all', 'male', 'female').default('all'),
        otherRequirements: Joi.string(),
      }).required(),
      selectionProcess: Joi.array().items(Joi.object({
        round: Joi.number().required(),
        name: Joi.string().required().trim(),
        type: Joi.string().required().valid(
          'aptitude',
          'technical-test',
          'coding-round',
          'group-discussion',
          'technical-interview',
          'hr-interview',
          'assignment',
          'presentation',
          'other'
        ),
        description: Joi.string(),
        duration: Joi.string(),
        mode: Joi.string().valid('online', 'offline', 'hybrid'),
        scheduledDate: Joi.date(),
        venue: Joi.string(),
      })),
      applicationDeadline: Joi.date().required().greater('now'),
      driveDate: Joi.date(),
    }),
  },
};

// Application validation schemas
const applicationSchemas = {
  create: {
    body: Joi.object({
      jobId: objectId.required(),
      coverLetter: Joi.string().max(2000),
      customAnswers: Joi.array().items(Joi.object({
        question: Joi.string().required(),
        answer: Joi.string().required(),
      })),
    }),
  },

  updateStatus: {
    params: Joi.object({
      id: objectId.required(),
    }),
    body: Joi.object({
      status: Joi.string().required().valid('applied', 'shortlisted', 'interview', 'selected', 'rejected'),
      remarks: Joi.string().max(500),
      rejectionReason: Joi.string().when('status', {
        is: 'rejected',
        then: Joi.string().max(500),
      }),
    }),
  },

  // Alias for route compatibility
  applyToJob: {
    body: Joi.object({
      jobId: objectId.required(),
      coverLetter: Joi.string().max(2000),
      customAnswers: Joi.array().items(Joi.object({
        question: Joi.string().required(),
        answer: Joi.string().required(),
      })),
    }),
  },

  bulkUpdateStatus: {
    body: Joi.object({
      applicationIds: Joi.array().items(objectId).required(),
      status: Joi.string().required().valid('applied', 'shortlisted', 'interview', 'selected', 'rejected'),
      remarks: Joi.string().max(500),
    }),
  },

  addInterviewRound: {
    body: Joi.object({
      round: Joi.number().required().min(1),
      name: Joi.string().required().trim(),
      type: Joi.string().valid(
        'aptitude', 'technical-test', 'coding-round', 'group-discussion',
        'technical-interview', 'hr-interview', 'assignment', 'presentation', 'other'
      ),
      scheduledDate: Joi.date(),
      venue: Joi.string().trim(),
      location: Joi.string().trim(),
      description: Joi.string().max(1000),
    }),
  },
};

// Announcement validation schemas
const announcementSchemas = {
  create: {
    body: Joi.object({
      title: Joi.string().required().trim().max(200),
      content: Joi.string().required().max(5000),
      type: Joi.string().valid('general', 'placement-drive', 'deadline', 'result', 'important', 'event').default('general'),
      priority: Joi.string().valid('low', 'medium', 'high', 'urgent').default('medium'),
      targetRoles: Joi.array().items(Joi.string().valid('student', 'recruiter', 'all')),
      targetBatches: Joi.array().items(Joi.number()),
      targetBranches: Joi.array().items(Joi.string().valid('CSE', 'ECE', 'EEE', 'ME', 'CE', 'IT', 'CSE-AI', 'CSE-DS', 'BT', 'CH', 'All')),
      relatedJob: objectId,
      relatedCompany: objectId,
      links: Joi.array().items(Joi.object({
        title: Joi.string().required(),
        url: Joi.string().uri().required(),
      })),
      publishAt: Joi.date(),
      expiresAt: Joi.date(),
      isPinned: Joi.boolean().default(false),
      sendEmail: Joi.boolean().default(false),
    }),
  },

  // Update schema (all fields optional)
  update: {
    body: Joi.object({
      title: Joi.string().trim().max(200),
      content: Joi.string().max(5000),
      type: Joi.string().valid('general', 'placement-drive', 'deadline', 'result', 'important', 'event'),
      priority: Joi.string().valid('low', 'medium', 'high', 'urgent'),
      targetRoles: Joi.array().items(Joi.string().valid('student', 'recruiter', 'all')),
      targetBatches: Joi.array().items(Joi.number()),
      targetBranches: Joi.array().items(Joi.string().valid('CSE', 'ECE', 'EEE', 'ME', 'CE', 'IT', 'CSE-AI', 'CSE-DS', 'BT', 'CH', 'All')),
      relatedJob: objectId,
      relatedCompany: objectId,
      links: Joi.array().items(Joi.object({
        title: Joi.string().required(),
        url: Joi.string().uri().required(),
      })),
      publishAt: Joi.date(),
      expiresAt: Joi.date(),
      isPinned: Joi.boolean(),
      sendEmail: Joi.boolean(),
    }),
  },
};

// Pagination query schema
const paginationSchema = {
  query: Joi.object({
    page: Joi.number().min(1).default(1),
    limit: Joi.number().min(1).max(100).default(10),
    sort: Joi.string(),
    search: Joi.string().max(100),
  }),
};

// Offer validation schemas
const offerSchemas = {
  createOffer: {
    body: Joi.object({
      applicationId: objectId.required(),
      ctc: Joi.object({
        amount: Joi.number().required().min(0),
        currency: Joi.string().default('INR'),
        isVariable: Joi.boolean().default(false),
        breakup: Joi.object({
          base: Joi.number(),
          bonus: Joi.number(),
          stocks: Joi.number(),
          other: Joi.number(),
        }),
      }).required(),
      joiningDate: Joi.date().required().greater('now'),
      offerLetterUrl: Joi.string().uri().allow('', null),
      expiresAt: Joi.date().greater('now'),
      location: Joi.string().trim().max(100),
      designation: Joi.string().trim().max(100),
      remarks: Joi.string().max(1000),
    }),
  },

  respondToOffer: {
    body: Joi.object({
      reason: Joi.string().max(500),
    }),
  },
};

module.exports = {
  authSchemas,
  userSchemas,
  studentSchemas,
  // Add route-expected aliases for company schemas
  companySchemas: {
    ...companySchemas,
    registerCompany: companySchemas.create,
    updateCompany: companySchemas.update,
  },
  // Add route-expected aliases for job schemas (updateJob = create with optional fields)
  jobSchemas: {
    ...jobSchemas,
    createJob: jobSchemas.create,
    updateJob: {
      params: Joi.object({ id: objectId.required() }),
      body: Joi.object({
        title: Joi.string().trim().max(150),
        description: Joi.string().max(5000),
        jobType: Joi.string().valid('full-time', 'internship', 'ppo', 'internship+ppo'),
        location: Joi.string().trim(),
        workMode: Joi.string().valid('onsite', 'remote', 'hybrid'),
        package: Joi.object({
          ctc: Joi.number().min(0),
          stipend: Joi.number().min(0),
          currency: Joi.string(),
        }),
        openings: Joi.number().min(1),
        applicationDeadline: Joi.date(),
        driveDate: Joi.date(),
        skillsRequired: Joi.array().items(Joi.string().trim()),
        roles: Joi.array().items(Joi.string().trim()),
        benefits: Joi.array().items(Joi.string()),
      }),
    },
  },
  // Add route-expected aliases for application schemas
  applicationSchemas: {
    ...applicationSchemas,
  },
  // Add route-expected aliases for announcement schemas
  announcementSchemas: {
    ...announcementSchemas,
    createAnnouncement: announcementSchemas.create,
    updateAnnouncement: announcementSchemas.update,
  },
  offerSchemas,
  paginationSchema,
  objectId,
};
