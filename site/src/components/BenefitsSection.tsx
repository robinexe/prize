'use client';

import { useState } from 'react';
import { Zap, Volume2, Shield, Crown, DollarSign, Smartphone, Wrench, Anchor } from 'lucide-react';
import Image from 'next/image';
import { FadeIn, StaggerContainer, StaggerItem } from './motion';
import Lightbox from './Lightbox';

const BENEFITS = [
  { icon: DollarSign, title: 'Valor de compra reduzido', desc: 'Invista apenas 1/6 do valor de um jet ski e aproveite todos os benefícios.', color: 'from-green-500 to-emerald-500' },
  { icon: Shield, title: '100% lazer, zero trabalho', desc: 'Manutenção, guardaria e seguro inclusos. Você só aproveita.', color: 'from-blue-500 to-cyan-500' },
  { icon: Anchor, title: 'Resgate em caso de pane', desc: 'Equipe de apoio pronta para qualquer situação no mar.', color: 'from-orange-500 to-red-500' },
  { icon: Crown, title: 'Benefícios no bar e restaurante', desc: 'Vantagens exclusivas no nosso Gastrobar como cotista.', color: 'from-purple-500 to-pink-500' },
  { icon: Smartphone, title: 'Aplicativo náutico', desc: 'Agende suas datas de forma justa pelo app. Sem limitação de uso.', color: 'from-indigo-500 to-blue-500' },
  { icon: Wrench, title: 'Guardaria em local coberto', desc: 'Capa personalizada e ligamento do motor semanal inclusos.', color: 'from-teal-500 to-green-500' },
];

const COTA_IMAGES = [
  { src: '/images/cota-501.jpg', alt: 'Cota 501' },
  { src: '/images/cota-506.jpg', alt: 'Cota 506' },
  { src: '/images/cota-novidade.jpg', alt: 'Cota Novidade' },
  { src: '/images/cota-pre-venda.png', alt: 'Pré Venda' },
];

export default function BenefitsSection() {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  return (
    <section id="cotas" className="py-20 sm:py-32 bg-white relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-orange-50/50 via-transparent to-transparent" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <FadeIn className="text-center mb-6 sm:mb-8">
          <p className="text-sm font-bold tracking-[0.2em] uppercase text-primary-500 mb-3">Cotas de Jet Ski</p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-secondary-900 leading-tight mb-4">
            Navegue pelos seus sonhos<br />
            <span className="text-gradient">sem gastar uma fortuna.</span>
          </h2>
          <p className="text-base sm:text-lg text-gray-500 max-w-2xl mx-auto leading-relaxed">
            Comprar e manter uma embarcação sozinho pode ser muito caro. Compartilhando, além de reduzir significativamente os custos, você evita a perda de tempo e as dores de cabeça associadas aos cuidados com sua embarcação.
          </p>
        </FadeIn>

        <FadeIn delay={0.1} className="text-center mb-14 sm:mb-16">
          <p className="text-sm sm:text-base text-gray-500 max-w-xl mx-auto">
            No nosso sistema de cotas, você agenda suas datas de forma justa, garantindo uso equilibrado. <strong className="text-secondary-900">Não há limitação de uso</strong> — aproveite todos os dias disponíveis que agendar.
          </p>
        </FadeIn>

        {/* Benefits grid */}
        <FadeIn className="text-center mb-10">
          <h3 className="text-xl sm:text-2xl font-bold text-secondary-900">
            Economize e aproveite o melhor da{' '}
            <span className="text-gradient">vida náutica!</span>
          </h3>
        </FadeIn>

        <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 mb-16 sm:mb-20" stagger={0.08}>
          {BENEFITS.map((b, i) => (
            <StaggerItem key={i}>
              <div className="group bg-white rounded-2xl p-5 sm:p-6 border border-gray-100 hover:border-primary-200 transition-all duration-300 hover:shadow-lg hover:shadow-primary-500/5 hover:-translate-y-0.5 h-full flex gap-4">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${b.color} flex items-center justify-center flex-shrink-0 shadow-md group-hover:scale-110 transition-transform duration-300`}>
                  <b.icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-secondary-900 mb-1">{b.title}</h4>
                  <p className="text-xs text-gray-500 leading-relaxed">{b.desc}</p>
                </div>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>

        {/* Cota images - Premium masonry */}
        <FadeIn className="text-center mb-8">
          <h3 className="text-xl sm:text-2xl font-bold text-secondary-900">
            Nossas <span className="text-gradient">Embarcações</span>
          </h3>
          <p className="text-sm text-gray-500 mt-2">Trabalhamos com vendas de cotas para grupos de 6 ou 8 cotistas.</p>
        </FadeIn>

        <StaggerContainer className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-10" stagger={0.1}>
          {COTA_IMAGES.map((img, i) => (
            <StaggerItem key={i}>
              <button
                onClick={() => setLightboxIndex(i)}
                className="group relative aspect-[4/5] rounded-2xl overflow-hidden w-full cursor-pointer"
              >
                <Image src={img.src} alt={img.alt} fill className="object-cover transition-transform duration-500 group-hover:scale-105" sizes="(max-width: 768px) 50vw, 25vw" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <span className="px-4 py-2 bg-white/90 backdrop-blur-sm text-secondary-900 text-xs font-bold rounded-xl">Ver Detalhes</span>
                </div>
              </button>
            </StaggerItem>
          ))}
        </StaggerContainer>

        {/* CTA */}
        <FadeIn className="text-center">
          <a
            href="https://wa.me/5521991656700?text=Quero%20saber%20sobre%20as%20cotas%20de%20jet%20ski"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-8 py-4 bg-primary-500 text-white font-bold text-base rounded-2xl hover:bg-primary-400 transition-all shadow-2xl shadow-primary-500/25 hover:-translate-y-0.5 active:scale-[0.98]"
          >
            Eu Quero! Fale com a Equipe Comercial
          </a>
        </FadeIn>
      </div>

      {lightboxIndex !== null && (
        <Lightbox images={COTA_IMAGES} initialIndex={lightboxIndex} onClose={() => setLightboxIndex(null)} />
      )}
    </section>
  );
}
