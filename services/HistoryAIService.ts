import { prisma } from "@/lib/db";
type EvLite = { sourceDocumentId: string; sourcePage: number; title: string; eventDate: Date | null; datePrecision: string; evidenceStatus: string; evidenceQuote: string };
import { mockProviders } from "@/ai/mockProvider";
// Grounded Q&A: retrieve events + evidence, refuse when insufficient, never diagnose.
export const HistoryAIService = {
  async ask(patientId: string, question: string) {
    const q = question.toLowerCase();
    let filter: string | undefined;
    if (q.includes("medication")) filter = "MEDICATION";
    else if (q.includes("conflict")) filter = undefined;
    else if (q.includes("hospital")) filter = "HOSPITALIZATION";
    else if (q.includes("uncertain") || q.includes("unknown") || q.includes("relative")) filter = undefined;
    else if (q.includes("lab")) filter = "LAB";
    else if (q.includes("chang")) filter = undefined;
    const events = (await prisma.clinicalEvent.findMany({ where: { patientId, ...(filter ? { eventType: filter } : {}) }, orderBy: { eventDate: "asc" }, take: 30 })) as EvLite[];
    if (q.includes("conflict")) {
      const conflicts = (await prisma.conflict.findMany({ where: { patientId } })) as { title: string }[];
      if (!conflicts.length) return { answer: "The available records do not establish any documented conflicts.", events: [], citations: [] as { document: string; page: number }[] };
      return { answer: conflicts.map((c) => c.title).join("\n"), events, citations: events.slice(0, 5).map((e) => ({ document: e.sourceDocumentId, page: e.sourcePage })) };
    }
    if (!events.length) return { answer: "The available records do not establish this.", events: [], citations: [] as { document: string; page: number }[] };
    if (/diagnos|treat|should i|dosage advice|recommend/.test(q)) {
      return { answer: "I can retrieve what the records document, but I cannot provide medical advice. Here is what the records show:", events: events.slice(0, 8), citations: events.slice(0, 8).map((e: EvLite) => ({ document: e.sourceDocumentId, page: e.sourcePage })) };
    }
    const context = events.map((e: EvLite) => `- ${e.title} (${e.eventDate ? e.eventDate.toISOString().slice(0, 10) : e.datePrecision}) [${e.evidenceStatus}] doc:${e.sourceDocumentId} p.${e.sourcePage}: ${e.evidenceQuote}`).join("\n");
    const gen = await mockProviders.chat.answer(question, context);
    return { answer: gen.text, events: events.slice(0, 10), citations: events.slice(0, 10).map((e: EvLite) => ({ document: e.sourceDocumentId, page: e.sourcePage })) };
  },
};