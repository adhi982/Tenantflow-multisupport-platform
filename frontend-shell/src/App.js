import React, { useState, useEffect, createContext, useContext } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import axios from 'axios';
import MainLayout from './components/MainLayout';
import LoginPage from './components/LoginPage';
import LoadingSpinner from './components/LoadingSpinner';

// Authentication Context
const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Authentication Provider Component
const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState(null);

  // Configure axios defaults and authentication
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
    
    // Set base URL for API requests
    axios.defaults.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
    axios.defaults.withCredentials = true;
    
    // Add response interceptor for token expiration - FIXED for authentication persistence
    axios.interceptors.response.use(
      (response) => response,
      (error) => {
        // Be more conservative about automatic logout - only logout on specific auth failures
        if (error.response?.status === 401 && 
            (error.config?.url?.includes('/auth/verify') || 
             error.response?.data?.code === 'TOKEN_EXPIRED' ||
             error.response?.data?.code === 'TOKEN_INVALID' ||
             error.response?.data?.message?.includes('token'))) {
          console.log('🚨 Authentication failed, logging out:', error.response?.data?.message);
          localStorage.removeItem('authToken');
          localStorage.removeItem('userData');
          delete axios.defaults.headers.common['Authorization'];
          setUser(null);
          setIsAuthenticated(false);
        }
        return Promise.reject(error);
      }
    );
  }, []);

  // Check authentication status on app load
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const userData = localStorage.getItem('userData');
      
      console.log('🔍 Checking auth status:', { hasToken: !!token, hasUserData: !!userData });
      
      if (!token || !userData) {
        console.log('❌ No token or user data found');
        setLoading(false);
        return;
      }

      // Set the authorization header for axios
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      // Try to validate token with backend - ENHANCED for better persistence
      try {
        console.log('🔐 Validating token with backend...');
        const response = await axios.get('/auth/me');
        console.log('✅ Backend validation response:', response.data);
        
        if (response.data.success && response.data.user) {
          console.log('✅ Backend validation successful - user stays logged in');
          setUser(response.data.user);
          setIsAuthenticated(true);
          // Update stored user data
          localStorage.setItem('userData', JSON.stringify(response.data.user));
        } else {
          throw new Error('Invalid response from backend');
        }
      } catch (backendError) {
        console.log('⚠️ Backend validation failed:', backendError.message);
        
        // ENHANCED: Be more specific about when to logout vs when to use cached data
        if (backendError.response?.status === 401 && 
            (backendError.response?.data?.code === 'TOKEN_EXPIRED' ||
             backendError.response?.data?.code === 'TOKEN_INVALID' ||
             backendError.response?.data?.message?.includes('expired') ||
             backendError.response?.data?.message?.includes('invalid'))) {
          console.log('🚨 Token is definitively invalid (401), clearing auth data');
          localStorage.removeItem('authToken');
          localStorage.removeItem('userData');
          delete axios.defaults.headers.common['Authorization'];
          setError('Session expired. Please log in again.');
          setLoading(false);
          return;
        }
        
        // For network errors or server issues, use stored user data (KEEPS USER LOGGED IN)
        console.log('🔄 Using stored user data due to network/server issue - maintaining session');
        try {
          const storedUser = JSON.parse(userData);
          setUser(storedUser);
          setIsAuthenticated(true);
          console.log('✅ User remains logged in using cached data');
        } catch (parseError) {
          console.log('❌ Corrupted stored data, clearing auth');
          localStorage.removeItem('authToken');
          localStorage.removeItem('userData');
          delete axios.defaults.headers.common['Authorization'];
        }
      }
    } catch (error) {
      console.error('❌ Auth check failed:', error);
      // Only clear auth data if there's a parsing error or similar critical issue
      if (error instanceof SyntaxError) {
        console.log('🧹 Corrupted user data, clearing auth');
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
        delete axios.defaults.headers.common['Authorization'];
      }
      setError('Authentication check failed');
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials) => {
    try {
      setError(null);
      
      console.log('🔐 Starting login process...');
      
      // Real backend authentication
      const response = await axios.post('/auth/login', {
        email: credentials.email,
        password: credentials.password,
        customerId: credentials.email.includes('@logisticsco.com') ? 'logistics-co' : 
                   credentials.email.includes('@retailgmbh.de') ? 'retail-gmbh' : 'demo'
      });
      
      console.log('Login response:', response.data);
      
      if (response.data.success) {
        const { user, accessToken } = response.data;
        
        console.log('✅ Login successful, saving data:', { 
          hasUser: !!user, 
          hasToken: !!accessToken,
          userEmail: user?.email 
        });
        
        // Save authentication data
        localStorage.setItem('authToken', accessToken);
        localStorage.setItem('userData', JSON.stringify(user));
        axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
        
        // Verify data was saved
        const savedToken = localStorage.getItem('authToken');
        const savedUser = localStorage.getItem('userData');
        console.log('✅ Data saved verification:', { 
          tokenSaved: !!savedToken, 
          userSaved: !!savedUser 
        });
        
        setUser(user);
        setIsAuthenticated(true);
        
        return { success: true };
      } else {
        console.log('❌ Login failed - invalid response');
        return { 
          success: false, 
          error: response.data.error || 'Login failed' 
        };
      }
    } catch (error) {
      console.error('Login failed:', error);
      
      return { 
        success: false, 
        error: error.response?.data?.error || 'Login failed. Please check your credentials.' 
      };
    }
  };

  const logout = () => {
    console.log('🚪 Logging out user...');
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
    setIsAuthenticated(false);
    setError(null);
    console.log('✅ Logout complete');
  };

  const refreshAuthStatus = async () => {
    console.log('🔄 Manually refreshing auth status...');
    setLoading(true);
    await checkAuthStatus();
  };

  const value = {
    user,
    isAuthenticated,
    loading,
    error,
    login,
    logout,
    checkAuthStatus,
    refreshAuthStatus,  // Add manual refresh function
    setUser  // Add setUser to context for profile updates
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner message="Authenticating..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Main App Component
const App = () => {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route 
            path="/*" 
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </div>
    </AuthProvider>
  );
};

export default App;
