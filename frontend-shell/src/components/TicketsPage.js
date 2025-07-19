import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../App';

const TicketsPage = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTicket, setNewTicket] = useState({
    title: '',
    description: '',
    priority: 'medium',
    category: 'general'
  });
  const { user } = useAuth();

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      const response = await axios.get('/api/tickets');
      if (response.data.success) {
        const ticketsData = response.data.data.tickets || [];
        setTickets(Array.isArray(ticketsData) ? ticketsData : []);
      } else {
        console.error('Failed to fetch tickets:', response.data.error);
        // Fallback to empty array if API fails
        setTickets([]);
      }
    } catch (error) {
      console.error('Error fetching tickets:', error);
      // Fallback to empty array
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    
    // TRIPLE CHECK: Prevent form submission if validation fails
    const titleTrimmed = newTicket.title.trim();
    const descriptionTrimmed = newTicket.description.trim();
    const titleLength = titleTrimmed.length;
    const descriptionLength = descriptionTrimmed.length;
    
    console.log('=== FRONTEND VALIDATION CHECK ===');
    console.log('Validation check:', {
      title: newTicket.title,
      titleTrimmed,
      titleLength,
      description: newTicket.description,
      descriptionTrimmed,
      descriptionLength,
      formElement: e.target,
      submitterButton: e.submitter
    });
    
    // Multiple validation layers
    if (titleLength < 3) {
      console.error(`BLOCKED: Title too short (${titleLength} chars)`);
      alert(`Title must be at least 3 characters long (currently ${titleLength} characters)`);
      return;
    }
    
    if (descriptionLength < 10) {
      console.error(`BLOCKED: Description too short (${descriptionLength} chars)`);
      alert(`Description must be at least 10 characters long (currently ${descriptionLength} characters)`);
      return;
    }
    
    if (titleLength > 200) {
      console.error(`BLOCKED: Title too long (${titleLength} chars)`);
      alert(`Title must be less than 200 characters (currently ${titleLength} characters)`);
      return;
    }
    
    if (descriptionLength > 2000) {
      console.error(`BLOCKED: Description too long (${descriptionLength} chars)`);
      alert(`Description must be less than 2000 characters (currently ${descriptionLength} characters)`);
      return;
    }
    
    // Check if button should be disabled
    const shouldBeDisabled = titleLength < 3 || descriptionLength < 10 || titleLength > 200 || descriptionLength > 2000;
    if (shouldBeDisabled) {
      console.error('BLOCKED: Button should be disabled but form was submitted anyway!');
      alert('Form validation failed. Please check your input.');
      return;
    }
    
    console.log('✅ Frontend validation passed, proceeding with API call');
    
    try {
      const ticketData = {
        title: titleTrimmed,
        description: descriptionTrimmed,
        priority: newTicket.priority,
        category: newTicket.category
      };
      
      console.log('Sending ticket data:', ticketData);
      console.log('Description length being sent:', ticketData.description.length);
      
      const response = await axios.post('/api/tickets', ticketData);
      if (response.data.success) {
        // Add the new ticket to the list
        const newTicketData = response.data.data;
        setTickets([newTicketData, ...tickets]);
        setNewTicket({ title: '', description: '', priority: 'medium', category: 'general' });
        setShowCreateForm(false);
        alert('Ticket created successfully!');
      } else {
        alert('Failed to create ticket: ' + response.data.error);
      }
    } catch (error) {
      console.error('Error creating ticket:', error);
      
      // Enhanced error handling to show specific validation errors
      let errorMessage = 'Failed to create ticket. Please try again.';
      
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.status === 400) {
        errorMessage = 'Validation failed. Please check your input and try again.';
      }
      
      alert(errorMessage);
      console.log('Full error response:', error.response?.data);
    }
  };

  const handleDeleteTicket = async (ticketId) => {
    if (!window.confirm('Are you sure you want to delete this ticket?')) {
      return;
    }
    
    try {
      const response = await axios.delete(`/api/tickets/${ticketId}`);
      if (response.data.success) {
        setTickets(tickets.filter(ticket => ticket._id !== ticketId));
      }
    } catch (error) {
      console.error('Error deleting ticket:', error);
      alert('Failed to delete ticket');
    }
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800', 
      high: 'bg-orange-100 text-orange-800',
      urgent: 'bg-red-100 text-red-800'
    };
    return colors[priority] || colors.medium;
  };

  const getStatusColor = (status) => {
    const colors = {
      open: 'bg-blue-100 text-blue-800',
      'in-progress': 'bg-purple-100 text-purple-800',
      resolved: 'bg-green-100 text-green-800',
      closed: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || colors.open;
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Tickets</h1>
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded flex items-center"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create Ticket
        </button>
      </div>

      {/* Create Ticket Form */}
      {showCreateForm && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Create New Ticket</h2>
          <form onSubmit={handleCreateTicket}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                <input
                  type="text"
                  required
                  minLength={3}
                  value={newTicket.title}
                  onChange={(e) => setNewTicket({...newTicket, title: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Brief description of the issue (min 3 characters)"
                />
                {newTicket.title.length > 0 && newTicket.title.length < 3 && (
                  <p className="text-xs text-red-500 mt-1">Title must be at least 3 characters (currently {newTicket.title.length})</p>
                )}
                {newTicket.title.length > 200 && (
                  <p className="text-xs text-red-500 mt-1">Title too long! Maximum 200 characters (currently {newTicket.title.length})</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                <select
                  value={newTicket.priority}
                  onChange={(e) => setNewTicket({...newTicket, priority: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <select
                value={newTicket.category}
                onChange={(e) => setNewTicket({...newTicket, category: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="general">General</option>
                <option value="shipping">Shipping</option>
                <option value="technical">Technical</option>
                <option value="billing">Billing</option>
              </select>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                required
                minLength={10}
                rows="4"
                value={newTicket.description}
                onChange={(e) => setNewTicket({...newTicket, description: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Detailed description of the issue (min 10 characters)"
              ></textarea>
              {newTicket.description.length > 0 && newTicket.description.length < 10 && (
                <p className="text-xs text-red-500 mt-1">Description must be at least 10 characters (currently {newTicket.description.length})</p>
              )}
              {newTicket.description.length > 2000 && (
                <p className="text-xs text-red-500 mt-1">Description too long! Maximum 2000 characters (currently {newTicket.description.length})</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                {newTicket.description.length}/2000 characters
                {newTicket.description.length < 10 && newTicket.description.length > 0 && 
                  ` (need ${10 - newTicket.description.length} more)`
                }
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                type="submit"
                disabled={
                  newTicket.title.trim().length < 3 || 
                  newTicket.description.trim().length < 10 ||
                  newTicket.title.trim().length > 200 ||
                  newTicket.description.trim().length > 2000
                }
                className={`px-4 py-2 rounded ${
                  newTicket.title.trim().length < 3 || 
                  newTicket.description.trim().length < 10 ||
                  newTicket.title.trim().length > 200 ||
                  newTicket.description.trim().length > 2000
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                }`}
              >
                Create Ticket
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tickets List */}
      <div className="bg-white rounded-lg shadow">
        {tickets.length === 0 ? (
          <div className="p-8 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No tickets yet</h3>
            <p className="text-gray-600 mb-4">Get started by creating your first support ticket.</p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
            >
              Create First Ticket
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {tickets.filter(ticket => ticket && ticket._id).map((ticket) => (
              <div key={ticket._id} className="p-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-900 mb-1">{ticket.title || 'Untitled Ticket'}</h3>
                    <p className="text-gray-600 mb-2">{ticket.description || 'No description provided'}</p>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>#{ticket.ticketNumber || ticket._id}</span>
                      <span>Created {ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString() : 'Unknown date'}</span>
                      {ticket.assignedTo && <span>Assigned to {ticket.assignedTo.firstName}</span>}
                    </div>
                  </div>
                  <div className="flex flex-col items-end space-y-2">
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(ticket.priority)}`}>
                        {(ticket.priority || 'medium').toUpperCase()}
                      </span>
                      {/* Only show delete button for Admins */}
                      {(user?.role === 'Admin' || user?.role === 'admin') && (
                        <button
                          onClick={() => handleDeleteTicket(ticket._id)}
                          className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                          title="Delete ticket"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(ticket.status)}`}>
                      {(ticket.status || 'open').replace('-', ' ').toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TicketsPage;
