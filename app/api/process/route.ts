import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { documentId } = z.object({ documentId: z.string() }).parse(await req.json().catch(() => ({})));
  const doc = await prisma.document.findUnique({ where: { id: documentId } });
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (session.role === "PATIENT") {
    const own = await prisma.patientProfile.findUnique({ where: { userId: session.id } });
    if (!own || own.id !== doc.patientId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { processDocument } = await import("@/services/DocumentProcessingService");
  const out = await processDocument(documentId, session.id);
  if ((out as { ok: boolean }).ok) return NextResponse.json({ ok: true });
  return NextResponse.json({ ok: false, error: (out as { error?: string }).error }, { status: 422 });
}
export async function GET(req: Request) {
  // Retry endpoint for FAILED docs: /api/process?retry=documentId
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = new URL(req.url).searchParams.get("retry");
  if (!id) return NextResponse.json({ error: "Missing retry id" }, { status: 400 });
  const { processDocument } = await import("@/services/DocumentProcessingService");
  const out = await processDocument(id, session.id);
  return NextResponse.json(out);
}