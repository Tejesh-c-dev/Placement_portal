/**
 * @file userRepository.js
 * @description User repository extending BaseRepository with user-specific database operations.
 * Handles user authentication queries, password reset tokens, refresh tokens,
 * role-based filtering, and user statistics aggregation.
 */

const BaseRepository = require('./BaseRepository');
const User = require('../models/User');

class UserRepository extends BaseRepository {
  constructor() {
    super(User);
  }

  async findByEmail(email) {
    return this.model.findOne({ email: email.toLowerCase() }).select('+password +isActive');
  }

  async findByIdWithPassword(id) {
    return this.model.findById(id).select('+password');
  }

  async findByIdWithRefreshToken(id) {
    return this.model.findById(id).select('+refreshToken');
  }

  async findByPasswordResetToken(hashedToken) {
    return this.model.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });
  }

  async findByEmailVerificationToken(hashedToken) {
    return this.model.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpires: { $gt: Date.now() },
    });
  }

  async updateRefreshToken(userId, refreshToken) {
    return this.model.findByIdAndUpdate(userId, { refreshToken }, { new: true });
  }

  async updateLastLogin(userId) {
    return this.model.findByIdAndUpdate(userId, {
      lastLogin: new Date(),
      loginAttempts: 0,
      $unset: { lockUntil: 1 },
    });
  }

  async findAllByRole(role, options = {}) {
    const filter = { role };
    if (options.isActive !== undefined) {
      filter.isActive = options.isActive;
    }
    return this.findAll(filter, options);
  }

  async searchUsers(searchTerm, options = {}) {
    const filter = {
      $or: [
        { firstName: { $regex: searchTerm, $options: 'i' } },
        { lastName: { $regex: searchTerm, $options: 'i' } },
        { email: { $regex: searchTerm, $options: 'i' } },
      ],
    };
    return this.findAll(filter, options);
  }

  async getUserStats() {
    return this.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 },
          active: {
            $sum: { $cond: ['$isActive', 1, 0] },
          },
        },
      },
    ]);
  }
}

module.exports = new UserRepository();
