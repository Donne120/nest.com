import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';

// ── Tokens ──────────────────────────────────────────────────────────────────
const BG     = '#0a0907';
const CARD   = '#161410';
const SURF   = '#111009';
const INK    = '#f0ebe2';
const INK2   = '#8a8070';
const INK3   = '#4a4238';
const RULE   = 'rgba(255,255,255,0.07)';
const GOLD   = '#c8a96e';
const GOLD2  = '#e8d4a0';
const SAGE   = '#5a8a6a';
const RUST   = '#c45c2c';
const DISP   = "'Cormorant Garamond', Georgia, serif";
const UI     = "'Syne', sans-serif";
const MONO   = "'DM Mono', monospace";

const TOTAL_SLIDES = 12;

// ── Helpers ─────────────────────────────────────────────────────────────────
function Label({ children, color = GOLD }: { children: string; color?: string }) {
  return (
    <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
      <span style={{ width: 24, height: 1, background: color, opacity: 0.5 }} />
      {children}
    </div>
  );
}

function H1({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <h1 style={{ fontFamily: DISP, fontSize: 'clamp(44px,5.5vw,80px)', fontWeight: 300, lineHeight: 0.95, letterSpacing: '-0.025em', color: INK, margin: 0, ...style }}>
      {children}
    </h1>
  );
}

function H2({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <h2 style={{ fontFamily: DISP, fontSize: 'clamp(32px,4vw,58px)', fontWeight: 300, lineHeight: 1.05, letterSpacing: '-0.02em', color: INK, margin: 0, ...style }}>
      {children}
    </h2>
  );
}

function Body({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <p style={{ fontFamily: UI, fontSize: 'clamp(14px,1.4vw,17px)', color: INK2, lineHeight: 1.75, margin: 0, ...style }}>
      {children}
    </p>
  );
}

function Stat({ value, label, sub }: { value: string; label: string; sub?: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '28px 20px', borderRight: `1px solid ${RULE}` }}>
      <div style={{ fontFamily: DISP, fontSize: 'clamp(40px,5vw,64px)', fontWeight: 300, color: GOLD2, lineHeight: 1, letterSpacing: '-0.03em', marginBottom: 8 }}>{value}</div>
      <div style={{ fontFamily: UI, fontSize: 13, fontWeight: 700, color: INK, marginBottom: 4 }}>{label}</div>
      {sub && <div style={{ fontFamily: MONO, fontSize: 10, color: INK3, letterSpacing: '0.1em' }}>{sub}</div>}
    </div>
  );
}

function Pill({ children, color = GOLD }: { children: string; color?: string }) {
  return (
    <span style={{
      fontFamily: MONO, fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase',
      color, border: `1px solid ${color}40`, background: `${color}12`,
      padding: '5px 12px', borderRadius: 100,
    }}>{children}</span>
  );
}

function Check({ text, accent = GOLD }: { text: string; accent?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
      <div style={{ width: 20, height: 20, borderRadius: '50%', background: `${accent}18`, border: `1px solid ${accent}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
        <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke={accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="2 6 5 9 10 3"/></svg>
      </div>
      <span style={{ fontFamily: UI, fontSize: 14, color: INK2, lineHeight: 1.5 }}>{text}</span>
    </div>
  );
}

function SlideWrap({ children, center = false }: { children: React.ReactNode; center?: boolean }) {
  return (
    <div style={{
      width: '100%', height: '100%',
      display: 'flex', flexDirection: 'column',
      justifyContent: center ? 'center' : 'flex-start',
      alignItems: center ? 'center' : 'flex-start',
      padding: 'clamp(40px,6vw,80px) clamp(40px,7vw,100px)',
      textAlign: center ? 'center' : 'left',
      position: 'relative', overflow: 'hidden',
      boxSizing: 'border-box',
    }}>
      {children}
    </div>
  );
}

function Glow({ x = '50%', y = '40%', color = GOLD, opacity = 0.06 }) {
  return (
    <div style={{
      position: 'absolute', width: 800, height: 600,
      top: y, left: x, transform: 'translate(-50%,-50%)',
      background: `radial-gradient(ellipse, ${color}${Math.round(opacity * 255).toString(16).padStart(2, '0')} 0%, transparent 70%)`,
      pointerEvents: 'none', zIndex: 0,
    }} />
  );
}

// ── Slides ───────────────────────────────────────────────────────────────────

function Slide01_Cover() {
  return (
    <SlideWrap center>
      <Glow x="50%" y="50%" color={GOLD} opacity={0.07} />
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 28 }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 8 }}>
          <div style={{ width: 52, height: 52, border: `1.5px solid ${GOLD}66`, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 800, color: GOLD, fontFamily: UI }}>N</div>
          <span style={{ fontFamily: DISP, fontSize: 48, fontWeight: 600, color: GOLD2, letterSpacing: '0.01em' }}>Nest</span>
        </div>

        <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: GOLD, border: `1px solid ${GOLD}33`, padding: '7px 20px', borderRadius: 100 }}>
          Pre-Seed · $10,000 · 2026
        </div>

        <H1 style={{ textAlign: 'center', maxWidth: 700, fontSize: 'clamp(48px,6vw,88px)' }}>
          <em style={{ fontStyle: 'italic', color: GOLD }}>Knowledge</em>
          <br />
          <span style={{ fontWeight: 600 }}>that moves</span>
          <br />
          <span style={{ color: INK2, fontWeight: 300, fontSize: '70%' }}>the world forward.</span>
        </H1>

        <Body style={{ maxWidth: 480, textAlign: 'center', fontSize: 16 }}>
          The AI-powered education platform built for the next generation of creators and learners — with mobile payments, live AI Q&A, and everything in between.
        </Body>

        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center', marginTop: 8 }}>
          <div style={{ fontFamily: UI, fontSize: 13, color: INK2 }}>Ngum Dieudonne · Founder &amp; CEO</div>
          <span style={{ color: INK3 }}>·</span>
          <a href="https://nest-com.vercel.app" style={{ fontFamily: MONO, fontSize: 12, color: GOLD, textDecoration: 'none', letterSpacing: '0.06em' }}>nest-com.vercel.app</a>
        </div>
      </div>
    </SlideWrap>
  );
}

function Slide02_Problem() {
  const problems = [
    {
      icon: '📚',
      title: '300M+ learners, no access',
      body: 'Hundreds of millions of people in emerging markets want quality education but can\'t access or afford platforms built for the West.',
    },
    {
      icon: '💳',
      title: 'Payment walls block everyone',
      body: 'Udemy, Teachable, Coursera — all require a credit card. Over 60% of people in Africa are unbanked or underbanked. They get left out.',
    },
    {
      icon: '🎙️',
      title: 'Educators can\'t monetize locally',
      body: 'Brilliant professors, coaches, and trainers have knowledge worth sharing. But no tool lets them build, sell, and get paid in their local currency.',
    },
  ];

  return (
    <SlideWrap>
      <Glow x="80%" y="30%" color={RUST} opacity={0.05} />
      <div style={{ position: 'relative', zIndex: 1, width: '100%' }}>
        <Label color={RUST}>The Problem</Label>
        <H2 style={{ marginBottom: 12 }}>Education is the world's<br /><em style={{ fontStyle: 'italic', color: RUST }}>most unequal market.</em></H2>
        <Body style={{ marginBottom: 48, maxWidth: 520 }}>
          Billions of people want to learn and grow. The tools exist. But they were never built for them.
        </Body>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 1, background: RULE, border: `1px solid ${RULE}`, borderRadius: 8, overflow: 'hidden' }}>
          {problems.map(p => (
            <div key={p.title} style={{ background: CARD, padding: '32px 28px' }}>
              <div style={{ fontSize: 28, marginBottom: 16 }}>{p.icon}</div>
              <div style={{ fontFamily: UI, fontSize: 15, fontWeight: 700, color: INK, marginBottom: 10 }}>{p.title}</div>
              <div style={{ fontFamily: UI, fontSize: 13, color: INK2, lineHeight: 1.65 }}>{p.body}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 32, marginTop: 32, flexWrap: 'wrap' }}>
          {[['$605B', 'EdTech market by 2027'],['1.1B', 'Young Africans by 2030'],['<5%', 'Served by current platforms']].map(([v, l]) => (
            <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontFamily: DISP, fontSize: 28, fontWeight: 300, color: RUST }}>{v}</span>
              <span style={{ fontFamily: UI, fontSize: 12, color: INK3, maxWidth: 100, lineHeight: 1.4 }}>{l}</span>
            </div>
          ))}
        </div>
      </div>
    </SlideWrap>
  );
}

function Slide03_Solution() {
  return (
    <SlideWrap>
      <Glow x="70%" y="50%" color={GOLD} opacity={0.07} />
      <div style={{ position: 'relative', zIndex: 1, width: '100%' }}>
        <Label>The Solution</Label>
        <H2 style={{ marginBottom: 12 }}>
          Introducing <em style={{ fontStyle: 'italic', color: GOLD }}>Nest.</em>
        </H2>
        <Body style={{ marginBottom: 48, maxWidth: 560 }}>
          An end-to-end education platform where anyone can create courses, sell them with local payment methods, and deliver a world-class AI-powered learning experience.
        </Body>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20 }}>
          {[
            { icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a10 10 0 110 20A10 10 0 0112 2z"/><path d="M9.5 9a2.5 2.5 0 015 0c0 2.5-2.5 3-2.5 5M12 18h.01"/></svg>, title: 'AI-Native', body: 'Every video is transcribed and searchable. Learners ask questions, AI answers instantly from the lecture content.' },
            { icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={SAGE} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>, title: 'Mobile Payments', body: 'Accept MoMo, bank transfers, and local methods. No credit card. No PayPal. Pay how you live.' },
            { icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={GOLD2} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>, title: 'Built for Creators', body: 'Full course builder, analytics, certificates, assignments, 1-on-1 meetings — everything in one platform.' },
          ].map(s => (
            <div key={s.title} style={{ background: CARD, border: `1px solid ${RULE}`, borderRadius: 10, padding: '32px 28px' }}>
              <div style={{ marginBottom: 20 }}>{s.icon}</div>
              <div style={{ fontFamily: UI, fontSize: 16, fontWeight: 700, color: INK, marginBottom: 10 }}>{s.title}</div>
              <div style={{ fontFamily: UI, fontSize: 13.5, color: INK2, lineHeight: 1.65 }}>{s.body}</div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 32, padding: '20px 28px', background: `${GOLD}0a`, border: `1px solid ${GOLD}22`, borderRadius: 8, display: 'inline-block' }}>
          <span style={{ fontFamily: DISP, fontSize: 22, fontStyle: 'italic', color: GOLD2 }}>
            "Think Teachable + Udemy, rebuilt for the next billion learners."
          </span>
        </div>
      </div>
    </SlideWrap>
  );
}

function Slide04_Product() {
  const features = [
    ['Video Courses', 'Upload, organize, publish'],
    ['AI Q&A', 'Questions answered from transcript'],
    ['Auto-Transcription', 'Every video, every word indexed'],
    ['Quiz Engine', 'MCQ, T/F, short answer'],
    ['Assignments', 'Create, submit, grade'],
    ['Progress Tracking', 'Per-learner, per-module'],
    ['Certificates', 'Auto-issued on completion'],
    ['Analytics Dashboard', 'Completion, scores, engagement'],
    ['1-on-1 Meetings', 'Schedule with educators'],
    ['Mobile Payments', 'MoMo, bank transfer, local'],
    ['ATS Pipeline', 'From applicant to enrolled'],
    ['Multi-tenant', 'Full workspace isolation'],
  ];

  return (
    <SlideWrap>
      <Glow x="80%" y="20%" color={GOLD} opacity={0.05} />
      <div style={{ position: 'relative', zIndex: 1, width: '100%' }}>
        <Label>The Product</Label>
        <H2 style={{ marginBottom: 8 }}>
          Everything built.<br /><em style={{ fontStyle: 'italic', color: GOLD }}>Everything live.</em>
        </H2>
        <Body style={{ marginBottom: 36 }}>Not a prototype. Nest is deployed, running, and accepting payments today.</Body>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 1, background: RULE, border: `1px solid ${RULE}`, borderRadius: 8, overflow: 'hidden', marginBottom: 28 }}>
          {features.map(([title, sub]) => (
            <div key={title} style={{ background: CARD, padding: '20px 20px', transition: 'background 0.2s' }}
              onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = '#1c1a14')}
              onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = CARD)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{ color: GOLD, fontSize: 8 }}>✦</span>
                <span style={{ fontFamily: UI, fontSize: 13, fontWeight: 700, color: INK }}>{title}</span>
              </div>
              <div style={{ fontFamily: MONO, fontSize: 10, color: INK3, letterSpacing: '0.06em' }}>{sub}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <Pill>Live in production</Pill>
          <Pill color={SAGE}>Accepting payments</Pill>
          <Pill color={INK2}>AI transcription active</Pill>
          <a href="https://nest-com.vercel.app" target="_blank" rel="noopener noreferrer" style={{ fontFamily: MONO, fontSize: 11, color: GOLD, textDecoration: 'none', letterSpacing: '0.08em', marginLeft: 8 }}>→ nest-com.vercel.app</a>
        </div>
      </div>
    </SlideWrap>
  );
}

function Slide05_Market() {
  return (
    <SlideWrap>
      <Glow x="60%" y="50%" color={SAGE} opacity={0.06} />
      <div style={{ position: 'relative', zIndex: 1, width: '100%' }}>
        <Label color={SAGE}>Market Opportunity</Label>
        <H2 style={{ marginBottom: 12 }}>
          A <em style={{ fontStyle: 'italic', color: SAGE }}>$605 billion</em><br />market being ignored.
        </H2>
        <Body style={{ marginBottom: 48, maxWidth: 500 }}>
          The global EdTech market is the fastest growing in the world. The emerging market slice is massively underserved.
        </Body>

        <div style={{ display: 'flex', gap: 32, alignItems: 'flex-end', marginBottom: 40, flexWrap: 'wrap' }}>
          {[
            { label: 'TAM', sub: 'Global EdTech', value: '$605B', h: 180, color: GOLD2 },
            { label: 'SAM', sub: 'Emerging Markets EdTech', value: '$38B', h: 120, color: GOLD },
            { label: 'SOM', sub: 'Africa EdTech (5yr)', value: '$2B', h: 72, color: SAGE },
          ].map(m => (
            <div key={m.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
              <span style={{ fontFamily: DISP, fontSize: 28, fontWeight: 300, color: m.color }}>{m.value}</span>
              <div style={{ width: 80, height: m.h, background: `${m.color}22`, border: `1px solid ${m.color}44`, borderRadius: '6px 6px 0 0', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: 10 }}>
                <span style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, color: m.color }}>{m.label}</span>
              </div>
              <span style={{ fontFamily: UI, fontSize: 11, color: INK3, textAlign: 'center', maxWidth: 90, lineHeight: 1.4 }}>{m.sub}</span>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
          {[
            { val: '1.1B', label: 'Young Africans by 2030', icon: '🌍' },
            { val: '60%+', label: 'Mobile internet growth in Africa (2020–2024)', icon: '📱' },
            { val: '$0', label: 'Marketing spend to get first paying customers', icon: '💡' },
          ].map(s => (
            <div key={s.label} style={{ background: CARD, border: `1px solid ${RULE}`, borderRadius: 8, padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
              <span style={{ fontSize: 24 }}>{s.icon}</span>
              <div>
                <div style={{ fontFamily: DISP, fontSize: 24, fontWeight: 300, color: GOLD2, lineHeight: 1 }}>{s.val}</div>
                <div style={{ fontFamily: UI, fontSize: 12, color: INK3, marginTop: 4, lineHeight: 1.4 }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </SlideWrap>
  );
}

function Slide06_BusinessModel() {
  return (
    <SlideWrap>
      <Glow x="75%" y="40%" color={GOLD} opacity={0.06} />
      <div style={{ position: 'relative', zIndex: 1, width: '100%' }}>
        <Label>Business Model</Label>
        <H2 style={{ marginBottom: 12 }}>
          Three revenue<br /><em style={{ fontStyle: 'italic', color: GOLD }}>streams.</em>
        </H2>
        <Body style={{ marginBottom: 40, maxWidth: 480 }}>Simple SaaS pricing with a transaction layer on top. Revenue scales with both educators and learners.</Body>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 1, background: RULE, border: `1px solid ${RULE}`, borderRadius: 8, overflow: 'hidden', marginBottom: 32 }}>
          {[
            { num: '01', title: 'SaaS Subscriptions', color: GOLD, items: ['$29/mo — Starter (up to 50 learners)','$99/mo — Professional (unlimited)','Custom — Enterprise'], note: 'Primary recurring revenue' },
            { num: '02', title: 'Course Marketplace', color: SAGE, items: ['Educators list paid courses','Nest takes 10–15% per sale','Learners pay in local currency'], note: 'Scales with creator growth' },
            { num: '03', title: 'Institution Licensing', color: GOLD2, items: ['Annual contracts with schools','Universities, bootcamps, NGOs','Custom white-label options'], note: 'High-value B2B pipeline' },
          ].map(s => (
            <div key={s.title} style={{ background: CARD, padding: '32px 28px' }}>
              <div style={{ fontFamily: DISP, fontSize: 48, fontWeight: 300, color: `${s.color}22`, lineHeight: 1, marginBottom: 12 }}>{s.num}</div>
              <div style={{ fontFamily: UI, fontSize: 15, fontWeight: 700, color: INK, marginBottom: 16 }}>{s.title}</div>
              {s.items.map(item => (
                <div key={item} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  <span style={{ color: s.color, fontSize: 8, marginTop: 5, flexShrink: 0 }}>✦</span>
                  <span style={{ fontFamily: UI, fontSize: 12.5, color: INK2, lineHeight: 1.5 }}>{item}</span>
                </div>
              ))}
              <div style={{ marginTop: 20, fontFamily: MONO, fontSize: 9.5, color: s.color, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{s.note}</div>
            </div>
          ))}
        </div>

        <div style={{ background: `${GOLD}0a`, border: `1px solid ${GOLD}20`, borderRadius: 8, padding: '20px 28px', display: 'flex', gap: 40, flexWrap: 'wrap' }}>
          {[['$29', 'LTV at Starter (12mo)','$348/yr'],['$99', 'LTV at Professional (12mo)','$1,188/yr'],['10%', 'Platform cut on course sales','Pure margin']].map(([v,l,sub]) => (
            <div key={l}>
              <div style={{ fontFamily: DISP, fontSize: 32, fontWeight: 300, color: GOLD2, lineHeight: 1 }}>{v}<span style={{ fontSize: 14, color: INK3, fontFamily: UI }}>/mo</span></div>
              <div style={{ fontFamily: UI, fontSize: 12, color: INK2, marginTop: 4 }}>{l}</div>
              <div style={{ fontFamily: MONO, fontSize: 10, color: GOLD, marginTop: 2 }}>{sub}</div>
            </div>
          ))}
        </div>
      </div>
    </SlideWrap>
  );
}

function Slide07_Traction() {
  return (
    <SlideWrap>
      <Glow x="60%" y="50%" color={SAGE} opacity={0.08} />
      <div style={{ position: 'relative', zIndex: 1, width: '100%' }}>
        <Label color={SAGE}>Traction</Label>
        <H2 style={{ marginBottom: 12 }}>
          Built solo.<br /><em style={{ fontStyle: 'italic', color: SAGE }}>Already generating revenue.</em>
        </H2>
        <Body style={{ marginBottom: 40, maxWidth: 520 }}>
          Zero marketing budget. Zero team. First paying customers found the product organically and paid without hesitation.
        </Body>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', border: `1px solid ${RULE}`, borderRadius: 8, overflow: 'hidden', marginBottom: 28 }}>
          {[
            { val: '6', label: 'Beta users tested', sub: 'Recruited organically' },
            { val: '2', label: 'Paying customers', sub: 'Converted from beta' },
            { val: '33%', label: 'Conversion rate', sub: 'Industry avg < 5%' },
            { val: '$30', label: 'Revenue earned', sub: '$0 marketing spent' },
          ].map((s, i) => (
            <div key={s.label} style={{ ...( i < 3 ? { borderRight: `1px solid ${RULE}` } : {}), padding: '28px 20px', background: CARD, textAlign: 'center' }}>
              <div style={{ fontFamily: DISP, fontSize: 'clamp(36px,4vw,52px)', fontWeight: 300, color: SAGE, lineHeight: 1, letterSpacing: '-0.02em', marginBottom: 8 }}>{s.val}</div>
              <div style={{ fontFamily: UI, fontSize: 13, fontWeight: 700, color: INK, marginBottom: 4 }}>{s.label}</div>
              <div style={{ fontFamily: MONO, fontSize: 10, color: INK3, letterSpacing: '0.08em' }}>{s.sub}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ background: CARD, border: `1px solid ${RULE}`, borderRadius: 8, padding: '24px 28px' }}>
            <div style={{ fontFamily: MONO, fontSize: 10, color: GOLD, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 16 }}>What's live today</div>
            <Check text="Full platform deployed on Render + Vercel" />
            <Check text="PostgreSQL database on Supabase" />
            <Check text="13 educational modules with AI transcription" />
            <Check text="Payment system accepting MoMo & bank transfer" />
            <Check text="Email notifications fully operational" />
          </div>
          <div style={{ background: CARD, border: `1px solid ${RULE}`, borderRadius: 8, padding: '24px 28px' }}>
            <div style={{ fontFamily: MONO, fontSize: 10, color: SAGE, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 16 }}>Why 33% conversion matters</div>
            <Body style={{ fontSize: 14, marginBottom: 16 }}>
              The industry benchmark for free-to-paid conversion is 2–5%. Nest achieved 33% with 0 onboarding and 0 marketing.
            </Body>
            <Body style={{ fontSize: 14, color: SAGE }}>
              This means the product sells itself. Investment goes to reach — not to fix product-market fit.
            </Body>
          </div>
        </div>
      </div>
    </SlideWrap>
  );
}

function Slide08_GTM() {
  const phases = [
    {
      phase: 'Phase 1', label: 'Now → Month 6', color: GOLD,
      title: 'Seed the community',
      items: ['Target independent educators & coaches on social media','Free tier onboarding — convert to paid within 30 days','Content marketing: "How to build a course on Nest"','Goal: 100 active educators, 500 learners'],
    },
    {
      phase: 'Phase 2', label: 'Month 6 → 18', color: SAGE,
      title: 'Enter institutions',
      items: ['Direct outreach to bootcamps, universities, NGOs','Partnership with accelerators & education networks','Referral program: educators invite other educators','Goal: 10 institutional clients, $5K MRR'],
    },
    {
      phase: 'Phase 3', label: 'Month 18+', color: GOLD2,
      title: 'Scale & expand',
      items: ['Open marketplace — any creator lists courses','API for enterprise & white-label','Expand payment rails to more regions','Goal: 1,000 educators, $50K MRR'],
    },
  ];

  return (
    <SlideWrap>
      <Glow x="70%" y="30%" color={GOLD} opacity={0.05} />
      <div style={{ position: 'relative', zIndex: 1, width: '100%' }}>
        <Label>Go-to-Market</Label>
        <H2 style={{ marginBottom: 12 }}>
          Grassroots first.<br /><em style={{ fontStyle: 'italic', color: GOLD }}>Institutions second.</em>
        </H2>
        <Body style={{ marginBottom: 40, maxWidth: 520 }}>A three-phase strategy that builds trust from the bottom up — starting with individual creators, then scaling to institutions.</Body>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 1, background: RULE, border: `1px solid ${RULE}`, borderRadius: 8, overflow: 'hidden' }}>
          {phases.map(p => (
            <div key={p.phase} style={{ background: CARD, padding: '32px 28px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                <div>
                  <div style={{ fontFamily: MONO, fontSize: 9, color: p.color, letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 4 }}>{p.phase}</div>
                  <div style={{ fontFamily: MONO, fontSize: 10, color: INK3, letterSpacing: '0.06em' }}>{p.label}</div>
                </div>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: `${p.color}15`, border: `1px solid ${p.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontFamily: UI, fontSize: 12, fontWeight: 800, color: p.color }}>{p.phase.slice(-1)}</span>
                </div>
              </div>
              <div style={{ fontFamily: UI, fontSize: 15, fontWeight: 700, color: INK, marginBottom: 16 }}>{p.title}</div>
              {p.items.map(item => (
                <div key={item} style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                  <span style={{ color: p.color, fontSize: 8, marginTop: 5, flexShrink: 0 }}>✦</span>
                  <span style={{ fontFamily: UI, fontSize: 12.5, color: INK2, lineHeight: 1.5 }}>{item}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </SlideWrap>
  );
}

function Slide09_Competition() {
  const rows = [
    { feature: 'AI Q&A on videos' },
    { feature: 'Mobile money payments' },
    { feature: 'Auto-transcription' },
    { feature: 'Course creation tools' },
    { feature: 'Analytics dashboard' },
    { feature: 'Certificates' },
    { feature: 'Emerging market pricing' },
    { feature: 'Full platform (all-in-one)' },
  ];
  const cols = [
    { name: 'Nest', color: GOLD, vals: [true, true, true, true, true, true, true, true] },
    { name: 'Udemy', color: INK3, vals: [false, false, false, false, true, false, false, false] },
    { name: 'Teachable', color: INK3, vals: [false, false, false, true, true, true, false, false] },
    { name: 'Coursera', color: INK3, vals: [false, false, false, false, true, true, false, false] },
  ];

  return (
    <SlideWrap>
      <Glow x="80%" y="30%" color={GOLD} opacity={0.05} />
      <div style={{ position: 'relative', zIndex: 1, width: '100%' }}>
        <Label>Competitive Landscape</Label>
        <H2 style={{ marginBottom: 12 }}>
          Everyone else built<br /><em style={{ fontStyle: 'italic', color: GOLD }}>for the West.</em>
        </H2>
        <Body style={{ marginBottom: 36, maxWidth: 480 }}>We are not competing to be another Udemy clone. We are building the category for an entirely underserved market.</Body>

        <div style={{ border: `1px solid ${RULE}`, borderRadius: 8, overflow: 'hidden' }}>
          {/* Header */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', background: SURF, borderBottom: `1px solid ${RULE}` }}>
            <div style={{ padding: '14px 20px', fontFamily: MONO, fontSize: 10, color: INK3, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Feature</div>
            {cols.map(c => (
              <div key={c.name} style={{ padding: '14px 16px', textAlign: 'center', fontFamily: UI, fontSize: 13, fontWeight: 700, color: c.color, borderLeft: `1px solid ${RULE}` }}>{c.name}</div>
            ))}
          </div>
          {/* Rows */}
          {rows.map((r, ri) => (
            <div key={r.feature} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', borderBottom: ri < rows.length - 1 ? `1px solid ${RULE}` : 'none', background: ri % 2 === 0 ? CARD : BG }}>
              <div style={{ padding: '12px 20px', fontFamily: UI, fontSize: 13, color: INK2 }}>{r.feature}</div>
              {cols.map(c => (
                <div key={c.name} style={{ padding: '12px 16px', textAlign: 'center', borderLeft: `1px solid ${RULE}` }}>
                  {c.vals[ri]
                    ? <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke={c.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 10 8 14 16 6"/></svg>
                    : <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke={INK3} strokeWidth="2" strokeLinecap="round"><line x1="5" y1="5" x2="15" y2="15"/><line x1="15" y1="5" x2="5" y2="15"/></svg>
                  }
                </div>
              ))}
            </div>
          ))}
        </div>

        <div style={{ marginTop: 24, padding: '16px 24px', background: `${GOLD}0a`, border: `1px solid ${GOLD}20`, borderRadius: 8 }}>
          <span style={{ fontFamily: UI, fontSize: 14, color: INK2 }}>
            <strong style={{ color: GOLD }}>Our moat:</strong> Mobile payments + AI-native design + pricing built for emerging markets. These three together don't exist anywhere else.
          </span>
        </div>
      </div>
    </SlideWrap>
  );
}

function Slide10_Team() {
  return (
    <SlideWrap>
      <Glow x="70%" y="50%" color={GOLD} opacity={0.07} />
      <div style={{ position: 'relative', zIndex: 1, width: '100%' }}>
        <Label>The Team</Label>
        <H2 style={{ marginBottom: 12 }}>
          Lean by design.<br /><em style={{ fontStyle: 'italic', color: GOLD }}>Moving fast.</em>
        </H2>
        <Body style={{ marginBottom: 40, maxWidth: 520 }}>
          Nest was designed, built, and launched by one person. Full-stack engineering, product design, infrastructure, and go-to-market — solo. This is what execution looks like.
        </Body>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 28 }}>
          {/* Founder */}
          <div style={{ background: CARD, border: `1px solid ${GOLD}22`, borderRadius: 10, padding: '32px 32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
              <div style={{ width: 52, height: 52, borderRadius: '50%', background: `${GOLD}18`, border: `1px solid ${GOLD}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: UI, fontSize: 18, fontWeight: 800, color: GOLD, flexShrink: 0 }}>ND</div>
              <div>
                <div style={{ fontFamily: UI, fontSize: 16, fontWeight: 700, color: INK }}>Ngum Dieudonne</div>
                <div style={{ fontFamily: MONO, fontSize: 10, color: GOLD, letterSpacing: '0.1em', marginTop: 4 }}>Founder &amp; CEO</div>
              </div>
            </div>
            <Check text="Full-stack engineer (FastAPI, React, PostgreSQL)" />
            <Check text="Designed and shipped entire platform solo" />
            <Check text="Built AI transcription, payment, and email systems" />
            <Check text="First paying customers with zero marketing" />
            <div style={{ marginTop: 20, padding: '12px 16px', background: `${GOLD}0a`, borderRadius: 6, fontFamily: DISP, fontSize: 16, fontStyle: 'italic', color: INK2 }}>
              "I'm not waiting for permission to build what the world needs."
            </div>
          </div>

          {/* Hiring */}
          <div style={{ background: CARD, border: `1px solid ${RULE}`, borderRadius: 10, padding: '32px 32px' }}>
            <div style={{ fontFamily: MONO, fontSize: 10, color: INK3, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 20 }}>Roles we're building toward</div>

            {[
              { role: 'Co-founder / CTO', desc: 'System architecture & scale, takes technical vision further', color: GOLD },
              { role: 'Marketing Lead', desc: 'Content, community, educator acquisition', color: SAGE },
              { role: 'Partnership Manager', desc: 'Institutions, universities, NGO outreach', color: GOLD2 },
            ].map(r => (
              <div key={r.role} style={{ display: 'flex', gap: 14, marginBottom: 20, paddingBottom: 20, borderBottom: `1px solid ${RULE}` }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: r.color, flexShrink: 0, marginTop: 6 }} />
                <div>
                  <div style={{ fontFamily: UI, fontSize: 14, fontWeight: 700, color: INK, marginBottom: 4 }}>{r.role}</div>
                  <div style={{ fontFamily: UI, fontSize: 12.5, color: INK3 }}>{r.desc}</div>
                </div>
              </div>
            ))}

            <div style={{ fontFamily: UI, fontSize: 13, color: INK2, lineHeight: 1.6 }}>
              Investment goes toward bringing passionate people on board — not filling seats.
            </div>
          </div>
        </div>
      </div>
    </SlideWrap>
  );
}

function Slide11_UseOfFunds() {
  const items = [
    { pct: 40, label: 'Marketing & Growth', detail: 'Social media, content, educator acquisition campaigns', color: GOLD, amount: '$4,000' },
    { pct: 25, label: 'Infrastructure', detail: 'Custom domain, Supabase storage, Render scale, CDN', color: SAGE, amount: '$2,500' },
    { pct: 25, label: 'Team Building', detail: 'First part-time hire or co-founder equity setup', color: GOLD2, amount: '$2,500' },
    { pct: 10, label: 'Operations', detail: 'Legal, tools, communication, contingency', color: INK2, amount: '$1,000' },
  ];

  return (
    <SlideWrap>
      <Glow x="70%" y="40%" color={GOLD} opacity={0.06} />
      <div style={{ position: 'relative', zIndex: 1, width: '100%' }}>
        <Label>Use of Funds</Label>
        <H2 style={{ marginBottom: 12 }}>
          $10,000 deployed<br /><em style={{ fontStyle: 'italic', color: GOLD }}>with precision.</em>
        </H2>
        <Body style={{ marginBottom: 40, maxWidth: 480 }}>
          Every dollar has a purpose. The product is built. This investment is about reach, infrastructure, and team.
        </Body>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 28 }}>
          {items.map(item => (
            <div key={item.label} style={{ background: CARD, border: `1px solid ${RULE}`, borderRadius: 10, padding: '28px 28px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div>
                  <div style={{ fontFamily: UI, fontSize: 15, fontWeight: 700, color: INK, marginBottom: 4 }}>{item.label}</div>
                  <div style={{ fontFamily: UI, fontSize: 12.5, color: INK3, lineHeight: 1.5 }}>{item.detail}</div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 16 }}>
                  <div style={{ fontFamily: DISP, fontSize: 28, fontWeight: 300, color: item.color, lineHeight: 1 }}>{item.amount}</div>
                  <div style={{ fontFamily: MONO, fontSize: 10, color: INK3, marginTop: 4 }}>{item.pct}%</div>
                </div>
              </div>
              <div style={{ height: 4, background: `${item.color}20`, borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ width: `${item.pct}%`, height: '100%', background: item.color, borderRadius: 2 }} />
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
          {[
            { label: '6-month target', val: '100 educators', icon: '🎯' },
            { label: 'Revenue goal', val: '$2,000 MRR', icon: '📈' },
            { label: 'With $10K', val: 'Runway = 12 months', icon: '🛤️' },
          ].map(s => (
            <div key={s.label} style={{ background: `${GOLD}08`, border: `1px solid ${GOLD}18`, borderRadius: 8, padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
              <span style={{ fontSize: 22 }}>{s.icon}</span>
              <div>
                <div style={{ fontFamily: DISP, fontSize: 20, fontWeight: 300, color: GOLD2 }}>{s.val}</div>
                <div style={{ fontFamily: MONO, fontSize: 10, color: INK3, letterSpacing: '0.08em', marginTop: 3 }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </SlideWrap>
  );
}

function Slide12_Ask() {
  return (
    <SlideWrap center>
      <Glow x="50%" y="50%" color={GOLD} opacity={0.09} />
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 32, maxWidth: 720, textAlign: 'center' }}>
        <Label>The Ask</Label>

        <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: GOLD, border: `1px solid ${GOLD}33`, padding: '7px 20px', borderRadius: 100 }}>
          Pre-Seed Round · 2026
        </div>

        <H1 style={{ fontSize: 'clamp(52px,7vw,96px)', textAlign: 'center' }}>
          <em style={{ fontStyle: 'italic', color: GOLD }}>$10,000</em>
          <br />
          <span style={{ color: INK2, fontWeight: 300, fontSize: '55%' }}>to move the world forward.</span>
        </H1>

        <Body style={{ maxWidth: 520, textAlign: 'center', fontSize: 16 }}>
          The product works. People are already paying. The market is massive and untapped.
          This investment turns a working prototype into a growing business.
        </Body>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 1, background: RULE, border: `1px solid ${RULE}`, borderRadius: 8, overflow: 'hidden', width: '100%' }}>
          {[
            { label: 'What we have', items: ['Live product', '2 paying customers', '33% conversion rate', 'Full AI platform'] },
            { label: 'What $10K buys', items: ['100 educators onboarded', 'Custom domain & infra', 'First team member', 'Marketing campaigns'] },
            { label: 'Where we\'re going', items: ['$2,000 MRR in 6 months', '1,000 learners active', 'Institutional partnerships', 'Series A ready'] },
          ].map(col => (
            <div key={col.label} style={{ background: CARD, padding: '28px 24px', textAlign: 'left' }}>
              <div style={{ fontFamily: MONO, fontSize: 9, color: GOLD, letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 16 }}>{col.label}</div>
              {col.items.map(item => (
                <div key={item} style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                  <span style={{ color: GOLD, fontSize: 8, marginTop: 5, flexShrink: 0 }}>✦</span>
                  <span style={{ fontFamily: UI, fontSize: 13, color: INK2, lineHeight: 1.4 }}>{item}</span>
                </div>
              ))}
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, marginTop: 8 }}>
          <div style={{ fontFamily: UI, fontSize: 15, fontWeight: 700, color: INK }}>Ngum Dieudonne · Founder &amp; CEO</div>
          <a href="mailto:ngummdieudonne4@gmail.com" style={{ fontFamily: MONO, fontSize: 12, color: GOLD, textDecoration: 'none', letterSpacing: '0.06em' }}>ngummdieudonne4@gmail.com</a>
          <a href="https://nest-com.vercel.app" target="_blank" rel="noopener noreferrer" style={{ fontFamily: MONO, fontSize: 12, color: INK3, textDecoration: 'none', letterSpacing: '0.06em' }}>nest-com.vercel.app</a>
        </div>
      </div>
    </SlideWrap>
  );
}

// ── Slide map ────────────────────────────────────────────────────────────────
const SLIDES = [
  { component: Slide01_Cover,       label: 'Cover' },
  { component: Slide02_Problem,     label: 'Problem' },
  { component: Slide03_Solution,    label: 'Solution' },
  { component: Slide04_Product,     label: 'Product' },
  { component: Slide05_Market,      label: 'Market' },
  { component: Slide06_BusinessModel, label: 'Business Model' },
  { component: Slide07_Traction,    label: 'Traction' },
  { component: Slide08_GTM,         label: 'Go-to-Market' },
  { component: Slide09_Competition, label: 'Competition' },
  { component: Slide10_Team,        label: 'Team' },
  { component: Slide11_UseOfFunds,  label: 'Use of Funds' },
  { component: Slide12_Ask,         label: 'The Ask' },
];

// ── Navigation dots ──────────────────────────────────────────────────────────
function NavDots({ current, total, onChange }: { current: number; total: number; onChange: (i: number) => void }) {
  return (
    <div style={{
      position: 'fixed', right: 24, top: '50%', transform: 'translateY(-50%)',
      display: 'flex', flexDirection: 'column', gap: 8, zIndex: 200,
    }}>
      {Array.from({ length: total }).map((_, i) => (
        <button key={i} onClick={() => onChange(i)} title={SLIDES[i].label} style={{
          width: i === current ? 8 : 5,
          height: i === current ? 8 : 5,
          borderRadius: '50%',
          background: i === current ? GOLD : INK3,
          border: 'none', cursor: 'pointer', padding: 0,
          transition: 'all 0.25s',
          boxShadow: i === current ? `0 0 8px ${GOLD}88` : 'none',
        }} />
      ))}
    </div>
  );
}

// ── Progress bar ─────────────────────────────────────────────────────────────
function ProgressBar({ current, total }: { current: number; total: number }) {
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: 2, background: RULE, zIndex: 300 }}>
      <div style={{
        height: '100%',
        width: `${((current + 1) / total) * 100}%`,
        background: `linear-gradient(90deg, ${GOLD}, ${GOLD2})`,
        transition: 'width 0.4s ease',
      }} />
    </div>
  );
}

// ── Controls ─────────────────────────────────────────────────────────────────
function Controls({ current, total, onPrev, onNext }: { current: number; total: number; onPrev: () => void; onNext: () => void }) {
  return (
    <div style={{
      position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)',
      display: 'flex', alignItems: 'center', gap: 20, zIndex: 200,
      background: 'rgba(10,9,7,0.9)', backdropFilter: 'blur(16px)',
      border: `1px solid ${RULE}`, borderRadius: 100,
      padding: '10px 20px',
    }}>
      <button onClick={onPrev} disabled={current === 0} style={{
        width: 32, height: 32, borderRadius: '50%', border: `1px solid ${RULE}`,
        background: 'none', cursor: current === 0 ? 'default' : 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: current === 0 ? INK3 : INK2, transition: 'color 0.2s',
      }}>
        <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 10H5M8 7l-3 3 3 3"/></svg>
      </button>

      <div style={{ fontFamily: MONO, fontSize: 10, color: INK3, letterSpacing: '0.1em', minWidth: 80, textAlign: 'center' }}>
        <span style={{ color: GOLD }}>{current + 1}</span> / {total} · <span style={{ color: INK2 }}>{SLIDES[current].label}</span>
      </div>

      <button onClick={onNext} disabled={current === total - 1} style={{
        width: 32, height: 32, borderRadius: '50%', border: `1px solid ${RULE}`,
        background: 'none', cursor: current === total - 1 ? 'default' : 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: current === total - 1 ? INK3 : INK2, transition: 'color 0.2s',
      }}>
        <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 10h10M12 7l3 3-3 3"/></svg>
      </button>
    </div>
  );
}

// ── Main deck ─────────────────────────────────────────────────────────────────
export default function PitchDeck() {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState<'next' | 'prev'>('next');

  const goTo = useCallback((i: number) => {
    setDirection(i > current ? 'next' : 'prev');
    setCurrent(Math.max(0, Math.min(TOTAL_SLIDES - 1, i)));
  }, [current]);

  const next = useCallback(() => { if (current < TOTAL_SLIDES - 1) goTo(current + 1); }, [current, goTo]);
  const prev = useCallback(() => { if (current > 0) goTo(current - 1); }, [current, goTo]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next();
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') prev();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [next, prev]);

  const SlideComp = SLIDES[current].component;

  return (
    <div style={{ background: BG, width: '100vw', height: '100vh', overflow: 'hidden', fontFamily: UI, position: 'relative' }}>
      <ProgressBar current={current} total={TOTAL_SLIDES} />

      {/* Top bar */}
      <div style={{
        position: 'fixed', top: 2, left: 0, right: 0, height: 52,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 24px', zIndex: 100,
        borderBottom: `1px solid ${RULE}`,
        background: 'rgba(10,9,7,0.88)', backdropFilter: 'blur(16px)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 26, height: 26, border: `1.5px solid ${GOLD}55`, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: GOLD, fontFamily: UI }}>N</div>
          <span style={{ fontFamily: DISP, fontSize: 18, fontWeight: 600, color: GOLD2 }}>Nest</span>
          <span style={{ fontFamily: MONO, fontSize: 9, color: INK3, letterSpacing: '0.14em', textTransform: 'uppercase', marginLeft: 8 }}>Pitch Deck · 2026</span>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <a href="https://nest-com.vercel.app" target="_blank" rel="noopener noreferrer" style={{ fontFamily: MONO, fontSize: 10, color: GOLD, textDecoration: 'none', letterSpacing: '0.08em' }}>Live demo →</a>
          <Link to="/" style={{ fontFamily: MONO, fontSize: 10, color: INK3, textDecoration: 'none', letterSpacing: '0.08em', border: `1px solid ${RULE}`, padding: '5px 10px', borderRadius: 4 }}>← Home</Link>
        </div>
      </div>

      {/* Slide */}
      <div style={{ width: '100%', height: '100%', paddingTop: 54, boxSizing: 'border-box' }}
        onClick={(e) => {
          const x = e.clientX;
          if (x < window.innerWidth / 2) prev();
          else next();
        }}
      >
        <div key={current} style={{ width: '100%', height: '100%', animation: `pdSlide${direction} 0.35s ease` }}>
          <SlideComp />
        </div>
      </div>

      <NavDots current={current} total={TOTAL_SLIDES} onChange={goTo} />
      <Controls current={current} total={TOTAL_SLIDES} onPrev={prev} onNext={next} />

      {/* Grid overlay */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
        backgroundImage: `linear-gradient(${RULE} 1px, transparent 1px), linear-gradient(90deg, ${RULE} 1px, transparent 1px)`,
        backgroundSize: '80px 80px', opacity: 0.4,
      }} />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Syne:wght@400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap');
        @keyframes pdSlidenext { from{opacity:0;transform:translateX(32px)} to{opacity:1;transform:translateX(0)} }
        @keyframes pdSlideprev { from{opacity:0;transform:translateX(-32px)} to{opacity:1;transform:translateX(0)} }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { display: none; }

        @media print {
          body { background: #0a0907 !important; }
          .no-print { display: none !important; }
        }
      `}</style>
    </div>
  );
}
