/**
 * Fix: Deactivate the duplicate piket period (the one with 0 assignments)
 * and keep only the one with actual data active.
 * 
 * Run: npx tsx scripts/fix-duplicate-period.ts
 */

import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

async function main() {
  console.log('\n========== FIX DUPLICATE PIKET PERIOD ==========\n');

  // Find all active periods
  const activePeriods = await db.piketPeriod.findMany({
    where: { isActive: true },
    include: {
      _count: { select: { assignments: true, fines: true } },
    },
    orderBy: { createdAt: 'asc' },
  });

  console.log(`Found ${activePeriods.length} active period(s):`);
  for (const p of activePeriods) {
    console.log(`  [${p.id}] ${p.startDate.toLocaleDateString('id-ID')} - ${p.endDate.toLocaleDateString('id-ID')}`);
    console.log(`    Assignments: ${p._count.assignments}, Fines: ${p._count.fines}`);
  }

  if (activePeriods.length <= 1) {
    console.log('\n✅ No duplicate periods found. Nothing to fix.');
    await db.$disconnect();
    return;
  }

  // Keep the one with the most assignments (or latest if tie), deactivate the rest
  const sorted = [...activePeriods].sort((a, b) => b._count.assignments - a._count.assignments);
  const keeper = sorted[0];
  const toDeactivate = sorted.slice(1);

  console.log(`\n→ Keeping period: [${keeper.id}] with ${keeper._count.assignments} assignments`);
  
  for (const p of toDeactivate) {
    console.log(`→ Deactivating period: [${p.id}] with ${p._count.assignments} assignments`);
    await db.piketPeriod.update({
      where: { id: p.id },
      data: { isActive: false },
    });
  }

  console.log('\n✅ Done! Only 1 active period remains.');
  await db.$disconnect();
}

main().catch((e) => {
  console.error(e);
  db.$disconnect();
  process.exit(1);
});
