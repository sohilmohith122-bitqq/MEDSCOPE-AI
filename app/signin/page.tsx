"use client";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function SignInForm() {
  const r = useRouter();
  const params = useSearchParams();
  const demo = params.get("demo");
  const [email, setEmail] = useState(demo === "doctor" ? "doctor@demo.medcare" : "patient@demo.medcare");
  const [password, setPassword] = useState("demo1234");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) { setErr("Invalid credentials"); return; }
      const j = await res.json();
      r.push(j.role === "DOCTOR" ? "/doctor/dashboard" : "/patient/overview");
    } finally { setLoading(false); }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center px-4">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-1/3 left-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-clinical-500/8 blur-[100px]" />
      </div>

      <div className="relative w-full max-w-sm animate-slide-up">
        <Link href="/" className="mb-8 flex items-center gap-2 justify-center group">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-clinical-500/20 border border-clinical-500/30">
            <span className="text-clinical-400 font-black text-sm">M</span>
          </div>
          <span className="font-black tracking-tight text-white">MEDCARE</span>
        </Link>

        <div className="glass p-7">
          <h1 className="text-xl font-black text-white">Sign in</h1>
          <p className="mt-1 text-sm text-slate-500">Access your medical journey</p>

          <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <label className="label">Email</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                type="email"
                autoComplete="email"
              />
            </div>
            <div>
              <label className="label">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input"
                autoComplete="current-password"
              />
            </div>
            {err && (
              <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-400">
                {err}
              </p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center py-3 disabled:opacity-50"
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <div className="mt-5 border-t border-white/6 pt-4">
            <p className="text-xs text-slate-600 mb-2">Quick demo access:</p>
            <div className="flex gap-2">
              <button
                onClick={() => { setEmail("patient@demo.medcare"); setPassword("demo1234"); }}
                className="flex-1 rounded-lg border border-white/8 bg-white/4 py-1.5 text-xs font-medium text-slate-400 hover:bg-white/8 transition-colors"
              >
                Patient
              </button>
              <button
                onClick={() => { setEmail("doctor@demo.medcare"); setPassword("demo1234"); }}
                className="flex-1 rounded-lg border border-white/8 bg-white/4 py-1.5 text-xs font-medium text-slate-400 hover:bg-white/8 transition-colors"
              >
                Doctor
              </button>
            </div>
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-slate-700">
          No account?{" "}
          <Link href="/signup" className="text-clinical-400 hover:text-clinical-300 transition-colors">
            Sign up
          </Link>
        </p>
      </div>
    </main>
  );
}

export default function SignIn() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center px-4">
          <span className="text-sm text-slate-500">Loading…</span>
        </main>
      }
    >
      <SignInForm />
    </Suspense>
  );
}
