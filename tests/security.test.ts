import { describe, it, expect } from "vitest";
import { emergencyRequestSchema, shareCreateSchema, uploadMetaSchema } from "@/lib/validation";
describe("security + validation gates (P10)", () => {
  it("rejects emergency without reason/confirm", () => {
    expect(emergencyRequestSchema.safeParse({ patientId: "p", reason: "short", otp: "1", confirm: false }).success).toBe(false);
  });
  it("rejects empty share scopes", () => {
    expect(shareCreateSchema.safeParse({ scopes: [], permission: "VIEW_ONLY", expiresIn: "24h", documentIds: [] }).success).toBe(false);
  });
  it("rejects oversized uploads", () => {
    expect(uploadMetaSchema.safeParse({ fileName: "x.pdf", mimeType: "application/pdf", sizeBytes: 99 * 1024 * 1024 }).success).toBe(false);
  });
  it("rejects bad mime", () => {
    expect(uploadMetaSchema.safeParse({ fileName: "x.exe", mimeType: "application/x-msdownload", sizeBytes: 10 }).success).toBe(false);
  });
});