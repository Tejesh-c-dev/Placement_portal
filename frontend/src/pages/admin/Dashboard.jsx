/**
 * @file admin/Dashboard.jsx
 * @description Admin dashboard with platform-wide statistics, pending actions,
 * recent activity, and quick access to management sections.
 */

import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { adminAPI } from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import {
  UsersIcon,
  BriefcaseIcon,
  BuildingOfficeIcon,
  DocumentTextIcon,
  ChartBarIcon,
  CheckBadgeIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
  MegaphoneIcon,
} from '@heroicons/react/24/outline';

export default function AdminDashboard() {
  const { user } = useAuthStore();

  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: () => adminAPI.getDashboard(),
  });

  const stats = dashboardData?.data?.data || {};

  const statCards = [
    {
      label: 'Total Students',
      value: stats.totalStudents || 0,
      icon: UsersIcon,
      color: 'bg-blue-500',
      link: '/admin/students',
    },
    {
      label: 'Active Jobs',
      value: stats.activeJobs || 0,
      icon: BriefcaseIcon,
      color: 'bg-green-500',
      link: '/admin/jobs',
    },
    {
      label: 'Companies',
      value: stats.totalCompanies || 0,
      icon: BuildingOfficeIcon,
      color: 'bg-purple-500',
      link: '/admin/companies',
    },
    {
      label: 'Placed Students',
      value: stats.placedStudents || 0,
      icon: CheckBadgeIcon,
      color: 'bg-emerald-500',
      link: '/admin/analytics',
    },
    {
      label: 'Applications',
      value: stats.totalApplications || 0,
      icon: DocumentTextIcon,
      color: 'bg-orange-500',
      link: '/admin/jobs',
    },
    {
      label: 'Pending Companies',
      value: stats.pendingCompanies || 0,
      icon: ClockIcon,
      color: 'bg-yellow-500',
      link: '/admin/companies?status=pending',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Admin Dashboard
        </h1>
        <p className="text-gray-600 mt-1">
          Welcome back, {user?.firstName || 'Admin'}! Here's an overview of the placement portal.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        {isLoading ? (
          [...Array(6)].map((_, i) => (
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
              <div className={`p-2 rounded-lg ${stat.color} w-fit mb-3`}>
                <stat.icon className="w-5 h-5 text-white" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-sm text-gray-600">{stat.label}</p>
            </Link>
          ))
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Placement Stats */}
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Placement Overview</h2>
            <Link to="/admin/analytics" className="text-primary-600 hover:text-primary-700 text-sm">
              View Details →
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <ArrowTrendingUpIcon className="w-5 h-5 text-green-600" />
                <span className="text-sm text-green-700">Placement Rate</span>
              </div>
              <p className="text-2xl font-bold text-green-800">
                {stats.placementRate ? `${stats.placementRate}%` : 'N/A'}
              </p>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <ChartBarIcon className="w-5 h-5 text-blue-600" />
                <span className="text-sm text-blue-700">Avg Package</span>
              </div>
              <p className="text-2xl font-bold text-blue-800">
                {stats.averagePackage ? `₹${(stats.averagePackage / 100000).toFixed(1)} LPA` : 'N/A'}
              </p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <ArrowTrendingUpIcon className="w-5 h-5 text-purple-600" />
                <span className="text-sm text-purple-700">Highest Package</span>
              </div>
              <p className="text-2xl font-bold text-purple-800">
                {stats.highestPackage ? `₹${(stats.highestPackage / 100000).toFixed(1)} LPA` : 'N/A'}
              </p>
            </div>
            <div className="p-4 bg-orange-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <UsersIcon className="w-5 h-5 text-orange-600" />
                <span className="text-sm text-orange-700">Total Offers</span>
              </div>
              <p className="text-2xl font-bold text-orange-800">
                {stats.totalOffers || 0}
              </p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-4">
            <Link
              to="/admin/students"
              className="p-4 border rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors"
            >
              <UsersIcon className="w-8 h-8 text-primary-600 mb-2" />
              <p className="font-medium text-gray-900">Manage Students</p>
              <p className="text-sm text-gray-500">View and export student data</p>
            </Link>
            <Link
              to="/admin/companies?status=pending"
              className="p-4 border rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors"
            >
              <BuildingOfficeIcon className="w-8 h-8 text-primary-600 mb-2" />
              <p className="font-medium text-gray-900">Approve Companies</p>
              <p className="text-sm text-gray-500">{stats.pendingCompanies || 0} pending</p>
            </Link>
            <Link
              to="/admin/announcements"
              className="p-4 border rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors"
            >
              <MegaphoneIcon className="w-8 h-8 text-primary-600 mb-2" />
              <p className="font-medium text-gray-900">Announcements</p>
              <p className="text-sm text-gray-500">Create & manage</p>
            </Link>
            <Link
              to="/admin/analytics"
              className="p-4 border rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors"
            >
              <ChartBarIcon className="w-8 h-8 text-primary-600 mb-2" />
              <p className="font-medium text-gray-900">Analytics</p>
              <p className="text-sm text-gray-500">View detailed reports</p>
            </Link>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card lg:col-span-2">
          <h2 className="text-lg font-semibold mb-4">System Overview</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-3xl font-bold text-gray-900">{stats.todayApplications || 0}</p>
              <p className="text-sm text-gray-500">Applications Today</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-3xl font-bold text-gray-900">{stats.newStudentsThisWeek || 0}</p>
              <p className="text-sm text-gray-500">New Students (Week)</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-3xl font-bold text-gray-900">{stats.activeRecruiters || 0}</p>
              <p className="text-sm text-gray-500">Active Recruiters</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-3xl font-bold text-gray-900">{stats.offersThisMonth || 0}</p>
              <p className="text-sm text-gray-500">Offers (Month)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
