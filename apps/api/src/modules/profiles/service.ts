import { eq, and, desc } from "drizzle-orm";
import type { ScamCase, ScammerProfile } from "@skam/shared/src/types";
import { db } from "../../db/client";
import { scamCases, scammerProfiles } from "../../db/schema";
import { mapScamCase } from "../../common/case-mapper";
import { notFound } from "../../common/error";

interface ProfilePayload extends ScammerProfile {
  recentCases: ScamCase[];
}

export class ProfilesService {
  async getByIdentifier(
    identifier: string,
    bankCode?: string,
  ): Promise<ProfilePayload> {
    const profile = await db.query.scammerProfiles.findFirst({
      where: bankCode
        ? and(
            eq(scammerProfiles.bankIdentifier, identifier),
            eq(scammerProfiles.bankCode, bankCode),
          )
        : eq(scammerProfiles.bankIdentifier, identifier),
      with: {
        cases: {
          where: eq(scamCases.status, "APPROVED"),
          orderBy: [desc(scamCases.createdAt)],
          limit: 5,
          with: { evidenceFiles: true, socialLinks: true },
        },
      },
    });

    if (!profile) throw notFound("Không tìm thấy hồ sơ");

    return {
      id: profile.id,
      bankIdentifier: profile.bankIdentifier,
      bankCode: profile.bankCode,
      scammerName: profile.scammerName,
      totalCases: profile.totalCases,
      totalAmount: profile.totalAmount,
      firstReportedAt: profile.firstReportedAt,
      lastReportedAt: profile.lastReportedAt,
      recentCases: profile.cases.map(mapScamCase),
    };
  }
}

export const profilesService = new ProfilesService();
