/**
 * @file student/Offers.jsx
 * @description Student offers management page showing received job offers
 * with accept/decline actions and offer details.
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { offerAPI } from '@/services/api';
import toast from 'react-hot-toast';
import {
  GiftIcon,
  BuildingOfficeIcon,
  CurrencyRupeeIcon,
  CalendarIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  BriefcaseIcon,
} from '@heroicons/react/24/outline';
import clsx from 'clsx';

const statusConfig = {
  pending: { label: 'Pending', color: 'badge-warning', icon: ClockIcon },
  accepted: { label: 'Accepted', color: 'badge-success', icon: CheckCircleIcon },
  declined: { label: 'Declined', color: 'badge-danger', icon: XCircleIcon },
  revoked: { label: 'Revoked', color: 'badge-gray', icon: XCircleIcon },
};

export default function StudentOffers() {
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['my-offers', page],
    queryFn: () => offerAPI.getMy({ page, limit: 10 }),
  });

  const acceptMutation = useMutation({
    mutationFn: (id) => offerAPI.accept(id),
    onSuccess: () => {
      toast.success('Offer accepted! Congratulations!');
      queryClient.invalidateQueries({ queryKey: ['my-offers'] });
    },
    onError: () => {
      toast.error('Failed to accept offer');
    },
  });

  const declineMutation = useMutation({
    mutationFn: ({ id, reason }) => offerAPI.decline(id, reason),
    onSuccess: () => {
      toast.success('Offer declined');
      queryClient.invalidateQueries({ queryKey: ['my-offers'] });
    },
    onError: () => {
      toast.error('Failed to decline offer');
    },
  });

  const offers = data?.data?.data?.offers || [];
  const pagination = data?.data?.data || {};

  const handleAccept = (id, company) => {
    if (window.confirm(`Are you sure you want to accept the offer from ${company}? This action cannot be undone.`)) {
      acceptMutation.mutate(id);
    }
  };

  const handleDecline = (id, company) => {
    const reason = window.prompt(`Please provide a reason for declining the offer from ${company}:`);
    if (reason !== null) {
      declineMutation.mutate({ id, reason });
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">My Offers</h1>
        <p className="text-gray-600 mt-1">View and respond to your job offers</p>
      </div>

      {/* Offers List */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 bg-gray-200 rounded-lg"></div>
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
          <p className="text-red-500">Failed to load offers. Please try again.</p>
        </div>
      ) : offers.length === 0 ? (
        <div className="card text-center py-12">
          <GiftIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No offers yet</h3>
          <p className="text-gray-500 mb-4">
            Keep applying and interviewing! Offers will appear here.
          </p>
          <Link to="/jobs" className="btn-primary">Browse Jobs</Link>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {offers.map((offer) => {
              const status = statusConfig[offer.status] || statusConfig.pending;
              const StatusIcon = status.icon;
              const isPending = offer.status === 'pending';
              const isExpiringSoon = isPending && offer.deadline && 
                new Date(offer.deadline) - new Date() < 3 * 24 * 60 * 60 * 1000;

              return (
                <div
                  key={offer._id}
                  className={clsx(
                    'card',
                    isPending && 'ring-2 ring-primary-200',
                    isExpiringSoon && 'ring-2 ring-yellow-300'
                  )}
                >
                  <div className="flex flex-col md:flex-row md:items-start gap-4">
                    <div className="w-14 h-14 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <BuildingOfficeIcon className="w-7 h-7 text-gray-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {offer.job?.title || 'Position'}
                          </h3>
                          <p className="text-gray-600">{offer.company?.name || offer.job?.company?.name}</p>
                        </div>
                        <span className={clsx('badge', status.color)}>
                          <StatusIcon className="w-4 h-4 mr-1" />
                          {status.label}
                        </span>
                      </div>

                      {/* Offer Details */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 p-4 bg-gray-50 rounded-lg">
                        <div>
                          <p className="text-sm text-gray-500">Package</p>
                          <p className="font-semibold text-gray-900 flex items-center">
                            <CurrencyRupeeIcon className="w-4 h-4 mr-1" />
                            {offer.package?.ctc 
                              ? `${(offer.package.ctc / 100000).toFixed(1)} LPA`
                              : 'Not specified'}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Job Type</p>
                          <p className="font-semibold text-gray-900 capitalize">
                            {offer.job?.type || 'Full-time'}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Offer Date</p>
                          <p className="font-semibold text-gray-900">
                            {new Date(offer.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        {offer.deadline && (
                          <div>
                            <p className="text-sm text-gray-500">Deadline</p>
                            <p className={clsx(
                              'font-semibold',
                              isExpiringSoon ? 'text-yellow-600' : 'text-gray-900'
                            )}>
                              {new Date(offer.deadline).toLocaleDateString()}
                              {isExpiringSoon && <span className="text-sm ml-1">(Soon!)</span>}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Remarks */}
                      {offer.remarks && (
                        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                          <p className="text-sm text-blue-800">
                            <strong>Note:</strong> {offer.remarks}
                          </p>
                        </div>
                      )}

                      {/* Actions */}
                      {isPending && (
                        <div className="mt-4 flex flex-wrap gap-3">
                          <button
                            onClick={() => handleAccept(offer._id, offer.company?.name || offer.job?.company?.name)}
                            disabled={acceptMutation.isPending}
                            className="btn-primary"
                          >
                            <CheckCircleIcon className="w-5 h-5 mr-1" />
                            Accept Offer
                          </button>
                          <button
                            onClick={() => handleDecline(offer._id, offer.company?.name || offer.job?.company?.name)}
                            disabled={declineMutation.isPending}
                            className="btn text-red-600 hover:bg-red-50"
                          >
                            <XCircleIcon className="w-5 h-5 mr-1" />
                            Decline
                          </button>
                          <Link
                            to={`/jobs/${offer.job?._id}`}
                            className="btn-secondary"
                          >
                            <BriefcaseIcon className="w-5 h-5 mr-1" />
                            View Job
                          </Link>
                        </div>
                      )}

                      {offer.status === 'accepted' && (
                        <div className="mt-4 p-3 bg-green-50 rounded-lg flex items-center gap-2">
                          <CheckCircleIcon className="w-5 h-5 text-green-600" />
                          <p className="text-green-800">
                            Congratulations! You accepted this offer on {new Date(offer.respondedAt || offer.updatedAt).toLocaleDateString()}
                          </p>
                        </div>
                      )}
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
