"use client";

import { useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  BookOpen, Calendar, Users, FileText, CheckCircle, Clock, 
  Trash2, Plus, Edit, CalendarClock, Target, UserCheck, X, Save
} from "lucide-react";
import { 
  createInternalMeeting, updateMeetingStatus, deleteMeeting, 
  generateRTSchedule, updateRTMeeting, setRTDelegates,
  saveMeetingNote, saveActionItem, deleteActionItem, saveMeetingAttendances
} from "./actions";
import { MeetingStatus, Division, AttendanceStatus } from "@prisma/client";

type Warga = { id: string; fullName: string; username: string };

type InternalMeetingType = any;
type ExternalMeetingType = any;

type Props = {
  wargaList: Warga[];
  internalMeetings: InternalMeetingType[];
  externalMeetings: ExternalMeetingType[];
  currentUserId: string;
  canManage?: boolean;
};

const DIVISIONS: Division[] = ["KEBERSIHAN", "KESENIAN", "KEOLAHRAGAAN", "ROHANI", "KEAMANAN", "SEKRETARIS"];

const DIVISION_LABELS: Record<string, string> = {
  KEBERSIHAN: "Kebersihan",
  KESENIAN: "Kesenian",
  KEOLAHRAGAAN: "Keolahragaan",
  ROHANI: "Kerohanian",
  KEAMANAN: "Keamanan",
  SEKRETARIS: "Sekretaris",
};

const BULAN = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
const HARI = ["Minggu","Senin","Selasa","Rabu","Kamis","Jumat","Sabtu"];

function formatTanggal(dateInput: string | Date, opts?: { withDay?: boolean; withTime?: boolean }) {
  const d = new Date(dateInput);
  const day = d.getDate();
  const month = BULAN[d.getMonth()];
  const year = d.getFullYear();
  const hari = HARI[d.getDay()];
  let result = opts?.withDay ? `${hari}, ${day} ${month} ${year}` : `${day} ${month} ${year}`;
  if (opts?.withTime) {
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    result += ` ${hh}:${mm}`;
  }
  return result;
}

export default function KesekretariatanClient({ wargaList, internalMeetings, externalMeetings, currentUserId, canManage = false }: Props) {
  const [activeTab, setActiveTab] = useState<"internal" | "rt_schedule" | "rt_notes">("internal");
  const [isPending, startTransition] = useTransition();

  // === INTERNAL MEETING CREATION ===
  const [showAddInternal, setShowAddInternal] = useState(false);
  const [internalTitle, setInternalTitle] = useState("");
  const [internalDate, setInternalDate] = useState("");
  const [internalLeader, setInternalLeader] = useState("");
  const [internalNoteTaker, setInternalNoteTaker] = useState("");

  // === SELECTED MEETING (detail view) ===
  const [selectedMeeting, setSelectedMeeting] = useState<InternalMeetingType | null>(null);

  // === NOTULENSI INPUT MODAL ===
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteDivision, setNoteDivision] = useState<Division>(DIVISIONS[0]);
  const [noteContent, setNoteContent] = useState("");
  const [noteEvaluation, setNoteEvaluation] = useState("");
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);

  // === ACTION ITEM MODAL ===
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionTitle, setActionTitle] = useState("");
  const [actionPicId, setActionPicId] = useState("");
  const [actionDeadline, setActionDeadline] = useState("");

  // === RT EDIT ===
  const [editingRT, setEditingRT] = useState<string | null>(null);
  const [editRTDate, setEditRTDate] = useState("");
  const [editRTDelegates, setEditRTDelegates] = useState<string[]>([]);

  // === RT NOTULENSI MODAL ===
  const [showRTNoteModal, setShowRTNoteModal] = useState(false);
  const [rtNoteMeetingId, setRtNoteMeetingId] = useState("");
  const [rtNoteContent, setRtNoteContent] = useState("");

  // ============================================================
  // HANDLERS
  // ============================================================

  const handleCreateInternal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!internalTitle || !internalDate) return;
    
    startTransition(async () => {
      try {
        await createInternalMeeting({
          title: internalTitle,
          scheduledAt: internalDate,
          leaderId: internalLeader || undefined,
          noteTakerId: internalNoteTaker || undefined,
        });
        setShowAddInternal(false);
        setInternalTitle("");
        setInternalDate("");
        setInternalLeader("");
        setInternalNoteTaker("");
      } catch (err: any) {
        alert(err.message);
      }
    });
  };

  const handleDeleteMeeting = (id: string) => {
    if (!confirm("Hapus rapat ini beserta semua notulensi dan action item-nya?")) return;
    startTransition(async () => {
      await deleteMeeting(id);
      setSelectedMeeting(null);
    });
  };

  const handleMarkSelesai = (id: string) => {
    startTransition(async () => {
      await updateMeetingStatus(id, "SELESAI");
    });
  };

  // --- Notulensi ---
  const openNoteModal = (division: Division, existingNote?: any) => {
    setNoteDivision(division);
    if (existingNote) {
      setEditingNoteId(existingNote.id);
      setNoteContent(existingNote.content);
      setNoteEvaluation(existingNote.evaluation || "");
    } else {
      setEditingNoteId(null);
      setNoteContent("");
      setNoteEvaluation("");
    }
    setShowNoteModal(true);
  };

  const handleSaveNote = () => {
    if (!noteContent.trim()) return alert("Isi laporan tidak boleh kosong.");
    if (!selectedMeeting) return;

    startTransition(async () => {
      try {
        await saveMeetingNote({
          id: editingNoteId || undefined,
          meetingId: selectedMeeting.id,
          division: noteDivision,
          content: noteContent,
          evaluation: noteEvaluation || undefined,
        });
        setShowNoteModal(false);
      } catch (err: any) { alert(err.message); }
    });
  };

  // --- Action Items ---
  const handleSaveActionItem = () => {
    if (!actionTitle.trim()) return alert("Judul action item tidak boleh kosong.");
    if (!selectedMeeting) return;

    startTransition(async () => {
      try {
        await saveActionItem({
          meetingId: selectedMeeting.id,
          title: actionTitle,
          picId: actionPicId || undefined,
          deadline: actionDeadline || undefined,
        });
        setShowActionModal(false);
        setActionTitle("");
        setActionPicId("");
        setActionDeadline("");
      } catch (err: any) { alert(err.message); }
    });
  };

  const handleToggleActionItem = (item: any) => {
    startTransition(async () => {
      await saveActionItem({
        id: item.id,
        meetingId: item.meetingId,
        title: item.title,
        picId: item.picId || undefined,
        deadline: item.deadline ? new Date(item.deadline).toISOString() : undefined,
        isCompleted: !item.isCompleted,
      });
    });
  };

  const handleDeleteActionItem = (id: string) => {
    if (!confirm("Hapus action item ini?")) return;
    startTransition(async () => { await deleteActionItem(id); });
  };

  // --- Generate RT ---
  const handleGenerateRTSchedule = () => {
    const year = new Date().getFullYear();
    if (!confirm(`Generate jadwal RT 12 untuk tahun ${year}? Setiap tanggal 12 per bulan.`)) return;
    startTransition(async () => { await generateRTSchedule(year); });
  };

  // --- RT Edit ---
  const handleSaveRTEdit = (id: string) => {
    startTransition(async () => {
      try {
        if (editRTDate) await updateRTMeeting(id, { scheduledAt: editRTDate });
        await setRTDelegates(id, editRTDelegates);
        setEditingRT(null);
      } catch (e: any) { alert(e.message); }
    });
  };

  const toggleDelegate = (userId: string) => {
    setEditRTDelegates(prev => {
      if (prev.includes(userId)) return prev.filter(id => id !== userId);
      if (prev.length >= 2) return prev; // max 2
      return [...prev, userId];
    });
  };

  // --- RT Notes ---
  const handleSaveRTNote = () => {
    if (!rtNoteContent.trim()) return alert("Isi notulensi tidak boleh kosong.");
    startTransition(async () => {
      try {
        await saveMeetingNote({ meetingId: rtNoteMeetingId, content: rtNoteContent });
        setShowRTNoteModal(false);
        setRtNoteContent("");
      } catch (err: any) { alert(err.message); }
    });
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <BookOpen className="h-8 w-8 text-indigo-500" />
          Kesekretariatan & Notulensi
        </h1>
        <p className="text-sm text-muted-foreground">
          Kelola rapat internal asrama, jadwal delegasi rapat RT, dan notulensi evaluasi divisi.
        </p>
      </div>

      {/* TABS */}
      <div className="flex border-b border-border overflow-x-auto">
        {([
          { key: "internal" as const, label: "Rapat Asrama", icon: Users },
          { key: "rt_schedule" as const, label: "Jadwal Rapat RT", icon: CalendarClock },
          { key: "rt_notes" as const, label: "Notulensi RT", icon: FileText },
        ]).map(tab => (
          <button
            key={tab.key}
            onClick={() => { setActiveTab(tab.key); setSelectedMeeting(null); }}
            className={`px-4 sm:px-5 py-3 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === tab.key ? "border-indigo-500 text-indigo-600" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <span className="flex items-center gap-2">
              <tab.icon className="h-4 w-4" /> {tab.label}
            </span>
          </button>
        ))}
      </div>

      {/* ================================================================ */}
      {/* TAB 1: RAPAT ASRAMA (INTERNAL) - LIST */}
      {/* ================================================================ */}
      {activeTab === "internal" && !selectedMeeting && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Riwayat Rapat Asrama</h2>
            {canManage && (
              <button
                onClick={() => setShowAddInternal(true)}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors shadow-sm"
              >
                <Plus className="h-4 w-4" /> Buat Rapat Baru
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {internalMeetings.map((m: any) => (
              <motion.div 
                key={m.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="border border-border bg-card p-5 rounded-2xl cursor-pointer hover:border-indigo-300 transition-colors"
                onClick={() => setSelectedMeeting(m)}
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-foreground">{m.title}</h3>
                  <span className={`px-2 py-1 text-[10px] font-bold rounded-md ${
                    m.status === 'SELESAI' ? 'bg-emerald-100 text-emerald-700' : 
                    m.status === 'DIBATALKAN' ? 'bg-red-100 text-red-700' :
                    'bg-amber-100 text-amber-700'
                  }`}>
                    {m.status}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1.5 mb-3">
                  <Calendar className="h-3.5 w-3.5" />
                  {formatTanggal(m.scheduledAt, { withDay: true })}
                </p>
                <div className="flex gap-4 text-xs text-muted-foreground">
                  <div><span className="font-semibold block">Pemimpin</span> {m.leader?.fullName || "-"}</div>
                  <div><span className="font-semibold block">Notulis</span> {m.noteTaker?.fullName || "-"}</div>
                  <div><span className="font-semibold block">Notulensi</span> {m.notes.length} divisi</div>
                </div>
              </motion.div>
            ))}
            
            {internalMeetings.length === 0 && (
              <div className="col-span-full py-12 text-center text-muted-foreground bg-slate-50 border border-dashed rounded-2xl">
                {canManage ? 'Belum ada data rapat. Klik "Buat Rapat Baru" untuk memulai.' : 'Belum ada agenda rapat asrama.'}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* TAB 1: DETAIL RAPAT INTERNAL */}
      {/* ================================================================ */}
      {activeTab === "internal" && selectedMeeting && (
        <div className="space-y-6">
          <button 
            onClick={() => setSelectedMeeting(null)}
            className="text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            &larr; Kembali ke Daftar Rapat
          </button>
          
          {/* Header Card */}
          <div className="bg-white border border-border p-6 rounded-2xl shadow-sm">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-1">{selectedMeeting.title}</h2>
                <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" /> 
                  {formatTanggal(selectedMeeting.scheduledAt, { withDay: true, withTime: true })}
                </p>
                <div className="flex gap-4 text-xs text-muted-foreground mt-3">
                  <div><span className="font-semibold">Pemimpin:</span> {selectedMeeting.leader?.fullName || "-"}</div>
                  <div><span className="font-semibold">Notulis:</span> {selectedMeeting.noteTaker?.fullName || "-"}</div>
                </div>
              </div>
              {canManage && (
                <div className="flex gap-2 flex-wrap">
                  {selectedMeeting.status === "TERJADWAL" && (
                    <button 
                      onClick={() => handleMarkSelesai(selectedMeeting.id)}
                      disabled={isPending}
                      className="text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5"
                    >
                      <CheckCircle className="h-4 w-4"/> Tandai Selesai
                    </button>
                  )}
                  <button 
                    onClick={() => handleDeleteMeeting(selectedMeeting.id)}
                    className="text-red-600 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5"
                  >
                    <Trash2 className="h-4 w-4"/> Hapus
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* LEFT: Notulensi Per Divisi */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white border border-border p-6 rounded-2xl shadow-sm">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-indigo-500"/> Notulensi per Divisi
                </h3>
                
                <div className="space-y-4">
                  {DIVISIONS.map(div => {
                    const note = selectedMeeting.notes.find((n: any) => n.division === div);
                    return (
                      <div key={div} className="border border-border rounded-xl p-4 bg-slate-50">
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="font-bold text-foreground">{DIVISION_LABELS[div]}</h4>
                          {canManage && (
                            <button
                              onClick={() => openNoteModal(div, note)}
                              className="text-xs px-3 py-1 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-1"
                            >
                              {note ? <><Edit className="h-3 w-3"/> Edit</> : <><Plus className="h-3 w-3"/> Tambah</>}
                            </button>
                          )}
                        </div>
                        {note ? (
                          <div className="space-y-2 text-sm">
                            <div>
                              <span className="font-semibold text-slate-700">Laporan:</span>
                              <p className="text-muted-foreground whitespace-pre-wrap mt-1">{note.content}</p>
                            </div>
                            {note.evaluation && (
                              <div>
                                <span className="font-semibold text-rose-600">Evaluasi:</span>
                                <p className="text-muted-foreground whitespace-pre-wrap mt-1">{note.evaluation}</p>
                              </div>
                            )}
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground italic">{canManage ? 'Belum ada notulensi. Klik "Tambah" untuk mencatat laporan divisi ini.' : 'Belum ada laporan dari divisi ini.'}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* RIGHT: Action Items */}
            <div className="space-y-6">
              <div className="bg-white border border-border p-6 rounded-2xl shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <Target className="h-5 w-5 text-rose-500"/> Action Items
                  </h3>
                  {canManage && (
                    <button
                      onClick={() => setShowActionModal(true)}
                      className="text-xs px-3 py-1 bg-rose-600 text-white rounded-lg hover:bg-rose-700 flex items-center gap-1"
                    >
                      <Plus className="h-3 w-3"/> Tambah
                    </button>
                  )}
                </div>
                <div className="space-y-3">
                  {selectedMeeting.actionItems.map((act: any) => (
                    <div key={act.id} className="border border-border rounded-lg p-3 text-sm flex gap-2 items-start group">
                      {canManage ? (
                        <button 
                          onClick={() => handleToggleActionItem(act)} 
                          disabled={isPending}
                          className="pt-0.5 flex-shrink-0"
                        >
                          {act.isCompleted 
                            ? <CheckCircle className="h-5 w-5 text-emerald-500"/> 
                            : <div className="h-5 w-5 rounded-full border-2 border-slate-300 hover:border-indigo-500 transition-colors"/>
                          }
                        </button>
                      ) : (
                        <div className="pt-0.5 flex-shrink-0">
                          {act.isCompleted 
                            ? <CheckCircle className="h-5 w-5 text-emerald-500"/> 
                            : <div className="h-5 w-5 rounded-full border-2 border-slate-300"/>
                          }
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className={`font-medium ${act.isCompleted ? "line-through text-muted-foreground" : ""}`}>{act.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          PIC: {act.pic?.fullName || "Belum ditentukan"}
                          {act.deadline && ` • Deadline: ${formatTanggal(act.deadline)}`}
                        </p>
                      </div>
                      {canManage && (
                        <button 
                          onClick={() => handleDeleteActionItem(act.id)}
                          className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-opacity"
                        >
                          <Trash2 className="h-4 w-4"/>
                        </button>
                      )}
                    </div>
                  ))}
                  {selectedMeeting.actionItems.length === 0 && (
                    <p className="text-xs text-muted-foreground italic text-center py-4">
                      {canManage ? 'Belum ada action item. Klik "Tambah" untuk menambahkan tindak lanjut.' : 'Belum ada action item.'}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* TAB 2: JADWAL RAPAT RT */}
      {/* ================================================================ */}
      {activeTab === "rt_schedule" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Jadwal Perwakilan Rapat RT 12</h2>
            {canManage && externalMeetings.length === 0 && (
              <button
                onClick={handleGenerateRTSchedule}
                disabled={isPending}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2"
              >
                <Plus className="h-4 w-4"/> Generate Jadwal 1 Tahun
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {externalMeetings.map((m: any) => {
              const delegates = m.attendances.filter((a: any) => a.role === "DELEGASI");
              const isEditing = editingRT === m.id;
              const isPast = new Date(m.scheduledAt) < new Date();

              return (
                <motion.div 
                  key={m.id} 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`border bg-card p-5 rounded-2xl transition-colors ${
                    isPast ? "border-slate-200 bg-slate-50/50" : "border-border"
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-bold text-foreground text-sm">{m.title}</h3>
                    {canManage && !isEditing && (
                      <button 
                        onClick={() => {
                          setEditingRT(m.id);
                          const d = new Date(m.scheduledAt);
                          const dtString = new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
                          setEditRTDate(dtString);
                          setEditRTDelegates(delegates.map((d: any) => d.userId));
                        }}
                        className="text-indigo-600 hover:bg-indigo-50 p-1.5 rounded-lg transition-colors"
                        title="Edit jadwal & delegasi"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  
                  {isEditing ? (
                    <div className="space-y-3 mt-3">
                      {/* Edit Date */}
                      <div>
                        <label className="block text-xs font-semibold text-muted-foreground mb-1">Ubah Tanggal & Waktu</label>
                        <input 
                          type="datetime-local" 
                          value={editRTDate} 
                          onChange={(e) => setEditRTDate(e.target.value)} 
                          className="w-full px-2 py-1.5 rounded-lg border border-border text-sm"
                        />
                      </div>
                      {/* Checkbox Delegates */}
                      <div>
                        <label className="block text-xs font-semibold text-muted-foreground mb-2">Pilih 2 Delegasi (centang)</label>
                        <div className="max-h-48 overflow-y-auto border border-border rounded-lg divide-y divide-border">
                          {wargaList.map(w => {
                            const isChecked = editRTDelegates.includes(w.id);
                            const isDisabled = !isChecked && editRTDelegates.length >= 2;
                            return (
                              <label 
                                key={w.id} 
                                className={`flex items-center gap-2.5 px-3 py-2 cursor-pointer text-sm transition-colors ${
                                  isChecked ? "bg-indigo-50 text-indigo-700 font-medium" : 
                                  isDisabled ? "text-slate-300 cursor-not-allowed" : "hover:bg-slate-50"
                                }`}
                              >
                                <input 
                                  type="checkbox" 
                                  checked={isChecked}
                                  disabled={isDisabled}
                                  onChange={() => toggleDelegate(w.id)}
                                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                                />
                                {w.fullName}
                              </label>
                            );
                          })}
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-1">Maksimal 2 orang delegasi per rapat.</p>
                      </div>
                      <div className="flex gap-2 justify-end pt-1">
                        <button onClick={() => setEditingRT(null)} className="text-xs px-3 py-1.5 text-muted-foreground hover:bg-slate-100 rounded-lg font-medium">Batal</button>
                        <button onClick={() => handleSaveRTEdit(m.id)} disabled={isPending} className="text-xs px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium flex items-center gap-1">
                          <Save className="h-3 w-3"/> Simpan
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="text-xs text-muted-foreground mb-3 flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" /> 
                        {formatTanggal(m.scheduledAt, { withTime: true })}
                      </p>
                      <div className="bg-slate-50 border border-border rounded-xl p-3">
                        <span className="text-xs font-semibold text-muted-foreground block mb-2">Delegasi Perwakilan:</span>
                        {delegates.length > 0 ? (
                          <ul className="space-y-1">
                            {delegates.map((d: any) => (
                              <li key={d.userId} className="text-sm font-medium flex items-center gap-1.5">
                                <UserCheck className="h-3.5 w-3.5 text-indigo-500"/> {d.user.fullName}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <span className="text-xs text-rose-500 font-medium">Belum ada delegasi</span>
                        )}
                      </div>
                    </>
                  )}
                </motion.div>
              );
            })}
          </div>

          {externalMeetings.length === 0 && (
            <div className="py-12 text-center text-muted-foreground bg-slate-50 border border-dashed rounded-2xl">
              {canManage ? 'Belum ada jadwal rapat RT. Klik "Generate Jadwal 1 Tahun" untuk membuat jadwal otomatis.' : 'Belum ada jadwal perwakilan rapat RT.'}
            </div>
          )}
        </div>
      )}
      
      {/* ================================================================ */}
      {/* TAB 3: NOTULENSI RAPAT RT */}
      {/* ================================================================ */}
      {activeTab === "rt_notes" && (
        <div className="space-y-6">
          <h2 className="text-lg font-semibold">Notulensi Rapat RT 12</h2>
          
          <div className="grid grid-cols-1 gap-4">
            {externalMeetings.map((m: any) => {
              const note = m.notes[0];
              const delegates = m.attendances.filter((a: any) => a.role === "DELEGASI");
              
              return (
                <div key={m.id} className="border border-border bg-card p-5 rounded-2xl">
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-3 mb-4">
                    <div>
                      <h3 className="font-bold text-foreground mb-1">{m.title}</h3>
                      <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" /> 
                        {formatTanggal(m.scheduledAt)}
                      </p>
                      {delegates.length > 0 && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Delegasi: {delegates.map((d: any) => d.user.fullName).join(", ")}
                        </p>
                      )}
                    </div>
                    {canManage && (
                      <button
                        onClick={() => {
                          setRtNoteMeetingId(m.id);
                          setRtNoteContent(note?.content || "");
                          setShowRTNoteModal(true);
                        }}
                        className="text-xs px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-1 font-medium"
                      >
                        {note ? <><Edit className="h-3 w-3"/> Edit Notulensi</> : <><Plus className="h-3 w-3"/> Catat Notulensi</>}
                      </button>
                    )}
                  </div>
                  
                  {note ? (
                    <div className="bg-slate-50 border border-border rounded-xl p-4">
                      <h4 className="text-sm font-bold text-foreground mb-2 flex items-center gap-2">
                        <FileText className="h-4 w-4 text-indigo-500" /> Hasil Rapat
                      </h4>
                      <div className="text-sm text-muted-foreground whitespace-pre-wrap">{note.content}</div>
                    </div>
                  ) : (
                    <div className="bg-slate-50 border border-dashed border-border rounded-xl p-4 text-center">
                      <p className="text-sm text-muted-foreground italic">{canManage ? 'Belum ada notulensi. Klik "Catat Notulensi" untuk mencatat hasil rapat.' : 'Belum ada notulensi rapat ini.'}</p>
                    </div>
                  )}
                </div>
              );
            })}
            
            {externalMeetings.length === 0 && (
              <div className="py-12 text-center text-muted-foreground bg-slate-50 border border-dashed rounded-2xl">
                Belum ada data rapat RT.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* MODAL: BUAT RAPAT INTERNAL */}
      {/* ================================================================ */}
      <AnimatePresence>
        {showAddInternal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-border rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
            >
              <form onSubmit={handleCreateInternal}>
                <div className="p-5 border-b border-border bg-slate-50 flex items-center justify-between">
                  <h3 className="font-bold text-foreground">Buat Rapat Asrama</h3>
                  <button type="button" onClick={() => setShowAddInternal(false)} className="text-muted-foreground hover:text-foreground">
                    <X className="h-5 w-5"/>
                  </button>
                </div>
                <div className="p-5 space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1">Judul Rapat *</label>
                    <input type="text" required value={internalTitle} onChange={e => setInternalTitle(e.target.value)} placeholder="Contoh: Rapat Bulanan Agustus 2026" className="w-full px-3 py-2 rounded-xl border border-border focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1">Waktu Pelaksanaan *</label>
                    <input type="datetime-local" required value={internalDate} onChange={e => setInternalDate(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-border focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1">Pimpinan Rapat</label>
                    <select value={internalLeader} onChange={e => setInternalLeader(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-border focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm bg-white">
                      <option value="">-- Pilih --</option>
                      {wargaList.map(w => <option key={w.id} value={w.id}>{w.fullName}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1">Notulis</label>
                    <select value={internalNoteTaker} onChange={e => setInternalNoteTaker(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-border focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm bg-white">
                      <option value="">-- Pilih --</option>
                      {wargaList.map(w => <option key={w.id} value={w.id}>{w.fullName}</option>)}
                    </select>
                  </div>
                </div>
                <div className="p-5 border-t border-border bg-slate-50 flex justify-end gap-2">
                  <button type="button" onClick={() => setShowAddInternal(false)} className="px-4 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:bg-slate-100">Batal</button>
                  <button type="submit" disabled={isPending} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-60">
                    {isPending ? "Menyimpan..." : "Buat Rapat"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ================================================================ */}
      {/* MODAL: INPUT NOTULENSI (PER DIVISI) */}
      {/* ================================================================ */}
      <AnimatePresence>
        {showNoteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-border rounded-2xl shadow-xl w-full max-w-lg overflow-hidden"
            >
              <div className="p-5 border-b border-border bg-slate-50 flex items-center justify-between">
                <h3 className="font-bold text-foreground">
                  {editingNoteId ? "Edit" : "Tambah"} Notulensi — {DIVISION_LABELS[noteDivision]}
                </h3>
                <button onClick={() => setShowNoteModal(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="h-5 w-5"/>
                </button>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">Laporan / Isi Notulensi *</label>
                  <textarea 
                    rows={5}
                    value={noteContent} 
                    onChange={e => setNoteContent(e.target.value)} 
                    placeholder="Tuliskan laporan kegiatan divisi di sini..."
                    className="w-full px-3 py-2 rounded-xl border border-border focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm resize-y"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">Evaluasi (opsional)</label>
                  <textarea 
                    rows={3}
                    value={noteEvaluation} 
                    onChange={e => setNoteEvaluation(e.target.value)} 
                    placeholder="Catatan evaluasi, kritik, atau saran..."
                    className="w-full px-3 py-2 rounded-xl border border-border focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm resize-y"
                  />
                </div>
              </div>
              <div className="p-5 border-t border-border bg-slate-50 flex justify-end gap-2">
                <button onClick={() => setShowNoteModal(false)} className="px-4 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:bg-slate-100">Batal</button>
                <button onClick={handleSaveNote} disabled={isPending} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-60 flex items-center gap-1.5">
                  <Save className="h-4 w-4"/> {isPending ? "Menyimpan..." : "Simpan Notulensi"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ================================================================ */}
      {/* MODAL: TAMBAH ACTION ITEM */}
      {/* ================================================================ */}
      <AnimatePresence>
        {showActionModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-border rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
            >
              <div className="p-5 border-b border-border bg-slate-50 flex items-center justify-between">
                <h3 className="font-bold text-foreground">Tambah Action Item</h3>
                <button onClick={() => setShowActionModal(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="h-5 w-5"/>
                </button>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">Judul Tugas / Tindak Lanjut *</label>
                  <input type="text" value={actionTitle} onChange={e => setActionTitle(e.target.value)} placeholder="Contoh: Perbaiki jadwal piket kebersihan" className="w-full px-3 py-2 rounded-xl border border-border focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">Penanggung Jawab (PIC)</label>
                  <select value={actionPicId} onChange={e => setActionPicId(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-border focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm bg-white">
                    <option value="">-- Pilih --</option>
                    {wargaList.map(w => <option key={w.id} value={w.id}>{w.fullName}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">Deadline (opsional)</label>
                  <input type="date" value={actionDeadline} onChange={e => setActionDeadline(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-border focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm" />
                </div>
              </div>
              <div className="p-5 border-t border-border bg-slate-50 flex justify-end gap-2">
                <button onClick={() => setShowActionModal(false)} className="px-4 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:bg-slate-100">Batal</button>
                <button onClick={handleSaveActionItem} disabled={isPending} className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-60 flex items-center gap-1.5">
                  <Plus className="h-4 w-4"/> {isPending ? "Menyimpan..." : "Tambah Action Item"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ================================================================ */}
      {/* MODAL: NOTULENSI RAPAT RT */}
      {/* ================================================================ */}
      <AnimatePresence>
        {showRTNoteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-border rounded-2xl shadow-xl w-full max-w-lg overflow-hidden"
            >
              <div className="p-5 border-b border-border bg-slate-50 flex items-center justify-between">
                <h3 className="font-bold text-foreground">Catat Notulensi Rapat RT</h3>
                <button onClick={() => setShowRTNoteModal(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="h-5 w-5"/>
                </button>
              </div>
              <div className="p-5">
                <label className="block text-xs font-semibold text-muted-foreground mb-1">Hasil / Rangkuman Rapat *</label>
                <textarea 
                  rows={6}
                  value={rtNoteContent} 
                  onChange={e => setRtNoteContent(e.target.value)} 
                  placeholder="Tuliskan hasil/rangkuman dari rapat RT..."
                  className="w-full px-3 py-2 rounded-xl border border-border focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm resize-y"
                />
              </div>
              <div className="p-5 border-t border-border bg-slate-50 flex justify-end gap-2">
                <button onClick={() => setShowRTNoteModal(false)} className="px-4 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:bg-slate-100">Batal</button>
                <button onClick={handleSaveRTNote} disabled={isPending} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-60 flex items-center gap-1.5">
                  <Save className="h-4 w-4"/> {isPending ? "Menyimpan..." : "Simpan Notulensi"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
