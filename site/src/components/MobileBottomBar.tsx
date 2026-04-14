'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTheme } from './ThemeProvider';

export default function MobileBottomBar() {
  const [visible, setVisible] = useState(false);
  const { theme } = useTheme();

  useEffect(() => {
    const handleScroll = () => setVisible(window.scrollY > 400);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isDark = theme === 'dark';

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-40 lg:hidden transition-all duration-300 ${
        visible ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
      }`}
    >
      <div className={`backdrop-blur-xl shadow-[0_-2px_16px_rgba(0,0,0,0.06)] px-4 pt-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom,0.625rem))] ${
        isDark
          ? 'bg-secondary-900/95 border-t border-white/10'
          : 'bg-white/95 border-t border-gray-100'
      }`}>
        <div className="flex gap-2.5">
          <a
            href="https://wa.me/5522981581555"
            target="_blank"
            rel="noopener noreferrer"
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold rounded-xl transition-colors active:scale-[0.97] ${
              isDark
                ? 'text-white border border-white/20 hover:bg-white/[0.06]'
                : 'text-gray-900 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492a.5.5 0 00.613.613l4.458-1.495A11.943 11.943 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-2.387 0-4.593-.826-6.338-2.21l-.146-.116-3.102 1.04 1.04-3.102-.116-.146A9.935 9.935 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>
            WhatsApp
          </a>
          <Link
            href="/cadastro"
            className="flex-[2] flex items-center justify-center gap-2 py-3 text-sm font-bold text-white bg-primary-500 rounded-xl hover:bg-primary-400 transition-colors shadow-md shadow-primary-500/20 active:scale-[0.97]"
          >
            Venha Ser Prize!
          </Link>
        </div>
      </div>
    </div>
  );
}
