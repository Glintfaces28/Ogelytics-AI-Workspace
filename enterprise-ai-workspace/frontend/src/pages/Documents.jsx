import { useEffect, useRef, useState } from 'react';
import {
  Upload, FileText, Download, Trash2, Loader2, AlertCircle,
  Share2, X, UserPlus, Users, Check,
} from 'lucide-react';
import api from '../api/client';

function formatBytes(bytes) {
  if (!bytes) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

// ── Share modal ───────────────────────────────────────────────────────────────

function ShareModal({ doc, onClose }) {
  const [email, setEmail] = useState('');
  const [shares, setShares] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sharing, setSharing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    api.get(`/documents/${doc.id}/shares`)
      .then(r => setShares(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [doc.id]);

  async function shareDoc(e) {
    e.preventDefault();
    if (!email.trim()) return;
    setSharing(true);
    setError('');
    setSuccess('');
    try {
      const r = await api.post(`/documents/${doc.id}/share`, { email: email.trim() });
      setShares(prev => [...prev, r.data]);
      setEmail('');
      setSuccess(`Shared with ${r.data.shared_with_username}`);
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not share document.');
    } finally {
      setSharing(false);
    }
  }

  async function removeShare(shareId) {
    await api.delete(`/documents/${doc.id}/shares/${shareId}`);
    setShares(prev => prev.filter(s => s.id !== shareId));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Share Document</h2>
            <p className="text-sm text-gray-500 truncate max-w-xs mt-0.5">{doc.filename}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 p-1">
            <X size={18} />
          </button>
        </div>

        {/* Share form */}
        <form onSubmit={shareDoc} className="flex gap-2 mb-5">
          <input
            type="email"
            placeholder="Enter colleague's email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            type="submit"
            disabled={sharing || !email.trim()}
            className="flex items-center gap-1.5 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {sharing ? <Loader2 size={14} className="animate-spin" /> : <UserPlus size={14} />}
            Share
          </button>
        </form>

        {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
        {success && (
          <p className="flex items-center gap-1 text-green-600 text-sm mb-3">
            <Check size={14} /> {success}
          </p>
        )}

        {/* Current shares */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Shared with
          </p>
          {loading ? (
            <div className="flex justify-center py-4">
              <Loader2 size={18} className="animate-spin text-gray-400" />
            </div>
          ) : shares.length === 0 ? (
            <p className="text-sm text-gray-400 py-3 text-center">Not shared with anyone yet.</p>
          ) : (
            <div className="space-y-2">
              {shares.map(s => (
                <div key={s.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{s.shared_with_username}</p>
                    <p className="text-xs text-gray-500">{s.shared_with_email}</p>
                  </div>
                  <button
                    onClick={() => removeShare(s.id)}
                    className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                    title="Remove access"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function Documents() {
  const [documents, setDocuments] = useState([]);
  const [sharedDocs, setSharedDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [shareTarget, setShareTarget] = useState(null);
  const fileInputRef = useRef(null);

  function fetchDocuments() {
    Promise.all([
      api.get('/documents'),
      api.get('/documents/shared-with-me'),
    ])
      .then(([ownRes, sharedRes]) => {
        setDocuments(ownRes.data);
        setSharedDocs(sharedRes.data);
      })
      .catch(() => setError('Could not load documents.'))
      .finally(() => setLoading(false));
  }

  useEffect(() => { fetchDocuments(); }, []);

  async function uploadFile(file) {
    if (!file) return;
    setUploading(true);
    setError('');
    setSuccess('');
    const formData = new FormData();
    formData.append('file', file);
    try {
      await api.post('/upload', formData);
      setSuccess(`"${file.name}" uploaded successfully.`);
      fetchDocuments();
    } catch (err) {
      setError(err.response?.data?.detail || 'Upload failed.');
    } finally {
      setUploading(false);
    }
  }

  function handleFileChange(e) { uploadFile(e.target.files[0]); e.target.value = ''; }
  function handleDrop(e) { e.preventDefault(); setDragOver(false); uploadFile(e.dataTransfer.files[0]); }

  async function deleteDocument(id, filename) {
    if (!confirm(`Delete "${filename}"?`)) return;
    try {
      await api.delete(`/documents/${id}`);
      setDocuments(prev => prev.filter(d => d.id !== id));
    } catch { setError('Could not delete document.'); }
  }

  function downloadDocument(id) {
    window.open(`${import.meta.env.VITE_API_URL}/documents/${id}/download`, '_blank');
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Documents</h1>
        <p className="text-gray-500 mt-1">Upload, manage, and share your workspace documents.</p>
      </div>

      {/* Upload area */}
      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors mb-6 ${
          dragOver ? 'border-indigo-400 bg-indigo-50' : 'border-gray-300 bg-white hover:border-indigo-300 hover:bg-gray-50'
        }`}
      >
        <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChange} />
        {uploading ? (
          <div className="flex flex-col items-center gap-2 text-indigo-600">
            <Loader2 size={32} className="animate-spin" />
            <p className="text-sm font-medium">Uploading…</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 text-gray-500">
            <Upload size={32} className="text-indigo-400" />
            <p className="font-medium text-gray-700">Drop a file here or click to browse</p>
            <p className="text-xs">PDF, DOCX, TXT and more</p>
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-4 text-sm">
          <AlertCircle size={16} /> {error}
        </div>
      )}
      {success && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg px-4 py-3 mb-4 text-sm">
          {success}
        </div>
      )}

      {/* My documents */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      ) : documents.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <FileText size={40} className="mx-auto mb-3 opacity-40" />
          <p className="font-medium">No documents yet</p>
          <p className="text-sm">Upload your first file above.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {documents.map(doc => (
            <div
              key={doc.id}
              className="flex items-center gap-4 bg-white border border-gray-200 rounded-xl px-5 py-4 hover:border-gray-300 transition-colors"
            >
              <FileText size={20} className="text-indigo-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 text-sm truncate">{doc.filename}</p>
                <p className="text-gray-400 text-xs">
                  {formatBytes(doc.file_size)} · {formatDate(doc.uploaded_at)}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setShareTarget(doc)}
                  title="Share"
                  className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                >
                  <Share2 size={16} />
                </button>
                <button
                  onClick={() => downloadDocument(doc.id)}
                  title="Download"
                  className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                >
                  <Download size={16} />
                </button>
                <button
                  onClick={() => deleteDocument(doc.id, doc.filename)}
                  title="Delete"
                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Shared with me */}
      {sharedDocs.length > 0 && (
        <div className="mt-10">
          <div className="flex items-center gap-2 mb-4">
            <Users size={18} className="text-indigo-500" />
            <h2 className="text-lg font-semibold text-gray-800">Shared with me</h2>
            <span className="bg-indigo-100 text-indigo-700 text-xs font-medium px-2 py-0.5 rounded-full">
              {sharedDocs.length}
            </span>
          </div>
          <div className="space-y-2">
            {sharedDocs.map(doc => (
              <div
                key={doc.id}
                className="flex items-center gap-4 bg-indigo-50 border border-indigo-100 rounded-xl px-5 py-4"
              >
                <FileText size={20} className="text-indigo-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm truncate">{doc.filename}</p>
                  <p className="text-gray-500 text-xs">
                    {formatBytes(doc.file_size)} · Shared by <strong>{doc.shared_by_username}</strong>
                  </p>
                </div>
                <button
                  onClick={() => downloadDocument(doc.id)}
                  title="Download"
                  className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-white rounded-lg transition-colors"
                >
                  <Download size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Share modal */}
      {shareTarget && (
        <ShareModal doc={shareTarget} onClose={() => setShareTarget(null)} />
      )}
    </div>
  );
}
