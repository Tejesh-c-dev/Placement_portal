/**
 * @file admin/Analytics.jsx
 * @description Placement analytics dashboard with batch-wise statistics,
 * placement trends, salary ranges, and branch-wise breakdowns.
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminAPI } from '@/services/api';
import {
  ChartBarIcon,
  UsersIcon,
  BuildingOfficeIcon,
  CurrencyRupeeIcon,
  AcademicCapIcon,
  ArrowTrendingUpIcon,
  ArrowDownTrayIcon,
} from '@heroicons/react/24/outline';

const branches = [
  'Computer Science',
  'Information Technology',
  'Electronics',
  'Electrical',
  'Mechanical',
  'Civil',
];

export default function AdminAnalytics() {
  const [selectedBatch, setSelectedBatch] = useState(new Date().getFullYear());
  const currentYear = new Date().getFullYear();
  const batchYears = Array.from({ length: 5 }, (_, i) => currentYear - i);

  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['placement-stats', selectedBatch],
    queryFn: () => adminAPI.getPlacementStats({ batch: selectedBatch }),
  });

  const { data: branchData, isLoading: branchLoading } = useQuery({
    queryKey: ['branch-analytics', selectedBatch],
    queryFn: () => adminAPI.getBranchAnalytics({ batch: selectedBatch }),
  });

  const { data: trendsData } = useQuery({
    queryKey: ['batch-trends'],
    queryFn: () => adminAPI.getBatchTrends(),
  });

  const { data: topRecruiters } = useQuery({
    queryKey: ['top-recruiters', selectedBatch],
    queryFn: () => adminAPI.getTopRecruiters({ batch: selectedBatch, limit: 5 }),
  });

  const stats = statsData?.data?.data || {};
  const branchStats = branchData?.data?.data?.branches || [];
  const trends = trendsData?.data?.data?.trends || [];
  const recruiters = topRecruiters?.data?.data?.companies || [];

  const overviewCards = [
    {
      label: 'Total Students',
      value: stats.totalStudents || 0,
      icon: UsersIcon,
      color: 'text-blue-600',
      bg: 'bg-blue-100',
    },
    {
      label: 'Placed Students',
      value: stats.placedStudents || 0,
      icon: AcademicCapIcon,
      color: 'text-green-600',
      bg: 'bg-green-100',
    },
    {
      label: 'Placement Rate',
      value: stats.placementRate ? `${stats.placementRate.toFixed(1)}%` : 'N/A',
      icon: ArrowTrendingUpIcon,
      color: 'text-purple-600',
      bg: 'bg-purple-100',
    },
    {
      label: 'Avg Package',
      value: stats.averagePackage ? `₹${(stats.averagePackage / 100000).toFixed(1)} LPA` : 'N/A',
      icon: CurrencyRupeeIcon,
      color: 'text-orange-600',
      bg: 'bg-orange-100',
    },
    {
      label: 'Highest Package',
      value: stats.highestPackage ? `₹${(stats.highestPackage / 100000).toFixed(1)} LPA` : 'N/A',
      icon: CurrencyRupeeIcon,
      color: 'text-emerald-600',
      bg: 'bg-emerald-100',
    },
    {
      label: 'Companies Visited',
      value: stats.companiesVisited || 0,
      icon: BuildingOfficeIcon,
      color: 'text-indigo-600',
      bg: 'bg-indigo-100',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Placement Analytics</h1>
          <p className="text-gray-600 mt-1">Detailed placement statistics and insights</p>
        </div>
        <div className="flex gap-4">
          <select
            value={selectedBatch}
            onChange={(e) => setSelectedBatch(parseInt(e.target.value))}
            className="input w-auto"
          >
            {batchYears.map((year) => (
              <option key={year} value={year}>Batch {year}</option>
            ))}
          </select>
          <button
            onClick={() => {/* Export logic */}}
            className="btn-secondary"
          >
            <ArrowDownTrayIcon className="w-5 h-5 mr-2" />
            Export Report
          </button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {statsLoading ? (
          [...Array(6)].map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          ))
        ) : (
          overviewCards.map((card) => (
            <div key={card.label} className="card">
              <div className={`p-2 rounded-lg ${card.bg} w-fit mb-3`}>
                <card.icon className={`w-5 h-5 ${card.color}`} />
              </div>
              <p className="text-2xl font-bold text-gray-900">{card.value}</p>
              <p className="text-sm text-gray-600">{card.label}</p>
            </div>
          ))
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Branch-wise Statistics */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Branch-wise Placements</h2>
          {branchLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                  <div className="h-6 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          ) : branchStats.length > 0 ? (
            <div className="space-y-4">
              {branchStats.map((branch) => {
                const rate = branch.total > 0 
                  ? ((branch.placed / branch.total) * 100).toFixed(1) 
                  : 0;
                return (
                  <div key={branch.name}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-700">{branch.name}</span>
                      <span className="text-gray-500">
                        {branch.placed}/{branch.total} ({rate}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className="bg-primary-600 h-2.5 rounded-full transition-all duration-300"
                        style={{ width: `${rate}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <ChartBarIcon className="w-10 h-10 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">No data available</p>
            </div>
          )}
        </div>

        {/* Top Recruiters */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Top Recruiters</h2>
          {recruiters.length > 0 ? (
            <div className="space-y-3">
              {recruiters.map((company, index) => (
                <div
                  key={company._id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <span className={`
                      w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
                      ${index === 0 ? 'bg-yellow-100 text-yellow-700' :
                        index === 1 ? 'bg-gray-200 text-gray-700' :
                        index === 2 ? 'bg-orange-100 text-orange-700' :
                        'bg-gray-100 text-gray-600'}
                    `}>
                      {index + 1}
                    </span>
                    <div>
                      <p className="font-medium text-gray-900">{company.name}</p>
                      <p className="text-sm text-gray-500">{company.industry}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">{company.hiredCount}</p>
                    <p className="text-sm text-gray-500">hired</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <BuildingOfficeIcon className="w-10 h-10 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">No data available</p>
            </div>
          )}
        </div>
      </div>

      {/* Batch Trends */}
      <div className="card mb-8">
        <h2 className="text-lg font-semibold mb-4">Year-over-Year Trends</h2>
        {trends.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Batch</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Total Students</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Placed</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Placement Rate</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Avg Package</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Highest Package</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Companies</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {trends.map((trend) => (
                  <tr key={trend.batch} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{trend.batch}</td>
                    <td className="px-4 py-3 text-gray-600">{trend.totalStudents}</td>
                    <td className="px-4 py-3 text-gray-600">{trend.placedStudents}</td>
                    <td className="px-4 py-3">
                      <span className="badge badge-success">
                        {trend.placementRate?.toFixed(1) || 0}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {trend.averagePackage ? `₹${(trend.averagePackage / 100000).toFixed(1)} LPA` : 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {trend.highestPackage ? `₹${(trend.highestPackage / 100000).toFixed(1)} LPA` : 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{trend.companiesVisited || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8">
            <ChartBarIcon className="w-10 h-10 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500">No trend data available</p>
          </div>
        )}
      </div>

      {/* Package Distribution */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Package Distribution</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-gray-900">{stats.below5LPA || 0}</p>
            <p className="text-sm text-gray-500">&lt; 5 LPA</p>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-2xl font-bold text-blue-800">{stats.between5And10LPA || 0}</p>
            <p className="text-sm text-blue-600">5-10 LPA</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-2xl font-bold text-green-800">{stats.between10And20LPA || 0}</p>
            <p className="text-sm text-green-600">10-20 LPA</p>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <p className="text-2xl font-bold text-purple-800">{stats.above20LPA || 0}</p>
            <p className="text-sm text-purple-600">&gt; 20 LPA</p>
          </div>
        </div>
      </div>
    </div>
  );
}
