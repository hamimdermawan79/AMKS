/**
 * Pure formatter for Rohani H-1 WhatsApp broadcast message.
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

export function formatRohaniH1WhatsAppMessage(schedule: RohaniScheduleForMessage): string {
  const formattedDate = schedule.date.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const totalVerses = schedule.endVerse - schedule.startVerse + 1;
  const cadanganImamText = schedule.cadanganImam?.fullName || '—';
  const cadanganKultumText = schedule.cadanganKultum?.fullName || '—';

  let extraText = '';
  if (schedule.additionalActivities?.trim()) {
    extraText = `\n✨ *AGENDA TAMBAHAN:*\n• ${schedule.additionalActivities.trim()}\n`;
  }

  return `*📢 PENGUMUMAN KEGIATAN ROHANI ASRAMA AMKS (H-1) 📢*

Assalamu'alaikum Wr. Wb.
Diberitahukan kepada seluruh Warga Asrama AMKS, besok malam akan dilaksanakan kegiatan Sholat Berjamaah & Tadarus Al-Qur'an Rutin dengan rincian sebagai berikut:

🗓️ *WAKTU PELAKSANAAN:*
• Hari, Tanggal : *${formattedDate} (Besok Malam)*
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
}
