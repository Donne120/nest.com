import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Palette, BookOpen, Users, Rocket, Check,
  ArrowRight, ArrowLeft, Plus, Trash2, X,
} from 'lucide-react';
import api from '../../api/client';
import { useAuthStore } from '../../store';
import type { Organization, UserRole } from '../../types';
import toast from 'react-hot-toast';
import Button from '../../components/UI/Button';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface InviteRow {
  id: number;
  email: string;
  role: UserRole;
}

// ─── Step progress bar ─────────────────────────────────────────────────────────

const STEPS = [
  { icon: Palette, label: 'Branding' },
  { icon: BookOpen, label: 'First Course' },
  { icon: Users, label: 'Invite Team' },
  { icon: Rocket, label: 'Launch' },
];

function StepBar({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-0 mb-10">
      {STEPS.map((s, i) => {
        const Icon = s.icon;
        const done = i < current;
        const active = i === current;
        return (
          <div key={i} className="flex items-center">
            <div className="flex flex-col items-center gap-1.5">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 ${
                done    ? 'bg-brand-600 shadow-md' :
                active  ? 'bg-brand-600 shadow-lg ring-4 ring-brand-100' :
                          'bg-gray-100'
              }`}>
                {done
                  ? <Check size={15} className="text-white" />
                  : <Icon size={15} className={active ? 'text-white' : 'text-gray-400'} />
                }
              </div>
              <span className={`text-[10px] font-semibold hidden sm:block ${
                active ? 'text-brand-700' : done ? 'text-brand-500' : 'text-gray-400'
              }`}>{s.label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`h-0.5 w-12 sm:w-20 mx-1 sm:mx-2 mb-4 transition-all duration-300 rounded-full ${
                i < current ? 'bg-brand-500' : 'bg-gray-200'
              }`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Step 1: Branding ──────────────────────────────────────────────────────────

function BrandingStep({
  orgName, logoUrl, setLogoUrl, brandColor, setBrandColor, onNext, onSkip,
}: {
  orgName: string;
  logoUrl: string; setLogoUrl: (v: string) => void;
  brandColor: string; setBrandColor: (v: string) => void;
  onNext: () => Promise<void>;
  onSkip: () => void;
}) {
  const [saving, setSaving] = useState(false);

  const handleNext = async () => {
    setSaving(true);
    await onNext();
    setSaving(false);
  };

  return (
    <div className="animate-fade-in">
      <h2 className="text-2xl font-bold text-gray-900 mb-1">Make it yours</h2>
      <p className="text-sm text-gray-500 mb-8">
        Add your logo and brand color — your team will see this everywhere.
      </p>

      <div className="space-y-6">
        {/* Logo */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Company logo URL</label>
          <input
            type="url"
            value={logoUrl}
            onChange={(e) => setLogoUrl(e.target.value)}
            placeholder="https://yourcompany.com/logo.png"
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
          />
          <p className="text-xs text-gray-400 mt-1.5">PNG or SVG recommended. Displayed in the navbar.</p>
          {logoUrl && (
            <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-xl inline-flex items-center gap-3">
              <img src={logoUrl} alt="Logo preview" className="h-8 object-contain" onError={() => {}} />
              <span className="text-xs text-gray-500">Preview</span>
            </div>
          )}
        </div>

        {/* Brand color */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Brand color</label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={brandColor}
              onChange={(e) => setBrandColor(e.target.value)}
              className="w-12 h-12 rounded-xl border border-gray-300 cursor-pointer p-1 flex-shrink-0"
            />
            <input
              type="text"
              value={brandColor}
              onChange={(e) => setBrandColor(e.target.value)}
              className="w-36 border border-gray-300 rounded-xl px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <div className="w-12 h-12 rounded-xl border border-gray-200 flex-shrink-0 shadow-sm" style={{ backgroundColor: brandColor }} />
          </div>
          {/* Live preview swatch */}
          <div className="mt-4 flex gap-2 flex-wrap">
            {['#2563eb','#7c3aed','#0891b2','#16a34a','#dc2626','#ea580c','#db2777'].map(c => (
              <button
                key={c}
                onClick={() => setBrandColor(c)}
                className="w-8 h-8 rounded-lg border-2 transition-all hover:scale-110"
                style={{ backgroundColor: c, borderColor: brandColor === c ? c : 'transparent' }}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mt-10">
        <button onClick={onSkip} className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
          Skip for now
        </button>
        <Button onClick={handleNext} loading={saving} icon={<ArrowRight size={15} />}>
          Save & Continue
        </Button>
      </div>
    </div>
  );
}

// ─── Step 2: First Course ──────────────────────────────────────────────────────

function CourseStep({
  onNext, onBack, onSkip,
}: {
  onNext: (title: string, description: string) => Promise<void>;
  onBack: () => void;
  onSkip: () => void;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const handleNext = async () => {
    if (!title.trim()) { toast.error('Course title is required'); return; }
    setSaving(true);
    await onNext(title.trim(), description.trim());
    setSaving(false);
  };

  return (
    <div className="animate-fade-in">
      <h2 className="text-2xl font-bold text-gray-900 mb-1">Create your first course</h2>
      <p className="text-sm text-gray-500 mb-8">
        What's the first thing you want to onboard your team with?
        You can add videos and quizzes after setup.
      </p>

      <div className="space-y-5">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Course title <span className="text-red-400">*</span></label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Company Values & Culture"
            autoFocus
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Description <span className="text-gray-400 font-normal">(optional)</span></label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Briefly describe what new hires will learn..."
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all resize-none"
          />
        </div>

        {/* Suggestion chips */}
        <div>
          <p className="text-xs text-gray-400 mb-2">Popular choices:</p>
          <div className="flex gap-2 flex-wrap">
            {['Company Values & Culture', 'Product Overview', 'Security & Compliance', 'Tools & Processes', 'Team Introduction'].map(s => (
              <button
                key={s}
                onClick={() => setTitle(s)}
                className="text-xs px-3 py-1.5 border border-gray-200 rounded-full text-gray-600 hover:border-brand-300 hover:text-brand-700 hover:bg-brand-50 transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mt-10">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors">
            <ArrowLeft size={14} /> Back
          </button>
          <button onClick={onSkip} className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
            Skip
          </button>
        </div>
        <Button onClick={handleNext} loading={saving} icon={<ArrowRight size={15} />}>
          Create Course
        </Button>
      </div>
    </div>
  );
}

// ─── Step 3: Invite Team ───────────────────────────────────────────────────────

let _rowId = 0;
const nextId = () => ++_rowId;

function InviteStep({
  onNext, onBack, onSkip,
}: {
  onNext: (rows: InviteRow[]) => Promise<void>;
  onBack: () => void;
  onSkip: () => void;
}) {
  const [rows, setRows] = useState<InviteRow[]>([
    { id: nextId(), email: '', role: 'employee' },
  ]);
  const [sending, setSending] = useState(false);

  const addRow = () => setRows(r => [...r, { id: nextId(), email: '', role: 'employee' }]);
  const removeRow = (id: number) => setRows(r => r.filter(x => x.id !== id));
  const updateRow = (id: number, field: keyof InviteRow, value: string) =>
    setRows(r => r.map(x => x.id === id ? { ...x, [field]: value } : x));

  const handleNext = async () => {
    const valid = rows.filter(r => r.email.trim() && r.email.includes('@'));
    if (valid.length === 0) { onSkip(); return; }
    setSending(true);
    await onNext(valid);
    setSending(false);
  };

  return (
    <div className="animate-fade-in">
      <h2 className="text-2xl font-bold text-gray-900 mb-1">Invite your team</h2>
      <p className="text-sm text-gray-500 mb-8">
        They'll receive an email with a 7-day invite link to set up their account.
      </p>

      <div className="space-y-2.5">
        {rows.map((row) => (
          <div key={row.id} className="flex gap-2 items-center">
            <input
              type="email"
              value={row.email}
              onChange={(e) => updateRow(row.id, 'email', e.target.value)}
              placeholder="colleague@company.com"
              className="flex-1 border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
            />
            <select
              value={row.role}
              onChange={(e) => updateRow(row.id, 'role', e.target.value)}
              className="border border-gray-300 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium text-gray-700"
            >
              <option value="employee">Employee</option>
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
            </select>
            {rows.length > 1 && (
              <button
                onClick={() => removeRow(row.id)}
                className="p-2.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
              >
                <X size={14} />
              </button>
            )}
          </div>
        ))}

        <button
          onClick={addRow}
          className="flex items-center gap-2 text-sm text-brand-600 hover:text-brand-700 font-medium mt-1 px-1 py-1 transition-colors"
        >
          <Plus size={14} />
          Add another person
        </button>
      </div>

      <div className="flex items-center justify-between mt-10">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors">
            <ArrowLeft size={14} /> Back
          </button>
          <button onClick={onSkip} className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
            Skip
          </button>
        </div>
        <Button onClick={handleNext} loading={sending} icon={<ArrowRight size={15} />}>
          Send Invites
        </Button>
      </div>
    </div>
  );
}

// ─── Step 4: Done ─────────────────────────────────────────────────────────────

function DoneStep({
  orgName, coursesCreated, invitesSent, onLaunch,
}: {
  orgName: string;
  coursesCreated: number;
  invitesSent: number;
  onLaunch: () => void;
}) {
  return (
    <div className="animate-fade-in text-center">
      <div className="w-20 h-20 bg-gradient-to-br from-brand-500 to-brand-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-elevated">
        <Rocket size={32} className="text-white" />
      </div>

      <h2 className="text-2xl font-bold text-gray-900 mb-2">{orgName} is ready to launch!</h2>
      <p className="text-sm text-gray-500 mb-8">Your workspace is fully configured.</p>

      <div className="grid grid-cols-2 gap-3 mb-10 max-w-sm mx-auto">
        <div className="bg-brand-50 border border-brand-100 rounded-xl px-4 py-4 text-center">
          <p className="text-2xl font-extrabold text-brand-700">{coursesCreated}</p>
          <p className="text-xs text-brand-600 font-medium mt-0.5">Course{coursesCreated !== 1 ? 's' : ''} created</p>
        </div>
        <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-4 text-center">
          <p className="text-2xl font-extrabold text-emerald-700">{invitesSent}</p>
          <p className="text-xs text-emerald-600 font-medium mt-0.5">Invite{invitesSent !== 1 ? 's' : ''} sent</p>
        </div>
      </div>

      <Button onClick={onLaunch} size="lg" className="px-10" icon={<ArrowRight size={15} />}>
        Open Dashboard
      </Button>
    </div>
  );
}

// ─── Main wizard ───────────────────────────────────────────────────────────────

export default function OnboardingWizard() {
  const navigate = useNavigate();
  const { organization, user, setAuth } = useAuthStore();

  const [step, setStep] = useState(0);

  // Branding state
  const [logoUrl, setLogoUrl] = useState(organization?.logo_url ?? '');
  const [brandColor, setBrandColor] = useState(organization?.brand_color ?? '#2563eb');

  // Stats for done screen
  const [coursesCreated, setCoursesCreated] = useState(0);
  const [invitesSent, setInvitesSent] = useState(0);

  // ── Handlers ──────────────────────────────────────────────────────────────

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
    if (sent > 0) {
      toast.success(`${sent} invite${sent > 1 ? 's' : ''} sent!`);
      setInvitesSent(sent);
    }
    setStep(3);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-white border border-gray-200 rounded-full px-4 py-1.5 shadow-sm mb-4">
            <div className="w-5 h-5 bg-brand-600 rounded-md flex items-center justify-center">
              <span className="text-white font-bold text-xs">N</span>
            </div>
            <span className="text-xs font-semibold text-gray-700">Setup Wizard</span>
          </div>
          <p className="text-sm text-gray-500">
            Let's get <strong className="text-gray-800">{organization?.name}</strong> ready in 2 minutes.
          </p>
        </div>

        <StepBar current={step} />

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-elevated border border-gray-100 p-8">
          {step === 0 && (
            <BrandingStep
              orgName={organization?.name ?? ''}
              logoUrl={logoUrl} setLogoUrl={setLogoUrl}
              brandColor={brandColor} setBrandColor={setBrandColor}
              onNext={saveBranding}
              onSkip={() => setStep(1)}
            />
          )}
          {step === 1 && (
            <CourseStep
              onNext={createCourse}
              onBack={() => setStep(0)}
              onSkip={() => setStep(2)}
            />
          )}
          {step === 2 && (
            <InviteStep
              onNext={sendInvites}
              onBack={() => setStep(1)}
              onSkip={() => setStep(3)}
            />
          )}
          {step === 3 && (
            <DoneStep
              orgName={organization?.name ?? 'Your workspace'}
              coursesCreated={coursesCreated}
              invitesSent={invitesSent}
              onLaunch={() => navigate('/admin')}
            />
          )}
        </div>

        {/* Bail-out link */}
        {step < 3 && (
          <p className="text-center text-xs text-gray-400 mt-5">
            <button onClick={() => navigate('/admin')} className="hover:text-gray-600 transition-colors">
              Skip setup and go straight to dashboard →
            </button>
          </p>
        )}
      </div>
    </div>
  );
}
