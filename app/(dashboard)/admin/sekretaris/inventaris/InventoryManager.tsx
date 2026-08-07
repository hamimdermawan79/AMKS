'use client';

import { useState } from 'react';
import { createInventory, updateInventory, deleteInventory, updateLoanStatus } from './actions';
import { useRouter } from 'next/navigation';

interface Props {
  items: any[];
  loans?: any[];
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
}

export default function InventoryManager({ items, loans = [], canCreate, canUpdate, canDelete }: Props) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'INVENTARIS' | 'PEMINJAMAN'>('INVENTARIS');

  // Inventaris State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('0');
  const [category, setCategory] = useState('');
  const [condition, setCondition] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Inventaris Handlers
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name.trim()) {
      setError('Nama barang wajib diisi');
      return;
    }
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('quantity', quantity);
      formData.append('category', category);
      formData.append('condition', condition);
      formData.append('location', location);
      formData.append('description', description);
      if (photoFile) formData.append('photo', photoFile);

      if (editingId) {
        await updateInventory(editingId, formData);
      } else {
        await createInventory(formData);
      }
      resetForm();
      setIsModalOpen(false);
    } catch (err: any) {
      setError(err.message || 'Gagal menyimpan inventaris');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus barang ini dari inventaris?')) return;
    try {
      await deleteInventory(id);
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus');
    }
  };

  const handleEdit = (item: any) => {
    setEditingId(item.id);
    setName(item.name);
    setQuantity(String(item.quantity));
    setCategory(item.category || '');
    setCondition(item.condition || '');
    setLocation(item.location || '');
    setDescription(item.description || '');
    setPhotoFile(null);
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setQuantity('0');
    setCategory('');
    setCondition('');
    setLocation('');
    setDescription('');
    setPhotoFile(null);
    setError('');
  };

  // Loan Handlers
  const handleLoanAction = async (loanId: string, status: any) => {
    const isApprove = status === 'APPROVED';
    const isReject = status === 'REJECTED';
    const isReturn = status === 'RETURNED';

    let note = '';
    if (isReject) {
      const input = prompt('Alasan penolakan (opsional):');
      if (input === null) return;
      note = input;
    } else if (isApprove) {
      if (!confirm('Setujui peminjaman ini?')) return;
    } else if (isReturn) {
      if (!confirm('Tandai barang sudah dikembalikan?')) return;
    }

    try {
      await updateLoanStatus(loanId, status, note);
    } catch (error: any) {
      alert(error.message || 'Terjadi kesalahan.');
    }
  };

  return (
    <div className="bg-white border border-border rounded-md shadow-sm">
      {/* Tabs */}
      <div className="flex border-b border-border overflow-x-auto">
        <button
          onClick={() => setActiveTab('INVENTARIS')}
          className={`px-6 py-4 text-sm font-medium whitespace-nowrap transition-colors ${
            activeTab === 'INVENTARIS'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Daftar Barang
        </button>
        <button
          onClick={() => setActiveTab('PEMINJAMAN')}
          className={`px-6 py-4 text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-2 ${
            activeTab === 'PEMINJAMAN'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Daftar Peminjaman
          {loans.filter(l => l.status === 'PENDING').length > 0 && (
            <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
              {loans.filter(l => l.status === 'PENDING').length} Baru
            </span>
          )}
        </button>
      </div>

      <div className="p-6">
        {activeTab === 'INVENTARIS' && (
          <>
            <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
              <div>
                <h2 className="text-xl font-bold text-foreground">Daftar Inventaris Asrama</h2>
                <p className="text-sm text-muted-foreground">Total {items.length} barang terdaftar</p>
              </div>
              {canCreate && (
                <button
                  onClick={() => { resetForm(); setIsModalOpen(true); }}
                  className="btn btn-primary text-sm whitespace-nowrap"
                >
                  Tambah Barang Baru
                </button>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left border border-border">
                <thead className="bg-muted text-muted-foreground uppercase text-xs">
                  <tr>
                    <th className="px-4 py-3">Foto</th>
                    <th className="px-4 py-3">Kategori</th>
                    <th className="px-4 py-3">Nama Barang</th>
                    <th className="px-4 py-3 text-center">Total/Dipinjam</th>
                    <th className="px-4 py-3">Kondisi</th>
                    <th className="px-4 py-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                        Belum ada data inventaris.
                      </td>
                    </tr>
                  ) : (
                    items.map((item) => {
                      const borrowed = (item.loans || []).filter((l: any) => l.status === 'APPROVED').reduce((sum: number, l: any) => sum + l.quantity, 0);
                      return (
                      <tr key={item.id} className="border-b border-border hover:bg-muted/50">
                        <td className="px-4 py-3">
                          {item.photoUrl ? (
                            <div 
                              className="w-12 h-12 bg-cover bg-center rounded border border-border"
                              style={{ backgroundImage: `url(${item.photoUrl})` }}
                            />
                          ) : (
                            <div className="w-12 h-12 bg-muted rounded flex items-center justify-center text-xs text-muted-foreground border border-border">-</div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-1 bg-slate-100 text-slate-700 text-xs rounded border border-slate-200">
                            {item.category || 'Lainnya'}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-medium">
                          {item.name}
                          {item.description && <p className="text-xs text-muted-foreground font-normal mt-1">{item.description}</p>}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="font-bold">{item.quantity}</span> total <br/>
                          <span className="text-xs text-red-500">{borrowed} dipinjam</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 text-[10px] uppercase font-bold rounded-full ${item.condition?.toLowerCase() === 'baik' ? 'bg-green-100 text-green-700' : item.condition?.toLowerCase() === 'rusak' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>
                            {item.condition || '-'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right space-x-2">
                          {canUpdate && (
                            <button onClick={() => handleEdit(item)} className="text-blue-600 hover:underline text-xs">Edit</button>
                          )}
                          {canDelete && (
                            <button onClick={() => handleDelete(item.id)} className="text-red-600 hover:underline text-xs">Hapus</button>
                          )}
                        </td>
                      </tr>
                    )})
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {activeTab === 'PEMINJAMAN' && (
          <>
            <div className="mb-6">
              <h2 className="text-xl font-bold text-foreground">Daftar Peminjaman Barang</h2>
              <p className="text-sm text-muted-foreground">Setujui atau tolak permintaan peminjaman dari warga.</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left border border-border">
                <thead className="bg-muted text-muted-foreground uppercase text-xs">
                  <tr>
                    <th className="px-4 py-3">Tgl Request</th>
                    <th className="px-4 py-3">Peminjam</th>
                    <th className="px-4 py-3">Barang (Jumlah)</th>
                    <th className="px-4 py-3">Durasi</th>
                    <th className="px-4 py-3">Surat</th>
                    <th className="px-4 py-3 text-center">Status</th>
                    <th className="px-4 py-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {loans.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">Belum ada request peminjaman.</td>
                    </tr>
                  ) : (
                    loans.map((loan) => (
                      <tr key={loan.id} className="border-b border-border hover:bg-muted/50">
                        <td className="px-4 py-3 whitespace-nowrap">
                          {new Date(loan.createdAt).toLocaleDateString('id-ID')}
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-foreground">{loan.borrowerName}</div>
                          {loan.phone && <div className="text-xs text-muted-foreground mt-0.5">WA: {loan.phone}</div>}
                          {loan.institution && <div className="text-xs text-muted-foreground">Instansi: {loan.institution}</div>}
                          {loan.purpose && <div className="text-xs text-slate-500 italic mt-1">Keperluan: {loan.purpose}</div>}
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-bold">{loan.inventory?.name}</span>
                          <span className="text-xs text-muted-foreground ml-1">({loan.quantity} unit)</span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-xs">
                          {new Date(loan.startDate).toLocaleDateString('id-ID')} - {new Date(loan.endDate).toLocaleDateString('id-ID')}
                        </td>
                        <td className="px-4 py-3">
                          <a href={loan.letterUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline inline-flex items-center gap-1 text-xs">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Unduh Surat
                          </a>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-2 py-1 text-[10px] uppercase font-bold rounded-full ${
                            loan.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                            loan.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                            loan.status === 'RETURNED' ? 'bg-blue-100 text-blue-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {loan.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                          {canUpdate && loan.status === 'PENDING' && (
                            <>
                              <button onClick={() => handleLoanAction(loan.id, 'APPROVED')} className="text-green-600 hover:underline text-xs font-medium">Terima</button>
                              <button onClick={() => handleLoanAction(loan.id, 'REJECTED')} className="text-red-600 hover:underline text-xs font-medium">Tolak</button>
                            </>
                          )}
                          {canUpdate && loan.status === 'APPROVED' && (
                            <button onClick={() => handleLoanAction(loan.id, 'RETURNED')} className="text-blue-600 hover:underline text-xs font-medium border border-blue-600 px-2 py-1 rounded">Selesai/Kembali</button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white border border-border rounded max-w-lg w-full p-6 max-h-[92vh] overflow-y-auto shadow-xl">
            <h3 className="font-semibold text-foreground text-lg mb-6">
              {editingId ? 'Edit Barang Inventaris' : 'Tambah Barang Baru'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 text-sm rounded">{error}</div>}
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Nama Barang" required>
                  <input value={name} onChange={(e) => setName(e.target.value)} className="input" required />
                </FormField>
                <FormField label="Kategori">
                  <select value={category} onChange={(e) => setCategory(e.target.value)} className="input">
                    <option value="">Lainnya / Umum</option>
                    <option value="Alat Olahraga">Alat Olahraga</option>
                    <option value="Alat Musik">Alat Musik</option>
                    <option value="Alat Masak">Alat Masak</option>
                    <option value="Elektronik">Elektronik</option>
                    <option value="Furnitur">Furnitur</option>
                    <option value="Kebersihan">Kebersihan</option>
                  </select>
                </FormField>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Jumlah" required>
                  <input type="number" min="0" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="input" required />
                </FormField>
                <FormField label="Kondisi">
                  <select value={condition} onChange={(e) => setCondition(e.target.value)} className="input">
                    <option value="">Pilih Kondisi</option>
                    <option value="Baik">Baik</option>
                    <option value="Rusak Ringan">Rusak Ringan</option>
                    <option value="Rusak Berat">Rusak Berat</option>
                    <option value="Hilang">Hilang</option>
                  </select>
                </FormField>
              </div>
              <FormField label="Lokasi (cth: Dapur, Ruang TV)">
                <input value={location} onChange={(e) => setLocation(e.target.value)} className="input" />
              </FormField>
              <FormField label="Keterangan Tambahan (Opsional)">
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="input min-h-[80px]" />
              </FormField>
              <FormField label={editingId ? "Ganti Foto Barang (Opsional)" : "Foto Barang (Opsional)"}>
                <input type="file" accept="image/*" onChange={(e) => setPhotoFile(e.target.files?.[0] || null)} className="input p-2" />
              </FormField>
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <button type="button" onClick={() => { setIsModalOpen(false); resetForm(); }} className="btn btn-secondary flex-1" disabled={submitting}>Batal</button>
                <button type="submit" className="btn btn-primary flex-1" disabled={submitting}>
                  {submitting ? 'Menyimpan...' : 'Simpan'}
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
      <label className="block text-sm font-medium text-foreground mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}
