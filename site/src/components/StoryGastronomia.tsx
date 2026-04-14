'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { UtensilsCrossed, X, ChevronLeft, ChevronRight } from 'lucide-react';
import Image from 'next/image';

const GALLERY = [
  { src: '/comida.webp',  label: 'Na Pedra',            category: 'Grelhados' },
  { src: '/comida8.webp', label: 'Carpaccio',            category: 'Entradas' },
  { src: '/comida2.webp', label: 'Gratinado',            category: 'Especiais' },
  { src: '/comida7.webp', label: 'Camarão & Vinagrete',  category: 'Frutos do Mar' },
  { src: '/comida4.webp', label: 'Picadinho',            category: 'Petiscos' },
  { src: '/comida6.webp', label: 'Strogonoff',           category: 'Pratos Principais' },
  { src: '/comida5.webp', label: 'Frutos do Mar',        category: 'Especialidade' },
  { src: '/comida3.webp', label: 'Tábua Prize',          category: 'Para Compartilhar' },
];

/* ─── Easing curves ─── */
const EASE_OUT_EXPO: [number, number, number, number] = [0.16, 1, 0.3, 1];

/* ─── Gallery Card ─── */
function GalleryCard({
  item,
  index,
  onOpen,
}: {
  item: (typeof GALLERY)[0];
  index: number;
  onOpen: () => void;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setRevealed(true); observer.disconnect(); } },
      { rootMargin: '-80px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={cardRef}
      className={`group relative cursor-pointer transition-all duration-[800ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${revealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
      style={{ transitionDelay: `${index * 70}ms` }}
      onClick={onOpen}
    >
      {/* Card container with elevation */}
      <div className="relative aspect-[4/5] rounded-2xl overflow-hidden bg-secondary-950 transition-all duration-500 ease-out group-hover:shadow-[0_20px_60px_-12px_rgba(0,0,0,0.5)] group-hover:-translate-y-1">
        {/* Image */}
        <Image
          src={item.src}
          alt={item.label}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-cover transition-transform duration-[800ms] ease-[cubic-bezier(0.16,1,0.3,1)] will-change-transform group-hover:scale-[1.04]"
          loading="lazy"
        />

        {/* Persistent subtle gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-transparent" />

        {/* Hover gradient intensification */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        {/* Top subtle vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_50%,rgba(0,0,0,0.15)_100%)]" />

        {/* Label container */}
        <div className="absolute bottom-0 inset-x-0 p-4 sm:p-5">
          {/* Category - appears on hover */}
          <span className="block text-[10px] sm:text-[11px] font-semibold tracking-[0.15em] uppercase text-primary-400/90 mb-1 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 ease-out delay-75">
            {item.category}
          </span>
          {/* Label - always visible, shifts up on hover */}
          <h4 className="text-white font-semibold text-[13px] sm:text-[15px] leading-snug tracking-[-0.01em] transition-transform duration-500 ease-out group-hover:-translate-y-0.5">
            {item.label}
          </h4>
        </div>
      </div>
    </div>
  );
}
/* ─── Lightbox ─── */
function Lightbox({
  items,
  currentIndex,
  onClose,
  onPrev,
  onNext,
}: {
  items: typeof GALLERY;
  currentIndex: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  const item = items[currentIndex];

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') onPrev();
      if (e.key === 'ArrowRight') onNext();
    };
    window.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [onClose, onPrev, onNext]);

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/92 backdrop-blur-2xl lightbox-enter"
      onClick={onClose}
    >
      {/* Close */}
      <button
        className="absolute top-5 right-5 sm:top-8 sm:right-8 z-10 w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center rounded-full bg-white/[0.07] hover:bg-white/[0.14] border border-white/[0.08] text-white/70 hover:text-white transition-all duration-300"
        onClick={(e) => { e.stopPropagation(); onClose(); }}
      >
        <X className="w-4 h-4 sm:w-[18px] sm:h-[18px]" strokeWidth={1.5} />
      </button>

      {/* Nav prev */}
      <button
        className="absolute left-3 sm:left-8 z-10 w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center rounded-full bg-white/[0.07] hover:bg-white/[0.14] border border-white/[0.08] text-white/70 hover:text-white transition-all duration-300"
        onClick={(e) => { e.stopPropagation(); onPrev(); }}
      >
        <ChevronLeft className="w-5 h-5" strokeWidth={1.5} />
      </button>

      {/* Nav next */}
      <button
        className="absolute right-3 sm:right-8 z-10 w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center rounded-full bg-white/[0.07] hover:bg-white/[0.14] border border-white/[0.08] text-white/70 hover:text-white transition-all duration-300"
        onClick={(e) => { e.stopPropagation(); onNext(); }}
      >
        <ChevronRight className="w-5 h-5" strokeWidth={1.5} />
      </button>

      {/* Image */}
      <div
        key={currentIndex}
        className="relative w-[88vw] h-[70vh] sm:w-[75vw] sm:h-[78vh] max-w-4xl lightbox-img-enter"
        onClick={(e) => e.stopPropagation()}
      >
        <Image
          src={item.src}
          alt={item.label}
          fill
          sizes="90vw"
          className="object-contain drop-shadow-2xl"
          priority
        />
      </div>

      {/* Caption */}
      <div
        key={`cap-${currentIndex}`}
        className="absolute bottom-6 sm:bottom-10 left-1/2 -translate-x-1/2 text-center lightbox-img-enter"
      >
        <span className="text-primary-400/80 text-[10px] sm:text-xs font-semibold tracking-[0.2em] uppercase">
          {item.category}
        </span>
        <h4 className="text-white font-semibold text-base sm:text-lg mt-1 tracking-[-0.01em]">{item.label}</h4>
        <div className="flex items-center justify-center gap-1.5 mt-2">
          {items.map((_, i) => (
            <div
              key={i}
              className={`h-[2px] rounded-full transition-all duration-300 ${
                i === currentIndex ? 'w-5 bg-primary-500' : 'w-2 bg-white/20'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Main Section ─── */
export default function StoryGastronomia() {
  const sectionRef = useRef<HTMLElement>(null);
  const [isInView, setIsInView] = useState(false);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const [parallaxY, setParallaxY] = useState(0);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setIsInView(true); observer.disconnect(); } },
      { rootMargin: '-100px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    let raf: number;
    const onScroll = () => {
      raf = requestAnimationFrame(() => {
        const rect = el.getBoundingClientRect();
        const vh = window.innerHeight;
        const progress = Math.max(0, Math.min(1, (vh - rect.top) / (vh + rect.height)));
        setParallaxY(40 - progress * 80);
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => { window.removeEventListener('scroll', onScroll); cancelAnimationFrame(raf); };
  }, []);

  return (
    <>
      <section
        ref={sectionRef}
        id="gastronomia"
        className="relative py-12 sm:py-20 lg:py-24 bg-secondary-900 overflow-hidden"
      >
        {/* Ambient light — very subtle */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary-500/[0.015] rounded-full blur-[160px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          {/* Header */}
          <div
            className={`text-center mb-10 sm:mb-12 transition-all duration-[800ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
          >
            <div className="inline-flex items-center gap-3 mb-4">
              <div className="w-6 h-[1px] bg-primary-500/60" />
              <span className="text-primary-400 text-[11px] font-semibold tracking-[0.25em] uppercase">
                Gastronomia
              </span>
              <div className="w-6 h-[1px] bg-primary-500/60" />
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-[3.25rem] font-black text-foreground leading-[1.08] tracking-[-0.02em] mb-3">
              Sabores que você
              <br />
              <span className="text-gradient">nunca vai esquecer.</span>
            </h2>
            <p className="text-sm sm:text-[15px] text-foreground/40 max-w-md mx-auto leading-relaxed">
              Cada prato, cada drink, cada momento — uma obra-prima criada para os sentidos.
            </p>
          </div>

          {/* ── Uniform Grid ── */}
          <div style={{ transform: `translateY(${parallaxY}px)` }}>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {GALLERY.map((item, i) => (
                <GalleryCard
                  key={i}
                  item={item}
                  index={i}
                  onOpen={() => setLightboxIdx(i)}
                />
              ))}
            </div>
          </div>

          {/* Bottom CTA */}
          <div
            className={`text-center mt-10 sm:mt-12 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] delay-300 ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
          >
            <a
              href="https://wa.me/5522981581555?text=Quero%20reservar%20minha%20mesa%20na%20Prize!"
              target="_blank"
              rel="noopener noreferrer"
              className="group relative inline-flex items-center gap-3 px-8 sm:px-10 py-3.5 sm:py-4 bg-primary-500 text-white font-bold rounded-xl sm:rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_48px_-8px_rgba(255,107,0,0.35)] active:scale-[0.98]"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-orange-600 to-primary-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <UtensilsCrossed className="relative w-4 h-4 sm:w-5 sm:h-5" strokeWidth={2} />
              <span className="relative text-sm sm:text-base tracking-[-0.01em]">Quero Provar Tudo</span>
            </a>
          </div>
        </div>
      </section>

      {/* Lightbox */}
      {lightboxIdx !== null && (
        <Lightbox
          items={GALLERY}
          currentIndex={lightboxIdx}
          onClose={() => setLightboxIdx(null)}
          onPrev={() => setLightboxIdx((p) => (p! - 1 + GALLERY.length) % GALLERY.length)}
          onNext={() => setLightboxIdx((p) => (p! + 1) % GALLERY.length)}
        />
      )}
    </>
  );
}
