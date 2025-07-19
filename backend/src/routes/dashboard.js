const express = require('express');
const ActivityLog = require('../models/ActivityLog');
const User = require('../models/User');
const Ticket = require('../models/Ticket');
const router = express.Router();

// GET /api/dashboard/stats - Get comprehensive dashboard statistics
router.get('/stats', async (req, res) => {
  try {
    const { customerId } = req.user;

    // Get ticket statistics
    const ticketStats = await Ticket.getStatsByTenant(customerId);
    
    // Get REAL-TIME workflow statistics from activity logs, not static ticket status
    const workflowActivities = await ActivityLog.find({ 
      customerId,
      action: { $in: ['webhook_received', 'workflow_started', 'workflow_completed', 'workflow_failed'] }
    }).sort({ timestamp: -1 });

    // Calculate actual workflow status based on recent activity
    const workflowStatusCounts = {
      pending: 0,
      processing: 0, 
      completed: 0,
      failed: 0
    };

    // Group by entityId to get latest status for each workflow
    const workflowStatusMap = new Map();
    
    workflowActivities.forEach(activity => {
      const workflowId = activity.entityId?.toString() || 'unknown';
      
      if (!workflowStatusMap.has(workflowId)) {
        // Map activity actions to workflow status
        switch (activity.action) {
          case 'webhook_received':
          case 'workflow_started':
            workflowStatusMap.set(workflowId, 'processing');
            break;
          case 'workflow_completed':
            workflowStatusMap.set(workflowId, 'completed');
            break;
          case 'workflow_failed':
            workflowStatusMap.set(workflowId, 'failed');
            break;
        }
      }
    });

    // Count the statuses
    workflowStatusMap.forEach(status => {
      if (workflowStatusCounts.hasOwnProperty(status)) {
        workflowStatusCounts[status]++;
      }
    });

    // If no real workflow data exists, show zeros instead of fake data
    if (workflowActivities.length === 0) {
      Object.keys(workflowStatusCounts).forEach(key => {
        workflowStatusCounts[key] = 0;
      });
    }

    // Get user count
    const userCount = await User.countDocuments({ customerId });

    // Get recent activity (last 10 items)
    const recentActivity = await ActivityLog.find({ customerId })
      .sort({ timestamp: -1 })
      .limit(10)
      .populate('performedBy', 'firstName lastName email')
      .populate('entityId', 'title description')
      .lean();

    // Format activity for frontend
    const formattedActivity = recentActivity.map(activity => ({
      id: activity._id,
      action: activity.action,
      description: getActivityDescription(activity),
      timestamp: activity.timestamp,
      user: activity.performedBy ? 
        `${activity.performedBy.firstName} ${activity.performedBy.lastName}` : 
        'System',
      entityType: activity.entityType,
      entityId: activity.entityId
    }));

    res.json({
      success: true,
      data: {
        tickets: {
          total: ticketStats.totalTickets,
          open: ticketStats.openTickets,
          resolved: ticketStats.resolvedTickets,
          inProgress: ticketStats.inProgressTickets || 0
        },
        workflows: {
          pending: workflowStatusCounts.pending,
          processing: workflowStatusCounts.processing,
          completed: workflowStatusCounts.completed,
          failed: workflowStatusCounts.failed,
          total: Object.values(workflowStatusCounts).reduce((a, b) => a + b, 0)
        },
        users: {
          total: userCount
        },
        activity: formattedActivity
      }
    });

  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard statistics',
      code: 'DASHBOARD_STATS_ERROR'
    });
  }
});

// GET /api/dashboard/activity - Get recent activity with pagination
router.get('/activity', async (req, res) => {
  try {
    const { customerId } = req.user;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const activities = await ActivityLog.find({ customerId })
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .populate('performedBy', 'firstName lastName email')
      .populate('entityId', 'title description')
      .lean();

    const totalActivities = await ActivityLog.countDocuments({ customerId });

    const formattedActivities = activities.map(activity => ({
      id: activity._id,
      action: activity.action,
      description: getActivityDescription(activity),
      timestamp: activity.timestamp,
      user: activity.performedBy ? 
        `${activity.performedBy.firstName} ${activity.performedBy.lastName}` : 
        'System',
      entityType: activity.entityType,
      entityId: activity.entityId,
      metadata: activity.metadata
    }));

    res.json({
      success: true,
      data: {
        activities: formattedActivities,
        pagination: {
          page,
          limit,
          total: totalActivities,
          totalPages: Math.ceil(totalActivities / limit)
        }
      }
    });

  } catch (error) {
    console.error('Error fetching activity logs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch activity logs',
      code: 'ACTIVITY_FETCH_ERROR'
    });
  }
});

// GET /api/dashboard/webhook-status - Get webhook/workflow status summary
router.get('/webhook-status', async (req, res) => {
  try {
    const { customerId } = req.user;

    // Get tickets with webhook data
    const ticketsWithWebhooks = await Ticket.find({
      customerId,
      $or: [
        { workflowStatus: { $ne: 'pending' } },
        { workflowId: { $ne: null } },
        { workflowData: { $ne: null } }
      ]
    }).select('_id title workflowStatus workflowId workflowData createdAt updatedAt').lean();

    // Get workflow activity in last 24 hours
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const recentWebhookActivity = await ActivityLog.find({
      customerId,
      action: { $in: ['workflow_started', 'workflow_completed', 'webhook_received'] },
      timestamp: { $gte: yesterday }
    }).sort({ timestamp: -1 }).limit(10).lean();

    res.json({
      success: true,
      data: {
        ticketsWithWebhooks: ticketsWithWebhooks.length,
        activeWorkflows: ticketsWithWebhooks.filter(t => t.workflowStatus === 'processing').length,
        completedWorkflows: ticketsWithWebhooks.filter(t => t.workflowStatus === 'completed').length,
        failedWorkflows: ticketsWithWebhooks.filter(t => t.workflowStatus === 'failed').length,
        recentActivity: recentWebhookActivity,
        webhookTickets: ticketsWithWebhooks
      }
    });

  } catch (error) {
    console.error('Error fetching webhook status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch webhook status',
      code: 'WEBHOOK_STATUS_ERROR'
    });
  }
});

// Helper function to generate human-readable activity descriptions
function getActivityDescription(activity) {
  const { action, entityType, performedBy, entityId, metadata } = activity;
  
  const userName = performedBy ? `${performedBy.firstName} ${performedBy.lastName}` : 'System';
  const entityName = entityId?.title || entityId?.description || `${entityType} #${entityId}`;

  switch (action) {
    case 'ticket_created':
      return `New ticket created: "${entityName}"`;
    case 'ticket_updated':
      return `Ticket updated: "${entityName}"`;
    case 'ticket_resolved':
      return `Ticket resolved: "${entityName}"`;
    case 'workflow_started':
      return `Workflow started for ticket: "${entityName}"`;
    case 'workflow_completed':
      return `Workflow completed for ticket: "${entityName}"`;
    case 'webhook_received':
      return `Webhook data received for ticket: "${entityName}"`;
    case 'user_created':
      return `New team member added: ${entityName}`;
    case 'user_login':
      return `${userName} logged in`;
    case 'assignment_created':
      return `Task assigned: "${entityName}"`;
    case 'assignment_completed':
      return `Task completed: "${entityName}"`;
    default:
      return `${action.replace(/_/g, ' ')} - ${entityName}`;
  }
}

module.exports = router;
