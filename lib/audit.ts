import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";
export async function audit(entry: { actorId?: string; actorRole?: string; action: string; targetType?: string; targetId?: string; accessType?: string; result?: string; meta?: Prisma.InputJsonValue }) {
  try {
    await prisma.auditLog.create({ data: { actorId: entry.actorId, actorRole: entry.actorRole, action: entry.action, targetType: entry.targetType, targetId: entry.targetId, accessType: entry.accessType, result: entry.result ?? "OK", meta: entry.meta ?? {} } });
  } catch { /* audit must never break the request */ }
}