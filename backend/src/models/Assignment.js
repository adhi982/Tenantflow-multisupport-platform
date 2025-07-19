const mongoose = require('mongoose');

/**
 * Real-time Assignment Tracking Schema
 * Tracks who is assigned to what with complete history
 */
const assignmentSchema = new mongoose.Schema({
  // Tenant isolation
  customerId: {
    type: String,
    required: true,
    index: true
  },
  
  // Assignment details
  entityType: {
    type: String,
    required: true,
    enum: ['ticket', 'project', 'task', 'workflow']
  },
  
  entityId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true
  },
  
  // Who is assigned
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Who made the assignment
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Assignment status
  status: {
    type: String,
    enum: ['active', 'completed', 'cancelled', 'transferred'],
    default: 'active',
    index: true
  },
  
  // Timing
  assignedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  completedAt: {
    type: Date,
    index: true
  },
  
  dueDate: {
    type: Date,
    index: true
  },
  
  // Priority and workload
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  
  estimatedHours: Number,
  actualHours: Number,
  
  // Notes and comments
  assignmentNotes: String,
  completionNotes: String,
  
  // Metadata
  metadata: {
    source: {
      type: String,
      enum: ['manual', 'auto_assignment', 'escalation', 'transfer'],
      default: 'manual'
    },
    ipAddress: String,
    userAgent: String
  }
  
}, {
  timestamps: true,
  collection: 'assignments'
});

// Indexes for performance
assignmentSchema.index({ customerId: 1, assignedAt: -1 });
assignmentSchema.index({ assignedTo: 1, status: 1, assignedAt: -1 });
assignmentSchema.index({ entityType: 1, entityId: 1, status: 1 });
assignmentSchema.index({ status: 1, dueDate: 1 }); // For overdue tracking
assignmentSchema.index({ priority: 1, assignedAt: -1 });

// Methods
assignmentSchema.methods.complete = function(completionNotes, actualHours) {
  this.status = 'completed';
  this.completedAt = new Date();
  this.completionNotes = completionNotes;
  this.actualHours = actualHours;
  return this.save();
};

assignmentSchema.methods.isOverdue = function() {
  return this.dueDate && this.dueDate < new Date() && this.status === 'active';
};

module.exports = mongoose.model('Assignment', assignmentSchema);
