/**
 * @file Login.jsx
 * @description Login page with email/password form using Formik validation.
 * Redirects to role-specific dashboard on successful authentication.
 */

import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

const validationSchema = Yup.object({
  email: Yup.string().email('Invalid email address').required('Email is required'),
  password: Yup.string().required('Password is required'),
});

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoading, error, clearError } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);

  const from = location.state?.from?.pathname || '/';

  const formik = useFormik({
    initialValues: {
      email: '',
      password: '',
    },
    validationSchema,
    onSubmit: async (values) => {
      clearError();
      const result = await login(values.email, values.password);
      
      if (result.success) {
        toast.success('Login successful!');
        // Redirect based on role
        switch (result.user.role) {
          case 'student':
            navigate('/student/dashboard');
            break;
          case 'recruiter':
            navigate('/recruiter/dashboard');
            break;
          case 'admin':
          case 'superadmin':
            navigate('/admin/dashboard');
            break;
          default:
            navigate(from);
        }
      }
    },
  });

  return (
    <div>
      <h2 className="text-2xl font-bold text-center mb-2">Welcome Back</h2>
      <p className="text-gray-500 text-center mb-8">Sign in to your account</p>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={formik.handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="email" className="label">
            Email Address
          </label>
          <input
            id="email"
            type="email"
            {...formik.getFieldProps('email')}
            className={`input ${
              formik.touched.email && formik.errors.email ? 'input-error' : ''
            }`}
            placeholder="Enter your email"
          />
          {formik.touched.email && formik.errors.email && (
            <p className="mt-1 text-sm text-red-500">{formik.errors.email}</p>
          )}
        </div>

        <div>
          <label htmlFor="password" className="label">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              {...formik.getFieldProps('password')}
              className={`input pr-10 ${
                formik.touched.password && formik.errors.password ? 'input-error' : ''
              }`}
              placeholder="Enter your password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? (
                <EyeSlashIcon className="w-5 h-5" />
              ) : (
                <EyeIcon className="w-5 h-5" />
              )}
            </button>
          </div>
          {formik.touched.password && formik.errors.password && (
            <p className="mt-1 text-sm text-red-500">{formik.errors.password}</p>
          )}
        </div>

        <div className="flex items-center justify-between">
          <label className="flex items-center">
            <input type="checkbox" className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
            <span className="ml-2 text-sm text-gray-600">Remember me</span>
          </label>
          <Link to="/forgot-password" className="text-sm text-primary-600 hover:text-primary-700">
            Forgot password?
          </Link>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="btn-primary w-full py-3"
        >
          {isLoading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
              </svg>
              Signing in...
            </span>
          ) : (
            'Sign In'
          )}
        </button>
      </form>

      <p className="mt-6 text-center text-gray-600">
        Don't have an account?{' '}
        <Link to="/register" className="text-primary-600 hover:text-primary-700 font-medium">
          Sign up
        </Link>
      </p>
    </div>
  );
}
