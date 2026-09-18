import { NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import { prisma } from "@/lib/db";
import { sessionCookie } from "@/lib/auth";
import { audit } from "@/lib/audit";
const schema = z.object({ email: z.string().email(), password: z.string().min(1) });
export async function POST(req: Request) {
  const body = schema.safeParse(await req.json().catch(() => ({})));
  if (!body.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const hash = crypto.createHash("sha256").update(body.data.password).digest("hex");
  const user = await prisma.user.findUnique({ where: { email: body.data.email } });
  if (!user || user.passwordHash !== hash) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  await audit({ actorId: user.id, actorRole: user.role, action: "LOGIN", targetType: "User", targetId: user.id });
  const res = NextResponse.json({ id: user.id, role: user.role });
  res.headers.set("Set-Cookie", sessionCookie(user.id));
  return res;
}