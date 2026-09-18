import { EvidenceBadge } from "@/components/EvidenceBadge";
import { DISCLAIMER } from "@/lib/enums";

export function EvidencePanel({
  event,
  onOpenSource,
}: {
  event: {
    title: string;
    evidenceStatus: "DOCUMENTED" | "DERIVED" | "UNCERTAIN" | "CONFLICTING";
    sourceDocumentId: string;
    sourcePage: number;
    evidenceQuote: string;
    confidence: number;
  };
  onOpenSource?: () => void;
}) {
  return (
    <div className="glass p-5 animate-slide-up">
      <p className="section-title mb-3">Why is this here?</p>
      <p className="font-semibold text-slate-100 leading-snug">{event.title}</p>
      <div className="mt-3 flex items-center gap-3">
        <EvidenceBadge status={event.evidenceStatus} />
        <span className="text-xs text-slate-500">
          confidence{" "}
          <span className="font-mono text-slate-300">{event.confidence}</span>
        </span>
      </div>
      <p className="mt-4 section-title">Exact extracted evidence</p>
      <blockquote className="evidence-quote mt-2">"{event.evidenceQuote}"</blockquote>
      <p className="mt-2 font-mono text-xs text-slate-600">
        doc {event.sourceDocumentId.slice(0, 8)}… · p.{event.sourcePage}
      </p>
      {onOpenSource && (
        <button onClick={onOpenSource} className="btn-ghost mt-4 text-xs px-3 py-1.5">
          Open Source Document ↗
        </button>
      )}
      <p className="mt-4 text-[11px] italic text-slate-600">{DISCLAIMER}</p>
    </div>
  );
}
