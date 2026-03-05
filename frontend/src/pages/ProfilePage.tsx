import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { User, Lock, Shield } from 'lucide-react';
import api from '../api/client';
import { useAuthStore } from '../store';
import Avatar from '../components/UI/Avatar';
import toast from 'react-hot-toast';
import type { User as UserType } from '../types';

export default function ProfilePage() {
  const { user, updateUser } = useAuthStore();

  const [name, setName] = useState(user?.full_name ?? '');
  const [department, setDepartment] = useState(user?.department ?? '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url ?? '');

  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');

  const saveProfile = useMutation({
    mutationFn: () =>
      api.put<UserType>('/auth/me', {
        full_name: name.trim() || undefined,
        department: department.trim() || undefined,
        avatar_url: avatarUrl.trim() || undefined,
      }).then(r => r.data),
    onSuccess: (updated) => {
      updateUser(updated);
      toast.success('Profile updated');
    },
    onError: (e: any) => toast.error(e?.response?.data?.detail || 'Failed to save'),
  });

  const changePassword = useMutation({
    mutationFn: () =>
      api.post('/auth/change-password', {
        current_password: currentPw,
        new_password: newPw,
      }),
    onSuccess: () => {
      toast.success('Password changed');
      setCurrentPw('');
      setNewPw('');
      setConfirmPw('');
    },
    onError: (e: any) => toast.error(e?.response?.data?.detail || 'Failed to change password'),
  });

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPw !== confirmPw) { toast.error('New passwords do not match'); return; }
    if (newPw.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    changePassword.mutate();
  };

  const previewName = name.trim() || (user?.full_name ?? '');

  return (
    <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">

      <div>
        <h1 className="text-xl font-bold text-gray-900">Profile Settings</h1>
        <p className="text-sm text-gray-500 mt-0.5">Manage your personal information and password</p>
      </div>

      {/* ── Profile card ── */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <User size={15} className="text-gray-400" />
          <h2 className="text-sm font-semibold text-gray-800">Personal information</h2>
        </div>

        <div className="p-6">
          {/* Avatar preview */}
          <div className="flex items-center gap-4 mb-6">
            <Avatar name={previewName} url={avatarUrl || null} size="lg" />
            <div>
              <p className="font-semibold text-gray-900">{previewName}</p>
              <p className="text-xs text-gray-400 capitalize mt-0.5">{user?.role} · {user?.email}</p>
            </div>
          </div>

          <form
            onSubmit={e => { e.preventDefault(); saveProfile.mutate(); }}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Full name</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Department</label>
                <input
                  type="text"
                  value={department}
                  onChange={e => setDepartment(e.target.value)}
                  placeholder="e.g. Engineering"
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Avatar URL <span className="text-gray-400 font-normal">(optional)</span></label>
              <input
                type="url"
                value={avatarUrl}
                onChange={e => setAvatarUrl(e.target.value)}
                placeholder="https://..."
                className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Read-only fields */}
            <div className="grid grid-cols-2 gap-4 pt-1">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Email <span className="text-gray-300">(can't change)</span></label>
                <input
                  type="text"
                  value={user?.email ?? ''}
                  disabled
                  className="w-full border border-gray-100 rounded-xl px-3.5 py-2.5 text-sm bg-gray-50 text-gray-400 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Role <span className="text-gray-300">(assigned by admin)</span></label>
                <input
                  type="text"
                  value={user?.role ?? ''}
                  disabled
                  className="w-full border border-gray-100 rounded-xl px-3.5 py-2.5 text-sm bg-gray-50 text-gray-400 cursor-not-allowed capitalize"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={saveProfile.isPending}
                className="bg-indigo-600 text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-60"
              >
                {saveProfile.isPending ? 'Saving...' : 'Save changes'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* ── Change password ── */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <Lock size={15} className="text-gray-400" />
          <h2 className="text-sm font-semibold text-gray-800">Change password</h2>
        </div>

        <form onSubmit={handlePasswordSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Current password</label>
            <input
              type="password"
              value={currentPw}
              onChange={e => setCurrentPw(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">New password</label>
              <input
                type="password"
                value={newPw}
                onChange={e => setNewPw(e.target.value)}
                required
                minLength={8}
                placeholder="At least 8 characters"
                className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Confirm new password</label>
              <input
                type="password"
                value={confirmPw}
                onChange={e => setConfirmPw(e.target.value)}
                required
                placeholder="Same as above"
                className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={changePassword.isPending}
              className="bg-gray-900 text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-gray-700 transition-colors disabled:opacity-60"
            >
              {changePassword.isPending ? 'Updating...' : 'Update password'}
            </button>
          </div>
        </form>
      </div>

      {/* ── Account info ── */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <Shield size={15} className="text-gray-400" />
          <h2 className="text-sm font-semibold text-gray-800">Account</h2>
        </div>
        <div className="p-6 space-y-3 text-sm text-gray-600">
          <div className="flex justify-between">
            <span className="text-gray-400">Email</span>
            <span className="font-medium text-gray-800">{user?.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Role</span>
            <span className="font-medium text-gray-800 capitalize">{user?.role}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Status</span>
            <span className="flex items-center gap-1.5 font-medium text-emerald-700">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
              Active
            </span>
          </div>
        </div>
      </div>

    </div>
  );
}
