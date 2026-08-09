/**
 * @file ForgotPassword.jsx
 * @description Password reset request page. Sends reset link to user's email
 * and shows confirmation message on successful submission.
 */

import { Link } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { authAPI } from '@/services/api';
import toast from 'react-hot-toast';
import { useState } from 'react';

const validationSchema = Yup.object({
  email: Yup.string().email('Invalid email address').required('Email is required'),
});

export default function ForgotPassword() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const formik = useFormik({
    initialValues: {
      email: '',
    },
    validationSchema,
    onSubmit: async (values) => {
      setIsLoading(true);
      try {
        await authAPI.forgotPassword(values.email);
        setIsSubmitted(true);
        toast.success('Password reset link sent!');
      } catch (error) {
        // Error is handled by API interceptor
      } finally {
        setIsLoading(false);
      }
    },
  });

  if (isSubmitted) {
    return (
      <div className="text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold mb-2">Check Your Email</h2>
        <p className="text-gray-600 mb-6">
          We've sent a password reset link to your email address. Please check your inbox.
        </p>
        <Link to="/login" className="btn-primary">
          Back to Login
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-center mb-2">Forgot Password?</h2>
      <p className="text-gray-500 text-center mb-8">
        Enter your email and we'll send you a reset link
      </p>

      <form onSubmit={formik.handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="email" className="label">Email Address</label>
          <input
            id="email"
            type="email"
            {...formik.getFieldProps('email')}
            className={`input ${formik.touched.email && formik.errors.email ? 'input-error' : ''}`}
            placeholder="Enter your email"
          />
          {formik.touched.email && formik.errors.email && (
            <p className="mt-1 text-sm text-red-500">{formik.errors.email}</p>
          )}
        </div>

        <button type="submit" disabled={isLoading} className="btn-primary w-full py-3">
          {isLoading ? 'Sending...' : 'Send Reset Link'}
        </button>
      </form>

      <p className="mt-6 text-center text-gray-600">
        Remember your password?{' '}
        <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">
          Sign in
        </Link>
      </p>
    </div>
  );
}
