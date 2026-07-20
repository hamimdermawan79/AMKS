import { db } from '@/lib/db';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Calendar, MapPin, User, ArrowLeft } from 'lucide-react';

function getYoutubeEmbedUrl(url: string) {
  let videoId = '';
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes('youtube.com')) {
      videoId = parsed.searchParams.get('v') || '';
    } else if (parsed.hostname.includes('youtu.be')) {
      videoId = parsed.pathname.slice(1);
    }
  } catch (e) {
    // ignore
  }
  return videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1` : null;
}

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

  const youtubeEmbedUrl = activity.youtubeUrl ? getYoutubeEmbedUrl(activity.youtubeUrl) : null;

  return (
    <div className="min-h-screen bg-white pt-28 pb-24 md:pt-36 relative overflow-hidden">
      
      {/* ── BACKGROUND COLLAGE COVER ── */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        {allPhotos.map((url, i) => {
          const isRight = i % 2 === 0;
          const topPosition = `${i * 600}px`; // Space them out vertically
          
          return (
            <div 
              key={i} 
              className={`absolute top-0 ${isRight ? 'right-0' : 'left-0'} w-full md:w-3/4 lg:w-2/3 h-[600px] md:h-[800px]`}
              style={{ marginTop: topPosition }}
            >
              <div
                className={`absolute inset-0 bg-cover opacity-10 ${isRight ? 'bg-right-top' : 'bg-left-top'}`}
                style={{ backgroundImage: `url(${url})` }}
              />
              {/* Smooth horizontal blend */}
              <div className={`absolute inset-y-0 ${isRight ? 'left-0' : 'right-0'} w-2/3 bg-gradient-to-${isRight ? 'r' : 'l'} from-white via-white/80 to-transparent`} />
              {/* Smooth vertical blends */}
              <div className="absolute inset-x-0 bottom-0 h-48 md:h-64 bg-gradient-to-t from-white via-white/80 to-transparent" />
              <div className="absolute inset-x-0 top-0 h-32 md:h-48 bg-gradient-to-b from-white via-white/80 to-transparent" />
            </div>
          );
        })}
      </div>

      <div className="container mx-auto px-6 max-w-4xl relative z-10">
        
        {/* Back Navigation */}
        <Link
          href="/tentang-kami/galeri"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors mb-10"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Galeri
        </Link>

        {/* ── HEADER & META ── */}
        <header className="mb-12">
          <h1 className="text-3xl md:text-5xl font-bold text-slate-800 mb-6 leading-tight">
            {activity.title}
          </h1>

          <div className="flex flex-wrap items-center gap-6 text-sm font-medium text-slate-500 border-b border-slate-200 pb-6">
            {activity.startAt && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-blue-500" />
                <span>
                  {new Date(activity.startAt).toLocaleDateString('id-ID', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
              </div>
            )}
            {activity.location && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-rose-500" />
                <span>{activity.location}</span>
              </div>
            )}
            {activity.createdBy && (
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-amber-500" />
                <span>Oleh {activity.createdBy.fullName}</span>
              </div>
            )}
          </div>
        </header>

        {/* ── CONTENT (NARASI) ── */}
        {activity.description && (
          <div className="prose prose-lg max-w-none mb-14 text-slate-600 leading-relaxed whitespace-pre-line">
            {activity.description}
          </div>
        )}

        {/* ── VIDEO YOUTUBE ── */}
        {youtubeEmbedUrl && (
          <div className="mb-12">
            <h2 className="text-xl font-semibold text-foreground mb-6">
              Video Kegiatan
            </h2>
            <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-100 border border-border shadow-md">
              <iframe
                src={youtubeEmbedUrl}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="absolute inset-0 w-full h-full"
              ></iframe>
            </div>
          </div>
        )}

        {/* ── PHOTO GALLERY ── */}
        {allPhotos.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold text-foreground mb-6">
              Dokumentasi Foto
            </h2>

            {/* First photo — large hero */}
            <div className="relative overflow-hidden mb-4 aspect-[16/9] rounded-xl">
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
              <div className="columns-2 md:columns-3 gap-4 space-y-4">
                {allPhotos.slice(1).map((url, i) => (
                  <div
                    key={i}
                    className="group relative overflow-hidden bg-slate-100 rounded-xl break-inside-avoid border border-border shadow-sm hover:shadow-md transition-shadow"
                  >
                    <Image 
                      src={url} 
                      alt={`Dokumentasi tambahan ${i+1}`} 
                      width={800}
                      height={600}
                      sizes="(max-width: 768px) 50vw, 33vw"
                      className="w-full h-auto object-cover transition-transform duration-700 ease-out group-hover:scale-105" 
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-500 pointer-events-none" />
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
