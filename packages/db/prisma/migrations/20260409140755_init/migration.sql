-- CreateEnum
CREATE TYPE "RunType" AS ENUM ('easy', 'tempo', 'long', 'workout', 'race', 'unknown');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "stravaAthleteId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "profileImageUrl" TEXT,
    "maxHR" INTEGER,
    "restingHR" INTEGER,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "tokenExpiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Activity" (
    "id" TEXT NOT NULL,
    "stravaId" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "RunType" NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "distanceM" DOUBLE PRECISION NOT NULL,
    "durationSec" INTEGER NOT NULL,
    "paceSeckm" INTEGER NOT NULL,
    "avgHRbpm" INTEGER,
    "maxHRbpm" INTEGER,
    "cadenceRpm" INTEGER,
    "elevationM" DOUBLE PRECISION,
    "caloriesKcal" INTEGER,
    "stravaData" JSONB NOT NULL,
    "tss" DOUBLE PRECISION,
    "feel" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoachInsight" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "refId" TEXT,
    "content" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CoachInsight_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_stravaAthleteId_key" ON "User"("stravaAthleteId");

-- CreateIndex
CREATE UNIQUE INDEX "Activity_stravaId_key" ON "Activity"("stravaId");

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoachInsight" ADD CONSTRAINT "CoachInsight_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
