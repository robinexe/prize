'use client';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import WaveDivider from '@/components/WaveDivider';
import StoryGastronomia from '@/components/StoryGastronomia';
import MapSection from '@/components/MapSection';
import MobileBottomBar from '@/components/MobileBottomBar';
import { FadeIn } from '@/components/motion';
import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';

interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  image?: string;
}

interface MenuCategory {
  id: string;
  name: string;
  slug: string;
  items: MenuItem[];
}

const GASTRO_GALLERY = [
  { src: '/images/gastro-01.jpg', alt: 'Drinks exclusivos' },
  { src: '/images/gastro-02.jpg', alt: 'Pratos especiais' },
  { src: '/images/gastro-03.jpg', alt: 'Ambiente sofisticado' },
  { src: '/images/gastro-04.jpg', alt: 'Alta gastronomia' },
  { src: '/images/gastro-05.jpg', alt: 'Momentos especiais' },
];

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

export default function GastronomiaPage() {
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [activeCat, setActiveCat] = useState<string>('');
  const tabsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`${API_URL}/menu/public`)
      .then(r => r.json())
      .then((data: MenuCategory[]) => {
        setCategories(data);
        if (data.length > 0) setActiveCat(data[0].id);
      })
      .catch(() => {});
  }, []);

  const activeCategory = categories.find(c => c.id === activeCat);

  return (
    <main className="min-h-screen pb-mobile-bar">
      <Header />

      {/* Hero Banner */}
      <section className="relative h-[50vh] sm:h-[55vh] flex items-center justify-center overflow-hidden">
        <Image src="/images/transicao.jpg" alt="Gastrobar Prize Club" fill className="object-cover" priority />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0D1B2A]/80 via-[#0D1B2A]/50 to-[#0D1B2A]" />
        <div className="relative z-10 text-center px-4 max-w-4xl">
          <FadeIn>
            <p className="text-sm font-bold tracking-[0.2em] uppercase text-primary-400 mb-4">Gastrobar</p>
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black text-white leading-tight mb-5">
              Vem curtir aquele <span className="text-gradient">clima de fim de tarde</span>
            </h1>
            <p className="text-lg sm:text-xl text-white/60 max-w-2xl mx-auto">
              Alta gastronomia e um ambiente aconchegante, perfeito para desfrutar de sabores incríveis à beira-mar.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* About */}
      <section className="py-14 sm:py-20 bg-secondary-950">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center mb-12">
            <FadeIn>
              <p className="text-sm font-bold tracking-[0.2em] uppercase text-primary-400 mb-3">Sobre o Gastrobar</p>
              <h2 className="text-3xl sm:text-4xl font-black text-foreground leading-tight mb-5">
                Sabor e qualidade são <span className="text-gradient">nossa marca</span>
              </h2>
              <div className="space-y-4 text-foreground/50 leading-relaxed">
                <p>No Gastrobar da Prize Club, cada prato é preparado com carinho e ingredientes frescos, garantindo que sua experiência gastronômica seja única e memorável.</p>
                <p>Nosso gastrobar combina alta gastronomia e um ambiente aconchegante, perfeito para desfrutar de sabores incríveis à beira-mar.</p>
                <p>Além de uma seleção especial de pratos à la carte, nosso bar oferece drinks exclusivos que harmonizam perfeitamente com o clima descontraído e sofisticado da marina.</p>
              </div>
            </FadeIn>
            <FadeIn delay={0.2}>
              <div className="relative aspect-[4/3] rounded-2xl overflow-hidden">
                <Image src="/images/gastro-01.jpg" alt="Gastrobar" fill className="object-cover" sizes="(max-width: 1024px) 100vw, 50vw" />
              </div>
            </FadeIn>
          </div>

          {/* Programming Highlights */}
          <FadeIn className="mb-12">
            <div className="bg-secondary-900/80 border border-foreground/5 rounded-2xl p-8 sm:p-10">
              <h3 className="text-2xl sm:text-3xl font-black text-foreground mb-6 text-center">
                Destaques da nossa <span className="text-gradient">programação</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="bg-secondary-950/50 rounded-xl p-6 border border-foreground/5">
                  <div className="text-3xl mb-3">🍗</div>
                  <h4 className="text-foreground font-bold text-lg mb-2">Sábados</h4>
                  <p className="text-foreground/50">Delicioso galeto assado na brasa, uma especialidade imperdível da casa.</p>
                </div>
                <div className="bg-secondary-950/50 rounded-xl p-6 border border-foreground/5">
                  <div className="text-3xl mb-3">🫘</div>
                  <h4 className="text-foreground font-bold text-lg mb-2">Domingos</h4>
                  <p className="text-foreground/50">Tradicional feijoada a partir das 12h, perfeita para reunir amigos e família.</p>
                </div>
              </div>
            </div>
          </FadeIn>

          {/* Gallery */}
          <FadeIn className="mb-8">
            <p className="text-sm font-bold tracking-[0.2em] uppercase text-primary-400 mb-3 text-center">Galeria</p>
            <h3 className="text-2xl sm:text-3xl font-black text-foreground text-center mb-6">
              Conheça nossos <span className="text-gradient">pratos e ambiente</span>
            </h3>
          </FadeIn>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-8">
            {GASTRO_GALLERY.map((img, i) => (
              <FadeIn key={i} delay={i * 0.08}>
                <div className="relative aspect-[4/5] rounded-2xl overflow-hidden group">
                  <Image src={img.src} alt={img.alt} fill className="object-cover transition-transform duration-500 group-hover:scale-105" sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute bottom-3 left-3 bg-white/90 text-[#0D1B2A] text-xs font-bold px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">{img.alt}</div>
                </div>
              </FadeIn>
            ))}
          </div>

          {/* Digital Menu */}
          <FadeIn className="text-center mb-8">
            <p className="text-sm font-bold tracking-[0.2em] uppercase text-primary-400 mb-3">Cardápio</p>
            <h3 className="text-2xl sm:text-3xl font-black text-foreground mb-2">
              Conheça nosso <span className="text-gradient">cardápio completo</span>
            </h3>
            <p className="text-foreground/50 text-sm max-w-xl mx-auto mb-4">Navegue pelas categorias e descubra todas as nossas opções</p>
            <a
              href="/cardapio"
              className="inline-flex items-center gap-2 bg-primary-500 hover:bg-primary-400 text-white px-6 py-3 rounded-xl text-sm font-bold transition-all shadow-lg shadow-primary-500/25 hover:shadow-primary-500/40"
            >
              🍽️ Ver Cardápio Completo →
            </a>
          </FadeIn>

          {categories.length > 0 && (
            <FadeIn>
              {/* Category tabs */}
              <div ref={tabsRef} className="flex gap-2 overflow-x-auto pb-3 mb-6 scrollbar-hide">
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCat(cat.id)}
                    className={`whitespace-nowrap px-4 py-2 rounded-xl text-sm font-semibold transition-all shrink-0 ${
                      activeCat === cat.id
                        ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/25'
                        : 'bg-secondary-900/80 text-foreground/60 hover:text-foreground hover:bg-secondary-800/80'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>

              {/* Items grid */}
              {activeCategory && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {activeCategory.items.map(item => (
                    <div key={item.id} className="flex items-start gap-3 bg-secondary-900/50 border border-foreground/5 rounded-xl p-3 hover:border-primary-500/20 transition">
                      {item.image && (
                        <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden shrink-0">
                          <Image src={item.image} alt={item.name} fill className="object-cover" sizes="80px" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0 flex justify-between items-start gap-2">
                        <div>
                          <h4 className="font-bold text-foreground text-sm">{item.name}</h4>
                          {item.description && <p className="text-xs text-foreground/40 mt-0.5 line-clamp-2">{item.description}</p>}
                        </div>
                        <span className="text-primary-400 font-bold text-sm whitespace-nowrap">
                          R$ {item.price.toFixed(2).replace('.', ',')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </FadeIn>
          )}
        </div>
      </section>

      {/* Carousel */}
      <WaveDivider topColor="rgb(var(--c-s-950))" bottomColor="rgb(var(--c-s-900))" />
      <StoryGastronomia />

      <MapSection />
      <Footer />
      <MobileBottomBar />
    </main>
  );
}
