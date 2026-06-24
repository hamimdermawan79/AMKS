'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UserPlus,
  X,
  Camera,
  User,
  Phone,
  Lock,
  Shield,
  Briefcase,
  AlertCircle,
  Loader2,
  GraduationCap,
  Users,
} from 'lucide-react';
import { createUser, updateUser, deleteUser } from './actions';

interface User {
  id: string;
  username: string;
  fullName: string;
  phone: string;
  status: string;
  jabatan: string | null;
  divisionScope: string | null;
  photoUrl: string | null;
  roles: Array<{ role: { id: string; name: string; label: string } }>;
}

interface Role {
  id: string;
  name: string;
  label: string;
}

interface Props {
  users: User[];
  roles: Role[];
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
}

export default function UserManagementClient({
  users,
  roles,
  canCreate,
  canUpdate,
  canDelete,
}: Props) {
  const router = useRouter();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    username: '',
    fullName: '',
    phone: '',
    password: '',
    status: 'AKTIF',
    roleIds: [] as string[],
    divisionScope: '' as string,
    jabatan: '' as string,
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handlePhotoChange = (file: File | null) => {
    setPhotoFile(file);
    if (file) {
      setPhotoPreview(URL.createObjectURL(file));
    } else {
      setPhotoPreview('');
    }
  };

  const DIVISIONS = [
    { value: '', label: '— Tidak ada —' },
    { value: 'KEBERSIHAN', label: 'Kebersihan' },
    { value: 'KESENIAN', label: 'Kesenian' },
    { value: 'KEOLAHRAGAAN', label: 'Keolahragaan' },
    { value: 'ROHANI', label: 'Rohani' },
  ];

  const JABATAN_OPTIONS = [
    { value: '', label: '— Tidak ada / Warga —' },
    { value: 'Ketua Asrama', label: 'Ketua Asrama' },
    { value: 'Sekretaris', label: 'Sekretaris' },
    { value: 'Bendahara', label: 'Bendahara' },
    { value: 'Ketua Divisi Kebersihan', label: 'Ketua Divisi Kebersihan' },
    { value: 'Ketua Divisi Kesenian', label: 'Ketua Divisi Kesenian' },
    { value: 'Ketua Divisi Keolahragaan', label: 'Ketua Divisi Keolahragaan' },
    { value: 'Ketua Divisi Rohani', label: 'Ketua Divisi Rohani' },
  ];

  const getAddJabatanOptions = () => {
    return JABATAN_OPTIONS.map((opt) => {
      if (opt.value === '') return { value: '', label: opt.label, disabled: false };
      const occupant = users.find((u) => u.jabatan === opt.value && u.status !== 'ALUMNI');
      if (occupant) {
        return {
          value: opt.value,
          label: `${opt.label} (Sudah diduduki: ${occupant.fullName})`,
          disabled: true,
        };
      }
      return { value: opt.value, label: opt.label, disabled: false };
    });
  };

  const getEditJabatanOptions = (currentUserId: string) => {
    return JABATAN_OPTIONS.map((opt) => {
      if (opt.value === '') return { value: '', label: opt.label, disabled: false };
      const occupant = users.find((u) => u.jabatan === opt.value && u.id !== currentUserId && u.status !== 'ALUMNI');
      if (occupant) {
        return {
          value: opt.value,
          label: `${opt.label} (Sudah diduduki: ${occupant.fullName})`,
          disabled: true,
        };
      }
      return { value: opt.value, label: opt.label, disabled: false };
    });
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await createUser({
        ...formData,
        photoFile,
        divisionScope: formData.divisionScope || null,
        jabatan: formData.jabatan || null
      });
      setIsAddModalOpen(false);
      resetForm();
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Gagal membuat user');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    setError('');
    setIsSubmitting(true);

    try {
      await updateUser(selectedUser.id, {
        ...formData,
        photoFile,
        divisionScope: formData.divisionScope || null,
        jabatan: formData.jabatan || null
      });
      setIsEditModalOpen(false);
      setSelectedUser(null);
      resetForm();
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Gagal update user');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    setIsDeleting(true);
    try {
      await deleteUser(userId);
      setDeleteUserId(null);
      router.refresh();
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus user');
    } finally {
      setIsDeleting(false);
    }
  };

  const openEditModal = (user: User) => {
    setSelectedUser(user);
    setFormData({
      username: user.username,
      fullName: user.fullName,
      phone: user.phone,
      password: '',
      status: user.status,
      roleIds: user.roles.map((r) => r.role.id),
      divisionScope: user.divisionScope || '',
      jabatan: user.jabatan || '',
    });
    setPhotoFile(null);
    setPhotoPreview(user.photoUrl || '');
    setIsEditModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      username: '',
      fullName: '',
      phone: '',
      password: '',
      status: 'AKTIF',
      roleIds: [],
      divisionScope: '',
      jabatan: '',
    });
    setPhotoFile(null);
    setPhotoPreview('');
    setError('');
  };

  return (
    <div className="space-y-6">
      {/* Header with Add Button */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Total: <span className="font-semibold text-foreground">{users.length}</span> warga
        </div>
        {canCreate && (
          <button
            onClick={() => {
              resetForm();
              setIsAddModalOpen(true);
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:shadow-md hover:opacity-95 active:scale-[0.98]"
          >
            <UserPlus className="h-4 w-4" />
            <span className="hidden sm:inline">Tambah Warga</span>
            <span className="sm:hidden">Tambah</span>
          </button>
        )}
      </div>

      {/* Users Table */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Username</th>
              <th>Nama Lengkap</th>
              <th>No. WhatsApp</th>
              <th>Status</th>
              <th>Role</th>
              <th>Jabatan</th>
              {(canUpdate || canDelete) && <th className="text-center">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td className="font-medium">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full overflow-hidden bg-secondary border border-border flex-shrink-0">
                      {user.photoUrl ? (
                        <img src={user.photoUrl} alt={user.fullName} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
                          {user.fullName.charAt(0)}
                        </div>
                      )}
                    </div>
                    {user.username}
                  </div>
                </td>
                <td>{user.fullName}</td>
                <td className="font-mono text-xs">{user.phone}</td>
                <td>
                  <span
                    className={`badge ${user.status === 'AKTIF' ? 'badge-success' : 'badge-warning'
                      }`}
                  >
                    {user.status}
                  </span>
                </td>
                <td>
                  <div className="flex flex-wrap gap-1">
                    {user.roles.map((r) => (
                      <span key={r.role.id} className="badge badge-info text-xs">
                        {r.role.name === 'DIVISION_HEAD' && user.divisionScope
                          ? `${r.role.label} ${user.divisionScope}`
                          : r.role.label}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="text-sm">{user.jabatan || '-'}</td>
                {(canUpdate || canDelete) && (
                  <td className="text-center space-x-2">
                    {canUpdate && (
                      <button
                        onClick={() => openEditModal(user)}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        Edit
                      </button>
                    )}
                    {canDelete && (
                      <button
                        onClick={() => setDeleteUserId(user.id)}
                        className="text-xs text-red-600 hover:underline"
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

      {/* Add User Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <Modal
            title="Tambah Warga Baru"
            subtitle="Lengkapi data warga asrama untuk akun baru"
            icon={<UserPlus className="h-5 w-5" />}
            size="lg"
            onClose={() => {
              setIsAddModalOpen(false);
              resetForm();
            }}
          >
            <form onSubmit={handleAddUser} className="flex flex-col min-h-0">
              <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 space-y-6 max-h-[min(70vh,640px)]">
                {error && (
                  <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                <FormSection title="Foto Profil" icon={<Camera className="h-4 w-4" />}>
                  <PhotoInput photoPreview={photoPreview} onPhotoChange={handlePhotoChange} variant="modern" />
                </FormSection>

                <FormSection title="Identitas & Akun" icon={<User className="h-4 w-4" />}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormInput
                      label="Username"
                      icon={<User className="h-3.5 w-3.5" />}
                      placeholder="contoh: budi_santoso"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      required
                    />
                    <FormInput
                      label="Nama Lengkap"
                      icon={<User className="h-3.5 w-3.5" />}
                      placeholder="Nama lengkap warga"
                      value={formData.fullName}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^a-zA-Z\s]/g, '');
                        setFormData({ ...formData, fullName: val });
                      }}
                      required
                    />
                    <FormInput
                      label="No. WhatsApp"
                      icon={<Phone className="h-3.5 w-3.5" />}
                      placeholder="62xxxxxxxxxx"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      required
                    />
                    <FormInput
                      label="Password"
                      type="password"
                      icon={<Lock className="h-3.5 w-3.5" />}
                      placeholder="Minimal 6 karakter"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required
                    />
                  </div>
                </FormSection>

                <FormSection title="Status & Hak Akses" icon={<Shield className="h-4 w-4" />}>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                        Status Warga
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { value: 'AKTIF', label: 'Aktif', icon: Users },
                          { value: 'ALUMNI', label: 'Alumni', icon: GraduationCap },
                        ].map(({ value, label, icon: Icon }) => (
                          <button
                            key={value}
                            type="button"
                            onClick={() =>
                              setFormData({
                                ...formData,
                                status: value,
                                roleIds: value === 'ALUMNI' ? [] : formData.roleIds,
                                jabatan: value === 'ALUMNI' ? '' : formData.jabatan,
                              })
                            }
                            className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-3 text-sm font-medium transition-all ${
                              formData.status === value
                                ? 'border-primary bg-primary/10 text-primary shadow-sm ring-1 ring-primary/20'
                                : 'border-border bg-background text-muted-foreground hover:border-primary/30 hover:bg-muted/50'
                            }`}
                          >
                            <Icon className="h-4 w-4" />
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {formData.status === 'ALUMNI' ? (
                      <div className="rounded-xl border border-dashed border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
                        Role <span className="font-medium text-foreground">Alumni</span> akan ditetapkan otomatis.
                      </div>
                    ) : (
                      <FormSelect
                        label="Role"
                        value={formData.roleIds[0] || ''}
                        onChange={(e) =>
                          setFormData({ ...formData, roleIds: e.target.value ? [e.target.value] : [] })
                        }
                        options={[
                          { value: '', label: '— Pilih Role —' },
                          ...roles
                            .filter((role) => role.name !== 'ALUMNI')
                            .map((role) => ({ value: role.id, label: role.label })),
                        ]}
                      />
                    )}
                  </div>
                </FormSection>

                {formData.status !== 'ALUMNI' && (
                  <FormSection title="Jabatan Organisasi" icon={<Briefcase className="h-4 w-4" />}>
                    <FormSelect
                      label="Jabatan (Opsional)"
                      value={formData.jabatan}
                      onChange={(e) => setFormData({ ...formData, jabatan: e.target.value })}
                      options={getAddJabatanOptions()}
                    />
                    {formData.roleIds.some((id) => {
                      const role = roles.find((r) => r.id === id);
                      return role?.name === 'DIVISION_HEAD';
                    }) && (
                      <div className="mt-4">
                        <FormSelect
                          label="Divisi yang Dikelola"
                          value={formData.divisionScope}
                          onChange={(e) => setFormData({ ...formData, divisionScope: e.target.value })}
                          options={DIVISIONS}
                        />
                      </div>
                    )}
                  </FormSection>
                )}
              </div>

              <div className="shrink-0 border-t border-border bg-muted/30 px-4 sm:px-6 py-4 flex flex-col-reverse sm:flex-row gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    resetForm();
                  }}
                  className="w-full sm:flex-1 rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  disabled={isSubmitting}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:opacity-95 disabled:opacity-60"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4" />
                      Simpan Warga
                    </>
                  )}
                </button>
              </div>
            </form>
          </Modal>
        )}
      </AnimatePresence>

      {/* Edit User Modal */}
      {isEditModalOpen && selectedUser && (
        <Modal
          title={`Edit Warga: ${selectedUser.username}`}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedUser(null);
            resetForm();
          }}
        >
          <form onSubmit={handleEditUser} className="p-4 sm:p-6 space-y-4 overflow-y-auto max-h-[min(70vh,640px)]">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <PhotoInput
              photoPreview={photoPreview}
              onPhotoChange={handlePhotoChange}
            />

            <FormInput label="Username" value={formData.username} onChange={() => { }} disabled />

            <FormInput
              label="Nama Lengkap"
              value={formData.fullName}
              onChange={(e) => {
                const val = e.target.value.replace(/[^a-zA-Z\s]/g, '');
                setFormData({ ...formData, fullName: val });
              }}
              required
            />

            <FormInput
              label="No. WhatsApp"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              required
            />

            <FormInput
              label="Password Baru (kosongkan jika tidak diubah)"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />

            <FormSelect
              label="Status"
              value={formData.status}
              onChange={(e) => {
                const newStatus = e.target.value;
                setFormData({
                  ...formData,
                  status: newStatus,
                  roleIds: newStatus === 'ALUMNI' ? [] : formData.roleIds,
                  jabatan: newStatus === 'ALUMNI' ? '' : formData.jabatan,
                });
              }}
              options={[
                { value: 'AKTIF', label: 'Aktif' },
                { value: 'ALUMNI', label: 'Alumni' },
              ]}
            />

            {formData.status === 'ALUMNI' ? (
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Role</label>
                <p className="input bg-muted text-muted-foreground">Alumni (ditetapkan otomatis)</p>
              </div>
            ) : (
              <FormSelect
                label="Role"
                value={formData.roleIds[0] || ''}
                onChange={(e) => setFormData({ ...formData, roleIds: e.target.value ? [e.target.value] : [] })}
                options={[
                  { value: '', label: '-- Pilih Role --' },
                  ...roles.filter((role) => role.name !== 'ALUMNI').map((role) => ({
                    value: role.id,
                    label: role.label,
                  })),
                ]}
              />
            )}

            {/* Position (Jabatan) Selection */}
            {formData.status !== 'ALUMNI' && (
              <FormSelect
                label="Jabatan Struktur Organisasi (Opsional)"
                value={formData.jabatan}
                onChange={(e) => setFormData({ ...formData, jabatan: e.target.value })}
                options={getEditJabatanOptions(selectedUser.id)}
              />
            )}

            {/* Division Scope - shown when DIVISION_HEAD role selected */}
            {formData.roleIds.some((id) => {
              const role = roles.find((r) => r.id === id);
              return role?.name === 'DIVISION_HEAD';
            }) && (
                <FormSelect
                  label="Divisi yang Dikelola (untuk Ketua Divisi)"
                  value={formData.divisionScope}
                  onChange={(e) => setFormData({ ...formData, divisionScope: e.target.value })}
                  options={DIVISIONS}
                />
              )}

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  setIsEditModalOpen(false);
                  setSelectedUser(null);
                  resetForm();
                }}
                className="btn btn-secondary flex-1"
                disabled={isSubmitting}
              >
                Batal
              </button>
              <button type="submit" className="btn btn-primary flex-1" disabled={isSubmitting}>
                {isSubmitting ? 'Menyimpan...' : 'Update'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {deleteUserId && (
        <Modal title="Konfirmasi Hapus" onClose={() => setDeleteUserId(null)}>
          <div className="p-4 sm:p-6">
          <p className="text-muted-foreground mb-6">
            Apakah Anda yakin ingin menghapus user ini? Tindakan ini tidak dapat dibatalkan.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setDeleteUserId(null)}
              className="btn btn-secondary flex-1"
              disabled={isDeleting}
            >
              Batal
            </button>
            <button
              onClick={() => handleDeleteUser(deleteUserId)}
              className="btn bg-destructive text-destructive-foreground hover:bg-red-600 flex-1"
              disabled={isDeleting}
            >
              {isDeleting ? 'Menghapus...' : 'Hapus'}
            </button>
          </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// Helper Components
function Modal({
  title,
  subtitle,
  icon,
  children,
  onClose,
  size = 'md',
}: {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  onClose: () => void;
  size?: 'md' | 'lg';
}) {
  const maxWidth = size === 'lg' ? 'max-w-2xl' : 'max-w-md';

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 24, scale: 0.98 }}
        transition={{ type: 'spring', damping: 28, stiffness: 320 }}
        className={`relative z-10 w-full ${maxWidth} max-h-[95dvh] sm:max-h-[90dvh] flex flex-col overflow-hidden rounded-t-2xl sm:rounded-2xl border border-border bg-card shadow-2xl`}
      >
        <div className="shrink-0 flex items-start justify-between gap-3 border-b border-border bg-gradient-to-r from-primary/5 via-background to-background px-4 sm:px-6 py-4">
          <div className="flex items-start gap-3 min-w-0">
            {icon && (
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                {icon}
              </div>
            )}
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-foreground leading-tight truncate">{title}</h2>
              {subtitle && (
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{subtitle}</p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Tutup"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex flex-col min-h-0 flex-1">{children}</div>
      </motion.div>
    </div>
  );
}

function FormSection({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
        {icon && <span className="text-primary">{icon}</span>}
        {title}
      </div>
      {children}
    </section>
  );
}

function FormInput({
  label,
  icon,
  ...props
}: { label: string; icon?: React.ReactNode } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label className="block text-xs font-semibold text-muted-foreground mb-1.5">{label}</label>
      <div className="relative">
        {icon && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            {icon}
          </span>
        )}
        <input
          {...props}
          className={`w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground transition-colors placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-60 ${icon ? 'pl-9' : ''}`}
        />
      </div>
    </div>
  );
}

function FormSelect({
  label,
  options,
  ...props
}: {
  label: string;
  options: Array<{ value: string; label: string; disabled?: boolean }>;
} & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div>
      <label className="block text-xs font-semibold text-muted-foreground mb-1.5">{label}</label>
      <select
        {...props}
        className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-60"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} disabled={opt.disabled}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function FormMultiSelect({
  label,
  options,
  selectedIds,
  onChange,
}: {
  label: string;
  options: Array<{ id: string; label: string }>;
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}) {
  const toggleRole = (roleId: string) => {
    if (selectedIds.includes(roleId)) {
      onChange(selectedIds.filter((id) => id !== roleId));
    } else {
      onChange([...selectedIds, roleId]);
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium text-foreground mb-2">{label}</label>
      <div className="space-y-2">
        {options.map((role) => (
          <label key={role.id} className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={selectedIds.includes(role.id)}
              onChange={() => toggleRole(role.id)}
              className="w-4 h-4"
            />
            <span className="text-sm text-foreground">{role.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

function PhotoInput({
  photoPreview,
  onPhotoChange,
  variant = 'default',
}: {
  photoPreview: string;
  onPhotoChange: (file: File | null) => void;
  variant?: 'default' | 'modern';
}) {
  const fileRef = useRef<HTMLInputElement>(null);

  if (variant === 'modern') {
    return (
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="group relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl border-2 border-dashed border-border bg-muted/40 transition-colors hover:border-primary/50 hover:bg-primary/5"
        >
          {photoPreview ? (
            <img src={photoPreview} alt="Preview" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-muted-foreground">
              <Camera className="h-6 w-6 group-hover:text-primary transition-colors" />
              <span className="text-[10px] font-medium">Foto</span>
            </div>
          )}
          <span className="absolute inset-x-0 bottom-0 bg-black/50 py-0.5 text-[9px] text-white opacity-0 transition-opacity group-hover:opacity-100">
            Ubah
          </span>
        </button>
        <div className="flex-1 text-center sm:text-left space-y-2">
          <p className="text-sm font-medium text-foreground">Unggah foto profil</p>
          <p className="text-xs text-muted-foreground">JPG, PNG, atau WebP. Opsional — bisa ditambahkan nanti.</p>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
          >
            <Camera className="h-3.5 w-3.5" />
            Pilih Berkas
          </button>
          {photoPreview && (
            <button
              type="button"
              onClick={() => onPhotoChange(null)}
              className="block sm:inline sm:ml-2 text-xs text-red-600 hover:underline"
            >
              Hapus foto
            </button>
          )}
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => onPhotoChange(e.target.files?.[0] || null)}
        />
      </div>
    );
  }

  return (
    <div>
      <label className="block text-sm font-medium text-foreground mb-2">Foto User</label>
      <div className="flex items-center gap-4">
        <div className="w-20 h-20 rounded-full overflow-hidden bg-secondary border border-border flex-shrink-0">
          {photoPreview ? (
            <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
              No photo
            </div>
          )}
        </div>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => onPhotoChange(e.target.files?.[0] || null)}
          className="input flex-1"
        />
      </div>
    </div>
  );
}
