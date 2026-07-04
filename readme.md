
# 🧠 NeuroNotes

> Your second brain — an AI-powered note-taking app that helps you capture, organize, and connect ideas effortlessly.

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)

---

## Overview

**NeuroNotes** reimagines note-taking for the AI era. Write, dictate, and think
freely while an embedded AI assistant summarizes, expands, outlines, and
transforms your ideas in real time — all wrapped in a distraction-free, richly
styled editor built for focus.

**Live Demo →** [NeuroNotes](#)

---

## Tech Stack

| Layer | Technology | Reason |
|---|---|---|
| Frontend | React 18 + TypeScript | Type-safe component model |
| Build Tool | Vite 5 | Fast HMR, zero-config build |
| Styling | Tailwind CSS + shadcn/ui | Utility-first, accessible components |
| Routing | React Router DOM v6 | Declarative client-side routing |
| Rich Text Editor | Tiptap | Extensible, headless WYSIWYG editing |
| Animations | Framer Motion | Fluid, physics-based UI motion |
| Backend / DB | Supabase | Auth, database, and edge functions |
| AI Responses | Streaming (SSE) + react-markdown | Real-time, richly formatted AI replies |
| Voice Input | Web Speech API | Hands-free dictation into notes |
| Icons | Lucide React | Consistent, lightweight icon set |
| Package Manager | Bun / npm | Fast installs and scripts |

---

## Features

- **AI Assistant Panel** — Summarize, expand, outline, or rewrite any note with one click
- **Streaming AI Responses** — Replies appear token-by-token, rendered as rich markdown
- **Voice Dictation** — Speak your thoughts directly into a note with live transcription
- **Rich Text Editor** — Headings, lists, checklists, code blocks, highlights, and more
- **Tagging & Filtering** — Organize notes with color-coded tags and smart filters
- **List & Grid Views** — Browse your notes the way that fits your flow
- **Knowledge Graph** — Visualize connections between your notes and ideas
- **Responsive Design** — A focused writing experience on any device

---

## Project Structure
```
neuro-notes/
├── public/                  # Static assets (icons, favicon)
├── src/
│   ├── components/
│   │   ├── ui/               # shadcn/ui base components
│   │   ├── AppLayout.tsx     # Sidebar, top nav, and page shell
│   │   ├── NeuralCanvas.tsx  # Knowledge graph visualization
│   │   └── VoiceCapture.tsx  # Voice-to-text dictation widget
│   ├── hooks/                # Custom React hooks
│   ├── integrations/
│   │   └── supabase/         # Supabase client & generated types
│   ├── lib/                  # Utilities, types, notes store
│   ├── pages/                # Route-level page components
│   ├── App.tsx                # Root component & routing
│   └── main.tsx                # Application entry point
├── supabase/
│   └── functions/
│       └── ai-assistant/     # Edge function powering the AI chat
├── index.html
├── tailwind.config.ts
├── vite.config.ts
└── package.json
```

---

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) >= 1.0 or Node.js >= 18
- Git
- A [Supabase](https://supabase.com/) project (free tier works)

### Installation
```bash
# Clone the repository
git clone https://github.com/your-username/neuro-notes.git
cd neuro-notes

# Install dependencies
npm install
# or
bun install

# Start development server
npm run dev
# or
bun dev
```

### Available Scripts
```bash
npm run dev        # Start dev server → localhost:8080
npm run build       # Production build
npm run preview     # Preview production build
npm run lint         # Run ESLint
```

---

## Environment Variables

Create a `.env` file in the root directory:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
```

The AI assistant's edge function also requires its own secret, set in your
Supabase project (not in `.env`):
```env
LOVABLE_API_KEY=your_ai_gateway_key
```

---

## Deploying the Edge Function

The AI Assistant runs as a Supabase Edge Function and must be deployed
separately from the frontend:
```bash
supabase login
supabase link --project-ref your-project-ref
supabase functions deploy ai-assistant
```

---

## Deployment

### Deploy to Vercel
```bash
npm run build
```
Push to GitHub and import the repo on [Vercel](https://vercel.com) —
it auto-detects Vite. Add your environment variables in the project settings.

### Deploy to Netlify
```bash
npm run build
```
Drag and drop the `dist/` folder onto [Netlify](https://netlify.com), or
connect your GitHub repo for continuous deployment.

---

## UI Components

NeuroNotes uses [shadcn/ui](https://ui.shadcn.com/) — beautifully designed,
accessible components built on Radix UI and Tailwind CSS.
```bash
# Add new components
npx shadcn@latest add button
npx shadcn@latest add dialog
npx shadcn@latest add dropdown-menu
```

---

## License

This project is **private and proprietary**. All rights reserved.

---

## Author

**Bhavesh** — Full Stack Developer

---

<p align="center">
  <i>Built with ❤️ by Bhavesh.</i>
</p>
