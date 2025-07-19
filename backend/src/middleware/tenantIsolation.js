const mongoose = require('mongoose');
const { User, Ticket } = require('../models');

/**
 * Enhanced Tenant Isolation Middleware
 * Provides automatic customerId injection and tenant-aware query methods
 */
class TenantIsolationMiddleware {
  /**
   * Main tenant isolation middleware
   * Adds tenant-aware methods to request object
   */
  static tenantIsolation(req, res, next) {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required for tenant isolation',
        code: 'AUTH_REQUIRED'
      });
    }

    const { customerId } = req.user;

    // Add tenant filter helper to request
    req.getTenantFilter = (additionalFilter = {}) => {
      return {
        customerId,
        ...additionalFilter
      };
    };

    // Add tenant-aware query methods
    req.tenantQuery = {
      // Find documents with automatic tenant filtering
      find: (Model, filter = {}, options = {}) => {
        return Model.find(req.getTenantFilter(filter), null, options);
      },

      // Find one document with automatic tenant filtering
      findOne: (Model, filter = {}, options = {}) => {
        return Model.findOne(req.getTenantFilter(filter), null, options);
      },

      // Find by ID with tenant validation
      findById: async (Model, id, options = {}) => {
        const doc = await Model.findById(id, null, options);
        if (doc && doc.customerId !== customerId) {
          throw new Error('Access denied: Resource belongs to different tenant');
        }
        return doc;
      },

      // Create document with automatic tenant assignment
      create: (Model, data) => {
        return Model.create({
          ...data,
          customerId
        });
      },

      // Update documents with tenant filtering
      updateMany: (Model, filter = {}, update = {}, options = {}) => {
        return Model.updateMany(req.getTenantFilter(filter), update, options);
      },

      // Update one document with tenant filtering
      updateOne: (Model, filter = {}, update = {}, options = {}) => {
        return Model.updateOne(req.getTenantFilter(filter), update, options);
      },

      // Find and update with tenant filtering
      findOneAndUpdate: (Model, filter = {}, update = {}, options = {}) => {
        return Model.findOneAndUpdate(req.getTenantFilter(filter), update, options);
      },

      // Delete documents with tenant filtering
      deleteMany: (Model, filter = {}, options = {}) => {
        return Model.deleteMany(req.getTenantFilter(filter), options);
      },

      // Delete one document with tenant filtering
      deleteOne: (Model, filter = {}, options = {}) => {
        return Model.deleteOne(req.getTenantFilter(filter), options);
      },

      // Aggregate with tenant filtering
      aggregate: (Model, pipeline = []) => {
        const tenantMatch = { $match: { customerId } };
        return Model.aggregate([tenantMatch, ...pipeline]);
      },

      // Count documents with tenant filtering
      countDocuments: (Model, filter = {}) => {
        return Model.countDocuments(req.getTenantFilter(filter));
      }
    };

    // Add method to validate tenant ownership of a resource
    req.validateTenantOwnership = (resource) => {
      if (!resource) {
        throw new Error('Resource not found');
      }

      if (resource.customerId !== customerId) {
        throw new Error('Access denied: Resource belongs to different tenant');
      }

      return true;
    };

    // Add method to validate multiple resources
    req.validateTenantOwnershipBatch = (resources) => {
      if (!Array.isArray(resources)) {
        throw new Error('Resources must be an array');
      }

      const invalidResources = resources.filter(resource => 
        !resource || resource.customerId !== customerId
      );

      if (invalidResources.length > 0) {
        throw new Error(`Access denied: ${invalidResources.length} resource(s) belong to different tenant`);
      }

      return true;
    };

    // Add tenant-specific service methods
    req.tenantServices = {
      // Get tenant statistics
      getStats: async () => {
        const userCount = await User.countDocuments({ customerId });
        const ticketStats = await Ticket.getStatsByTenant(customerId);
        
        return {
          customerId,
          users: userCount,
          tickets: ticketStats
        };
      },

      // Get tenant users with pagination
      getUsers: async (options = {}) => {
        const { page = 1, limit = 10, role } = options;
        return await req.tenantQuery.find(User, role ? { role } : {})
          .skip((page - 1) * limit)
          .limit(limit)
          .sort({ createdAt: -1 });
      },

      // Get tenant tickets with pagination and filters
      getTickets: async (options = {}) => {
        return await Ticket.findByTenantPaginated(customerId, options);
      },

      // Create tenant user
      createUser: async (userData) => {
        return await req.tenantQuery.create(User, userData);
      },

      // Create tenant ticket
      createTicket: async (ticketData) => {
        return await req.tenantQuery.create(Ticket, {
          ...ticketData,
          createdBy: req.user.id
        });
      }
    };

    next();
  }

  /**
   * Mongoose plugin to automatically add tenant filtering to all queries
   */
  static mongooseTenantPlugin(schema, options = {}) {
    // Add customerId field if not exists
    if (!schema.paths.customerId) {
      schema.add({
        customerId: {
          type: String,
          required: true,
          index: true
        }
      });
    }

    // Add pre-hook for find operations to auto-filter by tenant
    schema.pre(/^find/, function() {
      // Only add filter if customerId is not already in the query
      if (!this.getQuery().customerId && this.getOptions().tenantId) {
        this.where({ customerId: this.getOptions().tenantId });
      }
    });

    // Add static method for tenant-aware queries
    schema.statics.forTenant = function(tenantId, query = {}) {
      return this.find({ customerId: tenantId, ...query });
    };

    // Add instance method to check tenant ownership
    schema.methods.belongsToTenant = function(tenantId) {
      return this.customerId === tenantId;
    };
  }

  /**
   * Middleware to inject tenant context into Mongoose operations
   */
  static mongooseTenantContext(req, res, next) {
    if (!req.user) {
      return next();
    }

    // Override mongoose methods to automatically include tenant filtering
    const originalFind = mongoose.Model.find;
    const originalFindOne = mongoose.Model.findOne;
    const originalFindById = mongoose.Model.findById;

    // Store original methods for restoration
    req._originalMongooseMethods = {
      find: originalFind,
      findOne: originalFindOne,
      findById: originalFindById
    };

    // Override find method
    mongoose.Model.find = function(filter = {}, ...args) {
      if (this.schema.paths.customerId && !filter.customerId) {
        filter.customerId = req.user.customerId;
      }
      return originalFind.call(this, filter, ...args);
    };

    // Override findOne method
    mongoose.Model.findOne = function(filter = {}, ...args) {
      if (this.schema.paths.customerId && !filter.customerId) {
        filter.customerId = req.user.customerId;
      }
      return originalFindOne.call(this, filter, ...args);
    };

    // Override findById method
    mongoose.Model.findById = async function(id, ...args) {
      const doc = await originalFindById.call(this, id, ...args);
      if (doc && this.schema.paths.customerId && doc.customerId !== req.user.customerId) {
        return null; // Hide documents from other tenants
      }
      return doc;
    };

    next();
  }

  /**
   * Cleanup middleware to restore original Mongoose methods
   */
  static cleanupMongooseContext(req, res, next) {
    if (req._originalMongooseMethods) {
      mongoose.Model.find = req._originalMongooseMethods.find;
      mongoose.Model.findOne = req._originalMongooseMethods.findOne;
      mongoose.Model.findById = req._originalMongooseMethods.findById;
      delete req._originalMongooseMethods;
    }
    next();
  }

  /**
   * Middleware to log tenant-aware operations for audit purposes
   */
  static auditTenantOperations(req, res, next) {
    if (!req.user) {
      return next();
    }

    const originalJson = res.json;
    const startTime = Date.now();

    res.json = function(data) {
      const duration = Date.now() - startTime;
      
      // Log tenant operation
      console.log(`[TENANT-AUDIT] ${req.method} ${req.path}`, {
        customerId: req.user.customerId,
        userId: req.user.id,
        userRole: req.user.role,
        duration: `${duration}ms`,
        statusCode: res.statusCode,
        timestamp: new Date().toISOString()
      });

      return originalJson.call(this, data);
    };

    next();
  }

  /**
   * Middleware to validate tenant-specific resource access
   */
  static validateTenantResource(resourceParam = 'id') {
    return async (req, res, next) => {
      try {
        if (!req.user) {
          return res.status(401).json({
            success: false,
            error: 'Authentication required',
            code: 'AUTH_REQUIRED'
          });
        }

        const resourceId = req.params[resourceParam];
        if (!resourceId) {
          return res.status(400).json({
            success: false,
            error: `Resource ${resourceParam} is required`,
            code: 'MISSING_RESOURCE_ID'
          });
        }

        // Store resource ID for use in controllers
        req.resourceId = resourceId;
        req.tenantId = req.user.customerId;

        next();
      } catch (error) {
        res.status(500).json({
          success: false,
          error: 'Resource validation failed',
          code: 'VALIDATION_ERROR'
        });
      }
    };
  }

  /**
   * Middleware to ensure tenant consistency in bulk operations
   */
  static validateBulkTenantOperation(req, res, next) {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    const { customerId } = req.user;

    // Check if request body contains array of items
    if (Array.isArray(req.body)) {
      req.body = req.body.map(item => ({
        ...item,
        customerId
      }));
    } else if (req.body && typeof req.body === 'object') {
      req.body.customerId = customerId;
    }

    next();
  }
}

module.exports = TenantIsolationMiddleware;
