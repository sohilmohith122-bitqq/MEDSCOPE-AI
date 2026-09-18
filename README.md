<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=0e9fa4&height=200&section=header&text=%F0%9F%8F%A5%20MEDSCOPE-AI&fontSize=54&fontColor=ffffff&animation=fadeIn&fontAlignY=38&desc=Medical%20Document%20Intelligence%20%26%20Patient%20Timeline&descAlignY=62&descSize=18" alt="MEDSCOPE-AI 3D wave banner" width="100%" />

### Turn fragmented medical records into one understandable, evidence-backed patient journey.

[![Next.js](https://img.shields.io/badge/Next.js-14.2-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17-336791?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5.22-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![Tailwind](https://img.shields.io/badge/Tailwind-3.4-38BDF8?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

<img src="https://readme-typing-svg.demolab.com?font=JetBrains+Mono&size=16&duration=2200&pause=800&color=2CBFC4&center=true&vCenter=true&width=700&lines=%E2%9A%A0%EF%B8%8F+AI-organized+from+your+records+%E2%80%94+not+medical+advice;Every+fact+cites+document+%2B+page+%2B+quote;Upload+%E2%86%92+Timeline+%E2%86%92+CareShare+%2B+Break-Glass" alt="typing status lines" />

[Features](#-key-features) · [Live Demo](#-demo-credentials) · [Quickstart](#-quickstart) · [Architecture](#%EF%B8%8F-architecture) · [API](#-api-reference) · [Testing](#-testing--quality-gates)

<img src="https://capsule-render.vercel.app/api?type=rect&color=gradient&height=6&section=header" width="100%" />

</div>

---

## 📖 Overview

<img align="right" src="https://cdn3d.iconscout.com/3d/premium/thumb/medical-report-3d-illustration-download-in-png-blend-fbx-gltf-file-formats--healthcare-hospital-document-checkup-pack-illustrations-7321946.png?f=webp" width="220" alt="3D medical report illustration" />

**MEDSCOPE-AI** (formerly MEDCARE, HE-05) is a full-stack clinical document intelligence platform. Patients upload PDFs and scans; the system classifies, extracts precision-faithful clinical events, and assembles a **traceable timeline** with episodes, relationship graphs, conflicts, gaps, and What-Changed snapshots. Doctors get a **30-second cockpit** over scoped data. Sharing is **patient-controlled** (expiring, scoped, revocable) with **audited emergency break-glass** and a **grounded History AI** that cites evidence and refuses medical advice.

### ✨ Key Features

| Area | What it does |
|------|--------------|
| 📄 **Document Intelligence** | Upload PDF/JPG/PNG → SHA-256 dedupe → immutable storage → classify → Zod-validated extraction with exact evidence quotes |
| 🕒 **Evidence-First Timeline** | Precision-aware sorting (EXACT / MONTH / YEAR / APPROXIMATE / RELATIVE / UNKNOWN); every event links document + page + quote |
| 🧩 **Episodes & Graph** | 30-day temporal clustering; typed relationships (adjacency = ordering only, never causation) |
| ⚠️ **Conflicts & Gaps** | Dosage discrepancies surfaced as OPEN conflicts (never auto-resolved); >90-day undocumented gaps flagged |
| 📸 **What Changed** | Per-ingest state snapshots with diffs across conditions, meds, labs, procedures, hospitalizations |
| 👨‍⚕️ **Doctor Cockpit** | 30-second overview — conditions, medications, labs, hospitalizations, conflicts, gaps (strictly scoped) |
| 🔗 **CareShare** | Scoped (`TIMELINE / MEDICATIONS / LABS / …`), expiring (`1h / 24h / 7d / custom`), revocable token links; hashes never leak |
| 🚨 **Break-Glass** | Doctor-only emergency access: reason ≥ 10 chars + OTP + explicit confirm, 1-hour time-box, fully audited |
| 💬 **History AI** | Grounded Q&A with citations; refuses dosage/diagnosis advice with disclaimer + cited records |
| 📊 **Audit Trail** | Append-only log of logins, uploads, views, shares, revokes, emergencies — never blocks requests |
| 📱 **Responsive UI** | Mobile-first landing (stacked CTAs, fluid type, touch-size buttons), glass-card dark clinical theme |

### 🔑 Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| 🧑 Patient | `patient@demo.medcare` | `demo1234` |
| 👩‍⚕️ Doctor | `doctor@demo.medcare` | `demo1234` |

> 🚨 Emergency OTP (simulated mode): `123456`
> 🌱 Seed: 15 docs · 6 types · 1 duplicate skipped · Metformin 500-vs-1000 conflict · RELATIVE follow-up · labs across 2 providers · 2 hospitals · 1 timeline gap

<!-- PART2 -->

## 🛠️ Tech Stack

| Layer | Technology | Details |
|-------|-----------|---------|
| 🖥️ **Framework** | Next.js 14.2 (App Router) | SSR pages + Route Handlers as API (`app/api/*`); `middleware.ts` page guards |
| ⚛️ **UI** | React 18 · Tailwind 3.4 · `clinical`/`surface` theme | Glass-card design system (`app/globals.css`); `lucide-react` icons; `canvas` aliased off for `react-pdf` |
| 🗄️ **Database** | PostgreSQL 17 · Prisma 5.22 | 16 models in `db/schema.prisma`; `DATABASE_URL` / `DIRECT_URL` |
| ✅ **Validation** | Zod | Upload meta, AI extraction schema, share create, emergency request, pagination |
| 🤖 **AI** | Pluggable providers + deterministic Mock | `ai/providers.ts` interfaces, `ai/mockProvider.ts` rules (no API keys); `AI_PROVIDER=mock`, `OCR_PROVIDER=mock` |
| 🔄 **Client State** | zustand · TanStack Query | Stores + server-state queries |
| 📊 **Visualization** | reactflow 11 · recharts 2 · react-pdf 9 | Journey graph, lab trends, document viewer |
| 💾 **Storage** | Local FS (`storage/documents/`) | Immutable originals, authorized streams only |
| 🔐 **Auth** | Cookie `medcare_session` (HttpOnly, SameSite=Lax) | `lib/auth.ts` sessions · `middleware.ts` page guard · `lib/rbac.ts` object checks (IDOR-safe) |
| 🧪 **Tests** | Vitest · Node E2E · PowerShell E2E | `tests/` + `scripts/e2e.mjs` + `.pg/e2e.ps1` / `smoke.ps1` |
| 📦 **Tooling** | pnpm 9 · TS 5.6 strict · ESLint · tsx | `@/*` path alias; `packageManager: pnpm@9.15.1` |

## 🏗️ Architecture

```text
Browser (App Router)
 ├─ / · /signin · /signup · /forgot
 ├─ /patient/*  overview · journey · documents · ask · share · access-history
 ├─ /doctor/*   dashboard · patients · shared · emergency · audit
 └─ /share/[token]  (public, token-gated)
        │  cookie: medcare_session
        ▼
middleware.ts ── /patient|/doctor without session → /signin
        ▼
API Route Handlers (app/api/*) ── getSession → requireRole → rbac scope check
 ├─ auth      signup · signin · signout
 ├─ upload    → storage (sha256 dedupe) → process pipeline
 ├─ process   → classify → extract → persist
 ├─ timeline · events · documents · snapshots · audit   (scoped reads)
 ├─ documents/[id]/file   (authorized binary stream)
 ├─ chat      → HistoryAI (grounded, refuses advice)
 ├─ share     → token create · list · revoke
 └─ emergency → break-glass (reason + OTP + 1h box)
        ▼
Services/ ── Timeline · Episode · Extraction · DocumentProcessing
             Conflict · Snapshot · Share · Emergency · HistoryAI
        ▼
Prisma Client (lib/db.ts) → PostgreSQL  →  storage/documents/* (originals)
```

**Module guide** — `lib/enums.ts` (EvidenceStatus, DatePrecision, EventType×9, ShareScope×7, …) · `lib/validation.ts` (upload ≤15 MB, extraction requires `evidence_quote` + `source_page`) · `DocumentProcessingService` (CLASSIFYING→EXTRACTING→PROCESSED|FAILED, 3 attempts) · `TimelineService` (null-date fuzzy bands last) · `EpisodeService` (30-day clusters) · `ConflictService` (dosage conflicts + 90-day gaps, never auto-resolved) · `SnapshotService` (What-Changed diffs) · `HistoryAIService` (retrieval + citations + advice refusal) · `ShareService` (`randomBytes(24)` + HMAC hash) · `EmergencyService` (1-hour audited sessions) · `lib/rbac.ts` (PatientDoctor link OR live share).

<!-- PART3 -->

## 🗃️ Data Model (16 Prisma models)

- **Identity** — `User` (unique email, demo-grade SHA-256 hash) → `PatientProfile` / `DoctorProfile`; `PatientDoctor` join (unique pair) gates doctor access.
- **Clinical core** — `Document` (`storageKey`, `sha256`, `docType`, `status`) → `DocumentPage`; `ClinicalEvent` (`eventType`, `title`, `eventDate?`, `datePrecision`, `sourceDocumentId` + `sourcePage` + `evidenceQuote`, `evidenceStatus`, `confidence`, `extractedEntities`) → `EvidenceItem`; `EventRelationship` (typed edges + `derivedRule`); `ClinicalEpisode` (30-day clusters); `PatientStateSnapshot`; `Conflict` (OPEN); `TimelineGap`.
- **Sharing & audit** — `ShareSession` (`tokenHash` unique, `scopes[]`, `permission`, `documentIds[]`, `expiresAt`, `revoked`); `EmergencyAccessSession` (reason, `otpVerified`, 1 h expiry); `AuditLog` (actor, action, target, result, meta — never blocks requests).

## 🔄 How It Works (end-to-end)

1. **Sign in** — `POST /api/auth/signin` sets `medcare_session`.
2. **Upload** — `POST /api/upload` (PDF/JPG/PNG ≤ 15 MB) → SHA-256 dedupe → immutable original.
3. **Process** — `POST /api/process` → classify → extract (EXACT only with full date; MONTH for month-year; RELATIVE stays relative) → Zod-validate → persist events + evidence → re-run conflicts / gaps / snapshot.
4. **Timeline** — `GET /api/timeline` → precision-sorted events with doc + page + quote + status.
5. **Evidence UI** — journey cards, badges, panels, authorized doc stream (`storageKey` never leaks).
6. **What Changed** — snapshot diffs across ingests.
7. **Doctor cockpit** — scoped dashboard (conditions, meds, labs, hospitalizations, conflicts, gaps).
8. **CareShare** — `POST /api/share` (scopes, `VIEW_ONLY`/`VIEW_AND_DOWNLOAD`, `1h/24h/7d/custom`) → one-time token + URL; list strips hashes; `DELETE` revokes; public `/share/[token]`.
9. **Break-glass** — `POST /api/emergency` (doctor-only, reason ≥ 10, OTP, `confirm: true`) → 1-hour session, audited.
10. **History AI** — `POST /api/chat` → retrieval + citations; refuses medical advice.
11. **Audit** — `GET /api/audit` → logins, uploads, views, shares, revokes, emergencies.

> **Invariants I1–I10** — traceability · enum badges · no fabrication (bad AI output → FAILED, bad dates → null) · faithful precision (MONTH never upgraded) · immutable originals · no causal claims · scoped sharing + audited break-glass · expiring authorized streams · conflicts shown, never resolved · synthetic data only.

## 🔌 API Reference

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| POST | `/api/auth/signup` · `/signin` · `/signout` | public / any | Register · login (sets cookie) · logout |
| POST | `/api/upload` | patient | Store original + `Document` row |
| POST | `/api/process` | patient | Classify → extract → persist |
| GET | `/api/timeline` · `/events` · `/documents` · `/snapshots` · `/audit` | scoped | Reads (`storageKey` stripped) |
| GET | `/api/documents/[id]/file` | scoped | Authorized binary stream |
| POST | `/api/chat` | patient | Grounded Q&A + citations |
| GET / POST / DELETE | `/api/share` (`?id=` for DELETE) | patient (own) | List (hashes stripped) · create token · revoke |
| GET | `/share/[token]` | token | Public shared view |
| POST | `/api/emergency` | doctor | Break-glass (reason + OTP + confirm) |

Status codes: unauthenticated → `401` · cross-patient / doctor-without-scope → `403` (`400` where no scope resolves) · short reason → `400` · bad OTP → `403`. Pages `/patient/*`, `/doctor/*` redirect to `/signin` without a session.

## 🚀 Quickstart

### Prerequisites

- Node.js 20 · pnpm 9 · PostgreSQL 17 on `:5432`

### Setup (Windows / PowerShell)

```powershell
pnpm install
Copy-Item .env.example .env   # then edit DATABASE_URL if needed
pnpm db:generate
pnpm db:migrate
pnpm db:seed
pnpm exec next dev --port 3001
# open http://localhost:3001
```

> ⚠️ Use `pnpm exec next dev --port 3001` — `pnpm dev -- -p 3001` fails.

<!-- TAIL2 -->

### Environment

| Variable | Example | Purpose |
|----------|---------|---------|
| `DATABASE_URL` / `DIRECT_URL` | `postgresql://medcare:medcare@localhost:5432/medcare?schema=public` | Prisma connection |
| `STORAGE_DRIVER` / `STORAGE_BUCKET` | `local` / `medcare-docs` | Original-file storage |
| `AI_PROVIDER` / `OCR_PROVIDER` | `mock` / `mock` | Deterministic demo (no keys) |
| `SHARE_TOKEN_SECRET` | 32+ char secret | HMAC for share tokens |
| `EMERGENCY_OTP_MODE` / `EMERGENCY_OTP` | `simulated` / `123456` | Break-glass OTP |
| `APP_URL` | `http://localhost:3000` | Share-link base |

## 🧪 Testing & Quality Gates

```powershell
pnpm typecheck; pnpm lint; pnpm test; pnpm build
node scripts/e2e.mjs http://localhost:3001
powershell -NoProfile -ExecutionPolicy Bypass -File .pg/e2e.ps1
```

| Suite | Covers |
|-------|--------|
| `conflict` | Dosage-conflict detection + never-auto-resolve |
| `extraction` | Schema validity, precision fidelity, quote-required |
| `security` | 401/403 guards, hash stripping, OTP + reason gates |
| `temporal` | MONTH anchoring, 30-day episodes, 90-day gaps |
| E2E (33 checks) | Guards, enums, traceability, shares, IDOR, chat grounding |

✅ **Last verified:** 33/33 E2E · `tsc` clean · `.pg/e2e.ps1` ends `DONE`.

<!-- TAIL3 -->

## 🗂️ Project Structure

```text
app/            landing + patient/doctor pages + share/[token] + api/* handlers
components/     EvidenceBadge, EventCard, JourneyGraph, LabTrend, DocViewer, …
lib/            auth · rbac · enums · validation · storage · audit · share-tokens
services/       Timeline · Episode · Extraction · DocumentProcessing · Conflict
                Snapshot · Share · Emergency · HistoryAI
ai/             providers.ts (interfaces) + mockProvider.ts (deterministic demo)
db/             schema.prisma (16 models) + seed.ts (synthetic fixtures)
tests/          conflict · extraction · security · temporal (vitest)
scripts/        e2e.mjs + e2e-smoke.mjs
middleware.ts   /patient|/doctor → /signin without session
.pg/            local Postgres artefacts (git-ignored) + e2e/smoke scripts
```

## 📝 Changelog — What Was Done

| Commit | Change |
|--------|--------|
| `c26cd60` | Baseline: fixed `.pg/e2e.ps1` terminator bug, verified stack, full guide, `.gitignore` + GitHub remote |
| `3a251f2` | Landing: About-this-photo section + 3-picture gallery |
| `41f77fb` | Landing: How-it-works steps, Safe-by-design + FAQ, bottom CTA |
| `6c0a4a8` | Landing: mobile responsiveness — fluid type, stacked CTAs, `sm`/`md` grids, 44 px touch targets |
| `uncommitted` | README rewritten as professional guide (this file) + `.gitignore` dedupe fix |

<!-- TAIL4 -->

## ⚠️ Limitations & Roadmap

- 🔑 Passwords are SHA-256 (demo-grade) → **bcrypt/argon2** + proper session store.
- 🤖 AI/OCR are deterministic mocks → wire real providers behind `ai/providers.ts`; keep Zod + FAILED quarantine.
- 💾 Local-disk storage → signed-URL object storage for multi-instance.
- 🛡️ Add rate-limiting, security headers, refresh-token rotation.
- 🧬 Synthetic fixtures only — never commit real PHI.

## 🤝 Contributing

```powershell
git checkout -b feat/my-change
pnpm typecheck; pnpm lint; pnpm test
git commit -m "feat: describe change + E2E result"
```

Keep invariants I1–I10 green; include E2E output in PRs.

<div align="center">

**Built with evidence-first principles · Every fact cites its source** 🏥

<img src="https://capsule-render.vercel.app/api?type=waving&color=0e9fa4&height=120&section=footer" width="100%" alt="3D wave footer" />

</div>


