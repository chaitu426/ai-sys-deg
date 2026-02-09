/*
  Warnings:

  - A unique constraint covering the columns `[githubId]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "design_versions" ADD COLUMN     "githubRepoFullName" TEXT;

-- AlterTable
ALTER TABLE "projects" ADD COLUMN     "githubRepoFullName" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "githubAccessToken" TEXT,
ADD COLUMN     "githubId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "users_githubId_key" ON "users"("githubId");
