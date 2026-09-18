import { NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import { prisma } from "@/lib/db";
import { sessionCookie } from "@/lib/auth";
import { audit } from "@/lib/audit";
const schema = z.object({ email: z.string().email(), password: z.string().min(6), fullName: z.string().min(1), role: z.enum(["PATIENT", "DOCTOR"]) });
function hash(pw: string) { return crypto.createHash("sha256").update(pw).digest("hex"); }
export async function POST(req: Request) {
  const body = schema.safeParse(await req.json().catch(() => ({})));
  if (!body.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const { email, password, fullName, role } = body.data;
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return NextResponse.json({ error: "Email in use" }, { status: 409 });
  const user = await prisma.user.create({ data: { email, passwordHash: hash(password), role } });
  if (role === "PATIENT") await prisma.patientProfile.create({ data: { userId: user.id, fullName } });
  else await prisma.doctorProfile.create({ data: { userId: user.id, fullName } });
  await audit({ actorId: user.id, actorRole: role, action: "SIGNUP", targetType: "User", targetId: user.id });
  const res = NextResponse.json({ id: user.id, role });
  res.headers.set("Set-Cookie", sessionCookie(user.id));
  return res;
}