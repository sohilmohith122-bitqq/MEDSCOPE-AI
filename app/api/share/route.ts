import { NextResponse } from "next/server";
import { getSession, patientIdFor } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { shareCreateSchema } from "@/lib/validation";
import { ShareService } from "@/services/ShareService";
import { audit } from "@/lib/audit";
export async function POST(req: Request) {
  const session = await getSession();
  if (!session || session.role !== "PATIENT") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const parsed = shareCreateSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Invalid share request", details: parsed.error.flatten() }, { status: 400 });
  const patientId = patientIdFor(session as never);
  if (!patientId) return NextResponse.json({ error: "No patient profile" }, { status: 400 });
  const { token, session: s } = await ShareService.create(patientId, parsed.data);
  await audit({ actorId: session.id, actorRole: session.role, action: "SHARE", targetType: "ShareSession", targetId: s.id, meta: { scopes: parsed.data.scopes } });
  const appUrl = process.env.APP_URL ?? "http://localhost:3000";
  return NextResponse.json({ token, shareUrl: `${appUrl}/share/${token}`, expiresAt: s.expiresAt, id: s.id });
}
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const patientId = session.role === "PATIENT" ? patientIdFor(session as never) : null;
  const rows = patientId
    ? await prisma.shareSession.findMany({ where: { patientId }, orderBy: { createdAt: "desc" } })
    : await prisma.shareSession.findMany({ orderBy: { createdAt: "desc" }, take: 50 });
  return NextResponse.json({ shares: rows.map((r: { tokenHash: string; [k: string]: unknown }) => ({ ...r, tokenHash: undefined })) });
}
export async function DELETE(req: Request) {
  const session = await getSession();
  if (!session || session.role !== "PATIENT") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  const patientId = patientIdFor(session as never);
  if (!patientId) return NextResponse.json({ error: "No patient profile" }, { status: 400 });
  // Scoped revoke: only the owning patient can revoke, unknown/foreign ids -> 404 (never 500).
  const revoked = await ShareService.revoke(id, patientId);
  if (!revoked) return NextResponse.json({ error: "Share not found" }, { status: 404 });
  await audit({ actorId: session.id, actorRole: session.role, action: "REVOKE", targetType: "ShareSession", targetId: id });
  return NextResponse.json({ ok: true });
}