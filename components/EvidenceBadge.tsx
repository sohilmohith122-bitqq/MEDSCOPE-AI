import { EvidenceStatus } from "@/lib/enums";
const STYLES: Record<EvidenceStatus, { bg: string; dot: string; text: string }> = {
  DOCUMENTED: { bg: "bg-emerald-500/15 border-emerald-500/30", dot: "bg-emerald-400", text: "text-emerald-300" },
  DERIVED:    { bg: "bg-sky-500/15 border-sky-500/30",         dot: "bg-sky-400",     text: "text-sky-300" },
  UNCERTAIN:  { bg: "bg-amber-500/15 border-amber-500/30",     dot: "bg-amber-400",   text: "text-amber-300" },
  CONFLICTING:{ bg: "bg-red-500/15 border-red-500/30",         dot: "bg-red-400",     text: "text-red-300" },
};
export function EvidenceBadge({ status }: { status: EvidenceStatus }) {
  const s = STYLES[status];
  return (
    <span className={`tag border ${s.bg} ${s.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {status}
    </span>
  );
}
