import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function Patients() {
  const s = await getSession();
  if (!s) redirect("/signin");
  if (s.role !== "DOCTOR") redirect("/patient/overview");
  const doc = await prisma.doctorProfile.findUnique({ where: { userId: s.id } });
  const links: { patientId: string }[] = doc ? await prisma.patientDoctor.findMany({ where: { doctorId: doc.id } }) : [];
  const patients: { id: string; fullName: string }[] = links.length
    ? await prisma.patientProfile.findMany({ where: { id: { in: links.map((l: { patientId: string }) => l.patientId) } } })
    : [];

  return (
    <AppShell role="DOCTOR">
      <PageHeader title="Patients" subtitle="Explicitly shared with you." />
      <div className="space-y-2">
        {patients.map((p) => (
          <div key={p.id} className="glass-sm flex items-center justify-between gap-4 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-clinical-500/15 border border-clinical-500/20 text-sm font-bold text-clinical-300">
                {p.fullName.charAt(0).toUpperCase()}
              </div>
              <span className="font-semibold text-slate-200">{p.fullName}</span>
            </div>
            <Link
              href={`/doctor/dashboard?patientId=${p.id}`}
              className="btn-primary text-xs px-4 py-2"
            >
              Open cockpit
            </Link>
          </div>
        ))}
        {patients.length === 0 && (
          <p className="text-sm text-slate-600 py-4">No patients yet — seed provides one demo patient.</p>
        )}
      </div>
    </AppShell>
  );
}
