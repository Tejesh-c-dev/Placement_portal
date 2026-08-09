/**
 * @file AuthLayout.jsx
 * @description Layout wrapper for authentication pages (login, register, etc.).
 * Provides centered card layout with header logo and footer.
 */

import { Outlet, Link } from 'react-router-dom';

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50 flex flex-col">
      {/* Header */}
      <header className="py-6 px-4">
        <div className="max-w-7xl mx-auto">
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-xl">P</span>
            </div>
            <span className="font-bold text-2xl text-gray-900">Placement Portal</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl p-8 animate-fade-in">
            <Outlet />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-gray-500 text-sm">
        &copy; {new Date().getFullYear()} Placement Portal. All rights reserved.
      </footer>
    </div>
  );
}
