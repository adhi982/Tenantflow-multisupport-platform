const express = require('express');
const rateLimit = require('express-rate-limit');
const authController = require('../controllers/authController');
const { authenticate, requireAdmin, getAuthRateLimit } = require('../middleware/auth');

const router = express.Router();

// Rate limiting configuration for auth endpoints
const createRateLimit = (endpoint) => {
  // Skip rate limiting in test environment
  if (process.env.NODE_ENV === 'test') {
    return (req, res, next) => next();
  }

  const config = getAuthRateLimit(endpoint);
  return rateLimit({
    windowMs: config.windowMs,
    max: config.max,
    message: {
      success: false,
      error: 'Too many attempts, please try again later',
      code: 'RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false,
    // Use IP + customerId for rate limiting key (when available)
    keyGenerator: (req) => {
      const customerId = req.body.customerId || req.user?.customerId || '';
      return `${req.ip}-${customerId}`;
    }
  });
};

// Public routes (no authentication required)

/**
 * @route   POST /auth/login
 * @desc    Authenticate user and return JWT tokens
 * @access  Public
 * @body    { email, password, customerId }
 */
router.post('/login', 
  createRateLimit('login'),
  authController.login
);

/**
 * @route   POST /auth/refresh
 * @desc    Refresh access token using refresh token
 * @access  Public
 * @body    { refreshToken } (optional, can use cookie)
 */
router.post('/refresh',
  createRateLimit('refresh'),
  authController.refresh
);

/**
 * @route   POST /auth/verify
 * @desc    Verify if a token is valid
 * @access  Public
 * @body    { token }
 */
router.post('/verify',
  createRateLimit('default'),
  authController.verify
);

// Protected routes (authentication required)

/**
 * @route   POST /auth/logout
 * @desc    Logout user and clear refresh token
 * @access  Private
 */
router.post('/logout',
  authenticate,
  authController.logout
);

/**
 * @route   GET /auth/me
 * @desc    Get current user information
 * @access  Private
 */
router.get('/me',
  authenticate,
  authController.me
);

/**
 * @route   GET /auth/me/screens
 * @desc    Get tenant-specific screen configuration for current user
 * @access  Private
 */
router.get('/me/screens',
  authenticate,
  authController.getScreens
);

/**
 * @route   POST /auth/change-password
 * @desc    Change user password
 * @access  Private
 * @body    { currentPassword, newPassword }
 */
router.post('/change-password',
  authenticate,
  createRateLimit('default'),
  authController.changePassword
);

// Admin-only routes

/**
 * @route   POST /auth/register
 * @desc    Register new user (Admin only)
 * @access  Private (Admin)
 * @body    { email, password, firstName, lastName, role?, customerId? }
 */
router.post('/register',
  authenticate,
  requireAdmin,
  createRateLimit('register'),
  authController.register
);

// Health check endpoint for auth service
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    service: 'Authentication Service',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

// Route documentation endpoint
router.get('/routes', (req, res) => {
  const routes = [
    {
      method: 'POST',
      path: '/auth/login',
      description: 'Authenticate user and return JWT tokens',
      access: 'Public',
      body: ['email', 'password', 'customerId']
    },
    {
      method: 'POST',
      path: '/auth/logout',
      description: 'Logout user and clear refresh token',
      access: 'Private'
    },
    {
      method: 'POST',
      path: '/auth/refresh',
      description: 'Refresh access token using refresh token',
      access: 'Public',
      body: ['refreshToken (optional)']
    },
    {
      method: 'GET',
      path: '/auth/me',
      description: 'Get current user information',
      access: 'Private'
    },
    {
      method: 'GET',
      path: '/auth/me/screens',
      description: 'Get tenant-specific screen configuration',
      access: 'Private'
    },
    {
      method: 'POST',
      path: '/auth/register',
      description: 'Register new user',
      access: 'Private (Admin)',
      body: ['email', 'password', 'firstName', 'lastName', 'role?', 'customerId?']
    },
    {
      method: 'POST',
      path: '/auth/change-password',
      description: 'Change user password',
      access: 'Private',
      body: ['currentPassword', 'newPassword']
    },
    {
      method: 'POST',
      path: '/auth/verify',
      description: 'Verify if a token is valid',
      access: 'Public',
      body: ['token']
    }
  ];

  res.status(200).json({
    success: true,
    service: 'Authentication Service',
    routes
  });
});

module.exports = router;
