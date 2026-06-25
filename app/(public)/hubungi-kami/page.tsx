'use client';

import { Mail, Phone, MapPin, Send } from 'lucide-react';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';

const MapLeaflet = dynamic(() => import('@/components/MapLeaflet'), {
  ssr: false,
  loading: () => (
    <div className="h-[400px] w-full rounded-[2rem] bg-slate-100 animate-pulse flex items-center justify-center border border-slate-200">
      <span className="text-slate-400 font-medium">Memuat Peta...</span>
    </div>
  )
});

export default function HubungiKamiPage() {
  return (
    <div className="min-h-screen bg-slate-50 overflow-hidden">
      
      {/* Soft Gradient Hero */}
      <div className="relative pt-32 pb-40 bg-gradient-to-b from-blue-50 via-white to-slate-50">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] max-w-4xl bg-blue-400/10 blur-[120px] rounded-full pointer-events-none" />
        
        <div className="container relative z-10 mx-auto px-6 text-center">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl md:text-5xl font-extrabold text-slate-800 tracking-tight mb-6"
          >
            Hubungi Kami
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed"
          >
            Kami selalu terbuka untuk pertanyaan, saran, atau diskusi terkait pendaftaran dan kegiatan Asrama Mahasiswa Kabupaten Sambas.
          </motion.p>
        </div>

        {/* Curved Soft Separator (Wave) */}
        <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none z-0">
          <svg className="relative block w-full h-[80px] md:h-[120px]" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V95.8C59.71,118.08,130.83,119.5,193.89,106.64,237.45,97.74,278.43,74.5,321.39,56.44Z" fill="#ffffff"></path>
          </svg>
        </div>
      </div>

      {/* Main Content Area */}
      <section className="bg-white pb-32 -mt-1 relative z-10">
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
            
            {/* Left Column: Form */}
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="lg:col-span-5"
            >
              <div className="bg-white rounded-[2rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-8 md:p-10">
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Kirim Pesan</h2>
                <p className="text-slate-500 mb-8 text-sm">Formulir ini masih dalam tahap pengembangan (dummy).</p>

                <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2 ml-1">Nama Lengkap</label>
                    <input 
                      type="text" 
                      placeholder="Masukkan nama Anda"
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-5 py-4 text-sm text-slate-800 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-400/10 outline-none transition-all"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2 ml-1">Email</label>
                    <input 
                      type="email" 
                      placeholder="nama@email.com"
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-5 py-4 text-sm text-slate-800 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-400/10 outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2 ml-1">Pesan</label>
                    <textarea 
                      rows={5}
                      placeholder="Tuliskan pesan atau pertanyaan Anda di sini..."
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-5 py-4 text-sm text-slate-800 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-400/10 outline-none transition-all resize-none"
                    ></textarea>
                  </div>

                  <button 
                    type="button"
                    className="w-full flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-6 py-4 text-sm font-bold text-white hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-600/20 transition-all duration-300"
                  >
                    <span>Kirim Pesan</span>
                    <Send className="h-4 w-4" />
                  </button>
                </form>
              </div>
            </motion.div>

            {/* Right Column: Contact Info & Map */}
            <motion.div 
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="lg:col-span-7 flex flex-col space-y-8"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-blue-50/50 rounded-[2rem] border border-blue-100/50 p-8 flex flex-col items-start transition-transform hover:-translate-y-1 duration-300">
                  <div className="h-12 w-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mb-5">
                    <Phone className="h-5 w-5" />
                  </div>
                  <h3 className="text-slate-800 font-bold mb-1">Telepon / WhatsApp</h3>
                  <p className="text-slate-500 text-sm mb-3">Hubungi kami secara langsung.</p>
                  <p className="text-blue-700 font-semibold text-lg mt-auto">+62 812 3456 7890</p>
                </div>

                <div className="bg-indigo-50/50 rounded-[2rem] border border-indigo-100/50 p-8 flex flex-col items-start transition-transform hover:-translate-y-1 duration-300">
                  <div className="h-12 w-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-5">
                    <Mail className="h-5 w-5" />
                  </div>
                  <h3 className="text-slate-800 font-bold mb-1">Email Resmi</h3>
                  <p className="text-slate-500 text-sm mb-3">Untuk keperluan administrasi.</p>
                  <p className="text-indigo-700 font-semibold mt-auto">halo@asramasambas.id</p>
                </div>
              </div>

              {/* Map Embedded directly into the layout */}
              <div className="bg-white rounded-[2rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-4 md:p-8 flex-1 flex flex-col">
                <div className="flex items-start gap-4 mb-6 px-4 md:px-0">
                  <div className="h-12 w-12 shrink-0 rounded-2xl bg-slate-50 flex items-center justify-center border border-slate-100">
                    <MapPin className="h-5 w-5 text-slate-400" />
                  </div>
                  <div>
                    <h3 className="text-slate-800 font-bold text-lg mb-1">Lokasi Asrama</h3>
                    <p className="text-slate-500 leading-relaxed text-sm">
                      Gg. Beo No.328, Tahunan, Kec. Umbulharjo, Kota Yogyakarta, Daerah Istimewa Yogyakarta 55167
                    </p>
                  </div>
                </div>

                <div className="w-full rounded-[1.5rem] overflow-hidden border border-slate-200">
                  <MapLeaflet />
                </div>
                
                <div className="mt-6 flex justify-center">
                  <a 
                    href="https://maps.app.goo.gl/CavYAr6gwS6oHUp18" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl bg-slate-50 px-6 py-3 text-sm font-semibold text-slate-600 transition-all hover:bg-blue-50 hover:text-blue-600 hover:shadow-sm border border-slate-200"
                  >
                    Buka di Google Maps
                  </a>
                </div>
              </div>

            </motion.div>

          </div>
        </div>
      </section>
    </div>
  );
}
