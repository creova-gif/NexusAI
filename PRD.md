# NexusAI — Product Requirements Document

**Version:** 1.0
**Status:** Approved
**Date:** May 2026
**Owner:** Product Team
**Stakeholders:** Engineering, Compliance, Sales, Legal, Design

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Problem Statement](#2-problem-statement)
3. [Product Vision & Strategy](#3-product-vision--strategy)
4. [Target Market & Users](#4-target-market--users)
5. [Competitive Landscape](#5-competitive-landscape)
6. [Product Goals & Success Metrics](#6-product-goals--success-metrics)
7. [Feature Requirements](#7-feature-requirements)
8. [Non-Functional Requirements](#8-non-functional-requirements)
9. [Subscription Tiers & Pricing](#9-subscription-tiers--pricing)
10. [Compliance & Regulatory Requirements](#10-compliance--regulatory-requirements)
11. [Integration Requirements](#11-integration-requirements)
12. [Out of Scope](#12-out-of-scope)
13. [Risks & Mitigations](#13-risks--mitigations)
14. [Roadmap](#14-roadmap)
15. [Glossary](#15-glossary)

---

## 1. Executive Summary

NexusAI is a production-grade, AI-powered Anti-Money Laundering (AML) compliance platform purpose-built for Canadian financial institutions. It replaces fragmented, manual compliance workflows with a unified intelligent system that monitors transactions, triages alerts, generates regulatory filings, and orchestrates AI-driven investigations — all from a single workspace.

The platform is designed to help compliance teams at banks, credit unions, fintechs, and federal regulators meet their FINTRAC, OSFI, and PCMLTFA obligations with dramatically less manual effort, fewer false positives, and a complete, auditable record of every decision.

**Core value proposition:** Reduce AML alert review time by 70%, SAR drafting time by 85%, and false positive rates by 40% — without sacrificing regulatory defensibility.

---

## 2. Problem Statement

### Current Reality

Canadian financial institutions collectively review millions of AML alerts per year. The process is:

- **Slow:** A single alert investigation takes an analyst 45–90 minutes on average, involving manual lookups across multiple systems
- **Inaccurate:** Industry false positive rates run 95–99%, meaning analysts spend most of their time on non-issues
- **Fragmented:** Transaction monitoring, entity screening, SAR filing, and audit logging happen in separate, disconnected systems
- **Expensive:** A mid-size bank's compliance team costs $2–8M annually; headcount grows linearly with alert volume
- **Regulatory risk:** Manual processes create gaps — missed filings, inconsistent documentation, and audit trails that can't withstand regulatory scrutiny

### The Consequence

FINTRAC levied $7.4M in penalties against Canadian FIs in 2023–24. OSFI's enhanced supervisory framework now requires real-time evidence of effective transaction monitoring controls. The cost of non-compliance — financial, reputational, and operational — has never been higher.

### The Gap

Existing solutions (Actimize, NICE, Oracle FCCM) were built in a pre-AI era. They require 12–18 month implementation timelines, large IT teams to maintain, and produce alert queues that still require extensive manual review. No Canadian-native solution exists that integrates AI inference, RAG-based investigation, FINTRAC filing, and complete audit trail in a single platform with Canada-first data residency.

---

## 3. Product Vision & Strategy

### Vision

> "NexusAI makes every compliance team act like they have ten times the people — by making AI the first analyst, not the last resort."

### Strategic Positioning

NexusAI is **not** a rules engine replacement. It sits on top of existing transaction monitoring infrastructure, ingesting alerts and enriching them with AI analysis, entity graph data, regulatory knowledge, and investigator memory. It is the layer that connects raw alerts to defensible regulatory outcomes.

### Strategic Pillars

| Pillar | Description |
|--------|-------------|
| **Canada-first** | Data never leaves Canada by default. Pre-loaded PCMLTFA thresholds, FINTRAC form types, OSFI guidance |
| **AI-native** | Every workflow is augmented by AI — not bolted on. Models are routed, fallback-chained, and upgraded transparently |
| **Audit-defensible** | Every AI decision is explainable, every human action is logged, and the full chain is tamper-evident |
| **Workspace isolation** | Complete data, encryption, and inference isolation per tenant — no cross-institutional data exposure |
| **Open by design** | REST API, webhooks, and SSO mean NexusAI fits into existing workflows rather than replacing them |

---

## 4. Target Market & Users

### Primary Market

**Tier 1:** Big Six Canadian banks (RBC, TD, Scotiabank, BMO, CIBC, NBC) — 500+ compliance staff, complex multi-jurisdiction AML programs, $10M+ annual compliance spend

**Tier 2:** Mid-size banks, credit unions, mortgage companies, insurance companies — 50–200 compliance staff, OSFI-regulated, FINTRAC reporting entities

**Tier 3:** Fintechs, money service businesses (MSBs), crypto platforms, payment processors — small compliance teams (2–20), rapid growth, FINTRAC-registered

**Tier 4 (Government):** FINTRAC, OSFI, Bank of Canada, provincial securities regulators — internal analytical use, cross-institutional data analysis, regulatory oversight

### User Personas

---

#### Persona 1 — Sarah, Chief Compliance Officer
**Institution:** Mid-size Canadian bank (5,000 employees)
**Age:** 48 | **Experience:** 20+ years in compliance

**Goals:**
- Demonstrate to OSFI that the AML program is effective and improving
- Reduce team burnout from high alert volumes
- Shorten time-to-file on SARs to stay within regulatory deadlines
- Have a defensible audit trail for every decision

**Pain Points:**
- Manually reviewing dashboards from 5 different systems every morning
- Difficulty explaining to regulators why certain alerts were closed
- Fear of a FINTRAC penalty due to a missed SAR
- Budget pressure to do more with fewer headcount additions

**How NexusAI helps:** Executive dashboard showing real-time compliance posture, AI-generated risk narrative for every alert, SAR approval workflow with full AI attribution, immutable audit export for regulatory exams

---

#### Persona 2 — Marcus, Senior AML Analyst
**Institution:** Fintech payment processor (300 employees)
**Age:** 32 | **Experience:** 7 years in AML

**Goals:**
- Clear his alert queue efficiently without missing real risks
- Draft SARs quickly without starting from scratch every time
- Access customer history and entity relationships without toggling systems
- Protect the company from a FINTRAC violation

**Pain Points:**
- 80% of alerts are obvious false positives but still require documentation
- SAR drafting takes 3–4 hours from scratch; misses the regulatory window sometimes
- No easy way to see if a customer appeared in a previous alert
- AI tools at current employer are generic and don't know Canadian regulations

**How NexusAI helps:** AI pre-triage scores, one-click close for clear false positives with auto-documentation, AI SAR drafter with FINTRAC-formatted output, entity graph showing full customer history and linked entities

---

#### Persona 3 — Jennifer, Compliance Technology Lead
**Institution:** Tier 1 Canadian bank
**Age:** 41 | **Experience:** 15 years in technology + compliance

**Goals:**
- Integrate NexusAI with existing Actimize transaction monitoring system
- Ensure data never leaves Canadian borders
- Enforce MFA and SSO for all 200+ compliance staff
- Produce audit evidence for SOC 2 and OSFI B-10 reviews

**Pain Points:**
- Vendor integrations that require 12–18 month implementation projects
- Security reviews that block or slow new tool adoption
- Inability to customize alert workflows for the bank's specific risk appetite
- Generic solutions that require expensive customization for Canadian regulations

**How NexusAI helps:** REST API + webhook integrations, `ca-central-1` data residency guarantee, SAML/OIDC SSO + MFA, BYOK encryption, custom rules engine, OSFI/FINTRAC pre-built templates

---

#### Persona 4 — David, FINTRAC Regulatory Examiner
**Institution:** FINTRAC (Government)
**Age:** 38 | **Experience:** 10 years in financial intelligence

**Goals:**
- Efficiently examine a reporting entity's AML program during a supervisory review
- Verify that STRs were filed correctly and on time
- Understand the institution's decision-making process for closed alerts
- Identify systemic compliance gaps

**Pain Points:**
- Receiving paper or PDF audit evidence that's hard to search and cross-reference
- Institutions that can't produce a clear timeline of decisions on specific alerts
- No way to see whether AI tools used in compliance programs are documented and explainable

**How NexusAI helps:** Auditor read-only role with full decision timeline, immutable audit export (JSONL/CSV), AI decision explainability (XAI) for every model inference, FINTRAC-formatted SAR records

---

## 5. Competitive Landscape

| Competitor | Strengths | Weaknesses vs. NexusAI |
|------------|-----------|----------------------|
| **NICE Actimize** | Market leader, deep features, large enterprise | 18-month implementation, no AI-native, expensive, US-centric |
| **Oracle FCCM** | Enterprise scale, Oracle ecosystem | Legacy architecture, slow innovation, high TCO |
| **Refinitiv World-Check** | Comprehensive sanctions/PEP data | Screening only — no alert management or SAR |
| **ComplyAdvantage** | Modern UX, good KYC screening | No SAR generation, no alert management, limited Canada coverage |
| **Hawk AI** | AI-native approach, modern | Europe-focused, no FINTRAC integration, no Canadian data residency |
| **In-house solutions** | Customized to institution | 10+ year maintenance burden, no AI, no Canadian regulatory updates |

**NexusAI's defensible differentiators:**
1. Only platform with Canada-first data residency + FINTRAC/OSFI pre-integration
2. Only platform where AI is the first analyst, not a reporting layer
3. Only platform with RAG-based investigation (institution's own documents + regulatory corpus)
4. Only platform with full XAI — every AI decision is attributable and explainable
5. Weeks to go live, not months

---

## 6. Product Goals & Success Metrics

### North Star Metric

**Alerts resolved per analyst per week** — measures the leverage NexusAI gives each compliance professional

### Primary KPIs

| Metric | Baseline (industry) | 6-Month Target | 12-Month Target |
|--------|--------------------|--------------:|----------------:|
| Alert review time (avg) | 60 min | 20 min | 12 min |
| SAR drafting time (avg) | 3.5 hours | 45 min | 20 min |
| False positive rate | 97% | 85% | 75% |
| Time-to-SAR-file | 5 days avg | 2 days | 1 day |
| Analyst alerts/week | 50 | 120 | 200 |
| Customer CSAT (NPS) | — | > 50 | > 65 |
| Platform uptime | — | 99.9% | 99.9% |

### Business KPIs

| Metric | Q3 2026 | Q4 2026 | Q2 2027 |
|--------|---------|---------|---------|
| MRR | $300k | $750k | $2M |
| Paying workspaces | 30 | 75 | 200 |
| Enterprise contracts | 2 | 6 | 15 |
| Government contracts | 0 | 1 | 3 |
| Net Revenue Retention | — | 110% | 120% |
| Gross Margin | 65% | 70% | 75% |

---

## 7. Feature Requirements

### 7.1 Authentication & Onboarding

#### FR-AUTH-001: Email/Password Authentication
- Users must be able to sign up and sign in with email + password
- Password policy enforced: min 12 chars, uppercase, lowercase, numbers, symbols
- bcrypt hashing (cost factor 12) — no plaintext storage at any point
- Account lockout after 5 failed attempts with exponential cooldown

#### FR-AUTH-002: Multi-Factor Authentication
- MFA must be supported via TOTP (Authenticator app), SMS OTP, and Email OTP
- Workspace admins can require MFA for specific roles (e.g., all roles with write access)
- Recovery codes generated on enrollment, shown once
- Hardware key (WebAuthn/FIDO2) support for Enterprise tier

#### FR-AUTH-003: Enterprise SSO
- SAML 2.0 support for banks with existing IdPs (Azure AD, Okta, PingFederate)
- OIDC support for modern identity providers
- Domain enforcement: only emails matching configured domains can use SSO
- Attribute mapping: IdP claims mapped to NexusAI roles and departments
- Just-in-time user provisioning on first SSO login
- Available: Professional tier and above

#### FR-AUTH-004: Session Management
- Users can view all active sessions (device, IP, location, last active)
- Users can revoke individual sessions or all other sessions
- Session timeout configurable per workspace (default 8h, idle 30min)
- Token refresh happens silently — users never see session expired unless offline

#### FR-AUTH-005: API Keys
- Workspace admins can create API keys with specific scopes
- Keys shown in plaintext once on creation — never again
- Keys can be scoped, rate-limited, and IP-restricted (CIDR)
- Key usage logged in audit trail

#### FR-AUTH-006: Onboarding Wizard
- New workspaces guided through: organization details, data residency selection, first user invite, SSO setup (optional), first integration (optional)
- Completion percentage tracked; dashboard shows incomplete onboarding nudges
- FINTRAC entity ID collection for Canadian FIs
- Trial period: 14 days for Starter and Professional, no trial for Enterprise/Government

---

### 7.2 AML Alert Management

#### FR-ALERT-001: Alert Queue
- Unified inbox for all AML alerts from connected transaction monitoring systems
- Real-time updates via WebSocket — new alerts appear without page refresh
- Columns: Alert ID, Entity, Transaction Amount, Risk Score, Type, Age, Assigned To, Status
- Status values: NEW, IN REVIEW, ESCALATED, CLOSED (TRUE POSITIVE), CLOSED (FALSE POSITIVE), SAR FILED

#### FR-ALERT-002: AI Pre-Triage
- Every incoming alert is automatically analyzed by AI before appearing in the queue
- AI produces: risk score (0–100), risk narrative (2–3 sentences), recommended action, similar past alerts
- AI analysis completes within 30 seconds of alert arrival
- Analysts can see AI reasoning and disagree — disagreement is logged

#### FR-ALERT-003: Alert Detail View
- Full transaction timeline for the subject entity
- Entity profile: customer since, transaction volume, past alerts, KYC status
- Entity network graph: connections to other entities (shared accounts, beneficial ownership, counterparties)
- AI Chat: analyst can ask questions about the alert in natural language
- AI answers draw from: alert data, customer history, regulatory corpus (RAG), institution's own policies

#### FR-ALERT-004: Bulk Actions
- Analysts can select multiple alerts and close, assign, or escalate in bulk
- Bulk close requires a close reason (dropdown) and optional note
- Bulk actions logged with analyst identity and timestamp
- Bulk action confirmation dialog showing count and irreversibility warning

#### FR-ALERT-005: Alert Assignment
- Alerts can be assigned to individual analysts or teams
- Round-robin auto-assignment based on team workload (configurable)
- Assigned analyst notified via in-app notification + email
- Unassigned alerts visible to all team members

#### FR-ALERT-006: Escalation
- Any analyst can escalate an alert to their compliance officer
- Escalation requires a reason note (min 50 characters)
- Escalated alerts flagged visually and sorted to top of CCO queue
- Escalation trail preserved in audit log

#### FR-ALERT-007: Alert Filters & Search
- Filter by: risk level, status, type, assigned to, date range, amount range, entity type, jurisdiction
- Free-text search across entity names, alert IDs, and notes
- Saved filter sets per user
- Sort by any column

---

### 7.3 AI Investigator (Agentic)

#### FR-AI-001: AI Chat Assistant
- Conversational interface for asking questions about an alert or entity
- Draws on: alert data, transaction history, entity graph, institution's document library (RAG), regulatory corpus
- Cites sources for every claim (document name, page number, confidence score)
- Conversation history preserved within investigation session
- Available: Professional tier and above

#### FR-AI-002: Autonomous Investigation
- User can delegate a full investigation to the AI Agent
- Agent executes a multi-step workflow: entity lookup → transaction analysis → adverse media search → network graph traversal → regulatory assessment → recommendation
- Agent shows step-by-step progress in real time
- Agent produces a structured investigation report: narrative summary, risk factors, supporting evidence, recommended action, SAR draft if applicable
- Human must review and approve/reject the recommendation

#### FR-AI-003: AI Explainability (XAI)
- Every AI risk score includes an explanation: top contributing factors, data sources used, confidence level
- "Why did the AI flag this?" button on every alert
- Model version logged with every inference — regulatory defensibility
- XAI data included in audit export
- Available: Professional tier and above

#### FR-AI-004: Regulatory Q&A
- Ask any question about Canadian AML regulations in plain English
- Answers sourced from: PCMLTFA, FINTRAC guidelines, OSFI guidance, institution's own compliance policies
- Citations to specific sections of regulations
- Answers are jurisdiction-aware (federal vs. provincial)

---

### 7.4 SAR Generation & Filing

#### FR-SAR-001: AI SAR Drafter
- From any alert detail view, analyst clicks "Generate SAR Draft"
- AI produces a complete, FINTRAC-formatted SAR pre-populated with:
  - Subject entity details (name, address, DOB, account numbers)
  - Suspicious activity narrative (structured, factual, 300–500 words)
  - Transaction details table
  - Reporting entity information
- Draft generated in < 60 seconds

#### FR-SAR-002: SAR Review & Edit
- Analyst reviews AI-generated draft in a structured editor
- Each section has AI-generated content that can be accepted, edited, or replaced
- Rich text editor with FINTRAC field validation
- Required fields highlighted; missing fields block submission

#### FR-SAR-003: SAR Approval Workflow
- Drafted SARs require compliance officer approval before submission
- Approver sees: original alert, investigation history, AI draft, analyst edits, side-by-side diff
- Approver can: approve, return for revision (with comments), or reject
- Approval recorded with timestamp and approver identity

#### FR-SAR-004: FINTRAC Integration
- Approved SARs submitted electronically to FINTRAC via F2R (FINTRAC to Reporting Entity) API
- Submission confirmation and FINTRAC reference number stored
- Failed submissions retried automatically (up to 3 times) with alert to compliance team
- Submission deadline tracked (30-day regulatory window)

#### FR-SAR-005: SAR Status Tracking
- Dashboard showing all SARs by status: DRAFT, IN REVIEW, APPROVED, SUBMITTED, ACKNOWLEDGED, REJECTED
- Days-to-deadline displayed for pending SARs
- Overdue SARs surfaced in executive dashboard
- Export SAR list to CSV/PDF for regulatory exam preparation

---

### 7.5 KYC & Entity Management

#### FR-KYC-001: Customer Risk Profile
- Unified entity record: identification documents, risk rating, transaction history, alert history, SAR history
- Risk rating: LOW, MEDIUM, HIGH, VERY HIGH — with AI-generated rationale
- Risk rating last reviewed date and next review schedule

#### FR-KYC-002: Perpetual KYC
- Automated periodic refresh of entity risk profiles based on configurable triggers: time elapsed, transaction threshold, news event
- AI monitors adverse media, sanctions list changes, and PEP status changes
- Alert generated when entity risk profile changes significantly
- Available: Professional tier and above

#### FR-KYC-003: Sanctions & PEP Screening
- Screen entities against: UN Consolidated List, OFAC SDN, OSFI Consolidated Canadian Autonomous Sanctions, Domestic PEP list
- Real-time screening on customer creation + continuous monitoring
- Confidence score and match details for each hit
- False positive management: compliance officer can mark as non-match with reason (preserved in audit log)

#### FR-KYC-004: Adverse Media Screening
- AI-powered news monitoring for entity names, associated individuals, and related companies
- Configurable categories: financial crime, fraud, bribery, sanctions evasion, terrorism
- News articles summarized and relevance-scored
- Alert generated for high-confidence adverse media hits
- Available: Professional tier and above

#### FR-KYC-005: UBO Discovery
- Automated beneficial ownership mapping using public registry data and client-provided documents
- Entity graph visualization showing ownership chains
- Flag entities where beneficial ownership cannot be verified
- Available: Professional tier and above

---

### 7.6 Entity Network Graph

#### FR-GRAPH-001: Relationship Visualization
- Interactive graph showing entity relationships: shared accounts, beneficial ownership, counterparty relationships, family links
- Node types: Individual, Corporation, Account, Transaction
- Edge types: Owns, Controls, Transacts With, Is Family Of, Shares Account With
- Pan, zoom, and click to drill into any node

#### FR-GRAPH-002: Risk Propagation
- Risk scores propagate through the graph — a high-risk entity increases risk scores of connected entities
- Visual heat map overlaid on graph showing risk concentration
- "Contagion analysis": what entities are affected if this entity is flagged?

#### FR-GRAPH-003: Graph Export
- Export graph as PNG for SAR attachments
- Export entity list and relationship data as CSV
- Include graph in AI investigation report

---

### 7.7 Rules Engine

#### FR-RULES-001: Pre-Built Rules Library
- 50+ pre-built AML detection rules based on FINTRAC typologies:
  - Structuring (transactions just below reporting thresholds)
  - Rapid round-trips (funds in and out within 24h)
  - Geographic anomaly (transactions from high-risk jurisdictions)
  - Dormant account revival
  - Large cash transactions (>$10,000 CAD)
  - EFT thresholds (>$10,000 CAD)

#### FR-RULES-002: Custom Rule Builder
- No-code rule builder for compliance officers to create institution-specific rules
- Conditions: transaction amount, frequency, velocity, geography, entity type, account age, counterparty risk
- Logic: AND, OR, NOT, threshold comparisons, time windows
- Rule testing: run against historical data to see hit rate before enabling
- Available: Professional tier and above

#### FR-RULES-003: Rule Management
- Enable/disable rules without deleting them
- Rule version history: see what changed and when
- Rule performance metrics: hit rate, true positive rate, false positive rate
- FINTRAC typology mapping: link each rule to the regulatory typology it addresses

#### FR-RULES-004: Rule Backtesting
- Test new or modified rules against historical transaction data
- Results: projected alert volume, estimated true positive rate, analyst hours impacted
- Side-by-side comparison of current vs. proposed rule performance

---

### 7.8 FINTRAC Reporting

#### FR-FINTRAC-001: Suspicious Transaction Reports (STR)
- Generate and submit STRs electronically (replaces paper filing)
- FINTRAC-validated field requirements enforced before submission

#### FR-FINTRAC-002: Large Cash Transaction Reports (LCTR)
- Automated detection of cash transactions exceeding $10,000 CAD
- LCTR generated automatically; analyst reviews and approves
- Submitted to FINTRAC within 15 calendar days (regulatory deadline tracked)

#### FR-FINTRAC-003: Electronic Funds Transfer Reports (EFTR)
- Automated detection of international EFTs exceeding $10,000 CAD
- EFTR generated and submitted within 5 business days (deadline tracked)

#### FR-FINTRAC-004: Reporting Dashboard
- Current month filings: STR count, LCTR count, EFTR count
- Upcoming deadlines sorted by urgency
- Year-over-year trend charts
- Export filing log for regulatory examination

---

### 7.9 RAG Pipeline & Knowledge Base

#### FR-RAG-001: Document Upload
- Supported formats: PDF, Word (DOCX), text files, CSV, HTML
- Documents ingested, chunked, embedded, and indexed within 5 minutes
- Document categories: Regulation, Guideline, Policy, Case File, SAR, KYC

#### FR-RAG-002: Regulatory Corpus (Pre-Loaded)
- Platform ships with pre-loaded, continuously updated regulatory documents:
  - PCMLTFA and all associated regulations
  - All FINTRAC guidelines (current versions)
  - OSFI B-8, B-10, E-21 guidelines
  - FATF recommendations
  - Canadian case law relevant to AML

#### FR-RAG-003: Institution Knowledge Base
- Institutions upload their own: AML policies, procedures, risk assessments, typology studies, previous regulatory examination reports
- Documents are workspace-isolated — no cross-institution access
- Documents are cited when AI answers draw from them

#### FR-RAG-004: Knowledge Base Management
- View all indexed documents with status, page count, vector count, last updated
- Delete documents (removes from vector store and future AI responses)
- Re-index documents after updates
- Storage usage shown against plan limit

---

### 7.10 Analytics & Reporting

#### FR-ANALYTICS-001: Executive Dashboard
- Real-time KPIs: active alerts, open SARs, overdue filings, team productivity
- Risk heatmap by entity type, geography, and transaction type
- Trend charts: alert volume, SAR volume, closure rates (30/90/365 day views)
- Compliance posture score: AI-generated assessment of program effectiveness

#### FR-ANALYTICS-002: Team Performance Reports
- Alerts reviewed per analyst per day/week/month
- Average time-to-close by analyst and alert type
- Alert disposition breakdown (closed FP, escalated, SAR filed)
- Queue age analysis: alerts sitting > 5 days, > 10 days

#### FR-ANALYTICS-003: Custom Reports
- Drag-and-drop report builder: select metrics, dimensions, filters, date ranges
- Report scheduling: daily, weekly, monthly email delivery
- Export: CSV, PDF, Excel
- Available: Professional tier and above

#### FR-ANALYTICS-004: Audit Trail Reports
- Searchable, filterable audit log of all actions taken in the platform
- Filter by: actor, action type, resource type, date range
- Export in JSONL (machine-readable) or CSV (human-readable)
- Tamper-evident: integrity hash on every event, downloadable verification tool

---

### 7.11 Workspace Administration

#### FR-ADMIN-001: Member Management
- Invite members by email with a specified role
- Roles: Owner, Admin, Compliance Officer, Analyst, Auditor, Viewer
- Remove members; deactivate without deleting their audit trail
- View last active date per member

#### FR-ADMIN-002: Role & Permission Management
- Owners and Admins assign roles to members
- Custom roles (Enterprise tier): create a role with a specific permission subset
- Department-based access scoping (e.g., analyst only sees alerts assigned to their department)

#### FR-ADMIN-003: Workspace Settings
- Organization name, logo, legal name, FINTRAC entity ID
- Data residency selection (immutable after provisioning)
- Session timeout, idle timeout, MFA requirements
- IP allowlist for additional network-level restriction (Enterprise)

#### FR-ADMIN-004: Billing & Subscription
- View current plan, usage, and next billing date
- See invoices and download PDFs
- Upgrade/downgrade plan (upgrade immediate, downgrade at period end)
- Add seats; remove seats at period end

#### FR-ADMIN-005: Security & Compliance Settings
- Audit log webhook: push events to SIEM in real-time (JSONL over HTTPS)
- Encryption key rotation: rotate tenant KMS key on demand
- BYOK: configure your own AWS KMS key (Enterprise tier)
- Download immutable audit export for a date range

---

## 8. Non-Functional Requirements

### 8.1 Performance

| Requirement | Target |
|-------------|--------|
| API response time (P95) | < 500ms |
| Alert queue load time | < 2s |
| AI chat first token | < 2s |
| AI inference P95 | < 5s (non-streaming) |
| RAG retrieval | < 500ms |
| Document ingestion end-to-end | < 5 minutes |
| WebSocket message delivery | < 100ms |
| Report generation (up to 10k rows) | < 30s |

### 8.2 Reliability

| Requirement | Target |
|-------------|--------|
| API availability | 99.9% (Starter/Pro), 99.99% (Enterprise), 99.999% (Government) |
| Planned maintenance windows | < 4h/quarter, announced 5 days in advance |
| RPO (Recovery Point Objective) | 4h (Pro), 1h (Enterprise), 15min (Government) |
| RTO (Recovery Time Objective) | 2h (Pro), 30min (Enterprise), 15min (Government) |
| FINTRAC submission reliability | 99.99% (critical regulatory obligation) |

### 8.3 Scalability

- API horizontally scalable to 100+ replicas (EKS auto-scaling)
- Alert ingestion: sustain 10,000 alerts/minute during peak periods
- AI inference: 1,000 concurrent requests across all workspaces
- Vector store: 1 billion+ vectors across all workspace namespaces
- WebSocket: 50,000 concurrent connections

### 8.4 Security

- SOC 2 Type II certification within 12 months of GA
- Pen test: annual third-party penetration test
- Vulnerability scanning: daily automated SAST/DAST
- Dependency audit: weekly automated CVE scanning
- Zero critical CVEs in production images; High CVEs patched within 7 days
- TLS 1.3 only (no TLS 1.2 fallback)

### 8.5 Accessibility

- WCAG 2.1 AA compliance for all dashboard interfaces
- Keyboard navigation for all alert management workflows
- Screen reader compatibility (NVDA, VoiceOver)
- Colour contrast ratios meeting AA standards
- Alt text on all icons and images

### 8.6 Data Privacy (PIPEDA / Law 25)

- PII fields encrypted at the field level (not just at rest)
- Data subject access requests: export all data for a user within 72h
- Right to erasure: delete a user's personal data within 30 days (where not legally required to retain)
- Privacy impact assessment conducted before processing any new PII category

---

## 9. Subscription Tiers & Pricing

### Tier Comparison

| Feature | Starter | Professional | Enterprise | Government |
|---------|:-------:|:------------:|:----------:|:----------:|
| **Price (CAD/mo)** | $2,999 | $9,999 | $49,999+ | Custom |
| **Included seats** | 3 | 10 | 50 | 200 |
| **API requests/mo** | 50k | 500k | Unlimited | Unlimited |
| **AI tokens/mo** | 2M | 20M | Unlimited | Unlimited |
| **SARs/mo** | 20 | 200 | Unlimited | Unlimited |
| **Alert queue** | Yes | Yes | Yes | Yes |
| **AI chat assistant** | No | Yes | Yes | Yes |
| **Agentic investigator** | No | Yes | Yes | Yes |
| **AI explainability** | No | Yes | Yes | Yes |
| **RAG pipeline** | No | Yes | Yes | Yes |
| **Custom rules** | No | Yes | Yes | Yes |
| **Perpetual KYC** | No | Yes | Yes | Yes |
| **Adverse media** | No | Yes | Yes | Yes |
| **Federated AI learning** | No | No | Yes | Yes |
| **Fine-tuned models** | No | No | Yes | Yes |
| **SSO (SAML/OIDC)** | No | Yes | Yes | Yes |
| **Dedicated infrastructure** | No | No | Yes | Yes |
| **BYOK encryption** | No | No | Yes | Yes |
| **White label** | No | No | Yes | Yes |
| **SLA** | 99.5% | 99.9% | 99.99% | 99.999% |
| **Support** | Email (4h) | Chat + Email (1h) | Phone + CSM (15min) | Dedicated (15min) |
| **Data retention** | 90 days | 1 year | 7 years | 10 years |

### Trial & Onboarding

- Starter and Professional: 14-day free trial, no credit card required
- Enterprise and Government: proof-of-concept engagement with NexusAI solutions team
- All trials: full feature access for the tier, capped at 1 workspace and 5 users

---

## 10. Compliance & Regulatory Requirements

### PCMLTFA (Proceeds of Crime (Money Laundering) and Terrorist Financing Act)

- All STR, LCTR, and EFTR reports generated in NexusAI must meet FINTRAC's prescribed form and content requirements
- Platform must enforce mandatory reporting deadlines (STR: as soon as practicable; LCTR: 15 days; EFTR: 5 business days)
- Customer identification and verification records must be retained for 5 years after last business relationship
- NexusAI does not replace the obligation of the reporting entity — it is a tool to help them meet their obligations

### OSFI B-10 (Third-Party Risk Management)

- NexusAI must provide contractual commitments covering: data access controls, audit rights, incident notification (within 72h), business continuity, and data return/destruction
- Annual service organization control (SOC 2 Type II) report provided to customers
- Customers can conduct their own due diligence assessments (security questionnaire, site visit for Enterprise)

### OSFI B-8 (Operational Resilience)

- Platform's RTO and RPO commitments documented and tested quarterly
- DR drill results shared with Enterprise customers annually
- Incident response runbook provided to customers

### PIPEDA / Privacy Act

- All data processing documented in a ROPA (Record of Processing Activities)
- Data processing agreements (DPA) signed with all third-party subprocessors (OpenAI, Anthropic, AWS, Pinecone)
- Cross-border data transfer assessments conducted for any non-Canadian subprocessor
- Privacy officer designated; contact information published in privacy policy

---

## 11. Integration Requirements

### 11.1 Inbound Integrations (Alert Feeds)

| System | Integration Type | Priority |
|--------|----------------|---------|
| NICE Actimize | REST API | P0 |
| Oracle FCCM | REST API | P0 |
| Temenos T24 / Transact | Webhook | P1 |
| FIS HORIZON | REST API | P1 |
| Fiserv Premier | REST API | P1 |
| Core Banking (generic) | Webhook + CSV import | P2 |

### 11.2 Outbound Integrations

| Destination | Purpose | Priority |
|-------------|---------|---------|
| FINTRAC F2R | STR/LCTR/EFTR electronic filing | P0 |
| Splunk / IBM QRadar | SIEM audit log streaming | P1 |
| Slack | Compliance team notifications | P1 |
| Microsoft Teams | Compliance team notifications | P1 |
| Salesforce | Entity profile sync | P2 |
| ServiceNow | Case management integration | P2 |
| Jira | Issue tracking for compliance gaps | P3 |

### 11.3 Data Sources

| Source | Data Type | Priority |
|--------|-----------|---------|
| World-Check / Refinitiv | Sanctions, PEP | P0 |
| ComplyAdvantage | Adverse media | P1 |
| Dow Jones Risk & Compliance | PEP, sanctions | P1 |
| OpenCorporates | Beneficial ownership | P1 |
| Canadian Business Registry | UBO, registered companies | P1 |
| Chainalysis | Crypto transaction forensics | P2 |

---

## 12. Out of Scope

The following are explicitly out of scope for the initial product:

- **Transaction monitoring engine:** NexusAI ingests alerts from existing TM systems (Actimize, Oracle) but does not replace them. Building a proprietary TM engine is v2+.
- **Core banking integration:** NexusAI does not connect directly to core banking ledgers for real-time transaction feeds in v1. Alert-level integration only.
- **Customer-facing portal:** NexusAI is a compliance team tool. A customer portal for entities to submit KYC documents directly is v2+.
- **Mobile native app:** Dashboard is responsive web. Native iOS/Android apps are v2+.
- **Multi-language support:** English only in v1. French (Canada official language) in v2.
- **US FINCEN / FinCEN integration:** FINTRAC Canada only in v1. US reporting in v3+.
- **EU AMLD-6 compliance:** EU regulatory framework support in v3+.
- **Real-time transaction scoring:** Sub-second transaction-level scoring is a future ML pipeline feature, not in v1.

---

## 13. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| AI model hallucination in SAR content | Medium | High | Human review mandatory before submission; XAI attribution; confidence scores; citations required |
| FINTRAC API changes breaking submission | Low | Critical | Abstraction layer over FINTRAC API; automated contract tests; 72h rollback plan |
| Data breach / tenant data leakage | Low | Critical | RLS + workspace isolation + encryption + pen testing; SOC 2 compliance |
| OpenAI/Anthropic service outage | Medium | High | Multi-model fallback chains; circuit breakers; graceful degradation to human-only workflows |
| Regulatory rejection of AI-generated SARs | Low | High | Human must approve all AI-generated filings; AI content clearly attributed in audit trail |
| Canadian data residency breach | Very Low | Critical | RLS enforced at DB level; no data replication outside Canada without explicit opt-in; legal review of all subprocessors |
| Slow enterprise sales cycles | High | Medium | Product-led growth for Starter/Pro; enterprise proof-of-concept program; reference customer program |

---

## 14. Roadmap

### Phase 1 — Foundation (Q3 2026)
- Core auth, workspace management, permissions
- Alert queue with AI pre-triage
- Basic SAR generation (AI draft + review workflow)
- FINTRAC STR submission integration
- Rules engine (pre-built rules only)
- Basic analytics dashboard

### Phase 2 — Intelligence (Q4 2026)
- Agentic AI investigator
- RAG pipeline (document upload + regulatory corpus)
- Entity network graph
- Perpetual KYC + adverse media screening
- Custom rules builder
- SIEM integration (webhook)
- Starter + Professional GA launch

### Phase 3 — Enterprise (Q1 2027)
- Federated AI learning
- Fine-tuned models per workspace
- BYOK encryption
- Dedicated infrastructure tier
- LCTR + EFTR reporting
- UBO discovery
- White-label and custom domain
- SOC 2 Type II certification

### Phase 4 — Platform (Q2–Q3 2027)
- FINTRAC F2R API (full integration)
- Mobile responsive dashboard
- French language support
- Crypto forensics integration (Chainalysis)
- Marketplace: third-party rule packages
- Government sovereign deployment

---

## 15. Glossary

| Term | Definition |
|------|-----------|
| **AML** | Anti-Money Laundering — regulatory framework for detecting and preventing money laundering |
| **SAR / STR** | Suspicious Activity Report / Suspicious Transaction Report — mandatory report filed with FINTRAC |
| **LCTR** | Large Cash Transaction Report — required for cash transactions > $10,000 CAD |
| **EFTR** | Electronic Funds Transfer Report — required for international EFTs > $10,000 CAD |
| **FINTRAC** | Financial Transactions and Reports Analysis Centre of Canada — Canada's financial intelligence unit |
| **OSFI** | Office of the Superintendent of Financial Institutions — Canada's federal banking regulator |
| **PCMLTFA** | Proceeds of Crime (Money Laundering) and Terrorist Financing Act — Canada's primary AML legislation |
| **KYC** | Know Your Customer — process of verifying the identity of clients |
| **PEP** | Politically Exposed Person — individual with prominent public role (higher money laundering risk) |
| **UBO** | Ultimate Beneficial Owner — the real human(s) who ultimately own or control a legal entity |
| **RAG** | Retrieval Augmented Generation — AI technique of grounding responses in retrieved documents |
| **XAI** | Explainable AI — techniques that make AI decisions interpretable and auditable |
| **RTR** | Refresh Token Rotation — security technique that invalidates refresh tokens on each use |
| **RLS** | Row-Level Security — database-level access control preventing cross-tenant data access |
| **BYOK** | Bring Your Own Key — enterprise encryption where customer controls the KMS key |
| **SIEM** | Security Information and Event Management — security logging and monitoring systems |
| **Workspace** | NexusAI's term for a tenant — one financial institution = one workspace |
| **Entity** | A person, company, or account subject to AML monitoring |
| **Federated Learning** | ML technique allowing model improvement across institutions without sharing raw data |
