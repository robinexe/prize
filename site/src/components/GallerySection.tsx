'use client';

import { useState } from 'react';
import Image from 'next/image';
import { FadeIn } from './motion';
import Lightbox from './Lightbox';

const ALL_IMAGES = [
  { src: '/images/prize-08.jpg', alt: 'Jet Ski na marina', category: 'adrenalina' },
  { src: '/images/prize-07.jpg', alt: 'Estrutura Prize Club', category: 'estrutura' },
  { src: '/images/prize-01.jpg', alt: 'Marina Prize Club', category: 'estrutura' },
  { src: '/images/guardaria-01.jpg', alt: 'Guardaria coberta', category: 'estrutura' },
  { src: '/images/guardaria-02.jpg', alt: 'Guardaria premium', category: 'estrutura' },
  { src: '/images/guardaria-03.jpg', alt: 'Proteção jet ski', category: 'estrutura' },
  { src: '/images/gastro-01.jpg', alt: 'Gastrobar Prize', category: 'gastronomia' },
  { src: '/images/gastro-04.jpg', alt: 'Pratos especiais', category: 'gastronomia' },
  { src: '/images/gastro-05.jpg', alt: 'Ambiente do bar', category: 'gastronomia' },
  { src: '/images/transicao.jpg', alt: 'Pôr do sol na marina', category: 'lifestyle' },
  { src: '/images/conveniencia-01.jpg', alt: 'Conveniência', category: 'lifestyle' },
  { src: '/images/post-todos-os-dias.jpg', alt: 'Funcionamento diário', category: 'lifestyle' },
];

export default function GallerySection() {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  return (
    <section className="py-20 sm:py-32 bg-secondary-900 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-primary-500/5 via-transparent to-transparent" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeIn className="text-center mb-12 sm:mb-16">
          <p className="text-sm font-bold tracking-[0.2em] uppercase text-primary-400 mb-3">Viva a Prize</p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-tight">
            Uma experiência que{' '}
            <span className="text-gradient">você precisa viver</span>
          </h2>
        </FadeIn>

        {/* Masonry gallery */}
        <FadeIn>
          <div className="columns-2 md:columns-3 lg:columns-4 gap-3 space-y-3">
            {ALL_IMAGES.map((img, i) => (
              <button
                key={i}
                onClick={() => setLightboxIndex(i)}
                className="group relative w-full rounded-2xl overflow-hidden cursor-pointer break-inside-avoid block"
              >
                <Image
                  src={img.src}
                  alt={img.alt}
                  width={400}
                  height={i % 3 === 0 ? 500 : i % 3 === 1 ? 300 : 400}
                  className="w-full h-auto object-cover transition-all duration-500 group-hover:scale-[1.03] group-hover:brightness-110"
                  sizes="(max-width: 768px) 50vw, 25vw"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300 flex items-end">
                  <div className="p-3 sm:p-4 w-full translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                    <p className="text-white text-xs font-medium">{img.alt}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </FadeIn>

        {/* CTA */}
        <FadeIn delay={0.2} className="text-center mt-12">
          <a
            href="https://wa.me/5522981581555?text=Quero%20conhecer%20a%20Prize%20Club!"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-8 py-4 bg-primary-500 text-white font-bold rounded-2xl hover:bg-primary-400 transition-all shadow-2xl shadow-primary-500/25 hover:-translate-y-0.5 active:scale-[0.98]"
          >
            Quero Conhecer a Prize!
          </a>
        </FadeIn>
      </div>

      {lightboxIndex !== null && (
        <Lightbox images={ALL_IMAGES} initialIndex={lightboxIndex} onClose={() => setLightboxIndex(null)} />
      )}
    </section>
  );
}
