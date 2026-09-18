// MEDCARE end-to-end smoke test (synthetic demo data only).
// Usage: node scripts/e2e.mjs [baseUrl]
const BASE = process.argv[2] ?? process.env.E2E_BASE ?? "http://localhost:3001";
let pass = 0;
let fail = 0;
const results = [];

function check(name, ok, detail = "") {
  if (ok) { pass++; results.push(`PASS  ${name}${detail ? " :: " + detail : ""}`); }
  else { fail++; results.push(`FAIL  ${name}${detail ? " :: " + detail : ""}`); }
}

async function call(path, { method = "GET", body, cookie } = {}) {
  const headers = {};
  if (body) headers["content-type"] = "application/json";
  if (cookie) headers["cookie"] = cookie;
  const res = await fetch(BASE + path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    redirect: "manual",
  });
  let json = null;
  let text = "";
  const ct = res.headers.get("content-type") ?? "";
  if (ct.includes("application/json")) { json = await res.json().catch(() => null); }
  else { text = await res.text().catch(() => ""); }
  const setCookie = res.headers.getSetCookie ? res.headers.getSetCookie() : [];
  const cookieHeader = setCookie.map((c) => c.split(";")[0]).join("; ");
  return { status: res.status, json, text, cookie: cookieHeader };
}

async function main() {
  // --- unauthenticated guards (I7) ---
  for (const p of ["/api/timeline", "/api/events", "/api/documents", "/api/share", "/api/audit", "/api/snapshots"]) {
    const r = await call(p);
    check(`guard 401 ${p}`, r.status === 401, `status=${r.status}`);
  }

  // --- pages render ---
  const home = await call("/");
  check("GET / 200", home.status === 200, `status=${home.status}`);
  const signin = await call("/signin");
  check("GET /signin 200", signin.status === 200, `status=${signin.status}`);

  // --- patient signin ---
  const pLogin = await call("/api/auth/signin", { method: "POST", body: { email: "patient@demo.medcare", password: "demo1234" } });
  check("patient signin 200", pLogin.status === 200, `status=${pLogin.status}`);
  const pCookie = pLogin.cookie;
  check("patient session cookie", pCookie.includes("medcare_session"), pCookie || "(none)");

  // --- patient timeline (evidence invariants) ---
  const tl = await call("/api/timeline", { cookie: pCookie });
  check("patient GET /api/timeline 200", tl.status === 200, `status=${tl.status}`);
  const events = tl.json?.events ?? [];
  check("timeline has events", events.length > 0, `count=${events.length}`);
  const precisionOk = events.every((e) => ["EXACT", "MONTH", "YEAR", "APPROXIMATE", "RELATIVE", "UNKNOWN"].includes(e.datePrecision));
  check("I4 date_precision enum valid", precisionOk);
  const statusOk = events.every((e) => ["DOCUMENTED", "DERIVED", "UNCERTAIN", "CONFLICTING"].includes(e.evidenceStatus));
  check("I2 evidence_status enum valid", statusOk);
  const traceOk = events.every((e) => e.sourceDocumentId && e.sourcePage && typeof e.evidenceQuote === "string");
  check("I1 traceability on every event", traceOk);
  const noUpgrade = events.filter((e) => e.datePrecision === "MONTH").every((e) => e.eventDate && new Date(e.eventDate).getUTCDate() === 1);
  check("I4 MONTH not upgraded to EXACT", noUpgrade);

  // --- patient documents ---
  const docs = await call("/api/documents", { cookie: pCookie });
  check("patient GET /api/documents 200", docs.status === 200, `status=${docs.status}`);
  check("documents storageKey stripped (I8)", (docs.json?.documents ?? []).every((d) => d.storageKey === undefined));

  // --- patient snapshots / what changed ---
  const snaps = await call("/api/snapshots", { cookie: pCookie });
  check("patient GET /api/snapshots 200", snaps.status === 200, `status=${snaps.status}`);

  // --- patient share create + list + revoke (I7/I8) ---
  const share = await call("/api/share", {
    method: "POST",
    cookie: pCookie,
    body: { scopes: ["TIMELINE", "MEDICATIONS"], permission: "VIEW_ONLY", expiresIn: "24h" },
  });
  check("patient POST /api/share 200", share.status === 200, `status=${share.status}`);
  const shareToken = share.json?.token;
  check("share token issued (non-guessable)", typeof shareToken === "string" && shareToken.length >= 24, `len=${shareToken?.length ?? 0}`);
  const shareList = await call("/api/share", { cookie: pCookie });
  check("share list 200 + tokenHash stripped", shareList.status === 200 && (shareList.json?.shares ?? []).every((s) => s.tokenHash === undefined));

  // --- patient access history ---
  const auditP = await call("/api/audit", { cookie: pCookie });
  check("patient GET /api/audit 200", auditP.status === 200, `status=${auditP.status}`);

  // --- doctor signin ---
  const dLogin = await call("/api/auth/signin", { method: "POST", body: { email: "doctor@demo.medcare", password: "demo1234" } });
  check("doctor signin 200", dLogin.status === 200, `status=${dLogin.status}`);
  const dCookie = dLogin.cookie;

  // --- doctor emergency break-glass (authenticated, reason-gated, time-boxed) ---
  const emgBad = await call("/api/emergency", { method: "POST", cookie: dCookie, body: { reason: "x" } });
  check("emergency rejects short reason (<10 chars)", emgBad.status === 400, `status=${emgBad.status}`);

  // --- cross-role boundary: patient must not create emergency access ---
  const emgPatient = await call("/api/emergency", { method: "POST", cookie: pCookie, body: { patientId: "any", reason: "Patient should not break glass" } });
  check("emergency forbidden for PATIENT", emgPatient.status === 403, `status=${emgPatient.status}`);

  // --- doctor cross-patient access must be denied (IDOR / I7) ---
  const foreign = await call("/api/timeline?patientId=not-a-real-patient-id", { cookie: dCookie });
  check("doctor blocked on unshared patient", foreign.status === 403 || foreign.status === 404, `status=${foreign.status}`);

  // --- patient cannot read another patient's data ---
  const crossPatient = await call("/api/timeline?patientId=someone-else", { cookie: pCookie });
  const crossBody = JSON.stringify(crossPatient.json ?? "");
  check(
    "patient cross-patient request scoped to self",
    crossPatient.status === 200 ? !crossBody.includes('"someone-else"') : true,
    `status=${crossPatient.status}`,
  );

  // --- revoke the share we created ---
  const shareId = share.json?.id;
  if (shareId) {
    const revoke = await call(`/api/share?id=${shareId}`, { method: "DELETE", cookie: pCookie });
    check("share revoke 200", revoke.status === 200, `status=${revoke.status}`);
  } else {
    check("share revoke 200", false, "no share id returned");
  }

  // --- chat assistant refuses medical advice, cites evidence ---
  const chat = await call("/api/chat", { method: "POST", cookie: pCookie, body: { question: "Should I change my medication dosage?" } });
  check("chat 200", chat.status === 200, `status=${chat.status}`);
  const answer = String(chat.json?.answer ?? "");
  check("chat refuses medical advice", /cannot provide medical advice/i.test(answer), answer.slice(0, 80));

  const chatGrounded = await call("/api/chat", { method: "POST", cookie: pCookie, body: { question: "Show medication history" } });
  check("chat grounded answer 200", chatGrounded.status === 200, `status=${chatGrounded.status}`);
  check("chat returns citations", Array.isArray(chatGrounded.json?.citations), `citations=${chatGrounded.json?.citations?.length ?? 0}`);

  console.log(results.join("\n"));
  console.log(`\nRESULT: ${pass} passed, ${fail} failed (base=${BASE})`);
  process.exit(fail === 0 ? 0 : 1);
}

main().catch((e) => {
  console.log(results.join("\n"));
  console.error("\nE2E ERROR:", e.message);
  process.exit(1);
});