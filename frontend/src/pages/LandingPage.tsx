import { Link } from 'react-router-dom';
import {
  PlayCircle, BarChart3, Users, MessageSquare,
  Check, ArrowRight, Zap, Shield, Globe,
  ChevronRight, Upload, BookOpen, Trophy, Sparkles,
} from 'lucide-react';
import clsx from 'clsx';

// ── Sub-components ────────────────────────────────────────────────────────────

function LandingNav() {
  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100/80 shadow-[0_1px_0_rgba(0,0,0,0.04)]">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 bg-brand-gradient rounded-xl flex items-center justify-center shadow-brand group-hover:shadow-glow-lg transition-shadow duration-300">
            <span className="text-white font-bold text-sm">N</span>
          </div>
          <span className="font-bold text-gray-900 text-lg tracking-tight">Nest</span>
        </Link>

        {/* Nav links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-gray-500">
          <a href="#features" className="hover:text-gray-900 transition-colors">Features</a>
          <a href="#how" className="hover:text-gray-900 transition-colors">How it works</a>
          <a href="#pricing" className="hover:text-gray-900 transition-colors">Pricing</a>
          <Link to="/login" className="hover:text-gray-900 transition-colors">Sign in</Link>
        </nav>

        <Link
          to="/signup"
          className={clsx(
            'hidden md:flex items-center gap-1.5',
            'bg-brand-gradient text-white text-sm font-semibold px-4 py-2 rounded-xl',
            'shadow-brand hover:brightness-110 hover:-translate-y-px hover:shadow-[0_6px_20px_rgb(var(--brand-600)/0.4)]',
            'transition-all duration-150'
          )}
        >
          Start free trial <ArrowRight size={14} />
        </Link>

        <Link to="/signup" className="md:hidden text-sm font-semibold text-brand-600">
          Get started
        </Link>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="pt-32 pb-24 px-6 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-mesh" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white" />

      {/* Decorative blobs */}
      <div className="absolute top-20 right-10 w-72 h-72 bg-brand-200/25 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-64 h-64 bg-violet-200/20 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-4xl mx-auto text-center relative">
        {/* Pill badge */}
        <div className="inline-flex items-center gap-2 bg-white border border-brand-200/80 text-brand-700 text-xs font-semibold px-4 py-1.5 rounded-full mb-7 shadow-sm">
          <Sparkles size={11} className="text-brand-500" />
          14-day free trial · No credit card required
        </div>

        <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 leading-[1.08] tracking-tight mb-6">
          Help your team{' '}
          <br className="hidden sm:block" />
          take flight with{' '}
          <span className="text-gradient">interactive video</span>
        </h1>

        <p className="text-lg text-gray-500 max-w-xl mx-auto mb-10 leading-relaxed">
          Nest Fledge turns your training videos into engaging, quiz-driven learning journeys.
          Track progress, collect questions, and give every new hire a great first week.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-16">
          <Link
            to="/signup"
            className={clsx(
              'flex items-center gap-2',
              'bg-brand-gradient text-white font-semibold px-6 py-3.5 rounded-xl text-sm',
              'shadow-brand hover:brightness-110 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgb(var(--brand-600)/0.4)]',
              'transition-all duration-150'
            )}
          >
            Start free trial <ArrowRight size={16} />
          </Link>
          <Link
            to="/login"
            className={clsx(
              'flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium px-6 py-3.5 rounded-xl text-sm',
              'border border-gray-200 bg-white hover:border-gray-300 hover:shadow-card-md',
              'transition-all duration-150'
            )}
          >
            Sign in to your account
          </Link>
        </div>

        {/* Mock dashboard preview */}
        <div className="relative mx-auto max-w-5xl">
          <div className="bg-white rounded-2xl shadow-float border border-gray-200/80 overflow-hidden">
            {/* Fake browser bar */}
            <div className="bg-gray-50 px-4 py-3 flex items-center gap-2 border-b border-gray-100">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-amber-400" />
                <div className="w-3 h-3 rounded-full bg-emerald-400" />
              </div>
              <div className="flex-1 bg-white rounded-lg text-xs text-gray-400 px-3 py-1.5 ml-3 text-left max-w-xs border border-gray-100 shadow-card">
                app.nestapp.com/modules
              </div>
            </div>
            {/* Real content grid */}
            <div className="p-6 bg-gray-50/50">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <p className="text-sm font-bold text-gray-800 tracking-tight">Learning Modules</p>
                  <p className="text-xs text-gray-400 mt-0.5">3 modules · 2 in progress</p>
                </div>
                <div className="h-8 bg-brand-gradient px-3 rounded-xl flex items-center justify-center shadow-brand">
                  <span className="text-white text-xs font-semibold">+ New Module</span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { src: '/preview-1.mp4', title: 'Welcome & Culture',  pct: 'w-full',   label: '100%', bar: 'bg-gradient-to-r from-emerald-400 to-emerald-500' },
                  { src: '/preview-2.mp4', title: 'Tools & Systems',    pct: 'w-2/3',    label: '66%',  bar: 'bg-gradient-to-r from-brand-400 to-brand-600' },
                  { src: '/preview-3.mp4', title: 'Security & Access',  pct: 'w-0',      label: '0%',   bar: 'bg-gray-200'  },
                ].map(({ src, title, pct, label, bar }) => (
                  <div key={title} className="bg-white rounded-xl border border-gray-100 p-4 shadow-card">
                    <div className="w-full aspect-video rounded-lg mb-3 overflow-hidden bg-gray-900 relative group">
                      <video
                        src={src}
                        className="w-full h-full object-cover opacity-90"
                        autoPlay muted loop playsInline
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
                        <PlayCircle size={28} className="text-white drop-shadow" />
                      </div>
                    </div>
                    <p className="text-xs font-semibold text-gray-800 truncate mb-2 tracking-tight">{title}</p>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 flex-1 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-1.5 rounded-full ${bar} ${pct} transition-all`} />
                      </div>
                      <span className="text-[10px] text-gray-400 tabular-nums font-semibold">{label}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {/* Glow behind the preview */}
          <div className="absolute -inset-6 bg-brand-200/30 rounded-3xl blur-3xl -z-10" />
        </div>
      </div>
    </section>
  );
}

const features = [
  {
    icon: PlayCircle,
    gradient: 'from-brand-500 to-brand-600',
    glow: 'shadow-[0_4px_14px_rgb(var(--brand-500)/0.3)]',
    title: 'Interactive video modules',
    description: 'Embed YouTube or upload your own videos. Add timestamped questions so learners engage at key moments — not just watch passively.',
  },
  {
    icon: MessageSquare,
    gradient: 'from-blue-500 to-blue-600',
    glow: 'shadow-[0_4px_14px_rgba(59,130,246,0.3)]',
    title: 'Live Q&A on any video',
    description: 'Employees ask questions directly on the video timeline. Managers get notified instantly and answer in context — no Slack threads needed.',
  },
  {
    icon: Zap,
    gradient: 'from-amber-400 to-orange-500',
    glow: 'shadow-[0_4px_14px_rgba(251,191,36,0.3)]',
    title: 'Built-in quiz engine',
    description: 'Auto-popup quizzes at the end of every video. Multiple choice, true/false, and short-answer. Pass threshold keeps it accountable.',
  },
  {
    icon: BarChart3,
    gradient: 'from-emerald-400 to-emerald-600',
    glow: 'shadow-[0_4px_14px_rgba(52,211,153,0.3)]',
    title: 'Real-time analytics',
    description: 'See exactly who finished what, quiz scores, and unanswered questions — all in a single dashboard. Spot blockers before they become problems.',
  },
  {
    icon: Users,
    gradient: 'from-violet-500 to-purple-600',
    glow: 'shadow-[0_4px_14px_rgba(139,92,246,0.3)]',
    title: 'Invite your whole team',
    description: "Generate invite links for employees and managers. Everyone joins your organization's isolated workspace with one click.",
  },
  {
    icon: Shield,
    gradient: 'from-rose-400 to-rose-600',
    glow: 'shadow-[0_4px_14px_rgba(251,113,133,0.3)]',
    title: 'Secure multi-tenant isolation',
    description: "Every company's data is fully isolated. Your modules, employees, and Q&A are never visible to other organizations.",
  },
];

function Features() {
  return (
    <section id="features" className="py-24 px-6 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-brand-600 font-semibold text-xs mb-3 uppercase tracking-widest">Features</p>
          <h2 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-4">
            Everything your team needs to grow
          </h2>
          <p className="text-gray-500 text-lg max-w-xl mx-auto leading-relaxed">
            Built for HR teams and managers who want learning that actually sticks.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map(({ icon: Icon, gradient, glow, title, description }) => (
            <div
              key={title}
              className={clsx(
                'group relative bg-white rounded-2xl p-6',
                'border border-gray-100 hover:border-gray-200',
                'shadow-card hover:shadow-elevated',
                'transition-all duration-200 hover:-translate-y-0.5'
              )}
            >
              <div className={clsx(
                'w-10 h-10 rounded-xl flex items-center justify-center mb-5',
                'bg-gradient-to-br', gradient, glow
              )}>
                <Icon size={18} className="text-white" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2 tracking-tight leading-snug">{title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const plans = [
  {
    name: 'Starter',
    price: '$29',
    period: '/month',
    description: 'Perfect for small teams getting started with structured learning.',
    cta: 'Start free trial',
    ctaTo: '/signup',
    highlighted: false,
    features: [
      'Up to 15 employees',
      '5 learning modules',
      'Unlimited videos per module',
      'Quiz engine',
      'Q&A on videos',
      'Basic analytics',
      'Email support',
    ],
  },
  {
    name: 'Professional',
    price: '$99',
    period: '/month',
    description: 'For growing companies that need unlimited scale and advanced insights.',
    cta: 'Start free trial',
    ctaTo: '/signup',
    highlighted: true,
    badge: 'Most popular',
    features: [
      'Unlimited employees',
      'Unlimited modules',
      'Advanced analytics dashboard',
      'Custom branding & logo',
      'Invite links + role management',
      'Real-time manager notifications',
      'Priority support',
      'CSV export',
    ],
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    description: 'For large organizations with compliance and integration requirements.',
    cta: 'Contact sales',
    ctaTo: '/login',
    highlighted: false,
    features: [
      'Everything in Professional',
      'SSO / SAML 2.0',
      'HRIS integrations',
      'Custom domain',
      'Dedicated success manager',
      'SLA guarantee',
      'Audit logs',
      'Volume pricing',
    ],
  },
];

function Pricing() {
  return (
    <section id="pricing" className="py-24 px-6 bg-gray-50/80">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-brand-600 font-semibold text-xs mb-3 uppercase tracking-widest">Pricing</p>
          <h2 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-4">
            Simple, predictable pricing
          </h2>
          <p className="text-gray-500 text-lg max-w-md mx-auto">
            Start free for 14 days. No credit card needed. Upgrade when you're ready.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-5 items-stretch">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={clsx(
                'relative rounded-2xl p-8 flex flex-col',
                plan.highlighted
                  ? 'bg-brand-gradient text-white shadow-[0_8px_32px_rgb(var(--brand-600)/0.35)] scale-[1.02]'
                  : 'bg-white border border-gray-200 shadow-card'
              )}
            >
              {plan.badge && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="bg-amber-400 text-amber-900 text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                    {plan.badge}
                  </span>
                </div>
              )}

              <div className="mb-6 flex-1">
                <h3 className={clsx('font-bold text-lg mb-1 tracking-tight', plan.highlighted ? 'text-white' : 'text-gray-900')}>
                  {plan.name}
                </h3>
                <p className={clsx('text-sm mb-5 leading-relaxed', plan.highlighted ? 'text-blue-100' : 'text-gray-500')}>
                  {plan.description}
                </p>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className={clsx('text-4xl font-extrabold tracking-tight', plan.highlighted ? 'text-white' : 'text-gray-900')}>
                    {plan.price}
                  </span>
                  {plan.period && (
                    <span className={clsx('text-sm', plan.highlighted ? 'text-blue-200' : 'text-gray-400')}>
                      {plan.period}
                    </span>
                  )}
                </div>

                <Link
                  to={plan.ctaTo}
                  className={clsx(
                    'flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl font-semibold text-sm transition-all duration-150',
                    plan.highlighted
                      ? 'bg-white text-brand-600 hover:bg-blue-50 shadow-sm hover:-translate-y-px hover:shadow-md'
                      : 'bg-brand-gradient text-white shadow-brand hover:brightness-110 hover:-translate-y-px'
                  )}
                >
                  {plan.cta} <ChevronRight size={14} />
                </Link>
              </div>

              <ul className="space-y-3 border-t pt-6 mt-2" style={{ borderColor: plan.highlighted ? 'rgba(255,255,255,0.15)' : undefined }}>
                {plan.features.map((feat) => (
                  <li key={feat} className="flex items-start gap-2.5 text-sm">
                    <Check
                      size={15}
                      className={clsx('mt-0.5 flex-shrink-0', plan.highlighted ? 'text-blue-200' : 'text-brand-500')}
                    />
                    <span className={plan.highlighted ? 'text-blue-100' : 'text-gray-600'}>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <p className="text-center text-sm text-gray-400 mt-8">
          All plans include a 14-day free trial. Cancel anytime.
        </p>
      </div>
    </section>
  );
}

function CtaBanner() {
  return (
    <section className="py-24 px-6 relative overflow-hidden bg-gray-900">
      {/* Glow effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-brand-900/80 via-gray-900 to-violet-900/40 pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-brand-600/20 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-3xl mx-auto text-center relative">
        <div className="w-14 h-14 bg-brand-gradient rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-glow-lg">
          <Globe size={24} className="text-white" />
        </div>
        <h2 className="text-4xl font-extrabold text-white tracking-tight mb-4">
          Ready to help your team take flight?
        </h2>
        <p className="text-gray-400 text-lg mb-10 leading-relaxed">
          Join companies that use Nest to give every new hire a great first week.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/signup"
            className={clsx(
              'flex items-center gap-2 bg-brand-gradient text-white font-semibold px-6 py-3.5 rounded-xl text-sm',
              'shadow-brand hover:brightness-110 hover:-translate-y-0.5 transition-all duration-150'
            )}
          >
            Create your free workspace <ArrowRight size={16} />
          </Link>
          <Link
            to="/login"
            className="text-gray-400 hover:text-white font-medium text-sm transition-colors"
          >
            Already have an account? Sign in
          </Link>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="bg-gray-950 text-gray-500 py-12 px-6 border-t border-gray-900">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-brand-gradient rounded-lg flex items-center justify-center shadow-sm">
            <span className="text-white font-bold text-xs">N</span>
          </div>
          <span className="font-semibold text-white">Nest</span>
          <span className="text-gray-600 text-sm">·</span>
          <span className="text-gray-600 text-sm">Where careers take flight</span>
        </div>
        <div className="flex items-center gap-6 text-sm">
          <a href="#features" className="hover:text-white transition-colors">Features</a>
          <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
          <Link to="/login" className="hover:text-white transition-colors">Sign in</Link>
          <Link to="/signup" className="text-brand-400 hover:text-brand-300 transition-colors font-semibold">
            Get started free
          </Link>
        </div>
      </div>
      <div className="max-w-6xl mx-auto mt-8 pt-6 border-t border-gray-900 text-xs text-gray-700 text-center">
        &copy; {new Date().getFullYear()} Nest Fledge. All rights reserved.
      </div>
    </footer>
  );
}

function HowItWorks() {
  const steps = [
    {
      icon: Upload,
      gradient: 'from-brand-500 to-brand-600',
      glow: 'shadow-[0_4px_14px_rgb(var(--brand-500)/0.3)]',
      step: '01',
      title: 'Upload your videos',
      description: 'Bring your existing training content — YouTube links or direct uploads. Nest Fledge organises them into modules automatically.',
    },
    {
      icon: BookOpen,
      gradient: 'from-blue-500 to-blue-600',
      glow: 'shadow-[0_4px_14px_rgba(59,130,246,0.3)]',
      step: '02',
      title: 'Employees learn on their own flight path',
      description: 'Each hire follows a personalised learning journey. Quizzes, Q&A, and an AI tutor keep them engaged far beyond the first week.',
    },
    {
      icon: Trophy,
      gradient: 'from-amber-400 to-orange-500',
      glow: 'shadow-[0_4px_14px_rgba(251,191,36,0.3)]',
      step: '03',
      title: 'Track, certify, and grow',
      description: 'Managers see real-time progress, answer questions in context, and issue certificates. Spot blockers before they become problems.',
    },
  ];

  return (
    <section id="how" className="py-24 px-6 bg-gray-50/80">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-brand-600 font-semibold text-xs mb-3 uppercase tracking-widest">How it works</p>
          <h2 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-4">
            From upload to fledged — in minutes
          </h2>
          <p className="text-gray-500 text-lg max-w-xl mx-auto leading-relaxed">
            No complex setup. No new habits to force on your team. Just paste your videos and go.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 relative">
          {/* Connecting line */}
          <div className="hidden md:block absolute top-6 left-[calc(33%+1.5rem)] right-[calc(33%+1.5rem)] h-px bg-gradient-to-r from-brand-200 via-blue-200 to-amber-200" />

          {steps.map(({ icon: Icon, gradient, glow, step, title, description }) => (
            <div key={step} className="relative text-center">
              <div className={clsx(
                'w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5',
                'bg-gradient-to-br', gradient, glow
              )}>
                <Icon size={22} className="text-white" />
              </div>
              <p className="text-xs font-bold text-gray-300 mb-2 tracking-widest">{step}</p>
              <h3 className="font-bold text-gray-900 mb-2 leading-snug tracking-tight">{title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div className="font-sans">
      <LandingNav />
      <Hero />
      <HowItWorks />
      <Features />
      <Pricing />
      <CtaBanner />
      <Footer />
    </div>
  );
}
