import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { User, Lock, Shield, LogOut, Check, Mail, Briefcase, Image as ImageIcon } from 'lucide-react';
import api from '../api/client';
import { useAuthStore } from '../store';
import Avatar from '../components/UI/Avatar';
import toast from 'react-hot-toast';
import type { User as UserType } from '../types';

// ── Design tokens — theme-aware (follow light/dark via CSS vars) ────────────
const ACC    = 'var(--c-acc)';
const BG      = 'var(--c-bg)';
const SURF     = 'var(--c-surf)';
const RAISE    = 'var(--c-bg2)';
const INK     = 'var(--c-ink)';
const INK2    = 'var(--c-ink2)';
const INK3    = 'var(--c-ink3)';
const BORDER  = 'var(--c-rule)';
const OK      = 'var(--c-ok)';
const DISP    = "'Cormorant Garamond', Georgia, serif";
const UIFONT  = "'Inter Tight', 'Inter', system-ui, sans-serif";
const MONO    = "'DM Mono', ui-monospace, monospace";

export default function ProfilePage() {
  const { user, updateUser, clearAuth } = useAuthStore();
  const navigate = useNavigate();

  const [name, setName] = useState(user?.full_name ?? '');
  const [department, setDepartment] = useState(user?.department ?? '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url ?? '');

  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');

  const saveProfile = useMutation({
    mutationFn: () =>
      api.put<UserType>('/auth/me', {
        full_name: name.trim() || undefined,
        department: department.trim() || undefined,
        avatar_url: avatarUrl.trim() || undefined,
      }).then(r => r.data),
    onSuccess: (updated) => {
      updateUser(updated);
      toast.success('Profile updated');
    },
    onError: (e: any) => toast.error(e?.response?.data?.detail || 'Failed to save'),
  });

  const changePassword = useMutation({
    mutationFn: () =>
      api.post('/auth/change-password', {
        current_password: currentPw,
        new_password: newPw,
      }),
    onSuccess: () => {
      toast.success('Password changed');
      setCurrentPw('');
      setNewPw('');
      setConfirmPw('');
    },
    onError: (e: any) => toast.error(e?.response?.data?.detail || 'Failed to change password'),
  });

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPw !== confirmPw) { toast.error('New passwords do not match'); return; }
    if (newPw.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    changePassword.mutate();
  };

  const handleSignOut = () => { clearAuth(); navigate('/login'); };

  const previewName = name.trim() || (user?.full_name ?? '');

  return (
    <div style={{ background: BG, minHeight: '100dvh', fontFamily: UIFONT }}>
      <div className="admin-page-content" style={{ maxWidth: 640, margin: '0 auto', padding: '0 0 40px' }}>

        {/* ── Hero header — a real app profile top ── */}
        <div style={{ position: 'relative', overflow: 'hidden', paddingBottom: 4 }}>
          {/* Ambient glow */}
          <div aria-hidden style={{
            position: 'absolute', top: -80, left: '50%', transform: 'translateX(-50%)',
            width: 340, height: 260,
            background: 'radial-gradient(ellipse, color-mix(in srgb, var(--c-acc) 24%, transparent) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />
          <div style={{ position: 'relative', textAlign: 'center', padding: 'clamp(28px,8vw,44px) 20px 24px' }}>
            <div style={{
              display: 'inline-flex', borderRadius: '50%', padding: 3,
              background: 'linear-gradient(135deg, var(--c-acc), var(--c-gold))',
              boxShadow: '0 8px 30px -8px color-mix(in srgb, var(--c-acc) 60%, transparent)',
            }}>
              <div style={{ borderRadius: '50%', border: `3px solid ${BG}` }}>
                <Avatar name={previewName} url={avatarUrl || null} className="!w-[86px] !h-[86px] !text-2xl" />
              </div>
            </div>
            <h1 style={{ fontFamily: DISP, fontSize: 'clamp(26px,7vw,32px)', fontWeight: 600, color: INK, marginTop: 16, lineHeight: 1.1, letterSpacing: '-0.01em' }}>
              {previewName}
            </h1>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
              <span style={{
                fontFamily: MONO, fontSize: 10, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase',
                color: ACC, background: 'color-mix(in srgb, var(--c-acc) 13%, transparent)',
                border: `1px solid color-mix(in srgb, var(--c-acc) 30%, transparent)`,
                borderRadius: 100, padding: '4px 12px',
              }}>
                {user?.role}
              </span>
            </div>
            <p style={{ fontFamily: MONO, fontSize: 11.5, color: INK3, marginTop: 10 }}>{user?.email}</p>
          </div>
        </div>

        <div style={{ padding: '0 clamp(14px,4vw,20px)', display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* ── Personal information ── */}
          <Card icon={<User size={15} />} title="Personal information">
            <form onSubmit={e => { e.preventDefault(); saveProfile.mutate(); }} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <Field label="Full name" icon={<User size={13} />}>
                <input value={name} onChange={e => setName(e.target.value)} required style={inputStyle} placeholder="Your name" />
              </Field>
              <Field label="Department" icon={<Briefcase size={13} />}>
                <input value={department} onChange={e => setDepartment(e.target.value)} placeholder="e.g. Engineering" style={inputStyle} />
              </Field>
              <Field label="Avatar URL" hint="optional" icon={<ImageIcon size={13} />}>
                <input type="url" value={avatarUrl} onChange={e => setAvatarUrl(e.target.value)} placeholder="https://…" style={inputStyle} />
              </Field>

              <button type="submit" disabled={saveProfile.isPending} className="press" style={{
                minHeight: 48, borderRadius: 12, border: 'none', cursor: 'pointer',
                background: ACC, color: 'var(--c-on-acc)', fontFamily: UIFONT, fontSize: 14.5, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                opacity: saveProfile.isPending ? 0.6 : 1,
              }}>
                <Check size={16} /> {saveProfile.isPending ? 'Saving…' : 'Save changes'}
              </button>
            </form>
          </Card>

          {/* ── Security ── */}
          <Card icon={<Lock size={15} />} title="Change password">
            <form onSubmit={handlePasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <Field label="Current password">
                <input type="password" value={currentPw} onChange={e => setCurrentPw(e.target.value)} required placeholder="••••••••" style={inputStyle} />
              </Field>
              <Field label="New password" hint="min 8 characters">
                <input type="password" value={newPw} onChange={e => setNewPw(e.target.value)} required minLength={8} placeholder="At least 8 characters" style={inputStyle} />
                {newPw.length > 0 && newPw.length < 8 && <p style={warnText}>Password must be at least 8 characters</p>}
              </Field>
              <Field label="Confirm new password">
                <input type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} required placeholder="Same as above" style={inputStyle} />
                {confirmPw.length > 0 && confirmPw !== newPw && <p style={warnText}>Passwords do not match</p>}
              </Field>
              <button type="submit" disabled={changePassword.isPending} className="press" style={{
                minHeight: 48, borderRadius: 12, cursor: 'pointer',
                background: RAISE, color: INK, border: `1px solid ${BORDER}`,
                fontFamily: UIFONT, fontSize: 14.5, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                opacity: changePassword.isPending ? 0.6 : 1,
              }}>
                <Lock size={15} /> {changePassword.isPending ? 'Updating…' : 'Update password'}
              </button>
            </form>
          </Card>

          {/* ── Account ── */}
          <Card icon={<Shield size={15} />} title="Account">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Row label="Email" icon={<Mail size={13} />}>
                <span style={{ fontSize: 13.5, fontWeight: 500, color: INK, wordBreak: 'break-all', textAlign: 'right' }}>{user?.email}</span>
              </Row>
              <div style={{ height: 1, background: BORDER, margin: '2px 0' }} />
              <Row label="Role" icon={<Shield size={13} />}>
                <span style={{ fontSize: 13.5, fontWeight: 500, color: INK, textTransform: 'capitalize' }}>{user?.role}</span>
              </Row>
              <div style={{ height: 1, background: BORDER, margin: '2px 0' }} />
              <Row label="Status">
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13.5, fontWeight: 600, color: OK }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: OK, boxShadow: `0 0 8px ${OK}` }} /> Active
                </span>
              </Row>
            </div>
          </Card>

          {/* ── Sign out — was desktop-navbar only; mobile had no way out ── */}
          <button onClick={handleSignOut} className="press" style={{
            minHeight: 50, borderRadius: 14, cursor: 'pointer',
            background: 'transparent', color: 'var(--c-danger)',
            border: `1px solid color-mix(in srgb, var(--c-danger) 40%, var(--c-rule))`,
            fontFamily: UIFONT, fontSize: 14.5, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 4,
          }}>
            <LogOut size={16} /> Sign out
          </button>

          <p style={{ textAlign: 'center', fontFamily: MONO, fontSize: 10.5, color: INK3, letterSpacing: '0.08em', marginTop: 4 }}>
            NEST · {user?.email}
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Building blocks ─────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box',
  background: 'var(--c-bg2)', border: '1px solid var(--c-rule)',
  borderRadius: 11, padding: '12px 14px',
  fontFamily: "'Inter Tight','Inter',system-ui,sans-serif", fontSize: 15,
  color: 'var(--c-ink)', outline: 'none', transition: 'border-color 0.15s',
};

const warnText: React.CSSProperties = {
  fontSize: 11.5, color: 'var(--c-danger)', marginTop: 6, fontFamily: MONO,
};

function Card({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <section style={{ background: SURF, border: `1px solid ${BORDER}`, borderRadius: 18, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '14px 18px', borderBottom: `1px solid ${BORDER}` }}>
        <span style={{ color: ACC, display: 'flex' }}>{icon}</span>
        <h2 style={{ fontFamily: MONO, fontSize: 10.5, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: INK2 }}>{title}</h2>
      </div>
      <div style={{ padding: '18px' }}>{children}</div>
    </section>
  );
}

function Field({ label, hint, icon, children }: { label: string; hint?: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <label style={{ display: 'block' }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 7 }}>
        {icon && <span style={{ color: INK3, display: 'flex' }}>{icon}</span>}
        <span style={{ fontSize: 12, fontWeight: 600, color: INK2 }}>{label}</span>
        {hint && <span style={{ fontSize: 11, color: INK3, fontWeight: 400 }}>· {hint}</span>}
      </span>
      {children}
    </label>
  );
}

function Row({ label, icon, children }: { label: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, padding: '11px 2px' }}>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13, color: INK3 }}>
        {icon && <span style={{ display: 'flex' }}>{icon}</span>}{label}
      </span>
      {children}
    </div>
  );
}
