import { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, ArrowRight } from 'lucide-react';
import api from '../api/client';
import { useAuthStore } from '../store';
import type { Token } from '../types';
import toast from 'react-hot-toast';
import Button from '../components/UI/Button';
import clsx from 'clsx';

export default function LoginPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const form = new FormData();
      form.append('username', email);
      form.append('password', password);
      const { data } = await api.post<Token>('/auth/login', form, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });
      setAuth(data.user, data.access_token, data.organization);
      toast.success(`Welcome back, ${data.user.full_name.split(' ')[0]}!`);
      navigate(data.user.role === 'employee' ? '/modules' : '/admin');
    } catch {
      toast.error('Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-mesh flex items-center justify-center p-4">
      {/* Decorative blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-brand-200/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-violet-200/20 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className={clsx(
            'w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5',
            'bg-brand-gradient shadow-brand',
          )}>
            <span className="text-white font-bold text-xl tracking-tight">N</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Welcome back</h1>
          <p className="text-gray-500 mt-1.5 text-sm">Sign in to continue your flight path</p>
        </div>

        <div className={clsx(
          'bg-white/90 backdrop-blur-sm rounded-2xl p-7',
          'border border-gray-200/80',
          'shadow-float'
        )}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                Work Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@company.com"
                className={clsx(
                  'w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm',
                  'bg-gray-50/50 placeholder:text-gray-400',
                  'focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-400 focus:bg-white',
                  'transition-all duration-150'
                )}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className={clsx(
                    'w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm pr-11',
                    'bg-gray-50/50 placeholder:text-gray-400',
                    'focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-400 focus:bg-white',
                    'transition-all duration-150'
                  )}
                />
                <button
                  type="button"
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <Link to="/forgot-password" className="text-xs text-brand-600 hover:text-brand-700 font-medium hover:underline underline-offset-2 transition-colors">
                Forgot password?
              </Link>
            </div>

            <Button
              type="submit"
              loading={loading}
              className="w-full !py-2.5"
              size="lg"
              icon={!loading ? <ArrowRight size={15} /> : undefined}
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-500 mt-5">
          New to Nest?{' '}
          <Link to="/signup" className="text-brand-600 hover:text-brand-700 font-semibold transition-colors">
            Register your company
          </Link>
        </p>
      </div>
    </div>
  );
}
