import { db } from '@/lib/db';
import { notFound } from 'next/navigation';
import Link from 'next/link';

export default async function ActivityDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const activity = await db.activity.findUnique({
    where: { id },
    include: { createdBy: { select: { fullName: true } } },
  });

  if (!activity) notFound();

  const allPhotos = [
    ...(activity.coverUrl ? [activity.coverUrl] : []),
    ...(activity.images ?? []),
  ];

  return (
    <div className="min-h-screen bg-white">

      {/* ── COVER HERO ── */}
      {activity.coverUrl && (
        <div className="relative h-[360px] md:h-[480px] overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${activity.coverUrl})` }}
          />
          {/* Smooth blends */}
          <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-white to-transparent" />
          <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/20 to-transparent" />
          <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-white/20 to-transparent" />
          <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-white/20 to-transparent" />
        </div>
      )}

      {/* ── CONTENT ── */}
      <div className="container mx-auto px-6 max-w-4xl py-12">

        {/* Back */}
        <Link
          href="/tentang-kami"
          className="text-sm text-primary hover:underline mb-6 inline-block"
        >
          &larr; Kembali ke Galeri
        </Link>

        {/* Title & Meta */}
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
          {activity.title}
        </h1>

        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-8">
          {activity.startAt && (
            <span>
              {new Date(activity.startAt).toLocaleDateString('id-ID', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
          )}
          {activity.location && (
            <span>{activity.location}</span>
          )}
          {activity.createdBy && (
            <span>oleh {activity.createdBy.fullName}</span>
          )}
        </div>

        {/* Narasi */}
        {activity.description && (
          <div className="prose max-w-none mb-12">
            <p className="text-muted-foreground leading-relaxed text-lg whitespace-pre-line">
              {activity.description}
            </p>
          </div>
        )}

        {/* ── PHOTO GALLERY ── */}
        {allPhotos.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold text-foreground mb-6">
              Dokumentasi Foto
            </h2>

            {/* First photo — large hero */}
            <div className="relative overflow-hidden mb-4 aspect-[16/9]">
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${allPhotos[0]})` }}
              />
              <div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-white/10 to-transparent" />
              <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-white/10 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/20 to-transparent" />
            </div>

            {/* Remaining photos — masonry grid */}
            {allPhotos.length > 1 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {allPhotos.slice(1).map((url, i) => (
                  <div
                    key={i}
                    className="relative overflow-hidden aspect-square bg-slate-100"
                  >
                    <div
                      className="absolute inset-0 bg-cover bg-center transition-transform duration-500 hover:scale-105"
                      style={{ backgroundImage: `url(${url})` }}
                    />
                    {/* Smooth edge blend */}
                    <div className="absolute inset-0 shadow-[inset_0_0_20px_rgba(255,255,255,0.15)]" />
                    <div className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-white/15 to-transparent" />
                    <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-white/15 to-transparent" />
                    <div className="absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-white/10 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-white/10 to-transparent" />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
