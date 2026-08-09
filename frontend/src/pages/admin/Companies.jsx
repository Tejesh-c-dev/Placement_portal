/**
 * @file admin/Companies.jsx
 * @description Company management page for admins to approve, reject,
 * and manage registered recruiting companies.
 */

import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminAPI, companyAPI } from '@/services/api';
import toast from 'react-hot-toast';
import {
  MagnifyingGlassIcon,
  BuildingOfficeIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  MapPinIcon,
  GlobeAltIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';
import clsx from 'clsx';

const statusConfig = {
  pending: { label: 'Pending', color: 'badge-warning', icon: ClockIcon },
  approved: { label: 'Approved', color: 'badge-success', icon: CheckCircleIcon },
  rejected: { label: 'Rejected', color: 'badge-danger', icon: XCircleIcon },
};

export default function AdminCompanies() {
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-companies', page, search, statusFilter],
    queryFn: () => adminAPI.getAllCompanies({
      page,
      limit: 15,
      search,
      status: statusFilter || undefined,
    }),
  });

  const approveMutation = useMutation({
    mutationFn: (id) => companyAPI.approve(id),
    onSuccess: () => {
      toast.success('Company approved');
      queryClient.invalidateQueries({ queryKey: ['admin-companies'] });
    },
    onError: () => {
      toast.error('Failed to approve company');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }) => companyAPI.reject(id, reason),
    onSuccess: () => {
      toast.success('Company rejected');
      queryClient.invalidateQueries({ queryKey: ['admin-companies'] });
    },
    onError: () => {
      toast.error('Failed to reject company');
    },
  });

  const companies = data?.data?.data?.companies || [];
  const pagination = data?.data?.data || {};

  const handleApprove = (id, name) => {
    if (window.confirm(`Approve ${name} as a recruiting partner?`)) {
      approveMutation.mutate(id);
    }
  };

  const handleReject = (id, name) => {
    const reason = window.prompt(`Please provide a reason for rejecting ${name}:`);
    if (reason !== null) {
      rejectMutation.mutate({ id, reason });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Company Management</h1>
        <p className="text-gray-600 mt-1">Approve and manage recruiting companies</p>
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
              placeholder="Search companies..."
              className="input pl-10"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input w-auto"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-yellow-50 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-yellow-800">{pagination.pendingCount || 0}</p>
          <p className="text-sm text-yellow-600">Pending Approval</p>
        </div>
        <div className="bg-green-50 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-green-800">{pagination.approvedCount || 0}</p>
          <p className="text-sm text-green-600">Approved</p>
        </div>
        <div className="bg-red-50 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-red-800">{pagination.rejectedCount || 0}</p>
          <p className="text-sm text-red-600">Rejected</p>
        </div>
      </div>

      {/* Companies List */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 bg-gray-200 rounded-lg"></div>
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
          <p className="text-red-500">Failed to load companies. Please try again.</p>
        </div>
      ) : companies.length === 0 ? (
        <div className="card text-center py-12">
          <BuildingOfficeIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No companies found</h3>
          <p className="text-gray-500">
            {statusFilter ? 'No companies match this filter' : 'No companies registered yet'}
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {companies.map((company) => {
              const status = statusConfig[company.status] || statusConfig.pending;
              const StatusIcon = status.icon;
              const isPending = company.status === 'pending';

              return (
                <div
                  key={company._id}
                  className={clsx('card', isPending && 'border-l-4 border-l-yellow-400')}
                >
                  <div className="flex flex-col md:flex-row md:items-start gap-4">
                    <div className="w-14 h-14 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      {company.logo ? (
                        <img src={company.logo} alt={company.name} className="w-10 h-10 object-contain" />
                      ) : (
                        <BuildingOfficeIcon className="w-7 h-7 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{company.name}</h3>
                          <p className="text-gray-600">{company.industry}</p>
                        </div>
                        <span className={clsx('badge', status.color)}>
                          <StatusIcon className="w-4 h-4 mr-1" />
                          {status.label}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-500">
                        {company.headquarters?.city && (
                          <span className="flex items-center">
                            <MapPinIcon className="w-4 h-4 mr-1" />
                            {company.headquarters.city}
                          </span>
                        )}
                        {company.website && (
                          <a
                            href={company.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center hover:text-primary-600"
                          >
                            <GlobeAltIcon className="w-4 h-4 mr-1" />
                            Website
                          </a>
                        )}
                        <span>Registered: {new Date(company.createdAt).toLocaleDateString()}</span>
                      </div>

                      {company.description && (
                        <p className="mt-2 text-sm text-gray-600 line-clamp-2">{company.description}</p>
                      )}

                      {/* Recruiter Info */}
                      {company.registeredBy && (
                        <div className="mt-3 pt-3 border-t text-sm">
                          <span className="text-gray-500">Registered by: </span>
                          <span className="text-gray-700">
                            {[company.registeredBy.firstName, company.registeredBy.lastName].filter(Boolean).join(' ')}
                            {' '}({company.registeredBy.email})
                          </span>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex flex-wrap gap-2 mt-4">
                        <Link
                          to={`/admin/companies/${company._id}`}
                          className="btn-secondary text-sm"
                        >
                          <EyeIcon className="w-4 h-4 mr-1" />
                          View Details
                        </Link>
                        {isPending && (
                          <>
                            <button
                              onClick={() => handleApprove(company._id, company.name)}
                              disabled={approveMutation.isPending}
                              className="btn text-green-600 hover:bg-green-50 text-sm"
                            >
                              <CheckCircleIcon className="w-4 h-4 mr-1" />
                              Approve
                            </button>
                            <button
                              onClick={() => handleReject(company._id, company.name)}
                              disabled={rejectMutation.isPending}
                              className="btn text-red-600 hover:bg-red-50 text-sm"
                            >
                              <XCircleIcon className="w-4 h-4 mr-1" />
                              Reject
                            </button>
                          </>
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
