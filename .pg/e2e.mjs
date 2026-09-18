// MEDCARE live end-to-end smoke test (synthetic demo data only).
// Usage: node .pg/e2e.mjs [baseUrl]
const BASE = process.argv[2] ?? "http://localhost:3001";
const PATIENT = { email: "patient@demo.medcare", password: "demo1234" };
const DOCTOR = { email: "doctor@demo.medcare", password: "demo1234" };

const results = [];
function record(name, ok, detail) {
  results.push({ name, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? " :: " + detail : ""}`);
}

function makeJar() {
  return { cookie: "" };
}

async function call(jar, path, init = {}) {
  const headers = { "content-type": "application/json", ...(init.headers ?? {}) };
  if (jar.cookie) headers.cookie = jar.cookie;
  const res = await fetch(BASE + path, { ...init, headers, redirect: "manual" });
  const setCookie = res.headers.getSetCookie ? res.headers.getSetCookie() : [];
  if (setCookie.length) jar.cookie = setCookie.map((c) => c.split(";")[0]).join("; ");
  let body = null;
  const text = await res.text();
  try { body = JSON.parse(text); } catch { body = text.slice(0, 300); }
  return { status: res.status, body };
}

const main = async () => {
  // 1. Public landing page
  const home = await fetch(BASE + "/");
  record("GET / (landing)", home.status === 200, `status=${home.status}`);

  // 2. Unauthenticated access must be rejected
  const anon = await call(makeJar(), "/api/timeline");
  record("GET /api/timeline unauthenticated -> 401", anon.status === 401, `status=${anon.status}`);

  // 3. Patient sign-in
  const patient = makeJar();
  const pSignin = await call(patient, "/api/auth/signin", { method: "POST", body: JSON.stringify(PATIENT) });
  record("POST /api/auth/signin (patient)", pSignin.status === 200 && !!patient.cookie, `status=${pSignin.status}`);

  if (!patient.cookie) {
    console.log("\nCannot continue: patient session not established.");
    process.exitCode = 1;
    return;
  }

  // 4. Patient scoped reads
  const timeline = await call(patient, "/api/timeline");
  const events = Array.isArray(timeline.body?.events) ? timeline.body.events : [];
  record("GET /api/timeline (patient)", timeline.status === 200 && events.length > 0, `status=${timeline.status} events=${events.length}`);

  const precisionKept = events.every((e) => ["EXACT", "MONTH", "YEAR", "APPROXIMATE", "RELATIVE", "UNKNOWN"].includes(e.datePrecision));
  record("I4 date_precision is a valid enum on every event", precisionKept, `distinct=${[...new Set(events.map((e) => e.datePrecision))].join(",")}`);

  const statusKept = events.every((e) => ["DOCUMENTED", "DERIVED", "UNCERTAIN", "CONFLICTING"].includes(e.evidenceStatus));
  record("I2 evidence_status is a valid enum on every event", statusKept, `distinct=${[...new Set(events.map((e) => e.evidenceStatus))].join(",")}`);

  const traceable = events.every((e) => e.sourceDocumentId && e.sourcePage >= 1 && typeof e.evidenceQuote === "string" && e.evidenceQuote.length > 0);
  record("I1 every event has document + page + evidence quote", traceable);

  const monthNotUpgraded = events.filter((e) => e.datePrecision === "MONTH").every((e) => {
    const d = new Date(e.eventDate);
    return d.getUTCDate() === 1;
  });
  record("I4 MONTH precision not silently upgraded to EXACT", monthNotUpgraded);

  const docs = await call(patient, "/api/documents");
  const docList = Array.isArray(docs.body?.documents) ? docs.body.documents : [];
  record("GET /api/documents (patient)", docs.status === 200 && docList.length > 0, `status=${docs.status} docs=${docList.length}`);
  record("I8 storageKey never returned to client", docList.every((d) => d.storageKey === undefined));

  const snaps = await call(patient, "/api/snapshots");
  record("GET /api/snapshots (patient)", snaps.status === 200, `status=${snaps.status}`);

  const ask = await call(patient, "/api/chat", { method: "POST", body: JSON.stringify({ question: "What medications are documented?" }) });
  const answer = typeof ask.body?.answer === "string" ? ask.body.answer : "";
  record("POST /api/chat grounded answer", ask.status === 200 && answer.length > 0, `status=${ask.status} len=${answer.length}`);
  const noAdvice = !/\byou should (take|start|stop)\b/i.test(answer);
  record("Product contract: assistant gives no treatment advice", noAdvice);

  // 5. Object-level authorization (IDOR): patient asking for a foreign patientId
  const idor = await call(patient, "/api/timeline?patientId=not-my-profile");
  record("IDOR: patient cannot read foreign patientId", idor.status === 403 || idor.status === 400, `status=${idor.status}`);

  // 6. Patient creates a scoped, expiring share
  const share = await call(patient, "/api/share", {
    method: "POST",
    body: JSON.stringify({ scopes: ["TIMELINE", "MEDICATIONS"], permission: "VIEW_ONLY", expiresIn: "1h" }),
  });
  const token = share.body?.token;
  record("POST /api/share creates expiring session", share.status === 200 && typeof token === "string", `status=${share.status}`);

  const shareList = await call(patient, "/api/share");
  const shares = Array.isArray(shareList.body?.shares) ? shareList.body.shares : [];
  record("GET /api/share lists own shares", shareList.status === 200 && shares.length > 0, `status=${shareList.status} n=${shares.length}`);
  record("share tokenHash never returned to client", shares.every((s) => s.tokenHash === undefined));

  // 7. Doctor sign-in + own access history
  const doctor = makeJar();
  const dSignin = await call(doctor, "/api/auth/signin", { method: "POST", body: JSON.stringify(DOCTOR) });
  record("POST /api/auth/signin (doctor)", dSignin.status === 200 && !!doctor.cookie, `status=${dSignin.status}`);

  if (doctor.cookie) {
    const dAudit = await call(doctor, "/api/audit");
    record("GET /api/audit (doctor)", dAudit.status === 200, `status=${dAudit.status}`);

    const dTimeline = await call(doctor, "/api/timeline");
    record("I7 doctor cannot read unshared patient timeline", dTimeline.status === 403 || dTimeline.status === 400, `status=${dTimeline.status}`);

    // 8. Emergency break-glass: reason required
    const noReason = await call(doctor, "/api/emergency", { method: "POST", body: JSON.stringify({}) });
    record("I7 emergency access rejects missing reason", noReason.status === 400 || noReason.status === 403, `status=${noReason.status}`);
  }

  // 9. Audit trail records the share
  const audit = await call(patient, "/api/audit");
  const logs = Array.isArray(audit.body?.logs) ? audit.body.logs : Array.isArray(audit.body) ? audit.body : [];
  record("Audit trail is written", audit.status === 200 && logs.length > 0, `status=${audit.status} entries=${logs.length}`);

  const failed = results.filter((r) => !r.ok);
  console.log(`\n=== E2E SUMMARY: ${results.length - failed.length}/${results.length} passed ===`);
  if (failed.length) {
    console.log("Failures:");
    for (const f of failed) console.log(` - ${f.name} ${f.detail ?? ""}`);
    process.exitCode = 1;
  }
};

main().catch((err) => {
  console.error("E2E crashed:", err?.message ?? err);
  process.exitCode = 1;
});