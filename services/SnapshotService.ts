import { prisma } from "@/lib/db";
type EvRow = { id: string; title: string; sourceDocumentId: string; sourcePage: number };
export const SnapshotService = {
  async capture(patientId: string, label: string) {
    const [conditions, meds, procedures, labs, hosp] = await Promise.all([
      prisma.clinicalEvent.findMany({ where: { patientId, eventType: "DIAGNOSIS" } }),
      prisma.clinicalEvent.findMany({ where: { patientId, eventType: "MEDICATION" } }),
      prisma.clinicalEvent.findMany({ where: { patientId, eventType: "PROCEDURE" } }),
      prisma.clinicalEvent.findMany({ where: { patientId, eventType: "LAB" } }),
      prisma.clinicalEvent.findMany({ where: { patientId, eventType: "HOSPITALIZATION" } }),
    ]);
    const data = {
      conditions: (conditions as EvRow[]).map((e) => ({ id: e.id, title: e.title, doc: e.sourceDocumentId, page: e.sourcePage })),
      medications: (meds as EvRow[]).map((e) => ({ id: e.id, title: e.title, doc: e.sourceDocumentId, page: e.sourcePage })),
      procedures: (procedures as EvRow[]).map((e) => ({ id: e.id, title: e.title })),
      labs: (labs as EvRow[]).map((e) => ({ id: e.id, title: e.title })),
      hospitalizations: (hosp as EvRow[]).map((e) => ({ id: e.id, title: e.title })),
    };
    return prisma.patientStateSnapshot.create({ data: { patientId, label, data } });
  },
  diff(prev: Record<string, { id: string; title: string }[]>, next: Record<string, { id: string; title: string }[]>) {
    const out: { section: string; added: string[]; removed: string[] }[] = [];
    for (const k of Object.keys(next)) {
      const a = new Set((prev[k] ?? []).map((x) => x.title));
      const b = new Set((next[k] ?? []).map((x) => x.title));
      out.push({ section: k, added: Array.from(b).filter((x) => !a.has(x)), removed: Array.from(a).filter((x) => !b.has(x)) });
    }
    return out;
  },
};