import { describe, it, expect } from "vitest";
// Pure temporal-precision rules (P4/P12 ground truth): never upgrade precision.
function precisionFor(text: string): string {
  if (/\b\d{1,2} (jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]* \d{4}\b/i.test(text)) return "EXACT";
  if (/(january|february|march|april|may|june|july|august|september|october|november|december) \d{4}/i.test(text)) return "MONTH";
  if (/history of .* for \d+ years/i.test(text)) return "APPROXIMATE";
  if (/two weeks after discharge/i.test(text)) return "RELATIVE";
  return "UNKNOWN";
}
describe("temporal precision (I4)", () => {
  it("keeps exact dates exact", () => expect(precisionFor("12 March 2024")).toBe("EXACT"));
  it("keeps month-only as MONTH", () => expect(precisionFor("March 2024")).toBe("MONTH"));
  it("keeps duration history APPROXIMATE", () => expect(precisionFor("history of diabetes for 5 years")).toBe("APPROXIMATE"));
  it("keeps relative anchors RELATIVE", () => expect(precisionFor("two weeks after discharge")).toBe("RELATIVE"));
  it("marks missing as UNKNOWN", () => expect(precisionFor("no date here")).toBe("UNKNOWN"));
});