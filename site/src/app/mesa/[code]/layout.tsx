import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Mesa | Prize Club Gastrobar',
  description: 'Faça seu pedido diretamente da mesa. Prize Club Gastrobar.',
};

export default function MesaLayout({ children }: { children: React.ReactNode }) {
  return children;
}
