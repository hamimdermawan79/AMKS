import { Metadata } from 'next';
import { db } from '@/lib/db';

export const metadata: Metadata = {
  title: 'Format Surat - Asrama Mahasiswa Kabupaten Sambas',
  description: 'Unduh format surat resmi Asrama Mahasiswa Kabupaten Sambas seperti surat izin, surat peminjaman, dan lainnya.',
};

export const revalidate = 60;

export default async function FormatSuratPublicPage() {
  const templates = await db.letterTemplate.findMany({
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="min-h-screen bg-slate-50 pt-32 pb-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 tracking-tight mb-6">
            Format Surat
          </h1>
          <p className="text-lg text-slate-600 leading-relaxed">
            Unduh format surat resmi yang disediakan oleh sekretaris Asrama Mahasiswa Kabupaten Sambas. 
            Isi formulir yang sudah diunduh, lalu serahkan kepada pengurus untuk diproses.
          </p>
        </div>

        {/* Template List */}
        {templates.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-2xl shadow-sm border border-slate-100">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">Belum Ada Format Surat</h3>
            <p className="text-slate-500">Format surat sedang disiapkan oleh pengurus sekretaris.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {templates.map((template, i) => (
              <div
                key={template.id}
                className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-all border border-slate-100 flex items-start gap-5 animate-in fade-in slide-in-from-bottom-4 group"
                style={{ animationDelay: `${i * 80}ms`, animationFillMode: 'both' }}
              >
                {/* File Icon */}
                <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                  <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-slate-900 mb-1 truncate">{template.name}</h3>
                  {template.description && (
                    <p className="text-sm text-slate-500 mb-3 line-clamp-2">{template.description}</p>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">
                      {new Date(template.createdAt).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </span>
                    <a
                      href={template.fileUrl}
                      download={template.fileName}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Unduh
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
