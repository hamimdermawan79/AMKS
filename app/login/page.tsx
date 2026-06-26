'use client';

import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';

// Abstract Orbs for the left panel to give a unique branding feel (Soft White-Blue)
function LeftPanelBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden bg-gradient-to-br from-white via-blue-50/80 to-blue-100/40">
      <div className="absolute -left-32 top-10 h-[600px] w-[600px] rounded-[40%_60%_70%_30%] bg-blue-300/20 mix-blend-multiply blur-[120px] animate-blob" />
      <div className="absolute -right-20 top-1/2 h-[500px] w-[500px] rounded-[60%_40%_30%_70%] bg-sky-200/40 mix-blend-multiply blur-[100px] animate-blob animation-delay-2000" />
      <div className="absolute left-1/4 bottom-0 h-[400px] w-[400px] rounded-[50%_50%_60%_40%] bg-indigo-200/30 mix-blend-multiply blur-[90px] animate-blob animation-delay-4000" />
      
      {/* Noise overlay for premium texture */}
      <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.7%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }} />

      {/* Abstract Curved Divider SVG positioned on the right edge */}
      <svg className="absolute right-0 top-0 h-full w-16 md:w-20 lg:w-24 translate-x-[1px] text-white z-10" fill="currentColor" viewBox="0 0 100 100" preserveAspectRatio="none">
        <path d="M100 0H0C50 30 50 70 0 100H100V0Z" />
      </svg>
    </div>
  );
}

// Background component that mimics the hero page but heavily blurred
function HeroBackgroundBlurred() {
  return (
    <div className="fixed inset-0 overflow-hidden bg-white z-0 pointer-events-none">
      {/* Soft Blue Base Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-100/80 via-white to-slate-50/50" />
      
      {/* Abstract Blurry Blobs */}
      <div className="absolute -left-[10%] top-0 h-[700px] w-[700px] rounded-[40%_60%_70%_30%] bg-blue-500/30 mix-blend-multiply blur-[120px]" />
      <div className="absolute left-[20%] -top-[20%] h-[600px] w-[600px] rounded-[60%_40%_30%_70%] bg-sky-300/40 mix-blend-multiply blur-[120px]" />
      <div className="absolute -right-[10%] top-[20%] h-[600px] w-[600px] rounded-[50%_50%_60%_40%] bg-indigo-300/30 mix-blend-multiply blur-[100px]" />
      
      {/* Gaussian Blur Overlay */}
      <div className="absolute inset-0 backdrop-blur-3xl bg-white/40" />
    </div>
  );
}

const staggerContainer = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
  },
};

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};

export default function LoginPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => setMounted(true), []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await signIn('credentials', {
        username,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('Username atau password salah');
        setLoading(false);
      } else {
        router.push('/user');
        router.refresh();
      }
    } catch (err) {
      setError('Terjadi kesalahan. Silakan coba lagi.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 lg:p-8 relative" style={{ perspective: '1200px' }}>
      {mounted && <HeroBackgroundBlurred />}
      
      {/* The Floating Modal */}
      <motion.div 
        initial={{ opacity: 0, y: 80, scale: 0.92, rotateX: 15, filter: 'blur(10px)' }}
        animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0, filter: 'blur(0px)' }}
        transition={{ 
          type: "spring",
          stiffness: 80,
          damping: 15,
          mass: 1.2,
          opacity: { duration: 0.4 },
          filter: { duration: 0.5 }
        }}
        style={{ transformOrigin: "center center" }}
        className="relative z-10 flex w-full max-w-[1200px] flex-col lg:flex-row bg-white rounded-[2rem] lg:rounded-[2.5rem] overflow-hidden shadow-[0_30px_100px_-15px_rgba(37,99,235,0.2)] min-h-[600px] lg:min-h-[700px] border border-white/50"
      >
        {/* Left Panel - Branding */}
        <div className="relative hidden lg:flex flex-1 items-center justify-center p-12 xl:p-20 overflow-hidden">
          {mounted && <LeftPanelBackground />}
          
          <div className="relative z-20 w-full max-w-md xl:max-w-lg mx-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
              className="mb-10 inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-white/60 backdrop-blur-xl border border-blue-200/50 shadow-xl shadow-blue-500/10"
            >
              <span className="text-4xl font-extrabold tracking-tighter text-primary">A</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="mb-6 text-4xl xl:text-5xl font-bold leading-tight tracking-tight text-slate-800"
            >
              Sistem Informasi<br />
              <span className="text-primary">Manajemen Asrama</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="text-base xl:text-lg text-slate-600 max-w-md leading-relaxed"
            >
              Platform digital terintegrasi untuk mendukung kegiatan, kolaborasi, dan pengelolaan warga asrama secara modern.
            </motion.p>
          </div>
        </div>

        {/* Right Panel - Login Form */}
        <div className="flex w-full lg:w-[450px] xl:w-[500px] flex-col justify-center px-6 py-10 sm:px-10 sm:py-12 lg:px-12 xl:px-16 relative bg-white z-20">
          {/* Subtle background element for mobile */}
          <div className="absolute top-0 right-0 -mr-32 -mt-32 h-96 w-96 rounded-full bg-blue-50 blur-[100px] lg:hidden" />
          
          <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="relative z-10 w-full max-w-md mx-auto"
          >
            <motion.div variants={fadeInUp} className="mb-10 lg:hidden text-center">
              <Link href="/" className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-3xl font-bold text-white shadow-xl shadow-blue-500/20">
                A
              </Link>
            </motion.div>

            <motion.div variants={fadeInUp}>
              <h2 className="text-3xl font-bold tracking-tight text-slate-900 mb-2">Selamat Datang</h2>
              <p className="text-slate-500 mb-10">Silakan masuk ke akun Anda untuk melanjutkan.</p>
            </motion.div>

            <motion.form variants={fadeInUp} onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="rounded-xl bg-red-50 p-4 text-sm font-medium text-red-800 border border-red-100"
                >
                  {error}
                </motion.div>
              )}

              <div className="space-y-4">
                <div>
                  <label htmlFor="username" className="mb-2 block text-sm font-semibold text-slate-700">
                    Username
                  </label>
                  <div className="relative">
                    <input
                      id="username"
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-slate-900 transition-all focus:border-primary focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary/10"
                      placeholder="Masukkan username Anda"
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="mb-2 block text-sm font-semibold text-slate-700">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-slate-900 transition-all focus:border-primary focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary/10"
                      placeholder="••••••••"
                      required
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="group relative w-full overflow-hidden rounded-xl bg-primary px-4 py-4 text-sm font-bold text-white shadow-lg shadow-blue-500/30 transition-all hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-500/40 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Memproses...
                  </span>
                ) : (
                  <span className="relative z-10 flex items-center justify-center">
                    Masuk Sekarang
                  </span>
                )}
              </button>
            </motion.form>

            <motion.div variants={fadeInUp} className="mt-10 text-center">
              <p className="text-sm font-medium text-slate-600">
                Gabung Bersama Kami Demi Mewujudkan Impian Anda di Masa Depan
              </p>
            </motion.div>

            <motion.div variants={fadeInUp} className="mt-8 text-center">
              <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-primary transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Kembali ke Beranda
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
