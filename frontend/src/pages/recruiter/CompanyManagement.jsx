/**
 * @file recruiter/CompanyManagement.jsx
 * @description Company profile management for recruiters to register,
 * edit company details, add HR contacts, and manage company info.
 * Field names match backend Company model exactly.
 */

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { companyAPI } from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';
import {
  BuildingOfficeIcon,
  PlusIcon,
  PencilIcon,
  GlobeAltIcon,
  MapPinIcon,
  UsersIcon,
  EnvelopeIcon,
  PhoneIcon,
  CheckCircleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import clsx from 'clsx';

// Must match backend Company model enum exactly
const industries = [
  'Information Technology',
  'Finance/Banking',
  'Consulting',
  'E-Commerce',
  'Manufacturing',
  'Healthcare',
  'Education',
  'Telecommunications',
  'Automobile',
  'FMCG',
  'Real Estate',
  'Energy',
  'Media/Entertainment',
  'Other',
];

// Must match backend Company model enum exactly
const employeeCounts = ['1-50', '51-200', '201-500', '501-1000', '1001-5000', '5000+'];

const companyTypes = [
  { value: 'startup', label: 'Startup' },
  { value: 'mnc', label: 'MNC' },
  { value: 'psu', label: 'PSU' },
  { value: 'private', label: 'Private' },
  { value: 'government', label: 'Government' },
];

export default function CompanyManagement() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [showHRForm, setShowHRForm] = useState(false);

  const { data: companyData, isLoading } = useQuery({
    queryKey: ['my-company'],
    queryFn: () => companyAPI.getMy({ limit: 1 }),
  });

  const company = companyData?.data?.data?.companies?.[0];

  const [formData, setFormData] = useState({
    name: '',
    industry: '',
    type: 'private',
    description: '',
    website: '',
    linkedIn: '',
    employeeCount: '',
    foundedYear: '',
    headquarters: {
      city: '',
      state: '',
      country: 'India',
    },
  });

  const [hrData, setHrData] = useState({
    name: '',
    email: '',
    phone: '',
    designation: '',
  });

  useEffect(() => {
    if (company) {
      setFormData({
        name: company.name || '',
        industry: company.industry || '',
        type: company.type || 'private',
        description: company.description || '',
        website: company.website || '',
        linkedIn: company.linkedIn || '',
        employeeCount: company.employeeCount || '',
        foundedYear: company.foundedYear || '',
        headquarters: {
          city: company.headquarters?.city || '',
          state: company.headquarters?.state || '',
          country: company.headquarters?.country || 'India',
        },
      });
    }
  }, [company]);

  // Build a readable message from a validation error response.
  // Joi returns `errors: [{ field, message }]` on 400; show those instead of
  // the generic "Validation failed" so the user knows exactly what to fix.
  const getErrorMessage = (err, fallback) => {
    const data = err?.response?.data;
    const fieldErrors = data?.errors || data?.error?.errors;
    if (Array.isArray(fieldErrors) && fieldErrors.length > 0) {
      const messages = fieldErrors.map((e) => e?.message).filter(Boolean);
      if (messages.length > 0) return messages.join('. ');
    }
    return data?.message || fallback;
  };

  const normalizeUrl = (url) => {
    const trimmed = (url || '').trim();
    if (!trimmed) return '';
    return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  };

  const registerMutation = useMutation({
    mutationFn: (data) => companyAPI.register(data),
    onSuccess: () => {
      toast.success('Company registered successfully! Awaiting admin approval.');
      queryClient.invalidateQueries({ queryKey: ['my-company'] });
      setIsEditing(false);
    },
    onError: (err) => {
      toast.error(getErrorMessage(err, 'Failed to register company'));
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data) => companyAPI.update(company._id, data),
    onSuccess: () => {
      toast.success('Company updated successfully');
      queryClient.invalidateQueries({ queryKey: ['my-company'] });
      setIsEditing(false);
    },
    onError: (err) => {
      toast.error(getErrorMessage(err, 'Failed to update company'));
    },
  });

  const addHRMutation = useMutation({
    mutationFn: (data) => companyAPI.addHRContact(company._id, data),
    onSuccess: () => {
      toast.success('HR contact added');
      queryClient.invalidateQueries({ queryKey: ['my-company'] });
      setShowHRForm(false);
      setHrData({ name: '', email: '', phone: '', designation: '' });
    },
    onError: () => {
      toast.error('Failed to add HR contact');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    // Build payload matching backend Company model field names exactly.
    // Backend requires absolute URIs for website/linkedIn, so prepend https://
    // when the user omits the scheme (e.g. "www.acme.com").
    const data = {
      name: formData.name,
      industry: formData.industry,
      type: formData.type,
      description: formData.description,
      headquarters: formData.headquarters,
    };
    if (formData.website) data.website = normalizeUrl(formData.website);
    if (formData.linkedIn) data.linkedIn = normalizeUrl(formData.linkedIn);
    if (formData.employeeCount) data.employeeCount = formData.employeeCount;
    if (formData.foundedYear) data.foundedYear = parseInt(formData.foundedYear, 10);

    if (company) {
      updateMutation.mutate(data);
    } else {
      registerMutation.mutate(data);
    }
  };

  const handleAddHR = (e) => {
    e.preventDefault();
    addHRMutation.mutate(hrData);
  };

  const set = (field, value) => setFormData((prev) => ({ ...prev, [field]: value }));
  const setHQ = (field, value) =>
    setFormData((prev) => ({
      ...prev,
      headquarters: { ...prev.headquarters, [field]: value },
    }));

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="card space-y-4">
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  // Show registration / edit form
  if (!company || isEditing) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            {company ? 'Edit Company Profile' : 'Register Your Company'}
          </h1>
          <p className="text-gray-600 mt-1">
            {company
              ? 'Update your company information'
              : 'Fill in your company details to start hiring'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="card">
            <h2 className="text-lg font-semibold mb-6">Basic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="label">Company Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => set('name', e.target.value)}
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="label">Industry *</label>
                <select
                  value={formData.industry}
                  onChange={(e) => set('industry', e.target.value)}
                  className="input"
                  required
                >
                  <option value="">Select Industry</option>
                  {industries.map((ind) => (
                    <option key={ind} value={ind}>{ind}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Company Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => set('type', e.target.value)}
                  className="input"
                >
                  {companyTypes.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Founded Year</label>
                <input
                  type="number"
                  value={formData.foundedYear}
                  onChange={(e) => set('foundedYear', e.target.value)}
                  className="input"
                  min="1900"
                  max={new Date().getFullYear()}
                  placeholder="e.g. 2005"
                />
              </div>
              <div>
                <label className="label">Employee Count</label>
                <select
                  value={formData.employeeCount}
                  onChange={(e) => set('employeeCount', e.target.value)}
                  className="input"
                >
                  <option value="">Select range</option>
                  {employeeCounts.map((ec) => (
                    <option key={ec} value={ec}>{ec}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Website</label>
                <input
                  type="text"
                  inputMode="url"
                  value={formData.website}
                  onChange={(e) => set('website', e.target.value)}
                  className="input"
                  placeholder="https://company.com"
                />
              </div>
              <div>
                <label className="label">LinkedIn</label>
                <input
                  type="text"
                  inputMode="url"
                  value={formData.linkedIn}
                  onChange={(e) => set('linkedIn', e.target.value)}
                  className="input"
                  placeholder="https://linkedin.com/company/..."
                />
              </div>
              <div className="md:col-span-2">
                <label className="label">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => set('description', e.target.value)}
                  className="input min-h-[100px]"
                  placeholder="Tell us about your company..."
                />
              </div>
            </div>
          </div>

          {/* Headquarters */}
          <div className="card">
            <h2 className="text-lg font-semibold mb-6">Headquarters Location</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="label">City</label>
                <input
                  type="text"
                  value={formData.headquarters.city}
                  onChange={(e) => setHQ('city', e.target.value)}
                  className="input"
                  placeholder="e.g. Bangalore"
                />
              </div>
              <div>
                <label className="label">State</label>
                <input
                  type="text"
                  value={formData.headquarters.state}
                  onChange={(e) => setHQ('state', e.target.value)}
                  className="input"
                  placeholder="e.g. Karnataka"
                />
              </div>
              <div>
                <label className="label">Country</label>
                <input
                  type="text"
                  value={formData.headquarters.country}
                  onChange={(e) => setHQ('country', e.target.value)}
                  className="input"
                />
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-3">
            {company && (
              <button type="button" onClick={() => setIsEditing(false)} className="btn-secondary">
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={registerMutation.isPending || updateMutation.isPending}
              className="btn-primary px-8"
            >
              {registerMutation.isPending || updateMutation.isPending
                ? 'Saving...'
                : company
                ? 'Update Company'
                : 'Register Company'}
            </button>
          </div>
        </form>
      </div>
    );
  }

  // Company profile view
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Company Profile</h1>
          <p className="text-gray-600 mt-1">Manage your company information</p>
        </div>
        <button onClick={() => setIsEditing(true)} className="btn-secondary">
          <PencilIcon className="w-5 h-5 mr-2" />
          Edit
        </button>
      </div>

      {/* Status Banner */}
      {company.status === 'pending' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 flex items-start gap-3">
          <ClockIcon className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-medium text-yellow-800">Verification Pending</h3>
            <p className="text-sm text-yellow-700 mt-1">
              Your company registration is being reviewed by the admin team.
            </p>
          </div>
        </div>
      )}

      {company.status === 'approved' && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 flex items-center gap-3">
          <CheckCircleIcon className="w-5 h-5 text-green-500" />
          <p className="text-green-800">Your company is verified and approved.</p>
        </div>
      )}

      {company.status === 'rejected' && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800 font-medium">Company registration rejected</p>
          {company.rejectionReason && (
            <p className="text-red-700 text-sm mt-1">Reason: {company.rejectionReason}</p>
          )}
        </div>
      )}

      {/* Company Details */}
      <div className="card mb-6">
        <div className="flex items-start gap-6">
          <div className="w-20 h-20 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <BuildingOfficeIcon className="w-10 h-10 text-gray-400" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-gray-900">{company.name}</h2>
            <p className="text-gray-600">{company.industry}</p>
            <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-500">
              {company.headquarters?.city && (
                <span className="flex items-center">
                  <MapPinIcon className="w-4 h-4 mr-1" />
                  {company.headquarters.city}
                  {company.headquarters.state && `, ${company.headquarters.state}`}
                </span>
              )}
              {company.employeeCount && (
                <span className="flex items-center">
                  <UsersIcon className="w-4 h-4 mr-1" />
                  {company.employeeCount} employees
                </span>
              )}
              {company.website && (
                <a
                  href={company.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center hover:text-primary-600"
                >
                  <GlobeAltIcon className="w-4 h-4 mr-1" />
                  Website
                </a>
              )}
              {company.foundedYear && (
                <span>Founded: {company.foundedYear}</span>
              )}
            </div>
          </div>
        </div>

        {company.description && (
          <div className="mt-6 pt-6 border-t">
            <h3 className="font-medium text-gray-900 mb-2">About</h3>
            <p className="text-gray-600 whitespace-pre-line">{company.description}</p>
          </div>
        )}
      </div>

      {/* HR Contacts */}
      <div className="card">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold">HR Contacts</h2>
          <button onClick={() => setShowHRForm(true)} className="btn-secondary text-sm">
            <PlusIcon className="w-4 h-4 mr-1" />
            Add Contact
          </button>
        </div>

        {showHRForm && (
          <form onSubmit={handleAddHR} className="bg-gray-50 p-4 rounded-lg mb-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Name *</label>
                <input
                  type="text"
                  value={hrData.name}
                  onChange={(e) => setHrData({ ...hrData, name: e.target.value })}
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="label">Email *</label>
                <input
                  type="email"
                  value={hrData.email}
                  onChange={(e) => setHrData({ ...hrData, email: e.target.value })}
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="label">Phone</label>
                <input
                  type="tel"
                  value={hrData.phone}
                  onChange={(e) => setHrData({ ...hrData, phone: e.target.value })}
                  className="input"
                />
              </div>
              <div>
                <label className="label">Designation</label>
                <input
                  type="text"
                  value={hrData.designation}
                  onChange={(e) => setHrData({ ...hrData, designation: e.target.value })}
                  className="input"
                  placeholder="e.g., HR Manager"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button
                type="button"
                onClick={() => setShowHRForm(false)}
                className="btn-secondary text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={addHRMutation.isPending}
                className="btn-primary text-sm"
              >
                {addHRMutation.isPending ? 'Adding...' : 'Add Contact'}
              </button>
            </div>
          </form>
        )}

        {company.hrContacts?.length > 0 ? (
          <div className="space-y-3">
            {company.hrContacts.map((hr, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div>
                  <p className="font-medium text-gray-900">{hr.name}</p>
                  <p className="text-sm text-gray-500">{hr.designation || 'HR'}</p>
                  <div className="flex gap-4 mt-1 text-sm text-gray-500">
                    {hr.email && (
                      <span className="flex items-center gap-1">
                        <EnvelopeIcon className="w-4 h-4" />
                        {hr.email}
                      </span>
                    )}
                    {hr.phone && (
                      <span className="flex items-center gap-1">
                        <PhoneIcon className="w-4 h-4" />
                        {hr.phone}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">No HR contacts added yet</p>
        )}
      </div>
    </div>
  );
}
