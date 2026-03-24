import { useRef, useState } from 'react';
import { usePlayerStore } from '../../store';
import type { TimelineMarker } from '../../types';
import clsx from 'clsx';

function formatTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
}

interface Props {
  markers: TimelineMarker[];
  onSeek: (t: number) => void;
  onMarkerClick: (m: TimelineMarker) => void;
  onAskAt?: (t: number) => void;
}

export default function Timeline({ markers, onSeek, onMarkerClick, onAskAt }: Props) {
  const { currentTime, duration } = usePlayerStore();
  const barRef = useRef<HTMLDivElement>(null);
  const [hoveredTs, setHoveredTs] = useState<number | null>(null);
  const [tooltipMarker, setTooltipMarker] = useState<TimelineMarker | null>(null);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const getTimeFromEvent = (e: React.MouseEvent) => {
    if (!barRef.current || duration === 0) return 0;
    const rect = barRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    return ratio * duration;
  };

  const handleBarClick = (e: React.MouseEvent) => onSeek(getTimeFromEvent(e));
  const handleMouseMove = (e: React.MouseEvent) => setHoveredTs(getTimeFromEvent(e));

  return (
    <div className="relative mb-2">
      {/* Timestamp labels */}
      <div className="flex justify-between mb-1 px-0.5" style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 11, color: 'rgba(255,255,255,0.55)', letterSpacing: '0.05em' }}>
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(duration)}</span>
      </div>

      {/* Bar */}
      <div
        ref={barRef}
        className="relative cursor-pointer group/bar rounded-full transition-all duration-150"
        style={{ height: 3, background: 'rgba(255,255,255,0.12)' }}
        onClick={handleBarClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => { setHoveredTs(null); setTooltipMarker(null); }}
        onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.height = '5px'; }}
      >
        {/* Gold fill */}
        <div
          className="absolute left-0 top-0 h-full rounded-full transition-[width] duration-100"
          style={{ width: `${progress}%`, background: '#e8c97e' }}
        />

        {/* Glowing gold scrubber dot */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full opacity-0 group-hover/bar:opacity-100 transition-opacity"
          style={{
            left: `calc(${progress}% - 5px)`,
            background: '#e8c97e',
            boxShadow: '0 0 0 3px rgba(232,201,126,0.2), 0 0 10px rgba(232,201,126,0.55)',
          }}
        />

        {/* Hover indicator + ask-at button */}
        {hoveredTs !== null && duration > 0 && (
          <>
            <div
              className="absolute top-1/2 -translate-y-1/2 w-px h-4 rounded"
              style={{ left: `${(hoveredTs / duration) * 100}%`, background: 'rgba(255,255,255,0.35)' }}
            />
            {onAskAt && (
              <button
                className="absolute bottom-full mb-2 -translate-x-1/2 flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded transition-colors z-30 whitespace-nowrap"
                style={{
                  left: `${(hoveredTs / duration) * 100}%`,
                  background: 'rgba(232,201,126,0.12)',
                  border: '1px solid rgba(232,201,126,0.28)',
                  color: '#e8c97e',
                  fontFamily: 'monospace',
                  letterSpacing: '0.06em',
                }}
                onClick={(e) => { e.stopPropagation(); onAskAt(hoveredTs); }}
              >
                + Ask at {formatTime(hoveredTs)}
              </button>
            )}
          </>
        )}

        {/* Question markers */}
        {markers.map((m) => {
          const pct = duration > 0 ? (m.timestamp_seconds / duration) * 100 : 0;
          const isAnswered = m.status === 'answered';
          return (
            <button
              key={m.question_id}
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full border-2 transition-transform hover:scale-150 z-10 focus:outline-none"
              style={{
                left: `${pct}%`,
                background: isAnswered ? '#34d399' : '#e8c97e',
                borderColor: '#0b0c0f',
              }}
              onClick={(e) => { e.stopPropagation(); onMarkerClick(m); }}
              onMouseEnter={() => setTooltipMarker(m)}
              onMouseLeave={() => setTooltipMarker(null)}
              aria-label={`Question at ${formatTime(m.timestamp_seconds)}`}
            />
          );
        })}

        {/* Marker tooltip */}
        {tooltipMarker && (
          <div
            className="absolute bottom-full mb-3 -translate-x-1/2 text-xs rounded-lg px-3 py-2 w-56 shadow-xl pointer-events-none z-20 animate-fade-in"
            style={{
              left: `${(tooltipMarker.timestamp_seconds / duration) * 100}%`,
              background: '#1c1e27',
              border: '1px solid rgba(255,255,255,0.08)',
              color: '#e8e4dc',
            }}
          >
            <div className="flex items-center gap-1.5 mb-1">
              <span style={{ fontFamily: 'monospace', color: '#e8c97e', fontSize: 11 }}>
                {formatTime(tooltipMarker.timestamp_seconds)}
              </span>
              <span className={clsx(
                'text-[10px] px-1.5 py-0.5 rounded font-medium',
                tooltipMarker.status === 'answered'
                  ? 'bg-emerald-900/60 text-emerald-300'
                  : 'bg-amber-900/60 text-amber-300'
              )}>
                {tooltipMarker.status}
              </span>
            </div>
            <p style={{ color: '#9ca3af', fontSize: 11 }} className="line-clamp-2">{tooltipMarker.question_preview}</p>
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full border-4 border-transparent" style={{ borderTopColor: '#1c1e27' }} />
          </div>
        )}
      </div>
    </div>
  );
}
