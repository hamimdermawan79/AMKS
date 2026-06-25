'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

function FloatingOrbs() {
  const orbs = [
    { size: 260, x: '10%', y: '10%', color: 'bg-blue-200/20', dur: 22, delay: 0 },
    { size: 180, x: '75%', y: '15%', color: 'bg-indigo-200/18', dur: 26, delay: 2 },
    { size: 140, x: '50%', y: '60%', color: 'bg-sky-200/18', dur: 20, delay: 1 },
  ];

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {orbs.map((o, i) => (
        <motion.div
          key={i}
          className={`absolute rounded-full blur-3xl ${o.color}`}
          style={{ width: o.size, height: o.size, left: o.x, top: o.y }}
          animate={{ x: [0, 18, -12, 0], y: [0, -18, 10, 0], scale: [1, 1.04, 0.97, 1] }}
          transition={{ duration: o.dur, delay: o.delay, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }}
        />
      ))}
    </div>
  );
}

export default function HeroSection({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-slate-50 to-white pt-28 pb-16 md:pt-36 md:pb-20">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(37,99,235,0.06),_transparent_60%)]" />
      {mounted && <FloatingOrbs />}

      <div className="container relative mx-auto px-6 text-center">
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-balance text-3xl font-bold tracking-tight text-foreground md:text-5xl"
        >
          {title}
        </motion.h1>
        {subtitle && (
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25 }}
            className="mx-auto mt-3 max-w-lg text-muted-foreground"
          >
            {subtitle}
          </motion.p>
        )}
        {children && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.35 }}
          >
            {children}
          </motion.div>
        )}
      </div>
    </section>
  );
}
