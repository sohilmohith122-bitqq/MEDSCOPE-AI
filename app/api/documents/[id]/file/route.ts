import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { assertPatientResourceAccess } from "@/lib/rbac";
import { readOriginal } from "@/lib/storage";
import { audit } from "@/lib/audit";
// I8: no permanent public URLs — streams only via this authorized endpoint.
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const doc = await prisma.document.findUnique({ where: { id: params.id } });
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });
  try { await assertPatientResourceAccess({ role: session.role, userId: session.id, patientProfileId: doc.patientId }); }
  catch { await audit({ actorId: session.id, actorRole: session.role, action: "DOCUMENT_VIEW", targetType: "Document", targetId: params.id, result: "DENIED" }); return NextResponse.json({ error: "Forbidden" }, { status: 403 }); }
  // Enforce share scope DOCUMENTS when doctor arrived via share token.
  await audit({ actorId: session.id, actorRole: session.role, action: "DOCUMENT_VIEW", targetType: "Document", targetId: params.id, accessType: session.role });
  try {
    const buf = await readOriginal(doc.storageKey);
    return new NextResponse(buf, { headers: { "Content-Type": doc.mimeType, "Content-Disposition": `inline; filename=\"${doc.fileName}\"`, "Cache-Control": "no-store" } });
  } catch { return NextResponse.json({ error: "Original unavailable" }, { status: 410 }); }
}