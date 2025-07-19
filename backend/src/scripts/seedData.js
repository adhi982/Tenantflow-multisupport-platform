const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Ticket = require('../models/Ticket');
require('dotenv').config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/flowbit-platform');
    console.log('✅ MongoDB connected for seed data creation');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
};

// Clear existing data
const clearData = async () => {
  try {
    await User.deleteMany({});
    await Ticket.deleteMany({});
    console.log('🗑️  Cleared existing data');
  } catch (error) {
    console.error('❌ Error clearing data:', error.message);
  }
};

// Create seed users
const createUsers = async () => {
  const users = [];
  
  // LogisticsCo tenant users
  const logisticsAdmin = new User({
    email: 'admin@logisticsco.com',
    passwordHash: await bcrypt.hash('admin123', 10),
    customerId: 'logistics-co',
    role: 'Admin',
    firstName: 'Sarah',
    lastName: 'Johnson',
    isActive: true,
    lastLoginAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date()
  });
  users.push(logisticsAdmin);

  const logisticsUser = new User({
    email: 'support@logisticsco.com',
    passwordHash: await bcrypt.hash('user123', 10),
    customerId: 'logistics-co',
    role: 'User',
    firstName: 'Mike',
    lastName: 'Thompson',
    isActive: true,
    lastLoginAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    createdAt: new Date(),
    updatedAt: new Date()
  });
  users.push(logisticsUser);

  // RetailGmbH tenant users
  const retailAdmin = new User({
    email: 'admin@retailgmbh.de',
    passwordHash: await bcrypt.hash('admin123', 10),
    customerId: 'retail-gmbh',
    role: 'Admin',
    firstName: 'Klaus',
    lastName: 'Mueller',
    isActive: true,
    lastLoginAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date()
  });
  users.push(retailAdmin);

  const retailUser = new User({
    email: 'support@retailgmbh.de',
    passwordHash: await bcrypt.hash('user123', 10),
    customerId: 'retail-gmbh',
    role: 'User',
    firstName: 'Anna',
    lastName: 'Schmidt',
    isActive: true,
    lastLoginAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    createdAt: new Date(),
    updatedAt: new Date()
  });
  users.push(retailUser);

  await User.insertMany(users);
  console.log('👥 Created seed users:');
  console.log('   - LogisticsCo: admin@logisticsco.com (Admin), support@logisticsco.com (User)');
  console.log('   - RetailGmbH: admin@retailgmbh.de (Admin), support@retailgmbh.de (User)');
  
  return users;
};

// Create sample tickets
const createTickets = async (users) => {
  const tickets = [];
  
  // Find users by email for reference
  const logisticsAdmin = users.find(u => u.email === 'admin@logisticsco.com');
  const logisticsUser = users.find(u => u.email === 'support@logisticsco.com');
  const retailAdmin = users.find(u => u.email === 'admin@retailgmbh.de');
  const retailUser = users.find(u => u.email === 'support@retailgmbh.de');

  // LogisticsCo tickets
  const logisticsTickets = [
    {
      customerId: 'logistics-co',
      title: 'Shipment Tracking System Down',
      description: 'Our main shipment tracking system is not responding. Customers cannot track their packages and this is causing significant support volume.',
      status: 'open',
      priority: 'urgent',
      category: 'technical',
      createdBy: logisticsUser._id,
      assignedTo: logisticsAdmin._id,
      tags: ['system-outage', 'tracking', 'urgent'],
      workflowStatus: 'pending',
      workflowId: null,
      workflowData: {},
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      updatedAt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
      metadata: {
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        ipAddress: '192.168.1.100',
        source: 'web'
      }
    },
    {
      customerId: 'logistics-co',
      title: 'Billing Discrepancy - Package #LG-2024-0156',
      description: 'Customer reports being charged for expedited shipping but package was delivered via standard shipping. Need to review and process refund.',
      status: 'in-progress',
      priority: 'medium',
      category: 'billing',
      createdBy: logisticsUser._id,
      assignedTo: logisticsAdmin._id,
      tags: ['billing', 'refund', 'customer-complaint'],
      workflowStatus: 'processing',
      workflowId: 'wf-logistics-001',
      workflowData: { packageId: 'LG-2024-0156', refundAmount: 15.99 },
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      updatedAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
      metadata: {
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0)',
        ipAddress: '10.0.0.50',
        source: 'api'
      }
    },
    {
      customerId: 'logistics-co',
      title: 'New Driver Onboarding - Training Materials',
      description: 'We need updated training materials for new drivers including safety protocols, GPS system usage, and customer interaction guidelines.',
      status: 'resolved',
      priority: 'low',
      category: 'general',
      createdBy: logisticsAdmin._id,
      assignedTo: logisticsUser._id,
      tags: ['training', 'onboarding', 'drivers'],
      workflowStatus: 'completed',
      workflowId: 'wf-logistics-002',
      workflowData: { materialsGenerated: true, reviewCompleted: true },
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      updatedAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
      resolvedAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
      metadata: {
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        ipAddress: '192.168.1.101',
        source: 'web'
      }
    }
  ];

  // RetailGmbH tickets
  const retailTickets = [
    {
      customerId: 'retail-gmbh',
      title: 'E-Commerce Platform Performance Issues',
      description: 'The online store is experiencing slow loading times during peak hours. Customer conversion rates have dropped by 15% this week.',
      status: 'open',
      priority: 'high',
      category: 'technical',
      createdBy: retailUser._id,
      assignedTo: retailAdmin._id,
      tags: ['performance', 'e-commerce', 'conversion'],
      workflowStatus: 'pending',
      workflowId: null,
      workflowData: {},
      createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
      updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
      metadata: {
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        ipAddress: '172.16.0.25',
        source: 'web'
      }
    },
    {
      customerId: 'retail-gmbh',
      title: 'Inventory Sync Issues with Warehouse',
      description: 'Product inventory levels are not syncing correctly between the warehouse management system and the online store, causing overselling.',
      status: 'in-progress',
      priority: 'high',
      category: 'technical',
      createdBy: retailAdmin._id,
      assignedTo: retailUser._id,
      tags: ['inventory', 'sync', 'warehouse', 'critical'],
      workflowStatus: 'processing',
      workflowId: 'wf-retail-001',
      workflowData: { affectedProducts: 47, lastSyncTime: '2024-01-15T10:30:00Z' },
      createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
      updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      metadata: {
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        ipAddress: '172.16.0.30',
        source: 'web'
      }
    },
    {
      customerId: 'retail-gmbh',
      title: 'Customer Loyalty Program Enhancement',
      description: 'Request to add new features to the loyalty program including tier-based rewards and birthday discounts.',
      status: 'closed',
      priority: 'medium',
      category: 'feature-request',
      createdBy: retailUser._id,
      assignedTo: retailAdmin._id,
      tags: ['loyalty-program', 'enhancement', 'rewards'],
      workflowStatus: 'completed',
      workflowId: 'wf-retail-002',
      workflowData: { featuresImplemented: ['tier-rewards', 'birthday-discounts'], deploymentDate: '2024-01-10' },
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      resolvedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      metadata: {
        userAgent: 'Mozilla/5.0 (iPad; CPU OS 15_0)',
        ipAddress: '172.16.0.28',
        source: 'api'
      }
    },
    {
      customerId: 'retail-gmbh',
      title: 'Payment Gateway Integration Error',
      description: 'New payment gateway integration is failing for transactions over €500. Customers are unable to complete large purchases.',
      status: 'open',
      priority: 'urgent',
      category: 'technical',
      createdBy: retailAdmin._id,
      assignedTo: retailUser._id,
      tags: ['payment', 'integration', 'critical', 'large-transactions'],
      workflowStatus: 'pending',
      workflowId: null,
      workflowData: {},
      createdAt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
      updatedAt: new Date(Date.now() - 30 * 60 * 1000),
      metadata: {
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        ipAddress: '172.16.0.31',
        source: 'web'
      }
    }
  ];

  tickets.push(...logisticsTickets, ...retailTickets);
  await Ticket.insertMany(tickets);
  
  console.log('🎫 Created sample tickets:');
  console.log('   - LogisticsCo: 3 tickets (1 open, 1 in-progress, 1 resolved)');
  console.log('   - RetailGmbH: 4 tickets (2 open, 1 in-progress, 1 closed)');
  
  return tickets;
};

// Generate analytics summary
const generateAnalytics = async () => {
  const logisticsStats = await Ticket.getStatsByTenant('logistics-co');
  const retailStats = await Ticket.getStatsByTenant('retail-gmbh');
  
  console.log('\n📊 Tenant Analytics:');
  console.log('LogisticsCo:', JSON.stringify(logisticsStats, null, 2));
  console.log('RetailGmbH:', JSON.stringify(retailStats, null, 2));
};

// Main seed function
const seedDatabase = async () => {
  console.log('🌱 Starting database seeding...\n');
  
  try {
    await connectDB();
    await clearData();
    const users = await createUsers();
    const tickets = await createTickets(users);
    await generateAnalytics();
    
    console.log('\n✅ Database seeding completed successfully!');
    console.log('\n🔐 Login Credentials:');
    console.log('LogisticsCo Admin: admin@logisticsco.com / admin123');
    console.log('LogisticsCo User:  support@logisticsco.com / user123');
    console.log('RetailGmbH Admin:  admin@retailgmbh.de / admin123');
    console.log('RetailGmbH User:   support@retailgmbh.de / user123');
    
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n💾 Database connection closed');
    process.exit(0);
  }
};

// Run if called directly
if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase, createUsers, createTickets };
