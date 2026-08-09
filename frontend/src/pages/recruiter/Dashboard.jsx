/**
 * @file recruiter/Dashboard.jsx
 * @description Recruiter dashboard with job posting stats, recent applications,
 * and company overview widgets.
 */

import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { jobAPI, applicationAPI, companyAPI } from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import {
  BriefcaseIcon,
  DocumentTextIcon,
  UsersIcon,
  BuildingOfficeIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  ClockIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';

const statusColors = {
  pending: 'badge-warning',
  shortlisted: 'badge-info',
  selected: 'badge-success',
  rejected: 'badge-danger',
};

export default function RecruiterDashboard() {
  const { user } = useAuthStore();

  const { data: jobsData, isLoading: jobsLoading } = useQuery({
    queryKey: ['recruiter-jobs'],
    queryFn: () => jobAPI.getMyJobs({ limit: 5 }),
  });

  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['application-stats'],
    queryFn: () => applicationAPI.getStats(),
  });

  const { data: companyData } = useQuery({
    queryKey: ['my-companies'],
    queryFn: () => companyAPI.getMy({ limit: 1 }),
  });

  const jobs = jobsData?.data?.data?.jobs || [];
  const stats = statsData?.data?.data || {};
  const company = companyData?.data?.data?.companies?.[0];

  const statCards = [
    {
      label: 'Active Jobs',
      value: stats.activeJobs || jobs.filter(j => j.status === 'open').length || 0,
      icon: BriefcaseIcon,
      color: 'bg-blue-500',
      link: '/recruiter/jobs',
    },
    {
      label: 'Total Applications',
      value: stats.totalApplications || 0,
      icon: DocumentTextIcon,
      color: 'bg-purple-500',
      link: '/recruiter/applications',
    },
    {
      label: 'Shortlisted',
      value: stats.shortlisted || 0,
      icon: CheckCircleIcon,
      color: 'bg-green-500',
      link: '/recruiter/applications?status=shortlisted',
    },
    {
      label: 'Pending Review',
      value: stats.pending || 0,
      icon: ClockIcon,
      color: 'bg-yellow-500',
      link: '/recruiter/applications?status=pending',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome, {user?.firstName || 'Recruiter'}!
        </h1>
        <p className="text-gray-600 mt-1">Manage your hiring pipeline</p>
      </div>

      {/* Company Status Alert */}
      {!company && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 flex items-start gap-3">
          <BuildingOfficeIcon className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-medium text-yellow-800">Register your company</h3>
            <p className="text-sm text-yellow-700 mt-1">
              Register your company to start posting jobs and hiring candidates.
            </p>
            <Link to="/recruiter/company" className="text-sm text-yellow-800 font-medium hover:underline mt-2 inline-block">
              Register Company →
            </Link>
          </div>
        </div>
      )}

      {company && company.status === 'pending' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-start gap-3">
          <ClockIcon className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-medium text-blue-800">Company verification pending</h3>
            <p className="text-sm text-blue-700 mt-1">
              Your company registration is being reviewed by the admin team.
            </p>
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
        {/* Recent Jobs */}
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">My Job Postings</h2>
            <Link to="/recruiter/jobs" className="text-primary-600 hover:text-primary-700 text-sm flex items-center">
              View all <ArrowRightIcon className="w-4 h-4 ml-1" />
            </Link>
          </div>
          {jobsLoading ? (
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
          ) : jobs.length === 0 ? (
            <div className="text-center py-8">
              <BriefcaseIcon className="w-10 h-10 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">No jobs posted yet</p>
              <Link to="/recruiter/jobs/new" className="text-primary-600 hover:underline text-sm mt-1 inline-block">
                Post a Job
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {jobs.map((job) => (
                <Link
                  key={job._id}
                  to={`/recruiter/jobs/${job._id}`}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    <BriefcaseIcon className="w-5 h-5 text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{job.title}</p>
                    <p className="text-sm text-gray-500">
                      {job.applicationsCount || 0} applications
                    </p>
                  </div>
                  <span className={`badge ${job.status === 'open' ? 'badge-success' : 'badge-gray'}`}>
                    {job.status}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent Applications */}
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Recent Applications</h2>
            <Link to="/recruiter/applications" className="text-primary-600 hover:text-primary-700 text-sm flex items-center">
              View all <ArrowRightIcon className="w-4 h-4 ml-1" />
            </Link>
          </div>
          <div className="text-center py-8">
            <DocumentTextIcon className="w-10 h-10 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500">Applications will appear here</p>
            <Link to="/recruiter/applications" className="text-primary-600 hover:underline text-sm mt-1 inline-block">
              View Applications
            </Link>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card lg:col-span-2">
          <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link
              to="/recruiter/jobs/new"
              className="p-4 border rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors text-center"
            >
              <BriefcaseIcon className="w-8 h-8 text-primary-600 mx-auto mb-2" />
              <p className="font-medium text-gray-900">Post Job</p>
            </Link>
            <Link
              to="/recruiter/applications"
              className="p-4 border rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors text-center"
            >
              <DocumentTextIcon className="w-8 h-8 text-primary-600 mx-auto mb-2" />
              <p className="font-medium text-gray-900">Review Applications</p>
            </Link>
            <Link
              to="/recruiter/company"
              className="p-4 border rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors text-center"
            >
              <BuildingOfficeIcon className="w-8 h-8 text-primary-600 mx-auto mb-2" />
              <p className="font-medium text-gray-900">Company Profile</p>
            </Link>
            <Link
              to="/recruiter/analytics"
              className="p-4 border rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors text-center"
            >
              <ChartBarIcon className="w-8 h-8 text-primary-600 mx-auto mb-2" />
              <p className="font-medium text-gray-900">Analytics</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
