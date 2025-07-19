const User = require('../models/User');
const jwtService = require('./jwtService');
const bcrypt = require('bcrypt');

class AuthService {
  /**
   * Authenticate user with email and password
   * @param {string} email - User email
   * @param {string} password - User password
   * @param {string} customerId - Tenant ID for isolation
   * @returns {Object} Authentication result
   */
  async login(email, password, customerId) {
    try {
      // Input validation
      if (!email || !password || !customerId) {
        throw new Error('Email, password, and customer ID are required');
      }

      // Find user by email and tenant (tenant isolation)
      const user = await User.findByEmailAndTenant(email, customerId);
      
      if (!user) {
        throw new Error('Invalid credentials');
      }

      // Check if user is active
      if (!user.isActive) {
        throw new Error('Account is deactivated');
      }

      // Verify password
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        throw new Error('Invalid credentials');
      }

      // Update last login
      await user.updateLastLogin();

      // Generate JWT tokens
      const tokens = jwtService.generateTokenPair(user);

      return {
        success: true,
        user: user.toJSON(),
        tokens,
        message: 'Login successful'
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
        user: null,
        tokens: null
      };
    }
  }

  /**
   * Refresh access token using refresh token
   * @param {string} refreshToken - JWT refresh token
   * @returns {Object} New access token or error
   */
  async refreshToken(refreshToken) {
    try {
      if (!refreshToken) {
        throw new Error('Refresh token is required');
      }

      // Verify refresh token
      const decoded = jwtService.verifyRefreshToken(refreshToken);

      // Find user by ID and tenant
      const user = await User.findOne({
        _id: decoded.userId,
        customerId: decoded.customerId
      });

      if (!user) {
        throw new Error('User not found');
      }

      if (!user.isActive) {
        throw new Error('Account is deactivated');
      }

      // Generate new access token
      const accessToken = jwtService.generateAccessToken(user);

      return {
        success: true,
        accessToken,
        expiresIn: jwtService.accessTokenExpiry,
        tokenType: 'Bearer'
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Register a new user (Admin only operation)
   * @param {Object} userData - User data
   * @param {string} adminCustomerId - Admin's customer ID for validation
   * @returns {Object} Registration result
   */
  async register(userData, adminCustomerId) {
    try {
      const { email, password, customerId, role, firstName, lastName } = userData;

      // Input validation
      if (!email || !password || !customerId || !firstName || !lastName) {
        throw new Error('All required fields must be provided');
      }

      // Validate password strength
      if (password.length < 8) {
        throw new Error('Password must be at least 8 characters long');
      }

      // Check if user already exists in this tenant
      const existingUser = await User.findByEmailAndTenant(email, customerId);
      if (existingUser) {
        throw new Error('User already exists with this email in the specified tenant');
      }

      // Create new user
      const user = new User({
        email: email.toLowerCase(),
        passwordHash: password, // Will be hashed by pre-save hook
        customerId,
        role: role || 'User',
        firstName,
        lastName
      });

      await user.save();

      return {
        success: true,
        user: user.toJSON(),
        message: 'User registered successfully'
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
        user: null
      };
    }
  }

  /**
   * Verify user's current session
   * @param {string} accessToken - JWT access token
   * @returns {Object} User info or error
   */
  async verifySession(accessToken) {
    try {
      if (!accessToken) {
        throw new Error('Access token is required');
      }

      // Verify token
      const decoded = jwtService.verifyAccessToken(accessToken);

      // Find user by ID and tenant
      const user = await User.findOne({
        _id: decoded.userId,
        customerId: decoded.customerId
      });

      if (!user) {
        throw new Error('User not found');
      }

      if (!user.isActive) {
        throw new Error('Account is deactivated');
      }

      return {
        success: true,
        user: user.toJSON()
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Change user password
   * @param {string} userId - User ID
   * @param {string} customerId - Customer ID for tenant isolation
   * @param {string} currentPassword - Current password
   * @param {string} newPassword - New password
   * @returns {Object} Result
   */
  async changePassword(userId, customerId, currentPassword, newPassword) {
    try {
      if (!currentPassword || !newPassword) {
        throw new Error('Current password and new password are required');
      }

      if (newPassword.length < 8) {
        throw new Error('New password must be at least 8 characters long');
      }

      // Find user
      const user = await User.findOne({ _id: userId, customerId });
      if (!user) {
        throw new Error('User not found');
      }

      // Verify current password
      const isCurrentPasswordValid = await user.comparePassword(currentPassword);
      if (!isCurrentPasswordValid) {
        throw new Error('Current password is incorrect');
      }

      // Update password
      user.passwordHash = newPassword; // Will be hashed by pre-save hook
      await user.save();

      return {
        success: true,
        message: 'Password changed successfully'
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get user by ID with tenant isolation
   * @param {string} userId - User ID
   * @param {string} customerId - Customer ID for tenant isolation
   * @returns {Object} User or null
   */
  async getUserById(userId, customerId) {
    try {
      const user = await User.findOne({ _id: userId, customerId });
      return user ? user.toJSON() : null;
    } catch (error) {
      throw new Error('Failed to retrieve user');
    }
  }

  /**
   * List users for a tenant (Admin only)
   * @param {string} customerId - Customer ID
   * @param {Object} options - Query options
   * @returns {Array} List of users
   */
  async listUsers(customerId, options = {}) {
    try {
      const { page = 1, limit = 10, role } = options;
      const skip = (page - 1) * limit;

      let query = { customerId };
      if (role) {
        query.role = role;
      }

      const users = await User.find(query)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 });

      const total = await User.countDocuments(query);

      return {
        users: users.map(user => user.toJSON()),
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };

    } catch (error) {
      throw new Error('Failed to retrieve users');
    }
  }
}

module.exports = new AuthService();
