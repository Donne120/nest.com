import { Link } from 'react-router-dom';

// ── EDITABLE CONTENT ────────────────────────────────────────────────────────
// Edit the sections below to update the business plan. Each section has a
// title and body (plain text, supports \n for paragraphs). Tables use arrays.

const META = {
  company:  'Nest',
  subtitle: 'AI-Powered Education Platform',
  date:     'March 2026',
  version:  '1.0',
  contact:  'ngummdieudonne4@gmail.com',
};

const EXEC_SUMMARY = `Nest is an AI-powered education platform built for educators who want to scale their teaching and learners who want to actually retain what they study. Unlike generic video platforms, Nest builds a reusable knowledge base from every course — every question asked by a learner becomes a permanent answer for every future learner.

We are raising $10,000 in pre-seed funding to acquire our first 100 paying customers and lay the infrastructure foundation for scale.

Current traction: 6 beta users, 2 paying customers, $30 revenue, 33% free-to-paid conversion — achieved with zero marketing spend.`;

const PROBLEM = {
  headline: 'The problem with online learning today',
  points: [
    { title: 'Content is fragmented', desc: 'Educators juggle YouTube, Notion, Zoom, and LMS tools that don\'t talk to each other.' },
    { title: 'Questions don\'t scale', desc: 'Every cohort asks the same questions. There\'s no institutional memory.' },
    { title: 'Completion rates are terrible', desc: 'Industry average course completion rate is 3–10%. Passive video watching doesn\'t work.' },
    { title: 'No real feedback loop', desc: 'Educators don\'t know which moments confuse learners until it\'s too late.' },
  ],
};

const SOLUTION = `Nest solves these problems with a vertically integrated platform:

1. Video courses with auto-transcription — upload once, available forever.
2. Timestamped AI Q&A — learners ask questions at exact moments, AI answers using the transcript. Every answer is stored and searchable.
3. Assignments & collaboration — group projects with real-time tools.
4. Live meetings — coaching sessions scheduled and run inside Nest.
5. Certificates — auto-issued on completion, shareable and verifiable.

The result: educators teach once and the platform scales the knowledge. Learners get immediate answers without waiting for office hours.`;

const MARKET = {
  overview: `The global e-learning market is valued at $370 billion in 2026 and growing at 13% CAGR. Online education accelerated dramatically post-2020 and shows no signs of reverting.

We are targeting two initial segments:
• Independent educators & content creators who build paid courses.
• Small-to-mid organisations onboarding and upskilling employees.`,
  segments: [
    { name: 'TAM — Global E-learning', value: '$370B', note: '2026 global market' },
    { name: 'SAM — Creator & Corporate Tools', value: '$12B', note: 'Education SaaS tooling' },
    { name: 'SOM — 3-Year Reachable', value: '$240M', note: 'Based on 5,000 customers at $40 avg MRR' },
  ],
};

const PRODUCT_ROADMAP = [
  { phase: 'Phase 1 — Foundation', timeline: 'Q1–Q2 2026', items: ['Core platform (live)', 'Video hosting & transcription', 'AI Q&A engine', 'Payments & certificates'] },
  { phase: 'Phase 2 — Scale', timeline: 'Q3–Q4 2026', items: ['Mux/Cloudflare Stream integration', 'Mobile app (React Native)', 'Advanced analytics dashboard', 'SSO & team management'] },
  { phase: 'Phase 3 — Ecosystem', timeline: '2027', items: ['Marketplace for courses', 'White-label offering', 'API for LMS integrations', 'AI course generation tools'] },
];

const BUSINESS_MODEL = {
  overview: `Nest operates on a freemium SaaS model with monthly and annual subscription options. Revenue comes from subscription fees and, in the future, marketplace revenue sharing.`,
  tiers: [
    { name: 'Free',       price: '$0/mo',   seats: '10 learners',  features: '1 course, community Q&A, basic analytics' },
    { name: 'Pro',        price: '$29/mo',  seats: 'Unlimited',    features: 'Unlimited courses, full AI, advanced analytics, certificates' },
    { name: 'Business',   price: '$99/mo',  seats: 'Up to 50',     features: 'Multi-team, SSO, priority support, custom branding' },
    { name: 'Enterprise', price: 'Custom',  seats: 'Unlimited',    features: 'On-premise, SLA, dedicated onboarding, API access' },
  ],
  projections: [
    { period: 'Q2 2026', customers: 20,   mrr: '$580',   notes: 'Post-funding, first marketing campaign' },
    { period: 'Q3 2026', customers: 60,   mrr: '$1,740', notes: 'Referral flywheel + content marketing' },
    { period: 'Q4 2026', customers: 120,  mrr: '$3,480', notes: 'First enterprise customer' },
    { period: 'Q2 2027', customers: 400,  mrr: '$12,000', notes: 'Mobile app + marketplace launch' },
    { period: 'Q4 2027', customers: 1000, mrr: '$35,000', notes: 'Series A ready' },
  ],
};

const GTM = `Go-to-Market Strategy:

1. Organic content: Build in public — share Nest's journey, insights, and product updates on LinkedIn and X. Target educator communities.

2. Creator partnerships: Offer free Pro access to 20 educators with existing audiences in exchange for content and testimonials.

3. Community-led: Lean into the education creator space — cohort-based courses, bootcamp creators, independent trainers.

4. SEO & search: Target long-tail keywords around "online course platform", "AI learning tools", "course Q&A software".

5. Product-led growth: Free tier as the top of funnel. Conversion triggered by course completion milestones, AI usage limits, and learner growth.`;

const COMPETITION = {
  overview: `The e-learning tool landscape is crowded at the top (Teachable, Thinkific, Kajabi) but weak in the middle where AI and interactivity meet.`,
  table: [
    { name: 'Teachable',  ai_qa: '✗', timestamps: '✗', knowledge_base: '✗', price: '$$' },
    { name: 'Thinkific',  ai_qa: '✗', timestamps: '✗', knowledge_base: '✗', price: '$$' },
    { name: 'Kajabi',     ai_qa: 'Basic', timestamps: '✗', knowledge_base: '✗', price: '$$$' },
    { name: 'Loom',       ai_qa: '✗', timestamps: '✓', knowledge_base: '✗', price: '$' },
    { name: 'Nest',       ai_qa: '✓', timestamps: '✓', knowledge_base: '✓', price: '$' },
  ],
  moat: `Our defensible moat is the accumulated knowledge base — every answered question trains the next AI response. The longer an educator is on Nest, the more valuable their course becomes. This is a compounding data flywheel that competitors cannot easily replicate.`,
};

const TEAM = [
  {
    name: 'Ngum Dieudonne',
    role: 'Founder & CEO',
    background: 'Full-stack software engineer. Built Nest end-to-end — FastAPI backend, React frontend, Supabase storage, AI integration, payment systems, and all infrastructure. Looking for a passionate co-founder or early engineer.',
  },
];

const USE_OF_FUNDS = [
  { pct: 40, category: 'Growth & Marketing', detail: 'First 100 paying customers. Content, SEO, creator partnerships.' },
  { pct: 25, category: 'Infrastructure',     detail: 'Mux video hosting, custom domain, SSL, CDN, database scaling.' },
  { pct: 25, category: 'First Hire',         detail: 'A passionate co-founder or early engineer to accelerate development.' },
  { pct: 10, category: 'Operations',         detail: 'Legal, tooling, community events, travel.' },
];

const RISKS = [
  { risk: 'Large platform competition', mitigation: 'Focus on the AI Q&A knowledge base — our vertical moat. Go niche before broad.' },
  { risk: 'Video hosting costs', mitigation: 'Migrate to Mux/Cloudflare Stream on first funding. Already planned in roadmap.' },
  { risk: 'AI accuracy',           mitigation: 'AI answers are grounded in the video transcript — not hallucinated. Educators review flagged answers.' },
  { risk: 'Single founder',        mitigation: 'Actively seeking co-founder. Strong execution record as sole developer.' },
];

// ── Tokens ───────────────────────────────────────────────────────────────────
const BG    = '#0a0907';
const CARD  = '#161410';
const INK   = '#f0ebe2';
const INK2  = '#8a8070';
const INK3  = '#4a4238';
const RULE  = 'rgba(255,255,255,0.07)';
const GOLD  = '#c8a96e';
const GOLD2 = '#e8d4a0';
const SAGE  = '#5a8a6a';
const RUST  = '#c45c2c';
const DISP  = "'Cormorant Garamond', Georgia, serif";
const UI    = "'Syne', sans-serif";
const MONO  = "'DM Mono', monospace";

function SLabel({ children }: { children: React.ReactNode }) {
  return <div style={{ fontFamily: MONO, fontSize: 9, color: GOLD, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 12 }}>{children}</div>;
}

function H2({ children }: { children: React.ReactNode }) {
  return <h2 style={{ fontFamily: DISP, fontSize: 'clamp(26px,3.5vw,40px)', fontWeight: 400, color: INK, lineHeight: 1.2, marginBottom: 20, marginTop: 0 }}>{children}</h2>;
}

function Sec({ children, id }: { children: React.ReactNode; id?: string }) {
  return <section id={id} style={{ borderTop: `1px solid ${RULE}`, padding: 'clamp(36px,5vw,60px) 0' }}>{children}</section>;
}

const TOC_ITEMS = [
  ['exec', 'Executive Summary'],
  ['problem', 'Problem'],
  ['solution', 'Solution'],
  ['market', 'Market Analysis'],
  ['product', 'Product & Roadmap'],
  ['model', 'Business Model & Projections'],
  ['gtm', 'Go-to-Market'],
  ['competition', 'Competitive Landscape'],
  ['team', 'Team'],
  ['funds', 'Use of Funds'],
  ['risks', 'Risks & Mitigation'],
];

export default function BusinessPlanPage() {
  return (
    <div style={{ background: BG, color: INK, fontFamily: UI, fontSize: 15, lineHeight: 1.65, minHeight: '100vh' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Syne:wght@400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap');
        ::-webkit-scrollbar{width:5px}
        ::-webkit-scrollbar-track{background:${BG}}
        ::-webkit-scrollbar-thumb{background:${INK3};border-radius:3px}
        .bp-table td, .bp-table th { padding: 10px 16px; font-size: 13px; border-bottom: 1px solid ${RULE}; }
        .bp-table th { font-family: ${MONO}; font-size: 9px; color: ${GOLD}; letter-spacing: 0.16em; text-transform: uppercase; font-weight: 400; background: #111009; }
        .bp-table { width: 100%; border-collapse: collapse; border: 1px solid ${RULE}; border-radius: 8px; overflow: hidden; }
      `}</style>

      {/* Nav */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 100,
        height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 clamp(16px,4vw,48px)',
        borderBottom: `1px solid ${RULE}`,
        background: 'rgba(10,9,7,0.95)', backdropFilter: 'blur(20px)',
        fontFamily: UI,
      }}>
        <Link to="/" style={{ fontFamily: MONO, fontSize: 10, color: INK3, textDecoration: 'none', letterSpacing: '0.1em' }}>← nest.com</Link>
        <span style={{ fontFamily: MONO, fontSize: 9, color: GOLD, letterSpacing: '0.2em', textTransform: 'uppercase' }}>Business Plan</span>
        <button onClick={() => window.print()} style={{ fontFamily: MONO, fontSize: 9, color: INK3, background: 'none', border: `1px solid ${RULE}`, borderRadius: 6, padding: '6px 14px', cursor: 'pointer', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Print / PDF</button>
      </header>

      <div style={{ maxWidth: 860, margin: '0 auto', padding: '0 clamp(16px,4vw,48px)' }}>

        {/* Cover */}
        <div style={{ padding: 'clamp(56px,8vw,100px) 0 clamp(40px,5vw,64px)' }}>
          <SLabel>Confidential Business Plan · {META.date}</SLabel>
          <h1 style={{ fontFamily: DISP, fontSize: 'clamp(48px,7vw,80px)', fontWeight: 300, lineHeight: 1.0, letterSpacing: '-0.02em', color: INK, margin: '0 0 16px' }}>{META.company}</h1>
          <p style={{ fontFamily: DISP, fontSize: 'clamp(18px,2.5vw,28px)', color: GOLD2, fontStyle: 'italic', fontWeight: 300, margin: '0 0 32px' }}>{META.subtitle}</p>
          <a href={`mailto:${META.contact}`} style={{ fontFamily: MONO, fontSize: 11, color: INK2, textDecoration: 'none', letterSpacing: '0.08em' }}>{META.contact}</a>
        </div>

        {/* TOC */}
        <nav style={{ background: CARD, border: `1px solid ${RULE}`, borderRadius: 12, padding: '20px 24px', marginBottom: 8 }}>
          <div style={{ fontFamily: MONO, fontSize: 9, color: GOLD, letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 14 }}>Table of Contents</div>
          <div style={{ columns: 2, gap: 24 }}>
            {TOC_ITEMS.map(([id, label]) => (
              <a key={id} href={`#${id}`} style={{ display: 'block', fontSize: 13, color: INK2, textDecoration: 'none', padding: '3px 0', transition: 'color 0.2s' }}
                onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = INK)}
                onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = INK2)}
              >{label}</a>
            ))}
          </div>
        </nav>

        {/* Exec Summary */}
        <Sec id="exec">
          <SLabel>01 — Executive Summary</SLabel>
          <H2>The full picture in 60 seconds.</H2>
          <p style={{ fontSize: 15, color: INK2, lineHeight: 1.85, whiteSpace: 'pre-line' }}>{EXEC_SUMMARY}</p>
        </Sec>

        {/* Problem */}
        <Sec id="problem">
          <SLabel>02 — Problem</SLabel>
          <H2>{PROBLEM.headline}</H2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 1 }}>
            {PROBLEM.points.map(p => (
              <div key={p.title} style={{ background: CARD, padding: '20px 24px', borderRadius: 2 }}>
                <div style={{ fontFamily: UI, fontSize: 13, fontWeight: 700, color: RUST, marginBottom: 8 }}>{p.title}</div>
                <div style={{ fontSize: 13.5, color: INK2, lineHeight: 1.65 }}>{p.desc}</div>
              </div>
            ))}
          </div>
        </Sec>

        {/* Solution */}
        <Sec id="solution">
          <SLabel>03 — Solution</SLabel>
          <H2>One platform that builds knowledge, not just content.</H2>
          <p style={{ fontSize: 15, color: INK2, lineHeight: 1.85, whiteSpace: 'pre-line' }}>{SOLUTION}</p>
        </Sec>

        {/* Market */}
        <Sec id="market">
          <SLabel>04 — Market Analysis</SLabel>
          <H2>A $370B market with a missing layer.</H2>
          <p style={{ fontSize: 15, color: INK2, lineHeight: 1.85, marginBottom: 32 }}>{MARKET.overview}</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 1 }}>
            {MARKET.segments.map(s => (
              <div key={s.name} style={{ background: CARD, padding: '24px', textAlign: 'center' }}>
                <div style={{ fontFamily: DISP, fontSize: 36, fontWeight: 600, color: GOLD, lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontFamily: UI, fontSize: 12, fontWeight: 700, color: INK, margin: '8px 0 4px' }}>{s.name}</div>
                <div style={{ fontFamily: MONO, fontSize: 9.5, color: INK3, letterSpacing: '0.08em' }}>{s.note}</div>
              </div>
            ))}
          </div>
        </Sec>

        {/* Product */}
        <Sec id="product">
          <SLabel>05 — Product & Roadmap</SLabel>
          <H2>Built. Shipped. Growing.</H2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1, marginTop: 24 }}>
            {PRODUCT_ROADMAP.map(r => (
              <div key={r.phase} style={{ background: CARD, padding: '20px 24px', display: 'flex', gap: 24, alignItems: 'flex-start' }}>
                <div style={{ minWidth: 160 }}>
                  <div style={{ fontFamily: UI, fontSize: 13, fontWeight: 700, color: GOLD2, marginBottom: 4 }}>{r.phase}</div>
                  <div style={{ fontFamily: MONO, fontSize: 9.5, color: INK3, letterSpacing: '0.08em' }}>{r.timeline}</div>
                </div>
                <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {r.items.map(item => (
                    <li key={item} style={{ fontSize: 13, color: INK2, display: 'flex', alignItems: 'baseline', gap: 8 }}>
                      <span style={{ color: SAGE, fontSize: 10 }}>✓</span> {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Sec>

        {/* Business Model */}
        <Sec id="model">
          <SLabel>06 — Business Model & Projections</SLabel>
          <H2>Freemium SaaS with a clear upgrade path.</H2>
          <p style={{ fontSize: 15, color: INK2, lineHeight: 1.8, marginBottom: 32 }}>{BUSINESS_MODEL.overview}</p>

          <div style={{ marginBottom: 40 }}>
            <div style={{ fontFamily: MONO, fontSize: 9, color: GOLD, letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 16 }}>Pricing tiers</div>
            <table className="bp-table">
              <thead><tr>
                <th>Tier</th><th>Price</th><th>Seats</th><th>Highlights</th>
              </tr></thead>
              <tbody>
                {BUSINESS_MODEL.tiers.map(t => (
                  <tr key={t.name}>
                    <td style={{ fontWeight: 700, color: INK }}>{t.name}</td>
                    <td style={{ fontFamily: MONO, color: GOLD }}>{t.price}</td>
                    <td style={{ color: INK2 }}>{t.seats}</td>
                    <td style={{ color: INK2 }}>{t.features}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div>
            <div style={{ fontFamily: MONO, fontSize: 9, color: GOLD, letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 16 }}>Revenue projections</div>
            <table className="bp-table">
              <thead><tr>
                <th>Period</th><th>Customers</th><th>MRR</th><th>Notes</th>
              </tr></thead>
              <tbody>
                {BUSINESS_MODEL.projections.map(p => (
                  <tr key={p.period}>
                    <td style={{ fontFamily: MONO, color: INK }}>{p.period}</td>
                    <td style={{ color: INK2 }}>{p.customers}</td>
                    <td style={{ fontFamily: MONO, color: GOLD }}>{p.mrr}</td>
                    <td style={{ color: INK2 }}>{p.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Sec>

        {/* GTM */}
        <Sec id="gtm">
          <SLabel>07 — Go-to-Market</SLabel>
          <H2>Zero paid ads. Community first.</H2>
          <p style={{ fontSize: 15, color: INK2, lineHeight: 1.85, whiteSpace: 'pre-line' }}>{GTM}</p>
        </Sec>

        {/* Competition */}
        <Sec id="competition">
          <SLabel>08 — Competitive Landscape</SLabel>
          <H2>We're not a better Teachable. We're something new.</H2>
          <p style={{ fontSize: 15, color: INK2, lineHeight: 1.8, marginBottom: 32 }}>{COMPETITION.overview}</p>
          <table className="bp-table" style={{ marginBottom: 32 }}>
            <thead><tr>
              <th>Platform</th><th>AI Q&A</th><th>Timestamps</th><th>Knowledge Base</th><th>Price</th>
            </tr></thead>
            <tbody>
              {COMPETITION.table.map(c => (
                <tr key={c.name}>
                  <td style={{ fontWeight: 700, color: c.name === 'Nest' ? GOLD : INK }}>{c.name}</td>
                  <td style={{ color: c.ai_qa === '✓' ? SAGE : c.ai_qa === '✗' ? RUST : INK2 }}>{c.ai_qa}</td>
                  <td style={{ color: c.timestamps === '✓' ? SAGE : RUST }}>{c.timestamps}</td>
                  <td style={{ color: c.knowledge_base === '✓' ? SAGE : RUST }}>{c.knowledge_base}</td>
                  <td style={{ fontFamily: MONO, color: INK2 }}>{c.price}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ background: CARD, border: `1px solid ${GOLD}22`, borderRadius: 8, padding: '20px 24px' }}>
            <div style={{ fontFamily: MONO, fontSize: 9, color: GOLD, letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 10 }}>Our moat</div>
            <p style={{ fontSize: 14, color: INK2, lineHeight: 1.7, margin: 0 }}>{COMPETITION.moat}</p>
          </div>
        </Sec>

        {/* Team */}
        <Sec id="team">
          <SLabel>09 — Team</SLabel>
          <H2>One builder. Full stack.</H2>
          {TEAM.map(t => (
            <div key={t.name} style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', flexShrink: 0, background: `linear-gradient(135deg, ${GOLD}33, ${GOLD2}22)`, border: `1px solid ${GOLD}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: DISP, fontSize: 26, color: GOLD }}>{t.name[0]}</div>
              <div>
                <div style={{ fontFamily: UI, fontSize: 16, fontWeight: 700, color: INK }}>{t.name}</div>
                <div style={{ fontFamily: MONO, fontSize: 10, color: GOLD, letterSpacing: '0.12em', textTransform: 'uppercase', margin: '4px 0 10px' }}>{t.role}</div>
                <div style={{ fontSize: 14, color: INK2, lineHeight: 1.7 }}>{t.background}</div>
              </div>
            </div>
          ))}
        </Sec>

        {/* Use of Funds */}
        <Sec id="funds">
          <SLabel>10 — Use of Funds</SLabel>
          <H2>$10,000 pre-seed. Four clear categories.</H2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 24 }}>
            {USE_OF_FUNDS.map(u => (
              <div key={u.category} style={{ background: CARD, padding: '20px 24px', display: 'grid', gridTemplateColumns: '60px 160px 1fr', alignItems: 'center', gap: 16 }}>
                <span style={{ fontFamily: DISP, fontSize: 28, fontWeight: 600, color: GOLD, lineHeight: 1 }}>{u.pct}%</span>
                <span style={{ fontFamily: UI, fontSize: 13, fontWeight: 700, color: INK }}>{u.category}</span>
                <span style={{ fontSize: 13, color: INK2 }}>{u.detail}</span>
              </div>
            ))}
          </div>
        </Sec>

        {/* Risks */}
        <Sec id="risks">
          <SLabel>11 — Risks & Mitigation</SLabel>
          <H2>We know the risks. Here's how we handle them.</H2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {RISKS.map(r => (
              <div key={r.risk} style={{ background: CARD, padding: '18px 24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <div style={{ fontFamily: MONO, fontSize: 8, color: RUST, letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 6 }}>Risk</div>
                  <div style={{ fontSize: 14, color: INK2 }}>{r.risk}</div>
                </div>
                <div>
                  <div style={{ fontFamily: MONO, fontSize: 8, color: SAGE, letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 6 }}>Mitigation</div>
                  <div style={{ fontSize: 14, color: INK2 }}>{r.mitigation}</div>
                </div>
              </div>
            ))}
          </div>
        </Sec>

        <div style={{ borderTop: `1px solid ${RULE}`, padding: '24px 0', display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontFamily: MONO, fontSize: 9.5, color: INK3 }}>© {new Date().getFullYear()} {META.company} — Confidential</span>
          <span style={{ fontFamily: MONO, fontSize: 9.5, color: INK3 }}>v{META.version} · {META.date}</span>
        </div>
      </div>
    </div>
  );
}
