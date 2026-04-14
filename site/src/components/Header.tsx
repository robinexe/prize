'use client';

import { useState, useEffect } from 'react';
import { Menu, X, LogIn, UserPlus, Sun, Moon } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useTheme } from './ThemeProvider';

const NAV_LINKS = [
  { label: 'Início', href: '/' },
  { label: 'Experiência', href: '/experiencia' },
  { label: 'Estrutura', href: '/estrutura' },
  { label: 'Gastronomia', href: '/gastronomia' },
  { label: 'Lifestyle', href: '/lifestyle' },
  { label: 'Cotas', href: '/cotas' },
  { label: 'FAQ', href: '/faq' },
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Lock body scroll when menu is open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  // At top of page (hero zone) → always use dark-style header
  const atHero = !scrolled;

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          atHero
            ? 'bg-transparent py-4 sm:py-5'
            : 'backdrop-blur-xl shadow-2xl py-2.5 ' +
              (theme === 'dark'
                ? 'bg-secondary-900/95 shadow-black/10'
                : 'bg-white/95 shadow-black/5')
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center relative z-50">
              <Image
                src="/logo.png"
                alt="Prize Club"
                width={140}
                height={48}
                className={`h-8 sm:h-10 w-auto transition-all duration-300 ${
                  atHero || theme === 'dark' ? 'brightness-0 invert' : ''
                }`}
                priority
              />
            </Link>

            {/* Desktop nav */}
            <nav className="hidden lg:flex items-center gap-0.5">
              {NAV_LINKS.map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3.5 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                    atHero
                      ? 'text-white/70 hover:text-white hover:bg-white/[0.08]'
                      : 'text-foreground/60 hover:text-foreground hover:bg-foreground/[0.06]'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Desktop auth + theme toggle */}
            <div className="hidden lg:flex items-center gap-2.5">
              {/* Theme toggle */}
              <button
                onClick={toggleTheme}
                className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all duration-200 ${
                  atHero
                    ? 'text-white/50 hover:text-white hover:bg-white/[0.08]'
                    : 'text-foreground/50 hover:text-foreground hover:bg-foreground/[0.06]'
                }`}
                aria-label="Alternar tema"
              >
                {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
              </button>
              <Link
                href="/login"
                className={`flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200 ${
                  atHero
                    ? 'text-white/80 hover:text-white border border-white/20 hover:bg-white/[0.08] hover:border-white/30'
                    : 'text-foreground/80 hover:text-foreground border border-foreground/15 hover:bg-foreground/[0.06] hover:border-foreground/25'
                }`}
              >
                <LogIn size={15} />
                Entrar
              </Link>
              <Link
                href="/cadastro"
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-primary-500 rounded-xl hover:bg-primary-400 transition-all duration-200 shadow-lg shadow-primary-500/25"
              >
                <UserPlus size={15} />
                Cadastrar
              </Link>
            </div>

            {/* Mobile menu button */}
            <div className="flex lg:hidden items-center gap-1.5">
              <button
                onClick={toggleTheme}
                className={`p-2 rounded-xl transition-colors relative z-50 ${
                  atHero
                    ? 'text-white/60 hover:bg-white/[0.08]'
                    : 'text-foreground/60 hover:bg-foreground/[0.06]'
                }`}
                aria-label="Alternar tema"
              >
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className={`p-2 rounded-xl transition-colors relative z-50 ${
                  atHero
                    ? 'text-white hover:bg-white/[0.08]'
                    : 'text-foreground hover:bg-foreground/[0.06]'
                }`}
                aria-label="Menu"
              >
                {menuOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile fullscreen menu */}
      <div
        className={`fixed inset-0 z-40 lg:hidden transition-[opacity,visibility] duration-300 ${
          menuOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
        }`}
      >
        <div className="absolute inset-0 bg-[#0d1b2a]" />
        <div className="relative h-full flex flex-col justify-center px-6">
          <nav className="space-y-1 mb-8">
            {NAV_LINKS.map((link, i) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className={`block px-4 py-4 text-xl text-white/70 hover:text-white hover:bg-white/[0.04] rounded-2xl transition-[opacity,transform] duration-200 font-semibold ${
                  menuOpen ? 'translate-x-0 opacity-100' : '-translate-x-8 opacity-0'
                }`}
                style={{ transitionDelay: menuOpen ? `${i * 30}ms` : '0ms' }}
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="space-y-3 px-4">
            <Link
              href="/login"
              className="flex items-center justify-center gap-2 w-full py-4 text-base font-semibold text-white border border-white/20 rounded-2xl hover:bg-white/[0.06] transition-all"
              onClick={() => setMenuOpen(false)}
            >
              <LogIn size={18} />
              Entrar
            </Link>
            <Link
              href="/cadastro"
              className="flex items-center justify-center gap-2 w-full py-4 text-base font-semibold text-white bg-primary-500 rounded-2xl hover:bg-primary-400 transition-all shadow-lg"
              onClick={() => setMenuOpen(false)}
            >
              <UserPlus size={18} />
              Cadastrar
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
