import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db as prisma } from "@/lib/db";
import KesekretariatanClient from "./KesekretariatanClient";

export default async function KesekretariatanPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');
  const user = session.user;

  // Fetch all warga for dropdowns
  const wargaList = await prisma.user.findMany({
    where: { status: "AKTIF" },
    select: { id: true, fullName: true, username: true },
    orderBy: { fullName: "asc" },
  });

  // Fetch internal meetings
  const internalMeetings = await prisma.meeting.findMany({
    where: { type: "INTERNAL" },
    orderBy: { scheduledAt: "desc" },
    include: {
      leader: { select: { id: true, fullName: true } },
      noteTaker: { select: { id: true, fullName: true } },
      notes: true,
      actionItems: {
        include: {
          pic: { select: { id: true, fullName: true } }
        }
      },
      attendances: {
        include: {
          user: { select: { id: true, fullName: true, username: true } }
        }
      },
    },
  });

  // Fetch external RT meetings
  const externalMeetings = await prisma.meeting.findMany({
    where: { type: "EKSTERNAL_RT" },
    orderBy: { scheduledAt: "asc" },
    include: {
      notes: true,
      attendances: {
        include: {
          user: { select: { id: true, fullName: true, username: true } }
        }
      },
    },
  });

  return (
    <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
      <KesekretariatanClient 
        wargaList={wargaList}
        internalMeetings={internalMeetings}
        externalMeetings={externalMeetings}
        currentUserId={user.id}
      />
    </div>
  );
}
