import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Palette, BookOpen, Users, Rocket, Check,
  ArrowRight, ArrowLeft, Plus, X, Sparkles,
} from 'lucide-react';
import api from '../../api/client';
import { useAuthStore } from '../../store';
import type { Organization, UserRole } from '../../types';
import toast from 'react-hot-toast';

// ── Design tokens ────────────────────────────────────────────────────────────
const BG   = '#f2ede8';
const SURF = '#fffcf8';
const INK  = '#1a1714';
const INK2 = '#5a524a';
const INK3 = '#9a8e84';
const RULE = '#d4cdc6';
const ACC  = '#c94f2c';
const ACC2 = '#e07a5f';
const GO   = '#4a7c59';
const DISP = "'Fraunces', Georgia, serif";
const UI   = "'Syne', 'Inter', sans-serif";
const MONO = "'Inconsolata', monospace";

// ── Types ────────────────────────────────────────────────────────────────────
interface InviteRow { id: number; email: string; role: UserRole; }

// ── Step config ──────────────────────────────────────────────────────────────
const STEPS = [
  { icon: Palette,  label: 'Branding',      num: '01' },
  { icon: BookOpen, label: 'First Course',   num: '02' },
  { icon: Users,    label: 'Invite Team',    num: '03' },
  { icon: Rocket,   label: 'Launch',         num: '04' },
];

// ── StepBar ──────────────────────────────────────────────────────────────────
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
              {/* Circle */}
              <div style={{
                width: 40, height: 40, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: done ? ACC : active ? SURF : 'rgba(255,255,255,0.5)',
                border: done ? 'none' : active ? `2px solid ${ACC}` : `1.5px solid ${RULE}`,
                boxShadow: active ? `0 0 0 4px rgba(201,79,44,0.12)` : 'none',
                transition: 'all 0.3s ease',
                position: 'relative',
              }}>
                {done
                  ? <Check size={15} color={SURF} strokeWidth={2.5} />
                  : <Icon size={15} color={active ? ACC : INK3} strokeWidth={1.8} />
                }
              </div>
              {/* Label */}
              <span style={{
                fontFamily: MONO, fontSize: 9.5, letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: active ? ACC : done ? INK2 : INK3,
                fontWeight: active ? 600 : 400,
              }}>{s.label}</span>
            </div>
            {/* Connector */}
            {i < STEPS.length - 1 && (
              <div style={{ width: 80, height: 1, margin: '0 6px', marginBottom: 28, position: 'relative', background: RULE, overflow: 'hidden' }}>
                <div style={{
                  position: 'absolute', inset: 0,
                  background: ACC,
                  width: i < current ? '100%' : '0%',
                  transition: 'width 0.5s ease',
                }} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Field component ──────────────────────────────────────────────────────────
function Field({
  label, id, type = 'text', value, onChange, placeholder, required, autoFocus, hint, as,
}: {
  label: string; id: string; type?: string; value: string;
  onChange: (v: string) => void; placeholder?: string;
  required?: boolean; autoFocus?: boolean; hint?: string;
  as?: 'textarea';
}) {
  const [focused, setFocused] = useState(false);
  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '11px 14px',
    background: focused ? SURF : 'rgba(255,255,255,0.6)',
    border: `1.5px solid ${focused ? ACC : RULE}`,
    borderRadius: 6, outline: 'none',
    color: INK, fontFamily: UI, fontSize: 14,
    transition: 'border-color 0.2s, background 0.2s',
    boxSizing: 'border-box',
    boxShadow: focused ? `0 0 0 3px rgba(201,79,44,0.08)` : 'none',
    resize: as === 'textarea' ? 'none' : undefined,
  };
  return (
    <div>
      <label htmlFor={id} style={{ display: 'block', fontFamily: MONO, fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: INK2, marginBottom: 8, fontWeight: 600 }}>
        {label}{required && <span style={{ color: ACC, marginLeft: 4 }}>*</span>}
      </label>
      {as === 'textarea'
        ? <textarea id={id} value={value} placeholder={placeholder} rows={3}
            onChange={e => onChange(e.target.value)}
            onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
            style={inputStyle} />
        : <input id={id} type={type} value={value} required={required} autoFocus={autoFocus}
            placeholder={placeholder}
            onChange={e => onChange(e.target.value)}
            onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
            style={inputStyle} />
      }
      {hint && <p style={{ fontFamily: MONO, fontSize: 10, color: INK3, marginTop: 6, letterSpacing: '0.04em' }}>{hint}</p>}
    </div>
  );
}

// ── WizBtn ───────────────────────────────────────────────────────────────────
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
      color: SURF, background: loading ? ACC2 : hover ? '#b33e1e' : ACC,
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

// ── Step ghost number ────────────────────────────────────────────────────────
function GhostNum({ n }: { n: string }) {
  return (
    <div style={{ position: 'absolute', top: -16, right: -12, fontFamily: DISP, fontSize: 120, fontWeight: 300, color: 'rgba(201,79,44,0.06)', lineHeight: 1, userSelect: 'none', pointerEvents: 'none', letterSpacing: '-0.04em' }}>
      {n}
    </div>
  );
}

// ── Step 1: Branding ─────────────────────────────────────────────────────────
function BrandingStep({ orgName, logoUrl, setLogoUrl, brandColor, setBrandColor, onNext, onSkip }: {
  orgName: string; logoUrl: string; setLogoUrl: (v: string) => void;
  brandColor: string; setBrandColor: (v: string) => void;
  onNext: () => Promise<void>; onSkip: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const swatches = ['#c94f2c','#7c3aed','#0891b2','#16a34a','#1d4ed8','#ea580c','#db2777','#1a1714'];

  return (
    <div style={{ position: 'relative', animation: 'oz-rise 0.4s ease forwards' }}>
      <GhostNum n="01" />
      <div style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: '0.18em', textTransform: 'uppercase', color: ACC, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 7 }}>
        <span style={{ width: 16, height: 1, background: ACC, display: 'inline-block' }} />
        Branding
      </div>
      <h2 style={{ fontFamily: DISP, fontSize: 30, fontWeight: 300, fontStyle: 'italic', color: INK, marginBottom: 8, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
        Make it <em style={{ color: ACC }}>yours.</em>
      </h2>
      <p style={{ fontFamily: UI, fontSize: 13.5, color: INK2, marginBottom: 32, lineHeight: 1.65 }}>
        Your logo and brand color will appear across your team's entire experience in Nest.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <Field label="Company Logo URL" id="logo" value={logoUrl} onChange={setLogoUrl}
          placeholder="https://yourcompany.com/logo.png"
          hint="PNG or SVG recommended · Displayed in the navbar" />

        {logoUrl && (
          <div style={{ padding: '10px 14px', background: BG, border: `1px solid ${RULE}`, borderRadius: 6, display: 'inline-flex', alignItems: 'center', gap: 10 }}>
            <img src={logoUrl} alt="Preview" style={{ height: 28, objectFit: 'contain' }} onError={() => {}} />
            <span style={{ fontFamily: MONO, fontSize: 10, color: INK3, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Preview</span>
          </div>
        )}

        <div>
          <label style={{ display: 'block', fontFamily: MONO, fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: INK2, marginBottom: 10, fontWeight: 600 }}>Brand Color</label>
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
                cursor: 'pointer', transition: 'transform 0.15s, border-color 0.15s',
                transform: brandColor === c ? 'scale(1.18)' : 'scale(1)',
              }}
                onMouseEnter={e => { if (brandColor !== c) (e.currentTarget as HTMLElement).style.transform = 'scale(1.12)'; }}
                onMouseLeave={e => { if (brandColor !== c) (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }} />
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

// ── Step 2: First Course ──────────────────────────────────────────────────────
function CourseStep({ onNext, onBack, onSkip }: {
  onNext: (title: string, description: string) => Promise<void>;
  onBack: () => void; onSkip: () => void;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const chips = ['Company Values & Culture', 'Product Overview', 'Security & Compliance', 'Tools & Processes', 'Team Introduction'];

  return (
    <div style={{ position: 'relative', animation: 'oz-rise 0.4s ease forwards' }}>
      <GhostNum n="02" />
      <div style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: '0.18em', textTransform: 'uppercase', color: ACC, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 7 }}>
        <span style={{ width: 16, height: 1, background: ACC, display: 'inline-block' }} />
        First Course
      </div>
      <h2 style={{ fontFamily: DISP, fontSize: 30, fontWeight: 300, fontStyle: 'italic', color: INK, marginBottom: 8, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
        Your first <em style={{ color: ACC }}>lesson.</em>
      </h2>
      <p style={{ fontFamily: UI, fontSize: 13.5, color: INK2, marginBottom: 32, lineHeight: 1.65 }}>
        What's the first thing you want to onboard your team with? Videos and quizzes can be added after setup.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <Field label="Course title" id="title" value={title} onChange={setTitle}
          placeholder="e.g. Company Values & Culture" required autoFocus />
        <Field label="Description" id="desc" as="textarea" value={description} onChange={setDescription}
          placeholder="Briefly describe what new hires will learn…" />

        <div>
          <p style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: '0.12em', textTransform: 'uppercase', color: INK3, marginBottom: 10 }}>Popular Choices</p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {chips.map(s => (
              <ChipBtn key={s} active={title === s} onClick={() => setTitle(s)}>{s}</ChipBtn>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 36, paddingTop: 24, borderTop: `1px solid ${RULE}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <WizBtn variant="ghost" onClick={onBack}><ArrowLeft size={12} /> Back</WizBtn>
          <WizBtn variant="ghost" onClick={onSkip}>Skip</WizBtn>
        </div>
        <WizBtn loading={saving} onClick={async () => {
          if (!title.trim()) { toast.error('Course title is required'); return; }
          setSaving(true); await onNext(title.trim(), description.trim()); setSaving(false);
        }}>
          Create Course <ArrowRight size={13} />
        </WizBtn>
      </div>
    </div>
  );
}

// ── Chip button ───────────────────────────────────────────────────────────────
function ChipBtn({ children, onClick, active }: { children: React.ReactNode; onClick: () => void; active?: boolean }) {
  const [hover, setHover] = useState(false);
  return (
    <button onClick={onClick} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        fontFamily: MONO, fontSize: 11, letterSpacing: '0.04em',
        color: active ? ACC : hover ? INK : INK2,
        background: active ? 'rgba(201,79,44,0.07)' : hover ? BG : 'transparent',
        border: `1px solid ${active ? ACC : hover ? RULE : RULE}`,
        borderRadius: 4, padding: '6px 12px', cursor: 'pointer',
        transition: 'all 0.18s',
      }}>
      {children}
    </button>
  );
}

// ── Step 3: Invite Team ───────────────────────────────────────────────────────
let _rowId = 0;
const nextId = () => ++_rowId;

function InviteStep({ onNext, onBack, onSkip }: {
  onNext: (rows: InviteRow[]) => Promise<void>; onBack: () => void; onSkip: () => void;
}) {
  const [rows, setRows] = useState<InviteRow[]>([{ id: nextId(), email: '', role: 'employee' }]);
  const [sending, setSending] = useState(false);

  const addRow = () => setRows(r => [...r, { id: nextId(), email: '', role: 'employee' }]);
  const removeRow = (id: number) => setRows(r => r.filter(x => x.id !== id));
  const updateRow = (id: number, field: keyof InviteRow, value: string) =>
    setRows(r => r.map(x => x.id === id ? { ...x, [field]: value } : x));

  return (
    <div style={{ position: 'relative', animation: 'oz-rise 0.4s ease forwards' }}>
      <GhostNum n="03" />
      <div style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: '0.18em', textTransform: 'uppercase', color: ACC, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 7 }}>
        <span style={{ width: 16, height: 1, background: ACC, display: 'inline-block' }} />
        Invite Team
      </div>
      <h2 style={{ fontFamily: DISP, fontSize: 30, fontWeight: 300, fontStyle: 'italic', color: INK, marginBottom: 8, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
        Build your <em style={{ color: ACC }}>flock.</em>
      </h2>
      <p style={{ fontFamily: UI, fontSize: 13.5, color: INK2, marginBottom: 32, lineHeight: 1.65 }}>
        Each person will receive an email with a 7-day invite link to set up their Nest account.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {rows.map((row) => (
          <div key={row.id} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <InviteEmailInput value={row.email} onChange={v => updateRow(row.id, 'email', v)} />
            <select value={row.role} onChange={e => updateRow(row.id, 'role', e.target.value as UserRole)}
              style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', color: INK, background: SURF, border: `1.5px solid ${RULE}`, borderRadius: 5, padding: '10px 10px', flexShrink: 0, outline: 'none', cursor: 'pointer' }}>
              <option value="employee">Employee</option>
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
            </select>
            {rows.length > 1 && (
              <button onClick={() => removeRow(row.id)}
                style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: `1px solid ${RULE}`, borderRadius: 5, cursor: 'pointer', color: INK3, transition: 'color 0.2s, border-color 0.2s', flexShrink: 0 }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#c94f2c'; (e.currentTarget as HTMLElement).style.borderColor = '#c94f2c'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = INK3; (e.currentTarget as HTMLElement).style.borderColor = RULE; }}>
                <X size={13} />
              </button>
            )}
          </div>
        ))}

        <button onClick={addRow} style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: MONO, fontSize: 10.5, letterSpacing: '0.1em', textTransform: 'uppercase', color: ACC, background: 'none', border: 'none', cursor: 'pointer', paddingLeft: 2, marginTop: 4 }}
          onMouseEnter={e => ((e.currentTarget as HTMLElement).style.opacity = '0.7')}
          onMouseLeave={e => ((e.currentTarget as HTMLElement).style.opacity = '1')}>
          <Plus size={12} /> Add another person
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 36, paddingTop: 24, borderTop: `1px solid ${RULE}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <WizBtn variant="ghost" onClick={onBack}><ArrowLeft size={12} /> Back</WizBtn>
          <WizBtn variant="ghost" onClick={onSkip}>Skip</WizBtn>
        </div>
        <WizBtn loading={sending} onClick={async () => {
          const valid = rows.filter(r => r.email.trim() && r.email.includes('@'));
          if (valid.length === 0) { onSkip(); return; }
          setSending(true); await onNext(valid); setSending(false);
        }}>
          Send Invites <ArrowRight size={13} />
        </WizBtn>
      </div>
    </div>
  );
}

function InviteEmailInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [focused, setFocused] = useState(false);
  return (
    <input type="email" value={value} placeholder="colleague@company.com"
      onChange={e => onChange(e.target.value)}
      onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
      style={{
        flex: 1, padding: '10px 14px', fontFamily: UI, fontSize: 13.5, color: INK,
        background: focused ? SURF : 'rgba(255,255,255,0.6)',
        border: `1.5px solid ${focused ? ACC : RULE}`,
        borderRadius: 5, outline: 'none',
        boxShadow: focused ? `0 0 0 3px rgba(201,79,44,0.08)` : 'none',
        transition: 'all 0.2s',
      }} />
  );
}

// ── Step 4: Launch ────────────────────────────────────────────────────────────
function DoneStep({ orgName, coursesCreated, invitesSent, onLaunch }: {
  orgName: string; coursesCreated: number; invitesSent: number; onLaunch: () => void;
}) {
  const [barWidth, setBarWidth] = useState(0);
  useEffect(() => { const t = setTimeout(() => setBarWidth(100), 200); return () => clearTimeout(t); }, []);

  return (
    <div style={{ position: 'relative', textAlign: 'center', animation: 'oz-rise 0.4s ease forwards' }}>
      {/* Ambient glow behind icon */}
      <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 180, height: 180, background: 'radial-gradient(circle, rgba(201,79,44,0.12) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />

      {/* Rocket icon */}
      <div style={{ width: 72, height: 72, borderRadius: '50%', background: ACC, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', position: 'relative', boxShadow: `0 8px 32px rgba(201,79,44,0.3)` }}>
        <Rocket size={28} color={SURF} />
      </div>

      {/* Heading */}
      <div style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: '0.18em', textTransform: 'uppercase', color: GO, marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
        <Sparkles size={11} color={GO} />
        All systems go
        <Sparkles size={11} color={GO} />
      </div>
      <h2 style={{ fontFamily: DISP, fontSize: 34, fontWeight: 300, fontStyle: 'italic', color: INK, marginBottom: 10, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
        <em style={{ color: ACC }}>{orgName}</em> is ready<br />to take flight.
      </h2>
      <p style={{ fontFamily: UI, fontSize: 13.5, color: INK2, marginBottom: 36 }}>
        Your workspace is fully configured.
      </p>

      {/* KPI grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1px', background: RULE, borderRadius: 6, overflow: 'hidden', maxWidth: 340, margin: '0 auto 32px' }}>
        <div style={{ background: SURF, padding: '20px 24px', textAlign: 'center' }}>
          <div style={{ fontFamily: DISP, fontSize: 38, fontWeight: 300, fontStyle: 'italic', color: ACC, lineHeight: 1 }}>{coursesCreated}</div>
          <div style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: '0.14em', textTransform: 'uppercase', color: INK3, marginTop: 6 }}>Course{coursesCreated !== 1 ? 's' : ''} Created</div>
        </div>
        <div style={{ background: SURF, padding: '20px 24px', textAlign: 'center' }}>
          <div style={{ fontFamily: DISP, fontSize: 38, fontWeight: 300, fontStyle: 'italic', color: GO, lineHeight: 1 }}>{invitesSent}</div>
          <div style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: '0.14em', textTransform: 'uppercase', color: INK3, marginTop: 6 }}>Invite{invitesSent !== 1 ? 's' : ''} Sent</div>
        </div>
      </div>

      {/* Growing bar */}
      <div style={{ height: 2, background: RULE, borderRadius: 2, maxWidth: 340, margin: '0 auto 32px', overflow: 'hidden' }}>
        <div style={{ height: '100%', background: ACC, width: `${barWidth}%`, transition: 'width 1.8s cubic-bezier(0.4,0,0.2,1)', borderRadius: 2 }} />
      </div>

      <WizBtn onClick={onLaunch}>
        Open Dashboard <ArrowRight size={13} />
      </WizBtn>
    </div>
  );
}

// ── Main wizard ───────────────────────────────────────────────────────────────
export default function OnboardingWizard() {
  const navigate = useNavigate();
  const { organization, user, setAuth } = useAuthStore();

  const [step, setStep] = useState(0);
  const [logoUrl, setLogoUrl] = useState(organization?.logo_url ?? '');
  const [brandColor, setBrandColor] = useState(organization?.brand_color ?? '#c94f2c');
  const [coursesCreated, setCoursesCreated] = useState(0);
  const [invitesSent, setInvitesSent] = useState(0);

  const saveBranding = async () => {
    try {
      const { data } = await api.put<Organization>('/organizations/mine', {
        logo_url: logoUrl.trim() || undefined,
        brand_color: brandColor,
      });
      const token = localStorage.getItem('nest_token') ?? '';
      if (user) setAuth(user, token, data);
    } catch {
      toast.error('Could not save branding');
    }
    setStep(1);
  };

  const createCourse = async (title: string, description: string) => {
    try {
      await api.post('/modules', { title, description, order_index: 0 });
      setCoursesCreated(1);
      toast.success('Course created!');
    } catch {
      toast.error('Could not create course');
    }
    setStep(2);
  };

  const sendInvites = async (rows: InviteRow[]) => {
    let sent = 0;
    for (const row of rows) {
      try {
        await api.post('/invitations', { email: row.email, role: row.role });
        sent++;
      } catch {
        toast.error(`Could not invite ${row.email}`);
      }
    }
    if (sent > 0) { toast.success(`${sent} invite${sent > 1 ? 's' : ''} sent!`); setInvitesSent(sent); }
    setStep(3);
  };

  return (
    <div style={{ minHeight: '100vh', background: BG, fontFamily: UI, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 16px', position: 'relative', overflow: 'hidden' }}>

      {/* Background grid */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', backgroundImage: 'repeating-linear-gradient(90deg,rgba(26,23,20,0.025) 0,rgba(26,23,20,0.025) 1px,transparent 1px,transparent 60px),repeating-linear-gradient(0deg,rgba(26,23,20,0.025) 0,rgba(26,23,20,0.025) 1px,transparent 1px,transparent 60px)' }} />

      {/* Ambient glow */}
      <div style={{ position: 'fixed', top: '20%', left: '50%', transform: 'translateX(-50%)', width: 600, height: 400, background: 'radial-gradient(ellipse, rgba(201,79,44,0.06) 0%, transparent 65%)', pointerEvents: 'none' }} />

      <div style={{ width: '100%', maxWidth: 560, position: 'relative', zIndex: 1 }}>

        {/* Header badge */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 9, background: SURF, border: `1px solid ${RULE}`, borderRadius: 40, padding: '7px 18px 7px 10px', boxShadow: '0 1px 4px rgba(26,23,20,0.06)', marginBottom: 16 }}>
            <div style={{ width: 26, height: 26, background: ACC, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: UI, fontSize: 13, fontWeight: 800, color: SURF }}>N</div>
            <span style={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: '0.14em', textTransform: 'uppercase', color: INK2 }}>Setup Wizard</span>
          </div>
          <p style={{ fontFamily: UI, fontSize: 13.5, color: INK2 }}>
            Let's get{' '}
            <strong style={{ color: INK, fontWeight: 700 }}>{organization?.name ?? 'your workspace'}</strong>
            {' '}ready in 2 minutes.
          </p>
        </div>

        {/* Step bar */}
        <StepBar current={step} />

        {/* Card */}
        <div style={{ background: SURF, borderRadius: 8, border: `1px solid ${RULE}`, boxShadow: '0 4px 24px rgba(26,23,20,0.08), 0 1px 4px rgba(26,23,20,0.04)', padding: '40px 44px', overflow: 'hidden', position: 'relative' }}>

          {/* Top accent line */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${ACC} ${((step + 1) / STEPS.length) * 100}%, ${RULE} ${((step + 1) / STEPS.length) * 100}%)`, transition: 'background 0.6s ease' }} />

          {step === 0 && <BrandingStep orgName={organization?.name ?? ''} logoUrl={logoUrl} setLogoUrl={setLogoUrl} brandColor={brandColor} setBrandColor={setBrandColor} onNext={saveBranding} onSkip={() => setStep(1)} />}
          {step === 1 && <CourseStep onNext={createCourse} onBack={() => setStep(0)} onSkip={() => setStep(2)} />}
          {step === 2 && <InviteStep onNext={sendInvites} onBack={() => setStep(1)} onSkip={() => setStep(3)} />}
          {step === 3 && <DoneStep orgName={organization?.name ?? 'Your workspace'} coursesCreated={coursesCreated} invitesSent={invitesSent} onLaunch={() => navigate('/admin')} />}
        </div>

        {/* Bail-out */}
        {step < 3 && (
          <p style={{ textAlign: 'center', marginTop: 20 }}>
            <button onClick={() => navigate('/admin')} style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: INK3, background: 'none', border: 'none', cursor: 'pointer', transition: 'color 0.2s' }}
              onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = INK2)}
              onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = INK3)}>
              Skip setup and go straight to dashboard →
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
