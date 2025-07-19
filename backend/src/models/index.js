/**
 * Models Index - Central export for all database models
 * 
 * This file provides a centralized way to import all database models
 * and ensures proper initialization order for relationships and indexes.
 */

const User = require('./User');
const Ticket = require('./Ticket');
const Customer = require('./Customer');
const ActivityLog = require('./ActivityLog');
const Assignment = require('./Assignment');
const ProcessingStatus = require('./ProcessingStatus');
const OpenIssue = require('./OpenIssue');

// Export all models
module.exports = {
  User,
  Ticket,
  Customer,
  ActivityLog,
  Assignment,
  ProcessingStatus,
  OpenIssue
};

/**
 * Database Schema Overview:
 * 
 * 1. Users Collection:
 *    - Multi-tenant user management with customerId isolation
 *    - Role-based access control (Admin, User)
 *    - Secure password hashing with bcrypt
 *    - Compound indexes for efficient tenant-based queries
 * 
 * 2. Tickets Collection:
 *    - Support ticket management with full tenant isolation
 *    - Workflow integration fields for n8n processing
 *    - Rich metadata and status tracking
 *    - Full-text search capabilities
 *    - Comprehensive indexing strategy
 * 
 * Tenant Isolation Strategy:
 * - Every data model includes a required 'customerId' field
 * - All queries are automatically filtered by customerId
 * - Compound indexes ensure efficient tenant-based operations
 * - Cross-tenant data access is prevented at the model level
 * 
 * Index Strategy:
 * - Primary indexes on customerId for all tenant-based queries
 * - Compound indexes for common query patterns
 * - Text indexes for search functionality
 * - Performance optimized for multi-tenant scenarios
 */
