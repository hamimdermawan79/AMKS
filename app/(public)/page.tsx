import { db } from '@/lib/db';
import HomeClient from '@/components/HomeClient';
import { Metadata } from 'next';
import Script from 'next/script';

export const metadata: Metadata = {
  title: 'Beranda',
  description:
    'Selamat datang di SIMAS-KS — Sistem Informasi Manajemen Asrama Kabupaten Sambas Yogyakarta. Temukan informasi warga, kegiatan, karya ilmiah, dan layanan asrama mahasiswa Sambas.',
  openGraph: {
    title: 'SIMAS-KS | Sistem Informasi Manajemen Asrama Kabupaten Sambas',
    description:
      'Platform digital resmi Asrama Mahasiswa Kabupaten Sambas Yogyakarta.',
    type: 'website',
  },
};

const orgSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Asrama Mahasiswa Kabupaten Sambas Yogyakarta',
  alternateName: 'AMKS Yogyakarta',
  url: 'https://amks-yogyakarta.vercel.app',
  logo: 'https://amks-yogyakarta.vercel.app/images/2-simas-logo.webp',
  sameAs: [
    'https://www.instagram.com/amks.yogyakarta',
    'https://wa.me/6281234567890',
  ],
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Jl. Garuda, Gang Beo No.328, Umbulharjo',
    addressLocality: 'Yogyakarta',
    addressRegion: 'DIY',
    addressCountry: 'ID',
  },
  contactPoint: {
    '@type': 'ContactPoint',
    telephone: '+62-812-3456-7890',
    contactType: 'General',
    email: 'asramasambas20006@gmail.com',
    areaServed: 'ID',
    availableLanguage: ['Indonesian'],
  },
};

export default async function HomePage() {
  const [totalWarga, totalAlumni, distinctAngkatan, recentActivities, profile, facilityItems] =
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
        orderBy: { startAt: 'desc' },
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
      // Fasilitas asrama (hanya yang punya foto)
      db.inventory.findMany({
        where: { photoUrl: { not: null } },
        orderBy: { name: 'asc' },
        take: 8,
        select: {
          id: true,
          name: true,
          category: true,
          photoUrl: true,
          condition: true,
          quantity: true,
        },
      }),
    ]);

  return (
    <>
      <Script
        id="org-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }}
      />
      <HomeClient
        totalWarga={totalWarga}
        totalAlumni={totalAlumni}
        totalAngkatan={distinctAngkatan}
        recentActivities={recentActivities}
        profileAbout={profile?.about ?? null}
        facilityItems={facilityItems}
      />
    </>
  );
}
