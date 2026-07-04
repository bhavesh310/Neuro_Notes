import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import AppLayout from '@/components/AppLayout';
import { useStoredNotes, type StoredNote } from '@/lib/notesStore';
import { Plus, Search, Tag as TagIcon, FileText } from 'lucide-react';

const PALETTE = ['#7c3aed', '#06b6d4', '#f59e0b', '#22c55e', '#ef4444', '#a78bfa', '#f97316', '#3b82f6', '#ec4899', '#14b8a6'];

function colorFor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return PALETTE[h % PALETTE.length];
}

type DerivedTag = { name: string; color: string; count: number };

function extractTags(notes: StoredNote[]): DerivedTag[] {
  const counts = new Map<string, number>();
  for (const n of notes) {
    const explicit = (n.tags ?? []).map((t) => t.replace(/^#/, '').trim().toLowerCase()).filter(Boolean);
    const inline = ((n.content ?? '') + ' ' + (n.title ?? '')).match(/#([a-zA-Z0-9_-]{2,})/g)?.map((t) => t.slice(1).toLowerCase()) ?? [];
    const all = new Set([...explicit, ...inline]);
    for (const t of all) counts.set(t, (counts.get(t) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([name, count]) => ({ name, count, color: colorFor(name) }))
    .sort((a, b) => b.count - a.count);
}

function noteHasTag(note: StoredNote, tagName: string): boolean {
  const t = tagName.toLowerCase();
  if ((note.tags ?? []).some((x) => x.replace(/^#/, '').trim().toLowerCase() === t)) return true;
  const haystack = ((note.content ?? '') + ' ' + (note.title ?? '')).toLowerCase();
  return new RegExp(`#${t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`).test(haystack);
}

function previewOf(n: StoredNote): string {
  return (n.content ?? '').replace(/\s+/g, ' ').trim().slice(0, 140) || 'Empty note';
}

const NOTES_KEY = 'neuronotes_notes';

function addTagToFirstNote(name: string) {
  try {
    const raw = localStorage.getItem(NOTES_KEY);
    const notes: StoredNote[] = raw ? JSON.parse(raw) : [];
    if (!notes.length) {
      const id = Date.now().toString();
      notes.push({
        id,
        title: `#${name}`,
        content: `#${name} `,
        tags: [name],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    } else {
      const target = notes[0];
      target.tags = Array.from(new Set([...(target.tags ?? []), name]));
      target.updatedAt = new Date().toISOString();
    }
    localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
    window.dispatchEvent(new Event('neuronotes:notes-changed'));
  } catch {}
}

export default function TagExplorer() {
  const notes = useStoredNotes();
  const [selected, setSelected] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const tags = useMemo(() => extractTags(notes), [notes]);
  const filteredTags = useMemo(
    () => tags.filter((t) => t.name.toLowerCase().includes(search.toLowerCase())),
    [tags, search],
  );
  const filteredNotes = useMemo(
    () => (selected ? notes.filter((n) => noteHasTag(n, selected)) : notes),
    [notes, selected],
  );

  const handleNewTag = () => {
    const name = window.prompt('New tag name')?.trim().replace(/^#/, '').toLowerCase();
    if (!name) return;
    addTagToFirstNote(name);
    setSelected(name);
  };

  const selectedColor = selected ? colorFor(selected) : '#7c3aed';

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8 space-y-10">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-serif italic text-foreground">Tag Explorer</h1>
            <p className="font-mono text-sm text-muted-foreground mt-1">
              {tags.length} {tags.length === 1 ? 'tag' : 'tags'} · {notes.length} {notes.length === 1 ? 'note' : 'notes'}
            </p>
          </div>
          <button
            onClick={handleNewTag}
            className="flex items-center gap-2 px-4 py-2 rounded-xl font-mono text-sm font-semibold btn-shimmer"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', color: '#f1f5f9' }}
          >
            <Plus size={16} /> New Tag
          </button>
        </motion.div>

        {/* Search */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div
            className="flex items-center gap-3 px-4 py-3 rounded-xl max-w-sm"
            style={{ background: '#07070f', border: '1px solid hsl(240 20% 14%)' }}
          >
            <Search size={16} className="text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tags..."
              className="bg-transparent font-mono text-sm text-foreground placeholder:text-muted-foreground/50 outline-none flex-1"
            />
          </div>
        </motion.div>

        {/* Tag Cloud */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl p-6 space-y-4"
          style={{ background: '#07070f', border: '1px solid hsl(240 20% 14%)' }}
        >
          <h2 className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Tag Cloud</h2>
          {filteredTags.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
              <TagIcon size={32} className="text-muted-foreground/40" />
              <p className="font-mono text-sm text-muted-foreground">
                {tags.length === 0
                  ? 'No tags yet. Add #hashtags to your notes or create one above.'
                  : 'No tags match your search.'}
              </p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-3 items-center">
              {filteredTags.map((tag) => {
                const active = selected === tag.name;
                const sizeIdx = Math.min(3, Math.floor(tag.count / 3));
                const sizeClass = ['text-xs', 'text-sm', 'text-base', 'text-lg'][sizeIdx];
                return (
                  <button
                    key={tag.name}
                    onClick={() => setSelected(active ? null : tag.name)}
                    className={`px-4 py-2 rounded-full font-mono font-medium transition-all duration-200 hover:translate-y-[-2px] ${sizeClass}`}
                    style={{
                      background: active ? tag.color + '33' : tag.color + '15',
                      color: tag.color,
                      border: `1px solid ${active ? tag.color + '66' : tag.color + '22'}`,
                      boxShadow: active ? `0 4px 16px ${tag.color}33` : 'none',
                    }}
                  >
                    #{tag.name}
                    <span className="ml-2 opacity-70 text-xs">{tag.count}</span>
                  </button>
                );
              })}
            </div>
          )}
          {selected && (
            <button
              onClick={() => setSelected(null)}
              className="font-mono text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Clear filter ×
            </button>
          )}
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Top tags list */}
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-2xl p-4"
            style={{ background: '#07070f', border: '1px solid hsl(240 20% 14%)' }}
          >
            <h2 className="font-mono text-xs uppercase tracking-widest text-muted-foreground px-3 mb-4">Top Tags</h2>
            {tags.length === 0 ? (
              <p className="px-3 font-mono text-xs text-muted-foreground">Your tag hierarchy builds itself as you write.</p>
            ) : (
              <div className="space-y-1">
                {tags.slice(0, 12).map((t) => {
                  const active = selected === t.name;
                  return (
                    <button
                      key={t.name}
                      onClick={() => setSelected(active ? null : t.name)}
                      className="w-full flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-white/5 transition-colors"
                      style={{ background: active ? t.color + '12' : 'transparent' }}
                    >
                      <span className="w-2 h-2 rounded-full" style={{ background: t.color }} />
                      <span className="font-mono text-sm text-foreground flex-1 text-left truncate">#{t.name}</span>
                      <span className="font-mono text-xs text-muted-foreground">{t.count}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </motion.div>

          {/* Notes list */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="font-serif italic text-xl text-foreground">
              {selected ? (
                <>
                  Notes tagged{' '}
                  <span style={{ color: selectedColor }}>#{selected}</span>
                </>
              ) : (
                'All Notes'
              )}
              <span className="font-mono text-sm text-muted-foreground ml-2 not-italic">({filteredNotes.length})</span>
            </h2>

            {filteredNotes.length === 0 ? (
              <div
                className="flex flex-col items-center justify-center gap-3 py-16 rounded-2xl text-center"
                style={{ background: '#07070f', border: '1px dashed hsl(240 20% 14%)' }}
              >
                <FileText size={32} className="text-muted-foreground/40" />
                <p className="font-mono text-sm text-muted-foreground">
                  {selected ? `No notes carry #${selected} yet.` : 'No notes yet. Create one to start exploring.'}
                </p>
                <Link
                  to="/editor/new"
                  className="px-4 py-2 rounded-xl font-mono text-xs font-semibold"
                  style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', color: '#f1f5f9' }}
                >
                  + New Note
                </Link>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                {filteredNotes.map((note, i) => {
                  const noteTags = Array.from(
                    new Set([
                      ...((note.tags ?? []).map((t) => t.replace(/^#/, '').toLowerCase())),
                      ...((((note.content ?? '') + ' ' + (note.title ?? '')).match(/#([a-zA-Z0-9_-]{2,})/g) ?? []).map((t) => t.slice(1).toLowerCase())),
                    ]),
                  );
                  return (
                    <motion.div
                      key={note.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                    >
                      <Link
                        to={`/editor/${note.id}`}
                        className="block note-card rounded-2xl p-4 space-y-3 cursor-pointer"
                        style={{ background: '#07070f', border: '1px solid hsl(240 20% 14%)' }}
                      >
                        <h3 className="font-serif italic font-semibold text-foreground text-sm leading-snug">
                          {note.title || 'Untitled'}
                        </h3>
                        <p className="font-mono text-xs text-muted-foreground line-clamp-2">{previewOf(note)}</p>
                        {noteTags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {noteTags.slice(0, 4).map((tn) => {
                              const c = colorFor(tn);
                              return (
                                <span
                                  key={tn}
                                  className="px-2 py-0.5 rounded-full font-mono text-xs"
                                  style={{ background: c + '22', color: c }}
                                >
                                  #{tn}
                                </span>
                              );
                            })}
                          </div>
                        )}
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
