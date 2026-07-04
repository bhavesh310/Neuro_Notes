import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AppLayout from '@/components/AppLayout';
import { FolderPlus, Folder, Trash2, X, Search } from 'lucide-react';
import { useStoredNotes } from '@/lib/notesStore';

type Collection = {
  id: string;
  name: string;
  color: string;
  noteIds: string[];
  createdAt: string;
};

const KEY = 'neuronotes_collections';
const PALETTE = ['#7c3aed', '#06b6d4', '#22c55e', '#f59e0b', '#ec4899', '#3b82f6'];

function loadCollections(): Collection[] {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
function saveCollections(list: Collection[]) {
  localStorage.setItem(KEY, JSON.stringify(list));
  window.dispatchEvent(new Event('neuronotes:collections-changed'));
}

export default function Collections() {
  const notes = useStoredNotes();
  const [collections, setCollections] = useState<Collection[]>(() => loadCollections());
  const [search, setSearch] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState('');
  const [active, setActive] = useState<Collection | null>(null);

  useEffect(() => {
    const sync = () => setCollections(loadCollections());
    window.addEventListener('neuronotes:collections-changed', sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('neuronotes:collections-changed', sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  const filtered = useMemo(
    () => collections.filter((c) => c.name.toLowerCase().includes(search.toLowerCase())),
    [collections, search],
  );

  const create = () => {
    const name = newName.trim();
    if (!name) return;
    const next: Collection = {
      id: `c_${Date.now()}`,
      name,
      color: PALETTE[collections.length % PALETTE.length],
      noteIds: [],
      createdAt: new Date().toISOString(),
    };
    const updated = [next, ...collections];
    setCollections(updated);
    saveCollections(updated);
    setNewName('');
    setShowNew(false);
  };

  const remove = (id: string) => {
    const updated = collections.filter((c) => c.id !== id);
    setCollections(updated);
    saveCollections(updated);
    if (active?.id === id) setActive(null);
  };

  const toggleNote = (colId: string, noteId: string) => {
    const updated = collections.map((c) => {
      if (c.id !== colId) return c;
      const has = c.noteIds.includes(noteId);
      return { ...c, noteIds: has ? c.noteIds.filter((n) => n !== noteId) : [...c.noteIds, noteId] };
    });
    setCollections(updated);
    saveCollections(updated);
    const newActive = updated.find((c) => c.id === colId) ?? null;
    setActive(newActive);
  };

  const activeNotes = active ? notes.filter((n) => active.noteIds.includes(n.id)) : [];

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto px-4 lg:px-8 py-8 space-y-6">
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-serif italic text-foreground">Collections</h1>
            <p className="font-mono text-sm text-muted-foreground mt-1">
              {filtered.length} {filtered.length === 1 ? 'collection' : 'collections'}
            </p>
          </div>
          <button
            onClick={() => setShowNew(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl font-mono text-sm font-semibold"
            style={{
              background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
              color: '#f1f5f9',
              boxShadow: '0 2px 16px hsl(263 69% 58% / 0.25)',
            }}
          >
            <FolderPlus size={16} />
            New Collection
          </button>
        </motion.div>

        {collections.length > 0 && (
          <div
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl"
            style={{ background: '#07070f', border: '1px solid hsl(240 20% 14%)' }}
          >
            <Search size={14} className="text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search collections…"
              className="flex-1 bg-transparent font-mono text-sm text-foreground placeholder:text-muted-foreground outline-none"
            />
          </div>
        )}

        {filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-24 gap-4 text-center"
          >
            <div className="text-5xl mb-2">📁</div>
            <h2 className="font-serif italic text-xl text-foreground">
              {search ? 'No collections match your search' : 'No collections yet'}
            </h2>
            <p className="font-mono text-sm text-muted-foreground max-w-xs">
              {search ? 'Try a different keyword.' : 'Organize your notes into collections for easier access.'}
            </p>
            {!search && (
              <button
                onClick={() => setShowNew(true)}
                className="mt-2 px-5 py-2.5 rounded-xl font-mono text-sm font-semibold"
                style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', color: '#f1f5f9' }}
              >
                + Create First Collection
              </button>
            )}
          </motion.div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((collection, i) => (
              <motion.div
                key={collection.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => setActive(collection)}
                className="p-5 rounded-2xl flex flex-col gap-3 cursor-pointer group transition-all relative"
                style={{ background: '#07070f', border: '1px solid hsl(240 20% 14%)' }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = collection.color + '55';
                  (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 32px ${collection.color}18`;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = 'hsl(240 20% 14%)';
                  (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                }}
              >
                <div className="flex items-center gap-3">
                  <Folder size={20} style={{ color: collection.color }} />
                  <h3 className="font-serif italic font-semibold text-foreground flex-1 truncate">{collection.name}</h3>
                  <button
                    onClick={(e) => { e.stopPropagation(); remove(collection.id); }}
                    aria-label="Delete collection"
                    className="opacity-0 group-hover:opacity-100 p-1 rounded-lg text-muted-foreground hover:text-foreground transition-opacity"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <p className="font-mono text-xs text-muted-foreground">
                  {collection.noteIds.length} {collection.noteIds.length === 1 ? 'note' : 'notes'}
                </p>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* New collection modal */}
      <AnimatePresence>
        {showNew && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowNew(false)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.6)' }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-2xl p-6 space-y-4"
              style={{ background: '#07070f', border: '1px solid hsl(240 20% 18%)' }}
            >
              <h3 className="font-serif italic text-xl text-foreground">New Collection</h3>
              <input
                autoFocus
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && create()}
                placeholder="Collection name"
                className="w-full px-4 py-2.5 rounded-xl bg-transparent font-mono text-sm text-foreground outline-none"
                style={{ border: '1px solid hsl(240 20% 18%)' }}
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => setShowNew(false)}
                  className="px-4 py-2 rounded-xl font-mono text-xs text-muted-foreground hover:text-foreground"
                >
                  Cancel
                </button>
                <button
                  onClick={create}
                  disabled={!newName.trim()}
                  className="px-4 py-2 rounded-xl font-mono text-xs font-semibold disabled:opacity-40"
                  style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', color: '#f1f5f9' }}
                >
                  Create
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Collection detail drawer */}
      <AnimatePresence>
        {active && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setActive(null)}
            className="fixed inset-0 z-50 flex justify-end"
            style={{ background: 'rgba(0,0,0,0.6)' }}
          >
            <motion.div
              initial={{ x: 400 }} animate={{ x: 0 }} exit={{ x: 400 }}
              transition={{ type: 'spring', damping: 28, stiffness: 240 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md h-full overflow-y-auto p-6 space-y-5"
              style={{ background: '#07070f', borderLeft: '1px solid hsl(240 20% 14%)' }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <Folder size={20} style={{ color: active.color }} />
                  <h2 className="font-serif italic text-xl text-foreground truncate">{active.name}</h2>
                </div>
                <button onClick={() => setActive(null)} className="text-muted-foreground hover:text-foreground">
                  <X size={18} />
                </button>
              </div>

              <p className="font-mono text-xs text-muted-foreground">
                {active.noteIds.length} of {notes.length} notes included
              </p>

              {notes.length === 0 ? (
                <p className="font-mono text-xs text-muted-foreground">
                  Create some notes first, then add them to this collection.
                </p>
              ) : (
                <>
                  <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">In this collection</p>
                  <div className="space-y-1.5">
                    {activeNotes.length === 0 && (
                      <p className="font-mono text-xs text-muted-foreground italic">None yet.</p>
                    )}
                    {activeNotes.map((n) => (
                      <div
                        key={n.id}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg"
                        style={{ background: active.color + '11', border: `1px solid ${active.color}33` }}
                      >
                        <span className="flex-1 font-mono text-xs text-foreground truncate">{n.title || 'Untitled'}</span>
                        <button
                          onClick={() => toggleNote(active.id, n.id)}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>

                  <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground pt-2">Available notes</p>
                  <div className="space-y-1.5">
                    {notes.filter((n) => !active.noteIds.includes(n.id)).map((n) => (
                      <button
                        key={n.id}
                        onClick={() => toggleNote(active.id, n.id)}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/5 text-left"
                        style={{ border: '1px solid hsl(240 20% 14%)' }}
                      >
                        <span className="flex-1 font-mono text-xs text-muted-foreground truncate">{n.title || 'Untitled'}</span>
                        <span className="font-mono text-[10px] text-muted-foreground">+ Add</span>
                      </button>
                    ))}
                  </div>
                </>
              )}

              <button
                onClick={() => remove(active.id)}
                className="w-full mt-4 flex items-center justify-center gap-2 py-2.5 rounded-xl font-mono text-xs"
                style={{ background: 'hsl(263 69% 58% / 0.1)', color: '#a78bfa', border: '1px solid hsl(263 69% 58% / 0.3)' }}
              >
                <Trash2 size={13} /> Delete collection
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AppLayout>
  );
}
