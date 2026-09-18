import { prisma } from "@/lib/db";
import { AIExtraction } from "@/lib/validation";
function toDate(s: string | null | undefined): Date | null {
  if (!s) return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d; // never fabricate: invalid -> null (UNKNOWN handled by caller precision)
}
export const ExtractionService = {
  async persist(documentId: string, patientId: string, data: AIExtraction) {
    const created: string[] = [];
    const titleToId = new Map<string, string>();
    for (const e of data.events) {
      const row = await prisma.clinicalEvent.create({
        data: {
          patientId, eventType: e.event_type, title: e.title, description: e.description ?? "",
          eventDate: toDate(e.event_date), eventDateStart: toDate(e.event_date_start), eventDateEnd: toDate(e.event_date_end),
          datePrecision: e.date_precision, sourceDocumentId: documentId, sourcePage: e.source_page,
          evidenceStatus: e.evidence_status, confidence: e.confidence, evidenceQuote: e.evidence_quote,
          extractedEntities: (e.extracted_entities ?? {}) as object, metadata: {},
        },
      });
      await prisma.evidenceItem.create({ data: { eventId: row.id, documentId, page: e.source_page, quote: e.evidence_quote } });
      created.push(row.id); titleToId.set(e.title, row.id);
    }
    for (const r of data.relationships) {
      const from = titleToId.get(r.from_title); const to = titleToId.get(r.to_title);
      if (!from || !to) continue; // never invent links across unknown events
      await prisma.eventRelationship.create({ data: { patientId, fromEventId: from, toEventId: to, type: r.type, evidenceQuote: r.evidence_quote, sourceDocumentId: documentId, derivedRule: r.derived_rule } });
    }
    // Re-run conflict + gap + snapshot detectors incrementally.
    const { ConflictService } = await import("@/services/ConflictService");
    await ConflictService.detectMedicationDosageConflicts(patientId);
    await ConflictService.detectGaps(patientId);
    const { SnapshotService } = await import("@/services/SnapshotService");
    await SnapshotService.capture(patientId, `auto:${documentId.slice(0, 6)}`);
    return created;
  },
};