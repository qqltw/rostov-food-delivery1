-- Add platform support for multi-messenger (Telegram + MAX)

-- Step 1: Add new columns
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "platform" TEXT DEFAULT 'telegram';
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "platformId" BIGINT;

-- Step 1.1: Normalize partially migrated rows
UPDATE "User" SET "platform" = 'telegram' WHERE "platform" IS NULL;

-- Step 2: Copy existing telegramId to platformId
UPDATE "User" SET "platformId" = "telegramId" WHERE "platformId" IS NULL AND "telegramId" IS NOT NULL;

-- Step 2.1: If old data has users without telegramId, give them stable synthetic platform IDs.
-- This keeps the NOT NULL constraint and the new unique identity index valid.
UPDATE "User"
SET "platformId" = ('x' || substr(md5("id"), 1, 16))::bit(64)::bigint
WHERE "platformId" IS NULL;

-- Step 3: Make platformId NOT NULL after backfill
ALTER TABLE "User" ALTER COLUMN "platform" SET NOT NULL;
ALTER TABLE "User" ALTER COLUMN "platform" SET DEFAULT 'telegram';
ALTER TABLE "User" ALTER COLUMN "platformId" SET NOT NULL;

-- Step 4: Make telegramId nullable (was required before)
ALTER TABLE "User" ALTER COLUMN "telegramId" DROP NOT NULL;

-- Step 5: Add unique constraint on (platform, platformId)
CREATE UNIQUE INDEX IF NOT EXISTS "User_platform_platformId_key" ON "User"("platform", "platformId");
