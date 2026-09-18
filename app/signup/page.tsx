"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
export default function SignUp() {
  const r = useRouter();
  const [form, setForm] = useState({ email: "", password: "", fullName: "", role: "PATIENT" });
  const [err, setErr] = useState("");
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/auth/signup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    if (!res.ok) { setErr("Sign up failed"); return; }
    const j = await res.json();
    r.push(j.role === "DOCTOR" ? "/doctor/dashboard" : "/patient/overview");
  }
  return (
    <main className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-2xl font-black">Create account</h1>
      <form onSubmit={submit} className="mt-6 space-y-3">
        <label className="block text-sm">Full name<input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} className="mt-1 w-full rounded-lg border p-2" /></label>
        <label className="block text-sm">Email<input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="mt-1 w-full rounded-lg border p-2" /></label>
        <label className="block text-sm">Password<input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="mt-1 w-full rounded-lg border p-2" /></label>
        <label className="block text-sm">Role<select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="mt-1 w-full rounded-lg border p-2"><option value="PATIENT">Patient</option><option value="DOCTOR">Doctor</option></select></label>
        {err && <p className="text-sm text-red-600">{err}</p>}
        <button className="w-full rounded-xl bg-clinical-600 py-2 font-bold text-white">Sign up</button>
      </form>
    </main>
  );
}