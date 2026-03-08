import { Injectable } from '@nestjs/common'
import { CaseStatus } from '@skam/shared/src/types'
import { PrismaService } from '../database/prisma.service'

interface AnalyticsSummary {
  totalCases: number
  totalApprovedCases: number
  totalPendingCases: number
  totalScammerProfiles: number
  totalScamAmount: number
}

@Injectable()
export class AnalyticsService {
  public constructor(private readonly prisma: PrismaService) {}

  public async getSummary(): Promise<AnalyticsSummary> {
    const stored = await this.prisma.systemStats.findUnique({ where: { id: 'singleton' } })
    if (stored) {
      return {
        totalCases: stored.totalCases,
        totalApprovedCases: stored.totalApprovedCases,
        totalPendingCases: stored.totalPendingCases,
        totalScammerProfiles: stored.totalScammerProfiles,
        totalScamAmount: stored.totalScamAmount
      }
    }
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
    return {
      totalCases,
      totalApprovedCases,
      totalPendingCases,
      totalScammerProfiles,
      totalScamAmount: approvedAmountAgg._sum.amount ?? 0
    }
  }
}
