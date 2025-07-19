/**
 * Input Sanitization Middleware - Step 4.2
 * Provides comprehensive input validation and sanitization
 */

const DOMPurify = require('isomorphic-dompurify');
const validator = require('validator');
const rateLimit = require('express-rate-limit');

class InputSanitizer {
  constructor() {
    this.maxStringLength = 10000;
    this.maxArrayLength = 1000;
    this.maxObjectDepth = 10;
  }

  // Main sanitization middleware
  sanitizeInput() {
    return (req, res, next) => {
      try {
        // Sanitize request body
        if (req.body && typeof req.body === 'object') {
          req.body = this.sanitizeObject(req.body, 0);
        }

        // Sanitize query parameters
        if (req.query && typeof req.query === 'object') {
          req.query = this.sanitizeObject(req.query, 0);
        }

        // Sanitize URL parameters
        if (req.params && typeof req.params === 'object') {
          req.params = this.sanitizeObject(req.params, 0);
        }

        next();
      } catch (error) {
        console.error('Input sanitization error:', error);
        return res.status(400).json({
          success: false,
          error: 'Invalid input data',
          code: 'INPUT_SANITIZATION_ERROR'
        });
      }
    };
  }

  // Recursively sanitize objects
  sanitizeObject(obj, depth) {
    if (depth > this.maxObjectDepth) {
      throw new Error('Object nesting too deep');
    }

    if (obj === null || obj === undefined) {
      return obj;
    }

    if (Array.isArray(obj)) {
      if (obj.length > this.maxArrayLength) {
        throw new Error('Array too large');
      }
      return obj.map(item => this.sanitizeValue(item, depth + 1));
    }

    if (typeof obj === 'object') {
      const sanitized = {};
      for (const [key, value] of Object.entries(obj)) {
        const cleanKey = this.sanitizeString(key);
        sanitized[cleanKey] = this.sanitizeValue(value, depth + 1);
      }
      return sanitized;
    }

    return this.sanitizeValue(obj, depth);
  }

  // Sanitize individual values
  sanitizeValue(value, depth) {
    if (value === null || value === undefined) {
      return value;
    }

    if (typeof value === 'string') {
      return this.sanitizeString(value);
    }

    if (typeof value === 'number') {
      return this.sanitizeNumber(value);
    }

    if (typeof value === 'boolean') {
      return value;
    }

    if (typeof value === 'object') {
      return this.sanitizeObject(value, depth);
    }

    return value;
  }

  // Sanitize strings
  sanitizeString(str) {
    if (typeof str !== 'string') {
      return str;
    }

    if (str.length > this.maxStringLength) {
      throw new Error('String too long');
    }

    // Remove null bytes
    str = str.replace(/\0/g, '');

    // Basic XSS protection - sanitize HTML
    str = DOMPurify.sanitize(str, { 
      ALLOWED_TAGS: [],
      ALLOWED_ATTR: [],
      ALLOW_DATA_ATTR: false
    });

    // Remove potentially dangerous patterns
    str = str.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    str = str.replace(/javascript:/gi, '');
    str = str.replace(/on\w+\s*=/gi, '');

    // Normalize whitespace
    str = str.trim();

    return str;
  }

  // Sanitize numbers
  sanitizeNumber(num) {
    if (typeof num !== 'number') {
      return num;
    }

    // Check for NaN and Infinity
    if (!Number.isFinite(num)) {
      throw new Error('Invalid number');
    }

    // Limit number size
    if (Math.abs(num) > Number.MAX_SAFE_INTEGER) {
      throw new Error('Number too large');
    }

    return num;
  }

  // Validate email addresses
  validateEmail() {
    return (req, res, next) => {
      const emailFields = ['email', 'emailAddress', 'userEmail'];
      
      for (const field of emailFields) {
        if (req.body && req.body[field]) {
          if (!validator.isEmail(req.body[field])) {
            return res.status(400).json({
              success: false,
              error: `Invalid email format: ${field}`,
              code: 'INVALID_EMAIL'
            });
          }
        }
      }
      
      next();
    };
  }

  // Validate MongoDB ObjectIds
  validateObjectIds() {
    return (req, res, next) => {
      const idFields = ['id', 'userId', 'ticketId', 'customerId'];
      
      // Check URL parameters
      for (const param in req.params) {
        if (param.endsWith('Id') || param === 'id') {
          if (!validator.isMongoId(req.params[param])) {
            return res.status(400).json({
              success: false,
              error: `Invalid ID format: ${param}`,
              code: 'INVALID_ID'
            });
          }
        }
      }

      // Check body fields
      for (const field of idFields) {
        if (req.body && req.body[field]) {
          if (!validator.isMongoId(req.body[field])) {
            return res.status(400).json({
              success: false,
              error: `Invalid ID format: ${field}`,
              code: 'INVALID_ID'
            });
          }
        }
      }
      
      next();
    };
  }

  // File upload sanitization
  sanitizeFileUploads() {
    return (req, res, next) => {
      if (req.files) {
        const allowedMimeTypes = [
          'image/jpeg',
          'image/png',
          'image/gif',
          'text/plain',
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ];

        const maxFileSize = 10 * 1024 * 1024; // 10MB

        for (const file of Object.values(req.files)) {
          // Check file size
          if (file.size > maxFileSize) {
            return res.status(400).json({
              success: false,
              error: 'File size too large (max 10MB)',
              code: 'FILE_TOO_LARGE'
            });
          }

          // Check MIME type
          if (!allowedMimeTypes.includes(file.mimetype)) {
            return res.status(400).json({
              success: false,
              error: 'File type not allowed',
              code: 'INVALID_FILE_TYPE'
            });
          }

          // Sanitize filename
          file.name = this.sanitizeString(file.name);
          file.name = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        }
      }
      
      next();
    };
  }

  // SQL injection protection (for raw queries)
  preventSQLInjection() {
    return (req, res, next) => {
      const sqlPatterns = [
        /(\b(select|insert|update|delete|drop|create|alter|exec|execute)\b)/i,
        /(union|join|where|having|group by|order by)/i,
        /('|(\\')|(;)|(\\)|(--))/i
      ];

      const checkValue = (value) => {
        if (typeof value === 'string') {
          for (const pattern of sqlPatterns) {
            if (pattern.test(value)) {
              return true;
            }
          }
        }
        return false;
      };

      const checkObject = (obj) => {
        for (const value of Object.values(obj)) {
          if (typeof value === 'object' && value !== null) {
            if (checkObject(value)) return true;
          } else if (checkValue(value)) {
            return true;
          }
        }
        return false;
      };

      // Check body, query, and params
      if ((req.body && checkObject(req.body)) ||
          (req.query && checkObject(req.query)) ||
          (req.params && checkObject(req.params))) {
        return res.status(400).json({
          success: false,
          error: 'Potentially malicious input detected',
          code: 'MALICIOUS_INPUT'
        });
      }

      next();
    };
  }

  // Rate limiting for different endpoint types
  createRateLimiters() {
    return {
      // Standard API rate limiting
      api: rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100,
        message: {
          success: false,
          error: 'Too many API requests',
          code: 'API_RATE_LIMIT'
        },
        standardHeaders: true,
        legacyHeaders: false,
        skip: (req) => process.env.NODE_ENV === 'test'
      }),

      // Authentication rate limiting
      auth: rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 5,
        message: {
          success: false,
          error: 'Too many authentication attempts',
          code: 'AUTH_RATE_LIMIT'
        },
        standardHeaders: true,
        legacyHeaders: false,
        skip: (req) => process.env.NODE_ENV === 'test'
      }),

      // File upload rate limiting
      upload: rateLimit({
        windowMs: 60 * 60 * 1000, // 1 hour
        max: 10,
        message: {
          success: false,
          error: 'Too many file uploads',
          code: 'UPLOAD_RATE_LIMIT'
        },
        standardHeaders: true,
        legacyHeaders: false,
        skip: (req) => process.env.NODE_ENV === 'test'
      })
    };
  }
}

module.exports = new InputSanitizer();
