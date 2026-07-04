import { useState, useEffect, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import AppLayout from '@/components/AppLayout';
import VoiceCapture from '@/components/VoiceCapture';
import { MOCK_NOTES, MOCK_TAGS, MOCK_USER, generateNoteDNA } from '@/lib/types';
import { getStoredUser } from '@/lib/auth';
import { useStoredNotes, buildAiSuggestions, deleteNote } from '@/lib/notesStore';
import { FileText, Hash, Share2, Flame, MoreHorizontal, Pencil, Trash2, Clock, Sparkles, ChevronRight } from 'lucide-react';
import * as d3 from 'd3';

// Mini D3 graph
function MiniGraph() {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    const width = svgRef.current.clientWidth || 400;
    const height = 200;
    svg.selectAll('*').remove();

    const nodes = MOCK_NOTES.map((n, i) => ({
      id: n.id,
      label: n.title.split(' ').slice(0, 2).join(' '),
      color: n.tags[0]?.color || '#7c3aed',
      size: 6 + i,
    }));

    const links = [
      { source: '1', target: '2' },
      { source: '1', target: '5' },
      { source: '2', target: '4' },
      { source: '3', target: '6' },
      { source: '4', target: '5' },
      { source: '5', target: '6' },
    ];

    const sim = d3.forceSimulation(nodes as any)
      .force('link', d3.forceLink(links).id((d: any) => d.id).distance(70))
      .force('charge', d3.forceManyBody().strength(-80))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide(20));

    const link = svg.append('g')
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke', '#7c3aed44')
      .attr('stroke-width', 1);

    const node = svg.append('g')
      .selectAll('circle')
      .data(nodes)
      .join('circle')
      .attr('r', (d: any) => d.size)
      .attr('fill', (d: any) => d.color + 'cc')
      .attr('stroke', (d: any) => d.color)
      .attr('stroke-width', 1)
      .style('cursor', 'pointer');

    sim.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);
      node
        .attr('cx', (d: any) => Math.max(d.size, Math.min(width - d.size, d.x)))
        .attr('cy', (d: any) => Math.max(d.size, Math.min(height - d.size, d.y)));
    });

    return () => { sim.stop(); };
  }, []);

  return <svg ref={svgRef} className="w-full" height={200} />;
}

function NoteCard({ note, delay = 0 }: { note: typeof MOCK_NOTES[0]; delay?: number }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const dna = generateNoteDNA(note);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="note-card rounded-2xl p-5 flex flex-col gap-3 cursor-pointer group relative"
      style={{
        background: '#07070f',
        border: `1px solid hsl(240 20% 14%)`,
      }}
      onMouseEnter={(e) => {
        const color = note.tags[0]?.color || '#7c3aed';
        (e.currentTarget as HTMLElement).style.borderColor = color + '66';
        (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 32px ${color}22`;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = 'hsl(240 20% 14%)';
        (e.currentTarget as HTMLElement).style.boxShadow = 'none';
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          {/* DNA icon */}
          <div
            className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0 opacity-80 group-hover:opacity-100 transition-opacity"
            dangerouslySetInnerHTML={{ __html: dna }}
          />
          <h3 className="font-serif italic font-semibold text-foreground text-base leading-tight line-clamp-2">
            {note.title}
          </h3>
        </div>
        <div className="relative">
          <button
            onClick={(e) => { e.preventDefault(); setMenuOpen(!menuOpen); }}
            className="p-1 rounded-lg text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-all"
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
                className="w-full flex items-center gap-2 px-3 py-2 text-sm font-mono text-error/80 hover:text-error hover:bg-white/5 transition-colors"
              >
                <Trash2 size={13} /> Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Preview */}
      <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
        {note.preview}
      </p>

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5">
        {note.tags.map((tag) => (
          <span
            key={tag.id}
            className="px-2.5 py-1 rounded-full font-mono text-xs font-medium"
            style={{ background: tag.color + '22', color: tag.color, border: `1px solid ${tag.color}44` }}
          >
            #{tag.name}
          </span>
        ))}
        {note.isTimeCapsule && (
          <span className="px-2.5 py-1 rounded-full font-mono text-xs font-medium" style={{ background: '#f59e0b22', color: '#f59e0b', border: '1px solid #f59e0b44' }}>
            ⏳ Time Capsule
          </span>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-auto pt-2">
        <span className="font-mono text-xs text-muted-foreground">
          {note.updatedAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </span>
        <div className="flex items-center gap-2">
          {note.isPublic && (
            <Share2 size={12} className="text-cyan-500" />
          )}
          <span className="font-mono text-xs text-muted-foreground">{note.wordCount} words</span>
        </div>
      </div>
    </motion.div>
  );
}

function StatCard({ icon, label, value, color, delay = 0 }: { icon: React.ReactNode; label: string; value: string | number; color: string; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="rounded-2xl p-5 relative overflow-hidden"
      style={{ background: '#07070f', border: '1px solid hsl(240 20% 14%)' }}
    >
      <div
        className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl"
        style={{ background: `linear-gradient(90deg, ${color}, transparent)` }}
      />
      <div className="flex items-start justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-3">{label}</p>
          <p className="font-mono text-3xl font-bold" style={{ color }}>{value}</p>
        </div>
        <div className="text-2xl">{icon}</div>
      </div>
    </motion.div>
  );
}

export default function Dashboard() {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  const storedUser = getStoredUser();
  const displayName = storedUser?.name?.split(' ')[0] ?? MOCK_USER.name.split(' ')[0];

  const storedNotes = useStoredNotes();
  const currentDraft = (typeof window !== 'undefined' && localStorage.getItem('neuronotes_current_draft')) || '';

  // Stats derived from stored notes
  const totalNotes = storedNotes.length;

  // Derive tags dynamically from stored notes (explicit + inline #hashtags)
  const PALETTE = ['#7c3aed', '#06b6d4', '#f59e0b', '#22c55e', '#ef4444', '#a78bfa', '#f97316', '#3b82f6', '#ec4899', '#14b8a6'];
  const colorFor = (name: string) => {
    let h = 0;
    for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
    return PALETTE[h % PALETTE.length];
  };
  const derivedTags = useMemo(() => {
    const counts = new Map<string, number>();
    for (const n of storedNotes) {
      const explicit = (n.tags ?? []).map((t) => t.replace(/^#/, '').trim().toLowerCase()).filter(Boolean);
      const inline = ((n.content ?? '') + ' ' + (n.title ?? '')).match(/#([a-zA-Z0-9_-]{2,})/g)?.map((t) => t.slice(1).toLowerCase()) ?? [];
      const all = new Set([...explicit, ...inline]);
      for (const t of all) counts.set(t, (counts.get(t) ?? 0) + 1);
    }
    return [...counts.entries()]
      .map(([name, count]) => ({ name, count, color: colorFor(name) }))
      .sort((a, b) => b.count - a.count);
  }, [storedNotes]);
  const totalTags = derivedTags.length;
  const maxTagCount = Math.max(1, ...derivedTags.map((t) => t.count));
  const publicLinks = 0;
  const streak = 0;
  const recentNotes: typeof MOCK_NOTES = [];

  const aiSuggestions = useMemo(
    () => buildAiSuggestions(storedNotes, currentDraft),
    [storedNotes, currentDraft],
  );

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8 space-y-10">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-serif italic text-foreground">
              {greeting}, <span className="gradient-text">{displayName}</span> ✦
            </h1>
            <p className="font-mono text-sm text-muted-foreground mt-1">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>

          {/* Quick capture (voice-to-text) */}
          <VoiceCapture />
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon="📝" label="Total Notes" value={totalNotes} color="#7c3aed" delay={0.1} />
          <StatCard icon="🏷️" label="Tags Used" value={totalTags} color="#06b6d4" delay={0.15} />
          <StatCard icon="🌐" label="Public Links" value={publicLinks} color="#22c55e" delay={0.2} />
          <StatCard icon="🔥" label="Day Streak" value={streak === 0 ? '0 days' : `${streak} days`} color="#f59e0b" delay={0.25} />
        </div>

        {/* Notes + Graph row */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Recent Notes */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-serif italic text-xl text-foreground">Recent Notes</h2>
              <Link to="/notes" className="flex items-center gap-1 font-mono text-xs text-primary hover:text-primary-light transition-colors">
                View all <ChevronRight size={14} />
              </Link>
            </div>
            {recentNotes.length === 0 ? (
              <div
                className="flex flex-col items-center justify-center py-16 rounded-2xl gap-3 text-center"
                style={{ background: '#07070f', border: '1px solid hsl(240 20% 14%)' }}
              >
                <div className="text-4xl">📝</div>
                <p className="font-serif italic text-foreground">No notes yet</p>
                <p className="font-mono text-sm text-muted-foreground">Create your first note to get started.</p>
                <Link
                  to="/editor/new"
                  className="mt-1 px-4 py-2 rounded-xl font-mono text-sm font-semibold"
                  style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', color: '#f1f5f9' }}
                >
                  + New Note
                </Link>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                {recentNotes.map((note, i) => (
                  <Link key={note.id} to={`/editor/${note.id}`}>
                    <NoteCard note={note} delay={i * 0.05 + 0.3} />
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Right column */}
          <div className="space-y-6">
            {/* Mini Graph */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="rounded-2xl overflow-hidden"
              style={{ background: '#07070f', border: '1px solid hsl(240 20% 14%)' }}
            >
              <div className="flex items-center justify-between px-4 pt-4 pb-2">
                <h3 className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Knowledge Graph</h3>
                <Link to="/graph" className="font-mono text-xs text-primary hover:text-primary-light">
                  Full view →
                </Link>
              </div>
              <MiniGraph />
              <p className="px-4 pb-3 font-mono text-xs text-muted-foreground">
                {totalNotes} nodes · {totalTags} connections
              </p>
            </motion.div>

            {/* Active Tags */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="rounded-2xl p-4 space-y-3"
              style={{ background: '#07070f', border: '1px solid hsl(240 20% 14%)' }}
            >
              <h3 className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Top Tags</h3>
              {derivedTags.length === 0 ? (
                <p className="font-mono text-xs text-muted-foreground py-2">
                  No tags yet. Add #hashtags in your notes to see them here.
                </p>
              ) : (
                <div className="space-y-2">
                  {derivedTags.slice(0, 6).map((tag) => (
                    <Link
                      key={tag.name}
                      to={`/tags`}
                      className="flex items-center gap-3 py-1 rounded-lg hover:bg-white/5 transition-colors"
                    >
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: tag.color }} />
                      <span className="font-mono text-sm text-foreground flex-1 truncate">#{tag.name}</span>
                      <span className="font-mono text-xs text-muted-foreground">{tag.count}</span>
                      <div className="w-16 h-1 rounded-full overflow-hidden" style={{ background: 'hsl(240 20% 14%)' }}>
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${(tag.count / maxTagCount) * 100}%`, background: tag.color }}
                        />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        </div>

        {/* AI Suggestions */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-cyan-500">✦</span>
            <h2 className="font-serif italic text-xl text-foreground">AI Suggestions</h2>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
            {aiSuggestions.map((s, i) => (
              <div
                key={i}
                className="flex-shrink-0 w-60 p-4 rounded-2xl cursor-pointer transition-all duration-200 hover:translate-y-[-2px]"
                style={{
                  background: '#07070f',
                  border: '1px solid hsl(240 20% 14%)',
                  borderLeft: '3px solid #06b6d4',
                }}
              >
                <p className="font-mono text-xs text-cyan-500 mb-1">{s.title}</p>
                <p className="font-serif italic text-sm text-foreground font-semibold mb-1">{s.note}</p>
                <p className="font-mono text-xs text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </AppLayout>
  );
}
