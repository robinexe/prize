'use client';

import { useState } from 'react';
import Image from 'next/image';
import { FadeIn, StaggerContainer, StaggerItem } from './motion';
import Lightbox from './Lightbox';

const CONV_IMAGES = [
  { src: '/images/conveniencia-01.jpg', alt: 'Conveniência Prize Club' },
  { src: '/images/conveniencia-02.jpg', alt: 'Produtos da conveniência' },
  { src: '/images/kit-churrasco-01.jpg', alt: 'Kit Churrasco 01' },
  { src: '/images/kit-churrasco-02.jpg', alt: 'Kit Churrasco 02' },
  { src: '/images/kit-churrasco-03.jpg', alt: 'Kit Churrasco 03' },
];

export default function SocialProofSection() {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  return (
    <section id="conveniencia" className="py-20 sm:py-32 bg-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Images - masonry */}
          <FadeIn direction="left">
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setLightboxIndex(0)} className="group relative col-span-2 aspect-video rounded-2xl overflow-hidden cursor-pointer">
                <Image src={CONV_IMAGES[0].src} alt={CONV_IMAGES[0].alt} fill className="object-cover transition-transform duration-500 group-hover:scale-105" sizes="(max-width: 768px) 100vw, 50vw" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300" />
              </button>
              {CONV_IMAGES.slice(1).map((img, i) => (
                <button key={i} onClick={() => setLightboxIndex(i + 1)} className="group relative aspect-square rounded-2xl overflow-hidden cursor-pointer">
                  <Image src={img.src} alt={img.alt} fill className="object-cover transition-transform duration-500 group-hover:scale-105" sizes="(max-width: 768px) 50vw, 25vw" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300" />
                </button>
              ))}
            </div>
          </FadeIn>

          {/* Text */}
          <FadeIn direction="right" delay={0.2}>
            <p className="text-sm font-bold tracking-[0.2em] uppercase text-primary-500 mb-4">Conveniência</p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-secondary-900 leading-tight mb-4">
              A conveniência mais completa de{' '}
              <span className="text-gradient">Cabo Frio</span>
            </h2>
            <p className="text-base text-gray-500 leading-relaxed mb-4">
              Nossa conveniência oferece uma ampla seleção de produtos de qualidade. Por aqui, você encontra cervejas sempre geladas, espumantes, vinhos, gin, vodka e muito mais. Também temos bebidas não alcoólicas e gelo filtrado.
            </p>
            <p className="text-base text-gray-500 leading-relaxed mb-4">
              Planejando um passeio de lancha? Garanta o kit churrasco completo, além de guloseimas e biscoitos para agradar todos os gostos.
            </p>
            <div className="bg-gray-50 rounded-2xl border border-gray-100 p-4 sm:p-5 mb-6">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Horário de Funcionamento</p>
              <p className="text-sm text-secondary-900 font-medium">Segunda a sexta: 09h às 18h</p>
              <p className="text-sm text-secondary-900 font-medium">Sábados e domingos: 09h às 20h</p>
            </div>
            <a
              href="https://wa.me/5522981385662"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-8 py-4 bg-primary-500 text-white font-bold rounded-2xl hover:bg-primary-400 transition-all shadow-lg hover:-translate-y-0.5 active:scale-[0.98]"
            >
              Venha Ser Prize Club!
            </a>
          </FadeIn>
        </div>
      </div>

      {lightboxIndex !== null && (
        <Lightbox images={CONV_IMAGES} initialIndex={lightboxIndex} onClose={() => setLightboxIndex(null)} />
      )}
    </section>
  );
}
