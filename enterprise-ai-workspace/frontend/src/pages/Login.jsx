import { useState } from 'react';
import { useNavigate, useLocation, Link, Navigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Brain, Loader2, Eye, EyeOff } from 'lucide-react';
import api, { API_BASE_URL } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

function LangToggle() {
  const { lang, switchLang } = useLanguage();
  return (
    <div className="flex items-center gap-1 bg-slate-800 rounded-lg p-1 mb-6 w-fit mx-auto">
      <button
        onClick={() => switchLang('en')}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
          lang === 'en' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
        }`}
      >
        🇬🇧 EN
      </button>
      <button
        onClick={() => switchLang('de')}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
          lang === 'de' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
        }`}
      >
        🇩🇪 DE
      </button>
    </div>
  );
}

export default function Login() {
  const { t } = useLanguage();
  const { register, handleSubmit, formState: { errors } } = useForm();
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const successMessage = location.state?.message || '';
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  async function onSubmit(data) {
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/login', data);
      login(res.data.access_token);
      navigate('/dashboard');
    } catch (err) {
      if (!err.response) {
        setError(`Cannot connect to ${API_BASE_URL}. Browser error: ${err.message}`);
      } else {
        setError(err.response.data?.detail || t('login_error'));
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-3 mb-6">
          <Brain className="text-indigo-400" size={34} />
          <h1 className="text-white text-2xl font-bold">Ogelytics AI Workspace</h1>
        </div>

        <LangToggle />

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-1">{t('login_title')}</h2>
          <p className="text-gray-500 text-sm mb-6">{t('login_subtitle')}</p>

          {successMessage && (
            <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-3 mb-4 text-sm">
              {successMessage}
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('login_email')}
              </label>
              <input
                {...register('email', { required: true })}
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@company.com"
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-700">
                  {t('login_password')}
                </label>
                <Link to="/forgot-password" className="text-xs text-indigo-600 hover:underline">
                  {t('login_forgot')}
                </Link>
              </div>
              <div className="relative">
                <input
                  {...register('password', { required: true })}
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading ? t('loading') : t('login_btn')}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            {t('login_no_account')}{' '}
            <Link to="/register" className="text-indigo-600 font-medium hover:underline">
              {t('login_register')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
