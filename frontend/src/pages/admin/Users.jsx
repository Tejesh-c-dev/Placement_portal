/**
 * @file admin/Users.jsx
 * @description User management page for admins to view, search,
 * modify roles, and manage user accounts and statuses.
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminAPI } from '@/services/api';
import toast from 'react-hot-toast';
import {
  MagnifyingGlassIcon,
  UserCircleIcon,
  ShieldCheckIcon,
  NoSymbolIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  TrashIcon,
  EnvelopeIcon,
} from '@heroicons/react/24/outline';
import clsx from 'clsx';

const roleColors = {
  student: 'badge-primary',
  recruiter: 'badge-info',
  admin: 'badge-warning',
  superadmin: 'badge-danger',
};

export default function AdminUsers() {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-users', page, search, roleFilter, statusFilter],
    queryFn: () => adminAPI.getAllUsers({
      page,
      limit: 15,
      search,
      role: roleFilter || undefined,
      isActive: statusFilter || undefined,
    }),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, isActive }) => adminAPI.updateUserStatus(id, { isActive }),
    onSuccess: () => {
      toast.success('User status updated');
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: () => {
      toast.error('Failed to update user status');
    },
  });

  const changeRoleMutation = useMutation({
    mutationFn: ({ id, role }) => adminAPI.changeUserRole(id, { role }),
    onSuccess: () => {
      toast.success('User role updated');
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: () => {
      toast.error('Failed to update user role');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => adminAPI.deleteUser(id),
    onSuccess: () => {
      toast.success('User deleted');
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: () => {
      toast.error('Failed to delete user');
    },
  });

  const users = data?.data?.data?.users || [];
  const pagination = data?.data?.data || {};

  const handleToggleStatus = (user) => {
    const action = user.isActive ? 'deactivate' : 'activate';
    if (window.confirm(`Are you sure you want to ${action} ${user.fullName || user.firstName}?`)) {
      updateStatusMutation.mutate({ id: user._id, isActive: !user.isActive });
    }
  };

  const handleChangeRole = (id, currentRole) => {
    const roles = ['student', 'recruiter', 'admin'];
    const newRole = window.prompt(
      `Enter new role for user (${roles.join(', ')}):`,
      currentRole
    );
    if (newRole && roles.includes(newRole) && newRole !== currentRole) {
      changeRoleMutation.mutate({ id, role: newRole });
    }
  };

  const handleDelete = (user) => {
    if (window.confirm(`Are you sure you want to delete ${user.fullName || user.firstName}? This action cannot be undone.`)) {
      deleteMutation.mutate(user._id);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
        <p className="text-gray-600 mt-1">Manage all user accounts</p>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email..."
              className="input pl-10"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="input w-auto"
          >
            <option value="">All Roles</option>
            <option value="student">Student</option>
            <option value="recruiter">Recruiter</option>
            <option value="admin">Admin</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input w-auto"
          >
            <option value="">All Status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-blue-800">{pagination.total || 0}</p>
          <p className="text-sm text-blue-600">Total Users</p>
        </div>
        <div className="bg-green-50 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-green-800">{pagination.activeCount || 0}</p>
          <p className="text-sm text-green-600">Active</p>
        </div>
        <div className="bg-purple-50 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-purple-800">{pagination.studentCount || 0}</p>
          <p className="text-sm text-purple-600">Students</p>
        </div>
        <div className="bg-orange-50 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-orange-800">{pagination.recruiterCount || 0}</p>
          <p className="text-sm text-orange-600">Recruiters</p>
        </div>
      </div>

      {/* Users List */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-5 bg-gray-200 rounded w-1/3 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="card text-center py-12">
          <p className="text-red-500">Failed to load users. Please try again.</p>
        </div>
      ) : users.length === 0 ? (
        <div className="card text-center py-12">
          <UserCircleIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
          <p className="text-gray-500">No users match your search criteria</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">User</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Role</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Joined</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Last Login</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user._id} className="hover:bg-gray-50">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                          <UserCircleIcon className="w-6 h-6 text-gray-400" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{user.fullName || `${user.firstName} ${user.lastName}`}</p>
                          <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={clsx('badge capitalize', roleColors[user.role] || 'badge-gray')}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      {user.isActive ? (
                        <span className="flex items-center text-green-600">
                          <CheckCircleIcon className="w-4 h-4 mr-1" />
                          Active
                        </span>
                      ) : (
                        <span className="flex items-center text-red-600">
                          <ExclamationCircleIcon className="w-4 h-4 mr-1" />
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-gray-600">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-4 text-gray-600">
                      {user.lastLogin
                        ? new Date(user.lastLogin).toLocaleDateString()
                        : 'Never'}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex justify-end gap-2">
                        <a
                          href={`mailto:${user.email}`}
                          className="btn-secondary text-sm p-2"
                          title="Send Email"
                        >
                          <EnvelopeIcon className="w-4 h-4" />
                        </a>
                        <button
                          onClick={() => handleChangeRole(user._id, user.role)}
                          className="btn-secondary text-sm p-2"
                          title="Change Role"
                        >
                          <ShieldCheckIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(user)}
                          className={clsx(
                            'btn text-sm p-2',
                            user.isActive ? 'text-yellow-600 hover:bg-yellow-50' : 'text-green-600 hover:bg-green-50'
                          )}
                          title={user.isActive ? 'Deactivate' : 'Activate'}
                        >
                          <NoSymbolIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(user)}
                          className="btn text-red-600 hover:bg-red-50 text-sm p-2"
                          title="Delete"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex justify-center mt-8 gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn-secondary disabled:opacity-50"
              >
                Previous
              </button>
              <span className="flex items-center px-4 text-gray-600">
                Page {page} of {pagination.totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={page === pagination.totalPages}
                className="btn-secondary disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
