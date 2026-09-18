import { PrismaClient } from "@prisma/client";
const g = globalThis as unknown as { prisma?: PrismaClient };
function makeClient() {
  try {
    return new PrismaClient();
  } catch {
    // Build-time fallback: @prisma/client not yet generated (e.g. `next build` before `prisma generate`).
    // Return a Proxy that throws only if actually used at runtime.
    return new Proxy({}, { get() { throw new Error("@prisma/client did not initialize yet. Please run prisma generate."); } }) as unknown as PrismaClient;
  }
}
export const prisma = g.prisma ?? makeClient();
if (process.env.NODE_ENV !== "production") g.prisma = prisma;
export default prisma;