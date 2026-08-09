/**
 * @file student/Applications.jsx
 * @description Student job applications tracker with status filters,
 * application timeline, and withdrawal functionality.
 */

import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { applicationAPI } from '@/services/api';
import toast from 'react-hot-toast';
import {
  BriefcaseIcon,
  FunnelIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationCircleIcon,
  DocumentTextIcon,
  BuildingOfficeIcon,
} from '@heroicons/react/24/outline';
import clsx from 'clsx';

const statusConfig = {
  pending: { label: 'Pending', color: 'badge-warning', icon: ClockIcon },
  shortlisted: { label: 'Shortlisted', color: 'badge-info', icon: CheckCircleIcon },
  interviewing: { label: 'Interviewing', color: 'badge-primary', icon: ExclamationCircleIcon },
  selected: { label: 'Selected', color: 'badge-success', icon: CheckCircleIcon },
  rejected: { label: 'Rejected', color: 'badge-danger', icon: XCircleIcon },
  withdrawn: { label: 'Withdrawn', color: 'badge-gray', icon: XCircleIcon },
};

export default function StudentApplications() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['my-applications', page, statusFilter],
    queryFn: () => applicationAPI.getMy({
      page,
      limit: 10,
      status: statusFilter || undefined,
    }),
  });

  const withdrawMutation = useMutation({
    mutationFn: (id) => applicationAPI.withdraw(id),
    onSuccess: () => {
      toast.success('Application withdrawn');
      queryClient.invalidateQueries({ queryKey: ['my-applications'] });
    },
    onError: () => {
      toast.error('Failed to withdraw application');
    },
  });

  const applications = data?.data?.data?.applications || [];
  const pagination = data?.data?.data || {};

  const handleWithdraw = (id, jobTitle) => {
    if (window.confirm(`Are you sure you want to withdraw your application for "${jobTitle}"?`)) {
      withdrawMutation.mutate(id);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">My Applications</h1>
        <p className="text-gray-600 mt-1">Track the status of your job applications</p>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <FunnelIcon className="w-5 h-5 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="input w-auto"
          >
            <option value="">All Status</option>
            {Object.entries(statusConfig).map(([key, { label }]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
          {statusFilter && (
            <button
              onClick={() => setStatusFilter('')}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Applications List */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                <div className="flex-1">
                  <div className="h-5 bg-gray-200 rounded w-1/3 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/4 mb-3"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="card text-center py-12">
          <XCircleIcon className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p className="text-red-500">Failed to load applications. Please try again.</p>
        </div>
      ) : applications.length === 0 ? (
        <div className="card text-center py-12">
          <DocumentTextIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No applications found</h3>
          <p className="text-gray-500 mb-4">
            {statusFilter ? 'No applications match this filter' : "You haven't applied to any jobs yet"}
          </p>
          <Link to="/jobs" className="btn-primary">Browse Jobs</Link>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {applications.map((app) => {
              const status = statusConfig[app.status] || statusConfig.pending;
              const StatusIcon = status.icon;

              return (
                <div key={app._id} className="card">
                  <div className="flex flex-col md:flex-row md:items-start gap-4">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <BuildingOfficeIcon className="w-6 h-6 text-gray-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <Link
                            to={`/jobs/${app.job?._id}`}
                            className="text-lg font-semibold text-gray-900 hover:text-primary-600"
                          >
                            {app.job?.title || 'Job Unavailable'}
                          </Link>
                          <p className="text-gray-600">{app.job?.company?.name}</p>
                        </div>
                        <span className={clsx('badge', status.color)}>
                          <StatusIcon className="w-4 h-4 mr-1" />
                          {status.label}
                        </span>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-4 text-sm text-gray-500">
                        <span>Applied: {new Date(app.createdAt).toLocaleDateString()}</span>
                        {app.job?.location?.city && <span>{app.job.location.city}</span>}
                        {app.job?.type && <span className="capitalize">{app.job.type}</span>}
                      </div>

                      {/* Interview rounds */}
                      {app.interviewRounds?.length > 0 && (
                        <div className="mt-3 pt-3 border-t">
                          <p className="text-sm font-medium text-gray-700 mb-2">Interview Rounds:</p>
                          <div className="flex flex-wrap gap-2">
                            {app.interviewRounds.map((round, idx) => (
                              <span
                                key={idx}
                                className={clsx(
                                  'badge',
                                  round.status === 'passed' ? 'badge-success' :
                                  round.status === 'failed' ? 'badge-danger' :
                                  'badge-gray'
                                )}
                              >
                                {round.roundName || `Round ${idx + 1}`}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="mt-4 flex flex-wrap gap-2">
                        <Link
                          to={`/jobs/${app.job?._id}`}
                          className="btn-secondary text-sm"
                        >
                          View Job
                        </Link>
                        {app.status === 'pending' && (
                          <button
                            onClick={() => handleWithdraw(app._id, app.job?.title)}
                            className="btn text-red-600 hover:bg-red-50 text-sm"
                            disabled={withdrawMutation.isPending}
                          >
                            Withdraw
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
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
