/**
 * Cleanup script — remove all SUPERADMIN tagihan & related keuangan records.
 *
 * Run with: npm run db:cleanup-superadmin
 *
 * Targets the configured DATABASE_URL (temp/dev DB). CONFIRM before running
 * against production.
 *
 * Removes, for every user holding the SUPERADMIN role:
 *   - FinePayment records linked to their bills (via Fine)
 *   - Fine records linked to their bills
 *   - SportsAttendance records linked to their bills
 *   - Transaction records linked to their bills OR created by them
 *   - Notification TAGIHAN_REMINDER records addressed to them
 *   - The bills themselves
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // 1. Find SUPERADMIN user ids
  const superAdminRoles = await prisma.userRole.findMany({
    where: { role: { name: 'SUPERADMIN' } },
    select: { userId: true },
  });
  const superAdminIds = superAdminRoles.map((r) => r.userId);

  if (superAdminIds.length === 0) {
    console.log('ℹ️  No SUPERADMIN users found. Nothing to clean.');
    return;
  }
  console.log(`👤 Found ${superAdminIds.length} SUPERADMIN user(s).`);

  // 2. Find bills owned by SUPERADMIN
  const bills = await prisma.bill.findMany({
    where: { userId: { in: superAdminIds } },
    select: { id: true },
  });
  const billIds = bills.map((b) => b.id);
  console.log(`🧾 Found ${billIds.length} bill(s) owned by SUPERADMIN.`);

  // 3. Delete dependent records (order respects relations)
  const finePayments = await prisma.finePayment.deleteMany({
    where: { fine: { billId: { in: billIds } } },
  });
  console.log(`   ✓ Deleted ${finePayments.count} fine payment(s).`);

  const fines = await prisma.fine.deleteMany({
    where: { billId: { in: billIds } },
  });
  console.log(`   ✓ Deleted ${fines.count} fine(s).`);

  const sportsAttendance = await prisma.sportsAttendance.deleteMany({
    where: { billId: { in: billIds } },
  });
  console.log(`   ✓ Deleted ${sportsAttendance.count} sports attendance(s).`);

  const transactions = await prisma.transaction.deleteMany({
    where: {
      OR: [{ relatedBillId: { in: billIds } }, { createdById: { in: superAdminIds } }],
    },
  });
  console.log(`   ✓ Deleted ${transactions.count} transaction(s).`);

  // 4. Remove keuangan notifications addressed to SUPERADMIN
  const notifications = await prisma.notification.deleteMany({
    where: { userId: { in: superAdminIds }, type: 'TAGIHAN_REMINDER' },
  });
  console.log(`   ✓ Deleted ${notifications.count} tagihan notification(s).`);

  // 5. Delete the bills themselves
  const deletedBills = await prisma.bill.deleteMany({
    where: { id: { in: billIds } },
  });
  console.log(`   ✓ Deleted ${deletedBills.count} bill(s).`);

  console.log('\n✅ Cleanup complete.');
}

main()
  .catch((e) => {
    console.error('❌ Cleanup failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
