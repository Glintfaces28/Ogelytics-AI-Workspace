import { Link } from 'react-router-dom';
import { Brain, FileText, MessageSquare, Users, Shield, Zap, CheckCircle, ArrowRight, Upload, Search, Sparkles } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

// ── Navbar ─────────────────────────────────────────────────────────────────────
function Navbar() {
  const { lang, switchLang, t } = useLanguage();
  return (
    <nav className="fixed top-0 inset-x-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Brain className="text-indigo-400" size={26} />
          <span className="text-white font-bold text-lg tracking-tight">Ogelytics AI</span>
        </div>
        <div className="flex items-center gap-3">
          {/* Language toggle */}
          <div className="flex items-center gap-0.5 bg-slate-800 rounded-lg p-1">
            <button
              onClick={() => switchLang('en')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
                lang === 'en' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              🇬🇧 EN
            </button>
            <button
              onClick={() => switchLang('de')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
                lang === 'de' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              🇩🇪 DE
            </button>
          </div>
          <Link
            to="/login"
            className="text-slate-300 hover:text-white text-sm font-medium transition-colors px-4 py-2"
          >
            {t('landing_nav_signin')}
          </Link>
          <Link
            to="/register"
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            {t('landing_nav_started')}
          </Link>
        </div>
      </div>
    </nav>
  );
}

// ── Hero ───────────────────────────────────────────────────────────────────────
function Hero() {
  const { t } = useLanguage();
  return (
    <section className="relative pt-32 pb-24 px-6 overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px]" />
      </div>

      <div className="relative max-w-4xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold px-4 py-2 rounded-full mb-6">
          <Sparkles size={12} />
          {t('landing_badge')}
        </div>

        <h1 className="text-5xl md:text-6xl font-extrabold text-white leading-tight mb-6">
          {t('landing_hero_h1a')}<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">
            {t('landing_hero_h1b')}
          </span>
        </h1>

        <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
          {t('landing_hero_sub')}
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to="/register"
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-7 py-3.5 rounded-xl transition-colors text-base"
          >
            {t('landing_cta_start')} <ArrowRight size={18} />
          </Link>
          <Link
            to="/login"
            className="flex items-center gap-2 text-slate-300 hover:text-white border border-slate-700 hover:border-slate-500 font-medium px-7 py-3.5 rounded-xl transition-colors text-base"
          >
            {t('landing_cta_signin')}
          </Link>
        </div>

        <p className="text-slate-500 text-sm mt-5">{t('landing_free')}</p>
      </div>

      {/* App preview mockup */}
      <div className="relative max-w-5xl mx-auto mt-16">
        <div className="bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden shadow-2xl">
          {/* Fake browser bar */}
          <div className="flex items-center gap-2 px-4 py-3 bg-slate-800 border-b border-slate-700">
            <div className="w-3 h-3 rounded-full bg-red-500/70" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
            <div className="w-3 h-3 rounded-full bg-green-500/70" />
            <div className="flex-1 bg-slate-700 rounded-md h-6 mx-4 flex items-center px-3">
              <span className="text-slate-400 text-xs">ogelytics.com/chat</span>
            </div>
          </div>
          {/* Fake UI */}
          <div className="flex h-72">
            {/* Sidebar */}
            <div className="w-48 bg-slate-950 border-r border-slate-800 p-4 hidden sm:block">
              <div className="flex items-center gap-2 mb-6">
                <Brain className="text-indigo-400" size={18} />
                <span className="text-white text-sm font-bold">Ogelytics AI</span>
              </div>
              {['Dashboard', 'Documents', 'AI Chat', 'Teams', 'Billing'].map((item, i) => (
                <div key={item} className={`flex items-center gap-2 px-2 py-2 rounded-lg mb-1 text-xs ${i === 2 ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}>
                  <div className="w-3 h-3 rounded-sm bg-current opacity-60" />
                  {item}
                </div>
              ))}
            </div>
            {/* Chat area */}
            <div className="flex-1 p-6 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="w-7 h-7 rounded-full bg-slate-600 shrink-0" />
                  <div className="bg-slate-800 rounded-xl px-4 py-2.5 text-slate-300 text-sm max-w-xs">
                    What are the key findings in the Q3 report?
                  </div>
                </div>
                <div className="flex gap-3 justify-end">
                  <div className="bg-indigo-600 rounded-xl px-4 py-2.5 text-white text-sm max-w-sm">
                    Based on the Q3 report, revenue grew 24% YoY to $4.2M, driven by enterprise segment expansion. Customer acquisition cost decreased 18%...
                  </div>
                  <div className="w-7 h-7 rounded-full bg-indigo-500 shrink-0 flex items-center justify-center">
                    <Brain size={14} className="text-white" />
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-slate-800 rounded-xl px-4 py-3">
                <span className="text-slate-500 text-sm flex-1">Ask anything about your documents...</span>
                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                  <ArrowRight size={14} className="text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── How it works ───────────────────────────────────────────────────────────────
function HowItWorks() {
  const { t } = useLanguage();
  const steps = [
    { icon: Upload, title: t('landing_step1_title'), desc: t('landing_step1_sub') },
    { icon: Search, title: t('landing_step2_title'), desc: t('landing_step2_sub') },
    { icon: Sparkles, title: t('landing_step3_title'), desc: t('landing_step3_sub') },
  ];

  return (
    <section className="py-24 px-6 border-t border-slate-800">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">{t('landing_how_title')}</h2>
          <p className="text-slate-400 text-lg">{t('landing_features_sub')}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map(({ icon: Icon, title, desc }, i) => (
            <div key={title} className="relative">
              {i < steps.length - 1 && (
                <div className="hidden md:block absolute top-8 left-full w-full h-px bg-gradient-to-r from-slate-600 to-transparent z-10" />
              )}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-indigo-500/50 transition-colors">
                <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-4">
                  <Icon size={22} className="text-indigo-400" />
                </div>
                <div className="text-slate-500 text-xs font-semibold mb-2">STEP {i + 1}</div>
                <h3 className="text-white font-semibold text-lg mb-2">{title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Features ───────────────────────────────────────────────────────────────────
function Features() {
  const { t } = useLanguage();
  const features = [
    { icon: Brain, title: 'AI that reads your docs', desc: 'GPT-powered answers based exclusively on your uploaded documents. No generic responses.' },
    { icon: MessageSquare, title: 'Persistent chat history', desc: 'Every conversation is saved. Come back to any session and continue where you left off.' },
    { icon: FileText, title: 'Export answers', desc: 'Download AI responses as PDF or Word documents for sharing and record-keeping.' },
    { icon: Users, title: 'Team collaboration', desc: 'Create teams, invite members, and share documents across your organisation.' },
    { icon: Shield, title: 'Enterprise security', desc: 'JWT authentication, bcrypt passwords, and encrypted storage. Your data stays yours.' },
    { icon: Zap, title: 'Instant setup', desc: 'Sign up and upload your first document in under 2 minutes. No configuration needed.' },
  ];

  return (
    <section className="py-24 px-6 border-t border-slate-800">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">{t('landing_features_title')}</h2>
          <p className="text-slate-400 text-lg">{t('landing_features_sub')}</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-slate-600 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center mb-4">
                <Icon size={20} className="text-indigo-400" />
              </div>
              <h3 className="text-white font-semibold mb-2">{title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Pricing ────────────────────────────────────────────────────────────────────
function Pricing() {
  const plans = [
    {
      name: 'Free',
      price: '$0',
      period: 'forever',
      desc: 'Perfect for getting started.',
      features: ['Up to 10 documents', 'AI chat (limited)', '1 team', 'Community support'],
      cta: 'Get started',
      href: '/register',
      highlight: false,
    },
    {
      name: 'Pro',
      price: '$19',
      period: 'per month',
      desc: 'For growing teams.',
      badge: 'Most popular',
      features: ['Unlimited documents', 'Full AI chat & history', 'Up to 10 teams', 'Document sharing', 'Export to PDF / Word', 'Priority email support'],
      cta: 'Start Pro',
      href: '/register',
      highlight: true,
    },
    {
      name: 'Enterprise',
      price: '$49',
      period: 'per month',
      desc: 'For large organisations.',
      features: ['Everything in Pro', 'Unlimited teams & members', 'Admin panel', 'Custom domain', 'Dedicated support', 'SLA guarantee'],
      cta: 'Start Enterprise',
      href: '/register',
      highlight: false,
    },
  ];

  return (
    <section className="py-24 px-6 border-t border-slate-800">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Simple, transparent pricing</h2>
          <p className="text-slate-400 text-lg">Start free. Upgrade when you're ready.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map(plan => (
            <div
              key={plan.name}
              className={`relative flex flex-col rounded-2xl p-6 border ${
                plan.highlight
                  ? 'bg-indigo-600/10 border-indigo-500 ring-1 ring-indigo-500/30'
                  : 'bg-slate-900 border-slate-800'
              }`}
            >
              {plan.badge && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                  {plan.badge}
                </span>
              )}
              <div className="mb-5">
                <h3 className="text-white font-bold text-lg mb-1">{plan.name}</h3>
                <p className="text-slate-400 text-sm mb-3">{plan.desc}</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-white">{plan.price}</span>
                  <span className="text-slate-400 text-sm">{plan.period}</span>
                </div>
              </div>
              <ul className="space-y-2.5 flex-1 mb-6">
                {plan.features.map(f => (
                  <li key={f} className="flex items-center gap-2.5 text-sm text-slate-300">
                    <CheckCircle size={15} className={plan.highlight ? 'text-indigo-400' : 'text-slate-500'} />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                to={plan.href}
                className={`text-center py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                  plan.highlight
                    ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── CTA Banner ─────────────────────────────────────────────────────────────────
function CTABanner() {
  return (
    <section className="py-24 px-6 border-t border-slate-800">
      <div className="max-w-3xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
          Ready to unlock your documents?
        </h2>
        <p className="text-slate-400 text-lg mb-8">
          Join teams already using Ogelytics to get instant answers from their documents.
        </p>
        <Link
          to="/register"
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-8 py-4 rounded-xl transition-colors text-base"
        >
          Create your free account <ArrowRight size={18} />
        </Link>
        <p className="text-slate-500 text-sm mt-4">No credit card required · Cancel anytime</p>
      </div>
    </section>
  );
}

// ── Footer ─────────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="border-t border-slate-800 py-10 px-6">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <Brain className="text-indigo-400" size={20} />
          <span className="text-white font-bold">Ogelytics AI</span>
        </div>
        <div className="flex items-center gap-6 text-slate-400 text-sm">
          <Link to="/login" className="hover:text-white transition-colors">Sign in</Link>
          <Link to="/register" className="hover:text-white transition-colors">Sign up</Link>
          <a href="mailto:support@ogelytics.com" className="hover:text-white transition-colors">Contact</a>
        </div>
        <p className="text-slate-500 text-sm">© {new Date().getFullYear()} Ogelytics AI. All rights reserved.</p>
      </div>
    </footer>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────
export default function Landing() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Navbar />
      <Hero />
      <HowItWorks />
      <Features />
      <Pricing />
      <CTABanner />
      <Footer />
    </div>
  );
}
