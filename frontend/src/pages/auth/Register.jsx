/**
 * @file Register.jsx
 * @description User registration page with role selection (student/recruiter).
 * Uses Formik for form handling with Yup validation schema.
 */

import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

const validationSchema = Yup.object({
  firstName: Yup.string().required('First name is required').max(50),
  lastName: Yup.string().required('Last name is required').max(50),
  email: Yup.string().email('Invalid email address').required('Email is required'),
  phone: Yup.string().matches(/^\+?[\d\s-]{10,15}$/, 'Invalid phone number').nullable(),
  role: Yup.string().oneOf(['student', 'recruiter']).required('Please select a role'),
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

export default function Register() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { register, isLoading, error, clearError } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const defaultRole = searchParams.get('role') || 'student';

  const formik = useFormik({
    initialValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      role: defaultRole,
      password: '',
      confirmPassword: '',
    },
    validationSchema,
    onSubmit: async (values) => {
      clearError();
      const result = await register(values);
      
      if (result.success) {
        toast.success('Registration successful!');
        // Redirect based on role
        switch (result.user.role) {
          case 'student':
            navigate('/student/profile');
            break;
          case 'recruiter':
            navigate('/recruiter/company');
            break;
          default:
            navigate('/');
        }
      }
    },
  });

  return (
    <div>
      <h2 className="text-2xl font-bold text-center mb-2">Create Account</h2>
      <p className="text-gray-500 text-center mb-8">Join our placement portal</p>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={formik.handleSubmit} className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="firstName" className="label">First Name</label>
            <input
              id="firstName"
              type="text"
              {...formik.getFieldProps('firstName')}
              className={`input ${formik.touched.firstName && formik.errors.firstName ? 'input-error' : ''}`}
              placeholder="John"
            />
            {formik.touched.firstName && formik.errors.firstName && (
              <p className="mt-1 text-sm text-red-500">{formik.errors.firstName}</p>
            )}
          </div>
          <div>
            <label htmlFor="lastName" className="label">Last Name</label>
            <input
              id="lastName"
              type="text"
              {...formik.getFieldProps('lastName')}
              className={`input ${formik.touched.lastName && formik.errors.lastName ? 'input-error' : ''}`}
              placeholder="Doe"
            />
            {formik.touched.lastName && formik.errors.lastName && (
              <p className="mt-1 text-sm text-red-500">{formik.errors.lastName}</p>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="email" className="label">Email Address</label>
          <input
            id="email"
            type="email"
            {...formik.getFieldProps('email')}
            className={`input ${formik.touched.email && formik.errors.email ? 'input-error' : ''}`}
            placeholder="john@example.com"
          />
          {formik.touched.email && formik.errors.email && (
            <p className="mt-1 text-sm text-red-500">{formik.errors.email}</p>
          )}
        </div>

        <div>
          <label htmlFor="phone" className="label">Phone Number (Optional)</label>
          <input
            id="phone"
            type="tel"
            {...formik.getFieldProps('phone')}
            className={`input ${formik.touched.phone && formik.errors.phone ? 'input-error' : ''}`}
            placeholder="+91 9876543210"
          />
          {formik.touched.phone && formik.errors.phone && (
            <p className="mt-1 text-sm text-red-500">{formik.errors.phone}</p>
          )}
        </div>

        <div>
          <label className="label">I am a</label>
          <div className="grid grid-cols-2 gap-4">
            <label
              className={`flex items-center justify-center p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                formik.values.role === 'student'
                  ? 'border-primary-600 bg-primary-50 text-primary-700'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <input
                type="radio"
                name="role"
                value="student"
                checked={formik.values.role === 'student'}
                onChange={formik.handleChange}
                className="sr-only"
              />
              <span className="font-medium">Student</span>
            </label>
            <label
              className={`flex items-center justify-center p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                formik.values.role === 'recruiter'
                  ? 'border-primary-600 bg-primary-50 text-primary-700'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <input
                type="radio"
                name="role"
                value="recruiter"
                checked={formik.values.role === 'recruiter'}
                onChange={formik.handleChange}
                className="sr-only"
              />
              <span className="font-medium">Recruiter</span>
            </label>
          </div>
        </div>

        <div>
          <label htmlFor="password" className="label">Password</label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              {...formik.getFieldProps('password')}
              className={`input pr-10 ${formik.touched.password && formik.errors.password ? 'input-error' : ''}`}
              placeholder="Create a strong password"
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
          <div className="relative">
            <input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              {...formik.getFieldProps('confirmPassword')}
              className={`input pr-10 ${formik.touched.confirmPassword && formik.errors.confirmPassword ? 'input-error' : ''}`}
              placeholder="Confirm your password"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showConfirmPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
            </button>
          </div>
          {formik.touched.confirmPassword && formik.errors.confirmPassword && (
            <p className="mt-1 text-sm text-red-500">{formik.errors.confirmPassword}</p>
          )}
        </div>

        <button type="submit" disabled={isLoading} className="btn-primary w-full py-3">
          {isLoading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
              </svg>
              Creating account...
            </span>
          ) : (
            'Create Account'
          )}
        </button>
      </form>

      <p className="mt-6 text-center text-gray-600">
        Already have an account?{' '}
        <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">
          Sign in
        </Link>
      </p>
    </div>
  );
}
