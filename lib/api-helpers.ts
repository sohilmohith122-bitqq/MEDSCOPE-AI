import { NextResponse } from "next/server";
export function err(status: number, message: string) {
  return NextResponse.json({ error: message }, { status });
}
export function statusOf(e: unknown): number {
  return (e as { status?: number })?.status ?? 500;
}