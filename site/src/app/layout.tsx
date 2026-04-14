import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import ThemeProvider from '@/components/ThemeProvider';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '900'],
  display: 'swap',
  preload: true,
});

export const metadata: Metadata = {
  title: 'Marina Prize Club | Sua Aventura Náutica Começa Aqui',
  description: 'Marina Prize Club - Cotas de Jet Ski, Guardaria, Gastronomia e muito mais em Cabo Frio, RJ.',
  keywords: 'marina, jet ski, cotas, cabo frio, guardaria, gastronomia, náutica',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    viewportFit: 'cover',
  },
  openGraph: {
    title: 'Marina Prize Club',
    description: 'Sua Aventura Náutica Começa Aqui! A Prize Club tem a estrutura ideal para a sua diversão.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `
          try {
            const t = localStorage.getItem('prize-theme');
            if (t === 'dark') document.documentElement.classList.add('dark');
          } catch(e) {}
        `}} />
      </head>
      <body className={`${inter.className} antialiased bg-secondary-900 text-foreground transition-colors duration-300`}>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
