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
  MapPin,
  BookOpen,
  Calendar,
} from 'lucide-react';
import { createUser, updateUser, deleteUser } from './actions';

interface UserData {
  id: string;
  username: string;
  fullName: string;
  phone: string;
  status: string;
  jabatan: string | null;
  divisionScope: string | null;
  photoUrl: string | null;
  jurusan: string | null;
  namaKampus: string | null;
  tahunMasuk: number | null;
  asalDaerah: string | null;
  tahunKeluar: number | null;
  roles: Array<{ role: { id: string; name: string; label: string } }>;
}

interface Role {
  id: string;
  name: string;
  label: string;
}

interface Props {
  users: UserData[];
  roles: Role[];
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
}

const EMPTY_FORM = {
  username: '',
  fullName: '',
  phone: '',
  password: '',
  status: 'AKTIF',
  roleIds: [] as string[],
  divisionScope: '',
  jabatan: '',
  jurusan: '',
  namaKampus: '',
  tahunMasuk: '',
  asalDaerah: '',
  tahunKeluar: '',
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

// Roles that imply a jabatan — jabatan field is hidden when role implies position
const ROLE_TO_JABATAN: Record<string, string> = {
  KETUA_ASRAMA: 'Ketua Asrama',
  SEKRETARIS: 'Sekretaris',
  BENDAHARA: 'Bendahara',
  DIVISION_HEAD: '', // division head needs divisionScope to determine jabatan
};

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
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);

  const [formData, setFormData] = useState(EMPTY_FORM);
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

  // Check if selected role already implies a jabatan (no need for manual jabatan selection)
  const selectedRoleNames = formData.roleIds.map((id) => roles.find((r) => r.id === id)?.name || '');
  const roleImpliesJabatan = selectedRoleNames.some((name) => name in ROLE_TO_JABATAN);
  const isDivisionHead = selectedRoleNames.includes('DIVISION_HEAD');

  const getJabatanOptions = (excludeUserId?: string) => {
    return JABATAN_OPTIONS.map((opt) => {
      if (opt.value === '') return { value: '', label: opt.label, disabled: false };
      const occupant = users.find(
        (u) => u.jabatan === opt.value && u.status !== 'ALUMNI' && u.id !== excludeUserId
      );
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
        jabatan: formData.jabatan || null,
        tahunMasuk: formData.tahunMasuk ? parseInt(formData.tahunMasuk) : null,
        tahunKeluar: formData.tahunKeluar ? parseInt(formData.tahunKeluar) : null,
        jurusan: formData.jurusan || null,
        namaKampus: formData.namaKampus || null,
        asalDaerah: formData.asalDaerah || null,
      });
      setIsAddModalOpen(false);
      resetForm();
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan');
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
        jabatan: formData.jabatan || null,
        tahunMasuk: formData.tahunMasuk ? parseInt(formData.tahunMasuk) : null,
        tahunKeluar: formData.tahunKeluar ? parseInt(formData.tahunKeluar) : null,
        jurusan: formData.jurusan || null,
        namaKampus: formData.namaKampus || null,
        asalDaerah: formData.asalDaerah || null,
      });
      setIsEditModalOpen(false);
      setSelectedUser(null);
      resetForm();
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan');
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

  const openEditModal = (user: UserData) => {
    setSelectedUser(user);
    setError('');
    setFormData({
      username: user.username,
      fullName: user.fullName,
      phone: user.phone,
      password: '',
      status: user.status,
      roleIds: user.roles.map((r) => r.role.id),
      divisionScope: user.divisionScope || '',
      jabatan: user.jabatan || '',
      jurusan: user.jurusan || '',
      namaKampus: user.namaKampus || '',
      tahunMasuk: user.tahunMasuk ? String(user.tahunMasuk) : '',
      asalDaerah: user.asalDaerah || '',
      tahunKeluar: user.tahunKeluar ? String(user.tahunKeluar) : '',
    });
    setPhotoFile(null);
    setPhotoPreview(user.photoUrl || '');
    setIsEditModalOpen(true);
  };

  const resetForm = () => {
    setFormData(EMPTY_FORM);
    setPhotoFile(null);
    setPhotoPreview('');
    setError('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Total: <span className="font-semibold text-foreground">{users.length}</span> warga
        </div>
        {canCreate && (
          <button
            onClick={() => { resetForm(); setIsAddModalOpen(true); }}
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
              <th>Angkatan</th>
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
                  <span className={`badge ${user.status === 'AKTIF' ? 'badge-success' : 'badge-warning'}`}>
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
                <td className="text-sm">{user.tahunMasuk ? `${user.tahunMasuk}` : '-'}</td>
                {(canUpdate || canDelete) && (
                  <td className="text-center space-x-2">
                    {user.roles.some((r) => r.role.name === 'SUPERADMIN') ? (
                      <span className="text-xs text-muted-foreground italic px-2">— Sistem —</span>
                    ) : (
                      <>
                        {canUpdate && (
                          <button onClick={() => openEditModal(user)} className="text-xs text-blue-600 hover:underline min-h-[44px] px-2 inline-flex items-center">
                            Edit
                          </button>
                        )}
                        {canDelete && (
                          <button onClick={() => setDeleteUserId(user.id)} className="text-xs text-red-600 hover:underline min-h-[44px] px-2 inline-flex items-center">
                            Hapus
                          </button>
                        )}
                      </>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <Modal
            title="Tambah Warga Baru"
            subtitle="Lengkapi data warga asrama untuk akun baru"
            icon={<UserPlus className="h-5 w-5" />}
            size="lg"
            onClose={() => { setIsAddModalOpen(false); resetForm(); }}
          >
            <UserForm
              formData={formData}
              setFormData={setFormData}
              photoPreview={photoPreview}
              onPhotoChange={handlePhotoChange}
              roles={roles}
              users={users}
              isSubmitting={isSubmitting}
              error={error}
              isAdd
              onSubmit={handleAddUser}
              onCancel={() => { setIsAddModalOpen(false); resetForm(); }}
            />
          </Modal>
        )}
      </AnimatePresence>

      {/* Edit Modal */}
      {isEditModalOpen && selectedUser && (
        <Modal
          title={`Edit Warga: ${selectedUser.username}`}
          size="lg"
          onClose={() => { setIsEditModalOpen(false); setSelectedUser(null); resetForm(); }}
        >
          <UserForm
            formData={formData}
            setFormData={setFormData}
            photoPreview={photoPreview}
            onPhotoChange={handlePhotoChange}
            roles={roles}
            users={users}
            isSubmitting={isSubmitting}
            error={error}
            isAdd={false}
            currentUserId={selectedUser.id}
            onSubmit={handleEditUser}
            onCancel={() => { setIsEditModalOpen(false); setSelectedUser(null); resetForm(); }}
          />
        </Modal>
      )}

      {/* Delete Confirmation */}
      {deleteUserId && (
        <Modal title="Konfirmasi Hapus" onClose={() => setDeleteUserId(null)}>
          <div className="p-4 sm:p-6">
            <p className="text-muted-foreground mb-6">
              Apakah Anda yakin ingin menghapus user ini? Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteUserId(null)} className="btn btn-secondary flex-1" disabled={isDeleting}>
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

// ─── UserForm ──────────────────────────────────────────────────────────────────

function UserForm({
  formData,
  setFormData,
  photoPreview,
  onPhotoChange,
  roles,
  users,
  isSubmitting,
  error,
  isAdd,
  currentUserId,
  onSubmit,
  onCancel,
}: {
  formData: typeof EMPTY_FORM;
  setFormData: React.Dispatch<React.SetStateAction<typeof EMPTY_FORM>>;
  photoPreview: string;
  onPhotoChange: (file: File | null) => void;
  roles: Role[];
  users: UserData[];
  isSubmitting: boolean;
  error: string;
  isAdd: boolean;
  currentUserId?: string;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}) {
  const set = (key: keyof typeof EMPTY_FORM) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setFormData((prev) => ({ ...prev, [key]: e.target.value }));

  const selectedRoleNames = formData.roleIds.map((id) => roles.find((r) => r.id === id)?.name || '');
  const isDivisionHead = selectedRoleNames.includes('DIVISION_HEAD');
  // Role-based jabatan auto-mapping
  const roleMapsToJabatan: Record<string, string> = {
    KETUA_ASRAMA: 'Ketua Asrama',
    SEKRETARIS: 'Sekretaris',
    BENDAHARA: 'Bendahara',
  };
  const autoJabatan = selectedRoleNames.find((n) => n in roleMapsToJabatan);
  const roleImpliesJabatan = !!autoJabatan || isDivisionHead;

  const isAlumni = formData.status === 'ALUMNI';

  const getJabatanOptions = () => {
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
    return JABATAN_OPTIONS.map((opt) => {
      if (opt.value === '') return { ...opt, disabled: false };
      const occupant = users.find(
        (u) => u.jabatan === opt.value && u.status !== 'ALUMNI' && u.id !== currentUserId
      );
      if (occupant) {
        return { value: opt.value, label: `${opt.label} (Sudah diduduki: ${occupant.fullName})`, disabled: true };
      }
      return { ...opt, disabled: false };
    });
  };

  // --- Exclusive-role helpers ---
  // Roles that can only have 1 holder globally (non-ALUMNI, non-current user)
  const EXCLUSIVE_ROLE_NAMES = ['KETUA', 'SEKRETARIS', 'BENDAHARA'];

  const getRoleOptions = () => {
    // Never show SUPERADMIN in the dropdown
    const filteredRoles = roles.filter((r) => r.name !== 'SUPERADMIN' && r.name !== 'ALUMNI');

    return [
      { value: '', label: '— Pilih Role —', disabled: false },
      ...filteredRoles.map((r) => {
        // Check globally exclusive roles (KETUA, SEKRETARIS, BENDAHARA)
        if (EXCLUSIVE_ROLE_NAMES.includes(r.name)) {
          const occupant = users.find(
            (u) =>
              u.status !== 'ALUMNI' &&
              u.id !== currentUserId &&
              u.roles.some((ur) => ur.role.name === r.name)
          );
          if (occupant) {
            return {
              value: r.id,
              label: `${r.label} (Sudah digunakan: ${occupant.fullName})`,
              disabled: true,
            };
          }
        }
        // DIVISION_HEAD — not globally exclusive, but per divisionScope
        // We show it as available; per-scope uniqueness is enforced when divisionScope is selected
        return { value: r.id, label: r.label, disabled: false };
      }),
    ];
  };

  // Check if chosen divisionScope is already taken by another DIVISION_HEAD user
  const getIsDivisionScopeTaken = (scope: string) => {
    if (!scope) return false;
    const selectedRole = roles.find((r) => r.name === 'DIVISION_HEAD');
    if (!selectedRole) return false;
    const occupant = users.find(
      (u) =>
        u.status !== 'ALUMNI' &&
        u.id !== currentUserId &&
        u.divisionScope === scope &&
        u.roles.some((ur) => ur.role.name === 'DIVISION_HEAD')
    );
    return occupant ? occupant.fullName : null;
  };

  const divisionScopeTakenBy = isDivisionHead ? getIsDivisionScopeTaken(formData.divisionScope) : null;

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 20 }, (_, i) => currentYear - i);

  return (
    <form onSubmit={onSubmit} className="flex flex-col min-h-0">
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 space-y-6 max-h-[min(70vh,700px)]">
        {error && (
          <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Foto */}
        <FormSection title="Foto Profil" icon={<Camera className="h-4 w-4" />}>
          <PhotoInput photoPreview={photoPreview} onPhotoChange={onPhotoChange} variant="modern" />
        </FormSection>

        {/* Identitas */}
        <FormSection title="Identitas & Akun" icon={<User className="h-4 w-4" />}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {isAdd && (
              <FormInput
                label="Username"
                icon={<User className="h-3.5 w-3.5" />}
                placeholder="contoh: budi_santoso"
                value={formData.username}
                onChange={set('username')}
                required
              />
            )}
            {!isAdd && (
              <FormInput label="Username" value={formData.username} onChange={() => {}} disabled />
            )}
            <FormInput
              label="Nama Lengkap"
              icon={<User className="h-3.5 w-3.5" />}
              placeholder="Nama lengkap warga"
              value={formData.fullName}
              onChange={(e) => {
                const val = e.target.value.replace(/[^a-zA-Z\s]/g, '');
                setFormData((prev) => ({ ...prev, fullName: val }));
              }}
              required
            />
            <FormInput
              label="No. WhatsApp"
              icon={<Phone className="h-3.5 w-3.5" />}
              placeholder="62xxxxxxxxxx"
              value={formData.phone}
              onChange={set('phone')}
              required
            />
            <FormInput
              label={isAdd ? 'Password' : 'Password Baru (kosongkan jika tidak diubah)'}
              type="password"
              icon={<Lock className="h-3.5 w-3.5" />}
              placeholder="Minimal 6 karakter"
              value={formData.password}
              onChange={set('password')}
              required={isAdd}
            />
          </div>
        </FormSection>

        {/* Data Akademik & Asrama */}
        <FormSection title="Data Akademik & Asrama" icon={<BookOpen className="h-4 w-4" />}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormInput
              label="Jurusan"
              icon={<GraduationCap className="h-3.5 w-3.5" />}
              placeholder="contoh: Teknik Informatika"
              value={formData.jurusan}
              onChange={set('jurusan')}
            />
            <FormInput
              label="Nama Kampus"
              icon={<BookOpen className="h-3.5 w-3.5" />}
              placeholder="contoh: Universitas Gadjah Mada"
              value={formData.namaKampus}
              onChange={set('namaKampus')}
            />
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                Tahun Masuk Asrama
              </label>
              <select
                value={formData.tahunMasuk}
                onChange={set('tahunMasuk')}
                className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="">— Pilih Tahun —</option>
                {yearOptions.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            <FormInput
              label="Asal Daerah"
              icon={<MapPin className="h-3.5 w-3.5" />}
              placeholder="contoh: Sambas, Kalimantan Barat"
              value={formData.asalDaerah}
              onChange={set('asalDaerah')}
            />
            {isAlumni && (
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                  Tahun Keluar Asrama
                </label>
                <select
                  value={formData.tahunKeluar}
                  onChange={set('tahunKeluar')}
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">— Pilih Tahun —</option>
                  {yearOptions.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </FormSection>

        {/* Status & Role */}
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
                      setFormData((prev) => ({
                        ...prev,
                        status: value,
                        roleIds: value === 'ALUMNI' ? [] : prev.roleIds,
                        jabatan: value === 'ALUMNI' ? '' : prev.jabatan,
                      }))
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

            {isAlumni ? (
              <div className="rounded-xl border border-dashed border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
                Role <span className="font-medium text-foreground">Alumni</span> akan ditetapkan otomatis.
              </div>
            ) : (
              <FormSelect
                label="Role"
                value={formData.roleIds[0] || ''}
                onChange={(e) => {
                  const roleId = e.target.value;
                  const roleName = roles.find((r) => r.id === roleId)?.name || '';
                  // Auto-fill jabatan from role if applicable
                  const autoJab = roleMapsToJabatan[roleName] || '';
                  setFormData((prev) => ({
                    ...prev,
                    roleIds: roleId ? [roleId] : [],
                    jabatan: autoJab || prev.jabatan,
                    // Reset divisionScope when role changes
                    divisionScope: roleName !== 'DIVISION_HEAD' ? '' : prev.divisionScope,
                  }));
                }}
                options={getRoleOptions()}
              />
            )}
          </div>
        </FormSection>

        {/* Jabatan & Divisi — hanya tampil untuk warga aktif, dan hanya jika role tidak otomatis menetapkan jabatan */}
        {!isAlumni && (
          <FormSection title="Jabatan Organisasi" icon={<Briefcase className="h-4 w-4" />}>
            {roleImpliesJabatan ? (
              <div className="rounded-xl border border-dashed border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
                Jabatan ditetapkan otomatis dari role yang dipilih:{' '}
                <span className="font-medium text-foreground">
                  {autoJabatan
                    ? roleMapsToJabatan[autoJabatan]
                    : isDivisionHead
                    ? `Ketua Divisi ${formData.divisionScope || '...'}`
                    : '-'}
                </span>
              </div>
            ) : (
              <FormSelect
                label="Jabatan (Opsional)"
                value={formData.jabatan}
                onChange={set('jabatan')}
                options={getJabatanOptions()}
              />
            )}

            {isDivisionHead && (
              <div className="mt-4">
                <FormSelect
                  label="Divisi yang Dikelola"
                  value={formData.divisionScope}
                  onChange={set('divisionScope')}
                  options={DIVISIONS.map((d) => {
                    if (!d.value) return d;
                    const takenBy = getIsDivisionScopeTaken(d.value);
                    if (takenBy) {
                      return {
                        ...d,
                        label: `${d.label} (Sudah dikelola: ${takenBy})`,
                        disabled: true,
                      };
                    }
                    return { ...d, disabled: false };
                  })}
                />
                {divisionScopeTakenBy && (
                  <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                    <span>⚠</span> Divisi ini sudah dikelola oleh <strong>{String(divisionScopeTakenBy)}</strong>
                  </p>
                )}
              </div>
            )}
          </FormSection>
        )}
      </div>

      <div className="shrink-0 border-t border-border bg-muted/30 px-4 sm:px-6 py-4 flex flex-col-reverse sm:flex-row gap-2 sm:gap-3">
        <button
          type="button"
          onClick={onCancel}
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
              {isAdd ? 'Simpan Warga' : 'Update'}
            </>
          )}
        </button>
      </div>
    </form>
  );
}

const roleMapsToJabatan: Record<string, string> = {
  KETUA_ASRAMA: 'Ketua Asrama',
  SEKRETARIS: 'Sekretaris',
  BENDAHARA: 'Bendahara',
};

// ─── Helper Components ─────────────────────────────────────────────────────────

function Modal({
  title, subtitle, icon, children, onClose, size = 'md',
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
              {subtitle && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{subtitle}</p>}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex flex-col min-h-0 flex-1">{children}</div>
      </motion.div>
    </div>
  );
}

function FormSection({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
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

function FormInput({ label, icon, ...props }: { label: string; icon?: React.ReactNode } & React.InputHTMLAttributes<HTMLInputElement>) {
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
  label, options, ...props
}: { label: string; options: Array<{ value: string; label: string; disabled?: boolean }> } & React.SelectHTMLAttributes<HTMLSelectElement>) {
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

function PhotoInput({ photoPreview, onPhotoChange, variant = 'default' }: {
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
          <p className="text-xs text-muted-foreground">JPG, PNG, atau WebP. Opsional.</p>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
          >
            <Camera className="h-3.5 w-3.5" />
            Pilih Berkas
          </button>
          {photoPreview && (
            <button type="button" onClick={() => onPhotoChange(null)} className="block sm:inline sm:ml-2 text-xs text-red-600 hover:underline">
              Hapus foto
            </button>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => onPhotoChange(e.target.files?.[0] || null)} />
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
            <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">No photo</div>
          )}
        </div>
        <input type="file" accept="image/*" onChange={(e) => onPhotoChange(e.target.files?.[0] || null)} className="input flex-1" />
      </div>
    </div>
  );
}
