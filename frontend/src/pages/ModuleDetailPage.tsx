import type { ReactNode } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Play, Clock, MessageSquare, ArrowLeft, ExternalLink,
  FileText, Film, Globe, File, Video as VideoIcon,
  CheckCircle2, Trophy, BookOpen, ChevronRight, Zap
} from 'lucide-react';
import api from '../api/client';
import type { Module, Video, ModuleResource } from '../types';
import { Skeleton } from '../components/UI/Skeleton';
import BookMeetingModal from '../components/Meetings/BookMeetingModal';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(s: number) {
  const m = Math.floor(s / 60);
  return m < 60 ? `${m}m` : `${Math.floor(m / 60)}h ${m % 60}m`;
}

function ProgressRing({ pct }: { pct: number }) {
  const R = 38, C = 2 * Math.PI * R;
  return (
    <svg width="96" height="96" className="-rotate-90">
      <circle cx="48" cy="48" r={R} fill="none" stroke="#e2e8f0" strokeWidth="7" />
      <circle
        cx="48" cy="48" r={R} fill="none"
        stroke="url(#ringGrad)" strokeWidth="7"
        strokeLinecap="round"
        strokeDasharray={C}
        strokeDashoffset={C - (pct / 100) * C}
        style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(.4,0,.2,1)' }}
      />
      <defs>
        <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#818cf8" />
          <stop offset="100%" stopColor="#6366f1" />
        </linearGradient>
      </defs>
    </svg>
  );
}

const RESOURCE_ICON: Record<ModuleResource['type'], typeof Globe> = {
  link: Globe, doc: FileText, pdf: File, video: Film,
};
const RESOURCE_COLOR: Record<ModuleResource['type'], string> = {
  link:  'bg-blue-50 text-blue-600 border-blue-100',
  doc:   'bg-violet-50 text-violet-600 border-violet-100',
  pdf:   'bg-red-50   text-red-600   border-red-100',
  video: 'bg-amber-50 text-amber-600 border-amber-100',
};

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-72 bg-slate-800" />
      <div className="max-w-5xl mx-auto px-6 py-8 flex gap-8">
        <div className="flex-1 space-y-5">
          <Skeleton className="h-6 w-48" />
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 rounded-xl" />)}
          </div>
          <Skeleton className="h-40 rounded-xl" />
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
          </div>
        </div>
        <div className="w-72 flex-shrink-0">
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ModuleDetailPage() {
  const { moduleId } = useParams<{ moduleId: string }>();
  const navigate = useNavigate();
  const [showMeetingModal, setShowMeetingModal] = useState(false);

  const { data: module, isLoading: modLoading } = useQuery<Module>({
    queryKey: ['module', moduleId],
    queryFn: () => api.get(`/modules/${moduleId}`).then(r => r.data),
    enabled: !!moduleId,
  });

  const { data: videos = [], isLoading: vidLoading } = useQuery<Video[]>({
    queryKey: ['module-videos', moduleId],
    queryFn: () => api.get(`/videos/module/${moduleId}`).then(r => r.data),
    enabled: !!moduleId,
  });

  // Extract bullet points from HTML description for "What You'll Learn"
  const learnItems = useMemo(() => {
    if (!module?.description) return [];
    const parser = new DOMParser();
    const doc = parser.parseFromString(module.description, 'text/html');
    return Array.from(doc.querySelectorAll('ul li')).map(li => li.textContent ?? '').filter(Boolean);
  }, [module?.description]);

  if (modLoading || vidLoading) return <LoadingSkeleton />;
  if (!module) return <div className="p-8 text-gray-500">Module not found.</div>;

  const pct = module.duration_seconds > 0
    ? Math.min(100, Math.round(((module.progress_seconds ?? 0) / module.duration_seconds) * 100))
    : 0;

  const status = module.status ?? 'not_started';
  const ctaLabel  = pct === 0 ? 'Start Course' : pct === 100 ? 'Review Course' : 'Continue Learning';
  const firstVideo = videos[0]?.id;
  const hasResources = module.resources && module.resources.length > 0;

  const totalQuizzes = 31; // enriched from seed; fallback for display

  return (
    <div className="min-h-screen bg-slate-50">

      {/* ═══════════════════════════════════════════════════════════════
          HERO
      ═══════════════════════════════════════════════════════════════ */}
      <div className="relative w-full overflow-hidden bg-slate-950" style={{ minHeight: 340 }}>

        {/* Thumbnail background */}
        {module.thumbnail_url && (
          <img
            src={module.thumbnail_url}
            alt=""
            aria-hidden
            className="absolute inset-0 w-full h-full object-cover object-center opacity-40 scale-105"
            style={{ filter: 'blur(1px)' }}
          />
        )}

        {/* Gradient overlays — strong left, transparent right */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/90 to-slate-950/30" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />

        {/* Decorative orbs */}
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-indigo-600/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 rounded-full bg-purple-500/10 blur-3xl pointer-events-none" />

        {/* Content */}
        <div className="relative max-w-5xl mx-auto px-6 pt-8 pb-12">

          {/* Back */}
          <button
            onClick={() => navigate('/modules')}
            className="inline-flex items-center gap-1.5 text-sm text-white/50 hover:text-white transition-colors mb-6"
          >
            <ArrowLeft size={14} />
            Back to Modules
          </button>

          {/* Status pill */}
          <div className="mb-3">
            {status === 'not_started' && (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-white/40 border border-white/10 rounded-full px-3 py-1">
                <span className="w-1.5 h-1.5 rounded-full bg-white/30" />
                Not Started
              </span>
            )}
            {status === 'in_progress' && (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-amber-300 border border-amber-400/30 rounded-full px-3 py-1 bg-amber-400/10">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                In Progress
              </span>
            )}
            {status === 'completed' && (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-emerald-300 border border-emerald-400/30 rounded-full px-3 py-1 bg-emerald-400/10">
                <CheckCircle2 size={11} />
                Completed
              </span>
            )}
          </div>

          {/* Title */}
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight max-w-2xl tracking-tight">
            {module.title}
          </h1>

          {/* Stats row */}
          <div className="flex items-center flex-wrap gap-x-5 gap-y-2 mt-5 text-sm text-white/55">
            <span className="flex items-center gap-1.5">
              <Clock size={13} className="text-indigo-400" />
              {fmt(module.duration_seconds)}
            </span>
            <span className="flex items-center gap-1.5">
              <Play size={13} className="text-indigo-400" />
              {module.video_count} lessons
            </span>
            {module.question_count > 0 && (
              <span className="flex items-center gap-1.5">
                <MessageSquare size={13} className="text-indigo-400" />
                {module.question_count} Q&A
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <Zap size={13} className="text-indigo-400" />
              {totalQuizzes} quiz questions
            </span>
            <span className="flex items-center gap-1.5">
              <Trophy size={13} className="text-amber-400" />
              Certificate included
            </span>
          </div>

          {/* CTAs */}
          <div className="flex items-center flex-wrap gap-3 mt-7">
            <button
              onClick={() => firstVideo && navigate(`/video/${firstVideo}`)}
              disabled={!firstVideo}
              className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-500 hover:bg-indigo-400 text-white font-semibold rounded-xl text-sm shadow-lg shadow-indigo-900/40 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
            >
              <Play size={15} fill="currentColor" />
              {ctaLabel}
            </button>
            <button
              onClick={() => setShowMeetingModal(true)}
              className="inline-flex items-center gap-2 px-5 py-3 bg-white/8 hover:bg-white/14 border border-white/15 text-white/80 hover:text-white font-medium rounded-xl text-sm backdrop-blur transition-all"
            >
              <VideoIcon size={14} />
              Book a 1-on-1
            </button>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          BODY — two columns
      ═══════════════════════════════════════════════════════════════ */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex flex-col lg:flex-row gap-8 items-start">

          {/* ─── LEFT: main content ───────────────────────────────────── */}
          <div className="flex-1 min-w-0 space-y-6">

            {/* What You'll Learn */}
            {learnItems.length > 0 && (
              <section className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-sm">
                <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <BookOpen size={16} className="text-indigo-500" />
                  What You'll Learn
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {learnItems.map((item, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <CheckCircle2 size={15} className="text-indigo-500 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-gray-700 leading-snug">{item}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* About */}
            {module.description && (
              <section className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-sm">
                <h2 className="text-base font-bold text-gray-900 mb-4">About This Course</h2>
                <div
                  className="prose prose-sm prose-gray max-w-none
                    prose-h2:text-base prose-h2:font-bold prose-h2:text-gray-800 prose-h2:mt-5 prose-h2:mb-2
                    prose-h3:text-sm prose-h3:font-semibold prose-h3:text-gray-700
                    prose-p:text-gray-600 prose-p:leading-relaxed
                    prose-ul:space-y-1 prose-li:text-gray-600 prose-li:text-sm"
                  dangerouslySetInnerHTML={{ __html: module.description }}
                />
              </section>
            )}

            {/* Curriculum */}
            <section className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-base font-bold text-gray-900">
                  Course Curriculum
                </h2>
                <span className="text-xs text-gray-400 font-medium">
                  {videos.length} lessons · {fmt(module.duration_seconds)} total
                </span>
              </div>

              <div className="divide-y divide-gray-50">
                {videos.map((video, idx) => (
                  <LessonRow
                    key={video.id}
                    video={video}
                    index={idx}
                    onClick={() => navigate(`/video/${video.id}`)}
                  />
                ))}
              </div>
            </section>
          </div>

          {/* ─── RIGHT: sticky sidebar ────────────────────────────────── */}
          <div className="w-full lg:w-72 flex-shrink-0 lg:sticky lg:top-6 space-y-4">

            {/* Progress card */}
            <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">

              {/* Progress ring area */}
              <div className="bg-gradient-to-br from-slate-900 to-indigo-950 px-6 pt-7 pb-6 flex flex-col items-center text-center">
                <div className="relative">
                  <ProgressRing pct={pct} />
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-xl font-extrabold text-white leading-none">{pct}%</span>
                    <span className="text-[10px] text-white/40 mt-0.5 font-medium uppercase tracking-wide">done</span>
                  </div>
                </div>
                <p className="text-white/60 text-xs mt-3 font-medium">
                  {pct === 0 ? 'Ready to start' : pct === 100 ? 'Course completed!' : `${fmt(module.progress_seconds ?? 0)} watched`}
                </p>
              </div>

              {/* CTA */}
              <div className="px-5 py-4">
                <button
                  onClick={() => firstVideo && navigate(`/video/${firstVideo}`)}
                  disabled={!firstVideo}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-sm shadow shadow-indigo-200 transition-all hover:shadow-md disabled:opacity-50"
                >
                  <Play size={14} fill="currentColor" />
                  {ctaLabel}
                </button>
              </div>

              {/* Stats */}
              <div className="px-5 pb-4 space-y-2.5">
                <StatRow icon={<Clock size={14} className="text-indigo-400" />} label={fmt(module.duration_seconds)} sub="total watch time" />
                <StatRow icon={<Play size={14} className="text-indigo-400" />} label={`${module.video_count} lessons`} sub="video content" />
                <StatRow icon={<Zap size={14} className="text-amber-400" />} label={`${totalQuizzes} quiz questions`} sub="test your knowledge" />
                {module.question_count > 0 && (
                  <StatRow icon={<MessageSquare size={14} className="text-emerald-500" />} label={`${module.question_count} Q&A threads`} sub="community discussion" />
                )}
                <StatRow icon={<Trophy size={14} className="text-amber-400" />} label="Certificate" sub="on completion" />
              </div>

              {/* Divider */}
              <div className="mx-5 border-t border-gray-100 mb-4" />

              {/* Book 1-on-1 */}
              <div className="px-5 pb-5">
                <button
                  onClick={() => setShowMeetingModal(true)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 border border-indigo-200 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 font-medium rounded-xl text-sm transition-colors"
                >
                  <VideoIcon size={13} />
                  Book a 1-on-1 with trainer
                </button>
              </div>
            </div>

            {/* Resources */}
            {hasResources && (
              <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm p-5">
                <h3 className="text-sm font-bold text-gray-900 mb-3">Resources</h3>
                <div className="space-y-2">
                  {module.resources!.map((r) => {
                    const Icon = RESOURCE_ICON[r.type] ?? Globe;
                    const colorCls = RESOURCE_COLOR[r.type] ?? RESOURCE_COLOR.link;
                    return (
                      <a
                        key={r.id}
                        href={r.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-all group"
                      >
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 border ${colorCls}`}>
                          <Icon size={12} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-gray-700 truncate group-hover:text-indigo-700 transition-colors">
                            {r.title || r.url}
                          </p>
                          <p className="text-[10px] text-gray-400 capitalize">{r.type}</p>
                        </div>
                        <ExternalLink size={11} className="text-gray-300 group-hover:text-indigo-400 transition-colors flex-shrink-0" />
                      </a>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showMeetingModal && (
        <BookMeetingModal
          moduleId={moduleId}
          moduleTitle={module.title}
          onClose={() => setShowMeetingModal(false)}
        />
      )}
    </div>
  );
}

// ─── Subcomponents ────────────────────────────────────────────────────────────

function LessonRow({ video, index, onClick }: { video: Video; index: number; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-4 px-6 py-4 text-left hover:bg-indigo-50/50 group transition-colors relative"
    >
      {/* Active left accent */}
      <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-indigo-500 scale-y-0 group-hover:scale-y-100 transition-transform origin-center rounded-r" />

      {/* Lesson number */}
      <div className="flex-shrink-0 w-9 text-center">
        <span className="text-sm font-bold text-gray-300 group-hover:text-indigo-400 transition-colors tabular-nums">
          {String(index + 1).padStart(2, '0')}
        </span>
      </div>

      {/* Play circle */}
      <div className="flex-shrink-0 w-9 h-9 rounded-full bg-gray-100 group-hover:bg-indigo-100 flex items-center justify-center transition-colors">
        <Play size={13} className="text-gray-400 group-hover:text-indigo-600 transition-colors ml-0.5" fill="currentColor" />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-800 group-hover:text-indigo-800 truncate transition-colors leading-snug">
          {video.title}
        </p>
        {video.description && (
          <p className="text-xs text-gray-400 line-clamp-1 mt-0.5 leading-snug">
            {video.description}
          </p>
        )}
      </div>

      {/* Meta */}
      <div className="flex items-center gap-2 flex-shrink-0 ml-2">
        {video.question_count > 0 && (
          <span className="flex items-center gap-1 text-[11px] text-indigo-500 font-medium bg-indigo-50 border border-indigo-100 rounded-full px-2 py-0.5">
            <MessageSquare size={10} />
            {video.question_count}
          </span>
        )}
        <span className="text-xs text-gray-400 font-medium tabular-nums w-10 text-right">
          {fmt(video.duration_seconds)}
        </span>
        <ChevronRight size={13} className="text-gray-300 group-hover:text-indigo-400 transition-colors" />
      </div>
    </button>
  );
}

function StatRow({ icon, label, sub }: { icon: ReactNode; label: string; sub: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-6 flex-shrink-0 flex justify-center">{icon}</div>
      <div className="flex-1 min-w-0">
        <span className="text-sm font-semibold text-gray-800">{label}</span>
        <span className="text-xs text-gray-400 ml-1.5">{sub}</span>
      </div>
    </div>
  );
}
