import { useState, useEffect } from 'react';
import { X, ArrowRight, BookOpen, Video, MessageCircle, Sparkles, ClipboardList, Calendar } from 'lucide-react';
import { useOnboardingStore } from '../../store';
import { useAuthStore } from '../../store';

interface Step {
  icon: React.ReactNode;
  title: string;
  body: string;
  emoji: string;
}

const LEARNER_STEPS: Step[] = [
  {
    emoji: '👋',
    icon: <BookOpen size={22} />,
    title: 'Welcome to Nest',
    body: 'Nest is your onboarding hub. Everything your team needs you to learn is here — videos, Q&A, assignments, and more. This quick tour shows you around.',
  },
  {
    emoji: '🎬',
    icon: <Video size={22} />,
    title: 'Watch your modules',
    body: 'Go to Modules from the top menu to see your training courses. Click any module to open it, then pick a video to start watching. Your progress is saved automatically.',
  },
  {
    emoji: '❓',
    icon: <MessageCircle size={22} />,
    title: 'Ask questions as you learn',
    body: 'Pause any video and click "Ask a Question". Your question gets pinned to that exact moment in the video. Your manager will see it and answer — you\'ll get a notification.',
  },
  {
    emoji: '✨',
    icon: <Sparkles size={22} />,
    title: 'Get instant AI answers',
    body: 'Want an answer right now? Click the Ask AI button while watching. An AI that has read the video will answer you instantly in a private notebook — just for you.',
  },
  {
    emoji: '📋',
    icon: <ClipboardList size={22} />,
    title: 'Complete your assignments',
    body: 'Your manager may assign practical tasks. Find them under Assignments in the top menu. Write your response in the editor and submit when you\'re ready.',
  },
  {
    emoji: '📅',
    icon: <Calendar size={22} />,
    title: 'Book a meeting',
    body: 'Need face time with your manager? Head to Meetings to request a 1-on-1. You\'ll get an email and notification once it\'s confirmed. That\'s it — you\'re all set!',
  },
];

const MANAGER_STEPS: Step[] = [
  {
    emoji: '👋',
    icon: <BookOpen size={22} />,
    title: 'Welcome to Nest Admin',
    body: 'You\'re set up as a manager. From here you can create courses, review learner questions, manage assignments, and track progress across your whole team.',
  },
  {
    emoji: '🎬',
    icon: <Video size={22} />,
    title: 'Create your first course',
    body: 'Go to Admin → Courses to build modules and upload training videos. Add a title, description, and thumbnail to make each module easy to find.',
  },
  {
    emoji: '❓',
    icon: <MessageCircle size={22} />,
    title: 'Review learner questions',
    body: 'When a learner asks a question during a video, it appears in Admin → Questions. You can answer it directly or let the AI draft an answer for you to approve.',
  },
  {
    emoji: '📋',
    icon: <ClipboardList size={22} />,
    title: 'Assign and review work',
    body: 'Create practical assignments under Admin → Assignments. Once learners submit, you can review, comment, and mark them as passed or needs revision.',
  },
  {
    emoji: '📊',
    icon: <Sparkles size={22} />,
    title: 'Track team progress',
    body: 'Admin → Analytics shows completion rates, question response times, and per-learner metrics. Great for spotting who needs extra support.',
  },
  {
    emoji: '🚀',
    icon: <Calendar size={22} />,
    title: 'You\'re ready to go',
    body: 'Invite your team under Admin → People, set your brand colours in Settings, and you\'re live. Your learners will see this same tour when they first log in.',
  },
];

export default function OnboardingTour() {
  const { tourDone, completeTour } = useOnboardingStore();
  const { user } = useAuthStore();
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!tourDone && user) {
      // Small delay so page renders first
      const t = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(t);
    }
  }, [tourDone, user]);

  if (!visible || tourDone) return null;

  const isManager = user?.role === 'educator' || user?.role === 'owner';
  const steps = isManager ? MANAGER_STEPS : LEARNER_STEPS;
  const current = steps[step];
  const isLast = step === steps.length - 1;

  function next() {
    if (isLast) {
      setVisible(false);
      completeTour();
    } else {
      setStep((s) => s + 1);
    }
  }

  function dismiss() {
    setVisible(false);
    completeTour();
  }

  return (
    <>
      {/* Backdrop */}
      <div
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.55)',
          zIndex: 10000,
          backdropFilter: 'blur(2px)',
        }}
        onClick={dismiss}
      />

      {/* Card */}
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 400,
          maxWidth: 'calc(100vw - 32px)',
          zIndex: 10001,
          borderRadius: 20,
          overflow: 'hidden',
          background: 'rgba(16,17,23,0.98)',
          border: '1px solid rgba(255,255,255,0.09)',
          boxShadow: '0 32px 100px rgba(0,0,0,0.7)',
          animation: 'tourIn 0.3s ease',
        }}
      >
        <style>{`@keyframes tourIn { from { opacity:0; transform:translate(-50%,-48%) scale(0.96); } to { opacity:1; transform:translate(-50%,-50%) scale(1); } }`}</style>

        {/* Progress bar */}
        <div style={{ height: 3, background: 'rgba(255,255,255,0.06)' }}>
          <div style={{
            height: '100%',
            width: `${((step + 1) / steps.length) * 100}%`,
            background: 'linear-gradient(90deg,#e8c97e,#c45c3c)',
            transition: 'width 0.35s ease',
            borderRadius: 2,
          }} />
        </div>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px 0' }}>
          <span style={{ fontSize: 11, color: '#6b6b78', letterSpacing: '0.06em', fontWeight: 500 }}>
            {step + 1} of {steps.length}
          </span>
          <button
            onClick={dismiss}
            style={{
              background: 'transparent', border: 'none', cursor: 'pointer',
              color: '#6b6b78', padding: 4, borderRadius: 6, lineHeight: 0,
            }}
            onMouseEnter={e => (e.currentTarget.style.color = '#9ca3af')}
            onMouseLeave={e => (e.currentTarget.style.color = '#6b6b78')}
          >
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 24px 24px' }}>
          <div style={{ fontSize: 40, marginBottom: 12, lineHeight: 1 }}>{current.emoji}</div>

          <h2 style={{
            fontFamily: "'Lora', Georgia, serif",
            fontWeight: 700,
            fontSize: 20,
            color: '#e8e4dc',
            margin: '0 0 10px',
            letterSpacing: '-0.3px',
          }}>
            {current.title}
          </h2>

          <p style={{
            fontSize: 14,
            color: '#9ca3af',
            lineHeight: 1.65,
            margin: '0 0 24px',
          }}>
            {current.body}
          </p>

          {/* Step dots */}
          <div style={{ display: 'flex', gap: 5, marginBottom: 20 }}>
            {steps.map((_, i) => (
              <button
                key={i}
                onClick={() => setStep(i)}
                style={{
                  width: i === step ? 18 : 6,
                  height: 6,
                  borderRadius: 3,
                  background: i === step ? '#e8c97e' : i < step ? 'rgba(232,201,126,0.35)' : 'rgba(255,255,255,0.12)',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  transition: 'all 0.25s',
                }}
              />
            ))}
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10 }}>
            {step > 0 && (
              <button
                onClick={() => setStep((s) => s - 1)}
                style={{
                  flex: 1,
                  padding: '10px 0',
                  borderRadius: 10,
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.09)',
                  color: '#9ca3af',
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.09)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
              >
                Back
              </button>
            )}
            <button
              onClick={next}
              style={{
                flex: step > 0 ? 2 : 1,
                padding: '10px 0',
                borderRadius: 10,
                background: 'linear-gradient(135deg,#e8c97e,#d4a843)',
                border: 'none',
                color: '#0b0c0f',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: 'inherit',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                transition: 'opacity 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '0.9')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
            >
              {isLast ? "Let's go!" : 'Next'}
              {!isLast && <ArrowRight size={14} />}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
