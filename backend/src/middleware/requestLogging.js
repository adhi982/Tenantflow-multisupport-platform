/**
 * Advanced Request Logging Middleware - Step 4.2
 * Provides detailed request/response logging with performance metrics
 */

const fs = require('fs');
const path = require('path');

class RequestLogger {
  constructor() {
    this.logDir = path.join(__dirname, '../../logs');
    this.ensureLogDirectory();
  }

  ensureLogDirectory() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  // Sanitize sensitive data from logs
  sanitizeData(data) {
    if (!data || typeof data !== 'object') return data;
    
    const sensitive = ['password', 'token', 'authorization', 'cookie', 'x-api-key'];
    const sanitized = { ...data };
    
    Object.keys(sanitized).forEach(key => {
      if (sensitive.some(field => key.toLowerCase().includes(field))) {
        sanitized[key] = '[REDACTED]';
      }
    });
    
    return sanitized;
  }

  // Main logging middleware
  middleware() {
    return (req, res, next) => {
      const startTime = Date.now();
      const requestId = req.id || 'unknown';
      
      // Log request details
      const requestLog = {
        requestId,
        timestamp: new Date().toISOString(),
        method: req.method,
        url: req.originalUrl,
        path: req.path,
        query: this.sanitizeData(req.query),
        headers: this.sanitizeData(req.headers),
        userAgent: req.get('User-Agent'),
        ip: req.ip || req.connection.remoteAddress,
        tenantId: req.tenantId,
        userId: req.user?.id,
        bodySize: req.get('Content-Length') || 0
      };

      // Only log request body for non-GET requests and if not too large
      if (req.method !== 'GET' && req.body) {
        const bodyString = JSON.stringify(req.body);
        if (bodyString.length < 1000) { // Only log small bodies
          requestLog.body = this.sanitizeData(req.body);
        } else {
          requestLog.bodyTruncated = `[BODY TOO LARGE: ${bodyString.length} chars]`;
        }
      }

      console.log(`🔍 ${req.method} ${req.originalUrl} [${requestId}] - Started`);
      
      // Store original res.json to capture response
      const originalJson = res.json;
      let responseData = null;
      
      res.json = function(data) {
        responseData = data;
        return originalJson.call(this, data);
      };

      // Override res.end to capture final response
      const originalEnd = res.end;
      res.end = function(chunk, encoding) {
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        // Log response details
        const responseLog = {
          requestId,
          timestamp: new Date().toISOString(),
          statusCode: res.statusCode,
          statusMessage: res.statusMessage,
          duration: `${duration}ms`,
          responseSize: res.get('Content-Length') || (chunk ? chunk.length : 0),
          headers: res.getHeaders()
        };

        // Include response data if available and not too large
        if (responseData) {
          const responseString = JSON.stringify(responseData);
          if (responseString.length < 500) {
            responseLog.response = responseData;
          } else {
            responseLog.responseTruncated = `[RESPONSE TOO LARGE: ${responseString.length} chars]`;
          }
        }

        // Determine log level based on status code and duration
        let logLevel = 'INFO';
        let emoji = '✅';
        
        if (res.statusCode >= 500) {
          logLevel = 'ERROR';
          emoji = '❌';
        } else if (res.statusCode >= 400) {
          logLevel = 'WARN';
          emoji = '⚠️';
        } else if (duration > 5000) {
          logLevel = 'WARN';
          emoji = '🐌';
        } else if (duration > 1000) {
          emoji = '⏱️';
        }

        console.log(`${emoji} ${req.method} ${req.originalUrl} [${requestId}] - ${res.statusCode} ${duration}ms`);
        
        // Write detailed logs to file in production
        if (process.env.NODE_ENV === 'production') {
          this.writeLogToFile({
            request: requestLog,
            response: responseLog,
            level: logLevel
          });
        }

        // Performance warning for slow requests
        if (duration > 3000) {
          console.warn(`⚠️ Slow request detected: ${req.method} ${req.originalUrl} took ${duration}ms`);
        }

        // Call performance tracking if available
        if (req.trackPerformanceCompletion) {
          req.trackPerformanceCompletion();
        }

        return originalEnd.call(this, chunk, encoding);
      }.bind(this);

      next();
    };
  }

  writeLogToFile(logData) {
    try {
      const logFile = path.join(this.logDir, `requests-${new Date().toISOString().split('T')[0]}.log`);
      const logEntry = JSON.stringify(logData) + '\n';
      
      fs.appendFileSync(logFile, logEntry);
    } catch (error) {
      console.error('Failed to write log to file:', error.message);
    }
  }

  // API endpoint for retrieving logs (admin only)
  getLogsEndpoint() {
    return async (req, res) => {
      try {
        const { date, level, requestId } = req.query;
        const logFile = path.join(this.logDir, `requests-${date || new Date().toISOString().split('T')[0]}.log`);
        
        if (!fs.existsSync(logFile)) {
          return res.status(404).json({
            success: false,
            error: 'Log file not found for specified date'
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

        // Filter logs based on query parameters
        let filteredLogs = logs;
        
        if (level) {
          filteredLogs = filteredLogs.filter(log => log.level === level.toUpperCase());
        }
        
        if (requestId) {
          filteredLogs = filteredLogs.filter(log => log.request.requestId === requestId);
        }

        res.json({
          success: true,
          data: {
            logs: filteredLogs,
            total: filteredLogs.length,
            date: date || new Date().toISOString().split('T')[0]
          }
        });
      } catch (error) {
        console.error('Error retrieving logs:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to retrieve logs'
        });
      }
    };
  }
}

module.exports = new RequestLogger();
