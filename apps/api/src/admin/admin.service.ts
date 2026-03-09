import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import type { PaginatedResponse, ScamCase } from '@skam/shared/src/types'
import { CaseStatus, SocialPlatform } from '@skam/shared/src/types'
import { PrismaService } from '../database/prisma.service'
import { ApproveCaseDto } from './dto/approve-case.dto'
import { RefineCaseDto } from './dto/refine-case.dto'
import { RejectCaseDto } from './dto/reject-case.dto'

@Injectable()
export class AdminService {
  public constructor(private readonly prisma: PrismaService) {}

  public async listCases(status?: CaseStatus, page: number = 1, pageSize: number = 20): Promise<PaginatedResponse<ScamCase>> {
    const skip: number = (page - 1) * pageSize
    const where = status ? { status } : undefined
    const [items, total] = await Promise.all([
      this.prisma.scamCase.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
        include: { evidenceFiles: true, socialLinks: true }
      }),
      this.prisma.scamCase.count({ where })
    ])
    return {
      success: true,
      data: items.map((item) => this.mapCase(item)),
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize))
    }
  }

  public async approveCase(id: string, actor: string, payload: ApproveCaseDto): Promise<ScamCase> {
    const existing = await this.prisma.scamCase.findUnique({ where: { id }, include: { socialLinks: true, evidenceFiles: true } })
    if (!existing) throw new NotFoundException('Không tìm thấy vụ việc')
    if (existing.status !== CaseStatus.PENDING) {
      throw new BadRequestException('Chỉ có thể duyệt vụ việc đang chờ xử lý')
    }
    const result = await this.prisma.scamCase.updateMany({
      where: {
        id,
        status: CaseStatus.PENDING
      },
      data: {
        status: CaseStatus.APPROVED,
        approvedAt: new Date(),
        approvedBy: actor,
        rejectionReason: null,
        refinedDescription: payload.refinedDescription ?? existing.refinedDescription
      }
    })
    if (result.count === 0) {
      throw new BadRequestException('Vụ việc đã được xử lý bởi tác vụ khác')
    }
    const updated = await this.prisma.scamCase.findUnique({
      where: { id },
      include: { socialLinks: true, evidenceFiles: true }
    })
    if (!updated) throw new NotFoundException('Không tìm thấy vụ việc')
    await this.rebuildProfileAndStats(updated.bankIdentifier, updated.bankCode)
    return this.mapCase(updated)
  }

  public async rejectCase(id: string, actor: string, payload: RejectCaseDto): Promise<ScamCase> {
    const existing = await this.prisma.scamCase.findUnique({
      where: { id },
      include: { socialLinks: true, evidenceFiles: true }
    })
    if (!existing) throw new NotFoundException('Không tìm thấy vụ việc')
    if (existing.status !== CaseStatus.PENDING) {
      throw new BadRequestException('Chỉ có thể từ chối vụ việc đang chờ xử lý')
    }
    const result = await this.prisma.scamCase.updateMany({
      where: {
        id,
        status: CaseStatus.PENDING
      },
      data: {
        status: CaseStatus.REJECTED,
        approvedAt: null,
        approvedBy: actor,
        rejectionReason: payload.reason
      }
    })
    if (result.count === 0) {
      throw new BadRequestException('Vụ việc đã được xử lý bởi tác vụ khác')
    }
    const updated = await this.prisma.scamCase.findUnique({
      where: { id },
      include: { socialLinks: true, evidenceFiles: true }
    })
    if (!updated) throw new NotFoundException('Không tìm thấy vụ việc')
    await this.rebuildProfileAndStats(updated.bankIdentifier, updated.bankCode)
    return this.mapCase(updated)
  }

  public async refineCase(id: string, payload: RefineCaseDto): Promise<ScamCase> {
    const existing = await this.prisma.scamCase.findUnique({
      where: { id },
      include: { socialLinks: true, evidenceFiles: true }
    })
    if (!existing) throw new NotFoundException('Không tìm thấy vụ việc')
    if (existing.status === CaseStatus.REJECTED) {
      throw new BadRequestException('Không thể chỉnh sửa vụ việc đã từ chối')
    }
    const updated = await this.prisma.scamCase.update({
      where: { id },
      data: {
        refinedDescription: payload.refinedDescription
      },
      include: { socialLinks: true, evidenceFiles: true }
    })
    return this.mapCase(updated)
  }

  public async deleteCase(id: string): Promise<void> {
    const existing = await this.prisma.scamCase.findUnique({
      where: { id }
    })
    if (!existing) throw new NotFoundException('Không tìm thấy vụ việc')
    await this.prisma.scamCase.delete({ where: { id } })
    await this.rebuildProfileAndStats(existing.bankIdentifier, existing.bankCode)
  }

  public async getAdminAnalytics(): Promise<{
    totalCases: number
    statusBreakdown: Record<string, number>
    topReportedAccounts: Array<{ bankIdentifier: string; bankCode: string; count: number }>
  }> {
    const [totalCases, pending, approved, rejected, grouped] = await Promise.all([
      this.prisma.scamCase.count(),
      this.prisma.scamCase.count({ where: { status: CaseStatus.PENDING } }),
      this.prisma.scamCase.count({ where: { status: CaseStatus.APPROVED } }),
      this.prisma.scamCase.count({ where: { status: CaseStatus.REJECTED } }),
      this.prisma.scamCase.groupBy({
        by: ['bankIdentifier', 'bankCode'],
        _count: { _all: true },
        orderBy: { _count: { id: 'desc' } },
        take: 10
      })
    ])
    return {
      totalCases,
      statusBreakdown: {
        [CaseStatus.PENDING]: pending,
        [CaseStatus.APPROVED]: approved,
        [CaseStatus.REJECTED]: rejected
      },
      topReportedAccounts: grouped.map((item) => ({
        bankIdentifier: item.bankIdentifier,
        bankCode: item.bankCode,
        count: item._count._all
      }))
    }
  }

  private async rebuildProfileAndStats(bankIdentifier: string, bankCode: string): Promise<void> {
    const approvedCases = await this.prisma.scamCase.findMany({
      where: {
        bankIdentifier,
        bankCode,
        status: CaseStatus.APPROVED
      },
      orderBy: { createdAt: 'asc' },
      include: { socialLinks: true }
    })
    if (approvedCases.length === 0) {
      await this.prisma.scammerProfile.deleteMany({ where: { bankIdentifier } })
    } else {
      const totalCases: number = approvedCases.length
      const totalAmount: number = approvedCases.reduce((sum, item) => sum + (item.amount ?? 0), 0)
      const firstReportedAt: Date = approvedCases[0].createdAt
      const lastReportedAt: Date = approvedCases[approvedCases.length - 1].createdAt
      const scammerName: string | null = approvedCases
        .map((item) => item.scammerName)
        .filter((item): item is string => Boolean(item))[0] ?? null
      const profile = await this.prisma.scammerProfile.upsert({
        where: { bankIdentifier },
        create: {
          bankIdentifier,
          bankCode,
          scammerName,
          totalCases,
          totalAmount,
          firstReportedAt,
          lastReportedAt
        },
        update: {
          bankCode,
          scammerName,
          totalCases,
          totalAmount,
          firstReportedAt,
          lastReportedAt
        }
      })
      await this.prisma.socialLink.updateMany({
        where: { caseId: { in: approvedCases.map((item) => item.id) } },
        data: { profileId: profile.id }
      })
    }
    await this.syncSystemStats()
  }

  private async syncSystemStats(): Promise<void> {
    const [totalCases, totalApprovedCases, totalPendingCases, totalScammerProfiles, approvedAmountAgg] = await Promise.all([
      this.prisma.scamCase.count(),
      this.prisma.scamCase.count({ where: { status: CaseStatus.APPROVED } }),
      this.prisma.scamCase.count({ where: { status: CaseStatus.PENDING } }),
      this.prisma.scammerProfile.count(),
      this.prisma.scamCase.aggregate({
        where: { status: CaseStatus.APPROVED },
        _sum: { amount: true }
      })
    ])
    await this.prisma.systemStats.upsert({
      where: { id: 'singleton' },
      create: {
        id: 'singleton',
        totalCases,
        totalApprovedCases,
        totalPendingCases,
        totalScammerProfiles,
        totalScamAmount: approvedAmountAgg._sum.amount ?? 0
      },
      update: {
        totalCases,
        totalApprovedCases,
        totalPendingCases,
        totalScammerProfiles,
        totalScamAmount: approvedAmountAgg._sum.amount ?? 0
      }
    })
  }

  private mapCase(input: {
    id: string
    bankIdentifier: string
    bankName: string
    bankCode: string
    amount: number | null
    scammerName: string | null
    originalDescription: string
    refinedDescription: string | null
    status: string
    approvedAt: Date | null
    approvedBy: string | null
    rejectionReason: string | null
    submitterFingerprint: string | null
    submitterIpHash: string | null
    viewCount: number
    evidenceFiles: Array<{
      id: string
      caseId: string
      fileType: string
      fileKey: string
      fileName: string | null
      fileSize: number | null
      fileHash: string | null
      isApproved: boolean
      createdAt: Date
      updatedAt: Date
    }>
    socialLinks: Array<{
      id: string
      platform: string
      url: string
      username: string | null
      caseId: string | null
      profileId: string | null
      createdAt: Date
      updatedAt: Date
    }>
    createdAt: Date
    updatedAt: Date
  }): ScamCase {
    return {
      id: input.id,
      bankIdentifier: input.bankIdentifier,
      bankName: input.bankName,
      bankCode: input.bankCode,
      amount: input.amount,
      scammerName: input.scammerName,
      originalDescription: input.originalDescription,
      refinedDescription: input.refinedDescription,
      status: input.status as CaseStatus,
      approvedAt: input.approvedAt?.toISOString() ?? null,
      approvedBy: input.approvedBy,
      rejectionReason: input.rejectionReason,
      submitterFingerprint: input.submitterFingerprint,
      submitterIpHash: input.submitterIpHash,
      viewCount: input.viewCount,
      evidenceFiles: input.evidenceFiles.map((file) => ({
        id: file.id,
        caseId: file.caseId,
        fileType: file.fileType,
        fileKey: file.fileKey,
        fileName: file.fileName,
        fileSize: file.fileSize,
        fileHash: file.fileHash,
        isApproved: file.isApproved,
        createdAt: file.createdAt.toISOString(),
        updatedAt: file.updatedAt.toISOString()
      })),
      socialLinks: input.socialLinks.map((link) => ({
        id: link.id,
        platform: link.platform as SocialPlatform,
        url: link.url,
        username: link.username,
        caseId: link.caseId,
        profileId: link.profileId,
        createdAt: link.createdAt.toISOString(),
        updatedAt: link.updatedAt.toISOString()
      })),
      createdAt: input.createdAt.toISOString(),
      updatedAt: input.updatedAt.toISOString()
    }
  }
}
