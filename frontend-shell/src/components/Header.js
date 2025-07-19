import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Header = ({ user, onMenuClick, onLogout }) => {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const userMenuRef = useRef(null);
  const notificationsRef = useRef(null);
  const navigate = useNavigate();

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setNotificationsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const mockNotifications = [
    {
      id: 1,
      title: 'New workflow completed',
      message: 'Customer onboarding workflow finished successfully',
      time: '2 minutes ago',
      type: 'success',
      read: false
    },
    {
      id: 2,
      title: 'Integration alert',
      message: 'Salesforce sync encountered an issue',
      time: '15 minutes ago',
      type: 'warning',
      read: false
    },
    {
      id: 3,
      title: 'System update',
      message: 'Platform will be updated tonight at 2 AM',
      time: '1 hour ago',
      type: 'info',
      read: true
    }
  ];

  const unreadCount = mockNotifications.filter(n => !n.read).length;

  return (
    <div className="relative z-10 flex-shrink-0 flex h-16 bg-white shadow-sm border-b border-gray-200">
      <button
        type="button"
        className="px-4 border-r border-gray-200 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500 md:hidden"
        onClick={onMenuClick}
      >
        <span className="sr-only">Open sidebar</span>
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
      
      <div className="flex-1 px-4 flex justify-between items-center">
        {/* Search */}
        <div className="flex-1 flex">
          <div className="w-full flex md:ml-0">
            <label htmlFor="search-field" className="sr-only">Search</label>
            <div className="relative w-full text-gray-400 focus-within:text-gray-600">
              <div className="absolute inset-y-0 left-0 flex items-center pointer-events-none">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                id="search-field"
                className="block w-full h-full pl-8 pr-3 py-2 border-transparent text-gray-900 placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-0 focus:border-transparent sm:text-sm"
                placeholder="Search workflows, screens, users..."
                type="search"
              />
            </div>
          </div>
        </div>
        
        <div className="ml-4 flex items-center md:ml-6 space-x-4">
          {/* Quick Actions */}
          <div className="hidden md:flex items-center space-x-2">
            <button
              type="button"
              onClick={() => navigate('/new-screen')}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              New Screen
            </button>
          </div>

          {/* Notifications */}
          <div className="relative" ref={notificationsRef}>
            <button
              type="button"
              className="bg-white p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 relative"
              onClick={() => setNotificationsOpen(!notificationsOpen)}
            >
              <span className="sr-only">View notifications</span>
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-xs font-bold text-white">{unreadCount}</span>
                </span>
              )}
            </button>

            {/* Notifications dropdown */}
            {notificationsOpen && (
              <div className="origin-top-right absolute right-0 mt-2 w-80 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                <div className="px-4 py-3 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
                    {unreadCount > 0 && (
                      <span className="text-xs bg-primary-100 text-primary-800 px-2 py-1 rounded-full">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="max-h-64 overflow-y-auto">
                  {mockNotifications.map((notification) => (
                    <div 
                      key={notification.id} 
                      className={`px-4 py-3 hover:bg-gray-50 border-l-4 ${
                        notification.read ? 'border-transparent' : 'border-primary-500 bg-primary-50'
                      }`}
                    >
                      <div className="flex">
                        <div className={`flex-shrink-0 w-2 h-2 mt-2 rounded-full ${
                          notification.type === 'success' ? 'bg-green-400' :
                          notification.type === 'warning' ? 'bg-yellow-400' : 'bg-blue-400'
                        }`}></div>
                        <div className="ml-3 flex-1">
                          <p className={`text-sm font-medium ${notification.read ? 'text-gray-700' : 'text-gray-900'}`}>
                            {notification.title}
                          </p>
                          <p className={`text-sm ${notification.read ? 'text-gray-500' : 'text-gray-600'}`}>
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">{notification.time}</p>
                        </div>
                        {!notification.read && (
                          <div className="flex-shrink-0 w-2 h-2 bg-primary-600 rounded-full mt-2"></div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="px-4 py-3 border-t border-gray-200">
                  <button 
                    onClick={() => navigate('/notifications')}
                    className="text-sm text-primary-600 hover:text-primary-500 font-medium"
                  >
                    View all notifications
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Profile dropdown */}
          <div className="ml-3 relative" ref={userMenuRef}>
            <div>
              <button
                type="button"
                className="max-w-xs bg-white flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
              >
                <span className="sr-only">Open user menu</span>
                <div className="h-8 w-8 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-primary-600 font-medium text-sm">
                    {user?.firstName?.charAt(0) || user?.name?.charAt(0) || 'U'}
                  </span>
                </div>
                <div className="hidden md:block ml-3 text-left">
                  <p className="text-sm font-medium text-gray-700">
                    {user?.firstName && user?.lastName 
                      ? `${user.firstName} ${user.lastName}` 
                      : user?.name || 'Demo User'
                    }
                  </p>
                  <p className="text-xs text-gray-500">
                    {user?.customerId === 'logistics-co' ? 'LogisticsCo' : 
                     user?.customerId === 'retail-gmbh' ? 'RetailGmbH' : 'Demo Tenant'}
                  </p>
                </div>
                <svg className="hidden md:block ml-2 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
            
            {/* User menu dropdown */}
            {userMenuOpen && (
              <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                <div className="px-4 py-3 border-b border-gray-200">
                  <p className="text-sm font-medium text-gray-900">
                    {user?.firstName && user?.lastName 
                      ? `${user.firstName} ${user.lastName}` 
                      : user?.name || 'Demo User'
                    }
                  </p>
                  <p className="text-sm text-gray-500">{user?.email || 'demo@flowbit.ai'}</p>
                  <p className="text-xs text-gray-400">
                    {user?.role || 'User'} • {user?.customerId === 'logistics-co' ? 'LogisticsCo' : 
                     user?.customerId === 'retail-gmbh' ? 'RetailGmbH' : 'Demo Company'}
                  </p>
                </div>
                
                <button 
                  onClick={() => navigate('/profile')}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <div className="flex items-center">
                    <svg className="mr-3 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Your Profile
                  </div>
                </button>
                
                <button 
                  onClick={() => navigate('/settings')}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <div className="flex items-center">
                    <svg className="mr-3 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Settings
                  </div>
                </button>
                
                <button 
                  onClick={() => navigate('/help')}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <div className="flex items-center">
                    <svg className="mr-3 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Help & Support
                  </div>
                </button>
                
                <div className="border-t border-gray-200"></div>
                
                <button
                  onClick={onLogout}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <div className="flex items-center">
                    <svg className="mr-3 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Sign out
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header;
