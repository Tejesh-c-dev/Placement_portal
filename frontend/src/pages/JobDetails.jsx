/**
 * @file JobDetails.jsx
 * @description Single job details page showing full job information,
 * eligibility criteria, application deadline, and apply button.
 */

import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { jobAPI } from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import {
  MapPinIcon,
  CurrencyRupeeIcon,
  BuildingOfficeIcon,
  CalendarIcon,
  ClockIcon,
  AcademicCapIcon,
  BriefcaseIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline';

export default function JobDetails() {
  const { id } = useParams();
  const { isAuthenticated, user } = useAuthStore();

  const { data, isLoading, error } = useQuery({
    queryKey: ['job', id],
    queryFn: () => jobAPI.getById(id),
  });

  const job = data?.data?.data?.job;

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

  if (error || !job) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <BriefcaseIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Job Not Found</h2>
        <p className="text-gray-500 mb-6">This job may have been removed or doesn't exist.</p>
        <Link to="/jobs" className="btn-primary">Browse Jobs</Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Back link */}
      <Link to="/jobs" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6">
        <ArrowLeftIcon className="w-4 h-4 mr-2" />
        Back to Jobs
      </Link>

      {/* Header */}
      <div className="card mb-6">
        <div className="flex flex-col md:flex-row md:items-start gap-6">
          <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <BuildingOfficeIcon className="w-8 h-8 text-gray-400" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{job.title}</h1>
            <p className="text-lg text-gray-600 mb-4">{job.company?.name}</p>
            <div className="flex flex-wrap gap-4 text-gray-500">
              <span className="flex items-center">
                <MapPinIcon className="w-5 h-5 mr-1" />
                {job.location?.city || 'Remote'}
              </span>
              <span className="flex items-center">
                <CurrencyRupeeIcon className="w-5 h-5 mr-1" />
                {job.package?.ctc ? `${(job.package.ctc / 100000).toFixed(1)} LPA` : 'Not disclosed'}
              </span>
              <span className="flex items-center">
                <ClockIcon className="w-5 h-5 mr-1" />
                {job.type}
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            {isAuthenticated && user?.role === 'student' ? (
              <Link to={`/student/applications?apply=${job._id}`} className="btn-primary">
                Apply Now
              </Link>
            ) : (
              <Link to="/login" className="btn-primary">
                Login to Apply
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          {/* Description */}
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">Job Description</h2>
            <div className="prose prose-sm max-w-none text-gray-600">
              {job.description || 'No description provided.'}
            </div>
          </div>

          {/* Requirements */}
          {job.requirements && (
            <div className="card">
              <h2 className="text-lg font-semibold mb-4">Requirements</h2>
              <ul className="list-disc list-inside space-y-2 text-gray-600">
                {job.requirements.map((req, index) => (
                  <li key={index}>{req}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Skills */}
          {job.skillsRequired?.length > 0 && (
            <div className="card">
              <h2 className="text-lg font-semibold mb-4">Required Skills</h2>
              <div className="flex flex-wrap gap-2">
                {job.skillsRequired.map((skill, index) => (
                  <span key={index} className="badge-primary">{skill}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Eligibility */}
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">Eligibility</h2>
            <ul className="space-y-3">
              {job.eligibility?.minCGPA && (
                <li className="flex items-center text-gray-600">
                  <AcademicCapIcon className="w-5 h-5 mr-2 text-gray-400" />
                  Min CGPA: {job.eligibility.minCGPA}
                </li>
              )}
              {job.eligibility?.allowedBranches?.length > 0 && (
                <li className="flex items-start text-gray-600">
                  <BriefcaseIcon className="w-5 h-5 mr-2 text-gray-400 flex-shrink-0 mt-0.5" />
                  <span>Branches: {job.eligibility.allowedBranches.join(', ')}</span>
                </li>
              )}
              {job.eligibility?.maxBacklogs !== undefined && (
                <li className="flex items-center text-gray-600">
                  <CalendarIcon className="w-5 h-5 mr-2 text-gray-400" />
                  Max Backlogs: {job.eligibility.maxBacklogs}
                </li>
              )}
            </ul>
          </div>

          {/* Deadline */}
          {job.deadline && (
            <div className="card bg-yellow-50 border border-yellow-200">
              <h3 className="font-semibold text-yellow-800 mb-2">Application Deadline</h3>
              <p className="text-yellow-700">
                {new Date(job.deadline).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
