import './globals.css';
import type { Metadata } from 'next';
import { LayoutShell } from '@/components/layout/LayoutShell';
import { ThemeProvider } from '@/contexts/theme';

export const metadata: Metadata = {
  title: 'Prize Clube — Admin',
  description: 'Painel administrativo da marina Prize Clube',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="dark" suppressHydrationWarning>
      <body className="min-h-screen bg-th-surface text-th">
        <ThemeProvider>
          <LayoutShell>{children}</LayoutShell>
        </ThemeProvider>
      </body>
    </html>
  );
}
