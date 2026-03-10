import { cookies } from "next/headers";

export const ADMIN_TOKEN_COOKIE = "skam_admin_token";

export async function getAdminTokenFromCookie(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(ADMIN_TOKEN_COOKIE)?.value ?? null;
}
