import { useState, FormEvent, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Users, AlertCircle, Lock } from 'lucide-react';
import api from '../api/client';
import { useAuthStore } from '../store';
import type { Token } from '../types';
import toast from 'react-hot-toast';
import Button from '../components/UI/Button';

interface JoinLinkInfo {
  org_name: string;
  org_logo_url: string | null;
  label: string | null;
  role: string;
  free_access: boolean;
  requires_code: boolean;
  max_uses: number | null;
  use_count: number;
  expires_at: string | null;
}

export default function JoinPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  const [info, setInfo] = useState<JoinLinkInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingInfo, setLoadingInfo] = useState(true);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) return;
    api.get<JoinLinkInfo>(`/auth/join-info/${token}`)
      .then(({ data }) => setInfo(data))
      .catch((err) => setError(err?.response?.data?.detail || 'Invalid or expired invite link'))
      .finally(() => setLoadingInfo(false));
  }, [token]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setSubmitting(true);
    try {
      const { data } = await api.post<Token>(`/auth/join/${token}`, {
        full_name: fullName.trim(),
        email: email.trim().toLowerCase(),
        password,
        access_code: accessCode.trim() || undefined,
      });
      setAuth(data.user, data.access_token, data.organization);
      toast.success(`Welcome to ${info?.org_name}!`);
      if (info?.free_access) {
        // Access granted immediately — go straight to learning
        navigate(data.user.role === 'learner' ? '/modules' : '/admin');
      } else {
        // Standard payment flow
        navigate('/pay/submit?source=join');
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Could not join. Please try again.');
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
          <h2 className="text-lg font-bold text-gray-900 mb-2">Link not valid</h2>
          <p className="text-gray-500 text-sm mb-6">{error}</p>
          <p className="text-gray-400 text-xs">Contact your admin for a new invite link.</p>
        </div>
      </div>
    );
  }

  const spotsLeft = info?.max_uses != null
    ? info.max_uses - (info.use_count ?? 0)
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          {info?.org_logo_url ? (
            <img
              src={info.org_logo_url}
              alt={info.org_name}
              className="w-14 h-14 rounded-2xl object-contain mx-auto mb-4 shadow-elevated"
            />
          ) : (
            <div className="w-14 h-14 bg-brand-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-elevated">
              <span className="text-white font-bold text-2xl">N</span>
            </div>
          )}
          <h1 className="text-2xl font-bold text-gray-900">Join {info?.org_name}</h1>
          {info?.label && (
            <p className="text-gray-500 mt-1 text-sm">{info.label}</p>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-elevated border border-gray-100 p-8">
          {/* Link summary */}
          <div className="bg-brand-50 border border-brand-100 rounded-xl px-4 py-3 mb-6 flex items-start gap-3">
            <div className="w-9 h-9 bg-brand-600 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
              {info?.requires_code
                ? <Lock size={15} className="text-white" />
                : <Users size={15} className="text-white" />
              }
            </div>
            <div className="text-sm">
              <p className="font-medium text-gray-900">{info?.org_name}</p>
              <p className="text-xs text-gray-500 mt-0.5">
                Role: <span className="font-medium text-brand-600 capitalize">{info?.role}</span>
                {info?.free_access && (
                  <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-700">
                    Free access
                  </span>
                )}
              </p>
              {spotsLeft != null && (
                <p className="text-xs text-gray-400 mt-0.5">{spotsLeft} spot{spotsLeft !== 1 ? 's' : ''} remaining</p>
              )}
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
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@email.com"
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Create password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                placeholder="Min. 6 characters"
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
              />
            </div>

            {info?.requires_code && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Access code
                  <span className="ml-1 text-xs text-brand-600 font-normal">(required)</span>
                </label>
                <input
                  type="text"
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value)}
                  required
                  placeholder="Enter the code from your admin"
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all font-mono tracking-widest"
                />
              </div>
            )}

            <Button type="submit" loading={submitting} className="w-full" size="lg">
              {info?.free_access ? 'Create account & start learning' : 'Create account & continue to payment'}
            </Button>
          </form>

          <p className="text-center text-xs text-gray-400 mt-5">
            Already have an account?{' '}
            <a href="/login" className="text-brand-600 hover:underline">Sign in</a>
          </p>
        </div>
      </div>
    </div>
  );
}
