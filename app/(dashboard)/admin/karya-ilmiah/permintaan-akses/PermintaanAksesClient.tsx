'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  updateAccessRequestStatus,
  deleteAccessRequest,
} from './actions';

type Status = 'PENDING' | 'DISETUJUI' | 'DITOLAK';

interface AccessRequest {
  id: string;
  name: string;
  whatsapp: string;
  email: string;
  purpose: string;
  institution: string;
  status: Status;
  note: string | null;
  createdAt: string;
  workTitle: string;
  workMeta: string;
}

const STATUS_LABELS: Record<Status, string> = {
  PENDING: 'Menunggu',
  DISETUJUI: 'Disetujui',
  DITOLAK: 'Ditolak',
};

const STATUS_BADGE: Record<Status, string> = {
  PENDING: 'badge-warning',
  DISETUJUI: 'badge-success',
  DITOLAK: 'badge-danger',
};

const FILTERS: { value: 'ALL' | Status; label: string }[] = [
  { value: 'ALL', label: 'Semua' },
  { value: 'PENDING', label: 'Menunggu' },
  { value: 'DISETUJUI', label: 'Disetujui' },
  { value: 'DITOLAK', label: 'Ditolak' },
];

export default function PermintaanAksesClient({
  requests,
  canManage,
}: {
  requests: AccessRequest[];
  canManage: boolean;
}) {
  const router = useRouter();
  const [filter, setFilter] = useState<'ALL' | Status>('ALL');
  const [detailTarget, setDetailTarget] = useState<AccessRequest | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AccessRequest | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const filtered =
    filter === 'ALL'
      ? requests
      : requests.filter((r) => r.status === filter);

  const pendingCount = requests.filter((r) => r.status === 'PENDING').length;

  const handleStatus = async (id: string, status: Status) => {
    setBusyId(id);
    try {
      await updateAccessRequestStatus(id, status);
      setDetailTarget(null);
      router.refresh();
    } catch (err: any) {
      alert(err.message || 'Gagal memperbarui status');
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setBusyId(deleteTarget.id);
    try {
      await deleteAccessRequest(deleteTarget.id);
      setDeleteTarget(null);
      router.refresh();
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus permintaan');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Filter + summary */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filter === f.value
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-muted-foreground hover:text-foreground'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">{pendingCount}</span>{' '}
          menunggu tinjauan
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="glass-card p-12 text-center text-muted-foreground">
          Tidak ada permintaan akses{filter !== 'ALL' ? ' dengan status ini' : ''}.
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Pemohon</th>
                <th>Karya</th>
                <th>Institusi</th>
                <th>Tanggal</th>
                <th>Status</th>
                <th className="text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id}>
                  <td>
                    <div className="font-medium text-foreground">{r.name}</div>
                    <div className="text-xs text-muted-foreground">{r.email}</div>
                  </td>
                  <td className="max-w-xs">
                    <span className="truncate block text-foreground">
                      {r.workTitle}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {r.workMeta}
                    </span>
                  </td>
                  <td className="text-sm">{r.institution}</td>
                  <td className="text-sm whitespace-nowrap">
                    {formatDate(r.createdAt)}
                  </td>
                  <td>
                    <span className={`badge ${STATUS_BADGE[r.status]}`}>
                      {STATUS_LABELS[r.status]}
                    </span>
                  </td>
                  <td className="text-center space-x-1 whitespace-nowrap">
                    <button
                      onClick={() => setDetailTarget(r)}
                      className="text-xs text-blue-600 hover:underline min-h-[44px] px-2 inline-flex items-center"
                    >
                      Detail
                    </button>
                    {canManage && (
                      <button
                        onClick={() => setDeleteTarget(r)}
                        className="text-xs text-red-600 hover:underline min-h-[44px] px-2 inline-flex items-center"
                      >
                        Hapus
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail Modal */}
      {detailTarget && (
        <Modal title="Detail Permintaan Akses" onClose={() => setDetailTarget(null)}>
          <div className="space-y-3 text-sm">
            <DetailRow label="Karya" value={detailTarget.workTitle} />
            <DetailRow label="" value={detailTarget.workMeta} muted />
            <hr className="border-border" />
            <DetailRow label="Nama" value={detailTarget.name} />
            <DetailRow
              label="No. WhatsApp"
              value={
                <a
                  href={`https://wa.me/${detailTarget.whatsapp.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  {detailTarget.whatsapp}
                </a>
              }
            />
            <DetailRow
              label="Email"
              value={
                <a
                  href={`mailto:${detailTarget.email}`}
                  className="text-primary hover:underline"
                >
                  {detailTarget.email}
                </a>
              }
            />
            <DetailRow label="Institusi / Kampus" value={detailTarget.institution} />
            <DetailRow label="Keperluan" value={detailTarget.purpose} />
            <DetailRow
              label="Status"
              value={
                <span className={`badge ${STATUS_BADGE[detailTarget.status]}`}>
                  {STATUS_LABELS[detailTarget.status]}
                </span>
              }
            />
          </div>

          {canManage && (
            <div className="flex flex-col sm:flex-row gap-3 pt-6">
              <button
                onClick={() => handleStatus(detailTarget.id, 'DITOLAK')}
                className="btn btn-secondary flex-1 min-h-[44px]"
                disabled={busyId === detailTarget.id}
              >
                Tolak
              </button>
              <button
                onClick={() => handleStatus(detailTarget.id, 'DISETUJUI')}
                className="btn btn-primary flex-1 min-h-[44px]"
                disabled={busyId === detailTarget.id}
              >
                Setujui
              </button>
            </div>
          )}
        </Modal>
      )}

      {/* Delete Confirmation */}
      {deleteTarget && (
        <Modal title="Konfirmasi Hapus" onClose={() => setDeleteTarget(null)}>
          <p className="text-muted-foreground mb-6">
            Hapus permintaan akses dari{' '}
            <span className="font-semibold text-foreground">
              {deleteTarget.name}
            </span>
            ? Tindakan ini tidak dapat dibatalkan.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => setDeleteTarget(null)}
              className="btn btn-secondary flex-1 min-h-[44px]"
              disabled={busyId === deleteTarget.id}
            >
              Batal
            </button>
            <button
              onClick={handleDelete}
              className="btn bg-destructive text-destructive-foreground hover:bg-red-600 flex-1 min-h-[44px]"
              disabled={busyId === deleteTarget.id}
            >
              {busyId === deleteTarget.id ? 'Menghapus...' : 'Hapus'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ==================== Helpers ====================

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
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

function DetailRow({
  label,
  value,
  muted,
}: {
  label: string;
  value: React.ReactNode;
  muted?: boolean;
}) {
  return (
    <div className="flex gap-3">
      {label && (
        <span className="w-32 flex-shrink-0 text-muted-foreground">{label}</span>
      )}
      <span
        className={`flex-1 ${muted ? 'text-muted-foreground text-xs' : 'text-foreground'}`}
      >
        {value}
      </span>
    </div>
  );
}
