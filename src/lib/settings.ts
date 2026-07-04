export type AppPrefs = {
  theme: string;
  fontSize: number;
  editorWidth: 'Narrow' | 'Medium' | 'Wide';
  notifications: {
    weeklyDigest: boolean;
    reminders: boolean;
    collabPings: boolean;
    productUpdates: boolean;
  };
};

const KEY = 'neuronotes_prefs';

const DEFAULTS: AppPrefs = {
  theme: 'void',
  fontSize: 17,
  editorWidth: 'Medium',
  notifications: {
    weeklyDigest: true,
    reminders: true,
    collabPings: true,
    productUpdates: false,
  },
};

export function readPrefs(): AppPrefs {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw);
    return { ...DEFAULTS, ...parsed, notifications: { ...DEFAULTS.notifications, ...(parsed.notifications || {}) } };
  } catch {
    return DEFAULTS;
  }
}

export function writePrefs(p: AppPrefs) {
  localStorage.setItem(KEY, JSON.stringify(p));
  window.dispatchEvent(new Event('neuronotes:prefs-changed'));
}
