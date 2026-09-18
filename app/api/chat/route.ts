import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession, patientIdFor } from "@/lib/auth";
import { assertPatientResourceAccess } from "@/lib/rbac";
import { HistoryAIService } from "@/services/HistoryAIService";
export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { question, patientId } = z.object({ question: z.string().min(2).max(500), patientId: z.string().optional() }).parse(await req.json().catch(() => ({})));
  let pid: string | undefined = patientId ?? undefined;
  if (session.role === "PATIENT") pid = patientIdFor(session as never) ?? undefined;
  if (!pid) return NextResponse.json({ error: "Missing patientId" }, { status: 400 });
  try { await assertPatientResourceAccess({ role: session.role, userId: session.id, patientProfileId: pid }); }
  catch { return NextResponse.json({ error: "Forbidden" }, { status: 403 }); }
  const out = await HistoryAIService.ask(pid, question);
  return NextResponse.json(out);
}