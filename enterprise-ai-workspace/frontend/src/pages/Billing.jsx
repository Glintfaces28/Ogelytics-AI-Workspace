import { useEffect, useState } from 'react';
import { CheckCircle, Zap, Building2, Loader2, CreditCard, ExternalLink } from 'lucide-react';
import api from '../api/client';
import { useLanguage } from '../context/LanguageContext';

function PlanCard({ plan, currentPlan, onUpgrade, loading }) {
  const { t } = useLanguage();
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
        <p className="text-sm text-gray-500 mt-0.5">{plan.desc}</p>
        <div className="flex items-baseline gap-1 mt-2">
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
          <CheckCircle size={15} className="text-green-500" /> {t('billing_current_plan_label')}
        </div>
      ) : plan.id === 'free' ? (
        <div className="py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm font-medium text-gray-400 text-center">
          {t('billing_downgrade')}
        </div>
      ) : (
        <button
          onClick={() => onUpgrade(plan.id)}
          disabled={loading}
          className={`py-2.5 rounded-xl text-sm font-bold transition-colors disabled:opacity-60 ${c.btn}`}
        >
          {loading ? <Loader2 size={16} className="animate-spin mx-auto" /> : t('billing_upgrade_to', plan.name)}
        </button>
      )}
    </div>
  );
}

export default function Billing() {
  const { t } = useLanguage();
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const [error, setError] = useState('');

  const PLANS = [
    {
      id: 'free',
      name: 'Free',
      price: '$0',
      period: t('price_forever'),
      desc: t('price_free_desc'),
      color: 'gray',
      features: [t('price_free_f1'), t('price_free_f2'), t('price_free_f3'), t('price_free_f4')],
    },
    {
      id: 'pro',
      name: 'Pro',
      price: '$19',
      period: t('price_month'),
      desc: t('price_pro_desc'),
      color: 'indigo',
      badge: t('price_badge'),
      features: [
        t('price_pro_f1'), t('price_pro_f2'), t('price_pro_f3'),
        t('price_pro_f4'), t('price_pro_f5'), t('price_pro_f6'),
      ],
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: '$49',
      period: t('price_month'),
      desc: t('price_ent_desc'),
      color: 'amber',
      features: [
        t('price_ent_f1'), t('price_ent_f2'), t('price_ent_f3'),
        t('price_ent_f4'), t('price_ent_f5'), t('price_ent_f6'),
      ],
    },
  ];

  useEffect(() => {
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
      setError(err.response?.data?.detail || t('billing_checkout_error'));
      setUpgrading(null);
    }
  }

  async function openPortal() {
    setPortalLoading(true);
    try {
      const r = await api.post('/billing/portal');
      window.location.href = r.data.portal_url;
    } catch (err) {
      setError(err.response?.data?.detail || t('billing_portal_error'));
      setPortalLoading(false);
    }
  }

  const currentPlan = status?.plan || 'free';

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">{t('billing_plans_title')}</h1>
        <p className="text-gray-500 mt-1">{t('billing_plans_sub')}</p>
      </div>

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
                {status?.is_active ? t('billing_sub_active') : t('billing_free_tier')}
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
              {t('billing_manage_cancel')}
            </button>
          )}
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-6 text-sm">
          {error}
        </div>
      )}

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
        {t('billing_stripe_note')}
      </p>
    </div>
  );
}
