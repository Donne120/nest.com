import { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Building2, User, ArrowRight, ArrowLeft, Check } from 'lucide-react';
import api from '../api/client';
import { useAuthStore } from '../store';
import type { Token } from '../types';
import toast from 'react-hot-toast';
import Button from '../components/UI/Button';

function toSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/[\s_]+/g, '-').replace(/-+/g, '-').trim().replace(/^-|-$/g, '') || 'your-company';
}

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^a-zA-Z0-9]/.test(password),
  ];
  const score = checks.filter(Boolean).length;
  const colors = ['', 'bg-red-400', 'bg-amber-400', 'bg-yellow-400', 'bg-emerald-500'];
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  if (!password) return null;
  return (
    <div className="mt-2">
      <div className="flex gap-1 mb-1">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className={`h-1 flex-1 rounded-full ${i <= score ? colors[score] : 'bg-gray-200'}`} />
        ))}
      </div>
      <p className="text-xs text-gray-500">{labels[score]}</p>
    </div>
  );
}

export default function SignupPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Step 1
  const [orgName, setOrgName] = useState('');
  // Step 2
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleStep1 = (e: FormEvent) => {
    e.preventDefault();
    if (orgName.trim().length < 2) {
      toast.error('Company name must be at least 2 characters');
      return;
    }
    setStep(2);
  };

  const handleStep2 = async (e: FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post<Token>('/auth/register-org', {
        org_name: orgName.trim(),
        full_name: fullName.trim(),
        email: email.trim(),
        password,
      });
      setAuth(data.user, data.access_token, data.organization);
      setStep(3);
      setTimeout(() => navigate('/admin/onboarding'), 1500);
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const slug = toSlug(orgName);

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-brand-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-elevated">
            <span className="text-white font-bold text-2xl">N</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Start your free trial</h1>
          <p className="text-gray-500 mt-1 text-sm">14 days free. No credit card required.</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                step > s ? 'bg-brand-600 text-white' :
                step === s ? 'bg-brand-600 text-white' :
                'bg-gray-200 text-gray-500'
              }`}>
                {step > s ? <Check size={14} /> : s}
              </div>
              {s < 3 && <div className={`w-8 h-0.5 rounded ${step > s ? 'bg-brand-600' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-elevated border border-gray-100 p-8">

          {/* Step 1: Company details */}
          {step === 1 && (
            <form onSubmit={handleStep1} className="space-y-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 bg-brand-100 rounded-xl flex items-center justify-center">
                  <Building2 size={18} className="text-brand-600" />
                </div>
                <div>
                  <h2 className="font-semibold text-gray-900">Your company</h2>
                  <p className="text-xs text-gray-500">Tell us about your organization</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Company name</label>
                <input
                  type="text"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  required
                  minLength={2}
                  placeholder="Acme Corp"
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                  autoFocus
                />
                {orgName.length >= 2 && (
                  <p className="mt-1.5 text-xs text-gray-400">
                    Your workspace: <span className="font-mono text-brand-600">{slug}.nestapp.com</span>
                  </p>
                )}
              </div>

              <Button type="submit" className="w-full" size="lg">
                Continue <ArrowRight size={15} className="ml-1" />
              </Button>
            </form>
          )}

          {/* Step 2: Admin account */}
          {step === 2 && (
            <form onSubmit={handleStep2} className="space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 bg-brand-100 rounded-xl flex items-center justify-center">
                  <User size={18} className="text-brand-600" />
                </div>
                <div>
                  <h2 className="font-semibold text-gray-900">Your account</h2>
                  <p className="text-xs text-gray-500">You'll be the admin for {orgName}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Full name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  minLength={2}
                  placeholder="Jane Smith"
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Work email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="jane@acme.com"
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  placeholder="Min. 8 characters"
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                />
                <PasswordStrength password={password} />
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex items-center gap-1 px-4 py-2.5 text-sm text-gray-600 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <ArrowLeft size={15} /> Back
                </button>
                <Button type="submit" loading={loading} className="flex-1" size="lg">
                  Create workspace
                </Button>
              </div>
            </form>
          )}

          {/* Step 3: Done */}
          {step === 3 && (
            <div className="text-center py-4">
              <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check size={28} className="text-emerald-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">You're all set!</h2>
              <p className="text-gray-500 text-sm mb-1">
                Welcome to Nest, {fullName.split(' ')[0]}.
              </p>
              <p className="text-gray-400 text-xs">Taking you to your dashboard...</p>
            </div>
          )}
        </div>

        {/* Login link */}
        {step < 3 && (
          <p className="text-center text-sm text-gray-500 mt-5">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-600 hover:text-brand-700 font-medium">
              Sign in
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
