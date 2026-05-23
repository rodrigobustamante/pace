-- CreateTable
CREATE TABLE "CoachChat" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CoachChat_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CoachChat_userId_conversationId_createdAt_idx" ON "CoachChat"("userId", "conversationId", "createdAt");

-- CreateIndex
CREATE INDEX "CoachChat_userId_createdAt_idx" ON "CoachChat"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "CoachChat" ADD CONSTRAINT "CoachChat_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
