-- AlterTable
ALTER TABLE "users" ADD COLUMN "subscription" VARCHAR(50) NOT NULL DEFAULT 'none',
ADD COLUMN "report" VARCHAR(50) NOT NULL DEFAULT 'none',
ADD COLUMN "last_report" TIMESTAMP;
