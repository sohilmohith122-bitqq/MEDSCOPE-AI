"""MEDSCOPE-AI guide content part C: end-to-end flow + API reference."""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from reportlab.lib.units import mm
from reportlab.platypus import Spacer, PageBreak
from pdf_common import *

W4 = [17 * mm, 60 * mm, 23 * mm, 80 * mm]


def part_c():
    s = [PageBreak()]
    s += [h1("5. End-to-End Flow")]
    s += [p("The whole product is one pipeline. Each numbered step maps to a route handler and a service.")]
    steps = [
        ("Sign in", "POST /api/auth/signin verifies the password and sets the HttpOnly medcare_session cookie."),
        ("Upload", "POST /api/upload accepts PDF / JPG / PNG (max 15 MB), computes SHA-256, skips duplicates, and writes an immutable original to storage/documents/."),
        ("Process", "POST /api/process classifies the document, then extracts events. Dates are mapped faithfully: EXACT only when a full date is present, MONTH for a month-year, RELATIVE stays relative. Output is Zod-validated; failing output becomes FAILED with a reason."),
        ("Persist", "Valid events + evidence rows are written with document id, page and quote. Conflicts, gaps and a snapshot are then recomputed."),
        ("Timeline", "GET /api/timeline returns precision-ordered events; every card can show document + page + quote + evidence status."),
        ("Evidence UI", "Journey cards, evidence badges and panels let the patient open the exact source; document bytes stream only through GET /api/documents/[id]/file after an authorization check."),
        ("What Changed", "Snapshot diffs show what shifted between ingests (new medication, changed dose, new lab, hospitalization, resolved item)."),
        ("Doctor cockpit", "GET /api/timeline and /api/audit for a signed-in doctor resolve scope through the PatientDoctor link or a live share; a 30-second view lists conditions, medications, labs, hospitalizations, conflicts and gaps."),
        ("CareShare", "POST /api/share creates an expiring, scoped, revocable link (1h / 24h / 7d / custom). GET lists sessions with the token hash stripped; DELETE revokes; /share/[token] is the public, token-gated view."),
        ("Break-glass", "POST /api/emergency is doctor-only and requires a reason of at least 10 characters, a valid OTP and confirm: true. It opens a 1-hour audited session and records resourcesAccessed."),
        ("History AI", "POST /api/chat retrieves scoped evidence, answers with citations, and refuses dosage or diagnosis advice with a disclaimer plus the records that exist."),
        ("Audit", "GET /api/audit is the append-only trail of logins, uploads, views, shares, revokes and emergencies. Logging never blocks a request."),
    ]
    for i, (title, body) in enumerate(steps, 1):
        s += [Paragraph("<b>%d. %s</b> - %s" % (i, title, body), s_bul, bulletText="\u2022")]
    s += [Spacer(1, 3 * mm),
          warn("<b>Invariants I1-I10.</b> (1) every fact is traceable to document + page + quote; "
               "(2) enums/badges never invented; (3) no fabrication - invalid AI output is quarantined as FAILED, "
               "bad dates become null; (4) date precision is faithful - MONTH is never silently upgraded to a day; "
               "(5) originals immutable; (6) no causal claims - adjacency means ordering only; (7) access requires "
               "scope or an audited break-glass; (8) shares expire, are revocable and hash-safe; (9) conflicts are "
               "surfaced, never auto-resolved; (10) synthetic demo data only.")]
    s += [PageBreak()]
    s += [h1("6. API Reference")]
    s += [mktable(["Method", "Endpoint", "Auth", "Purpose"], [
        ["POST", "/api/auth/signup | signin | signout", "public / any", "Register, log in (sets cookie), log out"],
        ["POST", "/api/upload", "patient", "Store original + create Document row (sha256 dedupe)"],
        ["POST", "/api/process", "patient", "Classify -> extract -> persist events + evidence"],
        ["GET", "/api/timeline | events | documents | snapshots | audit", "scoped", "Scoped reads; storageKey removed from payloads"],
        ["GET", "/api/documents/[id]/file", "scoped", "Authorized binary stream of the original"],
        ["POST", "/api/chat", "patient", "Grounded Q&amp;A with citations; refuses advice"],
        ["GET / POST / DELETE", "/api/share  (?id= for DELETE)", "patient (own)", "List (hashes stripped) / create token / revoke"],
        ["GET", "/share/[token]", "token", "Public shared view, scope-limited"],
        ["POST", "/api/emergency", "doctor", "Break-glass: reason + OTP + confirm -> 1-hour session"],
    ], W4)]
    s += [Spacer(1, 2 * mm), h2("Response contract")]
    s += [mktable(["Situation", "Status"], [
        ["No session cookie", "401 Unauthorized"],
        ["Cross-patient read, or doctor without a live scope", "403 Forbidden (400 where no scope can resolve)"],
        ["Emergency reason shorter than 10 characters", "400 Bad Request"],
        ["Emergency with a wrong OTP", "403 Forbidden"],
        ["Duplicate upload (same sha256)", "handled gracefully - stored once, reported as skipped"],
    ], [120 * mm, 60 * mm])]
    s += [Spacer(1, 2 * mm),
          p("Pages <b>/patient/*</b> and <b>/doctor/*</b> redirect to <b>/signin</b> when the cookie is absent; "
            "the public landing page, /signin and /signup stay open. Verified live: unauthenticated API calls "
            "return 401, doctor IDOR attempt returns 403, invalid emergency returns 400.")]
    return s