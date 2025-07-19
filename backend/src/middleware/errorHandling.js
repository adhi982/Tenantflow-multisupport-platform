/**
 * Enhanced Error Handling Middleware - Step 4.2
 * Provides comprehensive error handling, logging, and user-friendly responses
 */

const fs = require('fs');
const path = require('path');

class ErrorHandler {
  constructor() {
    this.errorLogDir = path.join(__dirname, '../../logs');
    this.ensureLogDirectory();
    this.errorPatterns = new Map(); // Track error patterns
  }

  ensureLogDirectory() {
    if (!fs.existsSync(this.errorLogDir)) {
      fs.mkdirSync(this.errorLogDir, { recursive: true });
    }
  }

  // Main error handling middleware
  handleErrors() {
    return (error, req, res, next) => {
      // Generate error ID for tracking
      const errorId = require('crypto').randomBytes(8).toString('hex');
      const timestamp = new Date().toISOString();
      
      // Log error details
      const errorDetails = {
        errorId,
        timestamp,
        message: error.message,
        stack: error.stack,
        name: error.name,
        code: error.code,
        requestId: req.id,
        method: req.method,
        url: req.originalUrl,
        userAgent: req.get('User-Agent'),
        ip: req.ip || req.connection.remoteAddress,
        userId: req.user?.id,
        tenantId: req.tenantId,
        body: this.sanitizeForLogging(req.body),
        query: req.query,
        params: req.params
      };

      // Track error patterns
      this.trackErrorPattern(error, req);

      // Log to console
      console.error(`❌ Error [${errorId}]:`, {
        message: error.message,
        url: `${req.method} ${req.originalUrl}`,
        user: req.user?.email || 'anonymous',
        timestamp
      });

      // Write to error log file
      this.writeErrorLog(errorDetails);

      // Determine response based on error type
      const response = this.formatErrorResponse(error, errorId);
      
      res.status(response.statusCode).json(response.body);
    };
  }

  trackErrorPattern(error, req) {
    const pattern = `${error.name}:${req.method}:${req.route?.path || req.path}`;
    const current = this.errorPatterns.get(pattern) || { count: 0, lastSeen: null };
    current.count++;
    current.lastSeen = new Date();
    this.errorPatterns.set(pattern, current);

    // Alert on repeated errors
    if (current.count > 10) {
      console.warn(`⚠️ Repeated error pattern detected: ${pattern} (${current.count} times)`);
    }
  }

  formatErrorResponse(error, errorId) {
    let statusCode = 500;
    let userMessage = 'An internal server error occurred';
    let errorCode = 'INTERNAL_SERVER_ERROR';
    let details = null;

    // Handle specific error types
    switch (error.name) {
      case 'ValidationError':
        statusCode = 400;
        userMessage = 'Invalid input data';
        errorCode = 'VALIDATION_ERROR';
        details = Object.values(error.errors || {}).map(err => ({
          field: err.path,
          message: err.message,
          value: err.value
        }));
        break;

      case 'CastError':
        statusCode = 400;
        userMessage = 'Invalid data format';
        errorCode = 'INVALID_FORMAT';
        if (error.path === '_id') {
          userMessage = 'Invalid ID format';
          errorCode = 'INVALID_ID';
        }
        break;

      case 'MongoServerError':
        statusCode = 500;
        errorCode = 'DATABASE_ERROR';
        if (error.code === 11000) {
          statusCode = 409;
          userMessage = 'Duplicate entry detected';
          errorCode = 'DUPLICATE_ENTRY';
          
          // Extract field from duplicate key error
          const field = Object.keys(error.keyPattern || {})[0];
          if (field) {
            details = { field, message: `${field} already exists` };
          }
        }
        break;

      case 'JsonWebTokenError':
        statusCode = 401;
        userMessage = 'Invalid authentication token';
        errorCode = 'INVALID_TOKEN';
        break;

      case 'TokenExpiredError':
        statusCode = 401;
        userMessage = 'Authentication token has expired';
        errorCode = 'TOKEN_EXPIRED';
        break;

      case 'MulterError':
        statusCode = 400;
        errorCode = 'FILE_UPLOAD_ERROR';
        switch (error.code) {
          case 'LIMIT_FILE_SIZE':
            userMessage = 'File size too large';
            break;
          case 'LIMIT_FILE_COUNT':
            userMessage = 'Too many files uploaded';
            break;
          case 'LIMIT_UNEXPECTED_FILE':
            userMessage = 'Unexpected file upload';
            break;
          default:
            userMessage = 'File upload error';
        }
        break;

      case 'PayloadTooLargeError':
        statusCode = 413;
        userMessage = 'Request payload too large';
        errorCode = 'PAYLOAD_TOO_LARGE';
        break;

      case 'SyntaxError':
        if (error.message.includes('JSON')) {
          statusCode = 400;
          userMessage = 'Invalid JSON format';
          errorCode = 'INVALID_JSON';
        }
        break;

      case 'TypeError':
        if (error.message.includes('Cannot read property')) {
          statusCode = 400;
          userMessage = 'Invalid request structure';
          errorCode = 'INVALID_REQUEST_STRUCTURE';
        }
        break;

      case 'ReferenceError':
        statusCode = 500;
        errorCode = 'REFERENCE_ERROR';
        userMessage = 'Internal reference error';
        break;

      default:
        // Handle custom application errors
        if (error.statusCode) {
          statusCode = error.statusCode;
        }
        if (error.code) {
          errorCode = error.code;
        }
        if (error.message && statusCode < 500) {
          userMessage = error.message;
        }
    }

    // Prepare response body
    const body = {
      success: false,
      error: userMessage,
      code: errorCode,
      errorId,
      timestamp: new Date().toISOString()
    };

    // Add details for client errors (4xx)
    if (statusCode >= 400 && statusCode < 500 && details) {
      body.details = details;
    }

    // Add stack trace in development
    if (process.env.NODE_ENV === 'development') {
      body.stack = error.stack;
      body.originalError = error.message;
    }

    return { statusCode, body };
  }

  sanitizeForLogging(data) {
    if (!data || typeof data !== 'object') return data;
    
    const sensitive = ['password', 'token', 'authorization', 'cookie', 'secret'];
    const sanitized = { ...data };
    
    Object.keys(sanitized).forEach(key => {
      if (sensitive.some(field => key.toLowerCase().includes(field))) {
        sanitized[key] = '[REDACTED]';
      }
    });
    
    return sanitized;
  }

  writeErrorLog(errorDetails) {
    try {
      const logFile = path.join(this.errorLogDir, `errors-${new Date().toISOString().split('T')[0]}.log`);
      const logEntry = JSON.stringify(errorDetails) + '\n';
      
      fs.appendFileSync(logFile, logEntry);
    } catch (error) {
      console.error('Failed to write error log:', error.message);
    }
  }

  // Handle async errors
  asyncErrorHandler(fn) {
    return (req, res, next) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  }

  // Handle 404 errors
  notFoundHandler() {
    return (req, res, next) => {
      const error = new Error(`Route not found: ${req.method} ${req.originalUrl}`);
      error.statusCode = 404;
      error.code = 'ROUTE_NOT_FOUND';
      next(error);
    };
  }

  // Handle uncaught exceptions
  setupUncaughtExceptionHandlers() {
    process.on('uncaughtException', (error) => {
      console.error('💥 Uncaught Exception:', error);
      
      const errorDetails = {
        type: 'uncaughtException',
        timestamp: new Date().toISOString(),
        message: error.message,
        stack: error.stack,
        pid: process.pid
      };
      
      this.writeErrorLog(errorDetails);
      
      // Give time for logs to write, then exit
      setTimeout(() => {
        process.exit(1);
      }, 1000);
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
      
      const errorDetails = {
        type: 'unhandledRejection',
        timestamp: new Date().toISOString(),
        reason: reason?.message || reason,
        stack: reason?.stack,
        pid: process.pid
      };
      
      this.writeErrorLog(errorDetails);
    });
  }

  // Get error statistics (admin endpoint)
  getErrorStats() {
    return async (req, res) => {
      try {
        const { date } = req.query;
        const logFile = path.join(this.errorLogDir, `errors-${date || new Date().toISOString().split('T')[0]}.log`);
        
        if (!fs.existsSync(logFile)) {
          return res.json({
            success: true,
            data: {
              totalErrors: 0,
              errorsByType: {},
              errorsByEndpoint: {},
              errorPatterns: Object.fromEntries(this.errorPatterns),
              recentErrors: []
            }
          });
        }

        const logs = fs.readFileSync(logFile, 'utf8')
          .split('\n')
          .filter(line => line.trim())
          .map(line => {
            try {
              return JSON.parse(line);
            } catch (e) {
              return null;
            }
          })
          .filter(log => log !== null);

        // Analyze errors
        const errorsByType = {};
        const errorsByEndpoint = {};
        
        logs.forEach(log => {
          // Group by error type
          const errorType = log.name || 'Unknown';
          errorsByType[errorType] = (errorsByType[errorType] || 0) + 1;
          
          // Group by endpoint
          const endpoint = `${log.method} ${log.url}`;
          errorsByEndpoint[endpoint] = (errorsByEndpoint[endpoint] || 0) + 1;
        });

        res.json({
          success: true,
          data: {
            totalErrors: logs.length,
            errorsByType,
            errorsByEndpoint,
            errorPatterns: Object.fromEntries(this.errorPatterns),
            recentErrors: logs.slice(-10).reverse() // Last 10 errors
          }
        });
      } catch (error) {
        console.error('Error retrieving error stats:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to retrieve error statistics'
        });
      }
    };
  }
}

module.exports = new ErrorHandler();
