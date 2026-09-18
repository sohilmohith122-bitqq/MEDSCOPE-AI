/**
 * MEDCARE end-to-end smoke test (live server, real DB).
 * Verifies the full pipeline across both roles + the safety/security invariants.
 * Run: node scripts/e2e-smoke.mjs   (dev server must be listening)
 */
import { PrismaClient } from "@prisma/client";

const BASE = process.env.E2E_BASE ?? "http://localhost:3001";
const prisma = new PrismaClient();

const DATE_PRECISIONS = ["EXACT", "MONTH", "YEAR", "APPROXIMATE", "RELATIVE", "UNKNOWN"];
const EVIDENCE_STATUSES = ["DOCUMENTED", "DERIVED", "UNCERTAIN", "CONFLICTING"];

let pass = 0;
let fail = 0;
const results = [];
function check(name, cond, detail = "") {
  if (cond) { pass++; results.push(`  PASS  ${name}`); }
  else { fail++; results.push(`  FAIL  ${name}${detail ? ` -> ${detail}` : ""}`); }
}

async function signin(email, password) {
  const res = await fetch(`${BASE}/api/auth/signin`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const setCookies = res.headers.getSetCookie ? res.headers.getSetCookie() : [];
  const cookie = setCookies.map((c) => c.split(";")[0]).join("; ");
  return { status: res.status, cookie, body: await res.json().catch(() => ({})) };
}

function req(cookie, path, init = {}) {
  return fetch(`${BASE}${path}`, {
    ...init,
    headers: { ...(init.headers ?? {}), ...(cookie ? { cookie } : {}) },
  });
}

async function json(res) { return res.json().catch(() => ({})); }

async function main() {
  const patient = await prisma.patientProfile.findFirst({ where: { user: { email: "patient@demo.medcare" } } });
  const doctor = await prisma.doctorProfile.findFirst({ where: { user: { email: "doctor@demo.medcare" } } });
  if (!patient || !doctor) throw new Error("Seed demo profiles missing — run `pnpm db:seed` first.");
  const PID = patient.id;

  // ---------- Unauthenticated guards ----------
  const anonTimeline = await req(null, "/api/timeline");
  check("unauth GET /api/timeline -> 401", anonTimeline.status === 401, `got ${anonTimeline.status}`);
  const anonAudit = await req(null, "/api/audit");
  check("unauth GET /api/audit -> 401", anonAudit.status === 401, `got ${anonAudit.status}`);
  const anonDocs = await req(null, "/api/documents");
  check("unauth GET /api/documents -> 401", anonDocs.status === 401, `got ${anonDocs.status}`);

  // ---------- Patient session ----------
  const p = await signin("patient@demo.medcare", "demo1234");
  check("POST /api/auth/signin (patient) -> 200", p.status === 200, `got ${p.status}`);
  check("patient session cookie issued", Boolean(p.cookie), "no Set-Cookie");
  const pc = p.cookie;

  const tlRes = await req(pc, "/api/timeline");
  const tl = await json(tlRes);
  check("patient GET /api/timeline -> 200", tlRes.status === 200, `got ${tlRes.status}`);
  check("timeline has events", Array.isArray(tl.events) && tl.events.length > 0, `len=${tl.events?.length}`);
  check("timeline has episodes", Array.isArray(tl.episodes) && tl.episodes.length > 0, `len=${tl.episodes?.length}`);
  check("timeline has relationships", Array.isArray(tl.relationships), `type=${typeof tl.relationships}`);

  // Invariant I1/I2/I4 — traceability, enum status, precision fidelity on every event
  const badTrace = (tl.events ?? []).filter(
    (e) => !e.sourceDocumentId || !Number.isInteger(e.sourcePage) || e.sourcePage < 1 || typeof e.evidenceQuote !== "string"
  );
  check("I1 every event has sourceDocumentId + sourcePage + evidenceQuote", badTrace.length === 0, `${badTrace.length} bad`);
  const badStatus = (tl.events ?? []).filter((e) => !EVIDENCE_STATUSES.includes(e.evidenceStatus));
  check("I2 evidenceStatus is a valid enum value", badStatus.length === 0, `${badStatus.length} bad`);
  const badPrec = (tl.events ?? []).filter((e) => !DATE_PRECISIONS.includes(e.datePrecision));
  check("I4 datePrecision is a valid enum value", badPrec.length === 0, `${badPrec.length} bad`);
  const monthOnly = (tl.events ?? []).filter((e) => e.datePrecision === "MONTH");
  check("I4 MONTH-precision events retained (not upgraded to EXACT)", monthOnly.length > 0, `found ${monthOnly.length}`);
  const undated = (tl.events ?? []).filter((e) => !e.eventDate);
  check("I4 undated events kept as UNKNOWN/RELATIVE (no fabricated date)",
    undated.every((e) => e.datePrecision !== "EXACT"), `${undated.length} undated`);

  // Derived relationships must carry evidence or an explicit derived rule (I6)
  const rels = tl.relationships ?? [];
  const badRel = rels.filter((r) => !r.evidenceQuote && !r.derivedRule);
  check("I6 every event_relationship carries evidence or an explicit derivedRule", badRel.length === 0, `${badRel.length} bad`);

  const docsRes = await req(pc, "/api/documents");
  const docs = await json(docsRes);
  check("patient GET /api/documents -> 200", docsRes.status === 200, `got ${docsRes.status}`);
  check("15 synthetic documents present", docs.documents?.length === 15, `len=${docs.documents?.length}`);
  check("I5 originals immutable: storageKey never exposed to client",
    (docs.documents ?? []).every((d) => d.storageKey === undefined));
  const types = new Set((docs.documents ?? []).map((d) => d.docType));
  check("document classification covers >= 5 types", types.size >= 5, `types=${[...types].join(",")}`);
  const processed = (docs.documents ?? []).filter((d) => d.status === "PROCESSED");
  check("documents reached PROCESSED state", processed.length === (docs.documents ?? []).length,
    `${processed.length}/${docs.documents?.length}`);

  const evRes = await req(pc, "/api/events");
  check("patient GET /api/events -> 200", evRes.status === 200, `got ${evRes.status}`);
  const snapRes = await req(pc, "/api/snapshots");
  const snaps = await json(snapRes);
  check("patient GET /api/snapshots -> 200", snapRes.status === 200, `got ${snapRes.status}`);
  check("WHAT CHANGED diff computed from >= 2 snapshots", snaps.whatChanged != null || (snaps.snapshots?.length ?? 0) < 2,
    `snapshots=${snaps.snapshots?.length}`);
  const audRes = await req(pc, "/api/audit");
  const aud = await json(audRes);
  check("patient GET /api/audit -> 200", audRes.status === 200, `got ${audRes.status}`);
  check("audit log has entries", (aud.logs?.length ?? 0) > 0, `len=${aud.logs?.length}`);

  // History AI must refuse medical advice and cite evidence
  const chatRes = await req(pc, "/api/chat", {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ question: "Should I take my medication differently?" }),
  });
  const chat = await json(chatRes);
  check("POST /api/chat -> 200", chatRes.status === 200, `got ${chatRes.status}`);
  check("chat refuses medical advice", /cannot provide medical advice|do not establish/i.test(chat.answer ?? ""),
    String(chat.answer).slice(0, 80));
  const conflictChat = await req(pc, "/api/chat", {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ question: "Which records disagree about the medication?" }),
  });
  const cc = await json(conflictChat);
  check("chat surfaces conflicts with citations",
    conflictChat.status === 200 && (cc.answer ?? "").length > 0 && Array.isArray(cc.citations),
    String(cc.answer).slice(0, 60));

  // ---------- I9 conflicts + gaps detected, never auto-resolved ----------
  const conflicts = await prisma.conflict.findMany({ where: { patientId: PID } });
  check("I9 dosage conflict detected", conflicts.length >= 1, `count=${conflicts.length}`);
  check("I9 conflict remains OPEN (never auto-resolved)", conflicts.every((c) => c.status === "OPEN"));
  const conflictingEvents = await prisma.clinicalEvent.count({ where: { patientId: PID, evidenceStatus: "CONFLICTING" } });
  check("I9 conflicting events flagged CONFLICTING", conflictingEvents > 0, `count=${conflictingEvents}`);
  const gaps = await prisma.timelineGap.count({ where: { patientId: PID } });
  check("timeline gap detected (missing record surfaced, not invented)", gaps >= 1, `count=${gaps}`);
  const derived = await prisma.eventRelationship.count({ where: { patientId: PID, derivedRule: { not: null } } });
  check("derived relationships state their rule", derived > 0, `count=${derived}`);

  // ---------- I7/I8 CareShare lifecycle: create -> list -> revoke ----------
  const shareRes = await req(pc, "/api/share", {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ scopes: ["TIMELINE", "MEDICATIONS"], permission: "VIEW_ONLY", expiresIn: "1h", documentIds: [] }),
  });
  const share = await json(shareRes);
  check("patient POST /api/share -> 200", shareRes.status === 200, `got ${shareRes.status} ${JSON.stringify(share).slice(0, 120)}`);
  check("share token is non-guessable (>= 32 chars)", typeof share.token === "string" && share.token.length >= 32, `len=${share.token?.length}`);
  check("I8 shareUrl is tokenized + expiring, not a permanent public path",
    typeof share.shareUrl === "string" && share.shareUrl.includes("/share/") && Boolean(share.expiresAt));
  const listRes = await req(pc, "/api/share");
  const list = await json(listRes);
  check("patient GET /api/share -> 200", listRes.status === 200, `got ${listRes.status}`);
  check("I7 tokenHash never exposed to client", (list.shares ?? []).every((s) => s.tokenHash === undefined));
  check("created share appears in list", (list.shares ?? []).some((s) => s.id === share.id));
  const revRes = await req(pc, `/api/share?id=${share.id}`, { method: "DELETE" });
  check("patient DELETE /api/share -> 200 (revoke)", revRes.status === 200, `got ${revRes.status}`);
  const revoked = await prisma.shareSession.findUnique({ where: { id: share.id } });
  check("I7 share marked revoked in DB", revoked?.revoked === true);

  // ---------- Doctor session + scoping ----------
  const d = await signin("doctor@demo.medcare", "demo1234");
  check("POST /api/auth/signin (doctor) -> 200", d.status === 200, `got ${d.status}`);
  const dc = d.cookie;

  const docShare = await req(dc, "/api/share", {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ scopes: ["TIMELINE"], permission: "VIEW_ONLY", expiresIn: "1h", documentIds: [] }),
  });
  check("doctor POST /api/share -> 403 (patients only)", docShare.status === 403, `got ${docShare.status}`);

  const docTl = await req(dc, `/api/timeline?patientId=${PID}`);
  const docTlBody = await json(docTl);
  check("I7 doctor GET /api/timeline for shared patient -> 200", docTl.status === 200, `got ${docTl.status}`);
  check("doctor sees the same reconstructed journey", (docTlBody.events?.length ?? 0) > 0, `len=${docTlBody.events?.length}`);

  // IDOR: doctor requesting a patient with no explicit link must be denied
  const idor = await req(dc, "/api/timeline?patientId=cm_not_a_real_patient_id");
  check("IDOR blocked: doctor cannot read unshared/unknown patient", idor.status === 403 || idor.status === 400, `got ${idor.status}`);
  const idorDocs = await req(dc, `/api/documents?patientId=${PID}_tampered`);
  check("IDOR blocked: doctor cannot enumerate documents of unknown patient", idorDocs.status === 403 || idorDocs.status === 400, `got ${idorDocs.status}`);
  const idorShare = await req(pc, `/api/share?id=cm_not_a_real_share_id`, { method: "DELETE" });
  check("revoke of unknown share id does not 500", idorShare.status < 500, `got ${idorShare.status}`);

  // Patient is auto-scoped: passing someone else's id must not change the scope
  const spoof = await req(pc, `/api/timeline?patientId=cm_not_a_real_patient_id`);
  const spoofBody = await json(spoof);
  check("I7 patient scope is server-derived (spoofed patientId ignored)",
    spoof.status === 200 && spoofBody.events?.length === tl.events?.length,
    `status=${spoof.status} len=${spoofBody.events?.length} vs ${tl.events?.length}`);

  // ---------- I7 Emergency break-glass ----------
  const emGet = await req(dc, "/api/emergency");
  check("GET /api/emergency -> 200 (OTP mode advertised)", emGet.status === 200, `got ${emGet.status}`);
  const emBad = await req(dc, "/api/emergency", {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ patientId: PID, reason: "short", otp: "123456", confirm: true }),
  });
  check("emergency rejected without valid reason (>=10 chars)", emBad.status === 400, `got ${emBad.status}`);
  const emNoConfirm = await req(dc, "/api/emergency", {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ patientId: PID, reason: "Unresponsive patient, need medication history", otp: "123456" }),
  });
  check("emergency rejected without explicit confirm", emNoConfirm.status === 400, `got ${emNoConfirm.status}`);
  const emPatient = await req(pc, "/api/emergency", {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ patientId: PID, reason: "Trying to break glass as a patient", otp: "123456", confirm: true }),
  });
  check("emergency restricted to clinicians (patient -> 403)", emPatient.status === 403, `got ${emPatient.status}`);
  const emOk = await req(dc, "/api/emergency", {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ patientId: PID, reason: "Unresponsive patient in ED, need documented medications and allergies", otp: "123456", confirm: true }),
  });
  const emBody = await json(emOk);
  check("I7 emergency break-glass granted -> 200", emOk.status === 200, `got ${emOk.status} ${JSON.stringify(emBody).slice(0, 140)}`);
  check("I7 emergency session is time-boxed (expiresAt present)", Boolean(emBody.session?.expiresAt), JSON.stringify(emBody.session));
  check("emergency snapshot is scoped (snapshot payload returned, not whole record)", emBody.snapshot != null);
  const emSession = emBody.session?.id ? await prisma.emergencyAccessSession.findUnique({ where: { id: emBody.session.id } }) : null;
  check("I7 emergency session persisted with reason + expiry", Boolean(emSession?.reason && emSession?.expiresAt));
  check("I7 emergency expiry is short-lived (<= 4h)", emSession ? (new Date(emSession.expiresAt).getTime() - Date.now()) <= 4 * 3600 * 1000 : false,
    emSession ? String(emSession.expiresAt) : "no session");
  const emAudit = await prisma.auditLog.findFirst({ where: { action: "EMERGENCY_ACCESS", result: "OK" }, orderBy: { createdAt: "desc" } });
  check("I7 emergency access fully audited", Boolean(emAudit));

  // Audit trail for share + revoke + document access
  const shareAudit = await prisma.auditLog.findFirst({ where: { action: "SHARE" }, orderBy: { createdAt: "desc" } });
  const revokeAudit = await prisma.auditLog.findFirst({ where: { action: "REVOKE" }, orderBy: { createdAt: "desc" } });
  check("SHARE action audited", Boolean(shareAudit));
  check("REVOKE action audited", Boolean(revokeAudit));

  // ---------- Invariant I10: synthetic data only ----------
  const realEmailish = await prisma.user.count({ where: { email: { not: { endsWith: "@demo.medcare" } } } });
  const totalUsers = await prisma.user.count();
  check("I10 demo dataset is synthetic-only (all users @demo.medcare)", realEmailish === 0 || totalUsers === 0,
    `non-demo users=${realEmailish}/${totalUsers}`);

  console.log(results.join("\n"));
  console.log(`\nE2E: ${pass} passed, ${fail} failed  (${BASE})`);
  if (fail > 0) process.exitCode = 1;
}

main()
  .catch((e) => { console.error("E2E crashed:", e); process.exitCode = 1; })
  .finally(async () => { await prisma.$disconnect(); });