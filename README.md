# MEDSCOPE-AI (formerly MEDCARE) — Medical Document Intelligence & Patient Timeline

> **AI-organized from the patient's records — not medical advice.**
> Upload → classify → extract (precision-faithful dates) → timeline + episodes + graph → evidence + conflicts + gaps + What Changed → 30-second doctor cockpit → CareShare + break-glass → grounded History AI.

![Next.js](https://img.shields.io/badge/Next.js-14.2-black) ![React](https://img.shields.io/badge/React-18-blue) ![Postgres](https://img.shields.io/badge/PostgreSQL-17-336791) ![Prisma](https://img.shields.io/badge/Prisma-5.22-2D3748) ![Tailwind](https://img.shields.io/badge/Tailwind-3.4-38bdf8) ![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178c6)

---

## 1. What was built (session work)

This session took the repo from "runs, barely documented" to **documented, reproducible, and verified**:

| # | Change | File(s) |
|---|--------|---------|
| 1 | Fixed `.pg/e2e.ps1` string-terminator parse error (line 102 `Write-Host 'DONE'`). Switched trailing lines to double quotes to avoid `''` + `'DONE'` single-quote mis-tokenization; verified 0 parse errors, script runs to `DONE`. | `.pg/e2e.ps1` |
| 2 | Brought the app up for E2E: confirmed Postgres `:5432` live, seeded DB (2 users, 15 docs / 19 events), started Next.js dev server on `:3001` (`pnpm exec next dev --port 3001`; note `pnpm dev -- -p 3001` fails). | runtime |
| 3 | Added **About-this-photo** section to landing page: `ABOUT_PHOTO` constant (Unsplash clinician-with-tablet image + caption), 2-col section (photo + figcaption / "Built around evidence" copy), verified in rendered HTML. | `app/page.tsx` |
| 4 | Rewrote this README into a full guide: stack, architecture, flow, invariants, API map, setup, test gates. | `README.md` |
| 5 | Prepared repo for GitHub push: `.gitignore` excluding secrets, `node_modules`, `.next`, local storage, and heavy `.pg` binaries/zips that exceed GitHub's 100 MB file limit. | `.gitignore` |

> Live verification (this machine): `node scripts/e2e.mjs http://localhost:3001` → **33/33 passed**; `.pg/e2e.ps1` → completes with `DONE` (doctor timeline without scope = 400, IDOR = 403, bad emergency = 400 — all expected).

---

## 2. Tech stack

| Layer | Choice | Why / notes |
|-------|--------|-------------|
| Framework | **Next.js 14.2** App Router (`app/`) | SSR landing + pages; Route Handlers double as the API (`app/api/*`); `middleware.ts` page guards |
| UI | **React 18**, Tailwind 3.4, custom `clinical`/`surface` theme, glass-card system (`app/globals.css`, `tailwind.config.ts`), `lucide-react` | Dark clinical aesthetic; `canvas` aliased off in `next.config.mjs` for `react-pdf` compat |
| Data | **PostgreSQL 17** + **Prisma 5.22** (`db/schema.prisma`) | 16 models; `DATABASE_URL`/`DIRECT_URL` from `.env` |
| Validation | **Zod** (`lib/validation.ts`) | Upload meta, AI extraction schema, share create, emergency request, pagination |
| AI | **Pluggable providers** (`ai/providers.ts`) + **deterministic MockProvider** (`ai/mockProvider.ts`) | Zero-key demo: keyword/rule extraction with precision-faithful dates, pseudo-embeddings, grounded chat stub. `AI_PROVIDER=mock`, `OCR_PROVIDER=mock` |
| Client state | **zustand**, **@tanstack/react-query** | Stores + server-state queries |
| Viz | **reactflow 11**, **recharts 2**, **react-pdf 9** | Journey graph, lab trends, document viewer |
| Storage | Local FS (`storage/documents/`) via `lib/storage.ts`; `STORAGE_DRIVER=local` | Originals immutable; served only through authorized streams |
| AuthN/Z | Cookie session `medcare_session` (`lib/auth.ts`), page guard `middleware.ts`, object checks `lib/rbac.ts` | HttpOnly + SameSite=Lax; every API re-checks role + patient scope (IDOR-safe) |
| Tests | **Vitest** (`tests/*.test.ts`), Node E2E (`scripts/e2e.mjs`, `db/e2e.mjs`, `.pg/e2e.mjs`), PowerShell E2E (`.pg/e2e.ps1`, `.pg/smoke.ps1`) | Gate: `pnpm typecheck && pnpm lint && pnpm test && pnpm build` |
| Tooling | pnpm 9, TypeScript 5.6 strict (`@/*` paths), ESLint (next), tsx (seed) | `packageManager: pnpm@9.15.1` |

## 3. Architecture

Browser pages (`/`, `/signin`, `/signup`, patient `overview|journey|documents|ask|share|access-history`, doctor `dashboard|patients|shared|emergency|audit`, public `/share/[token]`) call API Route Handlers with the `medcare_session` cookie. `middleware.ts` redirects unauthenticated `/patient|/doctor` page visits to `/signin`; every API handler re-checks `getSession` + `requireRole` + `lib/rbac` scope (IDOR-safe).

- `lib/enums.ts` — EvidenceStatus (DOCUMENTED/DERIVED/UNCERTAIN/CONFLICTING), DatePrecision (EXACT/MONTH/YEAR/APPROXIMATE/RELATIVE/UNKNOWN), DocumentType/Status, EventType (9), RelationshipType (8), ShareScope (7), SharePermission, UserRole, AuditAction (12), DISCLAIMER.
- `services/DocumentProcessingService.ts` — CLASSIFYING to EXTRACTING to PROCESSED|FAILED, 3 attempts with Zod re-validation, audited.
- `services/TimelineService.ts` — precision-aware sort (null-date RELATIVE/UNKNOWN last, fuzzy bands).
- `services/EpisodeService.ts` — 30-day temporal clustering; FOLLOWED_BY edges marked ordering-only, never causation.
- `services/ConflictService.ts` — medication dosage conflicts (same drug, 2+ doses becomes OPEN Conflict + CONFLICTING events, never auto-resolved); 90-day gap detector.
- `services/SnapshotService.ts` — per-ingest PatientStateSnapshot + diff for What Changed.
- `services/HistoryAIService.ts` — keyword-routed retrieval with citations; refuses dosage/diagnosis advice.
- `services/ShareService.ts` + `lib/share-tokens.ts` — randomBytes(24) token, HMAC-SHA256 stored as tokenHash, expiring + revocable.
- `services/EmergencyService.ts` — break-glass: reason 10+ chars (400), OTP 123456 simulated (403 on mismatch), doctor-only, 1-hour session, audited.
- `lib/rbac.ts` — doctor access via PatientDoctor link OR live ShareSession; patients touch only their own profile.

## 4. Data model (Prisma, 16 models)

Identity: `User` (email unique, sha256 passwordHash — demo-grade) to `PatientProfile`/`DoctorProfile`; `PatientDoctor` join gates doctor access. Clinical core: `Document` (storageKey, sha256, docType, status) to `DocumentPage`; `ClinicalEvent` (eventType, title, eventDate?, datePrecision, sourceDocumentId+sourcePage+evidenceQuote, evidenceStatus, confidence, extractedEntities) to `EvidenceItem`; `EventRelationship` (typed edges, derivedRule); `ClinicalEpisode` (30-day clusters); `PatientStateSnapshot`; `Conflict` (OPEN); `TimelineGap`. Sharing/audit: `ShareSession` (tokenHash unique, scopes, permission, documentIds, expiresAt, revoked); `EmergencyAccessSession` (reason, otpVerified, 1h expiry); `AuditLog` (actor, action, target, result, meta — never blocks requests).

## 5. End-to-end flow

1. Signin (`POST /api/auth/signin`) sets `medcare_session`. Demo: `patient@demo.medcare` / `doctor@demo.medcare` / `demo1234`.
2. Upload (`POST /api/upload`, pdf/jpg/png <=15 MB) — sha256 dedupe, immutable original in `storage/documents/`.
3. Process (`POST /api/process`) — classify, extract (EXACT only with full date; MONTH for month-year; RELATIVE stays relative), Zod-validate, persist events + evidence, re-run conflicts/gaps/snapshot.
4. Timeline (`GET /api/timeline`) — precision-sorted events, each with doc + page + quote + precision + status.
5. Evidence UI — journey cards, badges, panels, authorized doc stream (`storageKey` never leaks).
6. What Changed — snapshot diffs across ingests.
7. Doctor cockpit — dashboard over scoped data only.
8. CareShare (`POST /api/share`: scopes, VIEW_ONLY|VIEW_AND_DOWNLOAD, 1h|24h|7d|custom) — one-time token + URL; list strips hashes; DELETE revokes; public `/share/[token]`.
9. Break-glass (`POST /api/emergency`: doctor-only, reason 10+, otp 123456, confirm true) — 1-hour session, audited.
10. History AI (`POST /api/chat`) — retrieval + citations; refuses medical advice.
11. Audit (`GET /api/audit`) — logins, uploads, views, shares, revokes, emergencies.

Invariants I1-I10: traceability; EvidenceBadge enum; no fabrication (bad AI output becomes FAILED, bad dates become null); faithful precision (MONTH never upgraded); immutable originals; no causal claims; scoped sharing + audited break-glass; expiring authorized streams; conflicts shown never resolved; synthetic demo data only.

## 6. API map

Unauthenticated API access is 401; cross-patient or doctor-without-scope is 403 (400 where no scope resolves); bad emergency reason is 400; bad OTP is 403. Pages `/patient/*`, `/doctor/*` redirect to `/signin` without a session.

- `POST /api/auth/signup|signin|signout` — register, login (sets cookie), logout.
- `POST /api/upload` (patient) — store original + Document row.
- `POST /api/process` (patient) — classify, extract, persist.
- `GET /api/timeline|events|documents|snapshots|audit` (scoped) — reads; documents strip `storageKey`.
- `GET /api/documents/[id]/file` (scoped) — authorized binary stream.
- `POST /api/chat` (patient) — grounded Q and A with citations.
- `GET|POST|DELETE /api/share` (patient own) — list (hashes stripped) / create token / revoke.
- `GET /share/[token]` (token) — public shared view.
- `POST /api/emergency` (doctor) — break-glass.

## 7. Setup and run (Windows / PowerShell)

```powershell
pnpm install
Copy-Item .env.example .env
pnpm db:generate; pnpm db:migrate; pnpm db:seed
pnpm exec next dev --port 3001
```

Seed: 15 docs, 6 types, 1 duplicate skipped, Metformin 500-vs-1000 conflict, RELATIVE follow-up, labs across 2 providers, 2 hospitals, 1 gap. Emergency OTP 123456.

## 8. Verification gates

```powershell
pnpm typecheck; pnpm lint; pnpm test; pnpm build
node scripts/e2e.mjs http://localhost:3001
powershell -NoProfile -ExecutionPolicy Bypass -File .pg/e2e.ps1
```

Vitest suites: conflict (dosage conflict + never-resolve), extraction (schema/precision/quote-required), security (401/403, hash stripping, OTP/reason gates), temporal (MONTH anchoring, 30-day episodes, 90-day gaps).

## 9. Push to GitHub

Heavy local artefacts (`.pg/*.zip`, `.pg/pg|extract|node20`, `logfile`, `storage/documents/*`, `.env`) are git-ignored to stay under GitHub's 100 MB/file limit. Run in PowerShell:

```powershell
git init
git add .
git status --short
git commit -m "MEDSCOPE-AI: document intelligence + timeline + sharing + break-glass (verified E2E 33/33)"
git remote add origin https://github.com/samith15-ai/MEDSCOPE-AI.git
git branch -M main
git push -u origin main
```

If the repo already has content: `git pull --rebase origin main` first.

## 10. Limitations and next steps

Passwords are sha256 (demo-grade) — switch to bcrypt/argon2 + proper sessions before real use. AI/OCR are deterministic mocks — wire real providers behind `ai/providers.ts`, keep Zod validation + FAILED quarantine. Storage is local disk — move to signed-URL object storage for multi-instance. Add rate-limiting + security headers. All fixtures synthetic — never commit real records.

