import Link from "next/link";
import { resolveShareToken } from "@/lib/share-tokens";
export default async function ShareLanding({ params }: { params: { token: string } }) {
  const s = await resolveShareToken(params.token);
  if (!s) return <main className="mx-auto max-w-md px-4 py-16"><h1 className="text-xl font-black">Link expired, revoked, or invalid</h1><p className="text-sm text-slate-600">Ask the patient for a fresh CareShare link.</p></main>;
  return (
    <main className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-xl font-black">You&apos;ve been shared a medical journey</h1>
      <p className="mt-2 text-sm text-slate-600">Scopes: {(s.scopes as string[]).join(", ")} · {s.permission} · expires {s.expiresAt.toLocaleString()}</p>
      <div className="mt-4 flex gap-2"><Link href="/signin" className="rounded-lg bg-teal-700 px-4 py-2 font-bold text-white">Doctor sign in to view</Link></div>
      <p className="mt-4 text-xs text-slate-500">Doctors must authenticate. No permanent public URLs.</p>
    </main>
  );
}