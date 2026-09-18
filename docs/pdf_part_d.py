"""MEDSCOPE-AI guide content part D: setup, testing, structure, limitations."""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from reportlab.lib.units import mm
from reportlab.platypus import Spacer, PageBreak, HRFlowable
from pdf_common import *

SETUP = """pnpm install
Copy-Item .env.example .env      # then set DATABASE_URL if it differs
pnpm db:generate
pnpm db:migrate
pnpm db:seed
pnpm exec next dev --port 3001
# open http://localhost:3001"""

GATES = """pnpm typecheck        # tsc --noEmit
pnpm lint             # eslint
pnpm test             # vitest unit suites
pnpm build            # production build
node scripts/e2e.mjs http://localhost:3001
powershell -NoProfile -ExecutionPolicy Bypass -File .pg/e2e.ps1"""

STRUCT = """app/            landing + patient/doctor pages + share/[token] + api/* handlers
components/     EvidenceBadge, EventCard, JourneyGraph, LabTrend, DocViewer, ...
lib/            auth | rbac | enums | validation | storage | audit | share-tokens
services/       Timeline | Episode | Extraction | DocumentProcessing | Conflict
                Snapshot | Share | Emergency | HistoryAI
ai/             providers.ts (interfaces) + mockProvider.ts (deterministic demo)
db/             schema.prisma (16 models) + seed.ts (synthetic fixtures)
tests/          conflict | extraction | security | temporal (vitest)
scripts/        e2e.mjs + e2e-smoke.mjs
middleware.ts   /patient|/doctor -> /signin without a session
.pg/            local Postgres artefacts (git-ignored) + e2e/smoke scripts
docs/           this guide + its generator scripts"""


def part_d():
    s = [PageBreak()]
    s += [h1("7. Setup &amp; Run")]
    s += [h2("Prerequisites")]
    s += [b("Node.js 20 and pnpm 9 (packageManager: pnpm@9.15.1)."),
          b("PostgreSQL 17 listening on :5432."),
          b("No AI or OCR API keys are needed - both providers are deterministic mocks.")]
    s += [h2("Commands (Windows / PowerShell)")]
    s += [code(SETUP)]
    s += [warn("<b>Gotcha:</b> start the server with <b>pnpm exec next dev --port 3001</b>. "
               "<b>pnpm dev -- -p 3001</b> fails because Next.js treats the extra argument as a project path.")]
    s += [h2("Environment variables")]
    s += [mktable(["Variable", "Example", "Purpose"], [
        ["DATABASE_URL / DIRECT_URL", "postgresql://medcare:medcare@localhost:5432/medcare?schema=public", "Prisma connection"],
        ["STORAGE_DRIVER / STORAGE_BUCKET", "local / medcare-docs", "Original-file storage"],
        ["AI_PROVIDER / OCR_PROVIDER", "mock / mock", "Deterministic demo (no keys)"],
        ["SHARE_TOKEN_SECRET", "32+ character secret", "HMAC for share tokens"],
        ["EMERGENCY_OTP_MODE / EMERGENCY_OTP", "simulated / 123456", "Break-glass OTP"],
        ["APP_URL", "http://localhost:3000", "Base URL for share links"],
    ], [50 * mm, 80 * mm, 50 * mm])]
    s += [Spacer(1, 2 * mm),
          p("Seeded demo state: 15 documents across 6 types, 1 duplicate skipped, a Metformin 500-vs-1000 "
            "conflict, a RELATIVE follow-up, labs from 2 providers, 2 hospitals and 1 timeline gap.")]
    s += [PageBreak()]
    s += [h1("8. Testing &amp; Quality Gates")]
    s += [code(GATES)]
    s += [Spacer(1, 2 * mm)]
    s += [mktable(["Suite", "What it proves"], [
        ["conflict", "Dosage-conflict detection and the never-auto-resolve rule"],
        ["extraction", "Schema validity, date-precision fidelity, quote-required"],
        ["security", "401 / 403 guards, hash stripping, OTP + reason gates"],
        ["temporal", "MONTH anchoring, 30-day episodes, 90-day gaps"],
        ["E2E (33 checks)", "Guards, enum validity, traceability, share lifecycle, IDOR, chat grounding"],
    ], [42 * mm, 138 * mm])]
    s += [Spacer(1, 2 * mm),
          warn("<b>Last verified on this machine:</b> Node E2E 33/33 passed - tsc --noEmit exit 0 - "
               "PowerShell E2E (.pg/e2e.ps1) printed DONE - landing page returned 200 on http://localhost:3001.")]
    s += [PageBreak()]
    s += [h1("9. Project Structure")]
    s += [code(STRUCT)]
    s += [PageBreak()]
    s += [h1("10. Limitations &amp; Roadmap")]
    s += [b("<b>Auth is demo-grade.</b> Passwords use SHA-256; move to bcrypt/argon2 plus a real session store."),
          b("<b>AI and OCR are deterministic mocks.</b> Wire real providers behind ai/providers.ts while keeping the Zod gate and the FAILED quarantine."),
          b("<b>Storage is local disk.</b> For multiple instances, switch to object storage with signed URLs."),
          b("<b>Hardening pending.</b> Add rate limiting, security headers and refresh-token rotation."),
          b("<b>Synthetic fixtures only.</b> Never commit real patient data (PHI).")]
    s += [Spacer(1, 2 * mm), h2("Contributing")]
    s += [code("git checkout -b feat/my-change\n"
               "pnpm typecheck; pnpm lint; pnpm test\n"
               'git commit -m "feat: describe change + E2E result"')]
    s += [p("Keep invariants I1-I10 green and include E2E output in pull requests.")]
    s += [Spacer(1, 6 * mm),
          HRFlowable(width="100%", thickness=1, color=TEAL), Spacer(1, 3 * mm),
          Paragraph("<b>MEDSCOPE-AI</b> - evidence-first by design. Every fact cites its source.", s_cap),
          Paragraph("AI-organized from the patient's records - not medical advice. Synthetic demo data.", s_cap)]
    return s