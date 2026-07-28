import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { redirect } from 'next/navigation';
import WhatsAppBotClient from './WhatsAppClient';

export default async function WhatsAppBotPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  // Check if user has SUPERADMIN or KETUA role
  const userWithRoles = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      roles: {
        select: {
          role: { select: { name: true } },
        },
      },
    },
  });

  const roleNames = userWithRoles?.roles.map((r) => r.role.name) ?? [];
  const isFullAccess = roleNames.includes('SUPERADMIN') || roleNames.includes('KETUA');

  if (!isFullAccess) {
    redirect('/user');
  }

  return (
    <div className="max-w-4xl mx-auto">
      <WhatsAppBotClient />
    </div>
  );
}
