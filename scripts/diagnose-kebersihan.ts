/**
 * Script diagnostik lebih lengkap: cek seluruh data kebersihan
 * Jalankan: npx tsx scripts/diagnose-kebersihan.ts
 */

import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

async function main() {
  console.log('\n========== DIAGNOSIS DATA KEBERSIHAN ==========\n');

  // 1. PiketPeriod
  const periods = await db.piketPeriod.findMany({
    include: {
      _count: { select: { assignments: true, fines: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
  console.log(`PiketPeriod: ${periods.length} periode`);
  for (const p of periods) {
    console.log(`  [${p.isActive ? 'AKTIF' : 'TUTUP'}] ${p.startDate.toLocaleDateString('id-ID')} - ${p.endDate.toLocaleDateString('id-ID')}`);
    console.log(`    Assignments: ${p._count.assignments}, Fines: ${p._count.fines}, finePerDay: Rp${p.finePerDay.toLocaleString('id-ID')}`);
  }

  // 2. PiketAttendance status breakdown
  const totalAssignments = await db.piketAssignment.count();
  const hadirCount = await db.piketAttendance.count({ where: { status: 'HADIR' } });
  const tidakHadirCount = await db.piketAttendance.count({ where: { status: 'TIDAK_HADIR' } });
  const noAttendance = totalAssignments - hadirCount - tidakHadirCount;
  console.log(`\nTotal Assignments: ${totalAssignments}`);
  console.log(`  Hadir: ${hadirCount}, Tidak Hadir: ${tidakHadirCount}, Belum presensi: ${noAttendance}`);

  // 3. Fine records
  const fines = await db.fine.findMany({
    include: { 
      user: { select: { fullName: true } },
      payments: { select: { amount: true } },
    },
  });
  console.log(`\nFine records: ${fines.length}`);
  for (const f of fines) {
    const paid = f.payments.reduce((s, p) => s + p.amount, 0);
    console.log(`  ${f.user.fullName} - ${f.daysMissed} hari - Rp${f.amount.toLocaleString('id-ID')} [billId: ${f.billId ?? 'NULL'}, paid: Rp${paid.toLocaleString('id-ID')}]`);
  }

  // 4. Bills DENDA_PIKET
  const dendaBills = await db.bill.findMany({
    where: { type: 'DENDA_PIKET' },
    include: { user: { select: { fullName: true } } },
    orderBy: { createdAt: 'desc' },
  });
  console.log(`\nBill DENDA_PIKET: ${dendaBills.length}`);
  for (const b of dendaBills) {
    console.log(`  [${b.status}] ${b.user.fullName} - Rp${b.amount.toLocaleString('id-ID')} - div: ${b.division ?? 'NULL'}`);
  }

  // 5. Semua Bill (ringkasan)
  const allBillsCount = await db.bill.groupBy({
    by: ['type', 'status'],
    _count: { id: true },
    _sum: { amount: true },
  });
  console.log('\nRingkasan semua Bill:');
  for (const row of allBillsCount) {
    console.log(`  ${row.type} / ${row.status}: ${row._count.id} tagihan, Rp${(row._sum.amount ?? 0).toLocaleString('id-ID')}`);
  }

  await db.$disconnect();
}

main().catch((e) => {
  console.error(e);
  db.$disconnect();
  process.exit(1);
});
