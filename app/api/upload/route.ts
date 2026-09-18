import { NextResponse } from "next/server";
import crypto from "crypto";
import { getSession, patientIdFor } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { saveOriginal, sha256 } from "@/lib/storage";
import { audit } from "@/lib/audit";
const ALLOWED: Record<string, string> = { "application/pdf": "pdf", "image/jpeg": "jpg", "image/png": "png", "image/jpg": "jpg" };
export async function POST(req: Request) {
  const session = await getSession();
  if (!session || session.role !== "PATIENT") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const patientId = patientIdFor(session as never);
  if (!patientId) return NextResponse.json({ error: "No patient profile" }, { status: 400 });
  const form = await req.formData();
  const files = form.getAll("files").filter((f): f is File => f instanceof File);
  if (!files.length) return NextResponse.json({ error: "No files" }, { status: 400 });
  const results: { fileName: string; id?: string; status: string; note?: string }[] = [];
  for (const f of files) {
    if (!ALLOWED[f.type]) { results.push({ fileName: f.name, status: "REJECTED", note: "Unsupported type" }); continue; }
    if (f.size > 15 * 1024 * 1024) { results.push({ fileName: f.name, status: "REJECTED", note: "Too large" }); continue; }
    const bytes = Buffer.from(await f.arrayBuffer());
    const hash = sha256(bytes);
    const dup = await prisma.document.findFirst({ where: { patientId, sha256: hash } });
    if (dup) { results.push({ fileName: f.name, id: dup.id, status: "SKIPPED_DUPLICATE", note: "Exact duplicate detected by SHA-256 — skipped (I5 immutable originals preserved)." }); continue; }
    const key = `${crypto.randomUUID()}-${f.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    await saveOriginal(bytes, key);
    const doc = await prisma.document.create({ data: { patientId, fileName: f.name, mimeType: f.type, sizeBytes: f.size, storageKey: key, sha256: hash, status: "UPLOADED" } });
    await prisma.documentPage.create({ data: { documentId: doc.id, pageNumber: 1, textExcerpt: bytes.toString("utf-8").slice(0, 500) } });
    await audit({ actorId: session.id, actorRole: session.role, action: "DOCUMENT_UPLOAD", targetType: "Document", targetId: doc.id });
    // Fire-and-forget pipeline (adapter interface).
    const { processDocument } = await import("@/services/DocumentProcessingService");
    void processDocument(doc.id, session.id);
    results.push({ fileName: f.name, id: doc.id, status: "UPLOADED" });
  }
  const counts: Record<string, number> = {};
  const all = await prisma.document.findMany({ where: { patientId } });
  for (const d of all) counts[d.docType] = (counts[d.docType] ?? 0) + 1;
  return NextResponse.json({ results, summary: `${all.length} documents uploaded — ` + Object.entries(counts).map(([k, v]) => `${v} ${k}`).join(", ") });
}