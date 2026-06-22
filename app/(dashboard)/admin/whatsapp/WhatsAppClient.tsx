'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import QRCode from 'qrcode';

type BotStatus = 'connecting' | 'connected' | 'disconnected';

export default function WhatsAppBotClient() {
  const [status, setStatus] = useState<BotStatus>('disconnected');
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [sendResult, setSendResult] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSending, setIsSending] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/whatsapp/status');
      if (!res.ok) return;
      const data = await res.json();
      setStatus(data.status);

      if (data.qr) {
        const dataUrl = await QRCode.toDataURL(data.qr, {
          width: 280,
          margin: 2,
          color: { dark: '#1a1a2e', light: '#ffffff' },
        });
        setQrDataUrl(dataUrl);
      } else {
        setQrDataUrl(null);
      }
    } catch (err) {
      console.error('Failed to fetch WA status:', err);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    intervalRef.current = setInterval(fetchStatus, 4000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchStatus]);

  const handleSendTest = async () => {
    if (!phone.trim() || !message.trim()) return;
    setIsSending(true);
    setSendResult(null);
    try {
      const res = await fetch('/api/whatsapp/send-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phone.trim(), message: message.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setSendResult({ type: 'success', text: 'Pesan berhasil dikirim!' });
        setMessage('');
      } else {
        setSendResult({ type: 'error', text: data.error || 'Gagal mengirim pesan.' });
      }
    } catch {
      setSendResult({ type: 'error', text: 'Terjadi kesalahan jaringan.' });
    } finally {
      setIsSending(false);
    }
  };

  const statusConfig = {
    connected: {
      label: 'CONNECTED',
      color: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      dot: 'bg-emerald-500',
      icon: '✅',
    },
    connecting: {
      label: 'WAITING FOR SCAN',
      color: 'bg-amber-100 text-amber-700 border-amber-200',
      dot: 'bg-amber-500 animate-pulse',
      icon: '📱',
    },
    disconnected: {
      label: 'DISCONNECTED',
      color: 'bg-red-100 text-red-700 border-red-200',
      dot: 'bg-red-500',
      icon: '❌',
    },
  };

  const currentStatus = statusConfig[status];

  return (
    <div className="animate-fadeIn">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">WhatsApp Bot Manager</h1>
        <p className="text-muted-foreground mt-1">
          Kelola status koneksi WhatsApp Bot dan lakukan pengujian pengiriman pesan.
        </p>
        <div className="h-1 w-full bg-gradient-to-r from-amber-400 via-amber-500 to-amber-300 rounded-full mt-4" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Section: Status & QR */}
        <div className="lg:col-span-2 space-y-6">
          {/* Status Card */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white text-lg shadow-md">
                  📱
                </div>
                <h2 className="text-lg font-semibold text-foreground">Status Koneksi Bot</h2>
              </div>
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border ${currentStatus.color}`}>
                <span className={`w-2 h-2 rounded-full ${currentStatus.dot}`} />
                {currentStatus.label}
              </div>
            </div>

            {/* QR Code section - show when not connected and QR code is available */}
            {status !== 'connected' && qrDataUrl && (
              <div className="flex flex-col md:flex-row gap-8 items-start">
                {/* QR Code */}
                <div className="flex flex-col items-center">
                  <div className="relative p-4 bg-white rounded-2xl border-2 border-dashed border-slate-200 shadow-inner">
                    <img
                      src={qrDataUrl}
                      alt="WhatsApp QR Code"
                      className="w-[250px] h-[250px] rounded-lg"
                    />
                    {/* Pulse overlay */}
                    <div className="absolute inset-0 rounded-2xl border-2 border-amber-400/40 animate-pulse pointer-events-none" />
                  </div>
                  <p className="text-[11px] text-amber-600 font-semibold mt-3 uppercase tracking-wider">
                    Re-generates automatically
                  </p>
                </div>

                {/* Instructions */}
                <div className="flex-1 space-y-4">
                  <h3 className="text-base font-bold text-foreground">Tautkan Perangkat WhatsApp Anda</h3>
                  <ol className="space-y-3 text-sm text-muted-foreground">
                    <li className="flex gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">1</span>
                      <span>Buka aplikasi <strong className="text-foreground">WhatsApp</strong> di handphone Anda.</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">2</span>
                      <span>Ketuk menu titik tiga <strong className="text-foreground">(⋮)</strong> atau <strong className="text-foreground">Pengaturan (Gear)</strong>.</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">3</span>
                      <span>Pilih <strong className="text-foreground">Perangkat Tertaut (Linked Devices)</strong>.</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">4</span>
                      <span>Ketuk <strong className="text-foreground">Tautkan Perangkat (Link a Device)</strong>.</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">5</span>
                      <span>Arahkan kamera handphone Anda ke gambar QR Code di samping.</span>
                    </li>
                  </ol>

                  <div className="mt-4 p-3 rounded-lg bg-amber-50 border border-amber-200">
                    <p className="text-xs text-amber-800">
                      <strong>Catatan:</strong> Setelah scan berhasil, status koneksi akan otomatis ter-update menjadi{' '}
                      <span className="font-bold text-emerald-600">CONNECTED</span> dan sesi login disimpan agar tidak perlu scan ulang.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Connected state */}
            {status === 'connected' && (
              <div className="flex items-center gap-4 p-6 rounded-xl bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200">
                <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center text-3xl">
                  ✅
                </div>
                <div>
                  <h3 className="text-lg font-bold text-emerald-700">Bot Terhubung!</h3>
                  <p className="text-sm text-emerald-600">WhatsApp Bot aktif dan siap mengirim notifikasi.</p>
                </div>
              </div>
            )}

            {/* Disconnected state without QR code */}
            {status !== 'connected' && !qrDataUrl && (
              <div className="flex items-center gap-4 p-6 rounded-xl bg-gradient-to-r from-red-50 to-rose-50 border border-red-200">
                <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center text-3xl animate-pulse">
                  🔌
                </div>
                <div>
                  <h3 className="text-lg font-bold text-red-700">Menghubungkan Bot...</h3>
                  <p className="text-sm text-red-600">WhatsApp Bot sedang menyiapkan koneksi. Harap tunggu QR Code muncul...</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Section: Send Test */}
        <div className="space-y-6">
          <div className="card p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white text-lg shadow-md">
                ✈️
              </div>
              <h2 className="text-lg font-semibold text-foreground">Uji Coba Kirim Pesan</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Nomor WhatsApp Penerima
                </label>
                <input
                  type="text"
                  className="input"
                  placeholder="Contoh: 6281234567890"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
                <p className="text-[11px] text-muted-foreground mt-1">
                  Gunakan format kode negara (62...) tanpa tanda plus (+).
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Isi Pesan Tes
                </label>
                <textarea
                  className="input min-h-[100px] resize-none"
                  placeholder="Ketik isi pesan tes di sini..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
              </div>

              {sendResult && (
                <div
                  className={`p-3 rounded-lg text-sm ${
                    sendResult.type === 'success'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-red-50 text-red-700 border border-red-200'
                  }`}
                >
                  {sendResult.text}
                </div>
              )}

              <button
                onClick={handleSendTest}
                disabled={isSending || status !== 'connected' || !phone.trim() || !message.trim()}
                className="w-full btn btn-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSending ? (
                  <>
                    <span className="spinner !w-4 !h-4 !border-2 !border-white !border-t-transparent" />
                    Mengirim...
                  </>
                ) : (
                  <>
                    <span>✈️</span>
                    Kirim Pesan Tes
                  </>
                )}
              </button>

              {status !== 'connected' && (
                <p className="text-[11px] text-amber-600 text-center font-medium">
                  Kirim pesan tes hanya bisa dilakukan saat bot berstatus <span className="font-bold">CONNECTED</span>.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
