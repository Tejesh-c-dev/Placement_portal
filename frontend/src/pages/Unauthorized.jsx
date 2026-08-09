/**
 * @file Unauthorized.jsx
 * @description 403 access denied page for unauthorized access attempts.
 * Shows permission error with navigation back link.
 */

import { Link } from 'react-router-dom';
import { ShieldExclamationIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

export default function Unauthorized() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mb-6">
          <ShieldExclamationIcon className="w-10 h-10 text-red-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Access Denied</h1>
        <p className="text-gray-500 mb-8">
          You don't have permission to access this page.
        </p>
        <Link to="/" className="btn-primary inline-flex items-center">
          <ArrowLeftIcon className="w-5 h-5 mr-2" />
          Go Back
        </Link>
      </div>
    </div>
  );
}
