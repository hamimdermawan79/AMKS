"use server";

import { revalidatePath } from "next/cache";
import { db as prisma } from "@/lib/db";
import { canFromSession, isSuperAdmin } from "@/lib/rbac/can";
import { auth } from "@/lib/auth";
import { Division, MeetingType, MeetingStatus, MeetingRole, AttendanceStatus } from "@prisma/client";
import { createNotification } from "@/lib/notifications";

async function authorizeManageKesekretariatan(requireCreate = false) {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized: Silakan login terlebih dahulu");
  }

  const [canMeetingCreate, canMeetingUpdate, canSekretaris, isSuper] = await Promise.all([
    canFromSession('meeting:create'),
    canFromSession('meeting:update'),
    canFromSession('division:manage:sekretaris'),
    isSuperAdmin({ id: session.user.id, username: session.user.username }),
  ]);

  if (requireCreate) {
    if (!canMeetingCreate && !canSekretaris && !isSuper) {
      throw new Error("Akses ditolak: Anda tidak memiliki izin membuat/menghapus agenda rapat");
    }
  } else {
    if (!canMeetingCreate && !canMeetingUpdate && !canSekretaris && !isSuper) {
      throw new Error("Akses ditolak: Anda tidak memiliki izin mengelola Kesekretariatan & Notulensi");
    }
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
  await authorizeManageKesekretariatan(true);
  try {
    const scheduledDate = new Date(data.scheduledAt);
    const meeting = await prisma.meeting.create({
      data: {
        title: data.title,
        type: "INTERNAL",
        scheduledAt: scheduledDate,
        leaderId: data.leaderId || null,
        noteTakerId: data.noteTakerId || null,
      },
      include: {
        leader: { select: { fullName: true } },
        noteTaker: { select: { fullName: true } },
      },
    });

    // Broadcast agenda rapat baru ke seluruh warga aktif
    try {
      const activeUsers = await prisma.user.findMany({
        where: {
          status: 'AKTIF',
          roles: { none: { role: { name: { in: ['SUPERADMIN', 'ALUMNI'] } } } },
        },
        select: { id: true },
      });

      const dateStr = scheduledDate.toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        timeZone: 'Asia/Jakarta',
      });
      const timeStr = scheduledDate.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Jakarta',
      });

      const msg = `*📢 AGENDA RAPAT BARU TERJADWAL 📢*\n\n` +
        `Assalamu'alaikum Wr. Wb.\n` +
        `Diberitahukan kepada seluruh Warga Asrama AMKS, agenda rapat baru telah dijadwalkan:\n\n` +
        `📋 *${meeting.title}*\n` +
        `🗓️ Waktu: *${dateStr}* (Pukul ${timeStr} WIB)\n` +
        `📍 Tempat: Asrama AMKS\n` +
        (meeting.leader?.fullName ? `👤 Pemimpin: ${meeting.leader.fullName}\n` : '') +
        (meeting.noteTaker?.fullName ? `📝 Notulis: ${meeting.noteTaker.fullName}\n` : '') +
        `\nMohon seluruh warga mencatat tanggal pelaksanaan dan hadir tepat waktu. Terima kasih!\n\n` +
        `_Pengurus Asrama AMKS (Kesekretariatan)_`;

      for (const u of activeUsers) {
        await createNotification({
          userId: u.id,
          title: `Agenda Rapat Baru: ${meeting.title}`,
          message: msg,
          type: 'RAPAT_REMINDER',
          referenceId: `NEW_MEETING:${meeting.id}`,
        });
      }
    } catch (broadcastErr) {
      console.error('Failed to broadcast new meeting notification:', broadcastErr);
    }

    revalidatePath("/admin/kesekretariatan");
    revalidatePath("/user");
    revalidatePath("/notifications");
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

async function authorizeSaveMeetingNote(meetingId: string) {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized: Silakan login terlebih dahulu");
  }

  const [canMeetingCreate, canMeetingUpdate, canSekretaris, isSuper] = await Promise.all([
    canFromSession('meeting:create'),
    canFromSession('meeting:update'),
    canFromSession('division:manage:sekretaris'),
    isSuperAdmin({ id: session.user.id, username: session.user.username }),
  ]);

  if (canMeetingCreate || canMeetingUpdate || canSekretaris || isSuper) {
    return session;
  }

  // Khusus Rapat RT (EKSTERNAL_RT): Delegasi resmi yang ditugaskan berhak mencatat notulensi
  const meeting = await prisma.meeting.findUnique({
    where: { id: meetingId },
    select: {
      type: true,
      attendances: {
        where: {
          userId: session.user.id,
          role: 'DELEGASI',
        },
        select: { id: true },
      },
    },
  });

  const isDelegate = meeting?.type === 'EKSTERNAL_RT' && (meeting.attendances?.length ?? 0) > 0;
  if (isDelegate) {
    return session;
  }

  throw new Error("Akses ditolak: Anda tidak memiliki izin mencatat notulensi rapat ini");
}

export async function saveMeetingNote(data: {
  id?: string; // If updating
  meetingId: string;
  division?: Division | null;
  content: string;
  evaluation?: string;
}) {
  await authorizeSaveMeetingNote(data.meetingId);
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

// ============================================================
// PRESENSI MANDIRI RAPAT BULANAN (SELF ATTENDANCE & APPROVAL)
// ============================================================

export async function submitMeetingSelfAttendance(data: {
  meetingId: string;
  attendAs: string;
  ideas?: string;
  evaluation?: string;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Silakan login terlebih dahulu untuk melakukan presensi.");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, status: true, fullName: true },
  });

  if (!user || user.status !== "AKTIF") {
    throw new Error("Hanya warga atau calon warga aktif yang dapat melakukan presensi.");
  }

  const meeting = await prisma.meeting.findUnique({
    where: { id: data.meetingId },
  });

  if (!meeting) {
    throw new Error("Agenda rapat tidak ditemukan.");
  }

  // Validasi waktu presensi:
  // Presensi dimulai mengikuti waktu rapat yang terdaftar dan selesai pada jam 12 malam (23:59:59 WIB)
  const now = new Date();
  const nowWib = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));
  const meetingWib = new Date(new Date(meeting.scheduledAt).toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));

  const meetingDayEnd = new Date(meetingWib);
  meetingDayEnd.setHours(23, 59, 59, 999);

  if (nowWib < meetingWib) {
    const timeStr = meetingWib.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });
    throw new Error(`Presensi belum dibuka. Presensi dibuka mulai pukul ${timeStr} WIB saat rapat dimulai.`);
  }

  if (nowWib > meetingDayEnd) {
    throw new Error("Presensi telah ditutup. Batas waktu presensi berakhir pada pukul 23:59 WIB pada hari rapat.");
  }

  try {
    const attendance = await prisma.meetingAttendance.upsert({
      where: {
        meetingId_userId: {
          meetingId: data.meetingId,
          userId: user.id,
        },
      },
      update: {
        isSelfAttendance: true,
        attendAs: data.attendAs.trim(),
        ideas: data.ideas?.trim() || null,
        evaluation: data.evaluation?.trim() || null,
        submittedAt: new Date(),
        status: "HADIR",
        isApproved: null, // Reset ke pending jika revisi
      },
      create: {
        meetingId: data.meetingId,
        userId: user.id,
        role: "PESERTA",
        status: "HADIR",
        isSelfAttendance: true,
        attendAs: data.attendAs.trim(),
        ideas: data.ideas?.trim() || null,
        evaluation: data.evaluation?.trim() || null,
        submittedAt: new Date(),
        isApproved: null,
      },
    });

    revalidatePath("/admin/kesekretariatan");
    revalidatePath("/user");
    return {
      success: true,
      message: "Presensi berhasil dikirim. Menunggu verifikasi dari Sekretaris.",
      attendanceId: attendance.id,
    };
  } catch (error: any) {
    console.error("Failed to submit self attendance:", error);
    throw new Error(error.message || "Gagal mengirim presensi rapat.");
  }
}

export async function approveMeetingAttendance(data: {
  attendanceId: string;
  isApproved: boolean;
}) {
  const session = await authorizeManageKesekretariatan();

  try {
    const attendance = await prisma.meetingAttendance.update({
      where: { id: data.attendanceId },
      data: {
        isApproved: data.isApproved,
        status: data.isApproved ? "HADIR" : "TIDAK_HADIR",
        approvedById: session.user.id,
        approvedAt: new Date(),
      },
      include: {
        meeting: { select: { title: true } },
        user: { select: { id: true, fullName: true } },
      },
    });

    // Beri notifikasi ke warga jika presensi disetujui / ditolak
    try {
      await createNotification({
        userId: attendance.userId,
        title: data.isApproved ? "Presensi Rapat Disetujui" : "Presensi Rapat Ditolak",
        message: data.isApproved
          ? `Presensi mandiri Anda pada agenda rapat "${attendance.meeting.title}" telah disetujui oleh Sekretaris.`
          : `Presensi mandiri Anda pada agenda rapat "${attendance.meeting.title}" ditolak oleh Sekretaris. Silakan hubungi Sekretaris jika ada kekeliruan.`,
        type: "RAPAT_REMINDER",
        referenceId: `ATT_APPROVE:${attendance.id}`,
      });
    } catch (notifErr) {
      console.error("Failed to notify user about attendance approval:", notifErr);
    }

    revalidatePath("/admin/kesekretariatan");
    revalidatePath("/user");
    return { success: true };
  } catch (error: any) {
    throw new Error(error.message || "Gagal memverifikasi presensi.");
  }
}

export async function bulkApproveMeetingAttendances(data: {
  attendanceIds: string[];
  isApproved: boolean;
}) {
  const session = await authorizeManageKesekretariatan();

  if (!data.attendanceIds || data.attendanceIds.length === 0) {
    return { success: true, count: 0 };
  }

  try {
    const now = new Date();
    await prisma.meetingAttendance.updateMany({
      where: {
        id: { in: data.attendanceIds },
      },
      data: {
        isApproved: data.isApproved,
        status: data.isApproved ? "HADIR" : "TIDAK_HADIR",
        approvedById: session.user.id,
        approvedAt: now,
      },
    });

    revalidatePath("/admin/kesekretariatan");
    revalidatePath("/user");
    return { success: true, count: data.attendanceIds.length };
  } catch (error: any) {
    throw new Error(error.message || "Gagal memproses approval massal.");
  }
}


