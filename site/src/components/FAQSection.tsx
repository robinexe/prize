'use client';

import { useState } from 'react';
import { ChevronDown, MessageCircle } from 'lucide-react';
import { FadeIn, StaggerContainer, StaggerItem } from './motion';

const FAQS = [
  {
    q: 'Quais os dias e horários de funcionamento?',
    a: 'Nossa Marina funciona todos os dias, das 09h às 18h. Já o Gastrobar, todas as quintas e sextas das 11h às 18h e sábados e domingos das 11h às 20h.',
  },
  {
    q: 'Quais os pontos de referência da localização?',
    a: 'A Prize Club está localizada a 4,3 km da Ilha do Japonês e a 5 km do Teatro Municipal. Estamos a 5,1 km do Museu do Surf, a 5,6 km da Praça das Águas e a 6,4 km do Estádio Municipal Alair Correia. O Parque das Dunas fica a 6,5 km e a Praça da Independência a 17 km.',
  },
  {
    q: 'Posso levar crianças e animais de estimação?',
    a: 'Claro! A Marina Prize é o destino perfeito para toda a família, com um espaço seguro e divertido para os pequenos enquanto você relaxa e aproveita a boa gastronomia do nosso restaurante. Nossa instalação é pet friendly.',
  },
  {
    q: 'Quais os telefones de contato da Prize?',
    a: 'Nosso número: (22) 98158-1555. Você pode entrar em contato pelo WhatsApp ou ligação.',
  },
  {
    q: 'A Prize Club é aberta ao público?',
    a: 'Sim! Na Prize todos são bem vindos! É só chegar e aproveitar o restaurante, o bar, a área kids e tudo que a Marina proporciona. Esperamos por vocês aqui na Prize!',
  },
  {
    q: 'Como funciona o sistema de cotas?',
    a: 'Vendemos cotas de jet ski para grupos de 6 ou 8 cotistas. Cada cotista utiliza a embarcação em horários agendados pelo sistema digital, com manutenção e guardaria inclusas. Não há limitação de uso.',
  },
  {
    q: 'Como faço para me cadastrar como cotista?',
    a: 'Cadastre-se diretamente pelo nosso site clicando em "Cadastrar" ou entre em contato pelo WhatsApp. Nossa equipe finalizará sua adesão rapidamente.',
  },
];

export default function FAQSection() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section id="faq" className="py-14 sm:py-20 bg-secondary-800">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeIn className="text-center mb-10 sm:mb-12">
          <p className="text-sm font-bold tracking-[0.2em] uppercase text-primary-500 mb-3">Tire Suas Dúvidas</p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-foreground">
            Perguntas <span className="text-gradient">Frequentes</span>
          </h2>
        </FadeIn>

        <StaggerContainer className="space-y-2 sm:space-y-3" stagger={0.06}>
          {FAQS.map((faq, i) => (
            <StaggerItem key={i}>
              <div className={`bg-foreground/[0.04] rounded-2xl border transition-all duration-200 ${
                open === i ? 'border-primary-200 shadow-md shadow-primary-500/5' : 'border-foreground/[0.06] shadow-sm'
              }`}>
                <button
                  onClick={() => setOpen(open === i ? null : i)}
                  className="w-full flex items-center justify-between p-4 sm:p-5 text-left gap-4"
                >
                  <span className="text-sm sm:text-base font-semibold text-foreground">{faq.q}</span>
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
                    open === i ? 'bg-primary-500 rotate-180' : 'bg-foreground/10'
                  }`}>
                    <ChevronDown className={`w-4 h-4 transition-colors ${open === i ? 'text-white' : 'text-foreground/50'}`} />
                  </div>
                </button>
                <div className={`overflow-hidden transition-all duration-300 ${
                  open === i ? 'max-h-60 opacity-100' : 'max-h-0 opacity-0'
                }`}>
                  <p className="px-4 sm:px-5 pb-4 sm:pb-5 text-sm text-foreground/50 leading-relaxed">{faq.a}</p>
                </div>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>

        <FadeIn delay={0.3} className="mt-8 sm:mt-10 text-center">
          <p className="text-sm text-foreground/40 mb-4">Não encontrou o que procura?</p>
          <a
            href="https://wa.me/5522981581555"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3.5 bg-primary-500 text-white font-semibold rounded-2xl hover:bg-primary-400 transition-all active:scale-[0.98]"
          >
            <MessageCircle size={18} />
            Fale Conosco
          </a>
        </FadeIn>
      </div>
    </section>
  );
}
