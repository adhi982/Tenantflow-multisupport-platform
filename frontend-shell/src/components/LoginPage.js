import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../App';

const LoginPage = () => {
  const [credentials, setCredentials] = useState({
    email: 'admin@logisticsco.com',
    password: 'admin123!'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, isAuthenticated } = useAuth();

  // Redirect if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleChange = (e) => {
    setCredentials({
      ...credentials,
      [e.target.name]: e.target.value
    });
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await login(credentials);
    
    if (!result.success) {
      setError(result.error);
    }
    
    setLoading(false);
  };

  const handleDemoLogin = () => {
    setCredentials({
      email: 'admin@logisticsco.com',
      password: 'admin123'
    });
  };

  const handleSupportLogin = (userNumber) => {
    setCredentials({
      email: `support${userNumber}@logisticsco.com`,
      password: 'user123'
    });
  };

  const handleRetailAdminLogin = () => {
    setCredentials({
      email: 'admin@retailgmbh.de',
      password: 'admin123'
    });
  };

  const handleRetailSupportLogin = () => {
    setCredentials({
      email: 'support1@retailgmbh.de',
      password: 'user123'
    });
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-600 to-primary-800 relative overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="relative z-10 flex flex-col justify-center px-12 text-white">
          <div className="mb-8">
            <div className="flex items-center mb-6">
              <div className="h-12 w-12 bg-white rounded-xl flex items-center justify-center mr-4">
                <svg className="h-8 w-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold">FlowBit</h1>
            </div>
            <h2 className="text-4xl font-bold mb-4 leading-tight">
              Streamline Your Business Operations
            </h2>
            <p className="text-xl text-primary-100 mb-8 leading-relaxed">
              Multi-tenant support platform with automated workflows, 
              real-time analytics, and seamless integrations.
            </p>
          </div>
          
          <div className="space-y-6">
            <div className="flex items-center">
              <div className="h-2 w-2 bg-primary-300 rounded-full mr-4"></div>
              <span className="text-primary-100">Multi-tenant architecture</span>
            </div>
            <div className="flex items-center">
              <div className="h-2 w-2 bg-primary-300 rounded-full mr-4"></div>
              <span className="text-primary-100">Real-time collaboration</span>
            </div>
            <div className="flex items-center">
              <div className="h-2 w-2 bg-primary-300 rounded-full mr-4"></div>
              <span className="text-primary-100">Advanced security & CSRF protection</span>
            </div>
            <div className="flex items-center">
              <div className="h-2 w-2 bg-primary-300 rounded-full mr-4"></div>
              <span className="text-primary-100">Scalable micro-frontend architecture</span>
            </div>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 -mt-4 -mr-4 h-32 w-32 bg-primary-500 rounded-full opacity-20"></div>
        <div className="absolute bottom-0 left-0 -mb-8 -ml-8 h-24 w-24 bg-primary-400 rounded-full opacity-30"></div>
      </div>

      {/* Right side - Login Form */}
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:px-20">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          <div>
            <div className="lg:hidden mb-8">
              <div className="flex items-center justify-center">
                <div className="h-12 w-12 bg-primary-600 rounded-xl flex items-center justify-center mr-3">
                  <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h1 className="text-2xl font-bold text-gray-900">FlowBit</h1>
              </div>
            </div>
            
            <h2 className="text-3xl font-bold text-gray-900">Welcome back</h2>
            <p className="mt-2 text-sm text-gray-600">
              Sign in to your account to continue
            </p>
          </div>

          <div className="mt-8">
            {/* Demo Credentials Notice */}
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">Test Accounts</h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <div className="mb-3">
                      <p className="font-semibold">LogisticsCo:</p>
                      <p>Admin: <code className="bg-blue-100 px-1 rounded">admin@logisticsco.com</code> / <code className="bg-blue-100 px-1 rounded">admin123!</code></p>
                      <p>Support: <code className="bg-blue-100 px-1 rounded">support1@logisticsco.com</code> / <code className="bg-blue-100 px-1 rounded">user123!</code></p>
                    </div>
                    <div>
                      <p className="font-semibold">RetailGmbH:</p>
                      <p>Admin: <code className="bg-blue-100 px-1 rounded">admin@retailgmbh.de</code> / <code className="bg-blue-100 px-1 rounded">admin123!</code></p>
                      <p>Support: <code className="bg-blue-100 px-1 rounded">support1@retailgmbh.de</code> / <code className="bg-blue-100 px-1 rounded">user123!</code></p>
                    </div>
                  </div>
                  <div className="mt-3 space-y-2">
                    <div className="space-x-2">
                      <button
                        type="button"
                        onClick={handleDemoLogin}
                        className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                      >
                        LogisticsCo Admin
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSupportLogin(1)}
                        className="text-sm bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                      >
                        LogisticsCo Support
                      </button>
                    </div>
                    <div className="space-x-2">
                      <button
                        type="button"
                        onClick={() => handleRetailAdminLogin()}
                        className="text-sm bg-purple-600 text-white px-3 py-1 rounded hover:bg-purple-700"
                      >
                        RetailGmbH Admin
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRetailSupportLogin()}
                        className="text-sm bg-orange-600 text-white px-3 py-1 rounded hover:bg-orange-700"
                      >
                        RetailGmbH Support
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email address
                </label>
                <div className="mt-1">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    placeholder="Enter your email"
                    value={credentials.email}
                    onChange={handleChange}
                    disabled={loading}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <div className="mt-1">
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    placeholder="Enter your password"
                    value={credentials.password}
                    onChange={handleChange}
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                    Remember me
                  </label>
                </div>

                <div className="text-sm">
                  <a href="#" className="font-medium text-primary-600 hover:text-primary-500">
                    Forgot your password?
                  </a>
                </div>
              </div>

              {error && (
                <div className="rounded-md bg-red-50 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">{error}</h3>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  {loading ? (
                    <div className="flex items-center">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Signing in...
                    </div>
                  ) : (
                    'Sign in'
                  )}
                </button>
              </div>
            </form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">New to FlowBit?</span>
                </div>
              </div>

              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                  Contact your administrator to get access to the platform.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
