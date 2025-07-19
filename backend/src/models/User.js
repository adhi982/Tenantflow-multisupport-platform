const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    validate: {
      validator: function(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      },
      message: 'Please enter a valid email address'
    }
  },
  passwordHash: {
    type: String,
    required: true,
    minlength: 8
  },
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
  role: {
    type: String,
    required: true,
    enum: ['Admin', 'User'],
    default: 'User'
  },
  firstName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLoginAt: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Compound index for efficient tenant-based user queries
userSchema.index({ customerId: 1, email: 1 });
userSchema.index({ customerId: 1, role: 1 });

// Update the updatedAt field before saving
userSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('passwordHash')) return next();
  
  try {
    // Hash password with cost of 12
    const saltRounds = 12;
    this.passwordHash = await bcrypt.hash(this.passwordHash, saltRounds);
    next();
  } catch (error) {
    next(error);
  }
});

// Instance method to check password
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.passwordHash);
  } catch (error) {
    throw new Error('Password comparison failed');
  }
};

// Instance method to update last login
userSchema.methods.updateLastLogin = async function() {
  this.lastLoginAt = new Date();
  return await this.save();
};

// Static method to find users by tenant (with tenant isolation)
userSchema.statics.findByTenant = function(customerId, query = {}) {
  return this.find({ customerId, ...query });
};

// Static method to find user by email and tenant
userSchema.statics.findByEmailAndTenant = function(email, customerId) {
  return this.findOne({ email: email.toLowerCase(), customerId });
};

// Instance method to get user info without sensitive data
userSchema.methods.toJSON = function() {
  const userObject = this.toObject();
  delete userObject.passwordHash;
  delete userObject.__v;
  return userObject;
};

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Ensure virtual fields are serialized
userSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('User', userSchema);
