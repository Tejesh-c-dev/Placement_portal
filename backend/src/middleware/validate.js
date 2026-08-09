/**
 * @file validate.js
 * @description Request validation middleware using Joi schemas.
 * Validates request body, params, and query against defined schemas,
 * strips unknown fields, and aggregates validation errors.
 */

const { ValidationError } = require('../utils/AppError');

/**
 * Middleware factory for validating request data using Joi schema
 * @param {Object} schema - Joi schema object with optional body, params, query keys
 * @returns {Function} Express middleware
 */
const validate = (schema) => {
  return (req, res, next) => {
    const validationErrors = [];

    // Validate body
    if (schema.body) {
      const { error, value } = schema.body.validate(req.body, {
        abortEarly: false,
        stripUnknown: true,
      });
      
      if (error) {
        validationErrors.push(...error.details.map((detail) => ({
          field: detail.path.join('.'),
          message: detail.message,
          type: 'body',
        })));
      } else {
        req.body = value;
      }
    }

    // Validate params
    if (schema.params) {
      const { error, value } = schema.params.validate(req.params, {
        abortEarly: false,
        stripUnknown: true,
      });
      
      if (error) {
        validationErrors.push(...error.details.map((detail) => ({
          field: detail.path.join('.'),
          message: detail.message,
          type: 'params',
        })));
      } else {
        req.params = value;
      }
    }

    // Validate query
    if (schema.query) {
      const { error, value } = schema.query.validate(req.query, {
        abortEarly: false,
        stripUnknown: true,
      });
      
      if (error) {
        validationErrors.push(...error.details.map((detail) => ({
          field: detail.path.join('.'),
          message: detail.message,
          type: 'query',
        })));
      } else {
        req.query = value;
      }
    }

    // If there are validation errors, pass to error handler
    if (validationErrors.length > 0) {
      return next(new ValidationError('Validation failed', validationErrors));
    }

    next();
  };
};

module.exports = { validate };
