import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { formatDistanceToNow, isPast, parseISO } from 'date-fns';
import {
  BookOpen, Users, Clock, CheckCircle, AlertCircle,
  ChevronRight, FileEdit, Hourglass, Star,
} from 'lucide-react';
import api from '../api/client';
import type { Assignment } from '../types';

// ── Design tokens — theme-aware (follow light/dark via CSS vars) ────────────
const ACC    = 'var(--c-acc)';    // brand purple
const BG      = 'var(--c-bg)';    // page background
const SURF     = 'var(--c-surf)';  // card surface
const RAISE    = 'var(--c-bg2)';   // recessed / pill
const INK     = 'var(--c-ink)';   // primary text
const INK2    = 'var(--c-ink2)';  // secondary text
const INK3    = 'var(--c-ink3)';  // muted text
const BORDER  = 'var(--c-rule)';
const OK      = 'var(--c-ok)';
const WARN    = 'var(--c-warn)';
const BLUE    = 'var(--c-acc2)';
const DISP    = "'Cormorant Garamond', Georgia, serif";
const UIFONT  = "'Inter Tight', 'Inter', system-ui, sans-serif";
const MONO    = "'DM Mono', ui-monospace, monospace";

// ─── Per-learner submission status ───────────────────────────────────────────

type LearnerStatus =
  | 'not_started'
  | 'draft'
  | 'submitted'
  | 'waiting_team'
  | 'review_ready'
  | 'done';

function deriveLearnerStatus(a: Assignment): LearnerStatus {
  if (a.type === 'individual') {
    if (a.my_submission_status === 'submitted') return 'submitted';
    if (a.my_submission_status === 'draft') return 'draft';
    return 'not_started';
  }
  if (a.my_group_merge_status === 'final_submitted') return 'done';
  if (a.my_group_merge_status === 'complete') return 'review_ready';
  if (a.my_submission_status === 'submitted') return 'waiting_team';
  if (a.my_submission_status === 'draft') return 'draft';
  return 'not_started';
}

const STATUS_CONFIG: Record<LearnerStatus, {
  label: string;
  color: string;        // accent colour for this state
  icon: React.ReactNode;
  cta: string;
  hint: string;
}> = {
  not_started: {
    label: 'Not started',
    color: INK3,
    icon: <BookOpen size={15} />,
    cta: 'Start',
    hint: 'Open the assignment and begin writing.',
  },
  draft: {
    label: 'In progress',
    color: WARN,
    icon: <FileEdit size={15} />,
    cta: 'Continue',
    hint: 'Draft saved. Keep writing and submit when ready.',
  },
  submitted: {
    label: 'Submitted',
    color: OK,
    icon: <CheckCircle size={15} />,
    cta: 'View',
    hint: 'Your work has been submitted successfully.',
  },
  waiting_team: {
    label: 'Waiting for team',
    color: BLUE,
    icon: <Hourglass size={15} />,
    cta: 'View progress',
    hint: 'Your portion is in. Waiting for teammates to finish.',
  },
  review_ready: {
    label: 'Ready to review',
    color: ACC,
    icon: <Star size={15} />,
    cta: 'Review & submit',
    hint: 'All portions merged! Review together and submit to your instructor.',
  },
  done: {
    label: 'Submitted to instructor',
    color: OK,
    icon: <CheckCircle size={15} />,
    cta: 'View',
    hint: "Your group's merged document has been submitted.",
  },
};

// ─── Card ─────────────────────────────────────────────────────────────────────

function AssignmentCard({ a }: { a: Assignment }) {
  const status = deriveLearnerStatus(a);
  const cfg = STATUS_CONFIG[status];
  const deadline = a.deadline ? parseISO(a.deadline) : null;
  const overdue = deadline ? isPast(deadline) : false;

  const href =
    status === 'review_ready' || status === 'done'
      ? `/assignments/${a.id}/merged`
      : `/assignments/${a.id}/work`;

  const showOverdue = overdue && status !== 'submitted' && status !== 'done';

  return (
    <Link
      to={href}
      className="press assignment-card"
      style={{
        display: 'block', textDecoration: 'none',
        background: SURF, border: `1px solid ${BORDER}`,
        borderLeft: `3px solid ${cfg.color}`,
        borderRadius: 14, overflow: 'hidden',
        transition: 'border-color 0.2s, transform 0.15s',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, padding: '16px 18px' }}>
        {/* Status icon */}
        <div style={{
          flexShrink: 0, width: 42, height: 42, borderRadius: 11, marginTop: 2,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: cfg.color,
          background: `color-mix(in srgb, ${cfg.color} 12%, transparent)`,
          border: `1px solid color-mix(in srgb, ${cfg.color} 26%, transparent)`,
        }}>
          {cfg.icon}
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <span style={{
              fontFamily: MONO, fontSize: 9.5, fontWeight: 600, letterSpacing: '0.1em',
              textTransform: 'uppercase', color: cfg.color,
              background: `color-mix(in srgb, ${cfg.color} 12%, transparent)`,
              padding: '3px 8px', borderRadius: 100,
            }}>
              {cfg.label}
            </span>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              fontFamily: MONO, fontSize: 9.5, fontWeight: 600, letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: a.type === 'group' ? ACC : BLUE,
              background: a.type === 'group'
                ? 'color-mix(in srgb, var(--c-acc) 11%, transparent)'
                : 'color-mix(in srgb, var(--c-acc2) 11%, transparent)',
              padding: '3px 8px', borderRadius: 100,
            }}>
              {a.type === 'group' ? <><Users size={10} /> Group</> : <><BookOpen size={10} /> Individual</>}
            </span>
            {a.my_portion_label && (
              <span style={{
                fontFamily: MONO, fontSize: 9.5, color: INK2,
                background: RAISE, padding: '3px 8px', borderRadius: 100,
              }}>
                Your part: <strong style={{ color: INK }}>{a.my_portion_label}</strong>
              </span>
            )}
          </div>

          <h2 style={{
            fontFamily: DISP, fontSize: 18, fontWeight: 600, lineHeight: 1.25,
            color: INK, letterSpacing: '-0.01em', margin: 0,
          }}>
            {a.title}
          </h2>
          <p style={{ fontSize: 13, color: INK2, lineHeight: 1.5, marginTop: 4 }}>{cfg.hint}</p>

          {showOverdue && (
            <div style={{
              marginTop: 8, display: 'flex', alignItems: 'center', gap: 6,
              fontSize: 12, fontWeight: 600, color: 'var(--c-danger)',
            }}>
              <AlertCircle size={12} />
              Deadline passed — submit as soon as possible
            </div>
          )}
        </div>

        {/* Right: deadline + CTA */}
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'flex-end',
          justifyContent: 'space-between', gap: 10, flexShrink: 0,
        }}>
          {deadline && (
            <span className="assignment-deadline" style={{
              display: 'flex', alignItems: 'center', gap: 4,
              fontFamily: MONO, fontSize: 11, fontWeight: 500,
              color: overdue ? 'var(--c-danger)' : WARN,
              whiteSpace: 'nowrap',
            }}>
              {overdue ? <AlertCircle size={11} /> : <Clock size={11} />}
              {overdue ? 'Overdue' : formatDistanceToNow(deadline, { addSuffix: true })}
            </span>
          )}
          <span style={{
            display: 'flex', alignItems: 'center', gap: 4,
            fontSize: 12.5, fontWeight: 700, color: cfg.color, whiteSpace: 'nowrap',
          }}>
            {cfg.cta} <ChevronRight size={13} />
          </span>
        </div>
      </div>
    </Link>
  );
}

// ─── Section header ────────────────────────────────────────────────────────────

function SectionHeader({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
      <span style={{
        fontFamily: MONO, fontSize: 10, fontWeight: 700, letterSpacing: '0.18em',
        textTransform: 'uppercase', color: INK3,
      }}>
        {label}
      </span>
      <span style={{
        minWidth: 20, height: 20, padding: '0 6px', borderRadius: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 11, fontWeight: 700, color: 'var(--c-on-acc)', background: color,
      }}>
        {count}
      </span>
      <div style={{ flex: 1, height: 1, background: BORDER }} />
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AssignmentsPage() {
  const { data: assignments = [], isLoading } = useQuery<Assignment[]>({
    queryKey: ['assignments', 'my'],
    queryFn: () => api.get('/assignments/my').then(r => r.data),
  });

  const active = assignments.filter(
    a => deriveLearnerStatus(a) !== 'done' && deriveLearnerStatus(a) !== 'submitted',
  );
  const completed = assignments.filter(
    a => deriveLearnerStatus(a) === 'done' || deriveLearnerStatus(a) === 'submitted',
  );

  if (isLoading) {
    return (
      <div style={{ background: BG, minHeight: '100vh', fontFamily: UIFONT }}>
        <div style={{ maxWidth: 760, margin: '0 auto', padding: 'clamp(16px,4vw,32px) clamp(14px,4vw,24px)', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ height: 120, background: RAISE, borderRadius: 18, animation: 'pulse 2s infinite' }} />
          {[0, 1, 2].map(i => (
            <div key={i} style={{ height: 96, background: RAISE, borderRadius: 14, animation: 'pulse 2s infinite', animationDelay: `${i * 80}ms` }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: BG, minHeight: '100vh', fontFamily: UIFONT }}>
      <div className="admin-page-content" style={{ maxWidth: 760, margin: '0 auto', padding: 'clamp(16px,4vw,32px) clamp(14px,4vw,24px) 40px' }}>

        {/* ── Hero header ── */}
        <div style={{
          position: 'relative', overflow: 'hidden',
          background: SURF, border: `1px solid ${BORDER}`,
          borderRadius: 18, padding: 'clamp(20px,5vw,28px)', marginBottom: 28,
        }}>
          <div style={{
            position: 'absolute', top: -60, right: -40, width: 200, height: 200,
            background: 'radial-gradient(circle, color-mix(in srgb, var(--c-acc) 18%, transparent) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />
          <p style={{
            fontFamily: MONO, fontSize: 10, fontWeight: 700, letterSpacing: '0.2em',
            textTransform: 'uppercase', color: ACC, marginBottom: 8,
          }}>
            Workspace
          </p>
          <h1 style={{
            fontFamily: DISP, fontSize: 'clamp(28px,7vw,38px)', fontWeight: 600,
            color: INK, lineHeight: 1.05, letterSpacing: '-0.02em', margin: 0,
          }}>
            My assignments
          </h1>
          <p style={{ fontSize: 14, color: INK2, marginTop: 8, lineHeight: 1.5 }}>
            Open any assignment to start writing and submit your work.
          </p>

          {assignments.length > 0 && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 'clamp(16px,5vw,28px)',
              marginTop: 22, paddingTop: 20, borderTop: `1px solid ${BORDER}`,
            }}>
              <Stat value={assignments.length} label="Total" color={INK} />
              <div style={{ width: 1, height: 30, background: BORDER }} />
              <Stat value={active.length} label="Active" color={WARN} />
              <div style={{ width: 1, height: 30, background: BORDER }} />
              <Stat value={completed.length} label="Done" color={OK} />
            </div>
          )}
        </div>

        {/* ── Empty state ── */}
        {assignments.length === 0 && (
          <div style={{ textAlign: 'center', padding: '64px 20px' }}>
            <div style={{
              width: 64, height: 64, borderRadius: 16, margin: '0 auto 20px',
              background: SURF, border: `1px solid ${BORDER}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <BookOpen size={28} style={{ color: INK3 }} />
            </div>
            <h2 style={{ fontFamily: DISP, fontSize: 24, fontWeight: 600, color: INK, marginBottom: 8 }}>
              No assignments yet
            </h2>
            <p style={{ fontSize: 14, color: INK2, maxWidth: 320, margin: '0 auto', lineHeight: 1.6 }}>
              Your instructor hasn't published any assignments. Check back soon.
            </p>
          </div>
        )}

        {/* ── Sections ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          {active.length > 0 && (
            <section>
              <SectionHeader label="Action required" count={active.length} color={ACC} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {active.map(a => <AssignmentCard key={a.id} a={a} />)}
              </div>
            </section>
          )}

          {completed.length > 0 && (
            <section>
              <SectionHeader label="Completed" count={completed.length} color={OK} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {completed.map(a => <AssignmentCard key={a.id} a={a} />)}
              </div>
            </section>
          )}
        </div>
      </div>

      <style>{`
        .assignment-card:hover { border-color: color-mix(in srgb, var(--c-acc) 45%, var(--c-rule)) !important; }
        @media (max-width: 420px) { .assignment-deadline { display: none !important; } }
      `}</style>
    </div>
  );
}

function Stat({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <p style={{ fontFamily: MONO, fontSize: 24, fontWeight: 700, color, lineHeight: 1 }}>{value}</p>
      <p style={{ fontSize: 11, color: INK3, marginTop: 5, letterSpacing: '0.04em' }}>{label}</p>
    </div>
  );
}
