import { describe, it, expect } from "vitest";
import { aiExtractionSchema } from "@/lib/validation";
describe("AI output validation (P4: reject -> re-ask -> FAILED)", () => {
  it("rejects fabricated empty quotes", () => {
    const bad = { events: [{ event_type: "MEDICATION", title: "X", description: "", event_date: "2024-01-01", date_precision: "EXACT", evidence_status: "DOCUMENTED", confidence: 0.9, evidence_quote: "", source_page: 1, extracted_entities: {} }], document_type: "PRESCRIPTION" };
    expect(aiExtractionSchema.safeParse(bad).success).toBe(false);
  });
  it("accepts RELATIVE with null date", () => {
    const ok = { events: [{ event_type: "CONSULTATION", title: "Follow-up", description: "", event_date: null, date_precision: "RELATIVE", evidence_status: "UNCERTAIN", confidence: 0.6, evidence_quote: "Follow up two weeks after discharge.", source_page: 4, extracted_entities: {} }], document_type: "DISCHARGE_SUMMARY" };
    expect(aiExtractionSchema.safeParse(ok).success).toBe(true);
  });
});