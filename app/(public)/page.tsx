import { db } from '@/lib/db';
import HomeClient from '@/components/HomeClient';

export default async function HomePage() {
  const [totalWarga, totalAlumni, distinctAngkatan, recentActivities, profile] =
    await Promise.all([
      // Warga aktif
      db.user.count({ where: { status: 'AKTIF' } }),
      // Alumni
      db.user.count({ where: { status: 'ALUMNI' } }),
      // Hitung angkatan unik dari tahunMasuk
      db.user
        .findMany({
          where: { tahunMasuk: { not: null } },
          select: { tahunMasuk: true },
          distinct: ['tahunMasuk'],
        })
        .then((rows) => rows.length),
      // 3 kegiatan terbaru untuk preview galeri/kegiatan
      db.activity.findMany({
        orderBy: [
          { startAt: { sort: 'desc', nulls: 'last' } },
          { createdAt: 'desc' },
        ],
        take: 3,
        select: {
          id: true,
          title: true,
          description: true,
          coverUrl: true,
          startAt: true,
          location: true,
          division: true,
        },
      }),
      // Narasi singkat profil asrama
      db.asramaProfile.findFirst({
        select: { about: true },
      }),
    ]);

  return (
    <HomeClient
      totalWarga={totalWarga}
      totalAlumni={totalAlumni}
      totalAngkatan={distinctAngkatan}
      recentActivities={recentActivities}
      profileAbout={profile?.about ?? null}
    />
  );
}
