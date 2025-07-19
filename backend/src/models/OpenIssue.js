const mongoose = require('mongoose');

/**
 * Open Issues Real-time Tracking Schema
 * Tracks all open issues with real-time status updates
 */
const openIssueSchema = new mongoose.Schema({
  // Tenant isolation
  customerId: {
    type: String,
    required: true,
    index: true
  },
  
  // Issue identification
  issueId: {
    type: String,
    required: true,
    index: true
  },
  
  // Related ticket reference
  ticketId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ticket',
    required: true,
    index: true
  },
  
  // Issue details
  title: {
    type: String,
    required: true
  },
  
  description: String,
  
  severity: {
    type: String,
    enum: ['critical', 'high', 'medium', 'low'],
    required: true,
    index: true
  },
  
  category: {
    type: String,
    enum: ['technical', 'business', 'security', 'performance', 'integration'],
    required: true
  },
  
  // Status tracking
  status: {
    type: String,
    enum: ['open', 'investigating', 'in_progress', 'waiting_feedback', 'resolved', 'closed'],
    default: 'open',
    index: true
  },
  
  // Assignment
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  
  reportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Timing
  reportedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  acknowledgedAt: Date,
  
  resolutionStartedAt: Date,
  
  resolvedAt: {
    type: Date,
    index: true
  },
  
  closedAt: Date,
  
  // SLA tracking
  slaTarget: {
    acknowledgmentTime: Number, // minutes
    resolutionTime: Number      // hours
  },
  
  // Resolution details
  resolutionSummary: String,
  
  rootCause: String,
  
  preventiveMeasures: String,
  
  // Impact assessment
  impact: {
    usersAffected: Number,
    systemsAffected: [String],
    businessImpact: {
      type: String,
      enum: ['none', 'low', 'medium', 'high', 'critical']
    },
    estimatedDowntime: Number // minutes
  },
  
  // Real-time updates
  lastUpdate: {
    timestamp: {
      type: Date,
      default: Date.now
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    updateType: {
      type: String,
      enum: ['status_change', 'assignment', 'comment', 'escalation', 'resolution']
    },
    details: String
  },
  
  // Escalation tracking
  escalationLevel: {
    type: Number,
    default: 0,
    min: 0,
    max: 3
  },
  
  escalatedAt: Date,
  
  escalatedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Communication log
  communications: [{
    timestamp: {
      type: Date,
      default: Date.now
    },
    type: {
      type: String,
      enum: ['email', 'phone', 'chat', 'meeting', 'internal_note']
    },
    direction: {
      type: String,
      enum: ['inbound', 'outbound', 'internal']
    },
    participants: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    summary: String,
    details: mongoose.Schema.Types.Mixed
  }],
  
  // Metadata
  metadata: {
    source: {
      type: String,
      enum: ['web', 'email', 'phone', 'monitoring', 'api'],
      default: 'web'
    },
    environment: String,
    version: String,
    browser: String,
    ipAddress: String
  }
  
}, {
  timestamps: true,
  collection: 'open_issues'
});

// Indexes for performance
openIssueSchema.index({ customerId: 1, status: 1, reportedAt: -1 });
openIssueSchema.index({ severity: 1, status: 1, reportedAt: -1 });
openIssueSchema.index({ assignedTo: 1, status: 1 });
openIssueSchema.index({ ticketId: 1 });
openIssueSchema.index({ status: 1, slaTarget: 1 }); // For SLA monitoring

// Virtual for age calculation
openIssueSchema.virtual('ageInHours').get(function() {
  return Math.floor((Date.now() - this.reportedAt) / (1000 * 60 * 60));
});

// Virtual for SLA status
openIssueSchema.virtual('slaStatus').get(function() {
  const now = Date.now();
  const reported = this.reportedAt.getTime();
  const ageInMinutes = (now - reported) / (1000 * 60);
  
  // Check acknowledgment SLA
  if (!this.acknowledgedAt && this.slaTarget.acknowledgmentTime) {
    if (ageInMinutes > this.slaTarget.acknowledgmentTime) {
      return 'ack_breached';
    }
  }
  
  // Check resolution SLA
  if (!this.resolvedAt && this.slaTarget.resolutionTime) {
    const ageInHours = ageInMinutes / 60;
    if (ageInHours > this.slaTarget.resolutionTime) {
      return 'resolution_breached';
    }
  }
  
  return 'within_sla';
});

// Methods
openIssueSchema.methods.acknowledge = function(userId) {
  this.acknowledgedAt = new Date();
  this.lastUpdate = {
    timestamp: new Date(),
    updatedBy: userId,
    updateType: 'status_change',
    details: 'Issue acknowledged'
  };
  return this.save();
};

openIssueSchema.methods.assign = function(assignedTo, assignedBy) {
  this.assignedTo = assignedTo;
  this.lastUpdate = {
    timestamp: new Date(),
    updatedBy: assignedBy,
    updateType: 'assignment',
    details: `Assigned to ${assignedTo}`
  };
  return this.save();
};

openIssueSchema.methods.resolve = function(resolutionSummary, resolvedBy) {
  this.status = 'resolved';
  this.resolvedAt = new Date();
  this.resolutionSummary = resolutionSummary;
  this.lastUpdate = {
    timestamp: new Date(),
    updatedBy: resolvedBy,
    updateType: 'resolution',
    details: 'Issue resolved'
  };
  return this.save();
};

openIssueSchema.methods.escalate = function(escalatedTo, escalatedBy, reason) {
  this.escalationLevel += 1;
  this.escalatedAt = new Date();
  this.escalatedTo = escalatedTo;
  this.lastUpdate = {
    timestamp: new Date(),
    updatedBy: escalatedBy,
    updateType: 'escalation',
    details: `Escalated to level ${this.escalationLevel}: ${reason}`
  };
  return this.save();
};

module.exports = mongoose.model('OpenIssue', openIssueSchema);
