import { EvidenceBadge } from "@/components/EvidenceBadge";

const TYPE_COLORS: Record<string, string> = {
  DIAGNOSIS: "text-red-400 bg-red-500/10 border-red-500/20",
  MEDICATION: "text-clinical-400 bg-clinical-500/10 border-clinical-500/20",
  LAB: "text-sky-400 bg-sky-500/10 border-sky-500/20",
  PROCEDURE: "text-violet-400 bg-violet-500/10 border-violet-500/20",
  HOSPITALIZATION: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  IMAGING: "text-pink-400 bg-pink-500/10 border-pink-500/20",
};

export function EventCard({ event }: {
  event: {
    id: string; title: string; eventType: string; eventDate: string | null;
    datePrecision: string; evidenceStatus: "DOCUMENTED" | "DERIVED" | "UNCERTAIN" | "CONFLICTING";
    sourcePage: number; evidenceQuote: string;
  };
}) {
  const fuzzy = ["APPROXIMATE", "RELATIVE", "UNKNOWN"].includes(event.datePrecision);
  const typeStyle = TYPE_COLORS[event.eventType] ?? "text-slate-400 bg-slate-500/10 border-slate-500/20";

  return (
    <div className={`glass-card p-4 cursor-pointer ${fuzzy ? "border-dashed" : ""}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`tag border text-xs ${typeStyle}`}>{event.eventType}</span>
          {fuzzy && (
            <span className="tag border border-amber-500/20 bg-amber-500/8 text-amber-400 text-xs">
              ~ {event.datePrecision}
            </span>
          )}
        </div>
        <EvidenceBadge status={event.evidenceStatus} />
      </div>
      <p className="mt-2.5 font-semibold text-slate-100 leading-snug">{event.title}</p>
      <p className="mt-1 text-xs text-slate-500">
        {event.eventDate
          ? new Date(event.eventDate).toLocaleDateString("en-US", { year: "numeric", month: "short", day: event.datePrecision === "EXACT" ? "numeric" : undefined })
          : event.datePrecision}
        {" · "}p.{event.sourcePage}
      </p>
      <p className="mt-2.5 line-clamp-2 text-sm italic text-slate-400 leading-relaxed">
        "{event.evidenceQuote}"
      </p>
    </div>
  );
}
