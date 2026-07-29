import { useNavigate } from 'react-router-dom';
import { Play, MessageSquare, CheckCircle2, BookOpen, Lock } from 'lucide-react';
import type { Module } from '../../types';

// ── Design tokens — theme-aware (follow light/dark via CSS vars) ────────────
const ACC    = 'var(--c-acc)';   // brand purple
const GOLD   = '#E8B04B';        // earned things only
const GREEN  = '#3a9d5d';
const INK    = 'var(--c-ink)';
const INK2   = 'var(--c-ink2)';
const BORDER = 'var(--c-rule)';
const DISP   = "'Cormorant Garamond', Georgia, serif";
const MONO   = "'DM Mono', ui-monospace, monospace";

function formatDuration(seconds: number) {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  return m < 60 ? `${m}m` : `${Math.floor(m / 60)}h ${m % 60}m`;
}

interface Props { module: Module; }

function formatPrice(price: number, currency: string) {
  return `${Number(price).toLocaleString()} ${currency}`;
}

/**
 * A Nest course poster — deliberately NOT a YouTube tile.
 *
 * The old card was a 16:9 thumbnail + a hover play button + "6 LESSONS · 3 Q&A"
 * in muted mono: a spec sheet that said what was in the box. It also hid its
 * only delight behind :hover, which phones never fire, and injected an
 * unscoped global <style> per card.
 *
 * This is a tall, poster-shaped card (like a phone screen), the promise reads
 * over the image, and the brand's differentiator — "it answers" — is the
 * loudest thing in the meta row.
 */
export default function ModuleCard({ module }: Props) {
  const navigate  = useNavigate();
  const status    = module.status ?? 'not_started';
  // Cap at 100 — progress_seconds can exceed duration (re-watches, seeking), and
  // "262% — keep going" reads as a bug. Clamp both the bar and the label.
  const progress  = module.duration_seconds > 0
    ? Math.min(100, Math.round(((module.progress_seconds ?? 0) / module.duration_seconds) * 100))
    : 0;

  const isPaid    = module.is_for_sale && !!module.price;
  const isLocked  = module.has_access === false
    ? true
    : module.has_access === undefined
      ? isPaid && status === 'not_started'
      : false;

  const done     = status === 'completed';
  const learning = status === 'in_progress';

  const handleClick = () => {
    navigate(isLocked ? `/pay/submit?module_id=${module.id}` : `/modules/${module.id}`);
  };

  // One clean sentence beats two lines of grey mush.
  const plain = module.description
    ? module.description.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
    : '';
  const promise = plain ? (plain.split(/(?<=[.!?])\s/)[0] ?? plain) : '';

  return (
    <article
      onClick={handleClick}
      className="press nest-card"
      style={{
        position: 'relative',
        borderRadius: 16,
        overflow: 'hidden',
        cursor: 'pointer',
        // Tall poster, like a phone screen — not a 16:9 YouTube tile.
        aspectRatio: '3 / 4',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        background: '#12101a',
        // Finished courses look different in kind, not just ticked.
        border: done ? `1px solid rgba(232,176,75,0.55)` : `1px solid ${BORDER}`,
        boxShadow: done ? '0 10px 34px -14px rgba(232,176,75,0.4)' : '0 10px 30px -16px rgba(0,0,0,0.55)',
      }}
    >
      {/* Poster image */}
      {module.thumbnail_url ? (
        <img
          src={module.thumbnail_url}
          alt=""
          loading="lazy"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
        />
      ) : (
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'linear-gradient(150deg, color-mix(in srgb, var(--c-acc) 22%, #12101a) 0%, #12101a 60%, color-mix(in srgb, var(--c-go) 12%, #12101a) 100%)',
        }}>
          <BookOpen size={34} style={{ color: 'rgba(255,255,255,0.18)' }} />
        </div>
      )}

      {/* Scrim so the words always read */}
      <div aria-hidden style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(0deg, rgba(9,8,13,0.96) 6%, rgba(9,8,13,0.75) 34%, rgba(9,8,13,0.25) 62%, rgba(9,8,13,0.35) 100%)',
      }} />
      {done && (
        <div aria-hidden style={{ position: 'absolute', inset: 0, background: 'linear-gradient(0deg, rgba(232,176,75,0.14), transparent 55%)' }} />
      )}

      {/* Top row — status / price */}
      <div style={{ position: 'absolute', top: 12, left: 12, right: 12, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
        {/* Only ever a chip for something the learner has DONE or is DOING.
            An unstarted course is an invitation, not a grey "NOT STARTED" shame badge. */}
        {done ? (
          <Chip color={GOLD} bg="rgba(232,176,75,0.18)" icon={<CheckCircle2 size={11} />}>Finished</Chip>
        ) : learning ? (
          <Chip color="#D9A0E8" bg="rgba(199,125,218,0.2)" dot>Learning now</Chip>
        ) : <span />}

        {isPaid && (
          isLocked
            ? <Chip color="#fff" bg="rgba(123,45,142,0.9)" icon={<Lock size={10} />}>{formatPrice(module.price!, module.currency ?? 'RWF')}</Chip>
            : <Chip color="#fff" bg="rgba(58,157,93,0.9)" icon={<CheckCircle2 size={10} />}>Yours</Chip>
        )}
      </div>

      {/* Content — sits on the poster. Extra bottom room on finished cards so
          the certificate button (rendered by the grid) never covers the text. */}
      <div className="nest-card-body" style={{ position: 'relative', padding: done ? '16px 16px 54px' : '16px 16px 14px' }}>
        <h3 className="nest-card-title" style={{
          fontFamily: DISP, fontSize: 20, fontWeight: 600, lineHeight: 1.16,
          letterSpacing: '-0.01em', color: '#F2F0F5', marginBottom: promise ? 6 : 10,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {module.title}
        </h3>

        {/* The promise — one sentence, well set. Was 2 lines of 12.5px grey. */}
        {promise && (
          <p className="nest-card-promise" style={{
            fontFamily: DISP, fontStyle: 'italic', fontSize: 14.5,
            color: 'rgba(242,240,245,0.72)', lineHeight: 1.45, marginBottom: 12,
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>
            {promise}
          </p>
        )}

        {/* Meta — the differentiator is the LOUDEST thing here */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontFamily: MONO, fontSize: 10.5, color: 'rgba(242,240,245,0.5)', letterSpacing: '0.04em' }}>
            {module.video_count} lesson{module.video_count !== 1 ? 's' : ''} · {formatDuration(module.duration_seconds)}
          </span>
          {module.question_count > 0 && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              fontFamily: MONO, fontSize: 10, fontWeight: 500,
              color: '#D9A0E8', background: 'rgba(199,125,218,0.16)',
              border: '1px solid rgba(199,125,218,0.3)',
              borderRadius: 100, padding: '3px 9px', marginLeft: 'auto',
            }}>
              <MessageSquare size={9} />
              {module.question_count} answer{module.question_count !== 1 ? 's' : ''} waiting
            </span>
          )}
        </div>

        {/* Locked — lead with generosity, not the till */}
        {isLocked && (
          <div
            onClick={e => { e.stopPropagation(); navigate(`/pay/submit?module_id=${module.id}`); }}
            className="press"
            style={{
              marginTop: 14, minHeight: 42, borderRadius: 10,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
              background: GOLD, color: '#0B0A0F',
              fontSize: 12.5, fontWeight: 700,
            }}
          >
            <Play size={12} fill="currentColor" /> Watch the first lesson free
          </div>
        )}

        {/* Progress — the learner's own effort */}
        {(learning || done) && !isLocked && (
          <div style={{ marginTop: 14 }}>
            <div style={{ height: 3, background: 'rgba(255,255,255,0.16)', borderRadius: 100, overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: 100,
                background: done ? GOLD : ACC,
                transform: `scaleX(${Math.min(progress, 100) / 100})`, transformOrigin: 'left',
              }} />
            </div>
            <span style={{ fontFamily: MONO, fontSize: 9.5, color: 'rgba(242,240,245,0.45)', marginTop: 6, display: 'inline-block' }}>
              {done ? 'Finished' : progress >= 95 ? `${progress}% — almost there` : `${progress}% — keep going`}
            </span>
          </div>
        )}
      </div>
    </article>
  );
}

function Chip({ children, color, bg, icon, dot }: {
  children: React.ReactNode; color: string; bg: string; icon?: React.ReactNode; dot?: boolean;
}) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      background: bg, backdropFilter: 'blur(8px)',
      border: `1px solid ${color}44`,
      borderRadius: 100, padding: '4px 10px',
      fontFamily: MONO, fontSize: 9.5, fontWeight: 500,
      letterSpacing: '0.08em', textTransform: 'uppercase', color,
      whiteSpace: 'nowrap',
    }}>
      {dot && <span style={{ width: 5, height: 5, borderRadius: '50%', background: color, flexShrink: 0 }} />}
      {icon}
      {children}
    </span>
  );
}
