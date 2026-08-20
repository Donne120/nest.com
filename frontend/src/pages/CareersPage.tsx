import { Link } from 'react-router-dom';
import { ArrowLeft, MapPin, Clock, ArrowRight } from 'lucide-react';

// ── Calm Purple careers page ────────────────────────────────────────────────
// A light, shareable page: it advertises Nest while listing open roles. "Apply"
// opens a Google Form so applications land in your Sheet — no backend needed.

const DISP = "'Fraunces', 'Cormorant Garamond', Georgia, serif";
const UI   = "'Inter Tight', 'Inter', system-ui, sans-serif";
const MONO = "'DM Mono', ui-monospace, monospace";
const GRAD = 'linear-gradient(135deg, #8B6FE8 0%, #6D4AE0 55%, #5A38C7 100%)';

// The public Google Form applicants fill in (CV upload + questions live there).
const APPLY_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSeYhlDuKNDPNZhcsqpKsm815ZrwkrCZ9Uq1W3xEguYkP-ZQzw/viewform';

type Job = {
  title: string;
  type: string;
  location: string;
  blurb: string;
  bullets: string[];
};

const JOBS: Job[] = [
  {
    title: 'Community & Growth Associate',
    type: 'Full-time',
    location: 'Cameroon · Douala / Yaoundé',
    blurb:
      'Get Nest into the hands of the students and parents who need it. You will be our face on the ground — schools, WhatsApp, campus reps, word of mouth.',
    bullets: [
      'Based in Cameroon, fluent in English AND French',
      'You recently went through the GCE / secondary grind yourself',
      'A natural hustler with a network of students, teachers or parents',
      'Comfortable selling an idea you believe in — online and face to face',
    ],
  },
];

export default function CareersPage() {
  return (
    <div style={{ minHeight: '100dvh', background: '#F6F4FD', fontFamily: UI, color: '#1E1B2E' }}>
      {/* Hero */}
      <section style={{ background: GRAD, color: '#fff', padding: 'clamp(28px,6vw,64px) clamp(16px,4vw,44px) clamp(40px,7vw,72px)', position: 'relative', overflow: 'hidden' }}>
        <div aria-hidden style={{ position: 'absolute', right: -60, top: -60, width: 220, height: 220, borderRadius: '50%', background: 'rgba(255,255,255,0.10)' }} />
        <div style={{ maxWidth: 900, margin: '0 auto', position: 'relative' }}>
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: MONO, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.85)', textDecoration: 'none', marginBottom: 22 }}>
            <ArrowLeft size={13} /> Back to Nest
          </Link>
          <p style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.22em', textTransform: 'uppercase', opacity: 0.85, marginBottom: 12 }}>
            Careers at Nest
          </p>
          <h1 style={{ fontFamily: DISP, fontSize: 'clamp(34px,6vw,60px)', fontWeight: 600, lineHeight: 1.05, letterSpacing: '-0.02em', margin: '0 0 16px', maxWidth: '18ch' }}>
            Help us build how Africa learns.
          </h1>
          <p style={{ fontSize: 'clamp(15px,2vw,18px)', lineHeight: 1.6, opacity: 0.92, maxWidth: '52ch', margin: 0 }}>
            Nest is a mobile-first learning platform for Cameroonian students — lessons that talk back,
            answers grounded in the actual video. We're small, moving fast, and looking for people who
            care about students as much as we do.
          </p>
        </div>
      </section>

      {/* Open roles */}
      <section style={{ maxWidth: 900, margin: '0 auto', padding: 'clamp(32px,5vw,56px) clamp(16px,4vw,44px)' }}>
        <h2 style={{ fontFamily: DISP, fontSize: 'clamp(24px,3vw,32px)', fontWeight: 600, letterSpacing: '-0.01em', margin: '0 0 6px' }}>
          Open roles
        </h2>
        <p style={{ color: '#6E6A85', fontSize: 14, margin: '0 0 28px' }}>
          {JOBS.length} position{JOBS.length !== 1 ? 's' : ''} open. Don't see your fit? Apply anyway and tell us what you'd do.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {JOBS.map((job) => (
            <div key={job.title} style={{ background: '#fff', border: '1px solid #ECE9F7', borderRadius: 18, padding: 'clamp(20px,3vw,28px)', boxShadow: '0 4px 14px rgba(84,52,180,0.06)' }}>
              <h3 style={{ fontFamily: DISP, fontSize: 'clamp(20px,2.4vw,26px)', fontWeight: 600, margin: '0 0 10px' }}>{job.title}</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginBottom: 16 }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: '#6E6A85' }}><Clock size={13} /> {job.type}</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: '#6E6A85' }}><MapPin size={13} /> {job.location}</span>
              </div>
              <p style={{ fontSize: 15, lineHeight: 1.65, color: '#1E1B2E', margin: '0 0 16px', maxWidth: '58ch' }}>{job.blurb}</p>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 22px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {job.bullets.map((b) => (
                  <li key={b} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 14, color: '#6E6A85', lineHeight: 1.5 }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#6D4AE0', flexShrink: 0, marginTop: 7 }} />
                    {b}
                  </li>
                ))}
              </ul>
              <a
                href={`${APPLY_URL}`}
                target="_blank" rel="noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#6D4AE0', color: '#fff', fontWeight: 700, fontSize: 14, padding: '12px 22px', borderRadius: 12, textDecoration: 'none' }}
              >
                Apply now <ArrowRight size={15} />
              </a>
              <p style={{ fontSize: 12.5, color: '#A5A1B8', margin: '12px 0 0' }}>
                You'll be asked for your CV and a short answer on how you'd bring students to Nest.
              </p>
            </div>
          ))}
        </div>

        {/* Why join */}
        <div style={{ marginTop: 40, background: '#EFEAFB', borderRadius: 18, padding: 'clamp(20px,3vw,28px)' }}>
          <h3 style={{ fontFamily: DISP, fontSize: 20, fontWeight: 600, margin: '0 0 10px' }}>Why join Nest?</h3>
          <p style={{ fontSize: 14.5, lineHeight: 1.7, color: '#1E1B2E', margin: 0, maxWidth: '60ch' }}>
            You'll shape a product used by real students, work directly with the founder, and grow into
            a leadership role as we scale. Base pay plus commission — your success is your income. If you
            want to prove yourself and build something that matters, this is it.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid #ECE9F7', padding: '28px clamp(16px,4vw,44px)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <Link to="/" style={{ fontFamily: DISP, fontSize: 20, fontWeight: 600, color: '#1E1B2E', textDecoration: 'none' }}>Nest</Link>
          <span style={{ fontFamily: MONO, fontSize: 10.5, color: '#A5A1B8', letterSpacing: '0.05em' }}>© {new Date().getFullYear()} Nest — a classroom with no walls.</span>
        </div>
      </footer>
    </div>
  );
}
