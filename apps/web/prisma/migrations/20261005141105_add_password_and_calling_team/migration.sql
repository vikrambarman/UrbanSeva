-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'CALLING_TEAM';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "password" TEXT;

-- CreateTable
CREATE TABLE "StaffCategory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "assignedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StaffCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookingAssignmentLog" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "actionBy" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "fromValue" TEXT,
    "toValue" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BookingAssignmentLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StaffCategory_userId_idx" ON "StaffCategory"("userId");

-- CreateIndex
CREATE INDEX "StaffCategory_categoryId_idx" ON "StaffCategory"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "StaffCategory_userId_categoryId_key" ON "StaffCategory"("userId", "categoryId");

-- CreateIndex
CREATE INDEX "BookingAssignmentLog_bookingId_idx" ON "BookingAssignmentLog"("bookingId");

-- CreateIndex
CREATE INDEX "BookingAssignmentLog_actionBy_idx" ON "BookingAssignmentLog"("actionBy");

-- CreateIndex
CREATE INDEX "BookingAssignmentLog_createdAt_idx" ON "BookingAssignmentLog"("createdAt");

-- AddForeignKey
ALTER TABLE "StaffCategory" ADD CONSTRAINT "StaffCategory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffCategory" ADD CONSTRAINT "StaffCategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffCategory" ADD CONSTRAINT "StaffCategory_assignedBy_fkey" FOREIGN KEY ("assignedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingAssignmentLog" ADD CONSTRAINT "BookingAssignmentLog_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingAssignmentLog" ADD CONSTRAINT "BookingAssignmentLog_actionBy_fkey" FOREIGN KEY ("actionBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
