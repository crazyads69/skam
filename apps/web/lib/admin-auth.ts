import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const ADMIN_TOKEN_COOKIE = "skam_admin_token";

export async function getAdminTokenFromCookie(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(ADMIN_TOKEN_COOKIE)?.value ?? null;
}

/** Returns the admin JWT or redirects to login. */
export async function requireAdminToken(): Promise<string> {
  const token = await getAdminTokenFromCookie();
  if (!token) redirect("/admin/login");
  return token;
}
