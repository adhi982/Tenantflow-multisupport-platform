const jwtService = require('../services/jwtService');
const User = require('../models/User');

/**
 * Authentication middleware to verify JWT tokens
 * Adds user information to req.user for authenticated requests
 */
const authenticate = async (req, res, next) => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    const token = jwtService.extractTokenFromHeader(authHeader);

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Access token is required',
        code: 'TOKEN_MISSING'
      });
    }

    // Verify token
    const decoded = jwtService.verifyAccessToken(token);

    // Find user in database (with tenant isolation)
    const user = await User.findOne({
      _id: decoded.userId,
      customerId: decoded.customerId
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        error: 'Account is deactivated',
        code: 'ACCOUNT_DEACTIVATED'
      });
    }

    // Add user info to request object
    req.user = {
      id: user._id.toString(),
      email: user.email,
      customerId: user.customerId,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: user.fullName
    };

    // Add decoded token info
    req.token = {
      userId: decoded.userId,
      customerId: decoded.customerId,
      role: decoded.role,
      iat: decoded.iat,
      exp: decoded.exp
    };

    next();

  } catch (error) {
    let errorCode = 'TOKEN_INVALID';
    let statusCode = 401;

    if (error.message === 'Access token expired') {
      errorCode = 'TOKEN_EXPIRED';
    } else if (error.message === 'Invalid access token') {
      errorCode = 'TOKEN_INVALID';
    }

    return res.status(statusCode).json({
      success: false,
      error: error.message,
      code: errorCode
    });
  }
};

/**
 * Optional authentication middleware
 * Adds user info if token is present, but doesn't fail if missing
 */
const optionalAuthenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = jwtService.extractTokenFromHeader(authHeader);

    if (!token) {
      // No token provided, continue without authentication
      req.user = null;
      req.token = null;
      return next();
    }

    // Try to verify token
    const decoded = jwtService.verifyAccessToken(token);
    const user = await User.findOne({
      _id: decoded.userId,
      customerId: decoded.customerId
    });

    if (user && user.isActive) {
      req.user = {
        id: user._id.toString(),
        email: user.email,
        customerId: user.customerId,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: user.fullName
      };

      req.token = {
        userId: decoded.userId,
        customerId: decoded.customerId,
        role: decoded.role,
        iat: decoded.iat,
        exp: decoded.exp
      };
    } else {
      req.user = null;
      req.token = null;
    }

    next();

  } catch (error) {
    // If token verification fails, continue without authentication
    req.user = null;
    req.token = null;
    next();
  }
};

/**
 * Role-based authorization middleware
 * @param {string|Array} allowedRoles - Single role or array of allowed roles
 * @returns {Function} Express middleware function
 */
const authorize = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    // Normalize to array
    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS',
        required: roles,
        current: req.user.role
      });
    }

    next();
  };
};

/**
 * Admin-only authorization middleware
 * Shorthand for authorize('Admin')
 */
const requireAdmin = authorize('Admin');

/**
 * Tenant isolation middleware
 * Ensures requests can only access data from the authenticated user's tenant
 */
const tenantIsolation = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required for tenant isolation',
      code: 'AUTH_REQUIRED'
    });
  }

  // Add tenant filter helper to request
  req.getTenantFilter = (additionalFilter = {}) => {
    return {
      customerId: req.user.customerId,
      ...additionalFilter
    };
  };

  // Add method to validate tenant ownership of a resource
  req.validateTenantOwnership = (resource) => {
    if (!resource) {
      throw new Error('Resource not found');
    }

    if (resource.customerId !== req.user.customerId) {
      throw new Error('Access denied: Resource belongs to different tenant');
    }

    return true;
  };

  next();
};

/**
 * Admin route protection middleware
 * Blocks access to /admin/* routes for non-admin users
 */
const protectAdminRoutes = (req, res, next) => {
  const isAdminRoute = req.path.startsWith('/admin');
  
  if (isAdminRoute) {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required for admin routes',
        code: 'AUTH_REQUIRED'
      });
    }

    if (req.user.role !== 'Admin') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required',
        code: 'ADMIN_REQUIRED'
      });
    }
  }

  next();
};

/**
 * Rate limiting helper for authentication endpoints
 * Returns different limits based on endpoint
 */
const getAuthRateLimit = (endpoint) => {
  const limits = {
    login: { windowMs: 15 * 60 * 1000, max: 5 }, // 5 attempts per 15 minutes
    register: { windowMs: 60 * 60 * 1000, max: 3 }, // 3 attempts per hour
    refresh: { windowMs: 15 * 60 * 1000, max: 10 }, // 10 attempts per 15 minutes
    default: { windowMs: 15 * 60 * 1000, max: 20 } // 20 attempts per 15 minutes
  };

  return limits[endpoint] || limits.default;
};

module.exports = {
  authenticate,
  optionalAuthenticate,
  authorize,
  requireAdmin,
  tenantIsolation,
  protectAdminRoutes,
  getAuthRateLimit
};
