/**
 * @file student/Dashboard.jsx
 * @description Student dashboard with overview stats, recent applications,
 * offers, and eligible job opportunities summary.
 */

import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { studentAPI, applicationAPI, offerAPI, jobAPI } from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import {
  BriefcaseIcon,
  DocumentTextIcon,
  CheckBadgeIcon,
  ClockIcon,
  ArrowRightIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';

const statusColors = {
  pending: 'badge-warning',
  shortlisted: 'badge-info',
  accepted: 'badge-success',
  rejected: 'badge-danger',
};

export default function StudentDashboard() {
  const { user } = useAuthStore();

  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['student-stats'],
    queryFn: () => applicationAPI.getStats(),
    retry: false,
  });

  const { data: profileData } = useQuery({
    queryKey: ['student-profile', user?._id],
    queryFn: () => studentAPI.getProfile(),
    enabled: !!user?._id,
    retry: false,
  });

  const { data: recentApplications, isLoading: appsLoading } = useQuery({
    queryKey: ['recent-applications'],
    queryFn: () => applicationAPI.getMy({ limit: 5 }),
    retry: false,
  });

  const { data: eligibleJobs } = useQuery({
    queryKey: ['eligible-jobs'],
    queryFn: () => jobAPI.getEligible({ limit: 3 }),
    retry: false,
  });

  const stats = statsData?.data?.data || {};
  const profile = profileData?.data?.data?.profile;
  const applications = recentApplications?.data?.data?.applications || [];
  const jobs = eligibleJobs?.data?.data?.jobs || [];

  const statCards = [
    {
      label: 'Applications',
      value: stats.total || 0,
      icon: DocumentTextIcon,
      color: 'bg-blue-500',
      link: '/student/applications',
    },
    {
      label: 'Pending',
      value: stats.pending || 0,
      icon: ClockIcon,
      color: 'bg-yellow-500',
      link: '/student/applications?status=pending',
    },
    {
      label: 'Shortlisted',
      value: stats.shortlisted || 0,
      icon: CheckBadgeIcon,
      color: 'bg-green-500',
      link: '/student/applications?status=shortlisted',
    },
    {
      label: 'Offers',
      value: stats.offers || 0,
      icon: BriefcaseIcon,
      color: 'bg-purple-500',
      link: '/student/offers',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {user?.firstName || 'Student'}!
        </h1>
        <p className="text-gray-600 mt-1">Track your placement journey</p>
      </div>

      {/* Profile Incomplete Alert */}
      {!profile?.isProfileComplete && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 flex items-start gap-3">
          <ExclamationCircleIcon className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-medium text-yellow-800">Complete your profile</h3>
            <p className="text-sm text-yellow-700 mt-1">
              Add your education details and upload your resume to apply for jobs.
            </p>
            <Link to="/student/profile" className="text-sm text-yellow-800 font-medium hover:underline mt-2 inline-block">
              Complete Profile →
            </Link>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statsLoading ? (
          [...Array(4)].map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          ))
        ) : (
          statCards.map((stat) => (
            <Link
              key={stat.label}
              to={stat.link}
              className="card card-hover"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-gray-600">{stat.label}</p>
                </div>
                <div className={`p-3 rounded-lg ${stat.color}`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </Link>
          ))
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Applications */}
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Recent Applications</h2>
            <Link to="/student/applications" className="text-primary-600 hover:text-primary-700 text-sm flex items-center">
              View all <ArrowRightIcon className="w-4 h-4 ml-1" />
            </Link>
          </div>
          {appsLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-200 rounded"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-1"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : applications.length === 0 ? (
            <div className="text-center py-8">
              <DocumentTextIcon className="w-10 h-10 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">No applications yet</p>
              <Link to="/jobs" className="text-primary-600 hover:underline text-sm mt-1 inline-block">
                Browse Jobs
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {applications.map((app) => (
                <Link
                  key={app._id}
                  to={`/student/applications/${app._id}`}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    <BriefcaseIcon className="w-5 h-5 text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{app.job?.title}</p>
                    <p className="text-sm text-gray-500 truncate">{app.job?.company?.name}</p>
                  </div>
                  <span className={`badge ${statusColors[app.status] || 'badge-gray'}`}>
                    {app.status}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recommended Jobs */}
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Recommended Jobs</h2>
            <Link to="/jobs" className="text-primary-600 hover:text-primary-700 text-sm flex items-center">
              View all <ArrowRightIcon className="w-4 h-4 ml-1" />
            </Link>
          </div>
          {jobs.length === 0 ? (
            <div className="text-center py-8">
              <BriefcaseIcon className="w-10 h-10 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">No jobs available</p>
            </div>
          ) : (
            <div className="space-y-3">
              {jobs.map((job) => (
                <Link
                  key={job._id}
                  to={`/jobs/${job._id}`}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    <BriefcaseIcon className="w-5 h-5 text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{job.title}</p>
                    <p className="text-sm text-gray-500 truncate">{job.company?.name}</p>
                  </div>
                  <span className="text-sm text-gray-500">
                    {job.package?.ctc ? `₹${(job.package.ctc / 100000).toFixed(1)} LPA` : ''}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
