export function EmptyState({ title, hint, action }: { title: string; hint?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/2 px-8 py-16 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/5 text-2xl text-slate-600">
        ◇
      </div>
      <p className="font-semibold text-slate-300">{title}</p>
      {hint && <p className="mt-1.5 text-sm text-slate-600 max-w-xs">{hint}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
