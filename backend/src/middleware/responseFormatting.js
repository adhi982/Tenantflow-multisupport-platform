/**
 * API Response Formatting Middleware - Step 4.2
 * Provides consistent response formatting and API versioning
 */

class ResponseFormatter {
  constructor() {
    this.defaultApiVersion = 'v1';
  }

  // Main response formatting middleware
  formatResponses() {
    return (req, res, next) => {
      // Store original methods
      const originalJson = res.json;
      const originalSend = res.send;
      const originalStatus = res.status;

      // Enhanced json method
      res.json = function(data) {
        const formattedResponse = this.formatResponse(data, req, res);
        return originalJson.call(this, formattedResponse);
      }.bind(this);

      // Enhanced send method
      res.send = function(data) {
        if (typeof data === 'object') {
          return res.json(data);
        }
        return originalSend.call(this, data);
      };

      // Enhanced status method to support chaining
      res.status = function(code) {
        originalStatus.call(this, code);
        return this;
      };

      // Add helper methods
      res.success = (data = {}, message = 'Success', statusCode = 200) => {
        return res.status(statusCode).json({
          success: true,
          message,
          data
        });
      };

      res.error = (message = 'Error', code = 'ERROR', statusCode = 400, details = null) => {
        const errorResponse = {
          success: false,
          error: message,
          code
        };
        
        if (details) {
          errorResponse.details = details;
        }
        
        return res.status(statusCode).json(errorResponse);
      };

      res.paginated = (items, pagination, metadata = {}) => {
        return res.json({
          success: true,
          data: {
            items,
            pagination,
            ...metadata
          }
        });
      };

      next();
    };
  }

  formatResponse(data, req, res) {
    // Skip formatting if data is already a formatted response
    if (data && typeof data === 'object' && 
        (data.hasOwnProperty('success') || data.hasOwnProperty('error'))) {
      return this.addMetadata(data, req, res);
    }

    // Handle different response types
    let formattedResponse;

    if (res.statusCode >= 400) {
      // Error response
      formattedResponse = {
        success: false,
        error: data?.message || data || 'An error occurred',
        code: data?.code || 'ERROR'
      };
    } else {
      // Success response
      formattedResponse = {
        success: true,
        data: data || {}
      };
    }

    return this.addMetadata(formattedResponse, req, res);
  }

  addMetadata(response, req, res) {
    // Add API metadata
    const metadata = {
      timestamp: new Date().toISOString(),
      apiVersion: req.headers['api-version'] || this.defaultApiVersion,
      requestId: req.id
    };

    // Add execution time if available
    if (req.startTime) {
      metadata.executionTime = `${Date.now() - req.startTime}ms`;
    }

    // Add pagination info for collection responses
    if (response.data && response.data.pagination) {
      metadata.pagination = response.data.pagination;
    }

    // Add tenant context if available
    if (req.tenantId) {
      metadata.tenantId = req.tenantId;
    }

    // Add rate limit info if available
    if (res.getHeader('X-RateLimit-Limit')) {
      metadata.rateLimit = {
        limit: res.getHeader('X-RateLimit-Limit'),
        remaining: res.getHeader('X-RateLimit-Remaining'),
        reset: res.getHeader('X-RateLimit-Reset')
      };
    }

    return {
      ...response,
      meta: metadata
    };
  }

  // API versioning middleware
  apiVersioning() {
    return (req, res, next) => {
      const apiVersion = req.headers['api-version'] || 
                        req.query.version || 
                        this.defaultApiVersion;

      // Validate API version
      const supportedVersions = ['v1'];
      if (!supportedVersions.includes(apiVersion)) {
        return res.status(400).json({
          success: false,
          error: `Unsupported API version: ${apiVersion}`,
          code: 'UNSUPPORTED_API_VERSION',
          supportedVersions
        });
      }

      req.apiVersion = apiVersion;
      res.setHeader('API-Version', apiVersion);
      
      next();
    };
  }

  // Content negotiation middleware
  contentNegotiation() {
    return (req, res, next) => {
      const acceptHeader = req.headers.accept || 'application/json';
      
      // Check if client accepts JSON
      if (!acceptHeader.includes('application/json') && 
          !acceptHeader.includes('*/*')) {
        return res.status(406).json({
          success: false,
          error: 'Only application/json content type is supported',
          code: 'UNSUPPORTED_CONTENT_TYPE'
        });
      }

      // Set default content type
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      
      next();
    };
  }

  // Request timing middleware
  requestTiming() {
    return (req, res, next) => {
      req.startTime = Date.now();
      next();
    };
  }

  // Cache control middleware
  cacheControl() {
    return (req, res, next) => {
      // Default cache settings based on route type
      if (req.method === 'GET') {
        if (req.path.includes('/health') || req.path.includes('/metrics')) {
          // Short cache for status endpoints
          res.setHeader('Cache-Control', 'public, max-age=30');
        } else if (req.path.includes('/api/tickets')) {
          // No cache for dynamic data
          res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        } else {
          // Default cache for other GET requests
          res.setHeader('Cache-Control', 'public, max-age=300');
        }
      } else {
        // No cache for non-GET requests
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      }

      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      
      next();
    };
  }

  // CORS headers middleware
  corsHeaders() {
    return (req, res, next) => {
      res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Tenant-ID, API-Version');
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Max-Age', '3600');
      
      // Handle preflight requests
      if (req.method === 'OPTIONS') {
        return res.status(204).end();
      }
      
      next();
    };
  }

  // Security headers middleware
  securityHeaders() {
    return (req, res, next) => {
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'DENY');
      res.setHeader('X-XSS-Protection', '1; mode=block');
      res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
      res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
      
      // Add request ID to response
      if (req.id) {
        res.setHeader('X-Request-ID', req.id);
      }
      
      next();
    };
  }

  // Compression hints
  compressionHints() {
    return (req, res, next) => {
      // Add vary header for compression
      res.setHeader('Vary', 'Accept-Encoding, Accept, Authorization');
      
      next();
    };
  }

  // Response validation middleware (development only)
  validateResponses() {
    return (req, res, next) => {
      if (process.env.NODE_ENV !== 'development') {
        return next();
      }

      const originalJson = res.json;
      
      res.json = function(data) {
        // Validate response structure
        if (data && typeof data === 'object') {
          if (!data.hasOwnProperty('success')) {
            console.warn(`⚠️ Response missing 'success' field: ${req.method} ${req.path}`);
          }
          
          if (data.success === false && !data.error) {
            console.warn(`⚠️ Error response missing 'error' field: ${req.method} ${req.path}`);
          }
          
          if (data.success === true && !data.data && res.statusCode < 300) {
            console.warn(`⚠️ Success response missing 'data' field: ${req.method} ${req.path}`);
          }
        }
        
        return originalJson.call(this, data);
      };
      
      next();
    };
  }

  // Create a complete middleware stack
  createStack() {
    return [
      this.requestTiming(),
      this.apiVersioning(),
      this.contentNegotiation(),
      this.securityHeaders(),
      this.cacheControl(),
      this.compressionHints(),
      this.formatResponses(),
      this.validateResponses()
    ];
  }
}

module.exports = new ResponseFormatter();
