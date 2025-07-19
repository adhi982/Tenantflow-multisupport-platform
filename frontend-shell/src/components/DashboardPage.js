import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import axios from 'axios';

const DashboardPage = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    tickets: { total: 0, open: 0, resolved: 0, inProgress: 0 },
    workflows: { pending: 0, processing: 0, completed: 0, failed: 0, total: 0 },
    users: { total: 0 },
    activity: []
  });
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const isAdmin = user?.role === 'Admin' || user?.role === 'admin';

  useEffect(() => {
    fetchDashboardStats();
    
    // Set up auto-refresh every 10 seconds for real-time data (reduced from 30s)
    const interval = setInterval(fetchDashboardStats, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardStats = async () => {
    try {
      console.log('🔄 Fetching dashboard stats at', new Date().toISOString());
      setLoading(true);
      
      // Get comprehensive dashboard stats from new endpoint
      const response = await axios.get('/api/dashboard/stats');
      console.log('✅ Dashboard API response:', response.data);
      
      if (response.data.success) {
        setStats(response.data.data);
        setLastUpdated(new Date());
        console.log('✅ Dashboard stats updated:', response.data.data.workflows);
      }
    } catch (error) {
      console.error('❌ Error fetching dashboard stats:', error);
      // Fallback to old endpoint for basic stats
      try {
        const ticketResponse = await axios.get('/api/tickets/stats');
        if (ticketResponse.data.success) {
          setStats(prev => ({
            ...prev,
            tickets: {
              total: ticketResponse.data.data.statistics.totalTickets || 0,
              open: ticketResponse.data.data.statistics.openTickets || 0,
              resolved: ticketResponse.data.data.statistics.resolvedTickets || 0,
              inProgress: ticketResponse.data.data.statistics.inProgressTickets || 0
            }
          }));
        }
      } catch (fallbackError) {
        console.error('Fallback stats fetch failed:', fallbackError);
      }
    } finally {
      setLoading(false);
    }
  };

  const getCompanyName = () => {
    if (user?.customerId === 'logistics-co') return 'LogisticsCo';
    if (user?.customerId === 'retail-gmbh') return 'RetailGmbH';
    return 'Demo Company';
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.firstName}! 👋
          </h1>
          <p className="text-gray-600 mt-1">
            {getCompanyName()} Dashboard • Last updated: {lastUpdated.toLocaleTimeString()}
          </p>
        </div>
        <button 
          onClick={fetchDashboardStats}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          🔄 Refresh
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Tickets */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                {isAdmin ? 'Total Tickets' : 'My Tickets'}
              </p>
              <p className="text-2xl font-semibold text-gray-900">{stats.tickets.total}</p>
            </div>
          </div>
        </div>

        {/* Open Tickets */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Open Tickets</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.tickets.open}</p>
            </div>
          </div>
        </div>

        {/* Resolved Tickets */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Resolved</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.tickets.resolved}</p>
            </div>
          </div>
        </div>

        {/* Team Members or Workflow Status */}
        {isAdmin ? (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Team Members</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.users.total}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">In Progress</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.tickets.inProgress}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Workflow Status Panel (Admin Only) */}
      {isAdmin && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                🔄 N8N Workflow Status
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Real-time data from actual webhook executions • Updates every 10s • Last: {lastUpdated.toLocaleTimeString()}
              </p>
            </div>
            <button
              onClick={fetchDashboardStats}
              disabled={loading}
              className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? '⟳' : '🔄'} Refresh
            </button>
          </div>
          <div className="p-6">
            {stats.workflows.total === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-400 text-lg mb-2">🔍</div>
                <p className="text-gray-500">No active N8N workflows detected</p>
                <p className="text-sm text-gray-400 mt-1">Workflow status will appear here when N8N sends webhook callbacks</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">{stats.workflows.pending}</div>
                  <div className="text-sm text-yellow-700">Pending</div>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{stats.workflows.processing}</div>
                  <div className="text-sm text-blue-700">Processing</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{stats.workflows.completed}</div>
                  <div className="text-sm text-green-700">Completed</div>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{stats.workflows.failed}</div>
                  <div className="text-sm text-red-700">Failed</div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Recent Activity Section */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            {isAdmin ? '🏢 Company Activity' : '📋 My Recent Activity'}
          </h3>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {stats.activity && stats.activity.length > 0 ? (
              stats.activity.map((activity, index) => (
                <div key={activity.id || index} className="flex items-center space-x-3">
                  <div className={`w-2 h-2 rounded-full ${getActivityColor(activity.action)}`}></div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">{activity.description}</p>
                    <p className="text-xs text-gray-500">
                      {activity.user} • {new Date(activity.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No recent activity</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper function to get activity color based on action type
const getActivityColor = (action) => {
  const colorMap = {
    'ticket_created': 'bg-blue-400',
    'ticket_updated': 'bg-yellow-400', 
    'ticket_resolved': 'bg-green-400',
    'workflow_started': 'bg-purple-400',
    'workflow_completed': 'bg-green-500',
    'workflow_failed': 'bg-red-400',
    'webhook_received': 'bg-indigo-400',
    'user_created': 'bg-purple-400',
    'user_login': 'bg-gray-400',
    'assignment_created': 'bg-blue-500',
    'assignment_completed': 'bg-green-500'
  };
  return colorMap[action] || 'bg-gray-400';
};

export default DashboardPage;
