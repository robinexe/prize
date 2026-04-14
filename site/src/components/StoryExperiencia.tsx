'use client';

import { useRef, useEffect, useState } from 'react';

export default function StoryExperiencia() {
  const sectionRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isInView, setIsInView] = useState(false);

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
    if (!isInView || !videoRef.current) return;
    if (!videoRef.current.src.includes('expe.mp4')) {
      videoRef.current.src = '/expe.mp4';
      videoRef.current.load();
    }
    videoRef.current.play().catch(() => {});
  }, [isInView]);

  return (
    <section
      ref={sectionRef}
      id="experiencia"
      className="relative py-12 sm:py-20 lg:py-24 bg-secondary-900 overflow-hidden -mt-[2px]"
    >
      {/* ── Ambient glow ── */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-primary-500/[0.02] rounded-full blur-[160px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
        {/* ── Text + Single Video ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-center">

          {/* ▸ Text column */}
          <div
            className={`lg:col-span-4 transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
          >
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-[1.5px] bg-primary-500" />
              <span className="text-primary-400 text-[11px] font-semibold tracking-[0.2em] uppercase">
                Experiência
              </span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-black text-foreground leading-[1.08] tracking-[-0.01em] mb-3">
              Sinta o que{' '}
              <span className="text-gradient">palavras não explicam.</span>
            </h2>

            <p className="text-sm sm:text-[15px] text-foreground/40 leading-relaxed mb-8">
              Adrenalina, liberdade e o som do motor sobre as ondas.
              É mais que um esporte — é um estilo de vida.
            </p>

            <a
              href="https://wa.me/5522981581555?text=Quero%20viver%20a%20experiência%20Prize!"
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-2 text-sm font-semibold text-primary-400 hover:text-primary-300 transition-colors duration-300"
            >
              Quero viver isso
              <svg
                className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </a>
          </div>

          {/* ▸ Video card — centered, larger */}
          <div
            className={`lg:col-span-8 relative group cursor-pointer transition-all duration-[800ms] ease-[cubic-bezier(0.22,1,0.36,1)] delay-100 ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
          >
            <div className="relative aspect-video rounded-2xl sm:rounded-3xl overflow-hidden bg-secondary-950 border border-white/[0.04] transition-shadow duration-500 group-hover:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.4)]">
              <video
                ref={videoRef}
                muted
                loop
                playsInline
                preload="none"
                poster="/expe-poster.jpg"
                className="absolute inset-0 w-full h-full object-cover will-change-transform transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.03]"
              />

              {/* Cinematic overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/5 to-transparent pointer-events-none" />

              {/* Glass badge */}
              <div className="absolute top-3.5 left-3.5 sm:top-4 sm:left-4">
                <div className="flex items-center gap-1.5 bg-white/[0.08] backdrop-blur-xl border border-white/[0.06] rounded-full px-2.5 py-1">
                  <div className="w-1 h-1 rounded-full bg-primary-400/80" />
                  <span className="text-white/70 text-[10px] font-medium tracking-wide">Aventura</span>
                </div>
              </div>

              {/* Bottom text */}
              <div className="absolute inset-x-0 bottom-0 p-4 sm:p-6">
                <h3 className="text-white text-base sm:text-xl font-bold leading-tight">
                  Adrenalina Pura
                </h3>
                <p className="text-white/40 text-xs sm:text-sm mt-1">
                  A experiência inesquecível
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
