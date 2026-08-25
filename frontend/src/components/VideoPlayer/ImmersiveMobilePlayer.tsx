import { useEffect, useRef, useState, useCallback } from 'react';
import { X, ChevronUp, ChevronDown, ChevronRight, MoreVertical, HelpCircle, Play, Pause, ListChecks, BookOpen } from 'lucide-react';
import type { Video } from '../../types';
import { getYouTubeId, getVimeoId, loadYouTubeAPI } from '../../lib/youtube';

const ACC  = '#6D4AE0';   // Calm Purple violet (was off-palette pink-orchid #b259c4)
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
  onNotes?: () => void;              // open the study-material drawer
  hasNotes?: boolean;
  overlayOpen?: boolean;             // an Ask/Quiz/Notes overlay is up → pause; on close → resume
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
  onPrev, onNext, onExit, onAsk, onQuiz, hasQuiz, onNotes, hasNotes, overlayOpen = false,
}: Props) {
  // What kind of media backs this lesson: a real file we drive via <video>, or a
  // YouTube / Vimeo embed we drive via its iframe API — all shown full-screen in
  // the same TikTok chrome so mobile never sees a boxed desktop-style player.
  const ytId = getYouTubeId(videoUrl);
  const viId = ytId ? null : getVimeoId(videoUrl);
  const kind: 'youtube' | 'vimeo' | 'native' = ytId ? 'youtube' : viId ? 'vimeo' : 'native';

  const videoRef = useRef<HTMLVideoElement>(null);
  const bgRef = useRef<HTMLVideoElement>(null);
  const ytRef = useRef<any>(null);                     // YT.Player instance
  const ytBoxId = useRef(`imm-yt-${Math.random().toString(36).slice(2)}`).current;
  const [playing, setPlaying]   = useState(true);
  const [current, setCurrent]   = useState(0);
  const [duration, setDuration] = useState(0);
  const [hint, setHint]         = useState(true);      // first-run swipe hint
  const [swipe, setSwipe]       = useState<'up' | 'down' | null>(null);
  const [railOpen, setRailOpen] = useState(true);      // collapsible Ask/Quiz rail
  // The big centre play/pause icon auto-hides so a PAUSED frame (a diagram or
  // text a learner paused to read) isn't covered. A tap reveals it briefly.
  const [showCenter, setShowCenter] = useState(true);
  const hideTimer = useRef<any>(null);
  const flashCenter = useCallback(() => {
    setShowCenter(true);
    clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setShowCenter(false), 1100);
  }, []);

  const touchStart = useRef<{ y: number; t: number } | null>(null);
  const resumeAfterOverlay = useRef(false);

  // ── Finger-following swipe (TikTok-style) ──────────────────────────────────
  // For smoothness we move the stage by writing transform DIRECTLY to the DOM
  // node on each touchmove (no React re-render per frame → no jank while a video
  // is decoding). React state is used only to toggle the spring transition.
  const stageRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const startY = useRef(0);
  const lastY = useRef(0);
  const lastT = useRef(0);
  const velocity = useRef(0);
  const curDrag = useRef(0);
  const setStageTransform = (y: number) => {
    curDrag.current = y;
    if (stageRef.current) stageRef.current.style.transform = `translateY(${y}px)`;
  };

  // Read current playback time regardless of source (for Ask timestamp).
  const readTime = useCallback((): number => {
    if (kind === 'youtube') { try { return ytRef.current?.getCurrentTime?.() ?? current; } catch { return current; } }
    return videoRef.current?.currentTime ?? current;
  }, [kind, current]);

  // Keep the blurred ambient background loosely in sync with the main video —
  // when they drift (seek/pause), snap it back. Cheap: only correct on real gaps.
  const syncBg = useCallback((t: number, isPlaying: boolean) => {
    const b = bgRef.current;
    if (!b) return;
    if (Math.abs(b.currentTime - t) > 0.4) b.currentTime = t;
    if (isPlaying && b.paused) b.play().catch(() => {});
    if (!isPlaying && !b.paused) b.pause();
  }, []);

  // Lock body scroll while immersive. IMPORTANT: always RESTORE to '' (not the
  // previous value). Capturing `prev` was buggy — if the lock was already
  // 'hidden' (e.g. re-mount, or another overlay), restoring to `prev` left the
  // whole app permanently unscrollable. Empty string returns scrolling to the
  // page's own CSS.
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  // Ask / Quiz overlay open → pause the lesson at the current moment. When the
  // learner is done (submits or dismisses) → resume from where it stopped, but
  // only if it was actually playing when they opened the overlay.
  useEffect(() => {
    if (kind === 'youtube') {
      const p = ytRef.current; if (!p) return;
      try {
        if (overlayOpen) {
          resumeAfterOverlay.current = p.getPlayerState?.() === 1;
          p.pauseVideo(); setPlaying(false);
        } else if (resumeAfterOverlay.current) {
          resumeAfterOverlay.current = false;
          p.playVideo(); setPlaying(true);
        }
      } catch { /* ignore */ }
      return;
    }
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
  }, [overlayOpen, kind]);

  // ── YouTube: build the player in the full-screen box + poll time ──────────
  useEffect(() => {
    if (kind !== 'youtube' || !ytId) return;
    let poll: any;
    loadYouTubeAPI(() => {
      if (!document.getElementById(ytBoxId)) return;
      ytRef.current = new (window as any).YT.Player(ytBoxId, {
        videoId: ytId,
        playerVars: { autoplay: 1, playsinline: 1, rel: 0, modestbranding: 1, controls: 0, fs: 0 },
        events: {
          onReady: (e: any) => { try { e.target.playVideo(); setDuration(e.target.getDuration() || 0); setPlaying(true); } catch {} },
          onStateChange: (e: any) => {
            setPlaying(e.data === 1);
            if (e.data === 0 && hasNext) onNext();   // ended → next lesson
          },
        },
      });
    });
    poll = setInterval(() => {
      try {
        const p = ytRef.current;
        if (p?.getCurrentTime) { setCurrent(p.getCurrentTime() || 0); if (!duration) setDuration(p.getDuration?.() || 0); }
      } catch { /* ignore */ }
    }, 500);
    return () => { clearInterval(poll); try { ytRef.current?.destroy?.(); } catch {} ytRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind, ytId]);

  // Hide the swipe hint after a moment
  useEffect(() => {
    const t = setTimeout(() => setHint(false), 2800);
    return () => clearTimeout(t);
  }, []);

  // Auto-hide the centre button shortly after mount, and clean the timer.
  useEffect(() => {
    flashCenter();
    return () => clearTimeout(hideTimer.current);
  }, [flashCenter]);

  const togglePlay = useCallback(() => {
    flashCenter();
    if (kind === 'youtube') {
      const p = ytRef.current; if (!p) return;
      try {
        const st = p.getPlayerState?.();      // 1 = playing
        if (st === 1) { p.pauseVideo(); setPlaying(false); }
        else { p.playVideo(); setPlaying(true); }
      } catch { /* ignore */ }
      return;
    }
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) { v.play().catch(() => {}); setPlaying(true); }
    else { v.pause(); setPlaying(false); }
  }, [kind]);

  // ── Swipe: the video follows the finger, then snaps to next/prev (up = next,
  //    down = previous), or springs back. This is what makes it feel native. ──
  // Don't hijack a swipe that starts on a real control (seek slider, rail
  // buttons, links). The full-screen play/pause button is marked data-swipe-ok
  // so the swipe still works across the whole video area.
  const onControl = (t: EventTarget | null) => {
    if (!(t instanceof Element)) return false;
    const el = t.closest('button, a, input, [role="button"], [data-no-swipe]');
    if (!el) return false;
    return !el.hasAttribute('data-swipe-ok');
  };

  const swipeActive = useRef(false);
  const onTouchStart = (e: React.TouchEvent) => {
    if (onControl(e.target)) { swipeActive.current = false; return; }
    swipeActive.current = true;
    const y = e.touches[0].clientY;
    startY.current = y;
    lastY.current = y;
    lastT.current = Date.now();
    velocity.current = 0;
    setDragging(true);           // disables the spring transition during drag
    if (hint) setHint(false);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!swipeActive.current) return;
    const y = e.touches[0].clientY;
    let dy = y - startY.current;
    // Rubber-band resistance at the ends (no next/prev to go to).
    if ((dy < 0 && !hasNext) || (dy > 0 && !hasPrev)) dy *= 0.28;
    const now = Date.now();
    const dt = now - lastT.current;
    if (dt > 0) velocity.current = (y - lastY.current) / dt; // px/ms
    lastY.current = y;
    lastT.current = now;
    setStageTransform(dy);       // direct DOM write — no re-render, no jank
  };

  const onTouchEnd = () => {
    if (!swipeActive.current) return;
    swipeActive.current = false;
    setDragging(false);          // re-enables the spring transition
    const dy = curDrag.current;
    const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
    const THRESHOLD = vh * 0.20; // dragged past 20% of screen
    const FLICK = 0.5;           // or a fast flick (px/ms)
    const v = velocity.current;

    const goNext = hasNext && (dy < -THRESHOLD || v < -FLICK);
    const goPrev = hasPrev && (dy > THRESHOLD || v > FLICK);

    // Spring the stage back to 0. The new lesson (if any) mounts fresh at 0,
    // so resetting the transform here gives a clean, smooth settle either way.
    setStageTransform(0);
    if (goNext) { setSwipe('up'); onNext(); setTimeout(() => setSwipe(null), 340); }
    else if (goPrev) { setSwipe('down'); onPrev(); setTimeout(() => setSwipe(null), 340); }
  };

  const pct = duration > 0 ? (current / duration) * 100 : 0;

  return (
    <div
      ref={stageRef}
      className="fixed inset-0"
      style={{
        zIndex: 70, background: '#F6F4FD', animation: 'imm-in 0.25s ease both',
        // Transform is written directly via ref during drag (no per-frame
        // re-render). When not dragging, this spring smoothly settles it.
        transition: dragging ? 'none' : 'transform 0.34s cubic-bezier(0.22, 1, 0.36, 1)',
        willChange: 'transform',
      }}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {kind === 'native' ? (
        <>
          {/* Ambient blurred fill — the frame, scaled up + blurred, so letterbox
              space glows instead of dead black (only for real files we can mirror). */}
          <video
            ref={bgRef}
            src={videoUrl}
            autoPlay muted playsInline aria-hidden preload="metadata"
            className="absolute inset-0 w-full h-full"
            style={{ objectFit: 'cover', filter: 'blur(30px) brightness(0.92) saturate(1.25)', transform: 'scale(1.25)', pointerEvents: 'none' }}
          />
          {/* Video — sits on the blurred fill */}
          <video
            ref={videoRef}
            src={videoUrl}
            autoPlay playsInline preload="metadata"
            className="absolute inset-0 w-full h-full"
            style={{ objectFit: 'contain', animation: 'imm-content 0.34s ease both' }}
            onClick={togglePlay}
            onTimeUpdate={e => { setCurrent(e.currentTarget.currentTime); syncBg(e.currentTarget.currentTime, !e.currentTarget.paused); }}
            onLoadedMetadata={e => setDuration(e.currentTarget.duration)}
            onPlay={() => { setPlaying(true); syncBg(videoRef.current?.currentTime ?? 0, true); }}
            onPause={() => { setPlaying(false); syncBg(videoRef.current?.currentTime ?? 0, false); }}
            onSeeked={e => syncBg(e.currentTarget.currentTime, !e.currentTarget.paused)}
            onEnded={() => { if (hasNext) onNext(); }}
          />
        </>
      ) : kind === 'youtube' ? (
        // YouTube fills the screen; the YT IFrame API drives play/pause/time.
        <div className="absolute inset-0" style={{ animation: 'imm-content 0.34s ease both' }}>
          <div id={ytBoxId} className="w-full h-full" style={{ pointerEvents: 'none' }} />
        </div>
      ) : (
        // Vimeo — full-bleed iframe (autoplay muted-less relies on Vimeo defaults).
        <div className="absolute inset-0" style={{ animation: 'imm-content 0.34s ease both' }}>
          <iframe
            src={`https://player.vimeo.com/video/${viId}?autoplay=1&playsinline=1&title=0&byline=0&portrait=0`}
            className="w-full h-full" style={{ border: 0 }}
            allow="autoplay; fullscreen; picture-in-picture" title="Lesson video"
          />
        </div>
      )}

      {/* Full-screen tap area toggles play/pause (native + youtube). For YouTube
          the iframe is pointer-events:none, so this is also how taps reach us.
          It's transparent so a PAUSED frame stays fully visible. */}
      {kind !== 'vimeo' && (
        <button data-swipe-ok onClick={togglePlay} aria-label={playing ? 'Pause' : 'Play'} className="absolute inset-0" style={{ background: 'transparent', zIndex: 1 }} />
      )}

      {/* Centre play/pause icon — auto-hides so it never covers the frame the
          learner paused to read. Fades in on tap, fades out after ~1s. */}
      {kind !== 'vimeo' && (
        <div
          className="absolute inset-0 flex items-center justify-center"
          aria-hidden
          style={{
            zIndex: 2, pointerEvents: 'none',
            opacity: showCenter ? 1 : 0,
            transition: 'opacity 0.45s ease',
          }}
        >
          <span style={{ width: 74, height: 74, borderRadius: '50%', background: 'rgba(0,0,0,0.5)', border: '1.5px solid rgba(255,255,255,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(6px)' }}>
            {playing
              ? <Pause size={28} fill="#fff" color="#fff" />
              : <Play size={30} fill="#fff" color="#fff" style={{ marginLeft: 4 }} />}
          </span>
        </div>
      )}

      {/* Top bar — exit + position */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4"
        style={{ zIndex: 3, paddingTop: 'calc(env(safe-area-inset-top, 0px) + 12px)', paddingBottom: 12, background: 'linear-gradient(180deg, rgba(0,0,0,0.6), transparent)', pointerEvents: 'none' }}>
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
        style={{ zIndex: 3, right: 12, bottom: 'calc(env(safe-area-inset-bottom, 0px) + 110px)', gap: 10 }}>
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
            onClick={() => onAsk(readTime())}
          ><HelpCircle size={24} /></RailBtn>
          {hasNotes && onNotes && <RailBtn label="Notes" onClick={onNotes}><BookOpen size={24} /></RailBtn>}
          {hasQuiz && onQuiz && <RailBtn label="Quiz" onClick={onQuiz}><ListChecks size={24} /></RailBtn>}
          <RailBtn label="Prev" onClick={onPrev} disabled={!hasPrev}><ChevronUp size={24} /></RailBtn>
          <RailBtn label="Next" onClick={onNext} disabled={!hasNext}><ChevronDown size={24} /></RailBtn>
        </div>
      </div>

      {/* Bottom — title + scrubber */}
      <div className="absolute left-0 right-0 bottom-0 px-4"
        style={{ zIndex: 3, paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)', paddingTop: 40, background: 'linear-gradient(0deg, rgba(0,0,0,0.85), transparent)' }}>
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
            onChange={e => {
              const t = Number(e.target.value);
              if (kind === 'youtube') { try { ytRef.current?.seekTo?.(t, true); } catch {} }
              else if (videoRef.current) { videoRef.current.currentTime = t; }
              setCurrent(t);
            }}
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
        @keyframes imm-in      { from{opacity:0} to{opacity:1} }
        /* New lesson's content settles in gently after a swipe/mount. */
        @keyframes imm-content { from{opacity:0; transform:scale(1.012)} to{opacity:1; transform:scale(1)} }
        @keyframes imm-hint    { 0%{opacity:0} 15%{opacity:1} 75%{opacity:1} 100%{opacity:0} }
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
