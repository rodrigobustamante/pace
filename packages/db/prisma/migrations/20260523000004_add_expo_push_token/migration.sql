-- AlterTable: add expoPushToken to User (nullable, no default needed)
ALTER TABLE "User" ADD COLUMN "expoPushToken" TEXT;
