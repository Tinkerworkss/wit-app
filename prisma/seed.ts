/**
 * Seed script — realistic sample data for development and demos.
 *
 * Run: npm run db:seed
 * Requires: DATABASE_URL env var + a migrated database (npm run db:migrate)
 *
 * Creates:
 *   2 organisations  (distributor + butcher shop)
 *   2 users          (one admin per org)
 *   6 locations      (coolers, freezers, loading docks, processing floor)
 *   12 lots          (beef, pork, chicken, lamb across both orgs)
 *   movements        (receipts, sales, transfers, waste)
 *   inventory        (upserted per movement in application logic)
 */

import "dotenv/config";
import { PrismaClient, MovementType } from "@prisma/client";
import { hashPassword } from "../lib/password";

const prisma = new PrismaClient();

function daysFromNow(offset: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

function daysAgo(n: number): Date {
  return daysFromNow(-n);
}

// Apply a movement and upsert the inventory row(s) in one transaction.
// This mirrors what the application service layer will do at runtime.
async function applyMovement(tx: Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">, args: {
  orgId: string;
  lotId: string;
  movementType: MovementType;
  fromLocationId?: string;
  toLocationId?: string;
  quantity: number;
  referenceNumber?: string;
  movedAt: Date;
  recordedBy?: string;
  notes?: string;
}) {
  const { orgId, lotId, fromLocationId, toLocationId, quantity, movedAt } = args;

  await tx.movement.create({ data: { ...args, quantity: quantity.toString() } });

  // Deduct from source
  if (fromLocationId) {
    const row = await tx.inventory.upsert({
      where: { lotId_locationId: { lotId, locationId: fromLocationId } },
      create: { orgId, lotId, locationId: fromLocationId, quantityOnHand: "0", lastMovementAt: movedAt },
      update: {},
    });
    const next = parseFloat(row.quantityOnHand.toString()) - quantity;
    if (next < 0) throw new Error(`Negative inventory: lot ${lotId} at ${fromLocationId}`);
    await tx.inventory.update({
      where: { lotId_locationId: { lotId, locationId: fromLocationId } },
      data: { quantityOnHand: next.toFixed(3), lastMovementAt: movedAt, updatedAt: new Date() },
    });
  }

  // Credit destination
  if (toLocationId) {
    const row = await tx.inventory.upsert({
      where: { lotId_locationId: { lotId, locationId: toLocationId } },
      create: { orgId, lotId, locationId: toLocationId, quantityOnHand: "0", lastMovementAt: movedAt },
      update: {},
    });
    const next = parseFloat(row.quantityOnHand.toString()) + quantity;
    await tx.inventory.update({
      where: { lotId_locationId: { lotId, locationId: toLocationId } },
      data: { quantityOnHand: next.toFixed(3), lastMovementAt: movedAt, updatedAt: new Date() },
    });
  }
}

async function seed() {
  console.log("🌱  Seeding database…");

  // ------------------------------------------------------------------
  // 1. Organisations
  // ------------------------------------------------------------------
  const distributor = await prisma.organization.upsert({
    where: { slug: "great-plains-meats" },
    create: { name: "Great Plains Meats", slug: "great-plains-meats", usdaEstNumber: "EST-1234" },
    update: {},
  });

  const butcher = await prisma.organization.upsert({
    where: { slug: "corner-butcher" },
    create: { name: "Corner Butcher Co.", slug: "corner-butcher" },
    update: {},
  });

  console.log(`  ✓ orgs: ${distributor.id}  ${butcher.id}`);

  // ------------------------------------------------------------------
  // 2. Users (one admin per org)
  // ------------------------------------------------------------------
  const adminHash = await hashPassword("Password1!");

  await prisma.user.upsert({
    where: { email: "admin@greatplains.com" },
    create: {
      email: "admin@greatplains.com",
      name: "GP Admin",
      passwordHash: adminHash,
      memberships: { create: { organizationId: distributor.id, role: "ADMIN" } },
    },
    update: {},
  });

  await prisma.user.upsert({
    where: { email: "owner@cornerbutcher.com" },
    create: {
      email: "owner@cornerbutcher.com",
      name: "CB Owner",
      passwordHash: adminHash,
      memberships: { create: { organizationId: butcher.id, role: "ADMIN" } },
    },
    update: {},
  });

  console.log(`  ✓ users: 2 created`);

  // ------------------------------------------------------------------
  // 3. Locations
  // ------------------------------------------------------------------
  const [gpCooler, gpFreezer, gpDock, cbCooler, cbFreezer, cbProcessing] =
    await Promise.all([
      prisma.location.create({ data: { orgId: distributor.id, name: "Main Cooler A",    locationType: "cooler",          minTempCelsius: "0",   maxTempCelsius: "4"  } }),
      prisma.location.create({ data: { orgId: distributor.id, name: "Freezer Bank 1",   locationType: "freezer",         minTempCelsius: "-25", maxTempCelsius: "-18" } }),
      prisma.location.create({ data: { orgId: distributor.id, name: "Receiving Dock",   locationType: "loading_dock"                                                  } }),
      prisma.location.create({ data: { orgId: butcher.id,     name: "Walk-In Cooler",   locationType: "cooler",          minTempCelsius: "0",   maxTempCelsius: "4"  } }),
      prisma.location.create({ data: { orgId: butcher.id,     name: "Display Freezer",  locationType: "freezer",         minTempCelsius: "-22", maxTempCelsius: "-15" } }),
      prisma.location.create({ data: { orgId: butcher.id,     name: "Processing Floor", locationType: "processing_floor"                                              } }),
    ]);

  // suppress unused-var for gpDock/gpFreezer used below via identifier names
  void gpDock; void gpFreezer; void cbFreezer;

  console.log(`  ✓ locations: 6 created`);

  // ------------------------------------------------------------------
  // 4. Lots
  // ------------------------------------------------------------------
  const [gpBeefChuck, gpBeefLoin, gpPorkShoulder, gpPorkBelly, gpChicken, gpBrisket] =
    await prisma.$transaction([
      prisma.lot.create({ data: { orgId: distributor.id, lotNumber: "GP-2026-001", species: "beef",    primalCut: "chuck",      supplierName: "Heartland Beef LLC",    supplierLotRef: "HB-MAY-0410", countryOfOrigin: "US", slaughterDate: daysAgo(21), packDate: daysAgo(20), expiryDate: daysFromNow(3),  initialWeightKg: "850.000", grade: "USDA Choice" } }),
      prisma.lot.create({ data: { orgId: distributor.id, lotNumber: "GP-2026-002", species: "beef",    primalCut: "loin",       supplierName: "Heartland Beef LLC",    supplierLotRef: "HB-MAY-0411", countryOfOrigin: "US", slaughterDate: daysAgo(14), packDate: daysAgo(13), expiryDate: daysFromNow(10), initialWeightKg: "620.500", grade: "USDA Prime" } }),
      prisma.lot.create({ data: { orgId: distributor.id, lotNumber: "GP-2026-003", species: "pork",    primalCut: "shoulder",   supplierName: "Midwest Pork Partners", supplierLotRef: "MPP-22895",   countryOfOrigin: "US", slaughterDate: daysAgo(10), packDate: daysAgo(9),  expiryDate: daysFromNow(14), initialWeightKg: "1200.000" } }),
      prisma.lot.create({ data: { orgId: distributor.id, lotNumber: "GP-2026-004", species: "pork",    primalCut: "belly",      supplierName: "Midwest Pork Partners", supplierLotRef: "MPP-22901",   countryOfOrigin: "US", slaughterDate: daysAgo(7),  packDate: daysAgo(6),  expiryDate: daysFromNow(21), initialWeightKg: "480.750" } }),
      prisma.lot.create({ data: { orgId: distributor.id, lotNumber: "GP-2026-005", species: "chicken", primalCut: "whole_bird", supplierName: "Prairie Poultry Inc",   supplierLotRef: "PP-C-0509",   countryOfOrigin: "US", slaughterDate: daysAgo(5),  packDate: daysAgo(5),  expiryDate: daysFromNow(5),  initialWeightKg: "360.000", grade: "USDA Grade A", productDescription: "Air-chilled whole chickens" } }),
      prisma.lot.create({ data: { orgId: distributor.id, lotNumber: "GP-2026-006", species: "beef",    primalCut: "brisket",    supplierName: "Heartland Beef LLC",    supplierLotRef: "HB-MAY-0419", countryOfOrigin: "US", slaughterDate: daysAgo(6),  packDate: daysAgo(5),  expiryDate: daysFromNow(30), initialWeightKg: "750.000", grade: "USDA Choice" } }),
    ]);

  const [cbRib, cbLamb, cbPorkLoin, cbGround, cbBreast, cbFlank] =
    await prisma.$transaction([
      prisma.lot.create({ data: { orgId: butcher.id, lotNumber: "CB-2026-001", species: "beef",    primalCut: "rib",    supplierName: "Regional Packers Ltd", countryOfOrigin: "US", slaughterDate: daysAgo(12), packDate: daysAgo(11), expiryDate: daysFromNow(7),  initialWeightKg: "200.000", grade: "USDA Prime" } }),
      prisma.lot.create({ data: { orgId: butcher.id, lotNumber: "CB-2026-002", species: "lamb",    primalCut: "rack",   supplierName: "Green Pastures Farm",  countryOfOrigin: "AU", slaughterDate: daysAgo(8),  packDate: daysAgo(7),  expiryDate: daysFromNow(12), initialWeightKg: "85.500" } }),
      prisma.lot.create({ data: { orgId: butcher.id, lotNumber: "CB-2026-003", species: "pork",    primalCut: "loin",   supplierName: "Family Farm Pork",     countryOfOrigin: "US", slaughterDate: daysAgo(4),  packDate: daysAgo(3),  expiryDate: daysFromNow(18), initialWeightKg: "145.000" } }),
      prisma.lot.create({ data: { orgId: butcher.id, lotNumber: "CB-2026-004", species: "beef",    primalCut: "ground", supplierName: "Regional Packers Ltd", countryOfOrigin: "US", slaughterDate: daysAgo(3),  packDate: daysAgo(2),  expiryDate: daysFromNow(4),  initialWeightKg: "300.000", productDescription: "80/20 ground beef" } }),
      prisma.lot.create({ data: { orgId: butcher.id, lotNumber: "CB-2026-005", species: "chicken", primalCut: "breast", supplierName: "Valley Poultry Co",    countryOfOrigin: "US", slaughterDate: daysAgo(2),  packDate: daysAgo(2),  expiryDate: daysFromNow(6),  initialWeightKg: "120.000", grade: "USDA Grade A" } }),
      prisma.lot.create({ data: { orgId: butcher.id, lotNumber: "CB-2026-006", species: "beef",    primalCut: "flank",  supplierName: "Regional Packers Ltd", countryOfOrigin: "US", slaughterDate: daysAgo(9),  packDate: daysAgo(8),  expiryDate: daysFromNow(25), initialWeightKg: "95.000",  grade: "USDA Choice", status: "quarantine", notes: "Held pending HACCP verification — routine check" } }),
    ]);

  console.log(`  ✓ lots: 12 created`);

  // ------------------------------------------------------------------
  // 5. Movements (each call also upserts inventory)
  // ------------------------------------------------------------------
  await prisma.$transaction(async (tx) => {
    // Great Plains — receipts
    await applyMovement(tx, { orgId: distributor.id, lotId: gpBeefChuck.id,    movementType: "receipt",  toLocationId: gpCooler.id, quantity: 850,   referenceNumber: "PO-2026-0410", movedAt: daysAgo(20), recordedBy: "system" });
    await applyMovement(tx, { orgId: distributor.id, lotId: gpBeefLoin.id,     movementType: "receipt",  toLocationId: gpCooler.id, quantity: 620.5, referenceNumber: "PO-2026-0411", movedAt: daysAgo(13), recordedBy: "system" });
    await applyMovement(tx, { orgId: distributor.id, lotId: gpPorkShoulder.id, movementType: "receipt",  toLocationId: gpCooler.id, quantity: 1200,  referenceNumber: "PO-2026-0502", movedAt: daysAgo(9),  recordedBy: "system" });
    await applyMovement(tx, { orgId: distributor.id, lotId: gpPorkBelly.id,    movementType: "receipt",  toLocationId: gpCooler.id, quantity: 480.75,referenceNumber: "PO-2026-0503", movedAt: daysAgo(6),  recordedBy: "system" });
    await applyMovement(tx, { orgId: distributor.id, lotId: gpChicken.id,      movementType: "receipt",  toLocationId: gpCooler.id, quantity: 360,   referenceNumber: "PO-2026-0509", movedAt: daysAgo(5),  recordedBy: "system" });
    await applyMovement(tx, { orgId: distributor.id, lotId: gpBrisket.id,      movementType: "receipt",  toLocationId: gpFreezer.id,quantity: 750,   referenceNumber: "PO-2026-0419", movedAt: daysAgo(5),  recordedBy: "system" });
    // Sales
    await applyMovement(tx, { orgId: distributor.id, lotId: gpBeefChuck.id,    movementType: "sale",     fromLocationId: gpCooler.id, quantity: 300,  referenceNumber: "SO-2026-0881", movedAt: daysAgo(15), recordedBy: "sales@greatplains.com" });
    await applyMovement(tx, { orgId: distributor.id, lotId: gpPorkShoulder.id, movementType: "sale",     fromLocationId: gpCooler.id, quantity: 200,  referenceNumber: "SO-2026-0910", movedAt: daysAgo(7),  recordedBy: "sales@greatplains.com" });
    // Transfer — beef loin to freezer
    await applyMovement(tx, { orgId: distributor.id, lotId: gpBeefLoin.id,     movementType: "transfer", fromLocationId: gpCooler.id, toLocationId: gpFreezer.id, quantity: 150, movedAt: daysAgo(5), recordedBy: "warehouse@greatplains.com", notes: "Slower sales than forecast" });
    // Waste — chicken trim
    await applyMovement(tx, { orgId: distributor.id, lotId: gpChicken.id,      movementType: "waste",    fromLocationId: gpCooler.id, quantity: 12, movedAt: daysAgo(2), recordedBy: "qc@greatplains.com", notes: "Trim loss during portioning" });

    // Corner Butcher — receipts
    await applyMovement(tx, { orgId: butcher.id, lotId: cbRib.id,      movementType: "receipt", toLocationId: cbCooler.id, quantity: 200,   referenceNumber: "INV-RP-44201",  movedAt: daysAgo(11), recordedBy: "owner@cornerbutcher.com" });
    await applyMovement(tx, { orgId: butcher.id, lotId: cbLamb.id,     movementType: "receipt", toLocationId: cbCooler.id, quantity: 85.5,  referenceNumber: "INV-GPF-0892",  movedAt: daysAgo(7),  recordedBy: "owner@cornerbutcher.com" });
    await applyMovement(tx, { orgId: butcher.id, lotId: cbPorkLoin.id, movementType: "receipt", toLocationId: cbCooler.id, quantity: 145,   referenceNumber: "INV-FFP-2234",  movedAt: daysAgo(3),  recordedBy: "owner@cornerbutcher.com" });
    await applyMovement(tx, { orgId: butcher.id, lotId: cbGround.id,   movementType: "receipt", toLocationId: cbCooler.id, quantity: 300,   referenceNumber: "INV-RP-44270",  movedAt: daysAgo(2),  recordedBy: "owner@cornerbutcher.com" });
    await applyMovement(tx, { orgId: butcher.id, lotId: cbBreast.id,   movementType: "receipt", toLocationId: cbCooler.id, quantity: 120,   referenceNumber: "INV-VPC-0112",  movedAt: daysAgo(2),  recordedBy: "owner@cornerbutcher.com" });
    // Sale
    await applyMovement(tx, { orgId: butcher.id, lotId: cbRib.id,      movementType: "sale",    fromLocationId: cbCooler.id, quantity: 60, referenceNumber: "RETAIL-0441",   movedAt: daysAgo(8), recordedBy: "pos@cornerbutcher.com" });
    // Transfer to processing
    await applyMovement(tx, { orgId: butcher.id, lotId: cbGround.id,   movementType: "transfer", fromLocationId: cbCooler.id, toLocationId: cbProcessing.id, quantity: 30, movedAt: daysAgo(1), recordedBy: "butcher@cornerbutcher.com", notes: "Portioning into retail packs" });
    // Waste
    await applyMovement(tx, { orgId: butcher.id, lotId: cbLamb.id,     movementType: "waste",   fromLocationId: cbCooler.id, quantity: 5, movedAt: daysAgo(3), recordedBy: "butcher@cornerbutcher.com", notes: "Trim loss during fabrication" });
  });

  console.log(`  ✓ movements + inventory: applied`);

  // ------------------------------------------------------------------
  // 6. Summary
  // ------------------------------------------------------------------
  const inv = await prisma.inventory.findMany({
    where: { quantityOnHand: { gt: 0 } },
    include: { lot: true, location: true, organization: true },
    orderBy: [{ organization: { name: "asc" } }, { lot: { expiryDate: "asc" } }],
  });

  console.log("\n  Inventory summary:");
  for (const row of inv) {
    const days = Math.round((row.lot.expiryDate.getTime() - Date.now()) / 86400000);
    console.log(
      `  [${row.organization.name}] ${row.lot.lotNumber} — ${row.lot.species} ${row.lot.primalCut} — ${row.quantityOnHand} kg @ ${row.location.name} — expires in ${days}d`
    );
  }

  console.log(`\n✅  Seed complete — ${inv.length} inventory rows.`);
}

seed()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
