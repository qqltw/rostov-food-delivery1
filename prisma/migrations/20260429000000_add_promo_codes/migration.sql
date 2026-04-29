-- CreateTable
CREATE TABLE IF NOT EXISTS "PromoCode" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
  "code" TEXT NOT NULL,
  "discountType" TEXT NOT NULL,
  "value" DOUBLE PRECISION NOT NULL,
  "minOrderAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "expiryDate" TIMESTAMP(3),

  CONSTRAINT "PromoCode_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "PromoCode_code_key" ON "PromoCode"("code");
