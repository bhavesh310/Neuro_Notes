import { useMemo, useSyncExternalStore } from 'react';

export type StoredNote = {
  id: string;
  title?: string;
  content?: string;
  tags?: string[];
  createdAt?: string;
  updatedAt?: string;
};

const KEY = 'neuronotes_notes';

function read(): StoredNote[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function subscribe(cb: () => void) {
  const onStorage = (e: StorageEvent) => { if (e.key === KEY) cb(); };
  window.addEventListener('storage', onStorage);
  window.addEventListener('neuronotes:notes-changed', cb);
  return () => {
    window.removeEventListener('storage', onStorage);
    window.removeEventListener('neuronotes:notes-changed', cb);
  };
}

export function useStoredNotes(): StoredNote[] {
  const json = useSyncExternalStore(
    subscribe,
    () => localStorage.getItem(KEY) ?? '',
    () => '',
  );
  return useMemo(() => {
    try { return json ? (JSON.parse(json) as StoredNote[]) : []; } catch { return []; }
  }, [json]);
}

export function deleteNote(id: string) {
  try {
    const list = read().filter((n) => n.id !== id);
    localStorage.setItem(KEY, JSON.stringify(list));
    window.dispatchEvent(new Event('neuronotes:notes-changed'));
  } catch (e) {
    console.error('Delete failed', e);
  }
}

export function clearAllNotes() {
  try {
    localStorage.setItem(KEY, JSON.stringify([]));
    window.dispatchEvent(new Event('neuronotes:notes-changed'));
  } catch (e) {
    console.error('Clear failed', e);
  }
}

export function exportNotes(): string {
  return JSON.stringify(read(), null, 2);
}

export type AiSuggestion = {
  kind: 'continue' | 'dormant' | 'related' | 'summary' | 'empty';
  title: string;
  note: string;
  desc: string;
  noteId?: string;
};

const STOP = new Set(['the','a','an','and','or','but','of','to','in','on','for','with','is','are','was','were','be','this','that','it','as','at','by','from','your','you','my','i','we','they','he','she','will','would','can','could','if','so','not','no','do','does','did','have','has','had','about','what','how','when','why','where','one','two','some','any','all','more','than','then','also','just','out','up','down','into','over','very','really']);

function keywords(text: string, max = 6): string[] {
  const counts = new Map<string, number>();
  for (const word of (text || '').toLowerCase().match(/[a-z][a-z'-]{3,}/g) ?? []) {
    if (STOP.has(word)) continue;
    counts.set(word, (counts.get(word) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, max).map(([w]) => w);
}

export function buildAiSuggestions(notes: StoredNote[], currentDraft = ''): AiSuggestion[] {
  if (!notes.length && !currentDraft.trim()) {
    return [{
      kind: 'empty',
      title: 'Start writing',
      note: 'No history yet',
      desc: 'Suggestions appear as you write notes',
    }];
  }

  const out: AiSuggestion[] = [];
  const now = Date.now();
  const sorted = [...notes].sort((a, b) => {
    const ta = new Date(a.updatedAt || a.createdAt || 0).getTime();
    const tb = new Date(b.updatedAt || b.createdAt || 0).getTime();
    return tb - ta;
  });

  // Continue last note (or related to current draft)
  const last = sorted[0];
  if (currentDraft.trim()) {
    const draftKw = new Set(keywords(currentDraft));
    let best: { note: StoredNote; score: number } | null = null;
    for (const n of sorted) {
      const kw = keywords(`${n.title ?? ''} ${n.content ?? ''}`);
      const score = kw.filter((k) => draftKw.has(k)).length;
      if (score > 0 && (!best || score > best.score)) best = { note: n, score };
    }
    if (best) {
      out.push({
        kind: 'related',
        title: 'Related to what you\'re writing',
        note: best.note.title || 'Untitled',
        desc: `Shares ${best.score} key idea${best.score > 1 ? 's' : ''} with your draft`,
        noteId: best.note.id,
      });
    }
  } else if (last) {
    out.push({
      kind: 'continue',
      title: 'Continue this idea →',
      note: last.title || 'Untitled',
      desc: 'Pick up where you left off',
      noteId: last.id,
    });
  }

  // Dormant note
  const dormant = sorted.find((n) => {
    const t = new Date(n.updatedAt || n.createdAt || 0).getTime();
    return t && (now - t) > 14 * 24 * 60 * 60 * 1000;
  });
  if (dormant) {
    const days = Math.floor((now - new Date(dormant.updatedAt || dormant.createdAt || 0).getTime()) / (24 * 60 * 60 * 1000));
    out.push({
      kind: 'dormant',
      title: `${days} days dormant`,
      note: dormant.title || 'Untitled',
      desc: 'Revisit your past thoughts',
      noteId: dormant.id,
    });
  }

  // Related cluster from history
  if (sorted.length >= 2) {
    const allKw = keywords(sorted.map((n) => `${n.title ?? ''} ${n.content ?? ''}`).join(' '), 3);
    if (allKw.length) {
      out.push({
        kind: 'related',
        title: 'Recurring theme',
        note: allKw.map((w) => w[0].toUpperCase() + w.slice(1)).join(' · '),
        desc: 'You keep coming back to these',
      });
    }
  }

  // Weekly summary
  const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
  const weekCount = sorted.filter((n) => new Date(n.updatedAt || n.createdAt || 0).getTime() >= weekAgo).length;
  if (weekCount > 0) {
    out.push({
      kind: 'summary',
      title: 'This week',
      note: `${weekCount} note${weekCount === 1 ? '' : 's'} captured`,
      desc: 'AI-generated digest ready',
    });
  }

  return out.length ? out : [{
    kind: 'empty',
    title: 'Keep writing',
    note: 'Suggestions warming up',
    desc: 'Add a few more notes to unlock insights',
  }];
}
