import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { Link } from 'react-router-dom';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalTickets: 0,
    openTickets: 0,
    resolvedTickets: 0,
    totalWorkflows: 0,
    activeWorkflows: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock admin dashboard data
    const mockStats = {
      totalUsers: 156,
      activeUsers: 142,
      totalTickets: 1247,
      openTickets: 23,
      resolvedTickets: 1180,
      totalWorkflows: 18,
      activeWorkflows: 15
    };

    const mockActivity = [
      {
        id: 1,
        type: 'user_created',
        message: 'New user John Doe was created',
        timestamp: new Date(Date.now() - 1000 * 60 * 30),
        icon: '👤'
      },
      {
        id: 2,
        type: 'ticket_resolved',
        message: 'Ticket #1247 was resolved by Sarah Johnson',
        timestamp: new Date(Date.now() - 1000 * 60 * 60),
        icon: '✅'
      },
      {
        id: 3,
        type: 'workflow_activated',
        message: 'Customer Support Workflow was activated',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
        icon: '⚙️'
      },
      {
        id: 4,
        type: 'user_login',
        message: 'User mike.wilson@company.com logged in',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3),
        icon: '🔐'
      },
      {
        id: 5,
        type: 'ticket_created',
        message: 'New high priority ticket created by Lisa Chen',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4),
        icon: '🎫'
      }
    ];

    setTimeout(() => {
      setStats(mockStats);
      setRecentActivity(mockActivity);
      setLoading(false);
    }, 1000);
  }, []);

  const formatTimestamp = (timestamp) => {
    const now = new Date();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));

    if (minutes < 60) {
      return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    } else {
      return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    }
  };

  // Redirect non-admin users
  if (user && user.role !== 'Admin' && user.role !== 'admin') {
    return (
      <div className="p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <h2 className="font-bold">Access Denied</h2>
          <p>You don't have permission to access the admin dashboard.</p>
          <Link to="/" className="text-red-800 underline hover:text-red-900">
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Admin Dashboard</h1>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
        <p className="text-gray-600">
          Overview of system metrics and recent activity
        </p>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Users Stats */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-blue-500 rounded-lg p-3">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">{stats.totalUsers}</h3>
              <p className="text-sm text-gray-600">Total Users</p>
              <p className="text-xs text-green-600">{stats.activeUsers} active</p>
            </div>
          </div>
        </div>

        {/* Tickets Stats */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-green-500 rounded-lg p-3">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">{stats.totalTickets}</h3>
              <p className="text-sm text-gray-600">Total Tickets</p>
              <p className="text-xs text-orange-600">{stats.openTickets} open</p>
            </div>
          </div>
        </div>

        {/* Resolution Rate */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-purple-500 rounded-lg p-3">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {Math.round((stats.resolvedTickets / stats.totalTickets) * 100)}%
              </h3>
              <p className="text-sm text-gray-600">Resolution Rate</p>
              <p className="text-xs text-green-600">{stats.resolvedTickets} resolved</p>
            </div>
          </div>
        </div>

        {/* Workflows Stats */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-orange-500 rounded-lg p-3">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">{stats.totalWorkflows}</h3>
              <p className="text-sm text-gray-600">Total Workflows</p>
              <p className="text-xs text-green-600">{stats.activeWorkflows} active</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            to="/users"
            className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow text-center"
          >
            <div className="text-3xl mb-2">👥</div>
            <h3 className="font-medium text-gray-900">Manage Users</h3>
            <p className="text-sm text-gray-600">Add, edit, or deactivate users</p>
          </Link>

          <Link
            to="/tickets"
            className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow text-center"
          >
            <div className="text-3xl mb-2">🎫</div>
            <h3 className="font-medium text-gray-900">View All Tickets</h3>
            <p className="text-sm text-gray-600">Monitor and manage tickets</p>
          </Link>

          <Link
            to="/workflows"
            className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow text-center"
          >
            <div className="text-3xl mb-2">⚙️</div>
            <h3 className="font-medium text-gray-900">Manage Workflows</h3>
            <p className="text-sm text-gray-600">Create and configure workflows</p>
          </Link>

          <Link
            to="/settings"
            className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow text-center"
          >
            <div className="text-3xl mb-2">🔧</div>
            <h3 className="font-medium text-gray-900">System Settings</h3>
            <p className="text-sm text-gray-600">Configure platform settings</p>
          </Link>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h2>
          <div className="space-y-4">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50">
                <div className="flex-shrink-0 text-2xl">
                  {activity.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900">
                    {activity.message}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatTimestamp(activity.timestamp)}
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    activity.type === 'user_created' ? 'bg-blue-100 text-blue-800' :
                    activity.type === 'ticket_resolved' ? 'bg-green-100 text-green-800' :
                    activity.type === 'workflow_activated' ? 'bg-purple-100 text-purple-800' :
                    activity.type === 'user_login' ? 'bg-gray-100 text-gray-800' :
                    'bg-orange-100 text-orange-800'
                  }`}>
                    {activity.type.replace('_', ' ')}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 text-center">
            <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
              View All Activity →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
