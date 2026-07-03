import { useEffect, useRef, useState } from 'react';
import {
  Send, Bot, User, Loader2, FileText, CheckSquare, Square,
  Plus, Trash2, MessageSquare, ChevronLeft, ChevronRight, Pencil, Check, X,
  Download,
} from 'lucide-react';
import api from '../api/client';

// ── Export helpers ────────────────────────────────────────────────────────────

function downloadText(content, filename) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function formatConversation(messages) {
  const date = new Date().toLocaleString();
  let out = `OGELYTICS AI WORKSPACE — CHAT EXPORT\nGenerated: ${date}\n${'='.repeat(50)}\n\n`;
  for (const msg of messages) {
    if (msg.role === 'assistant' && msg.content.startsWith('Hello!')) continue;
    if (msg.role === 'user') {
      out += `Q: ${msg.content}\n\n`;
    } else {
      out += `A: ${msg.content}\n`;
      if (msg.sources?.length) {
        out += '\nSources:\n';
        msg.sources.forEach(s => { out += `  • ${s.filename}: ${s.passage?.slice(0, 120)}...\n`; });
      }
      out += '\n' + '-'.repeat(50) + '\n\n';
    }
  }
  return out;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function timeLabel(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now - d;
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

// Group sessions by relative date label
function groupSessions(sessions) {
  const groups = {};
  for (const s of sessions) {
    const label = timeLabel(s.updated_at);
    if (!groups[label]) groups[label] = [];
    groups[label].push(s);
  }
  return groups;
}

const WELCOME = { role: 'assistant', content: 'Hello! Ask me anything about your uploaded documents.' };

// ── Message bubble ────────────────────────────────────────────────────────────

function Message({ msg, index }) {
  const isUser = msg.role === 'user';

  function downloadAnswer() {
    const date = new Date().toLocaleString();
    let content = `OGELYTICS AI WORKSPACE — ANSWER EXPORT\nGenerated: ${date}\n${'='.repeat(50)}\n\n`;
    content += `A: ${msg.content}\n`;
    if (msg.sources?.length) {
      content += '\nSources:\n';
      msg.sources.forEach(s => { content += `  • ${s.filename}: ${s.passage?.slice(0, 200)}\n`; });
    }
    downloadText(content, `ogelytics-answer-${index}.txt`);
  }

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
        isUser ? 'bg-indigo-600' : 'bg-slate-700'
      }`}>
        {isUser ? <User size={14} className="text-white" /> : <Bot size={14} className="text-white" />}
      </div>
      <div className={`max-w-[75%] ${isUser ? 'items-end' : 'items-start'} flex flex-col gap-2`}>
        <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
          isUser
            ? 'bg-indigo-600 text-white rounded-tr-sm'
            : 'bg-white border border-gray-200 text-gray-800 rounded-tl-sm'
        }`}>
          {msg.content}
        </div>
        {!isUser && (
          <button
            onClick={downloadAnswer}
            title="Download this answer"
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-indigo-600 transition-colors px-1"
          >
            <Download size={12} /> Download answer
          </button>
        )}
        {msg.sources && msg.sources.length > 0 && (
          <div className="space-y-1 w-full">
            <p className="text-xs text-gray-400 px-1">Sources</p>
            {msg.sources.map((s, i) => (
              <div key={i} className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-600">
                <p className="flex items-center gap-1 font-medium text-gray-700 mb-0.5">
                  <FileText size={11} /> {s.filename}
                </p>
                <p className="line-clamp-2">{s.passage}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Sidebar session item ──────────────────────────────────────────────────────

function SessionItem({ session, isActive, onSelect, onDelete, onRename }) {
  const [hovering, setHovering] = useState(false);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(session.title);
  const inputRef = useRef(null);

  function startEdit(e) {
    e.stopPropagation();
    setEditing(true);
    setTimeout(() => inputRef.current?.select(), 50);
  }

  function saveEdit(e) {
    e?.stopPropagation();
    const trimmed = title.trim();
    if (trimmed && trimmed !== session.title) onRename(session.id, trimmed);
    else setTitle(session.title);
    setEditing(false);
  }

  function cancelEdit(e) {
    e?.stopPropagation();
    setTitle(session.title);
    setEditing(false);
  }

  return (
    <div
      onClick={() => !editing && onSelect(session.id)}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      className={`group relative flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors text-sm ${
        isActive
          ? 'bg-indigo-50 text-indigo-800'
          : 'text-gray-700 hover:bg-gray-100'
      }`}
    >
      <MessageSquare size={14} className="shrink-0 text-gray-400" />

      {editing ? (
        <input
          ref={inputRef}
          value={title}
          onChange={e => setTitle(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') cancelEdit(); }}
          onClick={e => e.stopPropagation()}
          className="flex-1 min-w-0 bg-white border border-indigo-300 rounded px-1.5 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
          autoFocus
        />
      ) : (
        <span className="flex-1 truncate">{session.title}</span>
      )}

      {/* Action buttons */}
      <div className={`flex items-center gap-1 shrink-0 ${(hovering || isActive) && !editing ? 'opacity-100' : 'opacity-0'}`}>
        {editing ? (
          <>
            <button onClick={saveEdit} className="p-0.5 hover:text-green-600 text-gray-500">
              <Check size={13} />
            </button>
            <button onClick={cancelEdit} className="p-0.5 hover:text-red-500 text-gray-500">
              <X size={13} />
            </button>
          </>
        ) : (
          <>
            <button
              onClick={startEdit}
              title="Rename"
              className="p-0.5 hover:text-indigo-600 text-gray-400"
            >
              <Pencil size={13} />
            </button>
            <button
              onClick={e => { e.stopPropagation(); onDelete(session.id); }}
              title="Delete"
              className="p-0.5 hover:text-red-500 text-gray-400"
            >
              <Trash2 size={13} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function AiChat() {
  const [sessions, setSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [messages, setMessages] = useState([WELCOME]);
  const [documents, setDocuments] = useState([]);
  const [selectedDocumentIds, setSelectedDocumentIds] = useState([]);
  const [loadingDocuments, setLoadingDocuments] = useState(true);
  const [loadingSession, setLoadingSession] = useState(false);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const bottomRef = useRef(null);

  // Load documents and sessions on mount
  useEffect(() => {
    api.get('/documents')
      .then(r => setDocuments(r.data))
      .catch(() => setDocuments([]))
      .finally(() => setLoadingDocuments(false));

    fetchSessions();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  async function fetchSessions() {
    try {
      const r = await api.get('/chat/sessions');
      setSessions(r.data);
    } catch {
      // silently fail — history is not critical
    }
  }

  async function loadSession(sessionId) {
    if (sessionId === currentSessionId) return;
    setLoadingSession(true);
    try {
      const r = await api.get(`/chat/sessions/${sessionId}`);
      setCurrentSessionId(sessionId);
      const msgs = r.data.messages.map(m => ({
        role: m.role,
        content: m.content,
        sources: m.sources || undefined,
      }));
      setMessages(msgs.length ? msgs : [WELCOME]);
    } catch {
      // ignore
    } finally {
      setLoadingSession(false);
    }
  }

  function newChat() {
    setCurrentSessionId(null);
    setMessages([WELCOME]);
    setSelectedDocumentIds([]);
    setInput('');
  }

  function toggleDocument(id) {
    setSelectedDocumentIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  }

  async function deleteSession(sessionId) {
    try {
      await api.delete(`/chat/sessions/${sessionId}`);
      setSessions(prev => prev.filter(s => s.id !== sessionId));
      if (currentSessionId === sessionId) newChat();
    } catch {
      // ignore
    }
  }

  async function renameSession(sessionId, title) {
    try {
      const r = await api.patch(`/chat/sessions/${sessionId}`, { title });
      setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, title: r.data.title } : s));
    } catch {
      // ignore
    }
  }

  async function sendMessage(e) {
    e.preventDefault();
    const question = input.trim();
    if (!question || sending) return;

    setMessages(prev => [...prev, { role: 'user', content: question }]);
    setInput('');
    setSending(true);

    try {
      const payload = {
        question,
        max_results: 3,
        document_ids: selectedDocumentIds.length ? selectedDocumentIds : null,
        session_id: currentSessionId,
      };
      const res = await api.post('/ai/chat', payload);

      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: res.data.answer, sources: res.data.sources },
      ]);

      // Update session tracking
      const newId = res.data.session_id;
      if (!currentSessionId) {
        setCurrentSessionId(newId);
        await fetchSessions();  // refresh list so new session appears
      } else {
        // bump updated_at in sidebar
        setSessions(prev => prev.map(s =>
          s.id === newId ? { ...s, updated_at: new Date().toISOString() } : s
        ));
      }
    } catch {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' },
      ]);
    } finally {
      setSending(false);
    }
  }

  const sessionGroups = groupSessions(sessions);

  return (
    <div className="flex h-full overflow-hidden">
      {/* ── Sidebar ────────────────────────────────────────────────────────── */}
      <div className={`flex flex-col bg-gray-50 border-r border-gray-200 transition-all duration-200 shrink-0 ${
        sidebarOpen ? 'w-64' : 'w-0 overflow-hidden'
      }`}>
        {/* New Chat button */}
        <div className="p-3 border-b border-gray-200">
          <button
            onClick={newChat}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium py-2 px-3 rounded-lg transition-colors"
          >
            <Plus size={15} />
            New Chat
          </button>
        </div>

        {/* Session list */}
        <div className="flex-1 overflow-y-auto p-2 space-y-4">
          {sessions.length === 0 ? (
            <p className="text-xs text-gray-400 text-center pt-6 px-4">
              Your chat history will appear here after your first conversation.
            </p>
          ) : (
            Object.entries(sessionGroups).map(([label, group]) => (
              <div key={label}>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-3 mb-1">
                  {label}
                </p>
                <div className="space-y-0.5">
                  {group.map(session => (
                    <SessionItem
                      key={session.id}
                      session={session}
                      isActive={session.id === currentSessionId}
                      onSelect={loadSession}
                      onDelete={deleteSession}
                      onRename={renameSession}
                    />
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── Main chat area ─────────────────────────────────────────────────── */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Header */}
        <div className="px-4 py-4 border-b border-gray-200 bg-white shrink-0 flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(v => !v)}
            className="text-gray-400 hover:text-gray-700 transition-colors"
            title={sidebarOpen ? 'Hide history' : 'Show history'}
          >
            {sidebarOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900">AI Chat</h1>
            <p className="text-gray-500 text-sm">Ask questions about your uploaded documents.</p>
          </div>
          {messages.length > 1 && (
            <button
              onClick={() => downloadText(formatConversation(messages), `ogelytics-chat-${Date.now()}.txt`)}
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-indigo-600 border border-gray-200 hover:border-indigo-300 rounded-lg px-3 py-1.5 transition-colors"
            >
              <Download size={14} /> Export chat
            </button>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-auto px-6 py-6 space-y-5">
          {loadingSession ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 size={28} className="animate-spin text-indigo-400" />
            </div>
          ) : (
            <>
              {messages.map((msg, i) => <Message key={i} msg={msg} index={i} />)}
              {sending && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center shrink-0">
                    <Bot size={14} className="text-white" />
                  </div>
                  <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-3">
                    <Loader2 size={16} className="animate-spin text-indigo-500" />
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </>
          )}
        </div>

        {/* Input area */}
        <form
          onSubmit={sendMessage}
          className="shrink-0 px-6 py-4 border-t border-gray-200 bg-white"
        >
          <div className="max-w-4xl mx-auto space-y-3">
            {/* Document filter */}
            <div>
              <div className="flex items-center justify-between gap-3 mb-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Documents
                </p>
                {selectedDocumentIds.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedDocumentIds([])}
                    className="text-xs font-medium text-indigo-600 hover:text-indigo-800"
                  >
                    Search all
                  </button>
                )}
              </div>
              {loadingDocuments ? (
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Loader2 size={14} className="animate-spin" /> Loading documents...
                </div>
              ) : documents.length === 0 ? (
                <p className="text-sm text-gray-400">No documents uploaded yet.</p>
              ) : (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {documents.map(doc => {
                    const selected = selectedDocumentIds.includes(doc.id);
                    return (
                      <label
                        key={doc.id}
                        className={`shrink-0 inline-flex items-center gap-2 border rounded-lg px-3 py-2 text-sm cursor-pointer transition-colors max-w-xs ${
                          selected
                            ? 'bg-indigo-50 border-indigo-300 text-indigo-800'
                            : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                        }`}
                        title={doc.filename}
                      >
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() => toggleDocument(doc.id)}
                          className="sr-only"
                        />
                        {selected ? <CheckSquare size={15} /> : <Square size={15} />}
                        <span className="truncate">{doc.filename}</span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Text input + send */}
            <div className="flex gap-3">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Ask a question about your documents…"
                disabled={sending}
                className="flex-1 border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-50"
              />
              <button
                type="submit"
                disabled={sending || !input.trim()}
                className="bg-indigo-600 text-white px-4 py-2.5 rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center gap-2"
              >
                <Send size={16} />
                <span className="hidden sm:inline text-sm font-medium">Send</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
