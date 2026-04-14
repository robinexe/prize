'use client';

import { useState } from 'react';
import { Shield, Wrench, Phone as PhoneIcon, Award, Smartphone, UtensilsCrossed } from 'lucide-react';
import Image from 'next/image';
import { FadeIn, StaggerContainer, StaggerItem } from './motion';
import Lightbox from './Lightbox';

const FEATURES = [
  { icon: Shield, text: 'Guardaria em local coberto' },
  { icon: Award, text: 'Capa personalizada para proteção' },
  { icon: Wrench, text: 'Ligamento do motor semanal' },
  { icon: PhoneIcon, text: 'Resgate em caso de pane' },
  { icon: UtensilsCrossed, text: 'Benefícios no bar e restaurante' },
  { icon: Smartphone, text: 'Aplicativo náutico' },
];

const GUARDARIA_IMAGES = [
  { src: '/images/guardaria-01.jpg', alt: 'Guardaria 01' },
  { src: '/images/guardaria-02.jpg', alt: 'Guardaria 02' },
  { src: '/images/guardaria-03.jpg', alt: 'Guardaria 03' },
  { src: '/images/prize-01.jpg', alt: 'Prize 01' },
];

export default function ExperienceSection() {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  return (
    <section id="guardaria" className="py-20 sm:py-32 bg-secondary-900 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary-500/10 rounded-full blur-[120px]" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Text */}
          <FadeIn direction="left">
            <p className="text-sm font-bold tracking-[0.2em] uppercase text-primary-400 mb-4">Guardaria de Jet Ski</p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-tight mb-4">
              Proteção para o seu jet ski,{' '}
              <span className="text-gradient">tranquilidade para você!</span>
            </h2>
            <p className="text-base sm:text-lg text-white/50 leading-relaxed mb-6">
              Na Prize Club, oferecemos uma estrutura completa para quem busca segurança, comodidade e lazer. Nosso serviço de guardaria é projetado para proteger seu equipamento com todo o cuidado que ele merece.
            </p>
            <p className="text-sm text-white/40 leading-relaxed mb-8">
              Cuidar do seu jet ski é a nossa prioridade, para que você possa aproveitar o melhor do mundo náutico com total tranquilidade.
            </p>

            <h3 className="text-lg font-bold text-white mb-4">Muito Mais do que um Estacionamento!</h3>
            <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8" stagger={0.06}>
              {FEATURES.map((f, i) => (
                <StaggerItem key={i}>
                  <div className="flex items-center gap-3 glass rounded-xl px-4 py-3">
                    <f.icon className="w-4 h-4 text-primary-400 flex-shrink-0" />
                    <span className="text-sm text-white/70">{f.text}</span>
                  </div>
                </StaggerItem>
              ))}
            </StaggerContainer>

            <a
              href="https://wa.me/5522981581555?text=Quero%20saber%20sobre%20a%20guardaria"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-primary-500 text-white font-bold rounded-2xl hover:bg-primary-400 transition-all shadow-2xl shadow-primary-500/25 hover:-translate-y-0.5 active:scale-[0.98]"
            >
              Venha Ser Prize Club!
            </a>
          </FadeIn>

          {/* Images - Asymmetric grid */}
          <FadeIn direction="right" delay={0.2}>
            <div className="grid grid-cols-2 gap-3">
              {GUARDARIA_IMAGES.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setLightboxIndex(i)}
                  className={`group relative rounded-2xl overflow-hidden cursor-pointer ${
                    i === 0 ? 'row-span-2 aspect-[3/4]' : 'aspect-square'
                  }`}
                >
                  <Image src={img.src} alt={img.alt} fill className="object-cover transition-transform duration-500 group-hover:scale-105" sizes="(max-width: 768px) 50vw, 25vw" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
                </button>
              ))}
            </div>
          </FadeIn>
        </div>
      </div>

      {lightboxIndex !== null && (
        <Lightbox images={GUARDARIA_IMAGES} initialIndex={lightboxIndex} onClose={() => setLightboxIndex(null)} />
      )}
    </section>
  );
}
