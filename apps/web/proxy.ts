// ── proxy.ts ──
// Auth guard for dashboard routes per context/16_DASHBOARD_PAGES.md spec
// Migrated from middleware.ts (Next.js 16+ uses proxy instead of middleware)

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const token = request.cookies.get("laporin_token")?.value;
  const path = request.nextUrl.pathname;

  const isGov = path.startsWith("/gov");
  const isCitizen = path.startsWith("/citizen");
  const isAuth = path.startsWith("/login") || path.startsWith("/register");

  // Protected routes: redirect to login if no token
  if ((isGov || isCitizen) && !token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Auth pages: redirect logged-in users to their dashboard
  if (isAuth && token) {
    const role = request.cookies.get("laporin_role")?.value;
    const destination = role === "citizen" ? "/citizen" : "/gov";
    return NextResponse.redirect(new URL(destination, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/gov/:path*", "/citizen/:path*", "/login", "/register"],
};
