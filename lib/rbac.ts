import { prisma } from "@/lib/db";
export async function canDoctorAccessPatient(doctorUserId: string, patientProfileId: string): Promise<boolean> {
  const doc = await prisma.doctorProfile.findUnique({ where: { userId: doctorUserId } });
  if (!doc) return false;
  const link = await prisma.patientDoctor.findUnique({ where: { patientId_doctorId: { patientId: patientProfileId, doctorId: doc.id } } });
  if (link) return true;
  const share = await prisma.shareSession.findFirst({ where: { patientId: patientProfileId, doctorId: doc.id, revoked: false, expiresAt: { gt: new Date() } } });
  return !!share;
}
export async function assertPatientResourceAccess(opts: { role: string; userId: string; patientProfileId: string; patientUserId?: string }) {
  if (opts.role === "PATIENT") {
    const own = await prisma.patientProfile.findUnique({ where: { userId: opts.userId } });
    if (!own || own.id !== opts.patientProfileId) { const e = new Error("Forbidden"); (e as Error & { status?: number }).status = 403; throw e; }
    return;
  }
  const ok = await canDoctorAccessPatient(opts.userId, opts.patientProfileId);
  if (!ok) { const e = new Error("Forbidden"); (e as Error & { status?: number }).status = 403; throw e; }
}