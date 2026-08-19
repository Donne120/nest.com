import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, ChevronLeft, Zap, Lightbulb } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/client';
import type { Assignment, Module } from '../../types';
import MarkdownField from '../../components/Editor/MarkdownField';

interface FormState {
  title: string;
  description: string;
  worked_example: string;
  type: 'individual' | 'group';
  module_id: string;
  max_group_size: string;
  portions: string[];
  deadline: string;
}

const EMPTY: FormState = {
  title: '',
  description: '',
  worked_example: '',
  type: 'individual',
  module_id: '',
  max_group_size: '4',
  portions: ['Introduction', 'Analysis', 'Conclusion'],
  deadline: '',
};

export default function AdminAssignmentEditor() {
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const isEdit = !!assignmentId;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<FormState>(EMPTY);

  // Modules list for the selector
  const { data: modules = [] } = useQuery<Module[]>({
    queryKey: ['modules'],
    queryFn: () => api.get('/modules').then(r => r.data),
  });

  // Load existing assignment for edit
  const { data: existing } = useQuery<Assignment>({
    queryKey: ['assignment', assignmentId],
    queryFn: () => api.get(`/assignments/${assignmentId}`).then(r => r.data),
    enabled: isEdit,
  });

  useEffect(() => {
    if (!existing) return;
    setForm({
      title: existing.title,
      description: existing.description ?? '',
      worked_example: (existing as any).worked_example ?? '',
      type: existing.type,
      module_id: existing.module_id ?? '',
      max_group_size: String(existing.max_group_size ?? 4),
      portions: existing.portions ?? [],
      deadline: existing.deadline
        ? existing.deadline.slice(0, 16) // datetime-local format
        : '',
    });
  }, [existing]);

  // Create
  const createMutation = useMutation({
    mutationFn: (data: object) => api.post('/assignments', data).then(r => r.data),
    onSuccess: (a: Assignment) => {
      toast.success('Assignment created');
      queryClient.invalidateQueries({ queryKey: ['admin', 'assignments'] });
      navigate(`/admin/assignments/${a.id}`);
    },
    onError: (err: { response?: { data?: { detail?: string } } }) => {
      toast.error(err.response?.data?.detail ?? 'Failed to create');
    },
  });

  // Update
  const updateMutation = useMutation({
    mutationFn: (data: object) =>
      api.put(`/assignments/${assignmentId}`, data).then(r => r.data),
    onSuccess: () => {
      toast.success('Saved');
      queryClient.invalidateQueries({ queryKey: ['admin', 'assignments'] });
      queryClient.invalidateQueries({ queryKey: ['assignment', assignmentId] });
    },
    onError: (err: { response?: { data?: { detail?: string } } }) => {
      toast.error(err.response?.data?.detail ?? 'Failed to save');
    },
  });

  // Activate
  const activateMutation = useMutation({
    mutationFn: () =>
      api.post(`/assignments/${assignmentId}/activate`).then(r => r.data),
    onSuccess: (a: Assignment) => {
      toast.success('Assignment published! Groups formed.');
      queryClient.invalidateQueries({ queryKey: ['admin', 'assignments'] });
      navigate(`/admin/assignments/${a.id}`);
    },
    onError: (err: { response?: { data?: { detail?: string } } }) => {
      toast.error(err.response?.data?.detail ?? 'Failed to activate');
    },
  });

  function buildPayload(draft: boolean) {
    return {
      title: form.title,
      description: form.description || null,
      worked_example: form.worked_example.trim() || null,
      type: form.type,
      module_id: form.module_id || null,
      max_group_size: form.type === 'group' ? parseInt(form.max_group_size) : null,
      portions: form.type === 'group' ? form.portions.filter(p => p.trim()) : null,
      deadline: form.deadline ? new Date(form.deadline).toISOString() : null,
      ...(draft ? {} : {}),
    };
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) { toast.error('Title is required'); return; }
    if (isEdit) {
      updateMutation.mutate(buildPayload(true));
    } else {
      createMutation.mutate(buildPayload(true));
    }
  }

  function handleActivate() {
    if (!assignmentId) return;
    if (window.confirm('Publish this assignment? Groups will be formed automatically.')) {
      activateMutation.mutate();
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending;
  const isActive = existing?.status === 'active';
  const isClosed = existing?.status === 'closed';

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/admin/assignments')}
          className="flex items-center gap-1 text-sm text-[var(--c-ink2)] hover:text-[var(--c-ink)] dark:hover:text-white transition"
        >
          <ChevronLeft size={16} /> Assignments
        </button>
        <div className="flex items-center gap-3">
          {isEdit && existing?.status === 'draft' && (
            <button
              onClick={handleActivate}
              disabled={activateMutation.isPending}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-xl transition disabled:opacity-50"
            >
              <Zap size={15} /> Publish
            </button>
          )}
          {!isClosed && (
            <button
              onClick={handleSave}
              disabled={isPending}
              form="assignment-form"
              className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-xl transition disabled:opacity-50"
            >
              {isPending ? 'Saving…' : isEdit ? 'Save' : 'Create Draft'}
            </button>
          )}
        </div>
      </div>

      <h1 className="text-2xl font-bold text-[var(--c-ink)]">
        {isEdit ? 'Edit Assignment' : 'New Assignment'}
      </h1>

      <form id="assignment-form" onSubmit={handleSave} className="space-y-6">

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-[var(--c-ink2)] dark:text-[var(--c-ink2)] mb-1">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            disabled={isActive || isClosed}
            placeholder="e.g. Module 3 Group Research Project"
            className="w-full px-4 py-2.5 border border-[var(--c-rule)] dark:border-[var(--c-rule)] rounded-xl bg-[var(--c-surf)] text-[var(--c-ink)] placeholder-[var(--c-ink3)] focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none disabled:opacity-60"
          />
        </div>

        {/* Module */}
        <div>
          <label className="block text-sm font-medium text-[var(--c-ink2)] dark:text-[var(--c-ink2)] mb-1">
            Module
            <span className="ml-2 text-xs font-normal text-[var(--c-ink3)]">
              Learners see this assignment on the module's video page
            </span>
          </label>
          <select
            value={form.module_id}
            onChange={e => setForm(f => ({ ...f, module_id: e.target.value }))}
            disabled={isClosed}
            className="w-full px-4 py-2.5 border border-[var(--c-rule)] dark:border-[var(--c-rule)] rounded-xl bg-[var(--c-surf)] text-[var(--c-ink)] focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none disabled:opacity-60"
          >
            <option value="">— No module (standalone) —</option>
            {modules.map(m => (
              <option key={m.id} value={m.id}>{m.title}</option>
            ))}
          </select>
        </div>

        {/* Instructions — markdown/LaTeX so pasted math, tables & diagrams render */}
        <MarkdownField
          label="Instructions"
          value={form.description}
          onChange={v => setForm(f => ({ ...f, description: v }))}
          placeholder={"Write the assignment brief. Supports headings, math ($…$ and $$…$$), tables and diagrams.\n\ne.g.\n## Task\nCalculate the relative atomic mass ($A_r$) of the sample."}
          rows={8}
          hint={<>Supports Markdown, tables and LaTeX math (<code className="px-1 rounded bg-[var(--c-bg2)]">$…$</code>). Use <strong>Preview</strong> to check.</>}
        />

        {/* Worked example — a fully solved problem shown beside the learner's work */}
        <MarkdownField
          label={<span className="inline-flex items-center gap-1.5"><Lightbulb size={14} style={{ color: 'var(--c-acc)' }} /> Worked example <span className="text-[var(--c-ink3)] font-normal">(optional)</span></span>}
          value={form.worked_example}
          onChange={v => setForm(f => ({ ...f, worked_example: v }))}
          placeholder={"Paste a fully solved example. Learners study it, then solve their own — 'learn while doing'.\n\ne.g.\n### Example: Gallium\nProblem: 60% ⁶⁹Ga, 40% ⁷¹Ga.\n$$A_r = \\frac{(69 \\times 60)+(71 \\times 40)}{100} = 69.8$$"}
          rows={9}
          hint="This appears next to the learner's work area as a solved example to learn from."
        />

        {/* Type toggle */}
        <div>
          <label className="block text-sm font-medium text-[var(--c-ink2)] dark:text-[var(--c-ink2)] mb-2">
            Type
          </label>
          <div className="flex gap-3">
            {(['individual', 'group'] as const).map(t => (
              <button
                key={t}
                type="button"
                disabled={isActive || isClosed}
                onClick={() => setForm(f => ({ ...f, type: t }))}
                className={`flex-1 py-2.5 rounded-xl border text-sm font-medium transition capitalize ${
                  form.type === t
                    ? 'border-brand-500 bg-brand-500/10 dark:bg-brand-950 text-brand-400 dark:text-brand-300'
                    : 'border-[var(--c-rule)] text-[var(--c-ink2)] dark:text-[var(--c-ink3)] hover:border-[var(--c-rule)]'
                } disabled:opacity-60`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Group settings */}
        {form.type === 'group' && (
          <div className="space-y-4 border border-[var(--c-rule)] rounded-xl p-4 bg-[var(--c-bg2)] dark:bg-[var(--c-bg2)]/50">
            <div>
              <label className="block text-sm font-medium text-[var(--c-ink2)] dark:text-[var(--c-ink2)] mb-1">
                Max group size
              </label>
              <input
                type="number"
                min={2}
                max={20}
                value={form.max_group_size}
                disabled={isActive || isClosed}
                onChange={e => setForm(f => ({ ...f, max_group_size: e.target.value }))}
                className="w-32 px-3 py-2 border border-[var(--c-rule)] dark:border-[var(--c-rule)] rounded-xl bg-[var(--c-surf)] text-[var(--c-ink)] focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none disabled:opacity-60"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--c-ink2)] dark:text-[var(--c-ink2)] mb-2">
                Portion labels
                <span className="ml-2 text-xs font-normal text-[var(--c-ink3)]">Each member gets one portion</span>
              </label>
              <div className="space-y-2">
                {form.portions.map((p, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-xs text-[var(--c-ink3)] w-5 text-right">{i + 1}.</span>
                    <input
                      type="text"
                      value={p}
                      disabled={isActive || isClosed}
                      onChange={e => {
                        const next = [...form.portions];
                        next[i] = e.target.value;
                        setForm(f => ({ ...f, portions: next }));
                      }}
                      className="flex-1 px-3 py-1.5 border border-[var(--c-rule)] dark:border-[var(--c-rule)] rounded-lg bg-[var(--c-surf)] text-sm text-[var(--c-ink)] focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none disabled:opacity-60"
                    />
                    {!isActive && !isClosed && form.portions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setForm(f => ({ ...f, portions: f.portions.filter((_, j) => j !== i) }))}
                        className="p-1 text-[var(--c-ink3)] hover:text-red-500 transition"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                ))}
                {!isActive && !isClosed && (
                  <button
                    type="button"
                    onClick={() => setForm(f => ({ ...f, portions: [...f.portions, ''] }))}
                    className="flex items-center gap-1.5 text-xs text-brand-600 hover:text-brand-400 font-medium mt-1"
                  >
                    <Plus size={13} /> Add portion
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Deadline */}
        <div>
          <label className="block text-sm font-medium text-[var(--c-ink2)] dark:text-[var(--c-ink2)] mb-1">
            Deadline
          </label>
          <input
            type="datetime-local"
            value={form.deadline}
            disabled={isActive && isClosed}
            onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))}
            className="px-4 py-2.5 border border-[var(--c-rule)] dark:border-[var(--c-rule)] rounded-xl bg-[var(--c-surf)] text-[var(--c-ink)] focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none disabled:opacity-60"
          />
        </div>

        {isActive && (
          <div className="bg-green-500/10 dark:bg-green-950 border border-green-500/30 dark:border-green-800 rounded-xl p-3 text-sm text-green-400 dark:text-green-300">
            This assignment is live. You can still update the deadline and meeting locks in the detail view.
          </div>
        )}
      </form>
    </div>
  );
}
