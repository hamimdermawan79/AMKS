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

  // 1. Get all active users
  const activeUsers = await db.user.findMany({
    where: { status: 'AKTIF' },
    select: { id: true, fullName: true },
  });

  if (activeUsers.length < 3) {
    throw new Error('Warga aktif minimal harus 3 orang untuk menggenerasi jadwal (Imam Maghrib, Imam Isya, & Kultum).');
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

  revalidatePath('/admin/rohani');
  return { success: true, schedule };
}

export async function deleteRohaniSchedule(id: string) {
  await authorizeRohani();
  await db.rohaniSchedule.delete({ where: { id } });
  revalidatePath('/admin/rohani');
  return { success: true };
}
