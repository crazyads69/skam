import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { ADMIN_TOKEN_COOKIE } from "@/lib/admin-auth";

export function proxy(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;
  if (!pathname.startsWith("/admin")) return NextResponse.next();
  if (pathname === "/admin/login") return NextResponse.next();
  if (pathname.startsWith("/api/")) return NextResponse.next();
  const token = request.cookies.get(ADMIN_TOKEN_COOKIE)?.value;
  if (token) return NextResponse.next();
  const redirectUrl = new URL("/admin/login", request.url);
  return NextResponse.redirect(redirectUrl);
}

export const config = {
  matcher: ["/admin/:path*"],
};
