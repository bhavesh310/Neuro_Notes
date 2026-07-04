// NeuroNotes — Shared Types & Mock Data

export interface Note {
  id: string;
  title: string;
  content: string;
  preview: string;
  tags: Tag[];
  isPublic: boolean;
  slug: string;
  wordCount: number;
  createdAt: Date;
  updatedAt: Date;
  dnaSvg?: string;
  isTimeCapsule?: boolean;
  unlockAt?: Date;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
  count?: number;
  parentId?: string;
}

export interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  avatar?: string;
  bio?: string;
  plan: 'free' | 'pro' | 'team';
  streak: number;
}

export const TAG_COLORS: Record<string, string> = {
  ai: '#7c3aed',
  research: '#06b6d4',
  design: '#f59e0b',
  personal: '#22c55e',
  dev: '#ef4444',
  science: '#a78bfa',
  journal: '#f97316',
  business: '#3b82f6',
};

export const MOCK_TAGS: Tag[] = [
  { id: '1', name: 'AI', color: '#7c3aed', count: 24 },
  { id: '2', name: 'Research', color: '#06b6d4', count: 18 },
  { id: '3', name: 'Design', color: '#f59e0b', count: 12 },
  { id: '4', name: 'Personal', color: '#22c55e', count: 23 },
  { id: '5', name: 'Dev Notes', color: '#ef4444', count: 31 },
  { id: '6', name: 'Science', color: '#a78bfa', count: 8 },
  { id: '7', name: 'Journal', color: '#f97316', count: 15 },
  { id: '8', name: 'Business', color: '#3b82f6', count: 9 },
  { id: '9', name: 'Philosophy', color: '#ec4899', count: 6 },
  { id: '10', name: 'Ideas', color: '#14b8a6', count: 19 },
];

export const MOCK_NOTES: Note[] = [
  {
    id: '1',
    title: 'The Architecture of Thought',
    content: '',
    preview: 'Every idea is a node in an infinite graph. When we connect disparate concepts, we create new meaning that neither could hold alone...',
    tags: [MOCK_TAGS[0], MOCK_TAGS[1]],
    isPublic: true,
    slug: 'architecture-of-thought',
    wordCount: 1240,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-20'),
  },
  {
    id: '2',
    title: 'Building a Second Brain in 2024',
    content: '',
    preview: 'The challenge with knowledge management is not capturing information — it\'s building systems that allow ideas to collide and combine...',
    tags: [MOCK_TAGS[0], MOCK_TAGS[4]],
    isPublic: false,
    slug: 'second-brain-2024',
    wordCount: 892,
    createdAt: new Date('2024-01-18'),
    updatedAt: new Date('2024-01-22'),
  },
  {
    id: '3',
    title: 'Notes on Visual Design Systems',
    content: '',
    preview: 'Design systems are more than component libraries. They encode decisions, values, and a visual language that speaks before any word is read...',
    tags: [MOCK_TAGS[2], MOCK_TAGS[1]],
    isPublic: true,
    slug: 'visual-design-systems',
    wordCount: 2100,
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-19'),
  },
  {
    id: '4',
    title: 'Morning Pages — January',
    content: '',
    preview: 'Woke at 5am. The mind was quiet but not empty. Three thoughts arrived before the coffee brewed: what if knowledge had a shape?...',
    tags: [MOCK_TAGS[3], MOCK_TAGS[6]],
    isPublic: false,
    slug: 'morning-pages-jan',
    wordCount: 450,
    createdAt: new Date('2024-01-08'),
    updatedAt: new Date('2024-01-08'),
    isTimeCapsule: true,
    unlockAt: new Date('2025-12-25'),
  },
  {
    id: '5',
    title: 'LLMs and the Nature of Understanding',
    content: '',
    preview: 'What does it mean to understand? Large language models demonstrate that syntax and semantics can be separated in ways we hadn\'t imagined...',
    tags: [MOCK_TAGS[0], MOCK_TAGS[5]],
    isPublic: true,
    slug: 'llms-understanding',
    wordCount: 3400,
    createdAt: new Date('2024-01-05'),
    updatedAt: new Date('2024-01-21'),
  },
  {
    id: '6',
    title: 'Product Strategy Notes — Q1',
    content: '',
    preview: 'Key insight from this quarter: users don\'t want more features. They want fewer choices that feel more powerful...',
    tags: [MOCK_TAGS[7], MOCK_TAGS[4]],
    isPublic: false,
    slug: 'product-strategy-q1',
    wordCount: 1560,
    createdAt: new Date('2024-01-03'),
    updatedAt: new Date('2024-01-17'),
  },
];

export const MOCK_USER: User = {
  id: '1',
  name: 'Alex Mercer',
  username: 'alexmercer',
  email: 'alex@neuronotes.app',
  bio: 'Knowledge architect. Building my second brain in public.',
  plan: 'pro',
  streak: 7,
};

export function generateNoteDNA(note: Note): string {
  const colors = note.tags.length > 0
    ? note.tags.map(t => t.color)
    : ['#7c3aed', '#06b6d4'];
  const hash = note.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);

  const paths = Array.from({ length: 12 }, (_, i) => {
    const angle = (i / 12) * Math.PI * 2 + hash * 0.1;
    const r1 = 18 + (hash * (i + 1)) % 8;
    const r2 = 28 + (hash * (i + 2)) % 12;
    const x1 = 32 + Math.cos(angle) * r1;
    const y1 = 32 + Math.sin(angle) * r1;
    const x2 = 32 + Math.cos(angle + 0.5) * r2;
    const y2 = 32 + Math.sin(angle + 0.5) * r2;
    const color = colors[i % colors.length];
    return `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${color}" stroke-width="1.5" opacity="0.8"/>`;
  }).join('');

  return `<svg width="64" height="64" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><circle cx="32" cy="32" r="30" fill="none" stroke="${colors[0]}22" stroke-width="1"/>${paths}<circle cx="32" cy="32" r="4" fill="${colors[0]}"/></svg>`;
}
