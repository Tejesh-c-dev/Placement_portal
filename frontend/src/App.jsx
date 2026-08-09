/**
 * @file App.jsx
 * @description Main React application component with route definitions.
 * Configures routes for public pages, authentication, and role-based
 * dashboards (student, recruiter, admin) with protected route guards.
 */

import { useEffect, useRef } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

// Layouts
import MainLayout from '@/components/layouts/MainLayout';
import AuthLayout from '@/components/layouts/AuthLayout';
import DashboardLayout from '@/components/layouts/DashboardLayout';

// Public Pages
import Home from '@/pages/Home';
import Login from '@/pages/auth/Login';
import Register from '@/pages/auth/Register';
import ForgotPassword from '@/pages/auth/ForgotPassword';
import ResetPassword from '@/pages/auth/ResetPassword';
import Jobs from '@/pages/Jobs';
import JobDetails from '@/pages/JobDetails';
import Companies from '@/pages/Companies';
import CompanyDetails from '@/pages/CompanyDetails';

// Student Pages
import StudentDashboard from '@/pages/student/Dashboard';
import StudentProfile from '@/pages/student/Profile';
import StudentApplications from '@/pages/student/Applications';
import StudentOffers from '@/pages/student/Offers';

// Recruiter Pages
import RecruiterDashboard from '@/pages/recruiter/Dashboard';
import RecruiterJobs from '@/pages/recruiter/Jobs';
import RecruiterApplications from '@/pages/recruiter/Applications';
import CompanyManagement from '@/pages/recruiter/CompanyManagement';

// Admin Pages
import AdminDashboard from '@/pages/admin/Dashboard';
import AdminStudents from '@/pages/admin/Students';
import AdminCompanies from '@/pages/admin/Companies';
import AdminJobs from '@/pages/admin/Jobs';
import AdminUsers from '@/pages/admin/Users';
import AdminAnnouncements from '@/pages/admin/Announcements';
import AdminAnalytics from '@/pages/admin/Analytics';

// Error Pages
import NotFound from '@/pages/NotFound';
import Unauthorized from '@/pages/Unauthorized';

// Route Guards
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import RoleRoute from '@/components/auth/RoleRoute';

function App() {
  const { isAuthenticated, user, initializeAuth } = useAuthStore();
  const hasInitializedAuth = useRef(false);

  useEffect(() => {
    if (hasInitializedAuth.current) {
      return;
    }

    hasInitializedAuth.current = true;
    initializeAuth();
  }, [initializeAuth]);

  // Redirect based on role after login
  const getDashboardPath = () => {
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
    <Routes>
      {/* Public Routes with Main Layout */}
      <Route element={<MainLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/jobs" element={<Jobs />} />
        <Route path="/jobs/:id" element={<JobDetails />} />
        <Route path="/companies" element={<Companies />} />
        <Route path="/companies/:slug" element={<CompanyDetails />} />
      </Route>

      {/* Auth Routes */}
      <Route element={<AuthLayout />}>
        <Route
          path="/login"
          element={
            isAuthenticated ? <Navigate to={getDashboardPath()} replace /> : <Login />
          }
        />
        <Route
          path="/register"
          element={
            isAuthenticated ? <Navigate to={getDashboardPath()} replace /> : <Register />
          }
        />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
      </Route>

      {/* Student Dashboard Routes */}
      <Route
        path="/student"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={['student']}>
              <DashboardLayout />
            </RoleRoute>
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<StudentDashboard />} />
        <Route path="profile" element={<StudentProfile />} />
        <Route path="applications" element={<StudentApplications />} />
        <Route path="offers" element={<StudentOffers />} />
      </Route>

      {/* Recruiter Dashboard Routes */}
      <Route
        path="/recruiter"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={['recruiter']}>
              <DashboardLayout />
            </RoleRoute>
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<RecruiterDashboard />} />
        <Route path="jobs" element={<RecruiterJobs />} />
        <Route path="applications" element={<RecruiterApplications />} />
        <Route path="company" element={<CompanyManagement />} />
      </Route>

      {/* Admin Dashboard Routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={['admin', 'superadmin']}>
              <DashboardLayout />
            </RoleRoute>
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="students" element={<AdminStudents />} />
        <Route path="companies" element={<AdminCompanies />} />
        <Route path="jobs" element={<AdminJobs />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="announcements" element={<AdminAnnouncements />} />
        <Route path="analytics" element={<AdminAnalytics />} />
      </Route>

      {/* Error Routes */}
      <Route path="/unauthorized" element={<Unauthorized />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;
