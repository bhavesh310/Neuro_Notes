import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, FileText, Share2, Settings,
  Tag, BookOpen, Menu, X, ChevronLeft, Brain, Plus,
  Bell, Search, Command
} from 'lucide-react';
import { MOCK_USER } from '@/lib/types';
import { getStoredUser } from '@/lib/auth';

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: FileText, label: 'All Notes', path: '/notes' },
  { icon: Brain, label: 'Knowledge Graph', path: '/graph' },
  { icon: Tag, label: 'Tag Explorer', path: '/tags' },
  { icon: BookOpen, label: 'Collections', path: '/collections' },
];

const BOTTOM_ITEMS = [
  { icon: Settings, label: 'Settings', path: '/settings' },
];

function SidebarLink({ item, collapsed }: { item: typeof NAV_ITEMS[0]; collapsed: boolean }) {
  const location = useLocation();
  const isActive = location.pathname === item.path;

  return (
    <Link
      to={item.path}
      className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative"
      style={{
        background: isActive ? 'hsl(263 69% 58% / 0.12)' : 'transparent',
        borderLeft: isActive ? '2px solid hsl(263 69% 58%)' : '2px solid transparent',
        color: isActive ? '#a78bfa' : '#475569',
      }}
      onMouseEnter={(e) => {
        if (!isActive) {
          (e.currentTarget as HTMLElement).style.background = 'hsl(263 69% 58% / 0.06)';
          (e.currentTarget as HTMLElement).style.color = '#94a3b8';
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          (e.currentTarget as HTMLElement).style.background = 'transparent';
          (e.currentTarget as HTMLElement).style.color = '#475569';
        }
      }}
    >
      <item.icon size={18} className="flex-shrink-0" />
      {!collapsed && (
        <span className="font-mono text-sm font-medium truncate">{item.label}</span>
      )}
      {isActive && !collapsed && (
        <div
          className="ml-auto w-1.5 h-1.5 rounded-full animate-pulse-dot"
          style={{ background: '#7c3aed' }}
        />
      )}
    </Link>
  );
}

interface LayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: LayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [search, setSearch] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (location.pathname === '/notes') {
      const q = new URLSearchParams(location.search).get('q') || '';
      setSearch(q);
    }
  }, [location.pathname, location.search]);

  const runSearch = (q: string) => {
    setSearch(q);
    const params = new URLSearchParams();
    if (q.trim()) params.set('q', q.trim());
    navigate(`/notes${params.toString() ? `?${params}` : ''}`);
  };

  return (
    <div className="min-h-screen flex" style={{ background: '#04040c' }}>
      {/* Mobile overlay */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          style={{ background: 'hsl(240 50% 3% / 0.8)', backdropFilter: 'blur(4px)' }}
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <motion.aside
        animate={{ width: sidebarCollapsed ? 64 : 240 }}
        transition={{ duration: 0.25, ease: 'easeInOut' }}
        className="hidden lg:flex flex-col flex-shrink-0 h-screen sticky top-0 overflow-hidden border-r z-30"
        style={{
          background: '#07070f',
          borderColor: 'hsl(240 20% 14%)',
        }}
      >
        {/* Logo */}
        <Link
          to="/dashboard"
          className="flex items-center gap-3 px-4 py-5 border-b transition-opacity hover:opacity-80"
          style={{ borderColor: 'hsl(240 20% 14%)' }}
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-base flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #4c1d95)' }}
          >
            🧠
          </div>
          {!sidebarCollapsed && (
            <div className="font-serif text-lg">
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
          )}
        </Link>

        {/* Nav items */}
        <nav className="flex-1 p-3 flex flex-col gap-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => (
            <SidebarLink key={item.path} item={item} collapsed={sidebarCollapsed} />
          ))}

          {!sidebarCollapsed && (
            <div className="my-2 h-px" style={{ background: 'hsl(240 20% 14%)' }} />
          )}

          {BOTTOM_ITEMS.map((item) => (
            <SidebarLink key={item.path} item={item} collapsed={sidebarCollapsed} />
          ))}
        </nav>

        {/* User + Collapse */}
        <div className="p-3 border-t space-y-2" style={{ borderColor: 'hsl(240 20% 14%)' }}>
          {!sidebarCollapsed && (() => {
            const u = getStoredUser();
            const displayName = u?.name || MOCK_USER.name;
            const plan = u?.plan || MOCK_USER.plan;
            const initial = (displayName[0] || 'U').toUpperCase();
            return (
              <div className="flex items-center gap-3 px-2 py-2 rounded-xl" style={{ background: 'hsl(240 50% 7%)' }}>
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 overflow-hidden"
                  style={{ background: 'linear-gradient(135deg, #7c3aed, #06b6d4)' }}
                >
                  {u?.avatar ? (
                    <img src={u.avatar} alt={displayName} className="w-full h-full object-cover" />
                  ) : (
                    initial
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-xs font-semibold text-foreground truncate">{displayName}</p>
                  <p className="font-mono text-xs text-muted-foreground capitalize">{plan} plan</p>
                </div>
              </div>
            );
          })()}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="w-full flex items-center justify-center py-2 rounded-xl transition-colors hover:bg-white/5 text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft size={16} className={`transition-transform duration-300 ${sidebarCollapsed ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </motion.aside>

      {/* Mobile sidebar */}
      <motion.aside
        animate={{ x: mobileSidebarOpen ? 0 : -280 }}
        initial={{ x: -280 }}
        transition={{ duration: 0.25, ease: 'easeInOut' }}
        className="fixed left-0 top-0 bottom-0 w-64 z-50 lg:hidden flex flex-col border-r"
        style={{ background: '#07070f', borderColor: 'hsl(240 20% 14%)' }}
      >
        <div className="flex items-center justify-between px-4 py-5 border-b" style={{ borderColor: 'hsl(240 20% 14%)' }}>
          <Link
            to="/dashboard"
            className="font-serif text-lg transition-opacity hover:opacity-80"
            onClick={() => setMobileSidebarOpen(false)}
          >
            <span className="italic">Neuro</span>
            <span style={{ background: 'linear-gradient(135deg, #a78bfa, #06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', fontWeight: 700 }}>Notes</span>
          </Link>
          <button onClick={() => setMobileSidebarOpen(false)} className="text-muted-foreground">
            <X size={18} />
          </button>
        </div>
        <nav className="flex-1 p-3 flex flex-col gap-1">
          {[...NAV_ITEMS, ...BOTTOM_ITEMS].map((item) => (
            <SidebarLink key={item.path} item={item} collapsed={false} />
          ))}
        </nav>
      </motion.aside>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Nav */}
        <header
          className="sticky top-0 z-20 flex items-center gap-4 px-4 lg:px-6 h-14 border-b"
          style={{
            background: 'hsl(240 50% 3% / 0.95)',
            backdropFilter: 'blur(16px)',
            borderColor: 'hsl(240 20% 14%)',
          }}
        >
          <button
            onClick={() => setMobileSidebarOpen(true)}
            className="lg:hidden text-muted-foreground hover:text-foreground"
          >
            <Menu size={20} />
          </button>

          {/* Search */}
          <form
            onSubmit={(e) => { e.preventDefault(); runSearch(search); }}
            className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl max-w-sm group"
            style={{ background: 'hsl(240 50% 7%)', border: '1px solid hsl(240 20% 14%)' }}
          >
            <Search size={14} className="text-muted-foreground" />
            <input
              ref={searchRef}
              value={search}
              onChange={(e) => runSearch(e.target.value)}
              placeholder="Search notes..."
              className="flex-1 bg-transparent font-mono text-sm text-foreground placeholder:text-muted-foreground outline-none"
            />
            <div
              className="flex items-center gap-1 px-1.5 py-0.5 rounded-md"
              style={{ background: 'hsl(240 20% 14%)' }}
            >
              <Command size={10} className="text-muted-foreground" />
              <span className="font-mono text-xs text-muted-foreground">K</span>
            </div>
          </form>

          <div className="ml-auto flex items-center gap-3">
            <Link
              to="/editor/new"
              className="flex items-center gap-2 px-4 py-2 rounded-xl font-mono text-sm font-semibold relative overflow-hidden btn-shimmer"
              style={{
                background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
                color: '#f1f5f9',
                boxShadow: '0 2px 16px hsl(263 69% 58% / 0.25)',
              }}
            >
              <Plus size={16} />
              <span className="hidden sm:inline">New Note</span>
            </Link>

            <button className="relative text-muted-foreground hover:text-foreground transition-colors">
              <Bell size={18} />
              <span
                className="absolute -top-1 -right-1 w-2 h-2 rounded-full"
                style={{ background: '#7c3aed' }}
              />
            </button>

            {(() => {
              const u = getStoredUser();
              const displayName = u?.name || MOCK_USER.name;
              const initial = (displayName[0] || 'U').toUpperCase();
              return (
                <Link
                  to="/settings"
                  aria-label="Account settings"
                  title={displayName}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold cursor-pointer overflow-hidden ring-1 ring-transparent hover:ring-white/20 transition"
                  style={{ background: 'linear-gradient(135deg, #7c3aed, #06b6d4)', color: '#f1f5f9' }}
                >
                  {u?.avatar ? (
                    <img src={u.avatar} alt={displayName} className="w-full h-full object-cover" />
                  ) : (
                    initial
                  )}
                </Link>
              );
            })()}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}