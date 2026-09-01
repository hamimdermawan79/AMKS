"use server";

import { revalidatePath } from "next/cache";
import { db as prisma } from "@/lib/db";
import { canFromSession, isSuperAdmin } from "@/lib/rbac/can";
import { auth } from "@/lib/auth";
import { Division, MeetingType, MeetingStatus, MeetingRole, AttendanceStatus } from "@prisma/client";

async function authorizeManageKesekretariatan() {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized: Silakan login terlebih dahulu");
  }

  const [canMeeting, canSekretaris, isSuper] = await Promise.all([
    canFromSession('meeting:create'),
    canFromSession('division:manage:sekretaris'),
    isSuperAdmin({ id: session.user.id, username: session.user.username }),
  ]);

  if (!canMeeting && !canSekretaris && !isSuper) {
    throw new Error("Akses ditolak: Anda tidak memiliki izin mengelola Kesekretariatan & Notulensi");
  }

  return session;
}

// =======================
// INTERNAL MEETINGS
// =======================

export async function createInternalMeeting(data: {
  title: string;
  scheduledAt: string;
  leaderId?: string;
  noteTakerId?: string;
}) {
  await authorizeManageKesekretariatan();
  try {
    const meeting = await prisma.meeting.create({
      data: {
        title: data.title,
        type: "INTERNAL",
        scheduledAt: new Date(data.scheduledAt),
        leaderId: data.leaderId || null,
        noteTakerId: data.noteTakerId || null,
      },
    });
    revalidatePath("/admin/kesekretariatan");
    return { success: true, meetingId: meeting.id };
  } catch (error: any) {
    throw new Error(error.message || "Gagal membuat rapat internal");
  }
}

export async function updateMeetingStatus(meetingId: string, status: MeetingStatus) {
  await authorizeManageKesekretariatan();
  try {
    await prisma.meeting.update({
      where: { id: meetingId },
      data: { status },
    });
    revalidatePath("/admin/kesekretariatan");
    return { success: true };
  } catch (error: any) {
    throw new Error("Gagal mengubah status rapat");
  }
}

export async function deleteMeeting(meetingId: string) {
  await authorizeManageKesekretariatan();
  try {
    await prisma.meeting.delete({
      where: { id: meetingId },
    });
    revalidatePath("/admin/kesekretariatan");
    return { success: true };
  } catch (error: any) {
    throw new Error("Gagal menghapus rapat");
  }
}

// =======================
// EXTERNAL RT MEETINGS
// =======================

export async function generateRTSchedule(year: number) {
  await authorizeManageKesekretariatan();
  try {
    // Generate 12 meetings for the given year, on the 12th of each month
    const meetings = [];
    for (let month = 0; month < 12; month++) {
      const scheduledAt = new Date(year, month, 12, 19, 30); // e.g. 19:30 PM
      meetings.push({
        title: `Rapat RT 12 - ${scheduledAt.toLocaleDateString("id-ID", { month: "long", year: "numeric" })}`,
        type: "EKSTERNAL_RT" as MeetingType,
        scheduledAt,
      });
    }

    await prisma.meeting.createMany({
      data: meetings,
    });
    revalidatePath("/admin/kesekretariatan");
    return { success: true };
  } catch (error: any) {
    throw new Error("Gagal membuat jadwal RT tahunan");
  }
}

export async function updateRTMeeting(meetingId: string, data: { scheduledAt: string }) {
  await authorizeManageKesekretariatan();
  try {
    await prisma.meeting.update({
      where: { id: meetingId },
      data: {
        scheduledAt: new Date(data.scheduledAt),
      },
    });
    revalidatePath("/admin/kesekretariatan");
    return { success: true };
  } catch (error: any) {
    throw new Error("Gagal mengubah jadwal RT");
  }
}

export async function setRTDelegates(meetingId: string, delegateIds: string[]) {
  await authorizeManageKesekretariatan();
  try {
    // Hapus delegasi lama
    await prisma.meetingAttendance.deleteMany({
      where: { meetingId, role: "DELEGASI" },
    });

    // Tambahkan delegasi baru
    if (delegateIds.length > 0) {
      await prisma.meetingAttendance.createMany({
        data: delegateIds.map((userId) => ({
          meetingId,
          userId,
          role: "DELEGASI",
        })),
      });
    }
    revalidatePath("/admin/kesekretariatan");
    return { success: true };
  } catch (error: any) {
    throw new Error("Gagal mengatur delegasi RT");
  }
}

// =======================
// NOTES & ACTION ITEMS
// =======================

export async function saveMeetingNote(data: {
  id?: string; // If updating
  meetingId: string;
  division?: Division | null;
  content: string;
  evaluation?: string;
}) {
  await authorizeManageKesekretariatan();
  try {
    if (data.id) {
      await prisma.meetingNote.update({
        where: { id: data.id },
        data: {
          content: data.content,
          evaluation: data.evaluation,
        },
      });
    } else {
      await prisma.meetingNote.create({
        data: {
          meetingId: data.meetingId,
          division: data.division || null,
          content: data.content,
          evaluation: data.evaluation,
        },
      });
    }
    revalidatePath("/admin/kesekretariatan");
    return { success: true };
  } catch (error: any) {
    throw new Error("Gagal menyimpan notulensi");
  }
}

export async function saveActionItem(data: {
  id?: string;
  meetingId: string;
  title: string;
  picId?: string;
  deadline?: string;
  isCompleted?: boolean;
}) {
  await authorizeManageKesekretariatan();
  try {
    if (data.id) {
      await prisma.actionItem.update({
        where: { id: data.id },
        data: {
          title: data.title,
          picId: data.picId || null,
          deadline: data.deadline ? new Date(data.deadline) : null,
          isCompleted: data.isCompleted,
        },
      });
    } else {
      await prisma.actionItem.create({
        data: {
          meetingId: data.meetingId,
          title: data.title,
          picId: data.picId || null,
          deadline: data.deadline ? new Date(data.deadline) : null,
        },
      });
    }
    revalidatePath("/admin/kesekretariatan");
    return { success: true };
  } catch (error: any) {
    throw new Error("Gagal menyimpan action item");
  }
}

export async function deleteActionItem(id: string) {
  await authorizeManageKesekretariatan();
  try {
    await prisma.actionItem.delete({
      where: { id },
    });
    revalidatePath("/admin/kesekretariatan");
    return { success: true };
  } catch (error: any) {
    throw new Error("Gagal menghapus action item");
  }
}

export async function saveMeetingAttendances(meetingId: string, attendances: { userId: string, status: AttendanceStatus, role?: MeetingRole }[]) {
  await authorizeManageKesekretariatan();
  try {
    // Upsert or delete-insert is easier
    await prisma.meetingAttendance.deleteMany({
      where: { meetingId },
    });
    
    if (attendances.length > 0) {
      await prisma.meetingAttendance.createMany({
        data: attendances.map(a => ({
          meetingId,
          userId: a.userId,
          status: a.status,
          role: a.role || "PESERTA",
        })),
      });
    }
    revalidatePath("/admin/kesekretariatan");
    return { success: true };
  } catch (error: any) {
    throw new Error("Gagal menyimpan daftar hadir");
  }
}

