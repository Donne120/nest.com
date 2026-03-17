import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, List, Sparkles } from 'lucide-react';
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

export default function VideoPage() {
  const { videoId } = useParams<{ videoId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showQuestionForm, activeQuestionId, sidebarOpen, setSidebarOpen, whiteboardQuestionId, whiteboardQuestionText, aiAskOpen, openAIAsk } = useUIStore();
  const { seekTo, currentTime, duration: playerDuration } = usePlayerStore();
  // Access live player state without causing re-renders (avoids re-render on every tick)
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

  // Quiz data
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

  // As soon as the player reports a real duration, save it to the DB if the
  // video record still has duration_seconds = 0 (common for YouTube videos).
  const durationSavedRef = useRef(false);
  useEffect(() => {
    if (
      playerDuration > 0 &&
      videoId &&
      video &&
      video.duration_seconds === 0 &&
      !durationSavedRef.current
    ) {
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

  // Fire an initial "in_progress" save as soon as the video starts playing
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
    // Mark as complete and invalidate cache
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
    // Show quiz if questions exist
    if (quizQuestions.length > 0) {
      setShowQuiz(true);
    }
  }, [videoId, video?.duration_seconds, quizQuestions.length, invalidateProgress]);

  const currentIndex = moduleVideos.findIndex(v => v.id === videoId);
  const prevVideo = moduleVideos[currentIndex - 1];
  const nextVideo = moduleVideos[currentIndex + 1];

  if (videoLoading) {
    return (
      <div className="flex h-[calc(100vh-56px)]">
        <div className="flex-1 p-3 sm:p-6">
          <Skeleton className="aspect-video w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-56px)]">
        <p className="text-gray-500">Video not found.</p>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-56px)] overflow-hidden">
      {/* Main content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-3 sm:p-6">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm mb-4 overflow-hidden">
            <Link to="/modules" className="text-gray-500 hover:text-brand-600 transition-colors">Modules</Link>
            <span className="text-gray-300">/</span>
            {module && (
              <>
                <Link to={`/modules/${module.id}`} className="text-gray-500 hover:text-brand-600 transition-colors">
                  {module.title}
                </Link>
                <span className="text-gray-300">/</span>
              </>
            )}
            <span className="text-gray-900 font-medium">{video.title}</span>
          </nav>

          {/* Video player */}
          <div className="max-w-4xl mx-auto">
            <VideoPlayer
              videoUrl={video.video_url}
              markers={markers}
              videoId={video.id}
              onTimeUpdate={handleTimeUpdate}
              onVideoEnd={handleVideoEnd}
            />
          </div>

          {/* Video info */}
          <div className="mt-4 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-semibold text-gray-900">{video.title}</h1>
              {video.description && (
                <p className="text-gray-500 text-sm mt-1">{video.description}</p>
              )}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <FloatingNotes videoId={video.id} onSeek={seekTo} inline />
              {quizQuestions.length > 0 && (
                <button
                  onClick={() => setShowQuiz(true)}
                  className="flex items-center gap-1.5 text-sm font-medium text-brand-600 border border-brand-200 px-3 py-2 rounded-lg hover:bg-brand-50 transition-all"
                >
                  {existingSubmission ? `Quiz · ${Math.round(existingSubmission.score ?? 0)}%` : `Quiz · ${quizQuestions.length}Q`}
                </button>
              )}
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-brand-600 border border-gray-200 px-3 py-2 rounded-lg hover:border-brand-300 transition-all"
              >
                <List size={15} />
                {sidebarOpen ? 'Hide' : 'Show'} Q&A
              </button>
            </div>
          </div>

          {/* Video navigation */}
          {moduleVideos.length > 1 && (
            <div className="flex items-center gap-3 mt-6 pt-5 border-t border-gray-100">
              <button
                onClick={() => prevVideo && navigate(`/video/${prevVideo.id}`)}
                disabled={!prevVideo}
                className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-gray-700 border border-gray-200 rounded-xl hover:border-brand-300 hover:text-brand-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all min-w-0 max-w-[40%]"
              >
                <ChevronLeft size={16} className="flex-shrink-0" />
                <span className="truncate hidden sm:inline">{prevVideo?.title ?? 'Previous'}</span>
                <span className="sm:hidden">Prev</span>
              </button>
              <span className="text-xs text-gray-400 mx-auto whitespace-nowrap">
                {currentIndex + 1} / {moduleVideos.length}
              </span>
              <button
                onClick={() => nextVideo && navigate(`/video/${nextVideo.id}`)}
                disabled={!nextVideo}
                className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-gray-700 border border-gray-200 rounded-xl hover:border-brand-300 hover:text-brand-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all min-w-0 max-w-[40%]"
              >
                <span className="truncate hidden sm:inline">{nextVideo?.title ?? 'Next'}</span>
                <span className="sm:hidden">Next</span>
                <ChevronRight size={16} className="flex-shrink-0" />
              </button>
            </div>
          )}

        </div>
      </div>

      {/* Q&A Sidebar — overlay drawer on mobile, inline on desktop */}
      {sidebarOpen && videoId && (
        <>
          {/* Mobile backdrop */}
          <div
            className="fixed inset-0 bg-black/40 z-30 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
          {/* Sidebar container: fixed on mobile, inline on desktop */}
          <div className="fixed inset-y-14 right-0 z-40 w-full max-w-sm md:relative md:inset-auto md:z-auto md:w-auto md:max-w-none">
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

      {/* End-of-video quiz modal */}
      {showQuiz && videoId && quizQuestions.length > 0 && (
        <QuizModal
          videoId={videoId}
          questions={quizQuestions}
          onClose={() => setShowQuiz(false)}
          existingResult={existingSubmission}
        />
      )}

      {/* AI Whiteboard modal (linked to Q&A questions) */}
      {whiteboardQuestionId && videoId && (
        <WhiteboardModal
          questionId={whiteboardQuestionId}
          questionText={whiteboardQuestionText}
          videoId={videoId}
        />
      )}

      {/* Direct AI Ask modal (standalone, private, no DB) */}
      {aiAskOpen && videoId && <AskAIModal />}

      {/* Floating Ask AI button */}
      {videoId && !aiAskOpen && !whiteboardQuestionId && (
        <button
          onClick={() => openAIAsk(videoId, currentTime)}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-2xl shadow-lg shadow-indigo-900/30 transition-all hover:scale-105 active:scale-95"
          title="Ask the AI tutor anything about this lesson"
        >
          <Sparkles size={16} />
          Ask AI
        </button>
      )}
    </div>
  );
}
