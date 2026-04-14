'use client';

import { useEffect } from 'react';

// Videos NOT already preloaded during splash (those are: intro2, experiencia3, expe)
// These 6 are loaded here sequentially after the site is visible, one at a time.
const QUEUE = [
  '/estrutura1.mp4',
  '/estrutura2.mp4',
  '/estrutura3.mp4',
  '/life1.mp4',
  '/life2.mp4',
  '/life3.mp4',
];

export default function VideoPreloadQueue() {
  useEffect(() => {
    // Skip on slow or data-saver connections
    const conn = (navigator as any).connection;
    if (conn && (conn.saveData || ['slow-2g', '2g'].includes(conn.effectiveType))) return;

    let index = 0;

    function loadNext() {
      if (index >= QUEUE.length) return;

      const src = QUEUE[index++];
      const link = document.createElement('link');
      link.rel = 'preload';
      link.setAttribute('as', 'video');
      link.href = src;
      link.type = 'video/mp4';
      // Only start next video when current one finishes — sequential, never parallel
      link.onload = loadNext;
      link.onerror = loadNext;
      document.head.appendChild(link);
    }

    // Wait 1.5s after site renders: let the hero video stabilise first, then queue
    const t = setTimeout(loadNext, 1500);
    return () => clearTimeout(t);
  }, []);

  return null;
}
