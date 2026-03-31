import { Link } from 'react-router-dom';

// ── EDITABLE CONTENT ────────────────────────────────────────────────────────
// Edit the values below to update the one-pager without touching the layout.

const META = {
  company:   'Nest',
  tagline:   'Knowledge that moves the world forward.',
  date:      'March 2026',
  contact:   'ngummdieudonne4@gmail.com',
  website:   'https://nest-com.vercel.app',
};

const PROBLEM = {
  headline: 'Learning platforms exist. Knowledge retention doesn\'t.',
  body: `Every company invests thousands of hours recording knowledge — onboarding sessions,
product demos, training videos. Yet 80% of that knowledge is never found again.
Teams repeat the same questions. New hires take months to ramp up. Institutional
knowledge walks out the door when people leave.`,
};

const SOLUTION = {
  headline: 'AI-powered learning where every question becomes an answer forever.',
  body: `Nest is an education platform where video courses build a living knowledge base.
Learners ask questions at exact timestamps. Our AI answers using the actual
transcript — and every answer is saved so the next person never has to ask again.
Educators see what confuses learners in real time. The platform gets smarter with every cohort.`,
};

const PRODUCT_FEATURES = [
  { label: 'Video Courses',       desc: 'Upload lectures, tutorials, and training videos with auto-transcription.' },
  { label: 'Timestamped Q&A',     desc: 'Ask questions at any moment in a video. AI answers using the transcript.' },
  { label: 'Knowledge Base',      desc: 'Every answered question is indexed and searchable for future learners.' },
  { label: 'Assignments',         desc: 'Group and individual projects with real-time collaboration tools.' },
  { label: 'Live Meetings',       desc: 'Schedule and run coaching sessions directly inside the platform.' },
  { label: 'Certificates',        desc: 'Auto-issued on completion — shareable, verifiable.' },
];

const MARKET = {
  tam: { value: '$370B',  label: 'Global e-learning market (2026)' },
  sam: { value: '$12B',   label: 'Corporate & creator education tools' },
  som: { value: '$240M',  label: '3-year reachable market' },
};

const BUSINESS_MODEL = [
  { tier: 'Free',       price: '$0',      desc: '1 course, 10 learners, community Q&A.' },
  { tier: 'Pro',        price: '$29/mo',  desc: 'Unlimited courses, full AI, analytics.' },
  { tier: 'Business',   price: '$99/mo',  desc: 'Multi-team, SSO, advanced reporting.' },
  { tier: 'Enterprise', price: 'Custom',  desc: 'On-premise, SLA, dedicated support.' },
];

const TRACTION = [
  { metric: '6',    label: 'Beta users' },
  { metric: '2',    label: 'Paying customers' },
  { metric: '33%',  label: 'Free-to-paid conversion' },
  { metric: '$30',  label: 'Revenue (zero marketing spend)' },
];

const TEAM = [
  {
    name:  'Ngum Dieudonne',
    role:  'Founder & CEO',
    bio:   'Full-stack engineer. Built Nest end-to-end — backend, frontend, AI integrations, payments, infrastructure.',
  },
];

const ASK = {
  amount:  '$10,000',
  round:   'Pre-seed',
  use: [
    { pct: '40%', item: 'Growth & marketing — first 100 paying customers' },
    { pct: '25%', item: 'Infrastructure — Mux video, domain, scaling' },
    { pct: '25%', item: 'First hire — a passionate co-founder or engineer' },
    { pct: '10%', item: 'Operations — legal, tooling, events' },
  ],
};

// ── Tokens (match landing page) ─────────────────────────────────────────────
const BG      = '#0a0907';
const SURFACE = '#111009';
const CARD    = '#161410';
const INK     = '#f0ebe2';
const INK2    = '#8a8070';
const INK3    = '#4a4238';
const RULE    = 'rgba(255,255,255,0.07)';
const GOLD    = '#c8a96e';
const GOLD2   = '#e8d4a0';
const SAGE    = '#5a8a6a';
const DISP    = "'Cormorant Garamond', Georgia, serif";
const UI      = "'Syne', sans-serif";
const MONO    = "'DM Mono', monospace";

function SLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontFamily: MONO, fontSize: 9, color: GOLD, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 12 }}>
      {children}
    </div>
  );
}

function Section({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <section style={{ borderTop: `1px solid ${RULE}`, padding: 'clamp(40px,5vw,72px) 0', ...style }}>
      {children}
    </section>
  );
}

export default function OnePagerPage() {
  return (
    <div style={{ background: BG, color: INK, fontFamily: UI, fontSize: 15, lineHeight: 1.65, minHeight: '100vh' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Syne:wght@400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap');
        ::-webkit-scrollbar{width:5px}
        ::-webkit-scrollbar-track{background:${BG}}
        ::-webkit-scrollbar-thumb{background:${INK3};border-radius:3px}
      `}</style>

      {/* Nav bar */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 100,
        height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 clamp(16px,4vw,48px)',
        borderBottom: `1px solid ${RULE}`,
        background: 'rgba(10,9,7,0.95)', backdropFilter: 'blur(20px)',
        fontFamily: UI,
      }}>
        <Link to="/" style={{ fontFamily: MONO, fontSize: 10, color: INK3, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8, letterSpacing: '0.1em' }}>
          ← nest.com
        </Link>
        <span style={{ fontFamily: MONO, fontSize: 9, color: GOLD, letterSpacing: '0.2em', textTransform: 'uppercase' }}>One-Pager · {META.date}</span>
        <button onClick={() => window.print()} style={{ fontFamily: MONO, fontSize: 9, color: INK3, background: 'none', border: `1px solid ${RULE}`, borderRadius: 6, padding: '6px 14px', cursor: 'pointer', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Print / PDF</button>
      </header>

      <div style={{ maxWidth: 820, margin: '0 auto', padding: '0 clamp(16px,4vw,48px)' }}>

        {/* Cover */}
        <div style={{ padding: 'clamp(56px,8vw,100px) 0 clamp(40px,5vw,64px)', textAlign: 'center' }}>
          <SLabel>Executive summary</SLabel>
          <h1 style={{ fontFamily: DISP, fontSize: 'clamp(48px,7vw,80px)', fontWeight: 300, lineHeight: 1.0, letterSpacing: '-0.02em', color: INK, margin: '0 0 20px' }}>
            {META.company}
          </h1>
          <p style={{ fontFamily: DISP, fontSize: 'clamp(18px,2.5vw,26px)', color: GOLD2, fontStyle: 'italic', fontWeight: 300, margin: '0 0 32px' }}>
            {META.tagline}
          </p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href={`mailto:${META.contact}`} style={{ fontFamily: MONO, fontSize: 11, color: INK2, textDecoration: 'none', letterSpacing: '0.08em' }}>{META.contact}</a>
            <span style={{ color: INK3 }}>·</span>
            <a href={META.website} style={{ fontFamily: MONO, fontSize: 11, color: INK2, textDecoration: 'none', letterSpacing: '0.08em' }}>{META.website}</a>
          </div>
        </div>

        {/* Traction bar */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', borderTop: `1px solid ${RULE}`, borderBottom: `1px solid ${RULE}` }}>
          {TRACTION.map(t => (
            <div key={t.label} style={{ padding: '24px 0', textAlign: 'center', borderRight: `1px solid ${RULE}` }}>
              <div style={{ fontFamily: DISP, fontSize: 'clamp(26px,3.5vw,40px)', fontWeight: 600, color: GOLD, lineHeight: 1 }}>{t.metric}</div>
              <div style={{ fontFamily: MONO, fontSize: 9.5, color: INK3, letterSpacing: '0.1em', marginTop: 6, textTransform: 'uppercase' }}>{t.label}</div>
            </div>
          ))}
        </div>

        {/* Problem */}
        <Section>
          <SLabel>The problem</SLabel>
          <h2 style={{ fontFamily: DISP, fontSize: 'clamp(26px,3.5vw,40px)', fontWeight: 400, color: INK, lineHeight: 1.2, marginBottom: 20 }}>{PROBLEM.headline}</h2>
          <p style={{ fontSize: 15, color: INK2, lineHeight: 1.8, whiteSpace: 'pre-line' }}>{PROBLEM.body}</p>
        </Section>

        {/* Solution */}
        <Section>
          <SLabel>The solution</SLabel>
          <h2 style={{ fontFamily: DISP, fontSize: 'clamp(26px,3.5vw,40px)', fontWeight: 400, color: INK, lineHeight: 1.2, marginBottom: 20 }}>{SOLUTION.headline}</h2>
          <p style={{ fontSize: 15, color: INK2, lineHeight: 1.8, whiteSpace: 'pre-line' }}>{SOLUTION.body}</p>
        </Section>

        {/* Product */}
        <Section>
          <SLabel>Product features</SLabel>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 1 }}>
            {PRODUCT_FEATURES.map(f => (
              <div key={f.label} style={{ background: CARD, padding: '20px 24px', borderRadius: 2 }}>
                <div style={{ fontFamily: UI, fontSize: 13, fontWeight: 700, color: GOLD2, marginBottom: 6 }}>{f.label}</div>
                <div style={{ fontSize: 13, color: INK2, lineHeight: 1.6 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </Section>

        {/* Market */}
        <Section>
          <SLabel>Market size</SLabel>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 1 }}>
            {[MARKET.tam, MARKET.sam, MARKET.som].map(m => (
              <div key={m.label} style={{ background: CARD, padding: '24px', borderRadius: 2, textAlign: 'center' }}>
                <div style={{ fontFamily: DISP, fontSize: 36, fontWeight: 600, color: GOLD, lineHeight: 1 }}>{m.value}</div>
                <div style={{ fontFamily: MONO, fontSize: 9.5, color: INK3, letterSpacing: '0.1em', marginTop: 8, textTransform: 'uppercase', lineHeight: 1.5 }}>{m.label}</div>
              </div>
            ))}
          </div>
        </Section>

        {/* Business model */}
        <Section>
          <SLabel>Business model</SLabel>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 1 }}>
            {BUSINESS_MODEL.map(b => (
              <div key={b.tier} style={{ background: CARD, padding: '20px 24px', borderRadius: 2 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                  <span style={{ fontFamily: UI, fontSize: 13, fontWeight: 700, color: INK }}>{b.tier}</span>
                  <span style={{ fontFamily: MONO, fontSize: 13, color: GOLD }}>{b.price}</span>
                </div>
                <div style={{ fontSize: 13, color: INK2 }}>{b.desc}</div>
              </div>
            ))}
          </div>
        </Section>

        {/* Team */}
        <Section>
          <SLabel>Team</SLabel>
          {TEAM.map(t => (
            <div key={t.name} style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
              <div style={{
                width: 48, height: 48, borderRadius: '50%', flexShrink: 0,
                background: `linear-gradient(135deg, ${GOLD}33, ${GOLD2}22)`,
                border: `1px solid ${GOLD}44`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: DISP, fontSize: 22, color: GOLD,
              }}>{t.name[0]}</div>
              <div>
                <div style={{ fontFamily: UI, fontSize: 15, fontWeight: 700, color: INK }}>{t.name}</div>
                <div style={{ fontFamily: MONO, fontSize: 10, color: GOLD, letterSpacing: '0.12em', textTransform: 'uppercase', margin: '4px 0 8px' }}>{t.role}</div>
                <div style={{ fontSize: 14, color: INK2, lineHeight: 1.7 }}>{t.bio}</div>
              </div>
            </div>
          ))}
        </Section>

        {/* Ask */}
        <Section>
          <SLabel>The ask</SLabel>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, marginBottom: 32 }}>
            <span style={{ fontFamily: DISP, fontSize: 'clamp(40px,6vw,64px)', fontWeight: 600, color: GOLD, lineHeight: 1 }}>{ASK.amount}</span>
            <span style={{ fontFamily: MONO, fontSize: 10, color: INK3, letterSpacing: '0.2em', textTransform: 'uppercase' }}>{ASK.round}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {ASK.use.map(u => (
              <div key={u.pct} style={{ display: 'flex', gap: 16, alignItems: 'baseline', padding: '12px 0', borderBottom: `1px solid ${RULE}` }}>
                <span style={{ fontFamily: MONO, fontSize: 14, color: GOLD, minWidth: 40, fontWeight: 600 }}>{u.pct}</span>
                <span style={{ fontSize: 14, color: INK2 }}>{u.item}</span>
              </div>
            ))}
          </div>
        </Section>

        {/* Contact */}
        <Section style={{ borderBottom: `1px solid ${RULE}`, marginBottom: 0 }}>
          <div style={{ textAlign: 'center', padding: '8px 0 32px' }}>
            <div style={{ fontFamily: DISP, fontSize: 'clamp(26px,3.5vw,40px)', fontWeight: 300, color: INK, marginBottom: 16 }}>
              Let's build this together.
            </div>
            <a href={`mailto:${META.contact}`} style={{ fontFamily: MONO, fontSize: 13, color: GOLD, textDecoration: 'none', letterSpacing: '0.08em', borderBottom: `1px solid ${GOLD}44`, paddingBottom: 2 }}>{META.contact}</a>
          </div>
        </Section>

        <div style={{ padding: '24px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontFamily: MONO, fontSize: 9.5, color: INK3, letterSpacing: '0.06em' }}>© {new Date().getFullYear()} Nest — Confidential</span>
          <span style={{ fontFamily: MONO, fontSize: 9.5, color: INK3, letterSpacing: '0.06em' }}>{META.date}</span>
        </div>

      </div>
    </div>
  );
}
