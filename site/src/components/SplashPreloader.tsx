'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

// Poster images — tiny JPEGs, ~600KB total, pre-warm browser image cache
const POSTER_SRCS = [
  '/intro2-poster.jpg',
  '/expe-poster.jpg',
  '/estrutura1-poster.jpg',
  '/estrutura2-poster.jpg',
  '/estrutura3-poster.jpg',
  '/life1-poster.jpg',
  '/life2-poster.jpg',
  '/life3-poster.jpg',
];

// Videos to preload via <link rel="preload" as="video"> —
// browser-native mechanism that shares cache with <video> elements.
// Only hero + first visible section (~4.3MB): fast even on 3G.
const VIDEO_PRELOADS = [
  '/intro2.mp4',        // 1.5MB — hero, plays immediately on reveal
  '/expe.mp4',          // 1.4MB — first section below fold
];

const MIN_DURATION = 2800;

export default function SplashPreloader({ onComplete }: { onComplete: () => void }) {
  const [progress, setProgress] = useState(0);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const startTime = Date.now();

    // 1. Pre-warm image cache for all poster thumbnails
    POSTER_SRCS.forEach(src => {
      const img = new window.Image();
      img.src = src;
    });

    // 2. Inject <link rel="preload" as="video"> for critical videos.
    //    This is the browser-standard API for video preloading:
    //    - shares HTTP cache with <video> elements (unlike fetch)
    //    - respects bandwidth / data-saver settings
    //    - browser can prioritise and schedule correctly
    const links: HTMLLinkElement[] = [];
    VIDEO_PRELOADS.forEach(href => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.setAttribute('as', 'video');
      link.href = href;
      link.type = 'video/mp4';
      document.head.appendChild(link);
      links.push(link);
    });

    // 3. Smooth progress bar tied to real elapsed time (ease-out curve)
    const interval = setInterval(() => {
      const t = Math.min((Date.now() - startTime) / MIN_DURATION, 1);
      // ease-out quad — fast at start, slows near completion
      setProgress(Math.round((1 - Math.pow(1 - t, 2)) * 94));
    }, 50);

    // 4. Complete after MIN_DURATION
    const timer = setTimeout(() => {
      clearInterval(interval);
      setProgress(100);
      setExiting(true);
      setTimeout(onComplete, 500);
    }, MIN_DURATION);

    return () => {
      clearInterval(interval);
      clearTimeout(timer);
      // Keep preload links — removing them would cancel in-flight downloads
    };
  }, [onComplete]);

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-secondary-950 transition-all duration-600 ${
        exiting ? 'opacity-0 scale-105' : 'opacity-100 scale-100'
      }`}
    >
      {/* Logo */}
      <div className="mb-10 animate-pulse">
        <Image
          src="/logo.png"
          alt="Prize Club"
          width={200}
          height={68}
          className="h-12 sm:h-16 w-auto dark:brightness-0 dark:invert"
          priority
        />
      </div>

      {/* Progress bar */}
      <div className="w-48 sm:w-64 h-[2px] bg-foreground/10 rounded-full overflow-hidden mb-4">
        <div
          className="h-full bg-gradient-to-r from-primary-500 to-orange-400 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Loading text */}
      <p className="text-foreground/25 text-[10px] font-medium tracking-[0.4em] uppercase">
        Carregando experiência
      </p>
    </div>
  );
}
