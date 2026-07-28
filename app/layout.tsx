import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#1d4ed8',
};

export const metadata: Metadata = {
  metadataBase: new URL('https://amks-yogyakarta.vercel.app'),
  title: {
    default: 'SIMAS-KS | Sistem Informasi Manajemen Asrama Kabupaten Sambas',
    template: '%s | SIMAS-KS',
  },
  description:
    'Platform digital resmi Asrama Mahasiswa Kabupaten Sambas Yogyakarta. Manajemen warga, kegiatan, keuangan, kebersihan, dan karya ilmiah dalam satu sistem terintegrasi.',
  keywords: [
    'asrama sambas',
    'asrama mahasiswa yogyakarta',
    'SIMAS-KS',
    'manajemen asrama',
    'AMKS',
    'asrama kabupaten sambas',
    'sistem informasi asrama',
    'asrama yogyakarta',
    'warga asrama',
    'kegiatan asrama',
  ],
  authors: [{ name: 'AMKS Yogyakarta' }],
  creator: 'AMKS Yogyakarta',
  publisher: 'AMKS Yogyakarta',
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'id_ID',
    url: 'https://amks-yogyakarta.vercel.app',
    siteName: 'SIMAS-KS',
    title: 'SIMAS-KS | Sistem Informasi Manajemen Asrama Kabupaten Sambas',
    description:
      'Platform digital resmi Asrama Mahasiswa Kabupaten Sambas Yogyakarta. Manajemen warga, kegiatan, keuangan, dan karya ilmiah.',
    images: [
      {
        url: '/images/og-default.png',
        width: 1200,
        height: 630,
        alt: 'SIMAS-KS - Sistem Informasi Manajemen Asrama Kabupaten Sambas',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SIMAS-KS | Sistem Informasi Manajemen Asrama Kabupaten Sambas',
    description:
      'Platform digital resmi Asrama Mahasiswa Kabupaten Sambas Yogyakarta.',
    images: ['/images/og-default.png'],
  },
  alternates: {
    canonical: 'https://amks-yogyakarta.vercel.app',
  },
  icons: {
    icon: [
      { url: '/images/favicon.ico', sizes: 'any' },
    ],
    shortcut: '/images/favicon.ico',
  },
  manifest: '/manifest.json',
  verification: {
    google: 'G-XXXXXXXXXX', // ponytail: ganti dengan Google Search Console verification code
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
