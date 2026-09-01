'use server';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { canFromSession, isUserSuperAdminById } from '@/lib/rbac/can';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createNotification } from '@/lib/notifications';
import {
  assertPemasukanDeletionAllowed,
  assertPengeluaranAllowed,
} from '@/lib/finance/saldo';

// Helper to check bendahara permission
async function authorizeFinance(permission: string) {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  const allowed = await canFromSession(permission);
  if (!allowed) {
    throw new Error('Anda tidak memiliki hak akses keuangan');
  }
  return session;
}

const transactionSchema = z.object({
  type: z.enum(['PEMASUKAN', 'PENGELUARAN']),
  category: z.string().min(1, 'Kategori wajib diisi'),
  amount: z.number().int().min(1, 'Nominal harus lebih dari 0'),
  description: z.string().optional(),
  occurredAt: z.string().min(1, 'Tanggal wajib diisi'),
});

export async function addTransaction(data: {
  type: 'PEMASUKAN' | 'PENGELUARAN';
  category: string;
  amount: number;
  description?: string;
  occurredAt: string;
}) {
  const session = await authorizeFinance('finance:transaction:create');
  const v = transactionSchema.parse(data);

  if (v.type === 'PENGELUARAN') {
    await assertPengeluaranAllowed({ scope: 'ALL' }, v.amount, 'Saldo kas');
  }

  const tx = await db.transaction.create({
    data: {
      type: v.type,
      category: v.category,
      amount: v.amount,
      description: v.description || '',
      occurredAt: new Date(v.occurredAt),
      createdById: session.user.id,
    },
  });

  revalidatePath('/admin/keuangan');
  return { success: true, id: tx.id };
}

export async function deleteTransaction(id: string) {
  await authorizeFinance('finance:transaction:delete');

  const existing = await db.transaction.findUnique({ where: { id } });
  if (!existing) {
    throw new Error('Transaksi tidak ditemukan');
  }

  await assertPemasukanDeletionAllowed({ scope: 'ALL' }, existing, 'Saldo kas');

  // If transaction is linked to a bill, we should set the bill status back to BELUM_LUNAS
  if (existing.relatedBillId) {
    await db.bill.update({
      where: { id: existing.relatedBillId },
      data: {
        status: 'BELUM_LUNAS',
        settledAt: null,
        settledById: null,
      },
    });
  }

  // Delete any associated FinePayments in Kebersihan
  await db.finePayment.deleteMany({
    where: { paymentTxId: id }
  });

  await db.transaction.delete({ where: { id } });

  revalidatePath('/admin/keuangan');
  revalidatePath('/admin/kebersihan/laporan');
  revalidatePath('/admin/kebersihan');
  return { success: true };
}

const billSchema = z.object({
  userId: z.string().min(1, 'Warga wajib dipilih'),
  type: z.enum(['DENDA_PIKET', 'IURAN', 'LAINNYA', 'IURAN_OLAHRAGA', 'DENDA_OLAHRAGA']),
  title: z.string().min(1, 'Judul tagihan wajib diisi'),
  amount: z.number().int().min(1, 'Nominal harus lebih dari 0'),
  dueDate: z.string().optional().nullable(),
  note: z.string().optional(),
  createdAt: z.string().optional().nullable(),
});

export async function addBill(data: {
  userId: string;
  type: 'DENDA_PIKET' | 'IURAN' | 'LAINNYA' | 'IURAN_OLAHRAGA' | 'DENDA_OLAHRAGA';
  title: string;
  amount: number;
  dueDate?: string | null;
  note?: string;
  createdAt?: string | null;
}) {
  const session = await authorizeFinance('bill:update');
  const v = billSchema.parse(data);

  // Super Admin tidak boleh menerima tagihan
  if (await isUserSuperAdminById(v.userId)) {
    throw new Error('Tagihan tidak dapat dibuat untuk akun Super Admin');
  }

  const due = v.dueDate ? new Date(v.dueDate) : null;
  const createdDate = v.createdAt ? new Date(v.createdAt) : new Date();

  const bill = await db.bill.create({
    data: {
      userId: v.userId,
      type: v.type,
      title: v.title,
      amount: v.amount,
      status: 'BELUM_LUNAS',
      dueDate: due,
      note: v.note || '',
      createdAt: createdDate,
    },
  });

  // Create notification in DB (which handles WA queues automatically)
  try {
    await createNotification({
      userId: v.userId,
      title: 'Tagihan Baru Diterbitkan',
      message: `Terdapat tagihan baru untuk Anda sebesar Rp${v.amount.toLocaleString('id-ID')} dengan judul "${v.title}". Harap hubungi Bendahara untuk melakukan pelunasan.`,
      type: 'TAGIHAN_REMINDER',
      referenceId: bill.id,
    });
  } catch (err) {
    console.error('Failed to create notification for new bill:', err);
  }

  revalidatePath('/admin/keuangan');
  return { success: true, id: bill.id };
}

const bulkIuranSchema = z.object({
  title: z.string().min(1, 'Judul tagihan wajib diisi'),
  dueDate: z.string().optional().nullable(),
  users: z.array(z.object({
    userId: z.string(),
    amount: z.number().int(),
  })),
});

export async function addBulkIuran(data: {
  title: string;
  dueDate?: string | null;
  users: { userId: string; amount: number }[];
}) {
  const session = await authorizeFinance('bill:update');
  const v = bulkIuranSchema.parse(data);

  const due = v.dueDate ? new Date(v.dueDate) : null;

  // Filter out Super Admin — tidak boleh menerima tagihan
  const eligibleUsers = (
    await Promise.all(
      v.users.map(async (u) => ({
        ...u,
        isSuperAdmin: await isUserSuperAdminById(u.userId),
      }))
    )
  ).filter((u) => !u.isSuperAdmin);

  // Use a transaction or create multiple individually
  for (const u of eligibleUsers) {
    const bill = await db.bill.create({
      data: {
        userId: u.userId,
        type: 'IURAN',
        title: v.title,
        amount: u.amount,
        status: 'BELUM_LUNAS',
        dueDate: due,
        note: 'Dibuat secara massal',
      },
    });

    try {
      await createNotification({
        userId: u.userId,
        title: 'Tagihan Baru Diterbitkan',
        message: `Terdapat tagihan baru untuk Anda sebesar Rp${u.amount.toLocaleString('id-ID')} dengan judul "${v.title}". Harap hubungi Bendahara untuk melakukan pelunasan.`,
        type: 'TAGIHAN_REMINDER',
        referenceId: bill.id,
      });
    } catch (err) {
      console.error('Failed to create notification for bulk bill:', err);
    }
  }

  revalidatePath('/admin/keuangan');
  return { success: true };
}

export async function settleBill(billId: string, note?: string, amountOverride?: number) {
  const session = await authorizeFinance('bill:update');

  if (amountOverride !== undefined && amountOverride <= 0) {
    throw new Error('Nominal pelunasan harus lebih dari 0');
  }

  const bill = await db.bill.findUnique({
    where: { id: billId },
    include: { transaction: true },
  });

  if (!bill) {
    throw new Error('Tagihan tidak ditemukan');
  }

  if (bill.status === 'LUNAS') {
    throw new Error('Tagihan sudah lunas');
  }

  const isLate = bill.status === 'BELUM_LUNAS' && bill.dueDate && new Date() > new Date(bill.dueDate) && bill.type === 'IURAN';
  const targetAmount = isLate ? Math.floor(bill.amount * 1.2) : bill.amount;
  const payAmount = amountOverride ?? targetAmount;

  const isPartial = payAmount < targetAmount;

  if (isPartial) {
    // Pembayaran sebagian / cicilan
    const remainingAmount = targetAmount - payAmount;
    await db.bill.update({
      where: { id: billId },
      data: {
        amount: remainingAmount,
        note: note ? `${bill.note || ''}\nCatatan Cicilan: ${note} (Bayar Rp${payAmount.toLocaleString('id-ID')}, sisa Rp${remainingAmount.toLocaleString('id-ID')})`.trim() : `${bill.note || ''}\n(Bayar Rp${payAmount.toLocaleString('id-ID')}, sisa Rp${remainingAmount.toLocaleString('id-ID')})`.trim(),
      },
    });
  } else {
    // Pelunasan penuh
    await db.bill.update({
      where: { id: billId },
      data: {
        status: 'LUNAS',
        amount: payAmount, // Update the DB amount if late fee is included
        settledAt: new Date(),
        settledById: session.user.id,
        note: note ? `${bill.note || ''}\nCatatan Pelunasan: ${note}`.trim() : bill.note,
      },
    });
  }

  // Automatically create a corresponding PEMASUKAN transaction
  const category = bill.type === 'DENDA_PIKET'
    ? 'Denda Piket'
    : bill.type === 'IURAN'
      ? 'Iuran Warga'
      : bill.type === 'IURAN_OLAHRAGA'
        ? 'Iuran Olahraga'
        : bill.type === 'DENDA_OLAHRAGA'
          ? 'Denda Olahraga'
          : 'Lain-lain';

  const tx = await db.transaction.create({
    data: {
      type: 'PEMASUKAN',
      category,
      amount: payAmount,
      description: isPartial ? `Pembayaran cicilan tagihan: ${bill.title}` : `Pelunasan tagihan: ${bill.title}`,
      occurredAt: new Date(),
      relatedBillId: isPartial ? null : bill.id,
      createdById: session.user.id,
      division: bill.division,
    },
  });

  // [Two-Way Sync] Jika jenis tagihan adalah DENDA_PIKET, catat FinePayment secara otomatis
  if (bill.type === 'DENDA_PIKET') {
    const fines = await db.fine.findMany({
      where: { billId: bill.id },
      include: { payments: true }
    });

    let remainingPayAmount = payAmount;
    for (const fine of fines) {
      if (remainingPayAmount <= 0) break;
      const alreadyPaid = fine.payments.reduce((sum, p) => sum + p.amount, 0);
      const remainingFine = fine.amount - alreadyPaid;

      if (remainingFine > 0) {
        const payToThisFine = Math.min(remainingFine, remainingPayAmount);
        await db.finePayment.create({
          data: {
            fineId: fine.id,
            amount: payToThisFine,
            note: note ? `Dibayar sebagian/lunas dari Keuangan: ${note}` : 'Dibayar dari modul Keuangan',
            recordedById: session.user.id,
            paymentTxId: tx.id,
          }
        });
        remainingPayAmount -= payToThisFine;
      }
    }
  }

  // Create notification in DB
  try {
    if (isPartial) {
      const remainingAmount = targetAmount - payAmount;
      await createNotification({
        userId: bill.userId,
        title: 'Pembayaran Sebagian Tagihan',
        message: `Pembayaran sebagian sebesar Rp${payAmount.toLocaleString('id-ID')} untuk tagihan "${bill.title}" telah diterima. Sisa tagihan Anda adalah Rp${remainingAmount.toLocaleString('id-ID')}.`,
        type: 'TAGIHAN_REMINDER',
        referenceId: bill.id,
      });
    } else {
      await createNotification({
        userId: bill.userId,
        title: 'Konfirmasi Pembayaran Tagihan',
        message: `Terima kasih! Tagihan Anda sebesar Rp${payAmount.toLocaleString('id-ID')} untuk "${bill.title}" telah dikonfirmasi LUNAS oleh Bendahara.`,
        type: 'TAGIHAN_REMINDER',
        referenceId: bill.id,
      });
    }
  } catch (err) {
    console.error('Failed to create notification for bill payment:', err);
  }

  revalidatePath('/admin/keuangan');
  revalidatePath('/admin/kebersihan/laporan');
  revalidatePath('/admin/kebersihan');
  return { success: true };
}

export async function cancelBill(billId: string) {
  const session = await authorizeFinance('bill:update');

  const bill = await db.bill.findUnique({
    where: { id: billId },
    include: { transaction: true },
  });

  if (!bill) {
    throw new Error('Tagihan tidak ditemukan');
  }

  // Update bill status to DIBATALKAN
  await db.bill.update({
    where: { id: billId },
    data: {
      status: 'DIBATALKAN',
    },
  });

  // If there was an associated transaction, delete it
  if (bill.transaction) {
    // Delete any associated FinePayments first
    await db.finePayment.deleteMany({
      where: { paymentTxId: bill.transaction.id }
    });
    
    await db.transaction.delete({
      where: { id: bill.transaction.id },
    });
  }

  // [Two-Way Sync] Jika jenis tagihan DENDA_PIKET dibatalkan, hapus denda terkait di Kebersihan
  if (bill.type === 'DENDA_PIKET') {
    await db.fine.deleteMany({
      where: { billId: bill.id },
    });
  }

  revalidatePath('/admin/keuangan');
  revalidatePath('/admin/kebersihan/laporan');
  revalidatePath('/admin/kebersihan');
  return { success: true };
}

export async function extendBillDueDate(billId: string) {
  const session = await authorizeFinance('bill:update');

  const bill = await db.bill.findUnique({ where: { id: billId } });
  if (!bill) throw new Error('Tagihan tidak ditemukan');

  const now = new Date();
  // Next month, day 1
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  await db.bill.update({
    where: { id: billId },
    data: {
      dueDate: nextMonth,
      note: `${bill.note || ''}\n(Izin telat: diperpanjang tanpa denda hingga awal bulan)`.trim(),
    }
  });

  revalidatePath('/admin/keuangan');
  return { success: true };
}


// ── Iuran Config ──

const iuranConfigSchema = z.object({
  baseAmount: z.number().int().min(0, 'Harga tidak boleh negatif'),
  wifiAddon: z.number().int().min(0, 'Harga tidak boleh negatif'),
});

export async function updateIuranConfig(data: { baseAmount: number; wifiAddon: number }) {
  const session = await authorizeFinance('bill:update');
  const v = iuranConfigSchema.parse(data);

  const existing = await db.iuranConfig.findFirst();
  if (existing) {
    await db.iuranConfig.update({
      where: { id: existing.id },
      data: { baseAmount: v.baseAmount, wifiAddon: v.wifiAddon },
    });
  } else {
    await db.iuranConfig.create({
      data: { baseAmount: v.baseAmount, wifiAddon: v.wifiAddon },
    });
  }

  revalidatePath('/admin/keuangan');
  return { success: true };
}
