import type { ReactNode } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Play, ArrowLeft, ExternalLink,
  FileText, Film, Globe, File,
  CheckCircle2, Calendar, BookOpen, Pin,
} from 'lucide-react';
import api from '../api/client';
import type { Module, Video, Lesson, ModuleResource } from '../types';
import { BG, SURF, RULE, INK, INK2, INK3, ACC, ACC2 } from '../lib/colors';
import { Skeleton } from '../components/UI/Skeleton';
import BookMeetingModal from '../components/Meetings/BookMeetingModal';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(s: number) {
  const m = Math.floor(s / 60);
  return m < 60 ? `${m}m` : `${Math.floor(m / 60)}h ${m % 60}m`;
}

// Gold donut ring (dark card)
function DonutRing({ pct }: { pct: number }) {
  const R = 38, C = 2 * Math.PI * R;
  const filled = (pct / 100) * C;
  return (
    <div style={{ position: 'relative', width: 92, height: 92 }}>
      <svg width="92" height="92" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="46" cy="46" r={R} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" />
        <circle
          cx="46" cy="46" r={R} fill="none"
          stroke="#e8c97e" strokeWidth="6" strokeLinecap="round"
          strokeDasharray={`${filled} ${C}`}
          style={{ transition: 'stroke-dasharray 1.2s cubic-bezier(.4,0,.2,1)' }}
        />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontFamily: 'monospace', fontSize: 18, fontWeight: 600, color: '#f0ebe3', letterSpacing: '-0.02em', lineHeight: 1 }}>{pct}%</span>
        <span style={{ fontFamily: 'monospace', fontSize: 8.5, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.14em', textTransform: 'uppercase', marginTop: 3 }}>done</span>
      </div>
    </div>
  );
}

const RESOURCE_ICON: Record<ModuleResource['type'], typeof Globe> = {
  link: Globe, doc: FileText, pdf: File, video: Film,
};

function LoadingSkeleton() {
  return (
    <div style={{ background: '#f2ede8', minHeight: '100vh' }}>
      <div style={{ background: '#0f0d0b', height: 280 }} className="animate-pulse" />
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '32px 40px' }} className="grid gap-7 animate-pulse" >
        <Skeleton className="h-48 rounded-md" />
        <Skeleton className="h-64 rounded-md" />
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

  const { data: lessons = [] } = useQuery<Lesson[]>({
    queryKey: ['module-lessons', moduleId],
    queryFn: () => api.get(`/lessons/module/${moduleId}`).then(r => r.data),
    enabled: !!moduleId,
  });

  const learnItems = useMemo(() => {
    if (!module?.description) return [];
    const parser = new DOMParser();
    const doc = parser.parseFromString(module.description, 'text/html');
    return Array.from(doc.querySelectorAll('ul li')).map(li => li.textContent ?? '').filter(Boolean);
  }, [module?.description]);

  if (modLoading || vidLoading) return <LoadingSkeleton />;
  if (!module) return <div style={{ padding: 32, color: '#6b6460' }}>Module not found.</div>;

  const pct = module.duration_seconds > 0
    ? Math.min(100, Math.round(((module.progress_seconds ?? 0) / module.duration_seconds) * 100))
    : 0;

  const status = module.status ?? 'not_started';
  const ctaLabel = pct === 0 ? 'Start Course' : pct === 100 ? 'Review Course' : 'Continue Learning';
  const firstVideo = videos[0]?.id;
  const firstLesson = lessons[0]?.id;
  const firstItem = firstVideo
    ? { type: 'video' as const, id: firstVideo }
    : firstLesson
    ? { type: 'lesson' as const, id: firstLesson }
    : null;
  const hasResources = module.resources && module.resources.length > 0;

  // Build unified curriculum: videos + lessons sorted by order_index, then by type
  type CurriculumItem =
    | { kind: 'video'; item: Video }
    | { kind: 'lesson'; item: Lesson };
  const curriculum: CurriculumItem[] = [
    ...videos.map((v) => ({ kind: 'video' as const, item: v })),
    ...lessons.map((l) => ({ kind: 'lesson' as const, item: l })),
  ].sort((a, b) => a.item.order_index - b.item.order_index);
  const totalQuizzes = 31;

  // Aliases used in this component
  const SURFACE = SURF;
  const ACCENT  = ACC;
  const BLUE    = ACC2;

  return (
    <div style={{ background: BG, minHeight: '100vh', fontFamily: "'DM Sans', 'Inter', sans-serif" }}>

      {/* ══ HERO (dark) ══════════════════════════════════════════════════ */}
      <section style={{ background: '#0f0d0b', position: 'relative', padding: 'clamp(28px,5vw,56px) 0 clamp(40px,6vw,72px)', overflow: 'hidden' }}>
        {/* Ambient glow */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'radial-gradient(ellipse at 70% 50%, rgba(201,79,44,0.08) 0%, transparent 60%), radial-gradient(ellipse at 20% 80%, rgba(44,95,201,0.06) 0%, transparent 55%)',
        }} />
        {/* Grid lines */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: 'repeating-linear-gradient(90deg,rgba(255,255,255,0.015) 0,rgba(255,255,255,0.015) 1px,transparent 1px,transparent 80px),repeating-linear-gradient(0deg,rgba(255,255,255,0.015) 0,rgba(255,255,255,0.015) 1px,transparent 1px,transparent 80px)',
        }} />

        {module.thumbnail_url && (
          <img src={module.thumbnail_url} alt="" aria-hidden
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.15, filter: 'blur(2px)', transform: 'scale(1.05)' }}
          />
        )}

        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 clamp(16px,5vw,56px)', position: 'relative', zIndex: 1 }}>

          {/* Back */}
          <button
            onClick={() => navigate('/modules')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'rgba(255,255,255,0.35)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'monospace', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 28, padding: 0, transition: 'color 0.2s' }}
            onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.65)')}
            onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.35)')}
          >
            <ArrowLeft size={12} /> Back to Modules
          </button>

          {/* Status chip */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontFamily: 'monospace', fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginBottom: 16 }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: status === 'completed' ? '#34d399' : status === 'in_progress' ? '#e8c97e' : 'rgba(255,255,255,0.25)', display: 'inline-block' }} />
            {status === 'not_started' ? 'Not Started' : status === 'in_progress' ? 'In Progress' : 'Completed'}
          </div>

          {/* Title */}
          <h1 style={{
            fontFamily: "'Lora', Georgia, serif",
            fontSize: 'clamp(34px, 4vw, 58px)',
            fontWeight: 700,
            lineHeight: 1.1,
            letterSpacing: '-0.025em',
            color: '#f0ebe3',
            maxWidth: 780,
            marginBottom: 28,
          }}>
            {module.title}
          </h1>

          {/* Meta row */}
          <div className="module-hero-meta" style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 0, marginBottom: 28 }}>
            {[
              { icon: '▷', val: fmt(module.duration_seconds) },
              { icon: '▷', val: `${module.video_count} lessons` },
              { icon: '⚡', val: `${totalQuizzes} quiz questions` },
              { icon: '◎', val: 'Certificate included' },
            ].map((m, i, arr) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                fontFamily: 'monospace', fontSize: 12, color: 'rgba(255,255,255,0.45)',
                paddingRight: i < arr.length - 1 ? 18 : 0,
                marginRight: i < arr.length - 1 ? 18 : 0,
                borderRight: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.1)' : 'none',
                letterSpacing: '0.04em',
              }}>
                <span style={{ opacity: 0.7 }}>{m.icon}</span>
                {m.val}
              </div>
            ))}
          </div>

          {/* CTAs */}
          <div className="module-cta-row" style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <button
              onClick={() => {
                if (!firstItem) return;
                navigate(firstItem.type === 'video' ? `/video/${firstItem.id}` : `/lesson/${firstItem.id}`);
              }}
              disabled={!firstItem}
              style={{ background: ACCENT, color: '#fff', fontFamily: 'inherit', fontSize: 13.5, fontWeight: 600, padding: '11px 26px', borderRadius: 4, border: 'none', cursor: firstItem ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', gap: 8, letterSpacing: '0.01em', opacity: firstItem ? 1 : 0.5, transition: 'opacity 0.2s, transform 0.15s' }}
              onMouseEnter={e => { if (firstItem) (e.currentTarget as HTMLElement).style.opacity = '0.88'; }}
              onMouseLeave={e => ((e.currentTarget as HTMLElement).style.opacity = firstItem ? '1' : '0.5')}
            >
              <Play size={12} fill="currentColor" /> {ctaLabel}
            </button>
            <button
              onClick={() => setShowMeetingModal(true)}
              style={{ background: 'transparent', color: 'rgba(255,255,255,0.6)', fontFamily: 'inherit', fontSize: 13.5, fontWeight: 500, padding: '10px 22px', borderRadius: 4, border: '1px solid rgba(255,255,255,0.15)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, transition: 'color 0.2s, border-color 0.2s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.9)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.3)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.6)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.15)'; }}
            >
              <Calendar size={13} /> Book a 1-on-1
            </button>
          </div>
        </div>
      </section>

      {/* ══ BODY ═══════════════════════════════════════════════════════ */}
      <div className="module-body-grid" style={{ maxWidth: 1200, margin: '0 auto', padding: 'clamp(24px,4vw,48px) clamp(16px,5vw,56px) 100px', display: 'grid', gridTemplateColumns: '1fr', gap: 24, alignItems: 'start' }}>

        {/* ── LEFT ── */}
        <div style={{ minWidth: 0 }}>

          {/* About */}
          {module.description && (
            <SectionCard title="About This Course" style={{ marginBottom: 18 }}>
              <div
                style={{ fontSize: 15.5, lineHeight: 1.8, color: INK2 }}
                className="about-prose"
                dangerouslySetInnerHTML={{ __html: module.description }}
              />
            </SectionCard>
          )}

          {/* What You'll Learn */}
          {learnItems.length > 0 && (
            <SectionCard title="What You'll Learn" style={{ marginBottom: 18 }}>
              <div className="learn-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {learnItems.map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                    <CheckCircle2 size={14} style={{ color: ACCENT, flexShrink: 0, marginTop: 2 }} />
                    <p style={{ fontSize: 13.5, color: INK2, lineHeight: 1.5 }}>{item}</p>
                  </div>
                ))}
              </div>
            </SectionCard>
          )}

          {/* Curriculum */}
          <SectionCard
            title="Course Curriculum"
            meta={`${curriculum.length} ITEM${curriculum.length !== 1 ? 'S' : ''} · ${fmt(module.duration_seconds)} TOTAL`}
            noPadding
            style={{ marginBottom: 18 }}
          >
            {curriculum.length === 0 ? (
              <div style={{ padding: '24px', color: INK3, fontSize: 13, fontStyle: 'italic' }}>No content yet.</div>
            ) : (
              curriculum.map((entry, idx) => (
                entry.kind === 'video' ? (
                  <CurriculumItem
                    key={entry.item.id}
                    video={entry.item as Video}
                    index={idx}
                    isLast={idx === curriculum.length - 1}
                    onClick={() => navigate(`/video/${entry.item.id}`)}
                    INK={INK} INK3={INK3} RULE={RULE} BG={BG}
                  />
                ) : (
                  <LessonCurriculumItem
                    key={entry.item.id}
                    lesson={entry.item as Lesson}
                    index={idx}
                    isLast={idx === curriculum.length - 1}
                    onClick={() => navigate(`/lesson/${entry.item.id}`)}
                    INK={INK} INK3={INK3} RULE={RULE} BG={BG}
                  />
                )
              ))
            )}
          </SectionCard>

          {/* Quiz Overview */}
          <SectionCard title="Quiz Overview" meta={`${totalQuizzes} QUESTIONS`} style={{ marginBottom: 0 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 1, background: RULE, border: `1px solid ${RULE}`, borderRadius: 4, overflow: 'hidden' }}>
              {[
                { label: 'Questions', val: String(totalQuizzes) },
                { label: 'Your Best', val: pct > 0 ? `${pct}%` : '—' },
                { label: 'Pass Mark', val: '—' },
              ].map(({ label, val }) => (
                <div key={label} style={{ background: BG, padding: '14px 16px', textAlign: 'center' }}>
                  <div style={{ fontFamily: 'monospace', fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase', color: INK3, marginBottom: 6 }}>{label}</div>
                  <div style={{ fontFamily: 'monospace', fontSize: 26, fontWeight: 600, color: val === '—' ? INK3 : INK }}>{val}</div>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>

        {/* ── RIGHT ── */}
        <div className="module-sidebar" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Progress card — dark */}
          <div style={{ background: INK, borderRadius: 6, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)' }}>

            {/* Donut top */}
            <div style={{ padding: '28px 24px 22px', display: 'flex', flexDirection: 'column', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              <DonutRing pct={pct} />
              <p style={{ fontFamily: 'monospace', fontSize: 10.5, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 12 }}>
                {pct === 0 ? 'Ready to start' : pct === 100 ? 'Course completed!' : `${fmt(module.progress_seconds ?? 0)} watched`}
              </p>
            </div>

            {/* CTA + details */}
            <div style={{ padding: '18px 20px' }}>
              <button
                onClick={() => {
                  if (!firstItem) return;
                  navigate(firstItem.type === 'video' ? `/video/${firstItem.id}` : `/lesson/${firstItem.id}`);
                }}
                disabled={!firstItem}
                style={{ width: '100%', background: ACCENT, color: '#fff', fontFamily: 'inherit', fontSize: 13.5, fontWeight: 600, padding: 11, borderRadius: 4, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 16, opacity: firstItem ? 1 : 0.5 }}
              >
                <Play size={12} fill="currentColor" /> {ctaLabel}
              </button>

              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {[
                  { icon: '▷', name: fmt(module.duration_seconds), desc: 'total watch time' },
                  { icon: '▶', name: `${module.video_count} lessons`, desc: 'video content' },
                  { icon: '⚡', name: `${totalQuizzes} quiz questions`, desc: 'test your knowledge' },
                  { icon: '◎', name: 'Certificate', desc: 'on completion' },
                ].map(({ icon, name, desc }, i, arr) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
                    <span style={{ fontSize: 13, width: 18, textAlign: 'center', flexShrink: 0, opacity: 0.65, color: '#e8c97e' }}>{icon}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>{name}</span>
                    <span style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.3)', marginLeft: 'auto' }}>{desc}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Book 1-on-1 card */}
          <div style={{ background: SURFACE, border: `1px solid ${RULE}`, borderRadius: 6, padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
            <div>
              <p style={{ fontSize: 12.5, fontWeight: 600, color: INK, marginBottom: 2 }}>Book a 1-on-1</p>
              <p style={{ fontSize: 11, color: INK3 }}>with a trainer</p>
            </div>
            <button
              onClick={() => setShowMeetingModal(true)}
              style={{ background: 'transparent', border: `1px solid ${RULE}`, color: BLUE, fontFamily: 'inherit', fontSize: 12, fontWeight: 600, padding: '7px 14px', borderRadius: 4, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap', transition: 'background 0.2s, border-color 0.2s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = BG; (e.currentTarget as HTMLElement).style.borderColor = BLUE; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.borderColor = RULE; }}
            >
              <Calendar size={11} /> Book
            </button>
          </div>

          {/* Resources */}
          {hasResources && (
            <div style={{ background: SURFACE, border: `1px solid ${RULE}`, borderRadius: 6, padding: '16px 20px' }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: INK, marginBottom: 12 }}>Resources</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {module.resources!.map((r) => {
                  const Icon = RESOURCE_ICON[r.type] ?? Globe;
                  return (
                    <a key={r.id} href={r.url} target="_blank" rel="noopener noreferrer"
                      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 4, border: `1px solid transparent`, textDecoration: 'none', transition: 'background 0.15s, border-color 0.15s' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = BG; (e.currentTarget as HTMLElement).style.borderColor = RULE; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.borderColor = 'transparent'; }}
                    >
                      <div style={{ width: 28, height: 28, borderRadius: 4, background: BG, border: `1px solid ${RULE}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Icon size={12} style={{ color: INK3 }} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 12, fontWeight: 500, color: INK, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.title || r.url}</p>
                        <p style={{ fontSize: 10, color: INK3, textTransform: 'capitalize' }}>{r.type}</p>
                      </div>
                      <ExternalLink size={11} style={{ color: INK3, flexShrink: 0 }} />
                    </a>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {showMeetingModal && (
        <BookMeetingModal moduleId={moduleId} moduleTitle={module.title} onClose={() => setShowMeetingModal(false)} />
      )}

      <style>{`
        .about-prose p { margin-bottom: 12px; }
        .about-prose p:last-child { margin-bottom: 0; }
        .about-prose strong { color: #1a1714; font-weight: 600; }
        .about-prose ul { padding-left: 20px; margin-bottom: 12px; }
        .about-prose li { margin-bottom: 4px; font-size: 14px; color: #6b6460; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        @media (min-width: 900px) {
          .module-body-grid { grid-template-columns: 1fr 340px !important; gap: 32px !important; }
          .module-sidebar { position: sticky; top: 64px; }
        }
        @media (max-width: 599px) {
          .learn-grid { grid-template-columns: 1fr !important; }
          .module-hero-meta { flex-wrap: wrap; gap: 8px !important; }
          .module-hero-meta > div { border-right: none !important; padding-right: 0 !important; margin-right: 0 !important; }
          .module-cta-row { flex-direction: column !important; }
          .module-cta-row button { width: 100% !important; justify-content: center !important; min-height: 52px !important; font-size: 15px !important; }
        }
      `}</style>
    </div>
  );
}

// ─── Section card wrapper ──────────────────────────────────────────────────────

function SectionCard({
  title, meta, children, noPadding, style
}: {
  title: string; meta?: string; children: ReactNode; noPadding?: boolean; style?: React.CSSProperties;
}) {
  return (
    <div style={{ background: '#fffcf8', border: '1px solid #d4cdc6', borderRadius: 8, overflow: 'hidden', animation: 'fadeUp 0.5s ease both', ...style }}>
      <div style={{ padding: '20px 28px', borderBottom: '1px solid #d4cdc6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: '0.01em', color: '#1a1714' }}>{title}</span>
        {meta && <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#a09990', letterSpacing: '0.08em' }}>{meta}</span>}
      </div>
      <div style={noPadding ? {} : { padding: '24px 28px' }}>{children}</div>
    </div>
  );
}

// ─── Lesson curriculum row ────────────────────────────────────────────────────

function LessonCurriculumItem({ lesson, index, isLast, onClick, INK, INK3, RULE, BG }: {
  lesson: Lesson; index: number; isLast: boolean; onClick: () => void;
  INK: string; INK3: string; RULE: string; BG: string;
}) {
  const [hovered, setHovered] = useState(false);
  const blockCount = lesson.content?.length ?? 0;
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 16,
        padding: '18px 20px',
        borderBottom: isLast ? 'none' : `1px solid ${RULE}`,
        background: hovered ? BG : 'transparent',
        cursor: 'pointer', textAlign: 'left', border: 'none',
        borderBottomColor: isLast ? 'transparent' : RULE,
        borderBottomStyle: 'solid', borderBottomWidth: isLast ? 0 : 1,
        minHeight: 64,
        transition: 'background 0.15s',
      }}
    >
      <span style={{ fontFamily: 'monospace', fontSize: 11, color: INK3, letterSpacing: '0.1em', width: 26, flexShrink: 0, textAlign: 'right' }}>
        {String(index + 1).padStart(2, '0')}
      </span>
      <div style={{ width: 34, height: 34, borderRadius: 5, background: BG, border: `1px solid ${RULE}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <BookOpen size={13} style={{ color: INK3 }} />
      </div>
      <span style={{ flex: 1, fontSize: 15, fontWeight: 500, color: INK, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {lesson.title}
      </span>
      {lesson.question_count > 0 && (
        <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontFamily: 'monospace', fontSize: 11, color: INK3, letterSpacing: '0.04em', flexShrink: 0 }}>
          <Pin size={10} />
          {lesson.question_count}Q
        </span>
      )}
      <span style={{ fontFamily: 'monospace', fontSize: 11, color: INK3, letterSpacing: '0.06em', flexShrink: 0 }}>
        {blockCount} block{blockCount !== 1 ? 's' : ''}
      </span>
    </button>
  );
}

// ─── Video curriculum row ─────────────────────────────────────────────────────

function CurriculumItem({ video, index, isLast, onClick, INK, INK3, RULE, BG }: {
  video: Video; index: number; isLast: boolean; onClick: () => void;
  INK: string; INK3: string; RULE: string; BG: string;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 16,
        padding: '18px 20px',
        borderBottom: isLast ? 'none' : `1px solid ${RULE}`,
        background: hovered ? BG : 'transparent',
        cursor: 'pointer', textAlign: 'left', border: 'none',
        borderBottomColor: isLast ? 'transparent' : RULE,
        borderBottomStyle: 'solid', borderBottomWidth: isLast ? 0 : 1,
        minHeight: 64,
        transition: 'background 0.15s',
      }}
    >
      <span style={{ fontFamily: 'monospace', fontSize: 11, color: INK3, letterSpacing: '0.1em', width: 26, flexShrink: 0, textAlign: 'right' }}>
        {String(index + 1).padStart(2, '0')}
      </span>
      <div style={{ width: 34, height: 34, borderRadius: 5, background: BG, border: `1px solid ${RULE}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Play size={13} fill={INK3} style={{ color: INK3, marginLeft: 1 }} />
      </div>
      <span style={{ flex: 1, fontSize: 15, fontWeight: 500, color: INK, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {video.title}
      </span>
      {video.question_count > 0 && (
        <span style={{ fontFamily: 'monospace', fontSize: 11, color: INK3, letterSpacing: '0.04em', flexShrink: 0 }}>
          {video.question_count}Q
        </span>
      )}
      <span style={{ fontFamily: 'monospace', fontSize: 12, color: INK3, letterSpacing: '0.06em', flexShrink: 0 }}>
        {fmt(video.duration_seconds)}
      </span>
    </button>
  );
}
