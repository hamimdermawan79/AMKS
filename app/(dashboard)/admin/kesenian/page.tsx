import { auth } from '@/lib/auth';
import type { Metadata } from 'next';export const metadata: Metadata = {  robots: { index: false, follow: false },};
import { redirect } from 'next/navigation';
import { canFromSession } from '@/lib/rbac/can';
import { db } from '@/lib/db';
import KesenianManager from './KesenianManager';

export default async function KesenianPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  const canManage = await canFromSession('division:manage:kesenian', 'KESENIAN');

  // Query Kesenian announcements
  const announcements = await db.announcement.findMany({
    where: { division: 'KESENIAN' },
    orderBy: [
      { pinned: 'desc' },
      { createdAt: 'desc' },
    ],
  });

  // Query Kesenian activities (entertainment events)
  const activities = await db.activity.findMany({
    where: { division: 'KESENIAN' },
    orderBy: {
      createdAt: 'desc',
    },
  });

  // Query general posts (since kesenian manages active publications/posts of the dorm)
  const posts = await db.post.findMany({
    orderBy: {
      createdAt: 'desc',
    },
    take: 10,
  });

  return (
    <div className="max-w-6xl mx-auto">
      <KesenianManager
        posts={posts}
        activities={activities}
        announcements={announcements}
        canManage={canManage}
      />
    </div>
  );
}
