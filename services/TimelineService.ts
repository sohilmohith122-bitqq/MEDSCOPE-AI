import { prisma } from "@/lib/db";
const PRECISION_RANK: Record<string, number> = { EXACT: 0, MONTH: 1, YEAR: 2, APPROXIMATE: 3, RELATIVE: 4, UNKNOWN: 5 };
export const TimelineService = {
  rank(p: string) { return PRECISION_RANK[p] ?? 9; },
  async getTimeline(patientId: string, filter?: string) {
    const events = await prisma.clinicalEvent.findMany({ where: { patientId, ...(filter && filter !== "All" ? { eventType: filter.toUpperCase().replace(/S$/, "") } : {}) }, orderBy: [{ eventDate: "asc" }, { createdAt: "asc" }] });
    // Precision-aware: nulls (RELATIVE/UNKNOWN/APPROXIMATE without anchor) sort last, rendered as fuzzy bands.
    const withNullsLast = [...events].sort((a, b) => {
      if (!a.eventDate && !b.eventDate) return TimelineService.rank(a.datePrecision) - TimelineService.rank(b.datePrecision);
      if (!a.eventDate) return 1; if (!b.eventDate) return -1;
      return a.eventDate.getTime() - b.eventDate.getTime();
    });
    return withNullsLast;
  },
  async getEpisodes(patientId: string) {
    return prisma.clinicalEpisode.findMany({ where: { patientId }, orderBy: { createdAt: "asc" } });
  },
};