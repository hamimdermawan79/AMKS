import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Hubungi Kami',
  description:
    'Kontak resmi Asrama Mahasiswa Kabupaten Sambas Yogyakarta. Email, WhatsApp, alamat lengkap, dan formulir pengiriman pesan.',
  openGraph: {
    title: 'Hubungi Kami | SIMAS-KS',
    description: 'Hubungi pengurus AMKS Yogyakarta untuk informasi dan kerja sama.',
  },
};

export default function HubungiKamiLayout({ children }: { children: React.ReactNode }) {
  return children;
}
