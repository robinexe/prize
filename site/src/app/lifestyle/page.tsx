'use client';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import WaveDivider from '@/components/WaveDivider';
import StoryLifestyle from '@/components/StoryLifestyle';
import MapSection from '@/components/MapSection';
import MobileBottomBar from '@/components/MobileBottomBar';
import { FadeIn, StaggerContainer, StaggerItem } from '@/components/motion';
import Image from 'next/image';
import { Beer, Wine, IceCreamCone, Flame, Snowflake, ShoppingBag } from 'lucide-react';

const PRODUCTS = [
  { icon: Beer, title: 'Cervejas sempre geladas', desc: 'Ampla seleção de cervejas artesanais e tradicionais, sempre na temperatura ideal.' },
  { icon: Wine, title: 'Espumantes, vinhos e destilados', desc: 'Variedade de espumantes, vinhos, gin, vodka e muito mais para todos os gostos.' },
  { icon: Snowflake, title: 'Gelo filtrado', desc: 'Gelo filtrado de qualidade para completar suas bebidas e coolers.' },
  { icon: Flame, title: 'Kit churrasco completo', desc: 'Tudo que você precisa para um churrasco perfeito no seu passeio de lancha.' },
  { icon: IceCreamCone, title: 'Guloseimas e biscoitos', desc: 'Variedade irresistível de snacks e doces para agradar todos os gostos.' },
  { icon: ShoppingBag, title: 'Bebidas não alcoólicas', desc: 'Sucos, refrigerantes, águas e isotônicos para toda a família.' },
];

const CONV_IMAGES = [
  { src: '/images/conveniencia-01.jpg', alt: 'Conveniência Prize' },
  { src: '/images/conveniencia-02.jpg', alt: 'Variedade de produtos' },
  { src: '/images/kit-churrasco-01.jpg', alt: 'Kit Churrasco' },
  { src: '/images/kit-churrasco-02.jpg', alt: 'Carnes selecionadas' },
  { src: '/images/kit-churrasco-03.jpg', alt: 'Churrasco completo' },
];

export default function LifestylePage() {
  return (
    <main className="min-h-screen pb-mobile-bar">
      <Header />

      {/* Hero Banner */}
      <section className="relative h-[50vh] sm:h-[55vh] flex items-center justify-center overflow-hidden">
        <Image src="/images/conveniencia-01.jpg" alt="Conveniência Prize Club" fill className="object-cover" priority />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0D1B2A]/80 via-[#0D1B2A]/50 to-[#0D1B2A]" />
        <div className="relative z-10 text-center px-4 max-w-4xl">
          <FadeIn>
            <p className="text-sm font-bold tracking-[0.2em] uppercase text-primary-400 mb-4">Conveniência</p>
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black text-white leading-tight mb-5">
              A conveniência mais completa de <span className="text-gradient">Cabo Frio</span>
            </h1>
            <p className="text-lg sm:text-xl text-white/60 max-w-2xl mx-auto">
              Tudo que você precisa para curtir o melhor do mar e da marina — cervejas geladas, kits churrasco, destilados e muito mais.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* Description + Products */}
      <section className="py-14 sm:py-20 bg-secondary-950">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn className="text-center mb-10">
            <p className="text-sm font-bold tracking-[0.2em] uppercase text-primary-400 mb-3">O Que Oferecemos</p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-foreground leading-tight mb-5">
              Sua cerveja gelada e <span className="text-gradient">muito mais</span>
            </h2>
            <p className="text-base sm:text-lg text-foreground/50 max-w-3xl mx-auto">
              Nossa conveniência oferece uma ampla seleção de produtos de qualidade. Se você está planejando um passeio de lancha, uma excelente dica é garantir o kit churrasco completo, além de outros itens para seu churrasco.
            </p>
          </FadeIn>

          <StaggerContainer className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4 mb-12" stagger={0.08}>
            {PRODUCTS.map((p, i) => (
              <StaggerItem key={i}>
                <div className="bg-secondary-900/60 border border-foreground/5 rounded-xl sm:rounded-2xl p-3 sm:p-6 h-full hover:border-primary-500/30 transition-colors">
                  <div className="w-8 h-8 sm:w-12 sm:h-12 bg-primary-500/10 rounded-lg sm:rounded-xl flex items-center justify-center mb-2 sm:mb-4">
                    <p.icon className="w-4 h-4 sm:w-6 sm:h-6 text-primary-400" />
                  </div>
                  <h3 className="text-foreground font-bold text-xs sm:text-base mb-1 sm:mb-2">{p.title}</h3>
                  <p className="text-foreground/40 text-[10px] sm:text-sm leading-relaxed">{p.desc}</p>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>

          {/* Kit Churrasco highlight */}
          <FadeIn>
            <div className="bg-secondary-900/80 border border-foreground/5 rounded-2xl p-7 sm:p-8 mb-12">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <div>
                  <h3 className="text-2xl sm:text-3xl font-black text-foreground mb-4">
                    Kit Churrasco <span className="text-gradient">Prize Club</span>
                  </h3>
                  <p className="text-foreground/50 leading-relaxed mb-6">
                    Planejando um passeio de lancha? Garanta nosso kit churrasco completo! Carnes selecionadas, acompanhamentos e tudo o que você precisa para um churrasco perfeito no mar. Disponível sob encomenda na nossa conveniência.
                  </p>
                  <a
                    href="https://wa.me/5522981385662?text=Quero%20encomendar%20um%20kit%20churrasco"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-primary-500 text-white font-bold rounded-xl hover:bg-primary-400 transition-all text-sm"
                  >
                    Encomendar Kit Churrasco
                  </a>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="relative aspect-square rounded-xl overflow-hidden">
                    <Image src="/images/kit-churrasco-01.jpg" alt="Kit Churrasco 1" fill className="object-cover" sizes="120px" />
                  </div>
                  <div className="relative aspect-square rounded-xl overflow-hidden">
                    <Image src="/images/kit-churrasco-02.jpg" alt="Kit Churrasco 2" fill className="object-cover" sizes="120px" />
                  </div>
                  <div className="relative aspect-square rounded-xl overflow-hidden">
                    <Image src="/images/kit-churrasco-03.jpg" alt="Kit Churrasco 3" fill className="object-cover" sizes="120px" />
                  </div>
                </div>
              </div>
            </div>
          </FadeIn>

          {/* Gallery */}
          <FadeIn className="text-center mb-6">
            <h3 className="text-2xl sm:text-3xl font-black text-foreground">
              Conheça a <span className="text-gradient">conveniência</span>
            </h3>
          </FadeIn>
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <FadeIn className="relative aspect-[3/4] rounded-2xl overflow-hidden col-span-2 sm:col-span-1">
              <Image src="/images/conveniencia-01.jpg" alt="Conveniência Prize" fill className="object-cover" sizes="(max-width: 640px) 100vw, 50vw" />
            </FadeIn>
            <FadeIn delay={0.1} className="relative aspect-[3/4] rounded-2xl overflow-hidden col-span-2 sm:col-span-1">
              <Image src="/images/conveniencia-02.jpg" alt="Produtos variados" fill className="object-cover" sizes="(max-width: 640px) 100vw, 50vw" />
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Carousel */}
      <WaveDivider topColor="rgb(var(--c-s-950))" bottomColor="rgb(var(--c-s-950))" />
      <StoryLifestyle />

      <MapSection />
      <Footer />
      <MobileBottomBar />
    </main>
  );
}
