import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../App';

const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newUser, setNewUser] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: 'User'
  });
  const { user: currentUser } = useAuth();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await axios.get('/me/list');
      if (response.data.success) {
        setUsers(response.data.data.users || []);
      } else {
        console.error('Failed to fetch users:', response.data.error);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      // Fallback to mock data if API fails
      const mockUsers = [
        {
          _id: '1',
          firstName: currentUser?.firstName || 'Admin',
          lastName: currentUser?.lastName || 'User',
          email: currentUser?.email || 'admin@logisticsco.com',
          role: 'Admin',
          isActive: true,
          lastLoginAt: new Date().toISOString(),
          createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
        }
      ];
      
      // Only add mock users for non-admin users if it's their own data
      if (currentUser?.role !== 'Admin' && currentUser?.role !== 'admin') {
        setUsers([mockUsers[0]]);
      } else {
        setUsers(mockUsers);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      // For demo purposes, add to local state
      const createdUser = {
        _id: Date.now().toString(),
        ...newUser,
        isActive: true,
        createdAt: new Date().toISOString(),
        lastLoginAt: null
      };
      
      setUsers([...users, createdUser]);
      setNewUser({ firstName: '', lastName: '', email: '', role: 'User' });
      setShowCreateForm(false);
      
      // TODO: Replace with actual API call
      // const response = await axios.post('/api/users', newUser);
    } catch (error) {
      console.error('Error creating user:', error);
    }
  };

  const toggleUserStatus = async (userId, currentStatus) => {
    try {
      setUsers(users.map(user => 
        user._id === userId 
          ? { ...user, isActive: !currentStatus }
          : user
      ));
      // TODO: Replace with actual API call
      // await axios.patch(`/api/users/${userId}`, { isActive: !currentStatus });
    } catch (error) {
      console.error('Error updating user status:', error);
    }
  };

  const getRoleColor = (role) => {
    return role === 'Admin' 
      ? 'bg-purple-100 text-purple-800'
      : 'bg-blue-100 text-blue-800';
  };

  const getStatusColor = (isActive) => {
    return isActive 
      ? 'bg-green-100 text-green-800'
      : 'bg-red-100 text-red-800';
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-16 bg-gray-200 rounded"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Team Members</h1>
        {/* Only show Add Team Member button for Admins */}
        {(currentUser?.role === 'Admin' || currentUser?.role === 'admin') && (
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Team Member
          </button>
        )}
      </div>

      {/* Create User Form */}
      {showCreateForm && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Add New Team Member</h2>
          <form onSubmit={handleCreateUser}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                <input
                  type="text"
                  required
                  value={newUser.firstName}
                  onChange={(e) => setNewUser({...newUser, firstName: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="John"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                <input
                  type="text"
                  required
                  value={newUser.lastName}
                  onChange={(e) => setNewUser({...newUser, lastName: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Doe"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  required
                  value={newUser.email}
                  onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="john.doe@logisticsco.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="User">User</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                type="submit"
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
              >
                Add Team Member
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

      {/* Users List */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Team Members ({users.length})
          </h3>
        </div>
        <div className="divide-y divide-gray-200">
          {users.map((user) => (
            <div key={user._id} className="p-6 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-lg font-medium text-blue-600">
                      {user.firstName?.[0]}{user.lastName?.[0]}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      {user.firstName} {user.lastName}
                    </h3>
                    <p className="text-gray-600">{user.email}</p>
                    <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
                      <span>
                        Last login: {user.lastLoginAt 
                          ? new Date(user.lastLoginAt).toLocaleDateString()
                          : 'Never'
                        }
                      </span>
                      <span>
                        Member since {new Date(user.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleColor(user.role)}`}>
                    {user.role}
                  </span>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(user.isActive)}`}>
                    {user.isActive ? 'Active' : 'Inactive'}
                  </span>
                  {currentUser?.role === 'Admin' && user._id !== currentUser?.id && (
                    <button
                      onClick={() => toggleUserStatus(user._id, user.isActive)}
                      className={`px-3 py-1 text-sm rounded ${
                        user.isActive 
                          ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}
                    >
                      {user.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default UsersPage;
