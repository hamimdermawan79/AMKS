'use client';

// ── Low-end / mobile detection ────────────────────────────────────────────
export function useIsLowEndDevice(): boolean {
  if (typeof window === 'undefined') return false;
  const memory = (navigator as any).deviceMemory;
  if (memory && memory <= 4) return true;
  const isTouchDevice = window.matchMedia('(pointer: coarse)').matches;
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  return isTouchDevice && isMobile;
}
