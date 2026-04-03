import { useState, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, Pin, X } from 'lucide-react';
import api from '../api/client';
import type { Lesson, Module, LessonBlock } from '../types';
import LessonViewer from '../components/Lesson/LessonViewer';
import BlockQASidebar from '../components/QA/BlockQASidebar';
import { Skeleton } from '../components/UI/Skeleton';
import toast from 'react-hot-toast';

/** Modal: ask a question about a pinned block */
function PinQuestionModal({
  lessonId,
  blockId,
  blockPreview,
  onClose,
  onSuccess,
}: {
  lessonId: string;
  blockId: string;
  blockPreview: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [text, setText] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const queryClient = useQueryClient();

  const submit = useMutation({
    mutationFn: () =>
      api.post('/lesson-questions', {
        lesson_id: lessonId,
        block_id: blockId,
        question_text: text.trim(),
        is_public: isPublic,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lesson-questions', lessonId] });
      toast.success('Question submitted!');
      onSuccess();
    },
    onError: () => toast.error('Failed to submit question'),
  });

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.55)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50,
        padding: 16,
      }}
    >
      <div
        style={{
          background: '#13141a',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 12,
          width: '100%',
          maxWidth: 460,
          boxShadow: '0 32px 64px rgba(0,0,0,0.6)',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '18px 22px',
            borderBottom: '1px solid rgba(255,255,255,0.07)',
          }}
        >
          <h3
            style={{
              fontFamily: "'Lora', Georgia, serif",
              fontSize: 16,
              fontWeight: 700,
              color: '#e8e4dc',
              letterSpacing: '-0.01em',
            }}
          >
            Ask a Question
          </h3>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#6b6b78',
              padding: 4,
            }}
          >
            <X size={16} />
          </button>
        </div>

        <div style={{ padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Pinned section preview */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 12px',
              borderRadius: 6,
              background: 'rgba(232,201,126,0.06)',
              border: '1px solid rgba(232,201,126,0.2)',
            }}
          >
            <Pin size={13} style={{ color: '#e8c97e', flexShrink: 0 }} />
            <p
              style={{
                fontSize: 12,
                color: '#e8c97e',
                fontFamily: 'monospace',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {blockPreview || 'Pinned section'}
            </p>
          </div>

          {/* Text area */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: 12,
                fontWeight: 600,
                color: '#9ca3af',
                marginBottom: 6,
                letterSpacing: '0.04em',
              }}
            >
              What's your question?
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Describe what you're confused about or want to know more about…"
              rows={4}
              autoFocus
              style={{
                width: '100%',
                background: '#0b0c0f',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 6,
                padding: '10px 14px',
                fontSize: 14,
                color: '#e8e4dc',
                fontFamily: 'inherit',
                resize: 'none',
                outline: 'none',
                lineHeight: 1.6,
                boxSizing: 'border-box',
              }}
              onFocus={(e) =>
                (e.target.style.borderColor = 'rgba(232,201,126,0.4)')
              }
              onBlur={(e) =>
                (e.target.style.borderColor = 'rgba(255,255,255,0.1)')
              }
            />
            <p style={{ fontSize: 11, color: '#6b6b78', marginTop: 4 }}>
              {text.length}/500
            </p>
          </div>

          {/* Visibility toggle */}
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              cursor: 'pointer',
            }}
          >
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }}
              />
              <div
                style={{
                  width: 36,
                  height: 20,
                  borderRadius: 100,
                  background: isPublic
                    ? 'rgba(232,201,126,0.5)'
                    : 'rgba(255,255,255,0.1)',
                  transition: 'background 0.2s',
                  position: 'relative',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: 3,
                    left: isPublic ? 18 : 3,
                    width: 14,
                    height: 14,
                    borderRadius: '50%',
                    background: '#fff',
                    transition: 'left 0.2s',
                  }}
                />
              </div>
            </div>
            <div>
              <p style={{ fontSize: 12.5, fontWeight: 600, color: '#e8e4dc' }}>
                Visible to others
              </p>
              <p style={{ fontSize: 11, color: '#6b6b78' }}>
                {isPublic
                  ? 'Other learners can see this Q&A'
                  : 'Only you and teachers can see this'}
              </p>
            </div>
          </label>
        </div>

        {/* Actions */}
        <div
          style={{
            display: 'flex',
            gap: 10,
            padding: '0 22px 20px',
          }}
        >
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: '10px',
              borderRadius: 6,
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'transparent',
              color: '#9ca3af',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            Cancel
          </button>
          <button
            onClick={() => submit.mutate()}
            disabled={!text.trim() || text.length > 500 || submit.isPending}
            style={{
              flex: 1,
              padding: '10px',
              borderRadius: 6,
              border: 'none',
              background:
                !text.trim() || text.length > 500
                  ? 'rgba(232,201,126,0.3)'
                  : '#e8c97e',
              color: '#0b0c0f',
              fontSize: 13,
              fontWeight: 700,
              cursor:
                !text.trim() || text.length > 500 ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            {submit.isPending ? 'Submitting…' : 'Submit'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function LessonPage() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pinModal, setPinModal] = useState<{
    blockId: string;
    preview: string;
  } | null>(null);
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const { data: lesson, isLoading } = useQuery<Lesson>({
    queryKey: ['lesson', lessonId],
    queryFn: () => api.get(`/lessons/${lessonId}`).then((r) => r.data),
    enabled: !!lessonId,
  });

  const { data: module } = useQuery<Module>({
    queryKey: ['module', lesson?.module_id],
    queryFn: () =>
      api.get(`/modules/${lesson!.module_id}`).then((r) => r.data),
    enabled: !!lesson?.module_id,
  });

  const { data: moduleLessons = [] } = useQuery<Lesson[]>({
    queryKey: ['module-lessons', lesson?.module_id],
    queryFn: () =>
      api
        .get(`/lessons/module/${lesson!.module_id}`)
        .then((r) => r.data),
    enabled: !!lesson?.module_id,
  });

  // Questions for pinned-block indicator
  const { data: questions = [] } = useQuery({
    queryKey: ['lesson-questions', lessonId],
    queryFn: () =>
      api.get(`/lessons/${lessonId}/questions`).then((r) => r.data),
    enabled: !!lessonId,
  });

  const pinnedBlockIds = new Set(
    (questions as { block_id: string }[]).map((q) => q.block_id),
  );

  const currentIndex = moduleLessons.findIndex((l) => l.id === lessonId);
  const prevLesson = moduleLessons[currentIndex - 1];
  const nextLesson = moduleLessons[currentIndex + 1];

  const handlePinBlock = useCallback(
    (blockId: string, preview: string) => {
      setPinModal({ blockId, preview });
    },
    [],
  );

  const handleScrollToBlock = useCallback((blockId: string) => {
    setActiveBlockId(blockId);
    const el = document.getElementById(`block-${blockId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    setTimeout(() => setActiveBlockId(null), 2500);
  }, []);

  const blocks: LessonBlock[] = lesson?.content ?? [];

  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          height: 'calc(100vh - 56px)',
          background: '#0b0c0f',
        }}
      >
        <div style={{ flex: 1, padding: 32 }}>
          <Skeleton className="h-8 w-64 mb-6 rounded" />
          <Skeleton className="h-4 w-full mb-3 rounded" />
          <Skeleton className="h-4 w-3/4 mb-3 rounded" />
          <Skeleton className="h-48 w-full rounded-xl mt-8" />
        </div>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: 'calc(100vh - 56px)',
          background: '#0b0c0f',
          color: '#6b6b78',
        }}
      >
        Lesson not found.
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        height: 'calc(100vh - 56px)',
        overflow: 'hidden',
        background: '#0b0c0f',
      }}
    >
      {/* ── Main content ── */}
      <div style={{ flex: 1, overflowY: 'auto' }} ref={contentRef}>
        <div
          style={{
            maxWidth: 780,
            margin: '0 auto',
            padding: '36px 32px 80px',
          }}
        >
          {/* Breadcrumb */}
          <nav
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              marginBottom: 24,
              fontSize: 12,
              letterSpacing: '0.04em',
            }}
          >
            <Link
              to="/modules"
              style={{ color: '#6b6b78', textDecoration: 'none' }}
            >
              Modules
            </Link>
            <span style={{ color: 'rgba(255,255,255,0.2)' }}>/</span>
            {module && (
              <>
                <Link
                  to={`/modules/${module.id}`}
                  style={{
                    color: '#6b6b78',
                    textDecoration: 'none',
                    maxWidth: 160,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    display: 'block',
                  }}
                >
                  {module.title}
                </Link>
                <span style={{ color: 'rgba(255,255,255,0.2)' }}>/</span>
              </>
            )}
            <span style={{ color: '#e8e4dc', fontWeight: 500 }}>
              {lesson.title}
            </span>
          </nav>

          {/* Chapter label */}
          <div
            style={{
              fontFamily: 'monospace',
              fontSize: 10.5,
              letterSpacing: '0.18em',
              color: '#e8c97e',
              textTransform: 'uppercase',
              marginBottom: 10,
              opacity: 0.85,
            }}
          >
            {module?.title ?? 'Module'}&nbsp;&nbsp;·&nbsp;&nbsp;Lesson{' '}
            {String(currentIndex + 1).padStart(2, '0')}
          </div>

          {/* Lesson title */}
          <h1
            style={{
              fontFamily: "'Lora', Georgia, serif",
              fontSize: 'clamp(22px, 2.5vw, 34px)',
              fontWeight: 700,
              lineHeight: 1.2,
              letterSpacing: '-0.02em',
              color: '#e8e4dc',
              marginBottom: 8,
            }}
          >
            {lesson.title}
          </h1>
          {lesson.description && (
            <p
              style={{
                fontSize: 15,
                color: '#6b6b78',
                lineHeight: 1.65,
                marginBottom: 32,
              }}
            >
              {lesson.description}
            </p>
          )}

          {/* Toolbar row */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 32,
              paddingBottom: 16,
              borderBottom: '1px solid rgba(255,255,255,0.07)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontFamily: 'monospace',
                fontSize: 10.5,
                color: '#6b6b78',
                letterSpacing: '0.08em',
              }}
            >
              <Pin size={11} />
              {blocks.length} block{blocks.length !== 1 ? 's' : ''}
              &nbsp;·&nbsp;
              {questions.length} question{questions.length !== 1 ? 's' : ''}
            </div>

            {/* Mobile Q&A toggle */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 14px',
                borderRadius: 4,
                border: '1px solid rgba(255,255,255,0.1)',
                background: '#1c1e27',
                color: '#9ca3af',
                fontSize: 12,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              {sidebarOpen ? 'Hide' : 'Show'} Q&amp;A
            </button>
          </div>

          {/* Lesson blocks */}
          <LessonViewer
            blocks={blocks}
            onPinBlock={handlePinBlock}
            pinnedBlockIds={pinnedBlockIds}
            activeBlockId={activeBlockId}
          />

          {/* Prev / Next */}
          {moduleLessons.length > 1 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                marginTop: 48,
                paddingTop: 24,
                borderTop: '1px solid rgba(255,255,255,0.07)',
              }}
            >
              <button
                onClick={() =>
                  prevLesson && navigate(`/lesson/${prevLesson.id}`)
                }
                disabled={!prevLesson}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 14px',
                  borderRadius: 8,
                  border: '1px solid rgba(255,255,255,0.07)',
                  background: '#13141a',
                  color: '#9ca3af',
                  fontSize: 13,
                  cursor: prevLesson ? 'pointer' : 'not-allowed',
                  opacity: prevLesson ? 1 : 0.3,
                  fontFamily: 'inherit',
                  maxWidth: '40%',
                  overflow: 'hidden',
                }}
              >
                <ChevronLeft size={15} style={{ flexShrink: 0 }} />
                <span
                  style={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {prevLesson?.title ?? 'Previous'}
                </span>
              </button>

              <span
                style={{
                  flex: 1,
                  textAlign: 'center',
                  fontFamily: 'monospace',
                  fontSize: 11,
                  color: '#6b6b78',
                  letterSpacing: '0.06em',
                  whiteSpace: 'nowrap',
                }}
              >
                {currentIndex + 1} / {moduleLessons.length}
              </span>

              <button
                onClick={() =>
                  nextLesson && navigate(`/lesson/${nextLesson.id}`)
                }
                disabled={!nextLesson}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 14px',
                  borderRadius: 8,
                  border: '1px solid rgba(255,255,255,0.07)',
                  background: '#13141a',
                  color: '#9ca3af',
                  fontSize: 13,
                  cursor: nextLesson ? 'pointer' : 'not-allowed',
                  opacity: nextLesson ? 1 : 0.3,
                  fontFamily: 'inherit',
                  maxWidth: '40%',
                  overflow: 'hidden',
                }}
              >
                <span
                  style={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {nextLesson?.title ?? 'Next'}
                </span>
                <ChevronRight size={15} style={{ flexShrink: 0 }} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Q&A Sidebar ── */}
      <>
        {/* Mobile backdrop */}
        {sidebarOpen && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 30,
              background: 'rgba(0,0,0,0.6)',
            }}
            className="lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        <div
          className={`
            fixed inset-y-14 right-0 z-40 w-full max-w-sm
            lg:relative lg:inset-auto lg:z-auto lg:w-auto lg:max-w-none lg:flex
            ${sidebarOpen ? 'flex' : 'hidden'}
          `}
        >
          {lessonId && (
            <BlockQASidebar
              lessonId={lessonId}
              blocks={blocks}
              onClose={() => setSidebarOpen(false)}
              onScrollToBlock={handleScrollToBlock}
            />
          )}
        </div>
      </>

      {/* ── Pin question modal ── */}
      {pinModal && lessonId && (
        <PinQuestionModal
          lessonId={lessonId}
          blockId={pinModal.blockId}
          blockPreview={pinModal.preview}
          onClose={() => setPinModal(null)}
          onSuccess={() => setPinModal(null)}
        />
      )}

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
