"use client";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";

const SCOPES = ["TIMELINE", "DIAGNOSES", "MEDICATIONS", "LABS", "IMAGING", "HOSPITALIZATIONS", "DOCUMENTS"];

type Share = { id: string; scopes: string[]; permission: string; expiresAt: string; revoked: boolean };

export default function Share() {
  const [scopes, setScopes] = useState<string[]>(["TIMELINE", "MEDICATIONS"]);
  const [permission, setPermission] = useState("VIEW_ONLY");
  const [expiresIn, setExpiresIn] = useState("24h");
  const [link, setLink] = useState("");
  const [shares, setShares] = useState<Share[]>([]);

  async function load() {
    const r = await fetch("/api/share");
    if (r.ok) setShares((await r.json()).shares);
  }
  useEffect(() => { load(); }, []);

  async function create() {
    const r = await fetch("/api/share", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scopes, permission, expiresIn, documentIds: [] }),
    });
    const j = await r.json();
    if (r.ok) { setLink(j.shareUrl); load(); } else alert(j.error);
  }

  function toggleScope(s: string) {
    setScopes((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]);
  }

  return (
    <AppShell role="PATIENT">
      <PageHeader title="Share My Journey" subtitle="Patient-controlled, expiring, revocable. Doctors see only what you share." />

      <div className="grid gap-5 md:grid-cols-2">
        {/* Create share */}
        <div className="glass p-5 space-y-4">
          <p className="font-semibold text-slate-200">Create share link</p>

          <div>
            <p className="label">Scope</p>
            <div className="flex flex-wrap gap-2">
              {SCOPES.map((s) => (
                <button
                  key={s}
                  onClick={() => toggleScope(s)}
                  className={`rounded-full border px-3 py-1 text-xs font-semibold transition-all duration-150 ${
                    scopes.includes(s)
                      ? "border-clinical-500/50 bg-clinical-500/20 text-clinical-300"
                      : "border-white/8 bg-white/4 text-slate-500 hover:bg-white/8"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <p className="label">Permission</p>
              <select
                value={permission}
                onChange={(e) => setPermission(e.target.value)}
                className="input"
              >
                <option value="VIEW_ONLY">View only</option>
                <option value="VIEW_AND_DOWNLOAD">View & download</option>
              </select>
            </div>
            <div className="flex-1">
              <p className="label">Expires</p>
              <select
                value={expiresIn}
                onChange={(e) => setExpiresIn(e.target.value)}
                className="input"
              >
                <option value="1h">1 hour</option>
                <option value="24h">24 hours</option>
                <option value="7d">7 days</option>
              </select>
            </div>
          </div>

          <button onClick={create} className="btn-primary w-full justify-center">
            Generate share link
          </button>

          {link && (
            <div className="rounded-xl border border-clinical-500/20 bg-clinical-500/8 p-3">
              <p className="text-xs text-slate-500 mb-1">Signed, non-guessable link:</p>
              <a href={link} className="break-all text-xs text-clinical-400 hover:text-clinical-300 transition-colors">
                {link}
              </a>
            </div>
          )}
        </div>

        {/* Access list */}
        <div className="glass p-5">
          <p className="font-semibold text-slate-200 mb-4">Active shares</p>
          {shares.length === 0 ? (
            <p className="text-sm text-slate-600">No active shares.</p>
          ) : (
            <ul className="space-y-3">
              {shares.map((s) => (
                <li key={s.id} className="glass-sm p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-300 truncate">{s.scopes.join(", ")}</p>
                      <p className="text-xs text-slate-600 mt-0.5">
                        {s.permission} · expires {new Date(s.expiresAt).toLocaleString()}
                      </p>
                      {s.revoked && <span className="tag border border-red-500/20 bg-red-500/10 text-red-400 mt-1">Revoked</span>}
                    </div>
                    {!s.revoked && (
                      <button
                        className="flex-shrink-0 text-xs font-semibold text-red-400 hover:text-red-300 transition-colors"
                        onClick={async () => { await fetch(`/api/share?id=${s.id}`, { method: "DELETE" }); load(); }}
                      >
                        Revoke
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </AppShell>
  );
}
