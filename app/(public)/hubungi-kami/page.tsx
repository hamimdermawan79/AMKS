import HeroSection from '@/components/HeroSection';

export default function HubungiKamiPage() {
  return (
    <div className="min-h-screen bg-white">
      <HeroSection title="Hubungi Kami" subtitle="Informasi kontak dan cara menghubungi pengelola asrama" />

      {/* Content */}
      <section className="pb-24">
        <div className="container mx-auto max-w-4xl px-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Kontak */}
            <div className="rounded-2xl border border-border bg-white p-8 shadow-sm">
              <h2 className="mb-5 text-lg font-semibold text-foreground">Kontak</h2>
              <ul className="space-y-5">
                <li className="flex gap-4">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Email</p>
                    <p className="text-sm text-muted-foreground">info@amks.id</p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-green-50 text-green-600">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">WhatsApp</p>
                    <p className="text-sm text-muted-foreground">+62 xxx xxxx xxxx</p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Telepon</p>
                    <p className="text-sm text-muted-foreground">+62 xxx xxxx xxxx</p>
                  </div>
                </li>
              </ul>
            </div>

            {/* Alamat */}
            <div className="rounded-2xl border border-border bg-white p-8 shadow-sm">
              <h2 className="mb-5 text-lg font-semibold text-foreground">Alamat</h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                [Alamat lengkap asrama]
                <br />
                [Kota, Provinsi]
                <br />
                [Kode Pos]
              </p>
              <div className="mt-6 rounded-xl border border-border bg-slate-50 p-6 text-center">
                <p className="text-sm text-muted-foreground italic">
                  Peta lokasi akan ditambahkan di fase berikutnya
                </p>
              </div>
            </div>
          </div>

          {/* Formulir */}
          <div className="mt-8 rounded-2xl border border-border bg-white p-8 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-foreground">Formulir Kontak</h2>
            <div className="rounded-xl border border-border bg-slate-50 p-8 text-center">
              <p className="text-sm text-muted-foreground">
                Formulir kontak akan diimplementasikan di fase berikutnya
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
