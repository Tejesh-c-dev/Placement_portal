/**
 * @file DashboardLayout.jsx
 * @description Dashboard layout with sidebar navigation for authenticated users.
 * Renders role-specific navigation (student, recruiter, admin) with
 * responsive sidebar and user profile section.
 */

import { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import {
  Bars3Icon,
  XMarkIcon,
  HomeIcon,
  UserIcon,
  BriefcaseIcon,
  DocumentTextIcon,
  BuildingOfficeIcon,
  UsersIcon,
  ChartBarIcon,
  MegaphoneIcon,
  CogIcon,
  ArrowRightOnRectangleIcon,
  GiftIcon,
} from '@heroicons/react/24/outline';
import clsx from 'clsx';

const getNavigation = (role) => {
  const studentNav = [
    { name: 'Dashboard', href: '/student/dashboard', icon: HomeIcon },
    { name: 'Profile', href: '/student/profile', icon: UserIcon },
    { name: 'Applications', href: '/student/applications', icon: DocumentTextIcon },
    { name: 'Offers', href: '/student/offers', icon: GiftIcon },
  ];

  const recruiterNav = [
    { name: 'Dashboard', href: '/recruiter/dashboard', icon: HomeIcon },
    { name: 'Jobs', href: '/recruiter/jobs', icon: BriefcaseIcon },
    { name: 'Applications', href: '/recruiter/applications', icon: DocumentTextIcon },
    { name: 'Company', href: '/recruiter/company', icon: BuildingOfficeIcon },
  ];

  const adminNav = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: HomeIcon },
    { name: 'Students', href: '/admin/students', icon: UsersIcon },
    { name: 'Companies', href: '/admin/companies', icon: BuildingOfficeIcon },
    { name: 'Jobs', href: '/admin/jobs', icon: BriefcaseIcon },
    { name: 'Users', href: '/admin/users', icon: UserIcon },
    { name: 'Announcements', href: '/admin/announcements', icon: MegaphoneIcon },
    { name: 'Analytics', href: '/admin/analytics', icon: ChartBarIcon },
  ];

  switch (role) {
    case 'student':
      return studentNav;
    case 'recruiter':
      return recruiterNav;
    case 'admin':
    case 'superadmin':
      return adminNav;
    default:
      return [];
  }
};

export default function DashboardLayout() {
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigation = getNavigation(user?.role);

  const isCurrentRoute = (href) => {
    return location.pathname === href;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-gray-900/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <div
        className={clsx(
          'fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-xl transform transition-transform duration-300 ease-in-out lg:hidden',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">P</span>
            </div>
            <span className="font-bold text-lg text-gray-900">Portal</span>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-2 rounded-lg hover:bg-gray-100"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>
        <nav className="mt-6 px-4">
          {navigation.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              onClick={() => setSidebarOpen(false)}
              className={clsx(
                'flex items-center px-4 py-3 mb-1 rounded-lg transition-colors',
                isCurrentRoute(item.href)
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-gray-600 hover:bg-gray-50'
              )}
            >
              <item.icon className="w-5 h-5 mr-3" />
              {item.name}
            </Link>
          ))}
        </nav>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-white border-r border-gray-200">
          {/* Logo */}
          <div className="flex items-center h-16 px-6 border-b border-gray-200">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">P</span>
              </div>
              <span className="font-bold text-lg text-gray-900">Placement Portal</span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 mt-6 px-4 space-y-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={clsx(
                  'flex items-center px-4 py-3 rounded-lg transition-colors font-medium',
                  isCurrentRoute(item.href)
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                )}
              >
                <item.icon
                  className={clsx(
                    'w-5 h-5 mr-3',
                    isCurrentRoute(item.href) ? 'text-primary-600' : 'text-gray-400'
                  )}
                />
                {item.name}
              </Link>
            ))}
          </nav>

          {/* User Section */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center mb-3">
              <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                <span className="text-primary-700 font-semibold">
                  {user?.firstName?.[0]?.toUpperCase() || 'U'}
                </span>
              </div>
              <div className="ml-3 overflow-hidden">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="flex items-center w-full px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <ArrowRightOnRectangleIcon className="w-5 h-5 mr-3" />
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className="sticky top-0 z-30 flex items-center h-16 bg-white border-b border-gray-200 px-4 lg:px-8">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-gray-100"
          >
            <Bars3Icon className="w-6 h-6" />
          </button>
          <div className="flex-1 flex items-center justify-end">
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">
                Welcome, {user?.firstName}
              </span>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
