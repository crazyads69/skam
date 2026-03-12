import { NextResponse } from "next/server";
import { exchangeAdminCode, getAdminMe } from "@/lib/api";
import { ADMIN_TOKEN_COOKIE, getAdminTokenFromCookie } from "@/lib/admin-auth";
import { apiUrl } from "@/lib/api";

const MIN_TOKEN_LENGTH = 32;
const MAX_TOKEN_LENGTH = 4_096;
const JWT_SEGMENT_COUNT = 3;
const SESSION_MAX_AGE_SECONDS = 4 * 60 * 60; // 4 hours

interface SessionBody {
  token?: string;
  code?: string;
}

function isValidTokenShape(token: string): boolean {
  if (token.length < MIN_TOKEN_LENGTH || token.length > MAX_TOKEN_LENGTH)
    return false;
  return token.split(".").length === JWT_SEGMENT_COUNT;
}

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json().catch(() => null)) as SessionBody | null;
  const tokenInput: string = String(body?.token ?? "").trim();
  const codeInput: string = String(body?.code ?? "").trim();
  let token: string = tokenInput;
  if (!token && codeInput) {
    const exchanged = await exchangeAdminCode(codeInput).catch(() => null);
    token = exchanged?.data?.token ?? "";
  }
  if (!token || !isValidTokenShape(token)) {
    return NextResponse.json(
      { success: false, error: "Token không hợp lệ" },
      { status: 400 },
    );
  }
  const me = await getAdminMe(token).catch(() => null);
  if (!me?.success) {
    return NextResponse.json(
      { success: false, error: "Token không hợp lệ" },
      { status: 401 },
    );
  }
  const response = NextResponse.json({
    success: true,
    data: me.data ?? null,
  });
  response.headers.set("Cache-Control", "no-store");
  const isSecure =
    process.env.NODE_ENV === "production" || request.url.startsWith("https");
  response.cookies.set(ADMIN_TOKEN_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: isSecure,
    path: "/admin",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
  return response;
}

export async function DELETE(): Promise<NextResponse> {
  // Revoke the JWT on the backend before clearing the cookie
  const token = await getAdminTokenFromCookie();
  if (token) {
    await fetch(`${apiUrl}/auth/logout`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    }).catch(() => {
      // Best-effort revocation; cookie will be cleared regardless
    });
  }
  const response = NextResponse.json({ success: true });
  response.headers.set("Cache-Control", "no-store");
  response.cookies.delete({ name: ADMIN_TOKEN_COOKIE, path: "/admin" });
  return response;
}
