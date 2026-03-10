export const siteName: string = "SKAM";
export const siteDescription: string =
  "Nền tảng kiểm tra tài khoản ngân hàng chống lừa đảo tại Việt Nam";

function normalizeUrl(input: string): string {
  return input.endsWith("/") ? input.slice(0, -1) : input;
}

export function getSiteUrl(): string {
  const fromEnv: string | undefined =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.NEXTAUTH_URL ??
    process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (fromEnv && fromEnv.trim()) {
    const raw = fromEnv.trim();
    if (raw.startsWith("http://") || raw.startsWith("https://")) {
      return normalizeUrl(raw);
    }
    return normalizeUrl(`https://${raw}`);
  }
  return "http://localhost:3000";
}

export function getApiBaseUrl(): string {
  const fromEnv: string =
    process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";
  return normalizeUrl(fromEnv);
}
