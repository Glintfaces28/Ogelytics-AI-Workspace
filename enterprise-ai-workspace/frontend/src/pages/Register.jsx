import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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

export default function Register() {
  const { t } = useLanguage();
  const { register, handleSubmit, formState: { errors } } = useForm();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function onSubmit(data) {
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/register', {
        username: data.username,
        email: data.email,
        password: data.password,
      });
      const res = await api.post('/auth/login', {
        email: data.email,
        password: data.password,
      });
      login(res.data.access_token, data.username);
      navigate('/dashboard');
    } catch (err) {
      if (!err.response) {
        setError(`Cannot connect to ${API_BASE_URL}. Browser error: ${err.message}`);
      } else {
        setError(err.response.data?.detail || t('error_generic'));
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
          <h2 className="text-xl font-bold text-gray-900 mb-1">{t('register_title')}</h2>
          <p className="text-gray-500 text-sm mb-6">{t('register_subtitle')}</p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('register_username')}
              </label>
              <input
                {...register('username', { required: true })}
                id="username"
                type="text"
                autoComplete="username"
                placeholder="johndoe"
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('register_email')}
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('register_password')}
              </label>
              <div className="relative">
                <input
                  {...register('password', { required: true, minLength: 6 })}
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
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
              {loading ? t('loading') : t('register_btn')}
            </button>
          </form>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-xs text-gray-400">
              <span className="bg-white px-2">{t('login_or')}</span>
            </div>
          </div>

          <a
            href={`${API_BASE_URL}/auth/google`}
            className="w-full flex items-center justify-center gap-3 border border-gray-300 rounded-lg px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.14 0 5.95 1.08 8.17 2.86l6.08-6.08C34.46 3.08 29.52 1 24 1 14.82 1 7.07 6.48 3.67 14.22l7.07 5.49C12.4 13.72 17.73 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.52 24.5c0-1.64-.15-3.22-.42-4.75H24v9h12.7c-.55 2.97-2.2 5.48-4.67 7.17l7.18 5.58C43.38 37.08 46.52 31.27 46.52 24.5z"/>
              <path fill="#FBBC05" d="M10.74 28.29A14.6 14.6 0 0 1 9.5 24c0-1.49.26-2.93.72-4.29L3.15 14.22A23.94 23.94 0 0 0 1 24c0 3.86.92 7.5 2.55 10.73l7.19-5.58z"/>
              <path fill="#34A853" d="M24 47c5.52 0 10.15-1.83 13.54-4.96l-7.18-5.58C28.5 37.78 26.37 38.5 24 38.5c-6.27 0-11.6-4.22-13.51-9.93l-7.07 5.49C7.07 41.52 14.82 47 24 47z"/>
            </svg>
            {t('login_google')}
          </a>

          <p className="text-center text-sm text-gray-500 mt-6">
            {t('register_have_account')}{' '}
            <Link to="/login" className="text-indigo-600 font-medium hover:underline">
              {t('register_login')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
