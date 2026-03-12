import { Elysia } from "elysia";
import { db } from "../../db/client";
import { cache } from "../../services/cache";
import { tooManyRequests } from "../../common/error";
import { resolveRequestIdentifier } from "../../common/request-identifier";
import { scamCases, scammerProfiles, systemStats } from "../../db/schema";
import { eq, sql, count, sum } from "drizzle-orm";

export const analyticsModule = new Elysia({ prefix: "/analytics" }).get(
  "/summary",
  async ({ request, server, headers }) => {
    const ip = server?.requestIP(request)?.address;
    const identifier = resolveRequestIdentifier(
      headers as Record<string, string | undefined>,
      ip,
    );

    const allowed = await cache.fixedWindowLimit(
      `rl:analytics:summary:${identifier}`,
      60,
      60,
    );
    if (!allowed) throw tooManyRequests("Rate limit exceeded");

    const existing = await db.query.systemStats.findFirst({
      where: eq(systemStats.id, "singleton"),
    });

    if (existing) {
      return {
        success: true,
        data: {
          totalCases: existing.totalCases,
          totalApprovedCases: existing.totalApprovedCases,
          totalScammerProfiles: existing.totalScammerProfiles,
          totalScamAmount: existing.totalScamAmount,
        },
      };
    }

    const [caseStats] = await db
      .select({
        totalCases: count(),
        totalApprovedCases: count(
          sql`CASE WHEN ${scamCases.status} = 'APPROVED' THEN 1 END`,
        ),
        totalScamAmount: sum(scamCases.amount),
      })
      .from(scamCases);

    const [profileStats] = await db
      .select({ totalScammerProfiles: count() })
      .from(scammerProfiles);

    const data = {
      totalCases: caseStats?.totalCases ?? 0,
      totalApprovedCases: caseStats?.totalApprovedCases ?? 0,
      totalScammerProfiles: profileStats?.totalScammerProfiles ?? 0,
      totalScamAmount: Number(caseStats?.totalScamAmount) || 0,
    };

    await db
      .insert(systemStats)
      .values({
        id: "singleton",
        ...data,
        totalPendingCases: 0,
        updatedAt: new Date().toISOString(),
      })
      .onConflictDoUpdate({
        target: systemStats.id,
        set: {
          ...data,
          updatedAt: new Date().toISOString(),
        },
      });

    return { success: true, data };
  },
);
