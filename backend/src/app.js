const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const ticketRoutes = require('./routes/tickets');
const webhookRoutes = require('./routes/webhooks');
const reportRoutes = require('./routes/reports');
const dashboardRoutes = require('./routes/dashboard');

// Import middleware
const { protectAdminRoutes, authenticate } = require('./middleware/auth');
const TenantIsolationMiddleware = require('./middleware/tenantIsolation');

// Step 4.2: Advanced Middleware - Temporarily disabled for debugging
// const RequestLogger = require('./middleware/requestLogging');
// const InputSanitizer = require('./middleware/inputSanitization');
// const PerformanceMonitor = require('./middleware/performanceMonitoring');
// const ErrorHandler = require('./middleware/errorHandling');
// const ResponseFormatter = require('./middleware/responseFormatting');

// Step 4.3: Enhanced API Security - Temporarily disabled for debugging
// const CSRFProtection = require('./middleware/csrfProtection');
// const APISecurityEnhancement = require('./middleware/apiSecurity');

class App {
  constructor() {
    this.app = express();
    this.port = process.env.PORT || 5000;
    
    // Setup uncaught exception handlers - Temporarily disabled
    // ErrorHandler.setupUncaughtExceptionHandlers();
    
    this.initializeDatabase();
    this.initializeMiddleware();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  async initializeDatabase() {
    try {
      const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/flowbit';
      
      await mongoose.connect(mongoUri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      });

      console.log('✅ Connected to MongoDB successfully');
      
      // Log database name for verification
      console.log(`📊 Database: ${mongoose.connection.db.databaseName}`);

    } catch (error) {
      console.error('❌ MongoDB connection error:', error.message);
      process.exit(1);
    }
  }

  initializeMiddleware() {
    // Step 4.3: Enhanced API Security (must be very early) - Temporarily disabled
    // this.app.use(APISecurityEnhancement.setSecurityHeaders());
    // this.app.use(APISecurityEnhancement.securityAuditLog());
    // this.app.use(APISecurityEnhancement.detectAdvancedThreats());

    // Step 4.2: Advanced Response Formatting (must be early) - Temporarily disabled
    // this.app.use(ResponseFormatter.createStack());

    // Step 4.2: Performance Monitoring - Temporarily disabled
    // this.app.use(PerformanceMonitor.monitor());

    // Step 4.2: Advanced Request Logging - Temporarily disabled
    // this.app.use(RequestLogger.middleware());

    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
          fontSrc: ["'self'", "https://fonts.gstatic.com"],
          imgSrc: ["'self'", "data:", "https:"],
          scriptSrc: ["'self'"],
          connectSrc: ["'self'", "ws:", "wss:"]
        }
      },
      crossOriginEmbedderPolicy: false
    }));

    // CORS configuration
    this.app.use(cors({
      origin: (origin, callback) => {
        // Allow requests from development servers and production domains
        const allowedOrigins = [
          'http://localhost:3000',  // Frontend shell
          'http://localhost:3001',  // Tickets micro-frontend
          'http://localhost:8080',  // n8n
          'http://localhost:4040',  // ngrok inspector
          process.env.FRONTEND_URL
        ].filter(Boolean);

        // Allow requests with no origin (mobile apps, Postman, etc.)
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'x-tenant-id', 'x-csrf-token', 'api-version']
    }));

    // Body parsing middleware
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    this.app.use(cookieParser());

    // Step 4.2: Input Sanitization (after body parsing) - Temporarily disabled
    // this.app.use(InputSanitizer.sanitizeInput());
    // this.app.use(InputSanitizer.validateEmail());
    // this.app.use(InputSanitizer.validateObjectIds());
    // this.app.use(InputSanitizer.preventSQLInjection());

    // Compression middleware
    this.app.use(compression());

    // Step 4.2: Enhanced Rate Limiting - Temporarily disabled
    // if (process.env.NODE_ENV !== 'test') {
    //   const rateLimiters = InputSanitizer.createRateLimiters();
    //   this.app.use('/api/', rateLimiters.api);
    //   this.app.use('/auth/', rateLimiters.auth);
    //   this.app.use('/upload/', rateLimiters.upload);
    // }

    // Logging middleware (keep existing morgan for compatibility)
    const logFormat = process.env.NODE_ENV === 'production' 
      ? 'combined' 
      : 'dev';
    this.app.use(morgan(logFormat));

    // Request ID middleware for tracing
    this.app.use((req, res, next) => {
      req.id = require('crypto').randomBytes(16).toString('hex');
      res.setHeader('X-Request-ID', req.id);
      next();
    });

    // Tenant ID header middleware
    this.app.use((req, res, next) => {
      const tenantId = req.headers['x-tenant-id'];
      if (tenantId) {
        req.tenantId = tenantId;
      }
      next();
    });

    // Admin route protection middleware
    this.app.use(protectAdminRoutes);
  }

  initializeRoutes() {
    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.status(200).json({
        success: true,
        service: 'FlowBit Platform API',
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
      });
    });

    // API documentation endpoint
    this.app.get('/api-docs', (req, res) => {
      res.status(200).json({
        success: true,
        service: 'FlowBit Platform API',
        version: '1.0.0',
        documentation: {
          authentication: '/auth/routes',
          baseUrl: `${req.protocol}://${req.get('host')}`,
          endpoints: [
            'GET /health - Service health check',
            'GET /api-docs - API documentation',
            'POST /auth/login - User authentication',
            'GET /me - Current user info',
            'GET /me/screens - Tenant screen config',
            'GET /api/tickets - List tickets (tenant-filtered)',
            'POST /api/tickets - Create ticket + trigger n8n',
            'PUT /api/tickets/:id - Update ticket',
            'POST /webhook/ticket-done - n8n callback endpoint'
          ]
        }
      });
    });

    // Mount authentication routes
    this.app.use('/auth', authRoutes);

    // Mount webhook routes (public for n8n integration)
    // Step 4.3: Add webhook signature validation - Temporarily disabled
    // const webhookSecret = process.env.WEBHOOK_SECRET || 'flowbit-webhook-secret-2025';
    // this.app.use('/webhook', APISecurityEnhancement.validateRequestSignature(webhookSecret));
    this.app.use('/webhook', webhookRoutes);

    // Mount protected user routes
    this.app.use('/me', authenticate, userRoutes);

    // Mount protected ticket routes with tenant isolation
    this.app.use('/api/tickets', authenticate, TenantIsolationMiddleware.tenantIsolation, ticketRoutes);

    // Mount protected reports routes with tenant isolation
    this.app.use('/api/reports', authenticate, TenantIsolationMiddleware.tenantIsolation, reportRoutes);

    // Mount protected dashboard routes with tenant isolation
    this.app.use('/api/dashboard', authenticate, TenantIsolationMiddleware.tenantIsolation, dashboardRoutes);

    // Step 4.2: Admin monitoring endpoints (protected) - Temporarily disabled
    // this.app.get('/admin/metrics', authenticate, PerformanceMonitor.getMetrics());
    // this.app.get('/admin/health-status', authenticate, PerformanceMonitor.getHealthStatus());
    // this.app.post('/admin/metrics/reset', authenticate, PerformanceMonitor.resetMetrics());
    // this.app.get('/admin/logs', authenticate, RequestLogger.getLogsEndpoint());
    // this.app.get('/admin/errors', authenticate, ErrorHandler.getErrorStats());

    // Step 4.3: Security Admin Endpoints - Temporarily disabled
    // this.app.get('/admin/csrf-token', CSRFProtection.getTokenEndpoint());
    // this.app.get('/admin/csrf-stats', authenticate, CSRFProtection.getStatsEndpoint());
    // this.app.get('/admin/security-stats', authenticate, APISecurityEnhancement.getSecurityStatsEndpoint());

    // API root endpoint
    this.app.get('/api', (req, res) => {
      res.status(200).json({
        success: true,
        message: 'FlowBit Platform API',
        version: '1.0.0',
        endpoints: {
          auth: '/auth',
          health: '/health',
          docs: '/api-docs',
          admin: '/admin (requires authentication)'
        }
      });
    });

    // Catch-all for undefined routes
    this.app.use('*', (req, res) => {
      res.status(404).json({
        success: false,
        message: 'Route not found',
        path: req.originalUrl
      });
    });
  }

  initializeErrorHandling() {
    // Step 4.2: Enhanced Error Handler - Temporarily disabled
    // this.app.use(ErrorHandler.handleErrors());

    // Basic error handling
    this.app.use((err, req, res, next) => {
      console.error('Error:', err);
      res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal Server Error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
      });
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      console.error('Uncaught Exception:', error);
      process.exit(1);
    });

    // Graceful shutdown
    process.on('SIGTERM', this.shutdown.bind(this));
    process.on('SIGINT', this.shutdown.bind(this));
  }

  async shutdown() {
    console.log('🔄 Shutting down gracefully...');
    
    try {
      await mongoose.connection.close();
      console.log('✅ Database connection closed');
      process.exit(0);
    } catch (error) {
      console.error('❌ Error during shutdown:', error);
      process.exit(1);
    }
  }

  listen() {
    this.app.listen(this.port, () => {
      console.log(`🚀 FlowBit Platform API running on port ${this.port}`);
      console.log(`📖 API Documentation: http://localhost:${this.port}/api-docs`);
      console.log(`🔐 Auth Routes: http://localhost:${this.port}/auth/routes`);
      console.log(`💚 Health Check: http://localhost:${this.port}/health`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  }

  getApp() {
    return this.app;
  }
}

module.exports = App;
