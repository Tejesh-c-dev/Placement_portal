/**
 * @file emailService.js
 * @description Email service handling all email communications.
 * Sends verification emails, password reset emails, application status updates,
 * new job notifications, and broadcast announcements using nodemailer.
 */

const nodemailer = require('nodemailer');
const config = require('../config');
const logger = require('../utils/logger');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: config.email.host,
      port: config.email.port,
      secure: config.email.port === 465,
      auth: {
        user: config.email.user,
        pass: config.email.password,
      },
    });
  }

  async sendEmail(to, subject, html, text = '') {
    try {
      const mailOptions = {
        from: `"Placement Portal" <${config.email.from}>`,
        to,
        subject,
        html,
        text: text || html.replace(/<[^>]*>/g, ''),
      };

      if (config.nodeEnv === 'development') {
        logger.info(`Email would be sent to: ${to}`);
        logger.info(`Subject: ${subject}`);
        return { success: true, messageId: 'dev-mode' };
      }

      const info = await this.transporter.sendMail(mailOptions);
      logger.info(`Email sent: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      logger.error('Email sending failed:', error);
      throw error;
    }
  }

  async sendVerificationEmail(email, firstName, token) {
    const verificationUrl = `${config.frontendUrl}/verify-email?token=${token}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          .container { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }
          .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px; background: #f8fafc; }
          .button { background: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0; }
          .footer { padding: 20px; text-align: center; color: #64748b; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Placement Portal</h1>
          </div>
          <div class="content">
            <h2>Welcome, ${firstName}!</h2>
            <p>Thank you for registering on the Placement Portal. Please verify your email address by clicking the button below:</p>
            <a href="${verificationUrl}" class="button">Verify Email</a>
            <p>If you didn't create an account, you can safely ignore this email.</p>
            <p>This link will expire in 24 hours.</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Placement Portal. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail(email, 'Verify Your Email - Placement Portal', html);
  }

  async sendPasswordResetEmail(email, firstName, token) {
    const resetUrl = `${config.frontendUrl}/reset-password?token=${token}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          .container { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }
          .header { background: #dc2626; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px; background: #f8fafc; }
          .button { background: #dc2626; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0; }
          .footer { padding: 20px; text-align: center; color: #64748b; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Password Reset</h1>
          </div>
          <div class="content">
            <h2>Hello, ${firstName}</h2>
            <p>We received a request to reset your password. Click the button below to create a new password:</p>
            <a href="${resetUrl}" class="button">Reset Password</a>
            <p>If you didn't request a password reset, you can safely ignore this email.</p>
            <p>This link will expire in 1 hour.</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Placement Portal. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail(email, 'Reset Your Password - Placement Portal', html);
  }

  async sendPasswordChangedEmail(email, firstName) {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          .container { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }
          .header { background: #16a34a; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px; background: #f8fafc; }
          .footer { padding: 20px; text-align: center; color: #64748b; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Password Changed</h1>
          </div>
          <div class="content">
            <h2>Hello, ${firstName}</h2>
            <p>Your password has been successfully changed.</p>
            <p>If you didn't make this change, please contact support immediately.</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Placement Portal. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail(email, 'Password Changed - Placement Portal', html);
  }

  async sendApplicationStatusEmail(email, firstName, jobTitle, companyName, status) {
    const statusMessages = {
      shortlisted: {
        title: 'Congratulations! You\'ve Been Shortlisted 🎉',
        message: `Great news! You have been shortlisted for the ${jobTitle} position at ${companyName}.`,
        color: '#16a34a',
      },
      interview: {
        title: 'Interview Scheduled 📅',
        message: `You have been scheduled for an interview for the ${jobTitle} position at ${companyName}.`,
        color: '#2563eb',
      },
      selected: {
        title: 'Congratulations! You\'ve Been Selected! 🎊',
        message: `Amazing news! You have been selected for the ${jobTitle} position at ${companyName}!`,
        color: '#16a34a',
      },
      rejected: {
        title: 'Application Update',
        message: `Thank you for your interest in the ${jobTitle} position at ${companyName}. Unfortunately, we won't be moving forward with your application at this time.`,
        color: '#64748b',
      },
    };

    const statusInfo = statusMessages[status] || statusMessages.rejected;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          .container { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }
          .header { background: ${statusInfo.color}; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px; background: #f8fafc; }
          .button { background: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0; }
          .footer { padding: 20px; text-align: center; color: #64748b; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${statusInfo.title}</h1>
          </div>
          <div class="content">
            <h2>Hello, ${firstName}</h2>
            <p>${statusInfo.message}</p>
            <p>Please log in to the Placement Portal to view more details.</p>
            <a href="${config.frontendUrl}/applications" class="button">View Applications</a>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Placement Portal. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail(email, `${statusInfo.title} - ${companyName}`, html);
  }

  async sendNewJobNotification(email, firstName, jobTitle, companyName, jobId) {
    const jobUrl = `${config.frontendUrl}/jobs/${jobId}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          .container { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }
          .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px; background: #f8fafc; }
          .button { background: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0; }
          .footer { padding: 20px; text-align: center; color: #64748b; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>New Job Opportunity! 🚀</h1>
          </div>
          <div class="content">
            <h2>Hello, ${firstName}</h2>
            <p>A new job that matches your profile has been posted!</p>
            <p><strong>${jobTitle}</strong> at <strong>${companyName}</strong></p>
            <p>Don't miss this opportunity - apply now!</p>
            <a href="${jobUrl}" class="button">View Job & Apply</a>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Placement Portal. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail(email, `New Job: ${jobTitle} at ${companyName}`, html);
  }

  async sendAnnouncementEmail(emails, announcement) {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          .container { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }
          .header { background: #7c3aed; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px; background: #f8fafc; }
          .button { background: #7c3aed; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0; }
          .footer { padding: 20px; text-align: center; color: #64748b; font-size: 12px; }
          .priority-urgent { border-left: 4px solid #dc2626; padding-left: 15px; }
          .priority-high { border-left: 4px solid #f59e0b; padding-left: 15px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📢 Announcement</h1>
          </div>
          <div class="content">
            <h2 class="${announcement.priority === 'urgent' ? 'priority-urgent' : announcement.priority === 'high' ? 'priority-high' : ''}">${announcement.title}</h2>
            <div>${announcement.content}</div>
            <a href="${config.frontendUrl}/announcements" class="button">View All Announcements</a>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Placement Portal. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send in batches to avoid rate limiting
    const batchSize = 50;
    for (let i = 0; i < emails.length; i += batchSize) {
      const batch = emails.slice(i, i + batchSize);
      await Promise.all(
        batch.map(email => this.sendEmail(email, `[Announcement] ${announcement.title}`, html))
      );
    }
  }
}

module.exports = new EmailService();
