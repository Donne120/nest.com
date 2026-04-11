import { useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../api/client';
import { useAuthStore } from '../store';

const INK   = '#1a1714';
const INK2  = '#6b6460';
const INK3  = '#a09990';
const RULE  = '#d4cdc6';
const SURF  = '#fffcf8';
const BG    = '#f2ede8';
const BG2   = '#e8e2db';
const ACC   = '#c94f2c';
const GO    = '#2a7a4b';

const PLAN_AMOUNTS: Record<string, { usd: number; rwf: string }> = {
  starter:      { usd: 9,  rwf: '13,000' },
  professional: { usd: 29, rwf: '42,000' },
  enterprise:   { usd: 79, rwf: '115,000' },
};

const METHODS = [
  { key: 'mtn_momo',      label: 'MTN MoMo',      number: '0792104982',  name: 'Ngum Dieudonne' },
  { key: 'orange_money',  label: 'Orange Money',   number: 'Contact us',  name: '—' },
  { key: 'bank_transfer', label: 'Bank Transfer',  number: 'Contact us',  name: '—' },
  { key: 'other',         label: 'Other',          number: '',            name: '' },
];

export default function PaySubmitPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { organization } = useAuthStore();

  const planKey    = params.get('plan') ?? '';
  const moduleId   = params.get('module_id') ?? '';
  const fromInvite = params.get('source') === 'invite';
  const isModule   = !!moduleId;

  // Determine payment type
  const paymentType = isModule
    ? 'module_purchase'
    : fromInvite
      ? 'learner_access'
      : 'teacher_subscription';

  const planInfo = PLAN_AMOUNTS[planKey];

  // Use the org's MoMo number; fall back to a contact prompt if not set
  const orgMomo = (organization as any)?.momo_number ?? null;

  const [method,   setMethod]   = useState('mtn_momo');
  const [phone,    setPhone]    = useState('');
  const [ref,      setRef]      = useState('');
  const [amount,   setAmount]   = useState(planInfo ? String(planInfo.usd) : '');
  const [currency, setCurrency] = useState('USD');
  const [notes,    setNotes]    = useState('');
  const [file,     setFile]     = useState<File | null>(null);
  const [preview,  setPreview]  = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const selectedMethod = METHODS.find(m => m.key === method)!;

  const submit = useMutation({
    mutationFn: async () => {
      const form = new FormData();
      form.append('payment_type', paymentType);
      form.append('payment_method', method);
      form.append('amount', amount);
      form.append('currency', currency);
      form.append('phone_number', phone);
      form.append('transaction_reference', ref);
      form.append('notes', notes);
      if (planKey && !isModule) form.append('plan', planKey);
      if (moduleId) form.append('module_id', moduleId);
      if (file) form.append('proof_image', file);
      return api.post('/payments/submit', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },
    onSuccess: () => {
      toast.success('Payment submitted! We\'ll verify within 24 hours.');
      navigate('/pay/status');
    },
    onError: () => {
      toast.error('Something went wrong. Please try again.');
    },
  });

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    const reader = new FileReader();
    reader.onload = ev => setPreview(ev.target?.result as string);
    reader.readAsDataURL(f);
  };

  const canSubmit = amount && method && file && !submit.isPending;

  return (
    <div style={{ minHeight: '100vh', background: BG, fontFamily: "'Syne', 'Inter', sans-serif" }}>
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '56px 24px 80px' }}>

        {/* Back */}
        <button
          onClick={() => navigate(-1)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontFamily: "'Inconsolata', monospace",
            fontSize: 11, letterSpacing: '0.1em', color: INK3,
            textTransform: 'uppercase', marginBottom: 32, padding: 0,
            display: 'flex', alignItems: 'center', gap: 6,
          }}
          onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = INK2)}
          onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = INK3)}
        >
          ← Back
        </button>

        {/* Heading */}
        <h1 style={{
          fontFamily: "'Fraunces', Georgia, serif",
          fontSize: 36, fontWeight: 300, fontStyle: 'italic',
          letterSpacing: '-0.02em', color: INK, marginBottom: 8,
        }}>
          {fromInvite ? 'One last step — pay to unlock your access' : 'Submit payment proof'}
        </h1>
        <p style={{ fontSize: 14, color: INK2, lineHeight: 1.6, marginBottom: 40 }}>
          {fromInvite
            ? `Your account is ready. Send your course fee to the number below, upload your screenshot, and you'll get full access within `
            : 'Send your payment to the number below, then fill in the details and upload your confirmation screenshot. We\'ll verify and activate your access within '}
          <strong style={{ color: INK }}>24 hours</strong>.
        </p>

        {/* ── Step 1: Payment details ──────────────────────────── */}
        <Section label="01" title="Payment destination">
          {orgMomo ? (
            <div style={{
              background: INK, borderRadius: 6,
              padding: '20px 24px', marginBottom: 16,
            }}>
              <div style={{
                fontFamily: "'Inconsolata', monospace",
                fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.35)', marginBottom: 10,
              }}>
                MTN MoMo
              </div>
              <div style={{
                fontFamily: "'Fraunces', Georgia, serif",
                fontSize: 32, fontWeight: 400, color: '#f2ede8',
                letterSpacing: '0.04em', lineHeight: 1,
              }}>
                {orgMomo}
              </div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 6 }}>
                {organization?.name ?? 'Your educator'}
              </div>
            </div>
          ) : (
            <div style={{
              background: '#fff3cd', border: '1px solid #ffc107', borderRadius: 6,
              padding: '16px 20px', marginBottom: 16,
              fontSize: 13, color: '#856404',
            }}>
              Your educator hasn't set up their payment number yet.
              Please contact them directly to arrange payment.
            </div>
          )}
          <div style={{
            fontFamily: "'Inconsolata', monospace",
            fontSize: 11, color: INK3, letterSpacing: '0.05em',
          }}>
            Need Orange Money or bank transfer?{' '}
            <a href="mailto:dieudonnen450@gmail.com" style={{ color: ACC, textDecoration: 'none' }}>
              Contact us →
            </a>
          </div>
        </Section>

        {/* ── Step 2: Your payment info ─────────────────────────── */}
        <Section label="02" title="Your payment details">
          {/* Payment method */}
          <Label>Payment method</Label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
            {METHODS.map(m => (
              <button
                key={m.key}
                onClick={() => setMethod(m.key)}
                style={{
                  padding: '8px 16px',
                  borderRadius: 4, fontSize: 12.5, fontWeight: 500,
                  cursor: 'pointer', transition: 'all 0.15s',
                  border: method === m.key ? `1.5px solid ${INK}` : `1.5px solid ${RULE}`,
                  background: method === m.key ? INK : SURF,
                  color: method === m.key ? '#f2ede8' : INK2,
                }}
              >
                {m.label}
              </button>
            ))}
          </div>

          {/* Amount + Currency */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: 12, marginBottom: 16 }}>
            <div>
              <Label>Amount paid</Label>
              <Input
                type="number"
                placeholder="e.g. 9"
                value={amount}
                onChange={e => setAmount(e.target.value)}
              />
            </div>
            <div>
              <Label>Currency</Label>
              <select
                value={currency}
                onChange={e => setCurrency(e.target.value)}
                style={inputStyle}
              >
                <option value="USD">USD</option>
                <option value="RWF">RWF</option>
                <option value="XAF">XAF</option>
                <option value="KES">KES</option>
              </select>
            </div>
          </div>

          {planInfo && (
            <div style={{
              background: 'rgba(42,122,75,0.06)', border: '1px solid rgba(42,122,75,0.15)',
              borderRadius: 4, padding: '10px 14px', marginBottom: 16,
              fontSize: 12.5, color: GO,
              fontFamily: "'Inconsolata', monospace",
            }}>
              ✓ {planKey.charAt(0).toUpperCase() + planKey.slice(1)} plan · ${planInfo.usd} USD · ≈ {planInfo.rwf} RWF/month
            </div>
          )}

          {/* Phone number */}
          <Label>Your MoMo phone number (that you sent from)</Label>
          <Input
            type="tel"
            placeholder="e.g. 0781234567"
            value={phone}
            onChange={e => setPhone(e.target.value)}
          />

          {/* Transaction reference */}
          <Label>Transaction reference / ID <span style={{ color: INK3, fontWeight: 400 }}>(optional)</span></Label>
          <Input
            type="text"
            placeholder="e.g. MP220001234"
            value={ref}
            onChange={e => setRef(e.target.value)}
          />

          {/* Notes */}
          <Label>Notes <span style={{ color: INK3, fontWeight: 400 }}>(optional)</span></Label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Any additional information..."
            rows={3}
            style={{
              ...inputStyle,
              resize: 'vertical',
              fontFamily: "'Inter', sans-serif",
              lineHeight: 1.5,
            }}
          />
        </Section>

        {/* ── Step 3: Upload proof ──────────────────────────────── */}
        <Section label="03" title="Upload payment screenshot (required)">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={handleFile}
            style={{ display: 'none' }}
          />

          {preview ? (
            <div style={{ position: 'relative' }}>
              <img
                src={preview}
                alt="Payment proof"
                style={{ width: '100%', borderRadius: 6, border: `1px solid ${RULE}`, display: 'block' }}
              />
              <button
                onClick={() => { setFile(null); setPreview(null); }}
                style={{
                  position: 'absolute', top: 10, right: 10,
                  background: INK, color: '#fff', border: 'none',
                  borderRadius: 4, padding: '4px 10px',
                  fontSize: 11, cursor: 'pointer',
                }}
              >
                Remove
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileRef.current?.click()}
              style={{
                width: '100%', padding: '36px 20px',
                background: SURF, border: `2px dashed ${RULE}`,
                borderRadius: 6, cursor: 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
                transition: 'border-color 0.2s',
              }}
              onMouseEnter={e => ((e.currentTarget as HTMLElement).style.borderColor = INK3)}
              onMouseLeave={e => ((e.currentTarget as HTMLElement).style.borderColor = RULE)}
            >
              <div style={{ fontSize: 28, opacity: 0.4 }}>📸</div>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: INK }}>
                Click to upload screenshot
              </div>
              <div style={{
                fontFamily: "'Inconsolata', monospace",
                fontSize: 10.5, color: INK3, letterSpacing: '0.06em',
                textTransform: 'uppercase',
              }}>
                JPG · PNG · WEBP · max 10 MB
              </div>
            </button>
          )}

          <p style={{ fontSize: 12.5, color: INK3, marginTop: 12, lineHeight: 1.5 }}>
            Take a screenshot of your MoMo payment confirmation screen. This helps us verify your payment quickly.
          </p>
          {!file && (
            <p style={{ fontSize: 12, color: ACC, marginTop: 4, fontWeight: 600 }}>
              ✕ Screenshot is required to submit
            </p>
          )}
        </Section>

        {/* ── Submit ────────────────────────────────────────────── */}
        <button
          onClick={() => submit.mutate()}
          disabled={!canSubmit}
          style={{
            width: '100%', padding: '15px',
            background: canSubmit ? ACC : BG2,
            color: canSubmit ? '#fff' : INK3,
            border: 'none', borderRadius: 4,
            fontSize: 14, fontWeight: 700,
            fontFamily: "'Syne', sans-serif",
            cursor: canSubmit ? 'pointer' : 'not-allowed',
            letterSpacing: '0.02em',
            transition: 'opacity 0.2s, background 0.2s',
          }}
          onMouseEnter={e => { if (canSubmit) (e.currentTarget as HTMLElement).style.opacity = '0.85'; }}
          onMouseLeave={e => { if (canSubmit) (e.currentTarget as HTMLElement).style.opacity = '1'; }}
        >
          {submit.isPending ? 'Submitting…' : 'Submit for verification →'}
        </button>

        <p style={{
          textAlign: 'center', marginTop: 16,
          fontFamily: "'Inconsolata', monospace",
          fontSize: 11, color: INK3, letterSpacing: '0.06em',
        }}>
          You'll receive access within 24 hours · Questions? dieudonnen450@gmail.com
        </p>
      </div>
    </div>
  );
}

// ── Small helpers ──────────────────────────────────────────────────────────────

const INK3c  = '#a09990';
const RULEc  = '#d4cdc6';
const SURFc  = '#fffcf8';
const INKc   = '#1a1714';

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  fontSize: 13.5,
  fontFamily: "'Inter', sans-serif",
  color: INKc,
  background: SURFc,
  border: `1px solid ${RULEc}`,
  borderRadius: 4,
  outline: 'none',
  marginBottom: 16,
  boxSizing: 'border-box',
};

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      style={{
        ...inputStyle,
        ...(props.style ?? {}),
      }}
      onFocus={e => (e.currentTarget.style.borderColor = '#1a1714')}
      onBlur={e => (e.currentTarget.style.borderColor = RULEc)}
    />
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontFamily: "'Inconsolata', monospace",
      fontSize: 10.5, letterSpacing: '0.14em', textTransform: 'uppercase',
      color: INK3c, marginBottom: 7, fontWeight: 500,
    }}>
      {children}
    </div>
  );
}

function Section({ label, title, children }: {
  label: string; title: string; children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: 36 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 18 }}>
        <span style={{
          fontFamily: "'Inconsolata', monospace",
          fontSize: 11, fontWeight: 700,
          color: '#c94f2c', letterSpacing: '0.08em',
        }}>
          {label}
        </span>
        <span style={{ fontSize: 14.5, fontWeight: 700, color: INKc }}>{title}</span>
      </div>
      {children}
    </div>
  );
}
