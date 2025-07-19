import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../App';

const NoProfilePage = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          </div>

          {/* Title */}
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              No Profile Available
            </h2>
            <p className="text-gray-600 mb-6">
              Your profile information is not yet complete or available.
            </p>
          </div>

          {/* User Info (if available) */}
          {user && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="text-sm font-medium text-gray-900 mb-2">Current User Info:</h3>
              <div className="space-y-1 text-sm text-gray-600">
                <div>
                  <span className="font-medium">Name:</span> {user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Not provided'}
                </div>
                <div>
                  <span className="font-medium">Email:</span> {user.email || 'Not provided'}
                </div>
                <div>
                  <span className="font-medium">Role:</span> {user.role || 'Not assigned'}
                </div>
                <div>
                  <span className="font-medium">Status:</span> {user.isActive ? 'Active' : 'Inactive'}
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-3">
            <Link
              to="/profile"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              Complete Your Profile
            </Link>
            
            <Link
              to="/dashboard"
              className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              Go to Dashboard
            </Link>
          </div>

          {/* Help Text */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              If you're having trouble accessing your profile, please contact your administrator or support team.
            </p>
          </div>
        </div>
      </div>

      {/* Additional Information */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                What is a profile?
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>
                  Your profile contains your personal information, preferences, and account settings. 
                  It helps personalize your experience and allows other team members to identify you.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NoProfilePage;
