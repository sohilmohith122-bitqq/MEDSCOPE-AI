"use client";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";

export default function Emergency() {
  const [form, setForm] = useState({ patientId: "", reason: "", otp: "", confirm: false });
  const [out, setOut] = useState<{ session?: { expiresAt: string }; snapshot?: Record<string, { title: string }[]> } | null>(null);
  const [left, setLeft] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    try {
      const r = await fetch("/api/emergency", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, confirm: true }),
      });
      const j = await r.json();
      if (!r.ok) { alert(j.error); return; }
      setOut(j);
      const exp = new Date(j.session.expiresAt).getTime();
      const tick = setInterval(() => {
        const s = Math.max(0, Math.round((exp - Date.now()) / 1000));
        setLeft(`${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`);
        if (s <= 0) clearInterval(tick);
      }, 1000);
    } finally { setLoading(false); }
  }

  return (
    <AppShell role="DOCTOR">
      <PageHeader title="Emergency Break-Glass" subtitle="Authenticated · reason-gated · OTP · time-boxed · fully audited." />

      {out && (
        <div className="mb-5 flex items-center gap-3 rounded-2xl border border-red-500/30 bg-red-500/15 px-5 py-4 shadow-glow-red animate-slide-up">
          <span className="h-2.5 w-2.5 rounded-full bg-red-400 animate-pulse" />
          <p className="font-bold text-red-300">BREAK-GLASS ACCESS ACTIVE</p>
          <span className="ml-auto font-mono text-lg font-black text-red-300">{left}</span>
        </div>
      )}

      <div className="grid gap-5 md:grid-cols-2">
        {/* Form */}
        <div className="glass p-5 space-y-4">
          <p className="font-semibold text-slate-200">Request emergency access</p>

          <div>
            <label className="label">Patient ID</label>
            <input
              value={form.patientId}
              onChange={(e) => setForm({ ...form, patientId: e.target.value })}
              placeholder="Patient profile ID"
              className="input"
            />
          </div>
          <div>
            <label className="label">Clinical reason (min 10 chars)</label>
            <textarea
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              placeholder="Describe the clinical emergency…"
              rows={3}
              className="input resize-none"
            />
          </div>
          <div>
            <label className="label">OTP (demo: 123456)</label>
            <input
              value={form.otp}
              onChange={(e) => setForm({ ...form, otp: e.target.value })}
              placeholder="One-time password"
              className="input font-mono"
            />
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.confirm}
              onChange={(e) => setForm({ ...form, confirm: e.target.checked })}
              className="h-4 w-4 rounded border-white/20 bg-white/5 accent-red-500"
            />
            <span className="text-sm text-slate-400">I explicitly confirm emergency access</span>
          </label>
          <button
            onClick={submit}
            disabled={loading || !form.confirm}
            className="btn-danger w-full justify-center disabled:opacity-40"
          >
            {loading ? (
              <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
            ) : "Request break-glass access"}
          </button>
        </div>

        {/* Snapshot */}
        <div className="glass p-5">
          <p className="section-title mb-3">Emergency snapshot (scoped)</p>
          {out?.snapshot ? (
            <div className="space-y-3">
              {Object.entries(out.snapshot).map(([key, items]) => (
                <div key={key}>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{key}</p>
                  <ul className="space-y-1">
                    {(items as { title: string }[]).map((item, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-slate-300">
                        <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
                        {item.title}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-slate-600 space-y-1">
              <p>Scoped to critical data only:</p>
              <ul className="mt-2 space-y-1 text-slate-700">
                {["Allergies", "Current medications", "Major conditions", "Recent procedures / hospitalizations", "Critical warnings"].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <span className="h-1 w-1 rounded-full bg-slate-700" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
