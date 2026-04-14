'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';

export default function Hero() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoLoaded, setVideoLoaded] = useState(false);

  useEffect(() => {
    const v = videoRef.current;
    if (v) {
      v.play().catch(() => {});
    }
  }, []);

  return (
    <section id="inicio" className="relative min-h-[85svh] sm:min-h-[100svh] flex items-center overflow-hidden bg-[#0F2133]">
      {/* ── Background video ── */}
      <div className="absolute inset-0">
        <video
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          preload="none"
          poster="/intro2-poster.jpg"
          className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000"
          style={{
            opacity: videoLoaded ? 1 : 0,
            filter: 'brightness(1.1) saturate(1.12) contrast(1.04)',
          }}
          onLoadedData={() => setVideoLoaded(true)}
        >
          <source src="/intro2.mp4" type="video/mp4" />
        </video>
      </div>

      {/* ── Single elegant overlay — left scrim for text readability ── */}
      <div
        className="absolute inset-0 z-[1] pointer-events-none"
        style={{
          background: 'linear-gradient(105deg, rgba(7,14,23,0.55) 0%, rgba(7,14,23,0.25) 40%, transparent 70%)',
        }}
      />
      {/* Mobile: slightly stronger overlay for readability on small screens */}
      <div
        className="absolute inset-0 z-[1] pointer-events-none sm:hidden"
        style={{
          background: 'linear-gradient(to bottom, rgba(7,14,23,0.15) 0%, rgba(7,14,23,0.1) 50%, rgba(13,27,42,0.4) 100%)',
        }}
      />
      {/* Bottom — seamless transition to next section */}
      <div
        className="absolute inset-0 z-[1] pointer-events-none"
        style={{
          background: 'linear-gradient(to top, rgba(13,27,42,0.7) 0%, transparent 18%)',
        }}
      />

      {/* ── Main content ── */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-5 sm:px-10 lg:px-16 pt-24 pb-20 sm:pt-36 sm:pb-32 min-h-[85svh] sm:min-h-[100svh] flex flex-col justify-between">

        {/* ── Top: Location tag ── */}
        <div
          className="flex items-center gap-3"
          style={{ animation: 'heroLocationReveal 0.6s cubic-bezier(0.22,1,0.36,1) 0.2s both' }}
        >
          <div className="w-1.5 h-1.5 rounded-full bg-primary-500 animate-pulse" />
          <span className="text-white/60 text-[11px] font-medium tracking-[0.35em] uppercase" style={{ textShadow: '0 1px 8px rgba(0,0,0,0.4)' }}>
            Cabo Frio — RJ, Brasil
          </span>
        </div>

        {/* ── Center: Hero headline ── */}
        <div className="flex-1 flex items-center">
          <div className="w-full flex flex-col lg:flex-row lg:items-end lg:justify-between gap-10 lg:gap-20">

            {/* Left: headline */}
            <div className="max-w-2xl">
              <div
                style={{ animation: 'heroReveal 0.9s cubic-bezier(0.22,1,0.36,1) 0.3s both' }}
              >
                {/* Overline */}
                <div className="flex items-center gap-4 mb-6 sm:mb-8">
                  <div className="w-10 sm:w-12 h-[1.5px] bg-primary-500/80" />
                  <span className="hidden sm:inline text-primary-400/90 text-[10px] sm:text-[11px] font-semibold tracking-[0.3em] sm:tracking-[0.35em] uppercase">
                    Resort Náutico Premium
                  </span>
                </div>

                <h1
                  className="text-[clamp(2.2rem,7vw,5.8rem)] font-black text-white leading-[1.02] tracking-[-0.01em] mb-5 sm:mb-8"
                  style={{ textShadow: '0 2px 30px rgba(0,0,0,0.4)' }}
                >
                  O mar é o
                  <br />
                  <span className="relative inline-block mt-1">
                    <span className="text-gradient">destino.</span>
                    <div
                      className="absolute -bottom-2 left-0 w-full h-[2px] bg-gradient-to-r from-primary-500 to-primary-500/0 origin-left hidden sm:block"
                      style={{ animation: 'scaleXIn 0.8s cubic-bezier(0.22,1,0.36,1) 1s both', transformOrigin: 'left' }}
                    />
                  </span>
                  <br />
                  <span className="text-white font-bold" style={{ textShadow: '0 1px 20px rgba(0,0,0,0.35)' }}>Prize é a jornada.</span>
                </h1>

                <p
                  className="text-sm sm:text-lg text-white/75 max-w-lg leading-[1.7] sm:leading-[1.8] font-normal tracking-normal sm:tracking-wide"
                  style={{ textShadow: '0 1px 12px rgba(0,0,0,0.35)' }}
                >
                  Marina, gastronomia e aventura num só lugar.<br className="hidden sm:block" />
                  A experiência náutica mais exclusiva do Brasil.
                </p>
              </div>

              {/* CTAs */}
              <div
                className="flex flex-wrap items-center gap-4 sm:gap-5 mt-8 sm:mt-12"
                style={{ animation: 'heroReveal 0.7s cubic-bezier(0.22,1,0.36,1) 0.7s both' }}
              >
                <a
                  href="https://wa.me/5522981581555?text=Quero%20viver%20a%20experiência%20Prize!"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative inline-flex items-center gap-2.5 sm:gap-3 px-7 sm:px-9 py-3.5 sm:py-4 bg-primary-500 text-white font-semibold rounded-xl overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:scale-[1.02] active:scale-[0.97] shadow-[0_4px_20px_rgba(255,107,0,0.3)] hover:shadow-[0_8px_36px_rgba(255,107,0,0.45)]"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-orange-600 to-primary-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <span className="relative text-sm sm:text-base tracking-[0.05em]">Reservar Agora</span>
                  <svg className="relative w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </a>

                <a
                  href="#experiencia"
                  className="group inline-flex items-center gap-3 px-6 py-4 text-white/70 hover:text-white transition-colors duration-300 text-sm font-medium"
                >
                    <div className="w-10 h-10 rounded-full border border-white/20 group-hover:border-white/40 flex items-center justify-center transition-all duration-300 group-hover:scale-105">
                    <svg className="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                  <span className="hidden sm:inline">Explorar</span>
                </a>
              </div>
            </div>


          </div>
        </div>

        {/* ── Bottom bar: stats (mobile) + scroll indicator ── */}
        <div
          className="flex items-end justify-between"
          style={{ animation: 'heroReveal 0.7s cubic-bezier(0.22,1,0.36,1) 1.1s both' }}
        >
          {/* Scroll hint */}
          <a
            href="#experiencia"
            className="group flex items-center gap-3 text-white/40 hover:text-white/60 transition-colors duration-300"
          >
            <span className="text-[10px] font-medium tracking-[0.3em] uppercase hidden sm:inline">Scroll</span>
            <div style={{ animation: 'bounceY 2s ease-in-out infinite' }}>
              <ChevronDown size={16} />
            </div>
          </a>
        </div>
      </div>

      {/* ── Side vertical text ── */}
      <div
        className="hidden xl:flex absolute right-8 top-1/2 -translate-y-1/2 z-10 flex-col items-center gap-4"
        style={{ animation: 'fadeIn 1s ease-out 1.4s both' }}
      >
        <div className="w-px h-16 bg-gradient-to-b from-transparent to-white/20" />
        <span
          className="text-white/30 text-[10px] font-medium tracking-[0.4em] uppercase"
          style={{ writingMode: 'vertical-lr', textShadow: '0 1px 6px rgba(0,0,0,0.3)' }}
        >
          Prize Club — Est. 2024
        </span>
        <div className="w-px h-16 bg-gradient-to-b from-white/20 to-transparent" />
      </div>
    </section>
  );
}
