import { Injectable, NotFoundException } from '@nestjs/common'
import type { ScamCase, ScammerProfile } from '@skam/shared/src/types'
import { CaseStatus } from '@skam/shared/src/types'
import { PrismaService } from '../database/prisma.service'

interface ProfilePayload extends ScammerProfile {
  recentCases: ScamCase[]
}

@Injectable()
export class ProfilesService {
  public constructor(private readonly prisma: PrismaService) {}

  public async getByIdentifier(identifier: string): Promise<ProfilePayload> {
    const profile = await this.prisma.scammerProfile.findUnique({
      where: { bankIdentifier: identifier },
      include: {
        cases: {
          where: { status: CaseStatus.APPROVED },
          orderBy: { createdAt: 'desc' },
          take: 5
        }
      }
    })
    if (!profile) throw new NotFoundException('Không tìm thấy hồ sơ')
    return {
      id: profile.id,
      bankIdentifier: profile.bankIdentifier,
      bankCode: profile.bankCode,
      scammerName: profile.scammerName,
      totalCases: profile.totalCases,
      totalAmount: profile.totalAmount,
      firstReportedAt: profile.firstReportedAt.toISOString(),
      lastReportedAt: profile.lastReportedAt.toISOString(),
      recentCases: profile.cases.map((item) => ({
        id: item.id,
        bankIdentifier: item.bankIdentifier,
        bankName: item.bankName,
        bankCode: item.bankCode,
        amount: item.amount,
        scammerName: item.scammerName,
        originalDescription: item.originalDescription,
        refinedDescription: item.refinedDescription,
        status: item.status as CaseStatus,
        viewCount: item.viewCount,
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString()
      }))
    }
  }
}
