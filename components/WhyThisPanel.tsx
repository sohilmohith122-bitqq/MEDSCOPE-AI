export function WhyThisPanel({ edge }: { edge: { type: string; evidenceQuote: string; derivedRule?: string | null } }) {
  return (
    <div className="glass-sm p-4 animate-slide-up">
      <p className="section-title mb-2">{edge.type}</p>
      <p className="text-sm italic text-slate-400">"{edge.evidenceQuote}"</p>
      {edge.derivedRule && (
        <p className="mt-2 text-xs text-slate-600">
          Rule: {edge.derivedRule}{" "}
          <span className="text-amber-500/70">(DERIVED — adjacency is not causation)</span>
        </p>
      )}
    </div>
  );
}
