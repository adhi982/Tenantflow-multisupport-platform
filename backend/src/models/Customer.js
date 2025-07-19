/**
 * Customer Model
 * 
 * Represents a customer organization in the FlowBit platform.
 * This is the top-level entity for multi-tenant organization.
 */

const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  // Basic customer information
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  
  // Unique customer identifier
  customerId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true
  },
  
  // Contact information
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address']
  },
  
  // Customer status
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active',
    index: true
  },
  
  // Subscription information
  plan: {
    type: String,
    enum: ['free', 'basic', 'pro', 'enterprise'],
    default: 'free'
  },
  
  // Configuration settings
  settings: {
    timezone: {
      type: String,
      default: 'UTC'
    },
    language: {
      type: String,
      default: 'en'
    },
    notifications: {
      email: {
        type: Boolean,
        default: true
      },
      sms: {
        type: Boolean,
        default: false
      }
    }
  },
  
  // Billing information
  billing: {
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String
    },
    paymentMethod: {
      type: String,
      enum: ['credit_card', 'bank_transfer', 'paypal'],
      default: 'credit_card'
    }
  },
  
  // Usage statistics
  usage: {
    totalUsers: {
      type: Number,
      default: 0
    },
    totalTickets: {
      type: Number,
      default: 0
    },
    storageUsed: {
      type: Number,
      default: 0
    }
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  },
  
  // Last activity tracking
  lastActivity: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true,
  collection: 'customers'
});

// Indexes for efficient queries
customerSchema.index({ customerId: 1 });
customerSchema.index({ email: 1 });
customerSchema.index({ status: 1, createdAt: -1 });
customerSchema.index({ plan: 1, status: 1 });
customerSchema.index({ lastActivity: -1 });

// Pre-save middleware to update timestamps
customerSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  if (this.isModified() && !this.isNew) {
    this.lastActivity = new Date();
  }
  next();
});

// Instance methods
customerSchema.methods.updateUsage = function() {
  // This would be called to update usage statistics
  this.lastActivity = new Date();
  return this.save();
};

customerSchema.methods.isActive = function() {
  return this.status === 'active';
};

customerSchema.methods.canCreateTickets = function() {
  return this.status === 'active' && ['basic', 'pro', 'enterprise'].includes(this.plan);
};

// Static methods
customerSchema.statics.findByCustomerId = function(customerId) {
  return this.findOne({ customerId, status: 'active' });
};

customerSchema.statics.findActiveCustomers = function() {
  return this.find({ status: 'active' }).sort({ lastActivity: -1 });
};

// Virtual for display name
customerSchema.virtual('displayName').get(function() {
  return `${this.name} (${this.customerId})`;
});

// Ensure virtual fields are serialized
customerSchema.set('toJSON', { virtuals: true });
customerSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Customer', customerSchema);
