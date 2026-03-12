import type { ScamCase } from "@skam/shared/src/types";
import { CaseStatus, SocialPlatform } from "@skam/shared/src/types";
import type { ScamCaseRow, EvidenceFileRow, SocialLinkRow } from "../db/schema";

export interface RawCaseWithRelations extends ScamCaseRow {
  evidenceFiles?: EvidenceFileRow[];
  socialLinks?: SocialLinkRow[];
}

export function mapScamCase(input: RawCaseWithRelations): ScamCase {
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
    approvedAt: input.approvedAt ?? null,
    approvedBy: input.approvedBy ?? null,
    rejectionReason: input.rejectionReason ?? null,
    submitterFingerprint: input.submitterFingerprint ?? null,
    submitterIpHash: input.submitterIpHash ?? null,
    viewCount: input.viewCount,
    evidenceFiles: input.evidenceFiles?.map((f) => ({
      id: f.id,
      caseId: f.caseId,
      fileType: f.fileType,
      fileKey: f.fileKey,
      fileName: f.fileName,
      fileSize: f.fileSize,
      fileHash: f.fileHash,
      isApproved: f.isApproved,
      createdAt: f.createdAt,
      updatedAt: f.updatedAt,
    })),
    socialLinks: input.socialLinks?.map((s) => ({
      id: s.id,
      platform: s.platform as SocialPlatform,
      url: s.url,
      username: s.username,
      caseId: s.caseId,
      profileId: s.profileId,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
    })),
    createdAt: input.createdAt,
    updatedAt: input.updatedAt,
  };
}
