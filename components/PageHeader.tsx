import { DISCLAIMER } from "@/lib/enums";
export function PageHeader({ title, subtitle, aiDerived }: { title: string; subtitle?: string; aiDerived?: boolean }) {
  return (
    <div className="mb-7">
      <h1 className="text-2xl font-black tracking-tight text-white md:text-3xl">{title}</h1>
      {subtitle && <p className="mt-1.5 text-sm text-slate-400 leading-relaxed max-w-2xl">{subtitle}</p>}
      {aiDerived && (
        <span className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-amber-500/25 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-400">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
          {DISCLAIMER}
        </span>
      )}
    </div>
  );
}
