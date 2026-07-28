'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { updateOwnAccount } from './actions';
import { Shield, Lock, Smartphone, User, KeyRound, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

interface Props {
  user: {
    id: string;
    username: string;
    fullName: string;
    phone: string;
    status: string;
  };
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.07 },
  },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 80, damping: 14 },
  },
};

export default function AccountSettingsClient({ user }: Props) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password && password !== confirmPassword) {
      setError('Password dan konfirmasi tidak cocok');
      return;
    }
    if (password && password.length < 6) {
      setError('Password minimal 6 karakter');
      return;
    }

    setIsSubmitting(true);
    try {
      // Only send password update (phone is read-only now)
      await updateOwnAccount({ password: password || undefined });
      setSuccess('Password berhasil diperbarui');
      setPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setError(err.message || 'Gagal memperbarui akun');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-5"
    >
      {/* ── Profile Card ── */}
      <motion.div
        variants={item}
        className="relative overflow-hidden rounded-2xl border border-border bg-white p-6 shadow-sm"
      >
        <div className="absolute -top-8 -right-8 h-32 w-32 rounded-full bg-blue-100/40 blur-2xl" />

        <div className="relative z-10 flex items-start gap-4">
          <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
            <Shield className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Informasi Akun</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Data diri hanya dapat diubah oleh admin
            </p>
          </div>
        </div>

        <div className="relative z-10 mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field icon={<User className="h-3.5 w-3.5" />} label="Nama Lengkap" value={user.fullName} />
          <Field icon={<User className="h-3.5 w-3.5" />} label="Username" value={user.username} />
          <Field
            icon={<Smartphone className="h-3.5 w-3.5" />}
            label="Nomor WhatsApp"
            value={user.phone || 'Belum diatur'}
            locked
            lockedNote="Hubungi admin untuk mengubah nomor"
          />
          <Field
            icon={<Shield className="h-3.5 w-3.5" />}
            label="Status Keanggotaan"
            value={user.status}
            badge
          />
        </div>
      </motion.div>

      {/* ── Password Card ── */}
      <motion.div
        variants={item}
        className="relative overflow-hidden rounded-2xl border border-border bg-white p-6 shadow-sm"
      >
        <div className="absolute -bottom-8 -right-8 h-32 w-32 rounded-full bg-amber-100/40 blur-2xl" />

        <div className="relative z-10 flex items-start gap-4">
          <div className="rounded-xl bg-amber-50 p-3 text-amber-600">
            <KeyRound className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Keamanan</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Ubah kata sandi untuk menjaga keamanan akun
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="relative z-10 mt-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                Password Baru
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input w-full"
                  style={{ paddingLeft: '2.5rem' }}
                  placeholder="Minimal 6 karakter"
                  minLength={6}
                />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                Konfirmasi Password
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="input w-full"
                  style={{ paddingLeft: '2.5rem' }}
                  placeholder="Ulangi password baru"
                  minLength={6}
                />
              </div>
            </div>
          </div>

          {/* Feedback */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              {error}
            </motion.div>
          )}
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
            >
              <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
              {success}
            </motion.div>
          )}

          <div className="mt-6 flex items-center gap-4">
            <button
              type="submit"
              disabled={isSubmitting || !password}
              className="btn btn-primary inline-flex items-center gap-2"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <SaveIcon className="h-4 w-4" />
              )}
              {isSubmitting ? 'Menyimpan...' : 'Simpan Password'}
            </button>
            {password && (
              <button
                type="button"
                onClick={() => { setPassword(''); setConfirmPassword(''); setError(''); }}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Batal
              </button>
            )}
          </div>
        </form>
      </motion.div>

      {/* ── Admin Contact Hint ── */}
      <motion.div
        variants={item}
        className="rounded-xl border border-blue-100 bg-blue-50/60 px-4 py-3 text-xs text-blue-700"
      >
        <p>
          <span className="font-semibold">Perlu bantuan?</span>{' '}
          Jika ingin mengubah data pribadi (nama, nomor WhatsApp, atau status), silakan hubungi{' '}
          <a href="/hubungi-kami" className="font-semibold underline">admin asrama</a>.
        </p>
      </motion.div>
    </motion.div>
  );
}

/* ── Subcomponents ── */

function Field({
  icon,
  label,
  value,
  locked,
  lockedNote,
  badge,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  locked?: boolean;
  lockedNote?: string;
  badge?: boolean;
}) {
  return (
    <div className="space-y-1">
      <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        {icon}
        {label}
      </label>
      <div className="flex items-center gap-2">
        {badge ? (
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
              value === 'AKTIF'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                : 'bg-slate-100 text-slate-600 border border-slate-200'
            }`}
          >
            {value}
          </span>
        ) : (
          <span className="text-sm font-medium text-foreground">{value}</span>
        )}
        {locked && (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700 border border-amber-100">
            <Lock className="h-3 w-3" /> Hanya admin
          </span>
        )}
      </div>
      {lockedNote && (
        <p className="text-[11px] text-muted-foreground">{lockedNote}</p>
      )}
    </div>
  );
}

function SaveIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
      <polyline points="17 21 17 13 7 13 7 21" />
      <polyline points="7 3 7 8 15 8" />
    </svg>
  );
}
