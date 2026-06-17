# IMAM AGENT STUDIO — Master Project Bible & Upgrade Prompt

> **Purpose of this document:** Paste this entire file into another IDE AI (Cursor, Windsurf, etc.) as the **single source of truth** for building **Imam Agent Studio** — a hybrid upgrade that **must perform everything** the current **ShuMuz Lead Generation Agent** can do, at **UX, UI, and code level**, plus fix known gaps and evolve into a production-grade studio product.
>
> **Product lineage:** Imam Agent Studio = **100% feature parity** with ShuMuz Growth Agent + **Imam Agent Studio's own identity, polish, and extensions**.
>
> **Default operator identity (from current `.env`):** Muzamil Imam · ShuMuz Labs · https://shumuzlabs.com

---

## TABLE OF CONTENTS

1. [Executive Vision](#1-executive-vision)
2. [Product Definition](#2-product-definition)
3. [User Personas & Jobs-To-Be-Done](#3-user-personas--jobs-to-be-done)
4. [Complete Feature Inventory (A–Z)](#4-complete-feature-inventory-az)
5. [Agent Pipeline — Deep Specification](#5-agent-pipeline--deep-specification)
6. [Lead Lifecycle & State Machines](#6-lead-lifecycle--state-machines)
7. [Tech & Accessibility Audit Module](#7-tech--accessibility-audit-module)
8. [AI Brain — Message Generation](#8-ai-brain--message-generation)
9. [Delivery & Channels](#9-delivery--channels)
10. [Campaign System](#10-campaign-system)
11. [API Contract — Every Endpoint](#11-api-contract--every-endpoint)
12. [Database Schema](#12-database-schema)
13. [Integrations & Environment Variables](#13-integrations--environment-variables)
14. [Email & Brand System](#14-email--brand-system)
15. [Frontend — UX/UI Bible (Page by Page)](#15-frontend--uxui-bible-page-by-page)
16. [Design System Tokens](#16-design-system-tokens)
17. [Real-Time & WebSockets](#17-real-time--websockets)
18. [Analytics & A/B Testing](#18-analytics--ab-testing)
19. [Monorepo & Tech Stack](#19-monorepo--tech-stack)
20. [Known Gaps in Current Codebase (MUST FIX)](#20-known-gaps-in-current-codebase-must-fix)
21. [Imam Agent Studio — Required Upgrades Beyond Parity](#21-imam-agent-studio--required-upgrades-beyond-parity)
22. [Non-Functional Requirements](#22-non-functional-requirements)
23. [Acceptance Criteria — Definition of Done](#23-acceptance-criteria--definition-of-done)
24. [File Map — Where Everything Lives](#24-file-map--where-everything-lives)
25. [Master Build Prompt (Copy-Paste Block)](#25-master-build-prompt-copy-paste-block)

---

## 1. EXECUTIVE VISION

**Imam Agent Studio** is an AI-powered **B2B local business outreach studio** for agencies and growth operators. It autonomously:

1. **Discovers** businesses (Google Places / SerpAPI)
2. **Enriches** their websites (contacts + tech audit)
3. **Writes** personalized multi-channel outreach (AI)
4. **Queues** messages for human review
5. **Delivers** via Email, WhatsApp, Instagram (campaign path)
6. **Tracks** replies, analytics, and campaign performance

The studio must feel like a **professional command center** — not a dev tool. Every capability the ShuMuz agent has today must work end-to-end in Imam Agent Studio with **equal or better UX**.

---

## 2. PRODUCT DEFINITION

| Attribute | Value |
|-----------|-------|
| **Current codebase name** | ShuMuz Lead Generation Agent / ShuMuz Labs Growth Agent |
| **Target product name** | **Imam Agent Studio** |
| **Tagline (current)** | Your technical co-founder, on demand |
| **Primary URL** | https://shumuzlabs.com |
| **Logo** | Shopify CDN icon with resize params (`&width=`) |
| **Operator** | Single-admin / agency operator (no multi-tenant auth yet) |
| **Deployment** | Local (8080 API + 5173 UI) or Replit publish |
| **Database** | PostgreSQL (Supabase-compatible) via Drizzle ORM |

---

## 3. USER PERSONAS & JOBS-TO-BE-DONE

### Primary persona: Growth Operator (Muzamil / agency staff)

| Job | How the studio serves it |
|-----|--------------------------|
| Find local businesses to pitch | Hunt by query + location |
| Understand prospect tech stack | Auto tech audit on enrichment |
| Send pain-point-driven outreach | AI brain uses audit data |
| Review before sending | Review Queue + Lead Detail approve |
| Run batch campaigns | Campaign wizard + runner |
| Monitor pipeline health | Dashboard stats + activity feed |
| Track who replied | Mark as Replied |
| Control send safety | dry_run modes, daily limits, time windows |

---

## 4. COMPLETE FEATURE INVENTORY (A–Z)

Imam Agent Studio **must implement ALL of the following**. Nothing may be omitted.

### A. Agent Control
- [ ] Start agent with search query (hunt + continuous loop)
- [ ] Stop agent
- [ ] Agent status: running, current query, queue size, uptime
- [ ] Standalone hunt (no loop) — `POST /api/agent/hunt`
- [ ] Run orchestrator without hunt — `POST /api/agent/run` (process existing queue)
- [ ] Hunt failure must NOT block orchestrator start
- [ ] 8-second orchestrator cycle, batch size 3
- [ ] In-memory agent state + PostgreSQL as persistent queue

### B. Lead Discovery (Hunter)
- [ ] Google Places Text Search + Place Details (primary)
- [ ] SerpAPI Google Maps alternative (`huntWithSerpAPI` — must be UI-selectable)
- [ ] Captures: business name, website URL, phone number
- [ ] Skips businesses without website
- [ ] Deduplicates by website URL
- [ ] Rate-limited API calls (~200ms between detail fetches)
- [ ] Activity log entries for hunt start/success/failure

### C. Website Enrichment
- [ ] Fetch website HTML (HTTP/HTTPS, 10s timeout, 50KB truncate)
- [ ] Rate limiter before fetch
- [ ] Extract email from HTML (`mailto:`, visible addresses)
- [ ] Extract Instagram handle from social links
- [ ] Process phone → WhatsApp + SMS capability flags
- [ ] Store `websiteTextSnippet` for AI context
- [ ] Store `discoveryError` on failure
- [ ] Re-enrich leads missing channels OR missing `techStack`

### D. Tech & Accessibility Audit (CRITICAL — pain-point emails)
- [ ] Run on every successful HTML fetch during enrichment
- [ ] **Platform detection:** Shopify (`cdn.shopify.com`, `Shopify.shop`, `myshopify.com`, etc.), WordPress, Wix, Squarespace
- [ ] **Accessibility heuristics:** missing `alt` on images, missing ARIA on buttons/inputs, missing `<html lang>`
- [ ] **Performance heuristics:** oversized images, images without `loading="lazy"`, heavy script count (≥15)
- [ ] Persist `tech_stack` (JSONB) and `audit_pain_points` (TEXT)
- [ ] Display **Tech Audit card** on Lead Detail UI
- [ ] Feed audit data into AI brain prompts

### E. AI Brain (Message Generation)
- [ ] Provider switch: `LLM_PROVIDER=gemini` or `nvidia`
- [ ] Gemini default model: `gemini-2.5-flash`
- [ ] NVIDIA fallback with retry + timeout handling
- [ ] Context block: business name, website, snippet, `tech_stack`, `audit_pain_points`
- [ ] **Technical outreach instructions:** cite Shopify/WCAG/speed issues; position agency as WCAG + speed expert
- [ ] Generate JSON: email (subject + body), optional WhatsApp, optional Instagram
- [ ] Sanitize placeholders (`[Your Name]` etc.)
- [ ] Normalize business names
- [ ] Status → `ready_to_review` on success
- [ ] Retry on timeout; fallback plain-text body if JSON parse fails
- [ ] Sender identity from env: `AGENT_NAME`, `AGENCY_NAME`

### F. Human Review Workflow
- [ ] Review Queue page — all `ready_to_review` leads
- [ ] Approve & Send — moves to delivery immediately (agent need not be running)
- [ ] Reject with reason → `failed`
- [ ] `canDeliver` gating before approve
- [ ] Channel resolution from embedded JSON in legacy `msgEmail`
- [ ] Mark as Replied on completed leads (`repliedAt` timestamp)
- [ ] Review count badge in sidebar (live poll)

### G. Multi-Channel Delivery (Legacy Agent Path)
- [ ] **Email via Resend** — branded HTML + plain text
- [ ] `EMAIL_MODE=dry_run` → `EMAIL_TEST_RECIPIENT`
- [ ] `EMAIL_MODE=live` → real lead email
- [ ] **WhatsApp via Meta API** — dry_run logs success; live sends
- [ ] Instagram — stub in legacy path (must be completed in Studio)
- [ ] SMS — detected (`hasSms`) but **not sent** (Studio should implement or hide clearly)
- [ ] Update `lastContacted`, status `completed` or `failed`
- [ ] Activity log per delivery

### H. Leads Pipeline UI
- [ ] Paginated table, newest first
- [ ] Filter by status (pending, processing, ready_to_review, completed, failed, replied)
- [ ] Client-side search by name/email
- [ ] Lead Detail master-detail view (not separate route)
- [ ] Contact channel cards (Email, WhatsApp, Instagram, SMS)
- [ ] AI message previews (email, WhatsApp, Instagram)
- [ ] Tech Audit card
- [ ] Approve / Reject / Mark as Replied actions

### I. Dashboard
- [ ] Stat cards: Total, Completed, Replied, In Queue, Failed
- [ ] Channel breakdown: Email, WhatsApp, Instagram, SMS counts
- [ ] Live activity feed (30 items, typed icons)
- [ ] Start/Stop agent controls
- [ ] Hunt panel (expandable, separate query)
- [ ] Agent running indicator + uptime

### J. Campaign System
- [ ] Campaign list with status filters + search
- [ ] Campaign wizard (5 steps): Basics → Targeting → Agency Profile → Templates → Delivery Settings
- [ ] **POST /api/campaigns** create (currently MOCKED in UI — MUST wire)
- [ ] Campaign detail tabs: Overview, Leads, Analytics, Settings
- [ ] Start / Pause / Resume / Cancel / Duplicate
- [ ] Campaign runner: 30s cycle, batch 3
- [ ] Auto-hunt on campaign start
- [ ] Template engine with `{{variable}}` substitution
- [ ] AI template generation via Gemini (`/generate-template`)
- [ ] Default templates endpoint
- [ ] Template preview endpoint
- [ ] Auto-approve option per campaign
- [ ] Send time windows by timezone
- [ ] Daily per-channel send limits (`campaign_daily_stats`)
- [ ] Campaign-scoped lead approve/reject
- [ ] Multi-channel delivery (email + WhatsApp + Instagram)
- [ ] Campaign completion detection
- [ ] WebSocket live stats

### K. Analytics
- [ ] Campaign metrics, funnel, time-of-day performance
- [ ] Endpoints: `/analytics`, `/metrics`, `/funnel`, `/time`
- [ ] `CampaignAnalytics` component (exists but unused — MUST wire to UI)

### L. A/B Testing
- [ ] Create/list/start/stop A/B tests
- [ ] Variant assignment at send time (currently NOT wired — Studio must complete)
- [ ] Results calculation
- [ ] UI for A/B tests (currently MISSING — Studio must build)

### M. Webhooks
- [ ] Resend webhook: sent, delivered, opened, clicked, bounced, complained
- [ ] Updates `campaign_leads` tracking fields
- [ ] Webhook signature verification (currently stubbed — Studio must implement)

### N. Email Branding
- [ ] Premium light-theme HTML email
- [ ] Dark header bar with cyan accent `#00E5FF`
- [ ] ShuMUZ logo from Shopify CDN with `&width=96` for email (48px display)
- [ ] Signature block with agent name, title, email
- [ ] CTA to agency website
- [ ] Plain-text fallback
- [ ] Campaign emails MUST also use branded wrapper (currently gap)

### O. Activity & Audit Logging
- [ ] Global `activity_log`: hunter, enricher, brain, delivery, review, system, error
- [ ] Campaign `campaign_activity_log` with metadata JSONB
- [ ] Dashboard activity feed

### P. Stats & Health
- [ ] `GET /api/stats` — pipeline + channel counts
- [ ] `GET /api/healthz`
- [ ] Studio should add `ready_to_review` count to stats

### Q. Branding in App UI
- [ ] Sidebar logo (Shopify CDN `&width=64`, 32px display)
- [ ] Favicon (Shopify CDN `&width=64`)
- [ ] Product name: rebrand to **Imam Agent Studio** while keeping ShuMuz Labs as agency identity in emails

### R. Developer / Ops
- [ ] Drizzle schema push
- [ ] Safe migration scripts for new columns
- [ ] esbuild API bundle
- [ ] Vite frontend with `/api` proxy to 8080
- [ ] OpenAPI → Orval → React Query codegen
- [ ] pnpm workspace monorepo

---

## 5. AGENT PIPELINE — DEEP SPECIFICATION

### Orchestrator loop (`orchestrator.ts`)

Every **8 seconds**, if `agentState.running`:

```
STEP 1 — ENRICH
  SELECT leads WHERE status = 'pending' LIMIT 3
  FOR EACH → enrich(id, name, websiteUrl)

  SELECT leads WHERE status = 'processing' LIMIT 3
  FOR EACH where (missing channels OR missing techStack) AND (website OR phone)
    → re-enrich

STEP 2 — BRAIN
  SELECT leads WHERE status = 'processing' LIMIT 3
  FOR EACH → generateMessages(lead)

  SELECT ready_to_review WHERE all msg fields NULL LIMIT 3
  → set processing → generateMessages

STEP 3 — DELIVER
  SELECT leads WHERE status = 'ready_to_send' LIMIT 3
  FOR EACH → deliver(lead)

UPDATE agentState.queueSize = count(pending + processing + ready_to_review + ready_to_send)
```

### Enricher sequence (`enricher.ts`)

```
1. websiteRateLimiter.wait()
2. fetchWebsite(url) → html + textSnippet
3. auditTechStack(html) → techStack + auditPainPoints
4. extractEmail(html)
5. extractInstagramHandle(html)
6. processPhoneNumber(lead.phone) → hasWhatsapp, hasSms
7. UPDATE leads SET ... status = 'processing'
8. logActivity enricher success/error
```

### Brain sequence (`brain.ts`)

```
1. buildContextBlock(lead) — includes tech audit
2. generateLeadMessages() — Gemini or NVIDIA
3. parseAiResponse → formatEmailStorage
4. UPDATE leads SET msgEmail, msgWhatsapp, msgInstagram, status = 'ready_to_review'
5. logActivity brain success/error
```

### Delivery sequence (`delivery.ts`)

```
1. resolveLeadChannels(lead)
2. IF email → deliverEmail via Resend (branded HTML)
3. IF whatsapp → Meta API (dry_run or live)
4. IF instagram → skip/error in legacy path
5. UPDATE status completed/failed, lastContacted
6. logActivity delivery
```

---

## 6. LEAD LIFECYCLE & STATE MACHINES

### Global lead statuses (`leads.status`)

```
pending
  └─ enricher ──► processing
                    └─ brain ──► ready_to_review
                                    ├─ POST approve ──► ready_to_send ──► deliver ──► completed
                                    └─ POST reject  ──► failed
                    └─ brain empty ──► failed
                    └─ brain timeout ──► processing (retry)

completed + POST mark-replied ──► repliedAt set (status stays completed)
```

**UI treats `repliedAt` as "Replied" badge** even when status is `completed`.

### Campaign lead statuses (`campaign_leads.status`)

```
pending → enriched → messages_generated → approved → sent
                                              ↓
                                         failed / replied / rejected
```

---

## 7. TECH & ACCESSIBILITY AUDIT MODULE

**File:** `artifacts/api-server/src/agent/discovery/techAuditor.ts`

### Output shape (`tech_stack` JSONB)

```typescript
{
  platform: string | null;      // "Shopify" | "WordPress" | "Wix" | "Squarespace" | null
  isShopify: boolean;
  detected: string[];             // markers found in HTML
  accessibility: {
    totalImages: number;
    missingAltImages: number;
    missingAriaInteractive: number;
    missingHtmlLang: boolean;
  };
  performance: {
    largeImages: number;
    imagesWithoutLazyLoad: number;
    scriptTags: number;
  };
}
```

### `audit_pain_points` (human-readable summary)

Example outputs:
- `"Site runs on Shopify — theme performance and Core Web Vitals directly affect conversion rate."`
- `"3 of 8 images lack alt text (WCAG 1.1.1 — hurts SEO and screen-reader users)."`
- `"2 interactive elements missing ARIA labels..."`
- `"No major technical red flags detected in lightweight HTML scan."`

### UI: Tech Audit Card (Lead Detail)

Must show:
- Platform badge (Shopify, WordPress, etc.)
- Detected markers (chips)
- A11y metrics: missing alt, missing ARIA
- Speed metrics: large images, script count
- Full `auditPainPoints` text with warning icon

---

## 8. AI BRAIN — MESSAGE GENERATION

### Prompt must include

```
Business: {name}
Website: {url}
Website content: {snippet up to 600 chars}
tech_stack: {JSON}
audit_pain_points: {summary}

Technical audit guidance:
- If Shopify or a11y/speed issues → mention in email
- Position {AGENCY_NAME} as WCAG audit + site speed expert
- Consultative tone, one concrete technical observation
- Sender: {AGENT_NAME} at {AGENCY_NAME} — no placeholders
```

### Output JSON schema

```json
{
  "email": { "subject": "...", "body": "plain text, 3 paragraphs, max 120 words" },
  "whatsapp": "optional, under 80 words",
  "instagram": "optional, under 50 words"
}
```

### LLM configuration

| Env | Effect |
|-----|--------|
| `LLM_PROVIDER=gemini` | Google Gemini |
| `LLM_PROVIDER=nvidia` | NVIDIA NIM chat completions |
| `GEMINI_MODEL` | Default `gemini-2.5-flash` |
| `NVIDIA_MODEL_BRAIN` | Primary NVIDIA model |
| `NVIDIA_TIMEOUT_MS` | Default 90000 |
| `NVIDIA_MIN_DELAY_MS` | Rate limit delay |

---

## 9. DELIVERY & CHANNELS

| Channel | Legacy Agent | Campaign | dry_run | live |
|---------|-------------|----------|---------|------|
| Email (Resend) | ✅ Branded HTML | ✅ Template HTML (no brand wrapper — FIX) | ✅ Test inbox | ✅ Lead email |
| WhatsApp (Meta) | ✅ | ✅ | ✅ Log only | ✅ Send |
| Instagram (Meta) | ❌ Stub | ⚠️ Stub client | — | — |
| SMS (Twilio) | ❌ Flag only | ❌ | — | — |

### Resend email tags

Must NOT duplicate `lead_id` tag (causes 422).

### Approve triggers immediate delivery

`POST /api/leads/:id/approve` → `deliver()` in same request. Operator does not need agent running.

---

## 10. CAMPAIGN SYSTEM

### Campaign JSONB fields

**`agencyProfile`:**
```typescript
{ name, email, website?, phone?, services[], valueProposition?, socialProof? }
```

**`messageTemplates`:**
```typescript
{ email: { subject, body }, whatsapp?: { body }, instagram?: { body } }
```

**`deliverySettings`:**
```typescript
{
  channels: ("email"|"whatsapp"|"instagram")[];
  autoApprove: boolean;
  dailyLimits: { email, whatsapp, instagram };
  sendWindow: { startHour, endHour, timezone };
  minDelayBetweenSendsMs?;
}
```

### Campaign runner cycle (30s)

```
1. Check send window + daily limits
2. Pick pending campaign leads
3. enrich → template render OR brain fallback
4. autoApprove or wait for manual approve
5. deliverMultiChannel
6. broadcast WebSocket stats
7. checkCampaignCompletion
```

---

## 11. API CONTRACT — EVERY ENDPOINT

Base: `/api`

### Core
| Method | Path | Body | Response |
|--------|------|------|----------|
| GET | `/healthz` | — | `{ status: "ok" }` |
| GET | `/stats` | — | total, pending, processing, readyToSend, completed, failed, replied, channel* |
| GET | `/activity?limit=` | — | activity array |

### Agent
| Method | Path | Body |
|--------|------|------|
| GET | `/agent/status` | — |
| POST | `/agent/start` | `{ query: string }` |
| POST | `/agent/run` | — |
| POST | `/agent/stop` | — |
| POST | `/agent/hunt` | `{ query: string }` |

### Leads
| Method | Path | Body |
|--------|------|------|
| GET | `/leads?status&limit&offset` | — |
| GET | `/leads/:id` | — |
| POST | `/leads/:id/approve` | — |
| POST | `/leads/:id/reject` | `{ reason?: string }` |
| POST | `/leads/:id/mark-replied` | `{ note?: string }` |

### Campaigns
| Method | Path |
|--------|------|
| GET/POST | `/campaigns` |
| GET/PATCH/DELETE | `/campaigns/:id` |
| POST | `/campaigns/:id/start\|pause\|resume\|cancel\|duplicate` |
| GET | `/campaigns/:id/leads` |
| POST | `/campaigns/:id/leads/:leadId/approve\|reject` |
| POST | `/campaigns/preview-template` |
| GET | `/campaigns/default-templates` |
| POST | `/campaigns/generate-template` |
| GET | `/campaigns/template-suggestions` |

### Analytics
| GET | `/campaigns/:id/analytics` |
| GET | `/campaigns/:id/analytics/metrics` |
| GET | `/campaigns/:id/analytics/funnel` |
| GET | `/campaigns/:id/analytics/time` |

### A/B Tests (fix routing in Studio)
| GET/POST | `/campaigns/:id/ab-tests` (canonical — fix from `/ab-tests/:id/ab-tests`) |
| POST | `/ab-tests/:testId/start\|stop` |
| GET | `/ab-tests/:testId/results` |

### Webhooks
| POST/GET | `/webhooks/resend` |

### WebSocket
- Path: `/ws`
- Client joins room: `campaign-{id}`
- Events: `campaign:stats-update`, `lead:status-change`, `campaign:completed`

---

## 12. DATABASE SCHEMA

### `leads`
| Column | Type | Notes |
|--------|------|-------|
| id | serial PK | |
| business_name | text | normalized |
| website_url | text | |
| phone_number | text | |
| email | text | |
| instagram_handle | text | |
| has_email, has_whatsapp, has_sms, has_instagram | boolean | |
| msg_email, msg_whatsapp, msg_instagram | text | |
| website_text_snippet | text | AI context |
| discovery_error | text | |
| **tech_stack** | **jsonb** | Tech audit |
| **audit_pain_points** | **text** | Pain summary |
| status | text | state machine |
| retry_count | integer | |
| error_log | text | |
| last_contacted | timestamptz | |
| replied_at | timestamptz | |
| created_at, updated_at | timestamptz | |

### `activity_log`
`id, lead_id, lead_name, type, channel, message, status, created_at`

### `campaigns` + `campaign_leads` + `campaign_daily_stats` + `campaign_activity_log` + `ab_tests`

See `lib/db/src/schema/campaigns.ts` and migration `0004_add_ab_tests.sql`.

---

## 13. INTEGRATIONS & ENVIRONMENT VARIABLES

### Required
```
DATABASE_URL=
PORT=8080
GOOGLE_PLACES_API_KEY=
AI_INTEGRATIONS_GEMINI_API_KEY=
AI_INTEGRATIONS_GEMINI_BASE_URL=
RESEND_API_KEY=
RESEND_FROM_EMAIL=
```

### Identity & branding
```
AGENT_NAME=Muzamil Imam
AGENCY_NAME=ShuMuz Labs
AGENCY_WEBSITE_URL=https://shumuzlabs.com
AGENCY_TAGLINE=Your technical co-founder, on demand
AGENCY_LOGO_URL=https://cdn.shopify.com/s/files/1/0689/2611/1809/files/ShuMUZ_Labs_logo_icon_19a36d6f-22b7-4318-9c90-a6d9cb1dfb38.png?v=1780939993
```

### Safety modes
```
EMAIL_MODE=dry_run|live
EMAIL_TEST_RECIPIENT=
WHATSAPP_MODE=dry_run|live
```

### LLM
```
LLM_PROVIDER=gemini|nvidia
GEMINI_MODEL=gemini-2.5-flash
NVIDIA_API_KEY=
NVIDIA_MODEL_BRAIN=
NVIDIA_TIMEOUT_MS=90000
```

### Optional
```
SERPAPI_KEY=
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_BUSINESS_ACCOUNT_ID=
INSTAGRAM_ACCESS_TOKEN=
FRONTEND_URL=http://localhost:5173
```

---

## 14. EMAIL & BRAND SYSTEM

### Shopify CDN image sizing

```typescript
// Base URL from AGENCY_LOGO_URL
// Append &width=N for optimized delivery
getBrandLogoSrc({ width: 96 })  // Email header (48px display, 2x retina)
getBrandLogoSrc({ width: 64 })  // Sidebar / favicon (32px display)
```

### Email structure (brandedEmailTemplate.ts)

1. Dark header (`#0A0A0A`) with logo + agency name + tagline
2. Cyan accent rule (`#00E5FF`)
3. Body paragraphs (light theme `#FAFAFA` page, white card)
4. Signature block with avatar initials, name, title, email
5. CTA card → Visit shumuzlabs.com
6. Footer with copyright

**Files:**
- `artifacts/api-server/src/lib/brandLogo.ts`
- `artifacts/api-server/src/lib/brandedEmailTemplate.ts`
- `artifacts/api-server/src/lib/emailMessage.ts`

---

## 15. FRONTEND — UX/UI BIBLE (PAGE BY PAGE)

### Global shell (`App.tsx`)
- Left sidebar (240px, dark navy)
- Main content area with padding
- React Query: 5s refetch, 3s staleTime
- Toaster for mutations
- Routes via Wouter

### `/` Dashboard
**User sees:** pipeline stats, channel bars, activity feed, agent controls  
**User can:**
- Type query → Start Agent
- Stop Agent
- Expand Hunt panel → run one-off hunt
- Watch live activity (hunter/enricher/brain/delivery events)

### `/leads` Leads Pipeline
**User sees:** filterable table, status badges, channel dots  
**User can:**
- Filter by status pill
- Search by name/email (client-side)
- Paginate (limit/offset)
- Click row → Lead Detail panel
- In detail: view contacts, Tech Audit, AI messages
- Approve & Send (if ready_to_review)
- Reject
- Mark as Replied (if completed)

### `/review` Review Queue
**User sees:** cards for each ready_to_review lead  
**User can:**
- Read email/WhatsApp/Instagram previews (expand/collapse)
- Approve & Send per card
- Reject per card
- Badge count in sidebar updates

### `/campaigns` Campaign List
**User sees:** grid of campaign cards with status badges  
**User can:**
- Filter by status tab
- Search by name
- Start / Pause / Resume from card
- Duplicate from dropdown
- Navigate to detail or wizard

### `/campaigns/new` Campaign Wizard (5 steps)
1. **Basics** — name, description
2. **Targeting** — business type, location, search query, max leads
3. **Agency Profile** — name, email, services, value prop
4. **Templates** — email/WhatsApp/Instagram with `TemplateEditor` + variables
5. **Delivery** — channels, auto-approve, daily limits, send window

**User can:** save draft to localStorage, navigate steps, submit  
**MUST FIX:** Submit must call `POST /api/campaigns` (currently mocked)

### `/campaigns/:id` Campaign Detail
**Tabs:**
- **Overview** — progress, stats, recent activity
- **Leads** — campaign leads table (MUST wire Send/Retry/View)
- **Analytics** — MUST use real `CampaignAnalytics` API (currently mock charts)
- **Settings** — MUST wire Edit (PATCH) and Delete

**User can:** Start/Pause/Resume/Cancel/Duplicate  
**WebSocket:** live stats refresh

### Sidebar
- Logo (Shopify CDN)
- Nav: Dashboard, Leads, Review Queue (badge), Campaigns
- Footer: AI Agent version label

---

## 16. DESIGN SYSTEM TOKENS

**File:** `artifacts/frontend/src/index.css`

| Token | Light value | Usage |
|-------|-------------|-------|
| `--primary` | `262 80% 60%` | Purple brand |
| `--background` | `220 20% 97%` | Page bg |
| `--card` | white | Cards |
| `--destructive` | `0 72% 51%` | Errors, reject |
| `--chart-1`–`5` | purple, teal, orange, red, blue | Pipeline stages |
| `--sidebar-*` | dark navy `222 47% 11%` | Nav |
| Accent (email) | `#00E5FF` | ShuMuz cyan |

**Typography:** Inter (sans), JetBrains Mono (templates)  
**Icons:** Lucide React  
**Components:** shadcn/ui (button, card, badge, tabs, input, select, switch, slider, dropdown, toast, tooltip)

**Imam Agent Studio rebrand:** Keep design system structure; update product name, optionally refine cyan/purple balance for "Studio" feel.

---

## 17. REAL-TIME & WEBSOCKETS

**Hook:** `artifacts/frontend/src/hooks/useCampaignSocket.ts`

```typescript
// Connect to window.location.origin, path /ws
// emit: join-campaign { campaignId }
// on: campaign:stats-update → invalidate campaign queries
// on: lead:status-change
// on: campaign:completed
```

**Studio upgrade:** Add WebSocket events for global agent pipeline (not just campaigns).

---

## 18. ANALYTICS & A/B TESTING

### Analytics service (`services/analytics.ts`)
- Delivery rate, open rate, click rate, reply rate
- Funnel: found → enriched → approved → sent → replied
- Optimal send times by hour/day

### A/B testing (`services/abTesting.ts`)
- Variants stored in JSONB
- `assignVariant`, `recordEvent` exist but **not called at delivery** — Studio must wire
- Fix route mount to `/api/campaigns/:id/ab-tests`
- Build UI: create test, start/stop, view results, declare winner

---

## 19. MONOREPO & TECH STACK

```
pnpm workspace
├── artifacts/api-server     Express 5 + esbuild
├── artifacts/frontend       React 19 + Vite 7 + Tailwind 4
├── lib/db                   Drizzle ORM
├── lib/api-spec             OpenAPI 3.1
├── lib/api-zod              Zod validators
├── lib/api-client-react     Orval hooks
├── lib/integrations-*       Resend, WhatsApp, Instagram, Gemini
```

### Dev commands
```bash
pnpm install
pnpm --filter @workspace/db run push
$env:PORT="8080"; pnpm --filter @workspace/api-server run dev
$env:PORT="5173"; pnpm --filter @workspace/frontend run dev
```

### Codegen
```bash
pnpm --filter @workspace/api-spec run codegen
```

---

## 20. KNOWN GAPS IN CURRENT CODEBASE (MUST FIX)

Imam Agent Studio **must fix all of these** while achieving parity:

| # | Gap | Priority |
|---|-----|----------|
| 1 | Campaign Wizard submit is **mocked** — no `POST /campaigns` | P0 |
| 2 | Campaign API response shape mismatch (`{ success, data }` vs flat) | P0 |
| 3 | `GET /campaigns/:id/activities` called by UI but **route missing** | P0 |
| 4 | Campaign Analytics tab uses **fake data**; `CampaignAnalytics.tsx` unused | P0 |
| 5 | Campaign email path **missing branded HTML wrapper** | P0 |
| 6 | Campaign leads Send/Retry/View buttons are **stubs** | P1 |
| 7 | Settings Edit/Delete campaign **stubs** | P1 |
| 8 | A/B test routes **wrong mount path** + no UI | P1 |
| 9 | A/B variant assignment **not wired** to delivery | P1 |
| 10 | Instagram delivery **stubbed** everywhere | P1 |
| 11 | SMS detected but never sent — hide or implement | P2 |
| 12 | No `POST /api/agent/run` button in UI | P2 |
| 13 | No auth/login page but 401 redirects to `/login` | P2 |
| 14 | OpenAPI missing many routes — codegen incomplete for campaigns | P2 |
| 15 | `ready_to_review` not in `/api/stats` | P2 |
| 16 | Webhook signature verification always `true` | P2 |
| 17 | Campaign path has no `EMAIL_MODE=dry_run` | P1 |
| 18 | Review Queue doesn't invalidate sidebar badge after approve | P2 |
| 19 | Duplicate approve/reject logic (fetch vs hooks) — consolidate | P2 |
| 20 | Dark mode CSS exists, no toggle | P3 |

---

## 21. IMAM AGENT STUDIO — REQUIRED UPGRADES BEYOND PARITY

These make Imam Agent Studio a **true hybrid superset**, not just a rename:

### Product identity
- [ ] Rebrand UI: **Imam Agent Studio** (sidebar, title, favicon alt text)
- [ ] Keep ShuMuz Labs as **agency identity inside outreach emails** (configurable)
- [ ] Settings page for operator identity (name, agency, logo, tagline) — no `.env` edit required

### UX excellence
- [ ] Unified command palette (start agent, hunt, go to review)
- [ ] Regenerate AI message button on Lead Detail
- [ ] Inline message editing before approve
- [ ] Confirmation dialogs for reject/cancel/delete
- [ ] Empty states with guided next steps
- [ ] Loading skeletons on all data pages
- [ ] Toast consistency (all mutations via same pattern)

### Agent upgrades
- [ ] SerpAPI vs Google Places selector in hunt UI
- [ ] `POST /api/agent/run` button: "Process existing queue"
- [ ] Per-lead re-enrich button
- [ ] Per-lead regenerate messages button
- [ ] Global agent WebSocket progress (not only campaigns)

### Delivery upgrades
- [ ] Instagram DM fully implemented (Meta Graph API)
- [ ] Campaign emails use `buildBrandedEmailHtml()`
- [ ] Campaign `EMAIL_MODE=dry_run` support
- [ ] In-app delivery status from Resend webhooks (opens, clicks, bounces)
- [ ] SMS via Twilio (optional module)

### Campaign upgrades
- [ ] Wire wizard → API
- [ ] Schedule campaign (`scheduledAt`) UI
- [ ] Export campaign data (CSV)
- [ ] A/B testing UI inside campaign detail
- [ ] AI template generator in wizard step 4

### Observability
- [ ] Health indicator in sidebar (`/api/healthz`)
- [ ] DB connection status
- [ ] Integration status panel (Resend ✓, WhatsApp ✓, Gemini ✓, Places ✓)

---

## 22. NON-FUNCTIONAL REQUIREMENTS

| Requirement | Target |
|-------------|--------|
| API response (stats, leads list) | < 2s |
| Enrichment per lead | < 15s (website fetch) |
| AI generation | < 90s with retry |
| Orchestrator cycle | 8s (agent), 30s (campaign) |
| Frontend | Works 1280px+; responsive tablet |
| Email | Renders in Gmail, Outlook, Apple Mail |
| Security | Webhook signature verify; no secrets in client |
| Rate limits | Website fetch limiter; NVIDIA delay; campaign daily caps |

---

## 23. ACCEPTANCE CRITERIA — DEFINITION OF DONE

Imam Agent Studio is **complete** when an operator can:

1. ✅ Open studio in browser at `localhost:5173`
2. ✅ Start agent with query `"restaurants Miami"` → leads appear in pipeline
3. ✅ See enrichment run → contacts + **Tech Audit** populated on lead detail
4. ✅ See AI messages in Review Queue citing **technical pain points** when Shopify/a11y issues exist
5. ✅ Approve lead → branded email arrives in test inbox (`EMAIL_MODE=dry_run`)
6. ✅ Mark lead as replied
7. ✅ Create campaign via wizard (real API) → start → leads process → analytics show real data
8. ✅ Pause/resume campaign; see WebSocket stats update
9. ✅ All sidebar pages functional with no stub buttons on critical paths
10. ✅ Every endpoint in Section 11 has working UI or documented server-only use

---

## 24. FILE MAP — WHERE EVERYTHING LIVES

### Backend — Agent
```
artifacts/api-server/src/agent/
├── orchestrator.ts      # Main loop
├── hunter-api.ts        # Google Places + SerpAPI
├── enricher.ts          # Enrichment orchestration
├── brain.ts             # AI message generation
├── delivery.ts          # Legacy delivery
├── discovery/
│   ├── website.ts
│   ├── emailExtractor.ts
│   ├── socialExtractor.ts
│   ├── phone.ts
│   └── techAuditor.ts   # Tech & a11y audit
└── logActivity.ts
```

### Backend — Campaign services
```
artifacts/api-server/src/services/
├── campaign.ts
├── campaignOrchestrator.ts
├── campaignRunner.ts
├── multiChannelDelivery.ts
├── emailDelivery.ts
├── autoApproval.ts
├── templateEngine.ts
├── templateLibrary.ts
├── analytics.ts
├── abTesting.ts
├── websocket.ts
├── timeWindow.ts
└── dailyLimitTracker.ts
```

### Backend — Routes
```
artifacts/api-server/src/routes/
├── agent.ts, leads.ts, stats.ts, activity.ts, health.ts
├── campaigns.ts, analytics.ts, abTesting.ts, webhooks.ts
```

### Frontend
```
artifacts/frontend/src/
├── App.tsx
├── pages/ Dashboard, Leads, ReviewQueue, Campaigns, CampaignWizard, CampaignDetail
├── components/ Sidebar, TemplateEditor, CampaignAnalytics, CampaignStatusBadge
├── hooks/ useCampaignSocket.ts
└── lib/ brandLogo.ts, api-client.ts
```

### Database
```
lib/db/src/schema/ leads.ts, activityLog.ts, campaigns.ts
lib/db/src/migrations/ 0004_add_ab_tests.sql, 0005_add_tech_audit_columns.sql
```

### Integrations
```
lib/integrations-resend/
lib/integrations-whatsapp/
lib/integrations-instagram/
lib/integrations-gemini-ai/
```

---

## 25. MASTER BUILD PROMPT (COPY-PASTE BLOCK)

Copy everything below this line into your other IDE AI as the **initial system/task prompt**:

---

```
You are building IMAM AGENT STUDIO — a production-grade upgrade of the ShuMuz Lead Generation Agent codebase.

MISSION: Deliver 100% feature parity with the existing agent (hunt, enrich, tech audit, AI brain, review, deliver, campaigns, analytics, websockets) at UX, UI, and code level. Then fix all known gaps and add Studio-grade polish.

NON-NEGOTIABLE CAPABILITIES (every one must work end-to-end):

1. AGENT PIPELINE: Google Places hunt → website enrich → techAuditor (Shopify/WCAG/speed) → brain (Gemini 2.5 Flash or NVIDIA) with pain-point prompts → ready_to_review → human approve → Resend email delivery (branded HTML, Shopify CDN logo with &width=) + WhatsApp dry_run/live.

2. LEAD UI: Dashboard (start/stop/hunt), Leads pipeline (filter, paginate, detail with Tech Audit card), Review Queue (approve/reject), Mark as Replied.

3. CAMPAIGNS: Full wizard wired to POST /api/campaigns (NOT mocked), campaign runner, templates with {{vars}}, auto-approve, time windows, daily limits, multi-channel delivery, real analytics (not mock charts), WebSocket live updates.

4. FIX GAPS: Campaign API response shapes, missing activities route, branded email on campaign path, EMAIL_MODE dry_run on campaigns, A/B test routes + UI + delivery wiring, Instagram implementation, OpenAPI codegen for all routes.

5. BRAND: Imam Agent Studio in app chrome; ShuMuz Labs (Muzamil Imam) in outreach emails; logo from Shopify CDN with size params.

TECH STACK: pnpm monorepo, Express 5, Drizzle/PostgreSQL, React 19, Vite, Tailwind 4, shadcn/ui, TanStack Query, Socket.io, Resend, Meta WhatsApp, Gemini.

REFERENCE: Read docs/IMAM_AGENT_STUDIO_PROJECT_BIBLE.md in the repo for full specs, state machines, API list, schema, env vars, page-by-page UX, and acceptance criteria.

WORK IN ORDER:
Phase 1 — Fix P0 gaps (campaign wizard API, response shapes, analytics wiring, branded campaign emails)
Phase 2 — Complete delivery (Instagram, dry_run campaigns, webhooks UI)
Phase 3 — A/B testing UI + delivery assignment
Phase 4 — Studio UX (regenerate, edit messages, settings page, agent/run button, health panel)
Phase 5 — Rebrand to Imam Agent Studio

Do not remove any existing functionality. Do not skip tech audit or pain-point email prompts. Test with EMAIL_MODE=dry_run before live.

Definition of done: All 10 acceptance criteria in Section 23 of the Bible pass.
```

---

*Document version: 1.0 — Generated from full codebase analysis of ShuMuz Lead Generation Agent (June 2026)*  
*Source repo: `c:\ShuMuz projects\ShuMuz Agent\ShuMuz Lead Generation Agent`*
