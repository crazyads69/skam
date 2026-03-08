-- AlterTable
ALTER TABLE "ScamCase" ADD COLUMN "submitterFingerprint" TEXT;
ALTER TABLE "ScamCase" ADD COLUMN "submitterIpHash" TEXT;

-- CreateTable
CREATE TABLE "EvidenceFile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "caseId" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileKey" TEXT NOT NULL,
    "fileName" TEXT,
    "fileSize" INTEGER,
    "fileHash" TEXT,
    "isApproved" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "EvidenceFile_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "ScamCase" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SocialLink" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "platform" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "username" TEXT,
    "caseId" TEXT,
    "profileId" TEXT,
    CONSTRAINT "SocialLink_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "ScamCase" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SocialLink_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "ScammerProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "EvidenceFile_caseId_idx" ON "EvidenceFile"("caseId");

-- CreateIndex
CREATE INDEX "EvidenceFile_fileHash_idx" ON "EvidenceFile"("fileHash");

-- CreateIndex
CREATE INDEX "SocialLink_caseId_idx" ON "SocialLink"("caseId");

-- CreateIndex
CREATE INDEX "SocialLink_profileId_idx" ON "SocialLink"("profileId");

-- CreateIndex
CREATE INDEX "ScamCase_submitterFingerprint_idx" ON "ScamCase"("submitterFingerprint");

-- CreateIndex
CREATE INDEX "ScamCase_submitterIpHash_idx" ON "ScamCase"("submitterIpHash");
