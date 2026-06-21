import { db } from '@/lib/db';
import GaleriGrid from './GaleriGrid';
import HeroSection from '@/components/HeroSection';

export default async function GaleriPage() {
  const activities = await db.activity.findMany({
    orderBy: { startAt: 'desc' },
    take: 24,
  });

  return (
    <div className="min-h-screen bg-white">
      <HeroSection title="Galeri Kegiatan" subtitle="Dokumentasi kegiatan dan momen bersama warga asrama" />

      <section className="pb-24">
        <div className="container mx-auto max-w-6xl px-6">
          {activities.length === 0 ? (
            <div className="rounded-2xl border border-border bg-slate-50/60 p-12 text-center">
              <p className="text-muted-foreground italic">
                Belum ada kegiatan yang dipublikasikan.
              </p>
            </div>
          ) : (
            <GaleriGrid activities={activities} />
          )}
        </div>
      </section>
    </div>
  );
}
