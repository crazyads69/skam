import type { MetadataRoute } from "next";
import { getApiBaseUrl, getSiteUrl } from "@/lib/site";

interface RecentCaseItem {
  id: string;
  bankIdentifier: string;
  createdAt: string;
  updatedAt: string;
}

interface RecentCasesResponse {
  success: boolean;
  data: RecentCaseItem[];
}

async function loadRecentCases(): Promise<RecentCaseItem[]> {
  const apiBaseUrl: string = getApiBaseUrl();
  const endpoint: string = `${apiBaseUrl}/cases/recent?page=1&pageSize=200`;
  const response = await fetch(endpoint, { cache: "no-store" }).catch(() => null);
  if (!response?.ok) return [];
  const payload = (await response.json().catch(() => null)) as
    | RecentCasesResponse
    | null;
  if (!payload?.success || !Array.isArray(payload.data)) return [];
  return payload.data.filter(
    (item) => item?.id && item?.bankIdentifier && item?.updatedAt,
  );
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl: string = getSiteUrl();
  const now: Date = new Date();
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: `${siteUrl}/`,
      lastModified: now,
      changeFrequency: "hourly",
      priority: 1,
    },
    {
      url: `${siteUrl}/search`,
      lastModified: now,
      changeFrequency: "hourly",
      priority: 0.9,
    },
    {
      url: `${siteUrl}/report`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.8,
    },
  ];
  const recentCases: RecentCaseItem[] = await loadRecentCases();
  if (recentCases.length === 0) return staticPages;
  const casePages: MetadataRoute.Sitemap = recentCases.map((item) => ({
    url: `${siteUrl}/case/${item.id}`,
    lastModified: new Date(item.updatedAt),
    changeFrequency: "weekly",
    priority: 0.7,
  }));
  const profileSet: Set<string> = new Set(
    recentCases.map((item) => item.bankIdentifier),
  );
  const profilePages: MetadataRoute.Sitemap = Array.from(profileSet).map(
    (identifier) => ({
      url: `${siteUrl}/profile/${encodeURIComponent(identifier)}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.6,
    }),
  );
  return [...staticPages, ...casePages, ...profilePages];
}
