-- AlterTable
ALTER TABLE "users" ADD COLUMN "chat_id" VARCHAR(255),
ADD COLUMN "chat_username" VARCHAR(255);

-- CreateIndex
CREATE UNIQUE INDEX "users_chat_id_key" ON "users"("chat_id");
