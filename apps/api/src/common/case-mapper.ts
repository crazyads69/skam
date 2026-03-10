import type { ScamCase } from "@skam/shared/src/types";
import { CaseStatus, SocialPlatform } from "@skam/shared/src/types";

interface RawCaseInput {
  id: string;
  bankIdentifier: string;
  bankName: string;
  bankCode: string;
  amount: number | null;
  scammerName: string | null;
  originalDescription: string;
  refinedDescription: string | null;
  status: string;
  approvedAt?: Date | null;
  approvedBy?: string | null;
  rejectionReason?: string | null;
  submitterFingerprint?: string | null;
  submitterIpHash?: string | null;
  viewCount: number;
  evidenceFiles?: Array<{
    id: string;
    caseId: string;
    fileType: string;
    fileKey: string;
    fileName: string | null;
    fileSize: number | null;
    fileHash: string | null;
    isApproved: boolean;
    createdAt: Date;
    updatedAt: Date;
  }>;
  socialLinks?: Array<{
    id: string;
    platform: string;
    url: string;
    username: string | null;
    caseId: string | null;
    profileId: string | null;
    createdAt: Date;
    updatedAt: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

export function mapScamCase(input: RawCaseInput): ScamCase {
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
    approvedBy: input.approvedBy ?? null,
    rejectionReason: input.rejectionReason ?? null,
    submitterFingerprint: input.submitterFingerprint ?? null,
    submitterIpHash: input.submitterIpHash ?? null,
    viewCount: input.viewCount,
    evidenceFiles: input.evidenceFiles?.map((item) => ({
      id: item.id,
      caseId: item.caseId,
      fileType: item.fileType,
      fileKey: item.fileKey,
      fileName: item.fileName,
      fileSize: item.fileSize,
      fileHash: item.fileHash,
      isApproved: item.isApproved,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    })),
    socialLinks: input.socialLinks?.map((item) => ({
      id: item.id,
      platform: item.platform as SocialPlatform,
      url: item.url,
      username: item.username,
      caseId: item.caseId,
      profileId: item.profileId,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    })),
    createdAt: input.createdAt.toISOString(),
    updatedAt: input.updatedAt.toISOString(),
  };
}
