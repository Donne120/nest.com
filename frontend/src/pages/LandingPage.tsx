import { Link } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';

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

// ── Scroll reveal ──────────────────────────────────────────────────────────
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

// ── Animated counter ───────────────────────────────────────────────────────
function useCounter(target: number, duration = 1800) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      io.disconnect();
      let start = 0;
      const step = target / (duration / 16);
      const timer = setInterval(() => {
        start = Math.min(start + step, target);
        setCount(Math.floor(start));
        if (start >= target) clearInterval(timer);
      }, 16);
    }, { threshold: 0.5 });
    io.observe(el);
    return () => io.disconnect();
  }, [target, duration]);
  return { count, ref };
}

// ── Nav ────────────────────────────────────────────────────────────────────
function LandingNav() {
  return (
    <header style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 500,
      height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 clamp(16px, 4vw, 48px)',
      borderBottom: `1px solid ${RULE}`,
      background: 'rgba(10,9,7,0.92)',
      backdropFilter: 'blur(20px)',
      fontFamily: UI, gap: 12,
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

      <nav className="lp-nav-links" style={{ display: 'flex', gap: 0 }}>
        {[['#features','Features'],['#how','How it works'],['#for-who','For you']].map(([href, label]) => (
          <a key={href} href={href} style={{ fontSize: 13, fontWeight: 500, color: INK2, textDecoration: 'none', padding: '8px 14px', letterSpacing: '0.02em', transition: 'color 0.2s', fontFamily: UI, whiteSpace: 'nowrap' }}
            onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = INK)}
            onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = INK2)}
          >{label}</a>
        ))}
        <Link to="/pricing" style={{ fontSize: 13, fontWeight: 500, color: INK2, textDecoration: 'none', padding: '8px 14px', letterSpacing: '0.02em', transition: 'color 0.2s', fontFamily: UI, whiteSpace: 'nowrap' }}
          onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = INK)}
          onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = INK2)}
        >Pricing</Link>
        <Link to="/login" style={{ fontSize: 13, fontWeight: 500, color: INK2, textDecoration: 'none', padding: '8px 14px', letterSpacing: '0.02em', transition: 'color 0.2s', fontFamily: UI }}
          onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = INK)}
          onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = INK2)}
        >Sign in</Link>
      </nav>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <Link to="/login" className="lp-signin-mobile" style={{ fontSize: 13, fontWeight: 500, color: INK2, textDecoration: 'none', padding: '7px 12px', display: 'none' }}>Sign in</Link>
        <Link to="/signup" style={{
          fontFamily: UI, fontSize: 12.5, fontWeight: 700,
          letterSpacing: '0.04em', textTransform: 'uppercase',
          color: BG, background: GOLD,
          padding: '9px 16px', borderRadius: 4,
          textDecoration: 'none', display: 'inline-block', whiteSpace: 'nowrap',
          transition: 'background 0.2s, transform 0.15s',
        }}
          onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = GOLD2; el.style.transform = 'translateY(-1px)'; }}
          onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = GOLD; el.style.transform = 'translateY(0)'; }}
        >Start for free</Link>
      </div>
    </header>
  );
}

// ── Hero course card mockup ─────────────────────────────────────────────────
function HeroCard() {
  return (
    <div style={{
      background: CARD,
      border: `1px solid rgba(200,169,110,0.15)`,
      borderRadius: 16,
      overflow: 'hidden',
      width: '100%',
      maxWidth: 340,
      boxShadow: '0 40px 80px rgba(0,0,0,0.5)',
      animation: 'lpFloat 6s ease-in-out infinite',
      flexShrink: 0,
    }}>
      {/* Thumbnail */}
      <div style={{
        height: 160,
        background: `linear-gradient(135deg, #1a1710 0%, #2a2418 100%)`,
        position: 'relative',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: `radial-gradient(ellipse at 30% 50%, rgba(200,169,110,0.12) 0%, transparent 65%)`,
        }} />
        {/* Play button */}
        <div style={{
          width: 48, height: 48,
          border: `1.5px solid rgba(200,169,110,0.5)`,
          borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1,
        }}>
          <svg width="16" height="16" viewBox="0 0 20 20" fill={GOLD}><path d="M6 4l12 6-12 6V4z"/></svg>
        </div>
        {/* Duration badge */}
        <div style={{
          position: 'absolute', bottom: 10, right: 10,
          fontFamily: MONO, fontSize: 10, color: INK2,
          background: 'rgba(10,9,7,0.8)', padding: '3px 8px', borderRadius: 4,
          letterSpacing: '0.06em',
        }}>12:34</div>
        {/* AI badge */}
        <div style={{
          position: 'absolute', top: 10, left: 10,
          fontFamily: MONO, fontSize: 9, color: GOLD,
          background: 'rgba(200,169,110,0.12)', border: `1px solid rgba(200,169,110,0.25)`,
          padding: '3px 8px', borderRadius: 4, letterSpacing: '0.1em', textTransform: 'uppercase',
        }}>AI Transcribed</div>
      </div>

      <div style={{ padding: '20px 20px 16px' }}>
        <div style={{ fontFamily: MONO, fontSize: 9, color: GOLD, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 8 }}>Module 3 · Lesson 2</div>
        <div style={{ fontFamily: UI, fontSize: 14, fontWeight: 700, color: INK, marginBottom: 12, lineHeight: 1.3 }}>Creating Courses &amp; Videos</div>

        {/* Progress bar */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontFamily: MONO, fontSize: 9, color: INK3, letterSpacing: '0.1em' }}>PROGRESS</span>
            <span style={{ fontFamily: MONO, fontSize: 9, color: GOLD }}>68%</span>
          </div>
          <div style={{ height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ width: '68%', height: '100%', background: `linear-gradient(90deg, ${GOLD}, ${GOLD2})`, borderRadius: 2 }} />
          </div>
        </div>

        {/* Mini stats */}
        <div style={{ display: 'flex', gap: 16, borderTop: `1px solid ${RULE}`, paddingTop: 14 }}>
          {[['8', 'Lessons'],['3', 'Quizzes'],['AI', 'Q&A']].map(([v, l]) => (
            <div key={l} style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: DISP, fontSize: 18, fontWeight: 400, color: GOLD2, lineHeight: 1 }}>{v}</div>
              <div style={{ fontFamily: MONO, fontSize: 8, color: INK3, letterSpacing: '0.1em', marginTop: 3 }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom notification */}
      <div style={{
        borderTop: `1px solid ${RULE}`,
        padding: '12px 20px',
        display: 'flex', alignItems: 'center', gap: 10,
        background: SURFACE,
      }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: SAGE, flexShrink: 0 }} />
        <span style={{ fontFamily: UI, fontSize: 11.5, color: INK2, lineHeight: 1.3 }}>
          Certificate ready after module completion
        </span>
      </div>
    </div>
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
        position: 'absolute', width: 1000, height: 700,
        top: '50%', left: '50%', transform: 'translate(-50%,-55%)',
        background: `radial-gradient(ellipse, rgba(200,169,110,0.07) 0%, transparent 70%)`,
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: `linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px)`,
        backgroundSize: '100% 80px',
      }} />
      <div style={{
        position: 'absolute', top: 0, bottom: 0, left: '50%', width: 1,
        background: `linear-gradient(to bottom, transparent, rgba(200,169,110,0.08) 30%, rgba(200,169,110,0.08) 70%, transparent)`,
        pointerEvents: 'none',
      }} />

      <div style={{
        position: 'relative', zIndex: 1, width: '100%', maxWidth: 1200,
        display: 'flex', alignItems: 'center', gap: 'clamp(40px,6vw,80px)',
        flexWrap: 'wrap', justifyContent: 'center',
      }}>
        {/* Left — text */}
        <div style={{ flex: '1 1 480px', maxWidth: 620 }}>
          {/* Eyebrow */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 10,
            fontFamily: MONO, fontSize: 10.5, letterSpacing: '0.2em', textTransform: 'uppercase',
            color: GOLD, border: `1px solid rgba(200,169,110,0.2)`,
            padding: '7px 16px', borderRadius: 100, marginBottom: 40,
            animation: 'lpRise 0.8s ease forwards',
          }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: GOLD, animation: 'lpBlink 2s infinite', display: 'inline-block' }} />
            The future of learning is here
          </div>

          {/* Headline */}
          <h1 style={{
            fontFamily: DISP,
            fontSize: 'clamp(52px, 7vw, 96px)',
            fontWeight: 300, lineHeight: 0.95,
            letterSpacing: '-0.02em', color: INK,
            marginBottom: 32,
            animation: 'lpRise 0.9s ease 0.1s both',
          }}>
            <em style={{ fontStyle: 'italic', color: GOLD, fontWeight: 300 }}>Knowledge</em>
            <br />
            <span style={{ fontWeight: 600 }}>that moves</span>
            <br />
            <span style={{ color: INK2, fontWeight: 300, fontSize: 'clamp(36px,5vw,68px)' }}>the world forward.</span>
          </h1>

          {/* Subtitle */}
          <p style={{
            maxWidth: 480, marginBottom: 48,
            fontSize: 17, fontWeight: 400, color: INK2, lineHeight: 1.75,
            fontFamily: UI, animation: 'lpRise 0.9s ease 0.2s both',
          }}>
            Nest is the education platform built for the next generation of creators and learners.
            Create courses, sell them globally, and transform lives — with AI at every step.
          </p>

          {/* CTAs */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 16,
            marginBottom: 56, flexWrap: 'wrap',
            animation: 'lpRise 0.9s ease 0.3s both',
          }}>
            <Link to="/signup" style={{
              fontFamily: UI, fontSize: 13, fontWeight: 700,
              letterSpacing: '0.06em', textTransform: 'uppercase',
              color: BG, background: GOLD,
              padding: '15px 36px', borderRadius: 4,
              textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 10,
              transition: 'background 0.2s, transform 0.15s, box-shadow 0.2s',
            }}
              onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = GOLD2; el.style.transform = 'translateY(-2px)'; el.style.boxShadow = '0 16px 40px rgba(200,169,110,0.25)'; }}
              onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = GOLD; el.style.transform = 'translateY(0)'; el.style.boxShadow = 'none'; }}
            >
              Start for free
              <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 10h10M12 7l3 3-3 3"/></svg>
            </Link>
            <a href="#how" style={{
              fontFamily: UI, fontSize: 13, fontWeight: 500, letterSpacing: '0.04em',
              color: INK2, background: 'none', border: `1px solid ${RULE}`,
              padding: '14px 28px', borderRadius: 4,
              textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8,
              transition: 'color 0.2s, border-color 0.2s',
            }}
              onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.color = INK; el.style.borderColor = 'rgba(255,255,255,0.18)'; }}
              onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.color = INK2; el.style.borderColor = RULE; }}
            >
              <svg width="13" height="13" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="10" cy="10" r="8"/><path d="M7.5 8.5l5 1.5-5 1.5"/></svg>
              Watch how it works
            </a>
          </div>

          {/* Trust line */}
          <div style={{ animation: 'lpRise 0.9s ease 0.4s both' }}>
            <p style={{ fontFamily: MONO, fontSize: 10, color: INK3, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 12 }}>
              Trusted by educators &amp; institutions
            </p>
            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'center' }}>
              {['Universities','Bootcamps','Coaching Schools','Professional Trainers','NGOs'].map(l => (
                <span key={l} style={{ fontFamily: UI, fontSize: 11.5, color: INK3, borderLeft: `1px solid ${RULE}`, paddingLeft: 12 }}>{l}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Right — course card mockup */}
        <div className="lp-hero-card" style={{ flex: '0 0 auto', display: 'flex', justifyContent: 'center' }}>
          <HeroCard />
        </div>
      </div>

      {/* Stats strip */}
      <div style={{
        position: 'relative', zIndex: 1, width: '100%', maxWidth: 900,
        marginTop: 'clamp(48px,8vw,80px)',
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(120px,1fr))',
        borderTop: `1px solid ${RULE}`, borderBottom: `1px solid ${RULE}`,
        animation: 'lpRise 0.9s ease 0.5s both',
      }}>
        {[
          { val: 13, suffix: '+', label: 'Courses live' },
          { val: 100, suffix: '%', label: 'AI-transcribed' },
          { val: 14, suffix: 'd', label: 'Free trial' },
          { val: 24, suffix: 'h', label: 'Support response' },
        ].map((s, i) => {
          const { count, ref } = useCounter(s.val);
          return (
            <div key={s.label} style={{
              textAlign: 'center', padding: '20px 16px',
              borderRight: i < 3 ? `1px solid ${RULE}` : 'none',
            }}>
              <div style={{ fontFamily: DISP, fontSize: 34, fontWeight: 300, color: GOLD2, lineHeight: 1, letterSpacing: '-0.02em', marginBottom: 4 }}>
                <span ref={ref}>{count}</span>
                <em style={{ fontFamily: DISP, fontStyle: 'italic', color: GOLD, fontSize: 22 }}>{s.suffix}</em>
              </div>
              <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: INK3 }}>{s.label}</div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ── Marquee ticker ─────────────────────────────────────────────────────────
const TICKER_ITEMS = [
  'AI-Powered Q&A', 'Video Transcription', 'Live Quizzes', 'Progress Tracking',
  'Certificates', 'Mobile Payments', 'Multi-tenant', 'Analytics Dashboard',
  'Assignments', '1-on-1 Meetings', 'Course Marketplace', 'AI Tutor',
];

function Ticker() {
  const items = [...TICKER_ITEMS, ...TICKER_ITEMS];
  return (
    <div style={{
      borderTop: `1px solid ${RULE}`, borderBottom: `1px solid ${RULE}`,
      overflow: 'hidden', padding: '14px 0',
      background: SURFACE, position: 'relative',
    }}>
      <div style={{ display: 'flex', animation: 'lpTicker 28s linear infinite', gap: 0 }}>
        {items.map((item, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 20,
            padding: '0 28px', whiteSpace: 'nowrap', flexShrink: 0,
          }}>
            <span style={{ width: 4, height: 4, borderRadius: '50%', background: GOLD, opacity: 0.5, flexShrink: 0 }} />
            <span style={{ fontFamily: MONO, fontSize: 11, color: INK2, letterSpacing: '0.12em', textTransform: 'uppercase' }}>{item}</span>
          </div>
        ))}
      </div>
    </div>
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
      title: 'Create your course',
      body: 'Upload videos, add descriptions, set quizzes and assignments. Nest AI transcribes everything and builds a searchable knowledge base automatically.',
    },
    {
      num: '02',
      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a10 10 0 110 20A10 10 0 0112 2zM8 12l3 3 5-5"/></svg>,
      title: 'Learners join and grow',
      body: 'Students follow structured learning paths at their own pace. AI answers questions in the video timeline. Engagement goes through the roof.',
    },
    {
      num: '03',
      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>,
      title: 'Track, certify, and earn',
      body: 'Real-time analytics for every learner. Issue completion certificates. Get paid via mobile money or bank transfer — wherever your students are.',
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
              From idea to<br /><em style={{ fontStyle: 'italic', color: GOLD }}>impact</em> — in minutes.
            </h2>
          </div>
          <p style={{ fontSize: 16, color: INK2, lineHeight: 1.75, fontFamily: UI, paddingBottom: 4 }}>
            No complex setup. No technical skills required. Build your course today,
            share the link, and your learners are growing — while you track every step.
          </p>
        </div>

        <div className="lp-reveal lp-three-col" style={{
          gap: 1, background: RULE,
          border: `1px solid ${RULE}`, borderRadius: 8, overflow: 'hidden',
          opacity: 0, transform: 'translateY(24px)', transition: 'opacity 0.7s ease 0.1s, transform 0.7s ease 0.1s',
        }}>
          {steps.map(s => <StepCard key={s.num} {...s} />)}
        </div>
      </div>
    </section>
  );
}

function StepCard({ num, icon, title, body }: { num: string; icon: React.ReactNode; title: string; body: string }) {
  return (
    <div style={{ background: CARD, padding: '40px 36px', position: 'relative', transition: 'background 0.25s', cursor: 'default' }}
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
    title: 'Interactive video courses',
    body: 'Upload your own videos or embed from anywhere. Add timestamped questions so learners stay engaged — not just watching, but thinking.',
  },
  {
    icon: <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a10 10 0 110 20A10 10 0 0112 2z"/><path d="M9.5 9a2.5 2.5 0 015 0c0 2.5-2.5 3-2.5 5M12 18h.01"/></svg>,
    title: 'AI Q&A on every video',
    body: 'Learners ask questions at any timestamp. Our AI answers instantly using the actual video transcript — no waiting, no unanswered doubts.',
  },
  {
    icon: <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>,
    title: 'Quizzes &amp; assessments',
    body: 'Auto-generated quizzes after every lesson. Multiple choice, true/false, short-answer. Set pass thresholds and track mastery over time.',
  },
  {
    icon: <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
    title: 'Deep analytics',
    body: 'See exactly where learners struggle, which videos get rewatched, quiz score trends. Data that makes you a better educator.',
  },
  {
    icon: <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>,
    title: 'Sell with mobile payments',
    body: 'Accept payments via MoMo, bank transfer, or other local methods. No credit card dependency. Learners pay how they live.',
  },
  {
    icon: <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/><path d="M16 3.5A4 4 0 0120 7"/></svg>,
    title: 'Certificates of completion',
    body: 'Issue professional certificates automatically when learners finish. Shareable, verifiable, and something they will actually be proud of.',
  },
];

function Features() {
  return (
    <section id="features" style={{ padding: 'clamp(64px,8vw,120px) 0', borderTop: `1px solid ${RULE}` }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 clamp(16px,4vw,48px)' }}>
        <div className="lp-reveal" style={{ marginBottom: 'clamp(40px,5vw,70px)', opacity: 0, transform: 'translateY(24px)', transition: 'opacity 0.7s ease, transform 0.7s ease' }}>
          <SLabel>Platform features</SLabel>
          <h2 style={{ fontFamily: DISP, fontSize: 'clamp(42px,5vw,64px)', fontWeight: 300, lineHeight: 1.05, letterSpacing: '-0.02em', color: INK, marginBottom: 16 }}>
            Everything you need<br /><strong style={{ fontWeight: 600 }}>to teach at scale.</strong>
          </h2>
          <p style={{ fontSize: 16, color: INK2, maxWidth: 520, lineHeight: 1.7, fontFamily: UI }}>
            Built for educators who want real learning outcomes — not just another video hosting tool that nobody finishes.
          </p>
        </div>

        <div className="lp-reveal lp-three-col" style={{
          gap: 1, background: RULE, border: `1px solid ${RULE}`, borderRadius: 8, overflow: 'hidden',
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
      <div style={{ fontSize: 15.5, fontWeight: 700, color: INK, marginBottom: 10, letterSpacing: '0.01em', fontFamily: UI }} dangerouslySetInnerHTML={{ __html: title }} />
      <div style={{ fontSize: 13.5, color: INK2, lineHeight: 1.7, fontFamily: UI }}>{body}</div>
    </div>
  );
}

// ── For who ────────────────────────────────────────────────────────────────
function ForWho() {
  return (
    <section id="for-who" style={{ padding: 'clamp(64px,8vw,120px) 0', borderTop: `1px solid ${RULE}` }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 clamp(16px,4vw,48px)' }}>
        <div className="lp-reveal" style={{ textAlign: 'center', marginBottom: 'clamp(40px,5vw,64px)', opacity: 0, transform: 'translateY(24px)', transition: 'opacity 0.7s ease, transform 0.7s ease' }}>
          <SLabel>Built for everyone</SLabel>
          <h2 style={{ fontFamily: DISP, fontSize: 'clamp(36px,5vw,60px)', fontWeight: 300, lineHeight: 1.1, letterSpacing: '-0.02em', color: INK }}>
            Whether you teach or<br /><em style={{ fontStyle: 'italic', color: GOLD }}>hunger to learn.</em>
          </h2>
        </div>

        <div className="lp-reveal lp-two-col" style={{
          gap: 1, background: RULE, border: `1px solid ${RULE}`, borderRadius: 8, overflow: 'hidden',
          opacity: 0, transform: 'translateY(24px)', transition: 'opacity 0.7s ease 0.1s, transform 0.7s ease 0.1s',
        }}>
          {/* Educators */}
          <div style={{ background: CARD, padding: 'clamp(36px,5vw,56px)' }}>
            <div style={{ width: 48, height: 48, border: `1px solid rgba(200,169,110,0.25)`, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 28, color: GOLD }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>
            </div>
            <div style={{ fontFamily: MONO, fontSize: 9, color: GOLD, letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 12 }}>For Educators &amp; Creators</div>
            <h3 style={{ fontFamily: DISP, fontSize: 'clamp(28px,3.5vw,42px)', fontWeight: 300, color: INK, lineHeight: 1.1, marginBottom: 20, letterSpacing: '-0.01em' }}>
              Turn your expertise<br />into a business.
            </h3>
            <p style={{ fontSize: 15, color: INK2, lineHeight: 1.75, fontFamily: UI, marginBottom: 32 }}>
              Professors, coaches, trainers, and institutions — build courses once
              and teach thousands. Full analytics, payment collection, and AI tools included.
            </p>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 36 }}>
              {[
                'Unlimited video uploads',
                'Sell courses with local payment methods',
                'AI transcription &amp; Q&A built in',
                'Issue verified certificates',
                'Full learner analytics',
              ].map(f => (
                <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 13.5, color: INK2, lineHeight: 1.4, fontFamily: UI }}>
                  <span style={{ color: GOLD, fontSize: 8, marginTop: 4, flexShrink: 0 }}>✦</span>
                  <span dangerouslySetInnerHTML={{ __html: f }} />
                </li>
              ))}
            </ul>
            <Link to="/signup" style={{
              fontFamily: UI, fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
              color: BG, background: GOLD, padding: '12px 24px', borderRadius: 4,
              textDecoration: 'none', display: 'inline-block',
              transition: 'background 0.2s, transform 0.15s',
            }}
              onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = GOLD2; el.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = GOLD; el.style.transform = 'translateY(0)'; }}
            >Start teaching →</Link>
          </div>

          {/* Learners */}
          <div style={{ background: '#131210', padding: 'clamp(36px,5vw,56px)' }}>
            <div style={{ width: 48, height: 48, border: `1px solid rgba(90,138,106,0.3)`, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 28, color: SAGE }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></svg>
            </div>
            <div style={{ fontFamily: MONO, fontSize: 9, color: SAGE, letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 12 }}>For Learners &amp; Students</div>
            <h3 style={{ fontFamily: DISP, fontSize: 'clamp(28px,3.5vw,42px)', fontWeight: 300, color: INK, lineHeight: 1.1, marginBottom: 20, letterSpacing: '-0.01em' }}>
              Learn anything.<br />Become unstoppable.
            </h3>
            <p style={{ fontSize: 15, color: INK2, lineHeight: 1.75, fontFamily: UI, marginBottom: 32 }}>
              Access world-class courses, ask questions directly on the video,
              earn certificates, and track your own growth — all in one place.
            </p>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 36 }}>
              {[
                'Learn at your own pace, anytime',
                'AI answers your questions instantly',
                'Quizzes that actually test understanding',
                'Earn shareable certificates',
                'Pay with mobile money — no credit card',
              ].map(f => (
                <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 13.5, color: INK2, lineHeight: 1.4, fontFamily: UI }}>
                  <span style={{ color: SAGE, fontSize: 8, marginTop: 4, flexShrink: 0 }}>✦</span>
                  {f}
                </li>
              ))}
            </ul>
            <Link to="/signup" style={{
              fontFamily: UI, fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
              color: INK, background: 'transparent', padding: '11px 24px', borderRadius: 4,
              textDecoration: 'none', display: 'inline-block',
              border: `1px solid rgba(90,138,106,0.35)`,
              transition: 'border-color 0.2s, transform 0.15s',
            }}
              onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = SAGE; el.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'rgba(90,138,106,0.35)'; el.style.transform = 'translateY(0)'; }}
            >Start learning →</Link>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Testimonials ───────────────────────────────────────────────────────────
const TESTIMONIALS = [
  {
    quote: "Nest changed how I run my coding bootcamp. Learners finish 3× more content and I can actually see where they're stuck.",
    name: 'Amara K.',
    role: 'Founder, TechBridge Academy',
    initials: 'AK',
    color: GOLD,
  },
  {
    quote: "I built my first course in one afternoon and had paying students by the next morning. The mobile payment integration is a game changer.",
    name: 'Emmanuel T.',
    role: 'Independent Educator',
    initials: 'ET',
    color: SAGE,
  },
  {
    quote: "The AI Q&A feature alone is worth it. My students no longer wait 2 days for answers — they get them instantly from the lecture itself.",
    name: 'Dr. Fatima M.',
    role: 'University Lecturer',
    initials: 'FM',
    color: RUST,
  },
];

function Testimonials() {
  return (
    <section style={{ padding: 'clamp(64px,8vw,120px) 0', borderTop: `1px solid ${RULE}` }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 clamp(16px,4vw,48px)' }}>
        <div className="lp-reveal" style={{ textAlign: 'center', marginBottom: 'clamp(40px,5vw,64px)', opacity: 0, transform: 'translateY(24px)', transition: 'opacity 0.7s ease, transform 0.7s ease' }}>
          <SLabel>Educators love Nest</SLabel>
          <h2 style={{ fontFamily: DISP, fontSize: 'clamp(36px,5vw,60px)', fontWeight: 300, lineHeight: 1.1, letterSpacing: '-0.02em', color: INK }}>
            Real results from<br /><em style={{ fontStyle: 'italic', color: GOLD }}>real educators.</em>
          </h2>
        </div>

        <div className="lp-reveal lp-three-col" style={{
          gap: 1, background: RULE, border: `1px solid ${RULE}`, borderRadius: 8, overflow: 'hidden',
          opacity: 0, transform: 'translateY(24px)', transition: 'opacity 0.7s ease 0.1s, transform 0.7s ease 0.1s',
        }}>
          {TESTIMONIALS.map(t => (
            <div key={t.name} style={{ background: CARD, padding: '40px 36px', display: 'flex', flexDirection: 'column', gap: 24 }}>
              {/* Stars */}
              <div style={{ display: 'flex', gap: 4 }}>
                {[...Array(5)].map((_, i) => (
                  <svg key={i} width="13" height="13" viewBox="0 0 20 20" fill={GOLD}><path d="M10 1l2.4 7.4H20l-6.2 4.5 2.4 7.4L10 16l-6.2 4.3 2.4-7.4L0 8.4h7.6z"/></svg>
                ))}
              </div>
              {/* Quote */}
              <p style={{ fontFamily: DISP, fontSize: 'clamp(17px,2vw,21px)', fontWeight: 300, color: INK, lineHeight: 1.55, fontStyle: 'italic', flex: 1 }}>
                "{t.quote}"
              </p>
              {/* Author */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, borderTop: `1px solid ${RULE}`, paddingTop: 20 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: '50%',
                  background: `rgba(${t.color === GOLD ? '200,169,110' : t.color === SAGE ? '90,138,106' : '196,92,44'},0.15)`,
                  border: `1px solid rgba(${t.color === GOLD ? '200,169,110' : t.color === SAGE ? '90,138,106' : '196,92,44'},0.3)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: UI, fontSize: 12, fontWeight: 700, color: t.color, flexShrink: 0,
                }}>{t.initials}</div>
                <div>
                  <div style={{ fontFamily: UI, fontSize: 13, fontWeight: 700, color: INK }}>{t.name}</div>
                  <div style={{ fontFamily: MONO, fontSize: 10, color: INK3, letterSpacing: '0.06em', marginTop: 2 }}>{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Pricing ────────────────────────────────────────────────────────────────
const PLANS = [
  {
    tier: 'Starter', name: 'For individual educators',
    desc: 'Everything you need to launch your first course.',
    price: <><sup style={{ fontSize: 28, verticalAlign: 'top', marginTop: 12, opacity: 0.7 }}>$</sup>29<span style={{ fontSize: 16, color: INK3, fontWeight: 400, fontFamily: UI }}>/mo</span></>,
    period: 'billed monthly',
    cta: 'Start free trial', ctaTo: '/signup', featured: false,
    features: ['Up to 50 learners','5 courses','Unlimited videos','Quiz engine','AI Q&A','Progress analytics','Mobile payment collection','Email support'],
  },
  {
    tier: 'Professional', name: 'For growing institutions',
    desc: 'Unlimited learners, advanced tools, full control.',
    price: <><sup style={{ fontSize: 28, verticalAlign: 'top', marginTop: 12, opacity: 0.7 }}>$</sup>99<span style={{ fontSize: 16, color: INK3, fontWeight: 400, fontFamily: UI }}>/mo</span></>,
    period: 'billed monthly',
    cta: 'Start free trial', ctaTo: '/signup', featured: true,
    features: ['Unlimited learners','Unlimited courses','Advanced analytics','Custom branding','ATS — hiring pipeline','1-on-1 meeting scheduling','Assignments &amp; grading','Priority support'],
  },
  {
    tier: 'Enterprise', name: 'For large organisations',
    desc: 'Custom everything. Dedicated team. Full compliance.',
    price: <span style={{ fontSize: 44, color: INK }}>Custom</span>,
    period: 'tailored to your institution',
    cta: 'Contact us', ctaTo: '/login', featured: false,
    features: ['Everything in Professional','SSO / SAML 2.0','Custom domain','Dedicated success manager','SLA guarantee','Audit logs','API access','Volume pricing'],
  },
];

function Pricing() {
  return (
    <section id="pricing" style={{ padding: 'clamp(64px,8vw,120px) 0', borderTop: `1px solid ${RULE}` }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 clamp(16px,4vw,48px)' }}>
        <div className="lp-reveal" style={{ textAlign: 'center', marginBottom: 'clamp(40px,5vw,70px)', opacity: 0, transform: 'translateY(24px)', transition: 'opacity 0.7s ease, transform 0.7s ease' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}><SLabel>Pricing</SLabel></div>
          <h2 style={{ fontFamily: DISP, fontSize: 'clamp(42px,5vw,64px)', fontWeight: 300, lineHeight: 1.05, letterSpacing: '-0.02em', color: INK, marginBottom: 16 }}>
            <em style={{ fontStyle: 'italic', color: GOLD }}>Simple,</em> transparent pricing.
          </h2>
          <p style={{ fontSize: 16, color: INK2, fontFamily: UI }}>14-day free trial on every plan. No credit card required. Cancel anytime.</p>
        </div>

        <div className="lp-reveal lp-three-col" style={{
          gap: 1, background: RULE, border: `1px solid ${RULE}`, borderRadius: 8, overflow: 'hidden',
          opacity: 0, transform: 'translateY(24px)', transition: 'opacity 0.7s ease 0.1s, transform 0.7s ease 0.1s',
        }}>
          {PLANS.map(p => (
            <div key={p.tier} style={{
              background: p.featured ? '#1e1b12' : CARD,
              padding: '44px 36px', position: 'relative', display: 'flex', flexDirection: 'column',
              border: p.featured ? `1px solid rgba(200,169,110,0.18)` : 'none',
              margin: p.featured ? -1 : 0, zIndex: p.featured ? 1 : 0,
            }}>
              {p.featured && (
                <div style={{
                  position: 'absolute', top: -1, left: '50%', transform: 'translateX(-50%)',
                  fontFamily: MONO, fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase',
                  color: BG, background: GOLD, padding: '5px 12px', borderRadius: 100, whiteSpace: 'nowrap',
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
                    <span dangerouslySetInnerHTML={{ __html: f }} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p style={{ textAlign: 'center', marginTop: 28, fontFamily: MONO, fontSize: 11, color: INK3, letterSpacing: '0.06em' }}>
          All plans include a 14-day free trial · Mobile payment support included · Cancel anytime
        </p>
      </div>
    </section>
  );
}

// ── CTA band ───────────────────────────────────────────────────────────────
function CtaBand() {
  return (
    <section style={{ padding: 'clamp(64px,10vw,140px) 0', borderTop: `1px solid ${RULE}`, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at 50% 60%, rgba(200,169,110,0.06) 0%, transparent 65%)` }} />
      <div className="lp-reveal" style={{
        maxWidth: 700, margin: '0 auto', textAlign: 'center',
        position: 'relative', zIndex: 1, padding: '0 clamp(16px,4vw,48px)',
        opacity: 0, transform: 'translateY(24px)', transition: 'opacity 0.7s ease, transform 0.7s ease',
      }}>
        <SLabel>Get started today</SLabel>
        <h2 style={{ fontFamily: DISP, fontSize: 'clamp(48px,6vw,80px)', fontWeight: 300, lineHeight: 1.05, letterSpacing: '-0.025em', color: INK, marginBottom: 24 }}>
          The world needs<br /><em style={{ fontStyle: 'italic', color: GOLD }}>what you know.</em>
        </h2>
        <p style={{ fontSize: 17, color: INK2, lineHeight: 1.7, marginBottom: 48, fontFamily: UI }}>
          Join educators who are already building the future of learning on Nest.
          Your first course is free. No credit card. No excuses.
        </p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
          <Link to="/signup" style={{
            fontFamily: UI, fontSize: 13, fontWeight: 700,
            letterSpacing: '0.06em', textTransform: 'uppercase',
            color: BG, background: GOLD,
            padding: '15px 40px', borderRadius: 4,
            textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 10,
            transition: 'background 0.2s, transform 0.15s, box-shadow 0.2s',
          }}
            onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = GOLD2; el.style.transform = 'translateY(-2px)'; el.style.boxShadow = '0 16px 40px rgba(200,169,110,0.25)'; }}
            onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = GOLD; el.style.transform = 'translateY(0)'; el.style.boxShadow = 'none'; }}
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
    <footer style={{ borderTop: `1px solid ${RULE}`, padding: 'clamp(24px,4vw,48px)', fontFamily: UI }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 32, marginBottom: 40 }}>
        {/* Brand */}
        <div style={{ maxWidth: 240 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div style={{ width: 28, height: 28, border: `1.5px solid rgba(200,169,110,0.4)`, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: GOLD }}>N</div>
            <span style={{ fontFamily: DISP, fontSize: 22, fontWeight: 600, color: GOLD2 }}>Nest</span>
          </div>
          <p style={{ fontSize: 13, color: INK3, lineHeight: 1.6 }}>
            The education platform built for the next generation of creators and learners.
          </p>
        </div>

        {/* Links */}
        <div style={{ display: 'flex', gap: 48, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontFamily: MONO, fontSize: 9, color: GOLD, letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 16 }}>Platform</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[['#features','Features'],['#how','How it works'],['#for-who','For educators']].map(([h,l]) => (
                <a key={h} href={h} style={{ fontSize: 13, color: INK3, textDecoration: 'none', transition: 'color 0.2s' }}
                  onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = INK2)}
                  onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = INK3)}
                >{l}</a>
              ))}
            </div>
          </div>
          <div>
            <div style={{ fontFamily: MONO, fontSize: 9, color: GOLD, letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 16 }}>Account</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Link to="/pricing" style={{ fontSize: 13, color: INK3, textDecoration: 'none', transition: 'color 0.2s' }}
                onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = INK2)}
                onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = INK3)}
              >Pricing</Link>
              <Link to="/login" style={{ fontSize: 13, color: INK3, textDecoration: 'none', transition: 'color 0.2s' }}
                onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = INK2)}
                onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = INK3)}
              >Sign in</Link>
              <Link to="/signup" style={{ fontSize: 13, color: GOLD, textDecoration: 'none' }}>Get started free</Link>
            </div>
          </div>
        </div>
      </div>

      <div style={{ borderTop: `1px solid ${RULE}`, paddingTop: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <p style={{ fontFamily: MONO, fontSize: 10.5, color: INK3, letterSpacing: '0.06em' }}>
          © {new Date().getFullYear()} Nest. All rights reserved.
        </p>
        <p style={{ fontFamily: MONO, fontSize: 10.5, color: INK3, letterSpacing: '0.06em', fontStyle: 'italic' }}>
          Knowledge that moves the world forward.
        </p>
      </div>
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
      <Ticker />
      <HowItWorks />
      <Features />
      <ForWho />
      <Testimonials />
      <Pricing />
      <CtaBand />
      <LandingFooter />
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Syne:wght@400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap');

        @keyframes lpRise    { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes lpBlink   { 0%,100%{opacity:1} 50%{opacity:0.2} }
        @keyframes lpFloat   { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
        @keyframes lpTicker  { from{transform:translateX(0)} to{transform:translateX(-50%)} }

        ::-webkit-scrollbar{width:5px}
        ::-webkit-scrollbar-track{background:${BG}}
        ::-webkit-scrollbar-thumb{background:${INK3};border-radius:3px}

        .lp-three-col { display: grid; grid-template-columns: repeat(3,1fr); }
        .lp-two-col   { display: grid; grid-template-columns: 1fr 1fr; gap: 1px; align-items: start; }

        @media (max-width: 768px) {
          .lp-three-col { grid-template-columns: 1fr; }
          .lp-two-col   { grid-template-columns: 1fr; }
          .lp-hero-card { display: none; }
        }
        @media (min-width: 769px) and (max-width: 1024px) {
          .lp-three-col { grid-template-columns: repeat(2,1fr); }
        }
        @media (max-width: 680px) {
          .lp-nav-links     { display: none !important; }
          .lp-signin-mobile { display: inline-block !important; }
        }
      `}</style>
    </div>
  );
}
