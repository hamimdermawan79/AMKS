/**
 * Pure formatter for Rohani WhatsApp broadcast and reminder messages (H-3, H-2, H-1, Hari H).
 * This file has NO Node.js-only dependencies so it can be safely imported
 * from both server-side code (lib/cron.ts) and client components.
 */

export type RohaniScheduleForMessage = {
  date: Date;
  imamMaghrib: { fullName: string };
  imamIsha: { fullName: string };
  kultumBy: { fullName: string };
  cadanganImam?: { fullName: string } | null;
  cadanganKultum?: { fullName: string } | null;
  currentSurah: string;
  startVerse: number;
  endVerse: number;
  additionalActivities?: string | null;
};

export function formatRohaniReminderWhatsAppMessage(
  schedule: RohaniScheduleForMessage,
  diffDays: number
): { title: string; message: string } {
  const formattedDate = schedule.date.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Jakarta',
  });
  const totalVerses = schedule.endVerse - schedule.startVerse + 1;
  const cadanganImamText = schedule.cadanganImam?.fullName || '—';
  const cadanganKultumText = schedule.cadanganKultum?.fullName || '—';

  let tag = '';
  let greetingLead = '';
  let daysNotice = '';

  if (diffDays === 3) {
    tag = 'PENGINGAT H-3';
    daysNotice = '(Tinggal 3 Hari Lagi)';
    greetingLead = `Mengingatkan bahwa agenda kegiatan Kerohanian tinggal *3 hari lagi*! Pada hari ${formattedDate} mendatang`;
  } else if (diffDays === 2) {
    tag = 'PENGINGAT H-2';
    daysNotice = '(Tinggal 2 Hari Lagi)';
    greetingLead = `Mengingatkan bahwa agenda kegiatan Kerohanian tinggal *2 hari lagi*! Pada hari ${formattedDate} mendatang`;
  } else if (diffDays === 1) {
    tag = 'PENGINGAT H-1 (BESOK)';
    daysNotice = '(Besok Malam)';
    greetingLead = `PENTING! Mengingatkan bahwa agenda kegiatan Kerohanian adalah *BESOK MALAM* (${formattedDate})`;
  } else {
    tag = 'PENGINGAT HARI H (MALAM INI)';
    daysNotice = '(Malam Ini)';
    greetingLead = `⚠️ PENTING: Agenda kegiatan Kerohanian adalah *MALAM INI* (${formattedDate})`;
  }

  const title = `[${tag}] ${daysNotice} Sholat & Tadarus QS. ${schedule.currentSurah}`;

  let extraText = '';
  if (schedule.additionalActivities?.trim()) {
    extraText = `\n✨ *AGENDA TAMBAHAN:*\n• ${schedule.additionalActivities.trim()}\n`;
  }

  const message = `*📢 ${tag}: KEGIATAN ROHANI ASRAMA AMKS 📢*

Assalamu'alaikum Wr. Wb.
Halo Seluruh Warga Asrama AMKS,

${greetingLead} akan dilaksanakan kegiatan Sholat Berjamaah & Tadarus Al-Qur'an Rutin dengan rincian sebagai berikut:

🗓️ *WAKTU PELAKSANAAN:*
• Hari, Tanggal : *${formattedDate} ${daysNotice}*
• Waktu         : Ba'da Maghrib & Isya Berjamaah (~18:00 WIB - Selesai)
• Tempat        : Musholla Asrama AMKS

👥 *PETUGAS SHOLAT & KULTUM:*
• Imam Maghrib    : *${schedule.imamMaghrib.fullName}*
• Imam Isya       : *${schedule.imamIsha.fullName}*
• Pembawa Kultum  : *${schedule.kultumBy.fullName}*

🛡️ *PETUGAS CADANGAN:*
• Cadangan Imam   : *${cadanganImamText}*
• Cadangan Kultum : *${cadanganKultumText}*

📖 *TARGET TADARUS AL-QUR'AN:*
• Surah           : *QS. ${schedule.currentSurah}*
• Rentang Ayat    : *Ayat ${schedule.startVerse} s/d ${schedule.endVerse}* (${totalVerses} ayat)
${extraText}
Diharapkan seluruh warga asrama hadir tepat waktu di musholla dan mempersiapkan diri dengan baik. Semoga kegiatan ibadah bersama ini membawa keberkahan bagi asrama kita.

Wassalamu'alaikum Wr. Wb.
_Divisi Kerohanian & Keagamaan Asrama AMKS_`;

  return { title, message };
}

export function formatRohaniH1WhatsAppMessage(schedule: RohaniScheduleForMessage): string {
  return formatRohaniReminderWhatsAppMessage(schedule, 1).message;
}
