import { NextResponse } from "next/server";
import { exchangeAdminCode, getAdminMe } from "@/lib/api";
import { ADMIN_TOKEN_COOKIE } from "@/lib/admin-auth";

interface SessionBody {
  token?: string;
  code?: string;
}

function isValidTokenShape(token: string): boolean {
  if (token.length < 32 || token.length > 4096) return false;
  return token.split(".").length === 3;
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
  response.cookies.set(ADMIN_TOKEN_COOKIE, token, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24,
  });
  return response;
}

export async function DELETE(): Promise<NextResponse> {
  const response = NextResponse.json({ success: true });
  response.headers.set("Cache-Control", "no-store");
  response.cookies.delete(ADMIN_TOKEN_COOKIE);
  return response;
}
