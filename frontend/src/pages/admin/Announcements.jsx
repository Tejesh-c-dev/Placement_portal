/**
 * @file admin/Announcements.jsx
 * @description Announcements management for creating, editing, publishing,
 * and targeting placement announcements to specific user groups.
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { announcementAPI } from '@/services/api';
import toast from 'react-hot-toast';
import {
  PlusIcon,
  MegaphoneIcon,
  PencilIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
  PaperAirplaneIcon,
  StarIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';
import clsx from 'clsx';

const priorityColors = {
  low: 'badge-gray',
  normal: 'badge-info',
  high: 'badge-warning',
  urgent: 'badge-danger',
};

const targetOptions = [
  { value: 'all', label: 'All Users' },
  { value: 'students', label: 'Students Only' },
  { value: 'recruiters', label: 'Recruiters Only' },
];

export default function AdminAnnouncements() {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    priority: 'normal',
    targetAudience: 'all',
    expiresAt: '',
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-announcements', page],
    queryFn: () => announcementAPI.getAll({ page, limit: 10 }),
  });

  const createMutation = useMutation({
    mutationFn: (data) => announcementAPI.create(data),
    onSuccess: () => {
      toast.success('Announcement created');
      queryClient.invalidateQueries({ queryKey: ['admin-announcements'] });
      resetForm();
    },
    onError: () => {
      toast.error('Failed to create announcement');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => announcementAPI.update(id, data),
    onSuccess: () => {
      toast.success('Announcement updated');
      queryClient.invalidateQueries({ queryKey: ['admin-announcements'] });
      resetForm();
    },
    onError: () => {
      toast.error('Failed to update announcement');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => announcementAPI.delete(id),
    onSuccess: () => {
      toast.success('Announcement deleted');
      queryClient.invalidateQueries({ queryKey: ['admin-announcements'] });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: (id) => announcementAPI.toggleActive(id),
    onSuccess: () => {
      toast.success('Announcement status updated');
      queryClient.invalidateQueries({ queryKey: ['admin-announcements'] });
    },
  });

  const pinMutation = useMutation({
    mutationFn: ({ id, pin }) => pin ? announcementAPI.pin(id) : announcementAPI.unpin(id),
    onSuccess: () => {
      toast.success('Announcement updated');
      queryClient.invalidateQueries({ queryKey: ['admin-announcements'] });
    },
  });

  const sendEmailMutation = useMutation({
    mutationFn: (id) => announcementAPI.sendEmail(id),
    onSuccess: () => {
      toast.success('Email sent to target audience');
    },
    onError: () => {
      toast.error('Failed to send email');
    },
  });

  const announcements = data?.data?.data?.announcements || [];
  const pagination = data?.data?.data || {};

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      priority: 'normal',
      targetAudience: 'all',
      expiresAt: '',
    });
    setShowForm(false);
    setEditingId(null);
  };

  const handleEdit = (announcement) => {
    setFormData({
      title: announcement.title,
      content: announcement.content,
      priority: announcement.priority,
      targetAudience: announcement.targetAudience,
      expiresAt: announcement.expiresAt ? announcement.expiresAt.split('T')[0] : '',
    });
    setEditingId(announcement._id);
    setShowForm(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = {
      ...formData,
      expiresAt: formData.expiresAt || undefined,
    };
    if (editingId) {
      updateMutation.mutate({ id: editingId, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = (id, title) => {
    if (window.confirm(`Delete announcement "${title}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Announcements</h1>
          <p className="text-gray-600 mt-1">Create and manage announcements</p>
        </div>
        {!showForm && (
          <button onClick={() => setShowForm(true)} className="btn-primary">
            <PlusIcon className="w-5 h-5 mr-2" />
            New Announcement
          </button>
        )}
      </div>

      {/* Create/Edit Form */}
      {showForm && (
        <div className="card mb-6">
          <h2 className="text-lg font-semibold mb-4">
            {editingId ? 'Edit Announcement' : 'Create Announcement'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="input"
                required
              />
            </div>
            <div>
              <label className="label">Content *</label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                className="input min-h-[120px]"
                required
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="label">Priority</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className="input"
                >
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <div>
                <label className="label">Target Audience</label>
                <select
                  value={formData.targetAudience}
                  onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                  className="input"
                >
                  {targetOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Expires On</label>
                <input
                  type="date"
                  value={formData.expiresAt}
                  onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                  className="input"
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={resetForm} className="btn-secondary">
                Cancel
              </button>
              <button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                className="btn-primary"
              >
                {createMutation.isPending || updateMutation.isPending
                  ? 'Saving...'
                  : editingId ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Announcements List */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="h-5 bg-gray-200 rounded w-1/3 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="card text-center py-12">
          <p className="text-red-500">Failed to load announcements. Please try again.</p>
        </div>
      ) : announcements.length === 0 ? (
        <div className="card text-center py-12">
          <MegaphoneIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No announcements</h3>
          <p className="text-gray-500">Create your first announcement</p>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {announcements.map((announcement) => (
              <div
                key={announcement._id}
                className={clsx(
                  'card',
                  !announcement.isActive && 'opacity-60',
                  announcement.isPinned && 'border-l-4 border-l-yellow-400'
                )}
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {announcement.isPinned && (
                        <StarIcon className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      )}
                      <h3 className="font-semibold text-gray-900">{announcement.title}</h3>
                      <span className={clsx('badge', priorityColors[announcement.priority])}>
                        {announcement.priority}
                      </span>
                      {!announcement.isActive && (
                        <span className="badge badge-gray">Inactive</span>
                      )}
                    </div>
                    <p className="text-gray-600 mb-3 whitespace-pre-line">{announcement.content}</p>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                      <span>Target: {targetOptions.find(o => o.value === announcement.targetAudience)?.label}</span>
                      <span>Created: {new Date(announcement.createdAt).toLocaleDateString()}</span>
                      {announcement.expiresAt && (
                        <span>Expires: {new Date(announcement.expiresAt).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleEdit(announcement)}
                      className="btn-secondary text-sm"
                    >
                      <PencilIcon className="w-4 h-4 mr-1" />
                      Edit
                    </button>
                    <button
                      onClick={() => toggleMutation.mutate(announcement._id)}
                      className={clsx(
                        'btn text-sm',
                        announcement.isActive ? 'text-yellow-600 hover:bg-yellow-50' : 'text-green-600 hover:bg-green-50'
                      )}
                    >
                      {announcement.isActive ? (
                        <>
                          <XCircleIcon className="w-4 h-4 mr-1" />
                          Deactivate
                        </>
                      ) : (
                        <>
                          <CheckCircleIcon className="w-4 h-4 mr-1" />
                          Activate
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => pinMutation.mutate({ id: announcement._id, pin: !announcement.isPinned })}
                      className="btn-secondary text-sm"
                    >
                      <StarIcon className={clsx('w-4 h-4 mr-1', announcement.isPinned && 'fill-yellow-500 text-yellow-500')} />
                      {announcement.isPinned ? 'Unpin' : 'Pin'}
                    </button>
                    <button
                      onClick={() => sendEmailMutation.mutate(announcement._id)}
                      disabled={sendEmailMutation.isPending}
                      className="btn-secondary text-sm"
                    >
                      <PaperAirplaneIcon className="w-4 h-4 mr-1" />
                      Email
                    </button>
                    <button
                      onClick={() => handleDelete(announcement._id, announcement.title)}
                      className="btn text-red-600 hover:bg-red-50 text-sm"
                    >
                      <TrashIcon className="w-4 h-4 mr-1" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex justify-center mt-8 gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn-secondary disabled:opacity-50"
              >
                Previous
              </button>
              <span className="flex items-center px-4 text-gray-600">
                Page {page} of {pagination.totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={page === pagination.totalPages}
                className="btn-secondary disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
