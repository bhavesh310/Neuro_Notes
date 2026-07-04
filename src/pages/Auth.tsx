import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Chrome, Github, Apple, CheckCircle, AlertCircle, X } from 'lucide-react';
import NeuralCanvas from '@/components/NeuralCanvas';
import { useNavigate } from 'react-router-dom';
import {
  signInWithEmail,
  signUpWithEmail,
  signInWithProvider,
  DEMO_CREDENTIALS,
} from '@/lib/auth';

const TYPEWRITER_PHRASES = [
  'Think Deeper.',
  'Connect Ideas.',
  'Own Your Knowledge.',
  'Share Your Mind.',
];

function TypewriterEffect() {
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [displayed, setDisplayed] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const phrase = TYPEWRITER_PHRASES[phraseIndex];
    const speed = isDeleting ? 50 : 80;
    const timeout = setTimeout(() => {
      if (!isDeleting) {
        setDisplayed(phrase.slice(0, displayed.length + 1));
        if (displayed.length + 1 === phrase.length) {
          setTimeout(() => setIsDeleting(true), 1800);
        }
      } else {
        setDisplayed(phrase.slice(0, displayed.length - 1));
        if (displayed.length === 0) {
          setIsDeleting(false);
          setPhraseIndex((i) => (i + 1) % TYPEWRITER_PHRASES.length);
        }
      }
    }, speed);
    return () => clearTimeout(timeout);
  }, [displayed, isDeleting, phraseIndex]);

  return (
    <div className="flex items-center gap-1 text-2xl font-serif italic text-foreground">
      <span>{displayed}</span>
      <span className="inline-block w-0.5 h-6 bg-primary animate-blink ml-0.5" />
    </div>
  );
}

function NeuroLogo() {
  return (
    <div className="flex items-center gap-3">
      <div className="relative">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center text-xl"
          style={{ background: 'linear-gradient(135deg, #7c3aed, #4c1d95)' }}
        >
          🧠
        </div>
        <div
          className="absolute w-2 h-2 rounded-full bg-cyan-400 animate-orbit"
          style={{ top: '50%', left: '50%', marginTop: '-4px', marginLeft: '-4px' }}
        />
      </div>
      <div className="font-serif text-2xl">
        <span className="italic font-normal text-foreground">Neuro</span>
        <span
          className="font-bold not-italic"
          style={{
            background: 'linear-gradient(135deg, #a78bfa, #06b6d4)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >Notes</span>
      </div>
    </div>
  );
}

type ToastType = 'success' | 'error' | 'info';
interface Toast {
  id: number;
  type: ToastType;
  message: string;
}

function ToastContainer({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: number) => void }) {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, x: 40, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 40, scale: 0.95 }}
            transition={{ duration: 0.22 }}
            className="pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl font-mono text-sm shadow-2xl max-w-xs"
            style={{
              background: t.type === 'error' ? '#1a0a0a' : t.type === 'success' ? '#0a1a0a' : '#0d0d1a',
              border: `1px solid ${t.type === 'error' ? '#ef4444' : t.type === 'success' ? '#22c55e' : '#7c3aed'}44`,
              color: t.type === 'error' ? '#fca5a5' : t.type === 'success' ? '#86efac' : '#a78bfa',
            }}
          >
            {t.type === 'success' ? <CheckCircle size={16} /> : t.type === 'error' ? <AlertCircle size={16} /> : <span>ℹ</span>}
            <span className="flex-1">{t.message}</span>
            <button onClick={() => onRemove(t.id)} className="opacity-60 hover:opacity-100">
              <X size={13} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

export default function AuthPage() {
  const [mode, setMode] = useState<'signin' | 'signup' | 'reset'>('signin');
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const navigate = useNavigate();

  const addToast = (type: ToastType, message: string) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => removeToast(id), 4000);
  };
  const removeToast = (id: number) => setToasts((prev) => prev.filter((t) => t.id !== id));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    setTimeout(() => {
      if (mode === 'signin') {
        const user = signInWithEmail(email, password);
        if (user) {
          setLoading(false);
          setSuccess(true);
          addToast('success', `Welcome back, ${user.name}!`);
          setTimeout(() => navigate('/dashboard'), 1800);
        } else {
          setLoading(false);
          addToast('error', 'Invalid credentials. Try demo@neuronotes.app / demo1234');
        }
      } else if (mode === 'signup') {
        if (!name.trim()) {
          setLoading(false);
          addToast('error', 'Please enter your name to continue.');
          return;
        }
        const user = signUpWithEmail(name, email, password);
        setLoading(false);
        setSuccess(true);
        addToast('success', `Account created! Welcome, ${user.name}!`);
        setTimeout(() => navigate('/dashboard'), 1800);
      } else {
        // password reset — simulated
        setLoading(false);
        addToast('info', `Reset link sent to ${email} (simulated)`);
        setTimeout(() => setMode('signin'), 1500);
      }
    }, 1200);
  };

  const handleSocial = (provider: 'google' | 'github' | 'apple') => {
    setSocialLoading(provider);
    addToast('info', `Connecting with ${provider.charAt(0).toUpperCase() + provider.slice(1)}...`);
    setTimeout(() => {
      const user = signInWithProvider(provider);
      setSocialLoading(null);
      setSuccess(true);
      addToast('success', `Signed in as ${user.name}!`);
      setTimeout(() => navigate('/dashboard'), 1800);
    }, 1400);
  };

  const fillDemo = () => {
    setEmail(DEMO_CREDENTIALS.email);
    setPassword(DEMO_CREDENTIALS.password);
    addToast('info', 'Demo credentials filled — click Sign In!');
  };

  return (
    <div className="min-h-screen flex" style={{ background: '#04040c' }}>
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {/* LEFT PANEL */}
      <div className="hidden lg:flex w-[60%] relative overflow-hidden flex-col">
        <div className="absolute inset-0">
          <NeuralCanvas />
        </div>
        <div
          className="absolute inset-0 z-10 scanlines"
          style={{
            background: 'radial-gradient(ellipse at center, transparent 30%, #04040c 90%)',
          }}
        />
        <div className="relative z-20 flex flex-col justify-between h-full p-12">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <NeuroLogo />
            <p className="mt-2 font-mono text-xs tracking-[0.3em] uppercase text-muted-foreground">
              Knowledge OS · Premium
            </p>
          </motion.div>

          <div className="flex flex-col gap-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
              <TypewriterEffect />
            </motion.div>

            <motion.div
              className="flex flex-wrap gap-2"
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
            >
              {['🧩 Tag Graphs', '🤖 AI Assistant', '🌐 Public Pages', '🧬 Note DNA'].map((pill) => (
                <span
                  key={pill}
                  className="px-3 py-1.5 rounded-full font-mono text-xs tracking-wider border"
                  style={{
                    background: 'hsl(263 69% 58% / 0.1)',
                    borderColor: 'hsl(263 69% 58% / 0.3)',
                    color: '#a78bfa',
                  }}
                >
                  {pill}
                </span>
              ))}
            </motion.div>
          </div>

          <motion.p
            className="text-sm italic text-muted-foreground"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}
          >
            "Your second brain, finally worth using."
          </motion.p>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div
        className="flex-1 flex flex-col justify-center p-8 lg:p-12 relative overflow-hidden"
        style={{ background: '#07070f' }}
      >
        <div
          className="absolute -top-32 -right-32 w-64 h-64 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, hsl(263 69% 58% / 0.08) 0%, transparent 70%)' }}
        />
        <div
          className="absolute -bottom-32 -left-32 w-64 h-64 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, hsl(189 95% 43% / 0.06) 0%, transparent 70%)' }}
        />

        <div className="relative z-10 max-w-sm w-full mx-auto">
          {/* Mobile logo */}
          <div className="lg:hidden mb-8">
            <NeuroLogo />
          </div>

          {/* Demo credentials banner */}
          {mode !== 'reset' && (
            <motion.button
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={fillDemo}
              className="w-full mb-6 px-4 py-2.5 rounded-xl font-mono text-xs flex items-center justify-between group transition-all"
              style={{
                background: 'hsl(263 69% 58% / 0.07)',
                border: '1px dashed hsl(263 69% 58% / 0.35)',
                color: '#a78bfa',
              }}
            >
              <span>✦ Demo: demo@neuronotes.app / demo1234</span>
              <span className="opacity-60 group-hover:opacity-100 transition-opacity text-xs">Fill →</span>
            </motion.button>
          )}

          {/* Tab toggle */}
          {mode !== 'reset' && (
            <div
              className="flex rounded-xl p-1 mb-8"
              style={{ background: 'hsl(240 50% 7%)' }}
            >
              {(['signin', 'signup'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setMode(tab)}
                  className="flex-1 py-2 rounded-lg font-mono text-sm font-medium transition-all duration-200"
                  style={{
                    background: mode === tab ? 'linear-gradient(135deg, #7c3aed, #6d28d9)' : 'transparent',
                    color: mode === tab ? '#f1f5f9' : '#475569',
                    boxShadow: mode === tab ? '0 2px 12px hsl(263 69% 58% / 0.3)' : 'none',
                  }}
                >
                  {tab === 'signin' ? 'Sign In' : 'Sign Up'}
                </button>
              ))}
            </div>
          )}

          {mode === 'reset' && (
            <div className="mb-8">
              <h2 className="text-2xl font-serif italic text-foreground mb-1">Reset Password</h2>
              <p className="text-sm text-muted-foreground font-mono">Enter your email to receive a reset link</p>
            </div>
          )}

          {/* Social login */}
          {mode !== 'reset' && (
            <div className="flex gap-3 mb-6">
              {[
                { icon: <Chrome size={16} />, label: 'Google', provider: 'google' as const },
                { icon: <Github size={16} />, label: 'GitHub', provider: 'github' as const },
                { icon: <Apple size={16} />, label: 'Apple', provider: 'apple' as const },
              ].map((btn) => (
                <button
                  key={btn.label}
                  onClick={() => handleSocial(btn.provider)}
                  disabled={!!socialLoading}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-mono text-xs font-medium border transition-all duration-200 hover:border-primary/50 disabled:opacity-50"
                  style={{
                    background: socialLoading === btn.provider ? 'hsl(263 69% 58% / 0.12)' : 'hsl(240 50% 7%)',
                    borderColor: socialLoading === btn.provider ? 'hsl(263 69% 58% / 0.5)' : 'hsl(240 20% 14%)',
                    color: socialLoading === btn.provider ? '#a78bfa' : '#94a3b8',
                  }}
                >
                  {socialLoading === btn.provider ? (
                    <span className="w-3.5 h-3.5 border-2 border-violet-400/30 border-t-violet-400 rounded-full animate-spin" />
                  ) : btn.icon}
                  <span>{socialLoading === btn.provider ? '...' : btn.label}</span>
                </button>
              ))}
            </div>
          )}

          {mode !== 'reset' && (
            <div className="flex items-center gap-3 mb-6">
              <div className="flex-1 h-px" style={{ background: 'hsl(240 20% 14%)' }} />
              <span className="font-mono text-xs text-muted-foreground">or continue with email</span>
              <div className="flex-1 h-px" style={{ background: 'hsl(240 20% 14%)' }} />
            </div>
          )}

          {/* Form */}
          <AnimatePresence mode="wait">
            {success ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-8 flex flex-col items-center gap-4"
              >
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center text-2xl"
                  style={{ background: 'linear-gradient(135deg, #7c3aed, #06b6d4)' }}
                >
                  ✓
                </div>
                <h3 className="text-xl font-serif italic text-foreground">Welcome to NeuroNotes</h3>
                <div
                  className="w-full h-1 rounded-full overflow-hidden"
                  style={{ background: 'hsl(240 20% 14%)' }}
                >
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: 'linear-gradient(90deg, #7c3aed, #06b6d4)' }}
                    initial={{ width: '0%' }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 1.8, ease: 'linear' }}
                  />
                </div>
              </motion.div>
            ) : (
              <motion.form
                key={mode}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                onSubmit={handleSubmit}
                className="space-y-4"
              >
                {mode === 'signup' && (
                  <div>
                    <label className="block font-mono text-xs uppercase tracking-widest text-muted-foreground mb-2">
                      ✦ Full Name
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your full name"
                      className="w-full rounded-xl px-4 py-3 font-mono text-sm text-foreground placeholder:text-muted-foreground/50 outline-none transition-all duration-200"
                      style={{ background: 'hsl(240 50% 7%)', border: '1px solid hsl(240 20% 14%)' }}
                      onFocus={(e) => { e.currentTarget.style.borderColor = 'hsl(263 69% 58% / 0.5)'; }}
                      onBlur={(e) => { e.currentTarget.style.borderColor = 'hsl(240 20% 14%)'; }}
                    />
                  </div>
                )}

                <div>
                  <label className="block font-mono text-xs uppercase tracking-widest text-muted-foreground mb-2">
                    @ Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="w-full rounded-xl px-4 py-3 font-mono text-sm text-foreground placeholder:text-muted-foreground/50 outline-none transition-all duration-200"
                    style={{ background: 'hsl(240 50% 7%)', border: '1px solid hsl(240 20% 14%)' }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = 'hsl(263 69% 58% / 0.5)'; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = 'hsl(240 20% 14%)'; }}
                  />
                </div>

                {mode !== 'reset' && (
                  <div>
                    <label className="block font-mono text-xs uppercase tracking-widest text-muted-foreground mb-2">
                      ⬡ Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••••••"
                        required
                        className="w-full rounded-xl px-4 py-3 pr-12 font-mono text-sm text-foreground placeholder:text-muted-foreground/50 outline-none transition-all duration-200"
                        style={{ background: 'hsl(240 50% 7%)', border: '1px solid hsl(240 20% 14%)' }}
                        onFocus={(e) => { e.currentTarget.style.borderColor = 'hsl(263 69% 58% / 0.5)'; }}
                        onBlur={(e) => { e.currentTarget.style.borderColor = 'hsl(240 20% 14%)'; }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                )}

                {mode === 'signin' && (
                  <div className="text-right">
                    <button
                      type="button"
                      onClick={() => setMode('reset')}
                      className="font-mono text-xs text-primary hover:text-primary-light transition-colors"
                    >
                      Forgot password?
                    </button>
                  </div>
                )}

                {mode === 'reset' && (
                  <button
                    type="button"
                    onClick={() => setMode('signin')}
                    className="font-mono text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    ← Back to sign in
                  </button>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-xl font-mono text-sm font-semibold text-white relative overflow-hidden transition-all duration-200 btn-shimmer mt-2"
                  style={{
                    background: loading
                      ? 'hsl(263 69% 40%)'
                      : 'linear-gradient(135deg, #7c3aed, #6d28d9, #4c1d95)',
                    boxShadow: '0 4px 24px hsl(263 69% 58% / 0.27), 0 0 0 1px hsl(263 69% 58% / 0.13)',
                  }}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Connecting neurons...
                    </span>
                  ) : mode === 'signin' ? 'Sign In to NeuroNotes'
                    : mode === 'signup' ? 'Create your NeuroNotes'
                    : 'Send Reset Link'}
                </button>
              </motion.form>
            )}
          </AnimatePresence>

          {!success && (
            <div className="flex items-center justify-center gap-4 mt-6">
              {['🔒 AES-256', '⚡ <50ms', '🌍 99.9%'].map((badge) => (
                <span key={badge} className="font-mono text-xs text-muted-foreground">
                  {badge}
                </span>
              ))}
            </div>
          )}

          {mode === 'signup' && !success && (
            <p className="text-center font-mono text-xs text-muted-foreground mt-4">
              By signing up, you agree to our{' '}
              <span className="text-primary cursor-pointer">Terms</span> &{' '}
              <span className="text-primary cursor-pointer">Privacy Policy</span>
            </p>
          )}

          {!success && (
            <p className="text-center font-mono text-xs text-muted-foreground mt-4">
              {mode === 'signin' ? "Don't have an account? " : "Already have an account? "}
              <button
                type="button"
                onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
                className="text-primary hover:text-primary-light transition-colors"
              >
                {mode === 'signin' ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
