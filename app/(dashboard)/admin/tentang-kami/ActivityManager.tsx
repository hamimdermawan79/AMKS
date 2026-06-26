'use client';

import { useState } from 'react';
import { createActivity, deleteActivity } from './actions';
import { useRouter } from 'next/navigation';

interface Props {
  activities: any[];
  canCreate: boolean;
  canDelete: boolean;
}

export default function ActivityManager({ activities, canCreate, canDelete }: Props) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [startAt, setStartAt] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Nama kegiatan wajib diisi');
      return;
    }

    setSubmitting(true);
    setProgress('Mengunggah...');
    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('location', location);
      formData.append('startAt', startAt);

      if (coverFile) {
        formData.append('cover', coverFile);
        setProgress('Mengunggah cover...');
      }

      if (youtubeUrl.trim()) {
        formData.append('youtubeUrl', youtubeUrl.trim());
      }

      imageFiles.forEach((file, i) => {
        formData.append(`image_${i}`, file);
      });
      formData.append('imageCount', String(imageFiles.length));

      setProgress(`Mengunggah ${imageFiles.length} foto...`);

      await createActivity(formData);
      resetForm();
      setIsModalOpen(false);
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Gagal membuat kegiatan');
    } finally {
      setSubmitting(false);
      setProgress('');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus kegiatan ini?')) return;
    try {
      await deleteActivity(id);
      router.refresh();
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus');
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setLocation('');
    setCoverFile(null);
    setImageFiles([]);
    setStartAt('');
    setYoutubeUrl('');
    setError('');
    setProgress('');
  };

  return (
    <div className="border border-border bg-white p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-semibold text-foreground">Galeri Kegiatan</h2>
          <p className="text-sm text-muted-foreground">{activities.length} kegiatan</p>
        </div>
        {canCreate && (
          <button
            onClick={() => { resetForm(); setIsModalOpen(true); }}
            className="btn btn-primary text-sm"
          >
            Tambah Kegiatan
          </button>
        )}
      </div>

      {/* Activity List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {activities.map((activity) => (
          <div key={activity.id} className="border border-border overflow-hidden">
            <div
              className="aspect-[16/10] bg-gray-100 bg-cover bg-center"
              style={{ backgroundImage: activity.coverUrl ? `url(${activity.coverUrl})` : 'none' }}
            >
              {!activity.coverUrl && (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
                  No Cover
                </div>
              )}
            </div>
            <div className="p-4 space-y-2">
              <h3 className="font-medium text-foreground leading-snug">{activity.title}</h3>
              {activity.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">{activity.description}</p>
              )}
              {activity.startAt && (
                <p className="text-xs text-muted-foreground">
                  {new Date(activity.startAt).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              )}
              <div className="flex gap-2 pt-2">
                {activity.images?.length > 0 && (
                  <span className="text-xs text-muted-foreground">{activity.images.length} foto</span>
                )}
                {canDelete && (
                  <button
                    onClick={() => handleDelete(activity.id)}
                    className="text-xs text-red-600 hover:underline ml-auto min-h-[44px] px-2 inline-flex items-center"
                  >
                    Hapus
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white border border-border max-w-lg w-full p-6 max-h-[92vh] overflow-y-auto">
            <h3 className="font-semibold text-foreground text-lg mb-6">Tambah Kegiatan Baru</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 text-sm">{error}</div>
              )}
              {progress && (
                <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 text-sm">{progress}</div>
              )}

              <FormField label="Nama Kegiatan" required>
                <input value={title} onChange={(e) => setTitle(e.target.value)} className="input" required />
              </FormField>

              <FormField label="Tanggal Kegiatan">
                <input type="date" value={startAt} onChange={(e) => setStartAt(e.target.value)} className="input" />
              </FormField>

              <FormField label="Lokasi">
                <input value={location} onChange={(e) => setLocation(e.target.value)} className="input" />
              </FormField>

              <FormField label="Link YouTube Video (Opsional)">
                <input 
                  type="url"
                  placeholder="Contoh: https://youtube.com/watch?v=..."
                  value={youtubeUrl} 
                  onChange={(e) => setYoutubeUrl(e.target.value)} 
                  className="input" 
                />
              </FormField>

              <FormField label="Narasi / Deskripsi">
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="input min-h-[100px]" />
              </FormField>

              <FormField label="Foto Thumbnail (Cover) *">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
                  className="input"
                />
                {coverFile && (
                  <p className="text-xs text-green-600 mt-1">Cover terpilih: {coverFile.name}</p>
                )}
              </FormField>

              <FormField label="Foto-Foto Lainnya">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => setImageFiles(Array.from(e.target.files || []))}
                  className="input"
                />
                {imageFiles.length > 0 && (
                  <div className="grid grid-cols-4 gap-2 mt-2">
                    {imageFiles.map((file, i) => (
                      <div key={i} className="aspect-square bg-gray-100 border border-border overflow-hidden">
                        <img src={URL.createObjectURL(file)} alt="" className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-1">{imageFiles.length} foto terpilih</p>
              </FormField>

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <button type="button" onClick={() => { setIsModalOpen(false); resetForm(); }} className="btn btn-secondary flex-1 min-h-[44px]" disabled={submitting}>
                  Batal
                </button>
                <button type="submit" className="btn btn-primary flex-1 min-h-[44px]" disabled={submitting}>
                  {submitting ? 'Mengunggah...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function FormField({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-foreground mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}