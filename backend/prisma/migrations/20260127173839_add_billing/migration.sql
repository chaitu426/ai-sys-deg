/*
  Warnings:

  - A unique constraint covering the columns `[dodoCustomerId]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[subscriptionId]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "users" ADD COLUMN     "dodoCustomerId" TEXT,
ADD COLUMN     "subscriptionId" TEXT,
ADD COLUMN     "tier" TEXT NOT NULL DEFAULT 'FREE';

-- CreateIndex
CREATE UNIQUE INDEX "users_dodoCustomerId_key" ON "users"("dodoCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "users_subscriptionId_key" ON "users"("subscriptionId");
