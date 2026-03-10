import {
  BadRequestException,
  HttpException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type { PaginatedResponse, ScamCase } from "@skam/shared/src/types";
import { CaseStatus, SocialPlatform } from "@skam/shared/src/types";
import { createHash } from "node:crypto";
import { CacheService } from "../cache/cache.service";
import { mapScamCase } from "../common/case-mapper";
import { PrismaService } from "../database/prisma.service";
import { TelegramNotifierService } from "../notifications/telegram-notifier.service";
import { TurnstileService } from "../turnstile/turnstile.service";
import { CreateCaseDto } from "./dto/create-case.dto";
import { PaginateCaseDto } from "./dto/paginate-case.dto";
import { SearchCaseDto } from "./dto/search-case.dto";

type SearchResult = PaginatedResponse<ScamCase>;

@Injectable()
export class CasesService {
  private readonly hashSalt: string;

  public constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
    private readonly turnstile: TurnstileService,
    private readonly telegramNotifier: TelegramNotifierService,
  ) {
    const envSalt: string = (process.env.HASH_SALT ?? "").trim();
    const requireHashSalt: boolean =
      (process.env.REQUIRE_HASH_SALT ?? "false") === "true";
    if (requireHashSalt && !envSalt) {
      throw new Error("HASH_SALT is required when REQUIRE_HASH_SALT=true");
    }
    this.hashSalt = envSalt || "skam-salt";
  }

  public async createCase(
    payload: CreateCaseDto,
    requesterIp?: string,
  ): Promise<ScamCase> {
    const isAllowed: boolean = await this.cache.fixedWindowLimit(
      `ratelimit:cases:${requesterIp ?? "unknown"}`,
      5,
      60 * 60 * 24,
    );
    if (!isAllowed)
      throw new HttpException("Bạn đã gửi quá số lần cho phép hôm nay", 429);
    const turnstileEnabled: boolean = this.turnstile.isEnabled();
    if (turnstileEnabled && !payload.turnstileToken) {
      throw new BadRequestException("Thiếu Turnstile token");
    }
    if (payload.turnstileToken) {
      const isValid: boolean = await this.turnstile.verify(
        payload.turnstileToken,
        requesterIp,
      );
      if (!isValid)
        throw new BadRequestException("Turnstile token không hợp lệ");
    }
    const created = await this.prisma.scamCase.create({
      data: {
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
        socialLinks: payload.socialLinks?.length
          ? {
              create: payload.socialLinks.map((item) => ({
                platform: item.platform as SocialPlatform,
                url: item.url,
                username: item.username ?? null,
              })),
            }
          : undefined,
        evidenceFiles: payload.evidenceFiles?.length
          ? {
              create: payload.evidenceFiles.map((item) => ({
                fileType: item.fileType,
                fileKey: item.fileKey,
                fileName: item.fileName ?? null,
                fileSize: item.fileSize ?? null,
                fileHash: item.fileHash ?? null,
                isApproved: false,
              })),
            }
          : undefined,
      },
      include: {
        evidenceFiles: true,
        socialLinks: true,
      },
    });
    const result: ScamCase = mapScamCase(created);
    await this.telegramNotifier.notifyNewCase(result);
    return result;
  }

  public async searchCases(query: SearchCaseDto): Promise<SearchResult> {
    const rawQuery: string = query.q.trim();
    const searchPattern: string = `%${rawQuery.toLowerCase()}%`;
    const page: number = query.page;
    const pageSize: number = query.pageSize;
    const skip: number = (page - 1) * pageSize;
    const normalizedBankCode: string | null = query.bankCode
      ? query.bankCode.toUpperCase().trim()
      : null;
    const [idRows, countRows] = normalizedBankCode
      ? await Promise.all([
          this.prisma.$queryRaw<Array<{ id: string }>>`
            SELECT id
            FROM "ScamCase"
            WHERE status = ${CaseStatus.APPROVED}
              AND bankCode = ${normalizedBankCode}
              AND (
                LOWER(bankIdentifier) LIKE ${searchPattern}
                OR LOWER(COALESCE(scammerName, '')) LIKE ${searchPattern}
              )
            ORDER BY createdAt DESC
            LIMIT ${pageSize}
            OFFSET ${skip}
          `,
          this.prisma.$queryRaw<Array<{ total: number }>>`
            SELECT COUNT(*) as total
            FROM "ScamCase"
            WHERE status = ${CaseStatus.APPROVED}
              AND bankCode = ${normalizedBankCode}
              AND (
                LOWER(bankIdentifier) LIKE ${searchPattern}
                OR LOWER(COALESCE(scammerName, '')) LIKE ${searchPattern}
              )
          `,
        ])
      : await Promise.all([
          this.prisma.$queryRaw<Array<{ id: string }>>`
            SELECT id
            FROM "ScamCase"
            WHERE status = ${CaseStatus.APPROVED}
              AND (
                LOWER(bankIdentifier) LIKE ${searchPattern}
                OR LOWER(COALESCE(scammerName, '')) LIKE ${searchPattern}
              )
            ORDER BY createdAt DESC
            LIMIT ${pageSize}
            OFFSET ${skip}
          `,
          this.prisma.$queryRaw<Array<{ total: number }>>`
            SELECT COUNT(*) as total
            FROM "ScamCase"
            WHERE status = ${CaseStatus.APPROVED}
              AND (
                LOWER(bankIdentifier) LIKE ${searchPattern}
                OR LOWER(COALESCE(scammerName, '')) LIKE ${searchPattern}
              )
          `,
        ]);
    const ids: string[] = idRows.map((row) => row.id);
    const orderedIds: Map<string, number> = new Map(
      ids.map((id, index) => [id, index]),
    );
    const items = ids.length
      ? await this.prisma.scamCase.findMany({
          where: { id: { in: ids } },
          include: {
            evidenceFiles: true,
            socialLinks: true,
          },
        })
      : [];
    const sortedItems = items.sort(
      (a, b) =>
        (orderedIds.get(a.id) ?? Number.MAX_SAFE_INTEGER) -
        (orderedIds.get(b.id) ?? Number.MAX_SAFE_INTEGER),
    );
    const total: number = Number(countRows[0]?.total ?? 0);
    return {
      success: true,
      data: sortedItems.map((item) => mapScamCase(item)),
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    };
  }

  public async listRecent(query: PaginateCaseDto): Promise<SearchResult> {
    const page: number = query.page;
    const pageSize: number = query.pageSize;
    const skip: number = (page - 1) * pageSize;
    const where = {
      status: CaseStatus.APPROVED,
    };
    const [items, total] = await Promise.all([
      this.prisma.scamCase.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
        include: {
          evidenceFiles: true,
          socialLinks: true,
        },
      }),
      this.prisma.scamCase.count({ where }),
    ]);
    return {
      success: true,
      data: items.map((item) => mapScamCase(item)),
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    };
  }

  public async getCaseById(id: string, requester?: string): Promise<ScamCase> {
    const found = await this.prisma.scamCase.findFirst({
      where: { id, status: CaseStatus.APPROVED },
    });
    if (!found) throw new NotFoundException("Không tìm thấy vụ việc");
    const viewWindowSeconds: number = 60 * 60;
    const viewFingerprint: string = requester
      ? this.hashValue(requester)
      : "anonymous";
    const viewKey: string = `view:case:${found.id}:${viewFingerprint}`;
    const canCountView: boolean = await this.cache.fixedWindowLimit(
      viewKey,
      1,
      viewWindowSeconds,
    );
    const updated = await this.prisma.scamCase.update({
      where: { id: found.id },
      data: canCountView ? { viewCount: { increment: 1 } } : {},
      include: {
        evidenceFiles: true,
        socialLinks: true,
      },
    });
    return mapScamCase(updated);
  }

  private hashValue(value: string): string {
    return createHash("sha256")
      .update(`${this.hashSalt}:${value}`)
      .digest("hex");
  }
}
