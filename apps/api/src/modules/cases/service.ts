import { createHash } from "node:crypto";
import {
  eq,
  and,
  sql,
  desc,
  inArray,
  count as drizzleCount,
} from "drizzle-orm";
import type { ScamCase, PaginatedResponse } from "@skam/shared/src/types";
import { CaseStatus, SocialPlatform } from "@skam/shared/src/types";
import { db } from "../../db/client";
import { scamCases, evidenceFiles, socialLinks } from "../../db/schema";
import { cache } from "../../services/cache";
import { turnstile } from "../../services/turnstile";
import { telegram } from "../../services/telegram";
import {
  mapScamCase,
  type RawCaseWithRelations,
} from "../../common/case-mapper";
import { tooManyRequests, badRequest, notFound } from "../../common/error";
import { CASE_NOT_FOUND } from "../../common/error-messages";

type SearchResult = PaginatedResponse<ScamCase>;

export class CasesService {
  private readonly hashSalt: string;

  constructor() {
    const envSalt = (process.env.HASH_SALT ?? "").trim();
    const requireHashSalt =
      (process.env.REQUIRE_HASH_SALT ?? "false") === "true";
    if (requireHashSalt && !envSalt) {
      throw new Error("HASH_SALT is required when REQUIRE_HASH_SALT=true");
    }
    this.hashSalt = envSalt || "skam-salt";
  }

  async createCase(
    payload: {
      bankIdentifier: string;
      bankName: string;
      bankCode: string;
      amount?: number;
      scammerName?: string;
      originalDescription: string;
      turnstileToken?: string;
      submitterFingerprint?: string;
      socialLinks?: Array<{ platform: string; url: string; username?: string }>;
      evidenceFiles?: Array<{
        fileType: string;
        fileKey: string;
        fileName?: string;
        fileSize?: number;
        fileHash?: string;
      }>;
    },
    requesterIp?: string,
  ): Promise<ScamCase> {
    const DAILY_CASE_LIMIT = 5;
    const ONE_DAY_SECONDS = 86_400;
    const isAllowed = await cache.fixedWindowLimit(
      `ratelimit:cases:${requesterIp ?? "unknown"}`,
      DAILY_CASE_LIMIT,
      ONE_DAY_SECONDS,
    );
    if (!isAllowed)
      throw tooManyRequests("Bạn đã gửi quá số lần cho phép hôm nay");

    if (turnstile.isEnabled() && !payload.turnstileToken) {
      throw badRequest("Thiếu Turnstile token");
    }
    if (payload.turnstileToken) {
      const isValid = await turnstile.verify(
        payload.turnstileToken,
        requesterIp,
      );
      if (!isValid) throw badRequest("Turnstile token không hợp lệ");
    }

    const [created] = await db
      .insert(scamCases)
      .values({
        bankIdentifier: payload.bankIdentifier.trim(),
        bankName: payload.bankName.trim(),
        bankCode: payload.bankCode.toUpperCase().trim(),
        amount: payload.amount ?? null,
        scammerName: payload.scammerName?.trim() ?? null,
        originalDescription: payload.originalDescription.trim(),
        refinedDescription: null,
        status: CaseStatus.PENDING,
        submitterFingerprint: payload.submitterFingerprint
          ? this.hashValue(payload.submitterFingerprint)
          : null,
        submitterIpHash: requesterIp ? this.hashValue(requesterIp) : null,
        viewCount: 0,
      })
      .returning();

    const caseId = created.id;

    if (payload.socialLinks?.length) {
      await db.insert(socialLinks).values(
        payload.socialLinks.map((item) => ({
          platform: item.platform as SocialPlatform,
          url: item.url,
          username: item.username ?? null,
          caseId,
        })),
      );
    }

    if (payload.evidenceFiles?.length) {
      await db.insert(evidenceFiles).values(
        payload.evidenceFiles.map((item) => ({
          fileType: item.fileType,
          fileKey: item.fileKey,
          fileName: item.fileName ?? null,
          fileSize: item.fileSize ?? null,
          fileHash: item.fileHash ?? null,
          isApproved: false,
          caseId,
        })),
      );
    }

    const full = await db.query.scamCases.findFirst({
      where: eq(scamCases.id, caseId),
      with: { evidenceFiles: true, socialLinks: true },
    });

    const result = mapScamCase(full as RawCaseWithRelations);

    telegram.notifyNewCase(result).catch((error: unknown) => {
      const reason = error instanceof Error ? error.message : String(error);
      console.warn(`telegram_notify_fire_and_forget_error reason=${reason}`);
    });

    return result;
  }

  async searchCases(query: {
    q: string;
    bankCode?: string;
    page?: number;
    pageSize?: number;
  }): Promise<SearchResult> {
    const rawQuery = query.q.trim();
    const escaped = rawQuery.toLowerCase().replace(/[%_\\]/g, "\\$&");
    const searchPattern = `%${escaped}%`;
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;
    const skip = (page - 1) * pageSize;
    const normalizedBankCode = query.bankCode
      ? query.bankCode.toUpperCase().trim()
      : null;

    const baseConditions = [eq(scamCases.status, CaseStatus.APPROVED)];

    if (normalizedBankCode) {
      baseConditions.push(eq(scamCases.bankCode, normalizedBankCode));
    }

    const searchCondition = sql`(LOWER(${scamCases.bankIdentifier}) LIKE ${searchPattern} ESCAPE '\\' OR LOWER(COALESCE(${scamCases.scammerName}, '')) LIKE ${searchPattern} ESCAPE '\\')`;

    const whereClause = and(...baseConditions, searchCondition);

    const [idRows, countResult] = await Promise.all([
      db
        .select({ id: scamCases.id })
        .from(scamCases)
        .where(whereClause)
        .orderBy(desc(scamCases.createdAt))
        .limit(pageSize)
        .offset(skip),
      db.select({ total: drizzleCount() }).from(scamCases).where(whereClause),
    ]);

    const ids = idRows.map((row) => row.id);
    const total = Number(countResult[0]?.total ?? 0);

    const items = ids.length
      ? await db.query.scamCases.findMany({
          where: inArray(scamCases.id, ids),
          with: { evidenceFiles: true, socialLinks: true },
          orderBy: desc(scamCases.createdAt),
        })
      : [];

    return {
      success: true,
      data: items.map((item) => mapScamCase(item as RawCaseWithRelations)),
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    };
  }

  async listRecent(page = 1, pageSize = 10): Promise<SearchResult> {
    const skip = (page - 1) * pageSize;
    const whereClause = eq(scamCases.status, CaseStatus.APPROVED);

    const [items, countResult] = await Promise.all([
      db.query.scamCases.findMany({
        where: whereClause,
        orderBy: desc(scamCases.createdAt),
        offset: skip,
        limit: pageSize,
        with: { evidenceFiles: true, socialLinks: true },
      }),
      db.select({ total: drizzleCount() }).from(scamCases).where(whereClause),
    ]);

    const total = Number(countResult[0]?.total ?? 0);

    return {
      success: true,
      data: items.map((item) => mapScamCase(item as RawCaseWithRelations)),
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    };
  }

  async getCaseById(id: string, requester?: string): Promise<ScamCase> {
    const found = await db.query.scamCases.findFirst({
      where: and(
        eq(scamCases.id, id),
        eq(scamCases.status, CaseStatus.APPROVED),
      ),
    });
    if (!found) throw notFound(CASE_NOT_FOUND);

    const viewWindowSeconds = 60 * 60;
    const viewFingerprint = requester ? this.hashValue(requester) : "anonymous";
    const viewKey = `view:case:${found.id}:${viewFingerprint}`;
    const canCountView = await cache.fixedWindowLimit(
      viewKey,
      1,
      viewWindowSeconds,
    );

    let result: RawCaseWithRelations;

    if (canCountView) {
      await db
        .update(scamCases)
        .set({ viewCount: sql`${scamCases.viewCount} + 1` })
        .where(eq(scamCases.id, found.id));

      const updated = await db.query.scamCases.findFirst({
        where: eq(scamCases.id, found.id),
        with: { evidenceFiles: true, socialLinks: true },
      });
      if (!updated) throw notFound(CASE_NOT_FOUND);
      result = updated as RawCaseWithRelations;
    } else {
      const existing = await db.query.scamCases.findFirst({
        where: eq(scamCases.id, found.id),
        with: { evidenceFiles: true, socialLinks: true },
      });
      if (!existing) throw notFound(CASE_NOT_FOUND);
      result = existing as RawCaseWithRelations;
    }

    return mapScamCase(result);
  }

  private hashValue(value: string): string {
    return createHash("sha256")
      .update(`${this.hashSalt}:${value}`)
      .digest("hex");
  }
}

export const casesService = new CasesService();
