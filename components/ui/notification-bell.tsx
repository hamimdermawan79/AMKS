'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Check, MailOpen, Clock, AlertCircle } from 'lucide-react';
import { 
  getUserNotifications, 
  getUnreadCount, 
  markNotificationAsRead, 
  markAllNotificationsAsRead 
} from '@/lib/notification-actions';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: Date | string;
}

export default function NotificationBell({ userId }: { userId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch data
  const fetchData = async () => {
    try {
      const countRes = await getUnreadCount();
      setUnreadCount(countRes.count);

      const notifRes = await getUserNotifications(5);
      if (notifRes.success && notifRes.notifications) {
        setNotifications(notifRes.notifications);
      }
    } catch (error) {
      console.error('Failed to load notifications for bell:', error);
    }
  };

  useEffect(() => {
    fetchData();

    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [userId]);

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      // Re-fetch when opening
      fetchData();
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      const res = await markNotificationAsRead(id);
      if (res.success) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
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
        setUnreadCount(0);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getNotifColor = (type: string) => {
    switch (type) {
      case 'PIKET_REMINDER': return 'bg-emerald-500';
      case 'TAGIHAN_REMINDER': return 'bg-amber-500';
      case 'PENGUMUMAN': return 'bg-purple-500';
      default: return 'bg-blue-500';
    }
  };

  const getRelativeTime = (dateInput: Date | string) => {
    const date = new Date(dateInput);
    const diffMs = Date.now() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Baru saja';
    if (diffMins < 60) return `${diffMins}m lalu`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}jam lalu`;
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger Icon */}
      <button
        onClick={handleToggle}
        className="relative p-2 text-muted-foreground hover:text-foreground hover:bg-slate-100 rounded-full transition-all focus:outline-none"
        title="Notifikasi"
      >
        <Bell className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white ring-2 ring-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Card */}
      <AnimatePresence>
        {isOpen && (
          <div className="absolute right-0 mt-3 w-80 overflow-hidden rounded-xl border border-border bg-white shadow-xl z-50 origin-top-right">
            {/* Dropdown Header */}
            <div className="flex items-center justify-between border-b border-border bg-slate-50 px-4 py-3">
              <span className="font-bold text-foreground text-sm flex items-center gap-1.5">
                Notifikasi
                {unreadCount > 0 && (
                  <span className="bg-destructive/10 text-destructive text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    {unreadCount} Baru
                  </span>
                )}
              </span>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-xs text-primary hover:text-blue-700 flex items-center gap-1 font-semibold"
                >
                  <MailOpen className="h-3.5 w-3.5" />
                  Tandai dibaca
                </button>
              )}
            </div>

            {/* Notification List */}
            <div className="max-h-72 overflow-y-auto divide-y divide-border/60">
              {notifications.length === 0 ? (
                <div className="py-8 text-center text-xs text-muted-foreground italic flex flex-col items-center justify-center gap-2">
                  <MailOpen className="h-8 w-8 text-muted-foreground/30" />
                  <span>Tidak ada notifikasi baru</span>
                </div>
              ) : (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`p-4 text-xs transition-colors hover:bg-slate-50 flex gap-3 relative ${
                      !notif.isRead ? 'bg-blue-50/20' : ''
                    }`}
                  >
                    {/* Status Dot */}
                    <div className="pt-1 flex-shrink-0">
                      <div className={`h-2.5 w-2.5 rounded-full ${getNotifColor(notif.type)}`} />
                    </div>

                    {/* Content text */}
                    <div className="space-y-1 flex-1">
                      <div className="flex justify-between items-start gap-2">
                        <span className="font-bold text-foreground leading-snug break-words">
                          {notif.title}
                        </span>
                        {!notif.isRead && (
                          <button
                            onClick={() => handleMarkRead(notif.id)}
                            className="p-0.5 text-muted-foreground hover:text-primary hover:bg-slate-100 rounded"
                            title="Tandai dibaca"
                          >
                            <Check className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                      <p className="text-muted-foreground leading-relaxed line-clamp-2">
                        {notif.message}
                      </p>
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground pt-1">
                        <Clock className="h-3 w-3" />
                        <span>{getRelativeTime(notif.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Dropdown Footer */}
            <div className="border-t border-border bg-slate-50 text-center text-xs font-semibold">
              <Link
                href="/notifications"
                onClick={() => setIsOpen(false)}
                className="block py-2.5 text-primary hover:text-blue-700 hover:bg-slate-100 transition-colors"
              >
                Lihat Semua Notifikasi
              </Link>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
