import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db as prisma } from "@/lib/db";
import { canFromSession, isSuperAdmin } from "@/lib/rbac/can";
import KesekretariatanClient from "./KesekretariatanClient";

export const dynamic = 'force-dynamic';

export default async function KesekretariatanPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');
  const user = session.user;

  // Authorization check: SuperAdmin, Ketua, Sekretaris, Bendahara, Division Heads
  const [canManageMeeting, canUpdateMeeting, canManageSekretaris, isSuper] = await Promise.all([
    canFromSession('meeting:create'),
    canFromSession('meeting:update'),
    canFromSession('division:manage:sekretaris'),
    isSuperAdmin({ id: user.id, username: user.username }),
  ]);

  const canManage = canManageMeeting || canUpdateMeeting || canManageSekretaris || isSuper;

  // Fetch all warga for dropdowns (exclude SUPERADMIN)
  const wargaList = await prisma.user.findMany({
    where: {
      status: "AKTIF",
      roles: { none: { role: { name: "SUPERADMIN" } } },
    },
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
          user: { select: { id: true, fullName: true, username: true } },
          approvedBy: { select: { id: true, fullName: true } },
        },
        orderBy: { submittedAt: "desc" },
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

  // Serialize to plain JSON-safe objects (ISO string dates for RSC flight transfer)
  const serializedInternalMeetings = internalMeetings.map((m) => ({
    id: m.id,
    title: m.title,
    status: m.status,
    type: m.type,
    location: m.location,
    leaderId: m.leaderId,
    noteTakerId: m.noteTakerId,
    scheduledAt: m.scheduledAt ? m.scheduledAt.toISOString() : new Date().toISOString(),
    createdAt: m.createdAt ? m.createdAt.toISOString() : new Date().toISOString(),
    updatedAt: m.updatedAt ? m.updatedAt.toISOString() : new Date().toISOString(),
    leader: m.leader ? { id: m.leader.id, fullName: m.leader.fullName } : null,
    noteTaker: m.noteTaker ? { id: m.noteTaker.id, fullName: m.noteTaker.fullName } : null,
    notes: (m.notes || []).map((n) => ({
      id: n.id,
      meetingId: n.meetingId,
      division: n.division,
      content: n.content,
      evaluation: n.evaluation,
    })),
    actionItems: (m.actionItems || []).map((a) => ({
      id: a.id,
      meetingId: a.meetingId,
      title: a.title,
      picId: a.picId,
      deadline: a.deadline ? a.deadline.toISOString() : null,
      isCompleted: a.isCompleted,
      pic: a.pic ? { id: a.pic.id, fullName: a.pic.fullName } : null,
    })),
    attendances: (m.attendances || []).map((att) => ({
      id: att.id,
      meetingId: att.meetingId,
      userId: att.userId,
      role: att.role,
      status: att.status,
      isSelfAttendance: att.isSelfAttendance,
      attendAs: att.attendAs,
      ideas: att.ideas,
      evaluation: att.evaluation,
      submittedAt: att.submittedAt ? att.submittedAt.toISOString() : null,
      isApproved: att.isApproved,
      approvedById: att.approvedById,
      approvedAt: att.approvedAt ? att.approvedAt.toISOString() : null,
      user: att.user ? { id: att.user.id, fullName: att.user.fullName, username: att.user.username } : null,
      approvedBy: att.approvedBy ? { id: att.approvedBy.id, fullName: att.approvedBy.fullName } : null,
    })),
  }));

  const serializedExternalMeetings = externalMeetings.map((m) => ({
    id: m.id,
    title: m.title,
    status: m.status,
    type: m.type,
    location: m.location,
    scheduledAt: m.scheduledAt ? m.scheduledAt.toISOString() : new Date().toISOString(),
    createdAt: m.createdAt ? m.createdAt.toISOString() : new Date().toISOString(),
    updatedAt: m.updatedAt ? m.updatedAt.toISOString() : new Date().toISOString(),
    notes: (m.notes || []).map((n) => ({
      id: n.id,
      meetingId: n.meetingId,
      division: n.division,
      content: n.content,
      evaluation: n.evaluation,
    })),
    attendances: (m.attendances || []).map((att) => ({
      id: att.id,
      meetingId: att.meetingId,
      userId: att.userId,
      role: att.role,
      status: att.status,
      isSelfAttendance: att.isSelfAttendance,
      attendAs: att.attendAs,
      ideas: att.ideas,
      evaluation: att.evaluation,
      submittedAt: att.submittedAt ? att.submittedAt.toISOString() : null,
      isApproved: att.isApproved,
      approvedById: att.approvedById,
      approvedAt: att.approvedAt ? att.approvedAt.toISOString() : null,
      user: att.user ? { id: att.user.id, fullName: att.user.fullName, username: att.user.username } : null,
    })),
  }));

  return (
    <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
      <KesekretariatanClient 
        wargaList={wargaList}
        internalMeetings={serializedInternalMeetings}
        externalMeetings={serializedExternalMeetings}
        currentUserId={user.id}
        canManage={canManage}
      />
    </div>
  );
}
