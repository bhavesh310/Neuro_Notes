import { useState } from 'react';
import { motion } from 'framer-motion';
import AppLayout from '@/components/AppLayout';
import { Search, Star, Download, Eye, Plus, TrendingUp, Package } from 'lucide-react';

const CATEGORIES = [
  { id: 'all', icon: '🌟', label: 'All' },
  { id: 'study', icon: '📚', label: 'Study Notes' },
  { id: 'business', icon: '💼', label: 'Business' },
  { id: 'startup', icon: '🚀', label: 'Startup' },
  { id: 'creative', icon: '🎨', label: 'Creative' },
  { id: 'research', icon: '💡', label: 'Research' },
  { id: 'journal', icon: '📓', label: 'Journaling' },
  { id: 'dev', icon: '💻', label: 'Dev Notes' },
  { id: 'science', icon: '🧬', label: 'Science' },
];

const TEMPLATES = [
  {
    id: '1', title: 'Zettelkasten Starter Kit', creator: 'Alex M.', category: 'research',
    price: 0, rating: 4.9, downloads: 2840,
    color: '#7c3aed', desc: 'Complete Zettelkasten system with atomic notes, inbox, and literature notes.',
  },
  {
    id: '2', title: 'Startup Weekly Review', creator: 'Sarah Chen', category: 'startup',
    price: 5, rating: 4.7, downloads: 1240,
    color: '#06b6d4', desc: 'Track OKRs, blockers, wins, and lessons learned across your startup journey.',
  },
  {
    id: '3', title: 'Cornell Note System', creator: 'Marcus W.', category: 'study',
    price: 0, rating: 4.8, downloads: 5620,
    color: '#f59e0b', desc: 'Classic Cornell method adapted for digital note-taking with linked questions.',
  },
  {
    id: '4', title: 'Product Spec Template', creator: 'Jamie L.', category: 'business',
    price: 12, rating: 4.6, downloads: 890,
    color: '#3b82f6', desc: 'PRD template with problem statements, user stories, and success metrics.',
  },
  {
    id: '5', title: 'Research Paper Digest', creator: 'Dr. Kim', category: 'science',
    price: 0, rating: 4.9, downloads: 3210,
    color: '#a78bfa', desc: 'Summarize academic papers with key findings, methodology, and implications.',
  },
  {
    id: '6', title: 'Creative Writing Bible', creator: 'Elena R.', category: 'creative',
    price: 8, rating: 4.5, downloads: 1560,
    color: '#f97316', desc: 'World-building, character profiles, plot structure, and scene templates.',
  },
  {
    id: '7', title: 'Daily Developer Log', creator: 'DevNerd42', category: 'dev',
    price: 0, rating: 4.7, downloads: 4100,
    color: '#ef4444', desc: 'Track progress, bugs, PRs, and learnings with daily dev journal template.',
  },
  {
    id: '8', title: '90-Day Reflection Journal', creator: 'Mindful.app', category: 'journal',
    price: 3, rating: 4.8, downloads: 2200,
    color: '#22c55e', desc: 'Structured gratitude, goals, and reflection prompts for 90 days.',
  },
];

export default function Marketplace() {
  const [activeTab, setActiveTab] = useState<'browse' | 'creator'>('browse');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [search, setSearch] = useState('');

  const filtered = TEMPLATES.filter(t =>
    (selectedCategory === 'all' || t.category === selectedCategory) &&
    (t.title.toLowerCase().includes(search.toLowerCase()) || t.desc.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8 space-y-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-2">
          <h1 className="text-3xl font-serif italic text-foreground">Note Marketplace</h1>
          <p className="font-mono text-sm text-muted-foreground">Browse and sell knowledge templates</p>
        </motion.div>

        {/* Tabs */}
        <div className="flex items-center gap-4">
          {['browse', 'creator'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className="px-4 py-2 rounded-xl font-mono text-sm font-medium capitalize transition-all"
              style={{
                background: activeTab === tab ? 'hsl(263 69% 58% / 0.15)' : 'transparent',
                color: activeTab === tab ? '#a78bfa' : '#475569',
                border: `1px solid ${activeTab === tab ? 'hsl(263 69% 58% / 0.4)' : 'hsl(240 20% 14%)'}`,
              }}
            >
              {tab === 'browse' ? '🛒 Browse' : '💎 Creator Dashboard'}
            </button>
          ))}
        </div>

        {activeTab === 'browse' && (
          <>
            {/* Search + categories */}
            <div className="space-y-4">
              <div
                className="flex items-center gap-3 px-4 py-3 rounded-xl max-w-md"
                style={{ background: '#07070f', border: '1px solid hsl(240 20% 14%)' }}
              >
                <Search size={16} className="text-muted-foreground" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search templates..."
                  className="bg-transparent font-mono text-sm text-foreground placeholder:text-muted-foreground/50 outline-none flex-1"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl font-mono text-sm transition-all"
                    style={{
                      background: selectedCategory === cat.id ? 'hsl(263 69% 58% / 0.15)' : 'hsl(240 50% 7%)',
                      color: selectedCategory === cat.id ? '#a78bfa' : '#475569',
                      border: `1px solid ${selectedCategory === cat.id ? 'hsl(263 69% 58% / 0.4)' : 'hsl(240 20% 14%)'}`,
                    }}
                  >
                    <span>{cat.icon}</span> {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Templates grid */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {filtered.map((template, i) => (
                <motion.div
                  key={template.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="note-card rounded-2xl overflow-hidden flex flex-col"
                  style={{ background: '#07070f', border: '1px solid hsl(240 20% 14%)' }}
                >
                  {/* Preview thumbnail */}
                  <div
                    className="h-28 flex items-center justify-center"
                    style={{
                      background: `linear-gradient(135deg, ${template.color}15, ${template.color}05)`,
                      borderBottom: '1px solid hsl(240 20% 14%)',
                    }}
                  >
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-xl"
                      style={{ background: template.color + '22', border: `1px solid ${template.color}44` }}
                    >
                      {CATEGORIES.find(c => c.id === template.category)?.icon}
                    </div>
                  </div>

                  <div className="p-4 flex flex-col gap-3 flex-1">
                    <h3 className="font-serif italic font-semibold text-foreground text-sm leading-snug">{template.title}</h3>
                    <p className="font-mono text-xs text-muted-foreground line-clamp-2">{template.desc}</p>

                    <div className="flex items-center justify-between mt-auto">
                      <div className="flex items-center gap-1">
                        <Star size={11} className="fill-yellow-500 text-yellow-500" />
                        <span className="font-mono text-xs text-muted-foreground">{template.rating}</span>
                        <span className="font-mono text-xs text-muted-foreground">· {template.downloads.toLocaleString()}</span>
                      </div>
                      <span
                        className="font-mono text-sm font-bold"
                        style={{ color: template.price === 0 ? '#22c55e' : '#f1f5f9' }}
                      >
                        {template.price === 0 ? 'Free' : `$${template.price}`}
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <button className="flex-1 py-1.5 rounded-lg font-mono text-xs text-muted-foreground hover:text-foreground transition-colors border" style={{ borderColor: 'hsl(240 20% 14%)' }}>
                        <Eye size={11} className="inline mr-1" /> Preview
                      </button>
                      <button
                        className="flex-1 py-1.5 rounded-lg font-mono text-xs font-semibold transition-all"
                        style={{
                          background: template.color + '22',
                          color: template.color,
                          border: `1px solid ${template.color}44`,
                        }}
                      >
                        Get
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </>
        )}

        {activeTab === 'creator' && (
          <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            {/* Revenue stats */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { icon: <TrendingUp size={20} />, label: 'Total Revenue', value: '$284', color: '#22c55e' },
                { icon: <Download size={20} />, label: 'Downloads', value: '1,240', color: '#06b6d4' },
                { icon: <Package size={20} />, label: 'Listings', value: '3', color: '#7c3aed' },
              ].map((s, i) => (
                <div key={i} className="p-5 rounded-2xl relative overflow-hidden" style={{ background: '#07070f', border: '1px solid hsl(240 20% 14%)' }}>
                  <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: `linear-gradient(90deg, ${s.color}, transparent)` }} />
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-2">{s.label}</p>
                      <p className="font-mono text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
                    </div>
                    <div style={{ color: s.color }}>{s.icon}</div>
                  </div>
                </div>
              ))}
            </div>

            <button
              className="flex items-center gap-2 px-5 py-3 rounded-xl font-mono text-sm font-semibold btn-shimmer"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', color: '#f1f5f9' }}
            >
              <Plus size={16} /> Upload New Template
            </button>

            <div className="space-y-3">
              <h3 className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Your Listings</h3>
              {TEMPLATES.slice(0, 3).map((t) => (
                <div key={t.id} className="flex items-center gap-4 p-4 rounded-xl" style={{ background: '#07070f', border: '1px solid hsl(240 20% 14%)' }}>
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: t.color + '22' }}>
                    {CATEGORIES.find(c => c.id === t.category)?.icon}
                  </div>
                  <div className="flex-1">
                    <p className="font-serif italic text-sm font-semibold text-foreground">{t.title}</p>
                    <p className="font-mono text-xs text-muted-foreground">{t.downloads} downloads</p>
                  </div>
                  <div className="flex items-center gap-1 text-yellow-500">
                    <Star size={12} className="fill-current" />
                    <span className="font-mono text-xs">{t.rating}</span>
                  </div>
                  <span className="font-mono text-sm font-bold text-foreground">{t.price === 0 ? 'Free' : `$${t.price}`}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </AppLayout>
  );
}
