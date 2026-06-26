'use client';

import { useState, Fragment } from 'react';
import { motion } from 'framer-motion';
import { Shield, Check, Loader2, Save, Info, AlertTriangle, Send, MessageSquare } from 'lucide-react';
import { toggleRolePermission, testWhatsAppAction } from './actions';

interface Role {
  id: string;
  name: string;
  label: string;
  isSystem: boolean;
  permissions: { permissionId: string }[];
}

interface Permission {
  id: string;
  code: string;
  label: string;
  group: string | null;
}

interface PengaturanClientProps {
  roles: Role[];
  permissions: Permission[];
}

export default function PengaturanClient({ roles: initialRoles, permissions }: PengaturanClientProps) {
  const [roles, setRoles] = useState<Role[]>(initialRoles);
  const [updating, setUpdating] = useState<string | null>(null); // 'roleId|permissionId'
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  
  // WA test states
  const [testPhone, setTestPhone] = useState('');
  const [waTesting, setWaTesting] = useState(false);
  const [waFeedback, setWaFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Group permissions by group name
  const groupedPermissions = permissions.reduce<Record<string, Permission[]>>((acc, perm) => {
    const groupName = perm.group || 'Umum';
    if (!acc[groupName]) acc[groupName] = [];
    acc[groupName].push(perm);
    return acc;
  }, {});

  const handleToggle = async (roleId: string, roleName: string, permissionId: string, currentEnabled: boolean) => {
    // Prevent toggling SUPERADMIN permissions to avoid lockouts
    if (roleName === 'SUPERADMIN') return;

    const key = `${roleId}|${permissionId}`;
    setUpdating(key);
    setFeedback(null);

    const result = await toggleRolePermission(roleId, permissionId, !currentEnabled);

    if (result.success) {
      setRoles((prevRoles) =>
        prevRoles.map((role) => {
          if (role.id !== roleId) return role;
          const updatedPermissions = currentEnabled
            ? role.permissions.filter((p) => p.permissionId !== permissionId)
            : [...role.permissions, { permissionId }];
          return { ...role, permissions: updatedPermissions };
        })
      );
      setFeedback({ type: 'success', message: 'Izin role berhasil diperbarui!' });
      setTimeout(() => setFeedback(null), 3000);
    } else {
      setFeedback({ type: 'error', message: result.error || 'Gagal memperbarui izin.' });
    }
    setUpdating(null);
  };

  const handleTestWhatsApp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testPhone) return;

    setWaTesting(true);
    setWaFeedback(null);

    try {
      const res = await testWhatsAppAction(testPhone);
      if (res.success) {
        setWaFeedback({ type: 'success', message: 'WhatsApp Uji Coba Berhasil Terkirim! Silakan cek nomor tujuan.' });
      } else {
        setWaFeedback({ type: 'error', message: res.error || 'Gagal mengirim pesan uji coba.' });
      }
    } catch (err: any) {
      setWaFeedback({ type: 'error', message: err.message || 'Error occurred.' });
    } finally {
      setWaTesting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Feedback Banner */}
      {feedback && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className={`p-4 rounded-lg flex items-center gap-3 border shadow-sm ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-red-50 text-red-800 border-red-200'
          }`}
        >
          <Info className="h-5 w-5 flex-shrink-0" />
          <p className="text-sm font-medium">{feedback.message}</p>
        </motion.div>
      )}

      {/* Info Card */}
      <div className="glass p-6 rounded-xl flex flex-col md:flex-row gap-4 items-start md:items-center">
        <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
          <Shield className="h-6 w-6" />
        </div>
        <div className="space-y-1">
          <h3 className="font-semibold text-foreground text-base">Matriks Hak Akses (RBAC)</h3>
          <p className="text-sm text-muted-foreground">
            Sesuaikan izin akses masing-masing role secara real-time. Perubahan langsung disimpan dan berdampak pada warga yang memiliki role tersebut.
          </p>
        </div>
      </div>

      {/* Role list header overview */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {roles.map((role) => (
          <div key={role.id} className="glass-card p-4 rounded-xl space-y-1 border border-border/40">
            <span className="text-[10px] uppercase font-bold tracking-wider text-primary">
              Role
            </span>
            <h4 className="font-bold text-foreground text-sm truncate">{role.label}</h4>
            <p className="text-xs text-muted-foreground">
              {role.name === 'SUPERADMIN' 
                ? 'Semua izin aktif' 
                : `${role.permissions.length} izin aktif`}
            </p>
          </div>
        ))}
      </div>

      {/* Matrix Table */}
      <div className="bg-white border border-border rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-border">
                <th className="px-6 py-4 text-left font-semibold text-foreground min-w-[280px]">
                  Modul & Izin Akses
                </th>
                {roles.map((role) => (
                  <th
                    key={role.id}
                    className="px-4 py-4 text-center font-semibold text-foreground text-xs uppercase tracking-wider min-w-[120px]"
                  >
                    <div className="flex flex-col items-center">
                      <span>{role.label}</span>
                      <span className="text-[9px] font-normal text-muted-foreground mt-0.5">
                        ({role.name})
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {Object.entries(groupedPermissions).map(([groupName, groupPerms]) => (
                <Fragment key={groupName}>
                  {/* Group Header Row */}
                  <tr className="bg-slate-100/60 font-semibold text-xs text-primary uppercase tracking-wider">
                    <td colSpan={roles.length + 1} className="px-6 py-3 border-b border-border/80">
                      Modul {groupName}
                    </td>
                  </tr>
                  
                  {/* Permission Rows */}
                  {groupPerms.map((perm) => (
                    <tr key={perm.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 space-y-1">
                        <div className="font-medium text-foreground text-sm">
                          {perm.label}
                        </div>
                        <div className="inline-block text-[10px] font-mono text-muted-foreground bg-slate-100 px-1.5 py-0.5 rounded">
                          {perm.code}
                        </div>
                      </td>
                      {roles.map((role) => {
                        const isSuper = role.name === 'SUPERADMIN';
                        const isChecked = isSuper || role.permissions.some((p) => p.permissionId === perm.id);
                        const isUpdating = updating === `${role.id}|${perm.id}`;

                        return (
                          <td key={role.id} className="px-4 py-4 text-center">
                            <div className="flex justify-center items-center">
                              {isUpdating ? (
                                <Loader2 className="h-5 w-5 text-primary animate-spin" />
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleToggle(role.id, role.name, perm.id, isChecked)}
                                  disabled={isSuper}
                                  className={`relative flex items-center justify-center h-6 w-6 rounded border transition-all duration-150 ${
                                    isSuper
                                      ? 'bg-blue-50 border-blue-200 text-blue-600 cursor-not-allowed'
                                      : isChecked
                                      ? 'bg-primary border-primary text-white hover:bg-blue-700'
                                      : 'border-slate-300 hover:border-slate-400 bg-white'
                                  }`}
                                  title={
                                    isSuper
                                      ? 'Hak akses SuperAdmin tidak dapat diubah'
                                      : `Klik untuk ${isChecked ? 'mencabut' : 'memberikan'} izin`
                                  }
                                >
                                  {isChecked && <Check className="h-4 w-4 stroke-[3]" />}
                                </button>
                              )}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* WhatsApp Testing and Warning */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Warning Box */}
        <div className="p-5 bg-amber-50 text-amber-800 border border-amber-200 rounded-2xl flex gap-3 h-fit">
          <AlertTriangle className="h-5 w-5 flex-shrink-0 text-amber-600 mt-0.5" />
          <div className="text-xs space-y-1.5">
            <p className="font-bold text-sm">Perhatian Keamanan RBAC</p>
            <p className="leading-relaxed">
              Perubahan matriks hak akses akan langsung mempengaruhi keamanan sistem asrama. Harap berhati-hati sebelum mencabut izin krusial dari peran manajerial (Ketua, Sekretaris, Bendahara) agar sistem tidak terkunci atau kehilangan kapabilitas administrasi.
            </p>
          </div>
        </div>

        {/* WA Test Box */}
        <div className="bg-white border border-border p-5 rounded-2xl shadow-sm space-y-4">
          <h3 className="font-bold text-foreground text-sm flex items-center gap-2 border-b border-border pb-2.5">
            <MessageSquare className="h-4 w-4 text-primary" />
            Uji Coba Koneksi WhatsApp Bot
          </h3>
          
          <p className="text-xs text-muted-foreground leading-relaxed">
            Kirim pesan uji coba ke nomor WhatsApp manapun untuk memastikan WhatsApp Service (Baileys) di server aktif dan dapat mengirim pesan dengan lancar.
          </p>

          {waFeedback && (
            <div className={`p-3 text-xs border rounded-lg flex items-center gap-2 ${
              waFeedback.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-100' : 'bg-red-50 text-red-800 border-red-100'
            }`}>
              <Info className="h-4 w-4 flex-shrink-0" />
              <span>{waFeedback.message}</span>
            </div>
          )}

          <form onSubmit={handleTestWhatsApp} className="flex gap-2">
            <input
              type="text"
              required
              value={testPhone}
              onChange={(e) => setTestPhone(e.target.value)}
              placeholder="Nomor WA (contoh: 6281234567890)"
              className="input text-xs flex-1 !py-2"
            />
            <button
              type="submit"
              disabled={waTesting}
              className="btn btn-primary text-xs flex items-center gap-1.5 !px-4"
            >
              {waTesting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Send className="h-3.5 w-3.5" />
              )}
              Test Kirim
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
