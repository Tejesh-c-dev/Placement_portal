/**
 * @file MainLayout.jsx
 * @description Public layout with navigation header and footer.
 * Used for home, jobs, companies pages with responsive mobile menu.
 */

import { Outlet, Link } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import {
  Bars3Icon,
  XMarkIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline';
import { useState } from 'react';

export default function MainLayout() {
  const { isAuthenticated, user, logout } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const getDashboardLink = () => {
    if (!user) return '/login';
    switch (user.role) {
      case 'student':
        return '/student/dashboard';
      case 'recruiter':
        return '/recruiter/dashboard';
      case 'admin':
      case 'superadmin':
        return '/admin/dashboard';
      default:
        return '/';
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Logo & Nav Links */}
            <div className="flex items-center">
              <Link to="/" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">P</span>
                </div>
                <span className="font-bold text-xl text-gray-900">Placement Portal</span>
              </Link>

              {/* Desktop Nav */}
              <div className="hidden md:flex md:ml-10 md:space-x-8">
                <Link
                  to="/jobs"
                  className="text-gray-600 hover:text-gray-900 px-3 py-2 font-medium transition-colors"
                >
                  Jobs
                </Link>
                <Link
                  to="/companies"
                  className="text-gray-600 hover:text-gray-900 px-3 py-2 font-medium transition-colors"
                >
                  Companies
                </Link>
              </div>
            </div>

            {/* Right side */}
            <div className="flex items-center space-x-4">
              {isAuthenticated ? (
                <>
                  <Link
                    to={getDashboardLink()}
                    className="hidden md:inline-flex items-center text-gray-600 hover:text-gray-900 font-medium"
                  >
                    <UserCircleIcon className="w-5 h-5 mr-1" />
                    Dashboard
                  </Link>
                  <button
                    onClick={logout}
                    className="hidden md:inline-flex items-center text-gray-600 hover:text-primary-600 font-medium"
                  >
                    <ArrowRightOnRectangleIcon className="w-5 h-5 mr-1" />
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="hidden md:inline-flex btn-outline btn-sm">
                    Login
                  </Link>
                  <Link to="/register" className="hidden md:inline-flex btn-primary btn-sm">
                    Register
                  </Link>
                </>
              )}

              {/* Mobile menu button */}
              <button
                className="md:hidden p-2 rounded-lg hover:bg-gray-100"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? (
                  <XMarkIcon className="w-6 h-6" />
                ) : (
                  <Bars3Icon className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-gray-200">
              <div className="space-y-2">
                <Link
                  to="/jobs"
                  className="block px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Jobs
                </Link>
                <Link
                  to="/companies"
                  className="block px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Companies
                </Link>
                {isAuthenticated ? (
                  <>
                    <Link
                      to={getDashboardLink()}
                      className="block px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Dashboard
                    </Link>
                    <button
                      onClick={() => {
                        logout();
                        setMobileMenuOpen(false);
                      }}
                      className="block w-full text-left px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/login"
                      className="block px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Login
                    </Link>
                    <Link
                      to="/register"
                      className="block px-4 py-2 text-primary-600 hover:bg-primary-50 rounded-lg font-medium"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Register
                    </Link>
                  </>
                )}
              </div>
            </div>
          )}
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">P</span>
                </div>
                <span className="font-bold text-xl">Placement Portal</span>
              </div>
              <p className="text-gray-400 max-w-md">
                Connecting talented students with top recruiters. Your gateway to career success.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-semibold uppercase tracking-wider mb-4">Quick Links</h4>
              <ul className="space-y-2">
                <li>
                  <Link to="/jobs" className="text-gray-400 hover:text-white transition-colors">
                    Browse Jobs
                  </Link>
                </li>
                <li>
                  <Link to="/companies" className="text-gray-400 hover:text-white transition-colors">
                    Companies
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold uppercase tracking-wider mb-4">Contact</h4>
              <ul className="space-y-2 text-gray-400">
                <li>placement@college.edu</li>
                <li>+91 9876543210</li>
                <li>Training & Placement Cell</li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-800 text-center text-gray-400 text-sm">
            &copy; {new Date().getFullYear()} Placement Portal. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
