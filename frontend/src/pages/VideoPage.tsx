import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import api from '../api/client';
import type { Video, Module, TimelineMarker, QuizQuestion, QuizSubmissionResult } from '../types';
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

export default function VideoPage() {
  const { videoId } = useParams<{ videoId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showQuestionForm, activeQuestionId, sidebarOpen, setSidebarOpen, whiteboardQuestionId, whiteboardQuestionText, aiAskOpen, openAIAsk } = useUIStore();
  const { seekTo, currentTime, duration: playerDuration } = usePlayerStore();
  const getPlayerDuration = () => usePlayerStore.getState().duration;
  const [showQuiz, setShowQuiz] = useState(false);

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
    refetchInterval: 10000,
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

  const currentIndex = moduleVideos.findIndex(v => v.id === videoId);
  const prevVideo = moduleVideos[currentIndex - 1];
  const nextVideo = moduleVideos[currentIndex + 1];
  const progressPct = playerDuration > 0 ? Math.round((currentTime / playerDuration) * 100) : 0;
  const displayDuration = playerDuration > 0 ? playerDuration : (video?.duration_seconds ?? 0);

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

  return (
    <div className="flex h-[calc(100vh-56px)] overflow-hidden" style={{ background: '#0b0c0f' }}>

      {/* ── Main content ── */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-5 py-6 lg:px-8 lg:py-8 max-w-5xl mx-auto w-full">

          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 mb-6 overflow-hidden" style={{ fontSize: 12, letterSpacing: '0.04em' }}>
            <Link to="/modules" style={{ color: '#6b6b78', textDecoration: 'none', transition: 'color 0.2s' }}
              onMouseEnter={e => ((e.target as HTMLElement).style.color = '#e8e4dc')}
              onMouseLeave={e => ((e.target as HTMLElement).style.color = '#6b6b78')}
            >
              Modules
            </Link>
            <span style={{ color: 'rgba(255,255,255,0.2)' }}>/</span>
            {module && (
              <>
                <Link to={`/modules/${module.id}`} style={{ color: '#6b6b78', textDecoration: 'none', transition: 'color 0.2s' }}
                  onMouseEnter={e => ((e.target as HTMLElement).style.color = '#e8e4dc')}
                  onMouseLeave={e => ((e.target as HTMLElement).style.color = '#6b6b78')}
                  className="truncate max-w-[180px] block"
                >
                  {module.title}
                </Link>
                <span style={{ color: 'rgba(255,255,255,0.2)' }}>/</span>
              </>
            )}
            <span style={{ color: '#e8e4dc', fontWeight: 500 }} className="truncate">{video.title}</span>
          </nav>

          {/* Chapter label */}
          <div style={{
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

          {/* Lesson title */}
          <h1 style={{
            fontFamily: "'Lora', Georgia, serif",
            fontSize: 'clamp(22px, 2.5vw, 34px)',
            fontWeight: 700,
            lineHeight: 1.2,
            letterSpacing: '-0.02em',
            color: '#e8e4dc',
            marginBottom: 28,
            maxWidth: 640,
            animation: 'fadeUp 0.55s ease both',
            animationDelay: '0.05s',
          }}>
            {video.title}
            {video.description && (
              <span style={{ display: 'block', fontStyle: 'italic', color: '#e8c97e', marginTop: 4 }}>
                {video.description.length > 80 ? video.description.slice(0, 80) + '…' : ''}
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

          {/* Below video row */}
          <div
            className="mt-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
            style={{ animation: 'fadeUp 0.6s ease both', animationDelay: '0.2s' }}
          >
            {/* Left: meta + notes toggle */}
            <div className="flex items-center gap-4 flex-wrap">
              {/* Duration pill */}
              <span style={{
                fontFamily: 'monospace',
                fontSize: 11,
                color: '#6b6b78',
                background: '#1c1e27',
                border: '1px solid rgba(255,255,255,0.07)',
                padding: '4px 10px',
                borderRadius: 100,
                letterSpacing: '0.06em',
              }}>
                {fmtTime(displayDuration)} total
              </span>

              {/* Progress */}
              <span style={{ fontSize: 12, color: '#6b6b78' }}>
                <span style={{ color: '#e8c97e', fontWeight: 500 }}>{progressPct}%</span> complete
              </span>

              {/* Notes */}
              <FloatingNotes videoId={video.id} onSeek={seekTo} inline />

              {/* Mobile Q&A toggle */}
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden flex items-center gap-1.5 text-sm px-3 py-1.5 rounded transition-colors"
                style={{
                  background: '#1c1e27',
                  border: '1px solid rgba(255,255,255,0.07)',
                  color: '#9ca3af',
                  fontSize: 12,
                }}
              >
                {sidebarOpen ? 'Hide' : 'Show'} Q&amp;A
              </button>
            </div>

            {/* Right: complete button */}
            <button
              onClick={() => {
                if (quizQuestions.length > 0) setShowQuiz(true);
              }}
              className="flex items-center gap-2 flex-shrink-0 font-semibold transition-all hover:opacity-85 active:scale-95"
              style={{
                background: '#e8c97e',
                color: '#0b0c0f',
                fontSize: 13,
                padding: '9px 22px',
                borderRadius: 4,
                border: 'none',
                cursor: 'pointer',
                letterSpacing: '0.02em',
                fontFamily: 'inherit',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6L9 17l-5-5"/>
              </svg>
              Mark complete {quizQuestions.length > 0 ? '& take quiz' : ''}
            </button>
          </div>

          {/* Notes section */}
          <div className="mt-12">
            <div className="flex items-center gap-4 mb-4">
              <h2 style={{ fontFamily: "'Lora', Georgia, serif", fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em', color: '#e8e4dc' }}>
                Notes
              </h2>
              <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.07)' }} />
            </div>
            <div style={{
              background: '#13141a',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 6,
              padding: '18px 22px',
              minHeight: 72,
              color: '#6b6b78',
              fontSize: 14,
              lineHeight: 1.7,
              fontStyle: 'italic',
            }}>
              Click to start writing notes for this lesson…
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

      {/* ── Q&A Sidebar — always visible on lg+, toggled on mobile ── */}
      {videoId && (
        <>
          {/* Mobile backdrop */}
          {sidebarOpen && (
            <div
              className="fixed inset-0 z-30 lg:hidden"
              style={{ background: 'rgba(0,0,0,0.6)' }}
              onClick={() => setSidebarOpen(false)}
            />
          )}
          {/* Sidebar */}
          <div className={`
            fixed inset-y-14 right-0 z-40 w-full max-w-sm
            lg:relative lg:inset-auto lg:z-auto lg:w-auto lg:max-w-none lg:flex
            ${sidebarOpen ? 'flex' : 'hidden'}
          `}>
            <QASidebar
              videoId={videoId}
              activeQuestionId={activeQuestionId}
              onClose={() => setSidebarOpen(false)}
            />
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
          onClick={() => openAIAsk(videoId, currentTime)}
          className="fixed bottom-7 right-7 z-40 flex items-center gap-2 font-bold transition-all hover:scale-105 active:scale-95"
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
