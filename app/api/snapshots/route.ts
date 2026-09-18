import { NextResponse } from "next/server";
import { getSession, patientIdFor } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { assertPatientResourceAccess } from "@/lib/rbac";
import { SnapshotService } from "@/services/SnapshotService";
export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const url = new URL(req.url);
  let pid = url.searchParams.get("patientId");
  if (session.role === "PATIENT") pid = patientIdFor(session as never);
  if (!pid) return NextResponse.json({ error: "Missing patientId" }, { status: 400 });
  try { await assertPatientResourceAccess({ role: session.role, userId: session.id, patientProfileId: pid }); }
  catch { return NextResponse.json({ error: "Forbidden" }, { status: 403 }); }
  const snaps = await prisma.patientStateSnapshot.findMany({ where: { patientId: pid }, orderBy: { createdAt: "asc" }, take: 20 });
  let diff: unknown = null;
  if (snaps.length >= 2) {
    const a = snaps[snaps.length - 2].data as Record<string, { id: string; title: string }[]>;
    const b = snaps[snaps.length - 1].data as Record<string, { id: string; title: string }[]>;
    diff = SnapshotService.diff(a, b);
  }
  return NextResponse.json({ snapshots: snaps, whatChanged: diff });
}