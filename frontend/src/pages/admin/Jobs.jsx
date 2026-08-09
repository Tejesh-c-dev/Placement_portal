/**
 * @file admin/Jobs.jsx
 * @description Job postings management for admins to monitor, approve,
 * and manage job listings across all companies.
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { jobAPI } from '@/services/api';
import toast from 'react-hot-toast';
import {
  MagnifyingGlassIcon,
  BriefcaseIcon,
  BuildingOfficeIcon,
  MapPinIcon,
  CurrencyRupeeIcon,
  UsersIcon,
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
  PauseCircleIcon,
} from '@heroicons/react/24/outline';
import clsx from 'clsx';

const statusColors = {
  draft: 'badge-gray',
  open: 'badge-success',
  closed: 'badge-danger',
  paused: 'badge-warning',
};

export default function AdminJobs() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-jobs', page, search, statusFilter],
    queryFn: () => jobAPI.getAll({
      page,
      limit: 15,
      search,
      status: statusFilter || undefined,
    }),
  });

  const closeMutation = useMutation({
    mutationFn: (id) => jobAPI.close(id),
    onSuccess: () => {
      toast.success('Job closed');
      queryClient.invalidateQueries({ queryKey: ['admin-jobs'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => jobAPI.delete(id),
    onSuccess: () => {
      toast.success('Job deleted');
      queryClient.invalidateQueries({ queryKey: ['admin-jobs'] });
    },
  });

  const jobs = data?.data?.data?.jobs || [];
  const pagination = data?.data?.data || {};

  const handleDelete = (id, title) => {
    if (window.confirm(`Are you sure you want to delete "${title}"? This action cannot be undone.`)) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Job Management</h1>
        <p className="text-gray-600 mt-1">Manage all job postings across the platform</p>
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
              placeholder="Search jobs by title or company..."
              className="input pl-10"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input w-auto"
          >
            <option value="">All Status</option>
            <option value="open">Open</option>
            <option value="closed">Closed</option>
            <option value="draft">Draft</option>
            <option value="paused">Paused</option>
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-green-50 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-green-800">{pagination.openCount || 0}</p>
          <p className="text-sm text-green-600">Open</p>
        </div>
        <div className="bg-red-50 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-red-800">{pagination.closedCount || 0}</p>
          <p className="text-sm text-red-600">Closed</p>
        </div>
        <div className="bg-gray-100 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-gray-800">{pagination.draftCount || 0}</p>
          <p className="text-sm text-gray-600">Draft</p>
        </div>
        <div className="bg-blue-50 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-blue-800">{pagination.totalApplications || 0}</p>
          <p className="text-sm text-blue-600">Total Applications</p>
        </div>
      </div>

      {/* Jobs List */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
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
          <p className="text-red-500">Failed to load jobs. Please try again.</p>
        </div>
      ) : jobs.length === 0 ? (
        <div className="card text-center py-12">
          <BriefcaseIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs found</h3>
          <p className="text-gray-500">No jobs match your search criteria</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Job</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Company</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Location</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Package</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Applications</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Status</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {jobs.map((job) => (
                  <tr key={job._id} className="hover:bg-gray-50">
                    <td className="px-4 py-4">
                      <Link
                        to={`/jobs/${job._id}`}
                        className="font-medium text-gray-900 hover:text-primary-600"
                      >
                        {job.title}
                      </Link>
                      <p className="text-sm text-gray-500 capitalize">{job.type}</p>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <BuildingOfficeIcon className="w-5 h-5 text-gray-400" />
                        <span className="text-gray-600">{job.company?.name || 'Unknown'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-gray-600">
                      {job.location?.city || 'Remote'}
                    </td>
                    <td className="px-4 py-4 text-gray-600">
                      {job.package?.ctc
                        ? `₹${(job.package.ctc / 100000).toFixed(1)} LPA`
                        : 'N/A'}
                    </td>
                    <td className="px-4 py-4">
                      <span className="flex items-center text-gray-600">
                        <UsersIcon className="w-4 h-4 mr-1" />
                        {job.applicationsCount || 0}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className={clsx('badge', statusColors[job.status] || 'badge-gray')}>
                        {job.status}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex justify-end gap-2">
                        <Link
                          to={`/jobs/${job._id}`}
                          className="btn-secondary text-sm p-2"
                          title="View"
                        >
                          <EyeIcon className="w-4 h-4" />
                        </Link>
                        {job.status === 'open' && (
                          <button
                            onClick={() => closeMutation.mutate(job._id)}
                            className="btn text-yellow-600 hover:bg-yellow-50 text-sm p-2"
                            title="Close"
                          >
                            <PauseCircleIcon className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(job._id, job.title)}
                          className="btn text-red-600 hover:bg-red-50 text-sm p-2"
                          title="Delete"
                        >
                          <XCircleIcon className="w-4 h-4" />
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
