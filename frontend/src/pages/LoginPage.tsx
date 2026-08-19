import { useState, FormEvent } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import api from '../api/client';
import { useAuthStore } from '../store';
import type { Token } from '../types';
import toast from 'react-hot-toast';

// ── Tokens — white form + violet brand panel ("Calm Purple") ────────────────
const BG     = '#ffffff';   // page + form background
const CARD   = '#ffffff';
const INK    = '#1E1B2E';   // form primary text — deep aubergine-slate
const INK2   = '#6E6A85';   // form secondary text
const INK3   = '#A5A1B8';   // form muted text
const RULE   = 'rgba(30,27,46,0.10)';
const GOLD   = '#6D4AE0';   // brand violet — primary accent
const GOLD2  = '#5A38C7';   // deep violet
const ACC    = '#23B99A';   // mint — secondary accent
// Left brand panel — now a bright violet gradient (white text on violet)
const PANEL   = '#6D4AE0';
const PANEL_INK  = '#FFFFFF';
const PANEL_INK2 = 'rgba(255,255,255,0.82)';
const PANEL_INK3 = 'rgba(255,255,255,0.60)';
const PANEL_ACC  = '#D9C9FB';
const DISP  = "'Cormorant Garamond', Georgia, serif";
const UI    = "'Syne', 'Inter', sans-serif";
const MONO  = "'DM Mono', monospace";

function Field({
  label, id, type = 'text', value, onChange, placeholder, required, autoFocus, children,
}: {
  label: string; id: string; type?: string; value: string;
  onChange: (v: string) => void; placeholder?: string;
  required?: boolean; autoFocus?: boolean; children?: React.ReactNode;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div>
      <label htmlFor={id} style={{ display: 'block', fontFamily: MONO, fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: INK2, marginBottom: 8 }}>
        {label}
      </label>
      <div style={{ position: 'relative' }}>
        <input
          id={id} type={type} value={value} required={required} autoFocus={autoFocus}
          placeholder={placeholder}
          onChange={e => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            width: '100%', padding: '11px 14px', paddingRight: children ? 42 : 14,
            background: focused ? '#ffffff' : '#f7f6f8',
            border: `1px solid ${focused ? `rgba(109,74,224,0.55)` : RULE}`,
            boxShadow: focused ? '0 0 0 3px rgba(109,74,224,0.12)' : 'none',
            borderRadius: 4, outline: 'none',
            color: INK, fontFamily: UI, fontSize: 14,
            transition: 'border-color 0.2s',
            boxSizing: 'border-box',
          }}
        />
        {children}
      </div>
    </div>
  );
}

export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
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
      const next = searchParams.get('next');
      navigate(next ? decodeURIComponent(next) : (data.user.role === 'learner' ? '/modules' : '/admin'));
    } catch (err: any) {
      const msg = err?.response?.data?.detail;
      toast.error(msg || 'Sign in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: UI, position: 'relative', overflow: 'hidden', colorScheme: 'light' }}>

      {/* Noise overlay */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        opacity: 0.032,
      }} />

      {/* Card */}
      <div style={{
        display: 'flex', width: '100%', maxWidth: 960, minHeight: '100vh',
        position: 'relative', zIndex: 1,
        margin: '0 auto',
      }}>

      {/* Left decorative panel */}
      <div style={{
        width: 440, flexShrink: 0, minHeight: '100vh',
        background: `linear-gradient(160deg, #8B6FE8 0%, ${PANEL} 55%, #5A38C7 100%)`,
        position: 'relative', overflow: 'hidden',
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        padding: '56px 56px',
      }}
        className="login-left-panel"
      >
        {/* Ambient glow */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(ellipse at 40% 60%, rgba(255,255,255,0.14) 0%, transparent 65%), radial-gradient(ellipse at 80% 15%, rgba(35,185,154,0.12) 0%, transparent 50%)' }} />
        {/* Grid */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: 'repeating-linear-gradient(90deg,rgba(255,255,255,0.018) 0,rgba(255,255,255,0.018) 1px,transparent 1px,transparent 80px),repeating-linear-gradient(0deg,rgba(255,255,255,0.018) 0,rgba(255,255,255,0.018) 1px,transparent 1px,transparent 80px)',
        }} />

        {/* Logo */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <Link to="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 30, height: 30, border: `1.5px solid rgba(206,146,220,0.5)`, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: PANEL_ACC, fontFamily: UI }}>N</div>
            <span style={{ fontFamily: DISP, fontSize: 22, fontWeight: 600, color: PANEL_INK, letterSpacing: '0.01em' }}>Nest</span>
          </Link>
        </div>

        {/* Hero copy */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: PANEL_ACC, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 20, height: 1, background: PANEL_ACC, display: 'inline-block', opacity: 0.6 }} />
            Welcome back
          </div>
          <h1 style={{ fontFamily: DISP, fontSize: 'clamp(40px, 4vw, 62px)', fontWeight: 300, lineHeight: 1.05, letterSpacing: '-0.02em', color: PANEL_INK, marginBottom: 20 }}>
            <em style={{ fontStyle: 'italic', color: PANEL_ACC }}>Continue</em><br />where you left off.
          </h1>
          <p style={{ fontSize: 15, color: PANEL_INK2, lineHeight: 1.75, maxWidth: 340 }}>
            Your courses are waiting. Sign in to keep learning.
          </p>
        </div>

        {/* Bottom quote */}
        <div style={{ position: 'relative', zIndex: 1, borderTop: `1px solid rgba(255,255,255,0.10)`, paddingTop: 24 }}>
          <p style={{ fontFamily: DISP, fontStyle: 'italic', fontSize: 16, fontWeight: 300, color: PANEL_INK2, lineHeight: 1.7, marginBottom: 12 }}>
            "The best time to learn something new is always now."
          </p>
          <div style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: '0.14em', textTransform: 'uppercase', color: PANEL_INK3 }}>— Nest</div>
        </div>
      </div>

      {/* Right: form */}
      <div className="login-form-panel" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 1 }}>
        <div style={{ width: '100%', maxWidth: 400 }}>

          {/* Mobile-only logo */}
          <div className="login-mobile-logo" style={{ display: 'none', marginBottom: 32, textAlign: 'center' }}>
            <Link to="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, border: `1.5px solid rgba(109,74,224,0.4)`, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800, color: GOLD, fontFamily: UI }}>N</div>
              <span style={{ fontFamily: DISP, fontSize: 26, fontWeight: 600, color: GOLD2, letterSpacing: '0.01em' }}>Nest</span>
            </Link>
          </div>

          <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontFamily: DISP, fontSize: 'clamp(28px, 6vw, 36px)', fontWeight: 400, color: INK, letterSpacing: '-0.02em', marginBottom: 8 }}>Sign in</h2>
            <p style={{ fontFamily: MONO, fontSize: 12, color: INK3, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Enter your credentials to continue</p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <Field label="Email" id="email" type="email" value={email} onChange={setEmail} placeholder="you@example.com" required autoFocus />

            <Field label="Password" id="password" type={showPw ? 'text' : 'password'} value={password} onChange={setPassword} placeholder="••••••••" required>
              <button
                type="button"
                onClick={() => setShowPw(p => !p)}
                aria-label={showPw ? 'Hide password' : 'Show password'}
                style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', cursor: 'pointer', color: INK3 }}
              >
                {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </Field>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Link to="/forgot-password" style={{ fontSize: 13, color: GOLD, textDecoration: 'none' }}>
                Forgot password?
              </Link>
            </div>

            <button type="submit" disabled={loading} style={{
              fontFamily: UI, fontSize: 15, fontWeight: 700,
              letterSpacing: '0.04em',
              color: BG, background: loading ? 'rgba(109,74,224,0.6)' : GOLD,
              padding: '15px 24px', borderRadius: 6, border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              minHeight: 52,
              transition: 'background 0.2s',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              width: '100%',
            }}>
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 14, height: 14, border: `2px solid rgba(255,255,255,0.4)`, borderTopColor: '#ffffff', borderRadius: '50%', display: 'inline-block', animation: 'lp-spin 0.7s linear infinite' }} />
                  Signing in…
                </span>
              ) : 'Sign In'}
            </button>
          </form>

          <div style={{ marginTop: 32, paddingTop: 24, borderTop: `1px solid ${RULE}` }}>
            <p style={{ fontSize: 14, color: INK3, textAlign: 'center' }}>
              New to Nest?{' '}
              <Link to="/signup" style={{ color: GOLD, textDecoration: 'none', fontWeight: 600 }}>
                Register your organisation →
              </Link>
            </p>
          </div>
        </div>
      </div>

      </div>{/* /Card */}

      <style>{`
        @keyframes lp-spin { to { transform: rotate(360deg); } }
        @media (max-width: 768px) {
          .login-left-panel { display: none !important; }
          .login-form-panel { padding: 40px 24px !important; align-items: flex-start !important; padding-top: 60px !important; }
          .login-mobile-logo { display: flex !important; justify-content: center; }
        }
        @media (min-width: 769px) {
          .login-form-panel { padding: 56px 64px; }
        }
      `}</style>
    </div>
  );
}
