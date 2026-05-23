-- AlterTable: add location and priority fields to Goal
ALTER TABLE "Goal" ADD COLUMN "location" TEXT;
ALTER TABLE "Goal" ADD COLUMN "priority" TEXT NOT NULL DEFAULT 'A';

-- CreateIndex: compound index for efficient multi-milestone queries
CREATE INDEX "Goal_userId_isActive_targetDate_idx" ON "Goal"("userId", "isActive", "targetDate");
