import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStoredNotes, type StoredNote } from '@/lib/notesStore';
import { supabase } from '@/integrations/supabase/client';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Highlight from '@tiptap/extension-highlight';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Placeholder from '@tiptap/extension-placeholder';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, Link } from 'react-router-dom';
import AppLayout from '@/components/AppLayout';
import { MOCK_NOTES, MOCK_TAGS } from '@/lib/types';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  ArrowLeft, Bold, Italic, Underline, Code, Highlighter,
  List, ListOrdered, CheckSquare, Quote, Minus, Save,
  Share2, MoreHorizontal, Sparkles, Copy, Plus, X,
  Tag, Eye, Focus, Clock, Hash, Send, Paperclip, Image as ImageIcon, FileText, Loader2
} from 'lucide-react';

const SLASH_COMMANDS = [
  { icon: '📝', label: 'Paragraph', command: 'paragraph' },
  { icon: 'H1', label: 'Heading 1', command: 'h1' },
  { icon: 'H2', label: 'Heading 2', command: 'h2' },
  { icon: 'H3', label: 'Heading 3', command: 'h3' },
  { icon: '•', label: 'Bullet List', command: 'bulletList' },
  { icon: '1.', label: 'Numbered List', command: 'orderedList' },
  { icon: '☑', label: 'Checklist', command: 'taskList' },
  { icon: '❝', label: 'Blockquote', command: 'blockquote' },
  { icon: '<>', label: 'Code Block', command: 'codeBlock' },
  { icon: '—', label: 'Divider', command: 'hr' },
];

const AI_PROMPTS = [
  { icon: '✦', label: 'Summarize', color: '#7c3aed' },
  { icon: '↗', label: 'Expand idea', color: '#06b6d4' },
  { icon: '📋', label: 'Outline', color: '#22c55e' },
  { icon: '💼', label: 'LinkedIn post', color: '#3b82f6' },
  { icon: '🃏', label: 'Flashcards', color: '#f59e0b' },
  { icon: '✏️', label: 'Fix grammar', color: '#a78bfa' },
];

// ---- Markdown renderer for chat bubbles ----
function ChatMarkdown({ content, color }: { content: string; color: 'user' | 'assistant' }) {
  return (
    <div className="font-mono text-[13px] leading-relaxed space-y-2 [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => <p className="text-foreground whitespace-pre-wrap">{children}</p>,
          strong: ({ children }) => (
            <strong className="font-semibold" style={{ color: color === 'assistant' ? '#a78bfa' : '#f1f5f9' }}>
              {children}
            </strong>
          ),
          em: ({ children }) => <em className="text-cyan-300 italic">{children}</em>,
          h1: ({ children }) => <h1 className="text-base font-serif italic font-bold text-foreground mt-3">{children}</h1>,
          h2: ({ children }) => <h2 className="text-[15px] font-serif italic font-bold text-foreground mt-3" style={{ color: '#a78bfa' }}>{children}</h2>,
          h3: ({ children }) => <h3 className="text-sm font-semibold text-foreground mt-2" style={{ color: '#22c55e' }}>{children}</h3>,
          ul: ({ children }) => <ul className="list-disc pl-4 space-y-1 marker:text-purple-400">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal pl-4 space-y-1 marker:text-cyan-400">{children}</ol>,
          li: ({ children }) => <li className="text-foreground">{children}</li>,
          code: ({ children, className }) => {
            const isBlock = /language-/.test(className || '');
            if (isBlock) {
              return (
                <pre
                  className="rounded-lg p-3 overflow-x-auto text-[12px] my-2"
                  style={{ background: '#04040c', border: '1px solid hsl(240 20% 18%)' }}
                >
                  <code className="text-cyan-300">{children}</code>
                </pre>
              );
            }
            return (
              <code
                className="px-1.5 py-0.5 rounded text-[12px]"
                style={{ background: 'hsl(263 69% 58% / 0.15)', color: '#f59e0b' }}
              >
                {children}
              </code>
            );
          },
          blockquote: ({ children }) => (
            <blockquote
              className="border-l-2 pl-3 italic text-muted-foreground my-2"
              style={{ borderColor: '#7c3aed' }}
            >
              {children}
            </blockquote>
          ),
          a: ({ children, href }) => (
            <a href={href} target="_blank" rel="noopener noreferrer" className="underline" style={{ color: '#06b6d4' }}>
              {children}
            </a>
          ),
          hr: () => <hr className="my-2" style={{ borderColor: 'hsl(240 20% 18%)' }} />,
          table: ({ children }) => (
            <div className="overflow-x-auto my-2">
              <table className="text-xs border-collapse w-full">{children}</table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border px-2 py-1 text-left font-semibold" style={{ borderColor: 'hsl(240 20% 18%)', color: '#a78bfa' }}>
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border px-2 py-1" style={{ borderColor: 'hsl(240 20% 18%)' }}>
              {children}
            </td>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

function FloatingToolbar({ editor }: { editor: any }) {
  if (!editor) return null;

  return (
    <div
      className="flex items-center gap-1 px-2 py-1.5 rounded-xl shadow-xl"
      style={{
        background: '#0d0d1a',
        border: '1px solid hsl(240 20% 18%)',
        boxShadow: '0 8px 32px hsl(263 69% 58% / 0.2)',
      }}
    >
      {[
        { icon: <Bold size={14} />, action: () => editor.chain().focus().toggleBold().run(), active: editor.isActive('bold') },
        { icon: <Italic size={14} />, action: () => editor.chain().focus().toggleItalic().run(), active: editor.isActive('italic') },
        { icon: <Underline size={14} />, action: () => editor.chain().focus().toggleUnderline?.().run(), active: false },
        { icon: <Highlighter size={14} />, action: () => editor.chain().focus().toggleHighlight().run(), active: editor.isActive('highlight') },
        { icon: <Code size={14} />, action: () => editor.chain().focus().toggleCode().run(), active: editor.isActive('code') },
      ].map((btn, i) => (
        <button
          key={i}
          onClick={btn.action}
          className="p-1.5 rounded-lg transition-colors"
          style={{
            background: btn.active ? 'hsl(263 69% 58% / 0.2)' : 'transparent',
            color: btn.active ? '#a78bfa' : '#94a3b8',
          }}
        >
          {btn.icon}
        </button>
      ))}
      <div className="w-px h-4 mx-1" style={{ background: 'hsl(240 20% 18%)' }} />
      <button className="flex items-center gap-1.5 px-2 py-1 rounded-lg font-mono text-xs text-cyan-400 hover:bg-white/5">
        <Sparkles size={12} /> AI ✦
      </button>
    </div>
  );
}

export default function NoteEditor() {
  const { noteId } = useParams();
  const navigate = useNavigate();
  const isNew = noteId === 'new';
  const storedNotes = useStoredNotes();
  const storedNote = useMemo(
    () => (isNew ? null : storedNotes.find((n) => n.id === noteId) || null),
    [isNew, noteId, storedNotes]
  );
  const existingNote = storedNote
    ? null
    : isNew
    ? null
    : MOCK_NOTES.find((n) => n.id === noteId) || null;

  const initialTitle = storedNote?.title ?? existingNote?.title ?? '';
  const initialTags = storedNote
    ? (storedNote.tags || []).map((name) => {
        const m = MOCK_TAGS.find((t) => t.name.toLowerCase() === String(name).toLowerCase());
        return m || { id: `t_${name}`, name: String(name), color: '#7c3aed' };
      })
    : existingNote?.tags || [];

  const [title, setTitle] = useState(initialTitle);
  const [selectedTags, setSelectedTags] = useState(initialTags);
  const [showTagPicker, setShowTagPicker] = useState(false);
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [saved, setSaved] = useState(false);
  const [focusMode, setFocusMode] = useState(false);

  // AI chat state
  type Attach = { kind: 'image' | 'file'; mime: string; name: string; dataUrl: string };
  type ChatMsg = { id: string; role: 'user' | 'assistant'; content: string; attachments?: Attach[] };
  const [chat, setChat] = useState<ChatMsg[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatAttachments, setChatAttachments] = useState<Attach[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Highlight,
      TaskList,
      TaskItem.configure({ nested: true }),
      Placeholder.configure({
        placeholder: 'Start writing, or press / for commands...',
      }),
    ],
    content: storedNote
      ? storedNote.content || ''
      : existingNote
      ? `<h1>${existingNote.title}</h1><p>${existingNote.preview}</p><p>Continue writing here...</p>`
      : '',
    editorProps: {
      attributes: { class: 'outline-none' },
    },
  });

  const handleSave = () => {
    try {
      const html = editor?.getHTML() || '';
      const text = editor?.getText() || '';
      const id = storedNote?.id || (isNew ? `n_${Date.now()}` : (noteId as string));
      const raw = localStorage.getItem('neuronotes_notes');
      const list: StoredNote[] = raw ? JSON.parse(raw) : [];
      const nowIso = new Date().toISOString();
      const finalTitle = title.trim() || text.split(/[.!?\n]/)[0].slice(0, 60) || 'Untitled note';
      const tagNames = selectedTags.map((t: any) => t.name);
      const idx = list.findIndex((n) => n.id === id);
      const next: StoredNote = {
        id,
        title: finalTitle,
        content: html,
        tags: tagNames,
        createdAt: idx >= 0 ? list[idx].createdAt || nowIso : nowIso,
        updatedAt: nowIso,
      };
      if (idx >= 0) list[idx] = next;
      else list.unshift(next);
      localStorage.setItem('neuronotes_notes', JSON.stringify(list));
      window.dispatchEvent(new Event('neuronotes:notes-changed'));
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      if (isNew) navigate(`/editor/${id}`, { replace: true });
    } catch (e) {
      console.error('Save failed', e);
    }
  };

  const scrollChatToBottom = () => {
    requestAnimationFrame(() => {
      const el = chatScrollRef.current;
      if (el) el.scrollTop = el.scrollHeight;
    });
  };

  const fileToDataUrl = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result));
      r.onerror = () => reject(r.error);
      r.readAsDataURL(file);
    });

  const onPickFiles = async (files: FileList | null) => {
    if (!files) return;
    const added: Attach[] = [];
    for (const f of Array.from(files).slice(0, 5)) {
      if (f.size > 8 * 1024 * 1024) continue; // 8MB cap
      const dataUrl = await fileToDataUrl(f);
      added.push({
        kind: f.type.startsWith('image/') ? 'image' : 'file',
        mime: f.type || 'application/octet-stream',
        name: f.name,
        dataUrl,
      });
    }
    setChatAttachments((prev) => [...prev, ...added]);
  };

  // ---- Streaming send ----
  const sendChat = async (overrideText?: string) => {
    const text = (overrideText ?? chatInput).trim();
    if (!text && chatAttachments.length === 0) return;
    if (aiLoading) return;

    const userMsg: ChatMsg = {
      id: `u_${Date.now()}`,
      role: 'user',
      content: text,
      attachments: chatAttachments.length ? chatAttachments : undefined,
    };
    const nextChat = [...chat, userMsg];
    setChat(nextChat);
    setChatInput('');
    setChatAttachments([]);
    setAiLoading(true);
    scrollChatToBottom();

    const assistantId = `a_${Date.now()}`;
    setChat((prev) => [...prev, { id: assistantId, role: 'assistant', content: '' }]);

    try {
      const noteContext = editor?.getText() || '';

      // Build the direct edge function URL using the same env vars as the supabase client
      const baseUrl: string = import.meta.env.VITE_SUPABASE_URL;
      const anonKey: string = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const functionUrl = `${baseUrl}/functions/v1/ai-assistant`;

      abortRef.current = new AbortController();

      const resp = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${anonKey}`,
          apikey: anonKey,
        },
        body: JSON.stringify({
          noteTitle: title,
          noteContext,
          messages: nextChat.map((m) => ({
            role: m.role,
            content: m.content,
            attachments: m.attachments,
          })),
        }),
        signal: abortRef.current.signal,
      });

      if (!resp.ok || !resp.body) {
        let errMsg = 'Request failed.';
        try {
          const errJson = await resp.json();
          errMsg = errJson?.error || errMsg;
        } catch {
          /* ignore parse failure */
        }
        setChat((prev) =>
          prev.map((m) => (m.id === assistantId ? { ...m, content: `⚠️ ${errMsg}` } : m))
        );
        return;
      }

      const contentType = resp.headers.get('content-type') || '';

      // Fallback: if the server didn't actually stream (plain JSON response), handle it directly.
      if (contentType.includes('application/json')) {
        const json = await resp.json();
        const reply = json?.reply || json?.error || 'No response.';
        setChat((prev) => prev.map((m) => (m.id === assistantId ? { ...m, content: reply } : m)));
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let accumulated = '';
      let rawLog = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunkText = decoder.decode(value, { stream: true });
        rawLog += chunkText;
        buffer += chunkText;
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // keep incomplete line for next chunk

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data:')) continue;
          const payload = trimmed.slice(5).trim();
          if (payload === '[DONE]' || payload === '') continue;

          try {
            const json = JSON.parse(payload);
            // Handle multiple possible SSE shapes across providers/gateways
            const delta =
              json?.choices?.[0]?.delta?.content ??
              json?.choices?.[0]?.message?.content ??
              json?.delta?.text ??
              json?.content ??
              '';
            if (delta) {
              accumulated += delta;
              setChat((prev) =>
                prev.map((m) => (m.id === assistantId ? { ...m, content: accumulated } : m))
              );
              scrollChatToBottom();
            }
          } catch {
            // skip malformed SSE chunk
          }
        }
      }

      if (!accumulated) {
        console.warn('[AI stream] No content extracted. Raw stream was:', rawLog);
        setChat((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, content: rawLog ? '⚠️ Unexpected response format (see console).' : 'No response.' } : m
          )
        );
      }
    } catch (e: any) {
      if (e?.name !== 'AbortError') {
        setChat((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, content: `⚠️ ${e?.message || 'Request failed.'}` } : m
          )
        );
      }
    } finally {
      setAiLoading(false);
      scrollChatToBottom();
    }
  };

  const runAI = (prompt: string) => {
    const quick: Record<string, string> = {
      'Summarize': 'Summarize my current note into concise key points.',
      'Expand idea': 'Expand and elaborate on the ideas in my current note.',
      'Outline': 'Create a structured outline for my current note.',
      'LinkedIn post': 'Turn my current note into an engaging LinkedIn post.',
      'Flashcards': 'Generate study flashcards (Q&A pairs) from my current note.',
      'Fix grammar': 'Proofread and fix grammar in my current note. Return the corrected text.',
    };
    sendChat(quick[prompt] || prompt);
  };

  const wordCount = editor?.getText().split(/\s+/).filter(Boolean).length || 0;

  return (
    <AppLayout>
      <div className={`flex h-[calc(100vh-56px)] ${focusMode ? 'fixed inset-0 z-50' : ''}`} style={{ background: focusMode ? '#04040c' : 'transparent' }}>
        {/* Editor main */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Editor toolbar */}
          <div
            className="flex items-center gap-3 px-6 py-3 border-b flex-shrink-0 flex-wrap"
            style={{ background: '#07070f', borderColor: 'hsl(240 20% 14%)' }}
          >
            <Link to="/dashboard" className="flex items-center gap-1.5 font-mono text-sm text-muted-foreground hover:text-foreground transition-colors flex-shrink-0">
              <ArrowLeft size={16} /> Back
            </Link>

            <div className="flex-1 min-w-0">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Untitled Note"
                className="w-full bg-transparent font-serif italic text-xl text-foreground placeholder:text-muted-foreground/50 outline-none"
              />
            </div>

            {/* Tags */}
            <div className="relative flex items-center gap-2 flex-shrink-0">
              <div className="flex flex-wrap gap-1.5">
                {selectedTags.slice(0, 3).map((tag) => (
                  <span
                    key={tag.id}
                    className="flex items-center gap-1 px-2 py-1 rounded-full font-mono text-xs"
                    style={{ background: tag.color + '22', color: tag.color }}
                  >
                    #{tag.name}
                    <button onClick={() => setSelectedTags(prev => prev.filter(t => t.id !== tag.id))}>
                      <X size={10} />
                    </button>
                  </span>
                ))}
              </div>
              <button
                onClick={() => setShowTagPicker(!showTagPicker)}
                className="flex items-center gap-1 px-2 py-1 rounded-full font-mono text-xs text-muted-foreground border border-dashed hover:border-primary/50 transition-colors"
                style={{ borderColor: 'hsl(240 20% 14%)' }}
              >
                <Tag size={12} /> Tag
              </button>

              {showTagPicker && (
                <div
                  className="absolute right-0 top-10 z-30 rounded-xl p-3 w-52 shadow-xl"
                  style={{ background: '#0d0d1a', border: '1px solid hsl(240 20% 18%)' }}
                >
                  <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-3">Add Tags</p>
                  <div className="flex flex-wrap gap-1.5">
                    {MOCK_TAGS.map((tag) => {
                      const isSelected = selectedTags.some(t => t.id === tag.id);
                      return (
                        <button
                          key={tag.id}
                          onClick={() => {
                            setSelectedTags(prev =>
                              isSelected ? prev.filter(t => t.id !== tag.id) : [...prev, tag]
                            );
                          }}
                          className="px-2.5 py-1 rounded-full font-mono text-xs transition-all"
                          style={{
                            background: isSelected ? tag.color + '33' : tag.color + '11',
                            color: tag.color,
                            border: `1px solid ${isSelected ? tag.color + '66' : tag.color + '22'}`,
                          }}
                        >
                          #{tag.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => setFocusMode(!focusMode)}
                className="px-3 py-1.5 rounded-lg font-mono text-xs text-muted-foreground hover:text-foreground transition-colors border"
                style={{ borderColor: 'hsl(240 20% 14%)' }}
              >
                <Focus size={14} />
              </button>

              <button
                onClick={() => setShowAIPanel(!showAIPanel)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-xs font-semibold transition-all"
                style={{
                  background: showAIPanel ? 'hsl(263 69% 58% / 0.2)' : 'hsl(263 69% 58% / 0.1)',
                  color: '#a78bfa',
                  border: '1px solid hsl(263 69% 58% / 0.3)',
                }}
              >
                <Sparkles size={12} /> AI ✦
              </button>

              <button
                onClick={handleSave}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg font-mono text-xs font-semibold relative overflow-hidden btn-shimmer"
                style={{
                  background: saved ? '#22c55e22' : 'linear-gradient(135deg, #7c3aed, #6d28d9)',
                  color: saved ? '#22c55e' : '#f1f5f9',
                }}
              >
                <Save size={12} /> {saved ? 'Saved ✓' : 'Save'}
              </button>

              <button className="p-2 rounded-lg text-muted-foreground hover:text-foreground transition-colors">
                <Share2 size={16} />
              </button>
            </div>
          </div>

          {/* Editor content area */}
          <div className="flex-1 overflow-y-auto">
            <div className={`max-w-3xl mx-auto px-6 lg:px-12 py-12 ${focusMode ? 'py-24' : ''}`}>
              {editor && (
                <EditorContent editor={editor} />
              )}
            </div>
          </div>

          {/* Status bar */}
          <div
            className="flex items-center justify-between px-6 py-2 border-t flex-shrink-0"
            style={{ background: '#07070f', borderColor: 'hsl(240 20% 14%)' }}
          >
            <div className="flex items-center gap-4">
              <span className="font-mono text-xs text-muted-foreground">{wordCount} words</span>
              <span className="font-mono text-xs text-muted-foreground">~{Math.ceil(wordCount / 200)} min read</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs text-muted-foreground flex items-center gap-1">
                <Clock size={11} /> Saved just now
              </span>
              <span className="font-mono text-xs text-muted-foreground">Version 12 · History →</span>
            </div>
          </div>
        </div>

        {/* AI Panel */}
        <AnimatePresence>
          {showAIPanel && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 380, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="flex-shrink-0 flex flex-col overflow-hidden border-l"
              style={{ background: '#07070f', borderColor: 'hsl(240 20% 14%)' }}
            >
              <div className="flex items-center justify-between px-4 py-3 border-b flex-shrink-0" style={{ borderColor: 'hsl(240 20% 14%)' }}>
                <div className="flex items-center gap-2">
                  <Sparkles size={14} className="text-primary-light" />
                  <span className="font-mono text-sm font-semibold text-foreground">AI Assistant</span>
                </div>
                <div className="flex items-center gap-2">
                  {chat.length > 0 && (
                    <button
                      onClick={() => setChat([])}
                      className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground"
                    >
                      Clear
                    </button>
                  )}
                  <button onClick={() => setShowAIPanel(false)} className="text-muted-foreground hover:text-foreground">
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* Quick actions */}
              <div className="px-4 pt-3 pb-2 flex-shrink-0">
                <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Quick Actions</p>
                <div className="flex flex-wrap gap-1.5">
                  {AI_PROMPTS.map((p) => (
                    <button
                      key={p.label}
                      onClick={() => runAI(p.label)}
                      disabled={aiLoading}
                      className="flex items-center gap-1 px-2 py-1 rounded-lg font-mono text-[11px] transition-all hover:translate-y-[-1px] disabled:opacity-50"
                      style={{ background: p.color + '15', color: p.color, border: `1px solid ${p.color}33` }}
                    >
                      <span>{p.icon}</span> {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Chat scroll */}
              <div ref={chatScrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                {chat.length === 0 && !aiLoading && (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-3">✦</div>
                    <p className="font-mono text-sm text-muted-foreground">
                      Ask me about your notes, research a topic, or upload an image / document to analyze.
                    </p>
                  </div>
                )}

                {chat.map((m) => (
                  <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className="max-w-[92%] rounded-xl p-3 space-y-2"
                      style={{
                        background: m.role === 'user' ? 'hsl(263 69% 58% / 0.12)' : 'hsl(240 50% 7%)',
                        border: `1px solid ${m.role === 'user' ? 'hsl(263 69% 58% / 0.25)' : 'hsl(240 20% 14%)'}`,
                      }}
                    >
                      {m.attachments && m.attachments.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {m.attachments.map((a, i) =>
                            a.kind === 'image' ? (
                              <img key={i} src={a.dataUrl} alt={a.name} className="w-20 h-20 object-cover rounded-lg" />
                            ) : (
                              <div key={i} className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/5 font-mono text-[11px] text-muted-foreground">
                                <FileText size={12} /> {a.name}
                              </div>
                            ),
                          )}
                        </div>
                      )}
                      {m.content && (
                        m.role === 'assistant' ? (
                          <ChatMarkdown content={m.content} color="assistant" />
                        ) : (
                          <p className="font-mono text-[13px] text-foreground whitespace-pre-wrap leading-relaxed">
                            {m.content}
                          </p>
                        )
                      )}
                      {m.role === 'assistant' && !m.content && aiLoading && (
                        <div className="flex items-center gap-2 text-muted-foreground font-mono text-xs">
                          <Loader2 size={12} className="animate-spin" /> Thinking...
                        </div>
                      )}
                      {m.role === 'assistant' && m.content && (
                        <div className="flex gap-1 pt-1">
                          <button
                            onClick={() => navigator.clipboard?.writeText(m.content)}
                            className="px-2 py-0.5 rounded font-mono text-[10px] text-muted-foreground hover:text-foreground hover:bg-white/5"
                          >
                            <Copy size={10} className="inline mr-1" /> Copy
                          </button>
                          <button
                            onClick={() => editor?.chain().focus().insertContent(m.content).run()}
                            className="px-2 py-0.5 rounded font-mono text-[10px] text-primary hover:bg-white/5"
                          >
                            Insert into note
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Composer */}
              <div className="border-t p-3 flex-shrink-0 space-y-2" style={{ borderColor: 'hsl(240 20% 14%)' }}>
                {chatAttachments.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {chatAttachments.map((a, i) => (
                      <div key={i} className="relative">
                        {a.kind === 'image' ? (
                          <img src={a.dataUrl} alt={a.name} className="w-12 h-12 object-cover rounded-lg" />
                        ) : (
                          <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-white/5">
                            <FileText size={16} className="text-muted-foreground" />
                          </div>
                        )}
                        <button
                          onClick={() => setChatAttachments((prev) => prev.filter((_, j) => j !== i))}
                          className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-black/80 flex items-center justify-center text-white"
                        >
                          <X size={10} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex items-end gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,application/pdf,.txt,.md,.csv,.json"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      onPickFiles(e.target.files);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5"
                    title="Attach image or file"
                  >
                    <Paperclip size={16} />
                  </button>
                  <textarea
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendChat();
                      }
                    }}
                    rows={1}
                    placeholder="Ask anything about your notes or a topic..."
                    className="flex-1 resize-none bg-transparent font-mono text-[13px] text-foreground placeholder:text-muted-foreground outline-none max-h-32 rounded-lg px-2 py-2"
                    style={{ background: 'hsl(240 50% 7%)', border: '1px solid hsl(240 20% 14%)' }}
                  />
                  <button
                    onClick={() => sendChat()}
                    disabled={aiLoading || (!chatInput.trim() && chatAttachments.length === 0)}
                    className="p-2 rounded-lg disabled:opacity-40 transition"
                    style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', color: '#f1f5f9' }}
                  >
                    {aiLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AppLayout>
  );
}