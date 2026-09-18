import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { MetricCard } from "@/components/MetricCard";
import { EmptyState } from "@/components/EmptyState";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";

async function data() {
  const base = process.env.APP_URL ?? "http://localhost:3000";
  const cookie = cookies().toString();
  const [t, d, s] = await Promise.all([
    fetch(`${base}/api/events`, { headers: { cookie }, cache: "no-store" }).then((r) => r.ok ? r.json() : null).catch(() => null),
    fetch(`${base}/api/documents`, { headers: { cookie }, cache: "no-store" }).then((r) => r.ok ? r.json() : null).catch(() => null),
    fetch(`${base}/api/snapshots`, { headers: { cookie }, cache: "no-store" }).then((r) => r.ok ? r.json() : null).catch(() => null),
  ]);
  return { t, d, s };
}

export default async function Overview() {
  const jar = cookies().get("medcare_session");
  if (!jar) redirect("/signin");
  const { t, d, s } = await data();
  const events: { id: string; title: string; eventType: string }[] = t?.events ?? [];
  const conflicts: { id: string; title: string }[] = t?.conflicts ?? [];
  const gaps: { id: string; title: string }[] = t?.gaps ?? [];
  const docCount: number = d?.documents?.length ?? 0;
  const whatChanged: { summary?: string }[] = s?.whatChanged ?? [];

  return (
    <AppShell role="PATIENT">
      <PageHeader title="Overview" subtitle="Your health journey at a glance." aiDerived />

      {!t ? (
        <EmptyState
          title="No records yet"
          hint="Upload documents to build your journey."
          action={<Link href="/patient/documents" className="btn-primary">Go to Documents</Link>}
        />
      ) : (
        <div className="space-y-6 animate-slide-up">
          {/* Metrics */}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <MetricCard label="Documents" value={docCount} />
            <MetricCard label="Events" value={events.length} />
            <MetricCard label="Conflicts" value={conflicts.length} sub="need verification" accent={conflicts.length > 0 ? "danger" : "default"} />
            <MetricCard label="Gaps" value={gaps.length} sub="possible missing records" accent={gaps.length > 0 ? "warn" : "default"} />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {/* Recent events */}
            <div className="glass p-5">
              <p className="section-title mb-3">Recent events</p>
              <ul className="space-y-2">
                {events.slice(-5).reverse().map((e) => (
                  <li key={e.id} className="flex items-center gap-2.5 text-sm">
                    <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-clinical-500" />
                    <span className="text-slate-300 leading-snug">{e.title}</span>
                  </li>
                ))}
              </ul>
              <Link href="/patient/journey" className="mt-4 inline-flex text-xs text-clinical-400 hover:text-clinical-300 transition-colors">
                View full journey →
              </Link>
            </div>

            {/* What changed */}
            <div className="glass p-5">
              <p className="section-title mb-3">What changed?</p>
              {whatChanged.length === 0 ? (
                <p className="text-sm text-slate-600">No changes since last snapshot.</p>
              ) : (
                <ul className="space-y-2">
                  {whatChanged.slice(0, 5).map((w, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm">
                      <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-violet-400" />
                      <span className="text-slate-300">{w.summary ?? JSON.stringify(w)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Gaps & conflicts */}
          {(gaps.length > 0 || conflicts.length > 0) && (
            <div className="glass p-5">
              <p className="section-title mb-3">What don&apos;t we know?</p>
              <p className="text-sm text-slate-500 mb-3">
                Uncertain dates stay fuzzy · conflicts need verification · gaps may be missing records.
              </p>
              <ul className="space-y-1.5">
                {gaps.map((g) => (
                  <li key={g.id} className="flex items-center gap-2 text-sm text-amber-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                    {g.title}
                  </li>
                ))}
                {conflicts.map((c) => (
                  <li key={c.id} className="flex items-center gap-2 text-sm text-red-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
                    {c.title}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </AppShell>
  );
}
