const bcrypt = require('bcrypt');
const mongoose = require('mongoose');

// Connect to MongoDB
const mongoUri = process.env.MONGODB_URI || 'mongodb://admin:password123@mongodb:27017/flowbit?authSource=admin';

async function seedUsers() {
  try {
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Simple user schema for seeding
    const userSchema = new mongoose.Schema({
      email: String,
      passwordHash: String,
      customerId: String,
      role: String,
      firstName: String,
      lastName: String,
      isActive: Boolean,
      isEmailVerified: Boolean,
      createdAt: Date,
      updatedAt: Date
    });

    const User = mongoose.model('User', userSchema);

    // Check if users already exist
    const count = await User.countDocuments();
    console.log(`📊 Found ${count} existing users`);
    
    // Clear existing users and recreate
    if (count > 0) {
      await User.deleteMany({});
      console.log('🗑️ Cleared existing users');
    }

    // Create default users
    const users = [
      {
        email: 'admin@logisticsco.com',
        passwordHash: await bcrypt.hash('admin123', 12),
        customerId: 'logistics-co',
        role: 'Admin',
        firstName: 'Admin',
        lastName: 'User',
        isActive: true,
        isEmailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        email: 'support1@logisticsco.com',
        passwordHash: await bcrypt.hash('user123', 12),
        customerId: 'logistics-co',
        role: 'User',
        firstName: 'John',
        lastName: 'Smith',
        isActive: true,
        isEmailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        email: 'admin@retailgmbh.de',
        passwordHash: await bcrypt.hash('admin123', 12),
        customerId: 'retail-gmbh',
        role: 'Admin',
        firstName: 'Admin',
        lastName: 'User',
        isActive: true,
        isEmailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        email: 'support1@retailgmbh.de',
        passwordHash: await bcrypt.hash('user123', 12),
        customerId: 'retail-gmbh',
        role: 'User',
        firstName: 'Maria',
        lastName: 'Garcia',
        isActive: true,
        isEmailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    await User.insertMany(users);
    console.log('👥 Created 4 default users');
    console.log('\n📋 Login Credentials:');
    console.log('===================');
    console.log('🔐 admin@logisticsco.com / admin123 (logistics-co)');
    console.log('🔐 support1@logisticsco.com / user123 (logistics-co)');
    console.log('🔐 admin@retailgmbh.de / admin123 (retail-gmbh)');
    console.log('🔐 support1@retailgmbh.de / user123 (retail-gmbh)');

    await mongoose.disconnect();
    console.log('\n✅ Seeding completed!');

  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
}

seedUsers();
