import { Metadata } from 'next';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { canFromSession } from '@/lib/rbac/can';
import SuratManager from './SuratManager';

export const metadata: Metadata = {
  title: 'Surat Menyurat - Admin AMKS',
};

export default async function SekretarisSuratPage() {
  const session = await auth();
  if (!session?.user) redirect('/auth/signin');

  const hasAccess = await canFromSession('division:manage:sekretaris');
  const canReadTemplate = await canFromSession('letter_template:read');

  if (!hasAccess && !canReadTemplate) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Akses Ditolak</h1>
        <p className="text-muted-foreground">Anda tidak memiliki izin untuk mengakses halaman Surat Menyurat.</p>
      </div>
    );
  }

  const [canCreateTemplate, canDeleteTemplate, canCreateLetter, canUpdateLetter, canDeleteLetter] = await Promise.all([
    canFromSession('letter_template:create'),
    canFromSession('letter_template:delete'),
    canFromSession('letter:create'),
    canFromSession('letter:update'),
    canFromSession('letter:delete'),
  ]);

  const [templates, letters] = await Promise.all([
    db.letterTemplate.findMany({ orderBy: { createdAt: 'desc' } }),
    db.letter.findMany({ orderBy: { date: 'desc' } }),
  ]);

  return (
    <div className="p-6 max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">Surat Menyurat</h1>
        <p className="text-slate-600 mt-2">
          Kelola format surat (untuk diunduh warga) dan arsip surat masuk/keluar asrama.
        </p>
      </div>

      <SuratManager
        templates={templates}
        letters={letters}
        canCreateTemplate={canCreateTemplate}
        canDeleteTemplate={canDeleteTemplate}
        canCreateLetter={canCreateLetter}
        canUpdateLetter={canUpdateLetter}
        canDeleteLetter={canDeleteLetter}
      />
    </div>
  );
}
