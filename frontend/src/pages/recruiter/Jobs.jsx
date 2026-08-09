/**
 * @file recruiter/Jobs.jsx
 * @description Job management page for recruiters to create, edit, publish,
 * and close job postings with status tracking.
 */

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { jobAPI } from '@/services/api';
import toast from 'react-hot-toast';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  BriefcaseIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
  UsersIcon,
  MapPinIcon,
  CurrencyRupeeIcon,
} from '@heroicons/react/24/outline';
import clsx from 'clsx';

const statusColors = {
  draft: 'badge-gray',
  open: 'badge-success',
  closed: 'badge-danger',
  paused: 'badge-warning',
};

export default function RecruiterJobs() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['recruiter-jobs', page, search, statusFilter],
    queryFn: () => jobAPI.getMyJobs({
      page,
      limit: 10,
      search,
      status: statusFilter || undefined,
    }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => jobAPI.delete(id),
    onSuccess: () => {
      toast.success('Job deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['recruiter-jobs'] });
    },
    onError: () => {
      toast.error('Failed to delete job');
    },
  });

  const closeMutation = useMutation({
    mutationFn: (id) => jobAPI.close(id),
    onSuccess: () => {
      toast.success('Job closed');
      queryClient.invalidateQueries({ queryKey: ['recruiter-jobs'] });
    },
  });

  const publishMutation = useMutation({
    mutationFn: (id) => jobAPI.publish(id),
    onSuccess: () => {
      toast.success('Job published');
      queryClient.invalidateQueries({ queryKey: ['recruiter-jobs'] });
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
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Job Postings</h1>
          <p className="text-gray-600 mt-1">Manage your job listings</p>
        </div>
        <Link to="/recruiter/jobs/new" className="btn-primary">
          <PlusIcon className="w-5 h-5 mr-2" />
          Post New Job
        </Link>
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
              placeholder="Search jobs..."
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
          <p className="text-gray-500 mb-4">
            {search || statusFilter ? 'No jobs match your filters' : "You haven't posted any jobs yet"}
          </p>
          <Link to="/recruiter/jobs/new" className="btn-primary">
            <PlusIcon className="w-5 h-5 mr-2" />
            Post Your First Job
          </Link>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {jobs.map((job) => (
              <div key={job._id} className="card">
                <div className="flex flex-col md:flex-row md:items-start gap-4">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <BriefcaseIcon className="w-6 h-6 text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <Link
                          to={`/recruiter/jobs/${job._id}`}
                          className="text-lg font-semibold text-gray-900 hover:text-primary-600"
                        >
                          {job.title}
                        </Link>
                        <div className="flex flex-wrap gap-3 mt-1 text-sm text-gray-500">
                          {job.location?.city && (
                            <span className="flex items-center">
                              <MapPinIcon className="w-4 h-4 mr-1" />
                              {job.location.city}
                            </span>
                          )}
                          <span className="capitalize">{job.type}</span>
                          {job.package?.ctc && (
                            <span className="flex items-center">
                              <CurrencyRupeeIcon className="w-4 h-4 mr-1" />
                              {(job.package.ctc / 100000).toFixed(1)} LPA
                            </span>
                          )}
                        </div>
                      </div>
                      <span className={clsx('badge', statusColors[job.status] || 'badge-gray')}>
                        {job.status}
                      </span>
                    </div>

                    {/* Stats */}
                    <div className="flex flex-wrap gap-4 mt-3 text-sm">
                      <span className="flex items-center text-gray-600">
                        <UsersIcon className="w-4 h-4 mr-1" />
                        {job.applicationsCount || 0} applications
                      </span>
                      <span className="text-gray-500">
                        Posted: {new Date(job.createdAt).toLocaleDateString()}
                      </span>
                      {job.deadline && (
                        <span className="text-gray-500">
                          Deadline: {new Date(job.deadline).toLocaleDateString()}
                        </span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2 mt-4">
                      <Link
                        to={`/recruiter/applications?job=${job._id}`}
                        className="btn-secondary text-sm"
                      >
                        <EyeIcon className="w-4 h-4 mr-1" />
                        View Applications
                      </Link>
                      <Link
                        to={`/recruiter/jobs/${job._id}/edit`}
                        className="btn-secondary text-sm"
                      >
                        <PencilIcon className="w-4 h-4 mr-1" />
                        Edit
                      </Link>
                      {job.status === 'open' && (
                        <button
                          onClick={() => closeMutation.mutate(job._id)}
                          className="btn text-yellow-600 hover:bg-yellow-50 text-sm"
                        >
                          <XCircleIcon className="w-4 h-4 mr-1" />
                          Close
                        </button>
                      )}
                      {job.status === 'draft' && (
                        <button
                          onClick={() => publishMutation.mutate(job._id)}
                          className="btn text-green-600 hover:bg-green-50 text-sm"
                        >
                          <CheckCircleIcon className="w-4 h-4 mr-1" />
                          Publish
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(job._id, job.title)}
                        className="btn text-red-600 hover:bg-red-50 text-sm"
                      >
                        <TrashIcon className="w-4 h-4 mr-1" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
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
