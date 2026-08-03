'use client';

import { useState } from 'react';
import { createLetterTemplate, deleteLetterTemplate, createLetter, updateLetter, deleteLetter } from './actions';
import { useRouter } from 'next/navigation';

interface Props {
  templates: any[];
  letters: any[];
  canCreateTemplate: boolean;
  canDeleteTemplate: boolean;
  canCreateLetter: boolean;
  canUpdateLetter: boolean;
  canDeleteLetter: boolean;
}

export default function SuratManager({
  templates, letters,
  canCreateTemplate, canDeleteTemplate,
  canCreateLetter, canUpdateLetter, canDeleteLetter,
}: Props) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'template' | 'arsip'>('template');

  return (
    <div className="space-y-6">
      {/* Tab Switcher */}
      <div className="flex gap-1 bg-muted p-1 rounded-md w-fit">
        <button
          onClick={() => setActiveTab('template')}
          className={`px-4 py-2 text-sm font-medium rounded transition-colors ${activeTab === 'template' ? 'bg-white text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
        >
          Format Surat
        </button>
        <button
          onClick={() => setActiveTab('arsip')}
          className={`px-4 py-2 text-sm font-medium rounded transition-colors ${activeTab === 'arsip' ? 'bg-white text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
        >
          Arsip Surat
        </button>
      </div>

      {activeTab === 'template' && (
        <TemplateSection
          templates={templates}
          canCreate={canCreateTemplate}
          canDelete={canDeleteTemplate}
        />
      )}

      {activeTab === 'arsip' && (
        <LetterSection
          letters={letters}
          canCreate={canCreateLetter}
          canUpdate={canUpdateLetter}
          canDelete={canDeleteLetter}
        />
      )}
    </div>
  );
}

// ===================== FORMAT SURAT SECTION =====================

function TemplateSection({ templates, canCreate, canDelete }: { templates: any[]; canCreate: boolean; canDelete: boolean }) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name.trim()) { setError('Nama format surat wajib diisi'); return; }
    if (!file) { setError('File format surat wajib diunggah'); return; }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('description', description);
      formData.append('file', file);
      await createLetterTemplate(formData);
      setName(''); setDescription(''); setFile(null);
      setIsModalOpen(false);
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Gagal mengunggah');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus format surat ini?')) return;
    try {
      await deleteLetterTemplate(id);
      router.refresh();
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus');
    }
  };

  return (
    <div className="bg-white border border-border p-6 rounded-md">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-foreground">Format Surat</h2>
          <p className="text-sm text-muted-foreground">
            Upload file format surat (Word/PDF) agar bisa diunduh warga dari halaman publik.
          </p>
        </div>
        {canCreate && (
          <button onClick={() => setIsModalOpen(true)} className="btn btn-primary text-sm whitespace-nowrap">
            Upload Format Surat
          </button>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left border border-border">
          <thead className="bg-muted text-muted-foreground uppercase text-xs">
            <tr>
              <th className="px-4 py-3">Nama Format Surat</th>
              <th className="px-4 py-3">Keterangan</th>
              <th className="px-4 py-3">File</th>
              <th className="px-4 py-3">Tanggal Upload</th>
              <th className="px-4 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {templates.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Belum ada format surat.</td></tr>
            ) : (
              templates.map((t) => (
                <tr key={t.id} className="border-b border-border hover:bg-muted/50">
                  <td className="px-4 py-3 font-medium">{t.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{t.description || '-'}</td>
                  <td className="px-4 py-3">
                    <a href={t.fileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-xs">
                      {t.fileName}
                    </a>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {new Date(t.createdAt).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {canDelete && (
                      <button onClick={() => handleDelete(t.id)} className="text-red-600 hover:underline text-xs">Hapus</button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Upload Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white border border-border rounded max-w-lg w-full p-6 shadow-xl">
            <h3 className="font-semibold text-foreground text-lg mb-6">Upload Format Surat Baru</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 text-sm rounded">{error}</div>}

              <div>
                <label className="block text-sm font-medium mb-1">Nama Format Surat <span className="text-red-500">*</span></label>
                <input value={name} onChange={(e) => setName(e.target.value)} className="input" placeholder="cth: Surat Izin Cuti Asrama" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Keterangan (Opsional)</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="input min-h-[80px]" placeholder="Deskripsi singkat tentang format surat ini" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">File Surat (Word/PDF) <span className="text-red-500">*</span></label>
                <input type="file" accept=".doc,.docx,.pdf,.xls,.xlsx" onChange={(e) => setFile(e.target.files?.[0] || null)} className="input p-2" required />
                {file && <p className="text-xs text-green-600 mt-1">File terpilih: {file.name}</p>}
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary flex-1" disabled={submitting}>Batal</button>
                <button type="submit" className="btn btn-primary flex-1" disabled={submitting}>{submitting ? 'Mengunggah...' : 'Upload'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ===================== ARSIP SURAT SECTION =====================

function LetterSection({ letters, canCreate, canUpdate, canDelete }: { letters: any[]; canCreate: boolean; canUpdate: boolean; canDelete: boolean }) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [number, setNumber] = useState('');
  const [subject, setSubject] = useState('');
  const [direction, setDirection] = useState<'MASUK' | 'KELUAR'>('MASUK');
  const [date, setDate] = useState('');
  const [sender, setSender] = useState('');
  const [recipient, setRecipient] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'ALL' | 'MASUK' | 'KELUAR'>('ALL');

  const resetForm = () => {
    setEditingId(null); setNumber(''); setSubject(''); setDirection('MASUK');
    setDate(''); setSender(''); setRecipient(''); setDescription(''); setFile(null); setError('');
  };

  const handleEdit = (letter: any) => {
    setEditingId(letter.id);
    setNumber(letter.number || '');
    setSubject(letter.subject);
    setDirection(letter.direction);
    setDate(new Date(letter.date).toISOString().split('T')[0]);
    setSender(letter.sender || '');
    setRecipient(letter.recipient || '');
    setDescription(letter.description || '');
    setFile(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!subject.trim()) { setError('Perihal surat wajib diisi'); return; }
    if (!date) { setError('Tanggal surat wajib diisi'); return; }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('number', number);
      formData.append('subject', subject);
      formData.append('direction', direction);
      formData.append('date', date);
      formData.append('sender', sender);
      formData.append('recipient', recipient);
      formData.append('description', description);
      if (file) formData.append('file', file);

      if (editingId) {
        await updateLetter(editingId, formData);
      } else {
        await createLetter(formData);
      }
      resetForm();
      setIsModalOpen(false);
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Gagal menyimpan surat');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus surat ini dari arsip?')) return;
    try {
      await deleteLetter(id);
      router.refresh();
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus');
    }
  };

  const filteredLetters = filter === 'ALL' ? letters : letters.filter(l => l.direction === filter);

  return (
    <div className="bg-white border border-border p-6 rounded-md">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <div>
          <h2 className="text-lg font-bold text-foreground">Arsip Surat</h2>
          <p className="text-sm text-muted-foreground">Catatan surat masuk dan keluar asrama.</p>
        </div>
        <div className="flex gap-2">
          {/* Filter */}
          <select value={filter} onChange={(e) => setFilter(e.target.value as any)} className="input text-sm py-1.5 px-3">
            <option value="ALL">Semua ({letters.length})</option>
            <option value="MASUK">Surat Masuk ({letters.filter(l => l.direction === 'MASUK').length})</option>
            <option value="KELUAR">Surat Keluar ({letters.filter(l => l.direction === 'KELUAR').length})</option>
          </select>
          {canCreate && (
            <button onClick={() => { resetForm(); setIsModalOpen(true); }} className="btn btn-primary text-sm whitespace-nowrap">
              Tambah Surat
            </button>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left border border-border">
          <thead className="bg-muted text-muted-foreground uppercase text-xs">
            <tr>
              <th className="px-4 py-3">No. Surat</th>
              <th className="px-4 py-3">Perihal</th>
              <th className="px-4 py-3">Jenis</th>
              <th className="px-4 py-3">Tanggal</th>
              <th className="px-4 py-3">Pengirim / Penerima</th>
              <th className="px-4 py-3">File</th>
              <th className="px-4 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filteredLetters.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">Belum ada data surat.</td></tr>
            ) : (
              filteredLetters.map((l) => (
                <tr key={l.id} className="border-b border-border hover:bg-muted/50">
                  <td className="px-4 py-3 font-mono text-xs">{l.number || '-'}</td>
                  <td className="px-4 py-3 font-medium">
                    {l.subject}
                    {l.description && <p className="text-xs text-muted-foreground font-normal mt-0.5">{l.description}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-[10px] uppercase font-bold rounded-full ${l.direction === 'MASUK' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
                      {l.direction}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {new Date(l.date).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {l.direction === 'MASUK' ? (l.sender || '-') : (l.recipient || '-')}
                  </td>
                  <td className="px-4 py-3">
                    {l.fileUrl ? (
                      <a href={l.fileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-xs">{l.fileName || 'Lihat'}</a>
                    ) : <span className="text-xs text-muted-foreground">-</span>}
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    {canUpdate && <button onClick={() => handleEdit(l)} className="text-blue-600 hover:underline text-xs">Edit</button>}
                    {canDelete && <button onClick={() => handleDelete(l.id)} className="text-red-600 hover:underline text-xs">Hapus</button>}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white border border-border rounded max-w-lg w-full p-6 max-h-[92vh] overflow-y-auto shadow-xl">
            <h3 className="font-semibold text-foreground text-lg mb-6">{editingId ? 'Edit Surat' : 'Tambah Surat Baru'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 text-sm rounded">{error}</div>}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Jenis Surat <span className="text-red-500">*</span></label>
                  <select value={direction} onChange={(e) => setDirection(e.target.value as 'MASUK' | 'KELUAR')} className="input" required>
                    <option value="MASUK">Surat Masuk</option>
                    <option value="KELUAR">Surat Keluar</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">No. Surat</label>
                  <input value={number} onChange={(e) => setNumber(e.target.value)} className="input" placeholder="cth: 001/AMKS/VII/2026" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Perihal <span className="text-red-500">*</span></label>
                <input value={subject} onChange={(e) => setSubject(e.target.value)} className="input" required />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Tanggal Surat <span className="text-red-500">*</span></label>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input" required />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Pengirim</label>
                  <input value={sender} onChange={(e) => setSender(e.target.value)} className="input" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Penerima</label>
                  <input value={recipient} onChange={(e) => setRecipient(e.target.value)} className="input" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Keterangan</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="input min-h-[80px]" />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">{editingId ? 'Ganti File Surat (Opsional)' : 'Upload File Surat (Opsional)'}</label>
                <input type="file" accept=".doc,.docx,.pdf,.jpg,.jpeg,.png" onChange={(e) => setFile(e.target.files?.[0] || null)} className="input p-2" />
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => { setIsModalOpen(false); resetForm(); }} className="btn btn-secondary flex-1" disabled={submitting}>Batal</button>
                <button type="submit" className="btn btn-primary flex-1" disabled={submitting}>{submitting ? 'Menyimpan...' : 'Simpan'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
