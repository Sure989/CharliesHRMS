-- AlterTable
ALTER TABLE "public"."users" ADD COLUMN     "permissions" TEXT[] DEFAULT ARRAY[]::TEXT[];
