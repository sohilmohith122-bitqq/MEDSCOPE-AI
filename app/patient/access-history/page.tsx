import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { cookies } from "next/headers";

const RESULT_STYLES: Record<string, string> = {
  ALLOWED: "tag border border-emerald-500/20 bg-emerald-500/10 text-emerald-300",
  DENIED: "tag border border-red-500/20 bg-red-500/10 text-red-300",
  SUCCESS: "tag border border-emerald-500/20 bg-emerald-500/10 text-emerald-300",
  FAILED: "tag border border-red-500/20 bg-red-500/10 text-red-300",
};

export default async function AccessHistory() {
  const base = process.env.APP_URL ?? "http://localhost:3000";
  const logs: {
    id: string; actorRole?: string; action: string; targetType?: string;
    accessType?: string; result: string; createdAt: string;
  }[] = await fetch(`${base}/api/audit`, { headers: { cookie: cookies().toString() }, cache: "no-store" })
    .then((r) => r.json()).then((j) => j.logs ?? []).catch(() => []);

  return (
    <AppShell role="PATIENT">
      <PageHeader title="Access History" subtitle="Who viewed your records, when, and how." />
      <div className="glass overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/6">
                {["Actor", "Action", "Target", "Access", "Result", "Time"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {logs.map((l, i) => (
                <tr key={l.id} className={`border-b border-white/4 transition-colors hover:bg-white/3 ${i % 2 === 0 ? "" : "bg-white/1"}`}>
                  <td className="px-4 py-3 text-xs text-slate-400">{l.actorRole ?? "—"}</td>
                  <td className="px-4 py-3 text-xs font-mono text-slate-300">{l.action}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">{l.targetType ?? "—"}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">{l.accessType ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span className={RESULT_STYLES[l.result] ?? "tag border border-slate-500/20 bg-slate-500/10 text-slate-400"}>
                      {l.result}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600 whitespace-nowrap">
                    {new Date(l.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-600">
                    No access logs yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
