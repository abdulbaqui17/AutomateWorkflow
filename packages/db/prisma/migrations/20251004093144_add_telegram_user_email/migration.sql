-- CreateTable
CREATE TABLE "public"."TelegramUserEmail" (
    "id" TEXT NOT NULL,
    "telegramUserId" BIGINT NOT NULL,
    "telegramUsername" TEXT,
    "firstName" TEXT,
    "lastName" TEXT,
    "email" TEXT NOT NULL,
    "telegramBotId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TelegramUserEmail_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TelegramUserEmail_telegramUserId_key" ON "public"."TelegramUserEmail"("telegramUserId");

-- CreateIndex
CREATE INDEX "TelegramUserEmail_email_idx" ON "public"."TelegramUserEmail"("email");

-- CreateIndex
CREATE INDEX "TelegramUserEmail_telegramBotId_idx" ON "public"."TelegramUserEmail"("telegramBotId");

-- AddForeignKey
ALTER TABLE "public"."TelegramUserEmail" ADD CONSTRAINT "TelegramUserEmail_telegramBotId_fkey" FOREIGN KEY ("telegramBotId") REFERENCES "public"."TelegramBot"("id") ON DELETE CASCADE ON UPDATE CASCADE;
