import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Daftar Jadi Warga',
  description:
    'Formulir pendaftaran calon warga Asrama Mahasiswa Kabupaten Sambas Yogyakarta. Daftar sekarang dan jadi bagian dari keluarga besar AMKS.',
  openGraph: {
    title: 'Daftar Jadi Warga | SIMAS-KS',
    description: 'Pendaftaran calon warga asrama mahasiswa Kabupaten Sambas Yogyakarta.',
  },
};

export default function DaftarWargaLayout({ children }: { children: React.ReactNode }) {
  return children;
}
