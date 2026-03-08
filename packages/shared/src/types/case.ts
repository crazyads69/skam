export enum CaseStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
}

export enum SocialPlatform {
  FACEBOOK = "FACEBOOK",
  ZALO = "ZALO",
  TELEGRAM = "TELEGRAM",
  X = "X",
  TIKTOK = "TIKTOK",
  INSTAGRAM = "INSTAGRAM",
}

export interface EvidenceFile {
  id: string;
  caseId: string;
  fileType: string;
  fileKey: string;
  fileName: string | null;
  fileSize: number | null;
  fileHash: string | null;
  isApproved: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SocialLink {
  id: string;
  platform: SocialPlatform;
  url: string;
  username: string | null;
  caseId: string | null;
  profileId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ScamCase {
  id: string;
  bankIdentifier: string;
  bankName: string;
  bankCode: string;
  amount: number | null;
  scammerName: string | null;
  originalDescription: string;
  refinedDescription: string | null;
  status: CaseStatus;
  approvedAt?: string | null;
  approvedBy?: string | null;
  rejectionReason?: string | null;
  submitterFingerprint?: string | null;
  submitterIpHash?: string | null;
  viewCount: number;
  evidenceFiles?: EvidenceFile[];
  socialLinks?: SocialLink[];
  createdAt: string;
  updatedAt: string;
}
