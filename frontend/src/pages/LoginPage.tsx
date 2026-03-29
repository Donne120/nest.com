import { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import api from '../api/client';
import { useAuthStore } from '../store';
import type { Token } from '../types';
import toast from 'react-hot-toast';

// ── Tokens ─────────────────────────────────────────────────────────────────
const BG    = '#0a0907';
const CARD  = '#161410';
const INK   = '#f0ebe2';
const INK2  = '#8a8070';
const INK3  = '#4a4238';
const RULE  = 'rgba(255,255,255,0.07)';
const GOLD  = '#c8a96e';
const GOLD2 = '#e8d4a0';
const ACC   = '#c45c2c';
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
            background: 'rgba(255,255,255,0.04)',
            border: `1px solid ${focused ? `rgba(200,169,110,0.45)` : RULE}`,
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
      navigate(data.user.role === 'learner' ? '/modules' : '/admin');
    } catch {
      toast.error('Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: BG, display: 'flex', fontFamily: UI, position: 'relative', overflow: 'hidden' }}>

      {/* Noise overlay */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        opacity: 0.032,
      }} />

      {/* Left decorative panel */}
      <div style={{
        width: '45%', minHeight: '100vh',
        borderRight: `1px solid ${RULE}`,
        position: 'relative', overflow: 'hidden',
        flexShrink: 0,
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        padding: '48px 56px',
      }}
        className="login-left-panel"
      >
        {/* Ambient glow */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(ellipse at 40% 60%, rgba(200,169,110,0.06) 0%, transparent 65%)' }} />
        {/* Grid */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: 'repeating-linear-gradient(90deg,rgba(255,255,255,0.018) 0,rgba(255,255,255,0.018) 1px,transparent 1px,transparent 80px),repeating-linear-gradient(0deg,rgba(255,255,255,0.018) 0,rgba(255,255,255,0.018) 1px,transparent 1px,transparent 80px)',
        }} />

        {/* Logo */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <Link to="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 30, height: 30, border: `1.5px solid rgba(200,169,110,0.4)`, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: GOLD, fontFamily: UI }}>N</div>
            <span style={{ fontFamily: DISP, fontSize: 22, fontWeight: 600, color: GOLD2, letterSpacing: '0.01em' }}>Nest</span>
          </Link>
        </div>

        {/* Hero copy */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: GOLD, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 20, height: 1, background: GOLD, display: 'inline-block', opacity: 0.6 }} />
            Welcome back
          </div>
          <h1 style={{ fontFamily: DISP, fontSize: 'clamp(40px, 4vw, 62px)', fontWeight: 300, lineHeight: 1.05, letterSpacing: '-0.02em', color: INK, marginBottom: 20 }}>
            <em style={{ fontStyle: 'italic', color: GOLD }}>Continue</em><br />your flight path.
          </h1>
          <p style={{ fontSize: 15, color: INK2, lineHeight: 1.75, maxWidth: 340 }}>
            Your team's knowledge is waiting. Sign in to pick up where you left off.
          </p>
        </div>

        {/* Bottom quote */}
        <div style={{ position: 'relative', zIndex: 1, borderTop: `1px solid ${RULE}`, paddingTop: 24 }}>
          <p style={{ fontFamily: DISP, fontStyle: 'italic', fontSize: 16, fontWeight: 300, color: INK2, lineHeight: 1.7, marginBottom: 12 }}>
            "Great onboarding is the difference between a hire who stays and one who leaves."
          </p>
          <div style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: '0.14em', textTransform: 'uppercase', color: INK3 }}>— Nest Fledge</div>
        </div>
      </div>

      {/* Right: form */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 40px', position: 'relative', zIndex: 1 }}>
        <div style={{ width: '100%', maxWidth: 400 }}>

          <div style={{ marginBottom: 40 }}>
            <h2 style={{ fontFamily: DISP, fontSize: 36, fontWeight: 400, color: INK, letterSpacing: '-0.02em', marginBottom: 8 }}>Sign in</h2>
            <p style={{ fontFamily: MONO, fontSize: 11, color: INK3, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Enter your credentials to continue</p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <Field label="Work Email" id="email" type="email" value={email} onChange={setEmail} placeholder="you@company.com" required autoFocus />

            <Field label="Password" id="password" type={showPw ? 'text' : 'password'} value={password} onChange={setPassword} placeholder="••••••••" required>
              <button
                type="button"
                onClick={() => setShowPw(p => !p)}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: INK3, padding: 2, transition: 'color 0.2s' }}
                onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = INK2)}
                onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = INK3)}
              >
                {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </Field>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Link to="/forgot-password" style={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: '0.08em', color: GOLD, textDecoration: 'none', transition: 'opacity 0.2s' }}
                onMouseEnter={e => ((e.currentTarget as HTMLElement).style.opacity = '0.7')}
                onMouseLeave={e => ((e.currentTarget as HTMLElement).style.opacity = '1')}
              >Forgot password?</Link>
            </div>

            <button type="submit" disabled={loading} style={{
              fontFamily: UI, fontSize: 13, fontWeight: 700,
              letterSpacing: '0.06em', textTransform: 'uppercase',
              color: BG, background: loading ? 'rgba(200,169,110,0.6)' : GOLD,
              padding: '13px 24px', borderRadius: 4, border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background 0.2s, transform 0.15s',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            }}
              onMouseEnter={e => { if (!loading) (e.currentTarget as HTMLElement).style.background = GOLD2; }}
              onMouseLeave={e => { if (!loading) (e.currentTarget as HTMLElement).style.background = GOLD; }}
            >
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 12, height: 12, border: `2px solid rgba(10,9,7,0.3)`, borderTopColor: BG, borderRadius: '50%', display: 'inline-block', animation: 'lp-spin 0.7s linear infinite' }} />
                  Signing in…
                </span>
              ) : 'Sign In'}
            </button>
          </form>

          <div style={{ marginTop: 36, paddingTop: 24, borderTop: `1px solid ${RULE}` }}>
            <p style={{ fontFamily: MONO, fontSize: 11, color: INK3, letterSpacing: '0.06em', textAlign: 'center' }}>
              New to Nest?{' '}
              <Link to="/signup" style={{ color: GOLD, textDecoration: 'none', fontWeight: 500 }}
                onMouseEnter={e => ((e.currentTarget as HTMLElement).style.textDecoration = 'underline')}
                onMouseLeave={e => ((e.currentTarget as HTMLElement).style.textDecoration = 'none')}
              >Register your company →</Link>
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes lp-spin { to { transform: rotate(360deg); } }
        @media (max-width: 768px) { .login-left-panel { display: none !important; } }
      `}</style>
    </div>
  );
}
