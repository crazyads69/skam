import { ForbiddenException } from "@nestjs/common";

function readHeaderValue(
  headers: Record<string, string | string[] | undefined>,
  name: string,
): string {
  const raw: string | string[] | undefined = headers[name];
  if (Array.isArray(raw)) return String(raw[0] ?? "").trim();
  return String(raw ?? "").trim();
}

function resolveAllowedOrigins(): string[] {
  const fromCors = String(process.env.CORS_ORIGIN ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  const fromWeb = String(process.env.NEXTAUTH_URL ?? "").trim();
  return Array.from(new Set([...fromCors, fromWeb].filter(Boolean)))
    .map((item) => {
      try {
        return new URL(item).origin;
      } catch {
        return "";
      }
    })
    .filter(Boolean);
}

function resolveOriginFromReferer(referer: string): string {
  if (!referer) return "";
  try {
    return new URL(referer).origin;
  } catch {
    return "";
  }
}

/**
 * Origin validation for public write endpoints (createCase, presign upload).
 *
 * CSRF note: Admin endpoints use JWT tokens from the Authorization header
 * (not cookies), so they are NOT vulnerable to CSRF and do not need
 * origin validation. This is an intentional architectural decision.
 */
export function assertAllowedWriteOrigin(
  headers: Record<string, string | string[] | undefined>,
): void {
  const strict: boolean =
    process.env.NODE_ENV === "production" ||
    (process.env.PUBLIC_WRITE_REQUIRE_ORIGIN ?? "false") === "true";
  if (!strict) return;
  const originHeader: string = readHeaderValue(headers, "origin");
  const refererHeader: string = readHeaderValue(headers, "referer");
  const candidateOrigin: string =
    originHeader || resolveOriginFromReferer(refererHeader);
  const allowedOrigins: string[] = resolveAllowedOrigins();
  if (!candidateOrigin || !allowedOrigins.includes(candidateOrigin)) {
    throw new ForbiddenException("Nguồn yêu cầu không hợp lệ");
  }
}
