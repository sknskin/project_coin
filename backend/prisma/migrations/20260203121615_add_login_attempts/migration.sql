-- AlterTable
ALTER TABLE "users" ADD COLUMN     "ssn_first" TEXT,
ADD COLUMN     "ssn_gender" TEXT,
ADD COLUMN     "ssn_hash" TEXT;

-- CreateTable
CREATE TABLE "login_attempts" (
    "id" TEXT NOT NULL,
    "ip_address" TEXT NOT NULL,
    "attempt_count" INTEGER NOT NULL DEFAULT 0,
    "last_attempt_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "blocked_until" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "login_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "login_attempts_ip_address_idx" ON "login_attempts"("ip_address");

-- CreateIndex
CREATE INDEX "login_attempts_blocked_until_idx" ON "login_attempts"("blocked_until");

-- CreateIndex
CREATE UNIQUE INDEX "login_attempts_ip_address_key" ON "login_attempts"("ip_address");
