/**
 * @file ResetPassword.jsx
 * @description Password reset page for setting new password via token.
 * Validates token from email link and allows users to set a new password.
 */

import { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { authAPI } from '@/services/api';
import toast from 'react-hot-toast';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

const validationSchema = Yup.object({
  password: Yup.string()
    .required('Password is required')
    .min(8, 'Password must be at least 8 characters')
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password')], 'Passwords must match')
    .required('Please confirm your password'),
});

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const formik = useFormik({
    initialValues: {
      password: '',
      confirmPassword: '',
    },
    validationSchema,
    onSubmit: async (values) => {
      setIsLoading(true);
      try {
        await authAPI.resetPassword(token, values.password, values.confirmPassword);
        toast.success('Password reset successful!');
        navigate('/login');
      } catch (error) {
        // Error is handled by API interceptor
      } finally {
        setIsLoading(false);
      }
    },
  });

  return (
    <div>
      <h2 className="text-2xl font-bold text-center mb-2">Reset Password</h2>
      <p className="text-gray-500 text-center mb-8">Enter your new password</p>

      <form onSubmit={formik.handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="password" className="label">New Password</label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              {...formik.getFieldProps('password')}
              className={`input pr-10 ${formik.touched.password && formik.errors.password ? 'input-error' : ''}`}
              placeholder="Enter new password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
            </button>
          </div>
          {formik.touched.password && formik.errors.password && (
            <p className="mt-1 text-sm text-red-500">{formik.errors.password}</p>
          )}
        </div>

        <div>
          <label htmlFor="confirmPassword" className="label">Confirm Password</label>
          <input
            id="confirmPassword"
            type="password"
            {...formik.getFieldProps('confirmPassword')}
            className={`input ${formik.touched.confirmPassword && formik.errors.confirmPassword ? 'input-error' : ''}`}
            placeholder="Confirm new password"
          />
          {formik.touched.confirmPassword && formik.errors.confirmPassword && (
            <p className="mt-1 text-sm text-red-500">{formik.errors.confirmPassword}</p>
          )}
        </div>

        <button type="submit" disabled={isLoading} className="btn-primary w-full py-3">
          {isLoading ? 'Resetting...' : 'Reset Password'}
        </button>
      </form>

      <p className="mt-6 text-center text-gray-600">
        <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">
          Back to Login
        </Link>
      </p>
    </div>
  );
}
