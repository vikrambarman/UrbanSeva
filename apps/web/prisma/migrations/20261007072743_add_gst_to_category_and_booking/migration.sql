-- CreateEnum
CREATE TYPE "ProviderWorkStatus" AS ENUM ('AVAILABLE', 'ON_THE_WAY', 'WORKING', 'ON_BREAK', 'OFFLINE');

-- CreateEnum
CREATE TYPE "RescheduleStatus" AS ENUM ('PENDING', 'CONFIRMED', 'REJECTED', 'CANCELLED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "BookingStatus" ADD VALUE 'PAYMENT_RECEIVED';
ALTER TYPE "BookingStatus" ADD VALUE 'PENDING_CONFIRMATION';
ALTER TYPE "BookingStatus" ADD VALUE 'RESCHEDULE_PENDING';
ALTER TYPE "BookingStatus" ADD VALUE 'CANCELLED_BY_CUSTOMER';
ALTER TYPE "BookingStatus" ADD VALUE 'CANCELLED_BY_OPS';
ALTER TYPE "BookingStatus" ADD VALUE 'CANCELLED_BY_PROVIDER';
ALTER TYPE "BookingStatus" ADD VALUE 'NO_SHOW';
ALTER TYPE "BookingStatus" ADD VALUE 'FAILED';

-- AlterEnum
ALTER TYPE "EarningStatus" ADD VALUE 'PENDING_VERIFICATION';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'BOOKING_RECEIVED';
ALTER TYPE "NotificationType" ADD VALUE 'RESCHEDULE_REQUESTED';
ALTER TYPE "NotificationType" ADD VALUE 'PROVIDER_ON_THE_WAY';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "PropertyType" ADD VALUE 'TWO_RK';
ALTER TYPE "PropertyType" ADD VALUE 'THREE_RK';

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "codAmountCollected" DOUBLE PRECISION,
ADD COLUMN     "codDisputed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "codVerifiedAt" TIMESTAMP(3),
ADD COLUMN     "codVerifiedBy" TEXT,
ADD COLUMN     "gstAmount" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "gstEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "gstPercentage" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Provider" ADD COLUMN     "currentJobId" TEXT,
ADD COLUMN     "currentWorkStatus" "ProviderWorkStatus" NOT NULL DEFAULT 'AVAILABLE';

-- CreateTable
CREATE TABLE "RescheduleRequest" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "originalSlot" TIMESTAMP(3) NOT NULL,
    "proposedSlot" TIMESTAMP(3) NOT NULL,
    "reason" TEXT,
    "otp" TEXT NOT NULL,
    "otpExpiresAt" TIMESTAMP(3) NOT NULL,
    "otpAttempts" INTEGER NOT NULL DEFAULT 0,
    "status" "RescheduleStatus" NOT NULL DEFAULT 'PENDING',
    "requestedBy" TEXT NOT NULL,
    "confirmedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RescheduleRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RescheduleRequest_bookingId_idx" ON "RescheduleRequest"("bookingId");

-- CreateIndex
CREATE INDEX "RescheduleRequest_status_idx" ON "RescheduleRequest"("status");

-- AddForeignKey
ALTER TABLE "RescheduleRequest" ADD CONSTRAINT "RescheduleRequest_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;
