const express = require('express');
const Ticket = require('../models/Ticket');
const User = require('../models/User');
const TenantDataAccessLayer = require('../services/tenantDataAccess');

const router = express.Router();

// GET /api/reports/daily-stats - Get daily statistics for reporting
router.get('/daily-stats', async (req, res) => {
  try {
    const customerId = req.user.customerId;
    const tenantData = new TenantDataAccessLayer(customerId);

    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Parallel queries for better performance
    const [
      totalTickets,
      resolvedTickets,
      highPriorityTickets,
      activeUsers,
      newCustomersToday
    ] = await Promise.all([
      // Total tickets created today
      tenantData.count('tickets', {
        createdAt: { $gte: today, $lt: tomorrow }
      }),
      
      // Resolved tickets today
      tenantData.count('tickets', {
        updatedAt: { $gte: today, $lt: tomorrow },
        status: 'resolved'
      }),
      
      // High priority tickets created today
      tenantData.count('tickets', {
        createdAt: { $gte: today, $lt: tomorrow },
        priority: 'high'
      }),
      
      // Active users today (users who created or updated tickets)
      tenantData.aggregate('tickets', [
        {
          $match: {
            $or: [
              { createdAt: { $gte: today, $lt: tomorrow } },
              { updatedAt: { $gte: today, $lt: tomorrow } }
            ]
          }
        },
        {
          $group: {
            _id: null,
            uniqueUsers: { $addToSet: '$createdBy' }
          }
        },
        {
          $project: {
            count: { $size: '$uniqueUsers' }
          }
        }
      ]).then(result => result[0]?.count || 0),
      
      // New customers (for multi-tenant context, this might be tenant-specific metric)
      tenantData.count('users', {
        createdAt: { $gte: today, $lt: tomorrow },
        role: { $ne: 'system' }
      })
    ]);

    // Additional metrics
    const [
      overdueTickets,
      avgResolutionTime,
      ticketsByStatus
    ] = await Promise.all([
      // Overdue tickets count
      tenantData.count('tickets', {
        createdAt: { $lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        status: { $nin: ['closed', 'resolved'] }
      }),
      
      // Average resolution time for tickets resolved today
      tenantData.aggregate('tickets', [
        {
          $match: {
            status: 'resolved',
            resolvedAt: { $gte: today, $lt: tomorrow },
            createdAt: { $exists: true }
          }
        },
        {
          $addFields: {
            resolutionTime: {
              $subtract: ['$resolvedAt', '$createdAt']
            }
          }
        },
        {
          $group: {
            _id: null,
            avgTime: { $avg: '$resolutionTime' }
          }
        }
      ]).then(result => {
        const avgMs = result[0]?.avgTime || 0;
        return Math.round(avgMs / (1000 * 60 * 60)); // Convert to hours
      }),
      
      // Tickets by status
      tenantData.aggregate('tickets', [
        {
          $match: {
            createdAt: { $gte: today, $lt: tomorrow }
          }
        },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ])
    ]);

    // Format status breakdown
    const statusBreakdown = {};
    ticketsByStatus.forEach(item => {
      statusBreakdown[item._id] = item.count;
    });

    // Calculate key performance indicators
    const resolutionRate = totalTickets > 0 ? Math.round((resolvedTickets / totalTickets) * 100) : 0;
    const highPriorityPercentage = totalTickets > 0 ? Math.round((highPriorityTickets / totalTickets) * 100) : 0;

    const stats = {
      totalTickets,
      resolvedTickets,
      highPriorityTickets,
      activeUsers,
      newCustomers: newCustomersToday,
      overdueTickets,
      avgResolutionTimeHours: avgResolutionTime,
      resolutionRate,
      highPriorityPercentage,
      statusBreakdown,
      generatedAt: new Date().toISOString(),
      reportDate: today.toISOString().split('T')[0]
    };

    console.log(`📊 Daily stats generated for tenant ${customerId}:`, {
      totalTickets,
      resolvedTickets,
      highPriorityTickets,
      resolutionRate
    });

    res.json({
      success: true,
      data: stats,
      message: 'Daily statistics retrieved successfully'
    });

  } catch (error) {
    console.error('Error generating daily stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate daily statistics',
      code: 'STATS_GENERATION_ERROR'
    });
  }
});

// GET /api/reports/weekly-summary - Get weekly summary report
router.get('/weekly-summary', async (req, res) => {
  try {
    const customerId = req.user.customerId;
    const tenantData = new TenantDataAccessLayer(customerId);

    // Get week date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);

    const [
      weeklyTickets,
      weeklyResolved,
      weeklyHighPriority,
      performanceTrend
    ] = await Promise.all([
      tenantData.count('tickets', {
        createdAt: { $gte: startDate, $lt: endDate }
      }),
      
      tenantData.count('tickets', {
        status: 'resolved',
        resolvedAt: { $gte: startDate, $lt: endDate }
      }),
      
      tenantData.count('tickets', {
        priority: 'high',
        createdAt: { $gte: startDate, $lt: endDate }
      }),
      
      // Daily breakdown for trend analysis
      tenantData.aggregate('tickets', [
        {
          $match: {
            createdAt: { $gte: startDate, $lt: endDate }
          }
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: '$createdAt'
              }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ])
    ]);

    const summary = {
      weeklyTickets,
      weeklyResolved,
      weeklyHighPriority,
      weeklyResolutionRate: weeklyTickets > 0 ? Math.round((weeklyResolved / weeklyTickets) * 100) : 0,
      dailyTrend: performanceTrend,
      periodStart: startDate.toISOString(),
      periodEnd: endDate.toISOString(),
      generatedAt: new Date().toISOString()
    };

    res.json({
      success: true,
      data: summary,
      message: 'Weekly summary retrieved successfully'
    });

  } catch (error) {
    console.error('Error generating weekly summary:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate weekly summary',
      code: 'WEEKLY_SUMMARY_ERROR'
    });
  }
});

module.exports = router;
