'use server';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { canFromSession } from '@/lib/rbac/can';
import { AttendanceStatus } from '@prisma/client';
import { createNotification, processNotificationQueue } from '@/lib/notifications';

// ============================================================
// HELPERS
// ============================================================

async function requireSession() {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');
  return session;
}

function getMonthYear(date: Date) {
  return { month: date.getMonth() + 1, year: date.getFullYear() };
}

// ============================================================
// PIKET MALAM: GENERATE JADWAL BULANAN
// ============================================================

/**
 * Buat jadwal piket keamanan untuk rentang tanggal tertentu dan daftar peserta terpilih.
 * Distribusi peserta diputar secara round-robin (adil & bergiliran).
 */
export async function generateSecurityDutyPeriod(params: {
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  selectedUserIds: string[];
}) {
  const session = await requireSession();
  const canManage =
    (await canFromSession('division:manage:keamanan', 'KEAMANAN')) ||
    (await canFromSession('security:duty:manage'));
  if (!canManage) throw new Error('Tidak memiliki akses.');

  if (!params.startDate || !params.endDate) {
    throw new Error('Tanggal mulai dan tanggal selesai wajib diisi.');
  }

  const [sYear, sMonth, sDay] = params.startDate.split('-').map(Number);
  const [eYear, eMonth, eDay] = params.endDate.split('-').map(Number);
  const start = new Date(sYear, sMonth - 1, sDay, 0, 0, 0);
  const end = new Date(eYear, eMonth - 1, eDay, 0, 0, 0);

  if (start > end) {
    throw new Error('Tanggal mulai tidak boleh melebihi tanggal selesai.');
  }

  if (!params.selectedUserIds || params.selectedUserIds.length === 0) {
    throw new Error('Pilih minimal satu warga peserta piket.');
  }

  // Ambil data warga terpilih untuk validasi & notifikasi (exclude SUPERADMIN)
  const users = await db.user.findMany({
    where: {
      id: { in: params.selectedUserIds },
      status: 'AKTIF',
      roles: { none: { role: { name: 'SUPERADMIN' } } },
    },
    select: { id: true, fullName: true },
    orderBy: { fullName: 'asc' },
  });

  if (users.length === 0) throw new Error('Warga peserta piket tidak ditemukan atau tidak aktif.');

  // Jika periode pada bulan & tahun ini sudah ada, timpa / hapus yang lama
  const existing = await db.securityDutyPeriod.findUnique({
    where: { month_year: { month: sMonth, year: sYear } },
  });
  if (existing) {
    await db.securityDutyPeriod.delete({ where: { id: existing.id } });
  }

  // Buat period baru
  const period = await db.securityDutyPeriod.create({
    data: {
      month: sMonth,
      year: sYear,
      startDate: start,
      endDate: end,
      generatedById: session.user.id,
    },
  });

  // Loop setiap hari dari start sampai end
  const assignments = [];
  const cur = new Date(start);
  let dayIdx = 0;
  while (cur <= end) {
    const assignedUser = users[dayIdx % users.length];
    assignments.push({
      periodId: period.id,
      userId: assignedUser.id,
      date: new Date(cur),
    });
    cur.setDate(cur.getDate() + 1);
    dayIdx++;
  }

  await db.securityDutyAssignment.createMany({ data: assignments });

  // Kirim notifikasi WA kepada semua warga peserta yang terjadwal
  const monthName = start.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
  for (const user of users) {
    const userDays = assignments
      .filter((a) => a.userId === user.id)
      .map((a) => new Date(a.date).getDate());

    if (userDays.length === 0) continue;
    const dayList = userDays.join(', ');

    await createNotification({
      userId: user.id,
      title: `📋 Jadwal Piket Keamanan (${monthName})`,
      message: `Halo ${user.fullName}, kamu terjadwal piket keamanan malam pada tanggal: ${dayList} (${monthName}).\n\n📋 Tugas piket malam (21:00–00:00 WIB):\n• Cek pintu luar asrama\n• Cek garasi (tutup & kunci)\n• Pastikan motor di luar terkunci stang\n• Konfirmasi warga yang keluar malam\n\nPresensi dilakukan melalui aplikasi AMKS.`,
      type: 'PIKET_REMINDER',
      referenceId: `SEC_DUTY_SCHED:${user.id}:${sMonth}:${sYear}:${Date.now()}`,
    });
  }

  processNotificationQueue().catch(console.error);
  revalidatePath('/admin/keamanan');
  return { success: true, periodId: period.id, totalDays: dayIdx };
}

// ============================================================
// PIKET MALAM: PRESENSI (oleh warga yang bertugas)
// ============================================================

export async function submitSecurityAttendance(data: {
  assignmentId: string;
  doorsLocked: boolean;
  garagesClosed: boolean;
  bikesSecured: boolean;
  note?: string;
}) {
  const session = await requireSession();

  const assignment = await db.securityDutyAssignment.findUnique({
    where: { id: data.assignmentId },
    include: { attendance: true, user: true },
  });

  if (!assignment) throw new Error('Penugasan tidak ditemukan.');
  const canManage =
    (await canFromSession('division:manage:keamanan', 'KEAMANAN')) ||
    (await canFromSession('security:duty:manage'));
  if (assignment.userId !== session.user.id && !canManage) {
    throw new Error('Kamu bukan petugas untuk jadwal ini.');
  }
  if (assignment.attendance) throw new Error('Presensi sudah diisi.');

  const attendance = await db.securityDutyAttendance.create({
    data: {
      assignmentId: data.assignmentId,
      status: AttendanceStatus.HADIR,
      doorsLocked: data.doorsLocked,
      garagesClosed: data.garagesClosed,
      bikesSecured: data.bikesSecured,
      note: data.note || null,
      markedById: session.user.id,
    },
  });

  revalidatePath('/admin/keamanan');
  return { success: true, attendanceId: attendance.id };
}

// ============================================================
// PIKET MALAM: HAPUS PERIODE (admin only)
// ============================================================

export async function deleteSecurityDutyPeriod(periodId: string) {
  const canManage =
    (await canFromSession('division:manage:keamanan', 'KEAMANAN')) ||
    (await canFromSession('security:duty:manage'));
  if (!canManage) throw new Error('Tidak memiliki akses.');

  await db.securityDutyPeriod.delete({ where: { id: periodId } });
  revalidatePath('/admin/keamanan');
  return { success: true };
}

// ============================================================
// PIKET MALAM: UPDATE JADWAL (swap / ganti orang)
// ============================================================

export async function updateSecurityDutyAssignee(assignmentId: string, newUserId: string) {
  const canManage =
    (await canFromSession('division:manage:keamanan', 'KEAMANAN')) ||
    (await canFromSession('security:duty:manage'));
  if (!canManage) throw new Error('Tidak memiliki akses.');

  const assignment = await db.securityDutyAssignment.findUnique({
    where: { id: assignmentId },
    include: { attendance: true },
  });
  if (!assignment) throw new Error('Penugasan tidak ditemukan.');
  if (assignment.attendance) throw new Error('Tidak bisa mengubah jadwal yang sudah diisi presensinya.');

  const assignmentDate = new Date(assignment.date);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfAssignmentDate = new Date(assignmentDate.getFullYear(), assignmentDate.getMonth(), assignmentDate.getDate());
  if (startOfAssignmentDate < startOfToday) {
    throw new Error('Tidak bisa mengubah nama warga untuk tanggal piket yang sudah berlalu.');
  }

  await db.securityDutyAssignment.update({
    where: { id: assignmentId },
    data: { userId: newUserId },
  });

  revalidatePath('/admin/keamanan');
  return { success: true };
}

// ============================================================
// BUKU TAMU: TAMBAH
// ============================================================

export async function createGuestBookEntry(data: {
  visitorName: string;
  originCity: string;
  institution?: string;
  purpose: string;
  knownById?: string;
  knownByOther?: string;
  entryTime: string; // ISO string
  isStaying?: boolean;
  stayDuration?: number;
  note?: string;
}) {
  const session = await requireSession();

  // Hanya warga dengan permission guest:book:write yang bisa input (Ketua, Sekretaris, Keamanan)
  const canWrite = await canFromSession('guest:book:write');
  if (!canWrite) {
    throw new Error('Tidak memiliki akses untuk menambah data buku tamu.');
  }

  const entryTime = new Date(data.entryTime);
  const { month, year } = getMonthYear(entryTime);

  const entry = await db.guestBook.create({
    data: {
      visitorName: data.visitorName,
      originCity: data.originCity,
      institution: data.institution || null,
      purpose: data.purpose,
      knownById: data.knownById || null,
      knownByOther: data.knownByOther || null,
      entryTime,
      isStaying: !!data.isStaying,
      stayDuration: data.isStaying ? Number(data.stayDuration) || 1 : null,
      note: data.note || null,
      month,
      year,
      createdById: session.user.id,
    },
  });

  revalidatePath('/admin/keamanan');
  return { success: true, id: entry.id };
}

// ============================================================
// BUKU TAMU: UPDATE (isi waktu keluar / edit)
// ============================================================

export async function updateGuestBookEntry(
  id: string,
  data: Partial<{
    exitTime: string;
    note: string;
    visitorName: string;
    purpose: string;
    isStaying: boolean;
    stayDuration: number;
  }>
) {
  const canWrite = await canFromSession('guest:book:write');
  if (!canWrite) throw new Error('Tidak memiliki akses.');

  const updateData: Record<string, unknown> = {};
  if (data.exitTime) updateData.exitTime = new Date(data.exitTime);
  if (data.note !== undefined) updateData.note = data.note;
  if (data.visitorName) updateData.visitorName = data.visitorName;
  if (data.purpose) updateData.purpose = data.purpose;
  if (data.isStaying !== undefined) updateData.isStaying = data.isStaying;
  if (data.stayDuration !== undefined) updateData.stayDuration = data.stayDuration;

  await db.guestBook.update({ where: { id }, data: updateData });
  revalidatePath('/admin/keamanan');
  return { success: true };
}

// ============================================================
// BUKU TAMU: HAPUS
// ============================================================

export async function deleteGuestBookEntry(id: string) {
  const canWrite = await canFromSession('guest:book:write');
  if (!canWrite) throw new Error('Tidak memiliki akses.');

  await db.guestBook.delete({ where: { id } });
  revalidatePath('/admin/keamanan');
  return { success: true };
}

// ============================================================
// CCTV STATUS MANAGEMENT
// ============================================================

/** Get or create singleton CCTV status record */
export async function getCctvStatus() {
  let status = await db.cctvStatus.findFirst({
    include: { verifiedBy: { select: { id: true, fullName: true } } },
  });

  // Auto-create singleton if not exists
  if (!status) {
    status = await db.cctvStatus.create({
      data: { isActive: true },
      include: { verifiedBy: { select: { id: true, fullName: true } } },
    });
  }

  // Auto-deactivate if last verified more than 5 days ago
  const now = new Date();
  const daysSinceVerified = Math.floor(
    (now.getTime() - status.lastVerifiedAt.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysSinceVerified >= 5 && status.isActive) {
    status = await db.cctvStatus.update({
      where: { id: status.id },
      data: { isActive: false },
      include: { verifiedBy: { select: { id: true, fullName: true } } },
    });
  }

  return {
    id: status.id,
    isActive: status.isActive,
    lastVerifiedAt: status.lastVerifiedAt.toISOString(),
    lastMemoryCleanedAt: status.lastMemoryCleanedAt?.toISOString() || null,
    verifiedBy: status.verifiedBy ? { id: status.verifiedBy.id, fullName: status.verifiedBy.fullName } : null,
    note: status.note,
    daysSinceVerified: Math.floor(
      (now.getTime() - status.lastVerifiedAt.getTime()) / (1000 * 60 * 60 * 24)
    ),
    daysSinceMemoryCleaned: status.lastMemoryCleanedAt
      ? Math.floor((now.getTime() - status.lastMemoryCleanedAt.getTime()) / (1000 * 60 * 60 * 24))
      : null,
  };
}

/** Update CCTV status (Aktif/Nonaktif) — only role keamanan */
export async function updateCctvStatus(data: {
  isActive: boolean;
  note?: string;
}) {
  const session = await requireSession();
  const canManage =
    (await canFromSession('division:manage:keamanan', 'KEAMANAN')) ||
    (await canFromSession('security:duty:manage')) ||
    (await canFromSession('cctv:view'));
  if (!canManage) throw new Error('Tidak memiliki akses untuk mengubah status CCTV.');

  let status = await db.cctvStatus.findFirst();
  if (!status) {
    status = await db.cctvStatus.create({ data: { isActive: true } });
  }

  const updateData: Record<string, unknown> = {
    isActive: data.isActive,
    verifiedById: session.user.id,
    note: data.note || null,
  };

  // Jika diubah ke aktif, update lastVerifiedAt
  if (data.isActive) {
    updateData.lastVerifiedAt = new Date();
  }

  await db.cctvStatus.update({
    where: { id: status.id },
    data: updateData,
  });

  revalidatePath('/admin/keamanan');
  return { success: true };
}

/** Confirm CCTV memory has been cleaned — only role keamanan */
export async function confirmCctvMemoryCleaned(note?: string) {
  const session = await requireSession();
  const canManage =
    (await canFromSession('division:manage:keamanan', 'KEAMANAN')) ||
    (await canFromSession('security:duty:manage')) ||
    (await canFromSession('cctv:view'));
  if (!canManage) throw new Error('Tidak memiliki akses.');

  let status = await db.cctvStatus.findFirst();
  if (!status) {
    status = await db.cctvStatus.create({ data: { isActive: true } });
  }

  await db.cctvStatus.update({
    where: { id: status.id },
    data: {
      lastMemoryCleanedAt: new Date(),
      verifiedById: session.user.id,
      note: note || 'Memori CCTV telah dibersihkan.',
    },
  });

  revalidatePath('/admin/keamanan');
  return { success: true };
}
