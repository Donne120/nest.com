import { useEffect, useState } from 'react';
import { X, BookOpen, ThumbsUp, ThumbsDown } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/client';
import RichText from '../UI/RichText';

interface Props {
  videoId: string;
  notes: string;          // the educator's study material (markdown/LaTeX/tables)
  onClose: () => void;
}

interface Rating {
  helpful_count: number;
  not_helpful_count: number;
  my_vote: boolean | null;
}

// A bottom sheet that shows a lesson's study material, rendered richly, with a
// helpful 👍 / 👎 vote at the end.
export default function StudyNotesDrawer({ videoId, notes, onClose }: Props) {
  const qc = useQueryClient();
  const [entered, setEntered] = useState(false);
  useEffect(() => { const t = setTimeout(() => setEntered(true), 10); return () => clearTimeout(t); }, []);

  const { data: rating } = useQuery<Rating>({
    queryKey: ['study-rating', videoId],
    queryFn: () => api.get(`/videos/${videoId}/study-rating`).then(r => r.data),
  });

  const vote = useMutation({
    mutationFn: (helpful: boolean) => api.post(`/videos/${videoId}/study-rating`, { helpful }).then(r => r.data),
    onSuccess: (data: Rating) => qc.setQueryData(['study-rating', videoId], data),
  });

  const close = () => { setEntered(false); setTimeout(onClose, 240); };
  const myVote = rating?.my_vote ?? null;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 82 }}>
      {/* Backdrop */}
      <div
        onClick={close}
        style={{
          position: 'absolute', inset: 0,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)',
          opacity: entered ? 1 : 0, transition: 'opacity 0.24s ease',
        }}
      />
      {/* Sheet — bottom drawer on phones, a centred card on desktop */}
      <div
        className="study-sheet"
        style={{
          position: 'absolute', left: 0, right: 0, bottom: 0,
          height: 'min(86vh, 100dvh - 44px)',
          background: '#141219', border: '1px solid rgba(255,255,255,0.09)',
          borderRadius: '20px 20px 0 0', overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
          transform: entered ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 0.28s cubic-bezier(0.16,1,0.3,1)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        <style>{`
          @media (min-width: 768px) {
            .study-sheet {
              left: 50% !important; right: auto !important; bottom: auto !important;
              top: 50% !important;
              width: min(680px, 92vw) !important;
              max-height: 84vh !important; height: auto !important;
              border-radius: 18px !important;
              transform: translate(-50%, -50%) ${entered ? 'scale(1)' : 'scale(0.96)'} !important;
              opacity: ${entered ? 1 : 0};
              transition: transform 0.24s cubic-bezier(0.16,1,0.3,1), opacity 0.24s ease !important;
            }
          }
        `}</style>
        {/* Grabber + header */}
        <div style={{ flexShrink: 0, borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 2px' }}>
            <div style={{ width: 38, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.16)' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 18px 14px' }}>
            <span style={{ width: 30, height: 30, borderRadius: 9, background: 'rgba(199,125,218,0.16)', border: '1px solid rgba(199,125,218,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#C77DDA' }}>
              <BookOpen size={16} />
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontFamily: "'Inter Tight','Inter',system-ui,sans-serif", fontSize: 14.5, fontWeight: 700, color: '#F2F0F5', margin: 0 }}>Study material</p>
              <p style={{ fontFamily: "'DM Mono',ui-monospace,monospace", fontSize: 10.5, color: '#756D80', margin: '2px 0 0', letterSpacing: '0.04em' }}>Notes for this lesson</p>
            </div>
            <button onClick={close} aria-label="Close" style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', border: 'none', color: '#A8A3B2', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Note body — rich rendered */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '18px 18px 8px' }}>
          <RichText tone="on-dark">{notes}</RichText>

          {/* Helpfulness vote */}
          <div style={{ marginTop: 26, paddingTop: 18, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <p style={{ fontFamily: "'Inter Tight','Inter',system-ui,sans-serif", fontSize: 13.5, fontWeight: 600, color: '#A8A3B2', textAlign: 'center', marginBottom: 12 }}>
              Were these notes helpful?
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <VoteBtn
                active={myVote === true}
                onClick={() => vote.mutate(true)}
                icon={<ThumbsUp size={16} />}
                label="Helpful"
                count={rating?.helpful_count ?? 0}
                accent="#7BD44E"
              />
              <VoteBtn
                active={myVote === false}
                onClick={() => vote.mutate(false)}
                icon={<ThumbsDown size={16} />}
                label="Not really"
                count={rating?.not_helpful_count ?? 0}
                accent="#F0836B"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function VoteBtn({ active, onClick, icon, label, count, accent }: {
  active: boolean; onClick: () => void; icon: React.ReactNode; label: string; count: number; accent: string;
}) {
  return (
    <button
      onClick={onClick}
      className="press"
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 8,
        minHeight: 44, padding: '0 18px', borderRadius: 12, cursor: 'pointer',
        fontFamily: "'Inter Tight','Inter',system-ui,sans-serif", fontSize: 13.5, fontWeight: 700,
        color: active ? '#0B0A0F' : '#F2F0F5',
        background: active ? accent : 'rgba(255,255,255,0.06)',
        border: `1px solid ${active ? accent : 'rgba(255,255,255,0.14)'}`,
        transition: 'all 0.15s',
      }}
    >
      {icon} {label}
      {count > 0 && (
        <span style={{ fontFamily: "'DM Mono',ui-monospace,monospace", fontSize: 12, opacity: active ? 0.75 : 0.6 }}>{count}</span>
      )}
    </button>
  );
}
