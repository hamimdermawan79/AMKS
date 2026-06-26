'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { updateCalonWargaStatus } from '@/app/(public)/daftar-warga/actions';

type CalonWargaStatus = 'MENUNGGU' | 'DITERIMA' | 'DITOLAK';

interface CalonWarga {
  id: string;
  fotoKtp: string;
  fotoFormal: string;
  namaLengkap: string;
  asalDaerahSambas: string;
  noHp: string;
  jurusan: string;
  namaUniversitas: string;
  tahunMasukAsrama: number;
  alasanMasuk: string;
  namaAyah: string;
  pekerjaanAyah: string;
  noHpAyah: string;
  namaIbu: string;
  pekerjaanIbu: string;
  noHpIbu: string;
  status: CalonWargaStatus;
  catatanAdmin: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Props {
  initialData: CalonWarga[];
}

const STATUS_CONFIG: Record<CalonWargaStatus, { label: string; color: string; bg: string; dot: string }> = {
  MENUNGGU: {
    label: 'Menunggu',
    color: 'text-amber-700',
    bg: 'bg-amber-50 border-amber-200',
    dot: 'bg-amber-400',
  },
  DITERIMA: {
    label: 'Diterima',
    color: 'text-green-700',
    bg: 'bg-green-50 border-green-200',
    dot: 'bg-green-400',
  },
  DITOLAK: {
    label: 'Ditolak',
    color: 'text-red-700',
    bg: 'bg-red-50 border-red-200',
    dot: 'bg-red-400',
  },
};

export default function CalonWargaAdminClient({ initialData }: Props) {
  const [data, setData] = useState<CalonWarga[]>(initialData);
  const [selected, setSelected] = useState<CalonWarga | null>(null);
  const [filterStatus, setFilterStatus] = useState<CalonWargaStatus | 'ALL'>('ALL');
  const [search, setSearch] = useState('');
  const [updating, setUpdating] = useState(false);
  const [catatan, setCatatan] = useState('');
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return data.filter((c) => {
      const matchStatus = filterStatus === 'ALL' || c.status === filterStatus;
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        c.namaLengkap.toLowerCase().includes(q) ||
        c.jurusan.toLowerCase().includes(q) ||
        c.namaUniversitas.toLowerCase().includes(q) ||
        c.asalDaerahSambas.toLowerCase().includes(q);
      return matchStatus && matchSearch;
    });
  }, [data, filterStatus, search]);

  const counts = useMemo(
    () => ({
      ALL: data.length,
      MENUNGGU: data.filter((c) => c.status === 'MENUNGGU').length,
      DITERIMA: data.filter((c) => c.status === 'DITERIMA').length,
      DITOLAK: data.filter((c) => c.status === 'DITOLAK').length,
    }),
    [data]
  );

  async function handleUpdateStatus(status: CalonWargaStatus) {
    if (!selected) return;
    setUpdating(true);
    const res = await updateCalonWargaStatus(selected.id, status, catatan);
    if (res.success) {
      setData((prev) =>
        prev.map((c) =>
          c.id === selected.id ? { ...c, status, catatanAdmin: catatan || null } : c
        )
      );
      setSelected((prev) => (prev ? { ...prev, status, catatanAdmin: catatan || null } : null));
    }
    setUpdating(false);
  }

  function openDetail(c: CalonWarga) {
    setSelected(c);
    setCatatan(c.catatanAdmin ?? '');
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  return (
    <div className="px-0 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Calon Warga Asrama</h1>
        <p className="text-slate-500 text-sm mt-1">
          Kelola pendaftaran calon warga yang masuk dari halaman publik.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {(
          [
            { key: 'ALL', label: 'Total', icon: '📋', color: 'text-slate-700', bg: 'bg-slate-50' },
            { key: 'MENUNGGU', label: 'Menunggu', icon: '⏳', color: 'text-amber-700', bg: 'bg-amber-50' },
            { key: 'DITERIMA', label: 'Diterima', icon: '✅', color: 'text-green-700', bg: 'bg-green-50' },
            { key: 'DITOLAK', label: 'Ditolak', icon: '❌', color: 'text-red-700', bg: 'bg-red-50' },
          ] as const
        ).map((s) => (
          <button
            key={s.key}
            onClick={() => setFilterStatus(s.key)}
            className={`${s.bg} rounded-2xl p-4 text-left border-2 transition-all ${
              filterStatus === s.key ? 'border-primary shadow-md' : 'border-transparent'
            }`}
          >
            <div className="text-2xl mb-1">{s.icon}</div>
            <div className={`text-2xl font-bold ${s.color}`}>{counts[s.key]}</div>
            <div className="text-xs font-medium text-slate-500">{s.label}</div>
          </button>
        ))}
      </div>

      {/* Search & filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama, jurusan, universitas..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as CalonWargaStatus | 'ALL')}
          className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 text-slate-700"
        >
          <option value="ALL">Semua Status</option>
          <option value="MENUNGGU">Menunggu</option>
          <option value="DITERIMA">Diterima</option>
          <option value="DITOLAK">Ditolak</option>
        </select>
      </div>

      {/* Table / List */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <div className="text-5xl mb-3">📭</div>
          <p className="font-medium">Tidak ada data calon warga</p>
          <p className="text-sm mt-1">Belum ada pendaftaran yang masuk atau cocok dengan filter.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-5 py-3.5 font-semibold text-slate-600">Nama</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-slate-600 hidden md:table-cell">Universitas / Jurusan</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-slate-600 hidden lg:table-cell">Tahun</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-slate-600 hidden lg:table-cell">Tanggal Daftar</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-slate-600">Status</th>
                  <th className="text-right px-5 py-3.5 font-semibold text-slate-600">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((c) => {
                  const sc = STATUS_CONFIG[c.status];
                  return (
                    <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={c.fotoFormal}
                            alt={c.namaLengkap}
                            className="w-9 h-9 rounded-full object-cover border border-slate-200 flex-shrink-0"
                          />
                          <div>
                            <p className="font-semibold text-slate-800">{c.namaLengkap}</p>
                            <p className="text-xs text-slate-400">{c.asalDaerahSambas}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 hidden md:table-cell">
                        <p className="font-medium text-slate-700 line-clamp-1">{c.namaUniversitas}</p>
                        <p className="text-xs text-slate-400">{c.jurusan}</p>
                      </td>
                      <td className="px-5 py-4 hidden lg:table-cell text-slate-600 font-medium">{c.tahunMasukAsrama}</td>
                      <td className="px-5 py-4 hidden lg:table-cell text-slate-500 text-xs">{formatDate(c.createdAt)}</td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${sc.bg} ${sc.color}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                          {sc.label}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => openDetail(c)}
                          className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 transition-colors"
                        >
                          Detail
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      <AnimatePresence>
        {selected && (
          <motion.div
            key="modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto"
            onClick={(e) => e.target === e.currentTarget && setSelected(null)}
          >
            <motion.div
              key="modal"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl my-6 overflow-hidden"
            >
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-primary to-blue-600 px-6 py-5 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-white">Detail Calon Warga</h2>
                  <p className="text-white/70 text-sm">{formatDate(selected.createdAt)}</p>
                </div>
                <button
                  onClick={() => setSelected(null)}
                  className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
                {/* Foto */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Foto KTP</p>
                    <img
                      src={selected.fotoKtp}
                      alt="KTP"
                      onClick={() => setLightboxImg(selected.fotoKtp)}
                      className="w-full h-36 object-cover rounded-xl border border-slate-200 cursor-zoom-in hover:opacity-90 transition-opacity"
                    />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Foto Formal</p>
                    <img
                      src={selected.fotoFormal}
                      alt="Formal"
                      onClick={() => setLightboxImg(selected.fotoFormal)}
                      className="w-full h-36 object-cover rounded-xl border border-slate-200 cursor-zoom-in hover:opacity-90 transition-opacity"
                    />
                  </div>
                </div>

                {/* Data Pribadi */}
                <DetailSection title="Data Pribadi">
                  <DetailRow label="Nama Lengkap" value={selected.namaLengkap} />
                  <DetailRow label="Asal Daerah Sambas" value={selected.asalDaerahSambas} />
                  <DetailRow label="No. HP / WhatsApp" value={selected.noHp} href={`https://wa.me/${selected.noHp}`} />
                </DetailSection>

                {/* Data Akademik */}
                <DetailSection title="Data Akademik">
                  <DetailRow label="Universitas / Institut" value={selected.namaUniversitas} />
                  <DetailRow label="Jurusan" value={selected.jurusan} />
                  <DetailRow label="Tahun Masuk Asrama" value={String(selected.tahunMasukAsrama)} />
                  <DetailRow label="Alasan Masuk" value={selected.alasanMasuk} multiline />
                </DetailSection>

                {/* Data Orang Tua */}
                <DetailSection title="Data Orang Tua">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Ayah</p>
                      <DetailRow label="Nama" value={selected.namaAyah} />
                      <DetailRow label="Pekerjaan" value={selected.pekerjaanAyah} />
                      <DetailRow label="No. HP" value={selected.noHpAyah} href={`https://wa.me/${selected.noHpAyah}`} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Ibu</p>
                      <DetailRow label="Nama" value={selected.namaIbu} />
                      <DetailRow label="Pekerjaan" value={selected.pekerjaanIbu} />
                      <DetailRow label="No. HP" value={selected.noHpIbu} href={`https://wa.me/${selected.noHpIbu}`} />
                    </div>
                  </div>
                </DetailSection>

                {/* Status & Catatan */}
                <DetailSection title="Keputusan Admin">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-sm font-medium text-slate-600">Status saat ini:</span>
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${STATUS_CONFIG[selected.status].bg} ${STATUS_CONFIG[selected.status].color}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${STATUS_CONFIG[selected.status].dot}`} />
                      {STATUS_CONFIG[selected.status].label}
                    </span>
                  </div>

                  <div className="mb-4">
                    <label className="text-sm font-semibold text-slate-700 block mb-1.5">Catatan Admin (opsional)</label>
                    <textarea
                      value={catatan}
                      onChange={(e) => setCatatan(e.target.value)}
                      rows={3}
                      placeholder="Tulis catatan atau alasan keputusan..."
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      disabled={updating || selected.status === 'DITERIMA'}
                      onClick={() => handleUpdateStatus('DITERIMA')}
                      className="flex-1 py-3 rounded-xl bg-green-500 text-white font-semibold text-sm hover:bg-green-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed min-h-[44px]"
                    >
                      {updating ? '...' : '✅ Terima'}
                    </button>
                    <button
                      disabled={updating || selected.status === 'MENUNGGU'}
                      onClick={() => handleUpdateStatus('MENUNGGU')}
                      className="flex-1 py-3 rounded-xl bg-amber-400 text-white font-semibold text-sm hover:bg-amber-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed min-h-[44px]"
                    >
                      ⏳ Tunda
                    </button>
                    <button
                      disabled={updating || selected.status === 'DITOLAK'}
                      onClick={() => handleUpdateStatus('DITOLAK')}
                      className="flex-1 py-3 rounded-xl bg-red-500 text-white font-semibold text-sm hover:bg-red-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed min-h-[44px]"
                    >
                      ❌ Tolak
                    </button>
                  </div>
                </DetailSection>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxImg && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 z-[60] flex items-center justify-center p-4"
            onClick={() => setLightboxImg(null)}
          >
            <img
              src={lightboxImg}
              alt="preview"
              className="max-w-full max-h-[90vh] rounded-2xl object-contain shadow-2xl"
            />
            <button
              onClick={() => setLightboxImg(null)}
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────

function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 pb-2 border-b border-slate-100">{title}</h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function DetailRow({
  label,
  value,
  href,
  multiline = false,
}: {
  label: string;
  value: string;
  href?: string;
  multiline?: boolean;
}) {
  return (
    <div className="flex gap-2">
      <span className="text-xs text-slate-400 font-medium w-36 shrink-0 pt-0.5">{label}</span>
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-primary font-medium hover:underline"
        >
          {value}
        </a>
      ) : (
        <span className={`text-sm text-slate-700 font-medium ${multiline ? 'whitespace-pre-wrap' : ''}`}>
          {value}
        </span>
      )}
    </div>
  );
}
