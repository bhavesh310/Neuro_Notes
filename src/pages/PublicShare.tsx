import { useState } from 'react';
import { motion } from 'framer-motion';
import { useParams } from 'react-router-dom';
import { Twitter, Linkedin, Link2, Clock, BookOpen, ChevronRight } from 'lucide-react';
import { MOCK_NOTES } from '@/lib/types';

export default function PublicShare() {
  const { slug } = useParams();
  const note = MOCK_NOTES.find(n => n.slug === slug) || MOCK_NOTES[2];
  const [copied, setCopied] = useState(false);
  const [commentName, setCommentName] = useState('');
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState([
    { name: 'Sarah Chen', text: 'This resonated deeply with how I think about my own note-taking system.', time: '2 days ago' },
    { name: 'Marcus Webb', text: 'The graph metaphor is exactly what I needed to describe my knowledge architecture.', time: '1 day ago' },
  ]);

  const handleCopy = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentName || !commentText) return;
    setComments(prev => [...prev, { name: commentName, text: commentText, time: 'just now' }]);
    setCommentName('');
    setCommentText('');
  };

  return (
    <div className="min-h-screen" style={{ background: '#04040c' }}>
      {/* Header */}
      <header className="sticky top-0 z-20 border-b" style={{ background: 'hsl(240 50% 3% / 0.95)', backdropFilter: 'blur(16px)', borderColor: 'hsl(240 20% 14%)' }}>
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">🧠</span>
            <span className="font-serif italic text-foreground">NeuroNotes</span>
            <span className="font-mono text-xs text-muted-foreground border rounded-full px-2 py-0.5" style={{ borderColor: 'hsl(240 20% 14%)' }}>
              Powered by NeuroNotes
            </span>
          </div>
          <a
            href="/signup"
            className="px-4 py-2 rounded-xl font-mono text-sm font-semibold btn-shimmer"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', color: '#f1f5f9' }}
          >
            Start for free
          </a>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-16 flex gap-16">
        {/* TOC Sidebar — desktop */}
        <aside className="hidden lg:block w-52 flex-shrink-0">
          <div className="sticky top-28 space-y-1">
            <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-4">Contents</p>
            {['Introduction', 'The Graph Metaphor', 'Connecting Concepts', 'Practical Applications', 'Conclusion'].map((heading) => (
              <a
                key={heading}
                href="#"
                className="block font-mono text-xs text-muted-foreground hover:text-foreground py-1 pl-3 border-l border-transparent hover:border-primary/50 transition-all"
              >
                {heading}
              </a>
            ))}
          </div>
        </aside>

        {/* Main content */}
        <article className="flex-1 min-w-0">
          {/* Tags */}
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap gap-2 mb-8">
            {note.tags.map((tag) => (
              <span
                key={tag.id}
                className="px-3 py-1 rounded-full font-mono text-xs font-medium"
                style={{ background: tag.color + '22', color: tag.color, border: `1px solid ${tag.color}44` }}
              >
                #{tag.name}
              </span>
            ))}
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-serif italic text-4xl lg:text-5xl font-bold leading-tight mb-8"
            style={{ color: '#f1f5f9' }}
          >
            {note.title}
          </motion.h1>

          {/* Meta */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-wrap items-center gap-4 mb-10 pb-8 border-b"
            style={{ borderColor: 'hsl(240 20% 14%)' }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold"
                style={{ background: 'linear-gradient(135deg, #7c3aed, #06b6d4)' }}
              >
                A
              </div>
              <div>
                <p className="font-mono text-sm font-semibold text-foreground">Alex Mercer</p>
                <p className="font-mono text-xs text-muted-foreground">
                  {note.updatedAt.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 ml-auto">
              <span className="flex items-center gap-1 font-mono text-xs text-muted-foreground">
                <Clock size={12} /> {Math.ceil(note.wordCount / 200)} min read
              </span>
              <span className="flex items-center gap-1 font-mono text-xs text-muted-foreground">
                <BookOpen size={12} /> {note.wordCount} words
              </span>
            </div>
          </motion.div>

          {/* Share bar */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex items-center gap-3 mb-10"
          >
            <span className="font-mono text-xs text-muted-foreground">Share:</span>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-xs border transition-all hover:bg-white/5"
              style={{ borderColor: 'hsl(240 20% 14%)', color: copied ? '#22c55e' : '#94a3b8' }}
            >
              <Link2 size={12} /> {copied ? 'Copied!' : 'Copy link'}
            </button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-xs border transition-all hover:bg-white/5" style={{ borderColor: 'hsl(240 20% 14%)', color: '#94a3b8' }}>
              <Twitter size={12} /> Twitter
            </button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-xs border transition-all hover:bg-white/5" style={{ borderColor: 'hsl(240 20% 14%)', color: '#94a3b8' }}>
              <Linkedin size={12} /> LinkedIn
            </button>
          </motion.div>

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="prose-content space-y-6 font-serif text-lg leading-relaxed"
            style={{ color: '#c8d3e0' }}
          >
            <p className="text-xl leading-relaxed" style={{ color: '#e2e8f0' }}>
              {note.preview}
            </p>
            <h2 className="font-serif italic text-2xl font-semibold mt-10 mb-4" style={{ color: '#f1f5f9' }}>
              The Graph Metaphor
            </h2>
            <p>
              Consider how knowledge actually works in the human mind. We don't store facts in neat
              folders. We store them as nodes in a vast associative network, each connected to dozens
              of others through relationships of similarity, contrast, causality, and metaphor.
            </p>
            <blockquote
              className="pl-5 py-1 my-8 italic text-lg"
              style={{ borderLeft: '3px solid #7c3aed', color: '#94a3b8' }}
            >
              "To understand is to know how a thing connects to everything else."
            </blockquote>
            <p>
              A note-taking system that mirrors this architecture — one that lets you create explicit
              links between ideas and visualize them as a graph — can dramatically accelerate the
              synthesis of new knowledge.
            </p>
            <h2 className="font-serif italic text-2xl font-semibold mt-10 mb-4" style={{ color: '#f1f5f9' }}>
              Connecting Concepts
            </h2>
            <p>
              The real power emerges when you start connecting notes that seem unrelated. A thought about
              neural networks connects to one about social dynamics. A note on typography links to one
              about music theory. These unexpected connections are where genuine insight lives.
            </p>
          </motion.div>

          {/* AI Summary */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-16 p-6 rounded-2xl space-y-4"
            style={{ background: 'hsl(263 69% 58% / 0.06)', border: '1px solid hsl(263 69% 58% / 0.2)' }}
          >
            <div className="flex items-center gap-2">
              <span className="text-primary-light">✦</span>
              <h3 className="font-mono text-sm font-semibold text-foreground">AI Summary</h3>
            </div>
            <ul className="space-y-2">
              {[
                'Knowledge is better understood as a graph than a hierarchy',
                'Connecting disparate ideas creates emergent understanding',
                'A good note system should mirror the associative nature of memory',
              ].map((point, i) => (
                <li key={i} className="flex items-start gap-3 font-mono text-sm text-muted-foreground">
                  <span className="text-primary-light mt-0.5">•</span> {point}
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Comments */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="mt-16 space-y-8"
          >
            <h3 className="font-serif italic text-2xl text-foreground">
              Responses <span className="font-mono text-sm text-muted-foreground not-italic">({comments.length})</span>
            </h3>

            <div className="space-y-4">
              {comments.map((c, i) => (
                <div key={i} className="p-4 rounded-xl" style={{ background: '#07070f', border: '1px solid hsl(240 20% 14%)' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                      style={{ background: 'linear-gradient(135deg, #7c3aed, #06b6d4)' }}
                    >
                      {c.name[0]}
                    </div>
                    <span className="font-mono text-sm font-semibold text-foreground">{c.name}</span>
                    <span className="font-mono text-xs text-muted-foreground ml-auto">{c.time}</span>
                  </div>
                  <p className="font-serif text-muted-foreground text-sm">{c.text}</p>
                </div>
              ))}
            </div>

            <form onSubmit={handleComment} className="space-y-3">
              <input
                value={commentName}
                onChange={(e) => setCommentName(e.target.value)}
                placeholder="Your name"
                className="w-full rounded-xl px-4 py-3 font-mono text-sm text-foreground placeholder:text-muted-foreground/50 outline-none"
                style={{ background: '#07070f', border: '1px solid hsl(240 20% 14%)' }}
              />
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Share your thoughts..."
                rows={3}
                className="w-full rounded-xl px-4 py-3 font-mono text-sm text-foreground placeholder:text-muted-foreground/50 outline-none resize-none"
                style={{ background: '#07070f', border: '1px solid hsl(240 20% 14%)' }}
              />
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl font-mono text-sm font-semibold btn-shimmer"
                style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', color: '#f1f5f9' }}
              >
                Post response
              </button>
            </form>
          </motion.div>

          {/* CTA Card */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="mt-16 p-8 rounded-2xl text-center space-y-4"
            style={{
              background: 'linear-gradient(135deg, hsl(263 69% 58% / 0.08), hsl(189 95% 43% / 0.06))',
              border: '1px solid hsl(263 69% 58% / 0.2)',
            }}
          >
            <div className="text-3xl">🧠</div>
            <h3 className="font-serif italic text-2xl text-foreground">Build your knowledge OS</h3>
            <p className="font-mono text-sm text-muted-foreground max-w-sm mx-auto">
              Create your own connected notes, knowledge graph, and public pages with NeuroNotes.
            </p>
            <a
              href="/signup"
              className="inline-flex items-center gap-2 px-8 py-3 rounded-xl font-mono text-sm font-semibold btn-shimmer"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', color: '#f1f5f9' }}
            >
              Start free → <ChevronRight size={14} />
            </a>
          </motion.div>
        </article>
      </div>
    </div>
  );
}
