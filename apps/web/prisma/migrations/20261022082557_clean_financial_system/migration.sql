/*
  Warnings:

  - You are about to drop the column `gstAmount` on the `Booking` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[bookingId]` on the table `ProviderEarning` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updatedAt` to the `Payout` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ProviderWalletTxnType" AS ENUM ('EARNING_CREDIT', 'WITHDRAWAL_DEBIT', 'WITHDRAWAL_REVERSAL', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "CompanyLedgerType" AS ENUM ('COMMISSION_CREDIT', 'GST_COLLECTED', 'PAYOUT_DEBIT', 'REFUND_DEBIT');

-- CreateEnum
CREATE TYPE "CommissionType" AS ENUM ('PERCENTAGE', 'FIXED');

-- AlterTable
ALTER TABLE "Booking" DROP COLUMN "gstAmount",
ADD COLUMN     "cgstAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "commissionRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "companyCommission" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "gstRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "providerEarningAmt" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "sgstAmount" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "commissionType" "CommissionType" NOT NULL DEFAULT 'PERCENTAGE',
ADD COLUMN     "commissionValue" DOUBLE PRECISION NOT NULL DEFAULT 20;

-- AlterTable
ALTER TABLE "Payout" ADD COLUMN     "bankAccount" TEXT,
ADD COLUMN     "bankIFSC" TEXT,
ADD COLUMN     "bankName" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "upiId" TEXT;

-- AlterTable
ALTER TABLE "Provider" ADD COLUMN     "walletBalance" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "ProviderEarning" ADD COLUMN     "walletTxnId" TEXT;

-- CreateTable
CREATE TABLE "ProviderWalletTransaction" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "type" "ProviderWalletTxnType" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "balanceAfter" DOUBLE PRECISION NOT NULL,
    "description" TEXT NOT NULL,
    "bookingId" TEXT,
    "payoutId" TEXT,
    "referenceId" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProviderWalletTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompanyLedger" (
    "id" TEXT NOT NULL,
    "type" "CompanyLedgerType" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "description" TEXT NOT NULL,
    "bookingId" TEXT,
    "payoutId" TEXT,
    "referenceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CompanyLedger_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProviderWalletTransaction_providerId_idx" ON "ProviderWalletTransaction"("providerId");

-- CreateIndex
CREATE INDEX "ProviderWalletTransaction_type_idx" ON "ProviderWalletTransaction"("type");

-- CreateIndex
CREATE INDEX "ProviderWalletTransaction_createdAt_idx" ON "ProviderWalletTransaction"("createdAt");

-- CreateIndex
CREATE INDEX "CompanyLedger_type_idx" ON "CompanyLedger"("type");

-- CreateIndex
CREATE INDEX "CompanyLedger_createdAt_idx" ON "CompanyLedger"("createdAt");

-- CreateIndex
CREATE INDEX "CompanyLedger_bookingId_idx" ON "CompanyLedger"("bookingId");

-- CreateIndex
CREATE UNIQUE INDEX "ProviderEarning_bookingId_key" ON "ProviderEarning"("bookingId");

-- AddForeignKey
ALTER TABLE "ProviderEarning" ADD CONSTRAINT "ProviderEarning_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProviderEarning" ADD CONSTRAINT "ProviderEarning_walletTxnId_fkey" FOREIGN KEY ("walletTxnId") REFERENCES "ProviderWalletTransaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProviderWalletTransaction" ADD CONSTRAINT "ProviderWalletTransaction_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProviderWalletTransaction" ADD CONSTRAINT "ProviderWalletTransaction_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProviderWalletTransaction" ADD CONSTRAINT "ProviderWalletTransaction_payoutId_fkey" FOREIGN KEY ("payoutId") REFERENCES "Payout"("id") ON DELETE SET NULL ON UPDATE CASCADE;
