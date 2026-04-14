'use client';

import { useEffect, useRef, useState } from 'react';
import { Shield, Wrench, Clock, MapPin } from 'lucide-react';
import Image from 'next/image';
import WaveDivider from './WaveDivider';

const IMAGES = [
  { src: 'https://marinaprizeclub.com.br/wp-content/uploads/2024/10/Guardaria-02-800x1000.jpg', alt: 'Guardaria 02' },
  { src: 'https://marinaprizeclub.com.br/wp-content/uploads/2024/10/Guardaria-03-800x1000.jpg', alt: 'Guardaria 03' },
  { src: 'https://marinaprizeclub.com.br/wp-content/uploads/2024/10/Prize-07-800x1000.jpg', alt: 'Prize 07' },
  { src: 'https://marinaprizeclub.com.br/wp-content/uploads/2024/10/Prize-01-800x1000.jpg', alt: 'Prize 01' },
];

const FEATURES = [
  { icon: Shield, title: 'Segurança 24h', desc: 'Monitoramento e proteção completa' },
  { icon: Wrench, title: 'Manutenção', desc: 'Cuidados preventivos e corretivos' },
  { icon: Clock, title: 'Acesso Flexível', desc: 'Agendamento digital simplificado' },
  { icon: MapPin, title: 'Localização Prime', desc: 'Acesso direto ao mar em Cabo Frio' },
];

export default function GuardariaSection() {
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
    <section id="guardaria" ref={ref} className="py-16 sm:py-24 bg-gray-50 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`text-center mb-10 sm:mb-16 transition-all duration-500 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-secondary-900 mb-3 sm:mb-4">
            Guardaria de <span className="text-gradient">Jet Ski</span>
          </h2>
          <p className="text-base sm:text-lg text-gray-500 max-w-xl mx-auto">
            Proteção e cuidado profissional para seu equipamento, com a melhor infraestrutura da região.
          </p>
        </div>

        {/* Features - horizontal scroll on mobile */}
        <div className={`flex gap-3 overflow-x-auto pb-4 sm:pb-0 sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:gap-4 mb-10 sm:mb-16 scrollbar-hide transition-all duration-500 delay-100 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="flex-shrink-0 w-[220px] sm:w-auto bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group"
            >
              <div className="w-12 h-12 bg-primary-50 rounded-2xl flex items-center justify-center mb-3 group-hover:bg-primary-100 transition-colors duration-200">
                <f.icon className="w-6 h-6 text-primary-500" />
              </div>
              <h3 className="text-base font-bold text-secondary-900 mb-1">{f.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* Image gallery - mobile scroll, desktop grid */}
        <div className={`flex gap-3 overflow-x-auto pb-4 sm:pb-0 sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:gap-4 scrollbar-hide snap-x snap-mandatory transition-all duration-500 delay-200 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          {IMAGES.map((img) => (
            <div
              key={img.alt}
              className="flex-shrink-0 w-[220px] sm:w-auto snap-start relative rounded-2xl overflow-hidden group"
            >
              <Image
                src={img.src}
                alt={img.alt}
                width={400}
                height={500}
                className="w-full h-64 sm:h-72 object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-secondary-900/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
          ))}
        </div>

        <div className={`text-center mt-8 sm:mt-10 transition-all duration-500 delay-300 ${visible ? 'opacity-100' : 'opacity-0'}`}>
          <a
            href="https://wa.me/5522981581555"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-8 py-4 bg-secondary-900 text-white font-bold rounded-2xl hover:bg-secondary-800 transition-all shadow-lg hover:-translate-y-0.5 active:scale-[0.98]"
          >
            Saiba Mais Sobre Guardaria
          </a>
        </div>
      </div>

      {/* Wave divider */}
      <div className="absolute -bottom-1 left-0 right-0">
        <WaveDivider topColor="#0D1B2A" bottomColor="#070E17" />
      </div>
    </section>
  );
}
