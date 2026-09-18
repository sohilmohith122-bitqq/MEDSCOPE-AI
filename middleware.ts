import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
// Route guards: patient routes need session; doctor routes need session.
// Deep object-level checks live in lib/rbac + API handlers (IDOR-safe).
export function middleware(req: NextRequest) {
  const session = req.cookies.get("medcare_session")?.value;
  const { pathname } = req.nextUrl;
  const guarded = pathname.startsWith("/patient") || pathname.startsWith("/doctor");
  if (guarded && !session) {
    const url = req.nextUrl.clone();
    url.pathname = "/signin";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}
export const config = { matcher: ["/patient/:path*", "/doctor/:path*"] };