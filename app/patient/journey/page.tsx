"use client";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { EventCard } from "@/components/EventCard";
import { EvidencePanel } from "@/components/EvidencePanel";
import { WhyThisPanel } from "@/components/WhyThisPanel";
import { LoadingState } from "@/components/LoadingState";
import { ErrorState } from "@/components/ErrorState";
import { EmptyState } from "@/components/EmptyState";

const FILTERS = ["All", "Diagnoses", "Medications", "Labs", "Procedures", "Hospitalizations", "Imaging"];

type Event = {
  id: string; title: string; eventType: string; eventDate: string | null;
  datePrecision: string; evidenceStatus: "DOCUMENTED" | "DERIVED" | "UNCERTAIN" | "CONFLICTING";
  sourcePage: number; evidenceQuote: string;
};
type Episode = { id: string; title: string; summary: string };
type Gap = { id: string; title: string; description: string };

export default function Journey() {
  const [filter, setFilter] = useState("All");
  const [data, setData] = useState<{ events: Event[]; episodes: Episode[]; conflicts: Gap[]; gaps: Gap[] } | null>(null);
  const [err, setErr] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [detail, setDetail] = useState<{
    event: { title: string; evidenceStatus: "DOCUMENTED" | "DERIVED" | "UNCERTAIN" | "CONFLICTING"; sourceDocumentId: string; sourcePage: number; evidenceQuote: string; confidence: number };
    relationships: { id: string; type: string; evidenceQuote: string; derivedRule?: string | null }[];
  } | null>(null);

  async function load(f: string) {
    setErr("");
    try {
      const r = await fetch(`/api/events?filter=${encodeURIComponent(f)}`, { cache: "no-store" });
      if (!r.ok) throw new Error(r.status === 403 ? "Not authorized" : "Failed to load");
      setData(await r.json());
    } catch (e) { setErr(e instanceof Error ? e.message : "Failed"); }
  }

  useEffect(() => { load(filter); }, [filter]);
  useEffect(() => {
    if (!selected) { setDetail(null); return; }
    fetch(`/api/events?id=${selected}`).then((r) => r.json()).then(setDetail).catch(() => setDetail(null));
  }, [selected]);

  const events = useMemo(() => (data?.events ?? []) as Event[], [data]);

  return (
    <AppShell role="PATIENT">
      <PageHeader title="My Journey" subtitle="Ordered by clinical event dates — never upload dates." aiDerived />

      {/* Filter pills */}
      <div className="mb-5 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full border px-4 py-1.5 text-xs font-semibold transition-all duration-150 ${
              filter === f
                ? "border-clinical-500/50 bg-clinical-500/20 text-clinical-300"
                : "border-white/8 bg-white/4 text-slate-400 hover:bg-white/8 hover:text-slate-200"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {!data && !err && <LoadingState label="Loading journey" />}
      {err && <ErrorState message={err} onRetry={() => load(filter)} />}
      {data && events.length === 0 && <EmptyState title="No events for this filter" hint="Try All, or upload more documents." />}

      <div className="grid gap-5 md:grid-cols-[1fr_340px]">
        {/* Timeline */}
        <div className="space-y-3">
          {(data?.episodes ?? []).map((ep) => (
            <div key={ep.id} className="glass-sm border-l-2 border-clinical-500/40 pl-4 py-3 pr-4">
              <p className="text-sm font-bold text-clinical-300">{ep.title}</p>
              <p className="text-xs text-slate-500 mt-0.5">{ep.summary}</p>
            </div>
          ))}
          {events.map((e) => (
            <div
              key={e.id}
              onClick={() => setSelected(selected === e.id ? null : e.id)}
              className={`transition-all duration-150 ${selected === e.id ? "ring-2 ring-clinical-500/50 rounded-2xl" : ""}`}
            >
              <EventCard event={e} />
            </div>
          ))}
        </div>

        {/* Side panel */}
        <div className="space-y-3">
          {detail ? (
            <>
              <EvidencePanel
                event={detail.event}
                onOpenSource={() => window.open(`/api/documents/${detail.event.sourceDocumentId}/file`, "_blank")}
              />
              {detail.relationships.map((rel) => <WhyThisPanel key={rel.id} edge={rel} />)}
            </>
          ) : (
            <div className="glass-sm p-5 text-center">
              <p className="text-2xl text-slate-700 mb-2">◇</p>
              <p className="text-sm text-slate-500">Select an event to see why it's here — document, page, exact quote.</p>
            </div>
          )}

          {(data?.gaps ?? []).map((g) => (
            <div key={g.id} className="rounded-xl border border-dashed border-amber-500/30 bg-amber-500/8 p-4">
              <p className="text-sm font-bold text-amber-300">{g.title}</p>
              <p className="text-xs text-amber-400/70 mt-1">{g.description}</p>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
