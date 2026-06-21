import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { canFromSession } from '@/lib/rbac/can';

export default async function KeuanganPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  const allowed = await canFromSession('finance:read');
  if (!allowed) {
    redirect('/user');
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Keuangan Asrama
        </h1>
        <p className="text-muted-foreground">
          Kelola pemasukan, pengeluaran, tagihan, dan laporan keuangan
        </p>
      </div>

      <div className="bg-white border border-border p-8">
        <div className="mb-6">
          <div className="inline-block px-3 py-1 bg-blue-50 text-blue-700 text-sm font-medium mb-4">
            FASE 5 - IN DEVELOPMENT
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-3">
            Finance Management System
          </h2>
          <p className="text-sm text-muted-foreground mb-6">
            Sistem manajemen keuangan terintegrasi untuk pemasukan, pengeluaran, dan laporan finansial asrama.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border border-border p-4">
            <h3 className="font-medium text-foreground mb-2">Financial Dashboard</h3>
            <p className="text-sm text-muted-foreground">Overview statistik dengan linechart pemasukan/pengeluaran</p>
          </div>
          <div className="border border-border p-4">
            <h3 className="font-medium text-foreground mb-2">Transaction Management</h3>
            <p className="text-sm text-muted-foreground">CRUD transaksi keuangan dengan kategorisasi</p>
          </div>
          <div className="border border-border p-4">
            <h3 className="font-medium text-foreground mb-2">Bills & Invoices</h3>
            <p className="text-sm text-muted-foreground">Kelola tagihan dan iuran warga dengan detail per user</p>
          </div>
          <div className="border border-border p-4">
            <h3 className="font-medium text-foreground mb-2">Settlement System</h3>
            <p className="text-sm text-muted-foreground">Tandai pelunasan manual oleh Bendahara</p>
          </div>
          <div className="border border-border p-4">
            <h3 className="font-medium text-foreground mb-2">Financial Reports</h3>
            <p className="text-sm text-muted-foreground">Generate laporan keuangan periode tertentu</p>
          </div>
          <div className="border border-border p-4">
            <h3 className="font-medium text-foreground mb-2">User Accounts</h3>
            <p className="text-sm text-muted-foreground">Detail keuangan per warga (utang, riwayat pembayaran)</p>
          </div>
        </div>
      </div>
    </div>
  );
}
