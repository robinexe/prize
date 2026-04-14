'use client';

import { useEffect, useRef, useState } from 'react';
import { Utensils, Wine, Baby } from 'lucide-react';
import Image from 'next/image';
import WaveDivider from './WaveDivider';

const IMAGES = [
  { src: 'https://marinaprizeclub.com.br/wp-content/uploads/2024/10/Gastro-01-844x1500.jpg', alt: 'Gastro 01' },
  { src: 'https://marinaprizeclub.com.br/wp-content/uploads/2024/10/Gastro-04-844x1500.jpg', alt: 'Gastro 04' },
  { src: 'https://marinaprizeclub.com.br/wp-content/uploads/2024/10/Gastro-03-844x1500.jpg', alt: 'Gastro 03' },
  { src: 'https://marinaprizeclub.com.br/wp-content/uploads/2024/10/Gastro-05-844x1500.jpg', alt: 'Gastro 05' },
  { src: 'https://marinaprizeclub.com.br/wp-content/uploads/2024/10/Gastro-02-844x1500.jpg', alt: 'Gastro 02' },
];

const FEATURES = [
  { icon: Utensils, title: 'Restaurante', desc: 'Petiscos e refeições para todos os gostos', tag: 'Almoço & Jantar' },
  { icon: Wine, title: 'Bar & Drinks', desc: 'Bebidas geladas e drinks exclusivos', tag: 'Happy Hour' },
  { icon: Baby, title: 'Área Kids', desc: 'Espaço seguro e divertido para crianças', tag: 'Família' },
];

export default function GastronomiaSection() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section id="gastronomia" ref={ref} className="py-16 sm:py-24 bg-secondary-900 relative overflow-hidden">
      {/* Subtle background texture */}
      <div className="absolute inset-0">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary-500/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-primary-500/5 rounded-full blur-[100px]" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`text-center mb-10 sm:mb-14 transition-all duration-500 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white mb-3 sm:mb-4">
            Sabores à <span className="text-gradient">Beira-Mar</span>
          </h2>
          <p className="text-base sm:text-lg text-white/50 max-w-xl mx-auto">
            Restaurante, bar e área kids — tudo em um espaço incrível com vista para o mar.
          </p>
        </div>

        {/* Feature cards */}
        <div className={`flex gap-3 overflow-x-auto pb-4 sm:pb-0 sm:grid sm:grid-cols-3 sm:gap-4 mb-10 sm:mb-14 scrollbar-hide transition-all duration-500 delay-100 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          {FEATURES.map(item => (
            <div key={item.title} className="flex-shrink-0 w-[260px] sm:w-auto glass rounded-2xl p-6 hover:bg-white/8 transition-all duration-200 group text-center">
              <div className="w-14 h-14 bg-primary-500/15 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-primary-500/25 transition-colors duration-200">
                <item.icon className="w-7 h-7 text-primary-400" />
              </div>
              <span className="inline-block px-2.5 py-0.5 bg-primary-500/10 text-primary-400 text-[10px] font-bold rounded-full mb-2 uppercase tracking-wide">{item.tag}</span>
              <h3 className="text-lg font-bold text-white mb-1">{item.title}</h3>
              <p className="text-sm text-white/40">{item.desc}</p>
            </div>
          ))}
        </div>

        {/* Image carousel */}
        <div className={`flex gap-3 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory transition-all duration-500 delay-200 ${visible ? 'opacity-100' : 'opacity-0'}`}>
          {IMAGES.map(img => (
            <div key={img.alt} className="flex-shrink-0 w-56 sm:w-64 snap-start">
              <div className="relative rounded-2xl overflow-hidden group">
                <Image
                  src={img.src}
                  alt={img.alt}
                  width={300}
                  height={500}
                  className="w-full h-80 sm:h-96 object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
              </div>
            </div>
          ))}
        </div>

        <div className={`text-center mt-8 sm:mt-10 transition-all duration-500 delay-300 ${visible ? 'opacity-100' : 'opacity-0'}`}>
          <a
            href="https://wa.me/5522981581555"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-8 py-4 bg-primary-500 text-white font-bold rounded-2xl hover:bg-primary-400 transition-all shadow-lg shadow-primary-500/30 hover:-translate-y-0.5 active:scale-[0.98]"
          >
            Reservar Mesa
          </a>
        </div>
      </div>

      {/* Wave divider */}
      <div className="absolute -bottom-1 left-0 right-0">
        <WaveDivider topColor="#0D1B2A" bottomColor="#ffffff" />
      </div>
    </section>
  );
}
