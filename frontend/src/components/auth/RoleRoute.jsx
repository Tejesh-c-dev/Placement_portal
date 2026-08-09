/**
 * @file RoleRoute.jsx
 * @description Role-based route guard component.
 * Restricts access to users with specified roles, redirects others to unauthorized page.
 */

import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

export default function RoleRoute({ children, allowedRoles }) {
  const { user } = useAuthStore();

  // Check if user's role is in the allowed roles
  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}
