-- AlterTable: add preferredModel with Gemini as the default for existing users
ALTER TABLE "User" ADD COLUMN "preferredModel" TEXT NOT NULL DEFAULT 'gemini-2.5-flash';
