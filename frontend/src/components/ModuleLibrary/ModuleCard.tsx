import { useNavigate } from 'react-router-dom';
import { Play, Clock, MessageSquare, CheckCircle2, BookOpen, Lock, ShoppingCart } from 'lucide-react';
import type { Module } from '../../types';

// ── Design tokens — light, purple + lime ────────────────────────────────────
const GOLD   = '#8e2d9e';   // purple — primary accent (was gold)
const TERRA  = '#7cb342';   // lime green — secondary (was terracotta)
const GREEN  = '#3a9d5d';   // success green
const DARK2  = '#ffffff';   // card surface
const DARK3  = '#f1eef4';   // thumbnail placeholder
const INK    = '#1f1f24';   // primary text
const INK2   = '#5c5764';   // secondary text
const INK3   = '#9b96a3';   // muted text
const BORDER = 'rgba(31,31,36,0.10)';

function formatDuration(seconds: number) {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  return m < 60 ? `${m}m` : `${Math.floor(m / 60)}h ${m % 60}m`;
}

const STATUS_CONFIG = {
  not_started: { dot: 'rgba(255,255,255,0.2)', label: 'Not Started',  labelColor: INK3 },
  in_progress:  { dot: GOLD,                   label: 'In Progress',   labelColor: GOLD  },
  completed:    { dot: GREEN,                   label: 'Completed',     labelColor: GREEN },
};

interface Props { module: Module; }

function formatPrice(price: number, currency: string) {
  return `${Number(price).toLocaleString()} ${currency}`;
}

export default function ModuleCard({ module }: Props) {
  const navigate  = useNavigate();
  const status    = module.status ?? 'not_started';
  const cfg       = STATUS_CONFIG[status];
  const progress  = module.duration_seconds > 0
    ? Math.round(((module.progress_seconds ?? 0) / module.duration_seconds) * 100)
    : 0;

  const isPaid    = module.is_for_sale && !!module.price;
  // `has_access` is the authoritative flag from the backend (ModuleAccess +
  // global payment_verified). Fall back to the old heuristic only if the
  // server didn't send the field (older API).
  const isLocked  = module.has_access === false
    ? true
    : module.has_access === undefined
      ? isPaid && status === 'not_started'
      : false;

  const handleClick = () => {
    if (isLocked) {
      navigate(`/pay/submit?module_id=${module.id}`);
    } else {
      navigate(`/modules/${module.id}`);
    }
  };

  // Strip HTML tags from description for clean preview
  const plainDesc = module.description
    ? module.description.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
    : '';

  return (
    <article
      onClick={handleClick}
      style={{
        background: DARK2,
        border: `1px solid ${BORDER}`,
        borderRadius: 14,
        overflow: 'hidden',
        cursor: 'pointer',
        boxShadow: '0 1px 2px rgba(31,31,36,0.04), 0 4px 14px rgba(31,31,36,0.05)',
        transition: 'transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease',
        display: 'flex',
        flexDirection: 'column',
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLElement;
        el.style.transform = 'translateY(-3px)';
        el.style.boxShadow = '0 16px 40px rgba(31,31,36,0.12), 0 0 0 1px rgba(142,45,158,0.14)';
        el.style.borderColor = 'rgba(142,45,158,0.22)';
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLElement;
        el.style.transform = 'translateY(0)';
        el.style.boxShadow = '0 1px 2px rgba(31,31,36,0.04), 0 4px 14px rgba(31,31,36,0.05)';
        el.style.borderColor = BORDER;
      }}
    >
      {/* Thumbnail */}
      <div style={{ position: 'relative', aspectRatio: '16/9', background: DARK3, overflow: 'hidden', flexShrink: 0 }}>
        {module.thumbnail_url ? (
          <img
            src={module.thumbnail_url}
            alt={module.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s ease' }}
            onMouseEnter={e => ((e.currentTarget as HTMLImageElement).style.transform = 'scale(1.05)')}
            onMouseLeave={e => ((e.currentTarget as HTMLImageElement).style.transform = 'scale(1)')}
          />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #f3edf6 0%, #eef4e6 100%)' }}>
            <BookOpen size={28} style={{ color: 'rgba(142,45,158,0.30)' }} />
          </div>
        )}

        {/* Gradient overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to top, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.1) 50%, transparent 100%)',
        }} />

        {/* Centered play button (hover) */}
        <div
          className="card-play-btn"
          style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <div style={{
            width: 44, height: 44, borderRadius: '50%',
            background: 'rgba(255,255,255,0.92)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            opacity: 0, transform: 'scale(0.75)',
            transition: 'opacity 0.2s ease, transform 0.2s ease',
            boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
          }}
            className="card-play-icon"
          >
            <Play size={18} fill="#0b0c0f" color="#0b0c0f" style={{ marginLeft: 2 }} />
          </div>
        </div>

        {/* Status chip — top left */}
        <div style={{
          position: 'absolute', top: 12, left: 12,
          display: 'flex', alignItems: 'center', gap: 5,
          background: 'rgba(11,12,15,0.75)', backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 100, padding: '3px 10px 3px 8px',
        }}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: cfg.dot, display: 'inline-block', flexShrink: 0 }} />
          <span style={{ fontFamily: 'monospace', fontSize: 9.5, letterSpacing: '0.1em', textTransform: 'uppercase', color: cfg.labelColor, fontWeight: 500 }}>
            {cfg.label}
          </span>
        </div>

        {/* Duration — bottom right */}
        <div style={{
          position: 'absolute', bottom: 12, right: 12,
          display: 'flex', alignItems: 'center', gap: 5,
          background: 'rgba(11,12,15,0.75)', backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 6, padding: '3px 9px',
          fontFamily: 'monospace', fontSize: 11, color: INK2,
        }}>
          <Clock size={10} style={{ color: INK3 }} />
          {formatDuration(module.duration_seconds)}
        </div>

        {/* Completed checkmark */}
        {status === 'completed' && (
          <div style={{
            position: 'absolute', bottom: 12, left: 12,
            width: 26, height: 26, borderRadius: '50%',
            background: 'rgba(52,211,153,0.15)', border: '1px solid rgba(52,211,153,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <CheckCircle2 size={14} style={{ color: GREEN }} />
          </div>
        )}

        {/* Price badge — top right */}
        {isPaid && (
          <div style={{
            position: 'absolute', top: 12, right: 12,
            display: 'flex', alignItems: 'center', gap: 5,
            background: isLocked ? 'rgba(142,45,158,0.88)' : 'rgba(58,157,93,0.9)',
            backdropFilter: 'blur(8px)',
            borderRadius: 100, padding: '3px 10px 3px 8px',
          }}>
            {isLocked
              ? <Lock size={9} style={{ color: '#fff' }} />
              : <CheckCircle2 size={9} style={{ color: '#fff' }} />}
            <span style={{
              fontFamily: 'monospace', fontSize: 10, letterSpacing: '0.08em',
              color: '#fff', fontWeight: 600,
            }}>
              {isLocked ? formatPrice(module.price!, module.currency ?? 'RWF') : 'Purchased'}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ padding: '18px 20px 20px', flex: 1, display: 'flex', flexDirection: 'column' }}>

        {/* Title */}
        <h3 style={{
          fontFamily: "'Lora', Georgia, serif",
          fontSize: 16, fontWeight: 600, lineHeight: 1.35,
          letterSpacing: '-0.01em', color: INK,
          marginBottom: 8,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {module.title}
        </h3>

        {/* Description */}
        {plainDesc && (
          <p style={{
            fontSize: 12.5, color: INK3, lineHeight: 1.6,
            marginBottom: 14, flex: 1,
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>
            {plainDesc}
          </p>
        )}

        {/* Meta row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 'auto', paddingTop: plainDesc ? 0 : 6 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'monospace', fontSize: 10.5, color: INK3, letterSpacing: '0.04em' }}>
            <Play size={9} style={{ color: INK3 }} />
            {module.video_count} LESSON{module.video_count !== 1 ? 'S' : ''}
          </span>
          {module.question_count > 0 && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'monospace', fontSize: 10.5, color: INK3, letterSpacing: '0.04em' }}>
              <MessageSquare size={9} style={{ color: INK3 }} />
              {module.question_count} Q&amp;A
            </span>
          )}
        </div>

        {/* Buy CTA — locked paid modules */}
        {isLocked && (
          <div
            style={{
              marginTop: 14,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: 'rgba(142,45,158,0.07)', border: '1px solid rgba(142,45,158,0.2)',
              borderRadius: 8, padding: '10px 14px',
            }}
            onClick={e => { e.stopPropagation(); navigate(`/pay/submit?module_id=${module.id}`); }}
          >
            <div>
              <p style={{ fontFamily: 'monospace', fontSize: 9.5, letterSpacing: '0.1em', textTransform: 'uppercase', color: GOLD, marginBottom: 2 }}>
                Purchase to unlock
              </p>
              <p style={{ fontFamily: "'Lora', Georgia, serif", fontSize: 15, fontWeight: 600, color: INK, letterSpacing: '-0.01em' }}>
                {formatPrice(module.price!, module.currency ?? 'RWF')}
              </p>
            </div>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: GOLD, display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <ShoppingCart size={14} style={{ color: '#fff' }} />
            </div>
          </div>
        )}

        {/* Progress bar */}
        {(status === 'in_progress' || status === 'completed') && (
          <div style={{ marginTop: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontFamily: 'monospace', fontSize: 9.5, letterSpacing: '0.1em', textTransform: 'uppercase', color: INK3 }}>Progress</span>
              <span style={{ fontFamily: 'monospace', fontSize: 10, fontWeight: 600, color: status === 'completed' ? GREEN : GOLD }}>
                {progress}%
              </span>
            </div>
            <div style={{ height: 3, background: 'rgba(31,31,36,0.08)', borderRadius: 100, overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: 100,
                background: status === 'completed' ? GREEN : GOLD,
                width: `${progress}%`,
                transition: 'width 0.8s ease',
              }} />
            </div>
          </div>
        )}
      </div>

      {/* Hover play overlay via style injection */}
      <style>{`
        article:hover .card-play-icon {
          opacity: 1 !important;
          transform: scale(1) !important;
        }
      `}</style>
    </article>
  );
}
