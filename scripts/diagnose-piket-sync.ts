/**
 * Script diagnostik: cek status sinkronisasi Kebersihan ↔ Keuangan
 * Jalankan: npx tsx scripts/diagnose-piket-sync.ts
 */

import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

async function main() {
  console.log('\n========== DIAGNOSIS SINKRONISASI DENDA PIKET ==========\n');

  // 1. Cek semua Bill type DENDA_PIKET
  const bills = await db.bill.findMany({
    where: { type: 'DENDA_PIKET' },
    include: {
      user: { select: { fullName: true } },
      fines: {
        include: {
          payments: { select: { id: true, amount: true } },
        },
      },
      transaction: { select: { id: true, amount: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  console.log(`Total Bills DENDA_PIKET: ${bills.length}`);
  console.log('');

  for (const b of bills) {
    const finePaid = b.fines.reduce(
      (sum, f) => sum + f.payments.reduce((s, p) => s + p.amount, 0),
      0
    );
    const hasTx = !!b.transaction;
    const hasFines = b.fines.length > 0;
    const hasPayments = b.fines.some((f) => f.payments.length > 0);

    const flags = [];
    if (!hasFines) flags.push('⚠️  TIDAK ADA FINE RECORD');
    if (b.status === 'LUNAS' && !hasTx) flags.push('⚠️  LUNAS TAPI TIDAK ADA TRANSACTION');
    if (b.status === 'LUNAS' && !hasPayments) flags.push('⚠️  LUNAS TAPI TIDAK ADA FINE PAYMENT (kebersihan tidak tahu)');
    if (b.status === 'BELUM_LUNAS' && hasPayments) flags.push('ℹ️  Ada cicilan belum lunas');

    console.log(`[${b.status}] ${b.user.fullName}: Rp${b.amount.toLocaleString('id-ID')}`);
    console.log(`   Bill ID: ${b.id}`);
    console.log(`   Division: ${b.division ?? 'NULL (❌ belum di-set!)'}`);
    console.log(`   Fines: ${b.fines.length} | Payments: ${finePaid > 0 ? `Rp${finePaid.toLocaleString('id-ID')}` : '0'}`);
    console.log(`   Linked Tx: ${hasTx ? `✅ ${b.transaction!.id}` : '❌ NONE'}`);
    if (flags.length > 0) {
      for (const f of flags) console.log(`   ${f}`);
    }
    console.log('');
  }

  // 2. Cek semua Fine records yang TIDAK PUNYA billId
  const orphanFines = await db.fine.findMany({
    where: { billId: null },
    include: { user: { select: { fullName: true } } },
  });
  if (orphanFines.length > 0) {
    console.log(`\n⚠️  ${orphanFines.length} Fine record TANPA billId (orphan):`);
    for (const f of orphanFines) {
      console.log(`   ${f.user.fullName}: ${f.daysMissed} hari: Rp${f.amount.toLocaleString('id-ID')} [fineId: ${f.id}]`);
    }
  } else {
    console.log('✅ Semua Fine record sudah punya billId');
  }

  // 3. Cek FinePayment records total
  const paymentCount = await db.finePayment.count();
  const paymentSum = await db.finePayment.aggregate({ _sum: { amount: true } });
  console.log(`\nTotal FinePayment records: ${paymentCount}`);
  console.log(`Total amount terbayar via FinePayment: Rp${(paymentSum._sum.amount ?? 0).toLocaleString('id-ID')}`);

  // 4. Cek bills LUNAS yang fine-nya belum punya FinePayment
  const lunasBillsWithoutFinePayment = bills.filter(
    (b) =>
      b.status === 'LUNAS' &&
      b.fines.length > 0 &&
      !b.fines.some((f) => f.payments.length > 0)
  );
  if (lunasBillsWithoutFinePayment.length > 0) {
    console.log(`\n🔴 ${lunasBillsWithoutFinePayment.length} Bill LUNAS tapi Fine-nya TIDAK PUNYA FinePayment:`);
    console.log('   → Ini yang menyebabkan Kebersihan laporan masih menunjukkan "Belum Terbayar"!');
    for (const b of lunasBillsWithoutFinePayment) {
      console.log(`   ${b.user.fullName}: Rp${b.amount.toLocaleString('id-ID')} [billId: ${b.id}]`);
    }
    console.log('\n   💡 Untuk memperbaiki, jalankan: npx tsx scripts/fix-piket-sync.ts');
  } else {
    console.log('\n✅ Semua Bill LUNAS sudah memiliki FinePayment yang sinkron');
  }

  await db.$disconnect();
}

main().catch((e) => {
  console.error(e);
  db.$disconnect();
  process.exit(1);
});
