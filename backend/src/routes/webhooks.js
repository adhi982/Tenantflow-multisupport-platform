const express = require('express');
const crypto = require('crypto');
const Ticket = require('../models/Ticket');
const ActivityLog = require('../models/ActivityLog');

const router = express.Router();

// Simple N8N callback endpoint (no signature verification for testing)
router.post('/n8n-callback', async (req, res) => {
  try {
    console.log('🔄 N8N Callback received:', req.body);
    
    const {
      ticketId,
      workflowId,
      status = 'processing',
      data = {},
      metadata = {}
    } = req.body;

    // If ticketId is provided, update the ticket
    if (ticketId) {
      try {
        const ticket = await Ticket.findById(ticketId);
        if (ticket) {
          const oldStatus = ticket.workflowStatus;
          ticket.workflowStatus = status;
          ticket.workflowId = workflowId || ticket.workflowId;
          ticket.workflowData = { ...ticket.workflowData, ...data };
          await ticket.save();
          console.log(`✅ Updated ticket ${ticketId} with workflow status: ${status}`);

          // Log the webhook activity
          await ActivityLog.create({
            action: 'webhook_received',
            entityType: 'ticket',
            entityId: ticketId,
            customerId: ticket.customerId,
            performedBy: null, // System action
            details: `Webhook updated ticket status from ${oldStatus} to ${status}`,
            metadata: {
              workflowId,
              oldStatus,
              newStatus: status,
              webhookData: data,
              metadata
            }
          });

          // Log specific workflow actions
          if (status === 'completed' && oldStatus !== 'completed') {
            await ActivityLog.create({
              action: 'workflow_completed',
              entityType: 'ticket',
              entityId: ticketId,
              customerId: ticket.customerId,
              performedBy: null,
              details: `Workflow completed for ticket: ${ticket.title}`,
              metadata: { workflowId, completionData: data }
            });
          } else if (status === 'failed' && oldStatus !== 'failed') {
            await ActivityLog.create({
              action: 'workflow_failed',
              entityType: 'ticket',
              entityId: ticketId,
              customerId: ticket.customerId,
              performedBy: null,
              details: `Workflow failed for ticket: ${ticket.title}`,
              metadata: { workflowId, failureData: data }
            });
          }
        }
      } catch (error) {
        console.log(`⚠️ Could not update ticket ${ticketId}:`, error.message);
      }
    }

    // Always return success for N8N
    res.status(200).json({
      success: true,
      message: 'N8N callback received successfully',
      data: {
        ticketId,
        workflowId,
        status,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ N8N callback error:', error);
    res.status(200).json({
      success: false,
      message: 'N8N callback processed with errors',
      error: error.message
    });
  }
});

// Webhook signature verification middleware
const verifyWebhookSignature = (req, res, next) => {
  // Skip signature verification in development if secret is not set
  if (process.env.NODE_ENV === 'development' && !process.env.WEBHOOK_SECRET) {
    console.log('⚠️  Webhook signature verification skipped in development');
    return next();
  }

  const signature = req.headers['x-webhook-signature'];
  const webhookSecret = process.env.WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('Webhook secret not configured');
    return res.status(500).json({
      success: false,
      error: 'Webhook not properly configured',
      code: 'WEBHOOK_CONFIG_ERROR'
    });
  }

  if (!signature) {
    return res.status(401).json({
      success: false,
      error: 'Missing webhook signature',
      code: 'MISSING_SIGNATURE'
    });
  }

  try {
    const payload = JSON.stringify(req.body);
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(payload)
      .digest('hex');

    const receivedSignature = signature.replace('sha256=', '');

    if (!crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'hex'),
      Buffer.from(receivedSignature, 'hex')
    )) {
      console.error('Invalid webhook signature');
      return res.status(401).json({
        success: false,
        error: 'Invalid webhook signature',
        code: 'INVALID_SIGNATURE'
      });
    }

    next();
  } catch (error) {
    console.error('Webhook signature verification error:', error);
    return res.status(401).json({
      success: false,
      error: 'Webhook signature verification failed',
      code: 'SIGNATURE_VERIFICATION_ERROR'
    });
  }
};

// POST /webhook/ticket-done - n8n workflow completion callback
router.post('/ticket-done', verifyWebhookSignature, async (req, res) => {
  try {
    const {
      ticketId,
      workflowId,
      status,
      data = {},
      metadata = {}
    } = req.body;

    // Validate required fields
    if (!ticketId || !workflowId || !status) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: ticketId, workflowId, status',
        code: 'MISSING_REQUIRED_FIELDS'
      });
    }

    // Validate status
    const validStatuses = ['completed', 'failed', 'processing'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
        code: 'INVALID_STATUS'
      });
    }

    // Find and update ticket
    const ticket = await Ticket.findById(ticketId);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        error: 'Ticket not found',
        code: 'TICKET_NOT_FOUND'
      });
    }

    // Verify workflow ID matches
    if (ticket.workflowId !== workflowId) {
      console.error(`Workflow ID mismatch: expected ${ticket.workflowId}, got ${workflowId}`);
      return res.status(400).json({
        success: false,
        error: 'Workflow ID mismatch',
        code: 'WORKFLOW_ID_MISMATCH'
      });
    }

    // Update ticket with workflow results
    const updateData = {
      workflowStatus: status,
      workflowData: {
        ...ticket.workflowData,
        ...data,
        lastUpdate: new Date().toISOString(),
        completedAt: status === 'completed' ? new Date().toISOString() : null
      },
      updatedAt: new Date()
    };

    // Handle successful workflow completion
    if (status === 'completed') {
      // Auto-update ticket status based on workflow results
      if (data.autoResolve === true) {
        updateData.status = 'resolved';
        updateData.resolvedAt = new Date();
      } else if (data.suggestedStatus) {
        updateData.status = data.suggestedStatus;
      }

      // Add workflow completion note
      if (data.completionNote) {
        updateData.description = ticket.description + 
          `\n\n--- Workflow Completion ---\n${data.completionNote}`;
      }
    }

    // Handle failed workflow
    if (status === 'failed') {
      updateData.workflowData.error = data.error || 'Workflow failed';
      updateData.workflowData.failedAt = new Date().toISOString();
      
      // Optionally add failure note to ticket
      if (data.failureNote) {
        updateData.description = ticket.description + 
          `\n\n--- Workflow Failed ---\n${data.failureNote}`;
      }
    }

    const updatedTicket = await Ticket.findByIdAndUpdate(
      ticketId,
      updateData,
      { 
        new: true,
        runValidators: true
      }
    );

    // Log the webhook event
    console.log(`🔄 Webhook processed: Ticket ${ticketId} workflow ${workflowId} ${status}`);
    
    // TODO: In a real implementation, you might want to:
    // 1. Send real-time updates to frontend via WebSocket
    // 2. Send email notifications if configured
    // 3. Trigger additional workflows based on results
    // 4. Update external systems

    res.json({
      success: true,
      message: 'Webhook processed successfully',
      data: {
        ticketId,
        workflowId,
        status,
        updatedAt: updatedTicket.updatedAt,
        ticket: {
          id: updatedTicket._id,
          status: updatedTicket.status,
          workflowStatus: updatedTicket.workflowStatus
        }
      }
    });

  } catch (error) {
    console.error('Webhook processing error:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: 'Invalid ticket ID format',
        code: 'INVALID_ID'
      });
    }

    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        code: 'VALIDATION_ERROR',
        details: Object.values(error.errors).map(err => err.message)
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to process webhook',
      code: 'WEBHOOK_PROCESSING_ERROR'
    });
  }
});

// POST /webhook/ticket-update - Generic ticket update webhook
router.post('/ticket-update', verifyWebhookSignature, async (req, res) => {
  try {
    const {
      ticketId,
      workflowId,
      updates = {},
      source = 'n8n'
    } = req.body;

    if (!ticketId) {
      return res.status(400).json({
        success: false,
        error: 'ticketId is required',
        code: 'MISSING_TICKET_ID'
      });
    }

    // Find ticket
    const ticket = await Ticket.findById(ticketId);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        error: 'Ticket not found',
        code: 'TICKET_NOT_FOUND'
      });
    }

    // Apply updates
    const allowedFields = ['status', 'priority', 'assignedTo', 'tags'];
    const updateData = {
      updatedAt: new Date(),
      workflowData: {
        ...ticket.workflowData,
        lastExternalUpdate: new Date().toISOString(),
        source
      }
    };

    // Filter and apply allowed updates
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        updateData[field] = updates[field];
      }
    }

    // Handle status changes
    if (updateData.status && updateData.status !== ticket.status) {
      if (updateData.status === 'resolved' || updateData.status === 'closed') {
        updateData.resolvedAt = new Date();
      }
    }

    const updatedTicket = await Ticket.findByIdAndUpdate(
      ticketId,
      updateData,
      { 
        new: true,
        runValidators: true
      }
    );

    console.log(`🔄 Ticket updated via webhook: ${ticketId} from ${source}`);

    res.json({
      success: true,
      message: 'Ticket updated successfully',
      data: {
        ticketId,
        workflowId,
        source,
        updatedFields: Object.keys(updateData).filter(key => 
          key !== 'updatedAt' && key !== 'workflowData'
        ),
        ticket: {
          id: updatedTicket._id,
          status: updatedTicket.status,
          updatedAt: updatedTicket.updatedAt
        }
      }
    });

  } catch (error) {
    console.error('Ticket update webhook error:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: 'Invalid ticket ID format',
        code: 'INVALID_ID'
      });
    }

    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        code: 'VALIDATION_ERROR',
        details: Object.values(error.errors).map(err => err.message)
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to update ticket',
      code: 'TICKET_UPDATE_ERROR'
    });
  }
});

// POST /webhook/n8n-callback - N8N workflow completion callback
router.post('/n8n-callback', verifyWebhookSignature, async (req, res) => {
  try {
    const {
      ticketId,
      action,
      timestamp,
      status,
      priority,
      metadata = {}
    } = req.body;

    console.log(`📥 N8N Callback received: ${action} for ticket ${ticketId}`);

    // Validate required fields
    if (!ticketId || !action) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: ticketId, action',
        code: 'MISSING_REQUIRED_FIELDS'
      });
    }

    // Find the ticket
    const ticket = await Ticket.findById(ticketId);
    if (!ticket) {
      return res.status(404).json({
        success: false,
        error: 'Ticket not found',
        code: 'TICKET_NOT_FOUND'
      });
    }

    // Update ticket based on N8N action
    const updateData = {
      workflowData: {
        ...ticket.workflowData,
        lastN8NAction: action,
        lastN8NTimestamp: timestamp || new Date().toISOString(),
        n8nStatus: status || 'processed',
        metadata
      },
      updatedAt: new Date()
    };

    // Handle different N8N actions
    switch (action) {
      case 'processed':
        updateData.workflowData.processed = true;
        updateData.workflowData.processedAt = new Date().toISOString();
        
        // For high priority tickets that were processed, add a note
        if (priority === 'high') {
          updateData.description = ticket.description + 
            '\n\n--- N8N Processing Complete ---\nHigh priority ticket processed. Notifications sent to team.';
        }
        break;
        
      case 'notification_sent':
        updateData.workflowData.notificationsSent = true;
        updateData.workflowData.notificationTimestamp = timestamp;
        break;
        
      case 'team_alerted':
        updateData.workflowData.teamAlerted = true;
        updateData.workflowData.teamAlertTimestamp = timestamp;
        break;
        
      default:
        updateData.workflowData.customAction = action;
    }

    const updatedTicket = await Ticket.findByIdAndUpdate(
      ticketId,
      updateData,
      { 
        new: true,
        runValidators: true
      }
    );

    console.log(`✅ N8N Callback processed: Ticket ${ticketId} action ${action}`);

    res.json({
      success: true,
      message: 'N8N callback processed successfully',
      data: {
        ticketId,
        action,
        status,
        timestamp: timestamp || new Date().toISOString(),
        ticket: {
          id: updatedTicket._id,
          status: updatedTicket.status,
          workflowData: updatedTicket.workflowData
        }
      }
    });

  } catch (error) {
    console.error('N8N callback processing error:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: 'Invalid ticket ID format',
        code: 'INVALID_ID'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to process N8N callback',
      code: 'N8N_CALLBACK_ERROR'
    });
  }
});

// GET /webhook/health - Webhook health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    service: 'FlowBit Webhooks',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    availableEndpoints: [
      'POST /webhook/ticket-done',
      'POST /webhook/ticket-update',
      'POST /webhook/n8n-callback',
      'GET /webhook/health'
    ],
    security: {
      signatureVerification: !!process.env.WEBHOOK_SECRET,
      environment: process.env.NODE_ENV || 'development'
    }
  });
});

module.exports = router;
