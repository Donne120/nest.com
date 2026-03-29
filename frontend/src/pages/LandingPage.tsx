import { Link } from 'react-router-dom';
import { useEffect, useRef } from 'react';

// ── Tokens ─────────────────────────────────────────────────────────────────
const BG      = '#0a0907';
const SURFACE = '#111009';
const CARD    = '#161410';
const INK     = '#f0ebe2';
const INK2    = '#8a8070';
const INK3    = '#4a4238';
const RULE    = 'rgba(255,255,255,0.07)';
const GOLD    = '#c8a96e';
const GOLD2   = '#e8d4a0';
const RUST    = '#c45c2c';
const SAGE    = '#5a8a6a';

const DISP  = "'Cormorant Garamond', Georgia, serif";
const UI    = "'Syne', sans-serif";
const MONO  = "'DM Mono', monospace";

// ── Scroll reveal hook ─────────────────────────────────────────────────────
function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>('.lp-reveal');
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          (e.target as HTMLElement).style.opacity = '1';
          (e.target as HTMLElement).style.transform = 'translateY(0)';
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.08 });
    els.forEach(el => io.observe(el));
    return () => io.disconnect();
  }, []);
}

// ── Nav ────────────────────────────────────────────────────────────────────
function LandingNav() {
  return (
    <header style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 500,
      height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 clamp(16px, 4vw, 48px)',
      borderBottom: `1px solid ${RULE}`,
      background: 'rgba(10,9,7,0.88)',
      backdropFilter: 'blur(16px)',
      fontFamily: UI,
      gap: 12,
    }}>
      <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <div style={{
          width: 32, height: 32,
          border: `1.5px solid rgba(200,169,110,0.4)`,
          borderRadius: 6,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 13, fontWeight: 800, color: GOLD, fontFamily: UI,
        }}>N</div>
        <span style={{ fontFamily: DISP, fontSize: 24, fontWeight: 600, color: GOLD2, letterSpacing: '0.01em' }}>Nest</span>
      </Link>

      {/* Center nav — hidden on mobile */}
      <nav className="lp-nav-links" style={{ display: 'flex', gap: 0 }}>
        {[['#features','Features'],['#how','How it works'],['#pricing','Pricing']].map(([href, label]) => (
          <a key={href} href={href} style={{ fontSize: 13, fontWeight: 500, color: INK2, textDecoration: 'none', padding: '8px 14px', letterSpacing: '0.02em', transition: 'color 0.2s', fontFamily: UI, whiteSpace: 'nowrap' }}
            onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = INK)}
            onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = INK2)}
          >{label}</a>
        ))}
        <Link to="/login" style={{ fontSize: 13, fontWeight: 500, color: INK2, textDecoration: 'none', padding: '8px 14px', letterSpacing: '0.02em', transition: 'color 0.2s', fontFamily: UI }}
          onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = INK)}
          onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = INK2)}
        >Sign in</Link>
      </nav>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        {/* Sign in — shown on mobile since center nav is hidden */}
        <Link to="/login" className="lp-signin-mobile" style={{ fontSize: 13, fontWeight: 500, color: INK2, textDecoration: 'none', padding: '7px 12px', display: 'none' }}>Sign in</Link>
        <Link to="/signup" style={{
          fontFamily: UI, fontSize: 12.5, fontWeight: 700,
          letterSpacing: '0.04em', textTransform: 'uppercase',
          color: BG, background: GOLD,
          padding: '9px 16px', borderRadius: 4, border: 'none',
          textDecoration: 'none', display: 'inline-block', whiteSpace: 'nowrap',
          transition: 'background 0.2s, transform 0.15s',
        }}
          onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = GOLD2; el.style.transform = 'translateY(-1px)'; }}
          onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = GOLD; el.style.transform = 'translateY(0)'; }}
        >Start free trial</Link>
      </div>
    </header>
  );
}

// ── Hero ───────────────────────────────────────────────────────────────────
function Hero() {
  return (
    <section style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: 'clamp(80px,10vw,100px) clamp(16px,5vw,48px) clamp(48px,6vw,80px)',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Ambient glow */}
      <div style={{
        position: 'absolute', width: 900, height: 600,
        top: '50%', left: '50%', transform: 'translate(-50%,-55%)',
        background: `radial-gradient(ellipse, rgba(200,169,110,0.06) 0%, transparent 70%)`,
        pointerEvents: 'none',
      }} />
      {/* Horizontal rule lines */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: `linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px)`,
        backgroundSize: '100% 80px',
      }} />
      {/* Vertical center rule */}
      <div style={{
        position: 'absolute', top: 0, bottom: 0, left: '50%', width: 1,
        background: `linear-gradient(to bottom, transparent, rgba(200,169,110,0.08) 30%, rgba(200,169,110,0.08) 70%, transparent)`,
        pointerEvents: 'none',
      }} />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 900, textAlign: 'center' }}>
        {/* Eyebrow */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 10,
          fontFamily: MONO, fontSize: 10.5, letterSpacing: '0.2em', textTransform: 'uppercase',
          color: GOLD,
          border: `1px solid rgba(200,169,110,0.2)`,
          padding: '7px 16px', borderRadius: 100,
          marginBottom: 40,
          animation: 'lpRise 0.8s ease forwards',
        }}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: GOLD, animation: 'lpBlink 2s infinite', display: 'inline-block' }} />
          14-day free trial · No credit card required
        </div>

        {/* Headline */}
        <h1 style={{
          fontFamily: DISP,
          fontSize: 'clamp(64px, 8vw, 108px)',
          fontWeight: 300, lineHeight: 0.95,
          letterSpacing: '-0.02em', color: INK,
          marginBottom: 32,
          animation: 'lpRise 0.9s ease 0.1s both',
        }}>
          <em style={{ fontStyle: 'italic', color: GOLD, fontWeight: 300 }}>Where careers</em>
          <span style={{
            display: 'block',
            fontSize: 'clamp(44px, 5.5vw, 72px)',
            fontWeight: 600, fontStyle: 'normal', color: INK2,
            marginTop: 8, letterSpacing: '0.01em',
          }}>take flight.</span>
        </h1>

        {/* Subtitle */}
        <p style={{
          maxWidth: 520, margin: '0 auto 48px',
          fontSize: 17, fontWeight: 400, color: INK2, lineHeight: 1.7,
          fontFamily: UI,
          animation: 'lpRise 0.9s ease 0.2s both',
        }}>
          Nest Fledge transforms your training videos into structured learning journeys — with quizzes, live Q&amp;A, and analytics that actually tell you something.
        </p>

        {/* CTAs */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16,
          marginBottom: 80, flexWrap: 'wrap',
          animation: 'lpRise 0.9s ease 0.3s both',
        }}>
          <Link to="/signup" style={{
            fontFamily: UI, fontSize: 13, fontWeight: 700,
            letterSpacing: '0.06em', textTransform: 'uppercase',
            color: BG, background: GOLD,
            padding: '14px 32px', borderRadius: 4, border: 'none',
            textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 10,
            transition: 'background 0.2s, transform 0.15s, box-shadow 0.2s',
          }}
            onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = GOLD2; el.style.transform = 'translateY(-2px)'; el.style.boxShadow = '0 16px 40px rgba(200,169,110,0.2)'; }}
            onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = GOLD; el.style.transform = 'translateY(0)'; el.style.boxShadow = 'none'; }}
          >
            Start free trial
            <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 10h10M12 7l3 3-3 3"/></svg>
          </Link>
          <a href="#how" style={{
            fontFamily: UI, fontSize: 13, fontWeight: 500, letterSpacing: '0.04em',
            color: INK2, background: 'none',
            border: `1px solid ${RULE}`,
            padding: '13px 28px', borderRadius: 4,
            textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8,
            transition: 'color 0.2s, border-color 0.2s',
          }}
            onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.color = INK; el.style.borderColor = 'rgba(255,255,255,0.18)'; }}
            onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.color = INK2; el.style.borderColor = RULE; }}
          >
            <svg width="13" height="13" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="10" cy="10" r="8"/><path d="M7.5 8.5l5 1.5-5 1.5"/></svg>
            See how it works
          </a>
        </div>

        {/* Stats strip */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(120px,1fr))',
          borderTop: `1px solid ${RULE}`, borderBottom: `1px solid ${RULE}`,
          width: '100%', animation: 'lpRise 0.9s ease 0.45s both',
        }}>
          {[
            { val: '14', unit: 'd', label: 'Free trial' },
            { val: '∞', unit: '', label: 'Videos per module' },
            { val: '31+', unit: '', label: 'Quiz question types' },
            { val: '1', unit: 'click', label: 'Team onboarding' },
          ].map((s, i) => (
            <div key={s.label} style={{
              textAlign: 'center', padding: '20px 16px',
              borderRight: i < 3 ? `1px solid ${RULE}` : 'none',
            }}>
              <div style={{ fontFamily: DISP, fontSize: 34, fontWeight: 300, color: GOLD2, lineHeight: 1, letterSpacing: '-0.02em', marginBottom: 4 }}>
                {s.val}
                {s.unit && <em style={{ fontFamily: DISP, fontStyle: 'italic', color: GOLD, fontSize: 22 }}>{s.unit}</em>}
              </div>
              <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: INK3 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Section label ──────────────────────────────────────────────────────────
function SLabel({ children }: { children: string }) {
  return (
    <div style={{
      fontFamily: MONO, fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase',
      color: GOLD, marginBottom: 16,
      display: 'flex', alignItems: 'center', gap: 10,
    }}>
      <span style={{ width: 28, height: 1, background: GOLD, opacity: 0.5, display: 'inline-block' }} />
      {children}
    </div>
  );
}

// ── How it works ───────────────────────────────────────────────────────────
function HowItWorks() {
  const steps = [
    {
      num: '01',
      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>,
      title: 'Upload your videos',
      body: 'Bring YouTube links or direct uploads. Nest organises them into modules automatically — no manual sorting needed.',
    },
    {
      num: '02',
      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a10 10 0 110 20A10 10 0 0112 2zM8 12l3 3 5-5"/></svg>,
      title: 'Employees learn at their own pace',
      body: 'Each hire follows a personalised journey. Quizzes, Q&A on the timeline, and an AI tutor keep them engaged far beyond week one.',
    },
    {
      num: '03',
      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>,
      title: 'Track, certify, and grow',
      body: 'Real-time progress for every employee. Answer questions in context. Issue certificates. Spot blockers before they become problems.',
    },
  ];

  return (
    <section id="how" style={{ padding: 'clamp(64px,8vw,120px) 0', borderTop: `1px solid ${RULE}` }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 clamp(16px,4vw,48px)' }}>
        <div className="lp-reveal lp-two-col" style={{
          marginBottom: 'clamp(40px,6vw,80px)',
          opacity: 0, transform: 'translateY(24px)', transition: 'opacity 0.7s ease, transform 0.7s ease',
        }}>
          <div>
            <SLabel>How it works</SLabel>
            <h2 style={{ fontFamily: DISP, fontSize: 'clamp(36px,5vw,64px)', fontWeight: 300, lineHeight: 1.05, letterSpacing: '-0.02em', color: INK }}>
              From upload to<br /><em style={{ fontStyle: 'italic', color: GOLD }}>fledged</em> — in minutes.
            </h2>
          </div>
          <p style={{ fontSize: 16, color: INK2, lineHeight: 1.75, fontFamily: UI, paddingBottom: 4 }}>
            No complex setup. No new habits to force on your team. Paste your videos, build your modules, send the link. Your people learn; you see everything.
          </p>
        </div>

        <div className="lp-reveal lp-three-col" style={{
          gap: 1, background: RULE,
          border: `1px solid ${RULE}`, borderRadius: 8, overflow: 'hidden',
          opacity: 0, transform: 'translateY(24px)', transition: 'opacity 0.7s ease 0.1s, transform 0.7s ease 0.1s',
        }}>
          {steps.map(s => (
            <StepCard key={s.num} {...s} />
          ))}
        </div>
      </div>
    </section>
  );
}

function StepCard({ num, icon, title, body }: { num: string; icon: React.ReactNode; title: string; body: string }) {
  const ref = useRef<HTMLDivElement>(null);
  return (
    <div ref={ref} style={{ background: CARD, padding: '40px 36px', position: 'relative', transition: 'background 0.25s', cursor: 'default' }}
      onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = '#1c1a14')}
      onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = CARD)}
    >
      <div style={{ fontFamily: DISP, fontSize: 72, fontWeight: 300, color: 'rgba(200,169,110,0.12)', lineHeight: 1, position: 'absolute', top: 24, right: 28, letterSpacing: '-0.04em' }}>{num}</div>
      <div style={{ width: 44, height: 44, border: `1px solid rgba(200,169,110,0.2)`, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 28, color: GOLD }}>{icon}</div>
      <div style={{ fontSize: 17, fontWeight: 700, color: INK, marginBottom: 12, lineHeight: 1.3, fontFamily: UI }}>{title}</div>
      <div style={{ fontSize: 14, color: INK2, lineHeight: 1.7, fontFamily: UI }}>{body}</div>
    </div>
  );
}

// ── Features ───────────────────────────────────────────────────────────────
const FEATURES = [
  {
    icon: <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>,
    title: 'Interactive video modules',
    body: 'Embed YouTube or upload your own. Add timestamped questions so learners engage at key moments — not just watch passively.',
  },
  {
    icon: <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>,
    title: 'Live Q&A on any video',
    body: 'Employees ask questions directly on the video timeline. Managers get notified and answer in context — no Slack threads needed.',
  },
  {
    icon: <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>,
    title: 'Built-in quiz engine',
    body: 'Auto-popup quizzes at end of every video. Multiple choice, true/false, short-answer. Pass threshold keeps it accountable.',
  },
  {
    icon: <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
    title: 'Real-time analytics',
    body: 'Who finished what, quiz scores, unanswered questions — all in a single dashboard. Spot blockers before they become problems.',
  },
  {
    icon: <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>,
    title: 'Invite your whole team',
    body: 'Generate invite links for employees and managers. Everyone joins your organisation\'s isolated workspace with one click.',
  },
  {
    icon: <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>,
    title: 'Secure multi-tenant isolation',
    body: 'Your modules, employees, and Q&A are never visible to other organisations. Every company\'s data is fully isolated.',
  },
];

function Features() {
  return (
    <section id="features" style={{ padding: 'clamp(64px,8vw,120px) 0', borderTop: `1px solid ${RULE}` }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 clamp(16px,4vw,48px)' }}>
        <div className="lp-reveal" style={{ marginBottom: 'clamp(40px,5vw,70px)', opacity: 0, transform: 'translateY(24px)', transition: 'opacity 0.7s ease, transform 0.7s ease' }}>
          <SLabel>Features</SLabel>
          <h2 style={{ fontFamily: DISP, fontSize: 'clamp(42px,5vw,64px)', fontWeight: 300, lineHeight: 1.05, letterSpacing: '-0.02em', color: INK, marginBottom: 16 }}>
            Everything your team<br /><strong style={{ fontWeight: 600 }}>needs to grow.</strong>
          </h2>
          <p style={{ fontSize: 16, color: INK2, maxWidth: 500, lineHeight: 1.7, fontFamily: UI }}>
            Built for HR teams and managers who want learning that actually sticks — not another tool that gets ignored after day three.
          </p>
        </div>

        <div className="lp-reveal lp-three-col" style={{
          gap: 1, background: RULE,
          border: `1px solid ${RULE}`, borderRadius: 8, overflow: 'hidden',
          opacity: 0, transform: 'translateY(24px)', transition: 'opacity 0.7s ease 0.1s, transform 0.7s ease 0.1s',
        }}>
          {FEATURES.map(f => <FeatCard key={f.title} {...f} />)}
        </div>
      </div>
    </section>
  );
}

function FeatCard({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div style={{ background: CARD, padding: '36px 32px 40px', transition: 'background 0.2s', position: 'relative', overflow: 'hidden', cursor: 'default' }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLElement;
        el.style.background = '#1c1a14';
        const bar = el.querySelector<HTMLElement>('.feat-bar');
        if (bar) bar.style.transform = 'scaleX(1)';
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLElement;
        el.style.background = CARD;
        const bar = el.querySelector<HTMLElement>('.feat-bar');
        if (bar) bar.style.transform = 'scaleX(0)';
      }}
    >
      <div className="feat-bar" style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${GOLD}, transparent)`, transform: 'scaleX(0)', transformOrigin: 'left', transition: 'transform 0.3s ease' }} />
      <div style={{ width: 40, height: 40, marginBottom: 24, color: GOLD, opacity: 0.8 }}>{icon}</div>
      <div style={{ fontSize: 15.5, fontWeight: 700, color: INK, marginBottom: 10, letterSpacing: '0.01em', fontFamily: UI }}>{title}</div>
      <div style={{ fontSize: 13.5, color: INK2, lineHeight: 1.7, fontFamily: UI }}>{body}</div>
    </div>
  );
}

// ── Pricing ────────────────────────────────────────────────────────────────
const PLANS = [
  {
    tier: 'Starter', name: 'For small teams',
    desc: 'Getting started with structured learning.',
    price: <><sup style={{ fontSize: 28, verticalAlign: 'top', marginTop: 12, opacity: 0.7 }}>$</sup>29<span style={{ fontSize: 16, color: INK3, fontWeight: 400, fontFamily: UI }}>/mo</span></>,
    period: 'billed monthly',
    cta: 'Start free trial', ctaTo: '/signup', featured: false,
    features: ['Up to 15 employees','5 learning modules','Unlimited videos per module','Quiz engine','Q&A on videos','Basic analytics','Email support'],
  },
  {
    tier: 'Professional', name: 'For growing companies',
    desc: 'Unlimited scale and advanced insights.',
    price: <><sup style={{ fontSize: 28, verticalAlign: 'top', marginTop: 12, opacity: 0.7 }}>$</sup>99<span style={{ fontSize: 16, color: INK3, fontWeight: 400, fontFamily: UI }}>/mo</span></>,
    period: 'billed monthly',
    cta: 'Start free trial', ctaTo: '/signup', featured: true,
    features: ['Unlimited employees','Unlimited modules','Advanced analytics dashboard','Custom branding & logo','Invite links + role management','Real-time manager notifications','Priority support','CSV export'],
  },
  {
    tier: 'Enterprise', name: 'For large organisations',
    desc: 'Compliance, integrations, dedicated support.',
    price: <span style={{ fontSize: 44, color: INK }}>Custom</span>,
    period: 'tailored to your team',
    cta: 'Contact sales', ctaTo: '/login', featured: false,
    features: ['Everything in Professional','SSO / SAML 2.0','HRIS integrations','Custom domain','Dedicated success manager','SLA guarantee','Audit logs','Volume pricing'],
  },
];

function Pricing() {
  return (
    <section id="pricing" style={{ padding: 'clamp(64px,8vw,120px) 0', borderTop: `1px solid ${RULE}` }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 clamp(16px,4vw,48px)' }}>
        <div className="lp-reveal" style={{ textAlign: 'center', marginBottom: 'clamp(40px,5vw,70px)', opacity: 0, transform: 'translateY(24px)', transition: 'opacity 0.7s ease, transform 0.7s ease' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}><SLabel>Pricing</SLabel></div>
          <h2 style={{ fontFamily: DISP, fontSize: 'clamp(42px,5vw,64px)', fontWeight: 300, lineHeight: 1.05, letterSpacing: '-0.02em', color: INK, marginBottom: 16 }}>
            <em style={{ fontStyle: 'italic', color: GOLD }}>Simple,</em> predictable pricing.
          </h2>
          <p style={{ fontSize: 16, color: INK2, fontFamily: UI }}>Start free for 14 days. No credit card needed. Upgrade when you're ready.</p>
        </div>

        <div className="lp-reveal lp-three-col" style={{
          gap: 1, background: RULE,
          border: `1px solid ${RULE}`, borderRadius: 8, overflow: 'hidden',
          opacity: 0, transform: 'translateY(24px)', transition: 'opacity 0.7s ease 0.1s, transform 0.7s ease 0.1s',
        }}>
          {PLANS.map(p => (
            <div key={p.tier} style={{
              background: p.featured ? '#1e1b12' : CARD,
              padding: '44px 36px',
              position: 'relative', display: 'flex', flexDirection: 'column',
              border: p.featured ? `1px solid rgba(200,169,110,0.18)` : 'none',
              margin: p.featured ? -1 : 0, zIndex: p.featured ? 1 : 0,
            }}>
              {p.featured && (
                <div style={{
                  position: 'absolute', top: -1, left: '50%', transform: 'translateX(-50%)',
                  fontFamily: MONO, fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase',
                  color: BG, background: GOLD,
                  padding: '5px 12px', borderRadius: 100, whiteSpace: 'nowrap',
                }}>Most popular</div>
              )}
              <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: p.featured ? GOLD : INK3, marginBottom: 10, marginTop: p.featured ? 20 : 0 }}>{p.tier}</div>
              <div style={{ fontFamily: DISP, fontSize: 28, fontWeight: 400, color: INK, marginBottom: 8, letterSpacing: '-0.01em' }}>{p.name}</div>
              <div style={{ fontSize: 13, color: INK2, marginBottom: 36, lineHeight: 1.5, fontFamily: UI }}>{p.desc}</div>
              <div style={{ fontFamily: DISP, fontSize: 60, fontWeight: 300, color: GOLD2, lineHeight: 1, letterSpacing: '-0.03em', marginBottom: 6 }}>{p.price}</div>
              <div style={{ fontFamily: MONO, fontSize: 12, color: INK3, marginBottom: 32, letterSpacing: '0.06em' }}>{p.period}</div>
              <Link to={p.ctaTo} style={{
                fontFamily: UI, fontSize: 12.5, fontWeight: 700,
                letterSpacing: '0.06em', textTransform: 'uppercase',
                padding: 12, borderRadius: 4, border: 'none',
                textDecoration: 'none', textAlign: 'center', display: 'block', marginBottom: 32,
                background: p.featured ? GOLD : 'transparent',
                color: p.featured ? BG : INK2,
                outline: p.featured ? 'none' : `1px solid ${RULE}`,
                transition: 'opacity 0.2s, transform 0.15s',
              }}
                onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.opacity = '0.82'; el.style.transform = 'translateY(-1px)'; }}
                onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.opacity = '1'; el.style.transform = 'translateY(0)'; }}
              >{p.cta}</Link>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
                {p.features.map(f => (
                  <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 13.5, color: INK2, lineHeight: 1.4, fontFamily: UI }}>
                    <span style={{ color: GOLD, opacity: 0.6, fontSize: 8, marginTop: 4, flexShrink: 0 }}>✦</span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p style={{ textAlign: 'center', marginTop: 28, fontFamily: MONO, fontSize: 11, color: INK3, letterSpacing: '0.06em' }}>
          All plans include a 14-day free trial. Cancel anytime.
        </p>
      </div>
    </section>
  );
}

// ── CTA band ───────────────────────────────────────────────────────────────
function CtaBand() {
  return (
    <section style={{ padding: 'clamp(64px,10vw,140px) 0', borderTop: `1px solid ${RULE}`, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at 50% 60%, rgba(200,169,110,0.05) 0%, transparent 65%)` }} />
      <div className="lp-reveal" style={{
        maxWidth: 700, margin: '0 auto', textAlign: 'center',
        position: 'relative', zIndex: 1, padding: '0 clamp(16px,4vw,48px)',
        opacity: 0, transform: 'translateY(24px)', transition: 'opacity 0.7s ease, transform 0.7s ease',
      }}>
        <h2 style={{ fontFamily: DISP, fontSize: 'clamp(48px,6vw,80px)', fontWeight: 300, lineHeight: 1.05, letterSpacing: '-0.025em', color: INK, marginBottom: 24 }}>
          Ready to help your team<br /><em style={{ fontStyle: 'italic', color: GOLD }}>take flight?</em>
        </h2>
        <p style={{ fontSize: 17, color: INK2, lineHeight: 1.7, marginBottom: 48, fontFamily: UI }}>
          Join the companies that use Nest to give every new hire a great first week — and every manager full visibility.
        </p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
          <Link to="/signup" style={{
            fontFamily: UI, fontSize: 13, fontWeight: 700,
            letterSpacing: '0.06em', textTransform: 'uppercase',
            color: BG, background: GOLD,
            padding: '14px 32px', borderRadius: 4,
            textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 10,
            transition: 'background 0.2s, transform 0.15s',
          }}
            onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = GOLD2; el.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = GOLD; el.style.transform = 'translateY(0)'; }}
          >
            Create your free workspace
            <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 10h10M12 7l3 3-3 3"/></svg>
          </Link>
        </div>
        <p style={{ fontSize: 13, color: INK3, marginTop: 20, fontFamily: MONO, letterSpacing: '0.06em' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: GOLD, textDecoration: 'none' }}
            onMouseEnter={e => ((e.currentTarget as HTMLElement).style.textDecoration = 'underline')}
            onMouseLeave={e => ((e.currentTarget as HTMLElement).style.textDecoration = 'none')}
          >Sign in</Link>
        </p>
      </div>
    </section>
  );
}

// ── Footer ─────────────────────────────────────────────────────────────────
function LandingFooter() {
  return (
    <footer style={{ borderTop: `1px solid ${RULE}`, padding: 'clamp(24px,4vw,48px)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, fontFamily: UI }}>
      <span style={{ fontFamily: DISP, fontSize: 20, fontWeight: 400, color: GOLD2 }}>Nest Fledge</span>
      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
        {[['#features','Features'],['#pricing','Pricing']].map(([h,l]) => (
          <a key={h} href={h} style={{ fontSize: 12.5, color: INK3, textDecoration: 'none', letterSpacing: '0.03em', transition: 'color 0.2s' }}
            onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = INK2)}
            onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = INK3)}
          >{l}</a>
        ))}
        <Link to="/login" style={{ fontSize: 12.5, color: INK3, textDecoration: 'none', letterSpacing: '0.03em', transition: 'color 0.2s' }}
          onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = INK2)}
          onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = INK3)}
        >Sign in</Link>
        <Link to="/signup" style={{ fontSize: 12.5, color: GOLD, textDecoration: 'none', letterSpacing: '0.03em' }}>Get started free</Link>
      </div>
      <p style={{ fontFamily: MONO, fontSize: 10.5, color: INK3, letterSpacing: '0.06em', width: '100%', textAlign: 'center', paddingTop: 24, borderTop: `1px solid ${RULE}`, marginTop: 8 }}>
        © {new Date().getFullYear()} Nest Fledge. All rights reserved. · Where careers take flight.
      </p>
    </footer>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────
export default function LandingPage() {
  useReveal();
  return (
    <div style={{ background: BG, color: INK, fontFamily: UI, fontSize: 15, lineHeight: 1.6, overflowX: 'hidden' }}>
      {/* Noise overlay */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 1000, pointerEvents: 'none',
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        opacity: 0.032,
      }} />
      <LandingNav />
      <Hero />
      <HowItWorks />
      <Features />
      <Pricing />
      <CtaBand />
      <LandingFooter />
      <style>{`
        @keyframes lpRise { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes lpBlink { 0%,100%{opacity:1} 50%{opacity:0.2} }
        ::-webkit-scrollbar{width:5px}
        ::-webkit-scrollbar-track{background:${BG}}
        ::-webkit-scrollbar-thumb{background:${INK3};border-radius:3px}

        /* ── Responsive grids ── */
        .lp-three-col { display: grid; grid-template-columns: repeat(3,1fr); }
        .lp-two-col   { display: grid; grid-template-columns: 1fr 1fr; gap: 60px; align-items: end; }

        @media (max-width: 768px) {
          .lp-three-col { grid-template-columns: 1fr; }
          .lp-two-col   { grid-template-columns: 1fr; gap: 28px; }
        }
        @media (min-width: 769px) and (max-width: 1024px) {
          .lp-three-col { grid-template-columns: repeat(2,1fr); }
        }

        /* ── Nav: hide center links on mobile, show mobile sign-in ── */
        @media (max-width: 680px) {
          .lp-nav-links    { display: none !important; }
          .lp-signin-mobile { display: inline-block !important; }
        }
      `}</style>
    </div>
  );
}
