"""MEDSCOPE-AI guide content part B: architecture + data model."""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from reportlab.lib.units import mm
from reportlab.platypus import Spacer, PageBreak
from pdf_common import *

W3 = [52 * mm, 58 * mm, 70 * mm]

DIAGRAM = """Browser (App Router pages)
 +- /  |  /signin  |  /signup  |  /forgot
 +- /patient/*   overview | journey | documents | ask | share | access-history
 +- /doctor/*    dashboard | patients | shared | emergency | audit
 +- /share/[token]   (public, token-gated view)
        |  cookie: medcare_session
        v
middleware.ts  --  /patient|/doctor without session  ->  /signin
        v
API Route Handlers (app/api/*)  --  getSession -> requireRole -> rbac scope
 +- auth       signup | signin | signout
 +- upload     -> storage (sha256 dedupe) -> process pipeline
 +- process    -> classify -> extract -> persist
 +- timeline | events | documents | snapshots | audit      (scoped reads)
 +- documents/[id]/file        (authorized binary stream)
 +- chat       -> HistoryAI (grounded answers, refuses advice)
 +- share      -> token create | list | revoke
 +- emergency  -> break-glass (reason + OTP + 1-hour box)
        v
Services/  --  Timeline | Episode | Extraction | DocumentProcessing
                Conflict | Snapshot | Share | Emergency | HistoryAI
        v
Prisma Client (lib/db.ts)  ->  PostgreSQL  ->  storage/documents/* (originals)"""


def part_b():
    s = [PageBreak()]
    s += [h1("3. Architecture")]
    s += [p("Every page and API route funnels through one guard chain: session cookie - role - object scope. "
            "Pages are guarded by <b>middleware.ts</b>; API routes re-check server-side so a forged client "
            "cannot escalate (no IDOR).")]
    s += [code(DIAGRAM), Spacer(1, 3 * mm)]
    s += [h2("Layer responsibilities"), mktable(["Layer", "Owns", "Key files"], [
        ["Presentation", "Landing, patient &amp; doctor portals, public share view, glass-card theme",
         "app/page.tsx, app/patient/*, app/doctor/*, app/share/[token], app/globals.css"],
        ["Edge guard", "Redirects unauthenticated page hits",
         "middleware.ts"],
        ["API surface", "Validate input (Zod), resolve session + scope, shape responses",
         "app/api/*/route.ts, lib/api-helpers.ts"],
        ["Domain services", "Timeline, episodes, conflicts/gaps, snapshots, sharing, emergency, AI",
         "services/*.ts"],
        ["Persistence", "Single Prisma client + schema of 16 models",
         "lib/db.ts, db/schema.prisma"],
        ["File storage", "Immutable originals, streamed only after authorization",
         "lib/storage.ts, storage/documents/"],
    ], W3)]
    s += [h2("Module guide")]
    s += [b("<b>lib/enums.ts</b> - EvidenceStatus, DatePrecision, EventType (x9), ShareScope (x7), share permission, doc status."),
          b("<b>lib/validation.ts</b> - upload metadata (max 15 MB), extraction schema that <i>requires</i> evidence_quote + source_page, share create, emergency request."),
          b("<b>DocumentProcessingService</b> - CLASSIFYING -> EXTRACTING -> PROCESSED | FAILED, up to 3 attempts, bad AI output quarantined."),
          b("<b>TimelineService</b> - precision-first ordering; null-date / fuzzy-band events sorted last."),
          b("<b>EpisodeService</b> - 30-day temporal clustering into clinical episodes."),
          b("<b>ConflictService</b> - dosage discrepancies + undocumented gaps (over 90 days); conflicts stay OPEN, never auto-resolved."),
          b("<b>SnapshotService</b> - What-Changed diffs of conditions, medications, labs, procedures, hospitalizations."),
          b("<b>HistoryAIService</b> - retrieval over scoped events, citation building, explicit refusal of medical advice."),
          b("<b>ShareService</b> - randomBytes(24) token, HMAC hash stored, hash stripped from every response."),
          b("<b>EmergencyService</b> - reason + OTP + confirm gate, 1-hour audited access session."),
          b("<b>lib/rbac.ts</b> - access only via PatientDoctor link or a live, unexpired, unrevoked share.")]
    s += [PageBreak()]
    s += [h1("4. Data Model (16 Prisma models)")]
    s += [h2("Identity &amp; access")]
    s += [mktable(["Model", "Purpose", "Notable fields"], [
        ["User", "Account + role", "email (unique), passwordHash, role, auditLogs"],
        ["PatientProfile", "Patient details (1:1)", "userId (unique), fullName, dob, gender"],
        ["DoctorProfile", "Doctor details (1:1)", "userId (unique), fullName, specialty"],
        ["PatientDoctor", "Care relationship that grants doctor scope", "patientId + doctorId (unique pair)"],
    ], W3)]
    s += [h2("Clinical core")]
    s += [mktable(["Model", "Purpose", "Notable fields"], [
        ["Document", "Immutable original record", "storageKey, sha256, docType, status, failureReason"],
        ["DocumentPage", "Per-page text excerpt", "pageNumber, textExcerpt"],
        ["ClinicalEvent", "One traceable clinical fact",
         "eventType, title, eventDate?, datePrecision, sourceDocumentId + sourcePage + evidenceQuote, evidenceStatus, confidence, extractedEntities"],
        ["EvidenceItem", "Extra evidence rows per event", "documentId, page, quote"],
        ["EventRelationship", "Typed edge between events", "fromEventId, toEventId, type, derivedRule"],
        ["ClinicalEpisode", "30-day cluster of related events", "title, startDate, endDate, eventIds"],
        ["PatientStateSnapshot", "State at each ingest (What Changed)", "label, data (JSON)"],
        ["Conflict", "Dosage / documentation discrepancy", "kind, title, eventIds, status = OPEN"],
        ["TimelineGap", "Undocumented stretch of care", "afterEventId, beforeEventId, description"],
    ], W3)]
    s += [h2("Sharing, emergency &amp; audit")]
    s += [mktable(["Model", "Purpose", "Notable fields"], [
        ["ShareSession", "Patient-controlled scoped share",
         "tokenHash (unique), scopes[], permission, documentIds[], expiresAt, revoked"],
        ["EmergencyAccessSession", "Audited break-glass window",
         "reason, otpVerified, expiresAt, resourcesAccessed"],
        ["AuditLog", "Append-only activity trail",
         "actorId, actorRole, action, targetType, targetId, accessType, result, meta"],
    ], W3)]
    s += [Spacer(1, 2 * mm),
          warn("<b>Data rules:</b> originals are immutable and addressed by sha256; storageKey never leaves the "
               "server. evidenceQuote + sourcePage are mandatory on every event, so a fact without a source "
               "cannot be persisted (invariant 'no fabrication')."),
          p("<i>Total: 16 models - 4 identity/access, 9 clinical core, 3 sharing &amp; audit.</i>")]
    return s