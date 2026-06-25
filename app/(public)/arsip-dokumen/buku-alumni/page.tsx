import { db } from '@/lib/db';
import BukuAlumniClient from './BukuAlumniClient';

export const dynamic = 'force-dynamic';

export default async function BukuAlumniPage() {
  // Ambil semua user dengan status ALUMNI, lengkap dengan field akademik
  const alumniData = await db.user.findMany({
    where: { status: 'ALUMNI' },
    select: {
      id: true,
      fullName: true,
      photoUrl: true,
      jurusan: true,
      namaKampus: true,
      tahunMasuk: true,
      asalDaerah: true,
      tahunKeluar: true,
    },
    orderBy: [
      { tahunMasuk: 'asc' },
      { fullName: 'asc' },
    ],
  });

  // Kelompokkan berdasarkan tahun masuk (angkatan)
  const grouped: Record<string, typeof alumniData> = {};
  const noAngkatan: typeof alumniData = [];

  for (const alumni of alumniData) {
    if (alumni.tahunMasuk) {
      const key = String(alumni.tahunMasuk);
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(alumni);
    } else {
      noAngkatan.push(alumni);
    }
  }

  // Urutkan angkatan dari terlama ke terbaru
  const sortedAngkatan = Object.keys(grouped).sort((a, b) => Number(a) - Number(b));

  const groupedAngkatan = sortedAngkatan.map((year) => ({
    year: Number(year),
    members: grouped[year],
  }));

  if (noAngkatan.length > 0) {
    groupedAngkatan.push({ year: 0, members: noAngkatan });
  }

  return <BukuAlumniClient groupedAngkatan={groupedAngkatan} totalAlumni={alumniData.length} />;
}
