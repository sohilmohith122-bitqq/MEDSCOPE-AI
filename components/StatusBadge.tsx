const MAP: Record<string, { bg: string; text: string; dot: string }> = {
  PROCESSED:   { bg: "bg-emerald-500/15 border-emerald-500/30", text: "text-emerald-300", dot: "bg-emerald-400" },
  FAILED:      { bg: "bg-red-500/15 border-red-500/30",         text: "text-red-300",     dot: "bg-red-400" },
  UPLOADED:    { bg: "bg-slate-500/15 border-slate-500/30",     text: "text-slate-400",   dot: "bg-slate-400" },
  CLASSIFYING: { bg: "bg-sky-500/15 border-sky-500/30",         text: "text-sky-300",     dot: "bg-sky-400 animate-pulse" },
  EXTRACTING:  { bg: "bg-violet-500/15 border-violet-500/30",   text: "text-violet-300",  dot: "bg-violet-400 animate-pulse" },
};
export function StatusBadge({ status }: { status: string }) {
  const s = MAP[status] ?? { bg: "bg-slate-500/15 border-slate-500/30", text: "text-slate-400", dot: "bg-slate-400" };
  return (
    <span className={`tag border ${s.bg} ${s.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {status}
    </span>
  );
}
