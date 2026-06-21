import { db } from '@/lib/db';
import HeroSection from '@/components/HeroSection';

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
                <p className="text-lg leading-relaxed text-muted-foreground">
                  {profile.about}
                </p>
              )}

              {profile.sejarah && (
                <div>
                  <h2 className="mb-4 text-2xl font-bold text-foreground">Sejarah</h2>
                  <p className="leading-relaxed whitespace-pre-line text-muted-foreground">
                    {profile.sejarah}
                  </p>
                </div>
              )}

              {(profile.visi || profile.misi) && (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  {profile.visi && (
                    <div className="rounded-2xl border border-border bg-gradient-to-br from-white to-blue-50/30 p-8 shadow-sm">
                      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                      </div>
                      <h3 className="mb-3 font-semibold text-foreground">Visi</h3>
                      <p className="text-sm leading-relaxed text-muted-foreground">{profile.visi}</p>
                    </div>
                  )}
                  {profile.misi && (
                    <div className="rounded-2xl border border-border bg-gradient-to-br from-white to-indigo-50/30 p-8 shadow-sm">
                      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
                      </div>
                      <h3 className="mb-3 font-semibold text-foreground">Misi</h3>
                      <p className="text-sm leading-relaxed whitespace-pre-line text-muted-foreground">
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
