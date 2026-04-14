import { useState, useRef, useEffect, useCallback } from 'react';
import {
  X, Monitor, Mic, MicOff, RotateCcw,
  Square, AlertCircle, UploadCloud,
} from 'lucide-react';
import api from '../../api/client';
import toast from 'react-hot-toast';

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_SECONDS = 5 * 60; // 5 minutes

// ─── Types ────────────────────────────────────────────────────────────────────

type Phase = 'setup' | 'countdown' | 'recording' | 'preview' | 'uploading';

export interface ScreenRecorderModalProps {
  onClose: () => void;
  /** Called with the uploaded URL and duration once the user confirms. */
  onUploaded: (url: string, durationSeconds: number) => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(s: number) {
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

function makeBestRecorder(stream: MediaStream): MediaRecorder {
  // isTypeSupported() lies — actually try constructing the MediaRecorder.
  const candidates = [
    'video/webm;codecs=vp9',
    'video/webm;codecs=vp8',
    'video/webm',
    'video/mp4',
    '',                        // browser default
  ];
  for (const mimeType of candidates) {
    try {
      const options = mimeType ? { mimeType } : {};
      return new MediaRecorder(stream, options);
    } catch {
      // try next
    }
  }
  return new MediaRecorder(stream); // last-ditch
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ScreenRecorderModal({ onClose, onUploaded }: ScreenRecorderModalProps) {
  const [phase, setPhase]             = useState<Phase>('setup');
  const [useMic, setUseMic]           = useState(true);
  const [countdown, setCountdown]     = useState(3);
  const [elapsed, setElapsed]         = useState(0);
  const [blobUrl, setBlobUrl]         = useState<string | null>(null);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [error, setError]             = useState<string | null>(null);
  const [uploadPct, setUploadPct]     = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef        = useRef<Blob[]>([]);
  const streamRef        = useRef<MediaStream | null>(null);
  const timerRef         = useRef<ReturnType<typeof setInterval> | null>(null);
  const cdRef            = useRef<ReturnType<typeof setInterval> | null>(null);
  const elapsedRef       = useRef(0); // kept in sync for stop handler
  const previewRef       = useRef<HTMLVideoElement>(null);

  // ── Load video into the preview element whenever blobUrl changes ─────────
  // React does not reliably trigger a reload when the `src` prop changes on
  // a <video> element that previously had no source — we must call .load().
  // We also work around the missing-duration bug in Chrome's MediaRecorder
  // WebM output by seeking to a large number, which forces the browser to
  // scan the file and discover the real duration.
  useEffect(() => {
    const video = previewRef.current;
    if (!blobUrl || !video) return;

    video.src = blobUrl;
    video.load();

    // Duration-fix: seek to end so the scrubber knows the total length
    const onMeta = () => {
      if (video.duration === Infinity || isNaN(video.duration)) {
        video.currentTime = 1e10; // triggers duration scan
      }
    };
    const onSeeked = () => {
      video.currentTime = 0; // reset to start after scan
    };

    video.addEventListener('loadedmetadata', onMeta);
    video.addEventListener('seeked', onSeeked, { once: true });

    return () => {
      video.removeEventListener('loadedmetadata', onMeta);
      video.removeEventListener('seeked', onSeeked);
    };
  }, [blobUrl]);

  // ── Clean up on unmount ──────────────────────────────────────────────────
  const stopAll = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (cdRef.current)    clearInterval(cdRef.current);
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    streamRef.current?.getTracks().forEach(t => t.stop());
  }, []);

  useEffect(() => () => {
    stopAll();
    if (blobUrl) URL.revokeObjectURL(blobUrl);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Start flow ───────────────────────────────────────────────────────────
  const handleStart = async () => {
    setError(null);
    if (!navigator.mediaDevices?.getDisplayMedia) {
      setError('Screen recording is not supported in this browser. Please use Chrome or Edge on desktop.');
      return;
    }

    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: 30 } as MediaTrackConstraints,
        audio: true,
      });

      // Optionally blend in microphone
      if (useMic) {
        try {
          const micStream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true } });
          micStream.getAudioTracks().forEach(t => screenStream.addTrack(t));
        } catch {
          // Mic denied — proceed without it
        }
      }

      streamRef.current = screenStream;

      // If the user dismisses the native picker the track ends immediately
      screenStream.getVideoTracks()[0]?.addEventListener('ended', () => {
        stopAll();
        setPhase('setup');
      });

      // Kick off countdown
      setPhase('countdown');
      let c = 3;
      setCountdown(c);
      cdRef.current = setInterval(() => {
        c -= 1;
        setCountdown(c);
        if (c === 0) {
          clearInterval(cdRef.current!);
          beginRecording(screenStream);
        }
      }, 1000);
    } catch (e: any) {
      if (e?.name !== 'NotAllowedError') {
        setError('Could not access your screen. Please allow screen sharing and try again.');
      }
    }
  };

  // ── Begin MediaRecorder ──────────────────────────────────────────────────
  const beginRecording = (stream: MediaStream) => {
    chunksRef.current = [];
    elapsedRef.current = 0;

    const mr = makeBestRecorder(stream);
    const mimeType = mr.mimeType; // actual type chosen by the browser
    mediaRecorderRef.current = mr;

    mr.ondataavailable = e => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    mr.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mimeType || 'video/webm' });
      const url  = URL.createObjectURL(blob);
      setRecordedBlob(blob);
      setBlobUrl(url);
      setPhase('preview');
    };

    mr.start(500); // collect every 500 ms
    setPhase('recording');
    setElapsed(0);

    timerRef.current = setInterval(() => {
      elapsedRef.current += 1;
      setElapsed(elapsedRef.current);
      if (elapsedRef.current >= MAX_SECONDS) {
        handleStop();
      }
    }, 1000);
  };

  // ── Stop recording ───────────────────────────────────────────────────────
  const handleStop = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    streamRef.current?.getTracks().forEach(t => t.stop());
  }, []);

  // ── Re-record ────────────────────────────────────────────────────────────
  const handleReRecord = () => {
    if (blobUrl) URL.revokeObjectURL(blobUrl);
    setBlobUrl(null);
    setRecordedBlob(null);
    setElapsed(0);
    elapsedRef.current = 0;
    setPhase('setup');
  };

  // ── Upload ───────────────────────────────────────────────────────────────
  const handleUse = async () => {
    if (!recordedBlob) return;
    setPhase('uploading');
    setUploadPct(0);

    try {
      const ext  = recordedBlob.type.includes('mp4') ? 'mp4' : 'webm';
      const file = new File([recordedBlob], `screen-recording.${ext}`, { type: recordedBlob.type });
      const fd   = new FormData();
      fd.append('file', file);

      const { data } = await api.post<{ url: string }>('/videos/upload/video', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (evt) => {
          if (evt.total) setUploadPct(Math.round((evt.loaded / evt.total) * 100));
        },
      });

      toast.success('Recording uploaded!');
      onUploaded(data.url, elapsedRef.current);
      onClose();
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || 'Upload failed — please try again.');
      setPhase('preview');
    }
  };

  // ── Derived values ───────────────────────────────────────────────────────
  const remaining = MAX_SECONDS - elapsed;
  const progress  = elapsed / MAX_SECONDS;           // 0 → 1
  const RADIUS    = 34;
  const CIRC      = 2 * Math.PI * RADIUS;

  const isSupported = typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getDisplayMedia;

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(28,26,23,0.75)', backdropFilter: 'blur(6px)' }}
    >
      <div
        className="w-full max-w-md rounded-2xl overflow-hidden shadow-2xl"
        style={{ background: '#fffcf8', border: '1px solid #d4cdc6' }}
      >

        {/* ── Header ── */}
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: '1px solid #e8e2db' }}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(201,79,44,0.08)' }}>
              <Monitor size={17} style={{ color: '#c94f2c' }} />
            </div>
            <div>
              <h2
                className="text-sm font-bold"
                style={{ color: '#1a1714', fontFamily: "'Lora', Georgia, serif" }}
              >
                Screen Recorder
              </h2>
              <p className="text-[11px]" style={{ color: '#a09990' }}>
                Max 5 minutes · screen + audio
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors"
            style={{ color: '#a09990' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#e8e2db'; (e.currentTarget as HTMLElement).style.color = '#1a1714'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = '#a09990'; }}
          >
            <X size={15} />
          </button>
        </div>

        {/* ── Body ── */}
        <div className="p-6">

          {/* ══ SETUP ══ */}
          {phase === 'setup' && (
            <div className="space-y-5">

              {/* Error banner */}
              {error && (
                <div className="flex items-start gap-2.5 rounded-xl px-4 py-3 text-sm" style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c' }}>
                  <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
                  {error}
                </div>
              )}

              {/* Browser warning */}
              {!isSupported && (
                <div className="rounded-xl px-4 py-3 text-sm" style={{ background: '#fffbeb', border: '1px solid #fde68a', color: '#92400e' }}>
                  Screen recording requires <strong>Chrome</strong> or <strong>Edge</strong> on desktop.
                </div>
              )}

              {/* Mic toggle */}
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: '#a09990' }}>
                  Audio source
                </p>
                <button
                  onClick={() => setUseMic(v => !v)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all"
                  style={{
                    background:  useMic ? 'rgba(201,79,44,0.06)' : '#ffffff',
                    border:      useMic ? '1px solid rgba(201,79,44,0.25)' : '1px solid #e8e2db',
                  }}
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: useMic ? 'rgba(201,79,44,0.12)' : '#f2ede8' }}
                  >
                    {useMic
                      ? <Mic size={15} style={{ color: '#c94f2c' }} />
                      : <MicOff size={15} style={{ color: '#a09990' }} />}
                  </div>
                  <div className="text-left flex-1">
                    <p className="text-sm font-semibold" style={{ color: '#1a1714' }}>
                      {useMic ? 'Microphone enabled' : 'Microphone off'}
                    </p>
                    <p className="text-[11px]" style={{ color: '#a09990' }}>
                      {useMic ? 'Your voice will be captured alongside the screen' : 'Only screen audio will be captured'}
                    </p>
                  </div>
                  {/* Toggle pill */}
                  <div
                    className="relative w-9 h-5 rounded-full flex-shrink-0 transition-colors"
                    style={{ background: useMic ? '#c94f2c' : '#d4cdc6' }}
                  >
                    <div
                      className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform"
                      style={{ left: useMic ? '18px' : '2px' }}
                    />
                  </div>
                </button>
              </div>

              {/* Tips */}
              <div className="rounded-xl px-4 py-3.5 space-y-2" style={{ background: '#f2ede8' }}>
                {[
                  'A window picker appears — choose your whole screen or a single app',
                  '3-second countdown gives you time to switch windows',
                  'Recording stops automatically at 5 minutes',
                  'Preview and re-record before uploading',
                ].map((tip, i) => (
                  <p key={i} className="text-[12px] flex items-start gap-2" style={{ color: '#6b6460' }}>
                    <span style={{ color: '#c94f2c', fontWeight: 700, marginTop: 1 }}>·</span>
                    {tip}
                  </p>
                ))}
              </div>

              <button
                onClick={handleStart}
                disabled={!isSupported}
                className="w-full py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-40"
                style={{ background: '#c94f2c', color: '#fff' }}
                onMouseEnter={e => { if (isSupported) (e.currentTarget as HTMLElement).style.background = '#b04428'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#c94f2c'; }}
              >
                <Monitor size={16} />
                Start Recording
              </button>
            </div>
          )}

          {/* ══ COUNTDOWN ══ */}
          {phase === 'countdown' && (
            <div className="flex flex-col items-center justify-center py-10 space-y-5">
              <div
                className="w-28 h-28 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(201,79,44,0.08)', border: '3px solid rgba(201,79,44,0.2)' }}
              >
                <span
                  className="text-6xl font-bold"
                  style={{ color: '#c94f2c', fontFamily: "'Lora', Georgia, serif" }}
                >
                  {countdown}
                </span>
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold" style={{ color: '#1a1714' }}>
                  Recording starts in…
                </p>
                <p className="text-xs mt-1" style={{ color: '#a09990' }}>
                  Switch to the window you want to record
                </p>
              </div>
            </div>
          )}

          {/* ══ RECORDING ══ */}
          {phase === 'recording' && (
            <div className="flex flex-col items-center justify-center py-6 space-y-6">

              {/* Circular countdown */}
              <div className="relative" style={{ width: 120, height: 120 }}>
                <svg width="120" height="120" style={{ transform: 'rotate(-90deg)' }}>
                  {/* Track */}
                  <circle cx="60" cy="60" r={RADIUS} fill="none" stroke="#e8e2db" strokeWidth="5" />
                  {/* Progress — starts full, depletes */}
                  <circle
                    cx="60" cy="60" r={RADIUS}
                    fill="none"
                    stroke="#c94f2c"
                    strokeWidth="5"
                    strokeLinecap="round"
                    strokeDasharray={CIRC}
                    strokeDashoffset={CIRC * progress}
                    style={{ transition: 'stroke-dashoffset 1s linear' }}
                  />
                </svg>
                <div
                  className="absolute inset-0 flex flex-col items-center justify-center"
                >
                  <span
                    className="text-xl font-bold tabular-nums"
                    style={{ color: '#1a1714', fontFamily: "'Inconsolata', 'Courier New', monospace" }}
                  >
                    {fmt(remaining)}
                  </span>
                  <span className="text-[10px] uppercase tracking-widest mt-0.5" style={{ color: '#a09990' }}>
                    left
                  </span>
                </div>
              </div>

              {/* Live indicator */}
              <div className="flex items-center gap-2.5">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: '#ef4444' }} />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5" style={{ background: '#dc2626' }} />
                </span>
                <span className="text-sm font-semibold" style={{ color: '#1a1714' }}>Recording</span>
                <span
                  className="text-xs tabular-nums px-2 py-0.5 rounded-md"
                  style={{ color: '#6b6460', background: '#f2ede8', fontFamily: "'Inconsolata', monospace" }}
                >
                  {fmt(elapsed)} elapsed
                </span>
              </div>

              {/* Warning when close to limit */}
              {remaining <= 60 && (
                <p className="text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg">
                  Less than 1 minute remaining
                </p>
              )}

              <button
                onClick={handleStop}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm text-white transition-colors"
                style={{ background: '#dc2626' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#b91c1c'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#dc2626'; }}
              >
                <Square size={13} fill="white" />
                Stop Recording
              </button>
            </div>
          )}

          {/* ══ PREVIEW ══ */}
          {phase === 'preview' && blobUrl && (
            <div className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#a09990' }}>
                Preview your recording
              </p>

              {/* Video preview */}
              <div className="rounded-xl overflow-hidden" style={{ background: '#0b0c0f', border: '1px solid #d4cdc6' }}>
                <video
                  ref={previewRef}
                  controls
                  playsInline
                  preload="auto"
                  className="w-full"
                  style={{ maxHeight: 220, display: 'block' }}
                />
              </div>

              {/* Stats row */}
              <div
                className="flex items-center justify-between rounded-lg px-3 py-2 text-xs"
                style={{ background: '#f2ede8' }}
              >
                <span style={{ color: '#6b6460' }}>
                  Duration:{' '}
                  <strong className="tabular-nums" style={{ color: '#1a1714', fontFamily: "'Inconsolata', monospace" }}>
                    {fmt(elapsed)}
                  </strong>
                </span>
                <span style={{ color: '#6b6460' }}>
                  Size:{' '}
                  <strong style={{ color: '#1a1714', fontFamily: "'Inconsolata', monospace" }}>
                    {recordedBlob ? `~${(recordedBlob.size / 1024 / 1024).toFixed(1)} MB` : '—'}
                  </strong>
                </span>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={handleReRecord}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm transition-all"
                  style={{ border: '1px solid #d4cdc6', color: '#6b6460', background: '#fff' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#a09990'; (e.currentTarget as HTMLElement).style.color = '#1a1714'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = '#d4cdc6'; (e.currentTarget as HTMLElement).style.color = '#6b6460'; }}
                >
                  <RotateCcw size={14} />
                  Re-record
                </button>
                <button
                  onClick={handleUse}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm text-white transition-colors"
                  style={{ background: '#c94f2c' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#b04428'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#c94f2c'; }}
                >
                  <UploadCloud size={14} />
                  Upload & Use
                </button>
              </div>
            </div>
          )}

          {/* ══ UPLOADING ══ */}
          {phase === 'uploading' && (
            <div className="flex flex-col items-center justify-center py-10 space-y-5">
              {/* Progress ring */}
              <div className="relative" style={{ width: 80, height: 80 }}>
                <svg width="80" height="80" style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx="40" cy="40" r="30" fill="none" stroke="#e8e2db" strokeWidth="5" />
                  <circle
                    cx="40" cy="40" r="30"
                    fill="none" stroke="#c94f2c" strokeWidth="5"
                    strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 30}
                    strokeDashoffset={2 * Math.PI * 30 * (1 - uploadPct / 100)}
                    style={{ transition: 'stroke-dashoffset 0.3s ease' }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span
                    className="text-sm font-bold tabular-nums"
                    style={{ color: '#c94f2c', fontFamily: "'Inconsolata', monospace" }}
                  >
                    {uploadPct}%
                  </span>
                </div>
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold" style={{ color: '#1a1714' }}>
                  Uploading recording…
                </p>
                <p className="text-xs mt-1" style={{ color: '#a09990' }}>
                  Hang tight — this may take a moment
                </p>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
