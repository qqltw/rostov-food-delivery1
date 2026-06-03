-- Initial database structure for the food delivery app.
-- Later migrations add platform auth, browser auth, courier assignment,
-- promo codes and notifications.

CREATE TABLE IF NOT EXISTS "User" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "telegramId" BIGINT,
  "firstName" TEXT NOT NULL,
  "lastName" TEXT,
  "username" TEXT,
  "photoUrl" TEXT,
  "phone" TEXT,
  "role" TEXT NOT NULL DEFAULT 'user',
  "addresses" JSONB NOT NULL DEFAULT '[]',
  "favorites" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Category" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "image" TEXT NOT NULL,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "isVisible" BOOLEAN NOT NULL DEFAULT true,

  CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Product" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "price" DOUBLE PRECISION NOT NULL,
  "oldPrice" DOUBLE PRECISION,
  "categoryId" TEXT NOT NULL,
  "images" TEXT[] NOT NULL,
  "weight" TEXT NOT NULL,
  "kcal" INTEGER NOT NULL,
  "proteins" INTEGER NOT NULL,
  "fats" INTEGER NOT NULL,
  "carbs" INTEGER NOT NULL,
  "tags" TEXT[] NOT NULL,
  "isPopular" BOOLEAN NOT NULL DEFAULT false,
  "isNew" BOOLEAN NOT NULL DEFAULT false,
  "isAvailable" BOOLEAN NOT NULL DEFAULT true,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,

  CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Order" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL,
  "totalAmount" DOUBLE PRECISION NOT NULL,
  "deliveryFee" DOUBLE PRECISION NOT NULL,
  "discount" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "promoCode" TEXT,
  "status" TEXT NOT NULL DEFAULT 'created',
  "address" TEXT NOT NULL,
  "phone" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "comment" TEXT,
  "deliveryType" TEXT NOT NULL,
  "paymentType" TEXT NOT NULL,
  "paymentId" TEXT,
  "paymentStatus" TEXT,
  "paymentUrl" TEXT,
  "deliveryClaimId" TEXT,
  "deliveryStatus" TEXT,
  "deliveryFeeYandex" DOUBLE PRECISION,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "OrderItem" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "orderId" TEXT NOT NULL,
  "productId" TEXT,
  "name" TEXT NOT NULL,
  "price" DOUBLE PRECISION NOT NULL,
  "quantity" INTEGER NOT NULL,
  "image" TEXT NOT NULL,

  CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Banner" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "title" TEXT NOT NULL,
  "subtitle" TEXT,
  "image" TEXT NOT NULL,
  "link" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,

  CONSTRAINT "Banner_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Category_slug_key" ON "Category"("slug");
CREATE UNIQUE INDEX IF NOT EXISTS "Product_slug_key" ON "Product"("slug");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Product_categoryId_fkey') THEN
    ALTER TABLE "Product"
    ADD CONSTRAINT "Product_categoryId_fkey"
    FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Order_userId_fkey') THEN
    ALTER TABLE "Order"
    ADD CONSTRAINT "Order_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'OrderItem_orderId_fkey') THEN
    ALTER TABLE "OrderItem"
    ADD CONSTRAINT "OrderItem_orderId_fkey"
    FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'OrderItem_productId_fkey') THEN
    ALTER TABLE "OrderItem"
    ADD CONSTRAINT "OrderItem_productId_fkey"
    FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
