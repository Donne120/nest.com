import { Link } from 'react-router-dom';
import { ArrowRight, Award } from 'lucide-react';
import type { Module } from '../../types';

const PLUM = '#1a1320';
const GOLD = '#E8B04B';
const DISP = "'Cormorant Garamond', Georgia, serif";
const UI   = "'Inter Tight', 'Inter', system-ui, sans-serif";
const MONO = "'DM Mono', ui-monospace, monospace";

interface Props {
  modules: Module[];
  firstName: string;
  greeting: string;
  bgImage: string;
}

function mins(s: number) {
  const m = Math.round(s / 60);
  return m <= 1 ? 'less than a minute' : `${m} minutes`;
}

/**
 * The hero of the Learning Hub.
 *
 * Replaces the old donut + Total/Completed/In-Progress stat pills, which
 * greeted a brand-new learner with "0 / 0 / 0" — telling them they'd achieved
 * nothing before they'd done anything. Instead this leads with a person and a
 * single next action: "You stopped 4 minutes into 'Why factoring works'."
 */
export default function ContinueCard({ modules, firstName, greeting, bgImage }: Props) {
  // The lesson to finish: furthest-along in-progress module.
  const inProgress = modules
    .filter(m => m.status === 'in_progress')
    .sort((a, b) => (b.progress_seconds ?? 0) - (a.progress_seconds ?? 0));
  const resume = inProgress[0];

  const notStarted = modules.filter(m => (m.status ?? 'not_started') === 'not_started');
  const allDone = modules.length > 0 && modules.every(m => m.status === 'completed');

  // Decide the single state this card is in.
  let eyebrow: string, title: React.ReactNode, body: React.ReactNode;
  let cta: { to: string; label: string; short?: string } | null = null;
  let pct = 0;
  let remainLabel: string | null = null;

  if (resume) {
    const dur  = resume.duration_seconds || 0;
    const done = resume.progress_seconds ?? 0;
    pct = dur > 0 ? Math.min(100, Math.round((done / dur) * 100)) : 0;
    remainLabel = dur > done ? `${mins(dur - done)} left` : null;
    eyebrow = 'Pick up where you left off';
    title = <>{greeting}{firstName && <>, {firstName}</>}.</>;
    body = <>You stopped <strong style={{ color: GOLD, fontWeight: 500 }}>{mins(done)}</strong> into <em style={{ fontStyle: 'italic', color: GOLD }}>“{resume.title}”</em></>;
    cta = { to: `/modules/${resume.id}`, label: 'Finish this lesson' };
  } else if (allDone) {
    eyebrow = 'All caught up';
    title = <>You've finished everything{firstName && <>, {firstName}</>}.</>;
    body = <>Every course, done. Your certificates are ready when you are.</>;
    cta = { to: '/profile', label: 'View my certificates' };
  } else if (notStarted.length > 0) {
    const first = notStarted[0];
    eyebrow = 'Your first lesson';
    title = <>Welcome{firstName && <>, {firstName}</>}.</>;
    body = <>{modules.length === 1 ? 'One course is' : `${modules.length} courses are`} waiting. Most people start with the first one and never look back.</>;
    cta = { to: `/modules/${first.id}`, label: `Start “${first.title}”`, short: 'Start the first course' };
  } else {
    eyebrow = 'Learning Hub';
    title = <>{greeting}{firstName && <>, {firstName}</>}.</>;
    body = <>Your courses will appear here as soon as your trainer publishes them.</>;
  }

  return (
    <section
      className="continue-card"
      style={{
        position: 'relative', overflow: 'hidden',
        borderRadius: 18, background: PLUM,
        minHeight: 260, display: 'flex', alignItems: 'flex-end',
        border: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      {/* Photo at FULL strength — the landing page's power comes from real
          photos of African learners; don't fade them to a smudge. */}
      <img src={bgImage} alt="" aria-hidden style={{
        position: 'absolute', inset: 0, width: '100%', height: '100%',
        objectFit: 'cover', objectPosition: 'right center',
      }} />
      {/* Scrim so the words always read. On a phone the card is narrow enough
          that the subject sits behind the text, so we also darken bottom-up. */}
      <div aria-hidden className="cc-scrim" style={{ position: 'absolute', inset: 0 }} />

      {/* width:100% + minWidth:0 so long course titles wrap/ellipsis instead of
          blowing the card out past the viewport on a narrow phone. */}
      <div style={{ position: 'relative', zIndex: 1, padding: 'clamp(20px,5vw,32px)', maxWidth: 620, width: '100%', minWidth: 0, boxSizing: 'border-box' }}>
        <span style={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: '0.2em', textTransform: 'uppercase', color: GOLD }}>
          {eyebrow}
        </span>

        <h1 style={{
          fontFamily: DISP, fontSize: 'clamp(28px,6vw,40px)', fontWeight: 600,
          lineHeight: 1.08, letterSpacing: '-0.02em', color: '#F2F0F5',
          margin: '10px 0 8px',
        }}>
          {title}
        </h1>

        <p style={{ fontFamily: DISP, fontSize: 'clamp(17px,2.6vw,20px)', color: 'rgba(242,240,245,0.85)', lineHeight: 1.5, margin: 0 }}>
          {body}
        </p>

        {/* The learner's own effort, drawn back to them */}
        {resume && (
          <div style={{ marginTop: 18, maxWidth: 320 }}>
            <div style={{ height: 5, borderRadius: 100, background: 'rgba(255,255,255,0.15)', overflow: 'hidden' }}>
              <div className="cc-bar" style={{ height: '100%', borderRadius: 100, background: GOLD, transform: `scaleX(${pct / 100})`, transformOrigin: 'left' }} />
            </div>
            {remainLabel && (
              <span style={{ fontFamily: MONO, fontSize: 11, color: 'rgba(242,240,245,0.6)', marginTop: 7, display: 'inline-block' }}>
                {remainLabel}
              </span>
            )}
          </div>
        )}

        {cta && (
          <Link
            to={cta.to}
            className={`press cc-cta${cta.short ? ' cc-has-short' : ''}`}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9,
              marginTop: 20, minHeight: 48, padding: '0 20px',
              background: GOLD, color: '#0B0A0F',
              fontFamily: UI, fontSize: 14, fontWeight: 700,
              borderRadius: 10, textDecoration: 'none',
              boxShadow: '0 8px 26px rgba(232,176,75,0.35)',
              // Never let a long course title push the button off-screen.
              maxWidth: '100%', minWidth: 0, boxSizing: 'border-box',
            }}
          >
            {/* Long label on wide screens; a short one on phones, where a full
                course title would otherwise be truncated to nonsense. */}
            <span className="cc-cta-long" style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cta.label}</span>
            {cta.short && <span className="cc-cta-short" style={{ display: 'none', whiteSpace: 'nowrap' }}>{cta.short}</span>}
            {allDone ? <Award size={16} style={{ flexShrink: 0 }} /> : <ArrowRight size={16} style={{ flexShrink: 0 }} />}
          </Link>
        )}
      </div>

      <style>{`
        /* Wide: fade left-to-right, letting the learner stay visible on the right. */
        .cc-scrim {
          background: linear-gradient(90deg, ${PLUM} 0%, rgba(26,19,32,0.92) 42%, rgba(26,19,32,0.45) 75%, rgba(26,19,32,0.25) 100%);
        }
        /* Narrow: the text sits over the subject, so darken bottom-up too. */
        @media (max-width: 560px) {
          .cc-scrim {
            background:
              linear-gradient(0deg, ${PLUM} 8%, rgba(26,19,32,0.9) 45%, rgba(26,19,32,0.35) 100%),
              linear-gradient(90deg, rgba(26,19,32,0.85) 0%, rgba(26,19,32,0.5) 60%, rgba(26,19,32,0.3) 100%);
          }
        }

        /* Draw the learner's own progress once, on mount. transform-only. */
        @keyframes cc-fill { from { transform: scaleX(0); } }
        .cc-bar { animation: cc-fill 700ms cubic-bezier(0.16,1,0.3,1) both; }
        @media (prefers-reduced-motion: reduce) { .cc-bar { animation: none; } }

        /* Phones: a full course title in the button truncates to nonsense, so
           swap to the short label. (Plain classes — no :has(), which older
           Android browsers may not support.) */
        @media (max-width: 560px) {
          .cc-has-short .cc-cta-long  { display: none !important; }
          .cc-has-short .cc-cta-short { display: inline !important; }
        }
      `}</style>
    </section>
  );
}
