import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import AppLayout from '@/components/AppLayout';
import { User, Bell, Palette, Shield, Puzzle, CreditCard, Trash2, Camera, Check } from 'lucide-react';
import { MOCK_USER } from '@/lib/types';
import { getStoredUser, storeUser, clearUser } from '@/lib/auth';
import { readPrefs, writePrefs } from '@/lib/settings';
import { useStoredNotes, clearAllNotes, exportNotes } from '@/lib/notesStore';

const SETTINGS_TABS = [
  { id: 'profile', icon: User, label: 'Profile' },
  { id: 'notifications', icon: Bell, label: 'Notifications' },
  { id: 'appearance', icon: Palette, label: 'Appearance' },
  { id: 'security', icon: Shield, label: 'Security & Privacy' },
  { id: 'integrations', icon: Puzzle, label: 'Integrations' },
  { id: 'subscription', icon: CreditCard, label: 'Subscription' },
  { id: 'danger', icon: Trash2, label: 'Danger Zone' },
];

const SUBSCRIPTION_PLANS = [
  { name: 'Free', price: '$0', period: '/mo', color: '#475569', popular: false, features: ['50 notes', 'Basic editor', '1 public link', 'Tag system', 'Mobile app'] },
  { name: 'Pro', price: '$9', period: '/mo', color: '#7c3aed', popular: true, features: ['Unlimited notes', 'AI features', 'Voice-to-Note', 'Analytics', 'Note themes', 'Focus Mode', 'Pomodoro timer', 'Priority support'] },
  { name: 'Team', price: '$19', period: '/mo', color: '#06b6d4', popular: false, features: ['All Pro features', 'Collaborative Brain', 'Encrypted Vault', 'Live Widgets', 'Time Capsule', 'Team analytics', 'SSO'] },
];

const NOTE_THEMES = [
  { id: 'void', name: 'Void Black', color: '#04040c' },
  { id: 'academia', name: 'Dark Academia', color: '#1a1205' },
  { id: 'cyberpunk', name: 'Cyberpunk', color: '#0a0a1a' },
  { id: 'zen', name: 'Minimal Zen', color: '#0d0d0d' },
  { id: 'forest', name: 'Forest', color: '#0a150a' },
  { id: 'ocean', name: 'Ocean', color: '#050d14' },
  { id: 'aurora', name: 'Aurora', color: '#07050f' },
  { id: 'ink', name: 'Printer Ink', color: '#111111' },
];

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className="w-10 h-6 rounded-full relative transition-colors"
      style={{ background: checked ? '#7c3aed' : 'hsl(240 20% 18%)' }}
      aria-pressed={checked}
    >
      <span
        className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all"
        style={{ left: checked ? '18px' : '2px' }}
      />
    </button>
  );
}

export default function Settings() {
  const navigate = useNavigate();
  const stored = getStoredUser();
  const [activeTab, setActiveTab] = useState('profile');

  const [name, setName] = useState(stored?.name || MOCK_USER.name);
  const [username, setUsername] = useState((stored as any)?.username || MOCK_USER.username);
  const [email, setEmail] = useState(stored?.email || MOCK_USER.email);
  const [bio, setBio] = useState((stored as any)?.bio || MOCK_USER.bio || '');
  const [avatar, setAvatar] = useState<string | undefined>(stored?.avatar);
  const [saved, setSaved] = useState(false);

  const [prefs, setPrefs] = useState(() => readPrefs());
  const notes = useStoredNotes();

  useEffect(() => {
    document.documentElement.style.setProperty('--editor-font-size', `${prefs.fontSize}px`);
  }, [prefs.fontSize]);

  const updatePrefs = (next: Partial<typeof prefs>) => {
    const merged = { ...prefs, ...next } as typeof prefs;
    setPrefs(merged);
    writePrefs(merged);
  };

  const handleAvatarPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setAvatar(String(reader.result));
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = () => {
    const next = {
      id: stored?.id || `user-${Date.now()}`,
      name: name.trim() || 'Anonymous',
      email,
      avatar,
      provider: stored?.provider || 'email',
      // extras (not in AuthUser type but stored)
      username,
      bio,
    } as any;
    storeUser(next);
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  };

  const handleExport = () => {
    const blob = new Blob([exportNotes()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `neuronotes-export-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const handleDeleteAllNotes = () => {
    if (window.confirm(`Delete all ${notes.length} notes? This cannot be undone.`)) {
      clearAllNotes();
    }
  };

  const handleDeleteAccount = () => {
    if (window.confirm('Permanently delete your account and all notes? This cannot be undone.')) {
      clearAllNotes();
      clearUser();
      navigate('/');
    }
  };

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto px-4 lg:px-8 py-8">
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-3xl font-serif italic text-foreground">Settings</h1>
          <p className="font-mono text-sm text-muted-foreground mt-1">Manage your NeuroNotes experience</p>
        </motion.div>

        <div className="flex gap-8">
          <aside className="w-52 flex-shrink-0">
            <nav className="space-y-1">
              {SETTINGS_TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-mono text-sm transition-all"
                  style={{
                    background: activeTab === tab.id ? 'hsl(263 69% 58% / 0.12)' : 'transparent',
                    borderLeft: `2px solid ${activeTab === tab.id ? '#7c3aed' : 'transparent'}`,
                    color: activeTab === tab.id ? '#a78bfa' : '#475569',
                  }}
                >
                  <tab.icon size={16} />
                  {tab.label}
                </button>
              ))}
            </nav>
          </aside>

          <div className="flex-1">
            {activeTab === 'profile' && (
              <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                <div className="p-6 rounded-2xl space-y-6" style={{ background: '#07070f', border: '1px solid hsl(240 20% 14%)' }}>
                  <h2 className="font-serif italic text-xl text-foreground">Profile</h2>

                  <div className="flex items-center gap-5">
                    <label className="relative group cursor-pointer">
                      <div
                        className="w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-bold overflow-hidden"
                        style={{ background: avatar ? `center/cover no-repeat url(${avatar})` : 'linear-gradient(135deg, #7c3aed, #06b6d4)' }}
                      >
                        {!avatar && (name[0] || '?').toUpperCase()}
                      </div>
                      <div className="absolute inset-0 rounded-2xl bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Camera size={20} className="text-white" />
                      </div>
                      <input type="file" accept="image/*" className="hidden" onChange={handleAvatarPick} />
                    </label>
                    <div>
                      <p className="font-mono text-sm text-foreground font-semibold">{name}</p>
                      <p className="font-mono text-xs text-muted-foreground">Click to upload avatar</p>
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    {[
                      { label: 'Full Name', value: name, onChange: setName, placeholder: 'Your name' },
                      { label: 'Username', value: username, onChange: setUsername, placeholder: '@username' },
                      { label: 'Email', value: email, onChange: setEmail, placeholder: 'you@example.com' },
                    ].map((field) => (
                      <div key={field.label}>
                        <label className="block font-mono text-xs uppercase tracking-widest text-muted-foreground mb-2">{field.label}</label>
                        <input
                          value={field.value}
                          onChange={(e) => field.onChange(e.target.value)}
                          placeholder={field.placeholder}
                          className="w-full rounded-xl px-4 py-3 font-mono text-sm text-foreground outline-none"
                          style={{ background: 'hsl(240 50% 7%)', border: '1px solid hsl(240 20% 14%)' }}
                        />
                      </div>
                    ))}
                  </div>

                  <div>
                    <label className="block font-mono text-xs uppercase tracking-widest text-muted-foreground mb-2">Bio</label>
                    <textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      rows={3}
                      className="w-full rounded-xl px-4 py-3 font-mono text-sm text-foreground outline-none resize-none"
                      style={{ background: 'hsl(240 50% 7%)', border: '1px solid hsl(240 20% 14%)' }}
                    />
                  </div>

                  <button
                    onClick={handleSaveProfile}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-mono text-sm font-semibold btn-shimmer"
                    style={{
                      background: saved ? '#22c55e22' : 'linear-gradient(135deg, #7c3aed, #6d28d9)',
                      color: saved ? '#22c55e' : '#f1f5f9',
                    }}
                  >
                    {saved ? <><Check size={14} /> Saved</> : 'Save Changes'}
                  </button>
                </div>
              </motion.div>
            )}

            {activeTab === 'notifications' && (
              <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                <div className="p-6 rounded-2xl space-y-4" style={{ background: '#07070f', border: '1px solid hsl(240 20% 14%)' }}>
                  <h2 className="font-serif italic text-xl text-foreground">Notifications</h2>
                  {[
                    { key: 'weeklyDigest', label: 'Weekly digest', desc: 'A summary of your week of notes' },
                    { key: 'reminders', label: 'Note reminders', desc: 'Resurface dormant notes you might revisit' },
                    { key: 'collabPings', label: 'Collaboration pings', desc: 'Mentions and comments from teammates' },
                    { key: 'productUpdates', label: 'Product updates', desc: 'Occasional news about new features' },
                  ].map((row) => (
                    <div key={row.key} className="flex items-center justify-between p-4 rounded-xl" style={{ background: 'hsl(240 50% 7%)', border: '1px solid hsl(240 20% 14%)' }}>
                      <div>
                        <p className="font-mono text-sm font-semibold text-foreground">{row.label}</p>
                        <p className="font-mono text-xs text-muted-foreground mt-0.5">{row.desc}</p>
                      </div>
                      <Toggle
                        checked={(prefs.notifications as any)[row.key]}
                        onChange={(v) => updatePrefs({ notifications: { ...prefs.notifications, [row.key]: v } as any })}
                      />
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'appearance' && (
              <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                <div className="p-6 rounded-2xl space-y-6" style={{ background: '#07070f', border: '1px solid hsl(240 20% 14%)' }}>
                  <h2 className="font-serif italic text-xl text-foreground">Appearance</h2>

                  <div className="space-y-3">
                    <label className="block font-mono text-xs uppercase tracking-widest text-muted-foreground">Note Skin</label>
                    <div className="grid grid-cols-4 gap-3">
                      {NOTE_THEMES.map((theme) => (
                        <button
                          key={theme.id}
                          onClick={() => updatePrefs({ theme: theme.id })}
                          className="flex flex-col items-center gap-2 p-3 rounded-xl transition-all"
                          style={{
                            background: prefs.theme === theme.id ? 'hsl(263 69% 58% / 0.15)' : 'hsl(240 50% 7%)',
                            border: `1px solid ${prefs.theme === theme.id ? '#7c3aed66' : 'hsl(240 20% 14%)'}`,
                          }}
                        >
                          <div className="w-8 h-8 rounded-lg" style={{ background: theme.color, border: '1px solid #ffffff11' }} />
                          <span className="font-mono text-xs text-muted-foreground text-center leading-tight">{theme.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Font Size</label>
                      <span className="font-mono text-xs text-foreground">{prefs.fontSize}px</span>
                    </div>
                    <input
                      type="range"
                      min={14}
                      max={22}
                      value={prefs.fontSize}
                      onChange={(e) => updatePrefs({ fontSize: Number(e.target.value) })}
                      className="w-full accent-violet-500"
                    />
                    <p className="font-mono text-muted-foreground" style={{ fontSize: prefs.fontSize }}>
                      The quick brown fox jumps over the lazy dog.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <label className="block font-mono text-xs uppercase tracking-widest text-muted-foreground">Editor Width</label>
                    <div className="flex gap-3">
                      {(['Narrow', 'Medium', 'Wide'] as const).map((w) => (
                        <button
                          key={w}
                          onClick={() => updatePrefs({ editorWidth: w })}
                          className="flex-1 py-2 rounded-xl font-mono text-sm transition-all"
                          style={{
                            background: prefs.editorWidth === w ? 'hsl(263 69% 58% / 0.15)' : 'hsl(240 50% 7%)',
                            border: `1px solid ${prefs.editorWidth === w ? '#7c3aed55' : 'hsl(240 20% 14%)'}`,
                            color: prefs.editorWidth === w ? '#a78bfa' : '#475569',
                          }}
                        >
                          {w}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'subscription' && (
              <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                <div className="grid lg:grid-cols-3 gap-4">
                  {SUBSCRIPTION_PLANS.map((plan) => (
                    <div
                      key={plan.name}
                      className="rounded-2xl p-6 flex flex-col gap-4 relative overflow-hidden"
                      style={{ background: '#07070f', border: `1px solid ${plan.popular ? plan.color + '66' : 'hsl(240 20% 14%)'}` }}
                    >
                      {plan.popular && (
                        <>
                          <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: `linear-gradient(90deg, ${plan.color}, transparent)` }} />
                          <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full font-mono text-xs font-semibold" style={{ background: plan.color + '22', color: plan.color }}>
                            ⭐ Popular
                          </span>
                        </>
                      )}
                      <div>
                        <h3 className="font-mono text-lg font-bold" style={{ color: plan.color }}>{plan.name}</h3>
                        <div className="flex items-end gap-1 mt-2">
                          <span className="font-mono text-3xl font-bold text-foreground">{plan.price}</span>
                          <span className="font-mono text-sm text-muted-foreground mb-1">{plan.period}</span>
                        </div>
                      </div>
                      <ul className="space-y-2 flex-1">
                        {plan.features.map((f) => (
                          <li key={f} className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
                            <Check size={12} style={{ color: plan.color }} />
                            {f}
                          </li>
                        ))}
                      </ul>
                      <button
                        className="w-full py-2.5 rounded-xl font-mono text-sm font-semibold transition-all"
                        style={{
                          background: plan.popular ? `linear-gradient(135deg, ${plan.color}, ${plan.color}cc)` : 'hsl(240 50% 7%)',
                          color: plan.popular ? '#f1f5f9' : plan.color,
                          border: `1px solid ${plan.color}44`,
                        }}
                      >
                        {MOCK_USER.plan === plan.name.toLowerCase() ? 'Current Plan' : 'Upgrade'}
                      </button>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'danger' && (
              <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                <div className="p-6 rounded-2xl space-y-4" style={{ background: '#07070f', border: '1px solid hsl(0 84% 60% / 0.3)' }}>
                  <h2 className="font-serif italic text-xl font-semibold" style={{ color: '#ef4444' }}>Danger Zone</h2>
                  <p className="font-mono text-sm text-muted-foreground">These actions are irreversible. Proceed with caution.</p>
                  <div className="space-y-3 pt-2">
                    {[
                      { label: 'Export all data', desc: `Download all your ${notes.length} notes as JSON`, action: 'Export', safe: true, onClick: handleExport },
                      { label: 'Delete all notes', desc: `Permanently delete all ${notes.length} notes`, action: 'Delete notes', safe: false, onClick: handleDeleteAllNotes },
                      { label: 'Delete account', desc: 'Permanently remove your account and all data', action: 'Delete account', safe: false, onClick: handleDeleteAccount },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center justify-between p-4 rounded-xl" style={{ background: 'hsl(240 50% 7%)', border: '1px solid hsl(240 20% 14%)' }}>
                        <div>
                          <p className="font-mono text-sm font-semibold text-foreground">{item.label}</p>
                          <p className="font-mono text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                        </div>
                        <button
                          onClick={item.onClick}
                          className="px-4 py-2 rounded-lg font-mono text-sm font-semibold transition-all"
                          style={{
                            background: item.safe ? 'hsl(263 69% 58% / 0.1)' : 'hsl(0 84% 60% / 0.1)',
                            color: item.safe ? '#a78bfa' : '#ef4444',
                            border: `1px solid ${item.safe ? 'hsl(263 69% 58% / 0.3)' : 'hsl(0 84% 60% / 0.3)'}`,
                          }}
                        >
                          {item.action}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {['security', 'integrations'].includes(activeTab) && (
              <div className="flex items-center justify-center h-64 rounded-2xl" style={{ background: '#07070f', border: '1px solid hsl(240 20% 14%)' }}>
                <div className="text-center">
                  <p className="text-3xl mb-3">🔧</p>
                  <p className="font-mono text-sm text-muted-foreground">
                    {SETTINGS_TABS.find(t => t.id === activeTab)?.label} settings coming soon
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
