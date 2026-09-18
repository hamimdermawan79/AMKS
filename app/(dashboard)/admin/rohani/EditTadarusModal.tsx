'use client';

import { useState, useMemo, useTransition } from 'react';
import { X, Search, BookOpen, Check, AlertCircle, Sparkles, FileText } from 'lucide-react';
import { QURAN_SURAHS, getSurah, searchSurahs } from '@/lib/rohani/quran';
import { updateRohaniTadarus } from './actions';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  scheduleId: string;
  initialSurah: string;
  initialStartVerse: number;
  initialEndVerse: number;
  initialAdditionalActivities?: string | null;
  onSuccess?: () => void;
};

export default function EditTadarusModal({
  isOpen,
  onClose,
  scheduleId,
  initialSurah,
  initialStartVerse,
  initialEndVerse,
  initialAdditionalActivities,
  onSuccess,
}: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSurahName, setSelectedSurahName] = useState(initialSurah || 'Al-Baqarah');
  const [startVerse, setStartVerse] = useState<number>(initialStartVerse || 1);
  const [endVerse, setEndVerse] = useState<number>(initialEndVerse || 15);
  const [additionalActivities, setAdditionalActivities] = useState(initialAdditionalActivities || '');
  const [errorMsg, setErrorMsg] = useState('');
  const [isPending, startTransition] = useTransition();

  // Selected surah object
  const currentSurah = useMemo(() => {
    return getSurah(selectedSurahName) || QURAN_SURAHS[1]; // fallback Al-Baqarah
  }, [selectedSurahName]);

  // Filtered surah list for search dropdown
  const filteredSurahs = useMemo(() => {
    return searchSurahs(searchQuery);
  }, [searchQuery]);

  if (!isOpen) return null;

  const handleSelectSurah = (surahName: string) => {
    const surah = getSurah(surahName);
    if (!surah) return;
    setSelectedSurahName(surah.name);
    setSearchQuery('');
    setStartVerse(1);
    setEndVerse(Math.min(15, surah.verses));
    setErrorMsg('');
  };

  const handleQuickRange = (range: number) => {
    const newEnd = Math.min(currentSurah.verses, startVerse + range - 1);
    setEndVerse(newEnd);
  };

  const handleFullSurah = () => {
    setStartVerse(1);
    setEndVerse(currentSurah.verses);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (startVerse < 1) {
      setErrorMsg('Ayat mulai minimal 1');
      return;
    }
    if (endVerse < startVerse) {
      setErrorMsg('Ayat sampai tidak boleh lebih kecil dari ayat mulai');
      return;
    }
    if (endVerse > currentSurah.verses) {
      setErrorMsg(`Surah ${currentSurah.name} hanya memiliki ${currentSurah.verses} ayat.`);
      return;
    }

    startTransition(async () => {
      try {
        await updateRohaniTadarus(
          scheduleId,
          currentSurah.name,
          startVerse,
          endVerse,
          additionalActivities
        );
        onSuccess?.();
        onClose();
      } catch (err: any) {
        setErrorMsg(err.message || 'Gagal memperbarui target tadarus');
      }
    });
  };

  const totalVersesSelected = Math.max(0, endVerse - startVerse + 1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-border flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-6 border-b border-border bg-gradient-to-r from-emerald-500 to-teal-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white">Pilih Surah &amp; Target Tadarus</h3>
              <p className="text-xs text-white/80">Kustomisasi surah dan rentang ayat untuk kegiatan rohani</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-white/20 text-white/90 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
          {errorMsg && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-2xl flex items-start gap-2">
              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* 1. Surah Search & Select */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
              1. Pilih Surah Al-Qur'an (114 Surah)
            </label>

            {/* Selected Surah Badge */}
            <div className="p-3.5 bg-emerald-50/80 border border-emerald-200 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white font-bold flex items-center justify-center text-sm shadow-sm">
                  {currentSurah.number}
                </div>
                <div>
                  <h4 className="font-bold text-emerald-950 text-sm">{currentSurah.name}</h4>
                  <p className="text-[11px] text-emerald-700 font-medium">
                    Total: {currentSurah.verses} Ayat
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-bold uppercase bg-emerald-200/70 text-emerald-800 px-2 py-1 rounded-lg">
                Aktif Terpilih
              </span>
            </div>

            {/* Search input */}
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Ketik nama surah atau nomor (mis: Al-Kahf, Yasin, 18)..."
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
            </div>

            {/* Surah List Dropdown (visible when searching or clicked) */}
            {searchQuery.trim() !== '' && (
              <div className="border border-border rounded-2xl max-h-48 overflow-y-auto p-1.5 space-y-1 bg-white shadow-lg">
                {filteredSurahs.length > 0 ? (
                  filteredSurahs.map((surah) => {
                    const isCurrent = surah.name === currentSurah.name;
                    return (
                      <button
                        type="button"
                        key={surah.number}
                        onClick={() => handleSelectSurah(surah.name)}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-colors ${
                          isCurrent
                            ? 'bg-emerald-100/70 text-emerald-900 font-bold'
                            : 'hover:bg-slate-100 text-foreground'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <span className="w-5 text-muted-foreground font-semibold">{surah.number}.</span>
                          <span>{surah.name}</span>
                        </span>
                        <span className="text-[10px] text-muted-foreground font-medium">
                          {surah.verses} Ayat
                        </span>
                      </button>
                    );
                  })
                ) : (
                  <p className="text-center py-4 text-xs text-muted-foreground">
                    Surah tidak ditemukan. Coba ketik nama lain.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* 2. Verse Range Input */}
          <div className="space-y-2 pt-2 border-t border-border/80">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                2. Rentang Ayat Tadarus
              </label>
              <span className="text-[11px] text-muted-foreground font-medium">
                Maks. {currentSurah.verses} ayat
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-muted-foreground mb-1 font-semibold">
                  Ayat Mulai:
                </label>
                <input
                  type="number"
                  min={1}
                  max={currentSurah.verses}
                  value={startVerse}
                  onChange={(e) => {
                    const v = parseInt(e.target.value, 10) || 1;
                    setStartVerse(v);
                    if (v > endVerse) setEndVerse(v);
                  }}
                  className="w-full px-3.5 py-2.5 text-sm font-semibold border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-background"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] text-muted-foreground mb-1 font-semibold">
                  Ayat Sampai (Batas):
                </label>
                <input
                  type="number"
                  min={startVerse}
                  max={currentSurah.verses}
                  value={endVerse}
                  onChange={(e) => {
                    const v = parseInt(e.target.value, 10) || startVerse;
                    setEndVerse(v);
                  }}
                  className="w-full px-3.5 py-2.5 text-sm font-semibold border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-background"
                  required
                />
              </div>
            </div>

            {/* Quick Helper Buttons */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              <button
                type="button"
                onClick={() => handleQuickRange(10)}
                className="text-[10px] font-semibold px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
              >
                +10 Ayat
              </button>
              <button
                type="button"
                onClick={() => handleQuickRange(15)}
                className="text-[10px] font-semibold px-2.5 py-1 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-800 transition-colors"
              >
                +15 Ayat (Standar)
              </button>
              <button
                type="button"
                onClick={() => handleQuickRange(20)}
                className="text-[10px] font-semibold px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
              >
                +20 Ayat
              </button>
              <button
                type="button"
                onClick={handleFullSurah}
                className="text-[10px] font-semibold px-2.5 py-1 rounded-lg bg-teal-100 hover:bg-teal-200 text-teal-800 transition-colors ml-auto"
              >
                Seluruh Surah
              </button>
            </div>
          </div>

          {/* 3. Additional Activities (Tambahan Kegiatan Isi Manual) */}
          <div className="space-y-2 pt-2 border-t border-border/80">
            <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
              <span>3. Tambahan Kegiatan (Isi Manual)</span>
              <span className="text-[10px] font-normal lowercase text-muted-foreground">(opsional)</span>
            </label>
            <textarea
              rows={2}
              value={additionalActivities}
              onChange={(e) => setAdditionalActivities(e.target.value)}
              placeholder="Contoh: Kultum Adab Menuntut Ilmu, Doa Bersama untuk UTS, Evaluasi Tajwid..."
              className="w-full px-3.5 py-2.5 text-xs border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-background"
            />
          </div>

          {/* Live Preview Summary Card */}
          <div className="p-3.5 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-600 text-white flex-shrink-0">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] uppercase font-bold text-emerald-800 block">
                Hasil Target Tadarus:
              </span>
              <span className="text-xs font-bold text-emerald-950">
                QS. {currentSurah.name}: {startVerse} - {endVerse}
              </span>
              <span className="text-[11px] text-emerald-700 ml-1.5 font-medium">
                ({totalVersesSelected} ayat dibaca)
              </span>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 text-sm font-semibold border border-border rounded-xl text-muted-foreground hover:bg-slate-50 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 px-4 py-2.5 text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-60 flex items-center justify-center gap-2"
            >
              <Check className="h-4 w-4" />
              {isPending ? 'Menyimpan...' : 'Simpan Target Surah'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
