import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UserPlus, Search, ShieldCheck, Users, UserX, UserCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import Avatar from '../../components/UI/Avatar';
import { useAuthStore } from '../../store';
import type { User } from '../../types';
import toast from 'react-hot-toast';
import clsx from 'clsx';

type Role = 'employee' | 'manager' | 'admin';

const ROLE_STYLES: Record<Role, string> = {
  employee: 'bg-slate-100 text-slate-700',
  manager: 'bg-blue-100 text-blue-700',
  admin: 'bg-indigo-100 text-indigo-700',
};

function timeAgo(dateStr: string) {
  const d = new Date(dateStr);
  const diff = Math.floor((Date.now() - d.getTime()) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function AdminUsersPage() {
  const { user: me } = useAuthStore();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<Role | 'all'>('all');

  const { data: members = [], isLoading } = useQuery<User[]>({
    queryKey: ['members'],
    queryFn: () => api.get('/organizations/mine/members').then(r => r.data),
  });

  const changeRole = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: Role }) =>
      api.put(`/organizations/mine/members/${userId}/role`, { role }),
    onSuccess: (_, { role }) => {
      qc.invalidateQueries({ queryKey: ['members'] });
      toast.success(`Role updated to ${role}`);
    },
    onError: (e: any) => toast.error(e?.response?.data?.detail || 'Failed to update role'),
  });

  const toggleActive = useMutation({
    mutationFn: ({ userId, active }: { userId: string; active: boolean }) =>
      api.put(`/organizations/mine/members/${userId}/${active ? 'reactivate' : 'deactivate'}`),
    onSuccess: (_, { active }) => {
      qc.invalidateQueries({ queryKey: ['members'] });
      toast.success(active ? 'User reactivated' : 'User deactivated');
    },
    onError: (e: any) => toast.error(e?.response?.data?.detail || 'Failed to update user'),
  });

  const isAdmin = me?.role === 'admin';

  const filtered = members.filter(m => {
    const matchSearch =
      m.full_name.toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase()) ||
      (m.department ?? '').toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === 'all' || m.role === roleFilter;
    return matchSearch && matchRole;
  });

  const stats = {
    total: members.length,
    active: members.filter(m => m.is_active).length,
    admins: members.filter(m => m.role === 'admin').length,
    managers: members.filter(m => m.role === 'manager').length,
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Team Members</h1>
          <p className="text-sm text-gray-500 mt-0.5">{stats.active} active · {stats.total} total</p>
        </div>
        <Link
          to="/admin/settings"
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors"
        >
          <UserPlus size={15} />
          Invite member
        </Link>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total members', value: stats.total, icon: Users, color: 'text-slate-600 bg-slate-100' },
          { label: 'Active', value: stats.active, icon: UserCheck, color: 'text-emerald-600 bg-emerald-50' },
          { label: 'Admins', value: stats.admins, icon: ShieldCheck, color: 'text-indigo-600 bg-indigo-50' },
          { label: 'Managers', value: stats.managers, icon: UserX, color: 'text-blue-600 bg-blue-50' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
            <div className={clsx('w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0', color)}>
              <Icon size={16} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 leading-none">{value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex items-center gap-3 p-4 border-b border-gray-100">
          <div className="relative flex-1 max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search name, email, department..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="flex gap-1">
            {(['all', 'employee', 'manager', 'admin'] as const).map(r => (
              <button
                key={r}
                onClick={() => setRoleFilter(r)}
                className={clsx(
                  'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                  roleFilter === r
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                )}
              >
                {r === 'all' ? 'All roles' : r.charAt(0).toUpperCase() + r.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="p-8 text-center text-gray-400 text-sm">Loading members...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">No members match your search</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                <th className="px-4 py-3">Member</th>
                <th className="px-4 py-3">Department</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Joined</th>
                {isAdmin && <th className="px-4 py-3 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(member => {
                const isMe = member.id === me?.id;
                return (
                  <tr key={member.id} className={clsx('hover:bg-gray-50 transition-colors', !member.is_active && 'opacity-60')}>
                    {/* Member */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={member.full_name} url={member.avatar_url} size="sm" />
                        <div>
                          <p className="font-medium text-gray-900 leading-none">
                            {member.full_name}
                            {isMe && <span className="ml-1.5 text-[10px] text-indigo-500 font-semibold">(you)</span>}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">{member.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Department */}
                    <td className="px-4 py-3 text-gray-500">{member.department || '—'}</td>

                    {/* Role */}
                    <td className="px-4 py-3">
                      {isAdmin && !isMe ? (
                        <select
                          value={member.role}
                          onChange={e => changeRole.mutate({ userId: member.id, role: e.target.value as Role })}
                          className={clsx(
                            'text-xs font-semibold px-2.5 py-1 rounded-full border-0 cursor-pointer focus:ring-2 focus:ring-indigo-500 focus:outline-none',
                            ROLE_STYLES[member.role as Role] ?? 'bg-gray-100 text-gray-700'
                          )}
                        >
                          <option value="employee">Employee</option>
                          <option value="manager">Manager</option>
                          <option value="admin">Admin</option>
                        </select>
                      ) : (
                        <span className={clsx(
                          'inline-block text-xs font-semibold px-2.5 py-1 rounded-full',
                          ROLE_STYLES[member.role as Role] ?? 'bg-gray-100 text-gray-700'
                        )}>
                          {member.role}
                        </span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <span className={clsx(
                        'inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full',
                        member.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'
                      )}>
                        <span className={clsx('w-1.5 h-1.5 rounded-full', member.is_active ? 'bg-emerald-500' : 'bg-red-400')} />
                        {member.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>

                    {/* Joined */}
                    <td className="px-4 py-3 text-gray-400 text-xs">{timeAgo(member.created_at)}</td>

                    {/* Actions */}
                    {isAdmin && (
                      <td className="px-4 py-3 text-right">
                        {!isMe && (
                          <button
                            onClick={() => toggleActive.mutate({ userId: member.id, active: !member.is_active })}
                            className={clsx(
                              'text-xs font-medium px-3 py-1.5 rounded-lg transition-colors',
                              member.is_active
                                ? 'text-red-600 hover:bg-red-50'
                                : 'text-emerald-600 hover:bg-emerald-50'
                            )}
                          >
                            {member.is_active ? 'Deactivate' : 'Reactivate'}
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
