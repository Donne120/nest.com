import { useEffect, useState } from 'react';
import { ArrowRight, ListChecks, X } from 'lucide-react';

const PLUM = '#1a1320';
const GOLD = '#E8B04B';
const DISP = "'Cormorant Garamond', Georgia, serif";
const UI   = "'Inter Tight', 'Inter', system-ui, sans-serif";
const MONO = "'DM Mono', ui-monospace, monospace";

interface Props {
  index: number;            // 1-based lesson number just finished
  total: number;
  nextTitle?: string;
  onNext?: () => void;
  onQuiz?: () => void;
  quizCount?: number;
  onDismiss: () => void;
}

const AUTO_MS = 6000;

/**
 * The beat between finishing a lesson and whatever comes next.
 *
 * Before this, `handleVideoEnd` posted progress and immediately threw a quiz
 * in the learner's face — finishing was rewarded with a test, and the entire
 * reward system was a toast saying "Marked as complete!". This gives the
 * learner a moment of "well done" and lets THEM choose what's next.
 */
export default function LessonCompleteOverlay({
  index, total, nextTitle, onNext, onQuiz, quizCount = 0, onDismiss,
}: Props) {
  const [remaining, setRemaining] = useState(AUTO_MS);

  // Auto-advance, but visibly — never steal control silently.
  useEffect(() => {
    if (!onNext) return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const started = Date.now();
    const id = setInterval(() => {
      const left = AUTO_MS - (Date.now() - started);
      if (left <= 0) { clearInterval(id); onNext(); }
      else setRemaining(left);
    }, 100);
    return () => clearInterval(id);
  }, [onNext]);

  const isLast = index >= total;
  const halfway = total > 1 && index === Math.ceil(total / 2);
  const ringPct = onNext ? remaining / AUTO_MS : 0;

  let line: string;
  if (isLast) line = `That's the whole course. Every lesson, done.`;
  else if (halfway) line = `That's ${index} of ${total} — you're halfway.`;
  else line = `That's ${index} of ${total}.`;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{ zIndex: 75, background: 'rgba(11,10,15,0.92)', backdropFilter: 'blur(8px)', animation: 'lc-in 0.3s ease both' }}
    >
      <button
        onClick={onDismiss}
        aria-label="Close"
        className="press"
        style={{
          position: 'absolute', top: 'calc(env(safe-area-inset-top, 0px) + 14px)', right: 14,
          minWidth: 40, minHeight: 40, borderRadius: '50%',
          background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.16)',
          color: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer',
        }}
      >
        <X size={18} />
      </button>

      <div style={{ textAlign: 'center', padding: '0 24px', maxWidth: 420, width: '100%' }}>
        {/* The tick draws itself — the one place worth a real animation */}
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" style={{ marginBottom: 20 }}>
          <circle cx="12" cy="12" r="10.5" stroke={GOLD} strokeWidth="1" opacity="0.35" />
          <path
            className="lc-tick"
            d="M6.5 12.5l3.6 3.6L17.5 8.5"
            stroke={GOLD} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          />
        </svg>

        <p style={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: '0.22em', textTransform: 'uppercase', color: GOLD, marginBottom: 12 }}>
          {isLast ? 'Course complete' : 'Lesson done'}
        </p>

        <h2 style={{ fontFamily: DISP, fontSize: 'clamp(28px,7vw,38px)', fontWeight: 600, color: '#F2F0F5', lineHeight: 1.1, margin: '0 0 10px' }}>
          {isLast ? 'You finished it.' : 'Nice work.'}
        </h2>
        <p style={{ fontFamily: UI, fontSize: 15.5, color: 'rgba(242,240,245,0.7)', lineHeight: 1.55, marginBottom: 28 }}>
          {line}
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {onNext && nextTitle && (
            <button onClick={onNext} className="press" style={{
              position: 'relative', overflow: 'hidden',
              minHeight: 52, borderRadius: 12, border: 'none', cursor: 'pointer',
              background: GOLD, color: '#0B0A0F',
              fontFamily: UI, fontSize: 14.5, fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              padding: '0 18px',
            }}>
              {/* visible auto-advance countdown */}
              <span aria-hidden style={{
                position: 'absolute', left: 0, top: 0, bottom: 0,
                width: `${ringPct * 100}%`, background: 'rgba(0,0,0,0.12)',
                transition: 'width 0.1s linear',
              }} />
              <span style={{ position: 'relative', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                Next: “{nextTitle}”
              </span>
              <ArrowRight size={16} style={{ position: 'relative', flexShrink: 0 }} />
            </button>
          )}

          {onQuiz && quizCount > 0 && (
            <button onClick={onQuiz} className="press" style={{
              minHeight: 48, borderRadius: 12, cursor: 'pointer',
              background: 'transparent', color: 'rgba(242,240,245,0.9)',
              border: '1px solid rgba(255,255,255,0.18)',
              fontFamily: UI, fontSize: 13.5, fontWeight: 600,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}>
              <ListChecks size={15} />
              Try the quiz ({quizCount} question{quizCount !== 1 ? 's' : ''})
            </button>
          )}

          {!onNext && (
            <button onClick={onDismiss} className="press" style={{
              minHeight: 48, borderRadius: 12, cursor: 'pointer',
              background: onQuiz && quizCount > 0 ? 'transparent' : GOLD,
              color: onQuiz && quizCount > 0 ? 'rgba(242,240,245,0.7)' : '#0B0A0F',
              border: onQuiz && quizCount > 0 ? '1px solid rgba(255,255,255,0.18)' : 'none',
              fontFamily: UI, fontSize: 13.5, fontWeight: 600,
            }}>
              Back to the course
            </button>
          )}
        </div>
      </div>

      <style>{`
        @keyframes lc-in   { from { opacity: 0; } }
        @keyframes lc-draw { from { stroke-dashoffset: 22; } to { stroke-dashoffset: 0; } }
        .lc-tick { stroke-dasharray: 22; animation: lc-draw 420ms cubic-bezier(0.16,1,0.3,1) 120ms both; }
        @media (prefers-reduced-motion: reduce) {
          .lc-tick { animation: none; stroke-dashoffset: 0; }
        }
      `}</style>
    </div>
  );
}
