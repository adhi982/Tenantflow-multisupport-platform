const mongoose = require('mongoose');

/**
 * Real-time Activity Log Schema
 * Tracks all user actions and system events with timestamps
 */
const activityLogSchema = new mongoose.Schema({
  // Tenant isolation
  customerId: {
    type: String,
    required: true,
    index: true
  },
  
  // Action details
  action: {
    type: String,
    required: true,
    enum: [
      'ticket_created',
      'ticket_updated', 
      'ticket_assigned',
      'ticket_resolved',
      'ticket_closed',
      'user_created',
      'user_updated',
      'user_login',
      'user_logout',
      'workflow_triggered',
      'workflow_completed',
      'workflow_failed',
      'webhook_received',
      'workflow_started',
      'notification_sent',
      'comment_added',
      'file_uploaded',
      'status_changed',
      'priority_changed'
    ]
  },
  
  // Entity references
  entityType: {
    type: String,
    required: true,
    enum: ['ticket', 'user', 'workflow', 'notification', 'comment', 'file']
  },
  
  entityId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true
  },
  
  // User who performed the action
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false, // Allow null for system actions
    index: true
  },
  
  // Action details
  details: {
    before: mongoose.Schema.Types.Mixed, // Previous state
    after: mongoose.Schema.Types.Mixed,  // New state
    metadata: mongoose.Schema.Types.Mixed // Additional context
  },
  
  // Timing
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  // Source of action
  source: {
    type: String,
    enum: ['web', 'api', 'system', 'webhook', 'automation'],
    default: 'web'
  },
  
  // IP and user agent for security
  ipAddress: String,
  userAgent: String
  
}, {
  timestamps: true, // Adds createdAt and updatedAt
  collection: 'activity_logs'
});

// Indexes for performance
activityLogSchema.index({ customerId: 1, timestamp: -1 });
activityLogSchema.index({ entityType: 1, entityId: 1, timestamp: -1 });
activityLogSchema.index({ performedBy: 1, timestamp: -1 });
activityLogSchema.index({ action: 1, timestamp: -1 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);
