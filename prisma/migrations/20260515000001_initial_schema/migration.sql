-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'MEMBER');

-- CreateEnum
CREATE TYPE "LocationType" AS ENUM ('cooler', 'freezer', 'blast_freezer', 'dry_storage', 'loading_dock', 'processing_floor', 'quarantine');

-- CreateEnum
CREATE TYPE "LotStatus" AS ENUM ('active', 'quarantine', 'depleted', 'recalled', 'disposed');

-- CreateEnum
CREATE TYPE "MovementType" AS ENUM ('receipt', 'sale', 'transfer', 'waste', 'adjustment', 'return');

-- CreateTable
CREATE TABLE "organizations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "usdaEstNumber" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "passwordHash" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organization_members" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'MEMBER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "organization_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "locations" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "locationType" "LocationType" NOT NULL,
    "minTempCelsius" DECIMAL(5,2),
    "maxTempCelsius" DECIMAL(5,2),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lots" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "lotNumber" TEXT NOT NULL,
    "species" TEXT NOT NULL,
    "primalCut" TEXT NOT NULL,
    "productDescription" TEXT,
    "supplierName" TEXT NOT NULL,
    "supplierLotRef" TEXT,
    "countryOfOrigin" TEXT NOT NULL,
    "slaughterDate" DATE NOT NULL,
    "packDate" DATE NOT NULL,
    "expiryDate" DATE NOT NULL,
    "initialWeightKg" DECIMAL(12,3) NOT NULL,
    "grade" TEXT,
    "notes" TEXT,
    "status" "LotStatus" NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "lotId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "quantityOnHand" DECIMAL(12,3) NOT NULL DEFAULT 0,
    "lastMovementAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movements" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "lotId" TEXT NOT NULL,
    "movementType" "MovementType" NOT NULL,
    "fromLocationId" TEXT,
    "toLocationId" TEXT,
    "quantity" DECIMAL(12,3) NOT NULL,
    "referenceNumber" TEXT,
    "movedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recordedBy" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "movements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "organizations_slug_key" ON "organizations"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "organization_members_organizationId_userId_key" ON "organization_members"("organizationId", "userId");

-- CreateIndex
CREATE INDEX "locations_orgId_idx" ON "locations"("orgId");

-- CreateIndex
CREATE UNIQUE INDEX "lots_orgId_lotNumber_key" ON "lots"("orgId", "lotNumber");

-- CreateIndex
CREATE INDEX "lots_orgId_expiryDate_idx" ON "lots"("orgId", "expiryDate");

-- CreateIndex
CREATE INDEX "lots_orgId_packDate_idx" ON "lots"("orgId", "packDate");

-- CreateIndex
CREATE INDEX "lots_orgId_status_idx" ON "lots"("orgId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_lotId_locationId_key" ON "inventory"("lotId", "locationId");

-- CreateIndex
CREATE INDEX "inventory_orgId_idx" ON "inventory"("orgId");

-- CreateIndex
CREATE INDEX "inventory_lotId_idx" ON "inventory"("lotId");

-- CreateIndex
CREATE INDEX "inventory_locationId_idx" ON "inventory"("locationId");

-- CreateIndex
CREATE INDEX "movements_orgId_movedAt_idx" ON "movements"("orgId", "movedAt" DESC);

-- CreateIndex
CREATE INDEX "movements_lotId_movedAt_idx" ON "movements"("lotId", "movedAt" DESC);

-- AddForeignKey
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "locations" ADD CONSTRAINT "locations_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lots" ADD CONSTRAINT "lots_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory" ADD CONSTRAINT "inventory_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory" ADD CONSTRAINT "inventory_lotId_fkey" FOREIGN KEY ("lotId") REFERENCES "lots"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory" ADD CONSTRAINT "inventory_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movements" ADD CONSTRAINT "movements_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movements" ADD CONSTRAINT "movements_lotId_fkey" FOREIGN KEY ("lotId") REFERENCES "lots"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movements" ADD CONSTRAINT "movements_fromLocationId_fkey" FOREIGN KEY ("fromLocationId") REFERENCES "locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movements" ADD CONSTRAINT "movements_toLocationId_fkey" FOREIGN KEY ("toLocationId") REFERENCES "locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- FEFO allocation view: lots ordered by soonest expiry first (use in app queries)
-- SELECT * FROM fefo_allocation WHERE "orgId" = ? AND "locationId" = ?
CREATE VIEW fefo_allocation AS
SELECT
  i."orgId",
  i."locationId",
  loc."name"        AS "locationName",
  l."id"            AS "lotId",
  l."lotNumber",
  l."species",
  l."primalCut",
  l."expiryDate",
  l."packDate",
  i."quantityOnHand",
  (l."expiryDate" - CURRENT_DATE) AS "daysUntilExpiry"
FROM inventory i
JOIN lots      l   ON l."id"  = i."lotId"
JOIN locations loc ON loc."id" = i."locationId"
WHERE i."quantityOnHand" > 0
  AND l."status" = 'active'
ORDER BY l."expiryDate" ASC, l."packDate" ASC;
