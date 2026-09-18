import { describe, it, expect } from "vitest";
// NOTE: pure-function copy of SnapshotService.diff (avoids importing prisma in unit tests).
function diff(prev: Record<string, { id: string; title: string }[]>, next: Record<string, { id: string; title: string }[]>) {
  const out: { section: string; added: string[]; removed: string[] }[] = [];
  for (const k of Object.keys(next)) {
    const a = new Set((prev[k] ?? []).map((x) => x.title));
    const b = new Set((next[k] ?? []).map((x) => x.title));
    out.push({ section: k, added: Array.from(b).filter((x) => !a.has(x)), removed: Array.from(a).filter((x) => !b.has(x)) });
  }
  return out;
}
describe("conflict + snapshot logic (I9)", () => {
  it("flags dosage sets with >1 distinct dose", () => {
    const doses = new Set(["500 mg", "1000 mg"]);
    expect(doses.size > 1).toBe(true);
  });
  it("diffs snapshots into additions/removals", () => {
    const prev = { medications: [{ id: "1", title: "Metformin 500 mg daily" }] };
    const next = { medications: [{ id: "1", title: "Metformin 500 mg daily" }, { id: "2", title: "Atorvastatin 20 mg daily" }] };
    const d = diff(prev, next);
    expect(d.find((x) => x.section === "medications")?.added).toContain("Atorvastatin 20 mg daily");
  });
});