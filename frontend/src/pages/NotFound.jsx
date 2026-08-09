/**
 * @file NotFound.jsx
 * @description 404 error page displayed when route is not found.
 * Shows error message with link to return home.
 */

import { Link } from 'react-router-dom';
import { HomeIcon } from '@heroicons/react/24/outline';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center">
        <h1 className="text-9xl font-bold text-primary-600">404</h1>
        <h2 className="text-3xl font-semibold text-gray-900 mt-4 mb-2">Page Not Found</h2>
        <p className="text-gray-500 mb-8">
          Sorry, the page you are looking for doesn't exist or has been moved.
        </p>
        <Link to="/" className="btn-primary inline-flex items-center">
          <HomeIcon className="w-5 h-5 mr-2" />
          Go Home
        </Link>
      </div>
    </div>
  );
}
