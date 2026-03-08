-- CreateTable
CREATE TABLE "ScamCase" (
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
    "viewCount" INTEGER NOT NULL DEFAULT 0
);
