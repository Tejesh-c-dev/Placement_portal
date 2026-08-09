/**
 * @file Companies.jsx
 * @description Companies listing page with search and pagination.
 * Shows company cards with industry, location, and employee count.
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { companyAPI } from '@/services/api';
import {
  MagnifyingGlassIcon,
  BuildingOfficeIcon,
  MapPinIcon,
  UsersIcon,
  GlobeAltIcon,
} from '@heroicons/react/24/outline';

const industryColors = {
  'technology': 'badge-primary',
  'finance': 'badge-success',
  'consulting': 'badge-warning',
  'manufacturing': 'badge-info',
};

export default function Companies() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading, error } = useQuery({
    queryKey: ['companies', page, search],
    queryFn: () => companyAPI.getAll({ page, limit: 12, search }),
  });

  const companies = data?.data?.data?.companies || [];
  const pagination = data?.data?.data || {};

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Partner Companies</h1>
        <p className="text-gray-600">Explore companies that recruit from our campus</p>
      </div>

      {/* Search */}
      <div className="card mb-8">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search companies by name or industry..."
            className="input pl-10"
          />
        </div>
      </div>

      {/* Company Cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="h-12 w-12 bg-gray-200 rounded-lg mb-4"></div>
              <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
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
          <p className="text-gray-500">Try adjusting your search</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {companies.map((company) => (
              <Link
                key={company._id}
                to={`/companies/${company._id}`}
                className="card card-hover"
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-14 h-14 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    {company.logo ? (
                      <img src={company.logo} alt={company.name} className="w-10 h-10 object-contain" />
                    ) : (
                      <BuildingOfficeIcon className="w-7 h-7 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 truncate">{company.name}</h3>
                    <span className={`badge ${industryColors[company.industry?.toLowerCase()] || 'badge-gray'}`}>
                      {company.industry || 'Other'}
                    </span>
                  </div>
                </div>
                
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {company.description || 'No description available'}
                </p>

                <div className="flex flex-wrap gap-3 text-sm text-gray-500">
                  {company.headquarters?.city && (
                    <span className="flex items-center">
                      <MapPinIcon className="w-4 h-4 mr-1" />
                      {company.headquarters.city}
                    </span>
                  )}
                  {company.employeeCount && (
                    <span className="flex items-center">
                      <UsersIcon className="w-4 h-4 mr-1" />
                      {company.employeeCount}+ employees
                    </span>
                  )}
                  {company.website && (
                    <span className="flex items-center">
                      <GlobeAltIcon className="w-4 h-4 mr-1" />
                      Website
                    </span>
                  )}
                </div>
              </Link>
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
