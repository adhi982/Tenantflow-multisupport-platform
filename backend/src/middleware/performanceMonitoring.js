/**
 * Performance Monitoring Middleware - Step 4.2
 * Provides application performance monitoring and metrics collection
 */

const os = require('os');
const process = require('process');

class PerformanceMonitor {
  constructor() {
    this.metrics = {
      requests: {
        total: 0,
        success: 0,
        error: 0,
        averageResponseTime: 0,
        slowRequests: 0
      },
      endpoints: new Map(),
      errors: new Map(),
      memory: [],
      cpu: [],
      startTime: Date.now()
    };

    // Start collecting system metrics
    this.startSystemMetricsCollection();
  }

  // Main performance monitoring middleware
  monitor() {
    return (req, res, next) => {
      const startTime = process.hrtime.bigint();
      const startMemory = process.memoryUsage();
      
      // Store timing data on request object for other middleware to use
      req.performanceStart = startTime;
      req.performanceMemory = startMemory;
      
      // Add a completion tracking function that other middleware can call
      req.trackPerformanceCompletion = () => {
        const endTime = process.hrtime.bigint();
        const duration = Number(endTime - startTime) / 1000000; // Convert to milliseconds
        const endMemory = process.memoryUsage();
        
        // Set response time header
        if (req.startTime) {
          const responseDuration = Date.now() - req.startTime;
          res.setHeader('X-Response-Time', `${responseDuration}ms`);
        }
        
        // Update request metrics
        this.updateRequestMetrics(req, res, duration, startMemory, endMemory);
      };

      next();
    };
  }

  updateRequestMetrics(req, res, duration, startMemory, endMemory) {
    // Update global metrics
    this.metrics.requests.total++;
    
    if (res.statusCode < 400) {
      this.metrics.requests.success++;
    } else {
      this.metrics.requests.error++;
    }

    // Update average response time
    const currentAvg = this.metrics.requests.averageResponseTime;
    const totalRequests = this.metrics.requests.total;
    this.metrics.requests.averageResponseTime = 
      ((currentAvg * (totalRequests - 1)) + duration) / totalRequests;

    // Track slow requests (>2 seconds)
    if (duration > 2000) {
      this.metrics.requests.slowRequests++;
      console.warn(`🐌 Slow request: ${req.method} ${req.path} - ${duration.toFixed(2)}ms`);
    }

    // Update endpoint-specific metrics
    const endpoint = `${req.method} ${req.route?.path || req.path}`;
    if (!this.metrics.endpoints.has(endpoint)) {
      this.metrics.endpoints.set(endpoint, {
        count: 0,
        totalTime: 0,
        averageTime: 0,
        minTime: Infinity,
        maxTime: 0,
        errors: 0
      });
    }

    const endpointMetrics = this.metrics.endpoints.get(endpoint);
    endpointMetrics.count++;
    endpointMetrics.totalTime += duration;
    endpointMetrics.averageTime = endpointMetrics.totalTime / endpointMetrics.count;
    endpointMetrics.minTime = Math.min(endpointMetrics.minTime, duration);
    endpointMetrics.maxTime = Math.max(endpointMetrics.maxTime, duration);
    
    if (res.statusCode >= 400) {
      endpointMetrics.errors++;
    }

    // Track error patterns
    if (res.statusCode >= 400) {
      const errorKey = `${res.statusCode} - ${req.method} ${req.path}`;
      const errorCount = this.metrics.errors.get(errorKey) || 0;
      this.metrics.errors.set(errorKey, errorCount + 1);
    }

    // Memory usage tracking
    const memoryDelta = {
      rss: endMemory.rss - startMemory.rss,
      heapUsed: endMemory.heapUsed - startMemory.heapUsed,
      heapTotal: endMemory.heapTotal - startMemory.heapTotal,
      external: endMemory.external - startMemory.external
    };

    // Alert on significant memory increases
    if (memoryDelta.heapUsed > 50 * 1024 * 1024) { // 50MB
      console.warn(`💾 High memory usage: ${req.method} ${req.path} used ${(memoryDelta.heapUsed / 1024 / 1024).toFixed(2)}MB`);
    }
  }

  startSystemMetricsCollection() {
    // Collect system metrics every 30 seconds
    setInterval(() => {
      this.collectSystemMetrics();
    }, 30000);

    // Initial collection
    this.collectSystemMetrics();
  }

  collectSystemMetrics() {
    const now = Date.now();
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    // Store memory metrics (keep last 100 entries)
    this.metrics.memory.push({
      timestamp: now,
      rss: memUsage.rss,
      heapUsed: memUsage.heapUsed,
      heapTotal: memUsage.heapTotal,
      external: memUsage.external,
      freeMemory: os.freemem(),
      totalMemory: os.totalmem()
    });

    if (this.metrics.memory.length > 100) {
      this.metrics.memory.shift();
    }

    // Store CPU metrics (keep last 100 entries)
    this.metrics.cpu.push({
      timestamp: now,
      user: cpuUsage.user,
      system: cpuUsage.system,
      loadAverage: os.loadavg()
    });

    if (this.metrics.cpu.length > 100) {
      this.metrics.cpu.shift();
    }

    // Check for concerning metrics
    this.checkHealthThresholds();
  }

  checkHealthThresholds() {
    const memUsage = process.memoryUsage();
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const memoryUsagePercent = ((totalMemory - freeMemory) / totalMemory) * 100;

    // Alert on high memory usage
    if (memoryUsagePercent > 90) {
      console.warn(`⚠️ High system memory usage: ${memoryUsagePercent.toFixed(1)}%`);
    }

    // Alert on high heap usage
    const heapUsagePercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
    if (heapUsagePercent > 85) {
      console.warn(`⚠️ High heap usage: ${heapUsagePercent.toFixed(1)}%`);
    }

    // Alert on too many errors
    const errorRate = this.metrics.requests.error / this.metrics.requests.total;
    if (errorRate > 0.1 && this.metrics.requests.total > 100) {
      console.warn(`⚠️ High error rate: ${(errorRate * 100).toFixed(1)}%`);
    }
  }

  // Get current metrics (API endpoint)
  getMetrics() {
    return (req, res) => {
      const now = Date.now();
      const uptime = now - this.metrics.startTime;
      const memUsage = process.memoryUsage();
      
      // Convert endpoint metrics Map to object
      const endpointMetrics = {};
      for (const [endpoint, metrics] of this.metrics.endpoints) {
        endpointMetrics[endpoint] = {
          ...metrics,
          averageTime: Math.round(metrics.averageTime * 100) / 100,
          minTime: metrics.minTime === Infinity ? 0 : Math.round(metrics.minTime * 100) / 100,
          maxTime: Math.round(metrics.maxTime * 100) / 100
        };
      }

      // Convert error metrics Map to object
      const errorMetrics = {};
      for (const [error, count] of this.metrics.errors) {
        errorMetrics[error] = count;
      }

      const response = {
        success: true,
        data: {
          timestamp: new Date().toISOString(),
          uptime: `${Math.floor(uptime / 1000)}s`,
          requests: {
            ...this.metrics.requests,
            averageResponseTime: Math.round(this.metrics.requests.averageResponseTime * 100) / 100,
            successRate: this.metrics.requests.total > 0 
              ? Math.round((this.metrics.requests.success / this.metrics.requests.total) * 10000) / 100
              : 0
          },
          endpoints: endpointMetrics,
          errors: errorMetrics,
          memory: {
            current: {
              rss: `${Math.round(memUsage.rss / 1024 / 1024)}MB`,
              heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
              heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
              external: `${Math.round(memUsage.external / 1024 / 1024)}MB`
            },
            system: {
              free: `${Math.round(os.freemem() / 1024 / 1024)}MB`,
              total: `${Math.round(os.totalmem() / 1024 / 1024)}MB`,
              usage: `${Math.round(((os.totalmem() - os.freemem()) / os.totalmem()) * 100)}%`
            }
          },
          cpu: {
            loadAverage: os.loadavg(),
            cores: os.cpus().length
          },
          system: {
            platform: os.platform(),
            arch: os.arch(),
            nodeVersion: process.version,
            pid: process.pid
          }
        }
      };

      res.json(response);
    };
  }

  // Get performance health status
  getHealthStatus() {
    return (req, res) => {
      const memUsage = process.memoryUsage();
      const totalMemory = os.totalmem();
      const freeMemory = os.freemem();
      const memoryUsagePercent = ((totalMemory - freeMemory) / totalMemory) * 100;
      const heapUsagePercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
      const errorRate = this.metrics.requests.total > 0 
        ? this.metrics.requests.error / this.metrics.requests.total 
        : 0;

      // Determine overall health
      let status = 'healthy';
      const issues = [];

      if (memoryUsagePercent > 90) {
        status = 'critical';
        issues.push('High system memory usage');
      } else if (memoryUsagePercent > 75) {
        status = 'warning';
        issues.push('Elevated system memory usage');
      }

      if (heapUsagePercent > 85) {
        status = 'critical';
        issues.push('High heap usage');
      } else if (heapUsagePercent > 70) {
        status = status === 'critical' ? 'critical' : 'warning';
        issues.push('Elevated heap usage');
      }

      if (errorRate > 0.2) {
        status = 'critical';
        issues.push('High error rate');
      } else if (errorRate > 0.1) {
        status = status === 'critical' ? 'critical' : 'warning';
        issues.push('Elevated error rate');
      }

      if (this.metrics.requests.averageResponseTime > 5000) {
        status = 'critical';
        issues.push('High average response time');
      } else if (this.metrics.requests.averageResponseTime > 2000) {
        status = status === 'critical' ? 'critical' : 'warning';
        issues.push('Elevated average response time');
      }

      res.json({
        success: true,
        data: {
          status,
          issues,
          metrics: {
            memoryUsage: Math.round(memoryUsagePercent * 100) / 100,
            heapUsage: Math.round(heapUsagePercent * 100) / 100,
            errorRate: Math.round(errorRate * 10000) / 100,
            averageResponseTime: Math.round(this.metrics.requests.averageResponseTime * 100) / 100,
            totalRequests: this.metrics.requests.total
          }
        }
      });
    };
  }

  // Reset metrics (admin only)
  resetMetrics() {
    return (req, res) => {
      this.metrics = {
        requests: {
          total: 0,
          success: 0,
          error: 0,
          averageResponseTime: 0,
          slowRequests: 0
        },
        endpoints: new Map(),
        errors: new Map(),
        memory: [],
        cpu: [],
        startTime: Date.now()
      };

      res.json({
        success: true,
        message: 'Performance metrics have been reset'
      });
    };
  }
}

module.exports = new PerformanceMonitor();
