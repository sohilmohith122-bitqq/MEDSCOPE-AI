import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
const SESSION_COOKIE = "medcare_session";
export async function getSession() {
  const jar = cookies();
  const userId = jar.get(SESSION_COOKIE)?.value;
  if (!userId) return null;
  const user = await prisma.user.findUnique({ where: { id: userId }, include: { patientProfile: true, doctorProfile: true } });
  return user;
}
export async function requireRole(roles: string[]) {
  const s = await getSession();
  if (!s || !roles.includes(s.role)) { const e = new Error("Forbidden"); (e as Error & { status?: number }).status = 403; throw e; }
  return s;
}
export function sessionCookie(userId: string) { return `${SESSION_COOKIE}=${userId}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400`; }
export function clearSessionCookie() { return `${SESSION_COOKIE}=; Path=/; HttpOnly; Max-Age=0`; }
export function patientIdFor(user: { id: string; role: string; patientProfile?: { id: string } | null }) {
  return user.role === "PATIENT" ? user.patientProfile?.id ?? user.id : null;
}