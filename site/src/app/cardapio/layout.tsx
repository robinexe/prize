import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cardápio | Prize Club Gastrobar',
  description: 'Conheça o cardápio completo do Gastrobar Prize Club. Pratos, drinks, cervejas e muito mais em Cabo Frio, RJ.',
  openGraph: {
    title: 'Cardápio Digital | Prize Club Gastrobar',
    description: 'O melhor da gastronomia à beira-mar. Confira nosso cardápio completo.',
    type: 'website',
  },
};

export default function CardapioLayout({ children }: { children: React.ReactNode }) {
  return children;
}
