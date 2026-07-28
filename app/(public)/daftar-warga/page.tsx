'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { submitPendaftaranCalonWarga } from './actions';

import { Check, ArrowRight, AlertCircle, Loader2, FileImage, MessageCircle, CreditCard, GraduationCap, BookOpen, Home, Camera, User, Users, PartyPopper, Lightbulb } from 'lucide-react';

// ── Icon helpers ───────────────────────────────────────────────────────────
function IconCheck() { return <Check className="w-5 h-5" strokeWidth={2.5} />; }
function IconArrow() { return <ArrowRight className="w-5 h-5" strokeWidth={2} />; }

// ── Syarat data ────────────────────────────────────────────────────────────
const SYARAT = [
  {
    no: 1,
    icon: <CreditCard className="w-6 h-6" />,
    judul: 'KTP Asli Sambas',
    deskripsi:
      'Memiliki Kartu Tanda Penduduk (KTP) asli yang terdaftar di wilayah Kabupaten Sambas, Kalimantan Barat.',
    detail: 'KTP aktif & alamat tercatat di Kab. Sambas',
  },
  {
    no: 2,
    icon: <GraduationCap className="w-6 h-6" />,
    judul: 'Mahasiswa Aktif di Yogyakarta',
    deskripsi:
      'Sedang menempuh pendidikan aktif di perguruan tinggi (universitas, institut, atau sekolah tinggi) yang berada di wilayah Daerah Istimewa Yogyakarta.',
    detail: 'Surat keterangan mahasiswa aktif diperlukan',
  },
  {
    no: 3,
    icon: <BookOpen className="w-6 h-6" />,
    judul: 'Menaati AD / ART Asrama',
    deskripsi:
      'Bersedia membaca, memahami, dan menaati seluruh Anggaran Dasar / Anggaran Rumah Tangga (AD/ART) serta tata tertib peraturan yang berlaku di asrama.',
    detail: 'AD/ART dapat diunduh di menu Arsip & Dokumen',
  },
];

// ── Component ─────────────────────────────────────────────────────────────
export default function DaftarWargaPage() {
  const [syaratChecked, setSyaratChecked] = useState<boolean[]>([false, false, false]);
  const [step, setStep] = useState<'syarat' | 'form' | 'success'>('syarat');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const formRef = useRef<HTMLFormElement>(null);

  // Preview foto
  const [previewKtp, setPreviewKtp] = useState<string | null>(null);
  const [previewFormal, setPreviewFormal] = useState<string | null>(null);

  const allChecked = syaratChecked.every(Boolean);

  function toggleSyarat(i: number) {
    setSyaratChecked((prev) => {
      const next = [...prev];
      next[i] = !next[i];
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg('');
    const fd = new FormData(e.currentTarget);
    try {
      const res = await submitPendaftaranCalonWarga(fd);
      if (res.success) {
        setStep('success');
      } else {
        setErrorMsg(res.error ?? 'Terjadi kesalahan. Silakan coba lagi.');
      }
    } catch {
      setErrorMsg('Terjadi kesalahan jaringan. Silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleFileChange(
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (v: string | null) => void
  ) {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setter(url);
    }
  }

  // ── Tahun options ────────────────────────────────────────────────────────
  const currentYear = new Date().getFullYear();
  const tahunOptions = Array.from({ length: 5 }, (_, i) => currentYear + i);

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100 pt-28 pb-20">
      <div className="container mx-auto px-4 max-w-3xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-4">
            <Home className="w-4 h-4" /> Pendaftaran Calon Warga
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-3">
            Bergabung dengan Asrama <br />
            <span className="text-primary">Mahasiswa Kab. Sambas</span>
          </h1>
          <p className="text-slate-500 max-w-lg mx-auto">
            Pastikan kamu memenuhi semua persyaratan berikut sebelum melanjutkan pendaftaran.
          </p>
        </motion.div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-3 mb-10">
          {['Persyaratan', 'Isi Formulir', 'Selesai'].map((label, idx) => {
            const stepMap = ['syarat', 'form', 'success'];
            const isActive = stepMap.indexOf(step) >= idx;
            const isCurrent = stepMap[idx] === step;
            return (
              <div key={label} className="flex items-center gap-3">
                <div
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold transition-all ${
                    isCurrent
                      ? 'bg-primary text-white shadow-md shadow-primary/30'
                      : isActive
                      ? 'bg-green-500 text-white'
                      : 'bg-white text-slate-400 border border-slate-200'
                  }`}
                >
                  {isActive && !isCurrent ? <IconCheck /> : <span>{idx + 1}</span>}
                  <span className="hidden sm:inline">{label}</span>
                </div>
                {idx < 2 && (
                  <div
                    className={`w-8 h-0.5 rounded ${
                      stepMap.indexOf(step) > idx ? 'bg-primary' : 'bg-slate-200'
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          {/* ── STEP 1: SYARAT ──────────────────────────────────────────────── */}
          {step === 'syarat' && (
            <motion.div
              key="syarat"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 30 }}
              transition={{ duration: 0.3 }}
            >
              {/* Timeline */}
              <div className="relative mb-8">
                {/* vertical line */}
                <div className="absolute left-8 top-8 bottom-8 w-0.5 bg-gradient-to-b from-primary via-primary/50 to-primary/20 hidden sm:block" />

                <div className="space-y-5">
                  {SYARAT.map((s, i) => (
                    <motion.div
                      key={s.no}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.12 }}
                      onClick={() => toggleSyarat(i)}
                      className={`relative flex gap-5 p-5 rounded-2xl border-2 cursor-pointer transition-all select-none ${
                        syaratChecked[i]
                          ? 'border-primary bg-primary/5 shadow-md shadow-primary/10'
                          : 'border-slate-200 bg-white hover:border-primary/40 hover:shadow-sm'
                      }`}
                    >
                      {/* Circle node */}
                      <div
                        className={`relative z-10 flex-shrink-0 w-16 h-16 rounded-2xl flex items-center justify-center text-2xl shadow-sm transition-all ${
                          syaratChecked[i] ? 'bg-primary text-white' : 'bg-slate-100'
                        }`}
                      >
                        {syaratChecked[i] ? <IconCheck /> : s.icon}
                      </div>

                      {/* Content */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <span className="text-xs font-bold text-primary/60 uppercase tracking-widest">
                              Syarat {s.no}
                            </span>
                            <h3 className="text-lg font-bold text-slate-800 mt-0.5">{s.judul}</h3>
                          </div>
                          {/* Checkbox visual */}
                          <div
                            className={`mt-1 w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                              syaratChecked[i]
                                ? 'bg-primary border-primary text-white'
                                : 'border-slate-300'
                            }`}
                          >
                            {syaratChecked[i] && (
                              <Check className="w-3.5 h-3.5" strokeWidth={3} />
                            )}
                          </div>
                        </div>
                        <p className="text-slate-500 text-sm mt-2 leading-relaxed">{s.deskripsi}</p>
                        <div
                          className={`inline-flex items-center gap-1.5 mt-3 text-xs font-medium px-3 py-1 rounded-full ${
                            syaratChecked[i]
                              ? 'bg-primary/10 text-primary'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          <AlertCircle className="w-3.5 h-3.5" strokeWidth={2} />
                          {s.detail}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Instruction */}
              <div className="text-center mb-6 text-sm text-slate-400">
                {allChecked
                  ? <span className="inline-flex items-center gap-1.5"><Check className="w-4 h-4" /> Semua syarat terpenuhi! Kamu bisa melanjutkan pendaftaran.</span>
                  : `Klik setiap syarat untuk mencentangnya (${syaratChecked.filter(Boolean).length}/3 terpenuhi)`}
              </div>

              <motion.button
                disabled={!allChecked}
                onClick={() => setStep('form')}
                whileTap={{ scale: 0.97 }}
                className={`w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-bold text-lg transition-all ${
                  allChecked
                    ? 'bg-primary text-white shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 hover:scale-[1.01]'
                    : 'bg-slate-100 text-slate-300 cursor-not-allowed'
                }`}
              >
                Lanjut Isi Formulir Pendaftaran
                <ArrowRight className="w-5 h-5" />
              </motion.button>
            </motion.div>
          )}

          {/* ── STEP 2: FORM ────────────────────────────────────────────────── */}
          {step === 'form' && (
            <motion.div
              key="form"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.3 }}
            >
              <div className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/60 overflow-hidden">
                <div className="bg-gradient-to-r from-primary to-blue-600 px-8 py-6">
                  <h2 className="text-xl font-bold text-white">Formulir Pendaftaran Calon Warga</h2>
                  <p className="text-white/70 text-sm mt-1">Isi semua data dengan benar dan lengkap</p>
                </div>

                <form ref={formRef} onSubmit={handleSubmit} className="p-8 space-y-8">

                  {/* ── Foto ─────────────────────────────────────────────── */}
                  <Section title={<span className="inline-flex items-center gap-2"><Camera className="w-5 h-5" /> Foto Dokumen & Diri</span>}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <FileUpload
                        name="fotoKtp"
                        label="Foto KTP"
                        required
                        accept="image/*"
                        preview={previewKtp}
                        onChange={(e) => handleFileChange(e, setPreviewKtp)}
                        hint="Upload foto KTP asli Kabupaten Sambas"
                      />
                      <FileUpload
                        name="fotoFormal"
                        label="Foto Formal"
                        required
                        accept="image/*"
                        preview={previewFormal}
                        onChange={(e) => handleFileChange(e, setPreviewFormal)}
                        hint="Foto terbaru berpakaian rapi / formal"
                      />
                    </div>
                  </Section>

                  {/* ── Data Pribadi ──────────────────────────────────────── */}
                  <Section title={<span className="inline-flex items-center gap-2"><User className="w-5 h-5" /> Data Pribadi</span>}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Field name="namaLengkap" label="Nama Lengkap" required placeholder="Nama sesuai KTP" className="sm:col-span-2" />
                      <Field name="asalDaerahSambas" label="Asal Daerah di Sambas" required placeholder="Contoh: Kec. Sambas, Desa Dalam Kaum" className="sm:col-span-2" />
                      <Field name="noHp" label="Nomor HP / WhatsApp" required placeholder="628xxxxxxxxxx" type="tel" />
                    </div>
                  </Section>

                  {/* ── Data Akademik ─────────────────────────────────────── */}
                  <Section title={<span className="inline-flex items-center gap-2"><GraduationCap className="w-5 h-5" /> Data Akademik</span>}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Field name="jurusan" label="Jurusan / Program Studi" required placeholder="Contoh: Teknik Informatika" />
                      <Field name="namaUniversitas" label="Nama Universitas / Institut / Sekolah Tinggi" required placeholder="Contoh: Universitas Gadjah Mada" className="sm:col-span-2" />
                      <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-semibold text-slate-700">
                          Ingin Masuk Asrama Tahun <span className="text-red-500">*</span>
                        </label>
                        <select
                          name="tahunMasukAsrama"
                          required
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                        >
                          <option value="">-- Pilih Tahun --</option>
                          {tahunOptions.map((y) => (
                            <option key={y} value={y}>{y}</option>
                          ))}
                        </select>
                      </div>
                      <div className="flex flex-col gap-1.5 sm:col-span-2">
                        <label className="text-sm font-semibold text-slate-700">
                          Alasan Ingin Masuk Asrama <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          name="alasanMasuk"
                          required
                          rows={4}
                          placeholder="Ceritakan alasan dan motivasimu ingin menjadi warga asrama..."
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all resize-none"
                        />
                      </div>
                    </div>
                  </Section>

                  {/* ── Data Orang Tua ────────────────────────────────────── */}
                  <Section title={<span className="inline-flex items-center gap-2"><Users className="w-5 h-5" /> Data Orang Tua</span>}>
                    <div className="grid grid-cols-1 gap-6">
                      {/* Ayah */}
                      <div>
                        <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">Ayah</p>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <Field name="namaAyah" label="Nama Ayah" required placeholder="Nama lengkap ayah" />
                          <Field name="pekerjaanAyah" label="Pekerjaan Ayah" required placeholder="Contoh: Petani" />
                          <Field name="noHpAyah" label="No. HP Ayah" required placeholder="628xxxxxxxxxx" type="tel" />
                        </div>
                      </div>
                      {/* Ibu */}
                      <div>
                        <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">Ibu</p>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <Field name="namaIbu" label="Nama Ibu" required placeholder="Nama lengkap ibu" />
                          <Field name="pekerjaanIbu" label="Pekerjaan Ibu" required placeholder="Contoh: Ibu Rumah Tangga" />
                          <Field name="noHpIbu" label="No. HP Ibu" required placeholder="628xxxxxxxxxx" type="tel" />
                        </div>
                      </div>
                    </div>
                  </Section>

                  {/* ── Error msg ──────────────────────────────────────────── */}
                  {errorMsg && (
                    <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
                      <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" strokeWidth={2} />
                      {errorMsg}
                    </div>
                  )}

                  {/* ── Actions ────────────────────────────────────────────── */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setStep('syarat')}
                      className="flex-1 py-3.5 rounded-xl border-2 border-slate-200 text-slate-600 font-semibold hover:border-slate-300 hover:bg-slate-50 transition-all"
                    >
                      ← Kembali
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-[2] flex items-center justify-center gap-2 py-3.5 rounded-xl bg-primary text-white font-bold shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 hover:scale-[1.01] transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Mengirim...
                        </>
                      ) : (
                        <>Kirim Pendaftaran <IconArrow /></>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}

          {/* ── STEP 3: SUCCESS ─────────────────────────────────────────────── */}
          {step === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="overflow-hidden bg-white rounded-3xl border border-slate-200 shadow-xl"
            >
              {/* Top gradient banner */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-8 text-center">
                <motion.div
                  initial={{ scale: 0, rotate: -10 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.15, type: 'spring', stiffness: 260, damping: 18 }}
                  className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-4 text-4xl shadow-lg"
                >
                  <PartyPopper className="w-12 h-12" />
                </motion.div>
                <h2 className="text-2xl font-bold text-white mb-1">Yeay! Pendaftaran Berhasil!</h2>
                <p className="text-white/75 text-sm">
                  Kamu resmi terdaftar sebagai <span className="font-semibold text-white">Calon Warga Asrama</span>
                </p>
              </div>

              {/* Body */}
              <div className="px-8 py-8 space-y-5">
                {/* Main message */}
                <div className="text-center">
                  <p className="text-slate-600 leading-relaxed">
                    Selamat! Formulir pendaftaranmu sudah kami terima. Langkah selanjutnya adalah{' '}
                    <strong className="text-slate-800">datang langsung ke Asrama Mahasiswa Sambas</strong> dan
                    pengurus asrama akan menyambut serta mengarahkanmu.
                  </p>
                </div>

                {/* Steps info cards */}
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-4 rounded-2xl bg-blue-50 border border-blue-100">
                    <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center text-sm font-bold">1</div>
                    <div>
                      <p className="font-semibold text-slate-800 text-sm">Datang ke Asrama</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Kunjungi Asrama Mahasiswa Kabupaten Sambas Yogyakarta dan temui pengurus asrama.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 rounded-2xl bg-indigo-50 border border-indigo-100">
                    <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center text-sm font-bold">2</div>
                    <div>
                      <p className="font-semibold text-slate-800 text-sm">Masa Calon Warga (3 Bulan)</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Kamu akan menjalani masa tinggal bersama selama ±3 bulan sebagai calon warga asrama.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 rounded-2xl bg-green-50 border border-green-100">
                    <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-green-600 text-white flex items-center justify-center text-sm font-bold">3</div>
                    <div>
                      <p className="font-semibold text-slate-800 text-sm">Evaluasi & Penerimaan</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Keputusan penerimaan sebagai warga resmi ditentukan berdasarkan hasil evaluasi warga asrama.
                      </p>
                    </div>
                  </div>
                </div>

                {/* WA Community Banner */}
                <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-white/20 rounded-xl">
                      <MessageCircle className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-base">Gabung Komunitas WhatsApp AMKS</h4>
                      <p className="text-xs text-emerald-100 mt-0.5">
                        Dapatkan informasi terbaru mengenai seleksi calon warga dan kegiatan asrama.
                      </p>
                    </div>
                  </div>
                  <a
                    href="https://chat.whatsapp.com/Kirz0Y44CRNLijyhLTfmuS"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-white text-emerald-700 font-bold text-sm hover:bg-emerald-50 transition-all shadow-sm"
                  >
                    <MessageCircle className="w-4 h-4" /> Klik Disini Untuk Join Komunitas WA
                  </a>
                </div>

                {/* Info banner */}
                <div className="flex items-center gap-3 p-4 rounded-2xl bg-amber-50 border border-amber-200">
                  <Lightbulb className="w-5 h-5" />
                  <p className="text-xs text-amber-800 leading-relaxed">
                    <strong>Tips:</strong> Jika ada pertanyaan, hubungi pengurus melalui nomor yang tertera di halaman{' '}
                    <a href="/hubungi-kami" className="underline font-semibold">Hubungi Kami</a>.
                  </p>
                </div>

                {/* CTA */}
                <div className="pt-2 flex flex-col sm:flex-row gap-3">
                  <a
                    href="/"
                    className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl border-2 border-slate-200 text-slate-600 font-semibold text-sm hover:border-slate-300 hover:bg-slate-50 transition-all"
                  >
                    ← Kembali ke Beranda
                  </a>
                  <a
                    href="/hubungi-kami"
                    className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl bg-primary text-white font-semibold text-sm shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 hover:scale-[1.01] transition-all"
                  >
                    Hubungi Pengurus →
                  </a>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ── Reusable sub-components ───────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-base font-bold text-slate-700 mb-4 pb-2 border-b border-slate-100">{title}</h3>
      {children}
    </div>
  );
}

function Field({
  name,
  label,
  required,
  placeholder,
  type = 'text',
  className = '',
}: {
  name: string;
  label: string;
  required?: boolean;
  placeholder?: string;
  type?: string;
  className?: string;
}) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label htmlFor={name} className="text-sm font-semibold text-slate-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-800 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
      />
    </div>
  );
}

function FileUpload({
  name,
  label,
  required,
  accept,
  preview,
  onChange,
  hint,
}: {
  name: string;
  label: string;
  required?: boolean;
  accept?: string;
  preview: string | null;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  hint?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-semibold text-slate-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <label
        htmlFor={name}
        className="relative flex flex-col items-center justify-center gap-2 border-2 border-dashed border-slate-300 rounded-xl p-4 cursor-pointer hover:border-primary/60 hover:bg-primary/5 transition-all min-h-[140px] overflow-hidden"
      >
        {preview ? (
          <img src={preview} alt="preview" className="absolute inset-0 w-full h-full object-cover rounded-xl" />
        ) : (
          <>
            <FileImage className="w-8 h-8 text-slate-400" strokeWidth={1.5} />
            <span className="text-sm font-medium text-slate-500">Klik untuk upload</span>
            {hint && <span className="text-xs text-slate-400 text-center">{hint}</span>}
          </>
        )}
        <input id={name} name={name} type="file" accept={accept} required={required} onChange={onChange} className="sr-only" />
      </label>
      {preview && (
        <p className="text-xs text-green-600 font-medium"><Check className="w-3 h-3 inline" /> Foto berhasil dipilih</p>
      )}
    </div>
  );
}
