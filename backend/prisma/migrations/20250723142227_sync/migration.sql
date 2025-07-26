/*
  Warnings:

  - You are about to drop the column `lastLogin` on the `employees` table. All the data in the column will be lost.
  - You are about to drop the column `branchId` on the `leave_requests` table. All the data in the column will be lost.
  - You are about to drop the column `branchId` on the `salary_advance_requests` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "employees" DROP COLUMN "lastLogin";

-- AlterTable
ALTER TABLE "leave_requests" DROP COLUMN "branchId";

-- AlterTable
ALTER TABLE "salary_advance_requests" DROP COLUMN "branchId";
