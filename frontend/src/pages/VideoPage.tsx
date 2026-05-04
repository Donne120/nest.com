import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, Sparkles, Clock, Users, BookOpen, CheckCircle, ArrowRight, Play, Trash2, Pencil, Check, Plus } from 'lucide-react';
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
import { useCallback, useEffect, useRef, useState } from 'react';
import FloatingNotes from '../components/Notes/FloatingNotes';
import WhiteboardModal from '../components/AI/WhiteboardModal';
import AskAIModal from '../components/AI/AskAIModal';

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
  const { showQuestionForm, activeQuestionId, sidebarOpen, setSidebarOpen, whiteboardQuestionId, whiteboardQuestionText, aiAskOpen, openAIAsk } = useUIStore();
  const { seekTo, currentTime, duration: playerDuration } = usePlayerStore();
  const getPlayerDuration = () => usePlayerStore.getState().duration;
  const [showQuiz, setShowQuiz] = useState(false);
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
    if (quizQuestions.length > 0) setShowQuiz(true);
  }, [videoId, video?.duration_seconds, quizQuestions.length, invalidateProgress]);

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

  if (videoLoading) {
    return (
      <div className="flex h-[calc(100vh-56px)]" style={{ background: '#0b0c0f' }}>
        <div className="flex-1 p-6">
          <Skeleton className="aspect-video w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-56px)]" style={{ background: '#0b0c0f' }}>
        <p style={{ color: '#6b6b78' }}>Video not found.</p>
      </div>
    );
  }

  type TabKey = typeof activeTab;
  const tabs = (
    [
      { key: 'notes' as TabKey, label: `Notes${notes.length > 0 ? ` (${notes.length})` : ''}`, show: true },
      { key: 'playlist' as TabKey, label: `Playlist (${moduleVideos.length})`, show: moduleVideos.length > 1 },
      { key: 'assignments' as TabKey, label: `Assignments${moduleAssignments.length > 0 ? ` (${moduleAssignments.length})` : ''}`, show: true },
      { key: 'about' as TabKey, label: 'About', show: !!(video.description) },
    ] as { key: TabKey; label: string; show: boolean }[]
  ).filter(t => t.show);

  return (
    <div className="flex h-[calc(100vh-56px)] overflow-hidden" style={{ background: '#0b0c0f' }}>

      {/* ── Main content ── */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-3 pt-3 pb-4 sm:px-5 sm:py-6 lg:px-8 lg:py-8 max-w-5xl mx-auto w-full">

          {/* Breadcrumb — on mobile show only module link, hide current video title */}
          <nav className="flex items-center gap-2 mb-3 sm:mb-6 overflow-hidden" style={{ fontSize: 12, letterSpacing: '0.04em' }}>
            <Link to="/modules" style={{ color: '#6b6b78', textDecoration: 'none', transition: 'color 0.2s', flexShrink: 0 }}
              onMouseEnter={e => ((e.target as HTMLElement).style.color = '#e8e4dc')}
              onMouseLeave={e => ((e.target as HTMLElement).style.color = '#6b6b78')}
            >
              Modules
            </Link>
            {module && (
              <>
                <span style={{ color: 'rgba(255,255,255,0.2)', flexShrink: 0 }}>/</span>
                <Link to={`/modules/${module.id}`} style={{ color: '#6b6b78', textDecoration: 'none', transition: 'color 0.2s' }}
                  onMouseEnter={e => ((e.target as HTMLElement).style.color = '#e8e4dc')}
                  onMouseLeave={e => ((e.target as HTMLElement).style.color = '#6b6b78')}
                  className="truncate max-w-[140px] sm:max-w-[200px]"
                >
                  {module.title}
                </Link>
              </>
            )}
            {/* Current video title — hidden on mobile to save space */}
            <span className="hidden sm:inline" style={{ color: 'rgba(255,255,255,0.2)', flexShrink: 0 }}>/</span>
            <span className="hidden sm:block truncate" style={{ color: '#e8e4dc', fontWeight: 500 }}>{video.title}</span>
          </nav>

          {/* Chapter label — hidden on mobile */}
          <div className="hidden sm:block" style={{
            fontFamily: 'monospace',
            fontSize: 10.5,
            letterSpacing: '0.18em',
            color: '#e8c97e',
            textTransform: 'uppercase',
            marginBottom: 10,
            opacity: 0.85,
          }}>
            {module?.title ?? 'Module'}&nbsp;&nbsp;·&nbsp;&nbsp;Lesson {String(currentIndex + 1).padStart(2, '0')}
          </div>

          {/* Lesson title — smaller margin on mobile */}
          <h1 style={{
            fontFamily: "'Lora', Georgia, serif",
            fontSize: 'clamp(18px, 2.5vw, 34px)',
            fontWeight: 700,
            lineHeight: 1.2,
            letterSpacing: '-0.02em',
            color: '#e8e4dc',
            marginBottom: 'clamp(10px, 2vw, 28px)',
            maxWidth: 640,
            animation: 'fadeUp 0.55s ease both',
            animationDelay: '0.05s',
          }}>
            {video.title}
            {/* Description subtitle — hidden on mobile */}
            {video.description && (
              <span className="hidden sm:block" style={{ fontStyle: 'italic', color: '#e8c97e', marginTop: 4, fontSize: 'clamp(13px, 1.5vw, 16px)' }}>
                {video.description.length > 80 ? video.description.slice(0, 80) + '…' : video.description}
              </span>
            )}
          </h1>

          {/* Video player */}
          <div style={{ animation: 'fadeUp 0.6s ease both', animationDelay: '0.12s' }}>
            <div style={{
              borderRadius: 8,
              overflow: 'hidden',
              border: '1px solid rgba(255,255,255,0.07)',
              boxShadow: '0 40px 80px rgba(0,0,0,0.55)',
            }}>
              <VideoPlayer
                videoUrl={video.video_url}
                markers={markers}
                videoId={video.id}
                onTimeUpdate={handleTimeUpdate}
                onVideoEnd={handleVideoEnd}
              />
            </div>
          </div>

          {/* ── Action bar ── */}
          <div
            className="mt-3 flex items-center gap-2 overflow-x-auto scrollbar-none"
            style={{ animation: 'fadeUp 0.6s ease both', animationDelay: '0.18s' }}
          >
            {/* Duration + progress pill */}
            <span style={{
              fontFamily: 'monospace',
              fontSize: 11,
              color: '#6b6b78',
              background: '#1c1e27',
              border: '1px solid rgba(255,255,255,0.07)',
              padding: '5px 10px',
              borderRadius: 100,
              letterSpacing: '0.05em',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}>
              {fmtTime(displayDuration)} · <span style={{ color: '#e8c97e' }}>{progressPct}%</span>
            </span>

            {/* Spacer — desktop only */}
            <div className="hidden sm:block" style={{ flex: 1 }} />

            {/* Notes icon button */}
            <div style={{ flexShrink: 0 }}>
              <FloatingNotes videoId={video.id} onSeek={seekTo} inline />
            </div>

            {/* Q&A toggle — mobile only */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden flex items-center gap-1.5 rounded-full"
              style={{
                background: sidebarOpen ? 'rgba(232,201,126,0.15)' : '#1c1e27',
                border: sidebarOpen ? '1px solid rgba(232,201,126,0.4)' : '1px solid rgba(255,255,255,0.09)',
                color: sidebarOpen ? '#e8c97e' : '#9ca3af',
                fontSize: 12, fontWeight: 600,
                padding: '9px 14px',
                flexShrink: 0, cursor: 'pointer',
                fontFamily: 'inherit', whiteSpace: 'nowrap',
                minHeight: 40,
                transition: 'all 0.15s',
              }}
            >
              💬 Q&A
            </button>

            {/* Mark complete */}
            {existingSubmission?.passed || (quizQuestions.length === 0 && progressPct >= 95) ? (
              <span
                className="flex items-center gap-1 font-semibold"
                style={{
                  background: 'rgba(52,211,153,0.12)',
                  color: '#34d399',
                  border: '1px solid rgba(52,211,153,0.25)',
                  fontSize: 12,
                  padding: '7px 11px',
                  flexShrink: 0,
                  borderRadius: 4,
                  whiteSpace: 'nowrap',
                }}
              >
                <CheckCircle size={12} />
                <span className="hidden sm:inline">Completed</span>
                <span className="sm:hidden">Done</span>
              </span>
            ) : (
              <button
                onClick={handleMarkComplete}
                className="flex items-center gap-1 font-semibold transition-all hover:opacity-85 active:scale-95"
                style={{
                  background: '#e8c97e',
                  color: '#0b0c0f',
                  fontSize: 12,
                  padding: '7px 11px',
                  flexShrink: 0,
                  borderRadius: 4,
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  whiteSpace: 'nowrap',
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6L9 17l-5-5"/>
                </svg>
                <span className="hidden sm:inline">Mark complete{quizQuestions.length > 0 ? ' & quiz' : ''}</span>
                <span className="sm:hidden">Done</span>
              </button>
            )}

          </div>

          {/* ── Tab bar: Notes | Assignments | About ── */}
          <div className="mt-6" style={{ animation: 'fadeUp 0.6s ease both', animationDelay: '0.22s' }}>
            {/* Tab strip — horizontally scrollable on mobile */}
            <div style={{ display: 'flex', overflowX: 'auto', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch', borderBottom: '1px solid rgba(255,255,255,0.07)', gap: 0 }}>
              {tabs.map(t => (
                <button
                  key={t.key}
                  onClick={() => setActiveTab(t.key)}
                  style={{
                    background: 'none', border: 'none',
                    borderBottom: activeTab === t.key ? '2px solid #e8c97e' : '2px solid transparent',
                    color: activeTab === t.key ? '#e8e4dc' : '#6b6b78',
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

            {/* Tab content */}
            <div className="pt-5">
              {activeTab === 'notes' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {/* Note input */}
                  <div style={{ background: '#13141a', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, padding: '14px 16px' }}>
                    <textarea
                      value={noteDraft}
                      onChange={e => setNoteDraft(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleNoteSave(); }}
                      placeholder="Write a note… (Ctrl+Enter to save)"
                      rows={3}
                      style={{
                        width: '100%', background: 'transparent', border: 'none',
                        color: '#e8e4dc', fontSize: 14, fontFamily: 'inherit',
                        lineHeight: 1.6, resize: 'none', outline: 'none', boxSizing: 'border-box',
                      }}
                      className="placeholder-[#6b6b78]"
                    />
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                      <button
                        onClick={() => setNotePinTime(v => !v)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 5, fontSize: 11,
                          color: notePinTime ? '#e8c97e' : '#6b6b78',
                          background: notePinTime ? 'rgba(232,201,126,0.1)' : 'transparent',
                          border: notePinTime ? '1px solid rgba(232,201,126,0.25)' : '1px solid transparent',
                          borderRadius: 4, padding: '4px 8px', cursor: 'pointer',
                          fontFamily: 'inherit', transition: 'all 0.15s',
                        }}
                      >
                        <Clock size={11} />
                        {notePinTime ? fmtTime(currentTime) : 'Pin timestamp'}
                      </button>
                      <button
                        onClick={handleNoteSave}
                        disabled={!noteDraft.trim() || createNote.isPending}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600,
                          color: '#0b0c0f',
                          background: !noteDraft.trim() ? 'rgba(232,201,126,0.3)' : '#e8c97e',
                          border: 'none', borderRadius: 4, padding: '6px 14px',
                          cursor: !noteDraft.trim() ? 'not-allowed' : 'pointer',
                          fontFamily: 'inherit', transition: 'all 0.15s',
                        }}
                      >
                        <Plus size={12} /> Save
                      </button>
                    </div>
                  </div>

                  {/* Notes list */}
                  {notes.length === 0 ? (
                    <p style={{ color: '#6b6b78', fontSize: 13, fontStyle: 'italic', padding: '4px 0' }}>
                      No notes yet. Write something above to capture insights while you learn.
                    </p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {notes.map(note => (
                        <div key={note.id} style={{ background: '#13141a', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, padding: '12px 14px' }}>
                          {noteEditId === note.id ? (
                            <div>
                              <textarea
                                value={noteEditContent}
                                onChange={e => setNoteEditContent(e.target.value)}
                                autoFocus rows={3}
                                style={{
                                  width: '100%', background: '#0b0c0f',
                                  border: '1px solid rgba(232,201,126,0.3)', borderRadius: 4,
                                  color: '#e8e4dc', fontSize: 13, fontFamily: 'inherit',
                                  lineHeight: 1.6, resize: 'none', outline: 'none',
                                  padding: '8px 10px', boxSizing: 'border-box',
                                }}
                              />
                              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                                <button
                                  onClick={() => updateNote.mutate({ id: note.id, content: noteEditContent.trim() })}
                                  disabled={!noteEditContent.trim()}
                                  style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, background: '#e8c97e', color: '#0b0c0f', border: 'none', borderRadius: 4, padding: '5px 10px', cursor: 'pointer', fontFamily: 'inherit' }}
                                >
                                  <Check size={11} /> Save
                                </button>
                                <button
                                  onClick={() => setNoteEditId(null)}
                                  style={{ fontSize: 11, color: '#6b6b78', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4, padding: '5px 10px', cursor: 'pointer', fontFamily: 'inherit' }}
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div>
                              {note.timestamp_seconds != null && (
                                <button
                                  onClick={() => seekTo(note.timestamp_seconds!)}
                                  style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#e8c97e', fontFamily: 'monospace', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: 4 }}
                                >
                                  <Clock size={10} /> {fmtTime(note.timestamp_seconds)}
                                </button>
                              )}
                              <p style={{ fontSize: 13, color: '#e8e4dc', lineHeight: 1.65, whiteSpace: 'pre-wrap', margin: 0 }}>
                                {note.content}
                              </p>
                              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6, marginTop: 8 }}>
                                <button
                                  onClick={() => { setNoteEditId(note.id); setNoteEditContent(note.content); }}
                                  style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#6b6b78', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px', fontFamily: 'inherit' }}
                                >
                                  <Pencil size={11} /> Edit
                                </button>
                                <button
                                  onClick={() => deleteNote.mutate(note.id)}
                                  style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#6b6b78', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px', fontFamily: 'inherit' }}
                                >
                                  <Trash2 size={11} /> Delete
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'playlist' && (
                <div style={{ border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, overflow: 'hidden' }}>
                  {moduleVideos.map((v, idx) => {
                    const isCurrent = v.id === videoId;
                    return (
                      <button
                        key={v.id}
                        onClick={() => !isCurrent && navigate(`/video/${v.id}`)}
                        style={{
                          width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                          padding: '12px 16px',
                          background: isCurrent ? 'rgba(232,201,126,0.08)' : '#13141a',
                          borderTop: 'none', borderRight: 'none',
                          borderBottom: idx < moduleVideos.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                          borderLeft: `3px solid ${isCurrent ? '#e8c97e' : 'transparent'}`,
                          cursor: isCurrent ? 'default' : 'pointer',
                          textAlign: 'left', fontFamily: 'inherit', transition: 'background 0.15s',
                        }}
                      >
                        <span style={{ fontFamily: 'monospace', fontSize: 10, color: isCurrent ? '#e8c97e' : '#6b6b78', width: 20, flexShrink: 0, letterSpacing: '0.08em' }}>
                          {String(idx + 1).padStart(2, '0')}
                        </span>
                        <div style={{ width: 26, height: 26, borderRadius: 4, background: isCurrent ? 'rgba(232,201,126,0.15)' : 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Play size={10} fill={isCurrent ? '#e8c97e' : '#6b6b78'} style={{ color: isCurrent ? '#e8c97e' : '#6b6b78', marginLeft: 1 }} />
                        </div>
                        <span style={{ flex: 1, fontSize: 13, fontWeight: isCurrent ? 600 : 400, color: isCurrent ? '#e8e4dc' : '#9ca3af', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {v.title}
                        </span>
                        {v.duration_seconds > 0 && (
                          <span style={{ fontFamily: 'monospace', fontSize: 10, color: '#6b6b78', flexShrink: 0 }}>
                            {fmtDur(v.duration_seconds)}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {activeTab === 'assignments' && (
                moduleAssignments.length === 0 ? (
                  <p style={{ color: '#6b6b78', fontSize: 13, fontStyle: 'italic' }}>No assignments for this module yet.</p>
                ) : (
                  <div className="space-y-3">
                    {moduleAssignments.map(a => (
                      <AssignmentCard key={a.id} a={a} />
                    ))}
                  </div>
                )
              )}

              {activeTab === 'about' && video.description && (
                <p style={{ fontSize: 14, color: '#9ca3af', lineHeight: 1.75 }}>{video.description}</p>
              )}
            </div>
          </div>

          {/* Prev / Next navigation */}
          {moduleVideos.length > 1 && (
            <div className="flex items-center gap-3 mt-10 pt-6" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
              <button
                onClick={() => prevVideo && navigate(`/video/${prevVideo.id}`)}
                disabled={!prevVideo}
                className="flex items-center gap-2 text-sm font-medium rounded-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed min-w-0 max-w-[40%]"
                style={{
                  padding: '10px 14px',
                  background: '#13141a',
                  border: '1px solid rgba(255,255,255,0.07)',
                  color: '#9ca3af',
                }}
                onMouseEnter={e => { if (prevVideo) (e.currentTarget as HTMLElement).style.borderColor = 'rgba(232,201,126,0.3)'; }}
                onMouseLeave={e => ((e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.07)')}
              >
                <ChevronLeft size={16} className="flex-shrink-0" />
                <span className="truncate hidden sm:inline">{prevVideo?.title ?? 'Previous'}</span>
                <span className="sm:hidden">Prev</span>
              </button>

              <span className="text-xs mx-auto whitespace-nowrap" style={{ color: '#6b6b78', fontFamily: 'monospace', letterSpacing: '0.06em' }}>
                {currentIndex + 1} / {moduleVideos.length}
              </span>

              <button
                onClick={() => nextVideo && navigate(`/video/${nextVideo.id}`)}
                disabled={!nextVideo}
                className="flex items-center gap-2 text-sm font-medium rounded-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed min-w-0 max-w-[40%]"
                style={{
                  padding: '10px 14px',
                  background: '#13141a',
                  border: '1px solid rgba(255,255,255,0.07)',
                  color: '#9ca3af',
                }}
                onMouseEnter={e => { if (nextVideo) (e.currentTarget as HTMLElement).style.borderColor = 'rgba(232,201,126,0.3)'; }}
                onMouseLeave={e => ((e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.07)')}
              >
                <span className="truncate hidden sm:inline">{nextVideo?.title ?? 'Next'}</span>
                <span className="sm:hidden">Next</span>
                <ChevronRight size={16} className="flex-shrink-0" />
              </button>
            </div>
          )}

        </div>
      </div>

      {/* ── Q&A Sidebar — always visible on lg+, bottom sheet on mobile ── */}
      {videoId && (
        <>
          {/* Mobile backdrop */}
          {sidebarOpen && (
            <div
              className="fixed inset-0 lg:hidden"
              style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(3px)', zIndex: 45 }}
              onClick={() => setSidebarOpen(false)}
            />
          )}
          {/* Sidebar — desktop: right panel | mobile: bottom sheet */}
          <div
            className={`lg:relative lg:inset-auto lg:z-auto lg:w-auto lg:max-w-none lg:flex ${sidebarOpen ? '' : 'hidden lg:flex'}`}
            style={{
              position: undefined,
            }}
          >
            {/* Mobile: fixed bottom sheet */}
            <div
              className="lg:hidden"
              style={{
                position: 'fixed',
                left: 0, right: 0,
                bottom: 0,
                height: '80vh',
                zIndex: 46,
                borderRadius: '20px 20px 0 0',
                overflow: 'hidden',
                transform: sidebarOpen ? 'translateY(0)' : 'translateY(100%)',
                transition: 'transform 0.3s cubic-bezier(0.16,1,0.3,1)',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {/* Drag handle */}
              <div style={{ background: '#13141a', padding: '10px 0 4px', display: 'flex', justifyContent: 'center', flexShrink: 0, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ width: 36, height: 4, background: 'rgba(255,255,255,0.15)', borderRadius: 2 }} />
              </div>
              <QASidebar videoId={videoId} activeQuestionId={activeQuestionId} onClose={() => setSidebarOpen(false)} />
            </div>
            {/* Desktop: inline panel */}
            <div className="hidden lg:flex" style={{ height: '100%' }}>
              <QASidebar videoId={videoId} activeQuestionId={activeQuestionId} onClose={() => setSidebarOpen(false)} />
            </div>
          </div>
        </>
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

      {/* Ask AI FAB — gold gradient */}
      {videoId && !aiAskOpen && !whiteboardQuestionId && (
        <button
          onClick={() => openAIAsk(videoId, currentTime, video.has_transcript)}
          className="fixed right-4 lg:bottom-7 lg:right-7 z-40 flex items-center gap-2 font-bold transition-all hover:scale-105 active:scale-95"
          style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 80px)' } as React.CSSProperties}
          style={{
            background: 'linear-gradient(135deg, #e8c97e, #c45c3c)',
            color: '#0b0c0f',
            fontSize: 13,
            padding: '12px 22px',
            borderRadius: 100,
            border: 'none',
            cursor: 'pointer',
            letterSpacing: '0.02em',
            fontFamily: 'inherit',
            boxShadow: '0 8px 32px rgba(196,92,60,0.35)',
          }}
          title="Ask the AI tutor anything about this lesson"
        >
          <Sparkles size={15} />
          Ask AI
        </button>
      )}

      {/* Fade-up keyframes */}
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
        background: '#13141a',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 8,
        padding: '14px 18px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 14,
        transition: 'border-color 0.2s',
      }}
      onMouseEnter={e => ((e.currentTarget as HTMLElement).style.borderColor = 'rgba(232,201,126,0.25)')}
      onMouseLeave={e => ((e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.07)')}
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
        <p style={{ fontSize: 14, fontWeight: 600, color: '#e8e4dc', marginBottom: 2 }}>{a.title}</p>
        {a.deadline && (
          <p style={{ fontSize: 11, color: '#6b6b78', display: 'flex', alignItems: 'center', gap: 4 }}>
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
          background: '#e8c97e', color: '#0b0c0f',
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
