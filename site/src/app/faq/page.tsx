'use client';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import WaveDivider from '@/components/WaveDivider';
import FAQSection from '@/components/FAQSection';
import MapSection from '@/components/MapSection';
import MobileBottomBar from '@/components/MobileBottomBar';
import { FadeIn } from '@/components/motion';
import { Clock, MapPin, Phone, PawPrint } from 'lucide-react';

const INFO_CARDS = [
  { icon: Clock, title: 'Horário de Funcionamento', desc: 'Marina: todos os dias, 09h às 18h. Gastrobar: qui-sex 11h-18h, sáb-dom 11h-20h.' },
  { icon: MapPin, title: 'Localização', desc: 'Rua dos Camarões, 117 - Ogiva, Cabo Frio - RJ. A 4,3km da Ilha do Japonês.' },
  { icon: Phone, title: 'Contato', desc: '(22) 98158-1555 — WhatsApp ou ligação. contato@marinaprizeclub.com.br' },
  { icon: PawPrint, title: 'Pet Friendly', desc: 'Sim! Crianças e animais de estimação são bem-vindos. Diversão para toda a família.' },
];

export default function FAQPage() {
  return (
    <main className="min-h-screen pb-mobile-bar">
      <Header />

      {/* Hero Banner */}
      <section className="relative pt-24 pb-12 sm:pt-32 sm:pb-16 bg-[#0D1B2A]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <FadeIn>
            <p className="text-sm font-bold tracking-[0.2em] uppercase text-primary-400 mb-4">Central de Ajuda</p>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-tight mb-5">
              Tudo que você precisa <span className="text-gradient">saber</span>
            </h1>
            <p className="text-lg sm:text-xl text-white/50 max-w-2xl mx-auto">
              Encontre respostas sobre horários, localização, cotas de jet ski, gastronomia e tudo sobre a Marina Prize Club.
            </p>
          </FadeIn>
        </div>
      </section>

      <WaveDivider topColor="#0D1B2A" bottomColor="rgb(var(--c-s-950))" />

      {/* Info Cards */}
      <section className="py-8 sm:py-14 bg-secondary-950">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
            {INFO_CARDS.map((card, i) => (
              <FadeIn key={i} delay={i * 0.08}>
                <div className="bg-foreground/[0.04] border border-foreground/[0.06] rounded-xl sm:rounded-2xl p-3 sm:p-5 h-full">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary-500/10 rounded-lg sm:rounded-xl flex items-center justify-center mb-2 sm:mb-3">
                    <card.icon className="w-4 h-4 sm:w-5 sm:h-5 text-primary-400" />
                  </div>
                  <h3 className="text-foreground font-bold text-xs sm:text-sm mb-0.5 sm:mb-1">{card.title}</h3>
                  <p className="text-foreground/40 text-[10px] sm:text-xs leading-relaxed">{card.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      <WaveDivider topColor="rgb(var(--c-s-950))" bottomColor="rgb(var(--c-s-800))" />
      <FAQSection />
      <MapSection />
      <Footer />
      <MobileBottomBar />
    </main>
  );
}
