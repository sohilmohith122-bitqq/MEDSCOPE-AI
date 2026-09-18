export function MetricCard({ label, value, sub, accent }: { label: string; value: string | number; sub?: string; accent?: "default" | "warn" | "danger" }) {
  const accentClass = accent === "danger" ? "from-red-500/20 to-transparent border-red-500/20" : accent === "warn" ? "from-amber-500/20 to-transparent border-amber-500/20" : "from-clinical-500/15 to-transparent border-clinical-500/20";
  const valueClass = accent === "danger" ? "text-red-400" : accent === "warn" ? "text-amber-400" : "text-white";
  return (
    <div className={`glass-sm bg-gradient-to-br ${accentClass} p-5`}>
      <p className="section-title">{label}</p>
      <p className={`mt-2 text-3xl font-black tracking-tight ${valueClass}`}>{value}</p>
      {sub && <p className="mt-1 text-xs text-slate-500 line-clamp-2">{sub}</p>}
    </div>
  );
}
