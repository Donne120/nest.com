import { Link } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';

// ═══════════════════════════════════════════════════════════════════════════
//  NEST — "The Answer"  ·  dark, cinematic, gold-soul landing page
//  Concept: the page behaves like the product — it answers you.
//  6 sections: Hero · Promise · Three moves · Manifesto · (Schools) · Close
// ═══════════════════════════════════════════════════════════════════════════

// ── Color system — warm near-black canvas, gold soul, orchid atmosphere ──────
const INK    = '#0B0A0F';   // near-black canvas (warm)
const INK2   = '#141019';   // raised surface
const HAIR   = 'rgba(255,255,255,0.09)';   // hairlines
const PLUM   = '#4A1D54';   // deep purple — gradients / glow
const ORCHID = '#B06CC6';   // the one bright purple — accents/links
const GOLD   = '#E8B04B';   // warm gold — CTAs, key numbers, the "answer" glow
const GOLDD  = '#C98A2E';   // gold hover
const LIME   = '#8BD450';   // rare — "live" pulse + success only
const PAPER  = '#F4F0E9';   // the one warm light break
const TEXT   = '#F2EEF6';   // primary text on dark
const MUTE   = '#9A93A6';   // secondary text
const FAINT  = '#5C5568';   // mono labels / captions

const DISP = "'Cormorant Garamond', Georgia, serif";
const UI   = "'Inter Tight', 'Inter', system-ui, sans-serif";
const MONO = "'DM Mono', ui-monospace, monospace";

// Custom-generated, brand-matched African learning imagery (in /public).
const IMG = {
  demo:      '/landing-demo.jpg',  // student on laptop, lavender — hero product frame
  teach:     '/move-teach.jpg',    // educator recording a lesson
  learn:     '/move-learn.jpg',    // learner on a phone, golden hour
  earn:      '/move-earn.jpg',     // mobile-money "Payment Confirmed"
  manifesto: '/manifesto.jpg',     // students learning together (space on the left)
};

// ── Scroll reveal ───────────────────────────────────────────────────────────
function useReveal() {
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>('.rv'));
    const show = (el: HTMLElement) => { el.style.opacity = '1'; el.style.transform = 'none'; };

    // Fallback: no IO support → just show everything.
    if (typeof IntersectionObserver === 'undefined') { els.forEach(show); return; }

    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { show(e.target as HTMLElement); io.unobserve(e.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    els.forEach(el => io.observe(el));

    // Safety net: anything still hidden after 2.5s (e.g. observer never fired) gets shown.
    const t = setTimeout(() => els.forEach(el => { if (el.style.opacity !== '1') show(el); }), 1200);

    return () => { io.disconnect(); clearTimeout(t); };
  }, []);
}

// ── Count-up (once, on view) ─────────────────────────────────────────────────
function useCounter(target: number, duration = 1400) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      io.disconnect();
      if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) { setCount(target); return; }
      let start = 0;
      const step = target / (duration / 16);
      const timer = setInterval(() => {
        start = Math.min(start + step, target);
        setCount(Math.round(start));
        if (start >= target) clearInterval(timer);
      }, 16);
    }, { threshold: 0.6 });
    io.observe(el);
    return () => io.disconnect();
  }, [target, duration]);
  return { count, ref };
}

// ── Primary + ghost buttons ──────────────────────────────────────────────────
function GoldBtn({ to, children, big }: { to: string; children: React.ReactNode; big?: boolean }) {
  return (
    <Link to={to} style={{
      fontFamily: UI, fontSize: big ? 14 : 13, fontWeight: 600, letterSpacing: '0.01em',
      color: INK, background: GOLD,
      padding: big ? '15px 34px' : '12px 26px', borderRadius: 6,
      textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 9,
      transition: 'background 0.2s, transform 0.15s, box-shadow 0.2s',
      boxShadow: '0 8px 30px -8px rgba(232,176,75,0.5)',
    }}
      onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = GOLDD; el.style.transform = 'translateY(-2px)'; el.style.boxShadow = '0 16px 44px -8px rgba(232,176,75,0.6)'; }}
      onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = GOLD; el.style.transform = 'translateY(0)'; el.style.boxShadow = '0 8px 30px -8px rgba(232,176,75,0.5)'; }}
    >
      {children}
    </Link>
  );
}

// Ghost button that routes internally (react-router Link)
function GhostLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link to={to} style={{
      fontFamily: UI, fontSize: 13, fontWeight: 500, letterSpacing: '0.01em',
      color: TEXT, background: 'transparent', border: `1px solid ${HAIR}`,
      padding: '14px 26px', borderRadius: 6,
      textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8,
      transition: 'border-color 0.2s, background 0.2s',
    }}
      onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'rgba(255,255,255,0.28)'; el.style.background = 'rgba(255,255,255,0.03)'; }}
      onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = HAIR; el.style.background = 'transparent'; }}
    >
      {children}
    </Link>
  );
}

// ── Eyebrow label ────────────────────────────────────────────────────────────
function Eyebrow({ children, dot = ORCHID }: { children: React.ReactNode; dot?: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 9, fontFamily: MONO, fontSize: 10.5, letterSpacing: '0.22em', textTransform: 'uppercase', color: MUTE }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: dot, animation: 'nBlink 2s infinite' }} />
      {children}
    </span>
  );
}

// ── Woven gold "kente thread" divider ────────────────────────────────────────
function Thread({ width = 60 }: { width?: number }) {
  return (
    <svg width={width} height="6" viewBox={`0 0 ${width} 6`} style={{ display: 'block' }} aria-hidden>
      <path d={`M0 3 ${Array.from({ length: Math.ceil(width / 12) }).map((_, i) => `Q ${i * 12 + 3} 0 ${i * 12 + 6} 3 Q ${i * 12 + 9} 6 ${i * 12 + 12} 3`).join(' ')}`}
        fill="none" stroke="rgba(232,176,75,0.45)" strokeWidth="1.2" />
    </svg>
  );
}

// ═══ NAV ════════════════════════════════════════════════════════════════════
function Nav() {
  return (
    <header style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 500,
      height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 clamp(16px,4vw,44px)',
      borderBottom: `1px solid ${HAIR}`,
      background: 'rgba(11,10,15,0.72)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
      fontFamily: UI, gap: 12,
    }}>
      <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 11, flexShrink: 0 }}>
        <div style={{
          width: 30, height: 30, borderRadius: 8,
          background: `linear-gradient(135deg, ${GOLD}, ${GOLDD})`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 14, fontWeight: 800, color: INK, fontFamily: DISP,
          boxShadow: '0 0 0 1px rgba(232,176,75,0.3), 0 4px 14px rgba(232,176,75,0.35)',
        }}>N</div>
        <span style={{ fontFamily: DISP, fontSize: 25, fontWeight: 600, color: TEXT, letterSpacing: '0.01em' }}>Nest</span>
      </Link>

      <nav className="nav-links" style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
        <Link to="/explore" style={navLink}>Find courses</Link>
        <Link to="/pricing" style={navLink}>Pricing</Link>
        <Link to="/login" style={navLink}>Sign in</Link>
      </nav>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <Link to="/login" className="signin-mobile" style={{ ...navLink, display: 'none' }}>Sign in</Link>
        <GoldBtn to="/signup">Start free →</GoldBtn>
      </div>
    </header>
  );
}
const navLink: React.CSSProperties = {
  fontSize: 13, fontWeight: 500, color: MUTE, textDecoration: 'none',
  padding: '8px 14px', letterSpacing: '0.01em', fontFamily: UI, whiteSpace: 'nowrap',
  transition: 'color 0.2s',
};

// ═══ LIVE PRODUCT DEMO — the centerpiece (self-animating AI answer) ══════════
const SCRIPT = [
  { q: 'Wait — why does this step actually work?',
    a: 'Great question. At 2:14 the instructor factors out the common term first — that\'s the key move. It turns the whole equation into one line you can solve.' },
  { q: 'Can you say that in simpler words?',
    a: 'Of course. Think of splitting a bill: find what everyone shares, set it aside, then handle the rest. Same idea here.' },
  { q: 'What should I review before the quiz?',
    a: 'Focus on lessons 3 and 5 — that\'s where most learners slip. You\'ve already nailed the rest. You\'ve got this.' },
];

function ProductDemo() {
  const [step, setStep]   = useState(0);
  const [phase, setPhase] = useState<'q' | 'think' | 'a'>('q');
  const [typed, setTyped] = useState('');
  const [bloom, setBloom] = useState(false);
  const reduce = useRef(false);
  const { a } = SCRIPT[step];

  useEffect(() => {
    reduce.current = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  }, []);

  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    if (reduce.current) { setPhase('a'); setTyped(a); return; }
    if (phase === 'q') {
      t = setTimeout(() => setPhase('think'), 1500);
    } else if (phase === 'think') {
      t = setTimeout(() => { setTyped(''); setPhase('a'); }, 1000);
    } else {
      if (typed.length < a.length) {
        t = setTimeout(() => setTyped(a.slice(0, typed.length + 1)), 17);
      } else {
        setBloom(true);
        t = setTimeout(() => {
          setBloom(false);
          setStep(s => (s + 1) % SCRIPT.length);
          setPhase('q'); setTyped('');
        }, 3400);
      }
    }
    return () => clearTimeout(t);
  }, [phase, typed, a]);

  return (
    <div className="demo-wrap" style={{ position: 'relative', width: '100%', maxWidth: 680, margin: '0 auto' }}>
      {/* Under-glow — the "floating, lit" effect */}
      <div aria-hidden style={{
        position: 'absolute', inset: '18% 8% -8% 8%', zIndex: 0,
        background: `radial-gradient(ellipse at 50% 60%, rgba(176,108,198,0.35), rgba(232,176,75,0.18) 45%, transparent 72%)`,
        filter: 'blur(46px)', opacity: 0.9,
      }} />

      {/* Floating feature chips */}
      <FloatChip cls="chip-a" label="AI answers" sub="instantly"       accent={GOLD}   top={-24} left={-30} delay={0} />
      <FloatChip cls="chip-b" label="MoMo pay"   sub="you keep 100%"   accent={LIME}   top={'42%'} right={-40} delay={1.2} />
      <FloatChip cls="chip-c" label="Certificate" sub="auto-issued"    accent={ORCHID} bottom={-20} left={'20%'} delay={0.6} />

      {/* App window */}
      <div className="demo-window" style={{
        position: 'relative', zIndex: 2, width: '100%',
        borderRadius: 18, overflow: 'hidden',
        background: INK2, border: `1px solid ${HAIR}`,
        boxShadow: '0 50px 100px -30px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.04) inset',
      }}>
        {/* Chrome */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '11px 16px', borderBottom: `1px solid ${HAIR}`, background: 'rgba(255,255,255,0.02)' }}>
          {['#3a3340','#3a3340','#3a3340'].map((c, i) => <span key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />)}
          <span style={{ marginLeft: 10, fontFamily: MONO, fontSize: 11, color: FAINT, letterSpacing: '0.03em' }}>nest.app / algebra · lesson 4</span>
          <span style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 5, fontFamily: MONO, fontSize: 10, color: LIME }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: LIME, animation: 'nBlink 1.5s infinite' }} /> LIVE
          </span>
        </div>

        {/* Video frame */}
        <div style={{ position: 'relative', aspectRatio: '16/8', background: `linear-gradient(135deg, #2A1330, ${PLUM})`, overflow: 'hidden' }}>
          <img src={IMG.demo} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.42 }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(11,10,15,0.15), rgba(11,10,15,0.75))' }} />
          <div style={{ position: 'absolute', left: 16, right: 16, bottom: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 34, height: 34, borderRadius: '50%', background: GOLD, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 4px 18px rgba(232,176,75,0.6)' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill={INK}><polygon points="6,4 22,12 6,20" /></svg>
            </div>
            <div style={{ flex: 1, height: 4, borderRadius: 4, background: 'rgba(255,255,255,0.2)', overflow: 'hidden' }}>
              <div className="demo-prog" style={{ height: '100%', width: '46%', background: GOLD, borderRadius: 4 }} />
            </div>
            <span style={{ fontFamily: MONO, fontSize: 11, color: 'rgba(255,255,255,0.85)', flexShrink: 0 }}>2:14</span>
          </div>
        </div>

        {/* AI Q&A panel */}
        <div style={{ position: 'relative', padding: '18px 18px 20px', minHeight: 176, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Answer bloom */}
          <div aria-hidden style={{
            position: 'absolute', left: '10%', right: '10%', bottom: 8, height: 90, zIndex: 0,
            background: 'radial-gradient(ellipse at 30% 60%, rgba(232,176,75,0.28), transparent 70%)',
            filter: 'blur(24px)', opacity: bloom ? 1 : 0, transition: 'opacity 0.6s ease', pointerEvents: 'none',
          }} />

          {/* Question */}
          <div key={`q-${step}`} style={{ position: 'relative', zIndex: 1, alignSelf: 'flex-end', maxWidth: '82%', animation: 'nPop 0.4s cubic-bezier(0.16,1,0.3,1) both' }}>
            <div style={{ background: `linear-gradient(135deg, ${ORCHID}, #8b4a9e)`, color: '#fff', padding: '10px 14px', borderRadius: '14px 14px 4px 14px', fontFamily: UI, fontSize: 13.5, lineHeight: 1.5 }}>
              {SCRIPT[step].q}
            </div>
            <div style={{ fontFamily: MONO, fontSize: 9.5, color: FAINT, textAlign: 'right', marginTop: 4, letterSpacing: '0.03em' }}>YOU · asked at 2:14</div>
          </div>

          {/* AI answer */}
          <div style={{ position: 'relative', zIndex: 1, alignSelf: 'flex-start', maxWidth: '92%', display: 'flex', gap: 10 }}>
            <div style={{ width: 26, height: 26, borderRadius: 8, background: 'rgba(232,176,75,0.12)', border: `1px solid rgba(232,176,75,0.3)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: GOLD }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v3M12 19v3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M2 12h3M19 12h3"/><circle cx="12" cy="12" r="3.2"/></svg>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: MONO, fontSize: 9.5, color: GOLD, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 5, fontWeight: 600 }}>Nest AI</div>
              <div style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${HAIR}`, borderLeft: `2px solid ${GOLD}`, padding: '11px 14px', borderRadius: '4px 12px 12px 4px', fontFamily: UI, fontSize: 13.5, lineHeight: 1.6, color: TEXT, minHeight: 44 }}>
                {phase === 'think' ? (
                  <span style={{ display: 'inline-flex', gap: 4, alignItems: 'center', padding: '3px 0' }}>
                    <Dot d={0} /><Dot d={0.18} /><Dot d={0.36} />
                  </span>
                ) : phase === 'a' ? (
                  <>{typed}{typed.length < a.length && <span className="caret" style={{ color: GOLD }}>▍</span>}</>
                ) : (
                  <span style={{ color: FAINT }}>Ask anything, right here on the video…</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Dot({ d }: { d: number }) {
  return <span style={{ width: 6, height: 6, borderRadius: '50%', background: GOLD, display: 'inline-block', animation: `nBounce 1.2s ease-in-out ${d}s infinite` }} />;
}

function FloatChip({ cls, label, sub, accent, top, bottom, left, right, delay }: {
  cls: string; label: string; sub: string; accent: string;
  top?: number | string; bottom?: number | string; left?: number | string; right?: number | string; delay: number;
}) {
  return (
    <div className={`float-chip ${cls}`} style={{
      position: 'absolute', top, bottom, left, right, zIndex: 4,
      background: INK2, borderRadius: 12, padding: '10px 14px',
      boxShadow: '0 18px 44px -10px rgba(0,0,0,0.7)',
      border: `1px solid ${HAIR}`, display: 'flex', alignItems: 'center', gap: 10,
      animation: `nFloat ${7 + delay}s ease-in-out ${delay}s infinite`,
    }}>
      <span style={{ width: 30, height: 30, borderRadius: 9, background: `${accent}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <span style={{ width: 9, height: 9, borderRadius: '50%', background: accent, boxShadow: `0 0 10px ${accent}` }} />
      </span>
      <div>
        <div style={{ fontFamily: UI, fontSize: 12.5, fontWeight: 700, color: TEXT, lineHeight: 1.1 }}>{label}</div>
        <div style={{ fontFamily: MONO, fontSize: 9.5, color: MUTE, letterSpacing: '0.02em', marginTop: 1 }}>{sub}</div>
      </div>
    </div>
  );
}

// ═══ § 1 HERO — "The Stage" ══════════════════════════════════════════════════
function Hero() {
  return (
    <section style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', textAlign: 'center',
      padding: 'clamp(96px,12vw,120px) clamp(16px,5vw,48px) clamp(48px,6vw,72px)',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Stage lighting */}
      <div aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', left: '50%', top: '38%', width: 1000, height: 700, transform: 'translate(-50%,-50%)', background: `radial-gradient(ellipse, rgba(176,108,198,0.16), transparent 70%)` }} />
        <div style={{ position: 'absolute', left: '50%', top: '62%', width: 900, height: 500, transform: 'translate(-50%,-50%)', background: `radial-gradient(ellipse, rgba(232,176,75,0.07), transparent 70%)` }} />
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `linear-gradient(rgba(255,255,255,0.028) 1px, transparent 1px)`, backgroundSize: '100% 84px', maskImage: 'radial-gradient(ellipse 80% 70% at 50% 40%, #000 40%, transparent 100%)', WebkitMaskImage: 'radial-gradient(ellipse 80% 70% at 50% 40%, #000 40%, transparent 100%)' }} />
      </div>

      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 1000, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'clamp(28px,4vw,40px)' }}>
        <div style={{ animation: 'nRise 0.8s ease both' }}><Eyebrow dot={LIME}>The platform that answers back</Eyebrow></div>

        <h1 style={{
          fontFamily: DISP, fontSize: 'clamp(56px,9vw,120px)', fontWeight: 300,
          lineHeight: 0.95, letterSpacing: '-0.02em', color: TEXT, margin: 0,
          animation: 'nRise 0.9s ease 0.08s both',
        }}>
          Ask the video.<br />
          It <em style={{ fontStyle: 'italic', color: GOLD }}>answers.</em>
        </h1>

        {/* THE DEMO — centerpiece */}
        <div style={{ width: '100%', animation: 'nRise 1s ease 0.18s both', marginTop: 4 }}>
          <ProductDemo />
        </div>

        <p style={{ maxWidth: 540, fontFamily: UI, fontSize: 'clamp(16px,2vw,18px)', color: MUTE, lineHeight: 1.65, margin: 0, animation: 'nRise 0.9s ease 0.28s both' }}>
          Africa's learning platform where every lesson talks back —
          and every creator gets paid in mobile money.
        </p>

        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', justifyContent: 'center', animation: 'nRise 0.9s ease 0.36s both' }}>
          <GoldBtn to="/signup" big>Start free
            <svg width="15" height="15" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 10h10M12 7l3 3-3 3"/></svg>
          </GoldBtn>
          <GhostLink to="/explore">Find courses
            <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="9" r="6"/><path d="M14 14l3 3"/></svg>
          </GhostLink>
        </div>
      </div>
    </section>
  );
}

// ═══ § 2 PROMISE STRIP — three numbers, stated once ══════════════════════════
function PromiseStrip() {
  const stats = [
    { val: 0,   suffix: '',  label: 'to start' },
    { val: 100, suffix: '%', label: 'yours to keep' },
    { val: 24,  suffix: 'h', label: "and you're live" },
  ];
  return (
    <section style={{ borderTop: `1px solid ${HAIR}`, borderBottom: `1px solid ${HAIR}`, background: 'rgba(255,255,255,0.015)' }}>
      <div className="promise-grid" style={{ maxWidth: 960, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(3,1fr)' }}>
        {stats.map((s, i) => {
          const { count, ref } = useCounter(s.val);
          return (
            <div key={s.label} className="rv" style={{
              textAlign: 'center', padding: 'clamp(32px,5vw,52px) 20px',
              borderRight: i < 2 ? `1px solid ${HAIR}` : 'none',
              opacity: 0, transform: 'translateY(16px)', transition: `opacity 0.6s ease ${i * 0.08}s, transform 0.6s ease ${i * 0.08}s`,
            }}>
              <div style={{ fontFamily: DISP, fontSize: 'clamp(48px,7vw,76px)', fontWeight: 300, color: GOLD, lineHeight: 1, letterSpacing: '-0.02em' }}>
                {s.val === 0 && i === 0 ? <span style={{ fontSize: '0.7em', verticalAlign: '0.1em', opacity: 0.7 }}>$</span> : null}
                <span ref={ref}>{count}</span>{s.suffix}
              </div>
              <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: MUTE, marginTop: 12 }}>{s.label}</div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ═══ § 3 THREE MOVES — Teach · Learn · Earn (the ONE explanation) ════════════
const MOVES = [
  { n: '01', tag: 'Teach', img: IMG.teach, alt: 'An educator recording a lesson',
    title: 'Upload your lessons.',
    body: 'Drop in your videos and hit publish. Nest AI writes the transcript, the quizzes, and the answers — automatically.',
    proof: 'No editing. No tech team. One afternoon.' },
  { n: '02', tag: 'Learn', img: IMG.learn, alt: 'A learner studying on a phone',
    title: 'Learners ask the video.',
    body: 'They ask questions right on the timeline and get answers in seconds — grounded in your actual lesson, in your voice.',
    proof: 'Instant answers · quizzes · certificates.' },
  { n: '03', tag: 'Earn', img: IMG.earn, alt: 'A mobile-money payment confirmation',
    title: 'You get paid.',
    body: 'Set your price. Money lands via mobile money or card — no middleman, no card required for learners.',
    proof: 'You keep 100%. Paid the way Africa pays.' },
];

function ThreeMoves() {
  return (
    <section id="how" style={{ background: PAPER, color: INK, padding: 'clamp(72px,9vw,130px) 0', position: 'relative' }}>
      <div style={{ maxWidth: 1120, margin: '0 auto', padding: '0 clamp(16px,4vw,48px)' }}>
        <div className="rv" style={{ maxWidth: 640, marginBottom: 'clamp(48px,6vw,72px)', opacity: 0, transform: 'translateY(20px)', transition: 'opacity 0.7s ease, transform 0.7s ease' }}>
          <div style={{ marginBottom: 18 }}><Thread /></div>
          <span style={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: '0.22em', textTransform: 'uppercase', color: GOLDD }}>How Nest works</span>
          <h2 style={{ fontFamily: DISP, fontSize: 'clamp(40px,6vw,72px)', fontWeight: 300, lineHeight: 1.02, letterSpacing: '-0.02em', color: INK, margin: '16px 0 0' }}>
            Idea to income,<br /><em style={{ fontStyle: 'italic', color: '#7b2d8e' }}>in three moves.</em>
          </h2>
        </div>

        <div className="moves-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 'clamp(24px,3vw,48px)' }}>
          {MOVES.map((m, i) => (
            <div key={m.n} className="rv" style={{ position: 'relative', opacity: 0, transform: 'translateY(24px)', transition: `opacity 0.7s ease ${0.1 + i * 0.1}s, transform 0.7s ease ${0.1 + i * 0.1}s` }}>
              {/* Photo */}
              <div style={{ position: 'relative', aspectRatio: '4/3', borderRadius: 14, overflow: 'hidden', marginBottom: 20, border: '1px solid rgba(31,31,36,0.08)', boxShadow: '0 12px 30px -14px rgba(31,31,36,0.3)' }}>
                <img src={m.img} alt={m.alt} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <div style={{ position: 'absolute', top: 12, left: 12, fontFamily: MONO, fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#fff', background: 'rgba(123,45,142,0.9)', padding: '4px 10px', borderRadius: 100 }}>{m.tag}</div>
              </div>
              <div style={{ fontFamily: DISP, fontSize: 'clamp(48px,6vw,80px)', fontWeight: 300, color: 'rgba(123,45,142,0.16)', lineHeight: 0.8, letterSpacing: '-0.04em', marginBottom: 6 }}>{m.n}</div>
              <h3 style={{ fontFamily: UI, fontSize: 'clamp(20px,2.4vw,26px)', fontWeight: 700, color: INK, lineHeight: 1.15, margin: '8px 0 12px', letterSpacing: '-0.01em' }}>{m.title}</h3>
              <p style={{ fontFamily: UI, fontSize: 15, color: '#5c5764', lineHeight: 1.65, marginBottom: 16 }}>{m.body}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: MONO, fontSize: 11, color: '#7b2d8e', letterSpacing: '0.02em', borderTop: '1px solid rgba(31,31,36,0.1)', paddingTop: 14 }}>
                <svg width="13" height="13" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M4 10l4 4 8-9"/></svg>
                {m.proof}
              </div>
            </div>
          ))}
        </div>

        <div className="rv" style={{ marginTop: 'clamp(40px,5vw,60px)', opacity: 0, transform: 'translateY(12px)', transition: 'opacity 0.6s ease 0.3s, transform 0.6s ease 0.3s' }}>
          <GoldBtn to="/signup" big>Claim your space
            <svg width="15" height="15" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 10h10M12 7l3 3-3 3"/></svg>
          </GoldBtn>
        </div>
      </div>
    </section>
  );
}

// ═══ § 4 MANIFESTO — the gut-punch ═══════════════════════════════════════════
function Manifesto() {
  return (
    <section className="rv" style={{
      position: 'relative', overflow: 'hidden', background: INK,
      borderTop: `1px solid ${HAIR}`, minHeight: 'clamp(440px,60vw,640px)',
      display: 'flex', alignItems: 'center',
      opacity: 0, transition: 'opacity 0.9s ease',
    }}>
      {/* Photo slab bleeding from the right */}
      <div className="manifesto-photo" style={{ position: 'absolute', top: 0, bottom: 0, right: 0, width: '58%', overflow: 'hidden' }}>
        <img src={IMG.manifesto} alt="African learners collaborating" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'right center' }} />
        {/* Fade the photo into the dark canvas on the left so the headline reads */}
        <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(90deg, ${INK} 0%, rgba(11,10,15,0.7) 22%, rgba(11,10,15,0.15) 55%, transparent 80%)` }} />
        <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(90deg, rgba(74,29,84,0.25), transparent 60%)`, mixBlendMode: 'multiply' }} />
      </div>

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 1120, margin: '0 auto', padding: '0 clamp(16px,4vw,48px)', width: '100%' }}>
        <div style={{ maxWidth: 720 }}>
          <div style={{ marginBottom: 22 }}><Eyebrow dot={GOLD}>For every learner, everywhere</Eyebrow></div>
          <h2 style={{ fontFamily: DISP, fontSize: 'clamp(44px,8vw,104px)', fontWeight: 300, lineHeight: 1.0, letterSpacing: '-0.025em', color: TEXT, margin: 0 }}>
            A classroom with<br />
            <span className="man-word">no walls,</span>{' '}
            <span className="man-word" style={{ animationDelay: '0.15s' }}>no borders,</span><br />
            <span className="man-word" style={{ animationDelay: '0.3s' }}>no gatekeepers.</span>
          </h2>
          <p style={{ fontFamily: UI, fontSize: 'clamp(15px,1.8vw,18px)', color: MUTE, lineHeight: 1.7, maxWidth: 440, marginTop: 26 }}>
            From a phone in Yaoundé to a laptop in Kigali — the same lesson,
            the same chance. Knowledge shouldn't depend on where you were born.
          </p>
        </div>
      </div>
    </section>
  );
}

// ═══ § 5 SCHOOLS DIRECTORY (auto-hides if empty) ═════════════════════════════
type PublicOrg = {
  name: string; slug: string;
  logo_url: string | null; brand_color: string | null;
  tagline: string | null; description: string | null;
  public_email: string | null; public_phone: string | null;
  public_whatsapp: string | null; website_url: string | null;
  country: string | null; city: string | null;
};
const API_BASE = (import.meta as any).env?.VITE_API_URL ? `${(import.meta as any).env.VITE_API_URL}/api` : '/api';
function waLink(num: string) { return `https://wa.me/${num.replace(/[^\d]/g, '')}`; }

function OrgCard({ org }: { org: PublicOrg }) {
  const accent = org.brand_color || GOLD;
  const initials = org.name.split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase();
  const place = [org.city, org.country].filter(Boolean).join(', ');
  const contactStyle: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: UI, fontSize: 12, fontWeight: 600, color: MUTE, border: `1px solid ${HAIR}`, padding: '7px 13px', borderRadius: 6, textDecoration: 'none' };
  return (
    <div style={{ background: INK2, border: `1px solid ${HAIR}`, borderRadius: 14, padding: '28px 26px 24px', display: 'flex', flexDirection: 'column', transition: 'border-color 0.2s' }}
      onMouseEnter={e => ((e.currentTarget as HTMLElement).style.borderColor = 'rgba(232,176,75,0.35)')}
      onMouseLeave={e => ((e.currentTarget as HTMLElement).style.borderColor = HAIR)}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
        <div style={{ width: 48, height: 48, borderRadius: 12, flexShrink: 0, border: `1px solid ${accent}44`, background: `${accent}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
          {org.logo_url ? <img src={org.logo_url} alt={org.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} /> : <span style={{ fontFamily: UI, fontSize: 17, fontWeight: 800, color: accent }}>{initials}</span>}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontFamily: DISP, fontSize: 21, fontWeight: 600, color: TEXT, lineHeight: 1.2 }}>{org.name}</div>
          {place && <div style={{ fontFamily: MONO, fontSize: 10, color: FAINT, marginTop: 3 }}>{place}</div>}
        </div>
      </div>
      {(org.tagline || org.description) && <p style={{ fontFamily: UI, fontSize: 13.5, color: MUTE, lineHeight: 1.6, marginBottom: 20, flex: 1 }}>{org.tagline || org.description}</p>}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, borderTop: `1px solid ${HAIR}`, paddingTop: 16 }}>
        {org.public_whatsapp && <a href={waLink(org.public_whatsapp)} target="_blank" rel="noreferrer" style={{ ...contactStyle, color: INK, background: LIME, border: 'none', fontWeight: 700 }}>WhatsApp</a>}
        {org.public_phone && <a href={`tel:${org.public_phone.replace(/\s+/g, '')}`} style={contactStyle}>Call</a>}
        {org.public_email && <a href={`mailto:${org.public_email}`} style={contactStyle}>Email</a>}
        {org.website_url && <a href={org.website_url} target="_blank" rel="noreferrer" style={contactStyle}>Visit</a>}
      </div>
    </div>
  );
}

function Directory() {
  const [orgs, setOrgs] = useState<PublicOrg[] | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let alive = true;
    fetch(`${API_BASE}/organizations/public`)
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then((data: PublicOrg[]) => { if (alive) setOrgs(data); })
      .catch(() => { if (alive) setFailed(true); });
    return () => { alive = false; };
  }, []);
  if (failed || !orgs || orgs.length === 0) return null;   // silent unless there's real proof
  return (
    <section id="schools" style={{ padding: 'clamp(72px,9vw,120px) 0', borderTop: `1px solid ${HAIR}` }}>
      <div style={{ maxWidth: 1120, margin: '0 auto', padding: '0 clamp(16px,4vw,48px)' }}>
        <div className="rv" style={{ textAlign: 'center', marginBottom: 'clamp(40px,5vw,60px)', opacity: 0, transform: 'translateY(20px)', transition: 'opacity 0.7s ease, transform 0.7s ease' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}><Thread /></div>
          <span style={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: '0.22em', textTransform: 'uppercase', color: MUTE }}>Already teaching here</span>
          <h2 style={{ fontFamily: DISP, fontSize: 'clamp(36px,5vw,60px)', fontWeight: 300, lineHeight: 1.05, letterSpacing: '-0.02em', color: TEXT, margin: '14px 0 0' }}>
            Real schools, <em style={{ fontStyle: 'italic', color: GOLD }}>real people.</em>
          </h2>
        </div>
        <div className="orgs-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 14 }}>
          {orgs.slice(0, 3).map(org => <OrgCard key={org.slug} org={org} />)}
        </div>
        <div className="rv" style={{ textAlign: 'center', marginTop: 32, opacity: 0, transform: 'translateY(12px)', transition: 'opacity 0.6s ease 0.2s, transform 0.6s ease 0.2s' }}>
          <Link to="/explore" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontFamily: UI, fontSize: 14, fontWeight: 600, color: GOLD, textDecoration: 'none', border: `1px solid rgba(232,176,75,0.35)`, padding: '12px 24px', borderRadius: 8 }}>
            {orgs.length > 3 ? `See all ${orgs.length} teachers` : 'Browse all courses'}
            <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 10h10M12 7l3 3-3 3"/></svg>
          </Link>
        </div>
      </div>
    </section>
  );
}

// ═══ § 6 CLOSE + FOOTER ══════════════════════════════════════════════════════
function Close() {
  return (
    <footer style={{ borderTop: `1px solid ${HAIR}`, position: 'relative', overflow: 'hidden' }}>
      <div aria-hidden style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse 700px 400px at 50% 30%, rgba(232,176,75,0.09), transparent 65%)` }} />
      <div className="rv" style={{ position: 'relative', maxWidth: 720, margin: '0 auto', textAlign: 'center', padding: 'clamp(80px,11vw,150px) clamp(16px,4vw,48px) clamp(56px,7vw,90px)', opacity: 0, transform: 'translateY(20px)', transition: 'opacity 0.8s ease, transform 0.8s ease' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 22 }}><Eyebrow dot={GOLD}>Your turn</Eyebrow></div>
        <h2 style={{ fontFamily: DISP, fontSize: 'clamp(44px,7vw,88px)', fontWeight: 300, lineHeight: 1.02, letterSpacing: '-0.025em', color: TEXT, margin: '0 0 22px' }}>
          Your first course is<br /><em style={{ fontStyle: 'italic', color: GOLD }}>one afternoon away.</em>
        </h2>
        <p style={{ fontFamily: UI, fontSize: 17, color: MUTE, lineHeight: 1.6, marginBottom: 36 }}>
          No card. No fees to start. You keep 100%.
        </p>
        <GoldBtn to="/signup" big>Start free
          <svg width="15" height="15" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 10h10M12 7l3 3-3 3"/></svg>
        </GoldBtn>
        <p style={{ fontFamily: MONO, fontSize: 11.5, color: FAINT, marginTop: 20, letterSpacing: '0.04em' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: GOLD, textDecoration: 'none' }}>Sign in</Link>
        </p>
      </div>

      {/* Footer bar */}
      <div style={{ borderTop: `1px solid ${HAIR}`, position: 'relative' }}>
        <div style={{ maxWidth: 1120, margin: '0 auto', padding: '28px clamp(16px,4vw,48px)', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
            <div style={{ width: 26, height: 26, borderRadius: 7, background: `linear-gradient(135deg, ${GOLD}, ${GOLDD})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: INK, fontFamily: DISP }}>N</div>
            <span style={{ fontFamily: DISP, fontSize: 20, fontWeight: 600, color: TEXT }}>Nest</span>
          </div>
          <div style={{ display: 'flex', gap: 22, flexWrap: 'wrap' }}>
            {[['#how','How it works'],['/pricing','Pricing'],['/login','Sign in'],['/signup','Get started']].map(([h, l]) => (
              h.startsWith('#')
                ? <a key={l} href={h} style={{ fontFamily: UI, fontSize: 13, color: MUTE, textDecoration: 'none' }}>{l}</a>
                : <Link key={l} to={h} style={{ fontFamily: UI, fontSize: 13, color: MUTE, textDecoration: 'none' }}>{l}</Link>
            ))}
          </div>
          <div style={{ fontFamily: MONO, fontSize: 10.5, color: FAINT, letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Thread width={28} /> Made in Africa
          </div>
        </div>
        <div style={{ borderTop: `1px solid ${HAIR}`, padding: '16px clamp(16px,4vw,48px)', maxWidth: 1120, margin: '0 auto' }}>
          <span style={{ fontFamily: MONO, fontSize: 10.5, color: FAINT, letterSpacing: '0.05em' }}>© {new Date().getFullYear()} Nest — a classroom with no walls.</span>
        </div>
      </div>
    </footer>
  );
}

// ═══ PAGE ════════════════════════════════════════════════════════════════════
export default function LandingPage() {
  useReveal();
  return (
    <div style={{ background: INK, color: TEXT, fontFamily: UI, fontSize: 15, lineHeight: 1.6, overflowX: 'hidden' }}>
      {/* Warm film grain */}
      <div aria-hidden style={{
        position: 'fixed', inset: 0, zIndex: 1000, pointerEvents: 'none',
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        opacity: 0.04, mixBlendMode: 'overlay',
      }} />

      <Nav />
      <Hero />
      <PromiseStrip />
      <ThreeMoves />
      <Manifesto />
      <Directory />
      <Close />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=Inter+Tight:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap');

        @keyframes nRise   { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
        @keyframes nBlink  { 0%,100%{opacity:1} 50%{opacity:0.25} }
        @keyframes nFloat  { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        @keyframes nPop    { from{opacity:0;transform:translateY(8px) scale(0.96)} to{opacity:1;transform:translateY(0) scale(1)} }
        @keyframes nBounce { 0%,80%,100%{transform:translateY(0);opacity:0.5} 40%{transform:translateY(-5px);opacity:1} }
        @keyframes nCaret  { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes nProg   { from{width:34%} to{width:64%} }
        @keyframes nWord   { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }

        .caret     { animation: nCaret 0.7s step-end infinite; margin-left:1px; }
        .demo-prog { animation: nProg 6s ease-in-out infinite alternate; }
        .man-word  { display:inline-block; animation: nWord 0.7s ease both; }

        .nav-links a:hover, .signin-mobile:hover { color: ${TEXT} !important; }

        ::-webkit-scrollbar { width:6px; }
        ::-webkit-scrollbar-track { background:${INK}; }
        ::-webkit-scrollbar-thumb { background:#2a2530; border-radius:3px; }

        html { scroll-behavior: smooth; }
        section[id] { scroll-margin-top: 80px; }

        @media (max-width: 860px) {
          .moves-grid   { grid-template-columns: 1fr !important; gap: 40px !important; }
          .manifesto-photo { width: 100% !important; opacity: 0.28; }
          .float-chip   { display: none !important; }
        }
        @media (max-width: 620px) {
          .nav-links    { display: none !important; }
          .signin-mobile{ display: inline-block !important; }
          .promise-grid { grid-template-columns: 1fr !important; }
          .promise-grid > div { border-right: none !important; border-bottom: 1px solid ${HAIR}; }
        }
        @media (prefers-reduced-motion: reduce) {
          .float-chip, .demo-prog, .caret, .man-word { animation: none !important; }
          .rv { opacity: 1 !important; transform: none !important; }
        }
      `}</style>
    </div>
  );
}
