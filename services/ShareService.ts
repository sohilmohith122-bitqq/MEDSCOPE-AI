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
  async revoke(id: string) { return prisma.shareSession.update({ where: { id }, data: { revoked: true } }); },
};