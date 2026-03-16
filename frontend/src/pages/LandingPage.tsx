import { Link } from 'react-router-dom';
import {
  PlayCircle, BarChart3, Users, MessageSquare,
  Check, ArrowRight, Zap, Shield, Globe,
  ChevronRight, Upload, BookOpen, Trophy,
} from 'lucide-react';

// ── Sub-components ────────────────────────────────────────────────────────────

function LandingNav() {
  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">N</span>
          </div>
          <span className="font-bold text-gray-900 text-lg tracking-tight">Nest</span>
        </Link>

        {/* Nav links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-gray-600">
          <a href="#features" className="hover:text-gray-900 transition-colors">Features</a>
          <a href="#pricing" className="hover:text-gray-900 transition-colors">Pricing</a>
          <Link to="/login" className="hover:text-gray-900 transition-colors">Sign in</Link>
        </nav>

        <Link
          to="/signup"
          className="hidden md:flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
        >
          Start free trial <ArrowRight size={14} />
        </Link>

        {/* Mobile CTA */}
        <Link
          to="/signup"
          className="md:hidden text-sm font-medium text-brand-600"
        >
          Get started
        </Link>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="pt-32 pb-20 px-6 text-center bg-gradient-to-b from-brand-50/60 via-white to-white">
      <div className="max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 bg-brand-50 border border-brand-200 text-brand-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
          <Zap size={12} className="fill-brand-600 text-brand-600" />
          14-day free trial · No credit card required
        </div>

        <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 leading-[1.1] tracking-tight mb-6">
          Help your team take flight with{' '}
          <span className="text-brand-600">interactive video</span>
        </h1>

        <p className="text-lg text-gray-500 max-w-xl mx-auto mb-8 leading-relaxed">
          Nest Fledge turns your training videos into engaging, quiz-driven learning journeys.
          Track progress, collect questions, and give every new hire a great first week.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-14">
          <Link
            to="/signup"
            className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold px-6 py-3.5 rounded-xl transition-colors text-sm shadow-lg shadow-brand-200"
          >
            Start free trial <ArrowRight size={16} />
          </Link>
          <Link
            to="/login"
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium px-6 py-3.5 rounded-xl border border-gray-200 hover:border-gray-300 transition-colors text-sm bg-white"
          >
            Sign in to your account
          </Link>
        </div>

        {/* Mock dashboard preview */}
        <div className="relative mx-auto max-w-5xl">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
            {/* Fake browser bar */}
            <div className="bg-gray-100 px-4 py-3 flex items-center gap-2 border-b border-gray-200">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <div className="w-3 h-3 rounded-full bg-amber-400" />
              <div className="w-3 h-3 rounded-full bg-emerald-400" />
              <div className="flex-1 bg-white rounded-md text-xs text-gray-400 px-3 py-1 ml-3 text-left max-w-xs">
                app.nestapp.com/modules
              </div>
            </div>
            {/* Real content grid */}
            <div className="p-8 bg-gray-50/50">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <p className="text-sm font-semibold text-gray-800">Learning Modules</p>
                  <p className="text-xs text-gray-400 mt-0.5">3 modules · 2 in progress</p>
                </div>
                <div className="h-8 w-28 bg-brand-600 rounded-xl flex items-center justify-center">
                  <span className="text-white text-xs font-semibold">+ New Module</span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-5">
                {[
                  { src: '/preview-1.mp4', title: 'Welcome & Culture',  progress: 100, pct: 'w-full',   label: '100%', bar: 'bg-brand-500' },
                  { src: '/preview-2.mp4', title: 'Tools & Systems',    progress:  66, pct: 'w-2/3',    label: '66%',  bar: 'bg-brand-400' },
                  { src: '/preview-3.mp4', title: 'Security & Access',  progress:   0, pct: 'w-0',      label: '0%',   bar: 'bg-gray-300'  },
                ].map(({ src, title, pct, label, bar }) => (
                  <div key={title} className="bg-white rounded-xl border border-gray-200 p-4">
                    <div className="w-full aspect-video rounded-lg mb-4 overflow-hidden bg-gray-900 relative group">
                      <video
                        src={src}
                        className="w-full h-full object-cover opacity-90"
                        autoPlay
                        muted
                        loop
                        playsInline
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
                        <PlayCircle size={32} className="text-white drop-shadow" />
                      </div>
                    </div>
                    <p className="text-sm font-semibold text-gray-800 truncate mb-2">{title}</p>
                    <div className="flex items-center gap-2">
                      <div className="h-2 flex-1 bg-gray-100 rounded-full">
                        <div className={`h-2 rounded-full ${bar} ${pct}`} />
                      </div>
                      <span className="text-xs text-gray-400 tabular-nums font-medium">{label}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {/* Shadow glow */}
          <div className="absolute -inset-4 bg-brand-100/40 rounded-3xl blur-2xl -z-10" />
        </div>
      </div>
    </section>
  );
}

const features = [
  {
    icon: PlayCircle,
    color: 'bg-brand-50 text-brand-600',
    title: 'Interactive video modules',
    description:
      'Embed YouTube or upload your own videos. Add timestamped questions so learners engage at key moments — not just watch passively.',
  },
  {
    icon: MessageSquare,
    color: 'bg-blue-50 text-blue-600',
    title: 'Live Q&A on any video',
    description:
      'Employees ask questions directly on the video timeline. Managers get notified instantly and answer in context — no Slack threads needed.',
  },
  {
    icon: Zap,
    color: 'bg-amber-50 text-amber-600',
    title: 'Built-in quiz engine',
    description:
      'Auto-popup quizzes at the end of every video. Multiple choice, true/false, and short-answer. Pass threshold keeps it accountable.',
  },
  {
    icon: BarChart3,
    color: 'bg-emerald-50 text-emerald-600',
    title: 'Real-time analytics',
    description:
      'See exactly who finished what, quiz scores, and unanswered questions — all in a single dashboard. Spot blockers before they become problems.',
  },
  {
    icon: Users,
    color: 'bg-purple-50 text-purple-600',
    title: 'Invite your whole team',
    description:
      'Generate invite links for employees and managers. Everyone joins your organization\'s isolated workspace with one click.',
  },
  {
    icon: Shield,
    color: 'bg-red-50 text-red-600',
    title: 'Secure multi-tenant isolation',
    description:
      'Every company\'s data is fully isolated. Your modules, employees, and Q&A are never visible to other organizations.',
  },
];

function Features() {
  return (
    <section id="features" className="py-20 px-6 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-brand-600 font-semibold text-sm mb-3 uppercase tracking-widest">Features</p>
          <h2 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-4">
            Everything your team needs to grow
          </h2>
          <p className="text-gray-500 text-lg max-w-xl mx-auto">
            Built for HR teams and managers who want learning that actually sticks.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map(({ icon: Icon, color, title, description }) => (
            <div key={title} className="bg-gray-50 rounded-2xl p-6 border border-gray-100 hover:border-brand-200 hover:bg-brand-50/30 transition-all group">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${color}`}>
                <Icon size={20} />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
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
    <section id="pricing" className="py-20 px-6 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-brand-600 font-semibold text-sm mb-3 uppercase tracking-widest">Pricing</p>
          <h2 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-4">
            Simple, predictable pricing
          </h2>
          <p className="text-gray-500 text-lg max-w-md mx-auto">
            Start free for 14 days. No credit card needed. Upgrade when you're ready.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 items-start">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl p-8 border ${
                plan.highlighted
                  ? 'bg-brand-600 border-brand-600 text-white shadow-2xl shadow-brand-200 scale-105'
                  : 'bg-white border-gray-200'
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="bg-amber-400 text-amber-900 text-xs font-bold px-3 py-1 rounded-full">
                    {plan.badge}
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h3 className={`font-bold text-lg mb-1 ${plan.highlighted ? 'text-white' : 'text-gray-900'}`}>
                  {plan.name}
                </h3>
                <p className={`text-sm mb-4 ${plan.highlighted ? 'text-brand-200' : 'text-gray-500'}`}>
                  {plan.description}
                </p>
                <div className="flex items-baseline gap-1">
                  <span className={`text-4xl font-extrabold ${plan.highlighted ? 'text-white' : 'text-gray-900'}`}>
                    {plan.price}
                  </span>
                  {plan.period && (
                    <span className={`text-sm ${plan.highlighted ? 'text-brand-200' : 'text-gray-500'}`}>
                      {plan.period}
                    </span>
                  )}
                </div>
              </div>

              <Link
                to={plan.ctaTo}
                className={`flex items-center justify-center gap-1.5 w-full py-3 rounded-xl font-semibold text-sm transition-colors mb-8 ${
                  plan.highlighted
                    ? 'bg-white text-brand-600 hover:bg-brand-50'
                    : 'bg-brand-600 text-white hover:bg-brand-700'
                }`}
              >
                {plan.cta} <ChevronRight size={15} />
              </Link>

              <ul className="space-y-3">
                {plan.features.map((feat) => (
                  <li key={feat} className="flex items-start gap-2.5 text-sm">
                    <Check
                      size={16}
                      className={`mt-0.5 flex-shrink-0 ${plan.highlighted ? 'text-brand-200' : 'text-brand-500'}`}
                    />
                    <span className={plan.highlighted ? 'text-brand-100' : 'text-gray-600'}>{feat}</span>
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
    <section className="py-20 px-6 bg-brand-600">
      <div className="max-w-3xl mx-auto text-center">
        <Globe size={36} className="text-brand-300 mx-auto mb-4" />
        <h2 className="text-4xl font-extrabold text-white tracking-tight mb-4">
          Ready to help your team take flight?
        </h2>
        <p className="text-brand-200 text-lg mb-8">
          Join companies that use Nest to give every new hire a great first week.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/signup"
            className="flex items-center gap-2 bg-white text-brand-600 hover:bg-brand-50 font-semibold px-6 py-3.5 rounded-xl transition-colors text-sm"
          >
            Create your free workspace <ArrowRight size={16} />
          </Link>
          <Link
            to="/login"
            className="text-brand-200 hover:text-white font-medium text-sm transition-colors"
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
    <footer className="bg-gray-900 text-gray-400 py-12 px-6">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-brand-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xs">N</span>
          </div>
          <span className="font-semibold text-white">Nest</span>
          <span className="text-gray-600 text-sm">Where careers take flight</span>
        </div>
        <div className="flex items-center gap-6 text-sm">
          <a href="#features" className="hover:text-white transition-colors">Features</a>
          <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
          <Link to="/login" className="hover:text-white transition-colors">Sign in</Link>
          <Link to="/signup" className="text-brand-400 hover:text-brand-300 transition-colors font-medium">
            Get started free
          </Link>
        </div>
      </div>
      <div className="max-w-6xl mx-auto mt-8 pt-6 border-t border-gray-800 text-xs text-gray-600 text-center">
        &copy; {new Date().getFullYear()} Nest Fledge. All rights reserved.
      </div>
    </footer>
  );
}

// ── How it works ──────────────────────────────────────────────────────────────

function HowItWorks() {
  const steps = [
    {
      icon: Upload,
      color: 'bg-brand-50 text-brand-600',
      step: '01',
      title: 'Upload your videos',
      description: 'Bring your existing training content — YouTube links or direct uploads. Nest Fledge organises them into modules automatically.',
    },
    {
      icon: BookOpen,
      color: 'bg-blue-50 text-blue-600',
      step: '02',
      title: 'Employees learn on their own flight path',
      description: 'Each hire follows a personalised learning journey. Quizzes, Q&A, and an AI tutor keep them engaged far beyond the first week.',
    },
    {
      icon: Trophy,
      color: 'bg-amber-50 text-amber-600',
      step: '03',
      title: 'Track, certify, and grow',
      description: 'Managers see real-time progress, answer questions in context, and issue certificates. Spot blockers before they become problems.',
    },
  ];

  return (
    <section className="py-20 px-6 bg-gray-50">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-brand-600 font-semibold text-sm mb-3 uppercase tracking-widest">How it works</p>
          <h2 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-4">
            From upload to fledged — in minutes
          </h2>
          <p className="text-gray-500 text-lg max-w-xl mx-auto">
            No complex setup. No new habits to force on your team. Just paste your videos and go.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map(({ icon: Icon, color, step, title, description }) => (
            <div key={step} className="relative">
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${color}`}>
                  <Icon size={22} />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-300 mb-1 tracking-widest">{step}</p>
                  <h3 className="font-bold text-gray-900 mb-2 leading-snug">{title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
                </div>
              </div>
              {step !== '03' && (
                <div className="hidden md:block absolute top-6 left-full w-8 -translate-x-4">
                  <ArrowRight size={16} className="text-gray-300" />
                </div>
              )}
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
