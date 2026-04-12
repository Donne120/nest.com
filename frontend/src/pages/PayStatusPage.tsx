import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import api from '../api/client';

const INK   = '#1a1714';
const INK2  = '#6b6460';
const INK3  = '#a09990';
const RULE  = '#d4cdc6';
const SURF  = '#fffcf8';
const BG    = '#f2ede8';
const ACC   = '#c94f2c';
const GO    = '#2a7a4b';
const WARN  = '#c97a2c';

const STATUS_CONFIG = {
  pending:  { label: 'Under Review',  color: WARN,  bg: 'rgba(201,122,44,0.08)',  border: 'rgba(201,122,44,0.2)'  },
  approved: { label: 'Approved',      color: GO,    bg: 'rgba(42,122,75,0.08)',   border: 'rgba(42,122,75,0.2)'   },
  rejected: { label: 'Rejected',      color: ACC,   bg: 'rgba(201,79,44,0.08)',   border: 'rgba(201,79,44,0.2)'   },
};

const METHOD_LABELS: Record<string, string> = {
  mtn_momo:     'MTN MoMo',
  orange_money: 'Orange Money',
  bank_transfer:'Bank Transfer',
  other:        'Other',
};

const TYPE_LABELS: Record<string, string> = {
  teacher_subscription: 'Teacher Subscription',
  module_purchase:      'Module Purchase',
  learner_access:       'Course Access',
};

type Submission = {
  id: string;
  payment_type: string;
  payment_method: string;
  amount: number;
  currency: string;
  status: 'pending' | 'approved' | 'rejected';
  plan: string | null;
  rejection_reason: string | null;
  created_at: string;
  module: { title: string } | null;
};

export default function PayStatusPage() {
  const navigate = useNavigate();

  const { data: submissions = [], isLoading } = useQuery<Submission[]>({
    queryKey: ['my-payments'],
    queryFn: () => api.get('/payments/mine').then(r => r.data),
  });

  return (
    <div style={{ minHeight: '100vh', background: BG, fontFamily: "'Syne', 'Inter', sans-serif" }}>
      <div style={{ maxWidth: 700, margin: '0 auto', padding: '56px 24px 80px' }}>

        {/* Back */}
        <button
          onClick={() => navigate(-1)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontFamily: "'Inconsolata', monospace",
            fontSize: 11, letterSpacing: '0.1em', color: INK3,
            textTransform: 'uppercase', marginBottom: 32, padding: 0,
          }}
          onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = INK2)}
          onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = INK3)}
        >
          ← Back
        </button>

        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 36 }}>
          <div>
            <h1 style={{
              fontFamily: "'Fraunces', Georgia, serif",
              fontSize: 34, fontWeight: 300, fontStyle: 'italic',
              letterSpacing: '-0.02em', color: INK, marginBottom: 6,
            }}>
              My payments
            </h1>
            <div style={{
              fontFamily: "'Inconsolata', monospace",
              fontSize: 10.5, color: INK3, letterSpacing: '0.12em', textTransform: 'uppercase',
            }}>
              {submissions.length} submission{submissions.length !== 1 ? 's' : ''}
            </div>
          </div>
          <button
            onClick={() => navigate('/pay/submit')}
            style={{
              background: ACC, color: '#fff',
              border: 'none', borderRadius: 4,
              padding: '10px 20px',
              fontSize: 12.5, fontWeight: 600,
              fontFamily: "'Syne', sans-serif",
              cursor: 'pointer', letterSpacing: '0.02em',
              transition: 'opacity 0.2s',
              flexShrink: 0,
            }}
            onMouseEnter={e => ((e.currentTarget as HTMLElement).style.opacity = '0.82')}
            onMouseLeave={e => ((e.currentTarget as HTMLElement).style.opacity = '1')}
          >
            + New payment
          </button>
        </div>

        {submissions.some(s => s.status === 'approved') && (
          <div style={{
            marginBottom: 28,
            background: 'rgba(42,122,75,0.07)',
            border: '1px solid rgba(42,122,75,0.2)',
            borderRadius: 6, padding: '20px 24px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
          }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: GO, marginBottom: 4 }}>
                ✓ Payment approved — your access is active
              </div>
              <div style={{ fontSize: 13, color: INK2 }}>
                You can now access all your course content.
              </div>
            </div>
            <button
              onClick={() => navigate('/modules')}
              style={{
                background: GO, color: '#fff',
                border: 'none', borderRadius: 4,
                padding: '11px 22px',
                fontSize: 13, fontWeight: 700,
                fontFamily: "'Syne', sans-serif",
                cursor: 'pointer', letterSpacing: '0.02em',
                whiteSpace: 'nowrap',
                flexShrink: 0,
                transition: 'opacity 0.2s',
              }}
              onMouseEnter={e => ((e.currentTarget as HTMLElement).style.opacity = '0.82')}
              onMouseLeave={e => ((e.currentTarget as HTMLElement).style.opacity = '1')}
            >
              Continue to learning space →
            </button>
          </div>
        )}

        {isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{ height: 90, background: SURF, borderRadius: 4, opacity: 0.5 }} />
            ))}
          </div>
        ) : submissions.length === 0 ? (
          <div style={{
            background: SURF, border: `1px solid ${RULE}`,
            borderRadius: 6, padding: '64px 32px',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 32, marginBottom: 12, opacity: 0.3 }}>💳</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: INK, marginBottom: 6 }}>No payments yet</div>
            <div style={{ fontSize: 13, color: INK3, marginBottom: 24 }}>
              Submit your first payment proof to get started.
            </div>
            <button
              onClick={() => navigate('/pricing')}
              style={{
                background: ACC, color: '#fff',
                border: 'none', borderRadius: 4,
                padding: '10px 24px',
                fontSize: 13, fontWeight: 600,
                fontFamily: "'Syne', sans-serif",
                cursor: 'pointer',
              }}
            >
              View pricing →
            </button>
          </div>
        ) : (
          <div style={{
            background: SURF, border: `1px solid ${RULE}`,
            borderRadius: 6, overflow: 'hidden',
          }}>
            {submissions.map((sub, i) => {
              const cfg = STATUS_CONFIG[sub.status];
              return (
                <div
                  key={sub.id}
                  style={{
                    padding: '18px 24px',
                    borderBottom: i < submissions.length - 1 ? `1px solid rgba(212,205,198,0.5)` : 'none',
                    display: 'flex', alignItems: 'center', gap: 16,
                  }}
                >
                  {/* Type icon */}
                  <div style={{
                    width: 40, height: 40, borderRadius: 6,
                    background: BG,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 18, flexShrink: 0,
                  }}>
                    {sub.payment_type === 'teacher_subscription' ? '🎓' : '📦'}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: INK, marginBottom: 3 }}>
                      {TYPE_LABELS[sub.payment_type]}
                      {sub.plan && (
                        <span style={{
                          fontFamily: "'Inconsolata', monospace",
                          fontSize: 10, letterSpacing: '0.1em',
                          color: INK3, marginLeft: 8, textTransform: 'uppercase',
                        }}>
                          {sub.plan}
                        </span>
                      )}
                      {sub.module && (
                        <span style={{ fontSize: 12, color: INK2, marginLeft: 8 }}>
                          · {sub.module.title}
                        </span>
                      )}
                    </div>
                    <div style={{
                      fontFamily: "'Inconsolata', monospace",
                      fontSize: 11, color: INK3, letterSpacing: '0.04em',
                    }}>
                      {METHOD_LABELS[sub.payment_method]} · {sub.amount} {sub.currency} ·{' '}
                      {formatDistanceToNow(new Date(sub.created_at), { addSuffix: true })}
                    </div>
                    {sub.rejection_reason && (
                      <div style={{ fontSize: 12, color: ACC, marginTop: 4 }}>
                        Reason: {sub.rejection_reason}
                      </div>
                    )}
                  </div>

                  {/* Status badge + action */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, flexShrink: 0 }}>
                    <div style={{
                      fontFamily: "'Inconsolata', monospace",
                      fontSize: 10, fontWeight: 700,
                      letterSpacing: '0.08em', textTransform: 'uppercase',
                      color: cfg.color,
                      background: cfg.bg,
                      border: `1px solid ${cfg.border}`,
                      borderRadius: 100, padding: '4px 12px',
                    }}>
                      {cfg.label}
                    </div>
                    {sub.status === 'approved' && (
                      <button
                        onClick={() => navigate('/modules')}
                        style={{
                          background: GO, color: '#fff',
                          border: 'none', borderRadius: 4,
                          padding: '7px 14px',
                          fontSize: 11.5, fontWeight: 600,
                          fontFamily: "'Syne', sans-serif",
                          cursor: 'pointer', letterSpacing: '0.02em',
                          whiteSpace: 'nowrap',
                          transition: 'opacity 0.2s',
                        }}
                        onMouseEnter={e => ((e.currentTarget as HTMLElement).style.opacity = '0.82')}
                        onMouseLeave={e => ((e.currentTarget as HTMLElement).style.opacity = '1')}
                      >
                        Go to learning space →
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {submissions.some(s => s.status === 'pending') && (
          <div style={{
            marginTop: 20,
            background: 'rgba(201,122,44,0.05)',
            border: '1px solid rgba(201,122,44,0.15)',
            borderRadius: 6, padding: '14px 18px',
            fontSize: 13, color: WARN, lineHeight: 1.5,
          }}>
            <strong>Pending submissions</strong> are reviewed within 24 hours.
            Questions? Email <a href="mailto:dieudonnen450@gmail.com" style={{ color: WARN }}>dieudonnen450@gmail.com</a>
          </div>
        )}
      </div>
    </div>
  );
}
