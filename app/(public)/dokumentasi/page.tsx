import { db } from '@/lib/db';
import HeroSection from '@/components/HeroSection';

export default async function DokumentasiPage() {
  const documents = await db.document.findMany({
    where: { isPublic: true },
    orderBy: { createdAt: 'desc' },
  });

  const categories = Array.from(new Set(documents.map((d) => d.category || 'Lainnya')));

  return (
    <div className="min-h-screen bg-white">
      <HeroSection title="Dokumentasi" subtitle="Dokumen resmi asrama: AD/ART, peraturan, dan panduan" />

      {/* Content */}
      <section className="pb-24">
        <div className="container mx-auto max-w-3xl px-6">
          {documents.length === 0 ? (
            <div className="rounded-2xl border border-border bg-slate-50/60 p-12 text-center">
              <p className="text-muted-foreground italic">
                Belum ada dokumen yang dipublikasikan.
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {categories.map((cat) => {
                const docs = documents.filter((d) => (d.category || 'Lainnya') === cat);
                return (
                  <div key={cat} className="rounded-2xl border border-border bg-white p-8 shadow-sm">
                    <h2 className="mb-5 text-xl font-semibold text-foreground">{cat}</h2>
                    <div className="space-y-3">
                      {docs.map((doc) => (
                        <a
                          key={doc.id}
                          href={doc.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between rounded-xl border border-border p-4 transition-colors hover:border-primary/30 hover:bg-blue-50/30"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary text-sm font-bold">
                              PDF
                            </div>
                            <div>
                              <p className="font-medium text-foreground">{doc.title}</p>
                              <p className="text-xs text-muted-foreground">
                                {doc.fileUrl.split('.').pop()?.toUpperCase() || 'FILE'}
                              </p>
                            </div>
                          </div>
                          <span className="text-sm font-medium text-primary">Unduh →</span>
                        </a>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
