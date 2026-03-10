import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type { PaginatedResponse, ScamCase } from "@skam/shared/src/types";
import { CaseStatus } from "@skam/shared/src/types";
import { mapScamCase } from "../common/case-mapper";
import { PrismaService } from "../database/prisma.service";
import { ApproveCaseDto } from "./dto/approve-case.dto";
import { RefineCaseDto } from "./dto/refine-case.dto";
import { RejectCaseDto } from "./dto/reject-case.dto";

type PrismaWriteClient = Pick<
  PrismaService,
  "scamCase" | "evidenceFile" | "scammerProfile" | "socialLink" | "systemStats"
>;

@Injectable()
export class AdminService {
  public constructor(private readonly prisma: PrismaService) {}

  public async listCases(
    status?: CaseStatus,
    page: number = 1,
    pageSize: number = 20,
  ): Promise<PaginatedResponse<ScamCase>> {
    const skip: number = (page - 1) * pageSize;
    const where = status ? { status } : undefined;
    const [items, total] = await Promise.all([
      this.prisma.scamCase.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
        include: { evidenceFiles: true, socialLinks: true },
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

  public async getCaseById(id: string): Promise<ScamCase> {
    const found = await this.prisma.scamCase.findUnique({
      where: { id },
      include: { evidenceFiles: true, socialLinks: true },
    });
    if (!found) throw new NotFoundException("Không tìm thấy vụ việc");
    return mapScamCase(found);
  }

  public async approveCase(
    id: string,
    actor: string,
    payload: ApproveCaseDto,
  ): Promise<ScamCase> {
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.scamCase.findUnique({
        where: { id },
        include: { socialLinks: true, evidenceFiles: true },
      });
      if (!existing) throw new NotFoundException("Không tìm thấy vụ việc");
      if (existing.status !== CaseStatus.PENDING) {
        throw new BadRequestException(
          "Chỉ có thể duyệt vụ việc đang chờ xử lý",
        );
      }
      const updated = await tx.scamCase.updateManyAndReturn({
        where: {
          id,
          status: CaseStatus.PENDING,
        },
        select: { id: true },
        data: {
          status: CaseStatus.APPROVED,
          approvedAt: new Date(),
          approvedBy: actor,
          rejectionReason: null,
          refinedDescription:
            payload.refinedDescription ?? existing.refinedDescription,
        },
      });
      if (updated.length === 0) {
        throw new BadRequestException("Vụ việc đã được xử lý bởi tác vụ khác");
      }
      await tx.evidenceFile.updateMany({
        where: { caseId: id },
        data: { isApproved: true },
      });
      await this.rebuildProfileAndStats(
        tx as unknown as PrismaWriteClient,
        existing.bankIdentifier,
        existing.bankCode,
      );
      const approved = await tx.scamCase.findUnique({
        where: { id: updated[0].id },
        include: { socialLinks: true, evidenceFiles: true },
      });
      if (!approved) throw new NotFoundException("Không tìm thấy vụ việc");
      return mapScamCase(approved);
    });
  }

  public async rejectCase(
    id: string,
    actor: string,
    payload: RejectCaseDto,
  ): Promise<ScamCase> {
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.scamCase.findUnique({
        where: { id },
        include: { socialLinks: true, evidenceFiles: true },
      });
      if (!existing) throw new NotFoundException("Không tìm thấy vụ việc");
      if (existing.status !== CaseStatus.PENDING) {
        throw new BadRequestException(
          "Chỉ có thể từ chối vụ việc đang chờ xử lý",
        );
      }
      const updated = await tx.scamCase.updateManyAndReturn({
        where: {
          id,
          status: CaseStatus.PENDING,
        },
        select: { id: true },
        data: {
          status: CaseStatus.REJECTED,
          approvedAt: null,
          approvedBy: actor,
          rejectionReason: payload.reason,
        },
      });
      if (updated.length === 0) {
        throw new BadRequestException("Vụ việc đã được xử lý bởi tác vụ khác");
      }
      await this.rebuildProfileAndStats(
        tx as unknown as PrismaWriteClient,
        existing.bankIdentifier,
        existing.bankCode,
      );
      const rejected = await tx.scamCase.findUnique({
        where: { id: updated[0].id },
        include: { socialLinks: true, evidenceFiles: true },
      });
      if (!rejected) throw new NotFoundException("Không tìm thấy vụ việc");
      return mapScamCase(rejected);
    });
  }

  public async refineCase(
    id: string,
    payload: RefineCaseDto,
  ): Promise<ScamCase> {
    const existing = await this.prisma.scamCase.findUnique({
      where: { id },
      include: { socialLinks: true, evidenceFiles: true },
    });
    if (!existing) throw new NotFoundException("Không tìm thấy vụ việc");
    if (existing.status === CaseStatus.REJECTED) {
      throw new BadRequestException("Không thể chỉnh sửa vụ việc đã từ chối");
    }
    const updated = await this.prisma.scamCase.update({
      where: { id },
      data: {
        refinedDescription: payload.refinedDescription,
      },
      include: { socialLinks: true, evidenceFiles: true },
    });
    return mapScamCase(updated);
  }

  public async deleteCase(id: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const existing = await tx.scamCase.findUnique({
        where: { id },
      });
      if (!existing) throw new NotFoundException("Không tìm thấy vụ việc");
      await tx.scamCase.delete({ where: { id } });
      await this.rebuildProfileAndStats(
        tx as unknown as PrismaWriteClient,
        existing.bankIdentifier,
        existing.bankCode,
      );
    });
  }

  public async getAdminAnalytics(): Promise<{
    totalCases: number;
    statusBreakdown: Record<string, number>;
    topReportedAccounts: Array<{
      bankIdentifier: string;
      bankCode: string;
      count: number;
    }>;
  }> {
    const [totalCases, pending, approved, rejected, grouped] =
      await Promise.all([
        this.prisma.scamCase.count(),
        this.prisma.scamCase.count({ where: { status: CaseStatus.PENDING } }),
        this.prisma.scamCase.count({ where: { status: CaseStatus.APPROVED } }),
        this.prisma.scamCase.count({ where: { status: CaseStatus.REJECTED } }),
        this.prisma.scamCase.groupBy({
          by: ["bankIdentifier", "bankCode"],
          _count: { _all: true },
          orderBy: { _count: { id: "desc" } },
          take: 10,
        }),
      ]);
    return {
      totalCases,
      statusBreakdown: {
        [CaseStatus.PENDING]: pending,
        [CaseStatus.APPROVED]: approved,
        [CaseStatus.REJECTED]: rejected,
      },
      topReportedAccounts: grouped.map((item) => ({
        bankIdentifier: item.bankIdentifier,
        bankCode: item.bankCode,
        count: item._count._all,
      })),
    };
  }

  private async rebuildProfileAndStats(
    client: PrismaWriteClient,
    bankIdentifier: string,
    bankCode: string,
  ): Promise<void> {
    const approvedCases = await client.scamCase.findMany({
      where: {
        bankIdentifier,
        bankCode,
        status: CaseStatus.APPROVED,
      },
      orderBy: { createdAt: "asc" },
      include: { socialLinks: true },
    });
    if (approvedCases.length === 0) {
      await client.scammerProfile.deleteMany({
        where: { bankIdentifier },
      });
    } else {
      const totalCases: number = approvedCases.length;
      const totalAmount: number = approvedCases.reduce(
        (sum, item) => sum + (item.amount ?? 0),
        0,
      );
      const firstReportedAt: Date = approvedCases[0].createdAt;
      const lastReportedAt: Date =
        approvedCases[approvedCases.length - 1].createdAt;
      const scammerName: string | null =
        approvedCases
          .map((item) => item.scammerName)
          .filter((item): item is string => Boolean(item))[0] ?? null;
      const profile = await client.scammerProfile.upsert({
        where: { bankIdentifier },
        create: {
          bankIdentifier,
          bankCode,
          scammerName,
          totalCases,
          totalAmount,
          firstReportedAt,
          lastReportedAt,
        },
        update: {
          bankCode,
          scammerName,
          totalCases,
          totalAmount,
          firstReportedAt,
          lastReportedAt,
        },
      });
      await client.socialLink.updateMany({
        where: { caseId: { in: approvedCases.map((item) => item.id) } },
        data: { profileId: profile.id },
      });
    }
    await this.syncSystemStats(client);
  }

  private async syncSystemStats(client: PrismaWriteClient): Promise<void> {
    const [
      totalCases,
      totalApprovedCases,
      totalPendingCases,
      totalScammerProfiles,
      approvedAmountAgg,
    ] = await Promise.all([
      client.scamCase.count(),
      client.scamCase.count({ where: { status: CaseStatus.APPROVED } }),
      client.scamCase.count({ where: { status: CaseStatus.PENDING } }),
      client.scammerProfile.count(),
      client.scamCase.aggregate({
        where: { status: CaseStatus.APPROVED },
        _sum: { amount: true },
      }),
    ]);
    await client.systemStats.upsert({
      where: { id: "singleton" },
      create: {
        id: "singleton",
        totalCases,
        totalApprovedCases,
        totalPendingCases,
        totalScammerProfiles,
        totalScamAmount: approvedAmountAgg._sum.amount ?? 0,
      },
      update: {
        totalCases,
        totalApprovedCases,
        totalPendingCases,
        totalScammerProfiles,
        totalScamAmount: approvedAmountAgg._sum.amount ?? 0,
      },
    });
  }

}
