# NexusAI — User Stories

**Version:** 1.0
**Date:** May 2026
**Format:** As a [persona], I want to [action], so that [outcome]
**Priority:** P0 (launch blocker) | P1 (launch required) | P2 (post-launch) | P3 (future)

---

## Table of Contents

1. [Authentication & Onboarding](#1-authentication--onboarding)
2. [AML Alert Management](#2-aml-alert-management)
3. [AI Investigator](#3-ai-investigator)
4. [SAR Generation & Filing](#4-sar-generation--filing)
5. [KYC & Entity Management](#5-kyc--entity-management)
6. [Entity Network Graph](#6-entity-network-graph)
7. [Rules Engine](#7-rules-engine)
8. [FINTRAC Reporting](#8-fintrac-reporting)
9. [Knowledge Base & RAG Pipeline](#9-knowledge-base--rag-pipeline)
10. [Analytics & Reporting](#10-analytics--reporting)
11. [Workspace Administration](#11-workspace-administration)
12. [Billing & Subscription](#12-billing--subscription)
13. [Audit & Compliance](#13-audit--compliance)
14. [Integrations](#14-integrations)
15. [API & Developer Access](#15-api--developer-access)

---

## Personas

| Code | Persona | Role |
|------|---------|------|
| **CCO** | Chief Compliance Officer / VP Compliance | Strategic oversight, program ownership |
| **ANA** | AML Analyst | Day-to-day alert review and investigation |
| **CFO** | Compliance Officer (senior individual contributor) | SAR approval, escalation review |
| **AUD** | Auditor / Regulatory Examiner | Read-only compliance verification |
| **ADM** | Workspace Administrator / Compliance Tech Lead | Platform setup, integrations, access control |
| **DEV** | Developer / API Consumer | Integration, automation |

---

## 1. Authentication & Onboarding

### US-001: Email Sign-In
**Priority:** P0

> As an **ANA**, I want to sign in with my work email and password, so that I can access my alert queue securely.

**Acceptance Criteria:**
- [ ] Sign-in form accepts email (validated format) and password
- [ ] Invalid credentials show a generic error message (no hint whether email or password is wrong)
- [ ] Account locked after 5 consecutive failed attempts; lockout message shown with unlock instructions
- [ ] Successful sign-in redirects to last visited page (or alert queue default)
- [ ] Sign-in event logged in audit trail with IP, device, timestamp

---

### US-002: Multi-Factor Authentication (MFA) Enrollment
**Priority:** P0

> As an **ANA**, I want to enroll my authenticator app as a second factor, so that my account is protected even if my password is compromised.

**Acceptance Criteria:**
- [ ] Enrollment shows a QR code compatible with Google Authenticator, Authy, and 1Password
- [ ] User must enter a valid TOTP code to confirm enrollment before it takes effect
- [ ] 10 one-time backup codes generated and displayed once; user warned to save them
- [ ] Enrollment event logged in audit trail
- [ ] Enrolled device listed in account security settings with name and enrollment date

---

### US-003: MFA Login Challenge
**Priority:** P0

> As an **ANA** with MFA enrolled, I want to be prompted for my 6-digit code after entering my password, so that my account requires both factors to access.

**Acceptance Criteria:**
- [ ] MFA prompt appears immediately after successful password entry
- [ ] Code accepted within 30-second window (TOTP standard) with ±1 window tolerance
- [ ] Maximum 5 code attempts before temporary lockout
- [ ] "Use backup code" option available
- [ ] MFA verification event logged in audit trail

---

### US-004: Workspace Mandatory MFA
**Priority:** P1

> As an **ADM**, I want to require MFA for all compliance officers and analysts, so that my institution's compliance accounts meet OSFI security requirements.

**Acceptance Criteria:**
- [ ] Admin settings shows a "Require MFA for roles" multi-select
- [ ] When a user in a required-MFA role logs in without MFA enrolled, they are forced to enroll before proceeding
- [ ] Existing sessions for required-MFA roles are invalidated when the policy is enabled
- [ ] Policy change logged in audit trail with admin identity

---

### US-005: Enterprise SSO Sign-In
**Priority:** P1

> As an **ANA** at a bank with Azure AD, I want to sign in with my corporate credentials, so that I don't need a separate NexusAI password and IT can manage access centrally.

**Acceptance Criteria:**
- [ ] "Sign in with [Bank Name]" button shown on login page when SSO is configured for the user's email domain
- [ ] Clicking the button redirects to the bank's Azure AD / SAML IdP
- [ ] Successful authentication at IdP creates or updates the NexusAI user account (JIT provisioning)
- [ ] User role is mapped from IdP group claims as configured in workspace settings
- [ ] SSO login event logged in audit trail with IdP details

---

### US-006: Onboarding Wizard
**Priority:** P1

> As an **ADM** setting up NexusAI for the first time, I want to be guided through the initial configuration, so that the platform is ready for my compliance team without needing technical expertise.

**Acceptance Criteria:**
- [ ] Wizard covers: organization name and logo, data residency selection, FINTRAC entity ID, first team member invite, and optional SSO setup
- [ ] Progress bar shows completion percentage (e.g., "3 of 5 steps complete")
- [ ] Each step can be skipped and completed later (except data residency — immutable)
- [ ] Data residency step explains the implications clearly: Canada-only by default
- [ ] Wizard completion triggers a welcome email to the admin with quick-start resources
- [ ] Incomplete wizard shows a banner in the dashboard until dismissed (after all required steps are done)

---

### US-007: Session Management
**Priority:** P1

> As an **ANA**, I want to see all active sessions on my account and revoke any I don't recognize, so that I can detect and stop unauthorized access.

**Acceptance Criteria:**
- [ ] Security settings shows: all active sessions with browser, OS, IP address, country, and last active time
- [ ] Current session is labeled "This device"
- [ ] "Revoke" button on each non-current session immediately invalidates that session
- [ ] "Sign out all other devices" option revokes all sessions except current
- [ ] Revocation event logged in audit trail

---

### US-008: Password Reset
**Priority:** P0

> As an **ANA** who forgot my password, I want to receive a reset link via email, so that I can regain access without contacting support.

**Acceptance Criteria:**
- [ ] "Forgot password?" link on sign-in page
- [ ] Reset link sent to registered email within 60 seconds
- [ ] Reset link expires after 1 hour and is single-use
- [ ] New password must meet workspace password policy
- [ ] Reset link cannot be sent more than 3 times per hour (rate limited)
- [ ] Password reset event logged in audit trail; all sessions invalidated on reset

---

## 2. AML Alert Management

### US-009: View Alert Queue
**Priority:** P0

> As an **ANA**, I want to see all new AML alerts assigned to me in one view, so that I know exactly what needs my attention today.

**Acceptance Criteria:**
- [ ] Alert queue loads within 2 seconds
- [ ] Default view: alerts assigned to me, sorted by risk score descending
- [ ] Alert card shows: Alert ID, entity name, alert type, risk score (with colour: red/amber/green), amount, currency, age, status
- [ ] Unread/new alerts visually distinguished from previously viewed
- [ ] Real-time updates: new alerts appear at top without page refresh (WebSocket)
- [ ] Alert count badge on sidebar nav item updates in real-time

---

### US-010: Filter Alert Queue
**Priority:** P0

> As an **ANA**, I want to filter alerts by risk level, type, and status, so that I can focus on the most critical alerts first.

**Acceptance Criteria:**
- [ ] Filters available: risk level (CRITICAL/HIGH/MEDIUM/LOW), alert type, status, assigned to, date range, amount range, entity type, jurisdiction
- [ ] Multiple filters can be applied simultaneously
- [ ] Active filters shown as removable chips above the list
- [ ] Filter state persisted for the session (not lost on navigation)
- [ ] "Save this filter" saves the filter set with a name for future use
- [ ] Result count updates in real-time as filters are applied

---

### US-011: View Alert Detail
**Priority:** P0

> As an **ANA**, I want to see the full context of an alert — transaction history, entity profile, and AI analysis — without leaving the screen, so that I can make an informed decision quickly.

**Acceptance Criteria:**
- [ ] Alert detail view shows: header (entity name, alert ID, type, risk score), AI summary panel, transaction timeline, entity profile, and action panel
- [ ] AI summary panel shows: risk narrative, top risk factors, recommended action, similar past alerts — loads within 30s of alert creation (or on first view if older)
- [ ] Transaction timeline shows the specific flagged transactions highlighted among recent history
- [ ] Entity profile shows: KYC status, customer since date, total transaction volume (30/90/365 day), past alerts, open SARs
- [ ] Actions available: close (with reason), escalate, assign, open investigation, create SAR

---

### US-012: Close Alert (False Positive)
**Priority:** P0

> As an **ANA**, I want to close an alert as a false positive with a documented reason, so that the queue stays clean and my decisions are on record.

**Acceptance Criteria:**
- [ ] Close action requires a close reason selected from a dropdown: "Consistent with customer profile", "Previously reviewed", "Below risk threshold", "Insufficient evidence", "Other (describe)"
- [ ] "Other" requires a free-text note (min 50 characters)
- [ ] Confirmation dialog shows the alert ID and close reason before confirming
- [ ] Closed alerts move to "Closed" status and are removed from the active queue
- [ ] Close action logged in audit trail with analyst identity, timestamp, and reason
- [ ] Alert cannot be reopened after closing (new alert required for same entity)

---

### US-013: Escalate Alert
**Priority:** P0

> As an **ANA**, I want to escalate an alert to my compliance officer when I believe it needs senior review, so that nothing falls through the cracks.

**Acceptance Criteria:**
- [ ] Escalate action requires a reason note (min 50 characters)
- [ ] Escalated alert appears at the top of the CCO/CFO queue flagged as "Escalated"
- [ ] CCO/CFO receives an in-app notification and email within 2 minutes
- [ ] Escalation trail (who escalated, when, reason) visible in alert detail view
- [ ] Escalation logged in audit trail

---

### US-014: Assign Alert
**Priority:** P1

> As a **CFO**, I want to assign alerts to specific analysts based on their expertise or workload, so that investigations are handled by the most appropriate person.

**Acceptance Criteria:**
- [ ] Assign action shows a searchable list of workspace members with analyst or higher role
- [ ] Assignment requires confirmation
- [ ] Assigned analyst receives in-app notification
- [ ] Alert card shows the assigned analyst's name and avatar
- [ ] Assignment event logged in audit trail

---

### US-015: Bulk Close Alerts
**Priority:** P1

> As an **ANA**, I want to close multiple low-risk alerts at once with the same reason, so that I can clear obvious false positives efficiently.

**Acceptance Criteria:**
- [ ] Checkboxes appear on alert cards when any card is selected (checkbox mode)
- [ ] "Select all" checkbox selects all visible alerts
- [ ] Bulk action toolbar shows count of selected alerts and available bulk actions
- [ ] Bulk close shows a single close reason picker that applies to all selected alerts
- [ ] Confirmation dialog shows the count (e.g., "You are closing 47 alerts") and is non-reversible
- [ ] Each closure is logged individually in the audit trail with the shared reason

---

### US-016: Real-Time Alert Notifications
**Priority:** P1

> As an **ANA**, I want to be notified immediately when a critical alert is assigned to me, so that I can respond to time-sensitive situations without constantly refreshing my queue.

**Acceptance Criteria:**
- [ ] In-app notification bell shows unread count
- [ ] Notification for: new critical alert assigned, alert escalated to me, SAR approval requested, SAR approved/returned
- [ ] Clicking a notification navigates to the relevant alert or SAR
- [ ] Email notification sent for critical alerts when user is not active in the app (configurable per user)
- [ ] Notifications cleared on view; "Mark all as read" option

---

## 3. AI Investigator

### US-017: AI Alert Pre-Analysis
**Priority:** P0

> As an **ANA**, I want the AI to have already analyzed an alert before I open it, so that I start with context instead of starting from scratch.

**Acceptance Criteria:**
- [ ] AI analysis panel visible in alert detail view within 30 seconds of alert arrival
- [ ] AI analysis includes: 2–3 sentence risk narrative, top 3 risk factors with supporting data points, recommended action (CLOSE / INVESTIGATE / FILE SAR), confidence score (0–100%)
- [ ] "AI sources" section shows which data was used in the analysis
- [ ] AI analysis timestamp and model version displayed (regulatory traceability)
- [ ] "I disagree with this assessment" button records analyst disagreement in audit trail

---

### US-018: AI Chat During Investigation
**Priority:** P1

> As an **ANA**, I want to ask the AI questions about an alert in natural language, so that I can dig deeper without knowing SQL or switching between systems.

**Acceptance Criteria:**
- [ ] Chat interface accessible from alert detail view
- [ ] Example questions: "Has this entity received international wire transfers in the last 6 months?", "What does FINTRAC say about structuring thresholds?", "Are there other accounts linked to this customer?"
- [ ] AI answers include citations: (1) for data-based answers — transaction data; (2) for regulatory questions — document name + section
- [ ] Chat history persists for the duration of the investigation session
- [ ] "Export this conversation" saves the chat thread as part of the investigation record
- [ ] Response latency: first token within 2 seconds; full response within 10 seconds

---

### US-019: Autonomous AI Investigation
**Priority:** P1

> As a **CFO**, I want to delegate a complex multi-entity investigation to the AI agent, so that I can handle more cases in parallel while the agent handles the research.

**Acceptance Criteria:**
- [ ] "Start AI Investigation" button on alert detail view; available to Compliance Officers and above
- [ ] Agent investigation plan shown before starting: steps it will execute (e.g., "1. Entity lookup 2. Transaction analysis 3. Network graph review 4. Regulatory assessment")
- [ ] Real-time progress: each step shown as it completes with a brief result summary
- [ ] Full investigation takes < 5 minutes for a single-entity case
- [ ] Investigation report produced: narrative summary (500–1000 words), risk assessment, supporting evidence (linked transactions, entities), regulatory references, recommended action
- [ ] Human must review and confirm/override the agent's recommendation
- [ ] Entire agent workflow logged in audit trail (step by step)

---

### US-020: AI Explainability
**Priority:** P1

> As a **CFO** reviewing an AI recommendation, I want to understand exactly why the AI reached its conclusion, so that I can make an informed decision and defend it to a regulator.

**Acceptance Criteria:**
- [ ] "Why did the AI recommend this?" button on every AI recommendation
- [ ] Explanation shows: top 5 contributing factors ranked by weight, the data point that triggered each factor, the regulatory basis if applicable
- [ ] Explanation uses plain English — no technical jargon or model internals
- [ ] Explanation can be printed or PDF-exported for regulatory documentation
- [ ] Model version, inference timestamp, and RAG sources used are displayed

---

### US-021: Regulatory Q&A
**Priority:** P1

> As an **ANA**, I want to ask questions about Canadian AML regulations in plain English and get cited answers, so that I don't need to manually search through legislation and guidelines.

**Acceptance Criteria:**
- [ ] Dedicated "Regulatory Q&A" chat accessible from any screen (global keyboard shortcut)
- [ ] Questions answered using the pre-loaded regulatory corpus (PCMLTFA, FINTRAC guidelines, OSFI guidance, FATF recommendations)
- [ ] Every answer cites the specific document, section, and relevant text
- [ ] Answers flagged with: "This is general guidance — consult legal counsel for your specific situation"
- [ ] Conversation history saved to user's Q&A library

---

## 4. SAR Generation & Filing

### US-022: Generate AI SAR Draft
**Priority:** P0

> As an **ANA**, I want the AI to draft a SAR for me from an alert, so that I don't spend hours writing it from scratch.

**Acceptance Criteria:**
- [ ] "Generate SAR Draft" button visible on alert detail view when alert status is IN REVIEW or ESCALATED
- [ ] Draft generated within 60 seconds
- [ ] Draft includes all FINTRAC-required fields: subject information, suspicious activity narrative, transaction details, reporting entity information
- [ ] Narrative is factual, specific, and structured in the style FINTRAC expects (past tense, no conclusions, specific amounts and dates)
- [ ] Empty / unknown fields highlighted with a placeholder tag for analyst to fill
- [ ] Draft automatically saved and linked to the alert

---

### US-023: Edit and Review SAR Draft
**Priority:** P0

> As an **ANA**, I want to review and edit the AI-generated SAR draft before sending it for approval, so that I can correct errors and add context the AI missed.

**Acceptance Criteria:**
- [ ] SAR editor shows each FINTRAC section in a structured form layout
- [ ] AI-generated content shown in a distinct style; analyst edits shown differently (diff view optional)
- [ ] Required fields validated in real-time; incomplete required fields shown with an error state
- [ ] Character count shown for narrative fields (FINTRAC has maximums)
- [ ] "View source alert" link keeps the alert accessible while editing the SAR
- [ ] Auto-save every 30 seconds; unsaved changes indicator
- [ ] "Submit for Approval" button only enabled when all required fields are complete

---

### US-024: SAR Approval Workflow
**Priority:** P0

> As a **CFO**, I want to review and approve or return SARs before they are filed with FINTRAC, so that I maintain oversight of every regulatory submission.

**Acceptance Criteria:**
- [ ] SAR approval queue in the sidebar showing SARs awaiting my review
- [ ] SAR review view shows: original alert context, full investigation history, AI-generated draft, analyst edits (highlighted), and field-by-field validation status
- [ ] Three actions: Approve (proceeds to FINTRAC submission), Return for Revision (with mandatory comment), Reject (with mandatory reason — SAR not filed)
- [ ] Approval decision logged in audit trail with approver identity, decision, and timestamp
- [ ] Analyst notified of approval/return with approver's comments within 2 minutes

---

### US-025: SAR Deadline Tracking
**Priority:** P0

> As a **CCO**, I want to see all pending SARs with their regulatory deadlines, so that my team never misses a FINTRAC filing deadline.

**Acceptance Criteria:**
- [ ] SAR dashboard shows: filing deadline (30 days from suspicious activity date), days remaining, status
- [ ] SARs with < 5 days remaining shown in red; < 10 days in amber
- [ ] Dashboard widget on home screen showing overdue/at-risk SAR count
- [ ] Email alert sent to CCO and CFO when any SAR has < 3 days remaining
- [ ] Overdue SARs (deadline passed without filing) shown with a critical warning banner

---

### US-026: FINTRAC Electronic Submission
**Priority:** P1

> As a **CFO**, I want approved SARs to be submitted directly to FINTRAC electronically, so that I don't need to manually re-enter data into FINTRAC's portal.

**Acceptance Criteria:**
- [ ] Approved SAR submitted to FINTRAC F2R API within 5 minutes of approval
- [ ] FINTRAC reference number retrieved and stored in the SAR record
- [ ] Submission confirmation displayed to the approver with reference number
- [ ] If submission fails: automatic retry up to 3 times; compliance team alerted after 3 failures; SAR remains in "Approved - Submission Pending" state
- [ ] Submission timestamp and reference number included in audit export

---

### US-027: SAR Status Dashboard
**Priority:** P1

> As a **CCO**, I want a single view of all SARs by status, so that I can monitor the compliance pipeline without drilling into individual records.

**Acceptance Criteria:**
- [ ] Kanban-style or table view with columns: DRAFT, IN REVIEW, APPROVED, SUBMITTED, ACKNOWLEDGED
- [ ] Each SAR card shows: subject name, alert type, risk level, analyst, days since creation
- [ ] Click any SAR card to open the full SAR detail
- [ ] Summary counts at the top of each column
- [ ] Filter by: date range, analyst, risk level, type
- [ ] Export current view as CSV or PDF

---

## 5. KYC & Entity Management

### US-028: View Customer Risk Profile
**Priority:** P1

> As an **ANA**, I want to see a complete risk profile for any customer entity, so that I can understand their history without switching to another system.

**Acceptance Criteria:**
- [ ] Entity profile shows: name, type (individual/company), KYC status, risk rating, customer since date
- [ ] Tabs: Overview, Transactions, Alerts History, SAR History, KYC Documents, Network Graph
- [ ] Risk rating displayed with color (red/amber/green) and last reviewed date
- [ ] Alert history shows all past alerts with outcomes (closed, escalated, SAR filed)
- [ ] Profile accessible from alert detail view and via search

---

### US-029: Sanctions Screening Result
**Priority:** P1

> As an **ANA**, I want to see sanctions and PEP screening results for any entity, so that I can identify elevated-risk individuals immediately.

**Acceptance Criteria:**
- [ ] Screening results visible in entity profile under "Compliance Checks" tab
- [ ] Lists checked against: UN list, OFAC SDN, OSFI sanctions, Domestic PEP list
- [ ] Each potential match shows: matched name, list name, match date, confidence score (%)
- [ ] Compliance officer can mark a match as "Confirmed" or "False Positive" with a reason
- [ ] False positive decisions logged in audit trail and included in regulatory audit export

---

### US-030: Perpetual KYC Alerts
**Priority:** P2

> As a **CFO**, I want to be notified when a customer's risk profile changes significantly, so that my KYC reviews are triggered by real changes rather than just calendar dates.

**Acceptance Criteria:**
- [ ] System monitors: sanctions list updates, adverse media mentions, PEP status changes, transaction behaviour changes
- [ ] Risk-triggering event generates an alert in the AML queue tagged "KYC Review Required"
- [ ] Alert includes: what changed, previous state vs. new state, suggested next action
- [ ] KYC review completed in the platform; outcome recorded in entity profile
- [ ] Available: Professional tier and above

---

### US-031: KYC Document Review
**Priority:** P1

> As a **CFO**, I want to approve or reject KYC documents uploaded for an entity, so that customer onboarding decisions are documented and defensible.

**Acceptance Criteria:**
- [ ] KYC document viewer shows uploaded documents (passport, utility bill, incorporation docs) with upload date and uploader
- [ ] AI extraction panel shows: extracted name, DOB, address, document number, expiry — with confidence scores
- [ ] Accept/Reject action on each document with mandatory reason if rejecting
- [ ] Accepted documents update entity KYC status
- [ ] All document decisions logged in audit trail

---

## 6. Entity Network Graph

### US-032: View Entity Relationships
**Priority:** P1

> As an **ANA**, I want to see an interactive graph of how a suspicious entity connects to others, so that I can identify potential co-conspirators or structuring networks.

**Acceptance Criteria:**
- [ ] Graph loads within 3 seconds for entities with up to 100 connections
- [ ] Nodes: individual (person icon), company (building icon), account (card icon)
- [ ] Edges labeled with relationship type and strength (transaction volume or ownership %)
- [ ] Clicking any node opens a mini-profile with key stats; double-click navigates to full entity profile
- [ ] Risk score colour-coded on each node
- [ ] Pan (drag), zoom (scroll), and reset to center (button)

---

### US-033: Expand Network Graph
**Priority:** P1

> As an **ANA**, I want to expand any node in the graph to see its connections, so that I can trace a suspicious network as far as needed.

**Acceptance Criteria:**
- [ ] Clicking "Expand" on any node loads its first-degree connections (max 20 per expansion)
- [ ] Expansion shows a loading state; new nodes animate into position
- [ ] "Collapse" option per node to reduce visual clutter
- [ ] Maximum graph depth: 4 hops (configurable by workspace)
- [ ] "Export graph" option: PNG for attachment; CSV of entities and relationships

---

### US-034: Risk Propagation View
**Priority:** P2

> As a **CFO**, I want to see how flagging one entity affects the risk scores of connected entities, so that I can understand the full scope of a suspicious network.

**Acceptance Criteria:**
- [ ] Toggle: "Show risk propagation" — overlays a heat map on connected entities based on proximity and relationship strength to the flagged entity
- [ ] Entities receiving propagated risk shown with a risk-delta badge (e.g., "+15 risk points due to connection")
- [ ] Propagation calculation explained on hover: "This entity is a direct transacting counterparty of [flagged entity] in the last 30 days"

---

## 7. Rules Engine

### US-035: View Pre-Built Rules
**Priority:** P0

> As a **CFO**, I want to see all active detection rules with their performance metrics, so that I can understand what is driving my alert volume.

**Acceptance Criteria:**
- [ ] Rules list shows: rule name, FINTRAC typology, status (active/inactive), hit rate (last 30 days), estimated true positive rate, alerts generated last 30 days
- [ ] Filter by: typology, status, hit rate
- [ ] Click any rule to see its full logic definition and performance history
- [ ] Pre-built rules are read-only; a "Create custom rule based on this" option copies the logic for customization

---

### US-036: Enable / Disable Rules
**Priority:** P0

> As a **CFO**, I want to disable a rule that is generating too many false positives, so that I can tune the alert volume without permanently deleting the rule.

**Acceptance Criteria:**
- [ ] Toggle switch per rule; state change requires confirmation
- [ ] Disabling a rule shows estimated impact: "This will stop approximately X alerts/month"
- [ ] Disabled rules remain visible in the rules list with "INACTIVE" badge
- [ ] Enable/disable action logged in audit trail with reason field (optional note)
- [ ] Re-enabling a rule takes effect immediately for new transactions

---

### US-037: Create Custom Rule
**Priority:** P1

> As a **CFO**, I want to create a custom detection rule using a no-code builder, so that I can target money laundering patterns specific to my institution's risk profile.

**Acceptance Criteria:**
- [ ] Rule builder has: rule name, description, FINTRAC typology link, conditions, and alert parameters
- [ ] Conditions support: transaction amount (>, <, =, between), frequency (count in time window), geography (country list), entity type, account age, counterparty risk score
- [ ] Conditions can be combined with AND/OR logic
- [ ] "Test this rule" runs it against the last 90 days of data and shows: hit count, sample alerts, projected analyst hours
- [ ] Rule requires approval from a workspace admin before going live
- [ ] Available: Professional tier and above

---

### US-038: Rule Backtesting
**Priority:** P2

> As a **CFO**, I want to backtest a rule change against historical data before enabling it, so that I can predict its impact before it floods the alert queue.

**Acceptance Criteria:**
- [ ] "Backtest" button on any rule (active or draft)
- [ ] Backtest configuration: select date range (up to 12 months), optionally override parameters
- [ ] Results shown within 2 minutes: alert volume per week, estimated true positive rate (based on past outcomes), analyst hours impact
- [ ] Side-by-side comparison: current rule vs. proposed modification
- [ ] Backtest results saved and can be attached to the rule change approval request

---

## 8. FINTRAC Reporting

### US-039: FINTRAC Reporting Dashboard
**Priority:** P0

> As a **CCO**, I want to see this month's FINTRAC filings at a glance, so that I know my institution is meeting its regulatory obligations.

**Acceptance Criteria:**
- [ ] Dashboard shows: STRs filed this month, LCTRs filed, EFTRs filed (with MoM trend)
- [ ] Upcoming deadlines table: each pending filing with report type, entity, deadline date, days remaining
- [ ] Overdue filings highlighted in red with critical alert
- [ ] Annual totals chart (STR/LCTR/EFTR per month for the last 12 months)
- [ ] "Export filing log" exports all filings for a date range as CSV

---

### US-040: LCTR Auto-Detection
**Priority:** P1

> As a **CFO**, I want the system to automatically detect cash transactions requiring a Large Cash Transaction Report, so that I don't miss mandatory filings.

**Acceptance Criteria:**
- [ ] System detects cash transactions (debit or credit) >= $10,000 CAD (or foreign currency equivalent)
- [ ] Detection happens within 1 hour of transaction data being received
- [ ] LCTR draft auto-created and assigned to a compliance officer for review
- [ ] 15-day filing deadline tracked from transaction date
- [ ] Email notification to CCO when LCTR draft is created

---

### US-041: EFTR Auto-Detection
**Priority:** P1

> As a **CFO**, I want international EFTs above $10,000 to be automatically flagged for reporting, so that FINTRAC obligations are met without manual monitoring.

**Acceptance Criteria:**
- [ ] International EFTs (receiving or initiating) >= $10,000 CAD equivalent detected within 1 hour
- [ ] EFTR draft auto-created and assigned to compliance officer
- [ ] 5 business day filing deadline tracked from transaction date
- [ ] Automatic SWIFT / correspondent bank information populated in the EFTR form where available

---

## 9. Knowledge Base & RAG Pipeline

### US-042: Upload Compliance Documents
**Priority:** P1

> As an **ADM**, I want to upload our internal AML policies and procedures to NexusAI, so that AI answers reflect our institution's specific policies, not just generic regulatory guidance.

**Acceptance Criteria:**
- [ ] Upload interface accepts: PDF, DOCX, TXT, CSV (max 200MB per file, 10 files at a time)
- [ ] Drag-and-drop and file picker both supported
- [ ] Upload progress shown per file with stage indicators: Uploading → Parsing → Chunking → Embedding → Indexed
- [ ] Successfully indexed documents searchable by the AI immediately after indexing
- [ ] Failed uploads shown with error reason and option to retry

---

### US-043: View Knowledge Base Status
**Priority:** P1

> As an **ADM**, I want to see all uploaded documents with their indexing status and storage usage, so that I can manage what knowledge is available to the AI.

**Acceptance Criteria:**
- [ ] Knowledge base page lists all documents: name, type, upload date, page count, status, uploader
- [ ] Status values: Indexing, Indexed, Failed, Deleting
- [ ] Storage usage bar: "X MB of Y MB used" with upgrade prompt at 80%
- [ ] Click any document to see full metadata and indexed chunk count
- [ ] Filter by: category, status, upload date

---

### US-044: Delete a Document from the Knowledge Base
**Priority:** P1

> As an **ADM**, I want to remove an outdated policy document from the knowledge base, so that the AI stops referencing superseded guidance.

**Acceptance Criteria:**
- [ ] Delete button on each document; requires confirmation dialog
- [ ] Confirmation states: "This will remove the document from all future AI responses. This cannot be undone."
- [ ] Deletion removes: document from S3, all vector embeddings from Pinecone, metadata from database
- [ ] Deletion completes within 5 minutes
- [ ] Deletion logged in audit trail with admin identity

---

## 10. Analytics & Reporting

### US-045: Executive Compliance Dashboard
**Priority:** P1

> As a **CCO**, I want a real-time view of my team's compliance posture, so that I can report status to the board without manual data compilation.

**Acceptance Criteria:**
- [ ] Dashboard sections: Alert Summary, SAR Pipeline, FINTRAC Filings, Team Performance, Risk Heatmap
- [ ] All metrics reflect current data (< 1 minute lag)
- [ ] Date range selector: today, this week, this month, last 30/90/365 days, custom
- [ ] Download dashboard as PDF (includes all charts and tables)
- [ ] Scheduled delivery: email the PDF every Monday morning to specified recipients

---

### US-046: Analyst Productivity Metrics
**Priority:** P1

> As a **CCO**, I want to see how productive each analyst is, so that I can identify training needs and distribute workload fairly.

**Acceptance Criteria:**
- [ ] Table: analyst name, alerts reviewed this week, alerts closed, SARs contributed, average time-to-close, false positive rate
- [ ] Individual analyst view: trend chart of their metrics over the past 12 weeks
- [ ] Comparison: analyst vs. team average
- [ ] Data anonymizable option (show aggregate only, not individual names) — configurable by CCO

---

### US-047: Custom Report Builder
**Priority:** P2

> As a **CCO**, I want to build a custom report combining alert data, SAR data, and team metrics, so that I can answer ad-hoc questions from senior management without involving IT.

**Acceptance Criteria:**
- [ ] Report builder: select data sources (alerts, SARs, KYC, audit events), metrics, dimensions, filters, date ranges
- [ ] Drag-and-drop column order
- [ ] Chart types: bar, line, pie, table
- [ ] Save reports to a personal or shared library
- [ ] Schedule reports: send to email list (CSV or PDF) on a recurring schedule
- [ ] Available: Professional tier and above

---

## 11. Workspace Administration

### US-048: Invite Team Members
**Priority:** P0

> As an **ADM**, I want to invite new analysts to the workspace with a specific role, so that the team can be onboarded without anyone sharing credentials.

**Acceptance Criteria:**
- [ ] Invite form: email address, role selection (dropdown with role descriptions), optional department
- [ ] Invitation email sent within 2 minutes containing a secure 72-hour-expiring link
- [ ] Invitee creates their own password (or SSO if domain is enforced)
- [ ] Invite status visible in member list: Pending, Accepted, Expired
- [ ] Expired invites can be resent

---

### US-049: Change Member Role
**Priority:** P1

> As an **ADM**, I want to change a team member's role, so that I can reflect promotions or responsibility changes without creating a new account.

**Acceptance Criteria:**
- [ ] Role change takes effect immediately (new JWT issued on next token refresh)
- [ ] Role change logged in audit trail: "Admin changed [user]'s role from Analyst to Compliance Officer"
- [ ] User receives an in-app notification of the role change
- [ ] Cannot change the role of the last Owner (must first promote another member)

---

### US-050: Remove a Member
**Priority:** P1

> As an **ADM**, I want to remove a team member who has left the institution, so that they immediately lose access to sensitive compliance data.

**Acceptance Criteria:**
- [ ] Remove action immediately invalidates all active sessions for that user
- [ ] User's API keys are also revoked
- [ ] User's contributions (alerts closed, SARs drafted) remain in the audit trail linked to their name
- [ ] Removed user appears in member list as "Former Member" for audit purposes
- [ ] Remove action logged in audit trail

---

### US-051: Configure Session Timeout
**Priority:** P1

> As an **ADM**, I want to set a session timeout for our workspace, so that unattended workstations automatically log out analysts and reduce our attack surface.

**Acceptance Criteria:**
- [ ] Two configurable timeouts: absolute session length (1h–30d) and idle timeout (5min–4h)
- [ ] Idle timeout shows a 2-minute warning countdown before logging out
- [ ] Session timeout change logged in audit trail
- [ ] OSFI B-10 recommendation: 8h absolute, 30min idle — pre-configured as defaults with note

---

## 12. Billing & Subscription

### US-052: View Current Usage
**Priority:** P1

> As a **CCO** or **ADM**, I want to see how much of our plan limits we've used this month, so that I can budget and avoid surprises on the invoice.

**Acceptance Criteria:**
- [ ] Usage page shows each metered item: API requests, AI tokens, SARs, KYC checks, document pages, vector storage
- [ ] Progress bar per item: X of Y used (N% remaining)
- [ ] Warning state at 85%: yellow indicator
- [ ] Critical state at 95%: red indicator with upgrade CTA
- [ ] Usage updated in near-real-time (< 5 minute lag)

---

### US-053: Upgrade Subscription
**Priority:** P1

> As an **ADM**, I want to upgrade from Starter to Professional, so that my team can access AI investigation and RAG features.

**Acceptance Criteria:**
- [ ] Upgrade page shows: current plan, target plan, price difference, feature comparison
- [ ] Upgrade takes effect immediately (access to new features granted instantly)
- [ ] Proration applied to the current billing period
- [ ] Upgrade confirmation email sent to billing contact
- [ ] Upgrade logged in audit trail

---

### US-054: View Invoices
**Priority:** P1

> As a **CCO**, I want to view and download past invoices, so that I can reconcile charges with my budget and provide documentation for auditors.

**Acceptance Criteria:**
- [ ] Invoices list shows: invoice number, billing period, amount, status (Paid/Open/Overdue), issue date
- [ ] Download invoice as PDF per invoice
- [ ] Download all invoices for a year as a ZIP
- [ ] Invoice PDF includes: line items, usage details, tax breakdown, payment method last 4 digits

---

## 13. Audit & Compliance

### US-055: View Audit Log
**Priority:** P0

> As an **AUD**, I want to search the complete audit log of every action taken in the platform, so that I can verify the institution's AML program activities during a regulatory examination.

**Acceptance Criteria:**
- [ ] Audit log shows: timestamp, actor name and role, action, resource type, resource ID, IP address
- [ ] Filter by: date range, actor, action type, resource type
- [ ] Free-text search across audit event content
- [ ] Results load within 3 seconds for date ranges up to 1 year
- [ ] Audit log is read-only — no editing or deletion possible

---

### US-056: Export Audit Log
**Priority:** P1

> As an **AUD**, I want to export the audit log for a date range as a file, so that I can provide it to OSFI or FINTRAC during a supervisory review.

**Acceptance Criteria:**
- [ ] Export options: CSV (human-readable) or JSONL (machine-readable for automated processing)
- [ ] Export includes: all fields in the audit log including integrity hash
- [ ] Large exports (> 100k events) delivered via email download link (generated within 10 minutes)
- [ ] Export action itself logged in the audit trail
- [ ] Export includes a verification tool or instructions for confirming hash chain integrity

---

### US-057: Audit Log Integrity Verification
**Priority:** P2

> As an **AUD**, I want to verify that the audit log has not been tampered with, so that I can confirm to regulators that the compliance record is authentic.

**Acceptance Criteria:**
- [ ] Each audit event has an `integrity_hash` that chains to the previous event
- [ ] Platform provides a downloadable verification script
- [ ] Running the verification script against an exported audit log file confirms: total events verified, any gaps or tampering detected, chain root hash matching the published root

---

### US-058: SIEM Integration
**Priority:** P2

> As an **ADM**, I want audit events streamed to our Splunk SIEM in real-time, so that our security operations team can correlate NexusAI activity with other security events.

**Acceptance Criteria:**
- [ ] Webhook configuration: URL, secret key (HMAC-SHA256 signature), event types to include
- [ ] Events delivered within 30 seconds of occurrence
- [ ] Failed deliveries retried for 24 hours with exponential backoff
- [ ] Test delivery button sends a sample event to verify configuration
- [ ] Available: Professional tier and above

---

## 14. Integrations

### US-059: Connect Transaction Monitoring System
**Priority:** P0

> As an **ADM**, I want to connect NexusAI to our existing Actimize transaction monitoring system, so that alerts appear in NexusAI automatically without manual data entry.

**Acceptance Criteria:**
- [ ] Integration wizard guides through: API credentials, webhook URL configuration, field mapping, test connection
- [ ] Test connection sends a sample alert and shows the result in NexusAI
- [ ] Incoming alerts mapped to NexusAI alert schema; unmapped fields stored in metadata
- [ ] Connection status shown in integration settings: Connected / Disconnected / Error (with last sync time)
- [ ] Failure to receive alerts for > 1 hour triggers an email alert to the ADM

---

### US-060: Webhook for Alert Outcomes
**Priority:** P2

> As a **DEV**, I want NexusAI to send alert outcomes (closed, escalated, SAR filed) to our internal case management system, so that our downstream systems stay in sync automatically.

**Acceptance Criteria:**
- [ ] Workspace can configure outbound webhooks: URL, event types, secret key
- [ ] Payload format: JSON with event type, resource ID, timestamp, and relevant fields
- [ ] Signature: `X-NexusAI-Signature: hmac-sha256=...` header for verification
- [ ] Delivery logs: last 100 deliveries with status code, response body, and latency
- [ ] Manual retry on failed deliveries

---

## 15. API & Developer Access

### US-061: Create an API Key
**Priority:** P1

> As an **ADM**, I want to create an API key with specific scopes for our data integration team, so that they can pull alert data programmatically without using a personal login.

**Acceptance Criteria:**
- [ ] API key creation form: name, scopes (multi-select), optional expiry date, optional IP allowlist
- [ ] Key shown in plaintext once on creation; copy button provided; warning: "You won't see this again"
- [ ] Created keys listed with: name, prefix (first 8 chars), scopes, created date, last used, status
- [ ] Key revocation is immediate; revoked keys cannot be un-revoked
- [ ] API key usage logged in audit trail (per call, aggregated)

---

### US-062: Access API Documentation
**Priority:** P1

> As a **DEV**, I want access to complete, accurate API documentation, so that I can build integrations without needing support from the NexusAI team.

**Acceptance Criteria:**
- [ ] OpenAPI 3.1 specification available at `/api/v1/openapi.json`
- [ ] Interactive documentation at `docs.nexusai.ca`
- [ ] All endpoints documented: description, request schema, response schema, error codes, rate limits
- [ ] Code examples in TypeScript, Python, and cURL for every endpoint
- [ ] Changelog shows what changed in each API version with migration guides

---

### US-063: API Rate Limit Feedback
**Priority:** P1

> As a **DEV**, I want to see my current rate limit status in API response headers, so that I can implement smart throttling in my integration without hitting 429 errors.

**Acceptance Criteria:**
- [ ] Every API response includes headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`
- [ ] 429 response includes `Retry-After` header (seconds until limit resets)
- [ ] Burst allowance documented: Pro and above can burst up to 1.5× the per-minute limit for up to 30 seconds
- [ ] Usage dashboard shows API call volume over time for each API key

---

## Story Map Summary

| Epic | P0 Stories | P1 Stories | P2 Stories | P3 Stories |
|------|:----------:|:----------:|:----------:|:----------:|
| Auth & Onboarding | 3 | 5 | 0 | 0 |
| Alert Management | 4 | 3 | 1 | 0 |
| AI Investigator | 1 | 4 | 0 | 0 |
| SAR Generation | 4 | 3 | 0 | 0 |
| KYC & Entity | 0 | 3 | 1 | 0 |
| Network Graph | 0 | 2 | 1 | 0 |
| Rules Engine | 2 | 1 | 1 | 0 |
| FINTRAC Reporting | 1 | 2 | 0 | 0 |
| Knowledge Base | 0 | 3 | 0 | 0 |
| Analytics | 0 | 2 | 1 | 0 |
| Administration | 1 | 4 | 0 | 0 |
| Billing | 0 | 3 | 0 | 0 |
| Audit & Compliance | 1 | 1 | 1 | 0 |
| Integrations | 1 | 0 | 1 | 0 |
| API & Dev | 0 | 3 | 0 | 0 |
| **TOTAL** | **18** | **39** | **7** | **0** |

**Launch requirement: all 18 P0 and all 39 P1 stories complete.**
**Stretch goal: 4+ P2 stories in launch sprint.**
