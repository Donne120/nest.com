import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Building2, Users, Mail, Copy, Check, Trash2, Shield, Crown, Plug, ExternalLink } from 'lucide-react';
import api from '../../api/client';
import { useAuthStore } from '../../store';
import type { Organization, User, Invitation, UserRole, ATSProvider, ATSConnection } from '../../types';
import toast from 'react-hot-toast';
import Button from '../../components/UI/Button';
import Avatar from '../../components/UI/Avatar';
import Badge from '../../components/UI/Badge';

type Tab = 'organization' | 'team' | 'invitations' | 'integrations';

const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: 'employee', label: 'Employee' },
  { value: 'manager', label: 'Manager' },
  { value: 'admin', label: 'Admin' },
];

function roleBadgeVariant(role: UserRole): 'employee' | 'manager' | 'admin' {
  return role as 'employee' | 'manager' | 'admin';
}

// ─── Field wrapper ─────────────────────────────────────────────────────────────
function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1.5">{label}</label>
      {children}
      {hint && <p className="text-xs text-gray-400 mt-1.5">{hint}</p>}
    </div>
  );
}

const inputCls = "w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition";

// ─── Organization tab ─────────────────────────────────────────────────────────

function OrgTab() {
  const { organization, setAuth, user } = useAuthStore();
  const [name, setName] = useState(organization?.name ?? '');
  const [logoUrl, setLogoUrl] = useState(organization?.logo_url ?? '');
  const [brandColor, setBrandColor] = useState(organization?.brand_color ?? '#6366f1');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data } = await api.put<Organization>('/organizations/mine', {
        name: name.trim() || undefined,
        logo_url: logoUrl.trim() || undefined,
        brand_color: brandColor,
      });
      if (user) {
        const token = localStorage.getItem('nest_token') ?? '';
        setAuth(user, token, data);
      }
      toast.success('Settings saved successfully');
    } catch {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const planLabel: Record<string, string> = {
    trial: 'Free Trial',
    starter: 'Starter',
    professional: 'Professional',
    enterprise: 'Enterprise',
  };

  return (
    <div className="space-y-6 max-w-lg">
      {/* Plan banner */}
      {organization && (
        <div className="flex items-center justify-between bg-gradient-to-r from-brand-50 to-blue-50 border border-brand-100 rounded-xl px-4 py-3.5">
          <div className="flex items-center gap-3">
            <Crown size={16} className="text-brand-600" />
            <div>
              <p className="text-sm font-semibold text-gray-900">{planLabel[organization.plan]} plan</p>
              {organization.plan === 'trial' && organization.trial_ends_at && (
                <p className="text-xs text-gray-500 mt-0.5">
                  Trial ends {new Date(organization.trial_ends_at).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
            organization.subscription_status === 'active'
              ? 'bg-emerald-100 text-emerald-700'
              : 'bg-red-100 text-red-700'
          }`}>
            {organization.subscription_status}
          </span>
        </div>
      )}

      {/* Company name */}
      <Field label="Company name">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={inputCls}
          placeholder="Acme Corp"
        />
      </Field>

      {/* Logo URL */}
      <Field label="Logo URL" hint="Paste a URL to your company logo (PNG or SVG recommended)">
        <input
          type="url"
          value={logoUrl}
          onChange={(e) => setLogoUrl(e.target.value)}
          placeholder="https://example.com/logo.png"
          className={inputCls}
        />
        {logoUrl && (
          <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-xl inline-block">
            <img
              src={logoUrl}
              alt="Logo preview"
              className="h-8 object-contain"
              onError={() => {}}
            />
          </div>
        )}
      </Field>

      {/* Brand color */}
      <Field label="Brand color" hint="Used for accents and highlights throughout the app">
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={brandColor}
            onChange={(e) => setBrandColor(e.target.value)}
            className="w-10 h-10 rounded-xl border border-gray-300 cursor-pointer p-0.5 flex-shrink-0"
          />
          <input
            type="text"
            value={brandColor}
            onChange={(e) => setBrandColor(e.target.value)}
            pattern="^#[0-9a-fA-F]{6}$"
            className="w-36 border border-gray-300 rounded-xl px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <div
            className="w-10 h-10 rounded-xl border border-gray-200 flex-shrink-0"
            style={{ backgroundColor: brandColor }}
          />
        </div>
      </Field>

      <div className="pt-2">
        <Button onClick={handleSave} loading={saving}>
          Save changes
        </Button>
      </div>
    </div>
  );
}

// ─── Team tab ─────────────────────────────────────────────────────────────────

function TeamTab() {
  const { user: currentUser } = useAuthStore();
  const qc = useQueryClient();

  const { data: members = [], isLoading } = useQuery<User[]>({
    queryKey: ['org-members'],
    queryFn: () => api.get<User[]>('/organizations/mine/members').then((r) => r.data),
    staleTime: 30_000,
  });

  const updateRole = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: UserRole }) =>
      api.put(`/organizations/mine/members/${userId}/role`, { role }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['org-members'] }); toast.success('Role updated'); },
    onError: () => toast.error('Failed to update role'),
  });

  const deactivate = useMutation({
    mutationFn: (userId: string) => api.put(`/organizations/mine/members/${userId}/deactivate`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['org-members'] }); toast.success('Member deactivated'); },
    onError: () => toast.error('Failed to deactivate member'),
  });

  const reactivate = useMutation({
    mutationFn: (userId: string) => api.put(`/organizations/mine/members/${userId}/reactivate`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['org-members'] }); toast.success('Member reactivated'); },
    onError: () => toast.error('Failed to reactivate member'),
  });

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-16 bg-gray-100 animate-pulse rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div>
      <p className="text-sm text-gray-400 mb-4 font-medium">
        {members.length} member{members.length !== 1 ? 's' : ''} in this workspace
      </p>
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {/* Table header */}
        <div className="grid grid-cols-[1fr_auto_auto] gap-4 px-4 py-2.5 border-b border-gray-100 bg-gray-50/50">
          <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Member</span>
          <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Role</span>
          <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Action</span>
        </div>
        <div className="divide-y divide-gray-100">
          {members.map((m) => (
            <div
              key={m.id}
              className={`flex items-center gap-4 px-4 py-3.5 ${!m.is_active ? 'opacity-50' : ''}`}
            >
              <Avatar name={m.full_name} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-gray-900 truncate">{m.full_name}</p>
                <p className="text-[12px] text-gray-400 truncate">{m.email}</p>
              </div>

              {/* Role */}
              {currentUser?.role === 'admin' && m.id !== currentUser?.id ? (
                <select
                  value={m.role}
                  onChange={(e) => updateRole.mutate({ userId: m.id, role: e.target.value as UserRole })}
                  className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium text-gray-700"
                >
                  {ROLE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              ) : (
                <Badge variant={roleBadgeVariant(m.role)} />
              )}

              {/* Activate/Deactivate */}
              {currentUser?.role === 'admin' && m.id !== currentUser?.id && (
                m.is_active ? (
                  <button
                    onClick={() => deactivate.mutate(m.id)}
                    title="Deactivate member"
                    className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                ) : (
                  <button
                    onClick={() => reactivate.mutate(m.id)}
                    className="text-xs text-brand-600 hover:text-brand-700 font-semibold transition-colors px-2 py-1 rounded-lg hover:bg-brand-50"
                  >
                    Restore
                  </button>
                )
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Invitations tab ─────────────────────────────────────────────────────────

function InvitationsTab() {
  const qc = useQueryClient();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('employee');
  const [creating, setCreating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const { data: invitations = [], isLoading } = useQuery<Invitation[]>({
    queryKey: ['org-invitations'],
    queryFn: () => api.get<Invitation[]>('/invitations').then((r) => r.data),
    staleTime: 30_000,
  });

  const revoke = useMutation({
    mutationFn: (id: string) => api.delete(`/invitations/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['org-invitations'] }); toast.success('Invitation revoked'); },
    onError: () => toast.error('Failed to revoke invitation'),
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const { data } = await api.post<Invitation>('/invitations', { email: email.trim(), role });
      qc.invalidateQueries({ queryKey: ['org-invitations'] });
      toast.success('Invite created');
      if (data.invite_url) {
        navigator.clipboard.writeText(data.invite_url).catch(() => {});
        toast.success('Invite link copied to clipboard!', { duration: 4000 });
      }
      setEmail('');
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Failed to create invitation');
    } finally {
      setCreating(false);
    }
  };

  const copyLink = async (invite: Invitation) => {
    if (!invite.invite_url) return;
    await navigator.clipboard.writeText(invite.invite_url);
    setCopiedId(invite.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const pending = invitations.filter((i) => !i.is_accepted && new Date(i.expires_at) > new Date());
  const done = invitations.filter((i) => i.is_accepted || new Date(i.expires_at) <= new Date());

  return (
    <div className="space-y-6 max-w-lg">
      {/* Send invite form */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-1">Send an invitation</h3>
        <p className="text-xs text-gray-400 mb-4">Link is valid for 7 days and copied to clipboard automatically.</p>
        <form onSubmit={handleCreate} className="flex gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="colleague@company.com"
            className={`flex-1 ${inputCls}`}
          />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as UserRole)}
            className="border border-gray-300 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium text-gray-700"
          >
            {ROLE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <Button type="submit" loading={creating} size="sm" icon={<Mail size={14} />}>
            Invite
          </Button>
        </form>
      </div>

      {/* Pending invites */}
      {isLoading ? (
        <div className="text-center py-4 text-sm text-gray-400">Loading...</div>
      ) : (
        <>
          {pending.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Pending ({pending.length})
              </p>
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100">
                {pending.map((inv) => (
                  <div key={inv.id} className="flex items-center gap-4 px-4 py-3.5">
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-gray-900 truncate">{inv.email}</p>
                      <p className="text-[12px] text-gray-400 mt-0.5 capitalize">
                        {inv.role} · Expires {new Date(inv.expires_at).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={() => copyLink(inv)}
                      title="Copy invite link"
                      className="p-1.5 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                    >
                      {copiedId === inv.id
                        ? <Check size={14} className="text-emerald-500" />
                        : <Copy size={14} />}
                    </button>
                    <button
                      onClick={() => revoke.mutate(inv.id)}
                      title="Revoke invite"
                      className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {done.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Accepted / Expired
              </p>
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100 opacity-60">
                {done.map((inv) => (
                  <div key={inv.id} className="flex items-center gap-4 px-4 py-3.5">
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] text-gray-700 truncate">{inv.email}</p>
                      <p className="text-[12px] text-gray-400 capitalize">
                        {inv.is_accepted ? 'Accepted' : 'Expired'} · {inv.role}
                      </p>
                    </div>
                    <Shield size={14} className={inv.is_accepted ? 'text-emerald-500' : 'text-gray-300'} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {invitations.length === 0 && (
            <p className="text-center text-sm text-gray-400 py-6">No invitations yet. Send one above.</p>
          )}
        </>
      )}
    </div>
  );
}

// ─── Integrations tab ─────────────────────────────────────────────────────────

const ATS_PROVIDERS: { value: ATSProvider; label: string; description: string; color: string }[] = [
  { value: 'greenhouse', label: 'Greenhouse', description: 'Auto-invite new hires when they accept an offer', color: '#24b47e' },
  { value: 'lever', label: 'Lever', description: 'Trigger onboarding from Lever candidate hired events', color: '#1a1a2e' },
  { value: 'workable', label: 'Workable', description: 'Connect Workable to auto-assign onboarding tracks', color: '#6c5ce7' },
];

function IntegrationsTab() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [selectedProvider, setSelectedProvider] = useState<ATSProvider>('greenhouse');
  const [apiKey, setApiKey] = useState('');
  const [defaultRole, setDefaultRole] = useState<UserRole>('employee');
  const [saving, setSaving] = useState(false);

  const { data: connection } = useQuery<ATSConnection | null>({
    queryKey: ['ats-connection'],
    queryFn: () => api.get<ATSConnection | null>('/ats/connection').then(r => r.data).catch(() => null),
    staleTime: 60_000,
  });

  const org = useAuthStore(s => s.organization);
  const webhookUrl = org ? `${window.location.origin.replace('5173', '8000')}/api/ats/webhook/${org.slug}` : '';

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim()) { toast.error('API key is required'); return; }
    setSaving(true);
    try {
      await api.put('/ats/connection', { provider: selectedProvider, api_key: apiKey, default_role: defaultRole });
      qc.invalidateQueries({ queryKey: ['ats-connection'] });
      toast.success('ATS integration saved');
      setApiKey('');
    } catch {
      toast.error('Failed to save integration');
    } finally {
      setSaving(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await api.delete('/ats/connection');
      qc.invalidateQueries({ queryKey: ['ats-connection'] });
      toast.success('ATS disconnected');
    } catch {
      toast.error('Failed to disconnect');
    }
  };

  const copyWebhook = () => {
    navigator.clipboard.writeText(webhookUrl);
    toast.success('Webhook URL copied');
  };

  return (
    <div className="space-y-6 max-w-lg">
      <div className="flex items-center gap-3 p-4 bg-brand-50 border border-brand-100 rounded-xl">
        <Plug size={16} className="text-brand-600 flex-shrink-0" />
        <div>
          <p className="text-sm font-semibold text-gray-900">ATS Auto-Invite</p>
          <p className="text-xs text-gray-500 mt-0.5">
            When a new hire accepts an offer in your ATS, Nest automatically sends them an onboarding invite.
          </p>
        </div>
      </div>

      {connection && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-emerald-800 capitalize">
                {connection.provider} connected
              </p>
              <p className="text-xs text-emerald-600 mt-0.5">
                New hires auto-invited as <strong>{connection.default_role}</strong>
              </p>
            </div>
            <button
              onClick={handleDisconnect}
              className="text-xs text-red-500 hover:text-red-700 font-medium border border-red-200 hover:border-red-300 px-2.5 py-1 rounded-lg transition-colors"
            >
              Disconnect
            </button>
          </div>
          {connection.webhook_secret && (
            <div className="mt-3 pt-3 border-t border-emerald-200">
              <p className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider mb-1.5">Webhook URL</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-[11px] bg-white border border-emerald-200 rounded-lg px-2.5 py-1.5 text-gray-700 truncate font-mono">
                  {webhookUrl}
                </code>
                <button onClick={copyWebhook} className="p-1.5 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors">
                  <Copy size={13} />
                </button>
              </div>
              <p className="text-[10px] text-emerald-600 mt-1.5">
                Add this URL as a webhook in your ATS dashboard.
              </p>
            </div>
          )}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">ATS Provider</label>
          <div className="grid grid-cols-3 gap-2">
            {ATS_PROVIDERS.map(p => (
              <button
                key={p.value}
                type="button"
                onClick={() => setSelectedProvider(p.value)}
                className={`border rounded-xl p-3 text-left transition-all ${
                  selectedProvider === p.value
                    ? 'border-brand-400 bg-brand-50 ring-2 ring-brand-200'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <div className="w-5 h-5 rounded-md mb-2 flex-shrink-0" style={{ backgroundColor: p.color }} />
                <p className="text-xs font-semibold text-gray-900">{p.label}</p>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            API Key
            <a
              href="https://developers.greenhouse.io/harvest.html#authentication"
              target="_blank"
              rel="noopener noreferrer"
              className="ml-2 text-brand-600 font-normal text-xs hover:underline inline-flex items-center gap-0.5"
            >
              Where to find this <ExternalLink size={10} />
            </a>
          </label>
          <input
            type="password"
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
            placeholder="••••••••••••••••"
            className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Default role for new hires</label>
          <select
            value={defaultRole}
            onChange={e => setDefaultRole(e.target.value as UserRole)}
            className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="employee">Employee</option>
            <option value="manager">Manager</option>
          </select>
        </div>

        <Button type="submit" loading={saving} icon={<Plug size={14} />}>
          {connection ? 'Update Integration' : 'Connect ATS'}
        </Button>
      </form>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

const TABS: { id: Tab; label: string; icon: typeof Building2 }[] = [
  { id: 'organization', label: 'Organization', icon: Building2 },
  { id: 'team', label: 'Team', icon: Users },
  { id: 'invitations', label: 'Invitations', icon: Mail },
  { id: 'integrations', label: 'Integrations', icon: Plug },
];

export default function OrgSettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('organization');

  return (
    <div className="p-6 lg:p-8 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-400 mt-1">
          Manage your workspace, team members, and invitations
        </p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-0 border-b border-gray-200 mb-7">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all ${
              activeTab === id
                ? 'border-brand-600 text-brand-700'
                : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300'
            }`}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'organization' && <OrgTab />}
      {activeTab === 'team' && <TeamTab />}
      {activeTab === 'invitations' && <InvitationsTab />}
    </div>
  );
}
