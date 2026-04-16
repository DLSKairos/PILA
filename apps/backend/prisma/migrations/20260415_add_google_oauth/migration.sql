-- AlterTable: make passwordHash nullable and add googleId to trainers
ALTER TABLE "trainers" ALTER COLUMN "passwordHash" DROP NOT NULL;
ALTER TABLE "trainers" ADD COLUMN IF NOT EXISTS "googleId" TEXT;

-- AlterTable: make passwordHash nullable and add googleId to clients
ALTER TABLE "clients" ALTER COLUMN "passwordHash" DROP NOT NULL;
ALTER TABLE "clients" ADD COLUMN IF NOT EXISTS "googleId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "trainers_googleId_key" ON "trainers"("googleId");
CREATE UNIQUE INDEX IF NOT EXISTS "clients_googleId_key" ON "clients"("googleId");
