/**
 * Pure formatter for Meeting and Activity WhatsApp reminder messages.
 * Client/server safe with no Node.js-only dependencies.
 */

export type MeetingForReminder = {
  id: string;
  title: string;
  type: 'INTERNAL' | 'EKSTERNAL_RT';
  scheduledAt: Date;
  location?: string | null;
  leader?: { fullName: string } | null;
  noteTaker?: { fullName: string } | null;
};

export type ActivityForReminder = {
  id: string;
  title: string;
  startAt: Date;
  location?: string | null;
  description?: string | null;
  division?: string | null;
};

function formatWibDateTime(dateInput: Date): { dateStr: string; timeStr: string } {
  const d = new Date(dateInput);
  const dateStr = d.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Jakarta',
  });
  const timeStr = d.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Jakarta',
  });
  return { dateStr, timeStr: `${timeStr} WIB` };
}

export function formatMeetingReminderMessage(
  meeting: MeetingForReminder,
  diffDays: number, // 3 = H-3, 2 = H-2, 1 = H-1, 0 = Hari H
  isDelegate: boolean = false
): { title: string; message: string } {
  const { dateStr, timeStr } = formatWibDateTime(meeting.scheduledAt);
  const isInternal = meeting.type === 'INTERNAL';

  let tag = '';
  let greetingLead = '';

  if (diffDays === 3) {
    tag = 'PENGINGAT H-3';
    greetingLead = 'Mengingatkan kembali bahwa dalam 3 hari ke depan';
  } else if (diffDays === 2) {
    tag = 'PENGINGAT H-2';
    greetingLead = 'Mengingatkan kembali bahwa dalam 2 hari ke depan';
  } else if (diffDays === 1) {
    tag = 'PENGINGAT H-1 (BESOK)';
    greetingLead = 'PENTING! Mengingatkan bahwa BESOK';
  } else {
    tag = 'PENGINGAT HARI H (HARI INI)';
    greetingLead = '⚠️ PENTING: Hari ini';
  }

  const notifTitle = `[${tag}] ${meeting.title}`;

  let body = '';
  if (isInternal) {
    body = `*📢 ${tag}: RAPAT ASRAMA AMKS 📢*

Assalamu'alaikum Wr. Wb.
Halo Warga Asrama AMKS,

${greetingLead} akan diadakan agenda rapat asrama dengan rincian sebagai berikut:

📋 *AGENDA RAPAT:*
• Judul   : *${meeting.title}*
• Waktu   : *${dateStr}* (Pukul ${timeStr})
• Tempat  : *${meeting.location || 'Asrama AMKS'}*
${meeting.leader?.fullName ? `• Pemimpin: ${meeting.leader.fullName}\n` : ''}${meeting.noteTaker?.fullName ? `• Notulis : ${meeting.noteTaker.fullName}\n` : ''}
Diharapkan seluruh warga asrama hadir tepat waktu dan mempersiapkan diri dengan baik demi kelancaran koordinasi asrama.

Wassalamu'alaikum Wr. Wb.
_Pengurus Asrama AMKS (Kesekretariatan)_`;
  } else {
    // EKSTERNAL_RT
    body = `*📢 ${tag}: DELEGASI RAPAT RT 12 📢*

Halo rekan Delegasi Warga Asrama,

${greetingLead} akan diadakan agenda pertemuan Rapat Warga RT 12:

📋 *DETAIL RAPAT RT 12:*
• Judul   : *${meeting.title}*
• Waktu   : *${dateStr}* (Pukul ${timeStr})
• Tempat  : *${meeting.location || 'Balai Pertemuan RT 12 / Tempat yang ditentukan'}*

${isDelegate ? '⭐ *Anda tercatat sebagai Delegasi resmi perwakilan Asrama AMKS.* Mohon hadir tepat waktu dan membawa aspirasi warga asrama.' : 'Mohon perwakilan delegasi asrama dapat hadir tepat waktu.'}

Terima kasih atas dedikasi dan kontribusi Anda.

Salam,
_Kesekretariatan Asrama AMKS_`;
  }

  return { title: notifTitle, message: body };
}

export function formatActivityReminderMessage(
  activity: ActivityForReminder,
  diffDays: number
): { title: string; message: string } {
  const { dateStr, timeStr } = formatWibDateTime(activity.startAt);

  let tag = '';
  let greetingLead = '';

  if (diffDays === 3) {
    tag = 'PENGINGAT H-3';
    greetingLead = 'Mengingatkan kembali bahwa dalam 3 hari ke depan';
  } else if (diffDays === 2) {
    tag = 'PENGINGAT H-2';
    greetingLead = 'Mengingatkan kembali bahwa dalam 2 hari ke depan';
  } else if (diffDays === 1) {
    tag = 'PENGINGAT H-1 (BESOK)';
    greetingLead = 'PENTING! Mengingatkan bahwa BESOK';
  } else {
    tag = 'PENGINGAT HARI H (HARI INI)';
    greetingLead = '⚠️ PENTING: Hari ini';
  }

  const notifTitle = `[${tag}] Kegiatan: ${activity.title}`;

  const body = `*🎯 ${tag}: KEGIATAN ASRAMA AMKS 🎯*

Halo Warga Asrama AMKS,

${greetingLead} akan dilaksanakan kegiatan:

📌 *${activity.title}*
${activity.division ? `• Divisi : ${activity.division}\n` : ''}• Waktu  : *${dateStr}* (Pukul ${timeStr})
• Lokasi : *${activity.location || 'Asrama AMKS'}*
${activity.description ? `\n📝 Keterangan:\n${activity.description}\n` : ''}
Mari bersama-sama hadir, meramaikan, dan menyukseskan agenda kegiatan kita bersama!

Salam hangat,
_Keluarga Besar Asrama AMKS_`;

  return { title: notifTitle, message: body };
}
