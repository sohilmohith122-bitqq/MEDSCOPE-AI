import { NextResponse } from "next/server";
import { getSession, patientIdFor } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { assertPatientResourceAccess } from "@/lib/rbac";
export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const url = new URL(req.url);
  let pid: string | null = url.searchParams.get("patientId");
  if (session.role === "PATIENT") pid = patientIdFor(session as never);
  if (!pid) return NextResponse.json({ error: "Missing patientId" }, { status: 400 });
  try { await assertPatientResourceAccess({ role: session.role, userId: session.id, patientProfileId: pid }); }
  catch { return NextResponse.json({ error: "Forbidden" }, { status: 403 }); }
  const docs = await prisma.document.findMany({ where: { patientId: pid }, orderBy: { uploadedAt: "desc" } });
  const counts: Record<string, number> = {};
  for (const d of docs) { counts[d.docType] = (counts[d.docType] ?? 0) + 1; counts[d.status] = (counts[d.status] ?? 0) + 1; }
  return NextResponse.json({ documents: docs.map((d: { storageKey: string; [k: string]: unknown }) => ({ ...d, storageKey: undefined })), summary: `${docs.length} documents uploaded — ` + Object.entries(counts).filter(([k]) => !["UPLOADED", "CLASSIFYING", "EXTRACTING", "PROCESSED", "FAILED"].includes(k)).map(([k, v]) => `${v} ${k}`).join(", "), counts });
}