import { prisma } from "@/lib/db";
type MedRow = { id: string; title: string; extractedEntities: unknown };
export const ConflictService = {
  async detectMedicationDosageConflicts(patientId: string) {
    const meds = (await prisma.clinicalEvent.findMany({ where: { patientId, eventType: "MEDICATION" } })) as MedRow[];
    const byDrug = new Map<string, MedRow[]>();
    for (const m of meds) {
      const ent = m.extractedEntities as Record<string, unknown>;
      const drug = String(ent?.medication ?? m.title.split(" ")[0]).toLowerCase();
      if (!byDrug.has(drug)) byDrug.set(drug, []);
      byDrug.get(drug)!.push(m);
    }
    let found = 0;
    for (const entry of Array.from(byDrug.entries())) {
      const drug = entry[0]; const list = entry[1];
      const doses = new Set(list.map((m: MedRow) => String((m.extractedEntities as Record<string, unknown>)?.dose ?? "?")));
      if (doses.size > 1 && list.length > 1) {
        await prisma.conflict.create({ data: { patientId, kind: "MEDICATION_DOSAGE", title: `Potential discrepancy detected: ${drug} dosage differs across records`, description: `Dosages observed: ${Array.from(doses).join(" vs ")}. Clinical verification required — never auto-resolved.`, eventIds: list.map((m: MedRow) => m.id), status: "OPEN" } });
        for (const m of list) await prisma.clinicalEvent.update({ where: { id: m.id }, data: { evidenceStatus: "CONFLICTING" } });
        found++;
      }
    }
    return found;
  },
  async detectGaps(patientId: string) {
    // Gap heuristic: two strongly related dated events > 90 days apart with no events between -> potential gap.
    const events = (await prisma.clinicalEvent.findMany({ where: { patientId }, orderBy: { eventDate: "asc" } })) as { id: string; title: string; eventDate: Date | null }[];
    const dated = events.filter((e) => e.eventDate);
    await prisma.timelineGap.deleteMany({ where: { patientId } });
    let gaps = 0;
    for (let i = 0; i + 1 < dated.length; i++) {
      const a = dated[i]; const b = dated[i + 1];
      const days = (b.eventDate!.getTime() - a.eventDate!.getTime()) / 86400000;
      if (days > 90) {
        await prisma.timelineGap.create({ data: { patientId, title: "Potential undocumented event or missing record", description: `Gap of ${Math.round(days)} days between "${a.title}" and "${b.title}". Clinical verification required.`, afterEventId: a.id, beforeEventId: b.id } });
        gaps++;
      }
    }
    return gaps;
  },
};