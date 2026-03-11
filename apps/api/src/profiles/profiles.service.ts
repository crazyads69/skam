import { Injectable, NotFoundException } from "@nestjs/common";
import type { ScamCase, ScammerProfile } from "@skam/shared/src/types";
import { CaseStatus } from "@skam/shared/src/types";
import { mapScamCase } from "../common/case-mapper";
import { PrismaService } from "../database/prisma.service";

interface ProfilePayload extends ScammerProfile {
  recentCases: ScamCase[];
}

@Injectable()
export class ProfilesService {
  public constructor(private readonly prisma: PrismaService) {}

  public async getByIdentifier(
    identifier: string,
    bankCode?: string,
  ): Promise<ProfilePayload> {
    const profile = bankCode
      ? await this.prisma.scammerProfile.findUnique({
          where: {
            bankIdentifier_bankCode: { bankIdentifier: identifier, bankCode },
          },
          include: {
            cases: {
              where: { status: CaseStatus.APPROVED },
              orderBy: { createdAt: "desc" },
              take: 5,
            },
          },
        })
      : await this.prisma.scammerProfile.findFirst({
          where: { bankIdentifier: identifier },
          include: {
            cases: {
              where: { status: CaseStatus.APPROVED },
              orderBy: { createdAt: "desc" },
              take: 5,
            },
          },
        });
    if (!profile) throw new NotFoundException("Không tìm thấy hồ sơ");
    return {
      id: profile.id,
      bankIdentifier: profile.bankIdentifier,
      bankCode: profile.bankCode,
      scammerName: profile.scammerName,
      totalCases: profile.totalCases,
      totalAmount: profile.totalAmount,
      firstReportedAt: profile.firstReportedAt.toISOString(),
      lastReportedAt: profile.lastReportedAt.toISOString(),
      recentCases: profile.cases.map(mapScamCase),
    };
  }
}
