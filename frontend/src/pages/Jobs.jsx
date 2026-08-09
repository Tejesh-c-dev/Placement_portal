/**
 * @file Jobs.jsx
 * @description Job listing page with search, filters, and pagination.
 * Displays job cards with company info, salary, location, and type.
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { jobAPI } from '@/services/api';
import {
  MagnifyingGlassIcon,
  MapPinIcon,
  CurrencyRupeeIcon,
  BriefcaseIcon,
  BuildingOfficeIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';
import clsx from 'clsx';

const jobTypeColors = {
  'full-time': 'badge-success',
  'internship': 'badge-primary',
  'contract': 'badge-warning',
};

export default function Jobs() {
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    type: '',
    minPackage: '',
    location: '',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);

  const { data, isLoading, error } = useQuery({
    queryKey: ['jobs', page, search, filters],
    queryFn: () => jobAPI.getAll({ page, limit: 12, search, ...filters }),
  });

  const jobs = data?.data?.data?.jobs || [];
  const pagination = data?.data?.data || {};

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Browse Jobs</h1>
        <p className="text-gray-600">Find your perfect opportunity from our partner companies</p>
      </div>

      {/* Search and Filters */}
      <div className="card mb-8">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search jobs by title, company, or skills..."
              className="input pl-10"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="btn-secondary flex items-center justify-center md:w-auto"
          >
            <FunnelIcon className="w-5 h-5 mr-2" />
            Filters
          </button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t">
            <div>
              <label className="label">Job Type</label>
              <select
                value={filters.type}
                onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                className="input"
              >
                <option value="">All Types</option>
                <option value="full-time">Full Time</option>
                <option value="internship">Internship</option>
                <option value="contract">Contract</option>
              </select>
            </div>
            <div>
              <label className="label">Min Package (LPA)</label>
              <input
                type="number"
                value={filters.minPackage}
                onChange={(e) => setFilters({ ...filters, minPackage: e.target.value })}
                placeholder="e.g., 5"
                className="input"
              />
            </div>
            <div>
              <label className="label">Location</label>
              <input
                type="text"
                value={filters.location}
                onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                placeholder="e.g., Bangalore"
                className="input"
              />
            </div>
          </div>
        )}
      </div>

      {/* Job Cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/3"></div>
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
          <p className="text-gray-500">Try adjusting your search or filters</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {jobs.map((job) => (
              <Link
                key={job._id}
                to={`/jobs/${job._id}`}
                className="card card-hover"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                    <BuildingOfficeIcon className="w-6 h-6 text-gray-400" />
                  </div>
                  <span className={clsx('badge', jobTypeColors[job.type] || 'badge-gray')}>
                    {job.type}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">{job.title}</h3>
                <p className="text-gray-600 mb-4">{job.company?.name}</p>
                <div className="flex flex-wrap gap-3 text-sm text-gray-500">
                  <span className="flex items-center">
                    <MapPinIcon className="w-4 h-4 mr-1" />
                    {job.location?.city || 'Remote'}
                  </span>
                  <span className="flex items-center">
                    <CurrencyRupeeIcon className="w-4 h-4 mr-1" />
                    {job.package?.ctc ? `${(job.package.ctc / 100000).toFixed(1)} LPA` : 'Not disclosed'}
                  </span>
                </div>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex justify-center mt-8 gap-2">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className="btn-secondary btn-sm"
              >
                Previous
              </button>
              <span className="flex items-center px-4 text-gray-600">
                Page {page} of {pagination.totalPages}
              </span>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page >= pagination.totalPages}
                className="btn-secondary btn-sm"
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
