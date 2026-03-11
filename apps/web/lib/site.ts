export const siteName: string = "SKAM";
export const siteDescription: string =
  "Nền tảng kiểm tra tài khoản ngân hàng chống lừa đảo tại Việt Nam";

function normalizeUrl(input: string): string {
  return input.endsWith("/") ? input.slice(0, -1) : input;
}

function ensureAbsoluteUrl(input: string): string {
  if (input.startsWith("http://") || input.startsWith("https://")) {
    return input;
  }
  return `https://${input}`;
}

export function getApiBaseUrl(): string {
  const rawEnv: string = String(process.env.NEXT_PUBLIC_API_URL ?? "").trim();
  const fallback: string = "http://localhost:4000/api/v1";
  const candidate: string = rawEnv ? ensureAbsoluteUrl(rawEnv) : fallback;
  const normalized: string = normalizeUrl(candidate);
  if (normalized.endsWith("/api/v1")) return normalized;
  // Strip any partial /api/ suffix to avoid duplication
  const base: string = normalized.replace(/\/api(?:\/v\d+)?$/, "");
  return `${base}/api/v1`;
}

export function getSiteUrl(): string {
  const fromEnv: string | undefined =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.NEXTAUTH_URL ??
    process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (fromEnv && fromEnv.trim()) {
    return normalizeUrl(ensureAbsoluteUrl(fromEnv.trim()));
  }
  return "http://localhost:3000";
}
