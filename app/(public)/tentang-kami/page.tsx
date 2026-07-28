import { db } from '@/lib/db';
import HeroSection from '@/components/HeroSection';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Profil Asrama',
  description:
    'Profil lengkap Asrama Mahasiswa Kabupaten Sambas Yogyakarta — sejarah, visi misi, fasilitas, dan kehidupan warga asrama.',
  openGraph: {
    title: 'Profil Asrama | SIMAS-KS',
    description: 'Kenali lebih dekat AMKS Yogyakarta — asrama mahasiswa Kabupaten Sambas.',
  },
};

export default async function ProfilAsramaPage() {
  const profile = await db.asramaProfile.findFirst();

  return (
    <div className="min-h-screen bg-white">
      <HeroSection title="Profil Asrama" subtitle="Asrama Mahasiswa Kabupaten Sambas Yogyakarta" />

      {/* Content */}
      <section className="pb-24">
        <div className="container mx-auto max-w-3xl px-6">
          {!profile ? (
            <div className="rounded-2xl border border-border bg-slate-50/60 p-12 text-center">
              <p className="text-muted-foreground italic">
                Profil asrama belum dikonfigurasi. Login sebagai admin untuk mengisi narasi profil.
              </p>
            </div>
          ) : (
            <div className="space-y-12">
              {profile.about && (
                <p className="text-lg leading-relaxed text-muted-foreground text-justify">
                  {profile.about}
                </p>
              )}

              {profile.sejarah && (
                <div>
                  <h2 className="mb-4 text-2xl font-bold text-foreground">Sejarah</h2>
                  <p className="leading-relaxed whitespace-pre-line text-muted-foreground text-justify">
                    {profile.sejarah}
                  </p>
                </div>
              )}

              {(profile.visi || profile.misi) && (
                <div className="mt-12 space-y-12">
                  {profile.visi && (
                    <div className="text-center">
                      <h2 className="mb-4 text-2xl font-bold text-foreground">Visi</h2>
                      <p className="leading-relaxed whitespace-pre-line text-muted-foreground">
                        {profile.visi.trim().startsWith('"') ? profile.visi : `"${profile.visi.trim()}"`}
                      </p>
                    </div>
                  )}
                  {profile.misi && (
                    <div className="text-center">
                      <h2 className="mb-4 text-2xl font-bold text-foreground">Misi</h2>
                      <p className="leading-relaxed whitespace-pre-line text-muted-foreground text-left inline-block max-w-full">
                        {profile.misi}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
