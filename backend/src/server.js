/**
 * @file server.js
 * @description Application entry point. Starts the HTTP server and establishes database connection.
 * Handles uncaught exceptions, unhandled promise rejections, and graceful shutdown signals (SIGTERM, SIGINT).
 */

const app = require('./app');
const config = require('./config');
const connectDB = require('./config/database');
const logger = require('./utils/logger');

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('UNCAUGHT EXCEPTION! Shutting down...');
  logger.error(err.name, err.message);
  logger.error(err.stack);
  process.exit(1);
});

// Connect to database and start server
const startServer = async () => {
  try {
    await connectDB();

    // Only start accepting requests after MongoDB is ready.
    const server = app.listen(config.port, () => {
      logger.info(`Server running in ${config.nodeEnv} mode on port ${config.port}`);
      logger.info(`API URL: http://localhost:${config.port}/api`);
      logger.info(`Health Check: http://localhost:${config.port}/health`);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (err) => {
      logger.error('UNHANDLED REJECTION! Shutting down...');
      logger.error(err.name, err.message);
      server.close(() => {
        process.exit(1);
      });
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      logger.info('SIGTERM received. Shutting down gracefully...');
      server.close(() => {
        logger.info('Process terminated.');
      });
    });

    process.on('SIGINT', () => {
      logger.info('SIGINT received. Shutting down gracefully...');
      server.close(() => {
        logger.info('Process terminated.');
      });
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
