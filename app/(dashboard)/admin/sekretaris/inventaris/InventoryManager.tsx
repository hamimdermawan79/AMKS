'use client';

import { useState } from 'react';
import { createInventory, updateInventory, deleteInventory } from './actions';
import { useRouter } from 'next/navigation';

interface Props {
  items: any[];
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
}

export default function InventoryManager({ items, canCreate, canUpdate, canDelete }: Props) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('0');
  const [condition, setCondition] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

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
      formData.append('condition', condition);
      formData.append('location', location);
      formData.append('description', description);

      if (photoFile) {
        formData.append('photo', photoFile);
      }

      if (editingId) {
        await updateInventory(editingId, formData);
      } else {
        await createInventory(formData);
      }
      
      resetForm();
      setIsModalOpen(false);
      router.refresh();
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
      router.refresh();
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus');
    }
  };

  const handleEdit = (item: any) => {
    setEditingId(item.id);
    setName(item.name);
    setQuantity(String(item.quantity));
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
    setCondition('');
    setLocation('');
    setDescription('');
    setPhotoFile(null);
    setError('');
  };

  return (
    <div className="bg-white border border-border p-6 rounded-md">
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
              <th className="px-4 py-3">Nama Barang</th>
              <th className="px-4 py-3 text-center">Jumlah</th>
              <th className="px-4 py-3">Kondisi</th>
              <th className="px-4 py-3">Lokasi</th>
              <th className="px-4 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  Belum ada data inventaris.
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id} className="border-b border-border hover:bg-muted/50">
                  <td className="px-4 py-3">
                    {item.photoUrl ? (
                      <div 
                        className="w-12 h-12 bg-cover bg-center rounded border border-border"
                        style={{ backgroundImage: `url(${item.photoUrl})` }}
                      />
                    ) : (
                      <div className="w-12 h-12 bg-muted rounded flex items-center justify-center text-xs text-muted-foreground border border-border">
                        -
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 font-medium">
                    {item.name}
                    {item.description && (
                      <p className="text-xs text-muted-foreground font-normal mt-1">{item.description}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">{item.quantity}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-[10px] uppercase font-bold rounded-full ${item.condition?.toLowerCase() === 'baik' ? 'bg-green-100 text-green-700' : item.condition?.toLowerCase() === 'rusak' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>
                      {item.condition || '-'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{item.location || '-'}</td>
                  <td className="px-4 py-3 text-right space-x-2">
                    {canUpdate && (
                      <button onClick={() => handleEdit(item)} className="text-blue-600 hover:underline text-xs">
                        Edit
                      </button>
                    )}
                    {canDelete && (
                      <button onClick={() => handleDelete(item.id)} className="text-red-600 hover:underline text-xs">
                        Hapus
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white border border-border rounded max-w-lg w-full p-6 max-h-[92vh] overflow-y-auto shadow-xl">
            <h3 className="font-semibold text-foreground text-lg mb-6">
              {editingId ? 'Edit Barang Inventaris' : 'Tambah Barang Baru'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 text-sm rounded">{error}</div>
              )}

              <FormField label="Nama Barang" required>
                <input value={name} onChange={(e) => setName(e.target.value)} className="input" required />
              </FormField>

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
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
                  className="input p-2"
                />
              </FormField>

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <button type="button" onClick={() => { setIsModalOpen(false); resetForm(); }} className="btn btn-secondary flex-1" disabled={submitting}>
                  Batal
                </button>
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
