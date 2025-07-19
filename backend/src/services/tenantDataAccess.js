const { User, Ticket } = require('../models');

/**
 * Data Access Layer with automatic tenant filtering
 * Provides a high-level interface for database operations with built-in tenant isolation
 */
class TenantDataAccessLayer {
  constructor(customerId) {
    this.customerId = customerId;
    
    if (!customerId) {
      throw new Error('Customer ID is required for tenant data access');
    }
  }

  /**
   * User-related operations
   */
  get users() {
    return {
      // Find users by tenant
      find: (filter = {}, options = {}) => {
        return User.find({ customerId: this.customerId, ...filter }, null, options);
      },

      // Find one user by tenant
      findOne: (filter = {}, options = {}) => {
        return User.findOne({ customerId: this.customerId, ...filter }, null, options);
      },

      // Find user by ID with tenant validation
      findById: async (id, options = {}) => {
        const user = await User.findById(id, null, options);
        if (user && user.customerId !== this.customerId) {
          throw new Error('User not found or access denied');
        }
        return user;
      },

      // Find user by email within tenant
      findByEmail: (email) => {
        return User.findByEmailAndTenant(email, this.customerId);
      },

      // Create user with tenant assignment
      create: (userData) => {
        return User.create({
          ...userData,
          customerId: this.customerId
        });
      },

      // Update user within tenant
      update: (id, updateData) => {
        return User.findOneAndUpdate(
          { _id: id, customerId: this.customerId },
          updateData,
          { new: true }
        );
      },

      // Delete user within tenant
      delete: (id) => {
        return User.findOneAndDelete({
          _id: id,
          customerId: this.customerId
        });
      },

      // Count users in tenant
      count: (filter = {}) => {
        return User.countDocuments({ customerId: this.customerId, ...filter });
      },

      // Get users with pagination
      paginate: async (options = {}) => {
        const { page = 1, limit = 10, sort = { createdAt: -1 }, filter = {} } = options;
        const skip = (page - 1) * limit;

        const query = { customerId: this.customerId, ...filter };
        
        const [users, total] = await Promise.all([
          User.find(query).sort(sort).skip(skip).limit(limit),
          User.countDocuments(query)
        ]);

        return {
          users,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
          }
        };
      },

      // Get user statistics
      getStats: async () => {
        const stats = await User.aggregate([
          { $match: { customerId: this.customerId } },
          {
            $group: {
              _id: null,
              total: { $sum: 1 },
              admins: { $sum: { $cond: [{ $eq: ['$role', 'Admin'] }, 1, 0] } },
              users: { $sum: { $cond: [{ $eq: ['$role', 'User'] }, 1, 0] } },
              active: { $sum: { $cond: ['$isActive', 1, 0] } },
              inactive: { $sum: { $cond: [{ $not: '$isActive' }, 1, 0] } }
            }
          }
        ]);

        return stats[0] || {
          total: 0,
          admins: 0,
          users: 0,
          active: 0,
          inactive: 0
        };
      }
    };
  }

  /**
   * Ticket-related operations
   */
  get tickets() {
    return {
      // Find tickets by tenant
      find: (filter = {}, options = {}) => {
        return Ticket.find({ customerId: this.customerId, ...filter }, null, options);
      },

      // Find one ticket by tenant
      findOne: (filter = {}, options = {}) => {
        return Ticket.findOne({ customerId: this.customerId, ...filter }, null, options);
      },

      // Find ticket by ID with tenant validation
      findById: async (id, options = {}) => {
        const ticket = await Ticket.findById(id, null, options);
        if (ticket && ticket.customerId !== this.customerId) {
          throw new Error('Ticket not found or access denied');
        }
        return ticket;
      },

      // Create ticket with tenant assignment
      create: (ticketData) => {
        return Ticket.create({
          ...ticketData,
          customerId: this.customerId
        });
      },

      // Update ticket within tenant
      update: (id, updateData) => {
        return Ticket.findOneAndUpdate(
          { _id: id, customerId: this.customerId },
          updateData,
          { new: true }
        );
      },

      // Delete ticket within tenant
      delete: (id) => {
        return Ticket.findOneAndDelete({
          _id: id,
          customerId: this.customerId
        });
      },

      // Count tickets in tenant
      count: (filter = {}) => {
        return Ticket.countDocuments({ customerId: this.customerId, ...filter });
      },

      // Get tickets with pagination and advanced filtering
      paginate: async (options = {}) => {
        const { page = 1, limit = 10, sort = { createdAt: -1 }, filter = {} } = options;
        const skip = (page - 1) * limit;

        const query = { customerId: this.customerId, ...filter };
        
        const [tickets, total] = await Promise.all([
          Ticket.find(query)
            .populate('createdBy', 'firstName lastName email')
            .populate('assignedTo', 'firstName lastName email')
            .sort(sort)
            .skip(skip)
            .limit(limit),
          Ticket.countDocuments(query)
        ]);

        return {
          tickets,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
          }
        };
      },

      // Search tickets by text
      search: async (searchTerm, options = {}) => {
        const { page = 1, limit = 10 } = options;
        const skip = (page - 1) * limit;

        const query = {
          customerId: this.customerId,
          $text: { $search: searchTerm }
        };

        const [tickets, total] = await Promise.all([
          Ticket.find(query)
            .populate('createdBy', 'firstName lastName email')
            .populate('assignedTo', 'firstName lastName email')
            .sort({ score: { $meta: 'textScore' } })
            .skip(skip)
            .limit(limit),
          Ticket.countDocuments(query)
        ]);

        return {
          tickets,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
          }
        };
      },

      // Get ticket statistics
      getStats: () => {
        return Ticket.getStatsByTenant(this.customerId);
      },

      // Get tickets by status
      getByStatus: (status, options = {}) => {
        return this.tickets.find({ status }, options);
      },

      // Get tickets by priority
      getByPriority: (priority, options = {}) => {
        return this.tickets.find({ priority }, options);
      },

      // Get tickets assigned to user
      getAssignedTo: (userId, options = {}) => {
        return this.tickets.find({ assignedTo: userId }, options);
      },

      // Get tickets created by user
      getCreatedBy: (userId, options = {}) => {
        return this.tickets.find({ createdBy: userId }, options);
      },

      // Update ticket status
      updateStatus: async (id, status, userId = null) => {
        const updateData = { status };
        
        if (['resolved', 'closed'].includes(status)) {
          updateData.resolvedAt = new Date();
        }

        return this.tickets.update(id, updateData);
      },

      // Assign ticket to user
      assign: (id, assignedTo) => {
        return this.tickets.update(id, { assignedTo });
      },

      // Unassign ticket
      unassign: (id) => {
        return this.tickets.update(id, { assignedTo: null });
      },

      // Update workflow status
      updateWorkflowStatus: async (id, workflowStatus, workflowId = null, workflowData = null) => {
        const updateData = { workflowStatus };
        if (workflowId) updateData.workflowId = workflowId;
        if (workflowData) updateData.workflowData = workflowData;
        
        return this.tickets.update(id, updateData);
      }
    };
  }

  /**
   * Generic operations that work across all models
   */
  async bulkOperation(Model, operation, data, filter = {}) {
    const tenantFilter = { customerId: this.customerId, ...filter };
    
    switch (operation) {
      case 'create':
        return Model.insertMany(
          data.map(item => ({ ...item, customerId: this.customerId }))
        );
      
      case 'update':
        return Model.updateMany(tenantFilter, data);
      
      case 'delete':
        return Model.deleteMany(tenantFilter);
      
      default:
        throw new Error(`Unsupported bulk operation: ${operation}`);
    }
  }

  /**
   * Advanced analytics and reporting
   */
  async getAnalytics(dateRange = {}) {
    const { startDate, endDate } = dateRange;
    let dateFilter = {};

    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
      if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
    }

    const [userStats, ticketStats, ticketTrends] = await Promise.all([
      this.users.getStats(),
      this.tickets.getStats(),
      this.getTicketTrends(dateFilter)
    ]);

    return {
      customerId: this.customerId,
      period: dateRange,
      users: userStats,
      tickets: ticketStats,
      trends: ticketTrends
    };
  }

  /**
   * Get ticket trends over time
   */
  async getTicketTrends(dateFilter = {}) {
    const matchStage = {
      customerId: this.customerId,
      ...dateFilter
    };

    const trends = await Ticket.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          count: { $sum: 1 },
          resolved: { $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] } },
          closed: { $sum: { $cond: [{ $eq: ['$status', 'closed'] }, 1, 0] } }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    return trends.map(trend => ({
      date: `${trend._id.year}-${String(trend._id.month).padStart(2, '0')}-${String(trend._id.day).padStart(2, '0')}`,
      created: trend.count,
      resolved: trend.resolved,
      closed: trend.closed
    }));
  }

  /**
   * Backup tenant data
   */
  async backup() {
    const [users, tickets] = await Promise.all([
      this.users.find({}),
      this.tickets.find({})
    ]);

    return {
      customerId: this.customerId,
      timestamp: new Date(),
      data: {
        users,
        tickets
      }
    };
  }

  /**
   * Validate tenant data integrity
   */
  async validateIntegrity() {
    const issues = [];

    // Check for users without customerId
    const usersWithoutTenant = await User.countDocuments({
      $or: [
        { customerId: { $exists: false } },
        { customerId: null },
        { customerId: '' }
      ]
    });

    if (usersWithoutTenant > 0) {
      issues.push(`${usersWithoutTenant} users without tenant assignment`);
    }

    // Check for tickets without customerId
    const ticketsWithoutTenant = await Ticket.countDocuments({
      $or: [
        { customerId: { $exists: false } },
        { customerId: null },
        { customerId: '' }
      ]
    });

    if (ticketsWithoutTenant > 0) {
      issues.push(`${ticketsWithoutTenant} tickets without tenant assignment`);
    }

    // Check for cross-tenant references
    const crossTenantTickets = await Ticket.aggregate([
      { $match: { customerId: this.customerId } },
      {
        $lookup: {
          from: 'users',
          localField: 'createdBy',
          foreignField: '_id',
          as: 'creator'
        }
      },
      {
        $match: {
          'creator.customerId': { $ne: this.customerId }
        }
      },
      { $count: 'count' }
    ]);

    if (crossTenantTickets.length > 0) {
      issues.push(`${crossTenantTickets[0].count} tickets with cross-tenant creator references`);
    }

    return {
      customerId: this.customerId,
      valid: issues.length === 0,
      issues
    };
  }
}

module.exports = TenantDataAccessLayer;
