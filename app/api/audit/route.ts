import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const rows = session.role === "DOCTOR"
    ? await prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 200 })
    : await prisma.auditLog.findMany({ where: { OR: [{ actorId: session.id }, { targetId: session.id }] }, orderBy: { createdAt: "desc" }, take: 200 });
  return NextResponse.json({ logs: rows });
}