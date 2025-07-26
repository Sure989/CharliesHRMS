-- AlterTable
ALTER TABLE "leave_requests" ADD COLUMN     "branchId" TEXT;

-- AlterTable
ALTER TABLE "salary_advance_requests" ADD COLUMN     "branchId" TEXT;

-- CreateIndex
CREATE INDEX "leave_requests_branchId_idx" ON "leave_requests"("branchId");

-- CreateIndex
CREATE INDEX "salary_advance_requests_branchId_idx" ON "salary_advance_requests"("branchId");

-- AddForeignKey
ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "salary_advance_requests" ADD CONSTRAINT "salary_advance_requests_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;
