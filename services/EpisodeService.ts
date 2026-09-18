import { prisma } from "@/lib/db";
type DatedRow = { id: string; eventType: string; eventDate: Date | null };
// Temporal clustering: group dated events within 30-day windows; undated stay ungrouped (never anchored).
export const EpisodeService = {
  async rebuild(patientId: string) {
    const events = (await prisma.clinicalEvent.findMany({ where: { patientId } })) as DatedRow[];
    const dated = events.filter((e) => e.eventDate).sort((a, b) => a.eventDate!.getTime() - b.eventDate!.getTime());
    const clusters: DatedRow[][] = [];
    let cur: DatedRow[] = [];
    for (const e of dated) {
      if (!cur.length) { cur = [e]; continue; }
      const gapDays = (e.eventDate!.getTime() - cur[cur.length - 1].eventDate!.getTime()) / 86400000;
      if (gapDays <= 30) cur.push(e); else { clusters.push(cur); cur = [e]; }
    }
    if (cur.length) clusters.push(cur);
    await prisma.clinicalEpisode.deleteMany({ where: { patientId } });
    for (let i = 0; i < clusters.length; i++) {
      const c = clusters[i];
      await prisma.clinicalEpisode.create({
        data: {
          patientId, title: `Episode ${i + 1}: ${c[0].eventType} — ${c[c.length - 1].eventType}`,
          summary: `${c.length} documented events from ${c[0].eventDate!.toISOString().slice(0, 10)} to ${c[c.length - 1].eventDate!.toISOString().slice(0, 10)}.`,
          startDate: c[0].eventDate, endDate: c[c.length - 1].eventDate, eventIds: c.map((e: DatedRow) => e.id),
        },
      });
      for (let j = 1; j < c.length; j++) {
        await prisma.eventRelationship.create({ data: { patientId, fromEventId: c[j - 1].id, toEventId: c[j].id, type: "FOLLOWED_BY", evidenceQuote: "Temporal adjacency within episode window (ordering only — not causation).", derivedRule: "episode-window-30d:DERIVED" } });
      }
    }
    return clusters.length;
  },
};