'use client';

import { useRef, useEffect, useState } from 'react';

interface LazyVideoProps {
  src: string;
  className?: string;
  playWhenVisible?: boolean;
  rootMargin?: string;
}

/**
 * Lazy-loaded video component. Only loads the video source when
 * the element enters the viewport (IntersectionObserver).
 * Uses preload="none" until visible, then switches to "metadata".
 */
export default function LazyVideo({
  src,
  className = '',
  playWhenVisible = true,
  rootMargin = '200px',
}: LazyVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [rootMargin]);

  useEffect(() => {
    const el = videoRef.current;
    if (!el || !isVisible) return;

    // Set source and load
    el.src = src;
    el.load();

    if (playWhenVisible) {
      el.play().catch(() => {});
    }
  }, [isVisible, src, playWhenVisible]);

  return (
    <video
      ref={videoRef}
      muted
      loop
      playsInline
      preload="none"
      className={className}
    />
  );
}
