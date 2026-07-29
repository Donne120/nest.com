import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Calendar, Clock, ExternalLink, BookOpen, Plus, Video,
} from 'lucide-react';
import api from '../api/client';
import type { Meeting, MeetingStatus } from '../types';
import BookMeetingModal from '../components/Meetings/BookMeetingModal';
import { useWebSocket } from '../hooks/useWebSocket';

// ── Design tokens — theme-aware ─────────────────────────────────────────────
const ACC    = 'var(--c-acc)';
const BG      = 'var(--c-bg)';
const SURF     = 'var(--c-surf)';
const RAISE    = 'var(--c-bg2)';
const INK     = 'var(--c-ink)';
const INK2    = 'var(--c-ink2)';
const INK3    = 'var(--c-ink3)';
const BORDER  = 'var(--c-rule)';
const OK      = 'var(--c-ok)';
const WARN    = 'var(--c-warn)';
const DANGER  = 'var(--c-danger)';
const DISP    = "'Cormorant Garamond', Georgia, serif";
const UIFONT  = "'Inter Tight', 'Inter', system-ui, sans-serif";
const MONO    = "'DM Mono', ui-monospace, monospace";

const STATUS: Record<MeetingStatus, { label: string; color: string }> = {
  pending:   { label: 'Pending',   color: WARN },
  confirmed: { label: 'Confirmed', color: OK },
  declined:  { label: 'Declined',  color: DANGER },
  completed: { label: 'Completed', color: INK3 },
};

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    weekday: 'short', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function MeetingCard({ meeting }: { meeting: Meeting }) {
  const st = STATUS[meeting.status];
  return (
    <article style={{
      background: SURF, border: `1px solid ${BORDER}`,
      borderLeft: `3px solid ${st.color}`, borderRadius: 14, padding: '16px 18px',
    }}>
      {/* Chips */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
        {meeting.module_title && (
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            fontFamily: MONO, fontSize: 9.5, fontWeight: 600, letterSpacing: '0.06em',
            color: ACC, background: 'color-mix(in srgb, var(--c-acc) 12%, transparent)',
            border: `1px solid color-mix(in srgb, var(--c-acc) 26%, transparent)`,
            borderRadius: 100, padding: '3px 9px',
          }}>
            <BookOpen size={10} /> {meeting.module_title}
          </span>
        )}
        <span style={{
          fontFamily: MONO, fontSize: 9.5, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase',
          color: st.color, background: `color-mix(in srgb, ${st.color} 13%, transparent)`,
          borderRadius: 100, padding: '3px 9px',
        }}>
          {st.label}
        </span>
      </div>

      <h3 style={{ fontFamily: DISP, fontSize: 19, fontWeight: 600, color: INK, lineHeight: 1.2, letterSpacing: '-0.01em' }}>
        1-on-1 with {meeting.owner ? meeting.owner.full_name : 'your trainer'}
      </h3>

      {/* Time */}
      <div style={{ marginTop: 10 }}>
        {meeting.confirmed_at ? (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 13, fontWeight: 600, color: OK }}>
            <Calendar size={13} /> {formatDateTime(meeting.confirmed_at)}
          </span>
        ) : meeting.requested_at ? (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 13, color: INK2 }}>
            <Clock size={13} /> Requested for {formatDateTime(meeting.requested_at)}
          </span>
        ) : (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 13, color: INK3 }}>
            <Clock size={13} /> No specific time requested
          </span>
        )}
      </div>

      {/* Learner note */}
      {meeting.note && (
        <p style={{
          marginTop: 12, fontFamily: DISP, fontStyle: 'italic', fontSize: 14, color: INK2,
          background: RAISE, border: `1px solid ${BORDER}`, borderRadius: 10, padding: '10px 12px', lineHeight: 1.5,
        }}>
          "{meeting.note}"
        </p>
      )}

      {/* Decline reason */}
      {meeting.status === 'declined' && meeting.decline_reason && (
        <p style={{
          marginTop: 12, fontSize: 12.5, color: DANGER,
          background: `color-mix(in srgb, ${DANGER} 10%, transparent)`,
          border: `1px solid color-mix(in srgb, ${DANGER} 24%, transparent)`,
          borderRadius: 10, padding: '10px 12px',
        }}>
          {meeting.decline_reason}
        </p>
      )}

      {/* Join */}
      {meeting.status === 'confirmed' && meeting.meeting_link && (
        <a href={meeting.meeting_link} target="_blank" rel="noopener noreferrer" className="press" style={{
          marginTop: 14, minHeight: 46, borderRadius: 12,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          background: ACC, color: 'var(--c-on-acc)', textDecoration: 'none',
          fontFamily: UIFONT, fontSize: 14, fontWeight: 700,
          boxShadow: '0 8px 22px -10px color-mix(in srgb, var(--c-acc) 80%, transparent)',
        }}>
          <Video size={15} /> Join meeting <ExternalLink size={12} style={{ opacity: 0.7 }} />
        </a>
      )}

      <p style={{ fontFamily: MONO, fontSize: 10, color: INK3, marginTop: 12 }}>
        Requested {new Date(meeting.created_at).toLocaleDateString()}
      </p>
    </article>
  );
}

export default function MeetingsPage() {
  const [showModal, setShowModal] = useState(false);
  const qc = useQueryClient();

  useWebSocket((msg) => {
    if (msg.event === 'meeting_confirmed' || msg.event === 'meeting_declined') {
      qc.invalidateQueries({ queryKey: ['meetings'] });
      qc.invalidateQueries({ queryKey: ['notifications'] });
    }
  });

  const { data: meetings = [], isLoading } = useQuery<Meeting[]>({
    queryKey: ['meetings'],
    queryFn: () => api.get('/meetings').then(r => r.data),
  });

  const pending   = meetings.filter(m => m.status === 'pending');
  const confirmed = meetings.filter(m => m.status === 'confirmed');
  const past      = meetings.filter(m => m.status === 'declined' || m.status === 'completed');

  return (
    <div style={{ background: BG, minHeight: '100vh', fontFamily: UIFONT }}>
      <div className="admin-page-content" style={{ maxWidth: 640, margin: '0 auto', padding: 'clamp(16px,4vw,32px) clamp(14px,4vw,20px) 40px' }}>

        {/* ── Hero header ── */}
        <div style={{
          position: 'relative', overflow: 'hidden',
          background: SURF, border: `1px solid ${BORDER}`, borderRadius: 18,
          padding: 'clamp(20px,5vw,26px)', marginBottom: 24,
        }}>
          <div aria-hidden style={{
            position: 'absolute', top: -60, right: -30, width: 190, height: 190,
            background: 'radial-gradient(circle, color-mix(in srgb, var(--c-acc) 18%, transparent) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />
          <p style={{ fontFamily: MONO, fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: ACC, marginBottom: 8 }}>
            Live support
          </p>
          <h1 style={{ fontFamily: DISP, fontSize: 'clamp(26px,7vw,34px)', fontWeight: 600, color: INK, lineHeight: 1.05, letterSpacing: '-0.02em', margin: 0 }}>
            1-on-1 meetings
          </h1>
          <p style={{ fontSize: 14, color: INK2, marginTop: 8, lineHeight: 1.5 }}>
            Book time with your trainer for personalised help.
          </p>
          <button onClick={() => setShowModal(true)} className="press" style={{
            marginTop: 16, width: '100%', minHeight: 48, borderRadius: 12, border: 'none', cursor: 'pointer',
            background: ACC, color: 'var(--c-on-acc)', fontFamily: UIFONT, fontSize: 14.5, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            boxShadow: '0 10px 26px -12px color-mix(in srgb, var(--c-acc) 80%, transparent)',
          }}>
            <Plus size={16} /> Book a 1-on-1
          </button>
        </div>

        {isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{ height: 130, background: RAISE, borderRadius: 14, animation: 'pulse 2s infinite', animationDelay: `${i * 80}ms` }} />
            ))}
          </div>
        ) : meetings.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '56px 24px', background: SURF, border: `1px solid ${BORDER}`, borderRadius: 18 }}>
            <div style={{ width: 60, height: 60, borderRadius: 16, margin: '0 auto 18px', background: RAISE, border: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Calendar size={26} style={{ color: INK3 }} />
            </div>
            <p style={{ fontFamily: DISP, fontSize: 23, fontWeight: 600, color: INK, marginBottom: 8 }}>No meetings yet</p>
            <p style={{ fontSize: 14, color: INK2, maxWidth: 300, margin: '0 auto', lineHeight: 1.6 }}>
              Book a 1-on-1 with your trainer to get personalised support.
            </p>
            <button onClick={() => setShowModal(true)} className="press" style={{
              marginTop: 20, minHeight: 46, padding: '0 22px', borderRadius: 12, border: 'none', cursor: 'pointer',
              background: ACC, color: 'var(--c-on-acc)', fontFamily: UIFONT, fontSize: 14, fontWeight: 700,
            }}>
              Book now
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
            {confirmed.length > 0 && <Section label="Upcoming" color={OK} items={confirmed} />}
            {pending.length > 0 && <Section label="Pending" color={WARN} items={pending} />}
            {past.length > 0 && <Section label="Past" color={INK3} items={past} />}
          </div>
        )}

        {showModal && <BookMeetingModal onClose={() => setShowModal(false)} />}
      </div>
    </div>
  );
}

function Section({ label, color, items }: { label: string; color: string; items: Meeting[] }) {
  return (
    <section>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <span style={{ fontFamily: MONO, fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: INK3 }}>{label}</span>
        <span style={{ minWidth: 20, height: 20, padding: '0 6px', borderRadius: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'var(--c-on-acc)', background: color }}>
          {items.length}
        </span>
        <div style={{ flex: 1, height: 1, background: BORDER }} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {items.map(m => <MeetingCard key={m.id} meeting={m} />)}
      </div>
    </section>
  );
}
