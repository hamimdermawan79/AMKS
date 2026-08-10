'use client';

import { useState } from 'react';
import { uploadDoc, deleteDoc } from './actions';
import { useRouter } from 'next/navigation';

interface Doc {
  id: string;
  title: string;
  description: string | null;
  fileUrl: string;
  category: string | null;
  isPublic: boolean;
}

interface Props {
  documents: Doc[];
  canCreate: boolean;
  canDelete: boolean;
}

export default function DocumentManager({ documents, canCreate, canDelete }: Props) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [cover, setCover] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Peraturan untuk Calon Warga Asrama');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setCategory('Peraturan untuk Calon Warga Asrama');
    setFile(null);
    setCover(null);
    setError('');
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Pilih file terlebih dahulu');
      return;
    }
    if (!title.trim()) {
      setError('Judul dokumen wajib diisi');
      return;
    }

    setUploading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (cover) {
        formData.append('cover', cover);
      }
      formData.append('title', title);
      formData.append('description', description);
      formData.append('category', category);

      await uploadDoc(formData);
      resetForm();
      setIsModalOpen(false);
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Gagal mengunggah');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus dokumen ini?')) return;
    try {
      await deleteDoc(id);
      router.refresh();
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus');
    }
  };

  return (
    <div className="border border-border bg-white p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-semibold text-foreground">Peraturan Asrama &amp; Dokumentasi</h2>
          <p className="text-sm text-muted-foreground">{documents.length} dokumen publik</p>
        </div>
        {canCreate && (
          <button
            onClick={() => { resetForm(); setIsModalOpen(true); }}
            className="btn btn-primary text-sm"
          >
            Tambah Peraturan
          </button>
        )}
      </div>

      {/* Document List */}
      <div className="space-y-3">
        {documents.length === 0 && (
          <p className="text-sm text-muted-foreground italic">Belum ada dokumen.</p>
        )}
        {documents.map((doc) => (
          <div key={doc.id} className="flex items-center justify-between border border-border p-4">
            <div className="flex-1">
              <p className="font-medium text-foreground">{doc.title}</p>
              {doc.description && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{doc.description}</p>}
              <p className="text-xs text-muted-foreground mt-2">
                {doc.category || 'Uncategorized'} · {doc.fileUrl.split('.').pop()?.toUpperCase() || 'FILE'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {doc.isPublic ? (
                <span className="text-xs text-green-600">Publik</span>
              ) : (
                <span className="text-xs text-yellow-600">Private</span>
              )}
              {canDelete && (
                <button
                  onClick={() => handleDelete(doc.id)}
                  className="text-xs text-red-600 hover:underline"
                >
                  Hapus
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white border border-border max-w-lg w-full p-6 max-h-[92vh] overflow-y-auto">
            <h3 className="font-semibold text-foreground text-lg mb-6">Unggah Peraturan Baru</h3>
            <form onSubmit={handleUpload} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 text-sm">{error}</div>
              )}

              <FormField label="Nama Dokumen" required>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="input"
                  placeholder="contoh: AD/ART Asrama 2024"
                  required
                />
              </FormField>

              <FormField label="Deskripsi Singkat">
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="input resize-none min-h-[80px]"
                  placeholder="Penjelasan singkat mengenai peraturan ini"
                />
              </FormField>

              <FormField label="Bagian Peraturan">
                <select value={category} onChange={(e) => setCategory(e.target.value)} className="input">
                  <option value="Peraturan untuk Calon Warga Asrama">Peraturan untuk Calon Warga Asrama</option>
                  <option value="Peraturan untuk Warga Asrama">Peraturan untuk Warga Asrama</option>
                  <option value="Peraturan Kepengurusan & Organisasi Asrama">Peraturan Kepengurusan &amp; Organisasi Asrama</option>
                  <option value="Peraturan Dasar Asrama — Fasilitas">Peraturan Dasar Asrama — Fasilitas</option>
                  <option value="Peraturan Dasar Asrama — Kamar, Ketenangan, Tamu & Keamanan">Peraturan Dasar Asrama — Kamar, Ketenangan, Tamu &amp; Keamanan</option>
                  <option value="Penindakan">Penindakan</option>
                  <option value="Aturan Tambahan">Aturan Tambahan</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </FormField>

              <FormField label="File Peraturan (PDF/DOC/DOCX)" required>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="input"
                />
                {file && (
                  <p className="text-xs text-green-600 mt-1">{file.name} ({(file.size / 1024).toFixed(0)} KB)</p>
                )}
              </FormField>

              <FormField label="Cover Preview (Opsional, JPG/PNG)">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setCover(e.target.files?.[0] || null)}
                  className="input"
                />
                {cover && (
                  <p className="text-xs text-green-600 mt-1">{cover.name} ({(cover.size / 1024).toFixed(0)} KB)</p>
                )}
              </FormField>

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <button type="button" onClick={() => { setIsModalOpen(false); resetForm(); }} className="btn btn-secondary flex-1 min-h-[44px]" disabled={uploading}>
                  Batal
                </button>
                <button type="submit" className="btn btn-primary flex-1 min-h-[44px]" disabled={uploading}>
                  {uploading ? 'Mengunggah...' : 'Simpan Peraturan'}
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