import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { cookies } from "next/headers";
export default async function Audit() {
  const base = process.env.APP_URL ?? "http://localhost:3000";
  const logs: { id: string; actorRole?: string; action: string; targetType?: string; targetId?: string; accessType?: string; result: string; createdAt: string }[] =
    await fetch(`${base}/api/audit`, { headers: { cookie: cookies().toString() }, cache: "no-store" }).then((r) => r.json()).then((j) => j.logs ?? []).catch(() => []);
  return (
    <AppShell role="DOCTOR">
      <PageHeader title="Audit History" subtitle="LOGIN · SHARE · DOCUMENT VIEW/DOWNLOAD · REVOKE · EMERGENCY ACCESS · TIMELINE VIEW · PATIENT ACCESS — actor, role, action, target, time, access type, result." />
      <div className="overflow-auto rounded-xl border bg-white"><table className="w-full text-sm"><thead><tr className="border-b text-left"><th className="p-2">Actor</th><th className="p-2">Action</th><th className="p-2">Target</th><th className="p-2">Access</th><th className="p-2">Result</th><th className="p-2">Time</th></tr></thead><tbody>{logs.map((l) => <tr key={l.id} className="border-b"><td className="p-2">{l.actorRole}</td><td className="p-2">{l.action}</td><td className="p-2">{l.targetType}:{l.targetId?.slice(0, 8)}</td><td className="p-2">{l.accessType}</td><td className="p-2">{l.result}</td><td className="p-2">{new Date(l.createdAt).toLocaleString()}</td></tr>)}</tbody></table></div>
      <p className="mt-3 text-xs text-slate-500">MEDCARE uses controlled, authenticated, auditable access.</p>
    </AppShell>
  );
}