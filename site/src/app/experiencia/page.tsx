'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import WaveDivider from '@/components/WaveDivider';
import StoryExperiencia from '@/components/StoryExperiencia';
import MapSection from '@/components/MapSection';
import MobileBottomBar from '@/components/MobileBottomBar';
import { FadeIn, StaggerContainer, StaggerItem } from '@/components/motion';
import Image from 'next/image';
import { Anchor, Shield, Smartphone, Wrench, Utensils, Users, DollarSign, CalendarCheck } from 'lucide-react';

const BENEFITS = [
  { icon: DollarSign, title: 'Valor de compra reduzido', desc: 'Invista apenas 1/6 do valor de um jet ski e aproveite todos os benefícios.' },
  { icon: Wrench, title: 'Menos custo com manutenção', desc: 'Compartilhe os custos de manutenção entre os cotistas do grupo.' },
  { icon: Anchor, title: '100% lazer, zero trabalho', desc: 'Nós cuidamos de tudo. Você só precisa curtir.' },
  { icon: Shield, title: 'Resgate em caso de pane', desc: 'Assistência completa caso ocorra qualquer problema na água.' },
  { icon: Utensils, title: 'Benefícios no restaurante', desc: 'Cotistas têm descontos e vantagens exclusivas no nosso Gastrobar.' },
  { icon: Smartphone, title: 'Aplicativo náutico', desc: 'Agende e gerencie suas datas de uso pelo app de forma prática.' },
  { icon: CalendarCheck, title: 'Sem limitação de uso', desc: 'Aproveite todos os dias disponíveis que você agendar. Sem restrições.' },
  { icon: Users, title: 'Gestão imparcial', desc: 'Sistema justo de agendamento que garante equilíbrio para todos os cotistas.' },
];

const COTA_IMAGES = [
  { src: '/images/cota-501.jpg', alt: 'Cota 501' },
  { src: '/images/cota-506.jpg', alt: 'Cota 506' },
  { src: '/images/cota-novidade.jpg', alt: 'Nova Cota' },
  { src: '/images/cota-pre-venda.png', alt: 'Pré-Venda' },
];

export default function ExperienciaPage() {
  return (
    <main className="min-h-screen pb-mobile-bar">
      <Header />

      {/* Hero Banner */}
      <section className="relative h-[50vh] sm:h-[55vh] flex items-center justify-center overflow-hidden">
        <Image src="/images/prize-07.jpg" alt="Cotas de Jet Ski" fill className="object-cover" priority />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0D1B2A]/80 via-[#0D1B2A]/50 to-[#0D1B2A]" />
        <div className="relative z-10 text-center px-4 max-w-4xl">
          <FadeIn>
            <p className="text-sm font-bold tracking-[0.2em] uppercase text-primary-400 mb-4">Cotas de Jet Ski</p>
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black text-white leading-tight mb-5">
              Navegue pelos seus sonhos <span className="text-gradient">sem gastar uma fortuna</span>
            </h1>
            <p className="text-lg sm:text-xl text-white/60 max-w-2xl mx-auto">
              Comprar e manter uma embarcação sozinho pode ser muito caro. Compartilhando, você reduz custos e elimina dores de cabeça.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* How it works */}
      <section className="py-14 sm:py-20 bg-secondary-950">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn className="text-center mb-10">
            <p className="text-sm font-bold tracking-[0.2em] uppercase text-primary-400 mb-3">Como Funciona</p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-foreground leading-tight mb-5">
              Economize e aproveite o <span className="text-gradient">melhor da vida náutica</span>
            </h2>
            <p className="text-base sm:text-lg text-foreground/50 max-w-3xl mx-auto">
              No nosso sistema de cotas de jet ski, você agenda suas datas de forma justa, garantindo que todos os cotistas possam utilizar a embarcação de maneira equilibrada. Não há limitação de uso: você pode aproveitar todos os dias disponíveis que agendar.
            </p>
          </FadeIn>

          <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-10">
            <FadeIn className="bg-secondary-900/80 border border-foreground/5 rounded-xl sm:rounded-2xl p-3 sm:p-6 text-center">
              <div className="text-2xl sm:text-5xl font-black text-primary-500 mb-1 sm:mb-2">1/6</div>
              <p className="text-foreground/70 text-[10px] sm:text-sm leading-tight">do valor de um jet ski</p>
            </FadeIn>
            <FadeIn delay={0.1} className="bg-secondary-900/80 border border-foreground/5 rounded-xl sm:rounded-2xl p-3 sm:p-6 text-center">
              <div className="text-2xl sm:text-5xl font-black text-primary-500 mb-1 sm:mb-2">6-8</div>
              <p className="text-foreground/70 text-[10px] sm:text-sm leading-tight">cotistas por embarcação</p>
            </FadeIn>
            <FadeIn delay={0.2} className="bg-secondary-900/80 border border-foreground/5 rounded-xl sm:rounded-2xl p-3 sm:p-6 text-center">
              <div className="text-2xl sm:text-5xl font-black text-primary-500 mb-1 sm:mb-2">∞</div>
              <p className="text-foreground/70 text-[10px] sm:text-sm leading-tight">sem limitação de uso</p>
            </FadeIn>
          </div>

          <StaggerContainer className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4" stagger={0.08}>
            {BENEFITS.map((b, i) => (
              <StaggerItem key={i}>
                <div className="bg-secondary-900/60 border border-foreground/5 rounded-xl sm:rounded-2xl p-3 sm:p-5 h-full hover:border-primary-500/30 transition-colors">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary-500/10 rounded-lg sm:rounded-xl flex items-center justify-center mb-2 sm:mb-3">
                    <b.icon className="w-4 h-4 sm:w-5 sm:h-5 text-primary-400" />
                  </div>
                  <h3 className="text-foreground font-bold text-xs sm:text-sm mb-0.5 sm:mb-1">{b.title}</h3>
                  <p className="text-foreground/40 text-[10px] sm:text-xs leading-relaxed">{b.desc}</p>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Carousel */}
      <WaveDivider topColor="rgb(var(--c-s-950))" bottomColor="rgb(var(--c-s-900))" />
      <StoryExperiencia />

      <WaveDivider />

      {/* Cotas Grid */}
      <section className="py-14 sm:py-20 bg-secondary-950">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn className="text-center mb-10">
            <p className="text-sm font-bold tracking-[0.2em] uppercase text-primary-400 mb-3">Nossas Cotas</p>
            <h2 className="text-3xl sm:text-4xl font-black text-foreground mb-4">
              Trabalhamos com vendas de cotas para grupos de <span className="text-gradient">6 ou 8 cotistas</span>
            </h2>
            <p className="text-foreground/50 max-w-xl mx-auto">Venha ser Prize! Escolha a cota perfeita para você e comece a viver sua aventura náutica.</p>
          </FadeIn>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {COTA_IMAGES.map((img, i) => (
              <FadeIn key={i} delay={i * 0.1}>
                <div className="relative aspect-[4/5] rounded-2xl overflow-hidden group">
                  <Image src={img.src} alt={img.alt} fill className="object-cover transition-transform duration-500 group-hover:scale-105" sizes="(max-width: 768px) 50vw, 25vw" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent" />
                  <div className="absolute bottom-3 left-3 bg-white/90 text-[#0D1B2A] text-xs font-bold px-3 py-1.5 rounded-lg">{img.alt}</div>
                </div>
              </FadeIn>
            ))}
          </div>

          <FadeIn delay={0.3} className="text-center mt-10">
            <a
              href="https://wa.me/5522981581555?text=Quero%20saber%20mais%20sobre%20as%20cotas%20de%20jet%20ski"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-8 py-4 bg-primary-500 text-white font-bold rounded-2xl hover:bg-primary-400 transition-all shadow-2xl shadow-primary-500/25 hover:-translate-y-0.5"
            >
              Fale com a Equipe Comercial
            </a>
          </FadeIn>
        </div>
      </section>

      <MapSection />
      <Footer />
      <MobileBottomBar />
    </main>
  );
}
