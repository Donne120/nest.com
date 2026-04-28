import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Building2, Users, Mail, Copy, Check, Trash2, Shield, Crown, Plug, ExternalLink, Link2, ToggleLeft, ToggleRight, Lock, Plus, Pencil, X, Globe } from 'lucide-react';
import api from '../../api/client';
import { useAuthStore } from '../../store';
import type { Organization, User, Invitation, UserRole, ATSProvider, ATSConnection, PaymentCountryConfig } from '../../types';
import toast from 'react-hot-toast';
import Button from '../../components/UI/Button';
import Avatar from '../../components/UI/Avatar';
import Badge from '../../components/UI/Badge';

type Tab = 'organization' | 'team' | 'invitations' | 'integrations';

const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: 'learner', label: 'Learner' },
  { value: 'educator', label: 'Educator' },
  { value: 'owner', label: 'Owner' },
];

function roleBadgeVariant(role: UserRole): 'learner' | 'educator' | 'owner' {
  return role as 'learner' | 'educator' | 'owner';
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

// ─── Country payment config data ──────────────────────────────────────────────

const COUNTRY_LIST = [
  { code: 'CM', name: 'Cameroon',             currency: 'XAF', symbol: 'FCFA',  providers: ['MTN MoMo', 'Orange Money'] },
  { code: 'RW', name: 'Rwanda',               currency: 'RWF', symbol: 'Fr',    providers: ['MTN MoMo', 'Airtel Money'] },
  { code: 'NG', name: 'Nigeria',              currency: 'NGN', symbol: '₦',     providers: ['MTN', 'Airtel Money', 'Opay', 'Palmpay'] },
  { code: 'KE', name: 'Kenya',                currency: 'KES', symbol: 'KSh',   providers: ['M-Pesa', 'Airtel Money'] },
  { code: 'GH', name: 'Ghana',                currency: 'GHS', symbol: 'GH₵',   providers: ['MTN MoMo', 'Vodafone Cash', 'AirtelTigo Money'] },
  { code: 'UG', name: 'Uganda',               currency: 'UGX', symbol: 'USh',   providers: ['MTN MoMo', 'Airtel Money'] },
  { code: 'TZ', name: 'Tanzania',             currency: 'TZS', symbol: 'TSh',   providers: ['M-Pesa', 'Tigo Pesa', 'Airtel Money'] },
  { code: 'CI', name: "Côte d'Ivoire",        currency: 'XOF', symbol: 'CFA',   providers: ['MTN MoMo', 'Orange Money', 'Moov Money', 'Wave'] },
  { code: 'SN', name: 'Senegal',              currency: 'XOF', symbol: 'CFA',   providers: ['Orange Money', 'Wave', 'Free Money'] },
  { code: 'ET', name: 'Ethiopia',             currency: 'ETB', symbol: 'Br',    providers: ['TeleBirr', 'CBE Birr'] },
  { code: 'ZA', name: 'South Africa',         currency: 'ZAR', symbol: 'R',     providers: ['Bank Transfer'] },
  { code: 'ZW', name: 'Zimbabwe',             currency: 'USD', symbol: '$',     providers: ['EcoCash', 'Telecash'] },
  { code: 'ZM', name: 'Zambia',               currency: 'ZMW', symbol: 'ZK',   providers: ['MTN MoMo', 'Airtel Money'] },
  { code: 'MW', name: 'Malawi',               currency: 'MWK', symbol: 'MK',   providers: ['Airtel Money', 'TNM Mpamba'] },
  { code: 'MA', name: 'Morocco',              currency: 'MAD', symbol: 'د.م.',  providers: ['CIH Pay', 'Wafacash', 'Bank Transfer'] },
  { code: 'INTL', name: 'International (USD)', currency: 'USD', symbol: '$',    providers: ['PayPal', 'Bank Transfer', 'Other'] },
] as const;

type CountryEntry = typeof COUNTRY_LIST[number];

const BLANK_FORM = {
  country_code: '', country_name: '', currency_code: '', currency_symbol: '',
  provider: '', number: '', account_name: '',
  provider2: '', number2: '', account_name2: '',
  price: '', instructions: '',
};

function PaymentCountriesSection() {
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<PaymentCountryConfig | null>(null);
  const [form, setForm] = useState({ ...BLANK_FORM });

  const { data: configs = [], isLoading } = useQuery<PaymentCountryConfig[]>({
    queryKey: ['payment-countries'],
    queryFn: () => api.get('/organizations/mine/payment-countries').then(r => r.data),
  });

  const save = useMutation({
    mutationFn: (payload: typeof BLANK_FORM) => {
      const body = {
        ...payload,
        price: payload.price ? parseFloat(payload.price) : null,
        provider:      payload.provider || null,
        number:        payload.number || null,
        account_name:  payload.account_name || null,
        provider2:     payload.provider2 || null,
        number2:       payload.number2 || null,
        account_name2: payload.account_name2 || null,
        instructions:  payload.instructions || null,
      };
      return editing
        ? api.put(`/organizations/mine/payment-countries/${editing.id}`, body)
        : api.post('/organizations/mine/payment-countries', body);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['payment-countries'] });
      toast.success(editing ? 'Country config updated' : 'Country added');
      setShowModal(false);
      setEditing(null);
      setForm({ ...BLANK_FORM });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.detail ?? 'Failed to save');
    },
  });

  const del = useMutation({
    mutationFn: (id: string) => api.delete(`/organizations/mine/payment-countries/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['payment-countries'] });
      toast.success('Removed');
    },
  });

  const openAdd = () => {
    setEditing(null);
    setForm({ ...BLANK_FORM });
    setShowModal(true);
  };

  const openEdit = (c: PaymentCountryConfig) => {
    setEditing(c);
    setForm({
      country_code: c.country_code, country_name: c.country_name,
      currency_code: c.currency_code, currency_symbol: c.currency_symbol,
      provider: c.provider ?? '', number: c.number ?? '', account_name: c.account_name ?? '',
      provider2: c.provider2 ?? '', number2: c.number2 ?? '', account_name2: c.account_name2 ?? '',
      price: c.price != null ? String(c.price) : '',
      instructions: c.instructions ?? '',
    });
    setShowModal(true);
  };

  const pickCountry = (code: string) => {
    const entry = COUNTRY_LIST.find(c => c.code === code) as CountryEntry | undefined;
    if (!entry) return;
    setForm(f => ({
      ...f,
      country_code: entry.code,
      country_name: entry.name,
      currency_code: entry.currency,
      currency_symbol: entry.symbol,
      provider: entry.providers[0] ?? '',
      provider2: entry.providers[1] ?? '',
    }));
  };

  const existingCodes = new Set(configs.map(c => c.country_code));

  return (
    <>
      <div className="border border-gray-200 rounded-2xl overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-800 flex items-center gap-1.5">
              <Globe size={14} className="text-brand-500" /> Countries &amp; currencies
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              Per-country payment numbers and prices. Learners see the details matching their country.
            </p>
          </div>
          <button
            onClick={openAdd}
            className="flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-800 px-2.5 py-1.5 rounded-lg border border-brand-200 hover:border-brand-400 transition-colors"
          >
            <Plus size={12} /> Add country
          </button>
        </div>

        {isLoading && (
          <div className="px-4 py-6 text-sm text-gray-400 text-center animate-pulse">Loading…</div>
        )}

        {!isLoading && configs.length === 0 && (
          <div className="px-4 py-6 text-sm text-gray-400 text-center">
            No countries configured yet. Add one so learners can select their country at checkout.
          </div>
        )}

        {configs.map((c, i) => (
          <div key={c.id} className={`px-4 py-3 flex items-start gap-3 ${i < configs.length - 1 ? 'border-b border-gray-100' : ''}`}>
            <span className="text-xl leading-none mt-0.5" title={c.country_name}>
              {c.country_code === 'INTL' ? '🌍' : `${String.fromCodePoint(...[...c.country_code].map(ch => 0x1F1E0 + ch.charCodeAt(0) - 65))}`}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-800">{c.country_name}
                <span className="ml-2 font-mono text-xs text-gray-400">{c.currency_code} · {c.currency_symbol}</span>
              </p>
              {c.provider && c.number && (
                <p className="text-xs text-gray-500 mt-0.5">{c.provider}: <span className="font-mono font-semibold text-gray-700">{c.number}</span>{c.account_name ? ` · ${c.account_name}` : ''}</p>
              )}
              {c.provider2 && c.number2 && (
                <p className="text-xs text-gray-500">{c.provider2}: <span className="font-mono font-semibold text-gray-700">{c.number2}</span>{c.account_name2 ? ` · ${c.account_name2}` : ''}</p>
              )}
              {c.price != null && (
                <p className="text-xs text-emerald-600 font-semibold mt-0.5">{c.price.toLocaleString()} {c.currency_symbol}</p>
              )}
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <button onClick={() => openEdit(c)} className="p-1.5 text-gray-400 hover:text-brand-600 rounded transition-colors" title="Edit">
                <Pencil size={13} />
              </button>
              <button onClick={() => del.mutate(c.id)} className="p-1.5 text-gray-400 hover:text-red-500 rounded transition-colors" title="Remove">
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ── Add / Edit modal ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.45)' }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-900">{editing ? 'Edit country config' : 'Add country'}</h3>
              <button onClick={() => { setShowModal(false); setEditing(null); }} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>
            <div className="px-5 py-4 space-y-4">
              {/* Country picker */}
              <Field label="Country">
                <select
                  value={form.country_code}
                  onChange={e => pickCountry(e.target.value)}
                  className={inputCls}
                  disabled={!!editing}
                >
                  <option value="">— Select a country —</option>
                  {COUNTRY_LIST.filter(c => editing ? true : !existingCodes.has(c.code)).map(c => (
                    <option key={c.code} value={c.code}>{c.name} ({c.currency})</option>
                  ))}
                </select>
              </Field>

              {/* Currency (auto-filled, editable) */}
              <div className="grid grid-cols-2 gap-3">
                <Field label="Currency code" hint="e.g. XAF, RWF, KES">
                  <input className={inputCls} value={form.currency_code}
                    onChange={e => setForm(f => ({ ...f, currency_code: e.target.value }))} placeholder="XAF" />
                </Field>
                <Field label="Currency symbol" hint="e.g. FCFA, Fr, KSh">
                  <input className={inputCls} value={form.currency_symbol}
                    onChange={e => setForm(f => ({ ...f, currency_symbol: e.target.value }))} placeholder="FCFA" />
                </Field>
              </div>

              <hr className="border-gray-100" />
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Primary payment method</p>

              <Field label="Provider (e.g. MTN MoMo, M-Pesa)">
                <input className={inputCls} value={form.provider}
                  onChange={e => setForm(f => ({ ...f, provider: e.target.value }))} placeholder="MTN MoMo" />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Number / account">
                  <input className={inputCls} type="tel" value={form.number}
                    onChange={e => setForm(f => ({ ...f, number: e.target.value }))} placeholder="0792104982" />
                </Field>
                <Field label="Account name">
                  <input className={inputCls} value={form.account_name}
                    onChange={e => setForm(f => ({ ...f, account_name: e.target.value }))} placeholder="Ngum Dieudonne" />
                </Field>
              </div>

              <hr className="border-gray-100" />
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Secondary method <span className="normal-case font-normal text-gray-400">(optional)</span></p>

              <Field label="Provider">
                <input className={inputCls} value={form.provider2}
                  onChange={e => setForm(f => ({ ...f, provider2: e.target.value }))} placeholder="Orange Money" />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Number / account">
                  <input className={inputCls} type="tel" value={form.number2}
                    onChange={e => setForm(f => ({ ...f, number2: e.target.value }))} placeholder="0699123456" />
                </Field>
                <Field label="Account name">
                  <input className={inputCls} value={form.account_name2}
                    onChange={e => setForm(f => ({ ...f, account_name2: e.target.value }))} placeholder="Ngum Dieudonne" />
                </Field>
              </div>

              <hr className="border-gray-100" />
              <Field label="Recommended price in local currency" hint="Pre-fills the amount for learners (they can adjust)">
                <div className="flex gap-2 items-center">
                  <input className={inputCls} style={{ marginBottom: 0 }} type="number" value={form.price}
                    onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="6000" />
                  <span className="text-sm font-mono text-gray-500 whitespace-nowrap">{form.currency_code || 'currency'}</span>
                </div>
              </Field>

              <Field label="Payment instructions (optional)" hint="Shown to learners from this country">
                <textarea className={inputCls + ' resize-none leading-relaxed'} rows={2} value={form.instructions}
                  onChange={e => setForm(f => ({ ...f, instructions: e.target.value }))}
                  placeholder="Always include your email as the transfer reference." />
              </Field>
            </div>
            <div className="flex gap-3 px-5 pb-5">
              <button onClick={() => { setShowModal(false); setEditing(null); }}
                className="flex-1 py-2.5 text-sm font-semibold border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button
                onClick={() => save.mutate(form)}
                disabled={!form.country_code || !form.currency_code || save.isPending}
                className="flex-1 py-2.5 text-sm font-semibold bg-brand-600 hover:bg-brand-700 disabled:opacity-40 text-white rounded-xl transition-colors"
              >
                {save.isPending ? 'Saving…' : editing ? 'Update' : 'Add country'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Organization tab ─────────────────────────────────────────────────────────

function OrgTab() {
  const { organization, setAuth, user } = useAuthStore();
  const [name, setName] = useState(organization?.name ?? '');
  const [logoUrl, setLogoUrl] = useState(organization?.logo_url ?? '');
  const [brandColor, setBrandColor] = useState(organization?.brand_color ?? '#6366f1');
  // MTN MoMo
  const [momoNumber, setMomoNumber] = useState(organization?.momo_number ?? '');
  const [momoName, setMomoName]     = useState(organization?.momo_name ?? '');
  // Orange Money
  const [orangeNumber, setOrangeNumber] = useState(organization?.payment_orange_number ?? '');
  const [orangeName, setOrangeName]     = useState(organization?.payment_orange_name ?? '');
  // Bank Transfer
  const [bankName, setBankName]       = useState(organization?.payment_bank_name ?? '');
  const [bankAccount, setBankAccount] = useState(organization?.payment_bank_account ?? '');
  const [bankHolder, setBankHolder]   = useState(organization?.payment_bank_holder ?? '');
  // Custom instructions
  const [instructions, setInstructions] = useState(organization?.payment_instructions ?? '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data } = await api.put<Organization>('/organizations/mine', {
        name: name.trim() || undefined,
        logo_url: logoUrl.trim() || undefined,
        brand_color: brandColor,
        momo_number:             momoNumber.trim()   || null,
        momo_name:               momoName.trim()     || null,
        payment_orange_number:   orangeNumber.trim() || null,
        payment_orange_name:     orangeName.trim()   || null,
        payment_bank_name:       bankName.trim()     || null,
        payment_bank_account:    bankAccount.trim()  || null,
        payment_bank_holder:     bankHolder.trim()   || null,
        payment_instructions:    instructions.trim() || null,
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

      {/* ── Payment methods ──────────────────────────────────────────── */}
      <div className="border border-gray-200 rounded-2xl overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <p className="text-sm font-semibold text-gray-800">Payment methods</p>
          <p className="text-xs text-gray-500 mt-0.5">
            Configure how learners pay you. Only methods with a number/account filled in will be shown to learners.
          </p>
        </div>

        {/* MTN MoMo */}
        <div className="px-4 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-full bg-yellow-400 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-black text-yellow-900">M</span>
            </div>
            <span className="text-sm font-semibold text-gray-800">MTN MoMo</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="MoMo number">
              <input type="tel" value={momoNumber} onChange={e => setMomoNumber(e.target.value)}
                placeholder="e.g. 0792104982" className={inputCls} />
            </Field>
            <Field label="Account name">
              <input type="text" value={momoName} onChange={e => setMomoName(e.target.value)}
                placeholder="e.g. Ngum Dieudonne" className={inputCls} />
            </Field>
          </div>
        </div>

        {/* Orange Money */}
        <div className="px-4 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-black text-white">O</span>
            </div>
            <span className="text-sm font-semibold text-gray-800">Orange Money</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Orange number">
              <input type="tel" value={orangeNumber} onChange={e => setOrangeNumber(e.target.value)}
                placeholder="e.g. 0699123456" className={inputCls} />
            </Field>
            <Field label="Account name">
              <input type="text" value={orangeName} onChange={e => setOrangeName(e.target.value)}
                placeholder="e.g. Ngum Dieudonne" className={inputCls} />
            </Field>
          </div>
        </div>

        {/* Bank Transfer */}
        <div className="px-4 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-black text-white">B</span>
            </div>
            <span className="text-sm font-semibold text-gray-800">Bank Transfer</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Bank name">
              <input type="text" value={bankName} onChange={e => setBankName(e.target.value)}
                placeholder="e.g. UBA Cameroon" className={inputCls} />
            </Field>
            <Field label="Account number">
              <input type="text" value={bankAccount} onChange={e => setBankAccount(e.target.value)}
                placeholder="e.g. 00123456789" className={inputCls} />
            </Field>
          </div>
          <Field label="Account holder name">
            <input type="text" value={bankHolder} onChange={e => setBankHolder(e.target.value)}
              placeholder="e.g. Ngum Dieudonne" className={inputCls} />
          </Field>
        </div>

        {/* Custom instructions */}
        <div className="px-4 py-4">
          <Field label="Custom payment instructions (optional)"
            hint="Additional notes shown to learners — e.g. specific transfer reference format, contact info, etc.">
            <textarea
              value={instructions}
              onChange={e => setInstructions(e.target.value)}
              rows={3}
              placeholder="e.g. Always include your email as the transfer reference."
              className={inputCls + ' resize-none leading-relaxed'}
            />
          </Field>
        </div>
      </div>

      {/* ── Countries & currencies ─────────────────────────────────── */}
      <PaymentCountriesSection />

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
              {currentUser?.role === 'owner' && m.id !== currentUser?.id ? (
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
              {currentUser?.role === 'owner' && m.id !== currentUser?.id && (
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

// ─── Invite Links section ─────────────────────────────────────────────────────

interface InviteLink {
  id: string;
  token: string;
  label: string | null;
  role: string;
  free_access: boolean;
  access_code: string | null;
  max_uses: number | null;
  use_count: number;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
}

function InviteLinksSection() {
  const qc = useQueryClient();
  const { organization } = useAuthStore();
  const [showForm, setShowForm] = useState(false);
  const [label, setLabel] = useState('');
  const [role, setRole] = useState<UserRole>('learner');
  const [freeAccess, setFreeAccess] = useState(false);
  const [accessCode, setAccessCode] = useState('');
  const [maxUses, setMaxUses] = useState('');
  const [expiresDays, setExpiresDays] = useState('');
  const [creating, setCreating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const { data: links = [], isLoading } = useQuery<InviteLink[]>({
    queryKey: ['invite-links'],
    queryFn: () => api.get<InviteLink[]>('/invitations/links').then(r => r.data),
    staleTime: 30_000,
  });

  const toggleActive = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      api.patch(`/invitations/links/${id}`, { is_active }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['invite-links'] }),
    onError: () => toast.error('Failed to update link'),
  });

  const deleteLink = useMutation({
    mutationFn: (id: string) => api.delete(`/invitations/links/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['invite-links'] }); toast.success('Link deleted'); },
    onError: () => toast.error('Failed to delete link'),
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      await api.post('/invitations/links', {
        label: label.trim() || null,
        role,
        free_access: freeAccess,
        access_code: accessCode.trim() || null,
        max_uses: maxUses ? parseInt(maxUses) : null,
        expires_days: expiresDays ? parseInt(expiresDays) : null,
      });
      qc.invalidateQueries({ queryKey: ['invite-links'] });
      toast.success('Invite link created');
      setShowForm(false);
      setLabel(''); setRole('learner'); setFreeAccess(false);
      setAccessCode(''); setMaxUses(''); setExpiresDays('');
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Failed to create link');
    } finally {
      setCreating(false);
    }
  };

  const copyLink = async (link: InviteLink) => {
    const url = `${window.location.origin}/join/${link.token}`;
    await navigator.clipboard.writeText(url);
    setCopiedId(link.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const frontendUrl = organization
    ? `${window.location.origin}/join/`
    : `${window.location.origin}/join/`;

  return (
    <div className="mt-10 pt-8 border-t border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <Link2 size={15} className="text-brand-600" />
            Bulk invite links
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">
            Share one link with many students. They register and follow the normal flow.
          </p>
        </div>
        <Button size="sm" onClick={() => setShowForm(v => !v)}>
          {showForm ? 'Cancel' : 'New link'}
        </Button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-gray-50 border border-gray-200 rounded-xl p-5 mb-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Label (optional)</label>
              <input
                type="text"
                value={label}
                onChange={e => setLabel(e.target.value)}
                placeholder="e.g. Cohort A 2026"
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Role</label>
              <select
                value={role}
                onChange={e => setRole(e.target.value as UserRole)}
                className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                {ROLE_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Max uses (optional)</label>
              <input
                type="number"
                min="1"
                value={maxUses}
                onChange={e => setMaxUses(e.target.value)}
                placeholder="Unlimited"
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Expires in days (optional)</label>
              <input
                type="number"
                min="1"
                max="365"
                value={expiresDays}
                onChange={e => setExpiresDays(e.target.value)}
                placeholder="Never"
                className={inputCls}
              />
            </div>
          </div>

          {/* Free access toggle */}
          <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3">
            <div>
              <p className="text-sm font-medium text-gray-800">Free access</p>
              <p className="text-xs text-gray-400">Skip payment — students get instant access on sign-up</p>
            </div>
            <button
              type="button"
              onClick={() => setFreeAccess(v => !v)}
              className={`transition-colors ${freeAccess ? 'text-brand-600' : 'text-gray-300'}`}
            >
              {freeAccess ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
            </button>
          </div>

          {/* Access code */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Access code (optional)
              {accessCode && <span className="ml-1.5 inline-flex items-center gap-0.5 text-brand-600"><Lock size={10} /> Required to join</span>}
            </label>
            <input
              type="text"
              value={accessCode}
              onChange={e => setAccessCode(e.target.value)}
              placeholder="Leave blank for open link"
              className={`${inputCls} font-mono`}
              minLength={4}
              maxLength={32}
            />
            <p className="text-xs text-gray-400 mt-1">Students must enter this code on the join page.</p>
          </div>

          <Button type="submit" loading={creating} size="sm">Create link</Button>
        </form>
      )}

      {isLoading ? (
        <div className="text-center py-4 text-sm text-gray-400">Loading…</div>
      ) : links.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-4">No bulk invite links yet.</p>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100">
          {links.map(link => {
            const url = `${frontendUrl}${link.token}`;
            const expired = link.expires_at && new Date(link.expires_at) < new Date();
            const exhausted = link.max_uses != null && link.use_count >= link.max_uses;
            return (
              <div key={link.id} className={`flex items-center gap-3 px-4 py-3.5 ${!link.is_active || expired || exhausted ? 'opacity-60' : ''}`}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-[13px] font-semibold text-gray-900 truncate">
                      {link.label || 'Untitled link'}
                    </p>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded capitalize ${
                      link.role === 'learner' ? 'bg-slate-100 text-slate-600'
                      : link.role === 'educator' ? 'bg-blue-100 text-blue-600'
                      : 'bg-indigo-100 text-indigo-600'
                    }`}>{link.role}</span>
                    {link.free_access && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700">Free</span>
                    )}
                    {link.access_code && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 flex items-center gap-0.5">
                        <Lock size={8} /> Code
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-gray-400 mt-0.5 font-mono truncate">{url}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    {link.use_count}{link.max_uses != null ? `/${link.max_uses}` : ''} uses
                    {link.expires_at && ` · Expires ${new Date(link.expires_at).toLocaleDateString()}`}
                    {!link.is_active && ' · Deactivated'}
                    {expired && ' · Expired'}
                    {exhausted && ' · Full'}
                  </p>
                </div>
                <button
                  onClick={() => copyLink(link)}
                  title="Copy link"
                  className="p-1.5 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors flex-shrink-0"
                >
                  {copiedId === link.id ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                </button>
                <button
                  onClick={() => toggleActive.mutate({ id: link.id, is_active: !link.is_active })}
                  title={link.is_active ? 'Deactivate' : 'Activate'}
                  className={`p-1.5 rounded-lg transition-colors flex-shrink-0 ${link.is_active ? 'text-brand-500 hover:bg-brand-50' : 'text-gray-300 hover:text-brand-500 hover:bg-brand-50'}`}
                >
                  {link.is_active ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                </button>
                <button
                  onClick={() => deleteLink.mutate(link.id)}
                  title="Delete link"
                  className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Invitations tab ─────────────────────────────────────────────────────────

function InvitationsTab() {
  const qc = useQueryClient();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('learner');
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

      <InviteLinksSection />
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
  const [defaultRole, setDefaultRole] = useState<UserRole>('learner');
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
            <option value="learner">Learner</option>
            <option value="educator">Educator</option>
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
    <div>
      <div className="mx-auto max-w-5xl px-6 py-12 lg:px-8 lg:py-16">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-base text-gray-500 mt-2">
            Manage your workspace, team members, and integrations
          </p>
        </div>

        {/* Tab bar */}
        <div className="flex gap-0 border-b border-gray-200 mb-8">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
                activeTab === id
                  ? 'border-brand-600 text-brand-700'
                  : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300'
              }`}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="bg-white rounded-2xl border border-gray-200 p-8 lg:p-10 shadow-sm">
          {activeTab === 'organization' && <OrgTab />}
          {activeTab === 'team' && <TeamTab />}
          {activeTab === 'invitations' && <InvitationsTab />}
          {activeTab === 'integrations' && <IntegrationsTab />}
        </div>
      </div>
    </div>
  );
}
