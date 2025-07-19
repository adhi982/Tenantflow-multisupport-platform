import React, { useState, useEffect } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../App';
import Sidebar from './Sidebar';
import Header from './Header';
import Dashboard from './Dashboard';
import DashboardPage from './DashboardPage';
import TicketsPage from './TicketsPage';
import ProfilePage from './ProfilePage';
import NoProfilePage from './NoProfilePage';
import AdminDashboard from './AdminDashboard';
import SettingsPage from './SettingsPage';
import HelpSupportPage from './HelpSupportPage';
import NotificationsPage from './NotificationsPage';
import NewScreenPage from './NewScreenPage';
import WorkflowsPage from './WorkflowsPage';
import UsersPage from './UsersPage';
import CustomScreenPage from './CustomScreenPage';
import ErrorBoundary from './ErrorBoundary';

const MainLayout = () => {
  const [screens, setScreens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Fetch tenant screens on component mount
  useEffect(() => {
    fetchTenantScreens();
  }, []);

  const fetchTenantScreens = async () => {
    try {
      // Mock data instead of API call for demo purposes
      const mockScreens = [
        { 
          id: 1, 
          name: 'User Management', 
          slug: 'user-management',
          type: 'Admin', 
          description: 'Manage users and permissions',
          icon: 'users',
          color: 'blue'
        },
        { 
          id: 2, 
          name: 'Dashboard Analytics', 
          slug: 'dashboard-analytics',
          type: 'Reports', 
          description: 'View analytics and metrics',
          icon: 'chart',
          color: 'green'
        },
        { 
          id: 3, 
          name: 'Workflow Builder', 
          slug: 'workflow-builder',
          type: 'Design', 
          description: 'Create and manage workflows',
          icon: 'flow',
          color: 'purple'
        },
        { 
          id: 4, 
          name: 'Integration Settings', 
          slug: 'integration-settings',
          type: 'Config', 
          description: 'Configure external integrations',
          icon: 'settings',
          color: 'orange'
        }
      ];
      
      setScreens(mockScreens);
    } catch (error) {
      console.error('Failed to fetch tenant screens:', error);
      // If unauthorized, logout
      if (error.response?.status === 401) {
        logout();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="h-screen flex overflow-hidden bg-gray-100">
        {/* Sidebar */}
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          screens={screens}
          currentPath={location.pathname}
        />

        {/* Main content */}
        <div className="flex flex-col w-0 flex-1 overflow-hidden">
          {/* Header */}
          <Header
            user={user}
            onMenuClick={() => setSidebarOpen(true)}
            onLogout={handleLogout}
          />

          {/* Page content */}
          <main className="flex-1 relative overflow-y-auto focus:outline-none">
            <div className="py-6">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
                <Routes>
                  <Route path="/" element={<DashboardPage screens={screens} />} />
                  <Route path="/admin" element={<AdminDashboard />} />
                  <Route path="/tickets/*" element={<TicketsPage />} />
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="/no-profile" element={<NoProfilePage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                  <Route path="/help" element={<HelpSupportPage />} />
                  <Route path="/notifications" element={<NotificationsPage />} />
                  <Route path="/new-screen" element={<NewScreenPage />} />
                  <Route path="/workflows" element={<WorkflowsPage />} />
                  <Route path="/users" element={<UsersPage />} />
                  {/* Dynamic routes for tenant screens */}
                  {screens.map((screen) => (
                    <Route
                      key={screen.id}
                      path={`/${screen.slug}`}
                      element={<CustomScreenPage screens={screens} />}
                    />
                  ))}
                  
                  {/* Catch-all route */}
                  <Route 
                    path="*" 
                    element={
                      <div className="text-center py-12">
                        <h1 className="text-2xl font-semibold text-gray-900 mb-4">
                          Page Not Found
                        </h1>
                        <p className="text-gray-600">
                          The page you're looking for doesn't exist.
                        </p>
                      </div>
                    } 
                  />
                </Routes>
              </div>
            </div>
          </main>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default MainLayout;
