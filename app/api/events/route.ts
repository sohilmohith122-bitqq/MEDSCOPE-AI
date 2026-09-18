import { NextResponse } from "next/server";
import { getSession, patientIdFor } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { assertPatientResourceAccess } from "@/lib/rbac";
import { audit } from "@/lib/audit";
export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  const patientId = url.searchParams.get("patientId");
  const filter = url.searchParams.get("filter") ?? undefined;
  if (id) {
    const ev = await prisma.clinicalEvent.findUnique({ where: { id }, include: { evidence: true } });
    if (!ev) return NextResponse.json({ error: "Not found" }, { status: 404 });
    try { await assertPatientResourceAccess({ role: session.role, userId: session.id, patientProfileId: ev.patientId }); }
    catch { return NextResponse.json({ error: "Forbidden" }, { status: 403 }); }
    const rels = await prisma.eventRelationship.findMany({ where: { patientId: ev.patientId, OR: [{ fromEventId: id }, { toEventId: id }] } });
    await audit({ actorId: session.id, actorRole: session.role, action: "TIMELINE_VIEW", targetType: "ClinicalEvent", targetId: id, accessType: session.role });
    return NextResponse.json({ event: ev, relationships: rels });
  }
  // Timeline list: patient scope (own) or doctor explicit scope.
  let pid = patientId;
  if (session.role === "PATIENT") pid = patientIdFor(session as never);
  if (!pid) return NextResponse.json({ error: "Missing patientId" }, { status: 400 });
  try { await assertPatientResourceAccess({ role: session.role, userId: session.id, patientProfileId: pid }); }
  catch { return NextResponse.json({ error: "Forbidden" }, { status: 403 }); }
  const { TimelineService } = await import("@/services/TimelineService");
  const events = await TimelineService.getTimeline(pid, filter);
  const episodes = await TimelineService.getEpisodes(pid);
  const conflicts = await prisma.conflict.findMany({ where: { patientId: pid } });
  const gaps = await prisma.timelineGap.findMany({ where: { patientId: pid } });
  await audit({ actorId: session.id, actorRole: session.role, action: "TIMELINE_VIEW", targetType: "Patient", targetId: pid, accessType: session.role });
  return NextResponse.json({ events, episodes, conflicts, gaps });
}