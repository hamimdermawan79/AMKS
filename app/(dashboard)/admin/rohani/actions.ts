'use server';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { canFromSession } from '@/lib/rbac/can';
import { revalidatePath } from 'next/cache';
import { QURAN_SURAHS } from '@/lib/rohani/quran';
import { createNotification } from '@/lib/notifications';

async function authorizeRohani() {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Unauthorized');
  }
  const allowed = await canFromSession('division:manage:rohani', 'ROHANI');
  if (!allowed) {
    throw new Error('Anda tidak memiliki izin mengelola divisi Rohani');
  }
  return session;
}

export async function generateNextRohaniSchedule() {
  await authorizeRohani();

  // 1. Get all active users (excluding SUPERADMIN)
  const activeUsers = await db.user.findMany({
    where: {
      status: 'AKTIF',
      roles: { none: { role: { name: 'SUPERADMIN' } } }
    },
    select: { id: true, fullName: true },
  });

  if (activeUsers.length < 5) {
    throw new Error('Warga aktif minimal harus 5 orang untuk menggenerasi jadwal (Imam Maghrib, Imam Isya, Kultum, Cadangan Imam, & Cadangan Kultum).');
  }

  // 2. Get latest schedule to determine next date and verses
  const latest = await db.rohaniSchedule.findFirst({
    orderBy: { date: 'desc' },
  });

  let nextDate = new Date();
  let currentSurahName = "Al-Baqarah";
  let startVerse = 1;
  let endVerse = 15;

  if (latest) {
    // Bi-weekly Thursday schedule: add 14 days to the latest date
    nextDate = new Date(latest.date);
    nextDate.setDate(nextDate.getDate() + 14);

    // Calculate next verses
    const currentSurahIndex = QURAN_SURAHS.findIndex(s => s.name === latest.currentSurah);
    let surah = QURAN_SURAHS[currentSurahIndex !== -1 ? currentSurahIndex : 1]; // Default to Al-Baqarah if not found

    let nextStart = latest.endVerse + 1;
    if (nextStart > surah.verses) {
      // Advance to next surah
      const nextIndex = (QURAN_SURAHS.findIndex(s => s.name === surah.name) + 1) % QURAN_SURAHS.length;
      surah = QURAN_SURAHS[nextIndex];
      nextStart = 1;
    }

    let nextEnd = nextStart + 14;
    if (nextEnd > surah.verses) {
      nextEnd = surah.verses; // Cap at the end of the surah
    }

    currentSurahName = surah.name;
    startVerse = nextStart;
    endVerse = nextEnd;
  } else {
    // Find next Thursday from today
    const day = nextDate.getDay();
    const diff = (4 - day + 7) % 7;
    nextDate.setDate(nextDate.getDate() + (diff === 0 ? 14 : diff)); // If today is Thursday, pick next Thursday or 14 days later. Let's do next Thursday.
    nextDate.setHours(17, 30, 0, 0); // 17:30 WIB or so
  }

  // 3. Rotation logic: find when users last served in each role
  const userStats = await Promise.all(
    activeUsers.map(async (user) => {
      const lastMaghrib = await db.rohaniSchedule.findFirst({
        where: { imamMaghribId: user.id },
        orderBy: { date: 'desc' },
        select: { date: true },
      });
      const lastIsha = await db.rohaniSchedule.findFirst({
        where: { imamIshaId: user.id },
        orderBy: { date: 'desc' },
        select: { date: true },
      });
      const lastKultum = await db.rohaniSchedule.findFirst({
        where: { kultumById: user.id },
        orderBy: { date: 'desc' },
        select: { date: true },
      });

      return {
        id: user.id,
        fullName: user.fullName,
        lastMaghribTime: lastMaghrib?.date ? lastMaghrib.date.getTime() : 0,
        lastIshaTime: lastIsha?.date ? lastIsha.date.getTime() : 0,
        lastKultumTime: lastKultum?.date ? lastKultum.date.getTime() : 0,
      };
    })
  );

  // Pick Imam Maghrib: lowest lastMaghribTime
  const sortedForMaghrib = [...userStats].sort((a, b) => a.lastMaghribTime - b.lastMaghribTime);
  const imamMaghrib = sortedForMaghrib[0];

  // Pick Imam Isha: lowest lastIshaTime (excluding imamMaghrib)
  const sortedForIsha = userStats
    .filter(u => u.id !== imamMaghrib.id)
    .sort((a, b) => a.lastIshaTime - b.lastIshaTime);
  const imamIsha = sortedForIsha[0];

  // Pick Kultum: lowest lastKultumTime (excluding both imams)
  const sortedForKultum = userStats
    .filter(u => u.id !== imamMaghrib.id && u.id !== imamIsha.id)
    .sort((a, b) => a.lastKultumTime - b.lastKultumTime);
  const kultumBy = sortedForKultum[0];

  // Pick Cadangan Imam: lowest combined imam time (excluding 3 already picked)
  const pickedIds = [imamMaghrib.id, imamIsha.id, kultumBy.id];
  const sortedForCadanganImam = userStats
    .filter(u => !pickedIds.includes(u.id))
    .sort((a, b) => (a.lastMaghribTime + a.lastIshaTime) - (b.lastMaghribTime + b.lastIshaTime));
  const cadanganImam = sortedForCadanganImam[0];

  // Pick Cadangan Kultum: lowest lastKultumTime (excluding 4 already picked)
  const pickedIds2 = [...pickedIds, cadanganImam.id];
  const sortedForCadanganKultum = userStats
    .filter(u => !pickedIds2.includes(u.id))
    .sort((a, b) => a.lastKultumTime - b.lastKultumTime);
  const cadanganKultum = sortedForCadanganKultum[0];

  // 4. Create the schedule
  const schedule = await db.rohaniSchedule.create({
    data: {
      date: nextDate,
      currentSurah: currentSurahName,
      startVerse,
      endVerse,
      imamMaghribId: imamMaghrib.id,
      imamIshaId: imamIsha.id,
      kultumById: kultumBy.id,
      cadanganImamId: cadanganImam.id,
      cadanganKultumId: cadanganKultum.id,
    },
  });

  // 5. Send notifications
  const formattedDate = nextDate.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  await createNotification({
    userId: imamMaghrib.id,
    title: 'TUGAS IBADAH: Imam Maghrib',
    message: `Halo ${imamMaghrib.fullName}, Anda terjadwal menjadi Imam Sholat Maghrib berjamaah pada hari ${formattedDate}. Mohon bersiap diri. Terima kasih!`,
    type: 'SYSTEM',
    referenceId: schedule.id,
  });

  await createNotification({
    userId: imamIsha.id,
    title: 'TUGAS IBADAH: Imam Isya',
    message: `Halo ${imamIsha.fullName}, Anda terjadwal menjadi Imam Sholat Isya berjamaah pada hari ${formattedDate}. Mohon bersiap diri. Terima kasih!`,
    type: 'SYSTEM',
    referenceId: schedule.id,
  });

  await createNotification({
    userId: kultumBy.id,
    title: 'TUGAS IBADAH: Kultum Keagamaan',
    message: `Halo ${kultumBy.fullName}, Anda terjadwal untuk menyampaikan Kultum (ceramah singkat) setelah sholat Isya berjamaah pada hari ${formattedDate}. Mohon bersiap diri. Terima kasih!`,
    type: 'SYSTEM',
    referenceId: schedule.id,
  });

  await createNotification({
    userId: cadanganImam.id,
    title: 'TUGAS IBADAH: Cadangan Imam',
    message: `Halo ${cadanganImam.fullName}, Anda terjadwal sebagai cadangan Imam pada hari ${formattedDate}. Jika Imam Maghrib atau Imam Isya berhalangan, Anda akan menggantikan. Mohon bersiap diri.`,
    type: 'SYSTEM',
    referenceId: schedule.id,
  });

  await createNotification({
    userId: cadanganKultum.id,
    title: 'TUGAS IBADAH: Cadangan Kultum',
    message: `Halo ${cadanganKultum.fullName}, Anda terjadwal sebagai cadangan Kultum pada hari ${formattedDate}. Jika pembawa Kultum utama berhalangan, Anda akan menggantikan. Mohon bersiap diri.`,
    type: 'SYSTEM',
    referenceId: schedule.id,
  });

  revalidatePath('/admin/rohani');
  return { success: true, schedule };
}

export async function deleteRohaniSchedule(id: string) {
  await authorizeRohani();
  await db.rohaniSchedule.delete({ where: { id } });
  revalidatePath('/admin/rohani');
  return { success: true };
}

export async function replaceRohaniDuty(
  scheduleId: string,
  role: 'imamMaghrib' | 'imamIsha' | 'kultum' | 'cadanganImam' | 'cadanganKultum',
  newUserId: string
) {
  await authorizeRohani();

  const schedule = await db.rohaniSchedule.findUnique({ where: { id: scheduleId } });
  if (!schedule) throw new Error('Jadwal tidak ditemukan');

  const fieldMap = {
    imamMaghrib: 'imamMaghribId',
    imamIsha: 'imamIshaId',
    kultum: 'kultumById',
    cadanganImam: 'cadanganImamId',
    cadanganKultum: 'cadanganKultumId',
  } as const;

  const field = fieldMap[role];

  const updated = await db.rohaniSchedule.update({
    where: { id: scheduleId },
    data: { [field]: newUserId },
    include: {
      imamMaghrib: { select: { id: true, fullName: true } },
      imamIsha: { select: { id: true, fullName: true } },
      kultumBy: { select: { id: true, fullName: true } },
      cadanganImam: { select: { id: true, fullName: true } },
      cadanganKultum: { select: { id: true, fullName: true } },
    },
  });

  // Notify the new petugas
  const roleLabels = {
    imamMaghrib: 'Imam Sholat Maghrib',
    imamIsha: 'Imam Sholat Isya',
    kultum: 'Pembawa Kultum',
    cadanganImam: 'Cadangan Imam',
    cadanganKultum: 'Cadangan Kultum',
  };
  const newUser = await db.user.findUnique({ where: { id: newUserId }, select: { fullName: true } });
  const formattedDate = schedule.date.toLocaleDateString('id-ID', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  if (newUser) {
    await createNotification({
      userId: newUserId,
      title: `TUGAS IBADAH (Penggantian): ${roleLabels[role]}`,
      message: `Halo ${newUser.fullName}, Anda ditunjuk sebagai pengganti ${roleLabels[role]} pada jadwal ${formattedDate}. Mohon bersiap diri.`,
      type: 'SYSTEM',
      referenceId: scheduleId,
    });
  }

  revalidatePath('/admin/rohani');
  revalidatePath('/admin/rohani/kelola');
  return { success: true };
}

/**
 * Activate backup officer — swaps the main petugas with the cadangan.
 * mainRole: which main role is being replaced ('imamMaghrib' | 'imamIsha' | 'kultum')
 */
export async function activateBackup(
  scheduleId: string,
  mainRole: 'imamMaghrib' | 'imamIsha' | 'kultum'
) {
  await authorizeRohani();

  const schedule = await db.rohaniSchedule.findUnique({
    where: { id: scheduleId },
    include: {
      imamMaghrib: { select: { id: true, fullName: true } },
      imamIsha: { select: { id: true, fullName: true } },
      kultumBy: { select: { id: true, fullName: true } },
      cadanganImam: { select: { id: true, fullName: true } },
      cadanganKultum: { select: { id: true, fullName: true } },
    },
  });
  if (!schedule) throw new Error('Jadwal tidak ditemukan');

  // Determine which backup to use
  let backupUser: { id: string; fullName: string } | null = null;
  let mainField: string;
  let backupField: string;
  let roleLabel: string;

  if (mainRole === 'imamMaghrib' || mainRole === 'imamIsha') {
    backupUser = schedule.cadanganImam;
    mainField = mainRole === 'imamMaghrib' ? 'imamMaghribId' : 'imamIshaId';
    backupField = 'cadanganImamId';
    roleLabel = mainRole === 'imamMaghrib' ? 'Imam Sholat Maghrib' : 'Imam Sholat Isya';
  } else {
    // kultum
    backupUser = schedule.cadanganKultum;
    mainField = 'kultumById';
    backupField = 'cadanganKultumId';
    roleLabel = 'Pembawa Kultum';
  }

  if (!backupUser) {
    throw new Error('Belum ada petugas cadangan yang ditunjuk untuk menggantikan role ini.');
  }

  // Get the original petugas name for notification
  const originalUser = mainRole === 'imamMaghrib' ? schedule.imamMaghrib
    : mainRole === 'imamIsha' ? schedule.imamIsha
    : schedule.kultumBy;

  // Swap: set main role to backup user, clear the backup slot
  await db.rohaniSchedule.update({
    where: { id: scheduleId },
    data: {
      [mainField]: backupUser.id,
      [backupField]: null,
    },
  });

  // Notify the backup user that they are now the main petugas
  const formattedDate = schedule.date.toLocaleDateString('id-ID', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  await createNotification({
    userId: backupUser.id,
    title: `TUGAS IBADAH (Cadangan Diaktifkan): ${roleLabel}`,
    message: `Halo ${backupUser.fullName}, Anda resmi menggantikan ${originalUser.fullName} sebagai ${roleLabel} pada ${formattedDate} karena yang bersangkutan berhalangan. Mohon bersiap diri.`,
    type: 'SYSTEM',
    referenceId: scheduleId,
  });

  revalidatePath('/admin/rohani');
  revalidatePath('/admin/rohani/kelola');
  return { success: true };
}
