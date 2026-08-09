/**
 * @file student/Profile.jsx
 * @description Student profile management page for academic info,
 * skills, 10th/12th scores, and resume upload.
 * Form fields match the backend StudentProfile model exactly.
 */

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { studentAPI } from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';
import {
  UserCircleIcon,
  DocumentArrowUpIcon,
  TrashIcon,
  CheckCircleIcon,
  AcademicCapIcon,
  CodeBracketIcon,
} from '@heroicons/react/24/outline';

// Branch values must match backend enum exactly
const branches = [
  { value: 'CSE', label: 'Computer Science Engineering (CSE)' },
  { value: 'IT', label: 'Information Technology (IT)' },
  { value: 'ECE', label: 'Electronics & Communication (ECE)' },
  { value: 'EEE', label: 'Electrical & Electronics (EEE)' },
  { value: 'ME', label: 'Mechanical Engineering (ME)' },
  { value: 'CE', label: 'Civil Engineering (CE)' },
  { value: 'CSE-AI', label: 'CSE - Artificial Intelligence' },
  { value: 'CSE-DS', label: 'CSE - Data Science' },
  { value: 'BT', label: 'Biotechnology (BT)' },
  { value: 'CH', label: 'Chemical Engineering (CH)' },
  { value: 'Other', label: 'Other' },
];

const genderOptions = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
  { value: 'prefer-not-to-say', label: 'Prefer not to say' },
];

export default function StudentProfile() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const { data: profileData, isLoading } = useQuery({
    queryKey: ['student-profile', user?._id],
    queryFn: () => studentAPI.getProfile(),
    enabled: !!user?._id,
    retry: false,
  });

  const profile = profileData?.data?.data?.profile;

  const [formData, setFormData] = useState({
    rollNumber: '',
    dateOfBirth: '',
    gender: '',
    branch: '',
    batch: new Date().getFullYear(),
    cgpa: '',
    activeBacklogs: 0,
    totalBacklogs: 0,
    tenthPercentage: '',
    twelfthPercentage: '',
    diplomaPercentage: '',
    skills: '',
    linkedIn: '',
    github: '',
    portfolio: '',
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        rollNumber: profile.rollNumber || '',
        dateOfBirth: profile.dateOfBirth
          ? new Date(profile.dateOfBirth).toISOString().split('T')[0]
          : '',
        gender: profile.gender || '',
        branch: profile.branch || '',
        batch: profile.batch || new Date().getFullYear(),
        cgpa: profile.cgpa ?? '',
        activeBacklogs: profile.activeBacklogs ?? 0,
        totalBacklogs: profile.totalBacklogs ?? 0,
        tenthPercentage: profile.tenthPercentage ?? '',
        twelfthPercentage: profile.twelfthPercentage ?? '',
        diplomaPercentage: profile.diplomaPercentage ?? '',
        skills: profile.skills?.join(', ') || '',
        linkedIn: profile.linkedIn || '',
        github: profile.github || '',
        portfolio: profile.portfolio || '',
      });
    }
  }, [profile]);

  const updateMutation = useMutation({
    mutationFn: (data) =>
      profile ? studentAPI.updateProfile(data) : studentAPI.createProfile(data),
    onSuccess: () => {
      toast.success('Profile saved successfully');
      queryClient.invalidateQueries({ queryKey: ['student-profile'] });
    },
    onError: (err) => {
      const msg = err?.response?.data?.message || 'Failed to save profile';
      toast.error(msg);
    },
  });

  const resumeMutation = useMutation({
    mutationFn: (file) => studentAPI.uploadResume(file),
    onSuccess: () => {
      toast.success('Resume uploaded successfully');
      queryClient.invalidateQueries({ queryKey: ['student-profile'] });
    },
    onError: () => {
      toast.error('Failed to upload resume');
    },
  });

  const deleteResumeMutation = useMutation({
    mutationFn: () => studentAPI.deleteResume(),
    onSuccess: () => {
      toast.success('Resume deleted');
      queryClient.invalidateQueries({ queryKey: ['student-profile'] });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    // Build payload matching backend StudentProfile model field names exactly
    const data = {
      rollNumber: formData.rollNumber,
      dateOfBirth: formData.dateOfBirth,
      gender: formData.gender,
      branch: formData.branch,
      batch: parseInt(formData.batch),
      cgpa: parseFloat(formData.cgpa),
      activeBacklogs: parseInt(formData.activeBacklogs) || 0,
      totalBacklogs: parseInt(formData.totalBacklogs) || 0,
      tenthPercentage: parseFloat(formData.tenthPercentage),
      twelfthPercentage: parseFloat(formData.twelfthPercentage),
      skills: formData.skills.split(',').map((s) => s.trim()).filter(Boolean),
    };
    if (formData.diplomaPercentage !== '' && formData.diplomaPercentage !== undefined) {
      data.diplomaPercentage = parseFloat(formData.diplomaPercentage);
    }
    if (formData.linkedIn) data.linkedIn = formData.linkedIn;
    if (formData.github) data.github = formData.github;
    if (formData.portfolio) data.portfolio = formData.portfolio;

    updateMutation.mutate(data);
  };

  const handleResumeUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Resume must be less than 5MB');
        return;
      }
      resumeMutation.mutate(file);
    }
  };

  const set = (field, value) => setFormData((prev) => ({ ...prev, [field]: value }));

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="card space-y-4">
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
        <p className="text-gray-600 mt-1">
          {profile
            ? 'Update your profile information'
            : 'Complete your profile to start applying for jobs'}
        </p>
        {profile && (
          <div className="mt-3 flex items-center gap-3">
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div
                className="bg-primary-600 h-2 rounded-full transition-all"
                style={{ width: `${profile.profileCompleteness || 0}%` }}
              />
            </div>
            <span className="text-sm text-gray-600 whitespace-nowrap">
              {profile.profileCompleteness || 0}% complete
            </span>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Basic Info */}
        <div className="card">
          <div className="flex items-center gap-2 mb-6">
            <UserCircleIcon className="w-5 h-5 text-gray-400" />
            <h2 className="text-lg font-semibold">Basic Information</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Full Name</label>
              <input
                type="text"
                value={user?.fullName || `${user?.firstName || ''} ${user?.lastName || ''}`.trim()}
                disabled
                className="input bg-gray-50"
              />
            </div>
            <div>
              <label className="label">Email</label>
              <input type="email" value={user?.email || ''} disabled className="input bg-gray-50" />
            </div>
            <div>
              <label className="label">Roll Number *</label>
              <input
                type="text"
                value={formData.rollNumber}
                onChange={(e) => set('rollNumber', e.target.value.toUpperCase())}
                className="input"
                required
                placeholder="e.g. CS21001"
              />
            </div>
            <div>
              <label className="label">Date of Birth *</label>
              <input
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => set('dateOfBirth', e.target.value)}
                className="input"
                required
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div className="md:col-span-2">
              <label className="label">Gender *</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {genderOptions.map((opt) => (
                  <label
                    key={opt.value}
                    className={`flex items-center justify-center p-3 border-2 rounded-lg cursor-pointer text-sm transition-colors ${
                      formData.gender === opt.value
                        ? 'border-primary-600 bg-primary-50 text-primary-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="gender"
                      value={opt.value}
                      checked={formData.gender === opt.value}
                      onChange={(e) => set('gender', e.target.value)}
                      className="sr-only"
                      required={!formData.gender}
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Academic Info */}
        <div className="card">
          <div className="flex items-center gap-2 mb-6">
            <AcademicCapIcon className="w-5 h-5 text-gray-400" />
            <h2 className="text-lg font-semibold">Academic Information</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Branch *</label>
              <select
                value={formData.branch}
                onChange={(e) => set('branch', e.target.value)}
                className="input"
                required
              >
                <option value="">Select Branch</option>
                {branches.map((b) => (
                  <option key={b.value} value={b.value}>{b.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Batch (Graduation Year) *</label>
              <input
                type="number"
                value={formData.batch}
                onChange={(e) => set('batch', e.target.value)}
                className="input"
                min="2020"
                max="2035"
                required
              />
            </div>
            <div>
              <label className="label">CGPA *</label>
              <input
                type="number"
                step="0.01"
                value={formData.cgpa}
                onChange={(e) => set('cgpa', e.target.value)}
                className="input"
                min="0"
                max="10"
                required
                placeholder="e.g. 8.5"
              />
            </div>
            <div>
              <label className="label">Active Backlogs</label>
              <input
                type="number"
                value={formData.activeBacklogs}
                onChange={(e) => set('activeBacklogs', e.target.value)}
                className="input"
                min="0"
              />
            </div>
            <div>
              <label className="label">Total Backlogs (historical)</label>
              <input
                type="number"
                value={formData.totalBacklogs}
                onChange={(e) => set('totalBacklogs', e.target.value)}
                className="input"
                min="0"
              />
            </div>
          </div>

          {/* Previous Education Scores */}
          <div className="mt-6 pt-6 border-t">
            <h3 className="font-medium text-gray-900 mb-4">Previous Education Scores</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="label">10th Percentage *</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.tenthPercentage}
                  onChange={(e) => set('tenthPercentage', e.target.value)}
                  className="input"
                  min="0"
                  max="100"
                  required
                  placeholder="e.g. 92.5"
                />
              </div>
              <div>
                <label className="label">12th Percentage *</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.twelfthPercentage}
                  onChange={(e) => set('twelfthPercentage', e.target.value)}
                  className="input"
                  min="0"
                  max="100"
                  required
                  placeholder="e.g. 88.0"
                />
              </div>
              <div>
                <label className="label">Diploma % (if applicable)</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.diplomaPercentage}
                  onChange={(e) => set('diplomaPercentage', e.target.value)}
                  className="input"
                  min="0"
                  max="100"
                  placeholder="Optional"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Skills & Links */}
        <div className="card">
          <div className="flex items-center gap-2 mb-6">
            <CodeBracketIcon className="w-5 h-5 text-gray-400" />
            <h2 className="text-lg font-semibold">Skills & Links</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="label">Skills (comma separated)</label>
              <input
                type="text"
                value={formData.skills}
                onChange={(e) => set('skills', e.target.value)}
                className="input"
                placeholder="React, Node.js, Python, SQL"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="label">LinkedIn</label>
                <input
                  type="url"
                  value={formData.linkedIn}
                  onChange={(e) => set('linkedIn', e.target.value)}
                  className="input"
                  placeholder="https://linkedin.com/in/..."
                />
              </div>
              <div>
                <label className="label">GitHub</label>
                <input
                  type="url"
                  value={formData.github}
                  onChange={(e) => set('github', e.target.value)}
                  className="input"
                  placeholder="https://github.com/..."
                />
              </div>
              <div>
                <label className="label">Portfolio</label>
                <input
                  type="url"
                  value={formData.portfolio}
                  onChange={(e) => set('portfolio', e.target.value)}
                  className="input"
                  placeholder="https://yourportfolio.com"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Resume */}
        <div className="card">
          <div className="flex items-center gap-2 mb-6">
            <DocumentArrowUpIcon className="w-5 h-5 text-gray-400" />
            <h2 className="text-lg font-semibold">Resume</h2>
          </div>
          {profile?.resume?.path ? (
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <CheckCircleIcon className="w-6 h-6 text-green-500" />
                <div>
                  <p className="font-medium text-gray-900">
                    {profile.resume.originalName || 'Resume.pdf'}
                  </p>
                  <p className="text-sm text-gray-500">Uploaded successfully</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => deleteResumeMutation.mutate()}
                disabled={deleteResumeMutation.isPending}
                className="btn text-red-600 hover:bg-red-50 text-sm flex items-center gap-1"
              >
                <TrashIcon className="w-4 h-4" />
                Delete
              </button>
            </div>
          ) : (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <DocumentArrowUpIcon className="w-10 h-10 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 mb-2">Upload your resume (PDF, max 5MB)</p>
              <label className="btn-primary cursor-pointer inline-block">
                {resumeMutation.isPending ? 'Uploading...' : 'Choose File'}
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleResumeUpload}
                  className="hidden"
                  disabled={resumeMutation.isPending}
                />
              </label>
            </div>
          )}
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={updateMutation.isPending}
            className="btn-primary px-8"
          >
            {updateMutation.isPending
              ? 'Saving...'
              : profile
              ? 'Update Profile'
              : 'Create Profile'}
          </button>
        </div>
      </form>
    </div>
  );
}
