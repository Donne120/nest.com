import { useCallback, useEffect, useRef, useState } from 'react';
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

function getEmbedInfo(url: string): { type: 'youtube' | 'vimeo' | 'native'; embedUrl?: string } {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const ytId = getYouTubeId(url);
  if (ytId) return {
    type: 'youtube',
    embedUrl: `https://www.youtube.com/embed/${ytId}?enablejsapi=1&rel=0&origin=${encodeURIComponent(origin)}`,
  };
  const viId = getVimeoId(url);
  if (viId) return { type: 'vimeo', embedUrl: `https://player.vimeo.com/video/${viId}` };
  return { type: 'native' };
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

export default function VideoPlayer({ videoUrl, markers, videoId, onTimeUpdate, onVideoEnd, showIntro = true }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const ytPlayerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(false);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
  const isEmbed = embed.type !== 'native';
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
    hideTimerRef.current = setTimeout(() => setControlsVisible(false), 3500);
  }, []);

  // Always visible in fullscreen OR briefly after a touch/hover
  const shouldShowControls = fullscreen || controlsVisible;

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

  // ── YouTube / Vimeo player ─────────────────────────────────────────────────
  if (isEmbed) {
    return (
      <div ref={containerRef} className="bg-black rounded-xl overflow-hidden" style={{ position: 'relative' }} onPointerDown={showControlsBriefly}>
        {!introDone && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 20, borderRadius: 'inherit', overflow: 'hidden' }}>
            <NestIntroOverlay
              orgName={organization?.name}
              orgLogoUrl={organization?.logo_url}
              onComplete={() => setIntroDone(true)}
            />
          </div>
        )}
        {/* Iframe */}
        <div className="relative w-full" style={{ aspectRatio: '16/9' }}>
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
  return (
    <div
      ref={containerRef}
      className="relative bg-black rounded-xl overflow-hidden"
      style={{ aspectRatio: '16/9' }}
      onPointerDown={showControlsBriefly}
    >
      {!introDone && (
        <NestIntroOverlay
          orgName={organization?.name}
          orgLogoUrl={organization?.logo_url}
          onComplete={() => setIntroDone(true)}
        />
      )}
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
        onClick={() => setPlaying(!isPlaying)}
        preload="metadata"
        crossOrigin="anonymous"
      />

      {/* Overlay gradient — visible on hover, touch, or fullscreen */}
      <div
        className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent transition-opacity duration-200 pointer-events-none"
        style={{ opacity: shouldShowControls ? 1 : 0 }}
      />

      {/* Controls — tap anywhere on video to reveal; always on in fullscreen */}
      <div
        className="absolute bottom-0 left-0 right-0 px-4 pb-3 transition-opacity duration-200"
        style={{ opacity: shouldShowControls ? 1 : 0 }}
        onPointerDown={e => e.stopPropagation()}
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
