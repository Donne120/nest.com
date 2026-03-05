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
  const [isDragging, setIsDragging] = useState(false);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const getTimeFromEvent = (e: React.MouseEvent) => {
    if (!barRef.current || duration === 0) return 0;
    const rect = barRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    return ratio * duration;
  };

  const handleBarClick = (e: React.MouseEvent) => {
    const t = getTimeFromEvent(e);
    onSeek(t);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    setHoveredTs(getTimeFromEvent(e));
  };

  return (
    <div className="relative mb-2">
      {/* Timestamp labels */}
      <div className="flex justify-between text-xs text-white/70 mb-1 px-0.5">
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(duration)}</span>
      </div>

      {/* Timeline bar */}
      <div
        ref={barRef}
        className="relative h-1.5 bg-white/30 rounded-full cursor-pointer group/bar hover:h-2.5 transition-all duration-150"
        onClick={handleBarClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => { setHoveredTs(null); setTooltipMarker(null); }}
      >
        {/* Progress fill */}
        <div
          className="absolute left-0 top-0 h-full bg-brand-500 rounded-full transition-[width] duration-100"
          style={{ width: `${progress}%` }}
        />

        {/* Scrubber thumb */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow opacity-0 group-hover/bar:opacity-100 transition-opacity"
          style={{ left: `calc(${progress}% - 6px)` }}
        />

        {/* Hover position indicator + ask button */}
        {hoveredTs !== null && duration > 0 && (
          <>
            <div
              className="absolute top-1/2 -translate-y-1/2 w-0.5 h-4 bg-white/50 rounded"
              style={{ left: `${(hoveredTs / duration) * 100}%` }}
            />
            {onAskAt && (
              <button
                className="absolute bottom-full mb-1.5 -translate-x-1/2 flex items-center gap-1 bg-brand-600 hover:bg-brand-700 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded shadow-lg transition-colors z-30 whitespace-nowrap"
                style={{ left: `${(hoveredTs / duration) * 100}%` }}
                onClick={(e) => { e.stopPropagation(); onAskAt(hoveredTs); }}
                title={`Ask question at ${formatTime(hoveredTs)}`}
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
              className={clsx(
                'absolute top-1/2 -translate-y-1/2 -translate-x-1/2 rounded-full border-2 border-white',
                'transition-transform hover:scale-150 z-10 focus:outline-none',
                isAnswered ? 'w-2.5 h-2.5 bg-emerald-400' : 'w-3 h-3 bg-amber-400',
              )}
              style={{ left: `${pct}%` }}
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
            className="absolute bottom-full mb-3 -translate-x-1/2 bg-gray-900 text-white text-xs rounded-lg px-3 py-2 w-56 shadow-modal pointer-events-none z-20 animate-fade-in"
            style={{
              left: `${(tooltipMarker.timestamp_seconds / duration) * 100}%`,
            }}
          >
            <div className="flex items-center gap-1.5 mb-1">
              <span className="font-mono text-brand-300">{formatTime(tooltipMarker.timestamp_seconds)}</span>
              <span className={clsx(
                'text-[10px] px-1 py-0.5 rounded',
                tooltipMarker.status === 'answered' ? 'bg-emerald-600' : 'bg-amber-600'
              )}>
                {tooltipMarker.status}
              </span>
            </div>
            <p className="text-gray-200 line-clamp-2">{tooltipMarker.question_preview}</p>
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full border-4 border-transparent border-t-gray-900" />
          </div>
        )}
      </div>
    </div>
  );
}
