/*
  Warnings:

  - You are about to drop the column `dodoCustomerId` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `tier` on the `users` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "Plan" AS ENUM ('FREE', 'PRO', 'PREMIUM');

-- DropIndex
DROP INDEX "users_dodoCustomerId_key";

-- DropIndex
DROP INDEX "users_subscriptionId_key";

-- AlterTable
ALTER TABLE "users" DROP COLUMN "dodoCustomerId",
DROP COLUMN "tier",
ADD COLUMN     "currentPeriodEnd" TIMESTAMP(3),
ADD COLUMN     "customerId" TEXT,
ADD COLUMN     "plan" "Plan" NOT NULL DEFAULT 'FREE',
ADD COLUMN     "subscriptionStatus" TEXT;
