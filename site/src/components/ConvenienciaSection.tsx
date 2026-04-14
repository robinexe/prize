'use client';

import { useEffect, useRef, useState } from 'react';
import { ShoppingBag, Clock, Package, ArrowRight } from 'lucide-react';
import Image from 'next/image';
import WaveDivider from './WaveDivider';

const FEATURES = [
  { icon: Clock, title: 'Horário Flexível', desc: 'Seg-Sex 09h às 18h | Sáb-Dom 09h às 20h' },
  { icon: ShoppingBag, title: 'Bebidas Geladas', desc: 'Ampla seleção de bebidas e petiscos' },
  { icon: Package, title: 'Kit Churrasco', desc: 'Tudo pronto para seu passeio de lancha' },
];

export default function ConvenienciaSection() {
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
    <section id="conveniencia" ref={ref} className="py-16 sm:py-24 bg-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Mobile: stacked, Desktop: side by side */}
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          {/* Content first on mobile for better hierarchy */}
          <div className={`order-2 lg:order-1 transition-all duration-500 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
            <span className="inline-block px-4 py-1.5 bg-primary-50 text-primary-600 text-xs font-bold rounded-full mb-4 tracking-wide uppercase">
              Conveniência
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-secondary-900 mb-3 sm:mb-4">
              Tudo que Você <span className="text-gradient">Precisa</span>
            </h2>
            <p className="text-base text-gray-500 leading-relaxed mb-6 sm:mb-8">
              Ampla seleção de produtos de qualidade. Bebidas geladas, petiscos e o kit churrasco perfeito para seu passeio.
            </p>

            <div className="space-y-4 mb-6 sm:mb-8">
              {FEATURES.map(item => (
                <div key={item.title} className="flex items-start gap-4 group">
                  <div className="w-11 h-11 bg-primary-50 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-primary-100 transition-colors duration-200">
                    <item.icon className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-secondary-900 text-sm">{item.title}</h4>
                    <p className="text-sm text-gray-500">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <a
              href="https://wa.me/5522981581555"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3.5 bg-secondary-900 text-white font-semibold rounded-2xl hover:bg-secondary-800 transition-all active:scale-[0.98]"
            >
              Saiba Mais
              <ArrowRight size={16} />
            </a>
          </div>

          {/* Images */}
          <div className={`order-1 lg:order-2 transition-all duration-500 delay-100 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
            <div className="grid grid-cols-1 gap-3">
              <div className="relative rounded-2xl overflow-hidden shadow-lg">
                <Image
                  src="https://marinaprizeclub.com.br/wp-content/uploads/2024/10/Conveniencia-01-1000x625.jpg"
                  alt="Conveniência 01"
                  width={600}
                  height={375}
                  className="w-full h-48 sm:h-64 object-cover hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="relative rounded-2xl overflow-hidden shadow-lg">
                <Image
                  src="https://marinaprizeclub.com.br/wp-content/uploads/2024/10/Conveniencia-02-1000x625.jpg"
                  alt="Conveniência 02"
                  width={600}
                  height={375}
                  className="w-full h-48 sm:h-64 object-cover hover:scale-105 transition-transform duration-500"
                />
              </div>
            </div>
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
