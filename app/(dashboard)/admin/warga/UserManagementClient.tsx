'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
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

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await createUser({ ...formData, photoFile, divisionScope: formData.divisionScope || null });
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
      await updateUser(selectedUser.id, { ...formData, photoFile, divisionScope: formData.divisionScope || null });
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
            className="btn btn-primary"
          >
            + Tambah Warga
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
                    className={`badge ${
                      user.status === 'AKTIF' ? 'badge-success' : 'badge-warning'
                    }`}
                  >
                    {user.status}
                  </span>
                </td>
                <td>
                  <div className="flex flex-wrap gap-1">
                    {user.roles.map((r) => (
                      <span key={r.role.id} className="badge badge-info text-xs">
                        {r.role.label}
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
      {isAddModalOpen && (
        <Modal
          title="Tambah Warga Baru"
          onClose={() => {
            setIsAddModalOpen(false);
            resetForm();
          }}
        >
          <form onSubmit={handleAddUser} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <PhotoInput
              photoPreview={photoPreview}
              onPhotoChange={handlePhotoChange}
            />

            <FormInput
              label="Username"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              required
            />

            <FormInput
              label="Nama Lengkap"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              required
            />

            <FormInput
              label="No. WhatsApp (62xxx)"
              placeholder="628123456789"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              required
            />

            <FormInput
              label="Password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
            />

            <FormSelect
              label="Status"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              options={[
                { value: 'AKTIF', label: 'Aktif' },
                { value: 'ALUMNI', label: 'Alumni' },
              ]}
            />

            <FormMultiSelect
              label="Role"
              options={roles}
              selectedIds={formData.roleIds}
              onChange={(ids) => setFormData({ ...formData, roleIds: ids })}
            />

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
                  setIsAddModalOpen(false);
                  resetForm();
                }}
                className="btn btn-secondary flex-1"
                disabled={isSubmitting}
              >
                Batal
              </button>
              <button type="submit" className="btn btn-primary flex-1" disabled={isSubmitting}>
                {isSubmitting ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </form>
        </Modal>
      )}

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
          <form onSubmit={handleEditUser} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <PhotoInput
              photoPreview={photoPreview}
              onPhotoChange={handlePhotoChange}
            />

            <FormInput label="Username" value={formData.username} onChange={() => {}} disabled />

            <FormInput
              label="Nama Lengkap"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              required
            />

            <FormInput
              label="No. WhatsApp (62xxx)"
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
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              options={[
                { value: 'AKTIF', label: 'Aktif' },
                { value: 'ALUMNI', label: 'Alumni' },
              ]}
            />

            <FormMultiSelect
              label="Role"
              options={roles}
              selectedIds={formData.roleIds}
              onChange={(ids) => setFormData({ ...formData, roleIds: ids })}
            />

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
        </Modal>
      )}
    </div>
  );
}

// Helper Components
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
        className="glass-card max-w-md w-full p-6"
      >
        <h2 className="text-xl font-bold text-foreground mb-4">{title}</h2>
        {children}
      </motion.div>
    </div>
  );
}

function FormInput({
  label,
  ...props
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label className="block text-sm font-medium text-foreground mb-2">{label}</label>
      <input {...props} className="input" />
    </div>
  );
}

function FormSelect({
  label,
  options,
  ...props
}: {
  label: string;
  options: Array<{ value: string; label: string }>;
} & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div>
      <label className="block text-sm font-medium text-foreground mb-2">{label}</label>
      <select {...props} className="input">
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
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
}: {
  photoPreview: string;
  onPhotoChange: (file: File | null) => void;
}) {
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
