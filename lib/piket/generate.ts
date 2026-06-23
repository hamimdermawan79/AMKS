import { db } from '@/lib/db';
import { createNotification } from '@/lib/notifications';

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

  // Step 3: Select kerja bakti dates (e.g., Sundays) evenly
  const kerjaBaktiCandidates = allDates.filter(
    (date) => date.getDay() === kerjaBaktiWeekday
  );

  // Pick kerjaBaktiCount dates evenly from candidates
  const kerjaBaktiDates: Date[] = [];
  if (kerjaBaktiCandidates.length > 0 && kerjaBaktiCount > 0) {
    const step = Math.max(1, Math.floor(kerjaBaktiCandidates.length / kerjaBaktiCount));
    for (let i = 0; i < kerjaBaktiCount && i * step < kerjaBaktiCandidates.length; i++) {
      kerjaBaktiDates.push(kerjaBaktiCandidates[i * step]);
    }
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
 * Close a piket period and generate fines for missing attendance
 * This should be called when the period ends to finalize everything
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

  // Calculate missed days per user
  const missedDaysMap = new Map<string, number>();

  for (const assignment of period.assignments) {
    // If no attendance record or status is TIDAK_HADIR, count as missed
    if (!assignment.attendance || assignment.attendance.status === 'TIDAK_HADIR') {
      const current = missedDaysMap.get(assignment.userId) || 0;
      missedDaysMap.set(assignment.userId, current + 1);
    }
  }

  // Generate fines and bills
  const finesCreated: string[] = [];

  for (const [userId, daysMissed] of missedDaysMap.entries()) {
    if (daysMissed === 0) continue;

    const amount = daysMissed * period.finePerDay;

    // Create fine record
    const fine = await db.fine.create({
      data: {
        userId,
        periodId: period.id,
        daysMissed,
        amount,
      },
    });

    // Create bill for the fine
    const bill = await db.bill.create({
      data: {
        userId,
        type: 'DENDA_PIKET',
        title: `Denda Piket (${daysMissed} hari)`,
        amount,
        status: 'BELUM_LUNAS',
        division: 'KEBERSIHAN',
        note: `Tidak piket selama ${daysMissed} hari, periode ${period.startDate.toLocaleDateString()} - ${period.endDate.toLocaleDateString()}`,
      },
    });

    // Link fine to bill
    await db.fine.update({
      where: { id: fine.id },
      data: { billId: bill.id },
    });

    // Create Notification (which handles WA queues automatically)
    await createNotification({
      userId,
      title: 'Denda Piket Terbit',
      message: `Anda memiliki tagihan denda piket baru sebesar Rp${amount.toLocaleString('id-ID')} karena tidak piket selama ${daysMissed} hari pada periode ini. Silakan melakukan pelunasan ke Bendahara.`,
      type: 'TAGIHAN_REMINDER',
      referenceId: bill.id,
    });

    finesCreated.push(userId);
  }

  // Mark period as inactive
  await db.piketPeriod.update({
    where: { id: periodId },
    data: { isActive: false },
  });

  return {
    periodId,
    finesCreated: finesCreated.length,
    totalAmount: Array.from(missedDaysMap.values()).reduce(
      (sum, days) => sum + days * period.finePerDay,
      0
    ),
  };
}
