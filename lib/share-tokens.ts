import { prisma } from "@/lib/db";
import { signToken } from "@/lib/storage";
export async function resolveShareToken(raw: string | null) {
  if (!raw) return null;
  const tokenHash = signToken(raw);
  const s = await prisma.shareSession.findUnique({ where: { tokenHash } });
  if (!s || s.revoked || s.expiresAt < new Date()) return null;
  return s;
}