import { db } from '@/lib/db';
import { createNotification } from '@/lib/notifications';
import { isUserSuperAdminById } from '@/lib/rbac/can';

interface GeneratePiketOptions {
  startDate: Date;
  endDate: Date;
  kerjaBaktiCount: number;
  kerjaBaktiWeekday: number; // 0 = Sunday, 1 = Monday, etc.
  peoplePerDay: number; // number of sectors per day (A=0, B=1, C=2, ...)
  finePerDay: number;
  participantIds: string[]; // explicit warga selected by admin
  generatedById: string;
}

/**
 * Generate piket schedule for a period
 * Algorithm:
 * 1. Calculate all dates in [startDate, endDate]
 * 2. Select kerjaBaktiCount days of kerjaBaktiWeekday (e.g., Sundays) evenly
 * 3. Exclude kerja bakti dates from regular piket
 * 4. Shuffle the chosen participants randomly, distribute peoplePerDay per
 *    remaining date (round-robin). Each slot gets a sector index 0..peoplePerDay-1
 *    (Sektor A, B, C, ...).
 * 5. Save to piket_kerja_bakti and piket_assignment
 */
export async function generatePiketSchedule(options: GeneratePiketOptions) {
  const {
    startDate,
    endDate,
    kerjaBaktiCount,
    kerjaBaktiWeekday,
    peoplePerDay,
    finePerDay,
    participantIds,
    generatedById,
  } = options;

  if (!participantIds || participantIds.length === 0) {
    throw new Error('Tidak ada warga yang dipilih untuk piket');
  }

  if (participantIds.length < peoplePerDay) {
    throw new Error(
      `Jumlah warga yang dipilih (${participantIds.length} orang) kurang dari jumlah petugas per hari (${peoplePerDay} orang). Silakan pilih warga lebih banyak atau kurangi jumlah petugas per hari.`
    );
  }

  // Step 1: Create the period record
  // First, deactivate any currently active periods to prevent duplicates
  await db.piketPeriod.updateMany({
    where: { isActive: true },
    data: { isActive: false },
  });

  const period = await db.piketPeriod.create({
    data: {
      startDate,
      endDate,
      kerjaBaktiCount,
      kerjaBaktiWeekday,
      peoplePerDay,
      finePerDay,
      isActive: true,
      generatedById,
    },
  });

  // Step 2: Calculate all dates in range
  const allDates: Date[] = [];
  const current = new Date(startDate);
  const end = new Date(endDate);

  while (current <= end) {
    allDates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }

  // Step 3: Select kerja bakti dates (e.g., Sundays) randomly from candidates
  const kerjaBaktiCandidates = allDates.filter(
    (date) => date.getDay() === kerjaBaktiWeekday
  );

  // Pick kerjaBaktiCount random dates from candidates
  const kerjaBaktiDates: Date[] = [];
  if (kerjaBaktiCandidates.length > 0 && kerjaBaktiCount > 0) {
    const countToPick = Math.min(kerjaBaktiCount, kerjaBaktiCandidates.length);
    // Shuffle candidates to pick random ones
    const shuffledCandidates = [...kerjaBaktiCandidates];
    for (let i = shuffledCandidates.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledCandidates[i], shuffledCandidates[j]] = [shuffledCandidates[j], shuffledCandidates[i]];
    }
    // Take the first countToPick candidates and sort them chronologically
    const selected = shuffledCandidates.slice(0, countToPick);
    selected.sort((a, b) => a.getTime() - b.getTime());
    kerjaBaktiDates.push(...selected);
  }

  // Save kerja bakti dates
  if (kerjaBaktiDates.length > 0) {
    await db.piketKerjaBakti.createMany({
      data: kerjaBaktiDates.map((date) => ({ periodId: period.id, date })),
    });
  }

  // Step 4: Exclude kerja bakti dates from piket dates
  const kerjaBaktiSet = new Set(kerjaBaktiDates.map((d) => d.toISOString()));
  const piketDates = allDates.filter(
    (date) => !kerjaBaktiSet.has(date.toISOString())
  );

  // Step 5: Validate selected participants are real users
  const participants = await db.user.findMany({
    where: { id: { in: participantIds } },
    select: { id: true },
  });

  if (participants.length === 0) {
    throw new Error('Warga yang dipilih tidak ditemukan');
  }

  // Step 6: Shuffle participants randomly (Fisher-Yates shuffle)
  const shuffled = [...participants];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  // Step 7: Distribute participants to piket dates (round-robin).
  // Each date gets peoplePerDay slots; slot index i becomes sector i (A/B/C...).
  const assignments: { periodId: string; userId: string; date: Date; sector: number }[] = [];
  let idx = 0;

  for (const date of piketDates) {
    for (let sector = 0; sector < peoplePerDay; sector++) {
      assignments.push({
        periodId: period.id,
        userId: shuffled[idx % shuffled.length].id,
        date,
        sector,
      });
      idx++;
    }
  }

  // Step 8: Save assignments
  if (assignments.length > 0) {
    await db.piketAssignment.createMany({ data: assignments });
  }

  return {
    period,
    kerjaBaktiDates: kerjaBaktiDates.length,
    piketDates: piketDates.length,
    totalAssignments: assignments.length,
  };
}

/**
 * Close a piket period and finalize attendance / recap.
 * Daily fines and bills are already issued automatically by cron (checkMissedPikets).
 * This function:
 * 1. Finalizes any remaining assignments without attendance (marks TIDAK_HADIR & issues daily fine if missed by cron).
 * 2. Sends recap notification to members who missed piket without generating duplicate fines/bills.
 * 3. Marks the period as inactive.
 */
export async function closePiketPeriod(periodId: string) {
  const period = await db.piketPeriod.findUnique({
    where: { id: periodId },
    include: {
      assignments: {
        include: {
          user: true,
          attendance: true,
        },
      },
    },
  });

  if (!period) {
    throw new Error('Period not found');
  }

  // Step 1: Finalize any assignments that still have no attendance record
  // (e.g. if the period is closed before today's cron ran or cron skipped an assignment)
  let fallbackFinesCount = 0;
  for (const assignment of period.assignments) {
    if (!assignment.attendance) {
      // Mark as TIDAK_HADIR
      await db.piketAttendance.create({
        data: {
          assignmentId: assignment.id,
          status: 'TIDAK_HADIR',
          markedById: null, // marked by system
        },
      });

      // Super Admin is exempt from fines
      if (await isUserSuperAdminById(assignment.userId)) {
        continue;
      }

      // Check if denda notification / fine already issued (idempotency)
      const dendaRefId = `DENDA_PIKET:${assignment.id}`;
      const existingDendaNotif = await db.notification.findFirst({
        where: { referenceId: dendaRefId },
      });

      if (!existingDendaNotif) {
        const fineAmount = period.finePerDay || 10000;
        const fine = await db.fine.create({
          data: {
            userId: assignment.userId,
            periodId: period.id,
            daysMissed: 1,
            amount: fineAmount,
          },
        });

        const bill = await db.bill.create({
          data: {
            userId: assignment.userId,
            type: 'DENDA_PIKET',
            title: `Denda Piket (${new Date(assignment.date).toLocaleDateString('id-ID')})`,
            amount: fineAmount,
            status: 'BELUM_LUNAS',
            division: 'KEBERSIHAN',
            note: `Terlambat / tidak melakukan presensi piket pada tanggal ${new Date(assignment.date).toLocaleDateString('id-ID')} sebelum penutupan periode.`,
          },
        });

        await db.fine.update({
          where: { id: fine.id },
          data: { billId: bill.id },
        });

        await createNotification({
          userId: assignment.userId,
          title: 'Denda Piket Otomatis Terbit',
          message: `Pemberitahuan: Anda dikenakan denda piket sebesar Rp${fineAmount.toLocaleString('id-ID')} karena tidak melakukan presensi dan tugas piket pada tanggal ${new Date(assignment.date).toLocaleDateString('id-ID')}. Tagihan denda telah terbit di sistem, harap segera melakukan pelunasan ke Bendahara.`,
          type: 'TAGIHAN_REMINDER',
          referenceId: dendaRefId,
        });

        fallbackFinesCount++;
      }
    }
  }

  // Step 2: Calculate total missed days per user for recap report
  const updatedAssignments = await db.piketAssignment.findMany({
    where: { periodId: period.id },
    include: {
      user: true,
      attendance: true,
    },
  });

  const missedDaysMap = new Map<string, { daysMissed: number; user: { id: string; fullName: string } }>();

  for (const assignment of updatedAssignments) {
    if (!assignment.attendance || assignment.attendance.status === 'TIDAK_HADIR') {
      const current = missedDaysMap.get(assignment.userId) || {
        daysMissed: 0,
        user: assignment.user,
      };
      current.daysMissed += 1;
      missedDaysMap.set(assignment.userId, current);
    }
  }

  // Step 3: Send recap notification per user WITHOUT creating duplicate fines or bills
  for (const [userId, { daysMissed, user }] of missedDaysMap.entries()) {
    if (daysMissed === 0) continue;

    // Super Admin is exempt from fines and recap fine warnings
    if (await isUserSuperAdminById(userId)) continue;

    const totalDendaAccumulated = daysMissed * period.finePerDay;
    const recapRefId = `REKAP_PIKET_CLOSED:${period.id}:${userId}`;

    const existingRecapNotif = await db.notification.findFirst({
      where: { referenceId: recapRefId },
    });

    if (!existingRecapNotif) {
      await createNotification({
        userId,
        title: 'Rekapitulasi Jadwal Piket Selesai',
        message: `Halo ${user.fullName}, periode piket (${new Date(period.startDate).toLocaleDateString('id-ID')} - ${new Date(period.endDate).toLocaleDateString('id-ID')}) telah resmi ditutup. Catatan kehadiran Anda: tidak hadir piket sebanyak ${daysMissed} kali (akumulasi denda: Rp${totalDendaAccumulated.toLocaleString('id-ID')}). Mohon pastikan tagihan denda piket harian Anda di sistem telah dilunasi ke Bendahara. Terima kasih!`,
        type: 'PIKET_REMINDER',
        referenceId: recapRefId,
      });
    }
  }

  // Step 4: Mark period as inactive
  await db.piketPeriod.update({
    where: { id: periodId },
    data: { isActive: false },
  });

  return {
    periodId,
    finesCreated: fallbackFinesCount,
    totalMissedUsers: missedDaysMap.size,
    totalAmount: Array.from(missedDaysMap.values()).reduce(
      (sum, item) => sum + item.daysMissed * period.finePerDay,
      0
    ),
  };
}
