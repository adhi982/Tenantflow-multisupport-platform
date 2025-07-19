const express = require('express');
const User = require('../models/User');
const TenantIsolationMiddleware = require('../middleware/tenantIsolation');

const router = express.Router();

// GET /me - Current user information
router.get('/', async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-passwordHash')
      .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    // Add computed fields
    const userInfo = {
      ...user,
      fullName: `${user.firstName} ${user.lastName}`,
      initials: `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase(),
      isAdmin: user.role === 'Admin',
      loginStatus: user.lastLoginAt ? 'active' : 'never_logged_in',
      accountAge: user.createdAt ? Math.floor((Date.now() - new Date(user.createdAt)) / (1000 * 60 * 60 * 24)) : 0
    };

    res.json({
      success: true,
      data: {
        user: userInfo
      }
    });

  } catch (error) {
    console.error('Error fetching user info:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user information',
      code: 'USER_FETCH_ERROR'
    });
  }
});

// GET /me/screens - Tenant-specific screen configuration
router.get('/screens', async (req, res) => {
  try {
    const user = req.user;
    
    // Define base screens available to all users
    const baseScreens = [
      {
        id: 'dashboard',
        name: 'Dashboard',
        path: '/dashboard',
        icon: 'dashboard',
        order: 1,
        description: 'Overview of your support metrics',
        component: 'Dashboard',
        permissions: ['read']
      },
      {
        id: 'tickets',
        name: 'Support Tickets',
        path: '/tickets',
        icon: 'ticket',
        order: 2,
        description: 'Manage customer support tickets',
        component: 'TicketManagement',
        permissions: ['read', 'create', 'update']
      },
      {
        id: 'profile',
        name: 'Profile',
        path: '/profile',
        icon: 'user',
        order: 99,
        description: 'Manage your account settings',
        component: 'UserProfile',
        permissions: ['read', 'update']
      }
    ];

    // Admin-only screens
    const adminScreens = [
      {
        id: 'users',
        name: 'User Management',
        path: '/admin/users',
        icon: 'users',
        order: 3,
        description: 'Manage tenant users and permissions',
        component: 'UserManagement',
        permissions: ['read', 'create', 'update', 'delete'],
        adminOnly: true
      },
      {
        id: 'analytics',
        name: 'Analytics',
        path: '/admin/analytics',
        icon: 'chart',
        order: 4,
        description: 'Detailed support analytics and reports',
        component: 'Analytics',
        permissions: ['read'],
        adminOnly: true
      },
      {
        id: 'settings',
        name: 'Tenant Settings',
        path: '/admin/settings',
        icon: 'settings',
        order: 5,
        description: 'Configure tenant-specific settings',
        component: 'TenantSettings',
        permissions: ['read', 'update'],
        adminOnly: true
      }
    ];

    // Tenant-specific customizations
    const tenantCustomizations = {
      'logistics-co': {
        branding: {
          primaryColor: '#2563eb',
          logo: '/assets/logos/logistics-co.png',
          companyName: 'LogisticsCo'
        },
        features: {
          shipmentTracking: true,
          routeOptimization: true,
          warehouseManagement: true
        },
        customScreens: [
          {
            id: 'shipments',
            name: 'Shipment Tracking',
            path: '/shipments',
            icon: 'truck',
            order: 2.5,
            description: 'Track and manage shipments',
            component: 'ShipmentTracking',
            permissions: ['read', 'update']
          }
        ]
      },
      'retail-gmbh': {
        branding: {
          primaryColor: '#059669',
          logo: '/assets/logos/retail-gmbh.png',
          companyName: 'RetailGmbH'
        },
        features: {
          inventoryManagement: true,
          ecommerceIntegration: true,
          customerLoyalty: true
        },
        customScreens: [
          {
            id: 'inventory',
            name: 'Inventory Management',
            path: '/inventory',
            icon: 'package',
            order: 2.5,
            description: 'Manage product inventory',
            component: 'InventoryManagement',
            permissions: ['read', 'update']
          },
          {
            id: 'loyalty',
            name: 'Customer Loyalty',
            path: '/loyalty',
            icon: 'heart',
            order: 3.5,
            description: 'Manage loyalty programs',
            component: 'LoyaltyPrograms',
            permissions: ['read', 'update']
          }
        ]
      }
    };

    // Build screen configuration
    let availableScreens = [...baseScreens];

    // Add admin screens if user is admin
    if (user.role === 'Admin') {
      availableScreens = [...availableScreens, ...adminScreens];
    }

    // Add tenant-specific screens
    const tenantConfig = tenantCustomizations[user.customerId];
    if (tenantConfig && tenantConfig.customScreens) {
      availableScreens = [...availableScreens, ...tenantConfig.customScreens];
    }

    // Sort screens by order
    availableScreens.sort((a, b) => a.order - b.order);

    // Build response
    const screenConfig = {
      tenant: {
        id: user.customerId,
        name: tenantConfig?.branding?.companyName || user.customerId,
        branding: tenantConfig?.branding || {
          primaryColor: '#6366f1',
          logo: '/assets/logos/default.png',
          companyName: user.customerId
        },
        features: tenantConfig?.features || {}
      },
      user: {
        role: user.role,
        permissions: user.role === 'Admin' ? ['admin'] : ['user'],
        preferences: {
          theme: 'light',
          language: 'en',
          timezone: 'UTC'
        }
      },
      screens: availableScreens,
      navigation: {
        sidebarCollapsed: false,
        defaultScreen: 'dashboard',
        quickActions: [
          {
            id: 'create-ticket',
            name: 'New Ticket',
            action: 'create_ticket',
            icon: 'plus',
            color: 'primary'
          },
          {
            id: 'search',
            name: 'Search',
            action: 'search',
            icon: 'search',
            color: 'secondary'
          }
        ]
      }
    };

    res.json({
      success: true,
      data: screenConfig
    });

  } catch (error) {
    console.error('Error fetching screen configuration:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch screen configuration',
      code: 'SCREEN_CONFIG_ERROR'
    });
  }
});

// PUT /me - Update current user profile
router.put('/', TenantIsolationMiddleware.tenantIsolation, async (req, res) => {
  try {
    const userId = req.user.id;
    const updates = req.body;

    // Define allowed fields for self-update
    const allowedFields = ['firstName', 'lastName', 'email'];
    const updateData = {};

    // Filter allowed fields
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        updateData[field] = updates[field];
      }
    }

    // Validate email uniqueness if email is being updated
    if (updateData.email && updateData.email !== req.user.email) {
      const existingUser = await User.findOne({
        email: updateData.email,
        customerId: req.user.customerId,
        _id: { $ne: userId }
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          error: 'Email already exists in your organization',
          code: 'EMAIL_EXISTS'
        });
      }
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { 
        ...updateData,
        updatedAt: new Date()
      },
      { 
        new: true,
        runValidators: true
      }
    ).select('-passwordHash');

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    // Log the update
    console.log(`User profile updated: ${updatedUser.email} (${updatedUser.customerId})`);

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: updatedUser
      }
    });

  } catch (error) {
    console.error('Error updating user profile:', error);

    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        code: 'VALIDATION_ERROR',
        details: Object.values(error.errors).map(err => err.message)
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to update profile',
      code: 'PROFILE_UPDATE_ERROR'
    });
  }
});

// GET /me/list - List all users in the tenant (role-based access)
router.get('/list', async (req, res) => {
  try {
    const customerId = req.user.customerId;
    const isAdmin = req.user.role === 'Admin' || req.user.role === 'admin';
    
    // Build query for tenant isolation
    const query = { customerId };
    
    // Define projection based on role
    const projection = isAdmin 
      ? { password: 0, refreshTokens: 0 } // Admin sees everything except sensitive data
      : { firstName: 1, lastName: 1, role: 1 }; // Users see limited info

    // If not admin, only show their own info
    if (!isAdmin) {
      query._id = req.user.id;
    }

    const users = await User.find(query, projection)
      .sort({ createdAt: -1 })
      .lean();

    // Add computed fields
    const usersWithDetails = users.map(user => ({
      ...user,
      fullName: `${user.firstName} ${user.lastName}`,
      initials: `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase(),
      isAdmin: user.role === 'Admin',
      loginStatus: user.lastLoginAt ? 'active' : 'never_logged_in',
      accountAge: user.createdAt ? Math.floor((Date.now() - new Date(user.createdAt)) / (1000 * 60 * 60 * 24)) : 0
    }));

    res.json({
      success: true,
      data: {
        users: usersWithDetails,
        total: usersWithDetails.length,
        userRole: req.user.role,
        tenantId: customerId
      }
    });

  } catch (error) {
    console.error('Error fetching users list:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch users list',
      code: 'USERS_LIST_ERROR'
    });
  }
});

module.exports = router;
