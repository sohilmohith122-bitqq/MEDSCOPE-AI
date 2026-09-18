"""MEDSCOPE-AI guide content part A. Run via docs/build_pdf.py"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from reportlab.lib.units import mm
from reportlab.platypus import Paragraph, Spacer, PageBreak, HRFlowable
from pdf_common import *

W = [62 * mm, 62 * mm, 46 * mm]

def part_a():
    s = []
    s += [Spacer(1, 38 * mm),
        Paragraph("MEDSCOPE-AI", s_title),
        Paragraph("Medical Document Intelligence &amp; Patient Timeline Platform", s_sub),
        Spacer(1, 4 * mm),
        HRFlowable(width="100%", thickness=1.2, color=TEAL),
        Spacer(1, 4 * mm),
        p("Turn fragmented medical records into one understandable, evidence-backed patient journey: "
          "upload, classify, extract (precision-faithful dates), timeline + episodes + graph, "
          "evidence + conflicts + gaps + What Changed, 30-second doctor cockpit, "
          "CareShare + break-glass, grounded History AI."),
        Spacer(1, 3 * mm),
        warn("<b>AI-organized from the patient's records -- not medical advice.</b> "
             "Decision support only. Synthetic demo data. Every fact cites its source."),
        Spacer(1, 6 * mm),
        mktable(["Role", "Email", "Password"],
            [["Patient", "patient@demo.medcare", "demo1234"],
             ["Doctor", "doctor@demo.medcare", "demo1234"]], [55 * mm, 65 * mm, 50 * mm]),
        Spacer(1, 3 * mm),
        p("Emergency OTP (simulated): <b>123456</b> | Seed: 15 docs, 6 types, 1 duplicate skipped, "
          "Metformin 500-vs-1000 conflict, RELATIVE follow-up, labs x2 providers, 2 hospitals, 1 gap."),
        Spacer(1, 10 * mm),
        Paragraph("Project Guide -- generated from the live codebase", s_cap),
        PageBreak()]
    s += [h1("Contents"),
        Paragraph("1. Session Changelog .... 2<br/>2. Tech Stack .... 3<br/>3. Architecture .... 3<br/>"
                  "4. Data Model (16 Models) .... 4<br/>5. End-to-End Flow .... 4<br/>6. API Reference .... 5<br/>"
                  "7. Setup &amp; Run .... 5<br/>8. Testing &amp; Gates .... 6<br/>"
                  "9. Project Structure .... 6<br/>10. Limitations .... 6", s_toc)]
    s += [h1("1. Session Changelog"),
        p("The repo went from 'runs, barely documented' to documented, reproducible and verified:"),
        mktable(["Commit", "Change", "Files"],
            [["c26cd60", "Baseline: fixed .pg/e2e.ps1 line-102 bug; app up for E2E "
              "(Postgres :5432, seeded DB, Next.js :3001); full guide; .gitignore + remote.",
              ".pg/e2e.ps1, README"],
             ["3a251f2", "Landing: About-this-photo + 3-picture gallery.", "app/page.tsx"],
             ["41f77fb", "Landing: How-it-works, Safe-by-design + FAQ, bottom CTA.", "app/page.tsx"],
             ["6c0a4a8", "Landing: mobile responsiveness (fluid type, stacked CTAs, 44px targets).",
              "page/layout/css"],
             ["14fab4a", "Docs: professional README.", "README.md"],
             ["38ccb2c", "Docs: removed license section.", "README.md"],
             ["3886805", "Docs: 3D README styling.", "README.md"]], W)]
    s += [h1("2. Tech Stack"),
        mktable(["Layer", "Technology", "Details"],
            [["Framework", "Next.js 14.2 App Router", "SSR pages + Route Handlers as API; middleware guards"],
             ["UI", "React 18, Tailwind 3.4", "clinical theme, glass cards; lucide-react icons"],
             ["Data", "PostgreSQL 17 + Prisma 5.22", "16 models; DATABASE_URL / DIRECT_URL"],
             ["Validation", "Zod", "Upload, extraction, share, emergency, pagination"],
             ["AI", "Pluggable + Mock", "providers.ts interfaces; mockProvider.ts rules; AI_PROVIDER=mock"],
             ["Client state", "zustand, TanStack Query", "Stores + server-state queries"],
             ["Viz", "reactflow 11, recharts 2, react-pdf 9", "Graph, trends, doc viewer"],
             ["Storage", "Local FS storage/documents/", "Immutable originals; authorized streams"],
             ["Auth", "Cookie medcare_session", "HttpOnly + SameSite=Lax; rbac checks (IDOR-safe)"],
             ["Tests", "Vitest, Node + PS E2E", "tests/ + scripts/e2e.mjs + .pg scripts"],
             ["Tooling", "pnpm 9, TS 5.6 strict", "@/* alias; ESLint; tsx"]], W)]
    return s
