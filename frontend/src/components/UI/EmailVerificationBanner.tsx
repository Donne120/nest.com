import { useState } from 'react';
import { MailWarning, Check } from 'lucide-react';
import api from '../../api/client';
import { useAuthStore } from '../../store';

/**
 * Soft email-confirmation gate: shown while the logged-in user hasn't confirmed
 * their email. It never blocks login (a broken email provider must not lock
 * anyone out) — it just nudges, and offers a resend. Course access is gated
 * separately (see the learn area), this is the persistent reminder.
 */
export default function EmailVerificationBanner() {
  const { user } = useAuthStore();
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [msg, setMsg] = useState('');

  // Nothing to show for verified users or when logged out.
  if (!user || user.email_verified) return null;

  const resend = async () => {
    setState('sending');
    try {
      const { data } = await api.post('/auth/resend-verification');
      setMsg(data?.message || 'Verification email sent.');
      setState('sent');
    } catch (e: any) {
      setMsg(
        e?.response?.status === 429
          ? 'Too many requests — please wait a bit before trying again.'
          : 'Could not send right now. Please try again shortly.',
      );
      setState('error');
    }
  };

  return (
    <div
      role="status"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        flexWrap: 'wrap',
        padding: '10px 16px',
        background: '#FFF7E6',
        borderBottom: '1px solid #F3D48A',
        color: '#7A5A00',
        fontFamily: "'Inter Tight', Inter, system-ui, sans-serif",
        fontSize: 13.5,
        lineHeight: 1.5,
      }}
    >
      <MailWarning size={18} style={{ flexShrink: 0 }} />
      <span style={{ flex: 1, minWidth: 200 }}>
        <strong>Confirm your email</strong> to unlock full access. We sent a link to{' '}
        <strong>{user.email}</strong> — check your inbox (and spam).
      </span>
      {state === 'sent' ? (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
          <Check size={16} /> {msg}
        </span>
      ) : (
        <button
          onClick={resend}
          disabled={state === 'sending'}
          style={{
            border: '1px solid #C89A2B',
            background: state === 'sending' ? '#F3E4BC' : '#FFEFC4',
            color: '#7A5A00',
            fontWeight: 700,
            fontSize: 13,
            padding: '6px 14px',
            borderRadius: 8,
            cursor: state === 'sending' ? 'default' : 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          {state === 'sending' ? 'Sending…' : 'Resend email'}
        </button>
      )}
      {state === 'error' && (
        <span style={{ width: '100%', color: '#B4431F', fontSize: 12.5 }}>{msg}</span>
      )}
    </div>
  );
}
