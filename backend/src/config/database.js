/**
 * @file database.js
 * @description MongoDB database connection configuration and management.
 * Handles connection establishment, reconnection logic, and graceful shutdown.
 */

const mongoose = require('mongoose');
const config = require('./index');
const logger = require('../utils/logger');

/**
 * Establishes connection to MongoDB database.
 * Sets up connection event handlers for error, disconnect, and reconnect events.
 * Implements graceful shutdown on SIGINT signal.
 * @returns {Promise<mongoose.Connection>} - The mongoose connection object
 * @throws {Error} - If connection fails
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(config.mongodb.uri, config.mongodb.options);
    
    logger.info(`MongoDB Connected: ${conn.connection.host}`);
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected. Attempting to reconnect...');
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      logger.info('MongoDB connection closed due to app termination');
      process.exit(0);
    });

    return conn;
  } catch (error) {
    logger.error('Error connecting to MongoDB:', error.message);
    throw error;
  }
};

module.exports = connectDB;
