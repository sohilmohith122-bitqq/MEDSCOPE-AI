export function LoadingState({ label }: { label?: string }) {
  return (
    <div className="space-y-3" aria-busy="true" aria-label={label ?? "Loading"}>
      {[1, 2, 3].map((i) => (
        <div key={i} className="glass-sm overflow-hidden relative h-16 rounded-xl">
          <div className="absolute inset-0 shimmer-bg" />
        </div>
      ))}
    </div>
  );
}
