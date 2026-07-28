'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { useEffect, useState, useRef } from 'react';

// ── Low-end / mobile detection ────────────────────────────────────────────
export function useIsLowEndDevice(): boolean {
  if (typeof window === 'undefined') return false;
  const memory = (navigator as any).deviceMemory;
  if (memory && memory <= 4) return true;
  const isTouchDevice = window.matchMedia('(pointer: coarse)').matches;
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  return isTouchDevice && isMobile;
}

export function useShouldReduceMotion(): boolean {
  const prefersReducedMotion = useReducedMotion();
  const isLowEnd = useIsLowEndDevice();
  return prefersReducedMotion || isLowEnd;
}

// ── IntersectionObserver: only animate when element is visible ───────────
export function useIsVisible(options?: IntersectionObserverInit) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => {
      setIsVisible(entry.isIntersecting);
    }, { threshold: 0.05, ...options });
    observer.observe(el);
    return () => observer.disconnect();
  }, [options]);

  return { isVisible, ref };
}

// ponytail: usage: const { isVisible, ref } = useIsVisible();
//              <div ref={ref}>...</div>

// ── Optimized animation variants ─────────────────────────────────────────
export const fadeInUp = (shouldReduceMotion: boolean) => ({
  initial: shouldReduceMotion ? {} : { opacity: 0, y: 20 },
  animate: shouldReduceMotion ? {} : { opacity: 1, y: 0 },
  transition: shouldReduceMotion ? {} : { duration: 0.5, ease: 'easeOut' },
});

export const scaleIn = (shouldReduceMotion: boolean) => ({
  initial: shouldReduceMotion ? {} : { opacity: 0, scale: 0.95 },
  animate: shouldReduceMotion ? {} : { opacity: 1, scale: 1 },
  transition: shouldReduceMotion ? {} : { duration: 0.3, ease: 'easeOut' },
});

export const staggerContainer = (shouldReduceMotion: boolean) => ({
  initial: shouldReduceMotion ? {} : {},
  animate: shouldReduceMotion ? {} : {
    transition: {
      staggerChildren: shouldReduceMotion ? 0 : 0.1,
    },
  },
});
