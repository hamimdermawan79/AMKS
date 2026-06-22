'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Megaphone, 
  Calendar, 
  DollarSign, 
  ShieldAlert, 
  Clock, 
  MailOpen, 
  Check, 
  Trash2,
  Filter,
  CheckCheck,
  Mail
} from 'lucide-react';
import { markNotificationAsRead, markAllNotificationsAsRead } from '@/lib/notification-actions';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

interface NotificationsListClientProps {
  initialNotifications: Notification[];
}

export default function NotificationsListClient({ initialNotifications }: NotificationsListClientProps) {
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'UNREAD' | 'READ'>('ALL');

  const handleMarkRead = async (id: string) => {
    try {
      const res = await markNotificationAsRead(id);
      if (res.success) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const res = await markAllNotificationsAsRead();
      if (res.success) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Filtering
  const filteredNotifications = notifications.filter((n) => {
    const matchesType = typeFilter === 'ALL' || n.type === typeFilter;
    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'UNREAD' && !n.isRead) ||
      (statusFilter === 'READ' && n.isRead);
    return matchesType && matchesStatus;
  });

  const getNotifIcon = (type: string) => {
    switch (type) {
      case 'PIKET_REMINDER':
        return <Calendar className="h-5 w-5 text-emerald-600" />;
      case 'TAGIHAN_REMINDER':
        return <DollarSign className="h-5 w-5 text-amber-600" />;
      case 'PENGUMUMAN':
        return <Megaphone className="h-5 w-5 text-purple-600" />;
      default:
        return <ShieldAlert className="h-5 w-5 text-blue-600" />;
    }
  };

  const getNotifColor = (type: string) => {
    switch (type) {
      case 'PIKET_REMINDER':
        return 'bg-emerald-50 border-emerald-100';
      case 'TAGIHAN_REMINDER':
        return 'bg-amber-50 border-amber-100';
      case 'PENGUMUMAN':
        return 'bg-purple-50 border-purple-100';
      default:
        return 'bg-blue-50 border-blue-100';
    }
  };

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="space-y-6">
      {/* Top Banner and Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-border p-6 rounded-2xl shadow-sm">
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            Kotak Masuk Notifikasi
            {unreadCount > 0 && (
              <span className="bg-destructive/10 text-destructive text-xs font-bold px-2.5 py-0.5 rounded-full">
                {unreadCount} Belum Dibaca
              </span>
            )}
          </h2>
          <p className="text-xs text-muted-foreground">
            Daftar seluruh notifikasi pengingat piket, tagihan, dan pengumuman divisi Anda.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="btn btn-secondary text-xs flex items-center gap-1.5 font-bold"
          >
            <CheckCheck className="h-4 w-4 text-emerald-600" />
            Tandai Semua Telah Dibaca
          </button>
        )}
      </div>

      {/* Filter and Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Left Side Filters */}
        <div className="lg:col-span-1 bg-white border border-border p-5 rounded-2xl space-y-5 shadow-sm">
          <h3 className="font-bold text-foreground text-sm flex items-center gap-2 border-b border-border pb-2.5">
            <Filter className="h-4 w-4 text-primary" />
            Filter Notifikasi
          </h3>

          {/* Type Filter */}
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Kategori</span>
            <div className="flex flex-col gap-1.5">
              {[
                { val: 'ALL', label: 'Semua Kategori' },
                { val: 'PIKET_REMINDER', label: '🧹 Pengingat Piket' },
                { val: 'TAGIHAN_REMINDER', label: '💵 Tagihan & Denda' },
                { val: 'PENGUMUMAN', label: '📢 Pengumuman Divisi' },
                { val: 'SYSTEM', label: '💻 Notifikasi Sistem' },
              ].map((t) => (
                <button
                  key={t.val}
                  onClick={() => setTypeFilter(t.val)}
                  className={`px-3 py-2 text-xs font-semibold rounded-lg text-left transition-all ${
                    typeFilter === t.val
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-slate-50'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Status Filter */}
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Status</span>
            <div className="flex flex-col gap-1.5">
              {[
                { val: 'ALL', label: 'Semua Status' },
                { val: 'UNREAD', label: 'Belum Dibaca' },
                { val: 'READ', label: 'Sudah Dibaca' },
              ].map((s) => (
                <button
                  key={s.val}
                  onClick={() => setStatusFilter(s.val as any)}
                  className={`px-3 py-2 text-xs font-semibold rounded-lg text-left transition-all ${
                    statusFilter === s.val
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-slate-50'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side List Feed */}
        <div className="lg:col-span-3 space-y-4">
          <AnimatePresence mode="popLayout">
            {filteredNotifications.length === 0 ? (
              <div className="glass p-12 text-center rounded-2xl border border-border/40 flex flex-col items-center justify-center gap-4">
                <MailOpen className="h-12 w-12 text-muted-foreground/30" />
                <div className="space-y-1">
                  <p className="text-muted-foreground italic font-medium">Kotak masuk kosong.</p>
                  <p className="text-xs text-muted-foreground/80">Tidak ditemukan notifikasi untuk filter saat ini.</p>
                </div>
              </div>
            ) : (
              filteredNotifications.map((notif) => (
                <motion.div
                  key={notif.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={`p-5 rounded-2xl border transition-all flex gap-4 ${
                    !notif.isRead 
                      ? 'bg-white border-blue-200 shadow-sm ring-1 ring-blue-50' 
                      : 'bg-slate-50/50 border-border text-muted-foreground'
                  }`}
                >
                  {/* Icon Panel */}
                  <div className={`p-3 rounded-xl flex-shrink-0 h-11 w-11 flex items-center justify-center border ${getNotifColor(notif.type)}`}>
                    {getNotifIcon(notif.type)}
                  </div>

                  {/* Body Text */}
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-4">
                      <h3 className={`font-bold leading-snug break-words ${
                        !notif.isRead ? 'text-foreground text-sm' : 'text-slate-500 text-sm'
                      }`}>
                        {notif.title}
                      </h3>
                      {!notif.isRead && (
                        <button
                          onClick={() => handleMarkRead(notif.id)}
                          className="btn btn-secondary !px-2.5 !py-1 text-[10px] flex items-center gap-1 font-bold"
                          title="Tandai sudah dibaca"
                        >
                          <Check className="h-3 w-3 stroke-[2.5]" />
                          Tandai Dibaca
                        </button>
                      )}
                    </div>
                    <p className={`text-xs leading-relaxed whitespace-pre-line ${
                      !notif.isRead ? 'text-muted-foreground' : 'text-slate-400'
                    }`}>
                      {notif.message}
                    </p>
                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground pt-1">
                      <Clock className="h-3.5 w-3.5" />
                      <span>{formatDate(notif.createdAt)}</span>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
