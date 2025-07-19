const authService = require('../services/authService');
const jwtService = require('../services/jwtService');

class AuthController {
  /**
   * User login endpoint
   * POST /auth/login
   */
  async login(req, res) {
    try {
      const { email, password, customerId } = req.body;

      // Input validation
      if (!email || !password || !customerId) {
        return res.status(400).json({
          success: false,
          error: 'Email, password, and customer ID are required',
          code: 'MISSING_FIELDS'
        });
      }

      // Authenticate user
      const result = await authService.login(email, password, customerId);

      if (!result.success) {
        return res.status(401).json({
          success: false,
          error: result.error,
          code: 'LOGIN_FAILED'
        });
      }

      // Set secure HTTP-only cookie for refresh token
      res.cookie('refreshToken', result.tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      // Return user info and access token
      res.status(200).json({
        success: true,
        message: 'Login successful',
        user: result.user,
        accessToken: result.tokens.accessToken,
        expiresIn: result.tokens.expiresIn,
        tokenType: result.tokens.tokenType
      });

    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        code: 'SERVER_ERROR'
      });
    }
  }

  /**
   * User logout endpoint
   * POST /auth/logout
   */
  async logout(req, res) {
    try {
      // Clear refresh token cookie
      res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      });

      res.status(200).json({
        success: true,
        message: 'Logout successful'
      });

    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        code: 'SERVER_ERROR'
      });
    }
  }

  /**
   * Refresh access token endpoint
   * POST /auth/refresh
   */
  async refresh(req, res) {
    try {
      // Get refresh token from cookie or body
      const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

      if (!refreshToken) {
        return res.status(401).json({
          success: false,
          error: 'Refresh token is required',
          code: 'REFRESH_TOKEN_MISSING'
        });
      }

      // Refresh token
      const result = await authService.refreshToken(refreshToken);

      if (!result.success) {
        // Clear invalid refresh token cookie
        res.clearCookie('refreshToken');
        
        return res.status(401).json({
          success: false,
          error: result.error,
          code: 'REFRESH_FAILED'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Token refreshed successfully',
        accessToken: result.accessToken,
        expiresIn: result.expiresIn,
        tokenType: result.tokenType
      });

    } catch (error) {
      console.error('Refresh token error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        code: 'SERVER_ERROR'
      });
    }
  }

  /**
   * Get current user info endpoint
   * GET /auth/me
   */
  async me(req, res) {
    try {
      // User info is already available from authentication middleware
      const user = req.user;

      res.status(200).json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          customerId: user.customerId,
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName,
          fullName: user.fullName
        }
      });

    } catch (error) {
      console.error('Get user info error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        code: 'SERVER_ERROR'
      });
    }
  }

  /**
   * Get tenant-specific screen configuration endpoint
   * GET /auth/me/screens
   */
  async getScreens(req, res) {
    try {
      const { customerId, role } = req.user;

      // Load tenant configuration from registry
      const fs = require('fs');
      const path = require('path');
      const registryPath = path.join(__dirname, '../../../registry.json');
      
      let registry = {};
      try {
        const registryData = fs.readFileSync(registryPath, 'utf8');
        registry = JSON.parse(registryData);
      } catch (error) {
        console.warn('Could not load registry.json, using default config');
      }

      // Get tenant-specific configuration
      const tenantConfig = registry[customerId] || {
        name: customerId,
        screens: [
          {
            id: 'dashboard',
            name: 'Dashboard',
            path: '/dashboard',
            icon: 'dashboard',
            roles: ['Admin', 'User']
          },
          {
            id: 'tickets',
            name: 'Support Tickets',
            path: '/tickets',
            icon: 'ticket',
            roles: ['Admin', 'User']
          }
        ]
      };

      // Filter screens based on user role
      const availableScreens = tenantConfig.screens.filter(screen => 
        !screen.roles || screen.roles.includes(role)
      );

      // Add admin screens for admin users
      if (role === 'Admin') {
        availableScreens.push({
          id: 'admin-users',
          name: 'User Management',
          path: '/admin/users',
          icon: 'users',
          roles: ['Admin']
        });
      }

      res.status(200).json({
        success: true,
        tenant: {
          customerId,
          name: tenantConfig.name || customerId,
          logo: tenantConfig.logo || null
        },
        screens: availableScreens,
        userRole: role
      });

    } catch (error) {
      console.error('Get screens error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        code: 'SERVER_ERROR'
      });
    }
  }

  /**
   * Register new user endpoint (Admin only)
   * POST /auth/register
   */
  async register(req, res) {
    try {
      const { email, password, role, firstName, lastName, customerId } = req.body;
      const adminCustomerId = req.user.customerId;

      // Validate input
      if (!email || !password || !firstName || !lastName) {
        return res.status(400).json({
          success: false,
          error: 'Email, password, first name, and last name are required',
          code: 'MISSING_FIELDS'
        });
      }

      // Use admin's customer ID if not specified
      const targetCustomerId = customerId || adminCustomerId;

      // Admin can only create users in their own tenant
      if (targetCustomerId !== adminCustomerId) {
        return res.status(403).json({
          success: false,
          error: 'Cannot create users for other tenants',
          code: 'TENANT_MISMATCH'
        });
      }

      // Register user
      const result = await authService.register({
        email,
        password,
        customerId: targetCustomerId,
        role: role || 'User',
        firstName,
        lastName
      }, adminCustomerId);

      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: result.error,
          code: 'REGISTRATION_FAILED'
        });
      }

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        user: result.user
      });

    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        code: 'SERVER_ERROR'
      });
    }
  }

  /**
   * Change password endpoint
   * POST /auth/change-password
   */
  async changePassword(req, res) {
    try {
      const { currentPassword, newPassword } = req.body;
      const { id: userId, customerId } = req.user;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          success: false,
          error: 'Current password and new password are required',
          code: 'MISSING_FIELDS'
        });
      }

      // Change password
      const result = await authService.changePassword(
        userId,
        customerId,
        currentPassword,
        newPassword
      );

      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: result.error,
          code: 'PASSWORD_CHANGE_FAILED'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Password changed successfully'
      });

    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        code: 'SERVER_ERROR'
      });
    }
  }

  /**
   * Verify token endpoint
   * POST /auth/verify
   */
  async verify(req, res) {
    try {
      const { token } = req.body;

      if (!token) {
        return res.status(400).json({
          success: false,
          error: 'Token is required',
          code: 'TOKEN_MISSING'
        });
      }

      // Verify session
      const result = await authService.verifySession(token);

      if (!result.success) {
        return res.status(401).json({
          success: false,
          error: result.error,
          code: 'TOKEN_INVALID'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Token is valid',
        user: result.user
      });

    } catch (error) {
      console.error('Token verification error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        code: 'SERVER_ERROR'
      });
    }
  }
}

module.exports = new AuthController();
