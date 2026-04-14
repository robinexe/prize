'use client';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import WaveDivider from '@/components/WaveDivider';
import StoryEstrutura from '@/components/StoryEstrutura';
import MapSection from '@/components/MapSection';
import MobileBottomBar from '@/components/MobileBottomBar';
import { FadeIn, StaggerContainer, StaggerItem } from '@/components/motion';
import Image from 'next/image';
import { Shield, Umbrella, Wrench, LifeBuoy, Utensils, Smartphone } from 'lucide-react';

const GUARDARIA_BENEFITS = [
  { icon: Umbrella, title: 'Guardaria em local coberto', desc: 'Seu jet ski protegido contra sol, chuva e intempéries em ambiente coberto e seguro.' },
  { icon: Shield, title: 'Capa personalizada', desc: 'Proteção extra com capa sob medida para manter seu equipamento sempre impecável.' },
  { icon: Wrench, title: 'Ligamento semanal do motor', desc: 'Manutenção preventiva com acionamento semanal do motor para garantir o funcionamento perfeito.' },
  { icon: LifeBuoy, title: 'Resgate em caso de pane', desc: 'Assistência completa na água caso ocorra qualquer problema com sua embarcação.' },
  { icon: Utensils, title: 'Benefícios no restaurante', desc: 'Vantagens exclusivas em nosso Gastrobar para quem guarda seu jet ski conosco.' },
  { icon: Smartphone, title: 'Aplicativo náutico', desc: 'Gerencie tudo pelo app: agendamentos, solicitações e acompanhamento do seu equipamento.' },
];

const GUARDARIA_IMAGES = [
  { src: '/images/guardaria-01.jpg', alt: 'Guardaria coberta' },
  { src: '/images/guardaria-02.jpg', alt: 'Infraestrutura organizada' },
  { src: '/images/guardaria-03.jpg', alt: 'Proteção dos equipamentos' },
  { src: '/images/prize-01.jpg', alt: 'Vista da marina' },
];

export default function EstruturaPage() {
  return (
    <main className="min-h-screen pb-mobile-bar">
      <Header />

      {/* Hero Banner */}
      <section className="relative h-[50vh] sm:h-[55vh] flex items-center justify-center overflow-hidden">
        <Image src="/images/guardaria-01.jpg" alt="Guardaria de Jet Ski" fill className="object-cover" priority />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0D1B2A]/80 via-[#0D1B2A]/50 to-[#0D1B2A]" />
        <div className="relative z-10 text-center px-4 max-w-4xl">
          <FadeIn>
            <p className="text-sm font-bold tracking-[0.2em] uppercase text-primary-400 mb-4">Guardaria de Jet Ski</p>
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black text-white leading-tight mb-5">
              Proteção para o seu jet ski, <span className="text-gradient">tranquilidade para você</span>
            </h1>
            <p className="text-lg sm:text-xl text-white/60 max-w-2xl mx-auto">
              Oferecemos uma estrutura completa para quem busca segurança, comodidade e lazer em sua experiência náutica.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* Description */}
      <section className="py-14 sm:py-20 bg-secondary-950">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn className="text-center mb-10">
            <p className="text-sm font-bold tracking-[0.2em] uppercase text-primary-400 mb-3">Diferenciais</p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-foreground leading-tight mb-5">
              Muito mais do que um <span className="text-gradient">estacionamento</span>
            </h2>
            <p className="text-base sm:text-lg text-foreground/50 max-w-3xl mx-auto">
              Nosso serviço de guardaria é projetado para proteger seu equipamento com todo o cuidado que ele merece, com diferenciais que garantem tranquilidade e conveniência para você. Cuidar do seu jet ski é a nossa prioridade!
            </p>
          </FadeIn>

          <StaggerContainer className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4 mb-10" stagger={0.08}>
            {GUARDARIA_BENEFITS.map((b, i) => (
              <StaggerItem key={i}>
                <div className="bg-secondary-900/60 border border-foreground/5 rounded-xl sm:rounded-2xl p-3 sm:p-6 h-full hover:border-primary-500/30 transition-colors">
                  <div className="w-8 h-8 sm:w-12 sm:h-12 bg-primary-500/10 rounded-lg sm:rounded-xl flex items-center justify-center mb-2 sm:mb-4">
                    <b.icon className="w-4 h-4 sm:w-6 sm:h-6 text-primary-400" />
                  </div>
                  <h3 className="text-foreground font-bold text-xs sm:text-base mb-1 sm:mb-2">{b.title}</h3>
                  <p className="text-foreground/40 text-[10px] sm:text-sm leading-relaxed">{b.desc}</p>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>

          {/* Image Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {GUARDARIA_IMAGES.map((img, i) => (
              <FadeIn key={i} delay={i * 0.1}>
                <div className="relative aspect-[4/5] rounded-2xl overflow-hidden group">
                  <Image src={img.src} alt={img.alt} fill className="object-cover transition-transform duration-500 group-hover:scale-105" sizes="(max-width: 768px) 50vw, 25vw" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent" />
                  <div className="absolute bottom-3 left-3 bg-white/90 text-[#0D1B2A] text-xs font-bold px-3 py-1.5 rounded-lg">{img.alt}</div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Carousel */}
      <WaveDivider topColor="rgb(var(--c-s-950))" bottomColor="rgb(var(--c-s-950))" />
      <StoryEstrutura />

      <MapSection />
      <Footer />
      <MobileBottomBar />
    </main>
  );
}
