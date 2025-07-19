const mongoose = require('mongoose');

/**
 * Real-time Processing Status Schema
 * Tracks all ongoing processes and their current state
 */
const processingStatusSchema = new mongoose.Schema({
  // Tenant isolation
  customerId: {
    type: String,
    required: true,
    index: true
  },
  
  // Process identification
  processId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  
  processType: {
    type: String,
    required: true,
    enum: [
      'ticket_creation',
      'n8n_workflow',
      'email_notification',
      'discord_alert',
      'user_registration',
      'data_export',
      'report_generation',
      'file_upload',
      'backup_process',
      'integration_sync'
    ]
  },
  
  // Related entity
  entityType: {
    type: String,
    enum: ['ticket', 'user', 'file', 'report', 'backup'],
    required: true
  },
  
  entityId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true
  },
  
  // Process status
  status: {
    type: String,
    enum: ['pending', 'running', 'completed', 'failed', 'cancelled', 'retrying'],
    default: 'pending',
    index: true
  },
  
  // Progress tracking
  progress: {
    current: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    total: {
      type: Number,
      default: 100
    },
    currentStep: String,
    totalSteps: Number
  },
  
  // Timing
  startedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  completedAt: {
    type: Date,
    index: true
  },
  
  estimatedDuration: Number, // in milliseconds
  actualDuration: Number,    // in milliseconds
  
  // Results and errors
  result: mongoose.Schema.Types.Mixed,
  error: {
    message: String,
    code: String,
    stack: String,
    retryCount: {
      type: Number,
      default: 0
    },
    lastRetryAt: Date
  },
  
  // Process details
  input: mongoose.Schema.Types.Mixed,
  output: mongoose.Schema.Types.Mixed,
  
  // Initiated by
  initiatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  
  // Processing logs
  logs: [{
    timestamp: {
      type: Date,
      default: Date.now
    },
    level: {
      type: String,
      enum: ['info', 'warn', 'error', 'debug'],
      default: 'info'
    },
    message: String,
    data: mongoose.Schema.Types.Mixed
  }],
  
  // Metadata
  metadata: {
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium'
    },
    source: String,
    version: String,
    environment: String
  }
  
}, {
  timestamps: true,
  collection: 'processing_status'
});

// Indexes for performance
processingStatusSchema.index({ customerId: 1, startedAt: -1 });
processingStatusSchema.index({ status: 1, startedAt: -1 });
processingStatusSchema.index({ processType: 1, status: 1 });
processingStatusSchema.index({ entityType: 1, entityId: 1 });
processingStatusSchema.index({ initiatedBy: 1, startedAt: -1 });

// Virtual for duration calculation
processingStatusSchema.virtual('duration').get(function() {
  if (this.completedAt) {
    return this.completedAt - this.startedAt;
  }
  return Date.now() - this.startedAt;
});

// Methods
processingStatusSchema.methods.updateProgress = function(current, step) {
  this.progress.current = current;
  if (step) {
    this.progress.currentStep = step;
  }
  return this.save();
};

processingStatusSchema.methods.addLog = function(level, message, data) {
  this.logs.push({
    level,
    message,
    data,
    timestamp: new Date()
  });
  return this.save();
};

processingStatusSchema.methods.complete = function(result) {
  this.status = 'completed';
  this.completedAt = new Date();
  this.actualDuration = this.completedAt - this.startedAt;
  this.progress.current = 100;
  if (result) {
    this.result = result;
  }
  return this.save();
};

processingStatusSchema.methods.fail = function(error) {
  this.status = 'failed';
  this.completedAt = new Date();
  this.actualDuration = this.completedAt - this.startedAt;
  this.error = {
    message: error.message,
    code: error.code,
    stack: error.stack,
    retryCount: this.error.retryCount + 1,
    lastRetryAt: new Date()
  };
  return this.save();
};

module.exports = mongoose.model('ProcessingStatus', processingStatusSchema);
