import { useState, useMemo, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import AppLayout from '@/components/AppLayout';
import { MOCK_NOTES, MOCK_TAGS, type Note, type Tag } from '@/lib/types';
import { getStoredUser } from '@/lib/auth';
import { generateNoteDNA } from '@/lib/types';
import { useStoredNotes, deleteNote, type StoredNote } from '@/lib/notesStore';
import { Search, SlidersHorizontal, Grid, List, Share2, Pencil, Trash2, MoreHorizontal, X } from 'lucide-react';

function toNote(s: StoredNote): Note {
  const tags: Tag[] = (s.tags || []).map((name) => {
    const m = MOCK_TAGS.find((t) => t.name.toLowerCase() === String(name).toLowerCase());
    return m || { id: `t_${name}`, name: String(name), color: '#7c3aed' };
  });
  const text = (s.content || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  const created = s.createdAt ? new Date(s.createdAt) : new Date();
  const updated = s.updatedAt ? new Date(s.updatedAt) : created;
  return {
    id: s.id,
    title: s.title || 'Untitled',
    content: s.content || '',
    preview: text.slice(0, 160),
    tags,
    isPublic: false,
    slug: s.id,
    wordCount: text ? text.split(/\s+/).filter(Boolean).length : 0,
    createdAt: created,
    updatedAt: updated,
  };
}

function NoteRow({ note, delay = 0 }: { note: typeof MOCK_NOTES[0]; delay?: number }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const dna = generateNoteDNA(note);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      className="flex items-center gap-4 px-5 py-4 rounded-2xl group relative cursor-pointer transition-all"
      style={{
        background: '#07070f',
        border: '1px solid hsl(240 20% 14%)',
      }}
      onMouseEnter={(e) => {
        const color = note.tags[0]?.color || '#7c3aed';
        (e.currentTarget as HTMLElement).style.borderColor = color + '55';
        (e.currentTarget as HTMLElement).style.boxShadow = `0 4px 24px ${color}18`;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = 'hsl(240 20% 14%)';
        (e.currentTarget as HTMLElement).style.boxShadow = 'none';
      }}
    >
      <div
        className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 opacity-70 group-hover:opacity-100 transition-opacity"
        dangerouslySetInnerHTML={{ __html: dna }}
      />
      <Link to={`/editor/${note.id}`} className="flex-1 min-w-0">
        <p className="font-serif italic font-semibold text-foreground truncate">{note.title}</p>
        <p className="font-mono text-xs text-muted-foreground truncate mt-0.5">{note.preview}</p>
      </Link>
      <div className="hidden sm:flex flex-wrap gap-1.5 flex-shrink-0 max-w-xs">
        {note.tags.slice(0, 2).map((tag) => (
          <span
            key={tag.id}
            className="px-2 py-0.5 rounded-full font-mono text-xs"
            style={{ background: tag.color + '22', color: tag.color, border: `1px solid ${tag.color}44` }}
          >
            #{tag.name}
          </span>
        ))}
      </div>
      <span className="hidden md:block font-mono text-xs text-muted-foreground flex-shrink-0 w-20 text-right">
        {note.updatedAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
      </span>
      <span className="hidden lg:block font-mono text-xs text-muted-foreground flex-shrink-0 w-20 text-right">
        {note.wordCount} words
      </span>
      <div className="relative flex-shrink-0">
        <button
          onClick={(e) => { e.preventDefault(); setMenuOpen(!menuOpen); }}
          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-all"
        >
          <MoreHorizontal size={16} />
        </button>
        {menuOpen && (
          <div
            className="absolute right-0 top-8 z-30 rounded-xl py-1 w-36 shadow-xl"
            style={{ background: '#0d0d1a', border: '1px solid hsl(240 20% 18%)' }}
          >
            <Link to={`/editor/${note.id}`} className="flex items-center gap-2 px-3 py-2 text-sm font-mono text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors">
              <Pencil size={13} /> Edit
            </Link>
            <button
              onClick={(e) => {
                e.preventDefault();
                navigator.clipboard?.writeText(`${window.location.origin}/share/${note.id}`).catch(() => {});
                setMenuOpen(false);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm font-mono text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
            >
              <Share2 size={13} /> Share
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                if (window.confirm(`Delete "${note.title}"? This cannot be undone.`)) {
                  deleteNote(note.id);
                }
                setMenuOpen(false);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm font-mono text-red-500/80 hover:text-red-500 hover:bg-white/5 transition-colors"
            >
              <Trash2 size={13} /> Delete
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

type SortOption = 'updated' | 'created' | 'title' | 'words';

export default function AllNotes() {
  const user = getStoredUser();
  const location = useLocation();
  const [view, setView] = useState<'list' | 'grid'>('list');
  const [search, setSearch] = useState('');

  // Filter dropdown state
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>('updated');
  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = new URLSearchParams(location.search).get('q') || '';
    setSearch(q);
  }, [location.search]);

  // Close filter dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setFilterOpen(false);
      }
    }
    if (filterOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [filterOpen]);

  const stored = useStoredNotes();
  const notes = useMemo(() => stored.map(toNote), [stored]);

  // All tags available across current notes (so the filter list is always relevant)
  const availableTags = useMemo(() => {
    const map = new Map<string, Tag>();
    notes.forEach((n) => n.tags.forEach((t) => map.set(t.name, t)));
    return Array.from(map.values());
  }, [notes]);

  const q = search.trim().toLowerCase();

  const filtered = useMemo(() => {
    let result = !q
      ? notes
      : notes.filter((n) =>
          n.title.toLowerCase().includes(q) ||
          n.preview.toLowerCase().includes(q) ||
          n.content.toLowerCase().includes(q) ||
          n.tags.some((t) => t.name.toLowerCase().includes(q))
        );

    if (selectedTags.length > 0) {
      result = result.filter((n) =>
        n.tags.some((t) => selectedTags.includes(t.name))
      );
    }

    result = [...result].sort((a, b) => {
      switch (sortBy) {
        case 'updated':
          return b.updatedAt.getTime() - a.updatedAt.getTime();
        case 'created':
          return b.createdAt.getTime() - a.createdAt.getTime();
        case 'title':
          return a.title.localeCompare(b.title);
        case 'words':
          return b.wordCount - a.wordCount;
        default:
          return 0;
      }
    });

    return result;
  }, [notes, q, selectedTags, sortBy]);

  const toggleTag = (name: string) => {
    setSelectedTags((prev) =>
      prev.includes(name) ? prev.filter((t) => t !== name) : [...prev, name]
    );
  };

  const clearFilters = () => {
    setSelectedTags([]);
    setSortBy('updated');
  };

  const activeFilterCount = selectedTags.length + (sortBy !== 'updated' ? 1 : 0);

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto px-4 lg:px-8 py-8 space-y-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-serif italic text-foreground">All Notes</h1>
            <p className="font-mono text-sm text-muted-foreground mt-1">
              {filtered.length} {filtered.length === 1 ? 'note' : 'notes'}
            </p>
          </div>
          <Link
            to="/editor/new"
            className="flex items-center gap-2 px-4 py-2 rounded-xl font-mono text-sm font-semibold"
            style={{
              background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
              color: '#f1f5f9',
              boxShadow: '0 2px 16px hsl(263 69% 58% / 0.25)',
            }}
          >
            + New Note
          </Link>
        </motion.div>

        {/* Toolbar */}
        <div className="flex items-center gap-3">
          <div
            className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl"
            style={{ background: '#07070f', border: '1px solid hsl(240 20% 14%)' }}
          >
            <Search size={14} className="text-muted-foreground flex-shrink-0" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search notes..."
              className="flex-1 bg-transparent font-mono text-sm text-foreground placeholder:text-muted-foreground outline-none"
            />
          </div>

          {/* Filter button + dropdown */}
          <div className="relative" ref={filterRef}>
            <button
              onClick={() => setFilterOpen((v) => !v)}
              className="relative p-2.5 rounded-xl text-muted-foreground hover:text-foreground transition-colors"
              style={{
                background: filterOpen || activeFilterCount > 0 ? 'hsl(263 69% 58% / 0.15)' : '#07070f',
                border: '1px solid hsl(240 20% 14%)',
                color: filterOpen || activeFilterCount > 0 ? '#a78bfa' : undefined,
              }}
            >
              <SlidersHorizontal size={16} />
              {activeFilterCount > 0 && (
                <span
                  className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-mono"
                  style={{ background: '#7c3aed', color: '#fff' }}
                >
                  {activeFilterCount}
                </span>
              )}
            </button>

            {filterOpen && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-12 z-40 w-64 rounded-2xl p-4 shadow-2xl space-y-4"
                style={{ background: '#0d0d1a', border: '1px solid hsl(240 20% 18%)' }}
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-mono text-xs font-semibold text-foreground uppercase tracking-wide">
                    Filters
                  </h3>
                  {activeFilterCount > 0 && (
                    <button
                      onClick={clearFilters}
                      className="flex items-center gap-1 font-mono text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <X size={12} /> Clear
                    </button>
                  )}
                </div>

                {/* Sort */}
                <div className="space-y-1.5">
                  <p className="font-mono text-[11px] text-muted-foreground uppercase tracking-wide">Sort by</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {([
                      { key: 'updated', label: 'Updated' },
                      { key: 'created', label: 'Created' },
                      { key: 'title', label: 'Title' },
                      { key: 'words', label: 'Word count' },
                    ] as { key: SortOption; label: string }[]).map((opt) => (
                      <button
                        key={opt.key}
                        onClick={() => setSortBy(opt.key)}
                        className="px-2.5 py-1.5 rounded-lg font-mono text-xs transition-colors text-left"
                        style={{
                          background: sortBy === opt.key ? 'hsl(263 69% 58% / 0.15)' : 'transparent',
                          color: sortBy === opt.key ? '#a78bfa' : '#94a3b8',
                          border: `1px solid ${sortBy === opt.key ? 'hsl(263 69% 58% / 0.3)' : 'hsl(240 20% 16%)'}`,
                        }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tags */}
                <div className="space-y-1.5">
                  <p className="font-mono text-[11px] text-muted-foreground uppercase tracking-wide">Tags</p>
                  {availableTags.length === 0 ? (
                    <p className="font-mono text-xs text-muted-foreground italic">No tags yet</p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto">
                      {availableTags.map((tag) => {
                        const active = selectedTags.includes(tag.name);
                        return (
                          <button
                            key={tag.id}
                            onClick={() => toggleTag(tag.name)}
                            className="px-2.5 py-1 rounded-full font-mono text-xs transition-all"
                            style={{
                              background: active ? tag.color + '33' : tag.color + '15',
                              color: tag.color,
                              border: `1px solid ${tag.color}${active ? '99' : '33'}`,
                            }}
                          >
                            #{tag.name}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </div>

          {/* View toggle */}
          <div
            className="flex rounded-xl overflow-hidden"
            style={{ border: '1px solid hsl(240 20% 14%)' }}
          >
            <button
              onClick={() => setView('list')}
              className="p-2.5 transition-colors"
              style={{ background: view === 'list' ? 'hsl(263 69% 58% / 0.15)' : '#07070f', color: view === 'list' ? '#a78bfa' : '#475569' }}
            >
              <List size={16} />
            </button>
            <button
              onClick={() => setView('grid')}
              className="p-2.5 transition-colors"
              style={{ background: view === 'grid' ? 'hsl(263 69% 58% / 0.15)' : '#07070f', color: view === 'grid' ? '#a78bfa' : '#475569' }}
            >
              <Grid size={16} />
            </button>
          </div>
        </div>

        {/* Active filter chips */}
        {selectedTags.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            {selectedTags.map((name) => {
              const tag = availableTags.find((t) => t.name === name);
              return (
                <button
                  key={name}
                  onClick={() => toggleTag(name)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-full font-mono text-xs"
                  style={{
                    background: (tag?.color || '#7c3aed') + '22',
                    color: tag?.color || '#7c3aed',
                    border: `1px solid ${(tag?.color || '#7c3aed')}44`,
                  }}
                >
                  #{name} <X size={11} />
                </button>
              );
            })}
          </div>
        )}

        {/* Notes */}
        {filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-24 gap-4 text-center"
          >
            <div className="text-5xl mb-2">📝</div>
            <h2 className="font-serif italic text-xl text-foreground">
              {search || selectedTags.length > 0 ? 'No notes match your search' : 'No notes yet'}
            </h2>
            <p className="font-mono text-sm text-muted-foreground max-w-xs">
              {search || selectedTags.length > 0 ? 'Try a different keyword or filter.' : 'Create your first note and start building your second brain.'}
            </p>
            {!search && selectedTags.length === 0 && (
              <Link
                to="/editor/new"
                className="mt-2 px-5 py-2.5 rounded-xl font-mono text-sm font-semibold"
                style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', color: '#f1f5f9' }}
              >
                + Create First Note
              </Link>
            )}
          </motion.div>
        ) : view === 'list' ? (
          <div className="space-y-2">
            {filtered.map((note, i) => (
              <NoteRow key={note.id} note={note} delay={i * 0.04} />
            ))}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((note, i) => (
              <motion.div
                key={note.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <Link to={`/editor/${note.id}`}>
                  <div
                    className="p-5 rounded-2xl flex flex-col gap-3 cursor-pointer group transition-all"
                    style={{ background: '#07070f', border: '1px solid hsl(240 20% 14%)' }}
                    onMouseEnter={(e) => {
                      const color = note.tags[0]?.color || '#7c3aed';
                      (e.currentTarget as HTMLElement).style.borderColor = color + '55';
                      (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 32px ${color}18`;
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor = 'hsl(240 20% 14%)';
                      (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                    }}
                  >
                    <div
                      className="w-10 h-10 rounded-xl overflow-hidden opacity-80 group-hover:opacity-100 transition-opacity"
                      dangerouslySetInnerHTML={{ __html: generateNoteDNA(note) }}
                    />
                    <h3 className="font-serif italic font-semibold text-foreground line-clamp-2">{note.title}</h3>
                    <p className="font-mono text-xs text-muted-foreground line-clamp-2">{note.preview}</p>
                    <div className="flex flex-wrap gap-1.5 mt-auto">
                      {note.tags.slice(0, 2).map((tag) => (
                        <span key={tag.id} className="px-2 py-0.5 rounded-full font-mono text-xs" style={{ background: tag.color + '22', color: tag.color, border: `1px solid ${tag.color}44` }}>
                          #{tag.name}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs text-muted-foreground">
                        {note.updatedAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                      <span className="font-mono text-xs text-muted-foreground">{note.wordCount}w</span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}