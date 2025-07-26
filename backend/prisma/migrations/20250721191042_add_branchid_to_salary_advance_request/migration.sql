-- AlterTable
ALTER TABLE "salary_advance_requests" ADD COLUMN     "branchId" TEXT;

-- AddForeignKey
ALTER TABLE "salary_advance_requests" ADD CONSTRAINT "salary_advance_requests_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;
