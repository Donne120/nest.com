import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus, Trash2, GripVertical, CheckCircle2, AlignLeft,
  ToggleLeft, ChevronDown, ChevronUp, Save, X
} from 'lucide-react';
import api from '../../api/client';
import type { QuizQuestion, QuestionType } from '../../types';
import Button from '../UI/Button';
import toast from 'react-hot-toast';
import clsx from 'clsx';

const TYPE_CONFIG: Record<QuestionType, { label: string; icon: React.ReactNode; color: string }> = {
  mcq:          { label: 'Multiple Choice', icon: <CheckCircle2 size={14} />, color: 'text-brand-600 bg-brand-50 border-brand-200' },
  short_answer: { label: 'Short Answer',    icon: <AlignLeft size={14} />,    color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  true_false:   { label: 'True / False',    icon: <ToggleLeft size={14} />,   color: 'text-purple-600 bg-purple-50 border-purple-200' },
};

interface EditingQuestion {
  id?: string;
  question_text: string;
  question_type: QuestionType;
  order_index: number;
  is_required: boolean;
  explanation: string;
  options: { option_text: string; is_correct: boolean; order_index: number }[];
}

function blankQuestion(order: number): EditingQuestion {
  return {
    question_text: '',
    question_type: 'mcq',
    order_index: order,
    is_required: true,
    explanation: '',
    options: [
      { option_text: '', is_correct: false, order_index: 0 },
      { option_text: '', is_correct: false, order_index: 1 },
      { option_text: '', is_correct: false, order_index: 2 },
      { option_text: '', is_correct: false, order_index: 3 },
    ],
  };
}

function trueFalseOptions() {
  return [
    { option_text: 'True', is_correct: false, order_index: 0 },
    { option_text: 'False', is_correct: false, order_index: 1 },
  ];
}

interface Props {
  videoId: string;
  videoTitle: string;
}

export default function QuizBuilder({ videoId, videoTitle }: Props) {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | 'new' | null>(null);
  const [form, setForm] = useState<EditingQuestion | null>(null);

  const { data: questions = [], isLoading } = useQuery<QuizQuestion[]>({
    queryKey: ['quiz-admin', videoId],
    queryFn: () => api.get(`/quiz/admin/video/${videoId}`).then(r => r.data),
  });

  const saveQuestion = useMutation({
    mutationFn: (q: EditingQuestion) =>
      q.id
        ? api.put(`/quiz/admin/question/${q.id}`, q)
        : api.post(`/quiz/admin/video/${videoId}`, q),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quiz-admin', videoId] });
      setEditingId(null);
      setForm(null);
      toast.success('Question saved!');
    },
    onError: () => toast.error('Failed to save question'),
  });

  const deleteQuestion = useMutation({
    mutationFn: (id: string) => api.delete(`/quiz/admin/question/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quiz-admin', videoId] });
      toast.success('Question deleted');
    },
  });

  const startEdit = (q: QuizQuestion) => {
    setEditingId(q.id);
    setForm({
      id: q.id,
      question_text: q.question_text,
      question_type: q.question_type,
      order_index: q.order_index,
      is_required: q.is_required,
      explanation: q.explanation || '',
      options: q.options.map(o => ({ option_text: o.option_text, is_correct: !!o.is_correct, order_index: o.order_index })),
    });
  };

  const startNew = () => {
    const q = blankQuestion(questions.length);
    setEditingId('new');
    setForm(q);
  };

  const cancelEdit = () => { setEditingId(null); setForm(null); };

  const handleTypeChange = (type: QuestionType) => {
    if (!form) return;
    let options = form.options;
    if (type === 'true_false') options = trueFalseOptions();
    else if (type === 'mcq' && form.question_type === 'true_false') options = blankQuestion(0).options;
    else if (type === 'short_answer') options = [];
    setForm({ ...form, question_type: type, options });
  };

  const setCorrect = (idx: number) => {
    if (!form) return;
    setForm({
      ...form,
      options: form.options.map((o, i) => ({ ...o, is_correct: i === idx })),
    });
  };

  const validate = () => {
    if (!form) return false;
    if (!form.question_text.trim()) { toast.error('Question text required'); return false; }
    if (form.question_type !== 'short_answer') {
      if (form.options.some(o => !o.option_text.trim())) { toast.error('Fill in all answer options'); return false; }
      if (!form.options.some(o => o.is_correct)) { toast.error('Mark at least one correct answer'); return false; }
    }
    return true;
  };

  return (
    <div className="border border-gray-200 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 bg-gray-50 border-b border-gray-200">
        <div>
          <p className="text-sm font-semibold text-gray-900">Quiz Questions</p>
          <p className="text-xs text-gray-500">{videoTitle}</p>
        </div>
        <Button size="sm" icon={<Plus size={14} />} onClick={startNew} disabled={editingId !== null}>
          Add Question
        </Button>
      </div>

      {/* Existing questions */}
      <div className="divide-y divide-gray-100">
        {isLoading && (
          <p className="text-sm text-gray-400 px-5 py-4">Loading...</p>
        )}

        {questions.map((q, idx) => (
          <div key={q.id}>
            {/* Question row */}
            {editingId === q.id && form ? (
              <QuestionForm
                form={form}
                setForm={setForm}
                onTypeChange={handleTypeChange}
                onSetCorrect={setCorrect}
                onSave={() => { if (validate()) saveQuestion.mutate(form); }}
                onCancel={cancelEdit}
                saving={saveQuestion.isPending}
              />
            ) : (
              <div className="flex items-start gap-3 px-5 py-4 hover:bg-gray-50/60 group">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-100 text-xs font-semibold text-gray-500 flex items-center justify-center mt-0.5">
                  {idx + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{q.question_text}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={clsx('inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-medium', TYPE_CONFIG[q.question_type].color)}>
                      {TYPE_CONFIG[q.question_type].icon}
                      {TYPE_CONFIG[q.question_type].label}
                    </span>
                    <span className="text-xs text-gray-400">{q.options.length} options</span>
                    {q.is_required && <span className="text-xs text-red-500">Required</span>}
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => startEdit(q)}
                    className="px-3 py-1 text-xs text-gray-600 hover:text-brand-700 border border-gray-200 rounded-lg hover:border-brand-300 transition-all"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => { if (confirm('Delete this question?')) deleteQuestion.mutate(q.id); }}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* New question form */}
        {editingId === 'new' && form && (
          <QuestionForm
            form={form}
            setForm={setForm}
            onTypeChange={handleTypeChange}
            onSetCorrect={setCorrect}
            onSave={() => { if (validate()) saveQuestion.mutate(form); }}
            onCancel={cancelEdit}
            saving={saveQuestion.isPending}
          />
        )}

        {questions.length === 0 && editingId !== 'new' && (
          <div className="text-center py-10 text-gray-400">
            <CheckCircle2 size={28} className="mx-auto mb-2 opacity-40" />
            <p className="text-sm">No quiz questions yet</p>
            <p className="text-xs mt-1">Click "Add Question" to build this video's quiz</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Inline question editor ────────────────────────────────────────────────────

interface FormProps {
  form: EditingQuestion;
  setForm: (f: EditingQuestion) => void;
  onTypeChange: (t: QuestionType) => void;
  onSetCorrect: (idx: number) => void;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
}

function QuestionForm({ form, setForm, onTypeChange, onSetCorrect, onSave, onCancel, saving }: FormProps) {
  const [showExplanation, setShowExplanation] = useState(!!form.explanation);

  return (
    <div className="p-5 bg-blue-50/30 border-l-4 border-brand-500 space-y-4">
      {/* Type selector */}
      <div className="flex gap-2">
        {(Object.keys(TYPE_CONFIG) as QuestionType[]).map(t => (
          <button
            key={t}
            onClick={() => onTypeChange(t)}
            className={clsx(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all',
              form.question_type === t
                ? TYPE_CONFIG[t].color + ' shadow-sm'
                : 'border-gray-200 text-gray-500 hover:border-gray-300 bg-white'
            )}
          >
            {TYPE_CONFIG[t].icon}
            {TYPE_CONFIG[t].label}
          </button>
        ))}
      </div>

      {/* Question text */}
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Question</label>
        <textarea
          autoFocus
          rows={2}
          value={form.question_text}
          onChange={e => setForm({ ...form, question_text: e.target.value })}
          placeholder="Enter your question..."
          className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>

      {/* Options (MCQ / T/F) */}
      {form.question_type !== 'short_answer' && (
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">
            Answer Options — click radio to mark correct
          </label>
          <div className="space-y-2">
            {form.options.map((opt, i) => (
              <div key={i} className="flex items-center gap-2">
                <button
                  onClick={() => onSetCorrect(i)}
                  className={clsx(
                    'w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors',
                    opt.is_correct
                      ? 'border-emerald-500 bg-emerald-500'
                      : 'border-gray-300 hover:border-emerald-400'
                  )}
                >
                  {opt.is_correct && <div className="w-2 h-2 bg-white rounded-full" />}
                </button>
                {form.question_type === 'true_false' ? (
                  <span className="flex-1 text-sm text-gray-700 font-medium">{opt.option_text}</span>
                ) : (
                  <input
                    value={opt.option_text}
                    onChange={e => {
                      const opts = [...form.options];
                      opts[i] = { ...opts[i], option_text: e.target.value };
                      setForm({ ...form, options: opts });
                    }}
                    placeholder={`Option ${String.fromCharCode(65 + i)}`}
                    className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                )}
              </div>
            ))}

            {form.question_type === 'mcq' && form.options.length < 6 && (
              <button
                onClick={() => setForm({
                  ...form,
                  options: [...form.options, { option_text: '', is_correct: false, order_index: form.options.length }],
                })}
                className="flex items-center gap-1.5 text-xs text-brand-600 hover:text-brand-800 mt-1 transition-colors"
              >
                <Plus size={13} /> Add option
              </button>
            )}
          </div>
        </div>
      )}

      {/* Short answer hint */}
      {form.question_type === 'short_answer' && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-sm text-emerald-700">
          Employees type a free-text response. Answers will be visible to managers for manual review.
        </div>
      )}

      {/* Explanation toggle */}
      <div>
        <button
          onClick={() => setShowExplanation(!showExplanation)}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors"
        >
          {showExplanation ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          {showExplanation ? 'Hide explanation' : 'Add explanation (shown after answer)'}
        </button>
        {showExplanation && (
          <textarea
            rows={2}
            value={form.explanation}
            onChange={e => setForm({ ...form, explanation: e.target.value })}
            placeholder="Explain why the correct answer is right (shown after submission)..."
            className="mt-2 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        )}
      </div>

      {/* Required toggle */}
      <label className="flex items-center gap-2.5 cursor-pointer">
        <div className="relative">
          <input type="checkbox" checked={form.is_required} onChange={e => setForm({ ...form, is_required: e.target.checked })} className="sr-only peer" />
          <div className="w-8 h-5 bg-gray-200 rounded-full peer peer-checked:bg-brand-600 transition-colors" />
          <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform peer-checked:translate-x-3" />
        </div>
        <span className="text-sm text-gray-700">Required question</span>
      </label>

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <Button size="sm" variant="secondary" icon={<X size={13} />} onClick={onCancel}>Cancel</Button>
        <Button size="sm" icon={<Save size={13} />} onClick={onSave} loading={saving}>Save Question</Button>
      </div>
    </div>
  );
}
