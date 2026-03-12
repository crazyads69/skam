import type { ScamCase, PaginatedResponse } from "@skam/shared/src/types";
import { eq, and, sql, desc, count, sum, inArray } from "drizzle-orm";
import { db, type Database } from "../../db/client";
import {
  scamCases,
  scammerProfiles,
  evidenceFiles,
  socialLinks,
  systemStats,
} from "../../db/schema";
import {
  mapScamCase,
  type RawCaseWithRelations,
} from "../../common/case-mapper";
import { notFound, badRequest } from "../../common/error";
import { CASE_NOT_FOUND } from "../../common/error-messages";

export class AdminService {
  async listCases(
    status?: "PENDING" | "APPROVED" | "REJECTED",
    page: number = 1,
    pageSize: number = 20,
  ): Promise<PaginatedResponse<ScamCase>> {
    const offset = (page - 1) * pageSize;
    const conditions = status ? eq(scamCases.status, status) : undefined;

    const [items, [totalRow]] = await Promise.all([
      db.query.scamCases.findMany({
        where: conditions,
        orderBy: desc(scamCases.createdAt),
        offset,
        limit: pageSize,
        with: { evidenceFiles: true, socialLinks: true },
      }),
      db.select({ total: count() }).from(scamCases).where(conditions),
    ]);

    const total = totalRow?.total ?? 0;
    return {
      success: true,
      data: items.map((item) => mapScamCase(item as RawCaseWithRelations)),
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    };
  }

  async getCaseById(id: string): Promise<ScamCase> {
    const found = await db.query.scamCases.findFirst({
      where: eq(scamCases.id, id),
      with: { evidenceFiles: true, socialLinks: true },
    });
    if (!found) throw notFound(CASE_NOT_FOUND);
    return mapScamCase(found as RawCaseWithRelations);
  }

  async approveCase(
    id: string,
    actor: string,
    payload: { refinedDescription?: string },
  ): Promise<ScamCase> {
    return db.transaction(async (tx) => {
      const [existing] = await tx
        .select()
        .from(scamCases)
        .where(eq(scamCases.id, id))
        .limit(1);
      if (!existing) throw notFound(CASE_NOT_FOUND);
      if (existing.status !== "PENDING") {
        throw badRequest("Chỉ có thể duyệt vụ việc đang chờ xử lý");
      }

      const now = new Date().toISOString();
      await tx
        .update(scamCases)
        .set({
          status: "APPROVED",
          approvedAt: now,
          approvedBy: actor,
          rejectionReason: null,
          refinedDescription:
            payload.refinedDescription ?? existing.refinedDescription,
          updatedAt: now,
        })
        .where(and(eq(scamCases.id, id), eq(scamCases.status, "PENDING")));

      await tx
        .update(evidenceFiles)
        .set({ isApproved: true, updatedAt: now })
        .where(eq(evidenceFiles.caseId, id));

      await this.rebuildProfileAndStats(
        tx,
        existing.bankIdentifier,
        existing.bankCode,
      );

      const approved = await tx.query.scamCases.findFirst({
        where: eq(scamCases.id, id),
        with: { evidenceFiles: true, socialLinks: true },
      });
      if (!approved) throw notFound(CASE_NOT_FOUND);
      return mapScamCase(approved as RawCaseWithRelations);
    });
  }

  async rejectCase(
    id: string,
    actor: string,
    payload: { reason: string },
  ): Promise<ScamCase> {
    return db.transaction(async (tx) => {
      const [existing] = await tx
        .select()
        .from(scamCases)
        .where(eq(scamCases.id, id))
        .limit(1);
      if (!existing) throw notFound(CASE_NOT_FOUND);
      if (existing.status !== "PENDING") {
        throw badRequest("Chỉ có thể từ chối vụ việc đang chờ xử lý");
      }

      const now = new Date().toISOString();
      await tx
        .update(scamCases)
        .set({
          status: "REJECTED",
          approvedAt: null,
          approvedBy: actor,
          rejectionReason: payload.reason,
          updatedAt: now,
        })
        .where(and(eq(scamCases.id, id), eq(scamCases.status, "PENDING")));

      await this.rebuildProfileAndStats(
        tx,
        existing.bankIdentifier,
        existing.bankCode,
      );

      const rejected = await tx.query.scamCases.findFirst({
        where: eq(scamCases.id, id),
        with: { evidenceFiles: true, socialLinks: true },
      });
      if (!rejected) throw notFound(CASE_NOT_FOUND);
      return mapScamCase(rejected as RawCaseWithRelations);
    });
  }

  async refineCase(
    id: string,
    payload: { refinedDescription: string },
  ): Promise<ScamCase> {
    const existing = await db.query.scamCases.findFirst({
      where: eq(scamCases.id, id),
      with: { evidenceFiles: true, socialLinks: true },
    });
    if (!existing) throw notFound(CASE_NOT_FOUND);
    if (existing.status === "REJECTED") {
      throw badRequest("Không thể chỉnh sửa vụ việc đã từ chối");
    }

    await db
      .update(scamCases)
      .set({
        refinedDescription: payload.refinedDescription,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(scamCases.id, id));

    const updated = await db.query.scamCases.findFirst({
      where: eq(scamCases.id, id),
      with: { evidenceFiles: true, socialLinks: true },
    });
    if (!updated) throw notFound(CASE_NOT_FOUND);
    return mapScamCase(updated as RawCaseWithRelations);
  }

  async deleteCase(id: string): Promise<void> {
    await db.transaction(async (tx) => {
      const [existing] = await tx
        .select()
        .from(scamCases)
        .where(eq(scamCases.id, id))
        .limit(1);
      if (!existing) throw notFound(CASE_NOT_FOUND);

      await tx.delete(scamCases).where(eq(scamCases.id, id));

      await this.rebuildProfileAndStats(
        tx,
        existing.bankIdentifier,
        existing.bankCode,
      );
    });
  }

  async getAdminAnalytics(): Promise<{
    totalCases: number;
    statusBreakdown: Record<string, number>;
    topReportedAccounts: Array<{
      bankIdentifier: string;
      bankCode: string;
      count: number;
    }>;
  }> {
    const [statusRows, topAccounts] = await Promise.all([
      db
        .select({ status: scamCases.status, cnt: count() })
        .from(scamCases)
        .groupBy(scamCases.status),
      db
        .select({
          bankIdentifier: scamCases.bankIdentifier,
          bankCode: scamCases.bankCode,
          cnt: count(),
        })
        .from(scamCases)
        .groupBy(scamCases.bankIdentifier, scamCases.bankCode)
        .orderBy(desc(count()))
        .limit(10),
    ]);

    const statusBreakdown: Record<string, number> = {
      PENDING: 0,
      APPROVED: 0,
      REJECTED: 0,
    };
    let totalCases = 0;
    for (const row of statusRows) {
      statusBreakdown[row.status] = row.cnt;
      totalCases += row.cnt;
    }

    return {
      totalCases,
      statusBreakdown,
      topReportedAccounts: topAccounts.map((item) => ({
        bankIdentifier: item.bankIdentifier,
        bankCode: item.bankCode,
        count: item.cnt,
      })),
    };
  }

  private async rebuildProfileAndStats(
    tx: Parameters<Parameters<Database["transaction"]>[0]>[0],
    bankIdentifier: string,
    bankCode: string,
  ): Promise<void> {
    const approvedCases = await tx
      .select()
      .from(scamCases)
      .where(
        and(
          eq(scamCases.bankIdentifier, bankIdentifier),
          eq(scamCases.bankCode, bankCode),
          eq(scamCases.status, "APPROVED"),
        ),
      )
      .orderBy(scamCases.createdAt);

    if (approvedCases.length === 0) {
      await tx
        .delete(scammerProfiles)
        .where(
          and(
            eq(scammerProfiles.bankIdentifier, bankIdentifier),
            eq(scammerProfiles.bankCode, bankCode),
          ),
        );
    } else {
      const totalCases = approvedCases.length;
      const totalAmount = approvedCases.reduce(
        (s, item) => s + (item.amount ?? 0),
        0,
      );
      const firstReportedAt = approvedCases[0].createdAt;
      const lastReportedAt = approvedCases[approvedCases.length - 1].createdAt;
      const scammerName =
        approvedCases
          .map((item) => item.scammerName)
          .filter((item): item is string => Boolean(item))[0] ?? null;

      const [profile] = await tx
        .insert(scammerProfiles)
        .values({
          bankIdentifier,
          bankCode,
          scammerName,
          totalCases,
          totalAmount,
          firstReportedAt,
          lastReportedAt,
        })
        .onConflictDoUpdate({
          target: [scammerProfiles.bankIdentifier, scammerProfiles.bankCode],
          set: {
            scammerName,
            totalCases,
            totalAmount,
            firstReportedAt,
            lastReportedAt,
          },
        })
        .returning();

      if (profile) {
        const caseIds = approvedCases.map((item) => item.id);
        await tx
          .update(socialLinks)
          .set({ profileId: profile.id })
          .where(inArray(socialLinks.caseId, caseIds));
      }
    }

    await this.syncSystemStats(tx);
  }

  private async syncSystemStats(
    tx: Parameters<Parameters<Database["transaction"]>[0]>[0],
  ): Promise<void> {
    const [caseStats] = await tx
      .select({
        totalCases: count(),
        totalApprovedCases: count(
          sql`CASE WHEN ${scamCases.status} = 'APPROVED' THEN 1 END`,
        ),
        totalPendingCases: count(
          sql`CASE WHEN ${scamCases.status} = 'PENDING' THEN 1 END`,
        ),
        totalScamAmount: sum(
          sql`CASE WHEN ${scamCases.status} = 'APPROVED' THEN ${scamCases.amount} ELSE 0 END`,
        ),
      })
      .from(scamCases);

    const [profileStats] = await tx
      .select({ totalScammerProfiles: count() })
      .from(scammerProfiles);

    const now = new Date().toISOString();
    await tx
      .insert(systemStats)
      .values({
        id: "singleton",
        totalCases: caseStats?.totalCases ?? 0,
        totalApprovedCases: caseStats?.totalApprovedCases ?? 0,
        totalPendingCases: caseStats?.totalPendingCases ?? 0,
        totalScammerProfiles: profileStats?.totalScammerProfiles ?? 0,
        totalScamAmount: Number(caseStats?.totalScamAmount ?? 0),
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: systemStats.id,
        set: {
          totalCases: caseStats?.totalCases ?? 0,
          totalApprovedCases: caseStats?.totalApprovedCases ?? 0,
          totalPendingCases: caseStats?.totalPendingCases ?? 0,
          totalScammerProfiles: profileStats?.totalScammerProfiles ?? 0,
          totalScamAmount: Number(caseStats?.totalScamAmount ?? 0),
          updatedAt: now,
        },
      });
  }
}

export const adminService = new AdminService();
