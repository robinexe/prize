'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, ArrowRight, Users, Shield, CalendarCheck, Wrench } from 'lucide-react';
import Image from 'next/image';
import WaveDivider from './WaveDivider';

const COTAS = [
  {
    img: 'https://marinaprizeclub.com.br/wp-content/uploads/2024/10/20241024-Cota-501-800x1000.jpeg',
    alt: 'Cota 501',
    label: 'Cota 501',
  },
  {
    img: 'https://marinaprizeclub.com.br/wp-content/uploads/2024/10/20241024-Cota-506-800x1000.jpeg',
    alt: 'Cota 506',
    label: 'Cota 506',
  },
  {
    img: 'https://marinaprizeclub.com.br/wp-content/uploads/2024/10/20241024-Cota-Novidade-800x1000.jpeg',
    alt: 'Novidade',
    label: 'Novidade',
  },
  {
    img: 'https://marinaprizeclub.com.br/wp-content/uploads/2024/10/20241024-Pre-Venda-800x1000.png',
    alt: 'Pré-venda',
    label: 'Pré-venda',
  },
];

const BENEFITS = [
  { icon: Users, text: 'Grupos de 6 ou 8 cotistas' },
  { icon: Wrench, text: 'Manutenção inclusa' },
  { icon: Shield, text: 'Seguro completo' },
  { icon: CalendarCheck, text: 'Agenda digital de reservas' },
];

export default function CotasSection() {
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
    <section id="cotas" ref={ref} className="py-16 sm:py-24 bg-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className={`text-center mb-10 sm:mb-16 transition-all duration-500 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-secondary-900 mb-3 sm:mb-4">
            Tenha Seu Próprio <span className="text-gradient">Jet Ski</span>
          </h2>
          <p className="text-base sm:text-lg text-gray-500 max-w-xl mx-auto leading-relaxed">
            Cotas de jet ski para grupos de 6 ou 8 cotistas, com toda estrutura e cuidado inclusos.
          </p>
        </div>

        {/* Benefits grid - mobile horizontal scroll, desktop grid */}
        <div className={`flex gap-3 overflow-x-auto pb-4 sm:pb-0 sm:grid sm:grid-cols-4 sm:gap-4 mb-10 sm:mb-16 scrollbar-hide transition-all duration-500 delay-100 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          {BENEFITS.map((b) => (
            <div key={b.text} className="flex-shrink-0 w-[200px] sm:w-auto bg-gray-50 rounded-2xl p-4 sm:p-5 flex items-center gap-3 hover:bg-primary-50 transition-colors duration-200 group">
              <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-primary-200 transition-colors">
                <b.icon className="w-5 h-5 text-primary-600" />
              </div>
              <span className="text-sm font-semibold text-secondary-900">{b.text}</span>
            </div>
          ))}
        </div>

        {/* Images - mobile horizontal scroll, desktop grid */}
        <div className={`flex gap-3 overflow-x-auto pb-4 sm:pb-0 sm:grid sm:grid-cols-4 sm:gap-4 mb-10 sm:mb-12 scrollbar-hide snap-x snap-mandatory transition-all duration-500 delay-200 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          {COTAS.map((cota, i) => (
            <div
              key={cota.alt}
              className="flex-shrink-0 w-[240px] sm:w-auto snap-start relative rounded-2xl overflow-hidden group cursor-pointer"
            >
              <Image
                src={cota.img}
                alt={cota.alt}
                width={400}
                height={500}
                className="w-full h-72 sm:h-80 object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-secondary-900/70 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-4 right-4">
                <span className="inline-block px-3 py-1 bg-primary-500/90 text-white text-xs font-bold rounded-lg">
                  {cota.label}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* CTA area */}
        <div className={`bg-gradient-to-r from-secondary-900 to-secondary-800 rounded-3xl p-6 sm:p-10 flex flex-col sm:flex-row items-center justify-between gap-6 transition-all duration-500 delay-300 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          <div>
            <h3 className="text-xl sm:text-2xl font-bold text-white mb-2 text-center sm:text-left">
              Vagas limitadas por embarcação
            </h3>
            <p className="text-white/60 text-sm sm:text-base text-center sm:text-left">
              Cada jet ski aceita apenas 6 a 8 cotistas. Garanta a sua vaga agora.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <a
              href="/cadastro"
              className="flex items-center justify-center gap-2 px-8 py-4 bg-primary-500 text-white font-bold rounded-2xl hover:bg-primary-400 transition-all shadow-lg shadow-primary-500/25 hover:-translate-y-0.5 active:scale-[0.98] whitespace-nowrap"
            >
              Quero Ser Cotista
              <ArrowRight size={18} />
            </a>
            <a
              href="https://wa.me/5521991656700"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 px-8 py-4 border border-white/20 text-white font-bold rounded-2xl hover:bg-white/8 transition-all whitespace-nowrap"
            >
              Tire Suas Dúvidas
            </a>
          </div>
        </div>
      </div>

      {/* Wave divider */}
      <div className="absolute -bottom-1 left-0 right-0">
        <WaveDivider topColor="#0D1B2A" bottomColor="#F9FAFB" />
      </div>
    </section>
  );
}
