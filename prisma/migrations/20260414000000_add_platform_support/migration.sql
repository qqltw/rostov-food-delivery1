-- Add platform support for multi-messenger (Telegram + MAX)

-- Step 1: Add new columns
ALTER TABLE "User" ADD COLUMN "platform" TEXT NOT NULL DEFAULT 'telegram';
ALTER TABLE "User" ADD COLUMN "platformId" BIGINT;

-- Step 2: Copy existing telegramId to platformId
UPDATE "User" SET "platformId" = "telegramId";

-- Step 3: Make platformId NOT NULL after backfill
ALTER TABLE "User" ALTER COLUMN "platformId" SET NOT NULL;

-- Step 4: Make telegramId nullable (was required before)
ALTER TABLE "User" ALTER COLUMN "telegramId" DROP NOT NULL;

-- Step 5: Add unique constraint on (platform, platformId)
CREATE UNIQUE INDEX "User_platform_platformId_key" ON "User"("platform", "platformId");
