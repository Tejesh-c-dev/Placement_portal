/**
 * @file authService.js
 * @description Authentication service handling user registration, login, logout,
 * JWT token generation/refresh, password reset, email verification,
 * and account security features like login attempt tracking.
 */

const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const config = require('../config');
const { userRepository } = require('../repositories');
const emailService = require('./emailService');
const {
  AuthenticationError,
  ConflictError,
  NotFoundError,
  ValidationError,
} = require('../utils/AppError');
const { sanitizeUser } = require('../utils/helpers');

class AuthService {
  /**
   * Generate access and refresh tokens
   */
  generateTokens(userId, role) {
    const accessToken = jwt.sign(
      { userId, role },
      config.jwt.accessSecret,
      { expiresIn: config.jwt.accessExpiry }
    );

    const refreshToken = jwt.sign(
      { userId, role, type: 'refresh' },
      config.jwt.refreshSecret,
      { expiresIn: config.jwt.refreshExpiry }
    );

    return { accessToken, refreshToken };
  }

  /**
   * Register a new user
   */
  async register(userData) {
    // Check if user already exists
    const existingUser = await userRepository.findByEmail(userData.email);
    if (existingUser) {
      throw new ConflictError('An account with this email already exists');
    }

    const allowedRegisterRoles = [config.ROLES.STUDENT, config.ROLES.RECRUITER];
    const roleToAssign = userData.role || config.ROLES.STUDENT;

    if (!allowedRegisterRoles.includes(roleToAssign)) {
      throw new ValidationError('Invalid role for self-registration. Admin roles must be assigned by an existing administrator.');
    }

    // Create user
    const user = await userRepository.create({
      email: userData.email,
      password: userData.password,
      firstName: userData.firstName,
      lastName: userData.lastName,
      phone: userData.phone,
      role: roleToAssign,
    });

    // Generate email verification token
    const verificationToken = user.createEmailVerificationToken();
    await user.save();

    // Send verification email
    try {
      await emailService.sendVerificationEmail(user.email, user.firstName, verificationToken);
    } catch (error) {
      console.error('Failed to send verification email:', error);
    }

    // Generate tokens
    const tokens = this.generateTokens(user._id, user.role);

    // Save refresh token
    await userRepository.updateRefreshToken(user._id, tokens.refreshToken);

    return {
      user: sanitizeUser(user),
      ...tokens,
    };
  }

  /**
   * Login user
   */
  async login(email, password) {
    // Find user with password
    const user = await userRepository.findByEmail(email);
    
    if (!user) {
      throw new AuthenticationError('Invalid email or password');
    }

    // Check if account is locked
    if (user.isLocked) {
      const lockTime = Math.ceil((user.lockUntil - Date.now()) / 60000);
      throw new AuthenticationError(`Account is locked. Please try again in ${lockTime} minutes`);
    }

    // Check if account is active
    if (!user.isActive) {
      throw new AuthenticationError('Your account has been deactivated. Please contact support');
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    
    if (!isPasswordValid) {
      await user.incLoginAttempts();
      throw new AuthenticationError('Invalid email or password');
    }

    // Reset login attempts and update last login
    await userRepository.updateLastLogin(user._id);

    // Generate tokens
    const tokens = this.generateTokens(user._id, user.role);

    // Save refresh token
    await userRepository.updateRefreshToken(user._id, tokens.refreshToken);

    return {
      user: sanitizeUser(user),
      ...tokens,
    };
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken) {
    try {
      // Verify refresh token
      const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret);

      if (decoded.type !== 'refresh') {
        throw new AuthenticationError('Invalid token type');
      }

      // Find user and verify stored refresh token
      const user = await userRepository.findByIdWithRefreshToken(decoded.userId);
      
      if (!user || user.refreshToken !== refreshToken) {
        throw new AuthenticationError('Invalid refresh token');
      }

      // Generate new tokens
      const tokens = this.generateTokens(user._id, user.role);

      // Update stored refresh token
      await userRepository.updateRefreshToken(user._id, tokens.refreshToken);

      return tokens;
    } catch (error) {
      if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
        throw new AuthenticationError('Invalid or expired refresh token');
      }
      throw error;
    }
  }

  /**
   * Logout user
   */
  async logout(userId) {
    await userRepository.updateRefreshToken(userId, null);
    return { message: 'Logged out successfully' };
  }

  /**
   * Forgot password - send reset email
   */
  async forgotPassword(email) {
    const user = await userRepository.findByEmail(email);
    
    if (!user) {
      // Don't reveal if user exists
      return { message: 'If an account with that email exists, we sent a password reset link' };
    }

    // Generate reset token
    const resetToken = user.createPasswordResetToken();
    await user.save();

    // Send reset email
    try {
      await emailService.sendPasswordResetEmail(user.email, user.firstName, resetToken);
    } catch (error) {
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save();
      throw new Error('Failed to send password reset email');
    }

    return { message: 'If an account with that email exists, we sent a password reset link' };
  }

  /**
   * Reset password
   */
  async resetPassword(token, newPassword) {
    // Hash token
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with valid token
    const user = await userRepository.findByPasswordResetToken(hashedToken);
    
    if (!user) {
      throw new ValidationError('Password reset token is invalid or has expired');
    }

    // Update password
    user.password = newPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    // Invalidate all refresh tokens
    await userRepository.updateRefreshToken(user._id, null);

    // Send confirmation email
    try {
      await emailService.sendPasswordChangedEmail(user.email, user.firstName);
    } catch (error) {
      console.error('Failed to send password changed email:', error);
    }

    return { message: 'Password has been reset successfully' };
  }

  /**
   * Change password (authenticated)
   */
  async changePassword(userId, currentPassword, newPassword) {
    const user = await userRepository.findByIdWithPassword(userId);
    
    if (!user) {
      throw new NotFoundError('User');
    }

    // Verify current password
    const isPasswordValid = await user.comparePassword(currentPassword);
    
    if (!isPasswordValid) {
      throw new AuthenticationError('Current password is incorrect');
    }

    // Update password
    user.password = newPassword;
    await user.save();

    // Invalidate all refresh tokens
    await userRepository.updateRefreshToken(user._id, null);

    // Send confirmation email
    try {
      await emailService.sendPasswordChangedEmail(user.email, user.firstName);
    } catch (error) {
      console.error('Failed to send password changed email:', error);
    }

    return { message: 'Password changed successfully' };
  }

  /**
   * Verify email
   */
  async verifyEmail(token) {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await userRepository.findByEmailVerificationToken(hashedToken);
    
    if (!user) {
      throw new ValidationError('Email verification token is invalid or has expired');
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    return { message: 'Email verified successfully' };
  }

  /**
   * Resend verification email
   */
  async resendVerificationEmail(userId) {
    const user = await userRepository.findById(userId);
    
    if (!user) {
      throw new NotFoundError('User');
    }

    if (user.isEmailVerified) {
      throw new ValidationError('Email is already verified');
    }

    const verificationToken = user.createEmailVerificationToken();
    await user.save();

    await emailService.sendVerificationEmail(user.email, user.firstName, verificationToken);

    return { message: 'Verification email sent' };
  }
}

module.exports = new AuthService();
