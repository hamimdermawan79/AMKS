import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createNotification } from '@/lib/notifications';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Max execution time for Vercel/Serverless

const formatRp = (value: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(value);
};

export async function GET(request: Request) {
  try {
    // 1. Otorisasi Keamanan
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      return NextResponse.json(
        { error: 'CRON_SECRET environment variable is not configured on the server.' },
        { status: 500 }
      );
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Periksa aturan kelipatan tanggal 5 (5, 10, 15, 20, 25, 30)
    const today = new Date();
    const dateNum = today.getDate();
    
    const url = new URL(request.url);
    const force = url.searchParams.get('force') === 'true';

    if (dateNum % 5 !== 0 && !force) {
      return NextResponse.json({
        success: true,
        message: `Hari ini tanggal ${dateNum} (bukan kelipatan 5). Pengiriman pengingat otomatis dilewati. Gunakan parameter ?force=true untuk memicu manual.`,
      });
    }

    // 3. Ambil semua tagihan BELUM_LUNAS
    const unpaidBills = await db.bill.findMany({
      where: {
        status: 'BELUM_LUNAS',
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            phone: true,
          },
        },
      },
    });

    if (unpaidBills.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Tidak ada tagihan tertunggak (Belum Lunas) saat ini.',
        sentCount: 0,
      });
    }

    // 4. Kelompokkan tagihan per user
    const userBillsMap: Record<string, {
      user: { id: string; fullName: string; phone: string | null };
      bills: typeof unpaidBills;
    }> = {};

    for (const bill of unpaidBills) {
      const uId = bill.userId;
      if (!userBillsMap[uId]) {
        userBillsMap[uId] = {
          user: bill.user,
          bills: [],
        };
      }
      userBillsMap[uId].bills.push(bill);
    }

    // 5. Buat notifikasi (In-App & WA queue) untuk setiap user
    let sentCount = 0;
    for (const uId of Object.keys(userBillsMap)) {
      const group = userBillsMap[uId];
      
      // Hitung total dengan denda telat jika ada
      const totalAmount = group.bills.reduce((sum, b) => {
        const isLate = b.status === 'BELUM_LUNAS' && b.dueDate && today > new Date(b.dueDate) && b.type === 'IURAN';
        const amount = isLate ? Math.floor(b.amount * 1.2) : b.amount;
        return sum + amount;
      }, 0);

      // Susun list tagihan
      const billDetails = group.bills.map((b, idx) => {
        const isLate = b.status === 'BELUM_LUNAS' && b.dueDate && today > new Date(b.dueDate) && b.type === 'IURAN';
        const amount = isLate ? Math.floor(b.amount * 1.2) : b.amount;
        return `${idx + 1}. *${b.title}* (${formatRp(amount)})${isLate ? ' _(Nunggak + Bunga 20%)_' : ''}`;
      }).join('\n');

      const message = `Halo *${group.user.fullName}*,\n\nIni adalah pesan pengingat tagihan keuangan Anda di Asrama AMKS.\n\nSaat ini Anda memiliki *${group.bills.length} tagihan belum lunas* dengan akumulasi total tunggakan sebesar *${formatRp(totalAmount)}*.\n\n*Rincian Tagihan:*\n${billDetails}\n\nMohon untuk segera melakukan pembayaran atau menghubungi Bendahara Asrama untuk konfirmasi pelunasan.\n\nTerima kasih atas kerja samanya. 🙏`;

      await createNotification({
        userId: uId,
        title: 'Pengingat Tagihan Keuangan',
        message,
        type: 'TAGIHAN_REMINDER',
      });
      
      sentCount++;
    }

    return NextResponse.json({
      success: true,
      message: `Berhasil memproses dan mengantrekan pengingat tagihan untuk ${sentCount} warga.`,
      sentCount,
      totalUnpaidBills: unpaidBills.length,
    });

  } catch (error) {
    console.error('Bill reminder cron error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
