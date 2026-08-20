import { Link } from 'react-router-dom';
import { ArrowLeft, MapPin, Clock, ArrowRight, Sparkles, Target, Award, TrendingUp } from 'lucide-react';

// ── Calm Purple careers page ────────────────────────────────────────────────
// A professional, shareable page: what Nest is, who we need, what they bring,
// and why join. "Apply" opens a Google Form (CV + questions) — no backend.

const DISP = "'Fraunces', 'Cormorant Garamond', Georgia, serif";
const UI   = "'Inter Tight', 'Inter', system-ui, sans-serif";
const MONO = "'DM Mono', ui-monospace, monospace";
const GRAD = 'linear-gradient(135deg, #8B6FE8 0%, #6D4AE0 55%, #5A38C7 100%)';

// The public Google Form applicants fill in (CV upload + questions live there).
const APPLY_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSeYhlDuKNDPNZhcsqpKsm815ZrwkrCZ9Uq1W3xEguYkP-ZQzw/viewform';

const ROLE = {
  title: 'Community & Growth Associate',
  type: 'Full-time',
  location: 'Cameroon · Douala / Yaoundé',
  summary:
    'You are the bridge between Nest and the students and parents who need it. Your job is simple to say and hard to do well: get real learners onto the platform, and keep them coming back. You will be our face on the ground — in schools, WhatsApp groups, on campus, and wherever students gather.',
  responsibilities: [
    'Drive student sign-ups through WhatsApp, TikTok, campus reps and word of mouth',
    'Speak to parents and tutors about how Nest helps their children pass the GCE',
    'Build relationships with schools, teachers and study groups across your city',
    'Run "invite a friend" campaigns using our access codes and track what works',
    'Represent Nest in person — at schools, events, and community gatherings',
    'Bring student and parent feedback back to the team so we build the right thing',
  ],
  brings: [
    'Based in Cameroon, fluent in both English and French',
    'Recently went through the GCE / secondary-school journey yourself — you get it',
    'A natural communicator with a real network of students, teachers or parents',
    'Self-driven and results-focused — you make things happen without being told',
    'Comfortable selling an idea you believe in, both online and face to face',
    'Bonus: experience in sales, community building, or a following among students',
  ],
};

const PERKS = [
  { icon: TrendingUp, title: 'Base pay + commission', text: 'Earn for every learner you bring in. Your success is your income.' },
  { icon: Sparkles, title: 'Real impact', text: 'Shape a product used by thousands of students — your work is visible.' },
  { icon: Award, title: 'Grow with us', text: 'Join early and grow into a leadership role as Nest scales.' },
  { icon: Target, title: 'Work with the founder', text: 'Direct access, fast decisions, and a front-row seat to building a startup.' },
];

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#6D4AE0', margin: '0 0 10px', fontWeight: 500 }}>
      {children}
    </p>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <li style={{ display: 'flex', alignItems: 'flex-start', gap: 11, fontSize: 15, color: '#3A3550', lineHeight: 1.55 }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#6D4AE0', flexShrink: 0, marginTop: 8 }} />
      <span>{children}</span>
    </li>
  );
}

export default function CareersPage() {
  return (
    <div style={{ minHeight: '100dvh', background: '#F6F4FD', fontFamily: UI, color: '#1E1B2E' }}>

      {/* ── Hero ── */}
      <section style={{ background: GRAD, color: '#fff', padding: 'clamp(28px,6vw,64px) clamp(16px,4vw,44px) clamp(40px,7vw,72px)', position: 'relative', overflow: 'hidden' }}>
        <div aria-hidden style={{ position: 'absolute', right: -60, top: -60, width: 220, height: 220, borderRadius: '50%', background: 'rgba(255,255,255,0.10)' }} />
        <div style={{ maxWidth: 820, margin: '0 auto', position: 'relative' }}>
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: MONO, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.85)', textDecoration: 'none', marginBottom: 22 }}>
            <ArrowLeft size={13} /> Back to Nest
          </Link>
          <p style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.22em', textTransform: 'uppercase', opacity: 0.85, marginBottom: 12 }}>
            Careers at Nest
          </p>
          <h1 style={{ fontFamily: DISP, fontSize: 'clamp(34px,6vw,58px)', fontWeight: 600, lineHeight: 1.05, letterSpacing: '-0.02em', margin: '0 0 16px', maxWidth: '17ch' }}>
            Help us build how Africa learns.
          </h1>
          <p style={{ fontSize: 'clamp(15px,2vw,18px)', lineHeight: 1.6, opacity: 0.92, maxWidth: '54ch', margin: 0 }}>
            We're a small, fast-moving team looking for people who care about students as much as we do.
            Come build something that matters.
          </p>
        </div>
      </section>

      <div style={{ maxWidth: 820, margin: '0 auto', padding: 'clamp(32px,5vw,56px) clamp(16px,4vw,44px)', display: 'flex', flexDirection: 'column', gap: 'clamp(32px,5vw,52px)' }}>

        {/* ── What is Nest ── */}
        <section>
          <SectionLabel>What is Nest</SectionLabel>
          <h2 style={{ fontFamily: DISP, fontSize: 'clamp(22px,3vw,30px)', fontWeight: 600, letterSpacing: '-0.01em', margin: '0 0 14px' }}>
            A learning platform where lessons talk back.
          </h2>
          <p style={{ fontSize: 15.5, lineHeight: 1.75, color: '#3A3550', margin: 0, maxWidth: '62ch' }}>
            Nest is an early-stage startup building a mobile-first learning platform for Cameroonian
            students. Learners watch short lessons, ask questions pinned to the exact moment in the
            video, and get answers grounded in the actual content — not generic AI. We're helping
            students, especially GCE candidates, truly understand their material instead of just
            cramming. Mobile-first. Africa-first. Built for the way people here actually learn.
          </p>
        </section>

        {/* ── The role card ── */}
        <section style={{ background: '#fff', border: '1px solid #ECE9F7', borderRadius: 20, padding: 'clamp(22px,3.5vw,34px)', boxShadow: '0 4px 14px rgba(84,52,180,0.06)' }}>
          <SectionLabel>Open role</SectionLabel>
          <h2 style={{ fontFamily: DISP, fontSize: 'clamp(24px,3vw,32px)', fontWeight: 600, margin: '0 0 12px', letterSpacing: '-0.01em' }}>{ROLE.title}</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 20 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#6E6A85' }}><Clock size={14} /> {ROLE.type}</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#6E6A85' }}><MapPin size={14} /> {ROLE.location}</span>
          </div>
          <p style={{ fontSize: 15.5, lineHeight: 1.7, color: '#3A3550', margin: '0 0 28px', maxWidth: '62ch' }}>{ROLE.summary}</p>

          {/* Who we need */}
          <div style={{ marginBottom: 28 }}>
            <h3 style={{ fontFamily: UI, fontSize: 16, fontWeight: 700, margin: '0 0 14px', color: '#1E1B2E' }}>What you'll do</h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 11 }}>
              {ROLE.responsibilities.map((r) => <Bullet key={r}>{r}</Bullet>)}
            </ul>
          </div>

          {/* What you bring */}
          <div style={{ marginBottom: 30 }}>
            <h3 style={{ fontFamily: UI, fontSize: 16, fontWeight: 700, margin: '0 0 14px', color: '#1E1B2E' }}>What you bring</h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 11 }}>
              {ROLE.brings.map((b) => <Bullet key={b}>{b}</Bullet>)}
            </ul>
          </div>

          <div style={{ borderTop: '1px solid #ECE9F7', paddingTop: 22 }}>
            <a
              href={APPLY_URL}
              target="_blank" rel="noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#6D4AE0', color: '#fff', fontWeight: 700, fontSize: 15, padding: '13px 26px', borderRadius: 12, textDecoration: 'none' }}
            >
              Apply now <ArrowRight size={16} />
            </a>
            <p style={{ fontSize: 12.5, color: '#A5A1B8', margin: '12px 0 0' }}>
              You'll upload your CV and answer one short question: how would you get 100 students to try Nest in your first month?
            </p>
          </div>
        </section>

        {/* ── Why join Nest ── */}
        <section>
          <SectionLabel>Why join Nest</SectionLabel>
          <h2 style={{ fontFamily: DISP, fontSize: 'clamp(22px,3vw,30px)', fontWeight: 600, letterSpacing: '-0.01em', margin: '0 0 22px' }}>
            More than a job — a front-row seat.
          </h2>
          <div className="perks-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
            {PERKS.map((p) => {
              const Icon = p.icon;
              return (
                <div key={p.title} style={{ background: '#fff', border: '1px solid #ECE9F7', borderRadius: 16, padding: '20px 22px' }}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: '#F1ECFD', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                    <Icon size={18} color="#6D4AE0" />
                  </div>
                  <h4 style={{ fontFamily: UI, fontSize: 15, fontWeight: 700, margin: '0 0 5px', color: '#1E1B2E' }}>{p.title}</h4>
                  <p style={{ fontSize: 13.5, lineHeight: 1.55, color: '#6E6A85', margin: 0 }}>{p.text}</p>
                </div>
              );
            })}
          </div>
          <p style={{ fontSize: 13, color: '#A5A1B8', margin: '18px 0 0', fontStyle: 'italic' }}>
            This is a startup role — compensation is base pay plus commission, discussed during the interview based on experience.
          </p>
        </section>

        {/* ── Closing CTA ── */}
        <section style={{ background: GRAD, borderRadius: 20, padding: 'clamp(24px,4vw,36px)', color: '#fff', textAlign: 'center' }}>
          <h2 style={{ fontFamily: DISP, fontSize: 'clamp(22px,3vw,30px)', fontWeight: 600, margin: '0 0 10px' }}>Ready to build with us?</h2>
          <p style={{ fontSize: 15, opacity: 0.92, margin: '0 0 22px', maxWidth: '46ch', marginLeft: 'auto', marginRight: 'auto' }}>
            If you want to prove yourself and help thousands of students learn better, we want to hear from you.
          </p>
          <a
            href={APPLY_URL}
            target="_blank" rel="noreferrer"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#fff', color: '#5A38C7', fontWeight: 700, fontSize: 15, padding: '13px 28px', borderRadius: 12, textDecoration: 'none' }}
          >
            Apply now <ArrowRight size={16} />
          </a>
        </section>
      </div>

      {/* ── Footer ── */}
      <footer style={{ borderTop: '1px solid #ECE9F7', padding: '28px clamp(16px,4vw,44px)' }}>
        <div style={{ maxWidth: 820, margin: '0 auto', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <Link to="/" style={{ fontFamily: DISP, fontSize: 20, fontWeight: 600, color: '#1E1B2E', textDecoration: 'none' }}>Nest</Link>
          <span style={{ fontFamily: MONO, fontSize: 10.5, color: '#A5A1B8', letterSpacing: '0.05em' }}>© {new Date().getFullYear()} Nest — a classroom with no walls.</span>
        </div>
      </footer>

      <style>{`
        @media (max-width: 560px) {
          .perks-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
