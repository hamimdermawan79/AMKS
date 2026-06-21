'use client';

import { useState } from 'react';
import { updateOwnAccount } from './actions';

interface Props {
  user: {
    id: string;
    username: string;
    fullName: string;
    phone: string;
    status: string;
  };
}

export default function AccountSettingsClient({ user }: Props) {
  const [phone, setPhone] = useState(user.phone || '');
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

    setIsSubmitting(true);
    try {
      await updateOwnAccount({ phone, password: password || undefined });
      setSuccess('Informasi akun berhasil diperbarui');
      setPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setError(err.message || 'Gagal memperbarui akun');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="border border-border bg-white p-8">
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 text-sm">
            {success}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Username</label>
          <input type="text" value={user.username} className="input bg-secondary" disabled />
          <p className="text-xs text-muted-foreground mt-1">Username tidak dapat diubah</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Nama Lengkap</label>
          <input type="text" value={user.fullName} className="input bg-secondary" disabled />
          <p className="text-xs text-muted-foreground mt-1">Hubungi admin untuk mengubah nama</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Nomor WhatsApp (62xxx)
          </label>
          <input
            type="text"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="input"
            placeholder="628123456789"
          />
          <p className="text-xs text-muted-foreground mt-1">Format: 62 + nomor, tanpa spasi</p>
        </div>

        <div className="border-t border-border pt-6">
          <h3 className="font-medium text-foreground mb-4">Ubah Password</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Password Baru
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input"
                placeholder="Minimal 6 karakter"
                minLength={6}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Konfirmasi Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="input"
                placeholder="Ulangi password baru"
                minLength={6}
              />
            </div>
          </div>
        </div>

        <div className="pt-4">
          <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
            {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
          </button>
        </div>
      </form>
    </div>
  );
}
