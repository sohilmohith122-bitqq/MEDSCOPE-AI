import { NextResponse } from "next/server";
import { getSession, patientIdFor } from "@/lib/auth";
import { emergencyRequestSchema } from "@/lib/validation";
import { EmergencyService } from "@/services/EmergencyService";
import { audit } from "@/lib/audit";
export async function POST(req: Request) {
  const session = await getSession();
  if (!session || session.role !== "DOCTOR") return NextResponse.json({ error: "Doctors only" }, { status: 403 });
  const parsed = emergencyRequestSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Reason (min 10 chars) + OTP + explicit confirm required", details: parsed.error.flatten() }, { status: 400 });
  try {
    const s = await EmergencyService.request(parsed.data.patientId, session.id, parsed.data.reason, parsed.data.otp);
    const snapshot = await EmergencyService.snapshot(parsed.data.patientId);
    await audit({ actorId: session.id, actorRole: session.role, action: "EMERGENCY_ACCESS", targetType: "Patient", targetId: parsed.data.patientId, accessType: "BREAK_GLASS", meta: { reason: parsed.data.reason } });
    return NextResponse.json({ session: { id: s.id, expiresAt: s.expiresAt }, snapshot });
  } catch (e) {
    await audit({ actorId: session.id, actorRole: session.role, action: "EMERGENCY_ACCESS", targetType: "Patient", targetId: parsed.data.patientId, result: "DENIED" });
    return NextResponse.json({ error: e instanceof Error ? e.message : "Denied" }, { status: (e as { status?: number })?.status ?? 403 });
  }
}
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const pid = session.role === "PATIENT" ? patientIdFor(session as never) : null;
  void pid;
  return NextResponse.json({ otpMode: process.env.EMERGENCY_OTP_MODE ?? "simulated", hint: "Simulated OTP for hackathon demo: 123456" });
}