-- DropIndex
DROP INDEX IF EXISTS "ScammerProfile_bankIdentifier_key";

-- CreateIndex
CREATE UNIQUE INDEX "ScammerProfile_bankIdentifier_bankCode_key" ON "ScammerProfile"("bankIdentifier", "bankCode");
