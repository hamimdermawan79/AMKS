'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { WORK_TYPE_LABELS, WORK_TYPE_OPTIONS } from '@/lib/karya-ilmiah';
import { createWork, updateWork, deleteWork } from './actions';

interface Work {
  id: string;
  title: string;
  authorName: string;
  authorInstitution: string | null;
  type: keyof typeof WORK_TYPE_LABELS;
  year: number;
  abstractFileUrl: string | null;
  titlePageFileUrl: string | null;
  tocFileUrl: string | null;
  isPublished: boolean;
  publishedByName: string;
  requestCount: number;
}

interface Props {
  works: Work[];
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
}

const emptyForm = {
  title: '',
  authorName: '',
  authorInstitution: '',
  type: 'ARTIKEL' as keyof typeof WORK_TYPE_LABELS,
  year: 2026,
  isPublished: true,
};

// Berkas PDF yang dapat diunggah per karya
const FILE_INPUTS = [
  { key: 'abstractFile', label: 'Berkas Abstrak (PDF)', existing: 'abstractFileUrl' },
  { key: 'titlePageFile', label: 'Berkas Halaman Judul (PDF)', existing: 'titlePageFileUrl' },
  { key: 'tocFile', label: 'Berkas Daftar Isi (PDF)', existing: 'tocFileUrl' },
] as const;

type FileKey = (typeof FILE_INPUTS)[number]['key'];

export default function KaryaIlmiahClient({
  works,
  canCreate,
  canUpdate,
  canDelete,
}: Props) {
  const router = useRouter();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Work | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Work | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [formData, setFormData] = useState({ ...emptyForm });
  const [files, setFiles] = useState<Record<FileKey, File | null>>({
    abstractFile: null,
    titlePageFile: null,
    tocFile: null,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const resetForm = () => {
    setFormData({ ...emptyForm });
    setFiles({ abstractFile: null, titlePageFile: null, tocFile: null });
    setError('');
  };

  const buildFormData = () => {
    const fd = new FormData();
    fd.set('title', formData.title);
    fd.set('authorName', formData.authorName);
    fd.set('authorInstitution', formData.authorInstitution);
    fd.set('type', formData.type);
    fd.set('year', String(formData.year));
    fd.set('isPublished', String(formData.isPublished));
    for (const { key } of FILE_INPUTS) {
      if (files[key]) fd.set(key, files[key]!);
    }
    return fd;
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await createWork(buildFormData());
      setIsAddOpen(false);
      resetForm();
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Gagal menambah karya');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget) return;
    setError('');
    setIsSubmitting(true);
    try {
      await updateWork(editTarget.id, buildFormData());
      setEditTarget(null);
      resetForm();
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Gagal memperbarui karya');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteWork(deleteTarget.id);
      setDeleteTarget(null);
      router.refresh();
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus karya');
    } finally {
      setIsDeleting(false);
    }
  };

  const openEdit = (work: Work) => {
    setFormData({
      title: work.title,
      authorName: work.authorName,
      authorInstitution: work.authorInstitution ?? '',
      type: work.type,
      year: work.year,
      isPublished: work.isPublished,
    });
    setFiles({ abstractFile: null, titlePageFile: null, tocFile: null });
    setEditTarget(work);
    setError('');
  };

  return (
    <div className="space-y-6">
      {/* Header with Add button */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Total:{' '}
          <span className="font-semibold text-foreground">{works.length}</span>{' '}
          karya
        </div>
        {canCreate && (
          <button
            onClick={() => {
              resetForm();
              setIsAddOpen(true);
            }}
            className="btn btn-primary"
          >
            + Tambah Karya
          </button>
        )}
      </div>

      {/* Table */}
      {works.length === 0 ? (
        <div className="glass-card p-12 text-center text-muted-foreground">
          Belum ada karya ilmiah. {canCreate && 'Klik "Tambah Karya" untuk memulai.'}
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Judul</th>
                <th>Penulis</th>
                <th>Jenis</th>
                <th>Tahun</th>
                <th>Berkas</th>
                <th>Permintaan</th>
                <th>Status</th>
                {(canUpdate || canDelete) && (
                  <th className="text-center">Aksi</th>
                )}
              </tr>
            </thead>
            <tbody>
              {works.map((work) => (
                <tr key={work.id}>
                  <td className="font-medium text-foreground max-w-xs">
                    <span className="truncate block">{work.title}</span>
                  </td>
                  <td>
                    <div className="text-foreground">{work.authorName}</div>
                    {work.authorInstitution && (
                      <div className="text-xs text-muted-foreground">
                        {work.authorInstitution}
                      </div>
                    )}
                  </td>
                  <td>
                    <span className="badge badge-info text-xs">
                      {WORK_TYPE_LABELS[work.type]}
                    </span>
                  </td>
                  <td className="tabular-nums">{work.year}</td>
                  <td className="text-xs whitespace-nowrap">
                    <FileDot label="A" url={work.abstractFileUrl} title="Abstrak" />
                    <FileDot label="HJ" url={work.titlePageFileUrl} title="Halaman Judul" />
                    <FileDot label="DI" url={work.tocFileUrl} title="Daftar Isi" />
                  </td>
                  <td className="tabular-nums text-center">
                    {work.requestCount > 0 ? (
                      <span className="badge badge-warning">{work.requestCount}</span>
                    ) : (
                      <span className="text-xs text-muted-foreground">0</span>
                    )}
                  </td>
                  <td>
                    <span
                      className={`badge ${
                        work.isPublished ? 'badge-success' : 'badge-warning'
                      }`}
                    >
                      {work.isPublished ? 'Terbit' : 'Draf'}
                    </span>
                  </td>
                  {(canUpdate || canDelete) && (
                    <td className="text-center space-x-2 whitespace-nowrap">
                      {canUpdate && (
                        <button
                          onClick={() => openEdit(work)}
                          className="text-xs text-blue-600 hover:underline min-h-[44px] px-2 inline-flex items-center"
                        >
                          Edit
                        </button>
                      )}
                      {canDelete && (
                        <button
                          onClick={() => setDeleteTarget(work)}
                          className="text-xs text-red-600 hover:underline min-h-[44px] px-2 inline-flex items-center"
                        >
                          Hapus
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Modal */}
      {isAddOpen && (
        <Modal
          title="Tambah Karya Ilmiah"
          onClose={() => {
            setIsAddOpen(false);
            resetForm();
          }}
        >
          <WorkForm
            formData={formData}
            setFormData={setFormData}
            files={files}
            setFiles={setFiles}
            existing={null}
            onSubmit={handleAdd}
            onCancel={() => {
              setIsAddOpen(false);
              resetForm();
            }}
            isSubmitting={isSubmitting}
            error={error}
            submitLabel="Simpan"
          />
        </Modal>
      )}

      {/* Edit Modal */}
      {editTarget && (
        <Modal
          title="Edit Karya Ilmiah"
          onClose={() => {
            setEditTarget(null);
            resetForm();
          }}
        >
          <WorkForm
            formData={formData}
            setFormData={setFormData}
            files={files}
            setFiles={setFiles}
            existing={editTarget}
            onSubmit={handleEdit}
            onCancel={() => {
              setEditTarget(null);
              resetForm();
            }}
            isSubmitting={isSubmitting}
            error={error}
            submitLabel="Perbarui"
          />
        </Modal>
      )}

      {/* Delete Confirmation */}
      {deleteTarget && (
        <Modal title="Konfirmasi Hapus" onClose={() => setDeleteTarget(null)}>
          <p className="text-muted-foreground mb-6">
            Hapus karya{' '}
            <span className="font-semibold text-foreground">
              &ldquo;{deleteTarget.title}&rdquo;
            </span>
            ? Permintaan akses terkait juga akan terhapus. Tindakan ini tidak dapat
            dibatalkan.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => setDeleteTarget(null)}
              className="btn btn-secondary flex-1 min-h-[44px]"
              disabled={isDeleting}
            >
              Batal
            </button>
            <button
              onClick={handleDelete}
              className="btn bg-destructive text-destructive-foreground hover:bg-red-600 flex-1 min-h-[44px]"
              disabled={isDeleting}
            >
              {isDeleting ? 'Menghapus...' : 'Hapus'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ==================== Helper Components ====================

function FileDot({
  label,
  url,
  title,
}: {
  label: string;
  url: string | null;
  title: string;
}) {
  if (url) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        title={`${title}: lihat PDF`}
        className="mr-1 inline-block rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-semibold text-blue-800 hover:bg-blue-200"
      >
        {label}
      </a>
    );
  }
  return (
    <span
      title={`${title}: belum ada`}
      className="mr-1 inline-block rounded bg-secondary px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground"
    >
      {label}
    </span>
  );
}

function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto"
      >
        <h2 className="text-xl font-bold text-foreground mb-4">{title}</h2>
        {children}
      </motion.div>
    </div>
  );
}

function WorkForm({
  formData,
  setFormData,
  files,
  setFiles,
  existing,
  onSubmit,
  onCancel,
  isSubmitting,
  error,
  submitLabel,
}: {
  formData: typeof emptyForm;
  setFormData: (data: typeof emptyForm) => void;
  files: Record<FileKey, File | null>;
  setFiles: (files: Record<FileKey, File | null>) => void;
  existing: Work | null;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  isSubmitting: boolean;
  error: string;
  submitLabel: string;
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <Field label="Judul Karya">
        <input
          className="input"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
        />
      </Field>

      <Field label="Nama Penulis">
        <input
          className="input"
          placeholder="Nama warga / alumni"
          value={formData.authorName}
          onChange={(e) =>
            setFormData({ ...formData, authorName: e.target.value })
          }
          required
        />
      </Field>

      <Field label="Institusi / Kampus Penulis">
        <input
          className="input"
          placeholder="Nama universitas / institusi penulis"
          value={formData.authorInstitution}
          onChange={(e) =>
            setFormData({ ...formData, authorInstitution: e.target.value })
          }
        />
      </Field>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Jenis">
          <select
            className="input"
            value={formData.type}
            onChange={(e) =>
              setFormData({
                ...formData,
                type: e.target.value as typeof formData.type,
              })
            }
          >
            {WORK_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Tahun">
          <input
            type="number"
            className="input"
            min={1980}
            max={2027}
            value={formData.year}
            onChange={(e) =>
              setFormData({ ...formData, year: Number(e.target.value) })
            }
            required
          />
        </Field>
      </div>

      {/* Berkas PDF: abstrak, halaman judul, daftar isi */}
      <div className="space-y-4 rounded-lg border border-border p-4">
        <p className="text-xs text-muted-foreground">
          Unggah berkas PDF (maks. 10 MB tiap berkas). Berkas lengkap karya tetap
          diakses lewat permintaan akses.
        </p>
        {FILE_INPUTS.map(({ key, label, existing: existingKey }) => {
          const existingUrl = existing
            ? (existing[existingKey as keyof Work] as string | null)
            : null;
          return (
            <Field key={key} label={label}>
              <input
                type="file"
                accept="application/pdf"
                className="input file:mr-3 file:rounded-md file:border-0 file:bg-secondary file:px-3 file:py-1 file:text-sm file:font-medium file:text-foreground"
                onChange={(e) =>
                  setFiles({ ...files, [key]: e.target.files?.[0] ?? null })
                }
              />
              {existingUrl && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Berkas saat ini:{' '}
                  <a
                    href={existingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Lihat PDF
                  </a>
                  . Pilih berkas baru untuk mengganti.
                </p>
              )}
            </Field>
          );
        })}
      </div>

      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          className="w-4 h-4"
          checked={formData.isPublished}
          onChange={(e) =>
            setFormData({ ...formData, isPublished: e.target.checked })
          }
        />
        <span className="text-sm text-foreground">
          Tampilkan di halaman publik (Terbit)
        </span>
      </label>

      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="btn btn-secondary flex-1"
          disabled={isSubmitting}
        >
          Batal
        </button>
        <button
          type="submit"
          className="btn btn-primary flex-1"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Menyimpan...' : submitLabel}
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-foreground mb-2">
        {label}
      </label>
      {children}
    </div>
  );
}
