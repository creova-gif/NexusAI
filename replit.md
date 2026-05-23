# NexusAI — AI-Driven Banking Assistant

**Intelligent Banking, Trusted Future.**

A comprehensive AI-powered banking platform for Canadian financial institutions, built with React, TypeScript, Tailwind CSS v4, and shadcn/ui.

## How to Run

The app starts automatically via the "Start application" workflow, running Vite on port 5000.

## Project Structure

```
src/
├── app/
│   ├── components/
│   │   ├── ui/                    # shadcn/ui components
│   │   └── DashboardLayout.tsx    # Shared dashboard layout with sidebar
│   └── pages/
│       ├── LandingPage.tsx        # Dark purple marketing page
│       └── ComplianceDashboard.tsx # AML compliance dashboard
├── styles/
│   ├── index.css     # Entry CSS (imports fonts, tailwind, theme)
│   ├── fonts.css     # Google Fonts imports
│   ├── tailwind.css  # Tailwind v4 setup
│   └── theme.css     # NexusAI dark theme CSS variables
└── main.tsx
```

## Routes

- `/` — Landing page (marketing site)
- `/dashboard` or `/compliance` — Compliance dashboard (officer view)

## Tech Stack

- React 18 + TypeScript
- Vite 6 + Tailwind CSS v4
- shadcn/ui (Radix UI primitives)
- Wouter (routing)
- Lucide React (icons)
- pnpm

## User Preferences

- Dark purple theme throughout (#05040F backgrounds, #8B5CF6 brand purple, #A78BFA highlights)
- Fonts: Instrument Serif (headings), Geist (body), Geist Mono (monospace)
- Glass morphism surfaces with rgba transparency
- No emojis in dashboard UI
