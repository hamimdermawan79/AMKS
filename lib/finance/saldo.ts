import { db } from '@/lib/db';
import type { Division, Prisma, TxType } from '@prisma/client';

type SaldoScope =
  | { scope: 'ALL' }
  | { scope: 'MAIN' }
  | { scope: 'DIVISION'; division: Division };

function buildWhere(scope: SaldoScope): Prisma.TransactionWhereInput {
  if (scope.scope === 'MAIN') {
    return { division: null };
  }
  if (scope.scope === 'DIVISION') {
    return { division: scope.division };
  }
  return {};
}

/** Hitung saldo kas dari transaksi (pemasukan − pengeluaran). */
export async function getTransactionSaldo(scope: SaldoScope = { scope: 'ALL' }) {
  const where = buildWhere(scope);

  const [pemasukan, pengeluaran] = await Promise.all([
    db.transaction.aggregate({
      where: { ...where, type: 'PEMASUKAN' },
      _sum: { amount: true },
    }),
    db.transaction.aggregate({
      where: { ...where, type: 'PENGELUARAN' },
      _sum: { amount: true },
    }),
  ]);

  return (pemasukan._sum.amount ?? 0) - (pengeluaran._sum.amount ?? 0);
}

export function saldoInsufficientMessage(saldo: number, amount: number, label = 'Saldo') {
  return `${label} tidak mencukupi. Tersedia Rp${saldo.toLocaleString('id-ID')}, diperlukan Rp${amount.toLocaleString('id-ID')}`;
}

/** Tolak pengeluaran jika saldo setelah transaksi akan negatif. */
export async function assertPengeluaranAllowed(
  scope: SaldoScope,
  amount: number,
  label = 'Saldo'
) {
  const saldo = await getTransactionSaldo(scope);
  if (amount > saldo) {
    throw new Error(saldoInsufficientMessage(saldo, amount, label));
  }
}

/** Tolak hapus pemasukan jika saldo akan menjadi negatif. */
export async function assertPemasukanDeletionAllowed(
  scope: SaldoScope,
  tx: { type: TxType; amount: number },
  label = 'Saldo'
) {
  if (tx.type !== 'PEMASUKAN') return;

  const saldo = await getTransactionSaldo(scope);
  const saldoAfter = saldo - tx.amount;
  if (saldoAfter < 0) {
    throw new Error(
      `Transaksi tidak dapat dihapus karena ${label.toLowerCase()} akan menjadi negatif (Rp${saldoAfter.toLocaleString('id-ID')})`
    );
  }
}
