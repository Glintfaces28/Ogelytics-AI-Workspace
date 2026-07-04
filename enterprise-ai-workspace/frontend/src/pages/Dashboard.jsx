import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Users, BarChart3, HardDrive, Upload, MessageSquare } from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        <Icon size={22} className="text-white" />
      </div>
      <div>
        <p className="text-gray-500 text-sm">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{value ?? '—'}</p>
      </div>
    </div>
  );
}

function formatBytes(bytes) {
  if (!bytes) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function Dashboard() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/reports/summary')
      .then((res) => setSummary(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          {t('dash_welcome')}, {user?.username} 👋
        </h1>
        <p className="text-gray-500 mt-1">{t('dash_subtitle')}</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 h-24 animate-pulse bg-gray-100" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard icon={FileText} label={t('dash_stat_docs')} value={summary?.total_documents} color="bg-indigo-500" />
          <StatCard icon={Users} label={t('dash_stat_members')} value={summary?.total_users} color="bg-emerald-500" />
          <StatCard icon={BarChart3} label={t('dash_stat_teams')} value={summary?.total_teams} color="bg-amber-500" />
          <StatCard icon={HardDrive} label={t('dash_stat_storage')} value={formatBytes(summary?.total_storage_bytes)} color="bg-rose-500" />
        </div>
      )}

      <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-5 mb-6">
        <p className="text-indigo-700 text-sm font-medium">
          {t('dash_recent', summary?.recent_uploads_7_days ?? 0)}
        </p>
      </div>

      <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('dash_quick')}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          to="/documents"
          className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl p-5 hover:border-indigo-300 hover:shadow-sm transition-all group"
        >
          <Upload size={20} className="text-indigo-500 group-hover:text-indigo-600" />
          <div>
            <p className="font-medium text-gray-900 text-sm">{t('dash_upload_title')}</p>
            <p className="text-gray-500 text-xs mt-0.5">{t('dash_upload_sub')}</p>
          </div>
        </Link>
        <Link
          to="/chat"
          className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl p-5 hover:border-indigo-300 hover:shadow-sm transition-all group"
        >
          <MessageSquare size={20} className="text-indigo-500 group-hover:text-indigo-600" />
          <div>
            <p className="font-medium text-gray-900 text-sm">{t('dash_ask_title')}</p>
            <p className="text-gray-500 text-xs mt-0.5">{t('dash_ask_sub')}</p>
          </div>
        </Link>
        <Link
          to="/teams"
          className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl p-5 hover:border-indigo-300 hover:shadow-sm transition-all group"
        >
          <Users size={20} className="text-indigo-500 group-hover:text-indigo-600" />
          <div>
            <p className="font-medium text-gray-900 text-sm">{t('dash_teams_title')}</p>
            <p className="text-gray-500 text-xs mt-0.5">{t('dash_teams_sub')}</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
