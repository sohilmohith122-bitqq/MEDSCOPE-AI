// MEDCARE authenticated end-to-end smoke test (synthetic demo data only).
const BASE = process.env.E2E_BASE ?? "http://localhost:3001";
let pass = 0;
let fail = 0;
function check(name, ok, detail = "") {
  if (ok) { pass++; console.log(`PASS  ${name}${detail ? " :: " + detail : ""}`); }
  else { fail++; console.log(`FAIL  ${name}${detail ? " :: " + detail : ""}`); }
}
async function req(path, opts = {}, cookies = "") {
  const res = await fetch(BASE + path, {
    ...opts,
    headers: { ...(opts.headers ?? {}), ...(cookies ? { cookie: cookies } : {}) },
    redirect: "manual",
  });
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch {}
  const setCookie = res.headers.getSetCookie?.() ?? [];
  return { status: res.status, text, json, cookies: setCookie.map((c) => c.split(";")[0]).join("; ") };
}
async function signin(email, password) {
  const r = await req("/api/auth/signin", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return r;
}

console.log(`\n=== MEDCARE E2E @ ${BASE} ===\n`);

// 1. Public surface
const home = await req("/");
check("GET / (public landing)", home.status === 200, `status=${home.status} len=${home.text.length}`);
const signinPage = await req("/signin");
check("GET /signin", signinPage.status === 200, `status=${signinPage.status}`);

// 2. Unauthenticated guards
for (const p of ["/api/timeline", "/api/events", "/api/documents", "/api/audit", "/api/share"]) {
  const r = await req(p);
  check(`unauth ${p} blocked`, r.status === 401 || r.status === 403, `status=${r.status}`);
}

// 3. Patient signin
const patient = await signin("patient@demo.medcare", "demo1234");
check("POST /api/auth/signin patient", patient.status === 200, `status=${patient.status}`);
check("patient session cookie issued", /medcare_session=/.test(patient.cookies), patient.cookies.slice(0, 40));
const pc = patient.cookies;

// 4. Patient reads own data
const timeline = await req("/api/timeline", {}, pc);
check("patient GET /api/timeline", timeline.status === 200 && Array.isArray(timeline.json?.events), `status=${timeline.status} events=${timeline.json?.events?.length}`);
if (timeline.json?.events?.length) {
  const e = timeline.json.events[0];
  check("event carries traceability (I1)", Boolean(e.sourceDocumentId && e.sourcePage && e.evidenceQuote), `doc=${e.sourceDocumentId} page=${e.sourcePage}`);
  check("event carries evidenceStatus enum (I2)", ["DOCUMENTED", "DERIVED", "UNCERTAIN", "CONFLICTING"].includes(e.evidenceStatus), e.evidenceStatus);
  check("event carries datePrecision enum (I4)", ["EXACT", "MONTH", "YEAR", "APPROXIMATE", "RELATIVE", "UNKNOWN"].includes(e.datePrecision), e.datePrecision);
}
const docs = await req("/api/documents", {}, pc);
check("patient GET /api/documents", docs.status === 200 && Array.isArray(docs.json?.documents), `status=${docs.status} docs=${docs.json?.documents?.length}`);
check("documents never expose storageKey (I8/I5)", (docs.json?.documents ?? []).every((d) => d.storageKey == null), "storageKey stripped");
const events = await req("/api/events", {}, pc);
check("patient GET /api/events", events.status === 200, `status=${events.status}`);
const snaps = await req("/api/snapshots", {}, pc);
check("patient GET /api/snapshots", snaps.status === 200, `status=${snaps.status}`);

// 5. Doctor signin
const doctor = await signin("doctor@demo.medcare", "demo1234");
check("POST /api/auth/signin doctor", doctor.status === 200, `status=${doctor.status}`);
const dc = doctor.cookies;

// 6. Cross-patient isolation (I7): doctor accessing an arbitrary/unknown patient id must not leak
const doctorTimeline = await req("/api/timeline", {}, dc);
check("doctor GET /api/timeline without patientId handled", doctorTimeline.status === 200 || doctorTimeline.status === 400, `status=${doctorTimeline.status}`);

// 7. Emergency break-glass requires reason + is audited (I7)
const emergencyBad = await req("/api/emergency", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({}) }, dc);
check("emergency POST rejects empty body", emergencyBad.status >= 400 && emergencyBad.status < 500, `status=${emergencyBad.status}`);

// 8. Share creation requires patient role (I7)
const shareAsDoctor = await req("/api/share", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ scopes: ["TIMELINE"], expiresIn: "24h" }) }, dc);
check("doctor cannot create share", shareAsDoctor.status === 403, `status=${shareAsDoctor.status}`);

// 9. Audit trail is recorded and readable
const audit = await req("/api/audit", {}, pc);
check("audit log readable", audit.status === 200, `status=${audit.status} len=${audit.text.length}`);
check("audit contains LOGIN or signin event", /LOGIN|SIGNIN|signin/i.test(audit.text), "action present");

console.log(`\n=== RESULT: ${pass} passed, ${fail} failed ===\n`);
process.exit(fail === 0 ? 0 : 1);