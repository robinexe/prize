'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { FadeIn } from './motion';
import Lightbox from './Lightbox';

const GASTRO_IMAGES = [
  { src: '/images/gastro-01.jpg', alt: 'Gastrobar Prize Club' },
  { src: '/images/gastro-02.jpg', alt: 'Drinks exclusivos' },
  { src: '/images/gastro-03.jpg', alt: 'Pratos especiais' },
  { src: '/images/gastro-04.jpg', alt: 'Alta gastronomia' },
  { src: '/images/gastro-05.jpg', alt: 'Ambiente do Gastrobar' },
];

export default function HowItWorksSection() {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <section id="gastronomia" className="py-20 sm:py-32 bg-gray-50 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeIn className="text-center mb-6 sm:mb-8">
          <p className="text-sm font-bold tracking-[0.2em] uppercase text-primary-500 mb-3">Gastrobar</p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-secondary-900 leading-tight mb-4">
            Vem curtir aquele clima de{' '}
            <span className="text-gradient">fim de tarde!</span>
          </h2>
        </FadeIn>

        <FadeIn delay={0.1} className="max-w-3xl mx-auto text-center mb-10 sm:mb-14">
          <p className="text-base text-gray-500 leading-relaxed mb-4">
            No Gastrobar da Prize Club, cada prato é preparado com carinho e ingredientes frescos, garantindo que sua experiência gastronômica seja única e memorável. Nosso gastrobar combina alta gastronomia e um ambiente aconchegante, perfeito para desfrutar de sabores incríveis à beira-mar.
          </p>
          <p className="text-base text-gray-500 leading-relaxed mb-4">
            Além de uma seleção especial de pratos à la carte, nosso bar oferece drinks exclusivos que harmonizam perfeitamente com o clima descontraído e sofisticado da marina.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center mt-6">
            <div className="bg-white rounded-2xl border border-gray-100 px-5 py-3 shadow-sm">
              <p className="text-xs text-gray-400 font-medium">Sábados</p>
              <p className="text-sm font-bold text-secondary-900">Galeto assado na brasa</p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 px-5 py-3 shadow-sm">
              <p className="text-xs text-gray-400 font-medium">Domingos</p>
              <p className="text-sm font-bold text-secondary-900">Feijoada a partir das 12h</p>
            </div>
          </div>
        </FadeIn>

        {/* Horizontal scroll carousel */}
        <FadeIn>
          <div
            ref={scrollRef}
            className="flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-4 -mx-4 px-4"
          >
            {GASTRO_IMAGES.map((img, i) => (
              <button
                key={i}
                onClick={() => setLightboxIndex(i)}
                className="group relative flex-shrink-0 w-[260px] sm:w-[300px] aspect-[3/5] rounded-2xl overflow-hidden snap-center cursor-pointer"
              >
                <Image src={img.src} alt={img.alt} fill className="object-cover transition-transform duration-500 group-hover:scale-105" sizes="300px" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </button>
            ))}
          </div>
        </FadeIn>

        {/* CTA */}
        <FadeIn delay={0.2} className="text-center mt-10">
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="https://www.hubt.com.br/Prizeclub"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-8 py-4 bg-primary-500 text-white font-bold rounded-2xl hover:bg-primary-400 transition-all shadow-lg hover:-translate-y-0.5 active:scale-[0.98]"
            >
              Nosso Cardápio Digital
            </a>
            <a
              href="https://wa.me/5522981581555"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-8 py-4 border-2 border-gray-200 text-secondary-900 font-bold rounded-2xl hover:bg-gray-100 transition-all hover:-translate-y-0.5 active:scale-[0.98]"
            >
              Reservar Mesa
            </a>
          </div>
        </FadeIn>
      </div>

      {lightboxIndex !== null && (
        <Lightbox images={GASTRO_IMAGES} initialIndex={lightboxIndex} onClose={() => setLightboxIndex(null)} />
      )}
    </section>
  );
}
