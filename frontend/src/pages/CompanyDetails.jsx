/**
 * @file CompanyDetails.jsx
 * @description Single company details page showing company profile,
 * HR contacts, active job openings, and company statistics.
 */

import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { companyAPI, jobAPI } from '@/services/api';
import {
  MapPinIcon,
  BuildingOfficeIcon,
  GlobeAltIcon,
  UsersIcon,
  BriefcaseIcon,
  ArrowLeftIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline';

export default function CompanyDetails() {
  const { id } = useParams();

  const { data, isLoading, error } = useQuery({
    queryKey: ['company', id],
    queryFn: () => companyAPI.getById(id),
  });

  const company = data?.data?.data?.company;

  const { data: jobsData } = useQuery({
    queryKey: ['company-jobs', id],
    queryFn: () => jobAPI.getAll({ company: id, status: 'open', limit: 5 }),
    enabled: !!company,
  });

  const jobs = jobsData?.data?.data?.jobs || [];

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-8"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !company) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <BuildingOfficeIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Company Not Found</h2>
        <p className="text-gray-500 mb-6">This company may have been removed or doesn't exist.</p>
        <Link to="/companies" className="btn-primary">Browse Companies</Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Back link */}
      <Link to="/companies" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6">
        <ArrowLeftIcon className="w-4 h-4 mr-2" />
        Back to Companies
      </Link>

      {/* Header */}
      <div className="card mb-6">
        <div className="flex flex-col md:flex-row md:items-start gap-6">
          <div className="w-20 h-20 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
            {company.logo ? (
              <img src={company.logo} alt={company.name} className="w-16 h-16 object-contain" />
            ) : (
              <BuildingOfficeIcon className="w-10 h-10 text-gray-400" />
            )}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{company.name}</h1>
            <p className="text-lg text-gray-600 mb-4">{company.industry || 'Technology'}</p>
            <div className="flex flex-wrap gap-4 text-gray-500">
              {company.headquarters?.city && (
                <span className="flex items-center">
                  <MapPinIcon className="w-5 h-5 mr-1" />
                  {company.headquarters.city}, {company.headquarters.country || 'India'}
                </span>
              )}
              {company.employeeCount && (
                <span className="flex items-center">
                  <UsersIcon className="w-5 h-5 mr-1" />
                  {company.employeeCount}+ employees
                </span>
              )}
              {company.foundedYear && (
                <span className="flex items-center">
                  <CalendarIcon className="w-5 h-5 mr-1" />
                  Founded {company.foundedYear}
                </span>
              )}
            </div>
          </div>
          {company.website && (
            <a
              href={company.website}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary"
            >
              <GlobeAltIcon className="w-5 h-5 mr-2" />
              Visit Website
            </a>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          {/* About */}
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">About</h2>
            <p className="text-gray-600 whitespace-pre-line">
              {company.description || 'No description available.'}
            </p>
          </div>

          {/* Open Positions */}
          <div className="card">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Open Positions</h2>
              <Link to={`/jobs?company=${company._id}`} className="text-primary-600 hover:text-primary-700 text-sm">
                View all
              </Link>
            </div>
            {jobs.length === 0 ? (
              <p className="text-gray-500 text-center py-6">No open positions currently</p>
            ) : (
              <div className="space-y-4">
                {jobs.map((job) => (
                  <Link
                    key={job._id}
                    to={`/jobs/${job._id}`}
                    className="block p-4 border rounded-lg hover:border-primary-500 transition-colors"
                  >
                    <h3 className="font-medium text-gray-900">{job.title}</h3>
                    <div className="flex flex-wrap gap-3 mt-2 text-sm text-gray-500">
                      <span>{job.type}</span>
                      <span>{job.location?.city || 'Remote'}</span>
                      {job.package?.ctc && (
                        <span>₹{(job.package.ctc / 100000).toFixed(1)} LPA</span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Contact */}
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">Contact Information</h2>
            <ul className="space-y-3">
              {company.website && (
                <li className="flex items-center text-gray-600">
                  <GlobeAltIcon className="w-5 h-5 mr-2 text-gray-400" />
                  <a href={company.website} target="_blank" rel="noopener noreferrer" className="hover:text-primary-600 truncate">
                    {company.website}
                  </a>
                </li>
              )}
            </ul>
          </div>

          {/* HR Contacts */}
          {company.hrContacts?.length > 0 && (
            <div className="card">
              <h2 className="text-lg font-semibold mb-4">HR Contacts</h2>
              <ul className="space-y-4">
                {company.hrContacts.map((hr, index) => (
                  <li key={index} className="text-gray-600">
                    <p className="font-medium text-gray-900">{hr.name}</p>
                    {hr.email && <p className="text-sm">{hr.email}</p>}
                    {hr.phone && <p className="text-sm">{hr.phone}</p>}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Stats */}
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">Recruitment Stats</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <BriefcaseIcon className="w-6 h-6 text-primary-600 mx-auto mb-1" />
                <p className="text-2xl font-bold text-gray-900">{company.jobsPosted || 0}</p>
                <p className="text-sm text-gray-500">Jobs Posted</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <UsersIcon className="w-6 h-6 text-green-600 mx-auto mb-1" />
                <p className="text-2xl font-bold text-gray-900">{company.hiredCount || 0}</p>
                <p className="text-sm text-gray-500">Students Hired</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
