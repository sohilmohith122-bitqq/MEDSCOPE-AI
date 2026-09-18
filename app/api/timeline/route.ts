import { NextResponse } from "next/server";
import { getSession, patientIdFor } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { assertPatientResourceAccess } from "@/lib/rbac";
export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const url = new URL(req.url);
  let pid = url.searchParams.get("patientId");
  if (session.role === "PATIENT") pid = patientIdFor(session as never);
  if (!pid) return NextResponse.json({ error: "Missing patientId" }, { status: 400 });
  try { await assertPatientResourceAccess({ role: session.role, userId: session.id, patientProfileId: pid }); }
  catch { return NextResponse.json({ error: "Forbidden" }, { status: 403 }); }
  const { TimelineService } = await import("@/services/TimelineService");
  const [events, episodes] = await Promise.all([TimelineService.getTimeline(pid), TimelineService.getEpisodes(pid)]);
  const relationships = await prisma.eventRelationship.findMany({ where: { patientId: pid } });
  return NextResponse.json({ events, episodes, relationships });
}