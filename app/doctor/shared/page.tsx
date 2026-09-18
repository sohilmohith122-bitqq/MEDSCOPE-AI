"use client";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
export default function Shared() {
  const [pid, setPid] = useState("");
  const [docs, setDocs] = useState<{ id: string; fileName: string; docType: string }[]>([]);
  async function load() { const r = await fetch(`/api/documents?patientId=${pid}`); if (r.ok) setDocs((await r.json()).documents); else alert("Not authorized (403)"); }
  return (
    <AppShell role="DOCTOR">
      <PageHeader title="Shared Records" subtitle="Only explicitly shared scopes. Originals stream via authorized endpoints — no public URLs." aiDerived />
      <div className="flex gap-2"><input value={pid} onChange={(e) => setPid(e.target.value)} placeholder="patient profile id" className="w-full rounded-lg border p-2" /><button onClick={load} className="rounded-lg bg-teal-700 px-4 py-2 font-bold text-white">Load</button></div>
      <ul className="mt-4 space-y-2">{docs.map((d) => <li key={d.id} className="flex justify-between rounded-xl border bg-white p-3 text-sm"><span>{d.fileName} · {d.docType}</span><a className="font-bold underline" target="_blank" href={`/api/documents/${d.id}/file`}>Open</a></li>)}</ul>
    </AppShell>
  );
}