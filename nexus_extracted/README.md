# NexusAI - AI-Driven Banking Assistant

**Intelligent Banking, Trusted Future.**

A comprehensive AI-powered banking platform designed for Canadian financial institutions, built with React, TypeScript, Tailwind CSS, and shadcn/ui components.

## Brand Identity

**Vision**: To be the leading AI platform that empowers financial institutions to navigate complexity, foster trust, and deliver unparalleled value to their customers.

**Mission**: To provide Canadian banks with a secure, transparent, and intelligent AI solution that transforms compliance, personalizes financial experiences, and drives sustainable growth through innovation.

**Core Values**: Trust • Intelligence • Empowerment • Innovation • Integrity

## Overview

NexusAI is a unified banking assistant platform that addresses critical challenges in the Canadian banking sector:
- **Enhanced AML & Fraud Detection** - Real-time suspicious activity monitoring with AI-powered risk scoring
- **Graph-Based Transaction Network Analysis** - Visualize and detect money laundering rings across accounts
- **Open Banking Infrastructure** - CDBA Phase 1 compliant API-first architecture
- **Government-Grade Security** - Built for Canadian banks, fintechs, and federal institutions

## Features

### 🏠 Landing Page (Navy/Mint Theme)
- Professional marketing site with hero section
- Audience-specific cards (Banks, Government, Fintechs)
- Feature showcase with numbered sections
- Trust bar with Canadian financial institution logos
- Metrics and statistics
- Call-to-action sections
- **Design**: DM Serif Display, DM Sans, Space Mono fonts
- **Colors**: Navy (#03112A), Mint (#00E5A0), Gold (#F5C842)

### 🛡️ Compliance Dashboard (Purple Theme)
- **KPI Strip** - 5 real-time metrics with color-coded badges
- **Alert Volume Heatmap** - 12-month visualization of AML alert patterns
- **Platform Risk Score** - Circular progress indicator with breakdowns (AML, Fraud, KYC)
- **Live Alert Queue** - Sortable table with risk scores and status tags
- **AML alert triage** with AI-powered risk scoring
- **Investigation case management** with graph visualization
- **SAR (Suspicious Activity Report) filing** with FINTRAC integration
- **Design**: Instrument Serif, Geist, Geist Mono fonts
- **Colors**: Purple (#8B5CF6), Dark backgrounds (#06040F), Coral, Amber, Teal accents

## Tech Stack

- **Frontend Framework**: React 18.3.1
- **Routing**: Wouter
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui (Radix UI primitives)
- **Icons**: Lucide React
- **Type Safety**: TypeScript
- **Build Tool**: Vite
- **Package Manager**: pnpm

## Project Structure

```
src/
├── app/
│   ├── components/
│   │   ├── ui/                    # shadcn/ui components
│   │   └── DashboardLayout.tsx    # Shared dashboard layout with sidebar
│   ├── pages/
│   │   ├── LandingPage.tsx        # Navy/mint themed marketing page
│   │   └── ComplianceDashboard.tsx # Purple themed dashboard
│   └── App.tsx
├── styles/
│   ├── theme.css         # Dark theme CSS variables
│   └── fonts.css         # Typography imports
└── imports/              # Reference HTML files and documentation
```

## User Roles

1. **Compliance Officer** - AML investigation and SAR filing (Primary Role)
2. **Bank Admin** - Platform management and analytics
3. **Financial Advisor** - Client portfolio management
4. **Retail Customer** - Personal banking and financial insights

## Key Components

### DashboardLayout Component
Shared layout for all dashboard pages with:
- Purple-themed sidebar navigation
- Role badge with pulse animation
- Top bar with search, period filters, notification icons
- Breadcrumb navigation
- User profile section with logout

### KPI Cards
Real-time metrics with:
- Color-coded accent lines
- Custom colored badges
- Radial gradient backgrounds
- Hover animations

### Data Visualizations
- **Alert Heatmap** - 12-month grid with 6 intensity levels
- **Risk Score Ring** - Circular progress with SVG
- **Alert Queue Table** - Sortable with status tags and risk scores

## Design System

### Landing Page (Public)
**Color Palette**:
- Navy: #03112A, #071E3D, #0A2347 (Professional, trustworthy)
- Mint: #00E5A0, #00C986 (Modern, innovative)
- Gold: #F5C842 (Premium, established)
- Slate: #8FA5BF (Muted text)

**Typography**:
- Headings: DM Serif Display
- Body: DM Sans
- Monospace: Space Mono

**Design Philosophy**: Clean, professional banking aesthetic with glass morphism and subtle gradients. Navy base conveys trust and stability, mint accent represents innovation and growth.

### Compliance Dashboard (Internal)
**Color Palette**:
- Dark Backgrounds: #06040F, #09071A, #0D0B20, #130F2C
- Purple Brand: #8B5CF6, #7C3AED, #6D28D9, #A78BFA
- Status Colors: Coral (#F87171), Amber (#FBBF24), Teal (#34D399), Gold (#F5C842)
- Text: #EDE9FE, #7B6FAA, #3D3460

**Typography**:
- Headings: Instrument Serif
- Body: Geist
- Monospace: Geist Mono

**Design Philosophy**: Sophisticated dark theme with purple accent for compliance tools. Glass morphism effects with rgba surfaces, gradient accents, and subtle glow effects create depth while maintaining readability for data-heavy interfaces.

## Future Enhancements

Based on the PRD and roadmap:
- Real backend integration with tRPC
- Database persistence (MySQL + Drizzle ORM)
- Authentication via Manus OAuth
- LLM integration for AI features
- Real-time transaction monitoring
- Graph-based network visualization
- Mobile app (iOS/Android)
- Multi-language support

## Development

This is a Figma Make application. The Vite dev server runs automatically.

### Available Scripts
- Build: `pnpm build` (Note: not needed in Figma Make environment)

### Adding Dependencies
```bash
pnpm add <package-name>
```

## Documentation

See `/src/imports/` for:
- Reference HTML files (nexusai-landing-1.html, nexusai-dashboard-2.html)
- Product Requirements Document
- Development Roadmap
- Backend router examples (reference)
- Database schema (reference)

## Compliance & Security

- PIPEDA compliant data handling
- End-to-end encryption for data at rest and in transit
- Role-based access control (RBAC)
- Audit logging
- Secure data sharing consents

## References

Built based on industry research:
- [2026 Canadian Large Bank Sector Outlook](https://dbrs.morningstar.com/research/470629)
- [TD Bank AML Penalties](https://www.justice.gov/opa/pr/td-bank-pleads-guilty)
- [Consumer-Driven Banking in Canada](https://oba.org/empowering-the-consumer)
- [Five trends redefining Canadian financial services](https://rfi.global/five-trends-redefining-canadian-financial-services-in-2026/)

## License

Built for demonstration and educational purposes.

---

**Built with Claude Code** • May 2026
