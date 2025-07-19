const bcrypt = require('bcrypt');

// Initialize MongoDB connection
const mongoUri = process.env.MONGODB_URI || 'mongodb://admin:password123@localhost:27017/flowbit?authSource=admin';

async function seedDatabase() {
  const { MongoClient } = require('mongodb');
  
  try {
    const client = new MongoClient(mongoUri);
    await client.connect();
    console.log('✅ Connected to MongoDB for seeding');
    
    const db = client.db('flowbit');
    const usersCollection = db.collection('users');
    
    // Check if users already exist
    const existingUsers = await usersCollection.countDocuments();
    if (existingUsers > 0) {
      console.log(`📊 ${existingUsers} users already exist, skipping seed`);
      await client.close();
      return;
    }
    
    // Create default users for both tenants
    const defaultUsers = [
      // Logistics Company Users
      {
        email: 'admin@logistics-co.com',
        passwordHash: await bcrypt.hash('admin123', 12),
        customerId: 'logistics-co',
        role: 'Admin',
        firstName: 'Admin',
        lastName: 'User',
        isActive: true,
        isEmailVerified: true,
        profile: {
          department: 'Administration',
          jobTitle: 'System Administrator'
        },
        preferences: {
          theme: 'light',
          language: 'en',
          timezone: 'UTC',
          notifications: {
            email: true,
            push: true,
            sms: false
          }
        },
        metadata: {
          source: 'seed',
          onboardingCompleted: true
        },
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        email: 'user@logistics-co.com',
        passwordHash: await bcrypt.hash('user123', 12),
        customerId: 'logistics-co',
        role: 'User',
        firstName: 'John',
        lastName: 'Smith',
        isActive: true,
        isEmailVerified: true,
        profile: {
          department: 'Operations',
          jobTitle: 'Logistics Coordinator'
        },
        preferences: {
          theme: 'light',
          language: 'en',
          timezone: 'UTC',
          notifications: {
            email: true,
            push: true,
            sms: false
          }
        },
        metadata: {
          source: 'seed',
          onboardingCompleted: true
        },
        createdAt: new Date(),
        updatedAt: new Date()
      },
      
      // Retail GmbH Users
      {
        email: 'admin@retail-gmbh.com',
        passwordHash: await bcrypt.hash('admin123', 12),
        customerId: 'retail-gmbh',
        role: 'Admin',
        firstName: 'Admin',
        lastName: 'User',
        isActive: true,
        isEmailVerified: true,
        profile: {
          department: 'Administration',
          jobTitle: 'System Administrator'
        },
        preferences: {
          theme: 'light',
          language: 'en',
          timezone: 'UTC',
          notifications: {
            email: true,
            push: true,
            sms: false
          }
        },
        metadata: {
          source: 'seed',
          onboardingCompleted: true
        },
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        email: 'user@retail-gmbh.com',
        passwordHash: await bcrypt.hash('user123', 12),
        customerId: 'retail-gmbh',
        role: 'User',
        firstName: 'Maria',
        lastName: 'Garcia',
        isActive: true,
        isEmailVerified: true,
        profile: {
          department: 'Customer Service',
          jobTitle: 'Support Specialist'
        },
        preferences: {
          theme: 'light',
          language: 'en',
          timezone: 'UTC',
          notifications: {
            email: true,
            push: true,
            sms: false
          }
        },
        metadata: {
          source: 'seed',
          onboardingCompleted: true
        },
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    
    // Insert users
    const result = await usersCollection.insertMany(defaultUsers);
    console.log(`👥 Created ${result.insertedCount} users`);
    
    // Log the created users for reference
    console.log('\n📋 Created Users:');
    console.log('================');
    defaultUsers.forEach(user => {
      console.log(`🔐 ${user.email} (${user.customerId}) - Role: ${user.role}`);
      console.log(`   Password: ${user.email.includes('admin') ? 'admin123' : 'user123'}`);
    });
    
    await client.close();
    console.log('\n✅ Database seeding completed successfully!');
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

// Run the seeding if this file is executed directly
if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase };
