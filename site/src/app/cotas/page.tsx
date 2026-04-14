'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import MobileBottomBar from '@/components/MobileBottomBar';
import { FadeIn, StaggerContainer, StaggerItem } from '@/components/motion';
import Image from 'next/image';
import {
  Anchor, Shield, DollarSign, CalendarCheck, Users, Wrench, Smartphone,
  MessageCircle, ChevronRight, Loader2, SlidersHorizontal,
  ArrowUpDown, X, ChevronDown, Fuel, Users2, Gauge, Eye, MapPin,
  Volume2, VolumeX,
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';
const WHATSAPP_URL = 'https://wa.me/5522981581555';

interface BoatMarketplace {
  id: string;
  name: string;
  model: string;
  year: number;
  capacity: number;
  fuelType: string;
  fuelCapacity: number;
  totalShares: number;
  monthlyFee: number;
  shareValue: number;
  locationBerth: string | null;
  marketplaceDescription: string;
  imageUrl: string;
  availableShares: number;
  brand: string;
  hasSound?: boolean;
}

const BENEFITS = [
  { icon: DollarSign, title: 'Economia real', desc: 'Invista uma fração do valor e tenha acesso completo à embarcação.' },
  { icon: Wrench, title: '1/6 da manutenção', desc: 'O custo de manutenção é dividido entre todos os cotistas do grupo.' },
  { icon: Shield, title: 'Assistência total', desc: 'Resgate em caso de pane e suporte completo na água.' },
  { icon: CalendarCheck, title: 'Agenda flexível', desc: 'Reserve pelo app os dias que quiser, sem limitação de uso.' },
  { icon: Smartphone, title: 'Gestão pelo app', desc: 'Acompanhe tudo pelo aplicativo: reservas, faturas e manutenções.' },
  { icon: Users, title: 'Sistema justo', desc: 'Agendamento equilibrado que garante acesso igual para todos.' },
];



type SortOption = 'price-asc' | 'price-desc' | 'year-desc' | 'monthly-asc';

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'price-asc', label: 'Menor valor' },
  { value: 'price-desc', label: 'Maior valor' },
  { value: 'year-desc', label: 'Mais novo' },
  { value: 'monthly-asc', label: 'Menor mensalidade' },
];

function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function BoatCard({ boat, index, onSelect }: { boat: BoatMarketplace; index: number; onSelect: (b: BoatMarketplace) => void }) {
  return (
    <FadeIn delay={index * 0.08}>
      <div className="group bg-secondary-900/50 border border-foreground/[0.06] rounded-2xl overflow-hidden hover:border-primary-500/25 transition-all duration-500 hover:shadow-xl hover:shadow-primary-500/5 flex flex-col h-full">
        {/* Image */}
        <div className="relative aspect-[16/10] overflow-hidden cursor-pointer" onClick={() => onSelect(boat)}>
          <img
            src={`${API_URL}${boat.imageUrl}`}
            alt={boat.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
            <span className="bg-black/60 backdrop-blur-md text-white text-[10px] sm:text-xs font-bold px-2.5 py-1 rounded-lg border border-white/10">
              {boat.brand}
            </span>
            <span className="bg-primary-500/90 backdrop-blur-md text-white text-[10px] sm:text-xs font-bold px-2.5 py-1 rounded-lg">
              {boat.year}
            </span>
          </div>

          {/* Price overlay on image */}
          <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
            <div>
              <p className="text-white/50 text-[10px] uppercase tracking-wider font-medium">Cota a partir de</p>
              <p className="text-white font-black text-xl sm:text-2xl drop-shadow-lg">{formatCurrency(boat.shareValue)}</p>
            </div>
            <div className="text-right">
              <p className="text-white/50 text-[10px] uppercase tracking-wider font-medium">Mensal</p>
              <p className="text-white font-bold text-base sm:text-lg drop-shadow-lg">{formatCurrency(boat.monthlyFee)}</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 flex flex-col flex-1">
          {/* Title */}
          <div className="mb-3">
            <h3 className="text-lg sm:text-xl font-black text-foreground leading-tight">{boat.name}</h3>
            <p className="text-primary-400 font-semibold text-xs sm:text-sm">{boat.model}</p>
          </div>

          {/* Specs row */}
          <div className="flex items-center gap-3 sm:gap-4 mb-3 text-foreground/40">
            <div className="flex items-center gap-1">
              <Users2 size={13} />
              <span className="text-[11px] sm:text-xs">{boat.capacity} pessoas</span>
            </div>
            <div className="flex items-center gap-1">
              <Fuel size={13} />
              <span className="text-[11px] sm:text-xs">{boat.fuelCapacity}L</span>
            </div>
            <div className="flex items-center gap-1">
              <Gauge size={13} />
              <span className="text-[11px] sm:text-xs">{boat.fuelType === 'GASOLINE' ? 'Gasolina' : boat.fuelType}</span>
            </div>
            <div className={`flex items-center gap-1 ${boat.hasSound ? 'text-primary-400' : 'text-foreground/40'}`}>
              {boat.hasSound ? <Volume2 size={13} /> : <VolumeX size={13} />}
              <span className="text-[11px] sm:text-xs">{boat.hasSound ? 'Com som' : 'Sem som'}</span>
            </div>
          </div>

          {/* Description (truncated) */}
          {boat.marketplaceDescription && (
            <p className="text-foreground/40 text-xs sm:text-sm leading-relaxed line-clamp-2 mb-4">
              {boat.marketplaceDescription}
            </p>
          )}

          {/* Buttons */}
          <div className="mt-auto flex gap-2">
            <button
              onClick={() => onSelect(boat)}
              className="flex items-center justify-center gap-1.5 flex-1 py-3 sm:py-3.5 bg-foreground/[0.06] border border-foreground/[0.08] text-foreground font-semibold text-sm rounded-xl hover:bg-foreground/[0.1] hover:border-foreground/[0.15] transition-all"
            >
              <Eye size={16} />
              Ver detalhes
            </button>
            <a
              href={`${WHATSAPP_URL}?text=${encodeURIComponent(`Olá! Tenho interesse na cota do ${boat.name} (${boat.model} ${boat.year}). Gostaria de mais informações.`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 flex-1 py-3 sm:py-3.5 bg-[#25D366] text-white font-bold text-sm rounded-xl hover:bg-[#20BD5A] transition-all shadow-lg shadow-[#25D366]/15 hover:-translate-y-0.5 active:translate-y-0"
            >
              <MessageCircle size={16} />
              Tenho interesse
            </a>
          </div>
        </div>
      </div>
    </FadeIn>
  );
}

/* ─── Modal ─── */
function BoatModal({ boat, onClose }: { boat: BoatMarketplace; onClose: () => void }) {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', handleKey); };
  }, [onClose]);

  const descParagraphs = boat.marketplaceDescription
    ? boat.marketplaceDescription.split(/\n+/).filter(Boolean)
    : [];

  return (
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Modal content */}
      <div
        className="relative z-10 w-full sm:w-[95%] sm:max-w-2xl max-h-[92vh] sm:max-h-[88vh] bg-secondary-950 border border-foreground/[0.08] rounded-t-3xl sm:rounded-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom duration-300 sm:animate-in sm:zoom-in-95 sm:duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-20 w-8 h-8 flex items-center justify-center rounded-full bg-black/50 backdrop-blur-sm text-white/70 hover:text-white transition-colors"
        >
          <X size={18} />
        </button>

        {/* Drag indicator (mobile) */}
        <div className="sm:hidden flex justify-center pt-2 pb-1">
          <div className="w-10 h-1 rounded-full bg-foreground/20" />
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 overscroll-contain">
          {/* Image */}
          <div className="relative aspect-[16/9] sm:aspect-[16/8] overflow-hidden">
            <img
              src={`${API_URL}${boat.imageUrl}`}
              alt={boat.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-secondary-950 via-transparent to-transparent" />

            {/* Badges */}
            <div className="absolute top-4 left-4 flex gap-2">
              <span className="bg-black/60 backdrop-blur-md text-white text-xs font-bold px-3 py-1.5 rounded-lg border border-white/10">
                {boat.brand}
              </span>
              <span className="bg-primary-500/90 backdrop-blur-md text-white text-xs font-bold px-3 py-1.5 rounded-lg">
                {boat.year}
              </span>
            </div>
          </div>

          {/* Body */}
          <div className="px-5 sm:px-7 pb-6 -mt-6 relative z-10">
            {/* Title */}
            <h2 className="text-2xl sm:text-3xl font-black text-foreground leading-tight mb-1">{boat.name}</h2>
            <p className="text-primary-400 font-semibold text-sm sm:text-base mb-5">{boat.model}</p>

            {/* Price cards */}
            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="bg-foreground/[0.04] border border-foreground/[0.08] rounded-xl p-3.5 sm:p-4">
                <p className="text-foreground/40 text-[10px] uppercase tracking-wider font-medium mb-1">Valor da cota</p>
                <p className="text-foreground font-black text-xl sm:text-2xl">{formatCurrency(boat.shareValue)}</p>
              </div>
              <div className="bg-foreground/[0.04] border border-foreground/[0.08] rounded-xl p-3.5 sm:p-4">
                <p className="text-foreground/40 text-[10px] uppercase tracking-wider font-medium mb-1">Mensalidade</p>
                <p className="text-foreground font-black text-xl sm:text-2xl">{formatCurrency(boat.monthlyFee)}<span className="text-sm font-semibold text-foreground/40">/mês</span></p>
              </div>
            </div>

            {/* Specs grid */}
            <div className="grid grid-cols-4 gap-2 sm:gap-3 mb-5">
              <div className="bg-foreground/[0.03] border border-foreground/[0.06] rounded-xl p-3 text-center">
                <Users2 size={18} className="text-primary-400 mx-auto mb-1.5" />
                <p className="text-foreground font-bold text-sm">{boat.capacity}</p>
                <p className="text-foreground/35 text-[10px]">Pessoas</p>
              </div>
              <div className="bg-foreground/[0.03] border border-foreground/[0.06] rounded-xl p-3 text-center">
                <Fuel size={18} className="text-primary-400 mx-auto mb-1.5" />
                <p className="text-foreground font-bold text-sm">{boat.fuelCapacity}L</p>
                <p className="text-foreground/35 text-[10px]">Tanque</p>
              </div>
              <div className="bg-foreground/[0.03] border border-foreground/[0.06] rounded-xl p-3 text-center">
                <Gauge size={18} className="text-primary-400 mx-auto mb-1.5" />
                <p className="text-foreground font-bold text-sm">{boat.fuelType === 'GASOLINE' ? 'Gasolina' : boat.fuelType}</p>
                <p className="text-foreground/35 text-[10px]">Combustível</p>
              </div>
              <div className={`bg-foreground/[0.03] border rounded-xl p-3 text-center ${boat.hasSound ? 'border-primary-500/30' : 'border-foreground/[0.06]'}`}>
                {boat.hasSound ? <Volume2 size={18} className="text-primary-400 mx-auto mb-1.5" /> : <VolumeX size={18} className="text-foreground/30 mx-auto mb-1.5" />}
                <p className="text-foreground font-bold text-sm">{boat.hasSound ? 'Sim' : 'Não'}</p>
                <p className="text-foreground/35 text-[10px]">Som</p>
              </div>
            </div>

            {boat.locationBerth && (
              <div className="flex items-center gap-3 mb-5 bg-foreground/[0.03] border border-foreground/[0.06] rounded-xl p-3.5">
                <MapPin size={18} className="text-primary-400 shrink-0" />
                <div>
                  <p className="text-foreground font-semibold text-sm">Localização</p>
                  <p className="text-foreground/40 text-xs">{boat.locationBerth}</p>
                </div>
              </div>
            )}

            {/* Description */}
            {descParagraphs.length > 0 && (
              <div className="mb-6">
                <h3 className="text-foreground font-bold text-sm uppercase tracking-wider mb-3">Sobre a embarcação</h3>
                <div className="space-y-2.5">
                  {descParagraphs.map((p, i) => (
                    <p key={i} className="text-foreground/50 text-sm leading-relaxed">{p}</p>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Fixed CTA at bottom */}
        <div className="border-t border-foreground/[0.06] p-4 sm:px-7 bg-secondary-950/95 backdrop-blur-sm">
          <a
            href={`${WHATSAPP_URL}?text=${encodeURIComponent(`Olá! Tenho interesse na cota do ${boat.name} (${boat.model} ${boat.year}). Gostaria de mais informações.`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-3.5 sm:py-4 bg-[#25D366] text-white font-bold text-base rounded-xl hover:bg-[#20BD5A] transition-all shadow-lg shadow-[#25D366]/20 active:scale-[0.98]"
          >
            <MessageCircle size={20} />
            Tenho interesse nesta cota
          </a>
        </div>
      </div>
    </div>
  );
}

export default function CotasPage() {
  const [boats, setBoats] = useState<BoatMarketplace[]>([]);
  const [loading, setLoading] = useState(true);
  const [brandFilter, setBrandFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('price-asc');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedBoat, setSelectedBoat] = useState<BoatMarketplace | null>(null);

  const handleCloseModal = useCallback(() => setSelectedBoat(null), []);

  useEffect(() => {
    fetch(`${API_URL}/public/boats/marketplace`)
      .then((r) => r.json())
      .then((data) => setBoats(Array.isArray(data) ? data : []))
      .catch(() => setBoats([]))
      .finally(() => setLoading(false));
  }, []);

  const brands = useMemo(() => {
    const set = new Set(boats.map((b) => b.brand));
    return Array.from(set).sort();
  }, [boats]);

  const filteredBoats = useMemo(() => {
    let result = [...boats];
    if (brandFilter !== 'all') {
      result = result.filter((b) => b.brand === brandFilter);
    }
    switch (sortBy) {
      case 'price-asc': result.sort((a, b) => a.shareValue - b.shareValue); break;
      case 'price-desc': result.sort((a, b) => b.shareValue - a.shareValue); break;
      case 'year-desc': result.sort((a, b) => b.year - a.year); break;
      case 'monthly-asc': result.sort((a, b) => a.monthlyFee - b.monthlyFee); break;
    }
    return result;
  }, [boats, brandFilter, sortBy]);

  const activeFiltersCount = (brandFilter !== 'all' ? 1 : 0) + (sortBy !== 'price-asc' ? 1 : 0);

  return (
    <main className="min-h-screen pb-mobile-bar">
      <Header />

      {/* Hero — compact */}
      <section className="relative h-[45vh] sm:h-[50vh] flex items-center justify-center overflow-hidden">
        <Image src="/images/prize-07.jpg" alt="Compre sua cota" fill className="object-cover" priority />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0D1B2A]/80 via-[#0D1B2A]/50 to-[#0D1B2A]" />
        <div className="relative z-10 text-center px-4 max-w-4xl">
          <FadeIn>
            <p className="text-xs sm:text-sm font-bold tracking-[0.2em] uppercase text-primary-400 mb-3 sm:mb-4">Marketplace de Cotas</p>
            <h1 className="text-3xl sm:text-5xl lg:text-7xl font-black text-white leading-tight mb-4 sm:mb-5">
              Compre sua <span className="text-gradient">cota</span> e navegue
            </h1>
            <p className="text-base sm:text-xl text-white/60 max-w-2xl mx-auto mb-6 sm:mb-8">
              Tenha seu próprio jet ski por uma fração do valor. Sem preocupações com manutenção, vaga ou burocracia.
            </p>
            <a
              href="#marketplace"
              className="inline-flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-4 bg-primary-500 text-white font-bold rounded-2xl hover:bg-primary-400 transition-all shadow-2xl shadow-primary-500/25 hover:-translate-y-0.5 text-sm sm:text-base"
            >
              Ver embarcações
              <ChevronRight size={18} />
            </a>
          </FadeIn>
        </div>
      </section>

      {/* Stats */}
      <section className="py-8 sm:py-12 bg-secondary-950">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-3 gap-2 sm:gap-4">
            <FadeIn className="bg-secondary-900/80 border border-foreground/5 rounded-xl sm:rounded-2xl p-3 sm:p-6 text-center">
              <div className="text-2xl sm:text-5xl font-black text-primary-500 mb-1 sm:mb-2">1/6</div>
              <p className="text-foreground/70 text-[10px] sm:text-sm leading-tight">do valor total</p>
            </FadeIn>
            <FadeIn delay={0.1} className="bg-secondary-900/80 border border-foreground/5 rounded-xl sm:rounded-2xl p-3 sm:p-6 text-center">
              <div className="text-2xl sm:text-5xl font-black text-primary-500 mb-1 sm:mb-2">R$350</div>
              <p className="text-foreground/70 text-[10px] sm:text-sm leading-tight">mensalidade a partir de</p>
            </FadeIn>
            <FadeIn delay={0.2} className="bg-secondary-900/80 border border-foreground/5 rounded-xl sm:rounded-2xl p-3 sm:p-6 text-center">
              <div className="text-2xl sm:text-5xl font-black text-primary-500 mb-1 sm:mb-2">0%</div>
              <p className="text-foreground/70 text-[10px] sm:text-sm leading-tight">preocupação com manutenção</p>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Marketplace */}
      <section id="marketplace" className="py-10 sm:py-16 bg-secondary-900">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section header */}
          <FadeIn className="text-center mb-8 sm:mb-10">
            <p className="text-xs sm:text-sm font-bold tracking-[0.2em] uppercase text-primary-400 mb-2 sm:mb-3">Marketplace</p>
            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black text-foreground leading-tight mb-3 sm:mb-4">
              Embarcações <span className="text-gradient">disponíveis</span>
            </h2>
            <p className="text-sm sm:text-lg text-foreground/40 max-w-2xl mx-auto">
              Todas novas, com garantia de fábrica e manutenção inclusa.
            </p>
          </FadeIn>

          {/* Filter bar */}
          {!loading && boats.length > 0 && (
            <FadeIn className="mb-6 sm:mb-8">
              {/* Desktop filters */}
              <div className="hidden sm:flex items-center gap-3 flex-wrap">
                {/* Brand filter */}
                <div className="flex items-center gap-1.5 bg-foreground/[0.04] border border-foreground/[0.08] rounded-xl px-1 py-1">
                  <button
                    onClick={() => setBrandFilter('all')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      brandFilter === 'all'
                        ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/25'
                        : 'text-foreground/50 hover:text-foreground/80 hover:bg-foreground/5'
                    }`}
                  >
                    Todas
                  </button>
                  {brands.map((brand) => (
                    <button
                      key={brand}
                      onClick={() => setBrandFilter(brand)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        brandFilter === brand
                          ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/25'
                          : 'text-foreground/50 hover:text-foreground/80 hover:bg-foreground/5'
                      }`}
                    >
                      {brand}
                    </button>
                  ))}
                </div>

                {/* Sort */}
                <div className="relative ml-auto">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                    className="appearance-none bg-foreground/[0.04] border border-foreground/[0.08] rounded-xl px-4 py-2 pr-9 text-xs font-semibold text-foreground/70 cursor-pointer hover:border-foreground/15 transition-colors focus:outline-none focus:ring-1 focus:ring-primary-500/50"
                  >
                    {SORT_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value} className="bg-secondary-900 text-foreground">
                        {o.label}
                      </option>
                    ))}
                  </select>
                  <ArrowUpDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/40 pointer-events-none" />
                </div>
              </div>

              {/* Mobile filter toggle */}
              <div className="sm:hidden">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2 w-full bg-foreground/[0.04] border border-foreground/[0.08] rounded-xl px-4 py-3 text-sm font-semibold text-foreground/70"
                >
                  <SlidersHorizontal size={16} />
                  Filtros e ordenação
                  {activeFiltersCount > 0 && (
                    <span className="bg-primary-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                      {activeFiltersCount}
                    </span>
                  )}
                  <ChevronDown size={16} className={`ml-auto transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                </button>

                {showFilters && (
                  <div className="mt-3 space-y-3">
                    {/* Brand pills */}
                    <div>
                      <p className="text-foreground/30 text-[10px] uppercase tracking-wider font-bold mb-2 px-1">Marca</p>
                      <div className="flex flex-wrap gap-1.5">
                        <button
                          onClick={() => setBrandFilter('all')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                            brandFilter === 'all'
                              ? 'bg-primary-500 text-white'
                              : 'bg-foreground/[0.04] text-foreground/50 border border-foreground/[0.08]'
                          }`}
                        >
                          Todas
                        </button>
                        {brands.map((brand) => (
                          <button
                            key={brand}
                            onClick={() => setBrandFilter(brand)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                              brandFilter === brand
                                ? 'bg-primary-500 text-white'
                                : 'bg-foreground/[0.04] text-foreground/50 border border-foreground/[0.08]'
                            }`}
                          >
                            {brand}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Sort */}
                    <div>
                      <p className="text-foreground/30 text-[10px] uppercase tracking-wider font-bold mb-2 px-1">Ordenar por</p>
                      <div className="flex flex-wrap gap-1.5">
                        {SORT_OPTIONS.map((o) => (
                          <button
                            key={o.value}
                            onClick={() => setSortBy(o.value)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                              sortBy === o.value
                                ? 'bg-primary-500 text-white'
                                : 'bg-foreground/[0.04] text-foreground/50 border border-foreground/[0.08]'
                            }`}
                          >
                            {o.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Clear */}
                    {activeFiltersCount > 0 && (
                      <button
                        onClick={() => { setBrandFilter('all'); setSortBy('price-asc'); }}
                        className="flex items-center gap-1 text-xs text-foreground/30 hover:text-foreground/50 transition-colors px-1"
                      >
                        <X size={12} /> Limpar filtros
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Active filter tags (desktop) */}
              {activeFiltersCount > 0 && (
                <div className="hidden sm:flex items-center gap-2 mt-3">
                  {brandFilter !== 'all' && (
                    <span className="inline-flex items-center gap-1 bg-primary-500/10 border border-primary-500/20 text-primary-400 text-xs font-medium px-2.5 py-1 rounded-lg">
                      {brandFilter}
                      <button onClick={() => setBrandFilter('all')} className="hover:text-foreground transition-colors"><X size={12} /></button>
                    </span>
                  )}
                  <button
                    onClick={() => { setBrandFilter('all'); setSortBy('price-asc'); }}
                    className="text-xs text-foreground/30 hover:text-foreground/50 transition-colors"
                  >
                    Limpar tudo
                  </button>
                </div>
              )}
            </FadeIn>
          )}

          {/* Results count */}
          {!loading && boats.length > 0 && (
            <p className="text-foreground/25 text-xs mb-4 sm:mb-6">
              {filteredBoats.length} {filteredBoats.length === 1 ? 'embarcação encontrada' : 'embarcações encontradas'}
            </p>
          )}

          {/* Boat grid */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
            </div>
          ) : boats.length === 0 ? (
            <FadeIn className="text-center py-20">
              <Anchor className="w-12 h-12 text-foreground/15 mx-auto mb-4" />
              <p className="text-foreground/50 text-lg">Nenhuma embarcação disponível no momento.</p>
              <p className="text-foreground/30 text-sm mt-2">Entre em contato para saber sobre novas oportunidades.</p>
            </FadeIn>
          ) : filteredBoats.length === 0 ? (
            <FadeIn className="text-center py-16">
              <p className="text-foreground/50 text-base">Nenhum resultado para os filtros selecionados.</p>
              <button
                onClick={() => { setBrandFilter('all'); setSortBy('price-asc'); }}
                className="text-primary-400 text-sm mt-2 hover:text-primary-300 transition-colors"
              >
                Limpar filtros
              </button>
            </FadeIn>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {filteredBoats.map((boat, i) => (
                <BoatCard key={boat.id} boat={boat} index={i} onSelect={setSelectedBoat} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Benefits */}
      <section className="py-12 sm:py-20 bg-secondary-950">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn className="text-center mb-8 sm:mb-10">
            <p className="text-xs sm:text-sm font-bold tracking-[0.2em] uppercase text-primary-400 mb-2 sm:mb-3">Vantagens Exclusivas</p>
            <h2 className="text-2xl sm:text-4xl font-black text-foreground leading-tight mb-3 sm:mb-4">
              Por que comprar uma <span className="text-gradient">cota Prize?</span>
            </h2>
          </FadeIn>

          <StaggerContainer className="grid grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4" stagger={0.08}>
            {BENEFITS.map((b, i) => (
              <StaggerItem key={i}>
                <div className="bg-secondary-900/60 border border-foreground/5 rounded-xl sm:rounded-2xl p-3.5 sm:p-6 h-full hover:border-primary-500/30 transition-colors">
                  <div className="w-9 h-9 sm:w-12 sm:h-12 bg-primary-500/10 rounded-xl flex items-center justify-center mb-2.5 sm:mb-3">
                    <b.icon className="w-4 h-4 sm:w-6 sm:h-6 text-primary-400" />
                  </div>
                  <h3 className="text-foreground font-bold text-xs sm:text-base mb-0.5 sm:mb-1">{b.title}</h3>
                  <p className="text-foreground/40 text-[10px] sm:text-sm leading-relaxed">{b.desc}</p>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-12 sm:py-20 bg-secondary-950">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <FadeIn>
            <p className="text-xs sm:text-sm font-bold tracking-[0.2em] uppercase text-primary-400 mb-3 sm:mb-4">Pronto para navegar?</p>
            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black text-foreground leading-tight mb-4 sm:mb-5">
              Fale com nossa equipe e <span className="text-gradient">garanta sua cota</span>
            </h2>
            <p className="text-foreground/50 text-sm sm:text-lg mb-6 sm:mb-8 max-w-2xl mx-auto">
              Atendimento personalizado via WhatsApp. Nossa equipe está pronta para tirar todas as suas dúvidas.
            </p>
            <a
              href={`${WHATSAPP_URL}?text=${encodeURIComponent('Olá! Quero saber mais sobre as cotas de jet ski disponíveis.')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-8 sm:px-10 py-4 sm:py-5 bg-primary-500 text-white font-bold text-base sm:text-lg rounded-2xl hover:bg-primary-400 transition-all shadow-2xl shadow-primary-500/25 hover:-translate-y-0.5"
            >
              <MessageCircle size={20} />
              Falar com a Equipe Comercial
            </a>
          </FadeIn>
        </div>
      </section>

      <Footer />
      <MobileBottomBar />

      {/* Modal */}
      {selectedBoat && <BoatModal boat={selectedBoat} onClose={handleCloseModal} />}
    </main>
  );
}
