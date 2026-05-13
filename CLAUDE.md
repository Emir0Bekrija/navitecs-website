# NAVITECS — Claude guide

BIM-focused engineering consultancy site. Next.js 16 App Router, dark-themed, TypeScript.

## Commands
```bash
npm i && npm run dev   # install + dev server (Turbopack)
npm run build          # production build
npm run lint           # ESLint
```
No test suite.

## Critical rules
- Dark theme only (`bg-black`) — never default to light
- Use shadcn/ui (`src/components/ui/`) before MUI or custom primitives
- Path alias: `@/*` → `src/*`
- No test suite — skip test-related suggestions

## Context files (read when relevant)
| Topic | File |
|-------|------|
| Routes, page pattern, data model | `.claude/context/architecture.md` |
| Tailwind, colors, Framer Motion, shadcn | `.claude/context/styling.md` |
| Admin panel, auth, DB, API routes | `.claude/context/admin.md` |
