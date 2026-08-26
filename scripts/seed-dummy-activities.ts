import { db } from '../lib/db';

async function seedDummyActivities() {
  const admin = await db.user.findFirst();
  if (!admin) {
    console.error('No admin user found!');
    process.exit(1);
  }

  const dummyActivities = [
    {
      title: 'Turnamen Futsal Antar Angkatan AMKS',
      description: 'Kompetisi futsal persahabatan antar angkatan warga asrama untuk menjaga kebugaran dan sportivitas.',
      location: 'Futsal Arena Yogyakarta',
      division: 'KEOLAHRAGAAN' as const,
      startAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      endAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 4 * 3600 * 1000),
      coverUrl: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&auto=format&fit=crop&q=80',
      createdById: admin.id,
      images: [],
    },
    {
      title: 'Malam Keakraban & Pentas Seni Sambas',
      description: 'Malam pentas seni budaya Sambas menampilkan tarian kreasi, musik akustik, dan teater komedi warga.',
      location: 'Aula Utama AMKS Yogyakarta',
      division: 'KESENIAN' as const,
      startAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      endAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 + 5 * 3600 * 1000),
      coverUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&auto=format&fit=crop&q=80',
      createdById: admin.id,
      images: [],
    },
    {
      title: 'Kerja Bakti Bersih Lingkungan Asrama',
      description: 'Aksi gotong royong warga membersihkan seluruh area asrama, lorong, saluran air, dan taman.',
      location: 'Kompleks Asrama AMKS',
      division: 'KEBERSIHAN' as const,
      startAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      endAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000 + 3 * 3600 * 1000),
      coverUrl: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&auto=format&fit=crop&q=80',
      createdById: admin.id,
      images: [],
    },
    {
      title: 'Kajian Rutin Malam Jumat & Yasinan',
      description: 'Pembacaan surah Yasin, tahlil, dan tausiyah keagamaan untuk mempererat nilai rohani dan persaudaraan.',
      location: 'Mushola AMKS Yogyakarta',
      division: 'ROHANI' as const,
      startAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
      endAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000 + 2 * 3600 * 1000),
      coverUrl: 'https://images.unsplash.com/photo-1564769625905-50e93615e769?w=800&auto=format&fit=crop&q=80',
      createdById: admin.id,
      images: [],
    },
    {
      title: 'Pelatihan Tanggap Darurat & Keamanan',
      description: 'Simulasi tanggap bencana gempa bumi dan pelatihan penggunaan alat pemadam api ringan (APAR).',
      location: 'Halaman Depan AMKS',
      division: 'KEAMANAN' as const,
      startAt: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000),
      endAt: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000 + 3 * 3600 * 1000),
      coverUrl: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?w=800&auto=format&fit=crop&q=80',
      createdById: admin.id,
      images: [],
    },
    {
      title: 'Buka Puasa Bersama Warga & Alumni',
      description: 'Silaturahmi akbar dan buka puasa bersama alumni AMKS lintas generasi dari berbagai kota di DIY.',
      location: 'Ruang Tengah & Gazebo AMKS',
      division: 'ROHANI' as const,
      startAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000),
      endAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000 + 4 * 3600 * 1000),
      coverUrl: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800&auto=format&fit=crop&q=80',
      createdById: admin.id,
      images: [],
    },
    {
      title: 'Badminton Championship AMKS Cup',
      description: 'Laga bulutangkis ganda putra dan tunggal dalam rangka memperingati dies natalis asrama.',
      location: 'GOR Bulutangkis Umbulharjo',
      division: 'KEOLAHRAGAAN' as const,
      startAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
      endAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000 + 6 * 3600 * 1000),
      coverUrl: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=800&auto=format&fit=crop&q=80',
      createdById: admin.id,
      images: [],
    },
    {
      title: 'Workshop Musik Tradisional & Akustik',
      description: 'Pelatihan alat musik gambus, rebana, dan gitar akustik bersama musisi mahasiswa Sambas.',
      location: 'Ruang Musik AMKS',
      division: 'KESENIAN' as const,
      startAt: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000),
      endAt: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000 + 3 * 3600 * 1000),
      coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80',
      createdById: admin.id,
      images: [],
    },
    {
      title: 'Penataan Taman & Kebun Hidroponik',
      description: 'Inisiatif penghijauan lingkungan asrama dengan instalasi hidroponik sayur dan tanaman hias.',
      location: 'Rooftop & Taman Asrama',
      division: 'KEBERSIHAN' as const,
      startAt: new Date(Date.now() - 32 * 24 * 60 * 60 * 1000),
      endAt: new Date(Date.now() - 32 * 24 * 60 * 60 * 1000 + 4 * 3600 * 1000),
      coverUrl: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=800&auto=format&fit=crop&q=80',
      createdById: admin.id,
      images: [],
    },
    {
      title: 'Diskusi Ilmiah & Bedah Skripsi Warga',
      description: 'Sharing session persiapan tugas akhir, publikasi jurnal, dan tips sidang skripsi dari wisudawan.',
      location: 'Ruang Diskusi Lantai 2',
      division: 'SEKRETARIS' as const,
      startAt: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000),
      endAt: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000 + 3 * 3600 * 1000),
      coverUrl: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800&auto=format&fit=crop&q=80',
      createdById: admin.id,
      images: [],
    },
    {
      title: 'Nobar & Masak Kuliner Tradisional Sambas',
      description: 'Nonton bareng dan memasak bubur pedas khas Sambas untuk mengobati rindu kampung halaman.',
      location: 'Dapur & Ruang Santai AMKS',
      division: 'KEOLAHRAGAAN' as const,
      startAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000),
      endAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000 + 4 * 3600 * 1000),
      coverUrl: 'https://images.unsplash.com/photo-1543362906-acfc16c67564?w=800&auto=format&fit=crop&q=80',
      createdById: admin.id,
      images: [],
    },
    {
      title: 'Bakti Sosial Peduli Lingkungan Sekitar',
      description: 'Penyaluran paket sembako dan bantuan kebersihan bagi warga lansia di sekitar lingkungan asrama.',
      location: 'Kelurahan Umbulharjo',
      division: 'ROHANI' as const,
      startAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
      endAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000 + 4 * 3600 * 1000),
      coverUrl: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=800&auto=format&fit=crop&q=80',
      createdById: admin.id,
      images: [],
    },
    {
      title: 'Rapat Pleno Organisasi & LPJ Asrama',
      description: 'Sidang pleno evaluasi program kerja divisi dan musyawarah pembentukan panitia kegiatan tahunan.',
      location: 'Ruang Rapat Utama AMKS',
      division: 'SEKRETARIS' as const,
      startAt: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000),
      endAt: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000 + 5 * 3600 * 1000),
      coverUrl: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&auto=format&fit=crop&q=80',
      createdById: admin.id,
      images: [],
    },
  ];

  console.log('Seeding dummy activities...');
  for (const act of dummyActivities) {
    const existing = await db.activity.findFirst({ where: { title: act.title } });
    if (!existing) {
      await db.activity.create({ data: act });
      console.log('Created activity:', act.title);
    } else {
      await db.activity.update({ where: { id: existing.id }, data: act });
      console.log('Updated activity:', act.title);
    }
  }

  // Also clean up any broken 404 upload images from old activities
  const allActs = await db.activity.findMany();
  for (const act of allActs) {
    if (act.coverUrl?.startsWith('/uploads/kegiatan/')) {
      await db.activity.update({
        where: { id: act.id },
        data: {
          coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80',
        },
      });
    }
  }

  console.log('Done! Total activities in db:', await db.activity.count());
  process.exit(0);
}

seedDummyActivities().catch((err) => {
  console.error(err);
  process.exit(1);
});
