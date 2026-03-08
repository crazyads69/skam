-- CreateTable
CREATE TABLE "ScammerProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bankIdentifier" TEXT NOT NULL,
    "bankCode" TEXT NOT NULL,
    "scammerName" TEXT,
    "totalCases" INTEGER NOT NULL DEFAULT 0,
    "totalAmount" REAL NOT NULL DEFAULT 0,
    "firstReportedAt" DATETIME NOT NULL,
    "lastReportedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "SystemStats" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'singleton',
    "totalCases" INTEGER NOT NULL DEFAULT 0,
    "totalApprovedCases" INTEGER NOT NULL DEFAULT 0,
    "totalPendingCases" INTEGER NOT NULL DEFAULT 0,
    "totalScammerProfiles" INTEGER NOT NULL DEFAULT 0,
    "totalScamAmount" REAL NOT NULL DEFAULT 0,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ScamCase" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "bankIdentifier" TEXT NOT NULL,
    "bankName" TEXT NOT NULL,
    "bankCode" TEXT NOT NULL,
    "amount" REAL,
    "scammerName" TEXT,
    "originalDescription" TEXT NOT NULL,
    "refinedDescription" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "approvedAt" DATETIME,
    "approvedBy" TEXT,
    "rejectionReason" TEXT,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "profileId" TEXT,
    CONSTRAINT "ScamCase_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "ScammerProfile" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_ScamCase" ("amount", "bankCode", "bankIdentifier", "bankName", "createdAt", "id", "originalDescription", "refinedDescription", "scammerName", "status", "updatedAt", "viewCount") SELECT "amount", "bankCode", "bankIdentifier", "bankName", "createdAt", "id", "originalDescription", "refinedDescription", "scammerName", "status", "updatedAt", "viewCount" FROM "ScamCase";
DROP TABLE "ScamCase";
ALTER TABLE "new_ScamCase" RENAME TO "ScamCase";
CREATE INDEX "ScamCase_bankIdentifier_bankCode_idx" ON "ScamCase"("bankIdentifier", "bankCode");
CREATE INDEX "ScamCase_status_idx" ON "ScamCase"("status");
CREATE INDEX "ScamCase_createdAt_idx" ON "ScamCase"("createdAt");
CREATE INDEX "ScamCase_profileId_idx" ON "ScamCase"("profileId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "ScammerProfile_bankIdentifier_key" ON "ScammerProfile"("bankIdentifier");
