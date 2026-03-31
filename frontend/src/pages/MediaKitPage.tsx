import { Link } from 'react-router-dom';
import { useState } from 'react';

// ── EDITABLE CONTENT ────────────────────────────────────────────────────────
const META = {
  company:    'Nest',
  tagline:    'Knowledge that moves the world forward.',
  website:    'https://nest-com.vercel.app',
  email:      'ngummdieudonne4@gmail.com',
  twitter:    '@NestFledge',
  linkedin:   'linkedin.com/company/nest-fledge',
  lastUpdated:'March 2026',
};

const BRAND_COLORS = [
  { name: 'Midnight',  hex: '#0a0907', role: 'Background — the canvas everything lives on.' },
  { name: 'Gold',      hex: '#c8a96e', role: 'Primary accent — CTAs, highlights, brand elements.' },
  { name: 'Gold Light',hex: '#e8d4a0', role: 'Secondary accent — headings, subtle warmth.' },
  { name: 'Ink',       hex: '#f0ebe2', role: 'Primary text — warm white, not pure white.' },
  { name: 'Ink Mid',   hex: '#8a8070', role: 'Secondary text — captions, descriptions.' },
  { name: 'Ink Faint', hex: '#4a4238', role: 'Tertiary text — rules, dividers.' },
  { name: 'Sage',      hex: '#5a8a6a', role: 'Positive states — success, confirmation.' },
  { name: 'Rust',      hex: '#c45c2c', role: 'Alert states — errors, warnings.' },
];

const TYPOGRAPHY = [
  { name: 'Cormorant Garamond', role: 'Display & headlines', weights: '300 Light, 400 Regular, 600 SemiBold', note: 'Used for all large headings, titles, and editorial moments. Italic for emphasis.' },
  { name: 'Syne', role: 'UI & body', weights: '400–800', note: 'Used for navigation, body text, buttons, and all interface elements.' },
  { name: 'DM Mono', role: 'Data & labels', weights: '400 Regular, 500 Medium', note: 'Used for metadata, stats, badges, monospaced content, and code.' },
];

const VOICE = [
  { label: 'Confident, not arrogant',    desc: 'We know what we\'ve built works. We show it through results, not claims.' },
  { label: 'Warm, not casual',            desc: 'We care about educators and learners. We don\'t use jargon or buzzwords.' },
  { label: 'Precise, not verbose',        desc: 'Every word earns its place. Short sentences. Clear structure.' },
  { label: 'Ambitious, not breathless',   desc: 'We\'re building for the long term. Bold vision, grounded execution.' },
];

const DONT = [
  'Alter the brand colours or use gradients not in the palette',
  'Use the Nest logo on backgrounds that reduce contrast',
  'Abbreviate the company name (not "NST", not "N.")',
  'Use stock photography that feels generic or inauthentic',
  'Describe Nest as an "LMS" — it\'s an AI knowledge platform',
  'Use competing platform names in marketing comparisons without prior approval',
];

const BOILERPLATE = `Nest is an AI-powered education platform that enables educators to build video courses and learners to retain knowledge through timestamped AI Q&A. Every question asked on Nest becomes a permanent answer for the next learner — creating a living knowledge base that grows with every cohort. Founded in 2026, Nest is building the infrastructure for knowledge that moves the world forward.`;

const SHORT_DESCRIPTION = `Nest is an AI-powered learning platform where video courses build a living knowledge base. Learners ask questions at exact timestamps; AI answers using the actual transcript — and every answer is saved for every future learner.`;

// ── Tokens ───────────────────────────────────────────────────────────────────
const BG    = '#0a0907';
const CARD  = '#161410';
const INK   = '#f0ebe2';
const INK2  = '#8a8070';
const INK3  = '#4a4238';
const RULE  = 'rgba(255,255,255,0.07)';
const GOLD  = '#c8a96e';
const GOLD2 = '#e8d4a0';
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

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1800); }}
      style={{ fontFamily: MONO, fontSize: 9, color: copied ? '#5a8a6a' : INK3, background: 'none', border: `1px solid ${RULE}`, borderRadius: 6, padding: '6px 12px', cursor: 'pointer', letterSpacing: '0.1em', textTransform: 'uppercase', transition: 'color 0.2s' }}
    >{copied ? 'Copied ✓' : 'Copy'}</button>
  );
}

export default function MediaKitPage() {
  return (
    <div style={{ background: BG, color: INK, fontFamily: UI, fontSize: 15, lineHeight: 1.65, minHeight: '100vh' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Syne:wght@400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap');
        ::-webkit-scrollbar{width:5px}
        ::-webkit-scrollbar-track{background:${BG}}
        ::-webkit-scrollbar-thumb{background:${INK3};border-radius:3px}
      `}</style>

      {/* Nav */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 100,
        height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 clamp(16px,4vw,48px)',
        borderBottom: `1px solid ${RULE}`,
        background: 'rgba(10,9,7,0.95)', backdropFilter: 'blur(20px)',
      }}>
        <Link to="/" style={{ fontFamily: MONO, fontSize: 10, color: INK3, textDecoration: 'none', letterSpacing: '0.1em' }}>← nest.com</Link>
        <span style={{ fontFamily: MONO, fontSize: 9, color: GOLD, letterSpacing: '0.2em', textTransform: 'uppercase' }}>Media Kit</span>
        <span style={{ fontFamily: MONO, fontSize: 9, color: INK3, letterSpacing: '0.06em' }}>{META.lastUpdated}</span>
      </header>

      <div style={{ maxWidth: 860, margin: '0 auto', padding: '0 clamp(16px,4vw,48px)' }}>

        {/* Cover */}
        <div style={{ padding: 'clamp(56px,8vw,100px) 0 clamp(40px,5vw,64px)' }}>
          <SLabel>Press & Partner Resources</SLabel>
          <h1 style={{ fontFamily: DISP, fontSize: 'clamp(48px,7vw,80px)', fontWeight: 300, lineHeight: 1.0, letterSpacing: '-0.02em', color: INK, margin: '0 0 16px' }}>Media Kit</h1>
          <p style={{ fontFamily: DISP, fontSize: 'clamp(18px,2.5vw,26px)', color: GOLD2, fontStyle: 'italic', fontWeight: 300, margin: '0 0 24px' }}>{META.tagline}</p>
          <p style={{ fontSize: 14, color: INK2, maxWidth: 600, lineHeight: 1.7 }}>
            Everything you need to write about, feature, or partner with Nest.
            For interviews and custom assets, reach us at{' '}
            <a href={`mailto:${META.email}`} style={{ color: GOLD, textDecoration: 'none' }}>{META.email}</a>
          </p>
        </div>

        {/* Logo / Brand Mark */}
        <Sec id="logo">
          <SLabel>Logo & Brand Mark</SLabel>
          <H2>The Nest mark.</H2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 1 }}>
            {/* Dark bg */}
            <div style={{ background: '#0a0907', border: `1px solid ${RULE}`, borderRadius: 8, padding: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 40, height: 40, border: `1.5px solid rgba(200,169,110,0.4)`, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800, color: GOLD, fontFamily: UI }}>N</div>
                <span style={{ fontFamily: DISP, fontSize: 30, fontWeight: 600, color: GOLD2, letterSpacing: '0.01em' }}>Nest</span>
              </div>
              <span style={{ fontFamily: MONO, fontSize: 8, color: INK3, letterSpacing: '0.16em', textTransform: 'uppercase' }}>Dark background</span>
            </div>
            {/* Light bg */}
            <div style={{ background: '#f0ebe2', border: `1px solid ${RULE}`, borderRadius: 8, padding: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 40, height: 40, border: `1.5px solid rgba(10,9,7,0.2)`, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800, color: '#0a0907', fontFamily: UI }}>N</div>
                <span style={{ fontFamily: DISP, fontSize: 30, fontWeight: 600, color: '#0a0907', letterSpacing: '0.01em' }}>Nest</span>
              </div>
              <span style={{ fontFamily: MONO, fontSize: 8, color: '#4a4238', letterSpacing: '0.16em', textTransform: 'uppercase' }}>Light background</span>
            </div>
            {/* Icon only */}
            <div style={{ background: CARD, border: `1px solid ${RULE}`, borderRadius: 8, padding: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
              <div style={{ width: 64, height: 64, border: `1.5px solid rgba(200,169,110,0.4)`, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 800, color: GOLD, fontFamily: UI }}>N</div>
              <span style={{ fontFamily: MONO, fontSize: 8, color: INK3, letterSpacing: '0.16em', textTransform: 'uppercase' }}>Icon only</span>
            </div>
          </div>
          <p style={{ fontSize: 13, color: INK3, marginTop: 16, fontStyle: 'italic' }}>
            SVG logo files available on request — email {META.email}
          </p>
        </Sec>

        {/* Colors */}
        <Sec id="colors">
          <SLabel>Brand Colours</SLabel>
          <H2>Dark, warm, and unmistakably Nest.</H2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 1 }}>
            {BRAND_COLORS.map(c => (
              <div key={c.hex} style={{ background: CARD, border: `1px solid ${RULE}`, borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ height: 64, background: c.hex, borderBottom: `1px solid ${RULE}` }} />
                <div style={{ padding: '12px 16px' }}>
                  <div style={{ fontFamily: UI, fontSize: 12, fontWeight: 700, color: INK, marginBottom: 2 }}>{c.name}</div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontFamily: MONO, fontSize: 10, color: GOLD }}>{c.hex}</span>
                    <CopyButton text={c.hex} />
                  </div>
                  <div style={{ fontSize: 11, color: INK3, lineHeight: 1.5 }}>{c.role}</div>
                </div>
              </div>
            ))}
          </div>
        </Sec>

        {/* Typography */}
        <Sec id="typography">
          <SLabel>Typography</SLabel>
          <H2>Three typefaces. One voice.</H2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {TYPOGRAPHY.map(t => (
              <div key={t.name} style={{ background: CARD, padding: '24px 28px', display: 'grid', gridTemplateColumns: '200px 1fr', gap: 24, alignItems: 'start' }}>
                <div>
                  <div style={{ fontSize: 22, fontFamily: t.name === 'Cormorant Garamond' ? DISP : t.name === 'DM Mono' ? MONO : UI, color: INK, marginBottom: 6 }}>{t.name}</div>
                  <div style={{ fontFamily: MONO, fontSize: 9, color: GOLD, letterSpacing: '0.12em', textTransform: 'uppercase' }}>{t.role}</div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: INK2, marginBottom: 6 }}>Weights: <span style={{ color: INK }}>{t.weights}</span></div>
                  <div style={{ fontSize: 13, color: INK3, lineHeight: 1.6 }}>{t.note}</div>
                </div>
              </div>
            ))}
          </div>
        </Sec>

        {/* Voice */}
        <Sec id="voice">
          <SLabel>Brand Voice</SLabel>
          <H2>How Nest speaks.</H2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 1, marginBottom: 32 }}>
            {VOICE.map(v => (
              <div key={v.label} style={{ background: CARD, padding: '20px 24px' }}>
                <div style={{ fontFamily: UI, fontSize: 13, fontWeight: 700, color: GOLD2, marginBottom: 8 }}>{v.label}</div>
                <div style={{ fontSize: 13.5, color: INK2, lineHeight: 1.65 }}>{v.desc}</div>
              </div>
            ))}
          </div>
          <div style={{ background: '#161410', border: `1px solid ${RULE}`, borderRadius: 8, padding: '20px 24px' }}>
            <div style={{ fontFamily: MONO, fontSize: 9, color: '#c45c2c', letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 12 }}>Please don't</div>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {DONT.map(d => (
                <li key={d} style={{ fontSize: 13, color: INK3, display: 'flex', gap: 10, alignItems: 'baseline' }}>
                  <span style={{ color: '#c45c2c', fontSize: 11, flexShrink: 0 }}>✗</span>{d}
                </li>
              ))}
            </ul>
          </div>
        </Sec>

        {/* Boilerplate */}
        <Sec id="copy">
          <SLabel>Approved Copy</SLabel>
          <H2>Use these descriptions verbatim.</H2>

          <div style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ fontFamily: MONO, fontSize: 9, color: GOLD, letterSpacing: '0.16em', textTransform: 'uppercase' }}>Long description (press bio)</div>
              <CopyButton text={BOILERPLATE} />
            </div>
            <div style={{ background: CARD, border: `1px solid ${RULE}`, borderRadius: 8, padding: '20px 24px', fontSize: 14, color: INK2, lineHeight: 1.8 }}>{BOILERPLATE}</div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ fontFamily: MONO, fontSize: 9, color: GOLD, letterSpacing: '0.16em', textTransform: 'uppercase' }}>Short description (social bios)</div>
              <CopyButton text={SHORT_DESCRIPTION} />
            </div>
            <div style={{ background: CARD, border: `1px solid ${RULE}`, borderRadius: 8, padding: '20px 24px', fontSize: 14, color: INK2, lineHeight: 1.8 }}>{SHORT_DESCRIPTION}</div>
          </div>
        </Sec>

        {/* Contact */}
        <Sec id="contact">
          <SLabel>Press Contact</SLabel>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 1 }}>
            {[
              { label: 'Email', value: META.email, href: `mailto:${META.email}` },
              { label: 'Website', value: META.website, href: META.website },
              { label: 'Twitter / X', value: META.twitter, href: '#' },
              { label: 'LinkedIn', value: META.linkedin, href: '#' },
            ].map(c => (
              <div key={c.label} style={{ background: CARD, padding: '20px 24px' }}>
                <div style={{ fontFamily: MONO, fontSize: 9, color: GOLD, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 8 }}>{c.label}</div>
                <a href={c.href} style={{ fontSize: 13, color: INK2, textDecoration: 'none' }}
                  onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = INK)}
                  onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = INK2)}
                >{c.value}</a>
              </div>
            ))}
          </div>
        </Sec>

        <div style={{ borderTop: `1px solid ${RULE}`, padding: '24px 0', display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontFamily: MONO, fontSize: 9.5, color: INK3 }}>© {new Date().getFullYear()} Nest. All rights reserved.</span>
          <span style={{ fontFamily: MONO, fontSize: 9.5, color: INK3 }}>{META.lastUpdated}</span>
        </div>
      </div>
    </div>
  );
}
