import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, FileText, BarChart3, ShieldCheck, ShieldOff,
  UserX, CheckCircle, XCircle, Loader2, Trash2, HardDrive, MessageSquare,
} from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

function bytes(n) {
  if (n < 1024) return `${n} B`;
  if (n < 1048576) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1048576).toFixed(1)} MB`;
}

function StatCard({ icon: Icon, label, value, color = 'indigo' }) {
  const colors = {
    indigo: 'bg-indigo-50 text-indigo-600',
    green: 'bg-green-50 text-green-600',
    amber: 'bg-amber-50 text-amber-600',
    rose: 'bg-rose-50 text-rose-600',
  };
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${colors[color]}`}>
        <Icon size={22} />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-sm text-gray-500">{label}</p>
      </div>
    </div>
  );
}

// ── Users tab ─────────────────────────────────────────────────────────────────

function UsersTab() {
  const { t } = useLanguage();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user: me } = useAuth();

  useEffect(() => {
    api.get('/admin/users').then(r => setUsers(r.data)).finally(() => setLoading(false));
  }, []);

  async function toggle(userId, field, current) {
    const r = await api.patch(`/admin/users/${userId}`, { [field]: !current });
    setUsers(prev => prev.map(u => u.id === userId ? r.data : u));
  }

  async function deleteUser(userId, username) {
    if (!confirm(`Delete user "${username}" and all their data? This cannot be undone.`)) return;
    await api.delete(`/admin/users/${userId}`);
    setUsers(prev => prev.filter(u => u.id !== userId));
  }

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="animate-spin text-indigo-400" size={28} /></div>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-3 px-4 font-semibold text-gray-600">{t('admin_col_user')}</th>
            <th className="text-left py-3 px-4 font-semibold text-gray-600">{t('admin_col_email')}</th>
            <th className="text-center py-3 px-4 font-semibold text-gray-600">{t('admin_col_docs')}</th>
            <th className="text-center py-3 px-4 font-semibold text-gray-600">{t('admin_col_status')}</th>
            <th className="text-center py-3 px-4 font-semibold text-gray-600">{t('admin_col_role')}</th>
            <th className="text-left py-3 px-4 font-semibold text-gray-600">{t('admin_col_joined')}</th>
            <th className="text-right py-3 px-4 font-semibold text-gray-600">{t('admin_col_actions')}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {users.map(u => (
            <tr key={u.id} className="hover:bg-gray-50">
              <td className="py-3 px-4 font-medium text-gray-900">{u.username}</td>
              <td className="py-3 px-4 text-gray-600">{u.email}</td>
              <td className="py-3 px-4 text-center text-gray-700">{u.document_count}</td>
              <td className="py-3 px-4 text-center">
                <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                  u.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                }`}>
                  {u.is_active ? <CheckCircle size={11} /> : <XCircle size={11} />}
                  {u.is_active ? t('admin_status_active') : t('admin_status_suspended')}
                </span>
              </td>
              <td className="py-3 px-4 text-center">
                {u.is_admin && (
                  <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                    <ShieldCheck size={11} /> Admin
                  </span>
                )}
              </td>
              <td className="py-3 px-4 text-gray-500">
                {new Date(u.created_at).toLocaleDateString()}
              </td>
              <td className="py-3 px-4">
                {u.id !== me?.id && (
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => toggle(u.id, 'is_active', u.is_active)}
                      title={u.is_active ? 'Suspend user' : 'Activate user'}
                      className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-800 transition-colors"
                    >
                      {u.is_active ? <UserX size={15} /> : <CheckCircle size={15} />}
                    </button>
                    <button
                      onClick={() => toggle(u.id, 'is_admin', u.is_admin)}
                      title={u.is_admin ? 'Remove admin' : 'Make admin'}
                      className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-amber-600 transition-colors"
                    >
                      {u.is_admin ? <ShieldOff size={15} /> : <ShieldCheck size={15} />}
                    </button>
                    <button
                      onClick={() => deleteUser(u.id, u.username)}
                      title="Delete user"
                      className="p-1.5 rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-600 transition-colors"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {users.length === 0 && <p className="text-center text-gray-400 py-12">{t('admin_no_users')}</p>}
    </div>
  );
}

// ── Documents tab ─────────────────────────────────────────────────────────────

function DocumentsTab() {
  const { t } = useLanguage();
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/documents').then(r => setDocs(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="animate-spin text-indigo-400" size={28} /></div>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-3 px-4 font-semibold text-gray-600">{t('admin_col_filename')}</th>
            <th className="text-left py-3 px-4 font-semibold text-gray-600">{t('admin_col_owner')}</th>
            <th className="text-right py-3 px-4 font-semibold text-gray-600">{t('admin_col_size')}</th>
            <th className="text-left py-3 px-4 font-semibold text-gray-600">{t('admin_col_uploaded')}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {docs.map(d => (
            <tr key={d.id} className="hover:bg-gray-50">
              <td className="py-3 px-4 font-medium text-gray-900 max-w-xs truncate">{d.filename}</td>
              <td className="py-3 px-4 text-gray-600">
                <span className="font-medium">{d.owner_username}</span>
                <span className="text-gray-400 ml-1">({d.owner_email})</span>
              </td>
              <td className="py-3 px-4 text-right text-gray-600">{bytes(d.file_size)}</td>
              <td className="py-3 px-4 text-gray-500">
                {new Date(d.uploaded_at).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {docs.length === 0 && <p className="text-center text-gray-400 py-12">{t('admin_no_docs')}</p>}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function Admin() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('stats');
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (!user?.is_admin) { navigate('/'); return; }
    api.get('/admin/stats').then(r => setStats(r.data)).catch(() => {});
  }, [user]);

  if (!user?.is_admin) return null;

  const tabs = [
    { id: 'stats', label: t('admin_tab_overview'), icon: BarChart3 },
    { id: 'users', label: t('admin_tab_users'), icon: Users },
    { id: 'documents', label: t('admin_tab_docs'), icon: FileText },
  ];

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
          <ShieldCheck className="text-amber-600" size={20} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('admin_title')}</h1>
          <p className="text-gray-500 text-sm">{t('admin_sub')}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-gray-200">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              tab === id
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {tab === 'stats' && (
          <div className="p-6">
            {!stats ? (
              <div className="flex justify-center py-12"><Loader2 className="animate-spin text-indigo-400" size={28} /></div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <StatCard icon={Users} label={t('admin_stat_total_users')} value={stats.total_users} color="indigo" />
                <StatCard icon={CheckCircle} label={t('admin_stat_active_users')} value={stats.active_users} color="green" />
                <StatCard icon={FileText} label={t('admin_stat_total_docs')} value={stats.total_documents} color="indigo" />
                <StatCard icon={HardDrive} label={t('admin_stat_storage')} value={bytes(stats.total_storage_bytes)} color="amber" />
                <StatCard icon={BarChart3} label={t('admin_stat_queries')} value={stats.total_ai_queries} color="indigo" />
                <StatCard icon={MessageSquare} label={t('admin_stat_sessions')} value={stats.total_chat_sessions} color="green" />
              </div>
            )}
          </div>
        )}
        {tab === 'users' && <UsersTab />}
        {tab === 'documents' && <DocumentsTab />}
      </div>
    </div>
  );
}
