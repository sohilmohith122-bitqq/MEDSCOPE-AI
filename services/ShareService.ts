import crypto from "crypto";
import { prisma } from "@/lib/db";
import { signToken } from "@/lib/storage";
function expiryFor(expiresIn: string, custom?: string) {
  if (expiresIn === "custom" && custom) return new Date(custom);
  const ms = expiresIn === "1h" ? 3600000 : expiresIn === "7d" ? 7 * 86400000 : 86400000;
  return new Date(Date.now() + ms);
}
export const ShareService = {
  async create(patientId: string, input: { scopes: string[]; permission: string; expiresIn: string; expiresAt?: string; documentIds: string[]; doctorId?: string }) {
    const raw = crypto.randomBytes(24).toString("hex");
    const tokenHash = signToken(raw);
    const row = await prisma.shareSession.create({
      data: { patientId, doctorId: input.doctorId, tokenHash, scopes: input.scopes, permission: input.permission, documentIds: input.documentIds ?? [], expiresAt: expiryFor(input.expiresIn, input.expiresAt), revoked: false },
    });
    return { token: raw, session: row };
  },
  async validate(raw: string) {
    const tokenHash = signToken(raw);
    const s = await prisma.shareSession.findUnique({ where: { tokenHash } });
    if (!s || s.revoked || s.expiresAt < new Date()) return null;
    return s;
  },
  /**
   * Revoke a share link.
   * - Scoped to the owning patient when `patientId` is supplied, so a caller can
   *   never revoke somebody else's link (IDOR) and foreign ids stay indistinguishable
   *   from unknown ones.
   * - `updateMany` instead of `update`: an unknown id is a no-op returning false
   *   rather than a thrown P2025 that would surface as a 500.
   * Returns true when a matching share was marked revoked (idempotent).
   */
  async revoke(id: string, patientId?: string) {
    const { count } = await prisma.shareSession.updateMany({
      where: { id, ...(patientId ? { patientId } : {}) },
      data: { revoked: true },
    });
    return count > 0;
  },
};