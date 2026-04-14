-- CreateTable
CREATE TABLE "fuel_prices" (
    "id" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "fuelType" "FuelType" NOT NULL DEFAULT 'GASOLINE',
    "setById" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fuel_prices_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "fuel_prices_fuelType_createdAt_idx" ON "fuel_prices"("fuelType", "createdAt");
