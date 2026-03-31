import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Palette, CreditCard, Upload, Clock,
  Check, ArrowRight, ArrowLeft,
} from 'lucide-react';
import api from '../../api/client';
import { useAuthStore } from '../../store';
import type { Organization } from '../../types';
import toast from 'react-hot-toast';

// ── Design tokens ─────────────────────────────────────────────────────────────
const BG   = '#f2ede8';
const SURF = '#fffcf8';
const INK  = '#1a1714';
const INK2 = '#5a524a';
const INK3 = '#9a8e84';
const RULE = '#d4cdc6';
const BG2  = '#e8e2db';
const ACC  = '#c94f2c';
const ACC2 = '#e07a5f';
const GO   = '#2a7a4b';
const WARN = '#c97a2c';
const DISP = "'Fraunces', Georgia, serif";
const UI   = "'Syne', 'Inter', sans-serif";
const MONO = "'Inconsolata', monospace";

// ── Plans ────────────────────────────────────────────────────────────────────
const PLANS = [
  {
    key: 'starter',
    name: 'Starter',
    price: '$9',
    rwf: '13,000 RWF',
    desc: 'Solo tutor, up to 5 modules',
    features: ['5 modules', 'Unlimited students', 'AI Q&A', 'Certificates'],
  },
  {
    key: 'professional',
    name: 'Professional',
    price: '$29',
    rwf: '42,000 RWF',
    desc: 'Active educator, unlimited modules',
    features: ['Unlimited modules', 'Assignments & quizzes', 'Analytics', 'Priority support'],
    highlight: true,
  },
  {
    key: 'enterprise',
    name: 'School',
    price: '$79',
    rwf: '115,000 RWF',
    desc: 'Institutions with multiple teachers',
    features: ['Multiple teachers', 'Custom branding', 'Invoice billing', 'Dedicated support'],
  },
];

const METHODS = [
  { key: 'mtn_momo',      label: 'MTN MoMo' },
  { key: 'orange_money',  label: 'Orange Money' },
  { key: 'bank_transfer', label: 'Bank Transfer' },
];

// ── Step config ───────────────────────────────────────────────────────────────
const STEPS = [
  { icon: Palette,    label: 'Workspace', num: '01' },
  { icon: CreditCard, label: 'Plan',      num: '02' },
  { icon: Upload,     label: 'Payment',   num: '03' },
  { icon: Clock,      label: 'Pending',   num: '04' },
];

// ── StepBar ───────────────────────────────────────────────────────────────────
function StepBar({ current }: { current: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 44 }}>
      {STEPS.map((s, i) => {
        const Icon = s.icon;
        const done   = i < current;
        const active = i === current;
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 40, height: 40, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: done ? ACC : active ? SURF : 'rgba(255,255,255,0.5)',
                border: done ? 'none' : active ? `2px solid ${ACC}` : `1.5px solid ${RULE}`,
                boxShadow: active ? `0 0 0 4px rgba(201,79,44,0.12)` : 'none',
                transition: 'all 0.3s ease',
              }}>
                {done
                  ? <Check size={15} color={SURF} strokeWidth={2.5} />
                  : <Icon size={15} color={active ? ACC : INK3} strokeWidth={1.8} />
                }
              </div>
              <span style={{
                fontFamily: MONO, fontSize: 9.5, letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: active ? ACC : done ? INK2 : INK3,
                fontWeight: active ? 600 : 400,
              }}>{s.label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div style={{ width: 64, height: 1, margin: '0 6px', marginBottom: 28, position: 'relative', background: RULE, overflow: 'hidden' }}>
                <div style={{ position: 'absolute', inset: 0, background: ACC, width: i < current ? '100%' : '0%', transition: 'width 0.5s ease' }} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Shared field ──────────────────────────────────────────────────────────────
function Field({ label, id, type = 'text', value, onChange, placeholder, hint }: {
  label: string; id: string; type?: string; value: string;
  onChange: (v: string) => void; placeholder?: string; hint?: string;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div>
      <label htmlFor={id} style={{ display: 'block', fontFamily: MONO, fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: INK2, marginBottom: 8, fontWeight: 600 }}>
        {label}
      </label>
      <input id={id} type={type} value={value} placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={{
          width: '100%', padding: '11px 14px',
          background: focused ? SURF : 'rgba(255,255,255,0.6)',
          border: `1.5px solid ${focused ? ACC : RULE}`,
          borderRadius: 6, outline: 'none',
          color: INK, fontFamily: UI, fontSize: 14,
          transition: 'border-color 0.2s, background 0.2s',
          boxSizing: 'border-box',
          boxShadow: focused ? `0 0 0 3px rgba(201,79,44,0.08)` : 'none',
        }} />
      {hint && <p style={{ fontFamily: MONO, fontSize: 10, color: INK3, marginTop: 6, letterSpacing: '0.04em' }}>{hint}</p>}
    </div>
  );
}

// ── WizBtn ────────────────────────────────────────────────────────────────────
function WizBtn({ children, onClick, loading, disabled, variant = 'primary' }: {
  children: React.ReactNode; onClick?: () => void; loading?: boolean;
  disabled?: boolean; variant?: 'primary' | 'ghost';
}) {
  const [hover, setHover] = useState(false);
  if (variant === 'ghost') return (
    <button onClick={onClick} style={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: '0.1em', textTransform: 'uppercase', color: hover ? INK2 : INK3, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, transition: 'color 0.2s', padding: '2px 0' }}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
      {children}
    </button>
  );
  return (
    <button onClick={onClick} disabled={loading || disabled} style={{
      fontFamily: UI, fontSize: 12, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase',
      color: SURF, background: (loading || disabled) ? ACC2 : hover ? '#b33e1e' : ACC,
      padding: '12px 24px', borderRadius: 5, border: 'none',
      cursor: (loading || disabled) ? 'not-allowed' : 'pointer',
      transition: 'background 0.2s', display: 'flex', alignItems: 'center', gap: 8,
    }}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
      {loading
        ? <><span style={{ width: 11, height: 11, border: `2px solid rgba(255,252,248,0.3)`, borderTopColor: SURF, borderRadius: '50%', display: 'inline-block', animation: 'oz-spin 0.7s linear infinite' }} /> Processing…</>
        : children
      }
    </button>
  );
}

function GhostNum({ n }: { n: string }) {
  return (
    <div style={{ position: 'absolute', top: -16, right: -12, fontFamily: DISP, fontSize: 120, fontWeight: 300, color: 'rgba(201,79,44,0.06)', lineHeight: 1, userSelect: 'none', pointerEvents: 'none', letterSpacing: '-0.04em' }}>
      {n}
    </div>
  );
}

// ── Step 1: Workspace ─────────────────────────────────────────────────────────
function WorkspaceStep({ orgName, logoUrl, setLogoUrl, brandColor, setBrandColor, onNext, onSkip }: {
  orgName: string; logoUrl: string; setLogoUrl: (v: string) => void;
  brandColor: string; setBrandColor: (v: string) => void;
  onNext: () => Promise<void>; onSkip: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const swatches = ['#c94f2c','#7c3aed','#0891b2','#16a34a','#1d4ed8','#ea580c','#db2777','#1a1714'];

  return (
    <div style={{ position: 'relative', animation: 'oz-rise 0.4s ease forwards' }}>
      <GhostNum n="01" />
      <Tag>Workspace</Tag>
      <h2 style={{ fontFamily: DISP, fontSize: 30, fontWeight: 300, fontStyle: 'italic', color: INK, marginBottom: 8, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
        Make it <em style={{ color: ACC }}>yours.</em>
      </h2>
      <p style={{ fontFamily: UI, fontSize: 13.5, color: INK2, marginBottom: 32, lineHeight: 1.65 }}>
        Set your logo and brand color — your students will see this across their entire learning experience.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <Field label="Logo URL" id="logo" value={logoUrl} onChange={setLogoUrl}
          placeholder="https://yourschool.com/logo.png"
          hint="PNG or SVG · shown in the top navbar" />

        {logoUrl && (
          <div style={{ padding: '10px 14px', background: BG, border: `1px solid ${RULE}`, borderRadius: 6, display: 'inline-flex', alignItems: 'center', gap: 10 }}>
            <img src={logoUrl} alt="Preview" style={{ height: 28, objectFit: 'contain' }} />
            <span style={{ fontFamily: MONO, fontSize: 10, color: INK3, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Preview</span>
          </div>
        )}

        <div>
          <label style={{ display: 'block', fontFamily: MONO, fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: INK2, marginBottom: 10, fontWeight: 600 }}>Brand Colour</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <input type="color" value={brandColor} onChange={e => setBrandColor(e.target.value)}
              style={{ width: 40, height: 40, border: `1.5px solid ${RULE}`, borderRadius: 6, cursor: 'pointer', padding: 3, background: SURF, flexShrink: 0 }} />
            <input type="text" value={brandColor} onChange={e => setBrandColor(e.target.value)}
              style={{ width: 110, border: `1.5px solid ${RULE}`, borderRadius: 6, padding: '9px 12px', fontFamily: MONO, fontSize: 13, color: INK, background: SURF, outline: 'none' }} />
            <div style={{ width: 40, height: 40, borderRadius: 6, border: `1px solid ${RULE}`, background: brandColor, flexShrink: 0 }} />
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {swatches.map(c => (
              <button key={c} onClick={() => setBrandColor(c)} style={{
                width: 28, height: 28, borderRadius: 5, background: c,
                border: brandColor === c ? `2px solid ${INK}` : '2px solid transparent',
                cursor: 'pointer', transition: 'transform 0.15s',
                transform: brandColor === c ? 'scale(1.18)' : 'scale(1)',
              }} />
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 36, paddingTop: 24, borderTop: `1px solid ${RULE}` }}>
        <WizBtn variant="ghost" onClick={onSkip}>Skip for now</WizBtn>
        <WizBtn loading={saving} onClick={async () => { setSaving(true); await onNext(); setSaving(false); }}>
          Save &amp; Continue <ArrowRight size={13} />
        </WizBtn>
      </div>
    </div>
  );
}

// ── Step 2: Choose Plan ───────────────────────────────────────────────────────
function PlanStep({ selected, onSelect, onNext, onBack }: {
  selected: string; onSelect: (k: string) => void;
  onNext: () => void; onBack: () => void;
}) {
  return (
    <div style={{ position: 'relative', animation: 'oz-rise 0.4s ease forwards' }}>
      <GhostNum n="02" />
      <Tag>Choose Plan</Tag>
      <h2 style={{ fontFamily: DISP, fontSize: 30, fontWeight: 300, fontStyle: 'italic', color: INK, marginBottom: 8, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
        Pick your <em style={{ color: ACC }}>plan.</em>
      </h2>
      <p style={{ fontFamily: UI, fontSize: 13.5, color: INK2, marginBottom: 28, lineHeight: 1.65 }}>
        You keep 100% of what your students pay. No commissions, ever.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 8 }}>
        {PLANS.map(p => (
          <button
            key={p.key}
            onClick={() => onSelect(p.key)}
            style={{
              display: 'flex', alignItems: 'center', gap: 16,
              padding: '16px 20px',
              background: selected === p.key ? (p.highlight ? INK : SURF) : 'rgba(255,255,255,0.5)',
              border: `1.5px solid ${selected === p.key ? (p.highlight ? INK : ACC) : RULE}`,
              borderRadius: 6, cursor: 'pointer',
              transition: 'all 0.18s', textAlign: 'left',
              boxShadow: selected === p.key ? '0 2px 12px rgba(26,23,20,0.1)' : 'none',
            }}
          >
            {/* Radio dot */}
            <div style={{
              width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
              border: `2px solid ${selected === p.key ? ACC : RULE}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: selected === p.key ? ACC : 'transparent',
              transition: 'all 0.18s',
            }}>
              {selected === p.key && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff' }} />}
            </div>

            {/* Plan info */}
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 3 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: selected === p.key && p.highlight ? '#f2ede8' : INK }}>
                  {p.name}
                </span>
                {p.highlight && (
                  <span style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: ACC, background: 'rgba(201,79,44,0.1)', padding: '2px 8px', borderRadius: 100 }}>
                    Popular
                  </span>
                )}
              </div>
              <div style={{ fontSize: 12.5, color: selected === p.key && p.highlight ? 'rgba(255,255,255,0.55)' : INK3 }}>
                {p.desc}
              </div>
            </div>

            {/* Price */}
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontFamily: DISP, fontSize: 24, fontWeight: 400, color: selected === p.key && p.highlight ? '#f2ede8' : INK, lineHeight: 1 }}>
                {p.price}
              </div>
              <div style={{ fontFamily: MONO, fontSize: 10, color: selected === p.key && p.highlight ? 'rgba(255,255,255,0.35)' : INK3, marginTop: 2 }}>
                /month · ≈ {p.rwf}
              </div>
            </div>
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 28, paddingTop: 24, borderTop: `1px solid ${RULE}` }}>
        <WizBtn variant="ghost" onClick={onBack}><ArrowLeft size={12} /> Back</WizBtn>
        <WizBtn disabled={!selected} onClick={onNext}>
          Continue to Payment <ArrowRight size={13} />
        </WizBtn>
      </div>
    </div>
  );
}

// ── Step 3: Pay ───────────────────────────────────────────────────────────────
function PayStep({ plan, onDone, onBack }: {
  plan: string; onDone: () => void; onBack: () => void;
}) {
  const planInfo = PLANS.find(p => p.key === plan)!;
  const [method,  setMethod]  = useState('mtn_momo');
  const [phone,   setPhone]   = useState('');
  const [ref,     setRef]     = useState('');
  const [notes,   setNotes]   = useState('');
  const [file,    setFile]    = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [saving,  setSaving]  = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    const reader = new FileReader();
    reader.onload = ev => setPreview(ev.target?.result as string);
    reader.readAsDataURL(f);
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const form = new FormData();
      form.append('payment_type', 'teacher_subscription');
      form.append('payment_method', method);
      form.append('amount', String(planInfo.price.replace('$', '')));
      form.append('currency', 'USD');
      form.append('plan', plan);
      form.append('phone_number', phone);
      form.append('transaction_reference', ref);
      form.append('notes', notes);
      if (file) form.append('proof_image', file);
      await api.post('/payments/submit', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Payment submitted!');
      onDone();
    } catch {
      toast.error('Could not submit payment. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ position: 'relative', animation: 'oz-rise 0.4s ease forwards' }}>
      <GhostNum n="03" />
      <Tag>Payment</Tag>
      <h2 style={{ fontFamily: DISP, fontSize: 30, fontWeight: 300, fontStyle: 'italic', color: INK, marginBottom: 8, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
        Send &amp; <em style={{ color: ACC }}>confirm.</em>
      </h2>
      <p style={{ fontFamily: UI, fontSize: 13.5, color: INK2, marginBottom: 28, lineHeight: 1.65 }}>
        Send <strong style={{ color: INK }}>{planInfo.price}/month</strong> to the number below, then upload your confirmation screenshot.
      </p>

      {/* MoMo destination */}
      <div style={{ background: INK, borderRadius: 6, padding: '18px 22px', marginBottom: 24 }}>
        <div style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: 10 }}>
          MTN MoMo · Rwanda
        </div>
        <div style={{ fontFamily: DISP, fontSize: 34, fontWeight: 400, color: '#f2ede8', letterSpacing: '0.04em', lineHeight: 1 }}>
          0792104982
        </div>
        <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.45)', marginTop: 6 }}>
          Ngum Dieudonne · Nest Platform
        </div>
        <div style={{ marginTop: 12, display: 'inline-block', fontFamily: MONO, fontSize: 10, color: 'rgba(255,255,255,0.25)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4, padding: '4px 10px', letterSpacing: '0.08em' }}>
          {planInfo.name} plan · {planInfo.price}/mo · ≈ {planInfo.rwf}
        </div>
      </div>

      {/* Payment method */}
      <div style={{ marginBottom: 16 }}>
        <MonoLabel>Payment method</MonoLabel>
        <div style={{ display: 'flex', gap: 8 }}>
          {METHODS.map(m => (
            <button key={m.key} onClick={() => setMethod(m.key)} style={{
              padding: '8px 14px', borderRadius: 4,
              fontSize: 12.5, fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s',
              border: `1.5px solid ${method === m.key ? INK : RULE}`,
              background: method === m.key ? INK : SURF,
              color: method === m.key ? '#f2ede8' : INK2,
            }}>
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
        <div>
          <MonoLabel>Your phone (sent from)</MonoLabel>
          <SmallInput type="tel" placeholder="07XXXXXXXX" value={phone} onChange={e => setPhone(e.target.value)} />
        </div>
        <div>
          <MonoLabel>Transaction ref <span style={{ color: INK3, fontWeight: 400 }}>(optional)</span></MonoLabel>
          <SmallInput placeholder="MP2200XXXX" value={ref} onChange={e => setRef(e.target.value)} />
        </div>
      </div>

      {/* Screenshot upload */}
      <div style={{ marginBottom: 20 }}>
        <MonoLabel>Payment screenshot</MonoLabel>
        <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} style={{ display: 'none' }} />
        {preview ? (
          <div style={{ position: 'relative' }}>
            <img src={preview} alt="Proof" style={{ width: '100%', borderRadius: 6, border: `1px solid ${RULE}`, display: 'block', maxHeight: 200, objectFit: 'cover' }} />
            <button onClick={() => { setFile(null); setPreview(null); }}
              style={{ position: 'absolute', top: 8, right: 8, background: INK, color: '#fff', border: 'none', borderRadius: 4, padding: '3px 10px', fontSize: 11, cursor: 'pointer' }}>
              Remove
            </button>
          </div>
        ) : (
          <button onClick={() => fileRef.current?.click()} style={{
            width: '100%', padding: '24px 20px',
            background: 'rgba(255,255,255,0.5)', border: `2px dashed ${RULE}`,
            borderRadius: 6, cursor: 'pointer',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
            transition: 'border-color 0.2s',
          }}
            onMouseEnter={e => ((e.currentTarget as HTMLElement).style.borderColor = INK3)}
            onMouseLeave={e => ((e.currentTarget as HTMLElement).style.borderColor = RULE)}>
            <Upload size={20} style={{ color: INK3 }} strokeWidth={1.5} />
            <span style={{ fontSize: 13, fontWeight: 600, color: INK }}>Upload screenshot</span>
            <span style={{ fontFamily: MONO, fontSize: 10, color: INK3, letterSpacing: '0.06em', textTransform: 'uppercase' }}>JPG · PNG · WEBP</span>
          </button>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 24, borderTop: `1px solid ${RULE}` }}>
        <WizBtn variant="ghost" onClick={onBack}><ArrowLeft size={12} /> Back</WizBtn>
        <WizBtn loading={saving} onClick={handleSubmit}>
          Submit Proof <ArrowRight size={13} />
        </WizBtn>
      </div>
    </div>
  );
}

// ── Step 4: Pending ───────────────────────────────────────────────────────────
function PendingStep({ orgName, plan, onGoToDashboard }: {
  orgName: string; plan: string; onGoToDashboard: () => void;
}) {
  const planInfo = PLANS.find(p => p.key === plan);
  return (
    <div style={{ position: 'relative', textAlign: 'center', animation: 'oz-rise 0.4s ease forwards' }}>
      <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 180, height: 180, background: 'radial-gradient(circle, rgba(201,122,44,0.1) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />

      {/* Clock icon */}
      <div style={{ width: 72, height: 72, borderRadius: '50%', background: WARN, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', position: 'relative', boxShadow: `0 8px 32px rgba(201,122,44,0.25)` }}>
        <Clock size={28} color={SURF} strokeWidth={1.8} />
      </div>

      <div style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: '0.18em', textTransform: 'uppercase', color: WARN, marginBottom: 12 }}>
        Under Review
      </div>
      <h2 style={{ fontFamily: DISP, fontSize: 32, fontWeight: 300, fontStyle: 'italic', color: INK, marginBottom: 10, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
        We got your <em style={{ color: WARN }}>payment.</em>
      </h2>
      <p style={{ fontFamily: UI, fontSize: 13.5, color: INK2, marginBottom: 32, lineHeight: 1.7, maxWidth: 380, margin: '0 auto 32px' }}>
        We'll verify your payment and activate your workspace within <strong style={{ color: INK }}>24 hours</strong>. You'll receive a confirmation once it's done.
      </p>

      {/* Summary */}
      <div style={{ background: BG, border: `1px solid ${RULE}`, borderRadius: 6, padding: '16px 24px', maxWidth: 320, margin: '0 auto 32px', textAlign: 'left' }}>
        <div style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: '0.14em', textTransform: 'uppercase', color: INK3, marginBottom: 12 }}>Summary</div>
        <Row label="Workspace" value={orgName} />
        <Row label="Plan" value={planInfo ? `${planInfo.name} · ${planInfo.price}/mo` : plan} />
        <Row label="Payment to" value="Ngum Dieudonne · 0792104982" />
        <Row label="Status" value="Pending verification" accent={WARN} />
      </div>

      <p style={{ fontFamily: MONO, fontSize: 11, color: INK3, letterSpacing: '0.06em', marginBottom: 28 }}>
        Questions? Email <a href="mailto:dieudonnen450@gmail.com" style={{ color: ACC, textDecoration: 'none' }}>dieudonnen450@gmail.com</a>
      </p>

      <WizBtn onClick={onGoToDashboard}>
        Go to Dashboard <ArrowRight size={13} />
      </WizBtn>
    </div>
  );
}

// ── Main Wizard ───────────────────────────────────────────────────────────────
export default function OnboardingWizard() {
  const navigate = useNavigate();
  const { organization, user, setAuth } = useAuthStore();

  const [step,       setStep]       = useState(0);
  const [logoUrl,    setLogoUrl]    = useState(organization?.logo_url ?? '');
  const [brandColor, setBrandColor] = useState(organization?.brand_color ?? '#c94f2c');
  const [plan,       setPlan]       = useState('professional');

  const saveBranding = async () => {
    try {
      const { data } = await api.put<Organization>('/organizations/mine', {
        logo_url: logoUrl.trim() || undefined,
        brand_color: brandColor,
      });
      const token = localStorage.getItem('nest_token') ?? '';
      if (user) setAuth(user, token, data);
    } catch {
      toast.error('Could not save branding — continuing anyway');
    }
    setStep(1);
  };

  return (
    <div style={{ minHeight: '100vh', background: BG, fontFamily: UI, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 16px', position: 'relative', overflow: 'hidden' }}>

      {/* Background grid */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', backgroundImage: 'repeating-linear-gradient(90deg,rgba(26,23,20,0.025) 0,rgba(26,23,20,0.025) 1px,transparent 1px,transparent 60px),repeating-linear-gradient(0deg,rgba(26,23,20,0.025) 0,rgba(26,23,20,0.025) 1px,transparent 1px,transparent 60px)' }} />
      <div style={{ position: 'fixed', top: '20%', left: '50%', transform: 'translateX(-50%)', width: 600, height: 400, background: 'radial-gradient(ellipse, rgba(201,79,44,0.06) 0%, transparent 65%)', pointerEvents: 'none' }} />

      <div style={{ width: '100%', maxWidth: 560, position: 'relative', zIndex: 1 }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 9, background: SURF, border: `1px solid ${RULE}`, borderRadius: 40, padding: '7px 18px 7px 10px', boxShadow: '0 1px 4px rgba(26,23,20,0.06)', marginBottom: 16 }}>
            <div style={{ width: 26, height: 26, background: ACC, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: UI, fontSize: 13, fontWeight: 800, color: SURF }}>N</div>
            <span style={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: '0.14em', textTransform: 'uppercase', color: INK2 }}>Setup Wizard</span>
          </div>
          <p style={{ fontFamily: UI, fontSize: 13.5, color: INK2 }}>
            Get <strong style={{ color: INK, fontWeight: 700 }}>{organization?.name ?? 'your workspace'}</strong> live in 3 quick steps.
          </p>
        </div>

        <StepBar current={step} />

        {/* Card */}
        <div style={{ background: SURF, borderRadius: 8, border: `1px solid ${RULE}`, boxShadow: '0 4px 24px rgba(26,23,20,0.08)', padding: '40px 44px', overflow: 'hidden', position: 'relative' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${ACC} ${((step + 1) / STEPS.length) * 100}%, ${RULE} ${((step + 1) / STEPS.length) * 100}%)`, transition: 'background 0.6s ease' }} />

          {step === 0 && (
            <WorkspaceStep
              orgName={organization?.name ?? ''}
              logoUrl={logoUrl} setLogoUrl={setLogoUrl}
              brandColor={brandColor} setBrandColor={setBrandColor}
              onNext={saveBranding} onSkip={() => setStep(1)}
            />
          )}
          {step === 1 && (
            <PlanStep
              selected={plan} onSelect={setPlan}
              onNext={() => setStep(2)} onBack={() => setStep(0)}
            />
          )}
          {step === 2 && (
            <PayStep
              plan={plan}
              onDone={() => setStep(3)}
              onBack={() => setStep(1)}
            />
          )}
          {step === 3 && (
            <PendingStep
              orgName={organization?.name ?? 'Your workspace'}
              plan={plan}
              onGoToDashboard={() => navigate('/admin')}
            />
          )}
        </div>

        {step < 3 && (
          <p style={{ textAlign: 'center', marginTop: 20 }}>
            <button onClick={() => navigate('/admin')}
              style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: INK3, background: 'none', border: 'none', cursor: 'pointer', transition: 'color 0.2s' }}
              onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = INK2)}
              onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = INK3)}>
              Skip setup → go to dashboard
            </button>
          </p>
        )}
      </div>

      <style>{`
        @keyframes oz-spin { to { transform: rotate(360deg); } }
        @keyframes oz-rise { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}

// ── Tiny helpers ──────────────────────────────────────────────────────────────
function Tag({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: '0.18em', textTransform: 'uppercase', color: ACC, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 7 }}>
      <span style={{ width: 16, height: 1, background: ACC, display: 'inline-block' }} />
      {children}
    </div>
  );
}

function MonoLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: INK2, marginBottom: 7, fontWeight: 600 }}>
      {children}
    </div>
  );
}

function SmallInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const [focused, setFocused] = useState(false);
  return (
    <input {...props}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{
        width: '100%', padding: '10px 12px',
        fontSize: 13.5, fontFamily: UI, color: INK,
        background: focused ? SURF : 'rgba(255,255,255,0.6)',
        border: `1.5px solid ${focused ? ACC : RULE}`,
        borderRadius: 5, outline: 'none',
        boxSizing: 'border-box',
        transition: 'border-color 0.2s',
      }} />
  );
}

function Row({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
      <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: INK3 }}>{label}</span>
      <span style={{ fontSize: 12.5, fontWeight: 600, color: accent ?? INK }}>{value}</span>
    </div>
  );
}
