import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import AccountSettingsClient from './AccountSettingsClient';

export default async function AccountSettingsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  const userRecord = await db.user.findUnique({
    where: { id: session.user.id },
    select: { phone: true, status: true },
  });

  const user = {
    id: session.user.id,
    username: session.user.username,
    fullName: session.user.fullName,
    phone: userRecord?.phone || '',
    status: session.user.status,
  };

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground mb-1">Pengaturan Akun</h1>
        <p className="text-sm text-muted-foreground">
          Kelola kata sandi dan informasi akun Anda
        </p>
      </div>

      <AccountSettingsClient user={user} />
    </div>
  );
}
