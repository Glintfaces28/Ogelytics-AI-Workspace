import { useEffect, useState } from 'react';
import {
  Activity,
  FileText,
  HardDrive,
  Loader2,
  Users,
} from 'lucide-react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import api from '../api/client';
import { useLanguage } from '../context/LanguageContext';

function formatBytes(bytes) {
  if (!bytes) return '0 KB';
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDay(value) {
  return new Date(`${value}T00:00:00`).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

function MetricCard({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-gray-500">{label}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
        </div>
        <div className={`w-11 h-11 rounded-lg flex items-center justify-center ${color}`}>
          <Icon size={21} className="text-white" />
        </div>
      </div>
    </div>
  );
}

function ChartCard({ title, data, dataKey, stroke }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5">
      <h2 className="font-semibold text-gray-900 mb-4">{title}</h2>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 16, left: -18, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis
              dataKey="date"
              tickFormatter={formatDay}
              tick={{ fontSize: 12, fill: '#6B7280' }}
              stroke="#D1D5DB"
            />
            <YAxis
              allowDecimals={false}
              tick={{ fontSize: 12, fill: '#6B7280' }}
              stroke="#D1D5DB"
            />
            <Tooltip
              labelFormatter={formatDay}
              contentStyle={{
                borderRadius: 8,
                border: '1px solid #E5E7EB',
                boxShadow: '0 8px 24px rgba(15, 23, 42, 0.08)',
              }}
            />
            <Line
              type="monotone"
              dataKey={dataKey}
              stroke={stroke}
              strokeWidth={3}
              dot={{ r: 4, strokeWidth: 2 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default function Analytics() {
  const { t } = useLanguage();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/api/analytics')
      .then((res) => setAnalytics(res.data))
      .catch((err) => setError(err.response?.data?.detail || 'Could not load analytics.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-6 h-72 flex items-center justify-center">
        <Loader2 size={30} className="animate-spin text-indigo-500" />
      </div>
    );
  }

  const totals = analytics?.totals || {};

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('analytics_title')}</h1>
        <p className="text-gray-500 mt-1">{t('analytics_subtitle')}</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-5 text-sm">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-6">
        <MetricCard
          icon={FileText}
          label={t('analytics_total_docs')}
          value={totals.documents ?? 0}
          color="bg-indigo-600"
        />
        <MetricCard
          icon={Activity}
          label={t('analytics_total_queries')}
          value={totals.ai_queries ?? 0}
          color="bg-emerald-600"
        />
        <MetricCard
          icon={HardDrive}
          label={t('analytics_storage_used')}
          value={formatBytes(totals.storage_bytes)}
          color="bg-amber-500"
        />
        <MetricCard
          icon={Users}
          label={t('analytics_team_members')}
          value={totals.team_members ?? 0}
          color="bg-rose-500"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <ChartCard
          title={t('analytics_docs_over_time')}
          data={analytics?.documents_over_time || []}
          dataKey="documents"
          stroke="#4F46E5"
        />
        <ChartCard
          title={t('analytics_queries_over_time')}
          data={analytics?.ai_queries_over_time || []}
          dataKey="ai_queries"
          stroke="#059669"
        />
      </div>
    </div>
  );
}
