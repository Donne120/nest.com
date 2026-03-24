import { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import api from '../api/client';
import { useAuthStore } from '../store';
import type { Token } from '../types';
import toast from 'react-hot-toast';

// ── Tokens ─────────────────────────────────────────────────────────────────
const BG    = '#0a0907';
const INK   = '#f0ebe2';
const INK2  = '#8a8070';
const INK3  = '#4a4238';
const RULE  = 'rgba(255,255,255,0.07)';
const GOLD  = '#c8a96e';
const GOLD2 = '#e8d4a0';
const GO    = '#5a8a6a';
const DISP  = "'Cormorant Garamond', Georgia, serif";
const UI    = "'Syne', 'Inter', sans-serif";
const MONO  = "'DM Mono', monospace";

function toSlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/[\s_]+/g, '-').replace(/-+/g, '-').trim().replace(/^-|-$/g, '') || 'your-company';
}

// ── Password strength ──────────────────────────────────────────────────────
function PasswordStrength({ password }: { password: string }) {
  if (!password) return null;
  const checks = [password.length >= 8, /[A-Z]/.test(password), /[0-9]/.test(password), /[^a-zA-Z0-9]/.test(password)];
  const score = checks.filter(Boolean).length;
  const colors = ['', '#c45c2c', '#c97a2c', GOLD, GO];
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ display: 'flex', gap: 4, marginBottom: 5 }}>
        {[1, 2, 3, 4].map(i => (
          <div key={i} style={{ height: 2, flex: 1, borderRadius: 100, background: i <= score ? colors[score] : 'rgba(255,255,255,0.08)', transition: 'background 0.3s' }} />
        ))}
      </div>
      <p style={{ fontFamily: MONO, fontSize: 10, color: colors[score] || INK3, letterSpacing: '0.08em' }}>{labels[score]}</p>
    </div>
  );
}

// ── Input field ────────────────────────────────────────────────────────────
function Field({ label, id, type = 'text', value, onChange, placeholder, required, autoFocus }: {
  label: string; id: string; type?: string; value: string;
  onChange: (v: string) => void; placeholder?: string; required?: boolean; autoFocus?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div>
      <label htmlFor={id} style={{ display: 'block', fontFamily: MONO, fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: INK2, marginBottom: 8 }}>{label}</label>
      <input
        id={id} type={type} value={value} required={required} autoFocus={autoFocus}
        placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          width: '100%', padding: '11px 14px',
          background: 'rgba(255,255,255,0.04)',
          border: `1px solid ${focused ? 'rgba(200,169,110,0.45)' : RULE}`,
          borderRadius: 4, outline: 'none',
          color: INK, fontFamily: UI, fontSize: 14,
          transition: 'border-color 0.2s', boxSizing: 'border-box',
        }}
      />
    </div>
  );
}

// ── Step indicator ─────────────────────────────────────────────────────────
function StepDots({ step }: { step: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 36 }}>
      {[1, 2].map((s, i) => (
        <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 6, height: 6, borderRadius: '50%',
            background: step >= s ? GOLD : 'rgba(255,255,255,0.12)',
            boxShadow: step >= s ? `0 0 8px ${GOLD}66` : 'none',
            transition: 'background 0.3s, box-shadow 0.3s',
          }} />
          {i === 0 && <div style={{ width: 32, height: 1, background: step > 1 ? `rgba(200,169,110,0.4)` : RULE, transition: 'background 0.3s' }} />}
        </div>
      ))}
      <span style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: '0.14em', textTransform: 'uppercase', color: INK3, marginLeft: 4 }}>Step {step} of 2</span>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────
export default function SignupPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [orgName, setOrgName]   = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');

  const handleStep1 = (e: FormEvent) => {
    e.preventDefault();
    if (orgName.trim().length < 2) { toast.error('Company name must be at least 2 characters'); return; }
    setStep(2);
  };

  const handleStep2 = async (e: FormEvent) => {
    e.preventDefault();
    if (password.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    setLoading(true);
    try {
      const { data } = await api.post<Token>('/auth/register-org', {
        org_name: orgName.trim(), full_name: fullName.trim(),
        email: email.trim(), password,
      });
      setAuth(data.user, data.access_token, data.organization);
      setStep(3);
      setTimeout(() => navigate('/admin/onboarding'), 1600);
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const slug = toSlug(orgName);

  return (
    <div style={{ minHeight: '100vh', background: BG, display: 'flex', fontFamily: UI, position: 'relative', overflow: 'hidden' }}>

      {/* Noise */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        opacity: 0.032,
      }} />

      {/* Left panel */}
      <div style={{
        width: '45%', minHeight: '100vh',
        borderRight: `1px solid ${RULE}`,
        position: 'relative', overflow: 'hidden', flexShrink: 0,
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        padding: '48px 56px',
      }}
        className="su-left-panel"
      >
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(ellipse at 60% 40%, rgba(200,169,110,0.055) 0%, transparent 65%)' }} />
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

        {/* Copy */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: GOLD, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 20, height: 1, background: GOLD, display: 'inline-block', opacity: 0.6 }} />
            Free 14-day trial
          </div>
          <h1 style={{ fontFamily: DISP, fontSize: 'clamp(40px, 4vw, 62px)', fontWeight: 300, lineHeight: 1.05, letterSpacing: '-0.02em', color: INK, marginBottom: 20 }}>
            Your team's<br /><em style={{ fontStyle: 'italic', color: GOLD }}>flight path</em><br />starts here.
          </h1>
          <p style={{ fontSize: 15, color: INK2, lineHeight: 1.75, maxWidth: 340 }}>
            Set up your workspace in two minutes. No credit card. Cancel anytime.
          </p>

          {/* Feature list */}
          <div style={{ marginTop: 36, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {['Unlimited video modules', 'Built-in quiz engine', 'Live Q&A on every lesson', 'Real-time progress tracking'].map(f => (
              <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ width: 16, height: 16, borderRadius: '50%', border: `1px solid rgba(90,138,106,0.4)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: GO, display: 'inline-block' }} />
                </span>
                <span style={{ fontFamily: MONO, fontSize: 11, color: INK2, letterSpacing: '0.04em' }}>{f}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer stat */}
        <div style={{ position: 'relative', zIndex: 1, borderTop: `1px solid ${RULE}`, paddingTop: 24, display: 'flex', gap: 32 }}>
          {[['14d', 'Free trial'], ['∞', 'Modules'], ['1', 'Click setup']].map(([val, lbl]) => (
            <div key={lbl}>
              <div style={{ fontFamily: DISP, fontSize: 26, fontWeight: 300, color: GOLD2, lineHeight: 1, letterSpacing: '-0.02em' }}>{val}</div>
              <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: INK3, marginTop: 3 }}>{lbl}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right: form */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 40px', position: 'relative', zIndex: 1 }}>
        <div style={{ width: '100%', maxWidth: 400 }}>

          {/* Success */}
          {step === 3 ? (
            <div style={{ textAlign: 'center', animation: 'lp-rise 0.6s ease both' }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', border: `1.5px solid rgba(90,138,106,0.4)`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', background: 'rgba(90,138,106,0.08)' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={GO} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
              </div>
              <h2 style={{ fontFamily: DISP, fontSize: 36, fontWeight: 400, color: INK, letterSpacing: '-0.02em', marginBottom: 10 }}>You're all set!</h2>
              <p style={{ fontFamily: UI, fontSize: 15, color: INK2, marginBottom: 6 }}>Welcome to Nest, {fullName.split(' ')[0]}.</p>
              <p style={{ fontFamily: MONO, fontSize: 10.5, color: INK3, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Taking you to your dashboard…</p>
              <div style={{ marginTop: 24, display: 'flex', justifyContent: 'center' }}>
                <span style={{ width: 32, height: 2, borderRadius: 100, background: GOLD, display: 'block', animation: 'lp-grow 1.5s ease forwards' }} />
              </div>
            </div>
          ) : (
            <>
              <div style={{ marginBottom: 36 }}>
                <h2 style={{ fontFamily: DISP, fontSize: 36, fontWeight: 400, color: INK, letterSpacing: '-0.02em', marginBottom: 8 }}>
                  {step === 1 ? 'Create workspace' : 'Your account'}
                </h2>
                <p style={{ fontFamily: MONO, fontSize: 11, color: INK3, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  {step === 1 ? 'Start with your company name' : `Admin for ${orgName}`}
                </p>
              </div>

              <StepDots step={step} />

              {/* Step 1 */}
              {step === 1 && (
                <form onSubmit={handleStep1} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <Field label="Company Name" id="orgName" value={orgName} onChange={setOrgName} placeholder="Acme Corp" required autoFocus />
                  {orgName.length >= 2 && (
                    <div style={{ fontFamily: MONO, fontSize: 10.5, color: INK3, letterSpacing: '0.06em', background: 'rgba(255,255,255,0.04)', border: `1px solid ${RULE}`, borderRadius: 4, padding: '8px 12px' }}>
                      workspace: <span style={{ color: GOLD }}>{slug}.nestapp.com</span>
                    </div>
                  )}
                  <GoldButton loading={false} label="Continue →" />
                </form>
              )}

              {/* Step 2 */}
              {step === 2 && (
                <form onSubmit={handleStep2} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                  <Field label="Full Name" id="fullName" value={fullName} onChange={setFullName} placeholder="Jane Smith" required autoFocus />
                  <Field label="Work Email" id="email" type="email" value={email} onChange={setEmail} placeholder="jane@company.com" required />
                  <div>
                    <Field label="Password" id="password" type="password" value={password} onChange={setPassword} placeholder="Min. 8 characters" required />
                    <PasswordStrength password={password} />
                  </div>
                  <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
                    <button type="button" onClick={() => setStep(1)} style={{
                      fontFamily: MONO, fontSize: 11, letterSpacing: '0.08em',
                      color: INK2, background: 'none',
                      border: `1px solid ${RULE}`, borderRadius: 4,
                      padding: '11px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                      transition: 'color 0.2s, border-color 0.2s',
                    }}
                      onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.color = INK; el.style.borderColor = 'rgba(255,255,255,0.18)'; }}
                      onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.color = INK2; el.style.borderColor = RULE; }}
                    >
                      <ArrowLeft size={12} /> Back
                    </button>
                    <div style={{ flex: 1 }}>
                      <GoldButton loading={loading} label={loading ? 'Creating…' : 'Create Workspace'} />
                    </div>
                  </div>
                </form>
              )}

              <div style={{ marginTop: 36, paddingTop: 24, borderTop: `1px solid ${RULE}` }}>
                <p style={{ fontFamily: MONO, fontSize: 11, color: INK3, letterSpacing: '0.06em', textAlign: 'center' }}>
                  Already have an account?{' '}
                  <Link to="/login" style={{ color: GOLD, textDecoration: 'none' }}
                    onMouseEnter={e => ((e.currentTarget as HTMLElement).style.textDecoration = 'underline')}
                    onMouseLeave={e => ((e.currentTarget as HTMLElement).style.textDecoration = 'none')}
                  >Sign in →</Link>
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      <style>{`
        @keyframes lp-spin { to { transform: rotate(360deg); } }
        @keyframes lp-rise { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes lp-grow { from{width:32px} to{width:120px} }
        @media (max-width: 768px) { .su-left-panel { display: none !important; } }
      `}</style>
    </div>
  );
}

// ── Gold submit button ─────────────────────────────────────────────────────
function GoldButton({ loading, label }: { loading: boolean; label: string }) {
  return (
    <button type="submit" disabled={loading} style={{
      width: '100%',
      fontFamily: UI, fontSize: 13, fontWeight: 700,
      letterSpacing: '0.06em', textTransform: 'uppercase',
      color: '#0a0907',
      background: loading ? 'rgba(200,169,110,0.6)' : '#c8a96e',
      padding: '13px 24px', borderRadius: 4, border: 'none',
      cursor: loading ? 'not-allowed' : 'pointer',
      transition: 'background 0.2s',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    }}
      onMouseEnter={e => { if (!loading) (e.currentTarget as HTMLElement).style.background = '#e8d4a0'; }}
      onMouseLeave={e => { if (!loading) (e.currentTarget as HTMLElement).style.background = '#c8a96e'; }}
    >
      {loading ? (
        <>
          <span style={{ width: 12, height: 12, border: '2px solid rgba(10,9,7,0.3)', borderTopColor: '#0a0907', borderRadius: '50%', display: 'inline-block', animation: 'lp-spin 0.7s linear infinite' }} />
          {label}
        </>
      ) : label}
    </button>
  );
}
