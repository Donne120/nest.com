import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { User, Lock, Shield, Palette } from 'lucide-react';
import api from '../api/client';
import { useAuthStore } from '../store';
import Avatar from '../components/UI/Avatar';
import ThemeToggle from '../components/UI/ThemeToggle';
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

  const inputCls = "w-full border border-gray-200 dark:border-slate-600 rounded-xl px-3.5 py-2.5 text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:focus:ring-brand-400";
  const disabledInputCls = "w-full border border-gray-100 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm bg-gray-50 dark:bg-slate-800 text-gray-400 dark:text-slate-500 cursor-not-allowed";
  const labelCls = "block text-xs font-medium text-gray-600 dark:text-slate-300 mb-1.5";
  const cardCls = "bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 overflow-hidden";
  const cardHeaderCls = "px-6 py-4 border-b border-gray-100 dark:border-slate-700 flex items-center gap-2";

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-6">

      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-slate-100">Profile Settings</h1>
        <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">Manage your personal information and preferences</p>
      </div>

      {/* ── Appearance ── */}
      <div className={cardCls}>
        <div className={cardHeaderCls}>
          <Palette size={15} className="text-gray-400 dark:text-slate-400" />
          <h2 className="text-sm font-semibold text-gray-800 dark:text-slate-200">Appearance</h2>
        </div>
        <div className="p-6 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-gray-800 dark:text-slate-200">Theme</p>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">Choose how Nest looks for you</p>
          </div>
          <ThemeToggle />
        </div>
      </div>

      {/* ── Profile card ── */}
      <div className={cardCls}>
        <div className={cardHeaderCls}>
          <User size={15} className="text-gray-400 dark:text-slate-400" />
          <h2 className="text-sm font-semibold text-gray-800 dark:text-slate-200">Personal information</h2>
        </div>

        <div className="p-6">
          {/* Avatar preview */}
          <div className="flex items-center gap-4 mb-6">
            <Avatar name={previewName} url={avatarUrl || null} size="lg" />
            <div>
              <p className="font-semibold text-gray-900 dark:text-slate-100">{previewName}</p>
              <p className="text-xs text-gray-400 dark:text-slate-400 capitalize mt-0.5">{user?.role} · {user?.email}</p>
            </div>
          </div>

          <form
            onSubmit={e => { e.preventDefault(); saveProfile.mutate(); }}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="full-name" className={labelCls}>Full name</label>
                <input id="full-name" type="text" value={name} onChange={e => setName(e.target.value)} required className={inputCls} />
              </div>
              <div>
                <label htmlFor="department" className={labelCls}>Department</label>
                <input id="department" type="text" value={department} onChange={e => setDepartment(e.target.value)} placeholder="e.g. Engineering" className={inputCls} />
              </div>
            </div>

            <div>
              <label htmlFor="avatar-url" className={labelCls}>Avatar URL <span className="text-gray-400 dark:text-slate-500 font-normal">(optional)</span></label>
              <input id="avatar-url" type="url" value={avatarUrl} onChange={e => setAvatarUrl(e.target.value)} placeholder="https://..." className={inputCls} />
            </div>

            {/* Read-only fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div>
                <label className="block text-xs font-medium text-gray-400 dark:text-slate-500 mb-1.5">Email <span className="text-gray-300 dark:text-slate-600">(can't change)</span></label>
                <input type="text" value={user?.email ?? ''} disabled className={disabledInputCls} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 dark:text-slate-500 mb-1.5">Role <span className="text-gray-300 dark:text-slate-600">(assigned by admin)</span></label>
                <input type="text" value={user?.role ?? ''} disabled className={`${disabledInputCls} capitalize`} />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={saveProfile.isPending}
                className="bg-brand-600 text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-brand-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saveProfile.isPending ? 'Saving...' : 'Save changes'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* ── Change password ── */}
      <div className={cardCls}>
        <div className={cardHeaderCls}>
          <Lock size={15} className="text-gray-400 dark:text-slate-400" />
          <h2 className="text-sm font-semibold text-gray-800 dark:text-slate-200">Change password</h2>
        </div>

        <form onSubmit={handlePasswordSubmit} className="p-6 space-y-4">
          <div>
            <label htmlFor="current-pw" className={labelCls}>Current password</label>
            <input id="current-pw" type="password" value={currentPw} onChange={e => setCurrentPw(e.target.value)} required placeholder="••••••••" className={inputCls} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="new-pw" className={labelCls}>New password</label>
              <input id="new-pw" type="password" value={newPw} onChange={e => setNewPw(e.target.value)} required minLength={8} placeholder="At least 8 characters" className={inputCls} />
              {newPw.length > 0 && newPw.length < 8 && (
                <p className="text-xs text-red-500 mt-1">Password must be at least 8 characters</p>
              )}
            </div>
            <div>
              <label htmlFor="confirm-pw" className={labelCls}>Confirm new password</label>
              <input id="confirm-pw" type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} required placeholder="Same as above" className={inputCls} />
              {confirmPw.length > 0 && confirmPw !== newPw && (
                <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
              )}
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={changePassword.isPending}
              className="bg-gray-900 dark:bg-slate-600 dark:hover:bg-slate-500 text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {changePassword.isPending ? 'Updating...' : 'Update password'}
            </button>
          </div>
        </form>
      </div>

      {/* ── Account info ── */}
      <div className={cardCls}>
        <div className={cardHeaderCls}>
          <Shield size={15} className="text-gray-400 dark:text-slate-400" />
          <h2 className="text-sm font-semibold text-gray-800 dark:text-slate-200">Account</h2>
        </div>
        <div className="p-6 space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400 dark:text-slate-500">Email</span>
            <span className="font-medium text-gray-800 dark:text-slate-200">{user?.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400 dark:text-slate-500">Role</span>
            <span className="font-medium text-gray-800 dark:text-slate-200 capitalize">{user?.role}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400 dark:text-slate-500">Status</span>
            <span className="flex items-center gap-1.5 font-medium text-emerald-700 dark:text-emerald-400">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
              Active
            </span>
          </div>
        </div>
      </div>

    </div>
  );
}
