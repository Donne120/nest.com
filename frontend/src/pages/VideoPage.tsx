import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, Sparkles, Clock, Users, BookOpen, CheckCircle, ArrowRight, Play, Trash2, Pencil, Check, Plus, MessageSquare } from 'lucide-react';
import { formatDistanceToNow, parseISO } from 'date-fns';
import api from '../api/client';
import toast from 'react-hot-toast';
import type { Video, Module, TimelineMarker, QuizQuestion, QuizSubmissionResult, Assignment } from '../types';
import VideoPlayer from '../components/VideoPlayer/VideoPlayer';
import QASidebar from '../components/QA/QASidebar';
import QuestionForm from '../components/QA/QuestionForm';
import QuizModal from '../components/Quiz/QuizModal';
import { useUIStore, usePlayerStore } from '../store';
import { useQueryInvalidation } from '../hooks/useQueryInvalidation';
import { Skeleton } from '../components/UI/Skeleton';
import ShareLessonButton from '../components/UI/ShareLessonButton';
import { useCallback, useEffect, useRef, useState } from 'react';
import WhiteboardModal from '../components/AI/WhiteboardModal';
import StudyNotesDrawer from '../components/VideoPlayer/StudyNotesDrawer';
import AskAIModal from '../components/AI/AskAIModal';
import ImmersiveMobilePlayer from '../components/VideoPlayer/ImmersiveMobilePlayer';
import LessonCompleteOverlay from '../components/VideoPlayer/LessonCompleteOverlay';

// Unified type system (matches the rest of the product)
const DISP = "'Cormorant Garamond', Georgia, serif";
const MONO = "'DM Mono', ui-monospace, monospace";

function fmtTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
}

function fmtDur(s: number) {
  const m = Math.floor(s / 60);
  if (m === 0) return `${s}s`;
  if (m < 60) return `${m}m`;
  return `${Math.floor(m / 60)}h ${m % 60}m`;
}

interface Note {
  id: string;
  content: string;
  timestamp_seconds: number | null;
  created_at: string;
}

export default function VideoPage() {
  const { videoId } = useParams<{ videoId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showQuestionForm, activeQuestionId, sidebarOpen, setSidebarOpen, whiteboardQuestionId, whiteboardQuestionText, aiAskOpen, openAIAsk, openQuestionForm } = useUIStore();
  const { seekTo, currentTime, duration: playerDuration, setPlaying } = usePlayerStore();
  const getPlayerDuration = () => usePlayerStore.getState().duration;
  const [showQuiz, setShowQuiz] = useState(false);
  const [showComplete, setShowComplete] = useState(false);
  const [showStudyNotes, setShowStudyNotes] = useState(false);
  // The immersive full-screen (TikTok-style) view is the ONLY lesson player on
  // mobile for uploaded videos — one way to watch, no duplicate inline player.
  // We keep an `immersive` flag purely so modals (Ask, Quiz) can momentarily
  // unmount it; it always returns to true on mobile. Embed videos (YouTube/
  // Vimeo) can't drive the immersive <video>, so they fall back to the inline
  // player — see `canGoImmersive`.
  const [immersive] = useState(true);
  const [noteDraft, setNoteDraft] = useState('');
  const [notePinTime, setNotePinTime] = useState(false);
  const [noteEditId, setNoteEditId] = useState<string | null>(null);
  const [noteEditContent, setNoteEditContent] = useState('');

  useQueryInvalidation();

  const { data: video, isLoading: videoLoading } = useQuery<Video>({
    queryKey: ['video', videoId],
    queryFn: () => api.get(`/videos/${videoId}`).then(r => r.data),
    enabled: !!videoId,
  });

  const { data: markers = [] } = useQuery<TimelineMarker[]>({
    queryKey: ['timeline', videoId],
    queryFn: () => api.get(`/videos/${videoId}/timeline`).then(r => r.data),
    enabled: !!videoId,
    refetchInterval: 30000,
    staleTime: 60_000,
  });

  const { data: module } = useQuery<Module>({
    queryKey: ['module', video?.module_id],
    queryFn: () => api.get(`/modules/${video!.module_id}`).then(r => r.data),
    enabled: !!video?.module_id,
  });

  const { data: moduleVideos = [] } = useQuery<Video[]>({
    queryKey: ['module-videos', video?.module_id],
    queryFn: () => api.get(`/videos/module/${video!.module_id}`).then(r => r.data),
    enabled: !!video?.module_id,
  });

  const { data: quizQuestions = [] } = useQuery<QuizQuestion[]>({
    queryKey: ['quiz', videoId],
    queryFn: () => api.get(`/quiz/video/${videoId}`).then(r => r.data),
    enabled: !!videoId,
  });

  const { data: existingSubmission } = useQuery<QuizSubmissionResult | null>({
    queryKey: ['quiz-submission', videoId],
    queryFn: () => api.get(`/quiz/video/${videoId}/my-submission`).then(r => r.data),
    enabled: !!videoId,
  });

  const { data: moduleAssignments = [] } = useQuery<Assignment[]>({
    queryKey: ['assignments', 'module', video?.module_id],
    queryFn: () => api.get(`/assignments/my?module_id=${video!.module_id}`).then(r => r.data),
    enabled: !!video?.module_id,
  });

  const { data: notes = [] } = useQuery<Note[]>({
    queryKey: ['notes', videoId],
    queryFn: () => api.get(`/notes/video/${videoId}`).then(r => r.data),
    enabled: !!videoId,
  });

  const createNote = useMutation({
    mutationFn: (payload: { content: string; timestamp_seconds?: number }) =>
      api.post(`/notes/video/${videoId}`, payload).then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes', videoId] });
      setNoteDraft('');
      setNotePinTime(false);
    },
    onError: () => toast.error('Could not save note'),
  });

  const updateNote = useMutation({
    mutationFn: ({ id, content }: { id: string; content: string }) =>
      api.put(`/notes/${id}`, { content }).then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes', videoId] });
      setNoteEditId(null);
    },
  });

  const deleteNote = useMutation({
    mutationFn: (id: string) => api.delete(`/notes/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notes', videoId] }),
  });

  const invalidateProgress = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['modules'] });
    if (video?.module_id) {
      queryClient.invalidateQueries({ queryKey: ['module', video.module_id] });
    }
  }, [queryClient, video?.module_id]);

  const durationSavedRef = useRef(false);
  useEffect(() => {
    if (playerDuration > 0 && videoId && video && video.duration_seconds === 0 && !durationSavedRef.current) {
      durationSavedRef.current = true;
      api.post('/progress/update', {
        video_id: videoId,
        progress_seconds: 0,
        duration_seconds: Math.round(playerDuration),
      }).then(() => invalidateProgress()).catch(() => {});
    }
  }, [playerDuration, videoId, video?.duration_seconds]);

  const trackProgress = useMutation({
    mutationFn: ({ progressSeconds, durationSeconds }: { progressSeconds: number; durationSeconds?: number }) =>
      api.post('/progress/update', {
        video_id: videoId,
        progress_seconds: progressSeconds,
        ...(durationSeconds && durationSeconds > 0 ? { duration_seconds: Math.round(durationSeconds) } : {}),
      }),
    onSuccess: invalidateProgress,
  });

  const hasStartedRef = useRef(false);
  const handleTimeUpdate = useCallback((t: number) => {
    const dur = getPlayerDuration();
    if (t > 1 && !hasStartedRef.current) {
      hasStartedRef.current = true;
      trackProgress.mutate({ progressSeconds: t, durationSeconds: dur });
    } else if (Math.round(t) % 30 === 0 && Math.round(t) > 0) {
      trackProgress.mutate({ progressSeconds: t, durationSeconds: dur });
    }
  }, [trackProgress]);

  const handleVideoEnd = useCallback(async () => {
    if (videoId) {
      const dur = getPlayerDuration();
      const finalDuration = dur > 0 ? Math.round(dur) : (video?.duration_seconds ?? 0);
      await api.post('/progress/update', {
        video_id: videoId,
        progress_seconds: finalDuration,
        duration_seconds: dur > 0 ? Math.round(dur) : undefined,
        status: 'completed',
      });
      invalidateProgress();
    }
    // Give the learner a beat of "well done" and let THEM choose what's next.
    // (This used to throw the quiz straight in their face — finishing a lesson
    // was rewarded with a test.)
    setShowComplete(true);
  }, [videoId, video?.duration_seconds, invalidateProgress]);

  const handleNoteSave = useCallback(() => {
    const trimmed = noteDraft.trim();
    if (!trimmed) return;
    createNote.mutate({
      content: trimmed,
      timestamp_seconds: notePinTime ? currentTime : undefined,
    });
  }, [noteDraft, notePinTime, currentTime, createNote]);

  const handleMarkComplete = useCallback(async () => {
    if (quizQuestions.length > 0) {
      setShowQuiz(true);
      return;
    }
    if (!videoId) return;
    const dur = getPlayerDuration();
    const finalDuration = dur > 0 ? Math.round(dur) : (video?.duration_seconds ?? 0);
    try {
      await api.post('/progress/update', {
        video_id: videoId,
        progress_seconds: finalDuration,
        duration_seconds: finalDuration > 0 ? finalDuration : undefined,
        status: 'completed',
      });
      invalidateProgress();
      toast.success('Marked as complete!');
    } catch {
      toast.error('Could not save progress');
    }
  }, [quizQuestions.length, videoId, video?.duration_seconds, invalidateProgress]);

  const currentIndex = moduleVideos.findIndex(v => v.id === videoId);
  const prevVideo = moduleVideos[currentIndex - 1];
  const nextVideo = moduleVideos[currentIndex + 1];

  const progressPct = playerDuration > 0 ? Math.round((currentTime / playerDuration) * 100) : 0;
  const displayDuration = playerDuration > 0 ? playerDuration : (video?.duration_seconds ?? 0);

  // ← hook must be before any conditional return
  const [activeTab, setActiveTab] = useState<'notes' | 'playlist' | 'assignments' | 'about'>('notes');
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 1024);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  // On mobile EVERY playable lesson uses the full-screen immersive (TikTok) view
  // — uploaded files, YouTube AND Vimeo (the immersive player embeds each in its
  // own chrome). Only EXTERNAL links (NotebookLM, Drive…) that can't be embedded
  // fall back to the "open in a new tab" card.
  const url = video?.video_url ?? '';
  const isEmbedUrl = /youtu\.?be|youtube\.com|vimeo\.com/i.test(url);
  const isFileUrl = /\.(mp4|webm|ogg|ogv|mov|m4v|m3u8)(\?|#|$)/i.test(url);
  const isExternalUrl = /^https?:\/\//i.test(url) && !isEmbedUrl && !isFileUrl;
  const canGoImmersive = isMobile && !isExternalUrl && !!url;

  if (videoLoading) {
    return (
      <div className="flex h-[calc(100dvh-56px)]" style={{ background: '#F6F4FD' }}>
        <div className="flex-1 p-6">
          <Skeleton className="aspect-video w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="flex items-center justify-center h-[calc(100dvh-56px)]" style={{ background: '#F6F4FD' }}>
        <p style={{ color: '#A5A1B8' }}>Video not found.</p>
      </div>
    );
  }

  type TabKey = typeof activeTab;
  const tabs = (
    [
      { key: 'notes' as TabKey, label: `Notes${notes.length > 0 ? ` (${notes.length})` : ''}`, show: true },
      { key: 'playlist' as TabKey, label: `Playlist (${moduleVideos.length})`, show: moduleVideos.length > 1 },
      { key: 'assignments' as TabKey, label: `Prob/Solution${moduleAssignments.length > 0 ? ` (${moduleAssignments.length})` : ''}`, show: true },
      { key: 'about' as TabKey, label: 'About', show: !!(video.description) },
    ] as { key: TabKey; label: string; show: boolean }[]
  ).filter(t => t.show);

  return (
    <div className="flex h-[100dvh] lg:h-[calc(100dvh-56px)] overflow-hidden" style={{ background: '#F6F4FD' }}>

      {/* ── Main content ── */}
      <div className="flex-1 overflow-y-auto">

        {/* ── MOBILE UI ── */}
        <div className="lg:hidden">

          {/* Inline video — ONLY the embed fallback (YouTube/Vimeo), which the
              immersive player can't drive. Uploaded videos always use the single
              full-screen immersive (TikTok) player, so there is never a second
              way to watch on mobile. */}
          {isMobile && !canGoImmersive && (
            <div style={{ background: '#F6F4FD', lineHeight: 0, position: 'relative' }}>
              <VideoPlayer
                videoUrl={video.video_url}
                markers={markers}
                videoId={video.id}
                onTimeUpdate={handleTimeUpdate}
                onVideoEnd={handleVideoEnd}
              />
            </div>
          )}

          {/* Progress bar — thin strip directly below video */}
          <div style={{ height: 3, background: '#EEEAFB' }}>
            <div style={{
              height: '100%',
              width: `${progressPct}%`,
              background: '#6D4AE0',
              transition: 'width 0.5s ease',
            }} />
          </div>

          {/* Title + lesson counter row */}
          <div style={{ padding: '12px 16px 0' }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              marginBottom: 6,
            }}>
              <span style={{
                fontFamily: MONO, fontSize: 10, letterSpacing: '0.14em',
                textTransform: 'uppercase', color: '#6D4AE0', opacity: 0.9,
              }}>
                {currentIndex + 1} / {moduleVideos.length}
              </span>
              <span style={{
                fontFamily: MONO, fontSize: 10, color: '#A5A1B8',
                letterSpacing: '0.05em',
              }}>
                {fmtTime(displayDuration)} · {progressPct}%
              </span>
            </div>
            <h1 style={{
              fontFamily: DISP,
              fontSize: 18, fontWeight: 700, lineHeight: 1.3,
              letterSpacing: '-0.01em', color: '#1E1B2E',
              margin: 0,
            }}>
              {video.title}
            </h1>
          </div>

          {/* Action row — the AI is the STAR here. "Ask the video, it answers"
              is the whole product promise, so it gets the gold and the space;
              back/done are administrative and shrink to icons. */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 16px 0',
          }}>
            {/* Back to module */}
            <Link
              to={module ? `/modules/${module.id}` : '/modules'}
              aria-label="Back to course"
              className="press"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--c-ink2)', textDecoration: 'none',
                background: 'var(--c-surf)', border: '1px solid var(--c-rule)',
                borderRadius: 10, minWidth: 44, minHeight: 44, flexShrink: 0,
              }}
            >
              <ChevronLeft size={18} />
            </Link>

            {/* ★ Ask this lesson anything — the magic, in gold */}
            <button
              onClick={() => { setPlaying(false); openAIAsk(videoId!, currentTime, video.has_transcript); }}
              className="press"
              style={{
                display: 'flex', alignItems: 'center', gap: 7,
                fontSize: 13.5, fontWeight: 700,
                background: 'linear-gradient(135deg, #E8B04B, #C98A2E)',
                color: '#0B0A0F',
                border: 'none',
                borderRadius: 10, padding: '0 14px',
                cursor: 'pointer', fontFamily: 'inherit',
                flex: 1, justifyContent: 'center',
                minHeight: 44,
                boxShadow: '0 6px 22px rgba(232,176,75,0.3)',
              }}
            >
              <Sparkles size={15} />
              Ask this lesson anything
            </button>

            {/* Mark complete — administrative, icon only */}
            {existingSubmission?.passed || (quizQuestions.length === 0 && progressPct >= 95) ? (
              <span aria-label="Completed" title="Completed" style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'rgba(123,212,78,0.12)', color: 'var(--c-ok)',
                border: '1px solid rgba(123,212,78,0.28)',
                borderRadius: 10, minWidth: 44, minHeight: 44, flexShrink: 0,
              }}>
                <CheckCircle size={18} />
              </span>
            ) : (
              <button
                onClick={handleMarkComplete}
                className="press"
                aria-label={quizQuestions.length > 0 ? 'Mark done and take the quiz' : 'Mark done'}
                title={quizQuestions.length > 0 ? 'Mark done + quiz' : 'Mark done'}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'var(--c-surf)', color: 'var(--c-ink2)',
                  borderRadius: 10, minWidth: 44, minHeight: 44,
                  border: '1px solid var(--c-rule)', cursor: 'pointer',
                  fontFamily: 'inherit', flexShrink: 0,
                }}
              >
                <Check size={18} />
              </button>
            )}
          </div>

          {/* Human Q&A — secondary, below the AI */}
          <div style={{ padding: '8px 16px 0' }}>
            <button
              onClick={() => { setPlaying(false); setSidebarOpen(true); openQuestionForm(currentTime); }}
              className="press"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                width: '100%', minHeight: 40,
                fontSize: 12.5, fontWeight: 600,
                background: 'transparent', color: 'var(--c-ink2)',
                border: '1px solid var(--c-rule)', borderRadius: 10,
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              <MessageSquare size={14} />
              Ask your instructor instead
            </button>
          </div>

          {/* Study material — opens the rich notes drawer */}
          {video.study_notes && (
            <div style={{ padding: '8px 16px 0' }}>
              <button
                onClick={() => setShowStudyNotes(true)}
                className="press"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                  width: '100%', minHeight: 44,
                  fontSize: 13, fontWeight: 700,
                  background: 'rgba(109,74,224,0.14)', color: '#6D4AE0',
                  border: '1px solid rgba(109,74,224,0.32)', borderRadius: 10,
                  cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                <BookOpen size={15} />
                Study notes for this lesson
              </button>
            </div>
          )}

          {/* Prev / Next lesson row — mobile */}
          {moduleVideos.length > 1 && (
            <div style={{
              display: 'flex', gap: 8, padding: '10px 16px 0',
            }}>
              <button
                onClick={() => prevVideo && navigate(`/video/${prevVideo.id}`)}
                disabled={!prevVideo}
                style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  background: '#FFFFFF', border: '1px solid rgba(30,27,46,0.10)',
                  color: '#6E6A85', fontSize: 13, fontWeight: 500,
                  borderRadius: 8, padding: '10px', cursor: prevVideo ? 'pointer' : 'not-allowed',
                  opacity: prevVideo ? 1 : 0.3, fontFamily: 'inherit',
                  overflow: 'hidden',
                }}
              >
                <ChevronLeft size={15} style={{ flexShrink: 0 }} />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {prevVideo?.title ?? 'Previous'}
                </span>
              </button>
              <button
                onClick={() => nextVideo && navigate(`/video/${nextVideo.id}`)}
                disabled={!nextVideo}
                style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  background: nextVideo ? '#6D4AE0' : '#FFFFFF',
                  border: nextVideo ? 'none' : '1px solid rgba(30,27,46,0.10)',
                  color: nextVideo ? '#ffffff' : '#6E6A85',
                  fontSize: 13, fontWeight: nextVideo ? 700 : 500,
                  borderRadius: 8, padding: '10px', cursor: nextVideo ? 'pointer' : 'not-allowed',
                  opacity: nextVideo ? 1 : 0.3, fontFamily: 'inherit',
                  overflow: 'hidden',
                }}
              >
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {nextVideo?.title ?? 'Next'}
                </span>
                <ChevronRight size={15} style={{ flexShrink: 0 }} />
              </button>
            </div>
          )}

          {/* Tab bar — mobile */}
          <div style={{ marginTop: 16 }}>
            <div style={{
              display: 'flex', overflowX: 'auto', scrollbarWidth: 'none',
              borderBottom: '1px solid rgba(30,27,46,0.10)',
            }}>
              {tabs.map(t => (
                <button
                  key={t.key}
                  onClick={() => setActiveTab(t.key)}
                  style={{
                    background: 'none', border: 'none',
                    borderBottom: activeTab === t.key ? '2px solid #b259c4' : '2px solid transparent',
                    color: activeTab === t.key ? '#1E1B2E' : '#A5A1B8',
                    fontFamily: 'inherit', fontSize: 13,
                    fontWeight: activeTab === t.key ? 600 : 400,
                    padding: '10px 16px', cursor: 'pointer',
                    transition: 'color 0.15s, border-color 0.15s',
                    marginBottom: -1, whiteSpace: 'nowrap', flexShrink: 0,
                    minHeight: 44,
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <div style={{ padding: '16px 16px 100px' }}>
              {activeTab === 'notes' && <NotesTabContent notes={notes} noteDraft={noteDraft} setNoteDraft={setNoteDraft} notePinTime={notePinTime} setNotePinTime={setNotePinTime} currentTime={currentTime} handleNoteSave={handleNoteSave} createNote={createNote} noteEditId={noteEditId} setNoteEditId={setNoteEditId} noteEditContent={noteEditContent} setNoteEditContent={setNoteEditContent} updateNote={updateNote} deleteNote={deleteNote} seekTo={seekTo} videoId={video.id} />}
              {activeTab === 'playlist' && <PlaylistTabContent moduleVideos={moduleVideos} videoId={videoId!} navigate={navigate} />}
              {activeTab === 'assignments' && <AssignmentsTabContent moduleAssignments={moduleAssignments} />}
              {activeTab === 'about' && video.description && (
                <p style={{ fontSize: 14, color: '#6E6A85', lineHeight: 1.75 }}>{video.description}</p>
              )}
            </div>
          </div>
        </div>

        {/* ── DESKTOP layout (lg+) ── */}
        <div className="hidden lg:block px-8 py-8 max-w-5xl mx-auto w-full">

          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 mb-6 overflow-hidden" style={{ fontSize: 12, letterSpacing: '0.04em' }}>
            <Link to="/modules" style={{ color: '#A5A1B8', textDecoration: 'none', transition: 'color 0.2s', flexShrink: 0 }}
              onMouseEnter={e => ((e.target as HTMLElement).style.color = '#1E1B2E')}
              onMouseLeave={e => ((e.target as HTMLElement).style.color = '#A5A1B8')}
            >Modules</Link>
            {module && (
              <>
                <span style={{ color: 'rgba(30,27,46,0.20)', flexShrink: 0 }}>/</span>
                <Link to={`/modules/${module.id}`} style={{ color: '#A5A1B8', textDecoration: 'none', transition: 'color 0.2s' }}
                  onMouseEnter={e => ((e.target as HTMLElement).style.color = '#1E1B2E')}
                  onMouseLeave={e => ((e.target as HTMLElement).style.color = '#A5A1B8')}
                  className="truncate max-w-[200px]"
                >{module.title}</Link>
                <span style={{ color: 'rgba(30,27,46,0.20)', flexShrink: 0 }}>/</span>
                <span className="truncate" style={{ color: '#1E1B2E', fontWeight: 500 }}>{video.title}</span>
              </>
            )}
          </nav>

          <div style={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: '0.18em', color: '#6D4AE0', textTransform: 'uppercase', marginBottom: 10, opacity: 0.85 }}>
            {module?.title ?? 'Module'}&nbsp;&nbsp;·&nbsp;&nbsp;Lesson {String(currentIndex + 1).padStart(2, '0')}
          </div>

          <h1 style={{ fontFamily: DISP, fontSize: 'clamp(24px, 2.5vw, 34px)', fontWeight: 700, lineHeight: 1.2, letterSpacing: '-0.02em', color: '#1E1B2E', marginBottom: 28, maxWidth: 640 }}>
            {video.title}
            {video.description && (
              <span style={{ display: 'block', fontStyle: 'italic', color: '#6D4AE0', marginTop: 4, fontSize: 'clamp(13px, 1.5vw, 16px)' }}>
                {video.description.length > 80 ? video.description.slice(0, 80) + '…' : video.description}
              </span>
            )}
          </h1>

          {video.is_shareable && (
            <div style={{ marginTop: -16, marginBottom: 24 }}>
              <ShareLessonButton videoId={video.id} title={video.title} shareable={video.is_shareable} />
            </div>
          )}

          {/* Video — desktop instance, only mounted when not mobile */}
          {!isMobile && (
            <div style={{ borderRadius: 8, overflow: 'hidden', border: '1px solid rgba(30,27,46,0.10)', boxShadow: '0 24px 60px rgba(84,52,180,0.16)', marginBottom: 16 }}>
              <VideoPlayer
                videoUrl={video.video_url}
                markers={markers}
                videoId={video.id}
                onTimeUpdate={handleTimeUpdate}
                onVideoEnd={handleVideoEnd}
              />
            </div>
          )}

          {/* Desktop action bar */}
          <div className="flex items-center gap-2 mb-6">
            <span style={{ fontFamily: MONO, fontSize: 11, color: '#A5A1B8', background: '#EEEAFB', border: '1px solid rgba(30,27,46,0.10)', padding: '5px 10px', borderRadius: 100, letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>
              {fmtTime(displayDuration)} · <span style={{ color: '#6D4AE0' }}>{progressPct}%</span>
            </span>
            <div style={{ flex: 1 }} />
            {video.study_notes && (
              <button
                onClick={() => setShowStudyNotes(true)}
                style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(109,74,224,0.14)', color: '#6D4AE0', border: '1px solid rgba(109,74,224,0.35)', fontSize: 12, fontWeight: 700, padding: '7px 14px', borderRadius: 4, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap', transition: 'all 0.15s' }}
              >
                <BookOpen size={12} /> Study notes
              </button>
            )}
            <button
              onClick={() => { setPlaying(false); setSidebarOpen(true); openQuestionForm(currentTime); }}
              style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#6D4AE0', color: '#ffffff', border: '1px solid rgba(109,74,224,0.4)', fontSize: 12, fontWeight: 600, padding: '7px 14px', borderRadius: 4, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap', transition: 'all 0.15s' }}
            >
              <MessageSquare size={12} /> Ask a question
            </button>
            {existingSubmission?.passed || (quizQuestions.length === 0 && progressPct >= 95) ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(52,211,153,0.12)', color: '#34d399', border: '1px solid rgba(52,211,153,0.25)', fontSize: 12, fontWeight: 600, padding: '7px 14px', borderRadius: 4, whiteSpace: 'nowrap' }}>
                <CheckCircle size={12} /> Completed
              </span>
            ) : (
              <button onClick={handleMarkComplete} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#6D4AE0', color: '#ffffff', fontSize: 12, fontWeight: 600, padding: '7px 14px', borderRadius: 4, border: 'none', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
                Mark complete{quizQuestions.length > 0 ? ' & quiz' : ''}
              </button>
            )}
          </div>

          {/* Desktop tabs */}
          <div>
            <div style={{ display: 'flex', borderBottom: '1px solid rgba(30,27,46,0.10)' }}>
              {tabs.map(t => (
                <button key={t.key} onClick={() => setActiveTab(t.key)} style={{ background: 'none', border: 'none', borderBottom: activeTab === t.key ? '2px solid #b259c4' : '2px solid transparent', color: activeTab === t.key ? '#1E1B2E' : '#A5A1B8', fontFamily: 'inherit', fontSize: 13, fontWeight: activeTab === t.key ? 600 : 400, padding: '10px 16px', cursor: 'pointer', transition: 'color 0.15s, border-color 0.15s', marginBottom: -1, whiteSpace: 'nowrap', minHeight: 44 }}>
                  {t.label}
                </button>
              ))}
            </div>
            <div className="pt-5">
              {activeTab === 'notes' && <NotesTabContent notes={notes} noteDraft={noteDraft} setNoteDraft={setNoteDraft} notePinTime={notePinTime} setNotePinTime={setNotePinTime} currentTime={currentTime} handleNoteSave={handleNoteSave} createNote={createNote} noteEditId={noteEditId} setNoteEditId={setNoteEditId} noteEditContent={noteEditContent} setNoteEditContent={setNoteEditContent} updateNote={updateNote} deleteNote={deleteNote} seekTo={seekTo} videoId={video.id} />}
              {activeTab === 'playlist' && <PlaylistTabContent moduleVideos={moduleVideos} videoId={videoId!} navigate={navigate} />}
              {activeTab === 'assignments' && <AssignmentsTabContent moduleAssignments={moduleAssignments} />}
              {activeTab === 'about' && video.description && (
                <p style={{ fontSize: 14, color: '#6E6A85', lineHeight: 1.75 }}>{video.description}</p>
              )}
            </div>
          </div>

          {/* Desktop prev/next */}
          {moduleVideos.length > 1 && (
            <div className="flex items-center gap-3 mt-10 pt-6" style={{ borderTop: '1px solid rgba(30,27,46,0.10)' }}>
              <button
                onClick={() => prevVideo && navigate(`/video/${prevVideo.id}`)}
                disabled={!prevVideo}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: '#FFFFFF', border: '1px solid rgba(30,27,46,0.10)', color: '#6E6A85', fontSize: 14, fontWeight: 500, borderRadius: 8, cursor: prevVideo ? 'pointer' : 'not-allowed', opacity: prevVideo ? 1 : 0.3, fontFamily: 'inherit', maxWidth: '40%', overflow: 'hidden' }}
                onMouseEnter={e => { if (prevVideo) (e.currentTarget as HTMLElement).style.borderColor = 'rgba(109,74,224,0.3)'; }}
                onMouseLeave={e => ((e.currentTarget as HTMLElement).style.borderColor = 'rgba(30,27,46,0.10)')}
              >
                <ChevronLeft size={16} style={{ flexShrink: 0 }} />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{prevVideo?.title ?? 'Previous'}</span>
              </button>
              <span style={{ color: '#A5A1B8', fontFamily: MONO, fontSize: 12, letterSpacing: '0.06em', margin: '0 auto', whiteSpace: 'nowrap' }}>
                {currentIndex + 1} / {moduleVideos.length}
              </span>
              <button
                onClick={() => nextVideo && navigate(`/video/${nextVideo.id}`)}
                disabled={!nextVideo}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: nextVideo ? '#6D4AE0' : '#FFFFFF', border: nextVideo ? 'none' : '1px solid rgba(30,27,46,0.10)', color: nextVideo ? '#ffffff' : '#6E6A85', fontSize: 14, fontWeight: nextVideo ? 700 : 500, borderRadius: 8, cursor: nextVideo ? 'pointer' : 'not-allowed', opacity: nextVideo ? 1 : 0.3, fontFamily: 'inherit', maxWidth: '40%', overflow: 'hidden' }}
                onMouseEnter={e => { if (nextVideo) (e.currentTarget as HTMLElement).style.opacity = '0.88'; }}
                onMouseLeave={e => { if (nextVideo) (e.currentTarget as HTMLElement).style.opacity = '1'; }}
              >
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{nextVideo?.title ?? 'Next'}</span>
                <ChevronRight size={16} style={{ flexShrink: 0 }} />
              </button>
            </div>
          )}

        </div>{/* end desktop */}
      </div>

      {/* ── Q&A Sidebar: desktop inline panel (lg+) ── */}
      {videoId && (
        <div className="hidden lg:flex" style={{ height: '100%' }}>
          <QASidebar videoId={videoId} activeQuestionId={activeQuestionId} onClose={() => setSidebarOpen(false)} />
        </div>
      )}

      {/* ── Q&A Sidebar: mobile bottom sheet (< lg) ── */}
      {videoId && (
        <div className="lg:hidden">
          {/* Backdrop — above the immersive player (z-70) so the sheet takes over
              when the learner asks a question from the full-screen view */}
          {sidebarOpen && (
            <div
              className="fixed inset-0"
              style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(3px)', zIndex: 80 }}
              onClick={() => setSidebarOpen(false)}
            />
          )}
          {/* Sheet — sits above the immersive player + BottomNav */}
          <div
            style={{
              position: 'fixed',
              left: 0, right: 0, bottom: 0,
              height: 'min(80vh, 100dvh - 56px)',
              zIndex: 81,
              borderRadius: '20px 20px 0 0',
              overflow: 'hidden',
              transform: sidebarOpen ? 'translateY(0)' : 'translateY(100%)',
              transition: 'transform 0.3s cubic-bezier(0.16,1,0.3,1)',
              display: 'flex',
              flexDirection: 'column',
              paddingBottom: 'env(safe-area-inset-bottom, 0px)',
              background: '#FFFFFF',
            }}
          >
            <div style={{ background: '#FFFFFF', padding: '10px 0 4px', display: 'flex', justifyContent: 'center', flexShrink: 0, borderBottom: '1px solid rgba(30,27,46,0.08)' }}>
              <div style={{ width: 36, height: 4, background: 'rgba(30,27,46,0.14)', borderRadius: 2 }} />
            </div>
            <QASidebar videoId={videoId} activeQuestionId={activeQuestionId} onClose={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* Full-screen immersive lesson view (mobile, uploaded video only) */}
      {immersive && canGoImmersive && video && (
        <ImmersiveMobilePlayer
          video={video}
          videoUrl={video.video_url}
          index={currentIndex + 1}
          total={moduleVideos.length}
          hasPrev={!!prevVideo}
          hasNext={!!nextVideo}
          onPrev={() => prevVideo && navigate(`/video/${prevVideo.id}`)}
          onNext={() => nextVideo && navigate(`/video/${nextVideo.id}`)}
          onExit={() => navigate(module ? `/modules/${module.id}` : '/modules')}
          onAsk={(atTime) => { setSidebarOpen(true); openQuestionForm(atTime); }}
          onQuiz={quizQuestions.length > 0 ? () => setShowQuiz(true) : undefined}
          hasQuiz={quizQuestions.length > 0}
          onNotes={video.study_notes ? () => setShowStudyNotes(true) : undefined}
          hasNotes={!!video.study_notes}
          overlayOpen={showQuestionForm || showQuiz || aiAskOpen || showStudyNotes}
        />
      )}

      {/* Study material drawer */}
      {showStudyNotes && videoId && video?.study_notes && (
        <StudyNotesDrawer
          videoId={videoId}
          notes={video.study_notes}
          onClose={() => setShowStudyNotes(false)}
        />
      )}

      {/* The beat after finishing a lesson — celebrate, then let them choose */}
      {showComplete && (
        <LessonCompleteOverlay
          index={currentIndex + 1}
          total={moduleVideos.length || 1}
          nextTitle={nextVideo?.title}
          onNext={nextVideo ? () => { setShowComplete(false); navigate(`/video/${nextVideo.id}`); } : undefined}
          onQuiz={quizQuestions.length > 0 ? () => { setShowComplete(false); setShowQuiz(true); } : undefined}
          quizCount={quizQuestions.length}
          onDismiss={() => setShowComplete(false)}
        />
      )}

      {/* Question form modal */}
      {showQuestionForm && videoId && <QuestionForm videoId={videoId} />}

      {/* Quiz modal */}
      {showQuiz && videoId && quizQuestions.length > 0 && (
        <QuizModal
          videoId={videoId}
          questions={quizQuestions}
          onClose={() => setShowQuiz(false)}
          existingResult={existingSubmission}
        />
      )}

      {/* AI Whiteboard modal */}
      {whiteboardQuestionId && videoId && (
        <WhiteboardModal
          questionId={whiteboardQuestionId}
          questionText={whiteboardQuestionText}
          videoId={videoId}
        />
      )}

      {/* AI Ask modal */}
      {aiAskOpen && videoId && <AskAIModal />}

      {/* Ask AI — desktop FAB. (On mobile it's the gold hero action in the
          row under the video: the whole product promise is "ask the video,
          it answers", so it must never be desktop-only.) */}
      {videoId && !aiAskOpen && !whiteboardQuestionId && !immersive && (
        <button
          onClick={() => openAIAsk(videoId, currentTime, video.has_transcript)}
          className="hidden lg:flex fixed bottom-7 right-7 z-40 items-center gap-2 font-bold transition-all hover:scale-105 active:scale-95"
          style={{
            background: 'linear-gradient(135deg, #E8B04B, #C98A2E)',
            color: '#0B0A0F',
            fontSize: 13,
            padding: '12px 22px',
            borderRadius: 100,
            border: 'none',
            cursor: 'pointer',
            letterSpacing: '0.02em',
            fontFamily: 'inherit',
            boxShadow: '0 8px 32px rgba(232,176,75,0.35)',
          }}
          title="Ask this lesson anything"
        >
          <Sparkles size={15} />
          Ask this lesson anything
        </button>
      )}

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

// ── Assignment card (used in Assignments tab) ─────────────────────────────────
function AssignmentCard({ a }: { a: Assignment }) {
  return (
    <div
      style={{
        background: '#FFFFFF',
        border: '1px solid rgba(30,27,46,0.10)',
        borderRadius: 8,
        padding: '14px 18px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 14,
        transition: 'border-color 0.2s',
      }}
      onMouseEnter={e => ((e.currentTarget as HTMLElement).style.borderColor = 'rgba(109,74,224,0.25)')}
      onMouseLeave={e => ((e.currentTarget as HTMLElement).style.borderColor = 'rgba(30,27,46,0.10)')}
    >
      <div style={{ minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, flexWrap: 'wrap' }}>
          <span style={{
            fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase',
            padding: '2px 8px', borderRadius: 100,
            background: a.type === 'group' ? 'rgba(139,92,246,0.15)' : 'rgba(59,130,246,0.15)',
            color: a.type === 'group' ? '#a78bfa' : '#60a5fa',
            display: 'flex', alignItems: 'center', gap: 4,
          }}>
            {a.type === 'group' ? <Users size={10} /> : <BookOpen size={10} />}
            {a.type === 'group' ? 'Group' : 'Individual'}
          </span>
          {a.submission_count > 0 && (
            <span style={{ fontSize: 10, color: '#4ade80', display: 'flex', alignItems: 'center', gap: 3 }}>
              <CheckCircle size={10} /> Submitted
            </span>
          )}
        </div>
        <p style={{ fontSize: 14, fontWeight: 600, color: '#1E1B2E', marginBottom: 2 }}>{a.title}</p>
        {a.deadline && (
          <p style={{ fontSize: 11, color: '#A5A1B8', display: 'flex', alignItems: 'center', gap: 4 }}>
            <Clock size={10} />
            Due {formatDistanceToNow(parseISO(a.deadline), { addSuffix: true })}
          </p>
        )}
      </div>
      <Link
        to={`/assignments/${a.id}/work`}
        style={{
          flexShrink: 0,
          display: 'flex', alignItems: 'center', gap: 6,
          background: '#6D4AE0', color: '#ffffff',
          fontSize: 12, fontWeight: 700,
          padding: '8px 14px', borderRadius: 4,
          textDecoration: 'none', whiteSpace: 'nowrap',
          transition: 'opacity 0.2s',
        }}
        onMouseEnter={e => ((e.currentTarget as HTMLElement).style.opacity = '0.85')}
        onMouseLeave={e => ((e.currentTarget as HTMLElement).style.opacity = '1')}
      >
        {a.submission_count > 0 ? 'View work' : 'Start'}
        <ArrowRight size={13} />
      </Link>
    </div>
  );
}

// ── Shared tab content components (used by both mobile and desktop) ───────────

function NotesTabContent({ notes, noteDraft, setNoteDraft, notePinTime, setNotePinTime, currentTime, handleNoteSave, createNote, noteEditId, setNoteEditId, noteEditContent, setNoteEditContent, updateNote, deleteNote, seekTo, videoId }: {
  notes: { id: string; content: string; timestamp_seconds: number | null; created_at: string }[];
  noteDraft: string; setNoteDraft: (v: string) => void;
  notePinTime: boolean; setNotePinTime: (fn: (v: boolean) => boolean) => void;
  currentTime: number; handleNoteSave: () => void;
  createNote: { isPending: boolean };
  noteEditId: string | null; setNoteEditId: (v: string | null) => void;
  noteEditContent: string; setNoteEditContent: (v: string) => void;
  updateNote: { mutate: (v: { id: string; content: string }) => void };
  deleteNote: { mutate: (id: string) => void };
  seekTo: (t: number) => void;
  videoId: string;
}) {
  function fmtT(s: number) { const m = Math.floor(s / 60); return `${m}:${String(Math.floor(s % 60)).padStart(2, '0')}`; }

  const handleExport = () => {
    const lines = notes.map(n => `${n.timestamp_seconds != null ? `[${fmtT(n.timestamp_seconds)}] ` : ''}${n.content}`);
    const blob = new Blob([lines.join('\n\n')], { type: 'text/plain' });
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: `notes-${videoId}.txt` });
    a.click(); URL.revokeObjectURL(a.href);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {notes.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={handleExport} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#A5A1B8', background: 'transparent', border: '1px solid rgba(30,27,46,0.10)', borderRadius: 4, padding: '5px 10px', cursor: 'pointer', fontFamily: 'inherit' }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Export
          </button>
        </div>
      )}
      <div style={{ background: '#FFFFFF', border: '1px solid rgba(30,27,46,0.10)', borderRadius: 8, padding: '14px 16px' }}>
        <textarea
          value={noteDraft} onChange={e => setNoteDraft(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleNoteSave(); }}
          placeholder="Write a note…" rows={3}
          style={{ width: '100%', background: 'transparent', border: 'none', color: '#1E1B2E', fontSize: 14, fontFamily: 'inherit', lineHeight: 1.6, resize: 'none', outline: 'none', boxSizing: 'border-box' }}
        />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8, paddingTop: 10, borderTop: '1px solid rgba(30,27,46,0.08)' }}>
          <button onClick={() => setNotePinTime(v => !v)} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: notePinTime ? '#6D4AE0' : '#A5A1B8', background: notePinTime ? 'rgba(109,74,224,0.1)' : 'transparent', border: notePinTime ? '1px solid rgba(109,74,224,0.25)' : '1px solid transparent', borderRadius: 4, padding: '4px 8px', cursor: 'pointer', fontFamily: 'inherit' }}>
            <Clock size={11} /> {notePinTime ? fmtT(currentTime) : 'Pin timestamp'}
          </button>
          <button onClick={handleNoteSave} disabled={!noteDraft.trim() || createNote.isPending} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600, color: '#ffffff', background: !noteDraft.trim() ? 'rgba(109,74,224,0.3)' : '#6D4AE0', border: 'none', borderRadius: 4, padding: '6px 14px', cursor: !noteDraft.trim() ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
            <Plus size={12} /> Save
          </button>
        </div>
      </div>
      {notes.length === 0 ? (
        <p style={{ color: '#A5A1B8', fontSize: 13, fontStyle: 'italic', padding: '4px 0' }}>No notes yet. Write something above.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {notes.map(note => (
            <div key={note.id} style={{ background: '#FFFFFF', border: '1px solid rgba(30,27,46,0.10)', borderRadius: 8, padding: '12px 14px' }}>
              {noteEditId === note.id ? (
                <div>
                  <textarea value={noteEditContent} onChange={e => setNoteEditContent(e.target.value)} autoFocus rows={3} style={{ width: '100%', background: '#F6F4FD', border: '1px solid rgba(109,74,224,0.3)', borderRadius: 4, color: '#1E1B2E', fontSize: 13, fontFamily: 'inherit', lineHeight: 1.6, resize: 'none', outline: 'none', padding: '8px 10px', boxSizing: 'border-box' }} />
                  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    <button onClick={() => updateNote.mutate({ id: note.id, content: noteEditContent.trim() })} disabled={!noteEditContent.trim()} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, background: '#6D4AE0', color: '#ffffff', border: 'none', borderRadius: 4, padding: '5px 10px', cursor: 'pointer', fontFamily: 'inherit' }}><Check size={11} /> Save</button>
                    <button onClick={() => setNoteEditId(null)} style={{ fontSize: 11, color: '#A5A1B8', background: 'transparent', border: '1px solid rgba(30,27,46,0.10)', borderRadius: 4, padding: '5px 10px', cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
                  </div>
                </div>
              ) : (
                <div>
                  {note.timestamp_seconds != null && (
                    <button onClick={() => seekTo(note.timestamp_seconds!)} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#6D4AE0', fontFamily: MONO, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: 4 }}>
                      <Clock size={10} /> {fmtT(note.timestamp_seconds)}
                    </button>
                  )}
                  <p style={{ fontSize: 13, color: '#1E1B2E', lineHeight: 1.65, whiteSpace: 'pre-wrap', margin: 0 }}>{note.content}</p>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6, marginTop: 8 }}>
                    <button onClick={() => { setNoteEditId(note.id); setNoteEditContent(note.content); }} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#A5A1B8', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px', fontFamily: 'inherit' }}><Pencil size={11} /> Edit</button>
                    <button onClick={() => deleteNote.mutate(note.id)} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#A5A1B8', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px', fontFamily: 'inherit' }}><Trash2 size={11} /> Delete</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PlaylistTabContent({ moduleVideos, videoId, navigate }: {
  moduleVideos: Video[]; videoId: string; navigate: (path: string) => void;
}) {
  return (
    <div style={{ border: '1px solid rgba(30,27,46,0.10)', borderRadius: 8, overflow: 'hidden' }}>
      {moduleVideos.map((v, idx) => {
        const isCurrent = v.id === videoId;
        return (
          <button key={v.id} onClick={() => !isCurrent && navigate(`/video/${v.id}`)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: isCurrent ? 'rgba(109,74,224,0.08)' : '#FFFFFF', borderTop: 'none', borderRight: 'none', borderBottom: idx < moduleVideos.length - 1 ? '1px solid rgba(30,27,46,0.07)' : 'none', borderLeft: `3px solid ${isCurrent ? '#6D4AE0' : 'transparent'}`, cursor: isCurrent ? 'default' : 'pointer', textAlign: 'left', fontFamily: 'inherit', minHeight: 52 }}>
            <span style={{ fontFamily: MONO, fontSize: 10, color: isCurrent ? '#6D4AE0' : '#A5A1B8', width: 20, flexShrink: 0, letterSpacing: '0.08em' }}>{String(idx + 1).padStart(2, '0')}</span>
            <div style={{ width: 28, height: 28, borderRadius: 4, background: isCurrent ? 'rgba(109,74,224,0.15)' : 'rgba(30,27,46,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Play size={11} fill={isCurrent ? '#6D4AE0' : '#A5A1B8'} style={{ color: isCurrent ? '#6D4AE0' : '#A5A1B8', marginLeft: 1 }} />
            </div>
            <span style={{ flex: 1, fontSize: 14, fontWeight: isCurrent ? 600 : 400, color: isCurrent ? '#1E1B2E' : '#6E6A85', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.title}</span>
            {v.duration_seconds > 0 && <span style={{ fontFamily: MONO, fontSize: 11, color: '#A5A1B8', flexShrink: 0 }}>{fmtDur(v.duration_seconds)}</span>}
          </button>
        );
      })}
    </div>
  );
}

function AssignmentsTabContent({ moduleAssignments }: { moduleAssignments: Assignment[] }) {
  if (moduleAssignments.length === 0) return <p style={{ color: '#A5A1B8', fontSize: 13, fontStyle: 'italic' }}>No assignments for this module yet.</p>;
  return <div className="space-y-3">{moduleAssignments.map(a => <AssignmentCard key={a.id} a={a} />)}</div>;
}
