/**
 * @file admin/Students.jsx
 * @description Student management page for admins to view, search, filter,
 * and export student data with placement verification status.
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { studentAPI, adminAPI } from '@/services/api';
import toast from 'react-hot-toast';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  UserCircleIcon,
  AcademicCapIcon,
  ArrowDownTrayIcon,
  EyeIcon,
  EnvelopeIcon,
  CheckBadgeIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import clsx from 'clsx';

const branches = [
  'Computer Science',
  'Information Technology',
  'Electronics',
  'Electrical',
  'Mechanical',
  'Civil',
];

export default function AdminStudents() {
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    branch: '',
    batch: '',
    placed: '',
    minCGPA: '',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-students', page, search, filters],
    queryFn: () => studentAPI.getAll({
      page,
      limit: 15,
      search,
      ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v)),
    }),
  });

  const exportMutation = useMutation({
    mutationFn: () => adminAPI.exportStudents(filters),
    onSuccess: (response) => {
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `students_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      toast.success('Export downloaded');
    },
    onError: () => {
      toast.error('Failed to export data');
    },
  });

  const students = data?.data?.data?.students || [];
  const pagination = data?.data?.data || {};

  const currentYear = new Date().getFullYear();
  const batchYears = Array.from({ length: 6 }, (_, i) => currentYear + 2 - i);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Student Management</h1>
          <p className="text-gray-600 mt-1">View and manage student profiles</p>
        </div>
        <button
          onClick={() => exportMutation.mutate()}
          disabled={exportMutation.isPending}
          className="btn-secondary"
        >
          <ArrowDownTrayIcon className="w-5 h-5 mr-2" />
          {exportMutation.isPending ? 'Exporting...' : 'Export CSV'}
        </button>
      </div>

      {/* Search and Filters */}
      <div className="card mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, or roll number..."
              className="input pl-10"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="btn-secondary"
          >
            <FunnelIcon className="w-5 h-5 mr-2" />
            Filters
          </button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t">
            <div>
              <label className="label">Branch</label>
              <select
                value={filters.branch}
                onChange={(e) => setFilters({ ...filters, branch: e.target.value })}
                className="input"
              >
                <option value="">All Branches</option>
                {branches.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Batch</label>
              <select
                value={filters.batch}
                onChange={(e) => setFilters({ ...filters, batch: e.target.value })}
                className="input"
              >
                <option value="">All Batches</option>
                {batchYears.map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Placement Status</label>
              <select
                value={filters.placed}
                onChange={(e) => setFilters({ ...filters, placed: e.target.value })}
                className="input"
              >
                <option value="">All</option>
                <option value="true">Placed</option>
                <option value="false">Not Placed</option>
              </select>
            </div>
            <div>
              <label className="label">Min CGPA</label>
              <input
                type="number"
                step="0.1"
                value={filters.minCGPA}
                onChange={(e) => setFilters({ ...filters, minCGPA: e.target.value })}
                placeholder="e.g., 7.0"
                className="input"
                min="0"
                max="10"
              />
            </div>
          </div>
        )}
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-4">
          <p className="text-2xl font-bold text-blue-800">{pagination.total || 0}</p>
          <p className="text-sm text-blue-600">Total Students</p>
        </div>
        <div className="bg-green-50 rounded-lg p-4">
          <p className="text-2xl font-bold text-green-800">{pagination.placedCount || 0}</p>
          <p className="text-sm text-green-600">Placed</p>
        </div>
        <div className="bg-yellow-50 rounded-lg p-4">
          <p className="text-2xl font-bold text-yellow-800">{pagination.unplacedCount || 0}</p>
          <p className="text-sm text-yellow-600">Not Placed</p>
        </div>
        <div className="bg-purple-50 rounded-lg p-4">
          <p className="text-2xl font-bold text-purple-800">
            {pagination.avgCGPA ? pagination.avgCGPA.toFixed(2) : 'N/A'}
          </p>
          <p className="text-sm text-purple-600">Avg CGPA</p>
        </div>
      </div>

      {/* Students List */}
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
          <p className="text-red-500">Failed to load students. Please try again.</p>
        </div>
      ) : students.length === 0 ? (
        <div className="card text-center py-12">
          <UserCircleIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No students found</h3>
          <p className="text-gray-500">Try adjusting your search or filters</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Student</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Branch</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Batch</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">CGPA</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Status</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {students.map((student) => (
                  <tr key={student._id} className="hover:bg-gray-50">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                          <UserCircleIcon className="w-6 h-6 text-gray-400" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{student.user?.fullName || student.user?.firstName}</p>
                          <p className="text-sm text-gray-500">{student.rollNumber}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-gray-600">{student.branch}</td>
                    <td className="px-4 py-4 text-gray-600">{student.batch}</td>
                    <td className="px-4 py-4">
                      <span className={clsx(
                        'font-medium',
                        student.cgpa >= 8 ? 'text-green-600' :
                        student.cgpa >= 7 ? 'text-blue-600' :
                        'text-gray-600'
                      )}>
                        {student.cgpa || 'N/A'}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      {student.isPlaced ? (
                        <span className="badge badge-success">
                          <CheckBadgeIcon className="w-4 h-4 mr-1" />
                          Placed
                        </span>
                      ) : (
                        <span className="badge badge-gray">
                          <XCircleIcon className="w-4 h-4 mr-1" />
                          Not Placed
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex justify-end gap-2">
                        <Link
                          to={`/admin/students/${student._id}`}
                          className="btn-secondary text-sm p-2"
                          title="View Profile"
                        >
                          <EyeIcon className="w-4 h-4" />
                        </Link>
                        <a
                          href={`mailto:${student.user?.email}`}
                          className="btn-secondary text-sm p-2"
                          title="Send Email"
                        >
                          <EnvelopeIcon className="w-4 h-4" />
                        </a>
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
