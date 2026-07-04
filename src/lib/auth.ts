// Simple demo auth — no backend required

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  provider: 'email' | 'google' | 'github' | 'apple';
}

const STORAGE_KEY = 'neuronotes_user';

export const DEMO_CREDENTIALS = {
  email: 'demo@neuronotes.app',
  password: 'demo1234',
  user: {
    id: 'demo-user-1',
    name: 'Demo User',
    email: 'demo@neuronotes.app',
    provider: 'email' as const,
  },
};

export function getStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function storeUser(user: AuthUser) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
}

export function clearUser() {
  localStorage.removeItem(STORAGE_KEY);
}

export function signInWithEmail(email: string, password: string): AuthUser | null {
  const isDemo =
    email.trim().toLowerCase() === DEMO_CREDENTIALS.email &&
    password === DEMO_CREDENTIALS.password;
  if (isDemo) {
    storeUser(DEMO_CREDENTIALS.user);
    return DEMO_CREDENTIALS.user;
  }
  return null;
}

export function signUpWithEmail(name: string, email: string, _password: string): AuthUser {
  const user: AuthUser = {
    id: `user-${Date.now()}`,
    name: name || email.split('@')[0],
    email,
    provider: 'email',
  };
  storeUser(user);
  return user;
}

export function signInWithProvider(provider: 'google' | 'github' | 'apple'): AuthUser {
  const names: Record<string, string> = {
    google: 'Google User',
    github: 'GitHub User',
    apple: 'Apple User',
  };
  const user: AuthUser = {
    id: `${provider}-user-${Date.now()}`,
    name: names[provider],
    email: `user@${provider}.demo`,
    provider,
  };
  storeUser(user);
  return user;
}
