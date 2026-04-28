import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import api from '../../api/client';

import { BG, BG2, SURF, RULE, INK, INK2, INK3, ACC, ACC2, GO } from '../../lib/colors';
const WARN = '#c97a2c';

const STATUS_CFG = {
  pending:  { label: 'Pending',  color: WARN, bg: 'rgba(201,122,44,0.08)', border: 'rgba(201,122,44,0.2)' },
  approved: { label: 'Approved', color: GO,   bg: 'rgba(42,122,75,0.08)',  border: 'rgba(42,122,75,0.2)'  },
  rejected: { label: 'Rejected', color: ACC,  bg: 'rgba(201,79,44,0.08)', border: 'rgba(201,79,44,0.2)'  },
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
};

type Submission = {
  id: string;
  payment_type: string;
  payment_method: string;
  amount: number;
  currency: string;
  phone_number: string | null;
  transaction_reference: string | null;
  proof_image_url: string | null;
  status: 'pending' | 'approved' | 'rejected';
  plan: string | null;
  notes: string | null;
  rejection_reason: string | null;
  reviewed_at: string | null;
  created_at: string;
  payer: { id: string; full_name: string; email: string; avatar_url: string | null } | null;
  module: { id: string; title: string; thumbnail_url: string | null; price: number | null; currency: string | null } | null;
};

export default function AdminPaymentsPage() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [selected, setSelected] = useState<Submission | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showProof, setShowProof] = useState(false);

  const { data: submissions = [], isLoading } = useQuery<Submission[]>({
    queryKey: ['admin-payments', filter],
    queryFn: () => api.get(filter === 'pending' ? '/payments/pending' : '/payments/all').then(r => r.data),
    refetchInterval: 15000,
  });

  const filtered = filter === 'all' || filter === 'pending'
    ? submissions
    : submissions.filter(s => s.status === filter);

  const pendingCount = submissions.filter(s => s.status === 'pending').length;

  const approve = useMutation({
    mutationFn: (id: string) => api.post(`/payments/${id}/approve`),
    onSuccess: () => {
      toast.success('Payment approved · Access granted');
      qc.invalidateQueries({ queryKey: ['admin-payments'] });
      setSelected(null);
    },
    onError: () => toast.error('Failed to approve'),
  });

  const reject = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      api.post(`/payments/${id}/reject`, { reason }),
    onSuccess: () => {
      toast.success('Payment rejected');
      qc.invalidateQueries({ queryKey: ['admin-payments'] });
      setSelected(null);
      setRejectReason('');
    },
    onError: () => toast.error('Failed to reject'),
  });

  return (
    <div style={{ padding: 32, fontFamily: "'Syne', 'Inter', sans-serif" }}>

      {/* ── Header ────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{
            fontFamily: "'Fraunces', Georgia, serif",
            fontSize: 'clamp(24px, 3vw, 36px)',
            fontWeight: 300, fontStyle: 'italic',
            letterSpacing: '-0.02em', color: INK, lineHeight: 1.1,
          }}>
            Payment verification
          </h1>
          <div style={{
            fontFamily: "'Inconsolata', monospace",
            fontSize: 10.5, color: INK3, letterSpacing: '0.12em',
            textTransform: 'uppercase', marginTop: 4,
          }}>
            Manual proof review · Access granted on approval
          </div>
        </div>

        {pendingCount > 0 && (
          <div style={{
            background: 'rgba(201,122,44,0.1)',
            border: '1px solid rgba(201,122,44,0.25)',
            borderRadius: 100, padding: '6px 16px',
            fontFamily: "'Inconsolata', monospace",
            fontSize: 11, fontWeight: 700, color: WARN,
            letterSpacing: '0.06em',
          }}>
            {pendingCount} awaiting review
          </div>
        )}
      </div>

      {/* ── Filter tabs ───────────────────────────────────────── */}
      <div style={{
        display: 'flex', gap: 2,
        background: BG2, border: `1px solid ${RULE}`,
        borderRadius: 6, padding: 3,
        width: 'fit-content', marginBottom: 24,
      }}>
        {(['pending', 'approved', 'rejected', 'all'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: '6px 18px',
              borderRadius: 4, border: 'none', cursor: 'pointer',
              fontFamily: "'Inconsolata', monospace",
              fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase',
              fontWeight: filter === f ? 700 : 500,
              background: filter === f ? SURF : 'transparent',
              color: filter === f ? INK : INK3,
              boxShadow: filter === f ? `0 1px 3px rgba(0,0,0,0.08)` : 'none',
              transition: 'all 0.15s',
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {/* ── Table ─────────────────────────────────────────────── */}
      <div style={{
        background: SURF, border: `1px solid ${RULE}`,
        borderRadius: 6, overflow: 'hidden',
      }}>
        {/* Table head */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr 1fr 1fr 120px 100px',
          padding: '10px 20px',
          borderBottom: `1px solid ${RULE}`,
          background: BG,
        }}>
          {['Payer', 'Type', 'Method', 'Amount', 'Submitted', 'Status'].map(h => (
            <div key={h} style={{
              fontFamily: "'Inconsolata', monospace",
              fontSize: 9.5, letterSpacing: '0.16em', textTransform: 'uppercase', color: INK3,
            }}>
              {h}
            </div>
          ))}
        </div>

        {isLoading ? (
          <div style={{ padding: '48px 20px', textAlign: 'center', color: INK3, fontSize: 13 }}>
            Loading…
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '56px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: 28, marginBottom: 10, opacity: 0.25 }}>✓</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: INK, marginBottom: 4 }}>
              {filter === 'pending' ? 'All caught up' : 'No payments'}
            </div>
            <div style={{ fontSize: 12.5, color: INK3 }}>
              {filter === 'pending' ? 'No payments awaiting review.' : `No ${filter} payments found.`}
            </div>
          </div>
        ) : (
          filtered.map((sub, i) => {
            const cfg = STATUS_CFG[sub.status];
            return (
              <div
                key={sub.id}
                onClick={() => setSelected(sub)}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 1fr 1fr 1fr 120px 100px',
                  padding: '14px 20px',
                  borderBottom: i < filtered.length - 1 ? `1px solid rgba(212,205,198,0.5)` : 'none',
                  cursor: 'pointer', transition: 'background 0.15s',
                  alignItems: 'center',
                }}
                onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = BG)}
                onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
              >
                {/* Payer */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%',
                    background: ACC, flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 700, color: '#fff',
                  }}>
                    {(sub.payer?.full_name ?? '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: INK, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {sub.payer?.full_name ?? '—'}
                    </div>
                    <div style={{ fontFamily: "'Inconsolata', monospace", fontSize: 10.5, color: INK3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {sub.payer?.email ?? '—'}
                    </div>
                  </div>
                </div>

                {/* Type */}
                <div style={{ fontSize: 12.5, color: INK2 }}>
                  {sub.payment_type === 'teacher_subscription' ? '🎓 Subscription' : '📦 Module'}
                  {sub.plan && (
                    <div style={{ fontFamily: "'Inconsolata', monospace", fontSize: 10, color: INK3, textTransform: 'uppercase', marginTop: 2 }}>
                      {sub.plan}
                    </div>
                  )}
                </div>

                {/* Method */}
                <div style={{ fontFamily: "'Inconsolata', monospace", fontSize: 11.5, color: INK2 }}>
                  {METHOD_LABELS[sub.payment_method] ?? sub.payment_method}
                </div>

                {/* Amount */}
                <div style={{ fontFamily: "'Inconsolata', monospace", fontSize: 13, fontWeight: 700, color: INK }}>
                  {sub.amount} {sub.currency}
                </div>

                {/* Time */}
                <div style={{ fontFamily: "'Inconsolata', monospace", fontSize: 10.5, color: INK3 }}>
                  {formatDistanceToNow(new Date(sub.created_at), { addSuffix: true })}
                </div>

                {/* Status */}
                <div style={{
                  fontFamily: "'Inconsolata', monospace",
                  fontSize: 9.5, fontWeight: 700,
                  letterSpacing: '0.08em', textTransform: 'uppercase',
                  color: cfg.color, background: cfg.bg,
                  border: `1px solid ${cfg.border}`,
                  borderRadius: 100, padding: '3px 10px',
                  display: 'inline-flex', alignItems: 'center',
                }}>
                  {cfg.label}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ── Detail panel (slide-over) ─────────────────────────── */}
      {selected && (
        <>
          <div
            onClick={() => { setSelected(null); setShowProof(false); setRejectReason(''); }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 50 }}
          />
          <div style={{
            position: 'fixed', top: 0, right: 0, bottom: 0, width: 460,
            background: SURF, zIndex: 51,
            boxShadow: '-8px 0 40px rgba(0,0,0,0.15)',
            overflowY: 'auto', display: 'flex', flexDirection: 'column',
            animation: 'slideIn 0.22s ease',
          }}>
            {/* Panel header */}
            <div style={{
              padding: '20px 24px', borderBottom: `1px solid ${RULE}`,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              position: 'sticky', top: 0, background: SURF, zIndex: 1,
            }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: INK }}>Payment detail</div>
                <div style={{
                  fontFamily: "'Inconsolata', monospace",
                  fontSize: 9.5, color: INK3, letterSpacing: '0.12em',
                  textTransform: 'uppercase', marginTop: 2,
                }}>
                  {selected.id.slice(0, 8).toUpperCase()}
                </div>
              </div>
              <button
                onClick={() => { setSelected(null); setShowProof(false); setRejectReason(''); }}
                style={{
                  background: BG2, border: `1px solid ${RULE}`,
                  borderRadius: 4, width: 30, height: 30,
                  cursor: 'pointer', fontSize: 16, color: INK2,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                ×
              </button>
            </div>

            <div style={{ padding: '24px', flex: 1 }}>

              {/* Payer */}
              <FieldGroup label="Payer">
                <div style={{ fontWeight: 700, color: INK, fontSize: 14 }}>{selected.payer?.full_name}</div>
                <div style={{ fontFamily: "'Inconsolata', monospace", fontSize: 11.5, color: INK3, marginTop: 2 }}>{selected.payer?.email}</div>
              </FieldGroup>

              {/* Payment info */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
                <FieldGroup label="Type">{TYPE_LABELS[selected.payment_type]}</FieldGroup>
                <FieldGroup label="Plan">{selected.plan ?? '—'}</FieldGroup>
                <FieldGroup label="Amount">
                  <span style={{ fontFamily: "'Inconsolata', monospace", fontSize: 18, fontWeight: 700, color: INK }}>
                    {selected.amount} {selected.currency}
                  </span>
                </FieldGroup>
                <FieldGroup label="Method">{METHOD_LABELS[selected.payment_method] ?? selected.payment_method}</FieldGroup>
              </div>

              {selected.phone_number && (
                <FieldGroup label="Phone (sent from)">
                  <span style={{ fontFamily: "'Inconsolata', monospace" }}>{selected.phone_number}</span>
                </FieldGroup>
              )}
              {selected.transaction_reference && (
                <FieldGroup label="Transaction ref">
                  <span style={{ fontFamily: "'Inconsolata', monospace" }}>{selected.transaction_reference}</span>
                </FieldGroup>
              )}
              {selected.module && (
                <FieldGroup label="Module">{selected.module.title}</FieldGroup>
              )}
              {selected.notes && (
                <FieldGroup label="Notes">{selected.notes}</FieldGroup>
              )}

              {/* Proof image */}
              {selected.proof_image_url ? (
                <div style={{ marginBottom: 20 }}>
                  <div style={{
                    fontFamily: "'Inconsolata', monospace",
                    fontSize: 9.5, letterSpacing: '0.16em', textTransform: 'uppercase', color: INK3, marginBottom: 8,
                  }}>
                    Payment proof
                  </div>
                  {showProof ? (
                    <img
                      src={selected.proof_image_url}
                      alt="Payment proof"
                      style={{ width: '100%', borderRadius: 6, border: `1px solid ${RULE}`, display: 'block' }}
                    />
                  ) : (
                    <button
                      onClick={() => setShowProof(true)}
                      style={{
                        width: '100%', padding: '14px',
                        background: BG, border: `1px solid ${RULE}`,
                        borderRadius: 6, cursor: 'pointer',
                        fontFamily: "'Inconsolata', monospace",
                        fontSize: 11, color: ACC2, letterSpacing: '0.06em',
                        transition: 'background 0.2s',
                      }}
                      onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = BG2)}
                      onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = BG)}
                    >
                      🖼 View screenshot →
                    </button>
                  )}
                </div>
              ) : (
                <div style={{
                  background: 'rgba(201,122,44,0.06)',
                  border: '1px solid rgba(201,122,44,0.15)',
                  borderRadius: 4, padding: '10px 14px', marginBottom: 20,
                  fontFamily: "'Inconsolata', monospace",
                  fontSize: 11, color: WARN, letterSpacing: '0.06em',
                }}>
                  No screenshot uploaded
                </div>
              )}

              {/* Status badge */}
              <div style={{ marginBottom: 24 }}>
                {(() => {
                  const cfg = STATUS_CFG[selected.status];
                  return (
                    <span style={{
                      fontFamily: "'Inconsolata', monospace",
                      fontSize: 10, fontWeight: 700,
                      letterSpacing: '0.1em', textTransform: 'uppercase',
                      color: cfg.color, background: cfg.bg,
                      border: `1px solid ${cfg.border}`,
                      borderRadius: 100, padding: '5px 14px',
                    }}>
                      {cfg.label}
                    </span>
                  );
                })()}
                {selected.rejection_reason && (
                  <div style={{ fontSize: 12.5, color: INK2, marginTop: 10, lineHeight: 1.5 }}>
                    Reason: {selected.rejection_reason}
                  </div>
                )}
              </div>

              {/* Actions */}
              {selected.status === 'pending' && (
                <div style={{ borderTop: `1px solid ${RULE}`, paddingTop: 20 }}>
                  <div style={{
                    fontFamily: "'Inconsolata', monospace",
                    fontSize: 9.5, letterSpacing: '0.16em', textTransform: 'uppercase', color: INK3, marginBottom: 14,
                  }}>
                    Take action
                  </div>

                  <button
                    onClick={() => approve.mutate(selected.id)}
                    disabled={approve.isPending}
                    style={{
                      width: '100%', padding: '13px',
                      background: GO, color: '#fff',
                      border: 'none', borderRadius: 4,
                      fontSize: 13, fontWeight: 700,
                      fontFamily: "'Syne', sans-serif",
                      cursor: approve.isPending ? 'not-allowed' : 'pointer',
                      letterSpacing: '0.02em',
                      marginBottom: 10,
                      opacity: approve.isPending ? 0.6 : 1,
                      transition: 'opacity 0.2s',
                    }}
                    onMouseEnter={e => { if (!approve.isPending) (e.currentTarget as HTMLElement).style.opacity = '0.85'; }}
                    onMouseLeave={e => { if (!approve.isPending) (e.currentTarget as HTMLElement).style.opacity = '1'; }}
                  >
                    {approve.isPending ? 'Approving…' : '✓ Approve & grant access'}
                  </button>

                  <div style={{ marginBottom: 8 }}>
                    <textarea
                      value={rejectReason}
                      onChange={e => setRejectReason(e.target.value)}
                      placeholder="Rejection reason (optional)…"
                      rows={2}
                      style={{
                        width: '100%', padding: '10px 12px',
                        fontSize: 13, fontFamily: "'Inter', sans-serif",
                        color: INK, background: SURF,
                        border: `1px solid ${RULE}`, borderRadius: 4,
                        outline: 'none', resize: 'none',
                        boxSizing: 'border-box', marginBottom: 8,
                      }}
                      onFocus={e => (e.currentTarget.style.borderColor = INK)}
                      onBlur={e => (e.currentTarget.style.borderColor = RULE)}
                    />
                    <button
                      onClick={() => reject.mutate({ id: selected.id, reason: rejectReason })}
                      disabled={reject.isPending}
                      style={{
                        width: '100%', padding: '11px',
                        background: 'transparent', color: ACC,
                        border: `1.5px solid ${ACC}`, borderRadius: 4,
                        fontSize: 13, fontWeight: 600,
                        fontFamily: "'Syne', sans-serif",
                        cursor: reject.isPending ? 'not-allowed' : 'pointer',
                        opacity: reject.isPending ? 0.6 : 1,
                        transition: 'opacity 0.2s',
                      }}
                      onMouseEnter={e => { if (!reject.isPending) (e.currentTarget as HTMLElement).style.opacity = '0.75'; }}
                      onMouseLeave={e => { if (!reject.isPending) (e.currentTarget as HTMLElement).style.opacity = '1'; }}
                    >
                      {reject.isPending ? 'Rejecting…' : '✕ Reject payment'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      <style>{`
        @keyframes slideIn {
          from { transform: translateX(40px); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>
    </div>
  );
}

function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{
        fontFamily: "'Inconsolata', monospace",
        fontSize: 9.5, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#a09990', marginBottom: 4,
      }}>
        {label}
      </div>
      <div style={{ fontSize: 13.5, color: '#1a1714', lineHeight: 1.5 }}>{children}</div>
    </div>
  );
}
