-- DropForeignKey
ALTER TABLE "leave_requests" DROP CONSTRAINT "leave_requests_branchId_fkey";

-- DropForeignKey
ALTER TABLE "salary_advance_requests" DROP CONSTRAINT "salary_advance_requests_branchId_fkey";

-- AlterTable
ALTER TABLE "employees" ADD COLUMN     "lastLogin" TIMESTAMP(3);
