import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: {
    default: 'AMKS - Sistem Asrama',
    template: '%s | AMKS',
  },
  description: 'Sistem pengelolaan asrama digital - manajemen warga, kegiatan, dan keuangan',
  keywords: ['asrama', 'manajemen', 'sistem informasi'],
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
