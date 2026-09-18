import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { MetricCard } from "@/components/MetricCard";
import { DISCLAIMER } from "@/lib/enums";
import { cookies } from "next/headers";
import Link from "next/link";

const TYPE_ICONS: Record<string, string> = {
  DIAGNOSIS: "◈", MEDICATION: "◈", LAB: "◈", PROCEDURE: "◈",
  HOSPITALIZATION: "◈", IMAGING: "◈",
};

export default async function Dashboard({ searchParams }: { searchParams: { patientId?: string } }) {
  const base = process.env.APP_URL ?? "http://localhost:3000";
  const cookie = cookies().toString();
  const pid = searchParams.patientId ?? "";
  const t = pid
    ? await fetch(`${base}/api/events?patientId=${pid}`, { headers: { cookie }, cache: "no-store" })
        .then((r) => r.ok ? r.json() : null).catch(() => null)
    : null;

  const events: { id: string; title: string; eventType: string; evidenceStatus: string }[] = t?.events ?? [];
  const conds = events.filter((e) => e.eventType === "DIAGNOSIS").slice(0, 5);
  const meds = events.filter((e) => e.eventType === "MEDICATION").slice(0, 8);
  const labs = events.filter((e) => e.eventType === "LAB").slice(-6).reverse();
  const hosp = events.filter((e) => e.eventType === "HOSPITALIZATION");
  const conflicts: { id: string; title: string }[] = t?.conflicts ?? [];

  return (
    <AppShell role="DOCTOR">
      <PageHeader title="30-Second Clinical Cockpit" subtitle="Decision support — every claim links to evidence." aiDerived />

      {!pid ? (
        <div className="glass p-8 text-center">
          <p className="text-4xl mb-4 text-slate-700">◈</p>
          <p className="font-bold text-slate-200 text-lg">Open a shared patient</p>
          <p className="text-sm text-slate-500 mt-1 mb-5">Go to Patients, then open the cockpit.</p>
          <Link href="/doctor/patients" className="btn-primary">
            View Patients
          </Link>
        </div>
      ) : !t ? (
        <div className="glass p-6">
          <p className="text-red-400">Not authorized for this patient (403) or no records.</p>
        </div>
      ) : (
        <div className="space-y-5 animate-slide-up">
          {/* Metrics */}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <MetricCard label="Conditions" value={conds.length} sub={conds.map((c) => c.title).join("; ") || "—"} />
            <MetricCard label="Medications" value={meds.length} sub={meds.map((c) => c.title).join("; ") || "—"} />
            <MetricCard label="Hospitalizations" value={hosp.length} />
            <MetricCard label="Conflicts" value={conflicts.length} sub="unresolved" accent={conflicts.length > 0 ? "danger" : "default"} />
          </div>

          {/* Active conflicts banner */}
          {conflicts.length > 0 && (
            <div className="rounded-2xl border border-red-500/25 bg-red-500/8 p-4">
              <p className="text-sm font-bold text-red-300 mb-2">⚠ Active conflicts — require verification</p>
              <ul className="space-y-1">
                {conflicts.map((c) => (
                  <li key={c.id} className="flex items-center gap-2 text-sm text-red-400/80">
                    <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
                    {c.title}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            {/* Clinical brief */}
            <div className="glass p-5">
              <p className="section-title mb-3">Clinical brief</p>
              <ul className="space-y-2">
                {events.slice(0, 10).map((e) => (
                  <li key={e.id} className="flex items-start gap-2.5 text-sm">
                    <span className="mt-1 text-xs text-slate-600">{TYPE_ICONS[e.eventType] ?? "◇"}</span>
                    <span className="text-slate-300 leading-snug">
                      {e.title}{" "}
                      <span className="text-xs text-slate-600">[{e.evidenceStatus}]</span>
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-[11px] italic text-slate-600">{DISCLAIMER}</p>
            </div>

            {/* Recent labs */}
            <div className="glass p-5">
              <p className="section-title mb-3">Recent labs</p>
              {labs.length === 0 ? (
                <p className="text-sm text-slate-600">No lab events.</p>
              ) : (
                <ul className="space-y-2">
                  {labs.map((e) => (
                    <li key={e.id} className="flex items-center gap-2 text-sm text-slate-300">
                      <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
                      {e.title}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Quick actions */}
          <div className="flex flex-wrap gap-2">
            <Link href="/patient/journey" className="btn-ghost text-xs px-4 py-2">
              Full Journey
            </Link>
            <Link href={`/api/snapshots?patientId=${pid}`} className="btn-ghost text-xs px-4 py-2">
              What Changed?
            </Link>
            <Link href={`/doctor/shared?patientId=${pid}`} className="btn-ghost text-xs px-4 py-2">
              Original Documents
            </Link>
          </div>
        </div>
      )}
    </AppShell>
  );
}
