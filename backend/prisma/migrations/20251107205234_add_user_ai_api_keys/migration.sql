-- AlterTable
ALTER TABLE "User" ADD COLUMN     "aiApiKey" TEXT,
ADD COLUMN     "aiProvider" TEXT,
ADD COLUMN     "useOwnApiKey" BOOLEAN NOT NULL DEFAULT false;
