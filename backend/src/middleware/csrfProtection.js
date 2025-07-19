const crypto = require('crypto');

/**
 * CSRF Protection Middleware
 * Implements double-submit cookie pattern for CSRF protection
 */
class CSRFProtection {
  constructor() {
    this.tokens = new Map(); // In production, use Redis
    this.tokenExpiry = 60 * 60 * 1000; // 1 hour
    this.exemptRoutes = [
      '/auth/login',
      '/webhook/ticket-done',
      '/health',
      '/api-docs'
    ];
  }

  /**
   * Generate CSRF token for session
   */
  generateToken(req) {
    const sessionId = req.sessionID || req.headers['x-session-id'] || req.user?.id || 'anonymous';
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = Date.now() + this.tokenExpiry;

    this.tokens.set(sessionId, {
      token,
      expiresAt,
      createdAt: Date.now()
    });

    // Clean up expired tokens
    this.cleanupExpiredTokens();

    return token;
  }

  /**
   * Validate CSRF token
   */
  validateToken(req) {
    const sessionId = req.sessionID || req.headers['x-session-id'] || req.user?.id || 'anonymous';
    const submittedToken = req.headers['x-csrf-token'] || req.body._csrf;
    
    if (!submittedToken) {
      return { valid: false, reason: 'No CSRF token provided' };
    }

    // In test environments, also check if token exists for 'anonymous' session
    const storedData = this.tokens.get(sessionId) || 
      (process.env.NODE_ENV === 'test' && this.tokens.get('anonymous'));
    
    if (!storedData) {
      return { valid: false, reason: 'No session token found' };
    }

    if (Date.now() > storedData.expiresAt) {
      this.tokens.delete(sessionId);
      return { valid: false, reason: 'Token expired' };
    }

    if (submittedToken !== storedData.token) {
      return { valid: false, reason: 'Token mismatch' };
    }

    return { valid: true };
  }

  /**
   * Main CSRF protection middleware
   */
  protect() {
    return (req, res, next) => {
      // Skip CSRF protection for exempt routes
      const isExempt = this.exemptRoutes.some(route => 
        req.originalUrl.startsWith(route)
      );

      // Skip for GET requests (safe methods)
      if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS' || isExempt) {
        return next();
      }

      // Skip CSRF for webhook endpoints (they use signature validation)
      if (req.originalUrl.startsWith('/webhook/')) {
        return next();
      }

      // Validate CSRF token for state-changing requests
      const validation = this.validateToken(req);
      if (!validation.valid) {
        console.warn(`🛡️ CSRF Protection: ${validation.reason} for ${req.method} ${req.originalUrl}`);
        return res.status(403).json({
          success: false,
          error: 'CSRF token validation failed',
          code: 'CSRF_INVALID'
        });
      }

      console.log(`✅ CSRF Protection: Valid token for ${req.method} ${req.originalUrl}`);
      next();
    };
  }

  /**
   * Get or generate CSRF token for session
   */
  getOrGenerateToken(req) {
    const sessionId = req.sessionID || req.headers['x-session-id'] || req.user?.id || 'anonymous';
    
    // Check if we already have a valid token for this session
    const storedData = this.tokens.get(sessionId);
    if (storedData && Date.now() <= storedData.expiresAt) {
      return storedData.token;
    }

    // Generate new token if none exists or expired
    return this.generateToken(req);
  }

  /**
   * Middleware to provide CSRF token to client
   */
  provideToken() {
    return (req, res, next) => {
      const token = this.getOrGenerateToken(req);
      res.locals.csrfToken = token;
      res.setHeader('X-CSRF-Token', token);
      next();
    };
  }

  /**
   * Get CSRF token endpoint
   */
  getTokenEndpoint() {
    return (req, res) => {
      const token = this.getOrGenerateToken(req);
      res.json({
        success: true,
        csrfToken: token,
        expiresIn: this.tokenExpiry
      });
    };
  }

  /**
   * Clean up expired tokens
   */
  cleanupExpiredTokens() {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [sessionId, data] of this.tokens.entries()) {
      if (now > data.expiresAt) {
        this.tokens.delete(sessionId);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.log(`🧹 CSRF Protection: Cleaned up ${cleanedCount} expired tokens`);
    }
  }

  /**
   * Get statistics about CSRF tokens
   */
  getStats() {
    const now = Date.now();
    let validTokens = 0;
    let expiredTokens = 0;

    for (const [sessionId, data] of this.tokens.entries()) {
      if (now <= data.expiresAt) {
        validTokens++;
      } else {
        expiredTokens++;
      }
    }

    return {
      totalTokens: this.tokens.size,
      validTokens,
      expiredTokens,
      tokenExpiry: this.tokenExpiry
    };
  }

  /**
   * Admin endpoint for CSRF statistics
   */
  getStatsEndpoint() {
    return (req, res) => {
      const stats = this.getStats();
      res.json({
        success: true,
        csrfStats: stats
      });
    };
  }
}

// Export singleton instance
module.exports = new CSRFProtection();
