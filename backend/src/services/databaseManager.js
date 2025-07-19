const mongoose = require('mongoose');

class DatabaseManager {
  constructor() {
    this.isConnected = false;
    this.connectionString = process.env.MONGODB_URI || 'mongodb://localhost:27017/flowbit';
    this.options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10, // Maximum number of connections in the connection pool
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      family: 4, // Use IPv4, skip trying IPv6
      retryWrites: true,
      writeConcern: {
        w: 'majority',
        j: true,
        wtimeout: 1000
      }
    };
  }

  /**
   * Connect to MongoDB
   */
  async connect() {
    try {
      if (this.isConnected) {
        console.log('📊 Database already connected');
        return;
      }

      console.log('🔄 Connecting to MongoDB...');
      await mongoose.connect(this.connectionString, this.options);
      
      this.isConnected = true;
      console.log('✅ Connected to MongoDB successfully');
      console.log(`📊 Database: ${mongoose.connection.db.databaseName}`);
      console.log(`🔗 Host: ${mongoose.connection.host}:${mongoose.connection.port}`);

      // Set up connection event listeners
      this.setupEventListeners();

      // Ensure indexes are created
      await this.ensureIndexes();

    } catch (error) {
      console.error('❌ MongoDB connection error:', error.message);
      throw error;
    }
  }

  /**
   * Disconnect from MongoDB
   */
  async disconnect() {
    try {
      if (!this.isConnected) {
        console.log('📊 Database not connected');
        return;
      }

      await mongoose.disconnect();
      this.isConnected = false;
      console.log('✅ Disconnected from MongoDB');
    } catch (error) {
      console.error('❌ MongoDB disconnection error:', error.message);
      throw error;
    }
  }

  /**
   * Set up connection event listeners
   */
  setupEventListeners() {
    mongoose.connection.on('connected', () => {
      console.log('📊 Mongoose connected to MongoDB');
    });

    mongoose.connection.on('error', (error) => {
      console.error('❌ Mongoose connection error:', error);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('📊 Mongoose disconnected from MongoDB');
      this.isConnected = false;
    });

    mongoose.connection.on('reconnected', () => {
      console.log('🔄 Mongoose reconnected to MongoDB');
      this.isConnected = true;
    });

    // Handle process termination
    process.on('SIGINT', async () => {
      await this.disconnect();
      process.exit(0);
    });
  }

  /**
   * Ensure database indexes are created
   */
  async ensureIndexes() {
    try {
      console.log('🔄 Creating database indexes...');
      
      // Import models to trigger index creation
      require('./User');
      require('./Ticket');

      // Create indexes
      await mongoose.connection.db.collection('users').createIndexes([
        { key: { customerId: 1, email: 1 }, unique: true, name: 'customerId_email_unique' },
        { key: { customerId: 1, role: 1 }, name: 'customerId_role' },
        { key: { email: 1 }, name: 'email' }
      ]);

      await mongoose.connection.db.collection('tickets').createIndexes([
        { key: { customerId: 1, status: 1 }, name: 'customerId_status' },
        { key: { customerId: 1, createdBy: 1 }, name: 'customerId_createdBy' },
        { key: { customerId: 1, assignedTo: 1 }, name: 'customerId_assignedTo' },
        { key: { customerId: 1, createdAt: -1 }, name: 'customerId_createdAt_desc' },
        { key: { customerId: 1, priority: 1, status: 1 }, name: 'customerId_priority_status' },
        { key: { customerId: 1, category: 1 }, name: 'customerId_category' }
      ]);

      console.log('✅ Database indexes created successfully');
    } catch (error) {
      console.warn('⚠️ Error creating indexes:', error.message);
      // Don't throw error for index creation failures
    }
  }

  /**
   * Get connection status
   */
  getStatus() {
    return {
      isConnected: this.isConnected,
      readyState: mongoose.connection.readyState,
      host: mongoose.connection.host,
      port: mongoose.connection.port,
      name: mongoose.connection.name
    };
  }

  /**
   * Health check for database
   */
  async healthCheck() {
    try {
      if (!this.isConnected) {
        return { status: 'disconnected', healthy: false };
      }

      // Try a simple operation
      await mongoose.connection.db.admin().ping();
      
      return {
        status: 'connected',
        healthy: true,
        database: mongoose.connection.db.databaseName,
        host: mongoose.connection.host,
        port: mongoose.connection.port
      };
    } catch (error) {
      return {
        status: 'error',
        healthy: false,
        error: error.message
      };
    }
  }

  /**
   * Get database statistics
   */
  async getStats() {
    try {
      if (!this.isConnected) {
        throw new Error('Database not connected');
      }

      const stats = await mongoose.connection.db.stats();
      const collections = await mongoose.connection.db.listCollections().toArray();

      return {
        database: mongoose.connection.db.databaseName,
        collections: collections.length,
        dataSize: stats.dataSize,
        storageSize: stats.storageSize,
        indexes: stats.indexes,
        objects: stats.objects
      };
    } catch (error) {
      throw new Error(`Failed to get database stats: ${error.message}`);
    }
  }

  /**
   * Clear all data (for testing purposes only)
   */
  async clearAllData() {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Cannot clear data in production environment');
    }

    try {
      console.log('🗑️ Clearing all database data...');
      await mongoose.connection.db.dropDatabase();
      console.log('✅ All data cleared successfully');
    } catch (error) {
      console.error('❌ Error clearing data:', error.message);
      throw error;
    }
  }

  /**
   * Create database backup (basic implementation)
   */
  async createBackup(tenantId = null) {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupName = tenantId 
        ? `backup-${tenantId}-${timestamp}` 
        : `backup-all-${timestamp}`;

      console.log(`📦 Creating backup: ${backupName}`);
      
      // This is a simplified backup - in production, use proper backup tools
      const collections = await mongoose.connection.db.listCollections().toArray();
      const backup = {};

      for (const collection of collections) {
        const data = tenantId 
          ? await mongoose.connection.db.collection(collection.name).find({ customerId: tenantId }).toArray()
          : await mongoose.connection.db.collection(collection.name).find({}).toArray();
        
        backup[collection.name] = data;
      }

      return {
        name: backupName,
        timestamp: new Date(),
        tenantId: tenantId || 'all',
        data: backup
      };
    } catch (error) {
      throw new Error(`Failed to create backup: ${error.message}`);
    }
  }
}

// Export singleton instance
module.exports = new DatabaseManager();
