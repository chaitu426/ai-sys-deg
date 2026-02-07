-- AlterTable
ALTER TABLE "design_versions" ADD COLUMN     "sharedMemory" JSONB,
ALTER COLUMN "status" SET DEFAULT 'pending';
