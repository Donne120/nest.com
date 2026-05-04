import { useState, FormEvent, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { UserPlus, AlertCircle } from 'lucide-react';
import api from '../api/client';
import { useAuthStore } from '../store';
import type { Token } from '../types';
import toast from 'react-hot-toast';
import Button from '../components/UI/Button';

interface InviteInfo {
  org_name: string;
  org_logo_url: string | null;
  org_momo_number: string | null;
  invited_role: string;
  expires_at: string;
}

export default function InvitePage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  const [info, setInfo] = useState<InviteInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingInfo, setLoadingInfo] = useState(true);

  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) return;
    api.get<InviteInfo>(`/auth/invite-info/${token}`)
      .then(({ data }) => setInfo(data))
      .catch((err) => setError(err?.response?.data?.detail || 'Invalid or expired invite link'))
      .finally(() => setLoadingInfo(false));
  }, [token]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    setSubmitting(true);
    try {
      const { data } = await api.post<Token>('/auth/accept-invite', {
        token,
        full_name: fullName.trim(),
        password,
      });
      setAuth(data.user, data.access_token, data.organization);
      toast.success(`Welcome to ${info?.org_name}!`);
      // Learners must pay before they can access content
      if (info?.invited_role === 'learner') {
        navigate('/pay/submit?source=invite');
      } else {
        navigate('/modules');
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Could not accept invite. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-blue-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-elevated border border-gray-100 p-8 max-w-sm w-full text-center">
          <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={28} className="text-red-500" />
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">Invite not valid</h2>
          <p className="text-gray-500 text-sm mb-6">{error}</p>
          <p className="text-gray-400 text-xs">Contact your admin to get a new invite link.</p>
        </div>
      </div>
    );
  }

  const roleLabel: Record<string, string> = {
    learner: 'Learner',
    educator: 'Educator',
    owner: 'Owner',
    super_admin: 'Super Admin',
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-brand-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-elevated">
            <span className="text-white font-bold text-2xl">N</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">You've been invited</h1>
          <p className="text-gray-500 mt-1 text-sm">
            Join <span className="font-semibold text-gray-700">{info?.org_name}</span> on Nest
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-elevated border border-gray-100 p-8">
          {/* Invite summary */}
          <div className="bg-brand-50 border border-brand-100 rounded-xl px-4 py-3 mb-6 flex items-center gap-3">
            <div className="w-9 h-9 bg-brand-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <UserPlus size={16} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">{info?.org_name}</p>
              <p className="text-xs text-gray-500">
                Role: <span className="font-medium text-brand-600">{roleLabel[info?.invited_role ?? ''] ?? info?.invited_role}</span>
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Full name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                minLength={2}
                placeholder="Your full name"
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Create password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                placeholder="Min. 8 characters"
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
              />
            </div>

            <Button type="submit" loading={submitting} className="w-full" size="lg">
              Accept invite & get started
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
