import { prisma } from "@/lib/db";
export const EmergencyService = {
  expectedOtp() { return process.env.EMERGENCY_OTP_MODE === "simulated" ? "123456" : process.env.EMERGENCY_OTP ?? "123456"; },
  async request(patientId: string, doctorUserId: string, reason: string, otp: string) {
    if (!reason || reason.length < 10) throw Object.assign(new Error("Reason required (min 10 chars)"), { status: 400 });
    if (otp !== EmergencyService.expectedOtp()) throw Object.assign(new Error("Invalid OTP"), { status: 403 });
    const doc = await prisma.doctorProfile.findUnique({ where: { userId: doctorUserId } });
    if (!doc) throw Object.assign(new Error("Forbidden"), { status: 403 });
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1h time-box
    return prisma.emergencyAccessSession.create({ data: { patientId, doctorId: doc.id, reason, otpVerified: true, expiresAt, resourcesAccessed: [] } });
  },
  async snapshot(patientId: string) {
    const [conds, meds, procs, hosp, labs] = await Promise.all([
      prisma.clinicalEvent.findMany({ where: { patientId, eventType: "DIAGNOSIS" }, take: 10 }),
      prisma.clinicalEvent.findMany({ where: { patientId, eventType: "MEDICATION" }, take: 10 }),
      prisma.clinicalEvent.findMany({ where: { patientId, eventType: "PROCEDURE" }, take: 10 }),
      prisma.clinicalEvent.findMany({ where: { patientId, eventType: "HOSPITALIZATION" }, take: 10 }),
      prisma.clinicalEvent.findMany({ where: { patientId, eventType: "LAB" }, take: 10 }),
    ]);
    return { conditions: conds, medications: meds, procedures: procs, hospitalizations: hosp, labs };
  },
};