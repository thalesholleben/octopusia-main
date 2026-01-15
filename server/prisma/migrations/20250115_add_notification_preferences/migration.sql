-- AlterTable
ALTER TABLE "users"
ADD COLUMN "notify_email" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "notify_chat" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "notify_dashboard" BOOLEAN NOT NULL DEFAULT true;
