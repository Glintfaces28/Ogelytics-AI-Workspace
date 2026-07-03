import { useEffect, useState } from 'react';
import { CheckCircle, Zap, Building2, Loader2, CreditCard, ExternalLink } from 'lucide-react';
import api from '../api/client';

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    period: 'forever',
    color: 'gray',
    features: [
      'Up to 10 documents',
      'AI chat (limited)',
      '1 team',
      'Community support',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$19',
    period: 'per month',
    color: 'indigo',
    badge: 'Most popular',
    features: [
      'Unlimited documents',
      'Full AI chat & history',
      'Up to 10 teams',
      'Document sharing',
      'Export to PDF / Word',
      'Priority email support',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: '$49',
    period: 'per month',
    color: 'amber',
    features: [
      'Everything in Pro',
      'Unlimited teams & members',
      'Admin panel',
      'Custom domain',
      'Dedicated support',
      'SLA guarantee',
    ],
  },
];

function PlanCard({ plan, currentPlan, onUpgrade, loading }) {
  const isCurrentPlan = plan.id === currentPlan;
  const colors = {
    gray: { border: 'border-gray-200', badge: '', btn: 'bg-gray-100 text-gray-700 hover:bg-gray-200', check: 'text-gray-500' },
    indigo: { border: 'border-indigo-300 ring-2 ring-indigo-200', badge: 'bg-indigo-600 text-white', btn: 'bg-indigo-600 text-white hover:bg-indigo-700', check: 'text-indigo-600' },
    amber: { border: 'border-amber-300', badge: 'bg-amber-500 text-white', btn: 'bg-amber-500 text-white hover:bg-amber-600', check: 'text-amber-600' },
  };
  const c = colors[plan.color];

  return (
    <div className={`relative flex flex-col bg-white rounded-2xl border-2 p-6 ${c.border}`}>
      {plan.badge && (
        <span className={`absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-bold px-3 py-1 rounded-full ${c.badge}`}>
          {plan.badge}
        </span>
      )}
      <div className="mb-4">
        <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
        <div className="flex items-baseline gap-1 mt-1">
          <span className="text-3xl font-extrabold text-gray-900">{plan.price}</span>
          <span className="text-gray-500 text-sm">{plan.period}</span>
        </div>
      </div>

      <ul className="space-y-2.5 flex-1 mb-6">
        {plan.features.map((f, i) => (
          <li key={i} className="flex items-center gap-2 text-sm text-gray-700">
            <CheckCircle size={15} className={`shrink-0 ${c.check}`} />
            {f}
          </li>
        ))}
      </ul>

      {isCurrentPlan ? (
        <div className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm font-medium text-gray-600">
          <CheckCircle size={15} className="text-green-500" /> Current plan
        </div>
      ) : plan.id === 'free' ? (
        <div className="py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm font-medium text-gray-400 text-center">
          Downgrade via billing portal
        </div>
      ) : (
        <button
          onClick={() => onUpgrade(plan.id)}
          disabled={loading}
          className={`py-2.5 rounded-xl text-sm font-bold transition-colors disabled:opacity-60 ${c.btn}`}
        >
          {loading ? <Loader2 size={16} className="animate-spin mx-auto" /> : `Upgrade to ${plan.name}`}
        </button>
      )}
    </div>
  );
}

export default function Billing() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Check for success redirect from Stripe
    const params = new URLSearchParams(window.location.search);
    if (params.get('session_id')) {
      window.history.replaceState({}, '', '/billing');
    }

    api.get('/billing/status')
      .then(r => setStatus(r.data))
      .catch(() => setStatus({ plan: 'free', status: null, is_active: false }))
      .finally(() => setLoading(false));
  }, []);

  async function upgrade(planId) {
    setUpgrading(planId);
    setError('');
    try {
      const r = await api.post(`/billing/checkout?plan=${planId}`);
      window.location.href = r.data.checkout_url;
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not start checkout. Please try again.');
      setUpgrading(null);
    }
  }

  async function openPortal() {
    setPortalLoading(true);
    try {
      const r = await api.post('/billing/portal');
      window.location.href = r.data.portal_url;
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not open billing portal.');
      setPortalLoading(false);
    }
  }

  const currentPlan = status?.plan || 'free';

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Billing & Plans</h1>
        <p className="text-gray-500 mt-1">Choose the plan that fits your workspace.</p>
      </div>

      {/* Current status bar */}
      {!loading && (
        <div className="flex items-center justify-between bg-white border border-gray-200 rounded-xl px-5 py-4 mb-8">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
              currentPlan === 'enterprise' ? 'bg-amber-100' :
              currentPlan === 'pro' ? 'bg-indigo-100' : 'bg-gray-100'
            }`}>
              {currentPlan === 'enterprise' ? <Building2 size={18} className="text-amber-600" /> :
               currentPlan === 'pro' ? <Zap size={18} className="text-indigo-600" /> :
               <CreditCard size={18} className="text-gray-500" />}
            </div>
            <div>
              <p className="font-semibold text-gray-900 capitalize">{currentPlan} Plan</p>
              <p className="text-xs text-gray-500">
                {status?.is_active ? 'Subscription active' : 'Free tier'}
              </p>
            </div>
          </div>
          {status?.is_active && (
            <button
              onClick={openPortal}
              disabled={portalLoading}
              className="flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-800 font-medium"
            >
              {portalLoading
                ? <Loader2 size={14} className="animate-spin" />
                : <ExternalLink size={14} />}
              Manage / Cancel
            </button>
          )}
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-6 text-sm">
          {error}
        </div>
      )}

      {/* Plan cards */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 size={28} className="animate-spin text-indigo-400" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PLANS.map(plan => (
            <PlanCard
              key={plan.id}
              plan={plan}
              currentPlan={currentPlan}
              onUpgrade={upgrade}
              loading={upgrading === plan.id}
            />
          ))}
        </div>
      )}

      <p className="text-center text-xs text-gray-400 mt-8">
        Payments are securely processed by Stripe. Cancel anytime.
      </p>
    </div>
  );
}
