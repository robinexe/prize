import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pedido | Prize Club Gastrobar',
  description: 'Faça seu pedido diretamente da mesa. Prize Club Gastrobar.',
};

export default function PedidoLayout({ children }: { children: React.ReactNode }) {
  return children;
}
