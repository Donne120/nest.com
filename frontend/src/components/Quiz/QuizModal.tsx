import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, XCircle, AlignLeft, ChevronRight, Trophy, RotateCcw, X } from 'lucide-react';
import api from '../../api/client';
import type { QuizQuestion, QuizAnswerSubmit, QuizSubmissionResult, QuizAnswerResult } from '../../types';
import Button from '../UI/Button';
import clsx from 'clsx';

interface Props {
  videoId: string;
  questions: QuizQuestion[];
  onClose: () => void;
  existingResult?: QuizSubmissionResult | null;
}

export default function QuizModal({ videoId, questions, onClose, existingResult }: Props) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState<'intro' | 'quiz' | 'result'>(existingResult ? 'result' : 'intro');
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<string, QuizAnswerSubmit>>({});
  const [result, setResult] = useState<QuizSubmissionResult | null>(existingResult || null);

  const totalQ = questions.length;
  const currentQ = questions[current];

  const submit = useMutation({
    mutationFn: () =>
      api.post('/quiz/submit', {
        video_id: videoId,
        answers: Object.values(answers),
      }).then(r => r.data as QuizSubmissionResult),
    onSuccess: (data) => {
      setResult(data);
      setStep('result');
      queryClient.invalidateQueries({ queryKey: ['quiz-submission', videoId] });
    },
  });

  const setOptionAnswer = (questionId: string, optionId: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: { question_id: questionId, selected_option_id: optionId } }));
  };

  const setTextAnswer = (questionId: string, text: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: { question_id: questionId, answer_text: text } }));
  };

  const canProceed = () => {
    if (!currentQ.is_required) return true;
    const ans = answers[currentQ.id];
    if (currentQ.question_type === 'short_answer') return !!ans?.answer_text?.trim();
    return !!ans?.selected_option_id;
  };

  const handleNext = () => {
    if (current < totalQ - 1) setCurrent(current + 1);
    else submit.mutate();
  };

  const handleRetake = () => {
    setAnswers({});
    setCurrent(0);
    setResult(null);
    setStep('quiz');
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-modal w-full max-w-lg max-h-[90vh] overflow-y-auto animate-slide-in">

        {/* ── Intro screen ── */}
        {step === 'intro' && (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-brand-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Trophy size={28} className="text-brand-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Video Complete!</h2>
            <p className="text-gray-500 text-sm mb-1">
              This video has a <strong>{totalQ}-question</strong> quiz to check your understanding.
            </p>
            <p className="text-xs text-gray-400 mb-6">You need 70% or higher to pass.</p>
            <div className="flex gap-3 justify-center">
              <Button variant="secondary" onClick={onClose}>Skip for now</Button>
              <Button onClick={() => setStep('quiz')}>Start Quiz</Button>
            </div>
          </div>
        )}

        {/* ── Quiz questions ── */}
        {step === 'quiz' && currentQ && (
          <div>
            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-medium text-gray-500">
                    Question {current + 1} of {totalQ}
                  </span>
                  {currentQ.is_required && <span className="text-xs text-red-500">Required</span>}
                </div>
                {/* Progress */}
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-brand-500 rounded-full transition-all duration-500"
                    style={{ width: `${((current + 1) / totalQ) * 100}%` }}
                  />
                </div>
              </div>
              <button onClick={onClose} className="ml-4 p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                <X size={16} className="text-gray-400" />
              </button>
            </div>

            <div className="px-6 py-5">
              {/* Type badge */}
              <div className="mb-3">
                <span className={clsx('text-xs font-medium px-2.5 py-1 rounded-full border', {
                  'bg-brand-50 text-brand-700 border-brand-200': currentQ.question_type === 'mcq',
                  'bg-emerald-50 text-emerald-700 border-emerald-200': currentQ.question_type === 'short_answer',
                  'bg-purple-50 text-purple-700 border-purple-200': currentQ.question_type === 'true_false',
                })}>
                  {currentQ.question_type === 'mcq' ? 'Multiple Choice'
                    : currentQ.question_type === 'short_answer' ? 'Short Answer'
                    : 'True / False'}
                </span>
              </div>

              {/* Question */}
              <p className="text-base font-semibold text-gray-900 leading-relaxed mb-5">
                {currentQ.question_text}
              </p>

              {/* MCQ / True-False options */}
              {currentQ.question_type !== 'short_answer' && (
                <div className="space-y-2.5">
                  {currentQ.options.map((opt, i) => {
                    const selected = answers[currentQ.id]?.selected_option_id === opt.id;
                    return (
                      <button
                        key={opt.id}
                        onClick={() => setOptionAnswer(currentQ.id, opt.id)}
                        className={clsx(
                          'w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all',
                          selected
                            ? 'border-brand-500 bg-brand-50 text-brand-900'
                            : 'border-gray-200 hover:border-brand-300 hover:bg-gray-50'
                        )}
                      >
                        <div className={clsx(
                          'w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors',
                          selected ? 'border-brand-500 bg-brand-500' : 'border-gray-300'
                        )}>
                          {selected && <div className="w-2 h-2 bg-white rounded-full" />}
                        </div>
                        <span className="text-sm font-medium">
                          {currentQ.question_type === 'mcq' && (
                            <span className="text-gray-400 mr-2">{String.fromCharCode(65 + i)}.</span>
                          )}
                          {opt.option_text}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Short answer */}
              {currentQ.question_type === 'short_answer' && (
                <div>
                  <textarea
                    autoFocus
                    rows={4}
                    value={answers[currentQ.id]?.answer_text || ''}
                    onChange={e => setTextAnswer(currentQ.id, e.target.value)}
                    placeholder="Type your answer here..."
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                  <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                    <AlignLeft size={11} /> Your answer will be reviewed by a manager
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-6 pb-5">
              <button
                onClick={() => setCurrent(Math.max(0, current - 1))}
                disabled={current === 0}
                className="text-sm text-gray-500 hover:text-gray-700 disabled:opacity-40 transition-colors"
              >
                ← Back
              </button>
              <Button
                icon={current < totalQ - 1 ? <ChevronRight size={15} /> : undefined}
                onClick={handleNext}
                loading={submit.isPending}
                disabled={!canProceed()}
              >
                {current < totalQ - 1 ? 'Next' : 'Submit Quiz'}
              </Button>
            </div>
          </div>
        )}

        {/* ── Results screen ── */}
        {step === 'result' && result && (
          <div className="p-8">
            {/* Score header */}
            <div className="text-center mb-6">
              <div className={clsx(
                'w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold',
                result.passed ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
              )}>
                {result.score !== null ? `${Math.round(result.score)}%` : '—'}
              </div>
              <h2 className="text-xl font-bold text-gray-900">
                {result.passed ? 'Well done!' : 'Keep learning!'}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {result.max_score > 0
                  ? `${result.answers.filter(a => a.is_correct).length} / ${result.max_score} correct`
                  : 'Answers submitted for review'}
              </p>
            </div>

            {/* Answer review */}
            <div className="space-y-3 mb-6">
              {result.answers.map((ans) => (
                <AnswerReview key={ans.question_id} ans={ans} questions={questions} />
              ))}
            </div>

            <div className="flex gap-3">
              <Button variant="secondary" icon={<RotateCcw size={14} />} onClick={handleRetake} className="flex-1">
                Retake
              </Button>
              <Button onClick={onClose} className="flex-1">
                Continue
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function AnswerReview({ ans, questions }: { ans: QuizAnswerResult; questions: QuizQuestion[] }) {
  const [open, setOpen] = useState(false);
  const q = questions.find(q => q.id === ans.question_id);

  const correctLabel = q?.options?.find(o => o.id === ans.correct_option_id)?.option_text;
  const selectedLabel = q?.options?.find(o => o.id === ans.selected_option_id)?.option_text;

  return (
    <div className={clsx(
      'rounded-xl border p-3 cursor-pointer',
      ans.is_correct === true ? 'border-emerald-200 bg-emerald-50/50'
        : ans.is_correct === false ? 'border-red-200 bg-red-50/50'
        : 'border-gray-200 bg-gray-50/50'
    )} onClick={() => setOpen(!open)}>
      <div className="flex items-start gap-2.5">
        {ans.is_correct === true && <CheckCircle2 size={16} className="text-emerald-500 flex-shrink-0 mt-0.5" />}
        {ans.is_correct === false && <XCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />}
        {ans.is_correct === null && <AlignLeft size={16} className="text-gray-400 flex-shrink-0 mt-0.5" />}
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-900">{ans.question_text}</p>
          {open && (
            <div className="mt-2 space-y-1 text-xs text-gray-600">
              {ans.answer_text && <p><span className="font-medium">Your answer:</span> {ans.answer_text}</p>}
              {selectedLabel && <p><span className="font-medium">Your choice:</span> {selectedLabel}</p>}
              {ans.is_correct === false && correctLabel && (
                <p className="text-emerald-700"><span className="font-medium">Correct:</span> {correctLabel}</p>
              )}
              {ans.explanation && (
                <p className="bg-white rounded-lg px-3 py-2 border border-gray-200 mt-1.5 italic">{ans.explanation}</p>
              )}
              {ans.is_correct === null && (
                <p className="text-amber-600">Free-text answer — awaiting manager review</p>
              )}
            </div>
          )}
        </div>
        <span className="text-xs text-gray-400">{open ? '▲' : '▼'}</span>
      </div>
    </div>
  );
}
