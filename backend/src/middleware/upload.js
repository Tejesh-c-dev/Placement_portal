/**
 * @file upload.js
 * @description File upload middleware using multer.
 * Configures storage, file filtering, and size limits for:
 * - Resume uploads (PDF only, 5MB)
 * - Company logo uploads (images, 2MB)
 * - User avatar uploads (images, 1MB)
 */

const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const config = require('../config');
const { ValidationError } = require('../utils/AppError');

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../uploads/resumes');
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = crypto.randomBytes(8).toString('hex');
    const ext = path.extname(file.originalname);
    const filename = `resume-${req.user._id}-${uniqueSuffix}${ext}`;
    cb(null, filename);
  },
});

// File filter for PDF only
const fileFilter = (req, file, cb) => {
  const allowedMimes = config.upload.allowedMimeTypes;
  const allowedExts = config.upload.allowedExtensions;
  
  const ext = path.extname(file.originalname).toLowerCase();
  const mimeType = file.mimetype;
  
  if (allowedMimes.includes(mimeType) && allowedExts.includes(ext)) {
    cb(null, true);
  } else {
    cb(new ValidationError('Invalid file type. Only PDF files are allowed.'), false);
  }
};

// Configure multer
const uploadResume = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: config.upload.maxSize,
    files: 1,
  },
}).single('resume');

// Wrapper to handle multer errors
const handleResumeUpload = (req, res, next) => {
  uploadResume(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return next(new ValidationError(`File too large. Maximum size is ${config.upload.maxSize / (1024 * 1024)}MB`));
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
          return next(new ValidationError('Too many files. Only one file is allowed.'));
        }
        return next(new ValidationError(err.message));
      }
      return next(err);
    }
    next();
  });
};

// Company logo upload
const logoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../uploads/logos');
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = crypto.randomBytes(8).toString('hex');
    const ext = path.extname(file.originalname);
    const filename = `logo-${uniqueSuffix}${ext}`;
    cb(null, filename);
  },
});

const logoFilter = (req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
  const allowedExts = ['.jpg', '.jpeg', '.png', '.webp'];
  
  const ext = path.extname(file.originalname).toLowerCase();
  const mimeType = file.mimetype;
  
  if (allowedMimes.includes(mimeType) && allowedExts.includes(ext)) {
    cb(null, true);
  } else {
    cb(new ValidationError('Invalid file type. Only JPEG, PNG, or WebP images are allowed.'), false);
  }
};

const uploadLogo = multer({
  storage: logoStorage,
  fileFilter: logoFilter,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB
    files: 1,
  },
}).single('logo');

const handleLogoUpload = (req, res, next) => {
  uploadLogo(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return next(new ValidationError('Logo file too large. Maximum size is 2MB'));
        }
        return next(new ValidationError(err.message));
      }
      return next(err);
    }
    next();
  });
};

// Avatar upload
const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../uploads/avatars');
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = crypto.randomBytes(8).toString('hex');
    const ext = path.extname(file.originalname);
    const filename = `avatar-${req.user._id}-${uniqueSuffix}${ext}`;
    cb(null, filename);
  },
});

const avatarUpload = multer({
  storage: avatarStorage,
  fileFilter: logoFilter, // Reuse logo filter for images
  limits: {
    fileSize: 1 * 1024 * 1024, // 1MB
    files: 1,
  },
}).single('avatar');

const handleAvatarUpload = (req, res, next) => {
  avatarUpload(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return next(new ValidationError('Avatar file too large. Maximum size is 1MB'));
        }
        return next(new ValidationError(err.message));
      }
      return next(err);
    }
    next();
  });
};

module.exports = {
  handleResumeUpload,
  uploadResume: handleResumeUpload, // Alias
  handleLogoUpload,
  uploadLogo: handleLogoUpload, // Alias
  handleAvatarUpload,
  uploadAvatar: handleAvatarUpload, // Alias
};
