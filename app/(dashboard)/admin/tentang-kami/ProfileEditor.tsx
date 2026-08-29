'use client';

import { useState } from 'react';
import { saveProfile } from './actions';
import { useRouter } from 'next/navigation';

interface Props {
  profile: any;
  canEdit: boolean;
  userId: string;
}

export default function ProfileEditor({ profile, canEdit, userId }: Props) {
  const router = useRouter();
  const [visi, setVisi] = useState(profile?.visi || '');
  const [misi, setMisi] = useState(profile?.misi || '');
  const [sejarah, setSejarah] = useState(profile?.sejarah || '');
  const [about, setAbout] = useState(profile?.about || '');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg('');
    try {
      await saveProfile({ visi, misi, sejarah, about });
      setMsg('Profil asrama berhasil disimpan.');
      router.refresh();
    } catch (err: any) {
      setMsg(err.message || 'Gagal menyimpan.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="border border-border bg-white p-6">
      <h2 className="font-semibold text-foreground mb-4">Profil Asrama</h2>
      <p className="text-sm text-muted-foreground mb-6">
        Narasi ini akan tampil di halaman Tentang Kami (publik).
      </p>

      {!canEdit ? (
        <p className="text-sm text-muted-foreground italic">Anda tidak memiliki izin untuk mengedit profil.</p>
      ) : (
        <form onSubmit={handleSave} className="space-y-5">
          {msg && (
            <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 text-sm">{msg}</div>
          )}

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Tentang Asrama / Profil Asrama</label>
            <p className="text-xs text-muted-foreground mb-2">
              Dapat terdiri dari beberapa paragraf (gunakan Enter untuk baris/paragraf baru). Paragraf pertama akan ditampilkan di Beranda, dan narasi lengkap akan ditampilkan di halaman Profil Asrama.
            </p>
            <textarea
              value={about}
              onChange={(e) => setAbout(e.target.value)}
              className="input min-h-[120px]"
              placeholder="Tulis narasi tentang asrama..."
              rows={4}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Sejarah</label>
            <textarea
              value={sejarah}
              onChange={(e) => setSejarah(e.target.value)}
              className="input min-h-[100px]"
              placeholder="Sejarah berdirinya asrama..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Visi</label>
              <textarea
                value={visi}
                onChange={(e) => setVisi(e.target.value)}
                className="input min-h-[80px]"
                placeholder="Visi asrama..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Misi</label>
              <textarea
                value={misi}
                onChange={(e) => setMisi(e.target.value)}
                className="input min-h-[80px]"
                placeholder="Misi asrama..."
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Menyimpan...' : 'Simpan Profil'}
          </button>
        </form>
      )}
    </div>
  );
}
