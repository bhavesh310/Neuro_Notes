import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import NeuralCanvas from '@/components/NeuralCanvas';
import { ArrowRight, Sparkles, Globe, Lock, Zap } from 'lucide-react';

export default function Landing() {
  const features = [
    { icon: '🧠', title: 'Knowledge Graph', desc: 'See your ideas as an interactive D3 network. Every connection reveals new meaning.' },
    { icon: '🤖', title: 'AI Assistant', desc: 'Summarize, expand, convert to LinkedIn posts, flashcards — all in one keystroke.' },
    { icon: '🌐', title: 'Public Pages', desc: 'Share beautiful editorial notes with the world. No extra setup required.' },
    { icon: '🧬', title: 'Note DNA', desc: 'Every note generates a unique SVG fingerprint based on its content and tags.' },
    { icon: '⏳', title: 'Time Capsules', desc: 'Lock a note until a future date. Perfect for letters to your future self.' },
    { icon: '🎙️', title: 'Voice-to-Note', desc: 'Dictate thoughts in 40+ languages. AI transcribes and tags automatically.' },
  ];

  return (
    <div style={{ background: '#04040c', color: '#f1f5f9' }} className="min-h-screen">
      {/* Nav */}
      <nav className="sticky top-0 z-30 border-b" style={{ background: 'hsl(240 50% 3% / 0.9)', backdropFilter: 'blur(16px)', borderColor: 'hsl(240 20% 14%)' }}>
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🧠</span>
            <span className="font-serif text-xl">
              <span className="italic">Neuro</span>
              <span style={{ background: 'linear-gradient(135deg, #a78bfa, #06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', fontWeight: 700 }}>Notes</span>
            </span>
          </div>
          <div className="hidden md:flex items-center gap-6">
            {[
              { label: 'Features', href: '#features' },
              { label: 'Pricing', href: '#pricing' },
              { label: 'Blog', href: '#blog' },
            ].map(item => (
              <a
                key={item.label}
                href={item.href}
                onClick={(e) => {
                  e.preventDefault();
                  document.querySelector(item.href)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                className="font-mono text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {item.label}
              </a>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="font-mono text-sm text-muted-foreground hover:text-foreground transition-colors">Sign in</Link>
            <Link to="/signup" className="flex items-center gap-2 px-4 py-2 rounded-xl font-mono text-sm font-semibold btn-shimmer" style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', color: '#f1f5f9' }}>
              Start free <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden">
        <div className="absolute inset-0 opacity-40"><NeuralCanvas /></div>
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at center, transparent 20%, #04040c 80%)' }} />
        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full font-mono text-xs border mb-8" style={{ background: 'hsl(263 69% 58% / 0.1)', borderColor: 'hsl(263 69% 58% / 0.3)', color: '#a78bfa' }}>
              <Sparkles size={12} /> Now with AI · Knowledge Graphs · Public Pages
            </span>
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="font-serif italic text-6xl lg:text-7xl font-bold leading-tight mb-6">
            Your second brain,{' '}
            <span style={{ background: 'linear-gradient(135deg, #a78bfa, #06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              finally worth using
            </span>
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }} className="font-mono text-lg text-muted-foreground max-w-2xl mx-auto mb-10">
            NeuroNotes combines AI, visual knowledge graphs, and beautiful public sharing. The OS for your ideas.
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/signup" className="flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-mono text-base font-semibold btn-shimmer" style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9, #4c1d95)', color: '#f1f5f9', boxShadow: '0 4px 24px hsl(263 69% 58% / 0.27)' }}>
              Start for free <ArrowRight size={16} />
            </Link>
            <Link to="/share/architecture-of-thought" className="flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-mono text-base font-medium border transition-all hover:border-primary/50" style={{ borderColor: 'hsl(240 20% 14%)', color: '#94a3b8' }}>
              <Globe size={16} /> See a live note
            </Link>
          </motion.div>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }} className="flex items-center justify-center gap-6 mt-10">
            {[<><Lock size={12} /> AES-256</>, <><Zap size={12} /> &lt;50ms</>, <><Globe size={12} /> 99.9% uptime</>].map((b, i) => (
              <span key={i} className="flex items-center gap-1 font-mono text-xs text-muted-foreground">{b}</span>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-6xl mx-auto px-6 py-24 scroll-mt-20">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
          <h2 className="font-serif italic text-4xl font-bold text-foreground mb-4">Everything your mind needs</h2>
          <p className="font-mono text-muted-foreground max-w-lg mx-auto">Not just a notes app. A complete knowledge operating system.</p>
        </motion.div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <motion.div key={f.title} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
              className="p-6 rounded-2xl hover:translate-y-[-3px] transition-all duration-200 group"
              style={{ background: '#07070f', border: '1px solid hsl(240 20% 14%)' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 12px 40px hsl(263 69% 58% / 0.12)'; (e.currentTarget as HTMLElement).style.borderColor = 'hsl(263 69% 58% / 0.3)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = 'none'; (e.currentTarget as HTMLElement).style.borderColor = 'hsl(240 20% 14%)'; }}
            >
              <div className="text-3xl mb-4">{f.icon}</div>
              <h3 className="font-serif italic text-lg font-semibold text-foreground mb-2">{f.title}</h3>
              <p className="font-mono text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="max-w-6xl mx-auto px-6 py-24 scroll-mt-20">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
          <h2 className="font-serif italic text-4xl font-bold text-foreground mb-4">Simple, honest pricing</h2>
          <p className="font-mono text-muted-foreground max-w-lg mx-auto">Start free. Upgrade when your second brain outgrows the basics.</p>
        </motion.div>
        <div className="grid sm:grid-cols-3 gap-6">
          {[
            { name: 'Free', price: '$0', tagline: 'For curious minds', features: ['Up to 100 notes', 'Knowledge graph', 'Basic AI suggestions', 'Public sharing'], cta: 'Start free', highlight: false },
            { name: 'Pro', price: '$8', tagline: 'For serious thinkers', features: ['Unlimited notes', 'Advanced AI assistant', 'Voice-to-note (40+ langs)', 'Time capsules & vault', 'Priority support'], cta: 'Go Pro', highlight: true },
            { name: 'Team', price: '$18', tagline: 'For shared brains', features: ['Everything in Pro', 'Shared collections', 'Real-time collaboration', 'Admin controls', 'SAML SSO'], cta: 'Contact us', highlight: false },
          ].map((plan, i) => (
            <motion.div key={plan.name} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
              className="p-6 rounded-2xl flex flex-col"
              style={{
                background: plan.highlight ? 'linear-gradient(135deg, hsl(263 69% 58% / 0.12), hsl(189 95% 43% / 0.06))' : '#07070f',
                border: `1px solid ${plan.highlight ? 'hsl(263 69% 58% / 0.4)' : 'hsl(240 20% 14%)'}`,
              }}
            >
              <div className="flex items-baseline justify-between mb-2">
                <h3 className="font-serif italic text-xl font-semibold text-foreground">{plan.name}</h3>
                {plan.highlight && <span className="font-mono text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full" style={{ background: 'hsl(263 69% 58% / 0.2)', color: '#a78bfa' }}>Popular</span>}
              </div>
              <p className="font-mono text-xs text-muted-foreground mb-4">{plan.tagline}</p>
              <div className="mb-6">
                <span className="font-serif text-4xl font-bold text-foreground">{plan.price}</span>
                <span className="font-mono text-sm text-muted-foreground">/mo</span>
              </div>
              <ul className="space-y-2 mb-6 flex-1">
                {plan.features.map(f => (
                  <li key={f} className="font-mono text-sm text-muted-foreground flex items-start gap-2">
                    <span style={{ color: '#06b6d4' }}>✓</span> {f}
                  </li>
                ))}
              </ul>
              <Link to="/signup" className="text-center px-4 py-2.5 rounded-xl font-mono text-sm font-semibold transition-all"
                style={{
                  background: plan.highlight ? 'linear-gradient(135deg, #7c3aed, #6d28d9)' : 'transparent',
                  color: '#f1f5f9',
                  border: plan.highlight ? 'none' : '1px solid hsl(240 20% 18%)',
                }}>
                {plan.cta}
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Blog */}
      <section id="blog" className="max-w-6xl mx-auto px-6 py-24 scroll-mt-20">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
          <h2 className="font-serif italic text-4xl font-bold text-foreground mb-4">From the journal</h2>
          <p className="font-mono text-muted-foreground max-w-lg mx-auto">Essays on thinking, knowledge, and tools for the mind.</p>
        </motion.div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { title: 'The Architecture of Thought', date: 'Jan 20, 2024', read: '6 min', slug: 'architecture-of-thought', excerpt: 'Every idea is a node in an infinite graph. When we connect disparate concepts, we create new meaning.' },
            { title: 'Building a Second Brain in 2024', date: 'Jan 18, 2024', read: '4 min', slug: 'second-brain-2024', excerpt: 'The challenge isn\'t capturing information — it\'s building systems where ideas collide and combine.' },
            { title: 'LLMs and the Nature of Understanding', date: 'Jan 12, 2024', read: '9 min', slug: 'llms-understanding', excerpt: 'What does it mean to understand? Language models show syntax and semantics can be separated.' },
          ].map((post, i) => (
            <motion.article key={post.slug} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}>
              <Link to={`/share/${post.slug}`} className="block p-6 rounded-2xl h-full transition-all hover:translate-y-[-3px]"
                style={{ background: '#07070f', border: '1px solid hsl(240 20% 14%)' }}>
                <div className="flex items-center gap-3 font-mono text-xs text-muted-foreground mb-3">
                  <span>{post.date}</span><span>·</span><span>{post.read} read</span>
                </div>
                <h3 className="font-serif italic text-lg font-semibold text-foreground mb-2">{post.title}</h3>
                <p className="font-mono text-sm text-muted-foreground leading-relaxed">{post.excerpt}</p>
                <span className="inline-flex items-center gap-1 font-mono text-xs mt-4" style={{ color: '#a78bfa' }}>
                  Read essay <ArrowRight size={12} />
                </span>
              </Link>
            </motion.article>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-6 py-24 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="p-12 rounded-3xl"
          style={{ background: 'linear-gradient(135deg, hsl(263 69% 58% / 0.08), hsl(189 95% 43% / 0.06))', border: '1px solid hsl(263 69% 58% / 0.2)' }}
        >
          <div className="text-5xl mb-6">🧠</div>
          <h2 className="font-serif italic text-4xl font-bold text-foreground mb-4">Where ideas connect</h2>
          <p className="font-mono text-muted-foreground mb-8 max-w-md mx-auto">Join thousands of thinkers, writers, and researchers who've upgraded their second brain.</p>
          <Link to="/signup" className="inline-flex items-center gap-2 px-10 py-4 rounded-xl font-mono text-base font-semibold btn-shimmer" style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', color: '#f1f5f9', boxShadow: '0 4px 24px hsl(263 69% 58% / 0.3)' }}>
            Start for free <ArrowRight size={16} />
          </Link>
        </motion.div>
      </section>

      <footer className="border-t py-8 text-center" style={{ borderColor: 'hsl(240 20% 14%)' }}>
        <p className="font-mono text-xs text-muted-foreground">
          © 2026 NeuroNotes — Built with ❤️ by Bhavesh Ghatode
        </p>
      </footer>
    </div>
  );
}
