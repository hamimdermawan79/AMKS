'use client';

import { useState } from 'react';
import { uploadDoc, deleteDoc } from './actions';
import { useRouter } from 'next/navigation';

interface Doc {
  id: string;
  title: string;
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
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('AD/ART');
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState('');

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setMsg('Pilih file terlebih dahulu');
      return;
    }
    if (!title.trim()) {
      setMsg('Judul dokumen wajib diisi');
      return;
    }

    setUploading(true);
    setMsg('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', title);
      formData.append('category', category);

      await uploadDoc(formData);
      setTitle('');
      setFile(null);
      setMsg('Dokumen berhasil diunggah.');
      router.refresh();
    } catch (err: any) {
      setMsg(err.message || 'Gagal mengunggah');
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
      <h2 className="font-semibold text-foreground mb-4">Dokumentasi (AD/ART &amp; Lainnya)</h2>
      <p className="text-sm text-muted-foreground mb-6">
        Dokumen publik dapat dilihat tanpa login.
      </p>

      {/* Document List */}
      <div className="space-y-3 mb-6">
        {documents.length === 0 && (
          <p className="text-sm text-muted-foreground italic">Belum ada dokumen.</p>
        )}
        {documents.map((doc) => (
          <div key={doc.id} className="flex items-center justify-between border border-border p-4">
            <div className="flex-1">
              <p className="font-medium text-foreground">{doc.title}</p>
              <p className="text-xs text-muted-foreground">
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

      {canCreate && (
        <form onSubmit={handleUpload} className="space-y-4 border-t border-border pt-4">
          {msg && (
            <div
              className={`px-4 py-3 text-sm border ${
                msg.includes('Gagal')
                  ? 'bg-red-50 border-red-200 text-red-800'
                  : 'bg-green-50 border-green-200 text-green-800'
              }`}
            >
              {msg}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Nama Dokumen</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input"
              placeholder="contoh: AD/ART Asrama 2024"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Kategori</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="input">
              <option value="AD/ART">AD/ART</option>
              <option value="Peraturan">Peraturan</option>
              <option value="Panduan">Panduan</option>
              <option value="Lainnya">Lainnya</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">File (PDF/DOC/DOCX)</label>
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="input"
            />
            {file && (
              <p className="text-xs text-green-600 mt-1">{file.name} ({(file.size / 1024).toFixed(0)} KB)</p>
            )}
          </div>
          <button type="submit" className="btn btn-primary text-sm" disabled={uploading}>
            {uploading ? 'Mengunggah...' : 'Unggah Dokumen'}
          </button>
        </form>
      )}
    </div>
  );
}