import { useCallback, useEffect, useRef, useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { usePlayerStore, useUIStore } from '../../store';
import Controls from './Controls';
import Timeline from './Timeline';
import NestIntroOverlay from './NestIntroOverlay';
import type { TimelineMarker } from '../../types';
import { useAuthStore } from '../../store';

interface Props {
  videoUrl: string;
  markers: TimelineMarker[];
  videoId: string;
  onTimeUpdate?: (t: number) => void;
  onVideoEnd?: () => void;
  /** Set false to suppress the Nest intro for this player instance */
  showIntro?: boolean;
}

// ─── URL helpers ──────────────────────────────────────────────────────────────

function getYouTubeId(url: string): string | null {
  const patterns = [
    /youtu\.be\/([^?&#]+)/,
    /youtube\.com\/watch\?.*v=([^&#]+)/,
    /youtube\.com\/embed\/([^?&#]+)/,
    /youtube\.com\/shorts\/([^?&#]+)/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

function getVimeoId(url: string): string | null {
  const m = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  return m ? m[1] : null;
}

// A URL that ends in a real video file extension → we can play it natively.
function isDirectVideoFile(url: string): boolean {
  return /\.(mp4|webm|ogg|ogv|mov|m4v|m3u8)(\?|#|$)/i.test(url);
}

function getEmbedInfo(url: string): { type: 'youtube' | 'vimeo' | 'native' | 'external'; embedUrl?: string } {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const u = (url || '').trim();
  const ytId = getYouTubeId(u);
  if (ytId) return {
    type: 'youtube',
    embedUrl: `https://www.youtube.com/embed/${ytId}?enablejsapi=1&rel=0&autoplay=0&origin=${encodeURIComponent(origin)}`,
  };
  const viId = getVimeoId(u);
  if (viId) return { type: 'vimeo', embedUrl: `https://player.vimeo.com/video/${viId}` };
  // A direct video file → native <video>. Anything else that's an http(s) link
  // (NotebookLM, Google Drive, a doc…) can't be embedded/played — treat it as an
  // EXTERNAL lesson that opens in a new tab. Relative/blob paths stay native.
  if (isDirectVideoFile(u)) return { type: 'native' };
  if (/^https?:\/\//i.test(u)) return { type: 'external' };
  return { type: 'native' };
}

// Friendly label for the "Open in …" button, from the URL host.
export function externalSourceName(url: string): string {
  try {
    const host = new URL(url).hostname.replace(/^www\./, '');
    if (host.includes('notebooklm.google') || host.includes('notebook.google')) return 'NotebookLM';
    if (host.includes('drive.google')) return 'Google Drive';
    if (host.includes('docs.google')) return 'Google Docs';
    if (host.includes('loom.com')) return 'Loom';
    if (host.includes('dropbox.com')) return 'Dropbox';
    // Title-case the first domain label as a fallback (e.g. "example")
    const name = host.split('.')[0];
    return name.charAt(0).toUpperCase() + name.slice(1);
  } catch {
    return 'the source';
  }
}

// Exported so other views (immersive player, module detail) agree on what's a
// real, in-app playable video vs an external link.
export function isPlayableVideo(url: string): boolean {
  const t = getEmbedInfo(url).type;
  return t !== 'external';
}

// ─── YouTube IFrame API loader (module-level singleton) ───────────────────────

let ytApiLoading = false;
let ytApiReady = false;
const ytReadyCallbacks: (() => void)[] = [];

function loadYouTubeAPI(callback: () => void) {
  if (ytApiReady && (window as any).YT?.Player) {
    callback();
    return;
  }
  ytReadyCallbacks.push(callback);
  if (!ytApiLoading) {
    ytApiLoading = true;
    (window as any).onYouTubeIframeAPIReady = () => {
      ytApiReady = true;
      ytReadyCallbacks.forEach((cb) => cb());
      ytReadyCallbacks.length = 0;
    };
    const script = document.createElement('script');
    script.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(script);
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function VideoPlayer({ videoUrl, markers, videoId, onTimeUpdate, onVideoEnd, showIntro = false }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const ytPlayerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(false);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Mobile: show controls in a solid strip below the video (not overlaid).
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 1024);
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // ── Nest intro pre-roll ────────────────────────────────────────────────────
  const { organization } = useAuthStore();
  const [introDone, setIntroDone] = useState<boolean>(() => !showIntro);
  // reset intro whenever the video changes
  useEffect(() => { if (showIntro) setIntroDone(false); }, [videoId, showIntro]);

  const {
    isPlaying, volume, playbackRate, seekTarget, currentTime,
    setCurrentTime, setDuration, setPlaying, clearSeek,
  } = usePlayerStore();

  const { openQuestionForm } = useUIStore();

  const embed = getEmbedInfo(videoUrl);
  const isExternal = embed.type === 'external';
  const isEmbed = embed.type === 'youtube' || embed.type === 'vimeo';
  const isYouTube = embed.type === 'youtube';

  // Stable iframe ID based on videoId so the YT API can find the element
  const iframeId = `yt-player-${videoId}`;

  // ── YouTube IFrame API: init player ──────────────────────────────────────
  useEffect(() => {
    if (!isYouTube) return;
    let mounted = true;

    loadYouTubeAPI(() => {
      if (!mounted || !iframeRef.current) return;
      ytPlayerRef.current = new (window as any).YT.Player(iframeId, {
        events: {
          onReady: (e: any) => {
            if (!mounted) return;
            const dur = e.target.getDuration();
            if (dur > 0) setDuration(dur);
          },
          onStateChange: (e: any) => {
            if (!mounted) return;
            const { PlayerState } = (window as any).YT;
            if (e.data === PlayerState.PLAYING) {
              setPlaying(true);
            } else if (e.data === PlayerState.PAUSED) {
              setPlaying(false);
            } else if (e.data === PlayerState.ENDED) {
              setPlaying(false);
              onVideoEnd?.();
            }
          },
        },
      });
    });

    return () => {
      mounted = false;
      ytPlayerRef.current?.destroy?.();
      ytPlayerRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isYouTube, iframeId]);

  // ── YouTube: poll currentTime & duration every 250 ms ────────────────────
  useEffect(() => {
    if (!isYouTube) return;
    const id = setInterval(() => {
      const p = ytPlayerRef.current;
      if (!p?.getCurrentTime) return;
      const t = p.getCurrentTime() as number;
      setCurrentTime(t);
      onTimeUpdate?.(t);
      const d = p.getDuration?.() as number;
      if (d > 0) setDuration(d);
    }, 250);
    return () => clearInterval(id);
  }, [isYouTube, setCurrentTime, setDuration, onTimeUpdate]);

  // ── YouTube: sync play/pause from store ──────────────────────────────────
  useEffect(() => {
    if (!isYouTube) return;
    const p = ytPlayerRef.current;
    if (!p) return;
    if (isPlaying) p.playVideo?.();
    else p.pauseVideo?.();
  }, [isPlaying, isYouTube]);

  // ── YouTube: handle seekTarget ────────────────────────────────────────────
  useEffect(() => {
    if (seekTarget !== null && isYouTube && ytPlayerRef.current?.seekTo) {
      ytPlayerRef.current.seekTo(seekTarget, true);
      clearSeek();
    }
  }, [seekTarget, isYouTube, clearSeek]);

  // ── Native: sync play/pause ───────────────────────────────────────────────
  useEffect(() => {
    const v = videoRef.current;
    if (!v || isEmbed) return;
    if (isPlaying) v.play().catch(() => setPlaying(false));
    else v.pause();
  }, [isPlaying, setPlaying, isEmbed]);

  // ── Native: sync volume ───────────────────────────────────────────────────
  useEffect(() => {
    if (videoRef.current && !isEmbed) videoRef.current.volume = volume;
  }, [volume, isEmbed]);

  // ── Native: sync playback rate ────────────────────────────────────────────
  useEffect(() => {
    if (videoRef.current && !isEmbed) videoRef.current.playbackRate = playbackRate;
  }, [playbackRate, isEmbed]);

  // ── Native: seek ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (seekTarget !== null && videoRef.current && !isEmbed) {
      videoRef.current.currentTime = seekTarget;
      clearSeek();
    }
  }, [seekTarget, clearSeek, isEmbed]);

  // ── Fullscreen ────────────────────────────────────────────────────────────
  useEffect(() => {
    const handler = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) containerRef.current?.requestFullscreen();
    else document.exitFullscreen();
  };

  const showControlsBriefly = useCallback(() => {
    setControlsVisible(true);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => setControlsVisible(false), 3000);
  }, []);

  // Stable identity: an inline arrow here would change every render, restarting
  // the intro overlay's animation loop on each parent re-render (e.g. rotate).
  const handleIntroComplete = useCallback(() => {
    setPlaying(false);
    setIntroDone(true);
  }, [setPlaying]);

  // Show controls when: fullscreen, briefly after tap/hover, or video is paused
  const shouldShowControls = fullscreen || controlsVisible || !isPlaying;

  const handleTimelineClick = (t: number) => {
    if (isYouTube && ytPlayerRef.current?.seekTo) {
      ytPlayerRef.current.seekTo(t, true);
      setCurrentTime(t);
    } else if (videoRef.current) {
      videoRef.current.currentTime = t;
      setCurrentTime(t);
    }
  };

  // Exit fullscreen first so the question form modal (rendered outside the
  // player container) is visible in the normal page flow.
  const handleAskAt = useCallback(async (t: number) => {
    if (document.fullscreenElement) {
      await document.exitFullscreen().catch(() => {});
    }
    setPlaying(false);
    openQuestionForm(t);
  }, [openQuestionForm, setPlaying]);

  const handleAskAtTimestamp = () => handleAskAt(currentTime);

  // ── External link (NotebookLM, Drive, docs…) — can't be embedded, so we
  //    present a clean "open in a new tab" card instead of a broken player. ──
  if (isExternal) {
    const source = externalSourceName(videoUrl);
    return (
      <div className="bg-black video-player-container overflow-hidden flex items-center justify-center" style={{ position: 'relative' }}>
        <div style={{
          textAlign: 'center', padding: '32px 24px', maxWidth: 380,
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14,
        }}>
          <div style={{
            width: 60, height: 60, borderRadius: 16,
            background: 'linear-gradient(135deg,#c77dda,#7b2d8e)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 10px 30px rgba(178,89,196,0.45)',
          }}>
            <ExternalLink size={26} color="#fff" />
          </div>
          <div>
            <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 24, fontWeight: 600, color: '#F2F0F5', margin: 0, lineHeight: 1.2 }}>
              This lesson opens in {source}
            </p>
            <p style={{ fontSize: 13.5, color: '#A8A3B2', lineHeight: 1.55, margin: '8px 0 0' }}>
              It's hosted on {source} and can't play inside Nest. Tap below to open it in a new tab.
            </p>
          </div>
          <a
            href={videoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="press"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              minHeight: 48, padding: '0 22px', borderRadius: 12,
              background: 'linear-gradient(135deg,#c77dda,#7b2d8e)', color: '#fff',
              fontFamily: "'Inter Tight','Inter',system-ui,sans-serif", fontSize: 14.5, fontWeight: 700,
              textDecoration: 'none', boxShadow: '0 8px 24px rgba(178,89,196,0.45)',
            }}
          >
            Open in {source} <ExternalLink size={16} />
          </a>
        </div>
      </div>
    );
  }

  // ── YouTube / Vimeo player ─────────────────────────────────────────────────
  if (isEmbed) {
    return (
      <div ref={containerRef} className="bg-black video-player-container overflow-hidden" style={{ position: 'relative' }} onPointerDown={showControlsBriefly}>
        {/* Intro overlay — shown first; iframe not mounted until it's done */}
        {!introDone && (
          <div className="video-player-container" style={{ position: 'relative' }}>
            <NestIntroOverlay
              orgName={organization?.name}
              orgLogoUrl={organization?.logo_url}
              onComplete={handleIntroComplete}
            />
          </div>
        )}
        {/* Iframe — only mounted after intro completes, guaranteeing no audio bleed */}
        {introDone && (
        <div className="relative w-full video-player-container">
          <iframe
            id={isYouTube ? iframeId : undefined}
            ref={iframeRef}
            src={embed.embedUrl}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            allowFullScreen
            title="Video player"
          />
        </div>
        )}

        {/* Timeline + Controls below iframe (YouTube only — full API support) */}
        {isYouTube && (
          <div className="px-4 pt-2 pb-3 bg-black">
            <Timeline
              markers={markers}
              onSeek={handleTimelineClick}
              onMarkerClick={(m) => {
                handleTimelineClick(m.timestamp_seconds);
                handleAskAt(m.timestamp_seconds);
              }}
              onAskAt={handleAskAt}
            />
            <Controls
              onToggleFullscreen={toggleFullscreen}
              isFullscreen={fullscreen}
              onAskQuestion={handleAskAtTimestamp}
            />
          </div>
        )}

        {/* Vimeo fallback: pill strip (no IFrame API integrated) */}
        {!isYouTube && (
          <div className="bg-black/80 px-4 py-2 flex items-center gap-3">
            <div className="flex-1 flex items-center gap-2 overflow-x-auto">
              {markers.map((m) => (
                <button
                  key={m.question_id}
                  onClick={() => openQuestionForm(m.timestamp_seconds)}
                  title={m.question_preview}
                  className={`flex-shrink-0 text-xs px-2 py-0.5 rounded-full font-mono font-medium border ${
                    m.status === 'answered'
                      ? 'bg-emerald-600 border-emerald-500 text-white'
                      : 'bg-amber-500 border-amber-400 text-white'
                  }`}
                >
                  {Math.floor(m.timestamp_seconds / 60)}:{String(Math.floor(m.timestamp_seconds % 60)).padStart(2, '0')}
                </button>
              ))}
            </div>
            <button
              onClick={() => openQuestionForm(0)}
              className="flex-shrink-0 flex items-center gap-1 text-xs bg-white/10 hover:bg-white/20 text-white px-2.5 py-1 rounded-md border border-white/20 transition-colors"
            >
              Ask Question
            </button>
            <button
              onClick={toggleFullscreen}
              className="flex-shrink-0 text-white/70 hover:text-white"
              title="Fullscreen"
            >
              ⛶
            </button>
          </div>
        )}
      </div>
    );
  }

  // ── Native HTML5 player ───────────────────────────────────────────────────
  // CRITICAL: the <video> must live at ONE stable position in the tree. If it
  // moves between branches, React destroys+recreates the element on every
  // rotate / keyboard-open (resize), losing playback and thrashing the decoder
  // — which blanks or crashes low-end phones. So we render a single tree and
  // only vary CSS between mobile (controls below) and desktop (overlay).
  const controlsBelow = isMobile && !fullscreen;

  return (
    <div
      ref={containerRef}
      className="relative bg-black overflow-hidden"
      onPointerDown={controlsBelow ? undefined : showControlsBriefly}
    >
      {/* Video stage — fixed 16:9 so landscape lectures fill the width */}
      <div className="relative w-full bg-black" style={{ aspectRatio: '16 / 9' }}>
        {!introDone && (
          <NestIntroOverlay
            orgName={organization?.name}
            orgLogoUrl={organization?.logo_url}
            onComplete={handleIntroComplete}
          />
        )}
        {introDone && (
          <video
            ref={videoRef}
            src={videoUrl}
            className="w-full h-full object-contain"
            onTimeUpdate={(e) => {
              const t = e.currentTarget.currentTime;
              setCurrentTime(t);
              onTimeUpdate?.(t);
            }}
            onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onEnded={() => { setPlaying(false); onVideoEnd?.(); }}
            onClick={() => { setPlaying(!isPlaying); showControlsBriefly(); }}
            preload="metadata"
            crossOrigin="anonymous"
            playsInline
          />
        )}

        {/* Big center play tap-target when paused (mobile) */}
        {controlsBelow && introDone && !isPlaying && (
          <button
            onClick={() => { setPlaying(true); showControlsBriefly(); }}
            aria-label="Play"
            className="absolute inset-0 flex items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.28)' }}
          >
            <span style={{ width: 64, height: 64, borderRadius: '50%', background: '#b259c4', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 30px rgba(178,89,196,0.5)' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="#fff"><polygon points="6,4 22,12 6,20" /></svg>
            </span>
          </button>
        )}

        {/* Desktop overlay gradient */}
        {!controlsBelow && (
          <div
            className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent transition-opacity duration-200 pointer-events-none"
            style={{ opacity: shouldShowControls ? 1 : 0 }}
          />
        )}
      </div>

      {/* Controls — below the video on mobile, overlaid on desktop.
          Same children either way; only the wrapper's CSS changes. */}
      <div
        className={controlsBelow ? 'px-4 pt-2 pb-3 bg-black' : 'absolute bottom-0 left-0 right-0 px-4 pb-3 transition-opacity duration-200'}
        style={controlsBelow ? undefined : { opacity: shouldShowControls ? 1 : 0 }}
        onPointerDown={controlsBelow ? undefined : (e => e.stopPropagation())}
      >
        <Timeline
          markers={markers}
          onSeek={handleTimelineClick}
          onMarkerClick={(m) => handleAskAt(m.timestamp_seconds)}
          onAskAt={handleAskAt}
        />
        <Controls
          onToggleFullscreen={toggleFullscreen}
          isFullscreen={fullscreen}
          onAskQuestion={handleAskAtTimestamp}
        />
      </div>
    </div>
  );
}
