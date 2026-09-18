import { prisma } from "@/lib/db";
import { mockProviders } from "@/ai/mockProvider";
import { aiExtractionSchema } from "@/lib/validation";
import { audit } from "@/lib/audit";
// Adapter: Next.js route handlers use this service; a FastAPI backend could sit behind the same interface.
export async function classifyDocument(fileName: string, textHint: string) {
  return mockProviders.classification.classify(fileName, textHint);
}
export async function extractDocumentText(storageKey: string): Promise<string> {
  const { readOriginal } = await import("@/lib/storage");
  try {
    const buf = await readOriginal(storageKey);
    const asText = buf.toString("utf-8").slice(0, 4000);
    return asText.includes("\uFFFD") ? `Binary original (${buf.length} bytes). OCR stub: no embedded text.` : asText;
  } catch { return "OCR stub: text unavailable."; }
}
export async function processDocument(documentId: string, actorId?: string) {
  const doc = await prisma.document.findUnique({ where: { id: documentId } });
  if (!doc) throw new Error("Document not found");
  await prisma.document.update({ where: { id: documentId }, data: { status: "CLASSIFYING" } });
  const text = await extractDocumentText(doc.storageKey);
  const { document_type } = await classifyDocument(doc.fileName, text);
  await prisma.document.update({ where: { id: documentId }, data: { status: "EXTRACTING", docType: document_type } });
  let raw: unknown;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      raw = await mockProviders.extraction.extract(documentId, doc.fileName, text);
      const parsed = aiExtractionSchema.safeParse(raw);
      if (!parsed.success) { if (attempt === 2) throw new Error("AI output failed validation: " + parsed.error.message); continue; }
      const { ExtractionService } = await import("@/services/ExtractionService");
      await ExtractionService.persist(documentId, doc.patientId, parsed.data);
      await prisma.document.update({ where: { id: documentId }, data: { status: "PROCESSED", docType: parsed.data.document_type, failureReason: null } });
      await audit({ actorId, action: "PROCESS_DOCUMENT", targetType: "Document", targetId: documentId, result: "OK" });
      return { ok: true as const };
    } catch (err) {
      if (attempt === 2) {
        await prisma.document.update({ where: { id: documentId }, data: { status: "FAILED", failureReason: err instanceof Error ? err.message : "processing failed" } });
        await audit({ actorId, action: "PROCESS_DOCUMENT", targetType: "Document", targetId: documentId, result: "FAILED" });
        return { ok: false as const, error: err instanceof Error ? err.message : "failed" };
      }
    }
  }
  return { ok: false as const, error: "unknown" };
}