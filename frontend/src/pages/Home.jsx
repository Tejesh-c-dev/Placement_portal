/**
 * @file Home.jsx
 * @description Landing page component with hero section, statistics,
 * features overview, and call-to-action for students and recruiters.
 */

import { Link } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import {
  BriefcaseIcon,
  BuildingOfficeIcon,
  UserGroupIcon,
  ChartBarIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';

const stats = [
  { label: 'Active Jobs', value: '50+', icon: BriefcaseIcon },
  { label: 'Partner Companies', value: '100+', icon: BuildingOfficeIcon },
  { label: 'Students Placed', value: '500+', icon: UserGroupIcon },
  { label: 'Average Package', value: '8 LPA', icon: ChartBarIcon },
];

const features = [
  {
    title: 'For Students',
    description: 'Create your profile, upload resume, and apply to jobs from top companies.',
    cta: 'Register as Student',
    link: '/register?role=student',
  },
  {
    title: 'For Recruiters',
    description: 'Post jobs, find talented candidates, and manage your hiring process.',
    cta: 'Register as Recruiter',
    link: '/register?role=recruiter',
  },
];

export default function Home() {
  const { isAuthenticated, user } = useAuthStore();

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
    <div>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary-600 to-primary-800 text-white py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl lg:text-6xl font-bold mb-6">
              Your Gateway to <span className="text-primary-200">Career Success</span>
            </h1>
            <p className="text-lg lg:text-xl text-primary-100 mb-8">
              Connect with top recruiters, find your dream job, and kickstart your career
              through our college placement portal.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              {isAuthenticated ? (
                <Link to={getDashboardLink()} className="btn bg-white text-primary-700 hover:bg-gray-100 px-8 py-3 text-lg">
                  Go to Dashboard
                  <ArrowRightIcon className="w-5 h-5 ml-2" />
                </Link>
              ) : (
                <>
                  <Link to="/register" className="btn bg-white text-primary-700 hover:bg-gray-100 px-8 py-3 text-lg">
                    Get Started
                    <ArrowRightIcon className="w-5 h-5 ml-2" />
                  </Link>
                  <Link to="/jobs" className="btn border-2 border-white text-white hover:bg-white/10 px-8 py-3 text-lg">
                    Browse Jobs
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-gray-50 to-transparent"></div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="inline-flex items-center justify-center w-14 h-14 bg-primary-100 rounded-xl mb-4">
                  <stat.icon className="w-7 h-7 text-primary-600" />
                </div>
                <div className="text-3xl font-bold text-gray-900">{stat.value}</div>
                <div className="text-gray-500">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      {!isAuthenticated && (
        <section className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center mb-12">Who Are You?</h2>
            <div className="grid md:grid-cols-2 gap-8">
              {features.map((feature) => (
                <div key={feature.title} className="card card-hover p-8">
                  <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                  <p className="text-gray-600 mb-6">{feature.description}</p>
                  <Link to={feature.link} className="btn-primary">
                    {feature.cta}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-20 bg-primary-600 text-white">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-3xl font-bold mb-4">Ready to Start Your Career Journey?</h2>
          <p className="text-primary-100 mb-8">
            Join thousands of students who have found their dream jobs through our platform.
          </p>
          <Link to="/jobs" className="btn bg-white text-primary-700 hover:bg-gray-100 px-8 py-3 text-lg">
            Explore Opportunities
          </Link>
        </div>
      </section>
    </div>
  );
}
