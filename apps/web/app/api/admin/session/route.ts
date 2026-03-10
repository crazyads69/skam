import { NextResponse } from "next/server";
import { getAdminMe } from "@/lib/api";
import { ADMIN_TOKEN_COOKIE } from "@/lib/admin-auth";

interface SessionBody {
  token?: string;
}

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json().catch(() => null)) as SessionBody | null;
  const token: string | undefined = body?.token;
  if (!token) {
    return NextResponse.json(
      { success: false, error: "Thiếu token" },
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
  response.cookies.delete(ADMIN_TOKEN_COOKIE);
  return response;
}
