'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { WORK_TYPE_LABELS } from '@/lib/karya-ilmiah';
import { submitAccessRequest } from './actions';

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
}

export default function KaryaIlmiahList({
  worksByYear,
}: {
  worksByYear: { year: number; works: Work[] }[];
}) {
  const [requestTarget, setRequestTarget] = useState<Work | null>(null);

  return (
    <>
      <div className="space-y-12">
        {worksByYear.map(({ year, works }) => (
          <section key={year}>
            <div className="flex items-center gap-4 mb-5">
              <h2 className="text-2xl font-bold text-foreground">{year}</h2>
              <div className="h-px flex-1 bg-border" />
              <span className="text-sm text-muted-foreground">
                {works.length} karya
              </span>
            </div>

            <ol className="space-y-3">
              {works.map((work) => (
                <li
                  key={work.id}
                  className="group rounded-xl border border-border bg-white p-5 transition-all duration-200 hover:border-primary/40 hover:shadow-md"
                >
                  <h3 className="text-lg font-semibold text-foreground">
                    {work.title}
                  </h3>

                  {/* Detail: Penulis · Institusi · Jenis · Tahun */}
                  <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">
                      {work.authorName}
                    </span>
                    {work.authorInstitution && (
                      <>
                        <span aria-hidden>&middot;</span>
                        <span>{work.authorInstitution}</span>
                      </>
                    )}
                    <span aria-hidden>&middot;</span>
                    <span className="badge badge-info text-xs">
                      {WORK_TYPE_LABELS[work.type]}
                    </span>
                    <span aria-hidden>&middot;</span>
                    <span>{work.year}</span>
                  </div>

                  {/* Aksi: tautan teks: Abstrak · Halaman Judul · Daftar Isi · Request Access */}
                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                    <FileLink url={work.abstractFileUrl} label="Abstrak" />
                    <FileLink url={work.titlePageFileUrl} label="Halaman Judul" />
                    <FileLink url={work.tocFileUrl} label="Daftar Isi" />
                    <button
                      onClick={() => setRequestTarget(work)}
                      className="font-medium text-primary hover:underline"
                    >
                      Request Access
                    </button>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        ))}
      </div>

      {requestTarget && (
        <RequestAccessModal
          work={requestTarget}
          onClose={() => setRequestTarget(null)}
        />
      )}
    </>
  );
}

function RequestAccessModal({
  work,
  onClose,
}: {
  work: Work;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white border border-border rounded-xl shadow-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto"
      >
        <h2 className="text-xl font-bold text-foreground mb-1">
          Permintaan Akses Karya
        </h2>
        <p className="text-sm text-muted-foreground mb-1">
          Karya:{' '}
          <span className="font-medium text-foreground">{work.title}</span>
        </p>
        <p className="text-xs text-muted-foreground mb-4">
          {work.authorName} · {work.year}
        </p>

        <RequestForm workId={work.id} onCancel={onClose} />
      </motion.div>
    </div>
  );
}

function RequestForm({
  workId,
  onCancel,
}: {
  workId: string;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    name: '',
    whatsapp: '',
    email: '',
    purpose: '',
    institution: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await submitAccessRequest({ ...formData, workId });
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Gagal mengirim permintaan');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="text-center py-6">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600 text-xl">
          &#10003;
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Permintaan Terkirim
        </h3>
        <p className="text-sm text-muted-foreground mb-6">
          Terima kasih. Permintaan Anda akan ditinjau oleh pengurus asrama. Kami
          akan menghubungi Anda melalui WhatsApp/Email yang Anda berikan.
        </p>
        <button onClick={onCancel} className="btn btn-primary">
          Tutup
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <Field label="Nama">
        <input
          className="input"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
      </Field>

      <Field label="No. WhatsApp">
        <input
          className="input"
          placeholder="62812xxxxxxxx"
          value={formData.whatsapp}
          onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
          required
        />
      </Field>

      <Field label="Email">
        <input
          type="email"
          className="input"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
        />
      </Field>

      <Field label="Keperluan">
        <textarea
          className="input min-h-[80px] resize-y"
          placeholder="Untuk apa karya ini Anda butuhkan..."
          value={formData.purpose}
          onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
          required
        />
      </Field>

      <Field label="Institusi / Kampus">
        <input
          className="input"
          placeholder="Nama universitas / institusi"
          value={formData.institution}
          onChange={(e) =>
            setFormData({ ...formData, institution: e.target.value })
          }
          required
        />
      </Field>

      <div className="flex gap-3 pt-2">
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
          {isSubmitting ? 'Mengirim...' : 'Kirim Permintaan'}
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

// Tautan teks ke berkas PDF; tampil non-aktif (abu-abu) bila berkas belum tersedia
function FileLink({ url, label }: { url: string | null; label: string }) {
  if (url) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="font-medium text-primary hover:underline"
      >
        {label}
      </a>
    );
  }
  return (
    <span
      className="text-muted-foreground/60 cursor-not-allowed"
      title={`${label} belum tersedia`}
    >
      {label}
    </span>
  );
}