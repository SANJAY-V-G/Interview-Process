"use client"

import { useState, useEffect } from 'react';
import { X, User, Shield, ShieldOff, Search, Clock } from 'lucide-react';

interface User {
  username: string;
  isAdmin: boolean;
  tempadmin: boolean;
}

const UserManagement = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchUsers = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/get-users');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setUsers(data.users);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const updateTempAdminStatus = async (username: string, isTempAdmin: boolean) => {
    try {
      const response = await fetch('http://localhost:8000/api/update-user-tempadmin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, isTempAdmin })
      });

      if (!response.ok) {
        throw new Error('Failed to update user');
      }

      setUsers(users.map(user => 
        user.username === username ? { ...user, tempadmin: isTempAdmin } : user
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user');
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen]);

  // Filter to show only non-admin users (admin: false) and apply search filter
  const filteredUsers = users
    .filter(user => !user.isAdmin) // Only show non-admin users
    .filter(user => user.username.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-purple-400 text-white rounded-lg hover:from-purple-700 hover:to-purple-500 transition-all shadow-lg hover:shadow-xl font-medium flex items-center ml-4"
      >
        Manage Users
        <User className="ml-2 h-4 w-4" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
            <div className="border-b border-gray-200 p-6 flex justify-between items-center">
              <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                <User className="h-5 w-5 mr-2" />
                User Management (Non-Admin Users)
              </h3>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {error && (
              <div className="mx-6 mt-2 p-3 bg-red-100 text-red-700 rounded-lg">
                {error}
              </div>
            )}

            <div className="p-6 overflow-y-auto">
              {/* Search Bar */}
              <div className="mb-4 flex items-center bg-gray-100 rounded-lg px-3 py-2 w-full max-w-sm">
                <Search className="text-gray-500 w-4 h-4 mr-2" />
                <input
                  type="text"
                  placeholder="Search by username"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-transparent outline-none w-full text-sm text-gray-800"
                />
              </div>

              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Username
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredUsers.length > 0 ? (
                        filteredUsers.map((user) => (
                          <tr key={user.username} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                {user.username}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex flex-col space-y-1">
                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                                  User
                                </span>
                                {user.tempadmin && (
                                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                    Temporary Admin
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex space-x-2">
                                {!user.tempadmin ? (
                                  <button
                                    onClick={() => updateTempAdminStatus(user.username, true)}
                                    className="text-blue-600 hover:text-blue-800 flex items-center"
                                  >
                                    <Clock className="h-4 w-4 mr-1" />
                                    Make Temp Admin
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => updateTempAdminStatus(user.username, false)}
                                    className="text-red-600 hover:text-red-800 flex items-center"
                                  >
                                    <ShieldOff className="h-4 w-4 mr-1" />
                                    Remove Temp Admin
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={3} className="text-center py-4 text-sm text-gray-500">
                            No non-admin users found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="border-t border-gray-200 px-6 py-4 flex justify-end">
              <button
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default UserManagement;