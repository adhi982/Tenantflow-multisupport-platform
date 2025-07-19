const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
  customerId: {
    type: String,
    required: true,
    index: true, // For efficient tenant-based queries
    validate: {
      validator: function(customerId) {
        return /^[a-zA-Z0-9_-]+$/.test(customerId);
      },
      message: 'Customer ID can only contain letters, numbers, hyphens and underscores'
    }
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200,
    validate: {
      validator: function(title) {
        return title && title.length >= 3;
      },
      message: 'Title must be at least 3 characters long'
    }
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000,
    validate: {
      validator: function(description) {
        return description && description.length >= 10;
      },
      message: 'Description must be at least 10 characters long'
    }
  },
  status: {
    type: String,
    required: true,
    enum: {
      values: ['open', 'in-progress', 'resolved', 'closed'],
      message: 'Status must be one of: open, in-progress, resolved, closed'
    },
    default: 'open',
    index: true // For efficient status-based queries
  },
  priority: {
    type: String,
    enum: {
      values: ['low', 'medium', 'high', 'urgent'],
      message: 'Priority must be one of: low, medium, high, urgent'
    },
    default: 'medium'
  },
  category: {
    type: String,
    enum: {
      values: ['technical', 'billing', 'general', 'feature-request', 'bug-report'],
      message: 'Category must be one of: technical, billing, general, feature-request, bug-report'
    },
    default: 'general'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    validate: {
      validator: function(userId) {
        return mongoose.Types.ObjectId.isValid(userId);
      },
      message: 'Created by must be a valid user ID'
    }
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
    validate: {
      validator: function(userId) {
        return !userId || mongoose.Types.ObjectId.isValid(userId);
      },
      message: 'Assigned to must be a valid user ID'
    }
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: 50,
    validate: {
      validator: function(tag) {
        return /^[a-zA-Z0-9-_\s]+$/.test(tag);
      },
      message: 'Tags can only contain letters, numbers, hyphens, underscores and spaces'
    }
  }],
  // n8n workflow integration fields
  workflowStatus: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  workflowId: {
    type: String,
    default: null
  },
  workflowData: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
    index: true // For efficient date-based queries
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  resolvedAt: {
    type: Date,
    default: null
  },
  // Additional metadata
  metadata: {
    userAgent: String,
    ipAddress: String,
    source: {
      type: String,
      enum: ['web', 'api', 'email', 'phone'],
      default: 'web'
    }
  }
});

// Compound indexes for efficient tenant-based queries
ticketSchema.index({ customerId: 1, status: 1 });
ticketSchema.index({ customerId: 1, createdBy: 1 });
ticketSchema.index({ customerId: 1, assignedTo: 1 });
ticketSchema.index({ customerId: 1, createdAt: -1 }); // Most recent first
ticketSchema.index({ customerId: 1, priority: 1, status: 1 });
ticketSchema.index({ customerId: 1, category: 1 });

// Text index for search functionality
ticketSchema.index({ 
  title: 'text', 
  description: 'text', 
  tags: 'text' 
}, {
  weights: {
    title: 10,
    description: 5,
    tags: 1
  },
  name: 'ticket_text_index'
});

// Update the updatedAt field before saving
ticketSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  // Set resolvedAt when status changes to resolved or closed
  if (this.isModified('status') && ['resolved', 'closed'].includes(this.status)) {
    if (!this.resolvedAt) {
      this.resolvedAt = Date.now();
    }
  }
  
  next();
});

// Update the updatedAt field before updating
ticketSchema.pre(['updateOne', 'findOneAndUpdate'], function(next) {
  this.set({ updatedAt: Date.now() });
  next();
});

// Static method to find tickets by tenant (with tenant isolation)
ticketSchema.statics.findByTenant = function(customerId, query = {}) {
  return this.find({ customerId, ...query });
};

// Static method to find tickets by tenant with pagination
ticketSchema.statics.findByTenantPaginated = function(customerId, options = {}) {
  const {
    page = 1,
    limit = 10,
    sort = { createdAt: -1 },
    status,
    priority,
    category,
    assignedTo,
    createdBy,
    search
  } = options;

  const skip = (page - 1) * limit;
  let query = { customerId };

  // Add filters
  if (status) query.status = status;
  if (priority) query.priority = priority;
  if (category) query.category = category;
  if (assignedTo) query.assignedTo = assignedTo;
  if (createdBy) query.createdBy = createdBy;

  // Add text search
  if (search) {
    query.$text = { $search: search };
  }

  return this.find(query)
    .populate('createdBy', 'firstName lastName email')
    .populate('assignedTo', 'firstName lastName email')
    .sort(sort)
    .skip(skip)
    .limit(limit);
};

// Static method to get ticket statistics for a tenant
ticketSchema.statics.getStatsByTenant = async function(customerId) {
  const stats = await this.aggregate([
    { $match: { customerId } },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        open: { $sum: { $cond: [{ $eq: ['$status', 'open'] }, 1, 0] } },
        inProgress: { $sum: { $cond: [{ $eq: ['$status', 'in-progress'] }, 1, 0] } },
        resolved: { $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] } },
        closed: { $sum: { $cond: [{ $eq: ['$status', 'closed'] }, 1, 0] } },
        high: { $sum: { $cond: [{ $eq: ['$priority', 'high'] }, 1, 0] } },
        urgent: { $sum: { $cond: [{ $eq: ['$priority', 'urgent'] }, 1, 0] } }
      }
    }
  ]);

  return stats[0] || {
    total: 0,
    open: 0,
    inProgress: 0,
    resolved: 0,
    closed: 0,
    high: 0,
    urgent: 0
  };
};

// Instance method to check if user can access this ticket
ticketSchema.methods.canUserAccess = function(user) {
  // Users can only access tickets from their tenant
  if (this.customerId !== user.customerId) {
    return false;
  }

  // Admins can access all tickets in their tenant
  if (user.role === 'Admin') {
    return true;
  }

  // Regular users can access tickets they created or are assigned to
  return this.createdBy.toString() === user.id || 
         (this.assignedTo && this.assignedTo.toString() === user.id);
};

// Instance method to update workflow status
ticketSchema.methods.updateWorkflowStatus = async function(status, workflowId = null, data = null) {
  this.workflowStatus = status;
  if (workflowId) this.workflowId = workflowId;
  if (data) this.workflowData = data;
  return await this.save();
};

// Virtual for ticket age in days
ticketSchema.virtual('ageInDays').get(function() {
  const now = new Date();
  const created = new Date(this.createdAt);
  const diffTime = Math.abs(now - created);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for resolution time in hours (if resolved)
ticketSchema.virtual('resolutionTimeHours').get(function() {
  if (!this.resolvedAt) return null;
  
  const resolved = new Date(this.resolvedAt);
  const created = new Date(this.createdAt);
  const diffTime = Math.abs(resolved - created);
  return Math.round(diffTime / (1000 * 60 * 60));
});

// Ensure virtual fields are serialized
ticketSchema.set('toJSON', { virtuals: true });
ticketSchema.set('toObject', { virtuals: true });

// Instance method to get ticket info without sensitive data
ticketSchema.methods.toJSON = function() {
  const ticketObject = this.toObject();
  delete ticketObject.__v;
  return ticketObject;
};

module.exports = mongoose.model('Ticket', ticketSchema);
