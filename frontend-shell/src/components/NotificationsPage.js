import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';

const NotificationsPage = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, unread, read

  useEffect(() => {
    // Mock notifications data
    const mockNotifications = [
      {
        id: 1,
        title: 'Welcome to FlowBit.ai!',
        message: 'Your account has been successfully created and activated.',
        type: 'success',
        read: false,
        timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
        icon: '🎉'
      },
      {
        id: 2,
        title: 'Profile Update Required',
        message: 'Please complete your profile information to access all features.',
        type: 'warning',
        read: false,
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
        icon: '⚠️'
      },
      {
        id: 3,
        title: 'New Ticket Created',
        message: 'A new support ticket has been created and assigned to you.',
        type: 'info',
        read: true,
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
        icon: '🎫'
      },
      {
        id: 4,
        title: 'System Maintenance',
        message: 'Scheduled maintenance will occur tonight from 2:00 AM to 4:00 AM.',
        type: 'info',
        read: true,
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2 days ago
        icon: '🔧'
      },
      {
        id: 5,
        title: 'Security Alert',
        message: 'A new login was detected from an unknown device.',
        type: 'error',
        read: false,
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3), // 3 days ago
        icon: '🔐'
      }
    ];

    setTimeout(() => {
      setNotifications(mockNotifications);
      setLoading(false);
    }, 1000);
  }, []);

  const markAsRead = (id) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, read: true }
          : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
  };

  const deleteNotification = (id) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  const formatTimestamp = (timestamp) => {
    const now = new Date();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) {
      return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    } else if (hours < 24) {
      return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    } else {
      return `${days} day${days !== 1 ? 's' : ''} ago`;
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'success': return 'bg-green-100 border-green-200 text-green-800';
      case 'warning': return 'bg-yellow-100 border-yellow-200 text-yellow-800';
      case 'error': return 'bg-red-100 border-red-200 text-red-800';
      default: return 'bg-blue-100 border-blue-200 text-blue-800';
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'unread') return !notification.read;
    if (filter === 'read') return notification.read;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  if (loading) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Notifications</h1>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600">Loading notifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-600 mt-1">
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}` : 'All caught up!'}
          </p>
        </div>
        
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
          >
            Mark All as Read
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            filter === 'all' 
              ? 'bg-white text-blue-600 shadow-sm' 
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          All ({notifications.length})
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            filter === 'unread' 
              ? 'bg-white text-blue-600 shadow-sm' 
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Unread ({unreadCount})
        </button>
        <button
          onClick={() => setFilter('read')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            filter === 'read' 
              ? 'bg-white text-blue-600 shadow-sm' 
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Read ({notifications.length - unreadCount})
        </button>
      </div>

      {/* Notifications List */}
      <div className="space-y-4">
        {filteredNotifications.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="text-gray-400 text-6xl mb-4">🔔</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications</h3>
            <p className="text-gray-600">
              {filter === 'unread' ? "You're all caught up!" : "No notifications to show."}
            </p>
          </div>
        ) : (
          filteredNotifications.map((notification) => (
            <div
              key={notification.id}
              className={`bg-white rounded-lg shadow border-l-4 transition-all hover:shadow-md ${
                notification.read ? 'border-gray-300' : 'border-blue-500'
              }`}
            >
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    {/* Icon */}
                    <div className="flex-shrink-0 text-2xl">
                      {notification.icon}
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className={`text-sm font-medium ${
                          notification.read ? 'text-gray-900' : 'text-gray-900 font-semibold'
                        }`}>
                          {notification.title}
                        </h3>
                        <span className={`px-2 py-1 text-xs rounded-full border ${getTypeColor(notification.type)}`}>
                          {notification.type}
                        </span>
                        {!notification.read && (
                          <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatTimestamp(notification.timestamp)}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2 ml-4">
                    {!notification.read && (
                      <button
                        onClick={() => markAsRead(notification.id)}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        Mark as read
                      </button>
                    )}
                    <button
                      onClick={() => deleteNotification(notification.id)}
                      className="text-gray-400 hover:text-red-600 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Empty State for All Notifications */}
      {notifications.length === 0 && (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="text-gray-400 text-6xl mb-4">📭</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications yet</h3>
          <p className="text-gray-600">
            When you receive notifications, they'll appear here.
          </p>
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
