-- AlterTable
ALTER TABLE "Payout" ADD COLUMN     "notes" TEXT,
ADD COLUMN     "processedBy" TEXT,
ADD COLUMN     "rejectionReason" TEXT;

-- AlterTable
ALTER TABLE "ProviderEarning" ADD COLUMN     "collectedAmount" DOUBLE PRECISION,
ADD COLUMN     "collectedAt" TIMESTAMP(3),
ADD COLUMN     "paymentMethod" TEXT NOT NULL DEFAULT 'ONLINE',
ADD COLUMN     "settledAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Payout_status_idx" ON "Payout"("status");

-- CreateIndex
CREATE INDEX "ProviderEarning_status_idx" ON "ProviderEarning"("status");

-- CreateIndex
CREATE INDEX "ProviderEarning_paymentMethod_idx" ON "ProviderEarning"("paymentMethod");
