import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import AccountSettingsClient from './AccountSettingsClient';

export default async function AccountSettingsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  const user = {
    id: session.user.id,
    username: session.user.username,
    fullName: session.user.fullName,
    phone: '',
    status: session.user.status,
    jabatan: session.user.jabatan,
  };

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground mb-1">Pengaturan Akun</h1>
        <p className="text-sm text-muted-foreground">
          Perbarui informasi pribadi dan kata sandi Anda
        </p>
      </div>

      <AccountSettingsClient user={user} />
    </div>
  );
}
