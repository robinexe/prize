'use client';

import { useState, useCallback, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import Image from 'next/image';

interface LightboxProps {
  images: { src: string; alt: string }[];
  initialIndex: number;
  onClose: () => void;
}

export default function Lightbox({ images, initialIndex, onClose }: LightboxProps) {
  const [index, setIndex] = useState(initialIndex);
  const [direction, setDirection] = useState(0);

  const go = useCallback((dir: number) => {
    setDirection(dir);
    setIndex(prev => (prev + dir + images.length) % images.length);
  }, [images.length]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') go(1);
      if (e.key === 'ArrowLeft') go(-1);
    };
    window.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [go, onClose]);

  // Swipe support
  const [touchStart, setTouchStart] = useState<number | null>(null);

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center lightbox-enter"
      onClick={onClose}
    >
      {/* Close */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors"
      >
        <X size={20} />
      </button>

      {/* Counter */}
      <div className="absolute top-5 left-1/2 -translate-x-1/2 text-white/50 text-sm font-medium">
        {index + 1} / {images.length}
      </div>

      {/* Nav buttons */}
      <button
        onClick={e => { e.stopPropagation(); go(-1); }}
        className="absolute left-3 sm:left-6 z-10 w-10 h-10 sm:w-12 sm:h-12 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors"
      >
        <ChevronLeft size={22} />
      </button>
      <button
        onClick={e => { e.stopPropagation(); go(1); }}
        className="absolute right-3 sm:right-6 z-10 w-10 h-10 sm:w-12 sm:h-12 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors"
      >
        <ChevronRight size={22} />
      </button>

      {/* Image */}
      <div
        key={index}
        className="relative w-[90vw] h-[70vh] sm:w-[80vw] sm:h-[80vh] max-w-5xl lightbox-img-enter"
        onClick={e => e.stopPropagation()}
        onTouchStart={e => setTouchStart(e.touches[0].clientX)}
        onTouchEnd={e => {
          if (touchStart === null) return;
          const diff = touchStart - e.changedTouches[0].clientX;
          if (Math.abs(diff) > 50) go(diff > 0 ? 1 : -1);
          setTouchStart(null);
        }}
      >
          <Image
            src={images[index].src}
            alt={images[index].alt}
            fill
            className="object-contain"
            sizes="90vw"
            priority
          />
      </div>

      {/* CTA inside lightbox */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
        <a
          href="https://wa.me/5522981581555?text=Quero%20saber%20mais%20sobre%20a%20Prize%20Club"
          target="_blank"
          rel="noopener noreferrer"
          onClick={e => e.stopPropagation()}
          className="px-6 py-3 bg-primary-500 text-white font-bold rounded-2xl hover:bg-primary-400 transition-all shadow-2xl shadow-primary-500/30 text-sm"
        >
          Venha Ser Prize!
        </a>
      </div>
    </div>
  );
}
