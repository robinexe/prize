'use client';

import { FadeIn } from './motion';
import Link from 'next/link';
import Image from 'next/image';

export default function FinalCTASection() {
  return (
    <section className="relative py-16 sm:py-24 overflow-hidden">
      {/* Background image */}
      <Image
        src="/mar.webp"
        alt=""
        fill
        sizes="100vw"
        className="object-cover"
        quality={80}
        priority={false}
      />
      <div className="absolute inset-0 bg-[#0D1B2A]/85" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0D1B2A] via-[#0D1B2A]/50 to-[#0D1B2A]" />

      <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <FadeIn>
          <p className="text-sm font-bold tracking-[0.2em] uppercase text-primary-400 mb-4">Última Chamada</p>
          <h2 className="text-3xl sm:text-4xl lg:text-6xl font-black text-white leading-tight mb-5">
            O mar não espera.<br />
            <span className="text-gradient">Sua vaga também não.</span>
          </h2>
          <p className="text-lg sm:text-xl text-white/50 mb-10 max-w-xl mx-auto">
            Vagas limitadas por embarcação. Garanta sua cota agora e comece a viver a experiência Prize Club.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <Link
              href="/cadastro"
              className="px-10 py-5 bg-primary-500 text-white font-black text-lg rounded-2xl hover:bg-primary-400 transition-all shadow-2xl shadow-primary-500/30 hover:shadow-primary-500/50 hover:-translate-y-1 active:scale-[0.98] animate-pulse-glow"
            >
              Garantir Minha Cota Agora
            </Link>
            <a
              href="https://wa.me/5522981581555?text=Quero%20saber%20mais%20sobre%20as%20cotas"
              target="_blank"
              rel="noopener noreferrer"
              className="px-10 py-5 glass text-white font-bold text-lg rounded-2xl hover:bg-white/10 transition-all hover:-translate-y-1 active:scale-[0.98]"
            >
              Falar no WhatsApp
            </a>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
