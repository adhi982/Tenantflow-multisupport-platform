import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../App';

const ProfilePage = () => {
  const { user, setUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: ''
  });
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');

  // Initialize form data when user data is available
  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || ''
      });
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear errors when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setSuccessMessage('');
    
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    
    try {
      console.log('Updating user profile:', formData);
      
      const response = await axios.put('/me', formData);
      
      if (response.data.success) {
        // Update user context with new data
        const updatedUser = response.data.data.user;
        setUser(updatedUser);
        
        // Update localStorage
        localStorage.setItem('userData', JSON.stringify(updatedUser));
        
        setSuccessMessage('Profile updated successfully!');
        setIsEditing(false);
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setErrors({ general: response.data.error || 'Failed to update profile' });
      }
    } catch (error) {
      console.error('Profile update error:', error);
      if (error.response?.data?.error) {
        setErrors({ general: error.response.data.error });
      } else {
        setErrors({ general: 'Failed to update profile. Please try again.' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    // Reset form data to original user data
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || ''
      });
    }
    setErrors({});
    setSuccessMessage('');
    setIsEditing(false);
  };

  if (!user) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Profile</h1>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600">Loading user profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Profile Settings</h1>
      
      {/* Success Message */}
      {successMessage && (
        <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
          {successMessage}
        </div>
      )}
      
      {/* General Error Message */}
      {errors.general && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {errors.general}
        </div>
      )}

      <div className="bg-white rounded-lg shadow">
        {/* Profile Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center text-white text-xl font-bold">
                {user.initials || `${(user.firstName?.[0] || '')}${(user.lastName?.[0] || '')}`.toUpperCase()}
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'User'}
                </h2>
                <p className="text-gray-600">{user.email}</p>
                <p className="text-sm text-gray-500">
                  Role: <span className="font-medium">{user.role}</span>
                </p>
              </div>
            </div>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
              >
                Edit Profile
              </button>
            )}
          </div>
        </div>

        {/* Profile Form */}
        <div className="p-6">
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* First Name */}
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                  First Name
                </label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 
                    ${!isEditing ? 'bg-gray-50 text-gray-700' : 'bg-white'} 
                    ${errors.firstName ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="Enter your first name"
                />
                {errors.firstName && (
                  <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>
                )}
              </div>

              {/* Last Name */}
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name
                </label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 
                    ${!isEditing ? 'bg-gray-50 text-gray-700' : 'bg-white'} 
                    ${errors.lastName ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="Enter your last name"
                />
                {errors.lastName && (
                  <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>
                )}
              </div>

              {/* Email */}
              <div className="md:col-span-2">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 
                    ${!isEditing ? 'bg-gray-50 text-gray-700' : 'bg-white'} 
                    ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="Enter your email address"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            {isEditing && (
              <div className="mt-6 flex space-x-3">
                <button
                  type="submit"
                  disabled={loading}
                  className={`px-6 py-2 rounded-md text-white font-medium transition-colors
                    ${loading 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-green-500 hover:bg-green-600'
                    }`}
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={loading}
                  className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}
          </form>
        </div>

        {/* Account Information */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Account Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">Customer ID:</span>
              <span className="ml-2 text-gray-600">{user.customerId || 'N/A'}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">User ID:</span>
              <span className="ml-2 text-gray-600">{user.id || user._id || 'N/A'}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Account Created:</span>
              <span className="ml-2 text-gray-600">
                {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
              </span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Last Login:</span>
              <span className="ml-2 text-gray-600">
                {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : 'Never'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
