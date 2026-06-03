-- Add browser login/password authentication
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "login" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "passwordHash" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "User_login_key" ON "User"("login");
