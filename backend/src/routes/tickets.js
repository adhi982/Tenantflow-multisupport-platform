const express = require('express');
const axios = require('axios');
const Ticket = require('../models/Ticket');
const User = require('../models/User');
const TenantDataAccessLayer = require('../services/tenantDataAccess');

const router = express.Router();

// GET /api/tickets - List tickets (tenant-filtered with pagination and filtering)
router.get('/', async (req, res) => {
  try {
    const customerId = req.user.customerId;
    const tenantData = new TenantDataAccessLayer(customerId);

    // Parse query parameters
    const {
      page = 1,
      limit = 10,
      status,
      priority,
      category,
      assignedTo,
      createdBy,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = {};
    
    // Role-based filtering: Users can only see their own tickets
    if (req.user.role !== 'Admin' && req.user.role !== 'admin') {
      filter.createdBy = req.user.id;
    }
    
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (category) filter.category = category;
    if (assignedTo) filter.assignedTo = assignedTo;
    if (createdBy && (req.user.role === 'Admin' || req.user.role === 'admin')) {
      filter.createdBy = createdBy; // Only admins can filter by other users
    }
    
    // Add search functionality
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Get paginated tickets
    const result = await tenantData.tickets.paginate({
      page: parseInt(page),
      limit: parseInt(limit),
      filter,
      sort
    });

    res.json({
      success: true,
      data: {
        tickets: result.tickets,
        pagination: result.pagination,
        filters: {
          status,
          priority,
          category,
          assignedTo,
          createdBy,
          search
        },
        sort: {
          field: sortBy,
          order: sortOrder
        }
      }
    });

  } catch (error) {
    console.error('Error fetching tickets:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch tickets',
      code: 'TICKETS_FETCH_ERROR'
    });
  }
});

// GET /api/tickets/stats - Get ticket statistics for tenant
router.get('/stats', async (req, res) => {
  try {
    const customerId = req.user.customerId;
    const stats = await Ticket.getStatsByTenant(customerId);

    res.json({
      success: true,
      data: {
        statistics: stats,
        generatedAt: new Date().toISOString(),
        tenant: customerId
      }
    });

  } catch (error) {
    console.error('Error fetching ticket statistics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch statistics',
      code: 'STATS_FETCH_ERROR'
    });
  }
});

// GET /api/tickets/:id - Get ticket details
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const customerId = req.user.customerId;

    const ticket = await Ticket.findOne({ 
      _id: id, 
      customerId 
    })
    .populate('createdBy', 'firstName lastName email role')
    .populate('assignedTo', 'firstName lastName email role')
    .lean();

    if (!ticket) {
      return res.status(404).json({
        success: false,
        error: 'Ticket not found',
        code: 'TICKET_NOT_FOUND'
      });
    }

    // Add computed fields
    const enrichedTicket = {
      ...ticket,
      age: ticket.ageInDays,
      isOverdue: ticket.ageInDays > 7 && ticket.status !== 'closed',
      canEdit: req.user.role === 'Admin' || ticket.createdBy._id.toString() === req.user.id,
      workflow: {
        status: ticket.workflowStatus,
        id: ticket.workflowId,
        hasData: ticket.workflowData && Object.keys(ticket.workflowData).length > 0
      }
    };

    res.json({
      success: true,
      data: {
        ticket: enrichedTicket
      }
    });

  } catch (error) {
    console.error('Error fetching ticket:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: 'Invalid ticket ID format',
        code: 'INVALID_ID'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to fetch ticket',
      code: 'TICKET_FETCH_ERROR'
    });
  }
});

// POST /api/tickets - Create new ticket + trigger n8n workflow
router.post('/', async (req, res) => {
  try {
    console.log('=== TICKET CREATION REQUEST ===');
    console.log('Request body:', req.body);
    console.log('User:', req.user ? { id: req.user.id, role: req.user.role, customerId: req.user.customerId } : 'No user');
    
    const {
      title,
      description,
      priority = 'medium',
      category = 'general',
      assignedTo,
      tags = []
    } = req.body;

    console.log('Extracted values:', {
      title: title,
      titleLength: title ? title.length : 'undefined',
      description: description,
      descriptionLength: description ? description.length : 'undefined',
      priority,
      category
    });

    // Validate required fields
    if (!title || !description) {
      console.log('Missing required fields validation failed');
      return res.status(400).json({
        success: false,
        error: 'Title and description are required',
        code: 'MISSING_REQUIRED_FIELDS'
      });
    }

    // Enhanced validation with detailed logging
    if (title.trim().length < 3) {
      console.log(`Title too short: "${title}" (${title.trim().length} chars)`);
      return res.status(400).json({
        success: false,
        error: `Title must be at least 3 characters long. Received: "${title}" (${title.trim().length} characters)`,
        code: 'TITLE_TOO_SHORT'
      });
    }

    if (description.trim().length < 10) {
      console.log(`Description too short: "${description}" (${description.trim().length} chars)`);
      return res.status(400).json({
        success: false,
        error: `Description must be at least 10 characters long. Received: "${description}" (${description.trim().length} characters)`,
        code: 'DESCRIPTION_TOO_SHORT'
      });
    }

    // Validate assignedTo user exists in tenant if provided
    if (assignedTo) {
      const assigneeExists = await User.findOne({
        _id: assignedTo,
        customerId: req.user.customerId,
        isActive: true
      });

      if (!assigneeExists) {
        return res.status(400).json({
          success: false,
          error: 'Assigned user not found in your organization',
          code: 'INVALID_ASSIGNEE'
        });
      }
    }

    // Create ticket
    const ticketData = {
      customerId: req.user.customerId,
      title: title.trim(),
      description: description.trim(),
      status: 'open',
      priority,
      category,
      createdBy: req.user.id,
      assignedTo: assignedTo || null,
      tags: Array.isArray(tags) ? tags.filter(tag => tag.trim()) : [],
      workflowStatus: 'pending',
      workflowId: null,
      workflowData: {},
      metadata: {
        userAgent: req.headers['user-agent'] || 'unknown',
        ipAddress: req.ip || req.connection.remoteAddress || 'unknown',
        source: 'web'
      }
    };

    const ticket = new Ticket(ticketData);
    await ticket.save();

    // Populate references for response
    await ticket.populate('createdBy', 'firstName lastName email role');
    if (ticket.assignedTo) {
      await ticket.populate('assignedTo', 'firstName lastName email role');
    }

    // 🚀 TRIGGER N8N WORKFLOW - REAL IMPLEMENTATION
    console.log(`📝 New ticket created: ${ticket._id} (${ticket.customerId}) - triggering n8n workflow`);

    const triggerN8nWorkflow = async () => {
      try {
        const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL;
        
        if (!n8nWebhookUrl) {
          console.log('⚠️  N8N_WEBHOOK_URL not configured, skipping workflow trigger');
          return;
        }

        // Prepare webhook payload
        const webhookPayload = {
          id: ticket._id.toString(),
          customerId: ticket.customerId,
          title: ticket.title,
          description: ticket.description,
          priority: ticket.priority,
          category: ticket.category,
          status: ticket.status,
          createdBy: {
            id: ticket.createdBy._id || ticket.createdBy,
            name: ticket.createdBy.firstName ? `${ticket.createdBy.firstName} ${ticket.createdBy.lastName}` : 'Unknown',
            email: ticket.createdBy.email || 'unknown@example.com'
          },
          assignedTo: ticket.assignedTo ? {
            id: ticket.assignedTo._id || ticket.assignedTo,
            name: ticket.assignedTo.firstName ? `${ticket.assignedTo.firstName} ${ticket.assignedTo.lastName}` : 'Unknown',
            email: ticket.assignedTo.email || 'unknown@example.com'
          } : null,
          tags: ticket.tags,
          createdAt: ticket.createdAt,
          metadata: ticket.metadata,
          webhookSource: 'flowbit-platform',
          triggeredAt: new Date().toISOString()
        };

        console.log('🔄 Triggering n8n workflow with payload:', {
          ticketId: webhookPayload.id,
          title: webhookPayload.title,
          priority: webhookPayload.priority,
          webhookUrl: `${n8nWebhookUrl}/flowbit-ticket`
        });

        // Make HTTP request to n8n webhook
        const axios = require('axios');
        const webhookResponse = await axios.post(`${n8nWebhookUrl}/flowbit-ticket`, webhookPayload, {
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'FlowBit-Platform/1.0'
          },
          timeout: 10000 // 10 second timeout
        });

        console.log('✅ n8n workflow triggered successfully:', {
          status: webhookResponse.status,
          workflowId: webhookResponse.data?.workflowId || 'unknown'
        });

        // Update ticket with workflow info
        ticket.workflowStatus = 'processing';
        ticket.workflowId = webhookResponse.data?.workflowId || `wf-${Date.now()}`;
        ticket.workflowData = {
          triggeredAt: new Date(),
          webhookResponse: {
            status: webhookResponse.status,
            data: webhookResponse.data
          }
        };
        await ticket.save();

      } catch (workflowError) {
        console.error('❌ n8n workflow trigger failed:', {
          error: workflowError.message,
          ticketId: ticket._id,
          code: workflowError.code,
          response: workflowError.response?.data
        });

        // Update ticket with error info but don't fail ticket creation
        ticket.workflowStatus = 'failed';
        ticket.workflowData = {
          error: workflowError.message,
          failedAt: new Date(),
          errorCode: workflowError.code
        };
        await ticket.save();
      }
    };

    // Trigger workflow asynchronously (don't block ticket creation)
    triggerN8nWorkflow();

    res.status(201).json({
      success: true,
      message: 'Ticket created successfully',
      data: {
        ticket: ticket.toObject()
      }
    });

  } catch (error) {
    console.error('Error creating ticket:', error);

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
      error: 'Failed to create ticket',
      code: 'TICKET_CREATE_ERROR'
    });
  }
});

// PUT /api/tickets/:id - Update ticket
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const customerId = req.user.customerId;

    // Find existing ticket
    const existingTicket = await Ticket.findOne({ 
      _id: id, 
      customerId 
    });

    if (!existingTicket) {
      return res.status(404).json({
        success: false,
        error: 'Ticket not found',
        code: 'TICKET_NOT_FOUND'
      });
    }

    // Check permissions
    const canEdit = req.user.role === 'Admin' || 
                   existingTicket.createdBy.toString() === req.user.id;

    if (!canEdit) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions to edit this ticket',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    // Define allowed update fields
    const allowedFields = [
      'title', 'description', 'status', 'priority', 
      'category', 'assignedTo', 'tags'
    ];

    const updateData = {};
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        updateData[field] = updates[field];
      }
    }

    // Validate assignedTo if provided
    if (updateData.assignedTo) {
      const assigneeExists = await User.findOne({
        _id: updateData.assignedTo,
        customerId: req.user.customerId,
        isActive: true
      });

      if (!assigneeExists) {
        return res.status(400).json({
          success: false,
          error: 'Assigned user not found in your organization',
          code: 'INVALID_ASSIGNEE'
        });
      }
    }

    // Handle status changes
    if (updateData.status && updateData.status !== existingTicket.status) {
      if (updateData.status === 'resolved' || updateData.status === 'closed') {
        updateData.resolvedAt = new Date();
      }
    }

    // Update ticket
    updateData.updatedAt = new Date();
    
    const updatedTicket = await Ticket.findByIdAndUpdate(
      id,
      updateData,
      { 
        new: true,
        runValidators: true
      }
    )
    .populate('createdBy', 'firstName lastName email role')
    .populate('assignedTo', 'firstName lastName email role');

    // Log the update
    console.log(`Ticket updated: ${updatedTicket._id} by ${req.user.email} (${customerId})`);

    res.json({
      success: true,
      message: 'Ticket updated successfully',
      data: {
        ticket: updatedTicket
      }
    });

  } catch (error) {
    console.error('Error updating ticket:', error);

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

// DELETE /api/tickets/:id - Delete ticket (Admin only)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const customerId = req.user.customerId;

    // Only admins can delete tickets
    if (req.user.role !== 'Admin') {
      return res.status(403).json({
        success: false,
        error: 'Only administrators can delete tickets',
        code: 'ADMIN_REQUIRED'
      });
    }

    const ticket = await Ticket.findOneAndDelete({ 
      _id: id, 
      customerId 
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        error: 'Ticket not found',
        code: 'TICKET_NOT_FOUND'
      });
    }

    console.log(`Ticket deleted: ${ticket._id} by ${req.user.email} (${customerId})`);

    res.json({
      success: true,
      message: 'Ticket deleted successfully',
      data: {
        deletedTicketId: id
      }
    });

  } catch (error) {
    console.error('Error deleting ticket:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: 'Invalid ticket ID format',
        code: 'INVALID_ID'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to delete ticket',
      code: 'TICKET_DELETE_ERROR'
    });
  }
});

// GET /api/tickets/overdue - Get overdue tickets for escalation workflow
router.get('/overdue', async (req, res) => {
  try {
    const customerId = req.user.customerId;
    const tenantData = new TenantDataAccessLayer(customerId);

    // Calculate overdue threshold (7 days ago)
    const overdueThreshold = new Date();
    overdueThreshold.setDate(overdueThreshold.getDate() - 7);

    const overdueTickets = await tenantData.find('tickets', {
      createdAt: { $lt: overdueThreshold },
      status: { $nin: ['closed', 'resolved'] }
    }, {
      sort: { priority: -1, createdAt: 1 },
      limit: 50
    });

    // Calculate overdue hours for each ticket
    const processedTickets = overdueTickets.map(ticket => {
      const now = new Date();
      const created = new Date(ticket.createdAt);
      const overdueHours = Math.floor((now - created) / (1000 * 60 * 60));
      
      return {
        ...ticket,
        overdueHours,
        isOverdue: overdueHours > 168 // 7 days = 168 hours
      };
    });

    console.log(`📊 Found ${processedTickets.length} overdue tickets for tenant ${customerId}`);

    res.json({
      success: true,
      data: processedTickets,
      count: processedTickets.length,
      threshold: overdueThreshold.toISOString(),
      message: `Found ${processedTickets.length} overdue tickets`
    });

  } catch (error) {
    console.error('Error fetching overdue tickets:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch overdue tickets',
      code: 'OVERDUE_FETCH_ERROR'
    });
  }
});

module.exports = router;
