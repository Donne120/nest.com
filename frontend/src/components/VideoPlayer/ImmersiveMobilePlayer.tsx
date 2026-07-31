import { useEffect, useRef, useState, useCallback } from 'react';
import { X, ChevronUp, ChevronDown, ChevronRight, MoreVertical, HelpCircle, Play, Pause, ListChecks } from 'lucide-react';
import type { Video } from '../../types';

const ACC  = '#b259c4';
const UI   = "'Inter Tight', 'Inter', system-ui, sans-serif";
const MONO = "'DM Mono', ui-monospace, monospace";

interface Props {
  video: Video;
  videoUrl: string;
  index: number;          // 1-based position in the module
  total: number;
  hasPrev: boolean;
  hasNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  onExit: () => void;
  onAsk: (atTime: number) => void;   // pass the CURRENT playback time so the question is timestamped
  onQuiz?: () => void;
  hasQuiz?: boolean;
  overlayOpen?: boolean;             // an Ask/Quiz overlay is up → pause; on close → resume
}

function fmt(s: number) {
  if (!isFinite(s) || s < 0) return '0:00';
  const m = Math.floor(s / 60);
  return `${m}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
}

/**
 * Full-screen immersive lesson player for phones — a familiar, TikTok-like way
 * to consume a course: the video fills the screen, controls float on top, and
 * swiping up/down moves to the next/previous lesson in the module.
 *
 * Deliberately self-contained: it owns its own <video> so the main VideoPage
 * player is unmounted while this is open (never two decoders at once).
 */
export default function ImmersiveMobilePlayer({
  video, videoUrl, index, total, hasPrev, hasNext,
  onPrev, onNext, onExit, onAsk, onQuiz, hasQuiz, overlayOpen = false,
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const bgRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying]   = useState(true);
  const [current, setCurrent]   = useState(0);
  const [duration, setDuration] = useState(0);
  const [hint, setHint]         = useState(true);      // first-run swipe hint
  const [swipe, setSwipe]       = useState<'up' | 'down' | null>(null);
  const [railOpen, setRailOpen] = useState(true);      // collapsible Ask/Quiz rail

  const touchStart = useRef<{ y: number; t: number } | null>(null);
  const resumeAfterOverlay = useRef(false);

  // Keep the blurred ambient background loosely in sync with the main video —
  // when they drift (seek/pause), snap it back. Cheap: only correct on real gaps.
  const syncBg = useCallback((t: number, isPlaying: boolean) => {
    const b = bgRef.current;
    if (!b) return;
    if (Math.abs(b.currentTime - t) > 0.4) b.currentTime = t;
    if (isPlaying && b.paused) b.play().catch(() => {});
    if (!isPlaying && !b.paused) b.pause();
  }, []);

  // Lock body scroll while immersive
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  // Ask / Quiz overlay open → pause the lesson at the current moment. When the
  // learner is done (submits or dismisses) → resume from where it stopped, but
  // only if it was actually playing when they opened the overlay.
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (overlayOpen) {
      resumeAfterOverlay.current = !v.paused;
      v.pause();
      setPlaying(false);
    } else if (resumeAfterOverlay.current) {
      resumeAfterOverlay.current = false;
      v.play().catch(() => {});
      setPlaying(true);
    }
  }, [overlayOpen]);

  // Hide the swipe hint after a moment
  useEffect(() => {
    const t = setTimeout(() => setHint(false), 2800);
    return () => clearTimeout(t);
  }, []);

  const togglePlay = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) { v.play().catch(() => {}); setPlaying(true); }
    else { v.pause(); setPlaying(false); }
  }, []);

  // Swipe up = next lesson, swipe down = previous
  const onTouchStart = (e: React.TouchEvent) => {
    touchStart.current = { y: e.touches[0].clientY, t: Date.now() };
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    const s = touchStart.current;
    touchStart.current = null;
    if (!s) return;
    const dy = e.changedTouches[0].clientY - s.y;
    const dt = Date.now() - s.t;
    // deliberate vertical flick only
    if (Math.abs(dy) < 70 || dt > 700) return;
    if (dy < 0 && hasNext) { setSwipe('up'); onNext(); }
    else if (dy > 0 && hasPrev) { setSwipe('down'); onPrev(); }
    setTimeout(() => setSwipe(null), 320);
  };

  const pct = duration > 0 ? (current / duration) * 100 : 0;

  return (
    <div
      className="fixed inset-0"
      style={{ zIndex: 70, background: '#000', animation: 'imm-in 0.25s ease both' }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Ambient blurred fill — the same frame, scaled up + blurred behind the
          real video, so the empty letterbox space glows instead of dead black
          (TikTok / YouTube Shorts style). Muted, decorative, follows the player. */}
      <video
        ref={bgRef}
        src={videoUrl}
        autoPlay
        muted
        playsInline
        aria-hidden
        preload="metadata"
        className="absolute inset-0 w-full h-full"
        style={{ objectFit: 'cover', filter: 'blur(28px) brightness(0.55) saturate(1.3)', transform: 'scale(1.25)', pointerEvents: 'none' }}
      />

      {/* Video — sits on the blurred fill */}
      <video
        ref={videoRef}
        src={videoUrl}
        autoPlay
        playsInline
        preload="metadata"
        className="absolute inset-0 w-full h-full"
        style={{ objectFit: 'contain', animation: swipe ? `imm-${swipe} 0.32s ease` : undefined }}
        onClick={togglePlay}
        onTimeUpdate={e => { setCurrent(e.currentTarget.currentTime); syncBg(e.currentTarget.currentTime, !e.currentTarget.paused); }}
        onLoadedMetadata={e => setDuration(e.currentTarget.duration)}
        onPlay={() => { setPlaying(true); syncBg(videoRef.current?.currentTime ?? 0, true); }}
        onPause={() => { setPlaying(false); syncBg(videoRef.current?.currentTime ?? 0, false); }}
        onSeeked={e => syncBg(e.currentTarget.currentTime, !e.currentTarget.paused)}
        onEnded={() => { if (hasNext) onNext(); }}
      />

      {/* Tap-to-play affordance */}
      {!playing && (
        <button
          onClick={togglePlay}
          aria-label="Play"
          className="absolute inset-0 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.25)' }}
        >
          <span style={{ width: 74, height: 74, borderRadius: '50%', background: 'rgba(0,0,0,0.55)', border: '1.5px solid rgba(255,255,255,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(6px)' }}>
            <Play size={30} fill="#fff" color="#fff" style={{ marginLeft: 4 }} />
          </span>
        </button>
      )}

      {/* Top bar — exit + position */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 12px)', paddingBottom: 12, background: 'linear-gradient(180deg, rgba(0,0,0,0.6), transparent)', pointerEvents: 'none' }}>
        <button onClick={onExit} aria-label="Back to course"
          className="flex items-center justify-center rounded-full"
          style={{ minWidth: 40, minHeight: 40, background: 'rgba(0,0,0,0.45)', border: '1px solid rgba(255,255,255,0.18)', color: '#fff', pointerEvents: 'auto' }}>
          <X size={20} />
        </button>
        <span style={{ fontFamily: MONO, fontSize: 12, color: 'rgba(255,255,255,0.9)', background: 'rgba(0,0,0,0.45)', padding: '5px 12px', borderRadius: 100, pointerEvents: 'auto' }}>
          {index} / {total}
        </span>
      </div>

      {/* Right rail — Ask / Quiz / prev / next. Collapsible so it never blocks
          the video: tap the handle to slide it out of the way and back. */}
      <div className="absolute flex flex-col items-center"
        style={{ right: 12, bottom: 'calc(env(safe-area-inset-bottom, 0px) + 110px)', gap: 10 }}>
        {/* Toggle handle */}
        <button
          onClick={() => setRailOpen(o => !o)}
          aria-label={railOpen ? 'Hide controls' : 'Show controls'}
          className="flex items-center justify-center rounded-full"
          style={{ width: 34, height: 34, background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.18)', color: '#fff', backdropFilter: 'blur(6px)' }}
        >
          {railOpen ? <ChevronRight size={18} /> : <MoreVertical size={18} />}
        </button>

        {/* The actions — slide + fade away when collapsed */}
        <div
          className="flex flex-col items-center"
          style={{
            gap: 16,
            transition: 'transform 0.28s cubic-bezier(0.34,1.56,0.64,1), opacity 0.2s',
            transform: railOpen ? 'translateX(0)' : 'translateX(78px)',
            opacity: railOpen ? 1 : 0,
            pointerEvents: railOpen ? 'auto' : 'none',
          }}
        >
          <RailBtn
            label="Ask"
            accent
            onClick={() => onAsk(videoRef.current ? videoRef.current.currentTime : current)}
          ><HelpCircle size={24} /></RailBtn>
          {hasQuiz && onQuiz && <RailBtn label="Quiz" onClick={onQuiz}><ListChecks size={24} /></RailBtn>}
          <RailBtn label="Prev" onClick={onPrev} disabled={!hasPrev}><ChevronUp size={24} /></RailBtn>
          <RailBtn label="Next" onClick={onNext} disabled={!hasNext}><ChevronDown size={24} /></RailBtn>
        </div>
      </div>

      {/* Bottom — title + scrubber */}
      <div className="absolute left-0 right-0 bottom-0 px-4"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)', paddingTop: 40, background: 'linear-gradient(0deg, rgba(0,0,0,0.85), transparent)' }}>
        <p style={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: '0.16em', textTransform: 'uppercase', color: ACC, marginBottom: 6 }}>
          Lesson {index} of {total}
        </p>
        <h2 style={{ fontFamily: UI, fontSize: 17, fontWeight: 700, color: '#fff', lineHeight: 1.3, marginBottom: 12, paddingRight: 70 }}>
          {video.title}
        </h2>

        <div className="flex items-center gap-3">
          <button onClick={togglePlay} aria-label={playing ? 'Pause' : 'Play'}
            className="flex items-center justify-center rounded-full flex-shrink-0"
            style={{ minWidth: 44, minHeight: 44, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff' }}>
            {playing ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
          </button>
          <span style={{ fontFamily: MONO, fontSize: 11, color: 'rgba(255,255,255,0.75)', flexShrink: 0 }}>{fmt(current)}</span>
          <input
            type="range" min={0} max={duration || 0} step={0.1} value={current}
            onChange={e => { const t = Number(e.target.value); if (videoRef.current) videoRef.current.currentTime = t; setCurrent(t); }}
            aria-label="Seek"
            style={{ flex: 1, height: 4, accentColor: ACC }}
          />
          <span style={{ fontFamily: MONO, fontSize: 11, color: 'rgba(255,255,255,0.5)', flexShrink: 0 }}>{fmt(duration)}</span>
        </div>
        {/* thin progress echo */}
        <div style={{ height: 2, background: 'rgba(255,255,255,0.15)', borderRadius: 2, marginTop: 10, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${pct}%`, background: ACC, transition: 'width 0.2s linear' }} />
        </div>
      </div>

      {/* First-run swipe hint */}
      {hint && (hasNext || hasPrev) && (
        <div className="absolute left-1/2 flex flex-col items-center"
          style={{ bottom: '42%', transform: 'translateX(-50%)', pointerEvents: 'none', animation: 'imm-hint 2.8s ease forwards' }}>
          <ChevronUp size={22} color="#fff" style={{ opacity: 0.9 }} />
          <span style={{ fontFamily: UI, fontSize: 12.5, color: '#fff', background: 'rgba(0,0,0,0.5)', padding: '6px 12px', borderRadius: 100, marginTop: 4 }}>
            Swipe for next lesson
          </span>
        </div>
      )}

      <style>{`
        @keyframes imm-in   { from{opacity:0} to{opacity:1} }
        @keyframes imm-up   { from{transform:translateY(28px);opacity:0.4} to{transform:translateY(0);opacity:1} }
        @keyframes imm-down { from{transform:translateY(-28px);opacity:0.4} to{transform:translateY(0);opacity:1} }
        @keyframes imm-hint { 0%{opacity:0} 15%{opacity:1} 75%{opacity:1} 100%{opacity:0} }
        @media (prefers-reduced-motion: reduce) {
          [style*="imm-"] { animation: none !important; }
        }
      `}</style>
    </div>
  );
}

function RailBtn({ children, label, onClick, disabled, accent }: {
  children: React.ReactNode; label: string; onClick?: () => void; disabled?: boolean; accent?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="flex flex-col items-center gap-1"
      style={{ background: 'none', border: 'none', cursor: disabled ? 'default' : 'pointer', opacity: disabled ? 0.3 : 1 }}
    >
      <span style={{
        width: 48, height: 48, borderRadius: '50%',
        background: accent ? ACC : 'rgba(0,0,0,0.45)',
        border: accent ? 'none' : '1px solid rgba(255,255,255,0.2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
        backdropFilter: 'blur(6px)',
        boxShadow: accent ? '0 6px 20px rgba(178,89,196,0.5)' : 'none',
      }}>
        {children}
      </span>
      <span style={{ fontFamily: MONO, fontSize: 9.5, color: 'rgba(255,255,255,0.85)', letterSpacing: '0.06em' }}>{label}</span>
    </button>
  );
}
