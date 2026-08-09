/**
 * @file recruiter/Applications.jsx
 * @description Applications review page for recruiters to filter, view,
 * shortlist, and update candidate application statuses.
 */

import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { applicationAPI, jobAPI } from '@/services/api';
import toast from 'react-hot-toast';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  DocumentTextIcon,
  UserCircleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  EyeIcon,
  EnvelopeIcon,
} from '@heroicons/react/24/outline';
import clsx from 'clsx';

const statusConfig = {
  pending: { label: 'Pending', color: 'badge-warning', icon: ClockIcon },
  shortlisted: { label: 'Shortlisted', color: 'badge-info', icon: CheckCircleIcon },
  interviewing: { label: 'Interviewing', color: 'badge-primary', icon: ClockIcon },
  selected: { label: 'Selected', color: 'badge-success', icon: CheckCircleIcon },
  rejected: { label: 'Rejected', color: 'badge-danger', icon: XCircleIcon },
};

export default function RecruiterApplications() {
  const [searchParams] = useSearchParams();
  const [jobFilter, setJobFilter] = useState(searchParams.get('job') || '');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState([]);
  const queryClient = useQueryClient();

  const { data: jobsData } = useQuery({
    queryKey: ['recruiter-jobs-list'],
    queryFn: () => jobAPI.getMyJobs({ limit: 100 }),
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ['job-applications', jobFilter, statusFilter, search, page],
    queryFn: () => applicationAPI.getByJob(jobFilter || 'all', {
      page,
      limit: 15,
      status: statusFilter || undefined,
      search,
    }),
    enabled: true,
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => applicationAPI.updateStatus(id, { status }),
    onSuccess: () => {
      toast.success('Status updated');
      queryClient.invalidateQueries({ queryKey: ['job-applications'] });
    },
    onError: () => {
      toast.error('Failed to update status');
    },
  });

  const bulkUpdateMutation = useMutation({
    mutationFn: ({ ids, status }) => applicationAPI.bulkUpdateStatus({ applicationIds: ids, status }),
    onSuccess: () => {
      toast.success('Status updated for selected applications');
      setSelectedIds([]);
      queryClient.invalidateQueries({ queryKey: ['job-applications'] });
    },
  });

  const jobs = jobsData?.data?.data?.jobs || [];
  const applications = data?.data?.data?.applications || [];
  const pagination = data?.data?.data || {};

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedIds(applications.map((app) => app._id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelect = (id, checked) => {
    if (checked) {
      setSelectedIds([...selectedIds, id]);
    } else {
      setSelectedIds(selectedIds.filter((i) => i !== id));
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Applications</h1>
        <p className="text-gray-600 mt-1">Review and manage candidate applications</p>
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
              placeholder="Search by candidate name or email..."
              className="input pl-10"
            />
          </div>
          <select
            value={jobFilter}
            onChange={(e) => setJobFilter(e.target.value)}
            className="input w-auto"
          >
            <option value="">All Jobs</option>
            {jobs.map((job) => (
              <option key={job._id} value={job._id}>{job.title}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input w-auto"
          >
            <option value="">All Status</option>
            {Object.entries(statusConfig).map(([key, { label }]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedIds.length > 0 && (
        <div className="bg-primary-50 border border-primary-200 rounded-lg p-4 mb-6 flex flex-wrap items-center justify-between gap-4">
          <span className="text-primary-700 font-medium">
            {selectedIds.length} application(s) selected
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => bulkUpdateMutation.mutate({ ids: selectedIds, status: 'shortlisted' })}
              className="btn-secondary text-sm"
            >
              Shortlist
            </button>
            <button
              onClick={() => bulkUpdateMutation.mutate({ ids: selectedIds, status: 'rejected' })}
              className="btn text-red-600 hover:bg-red-50 text-sm"
            >
              Reject
            </button>
            <button
              onClick={() => setSelectedIds([])}
              className="btn-secondary text-sm"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Applications List */}
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
          <p className="text-red-500">Failed to load applications. Please try again.</p>
        </div>
      ) : applications.length === 0 ? (
        <div className="card text-center py-12">
          <DocumentTextIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No applications found</h3>
          <p className="text-gray-500">
            {jobFilter || statusFilter || search ? 'No applications match your filters' : 'No applications received yet'}
          </p>
        </div>
      ) : (
        <>
          {/* Select All */}
          <div className="flex items-center gap-2 mb-4">
            <input
              type="checkbox"
              checked={selectedIds.length === applications.length}
              onChange={(e) => handleSelectAll(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300"
            />
            <label className="text-sm text-gray-600">Select all</label>
          </div>

          <div className="space-y-4">
            {applications.map((app) => {
              const status = statusConfig[app.status] || statusConfig.pending;
              const StatusIcon = status.icon;

              return (
                <div key={app._id} className="card">
                  <div className="flex items-start gap-4">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(app._id)}
                      onChange={(e) => handleSelect(app._id, e.target.checked)}
                      className="w-4 h-4 mt-3 rounded border-gray-300"
                    />
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <UserCircleIcon className="w-8 h-8 text-gray-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {app.student?.user?.fullName || app.student?.user?.firstName || 'Unknown Candidate'}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {app.student?.user?.email}
                          </p>
                        </div>
                        <span className={clsx('badge', status.color)}>
                          <StatusIcon className="w-4 h-4 mr-1" />
                          {status.label}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-500">
                        <span>Applied for: <strong>{app.job?.title}</strong></span>
                        {app.student?.branch && <span>{app.student.branch}</span>}
                        {app.student?.cgpa && <span>CGPA: {app.student.cgpa}</span>}
                        <span>Applied: {new Date(app.createdAt).toLocaleDateString()}</span>
                      </div>

                      {/* Skills */}
                      {app.student?.skills?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {app.student.skills.slice(0, 5).map((skill, idx) => (
                            <span key={idx} className="badge-gray text-xs">{skill}</span>
                          ))}
                          {app.student.skills.length > 5 && (
                            <span className="text-xs text-gray-500">+{app.student.skills.length - 5} more</span>
                          )}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex flex-wrap gap-2 mt-4">
                        {app.student?.resume?.url && (
                          <a
                            href={app.student.resume.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-secondary text-sm"
                          >
                            <EyeIcon className="w-4 h-4 mr-1" />
                            View Resume
                          </a>
                        )}
                        <a
                          href={`mailto:${app.student?.user?.email}`}
                          className="btn-secondary text-sm"
                        >
                          <EnvelopeIcon className="w-4 h-4 mr-1" />
                          Email
                        </a>
                        {app.status === 'pending' && (
                          <>
                            <button
                              onClick={() => updateStatusMutation.mutate({ id: app._id, status: 'shortlisted' })}
                              className="btn text-green-600 hover:bg-green-50 text-sm"
                            >
                              Shortlist
                            </button>
                            <button
                              onClick={() => updateStatusMutation.mutate({ id: app._id, status: 'rejected' })}
                              className="btn text-red-600 hover:bg-red-50 text-sm"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {app.status === 'shortlisted' && (
                          <button
                            onClick={() => updateStatusMutation.mutate({ id: app._id, status: 'selected' })}
                            className="btn text-green-600 hover:bg-green-50 text-sm"
                          >
                            Select
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
