import type { ScientificWorkType } from '@prisma/client';

// Label tampilan untuk tiap jenis karya ilmiah
export const WORK_TYPE_LABELS: Record<ScientificWorkType, string> = {
  SKRIPSI: 'Skripsi',
  TESIS: 'Tesis',
  DISERTASI: 'Disertasi',
  JURNAL: 'Jurnal',
  ARTIKEL: 'Artikel',
  MAKALAH: 'Makalah',
  PROCEEDING: 'Prosiding',
  LAPORAN_PENELITIAN: 'Laporan Penelitian',
  LAINNYA: 'Lainnya',
};

// Daftar opsi untuk dropdown form (urutan tampil)
export const WORK_TYPE_OPTIONS: { value: ScientificWorkType; label: string }[] = [
  { value: 'SKRIPSI', label: 'Skripsi' },
  { value: 'TESIS', label: 'Tesis' },
  { value: 'DISERTASI', label: 'Disertasi' },
  { value: 'JURNAL', label: 'Jurnal' },
  { value: 'ARTIKEL', label: 'Artikel' },
  { value: 'MAKALAH', label: 'Makalah' },
  { value: 'PROCEEDING', label: 'Prosiding' },
  { value: 'LAPORAN_PENELITIAN', label: 'Laporan Penelitian' },
  { value: 'LAINNYA', label: 'Lainnya' },
];
