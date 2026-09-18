"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const PATIENT_NAV = [
  ["/patient/overview", "Overview", "◈"],
  ["/patient/journey", "My Journey", "◈"],
  ["/patient/documents", "Documents", "◈"],
  ["/patient/ask", "History AI", "◈"],
  ["/patient/share", "Share", "◈"],
  ["/patient/access-history", "Access Log", "◈"],
];
const DOCTOR_NAV = [
  ["/doctor/dashboard", "Cockpit", "◈"],
  ["/doctor/patients", "Patients", "◈"],
  ["/doctor/shared", "Shared", "◈"],
  ["/doctor/emergency", "Emergency", "◈"],
  ["/doctor/audit", "Audit", "◈"],
];

const ROLE_COLORS: Record<string, string> = {
  PATIENT: "bg-clinical-500/20 text-clinical-300 border-clinical-500/30",
  DOCTOR: "bg-violet-500/20 text-violet-300 border-violet-500/30",
  PUBLIC: "bg-slate-500/20 text-slate-400 border-slate-500/30",
};

export function AppShell({ role, children }: { role: "PATIENT" | "DOCTOR" | "PUBLIC"; children: React.ReactNode }) {
  const path = usePathname();
  const nav = role === "PATIENT" ? PATIENT_NAV : role === "DOCTOR" ? DOCTOR_NAV : [];

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-white/6 bg-surface-900/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3.5">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-clinical-500/20 border border-clinical-500/30 group-hover:bg-clinical-500/30 transition-colors">
              <span className="text-clinical-400 text-xs font-black">M</span>
            </div>
            <span className="font-black tracking-tight text-white text-sm">MEDCARE</span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {nav.map(([href, label]) => (
              <Link
                key={href}
                href={href}
                className={`relative rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-150 ${
                  path === href
                    ? "bg-clinical-500/15 text-clinical-300"
                    : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                }`}
              >
                {label}
                {path === href && (
                  <span className="absolute bottom-0 left-1/2 h-px w-4 -translate-x-1/2 rounded-full bg-clinical-400" />
                )}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${ROLE_COLORS[role]}`}>
              {role}
            </span>
            <Link
              href="/api/auth/signout"
              className="text-xs text-slate-600 hover:text-slate-400 transition-colors"
            >
              Sign out
            </Link>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="mx-auto max-w-7xl px-5 py-7 pb-28 md:pb-10 animate-fade-in">
        {children}
      </main>

      {/* Mobile bottom nav */}
      {nav.length > 0 && (
        <nav
          className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/6 bg-surface-900/90 backdrop-blur-xl px-2 py-2 md:hidden"
          aria-label="Mobile navigation"
        >
          <div className="flex justify-around">
            {nav.slice(0, 5).map(([href, label]) => (
              <Link
                key={href}
                href={href}
                className={`flex flex-col items-center gap-0.5 rounded-xl px-2 py-1.5 text-[10px] font-semibold transition-all duration-150 ${
                  path === href
                    ? "bg-clinical-500/15 text-clinical-300"
                    : "text-slate-500 hover:text-slate-300"
                }`}
              >
                <span className="text-base leading-none">{path === href ? "◆" : "◇"}</span>
                {label}
              </Link>
            ))}
          </div>
        </nav>
      )}
    </div>
  );
}
