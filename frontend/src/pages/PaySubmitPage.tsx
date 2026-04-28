import { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../api/client';
import { useAuthStore } from '../store';
import type { PaymentCountryConfig } from '../types';

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

// ── Fallback methods built from global org settings ────────────────────────────

interface PayMethod {
  key: string;
  label: string;
  number: string;
  name: string;
  detail?: string;
}

function buildGlobalMethods(org: import('../types').Organization | null | undefined): PayMethod[] {
  const methods: PayMethod[] = [];
  if (org?.momo_number)
    methods.push({ key: 'mtn_momo', label: 'MTN MoMo', number: org.momo_number, name: org.momo_name ?? '' });
  if (org?.payment_orange_number)
    methods.push({ key: 'orange_money', label: 'Orange Money', number: org.payment_orange_number, name: org.payment_orange_name ?? '' });
  if (org?.payment_bank_account)
    methods.push({ key: 'bank_transfer', label: 'Bank Transfer', number: org.payment_bank_account, name: org.payment_bank_holder ?? '', detail: org.payment_bank_name ?? undefined });
  if (methods.length === 0)
    methods.push({ key: 'other', label: 'Other', number: '', name: '' });
  return methods;
}

// ── Country-flag emoji helper ──────────────────────────────────────────────────

function countryFlag(code: string) {
  if (code === 'INTL') return '🌍';
  return String.fromCodePoint(...[...code.slice(0, 2)].map(ch => 0x1F1E0 + ch.charCodeAt(0) - 65));
}

// ─────────────────────────────────────────────────────────────────────────────

export default function PaySubmitPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { organization } = useAuthStore();

  const planKey    = params.get('plan') ?? '';
  const moduleId   = params.get('module_id') ?? '';
  const fromInvite = params.get('source') === 'invite';
  const isModule   = !!moduleId;

  const paymentType = isModule ? 'module_purchase'
    : fromInvite    ? 'learner_access'
    :                 'teacher_subscription';

  const planInfo = PLAN_AMOUNTS[planKey];

  // ── Country configs from API ────────────────────────────────────────────────
  const { data: countryConfigs = [] } = useQuery<PaymentCountryConfig[]>({
    queryKey: ['payment-country-configs'],
    queryFn: () => api.get('/payments/country-configs').then(r => r.data),
  });

  const hasCountries = countryConfigs.length > 0;

  // ── State ───────────────────────────────────────────────────────────────────
  const [selectedCountryId, setSelectedCountryId] = useState<string>('');
  const [selectedMethod, setSelectedMethod] = useState<'primary' | 'secondary' | string>('primary');
  const [phone,    setPhone]    = useState('');
  const [ref,      setRef]      = useState('');
  const [amount,   setAmount]   = useState(planInfo ? String(planInfo.usd) : '');
  const [currency, setCurrency] = useState('USD');
  const [notes,    setNotes]    = useState('');
  const [file,     setFile]     = useState<File | null>(null);
  const [preview,  setPreview]  = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Derive the active country config
  const activeCountry = countryConfigs.find(c => c.id === selectedCountryId) ?? null;

  // When a country is selected, pre-fill amount/currency
  useEffect(() => {
    if (!activeCountry) return;
    if (activeCountry.price != null) setAmount(String(activeCountry.price));
    setCurrency(activeCountry.currency_code);
    setSelectedMethod('primary');
  }, [selectedCountryId]);

  // Derive the payment destination to show based on selected method
  const getMethodDisplay = (): { key: string; label: string; number: string; name: string; detail?: string } | null => {
    if (!activeCountry) return null;
    if (selectedMethod === 'primary' && activeCountry.provider && activeCountry.number) {
      return { key: 'mtn_momo', label: activeCountry.provider, number: activeCountry.number, name: activeCountry.account_name ?? '' };
    }
    if (selectedMethod === 'secondary' && activeCountry.provider2 && activeCountry.number2) {
      return { key: 'orange_money', label: activeCountry.provider2, number: activeCountry.number2, name: activeCountry.account_name2 ?? '' };
    }
    return null;
  };

  // Fallback global methods (shown when no country selected or no country configs)
  const globalMethods = buildGlobalMethods(organization);
  const [globalMethod, setGlobalMethod] = useState(globalMethods[0]?.key ?? 'other');

  const submit = useMutation({
    mutationFn: async () => {
      const methodKey = activeCountry
        ? (selectedMethod === 'secondary' ? 'orange_money' : 'mtn_momo')
        : globalMethod;
      const form = new FormData();
      form.append('payment_type', paymentType);
      form.append('payment_method', methodKey);
      form.append('amount', amount);
      form.append('currency', currency);
      form.append('phone_number', phone);
      form.append('transaction_reference', ref);
      form.append('notes', notes);
      if (planKey && !isModule) form.append('plan', planKey);
      if (moduleId) form.append('module_id', moduleId);
      if (file) form.append('proof_image', file);
      return api.post('/payments/submit', form, { headers: { 'Content-Type': 'multipart/form-data' } });
    },
    onSuccess: () => {
      toast.success("Payment submitted! We'll verify within 24 hours.");
      navigate('/pay/status');
    },
    onError: () => toast.error('Something went wrong. Please try again.'),
  });

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    const reader = new FileReader();
    reader.onload = ev => setPreview(ev.target?.result as string);
    reader.readAsDataURL(f);
  };

  const canSubmit = amount && file && !submit.isPending;
  const methodDisplay = getMethodDisplay();
  const instructions = activeCountry?.instructions ?? organization?.payment_instructions;

  return (
    <div style={{ minHeight: '100vh', background: BG, fontFamily: "'Syne', 'Inter', sans-serif" }}>
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '56px 24px 80px' }}>

        {/* Back */}
        <button
          onClick={() => navigate(-1)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'Inconsolata', monospace", fontSize: 11, letterSpacing: '0.1em', color: INK3, textTransform: 'uppercase', marginBottom: 32, padding: 0, display: 'flex', alignItems: 'center', gap: 6 }}
          onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = INK2)}
          onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = INK3)}
        >
          ← Back
        </button>

        {/* Heading */}
        <h1 style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: 36, fontWeight: 300, fontStyle: 'italic', letterSpacing: '-0.02em', color: INK, marginBottom: 8 }}>
          {fromInvite ? 'One last step — pay to unlock access' : 'Submit payment proof'}
        </h1>
        <p style={{ fontSize: 14, color: INK2, lineHeight: 1.6, marginBottom: 40 }}>
          {fromInvite
            ? 'Your account is ready. Send your course fee to the number below, upload your screenshot, and you\'ll get full access within '
            : 'Send your payment to the number below, then fill in the details and upload your confirmation screenshot. We\'ll verify within '}
          <strong style={{ color: INK }}>24 hours</strong>.
        </p>

        {/* ── Step 1: Select your country ───────────────────────────── */}
        {hasCountries && (
          <Section label="01" title="Select your country">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: 10, marginBottom: 4 }}>
              {countryConfigs.map(c => {
                const isActive = c.id === selectedCountryId;
                return (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCountryId(isActive ? '' : c.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '12px 14px', borderRadius: 6, cursor: 'pointer',
                      textAlign: 'left', transition: 'all 0.15s',
                      background: isActive ? INK : SURF,
                      border: `1.5px solid ${isActive ? INK : RULE}`,
                    }}
                  >
                    <span style={{ fontSize: 22, lineHeight: 1 }}>{countryFlag(c.country_code)}</span>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: isActive ? '#f2ede8' : INK, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {c.country_name}
                      </div>
                      <div style={{ fontFamily: "'Inconsolata', monospace", fontSize: 10, letterSpacing: '0.08em', color: isActive ? 'rgba(255,255,255,0.45)' : INK3, marginTop: 1 }}>
                        {c.currency_code} · {c.currency_symbol}
                        {c.price != null ? ` · ${c.price.toLocaleString()}` : ''}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
            {!selectedCountryId && (
              <p style={{ fontSize: 12, color: INK3, marginTop: 8, fontStyle: 'italic' }}>
                Select your country to see the local payment number and currency.
              </p>
            )}
          </Section>
        )}

        {/* ── Step 2: Payment destination ───────────────────────────── */}
        <Section label={hasCountries ? '02' : '01'} title="Payment destination">

          {/* Country-specific: show primary + secondary */}
          {activeCountry ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
              {/* Primary method */}
              {activeCountry.provider && activeCountry.number && (
                <button
                  onClick={() => setSelectedMethod('primary')}
                  style={{ textAlign: 'left', background: selectedMethod === 'primary' ? INK : SURF, border: `1.5px solid ${selectedMethod === 'primary' ? INK : RULE}`, borderRadius: 6, padding: '16px 20px', cursor: 'pointer', transition: 'all 0.15s' }}
                >
                  <div style={{ fontFamily: "'Inconsolata', monospace", fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: selectedMethod === 'primary' ? 'rgba(255,255,255,0.4)' : INK3, marginBottom: 6 }}>
                    {activeCountry.provider}
                  </div>
                  <div style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: 26, fontWeight: 400, lineHeight: 1, color: selectedMethod === 'primary' ? '#f2ede8' : INK, letterSpacing: '0.03em' }}>
                    {activeCountry.number}
                  </div>
                  {activeCountry.account_name && (
                    <div style={{ fontSize: 12.5, marginTop: 5, color: selectedMethod === 'primary' ? 'rgba(255,255,255,0.5)' : INK2 }}>
                      {activeCountry.account_name}
                    </div>
                  )}
                </button>
              )}

              {/* Secondary method */}
              {activeCountry.provider2 && activeCountry.number2 && (
                <button
                  onClick={() => setSelectedMethod('secondary')}
                  style={{ textAlign: 'left', background: selectedMethod === 'secondary' ? INK : SURF, border: `1.5px solid ${selectedMethod === 'secondary' ? INK : RULE}`, borderRadius: 6, padding: '16px 20px', cursor: 'pointer', transition: 'all 0.15s' }}
                >
                  <div style={{ fontFamily: "'Inconsolata', monospace", fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: selectedMethod === 'secondary' ? 'rgba(255,255,255,0.4)' : INK3, marginBottom: 6 }}>
                    {activeCountry.provider2}
                  </div>
                  <div style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: 26, fontWeight: 400, lineHeight: 1, color: selectedMethod === 'secondary' ? '#f2ede8' : INK, letterSpacing: '0.03em' }}>
                    {activeCountry.number2}
                  </div>
                  {activeCountry.account_name2 && (
                    <div style={{ fontSize: 12.5, marginTop: 5, color: selectedMethod === 'secondary' ? 'rgba(255,255,255,0.5)' : INK2 }}>
                      {activeCountry.account_name2}
                    </div>
                  )}
                </button>
              )}

              {!activeCountry.provider && !activeCountry.number && (
                <div style={{ background: '#fff3cd', border: '1px solid #ffc107', borderRadius: 6, padding: '14px 18px', fontSize: 13, color: '#856404' }}>
                  No payment number configured for {activeCountry.country_name} yet. Contact your educator directly.
                </div>
              )}
            </div>
          ) : (
            /* Global fallback */
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
              {globalMethods.length === 1 && globalMethods[0].key === 'other' ? (
                <div style={{ background: '#fff3cd', border: '1px solid #ffc107', borderRadius: 6, padding: '16px 20px', fontSize: 13, color: '#856404' }}>
                  {hasCountries
                    ? 'Select your country above to see the payment number.'
                    : "Your educator hasn't set up payment details yet. Contact them directly."}
                </div>
              ) : (
                globalMethods.map(m => (
                  <button
                    key={m.key}
                    onClick={() => setGlobalMethod(m.key)}
                    style={{ textAlign: 'left', background: globalMethod === m.key ? INK : SURF, border: `1.5px solid ${globalMethod === m.key ? INK : RULE}`, borderRadius: 6, padding: '16px 20px', cursor: 'pointer', transition: 'all 0.15s' }}
                  >
                    <div style={{ fontFamily: "'Inconsolata', monospace", fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: globalMethod === m.key ? 'rgba(255,255,255,0.4)' : INK3, marginBottom: 6 }}>
                      {m.label}{m.detail ? ` · ${m.detail}` : ''}
                    </div>
                    <div style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: 26, fontWeight: 400, lineHeight: 1, color: globalMethod === m.key ? '#f2ede8' : INK, letterSpacing: '0.03em' }}>
                      {m.number || '—'}
                    </div>
                    {m.name && (
                      <div style={{ fontSize: 12.5, marginTop: 5, color: globalMethod === m.key ? 'rgba(255,255,255,0.5)' : INK2 }}>
                        {m.name}
                      </div>
                    )}
                  </button>
                ))
              )}
            </div>
          )}

          {/* Instructions */}
          {instructions && (
            <div style={{ background: 'rgba(42,122,75,0.06)', border: '1px solid rgba(42,122,75,0.15)', borderRadius: 4, padding: '10px 14px', fontSize: 12.5, color: GO, fontFamily: "'Inconsolata', monospace" }}>
              {instructions}
            </div>
          )}
        </Section>

        {/* ── Step 3: Your payment details ─────────────────────────── */}
        <Section label={hasCountries ? '03' : '02'} title="Your payment details">

          {/* Amount + Currency */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px', gap: 12, marginBottom: 16 }}>
            <div>
              <Label>Amount paid</Label>
              <Input type="number" placeholder="e.g. 6000" value={amount} onChange={e => setAmount(e.target.value)} />
            </div>
            <div>
              <Label>Currency</Label>
              <select value={currency} onChange={e => setCurrency(e.target.value)} style={inputStyle}>
                {[
                  ['XAF','XAF – CFA Franc'], ['XOF','XOF – West African CFA'],
                  ['RWF','RWF – Rwandan Franc'], ['KES','KES – Kenyan Shilling'],
                  ['NGN','NGN – Nigerian Naira'], ['GHS','GHS – Ghanaian Cedi'],
                  ['UGX','UGX – Ugandan Shilling'], ['TZS','TZS – Tanzanian Shilling'],
                  ['ETB','ETB – Ethiopian Birr'], ['ZAR','ZAR – South African Rand'],
                  ['ZMW','ZMW – Zambian Kwacha'], ['MWK','MWK – Malawian Kwacha'],
                  ['MAD','MAD – Moroccan Dirham'],
                  ['USD','USD – US Dollar'], ['EUR','EUR – Euro'],
                ].map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>
          </div>

          {planInfo && (
            <div style={{ background: 'rgba(42,122,75,0.06)', border: '1px solid rgba(42,122,75,0.15)', borderRadius: 4, padding: '10px 14px', marginBottom: 16, fontSize: 12.5, color: GO, fontFamily: "'Inconsolata', monospace" }}>
              ✓ {planKey.charAt(0).toUpperCase() + planKey.slice(1)} plan · ${planInfo.usd} USD · ≈ {planInfo.rwf} RWF/month
            </div>
          )}

          {/* Phone */}
          <Label>Your phone number (that you sent from)</Label>
          <Input type="tel" placeholder="e.g. 0781234567" value={phone} onChange={e => setPhone(e.target.value)} />

          {/* Reference */}
          <Label>Transaction reference / ID <span style={{ color: INK3, fontWeight: 400 }}>(optional)</span></Label>
          <Input type="text" placeholder="e.g. MP220001234" value={ref} onChange={e => setRef(e.target.value)} />

          {/* Notes */}
          <Label>Notes <span style={{ color: INK3, fontWeight: 400 }}>(optional)</span></Label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any additional information…" rows={3}
            style={{ ...inputStyle, resize: 'vertical', fontFamily: "'Inter', sans-serif", lineHeight: 1.5 }} />
        </Section>

        {/* ── Step 4: Upload proof ──────────────────────────────────── */}
        <Section label={hasCountries ? '04' : '03'} title="Upload payment screenshot (required)">
          <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} style={{ display: 'none' }} />

          {preview ? (
            <div style={{ position: 'relative' }}>
              <img src={preview} alt="Payment proof" style={{ width: '100%', borderRadius: 6, border: `1px solid ${RULE}`, display: 'block' }} />
              <button
                onClick={() => { setFile(null); setPreview(null); }}
                style={{ position: 'absolute', top: 10, right: 10, background: INK, color: '#fff', border: 'none', borderRadius: 4, padding: '4px 10px', fontSize: 11, cursor: 'pointer' }}
              >
                Remove
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileRef.current?.click()}
              style={{ width: '100%', padding: '36px 20px', background: SURF, border: `2px dashed ${RULE}`, borderRadius: 6, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, transition: 'border-color 0.2s' }}
              onMouseEnter={e => ((e.currentTarget as HTMLElement).style.borderColor = INK3)}
              onMouseLeave={e => ((e.currentTarget as HTMLElement).style.borderColor = RULE)}
            >
              <div style={{ fontSize: 28, opacity: 0.4 }}>📸</div>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: INK }}>Click to upload screenshot</div>
              <div style={{ fontFamily: "'Inconsolata', monospace", fontSize: 10.5, color: INK3, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                JPG · PNG · WEBP · max 10 MB
              </div>
            </button>
          )}

          <p style={{ fontSize: 12.5, color: INK3, marginTop: 12, lineHeight: 1.5 }}>
            Take a screenshot of your payment confirmation. This helps us verify quickly.
          </p>
          {!file && (
            <p style={{ fontSize: 12, color: ACC, marginTop: 4, fontWeight: 600 }}>✕ Screenshot is required</p>
          )}
        </Section>

        {/* ── Submit ────────────────────────────────────────────────── */}
        <button
          onClick={() => submit.mutate()}
          disabled={!canSubmit}
          style={{ width: '100%', padding: '15px', background: canSubmit ? ACC : BG2, color: canSubmit ? '#fff' : INK3, border: 'none', borderRadius: 4, fontSize: 14, fontWeight: 700, fontFamily: "'Syne', sans-serif", cursor: canSubmit ? 'pointer' : 'not-allowed', letterSpacing: '0.02em', transition: 'opacity 0.2s, background 0.2s' }}
          onMouseEnter={e => { if (canSubmit) (e.currentTarget as HTMLElement).style.opacity = '0.85'; }}
          onMouseLeave={e => { if (canSubmit) (e.currentTarget as HTMLElement).style.opacity = '1'; }}
        >
          {submit.isPending ? 'Submitting…' : 'Submit for verification →'}
        </button>

        <p style={{ textAlign: 'center', marginTop: 16, fontFamily: "'Inconsolata', monospace", fontSize: 11, color: INK3, letterSpacing: '0.06em' }}>
          You'll receive access within 24 hours · Questions? {organization?.name ?? 'your educator'}
        </p>
      </div>
    </div>
  );
}

// ── Small helpers ──────────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 12px', fontSize: 13.5,
  fontFamily: "'Inter', sans-serif", color: '#1a1714',
  background: '#fffcf8', border: '1px solid #d4cdc6',
  borderRadius: 4, outline: 'none', marginBottom: 16, boxSizing: 'border-box',
};

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      style={{ ...inputStyle, ...(props.style ?? {}) }}
      onFocus={e => (e.currentTarget.style.borderColor = '#1a1714')}
      onBlur={e => (e.currentTarget.style.borderColor = '#d4cdc6')}
    />
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontFamily: "'Inconsolata', monospace", fontSize: 10.5, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#a09990', marginBottom: 7, fontWeight: 500 }}>
      {children}
    </div>
  );
}

function Section({ label, title, children }: { label: string; title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 36 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 18 }}>
        <span style={{ fontFamily: "'Inconsolata', monospace", fontSize: 11, fontWeight: 700, color: '#c94f2c', letterSpacing: '0.08em' }}>{label}</span>
        <span style={{ fontSize: 14.5, fontWeight: 700, color: '#1a1714' }}>{title}</span>
      </div>
      {children}
    </div>
  );
}
