const crypto = require('crypto');

/**
 * API Security Enhancement Middleware
 * Provides additional security measures beyond basic input sanitization
 */
class APISecurityEnhancement {
  constructor() {
    this.requestSignatures = new Map();
    this.suspiciousPatterns = [
      // Advanced injection patterns
      /(\bUNION\b.*\bSELECT\b)|(\bINSERT\b.*\bINTO\b)|(\bDROP\b.*\bTABLE\b)/i,
      /(\bdocument\s*\.\s*cookie)|(\bwindow\s*\.\s*location)|(\beval\s*\()/i,
      /(\bjavascript\s*:)|(\bon\w+\s*=)|(\b<\s*script\b)/i,
      // Path traversal
      /(\.\.[\/\\])|(\%2e\%2e[\/\\])|(\.\%2f)|(\%2e\/)/i,
      // Command injection
      /(\bwget\b)|(\bcurl\b)|(\bping\b)|(\bnslookup\b)/i,
      // File inclusion
      /(\bfile\s*:\/\/)|(\bftp\s*:\/\/)|(\bjar\s*:\/\/)/i
    ];
  }

  /**
   * Content Security Policy headers
   */
  setSecurityHeaders() {
    return (req, res, next) => {
      // Comprehensive CSP header
      res.setHeader('Content-Security-Policy', [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.tailwindcss.com",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.tailwindcss.com",
        "font-src 'self' https://fonts.gstatic.com",
        "img-src 'self' data: https:",
        "connect-src 'self' ws: wss:",
        "frame-ancestors 'none'",
        "form-action 'self'",
        "base-uri 'self'"
      ].join('; '));

      // Additional security headers
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'DENY');
      res.setHeader('X-XSS-Protection', '1; mode=block');
      res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
      res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

      // Remove server information
      res.removeHeader('X-Powered-By');
      res.setHeader('Server', 'FlowBit-API');

      next();
    };
  }

  /**
   * Request signature validation for webhooks
   */
  validateRequestSignature(secret) {
    return (req, res, next) => {
      // Skip signature validation for non-webhook routes
      if (!req.originalUrl.startsWith('/webhook/')) {
        return next();
      }

      const signature = req.headers['x-hub-signature-256'] || req.headers['x-signature'];
      const payload = JSON.stringify(req.body);

      if (!signature) {
        console.warn(`🔐 Missing signature for webhook: ${req.originalUrl}`);
        return res.status(401).json({
          success: false,
          error: 'Missing request signature',
          code: 'SIGNATURE_MISSING'
        });
      }

      // Compute expected signature
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(payload)
        .digest('hex');

      const expectedSig = `sha256=${expectedSignature}`;

      // Timing-safe comparison
      const signaturesMatch = signature.length === expectedSig.length && 
        crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig));
      
      if (!signaturesMatch) {
        console.warn(`🚨 Invalid signature for webhook: ${req.originalUrl}`);
        return res.status(401).json({
          success: false,
          error: 'Invalid request signature',
          code: 'SIGNATURE_INVALID'
        });
      }

      console.log(`✅ Valid signature for webhook: ${req.originalUrl}`);
      next();
    };
  }

  /**
   * Advanced threat detection
   */
  detectAdvancedThreats() {
    return (req, res, next) => {
      const suspicious = [];
      const userAgent = req.headers['user-agent'] || '';
      const referer = req.headers['referer'] || '';

      // Check for suspicious patterns in request data
      const checkData = (data, source) => {
        if (typeof data === 'string') {
          this.suspiciousPatterns.forEach((pattern, index) => {
            if (pattern.test(data)) {
              suspicious.push({
                pattern: index,
                source,
                matched: data.substring(0, 100)
              });
            }
          });
        } else if (typeof data === 'object' && data !== null) {
          Object.entries(data).forEach(([key, value]) => {
            checkData(value, `${source}.${key}`);
          });
        }
      };

      // Check various request components
      checkData(req.originalUrl, 'url');
      checkData(req.query, 'query');
      checkData(req.body, 'body');
      checkData(userAgent, 'userAgent');
      checkData(referer, 'referer');

      // Check for suspicious user agents
      const suspiciousUserAgents = [
        /sqlmap/i, /nikto/i, /burp/i, /nmap/i, /masscan/i,
        /curl/i, /wget/i, /python-requests/i
      ];

      suspiciousUserAgents.forEach((pattern, index) => {
        if (pattern.test(userAgent)) {
          suspicious.push({
            pattern: `ua_${index}`,
            source: 'userAgent',
            matched: userAgent
          });
        }
      });

      // If threats detected, log and potentially block
      if (suspicious.length > 0) {
        const threatLevel = suspicious.length > 3 ? 'HIGH' : 'MEDIUM';
        
        console.warn(`🚨 Advanced Threats Detected [${threatLevel}]:`, {
          ip: req.ip,
          userAgent,
          url: req.originalUrl,
          threats: suspicious,
          timestamp: new Date().toISOString()
        });

        // Log to threat detection system (in production, send to SIEM)
        req.securityThreats = suspicious;

        // Check if we have only user agent threats (should block)
        const hasUserAgentThreats = suspicious.some(threat => threat.pattern && threat.pattern.toString().startsWith('ua_'));
        const hasDataThreats = suspicious.some(threat => !threat.pattern || !threat.pattern.toString().startsWith('ua_'));

        // Block high-risk requests or suspicious user agents
        if (threatLevel === 'HIGH' || (hasUserAgentThreats && !hasDataThreats)) {
          return res.status(403).json({
            success: false,
            error: 'Request blocked by security policy',
            code: 'SECURITY_THREAT_DETECTED',
            threatId: crypto.randomUUID()
          });
        }
      }

      next();
    };
  }

  /**
   * Tenant-aware rate limiting
   */
  createTenantRateLimit() {
    const tenantLimits = new Map();
    const defaultLimits = {
      maxRequests: 1000,  // requests per hour
      burstLimit: 50,     // burst capacity
      windowMs: 60 * 60 * 1000 // 1 hour
    };

    return (req, res, next) => {
      const tenantId = req.user?.customerId || 'anonymous';
      const now = Date.now();
      
      if (!tenantLimits.has(tenantId)) {
        tenantLimits.set(tenantId, {
          requests: [],
          burst: [],
          ...defaultLimits
        });
      }

      const tenant = tenantLimits.get(tenantId);
      
      // Clean up old requests
      tenant.requests = tenant.requests.filter(time => now - time < tenant.windowMs);
      tenant.burst = tenant.burst.filter(time => now - time < 60 * 1000); // 1 minute burst window

      // Check burst limit (per minute)
      if (tenant.burst.length >= tenant.burstLimit) {
        console.warn(`🚨 Burst rate limit exceeded for tenant: ${tenantId}`);
        return res.status(429).json({
          success: false,
          error: 'Too many requests - burst limit exceeded',
          code: 'BURST_RATE_LIMIT',
          retryAfter: 60
        });
      }

      // Check hourly limit
      if (tenant.requests.length >= tenant.maxRequests) {
        console.warn(`🚨 Hourly rate limit exceeded for tenant: ${tenantId}`);
        return res.status(429).json({
          success: false,
          error: 'Too many requests - hourly limit exceeded',
          code: 'HOURLY_RATE_LIMIT',
          retryAfter: Math.ceil(tenant.windowMs / 1000)
        });
      }

      // Record this request
      tenant.requests.push(now);
      tenant.burst.push(now);

      // Add rate limit headers
      res.setHeader('X-RateLimit-Limit', tenant.maxRequests);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, tenant.maxRequests - tenant.requests.length));
      res.setHeader('X-RateLimit-Reset', Math.ceil((now + tenant.windowMs) / 1000));

      next();
    };
  }

  /**
   * Security audit logging
   */
  securityAuditLog() {
    return (req, res, next) => {
      const startTime = Date.now();
      
      // Override res.json to capture response
      const originalJson = res.json;
      res.json = function(body) {
        const endTime = Date.now();
        
        // Log security-relevant events
        const securityEvent = {
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] || crypto.randomUUID(),
          method: req.method,
          url: req.originalUrl,
          ip: req.ip,
          userAgent: req.headers['user-agent'],
          user: req.user?.email || 'anonymous',
          tenant: req.user?.customerId || 'unknown',
          statusCode: res.statusCode,
          duration: endTime - startTime,
          threats: req.securityThreats || [],
          headers: {
            authorization: req.headers.authorization ? '[REDACTED]' : 'none',
            'x-csrf-token': req.headers['x-csrf-token'] ? '[PRESENT]' : 'none'
          }
        };

        // Log to security audit trail
        if (res.statusCode >= 400 || req.securityThreats?.length > 0) {
          console.log(`🔒 Security Audit Log:`, JSON.stringify(securityEvent, null, 2));
        }

        return originalJson.call(this, body);
      };

      next();
    };
  }

  /**
   * Get security statistics endpoint
   */
  getSecurityStatsEndpoint() {
    return (req, res) => {
      const stats = {
        timestamp: new Date().toISOString(),
        securityHeaders: {
          csp: 'enabled',
          xssProtection: 'enabled',
          frameOptions: 'DENY',
          contentTypeOptions: 'nosniff'
        },
        threatDetection: {
          patterns: this.suspiciousPatterns.length,
          status: 'active'
        },
        rateLimiting: {
          tenantAware: true,
          burstProtection: true
        },
        auditLogging: {
          enabled: true,
          retentionPeriod: '90 days'
        }
      };

      res.json({
        success: true,
        securityStats: stats
      });
    };
  }
}

// Export singleton instance
module.exports = new APISecurityEnhancement();
