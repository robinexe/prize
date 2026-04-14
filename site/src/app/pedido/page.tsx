'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ShoppingCart, Plus, Minus, Trash2, Send, X, CheckCircle, Clock, AlertTriangle, Receipt, RefreshCw } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

interface MenuItem { id: string; name: string; description?: string; price: number; image?: string; }
interface MenuCategory { id: string; name: string; items: MenuItem[]; }
interface CartItem { menuItemId: string; name: string; quantity: number; unitPrice: number; notes?: string; }
interface ComandaOrder {
  number: number; status: string; total: number; customerName?: string;
  createdAt: string; items: { name: string; quantity: number; unitPrice: number }[];
}

// ─── Category Icons ────────────────────────────────────────
const categoryIcons: Record<string, string> = {
  'entradas': '🥗', 'sugestoes-do-chef': '👨‍🍳', 'grill': '🔥', 'executivos': '🍽️',
  'petiscos': '🍤', 'sobremesas': '🍫', 'bebidas': '🥤', 'gin-prize': '🍸',
  'prize-drinks': '🍹', 'caips-tropicais': '🍋', 'shots-e-doses': '🥃',
  'cervejas-long-neck-e-600ml': '🍺', 'garrafas': '🍾', 'combos': '🎉',
};

const statusLabels: Record<string, { label: string; color: string }> = {
  ANALYSIS: { label: 'Em Análise', color: 'bg-yellow-500/10 text-yellow-600' },
  PREPARING: { label: 'Preparando', color: 'bg-blue-500/10 text-blue-500' },
  READY: { label: 'Pronto', color: 'bg-emerald-500/10 text-emerald-500' },
  SERVED: { label: 'Na Mesa', color: 'bg-orange-500/10 text-orange-500' },
  DELIVERING: { label: 'Aguardando Fechamento', color: 'bg-amber-500/10 text-amber-500' },
  DONE: { label: 'Finalizado', color: 'bg-gray-500/10 text-gray-500' },
  CANCELLED: { label: 'Cancelado', color: 'bg-red-500/10 text-red-500' },
};

function slugify(s: string) {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function fmt(v: number) { return `R$ ${v.toFixed(2).replace('.', ',')}`; }

function getCatIcon(name: string) { return categoryIcons[slugify(name)] || '🍴'; }

// ─── Theme helper (same as cardápio) ───────────────────────
const theme = (dark: boolean) => ({
  bg: dark ? 'bg-[#060E18]' : 'bg-[#F8F9FB]',
  card: dark
    ? 'bg-white/[0.04] border-white/[0.06] hover:border-[#FF6B00]/30 hover:bg-white/[0.07]'
    : 'bg-white border-gray-100 shadow-sm hover:border-[#FF6B00]/40 hover:shadow-lg hover:shadow-black/5',
  cardText: dark ? 'text-white' : 'text-gray-900',
  cardSub: dark ? 'text-white/40' : 'text-gray-500',
  heroText: dark ? 'text-white' : 'text-gray-900',
  heroSub: dark ? 'text-white/40' : 'text-gray-500',
  navBg: dark ? 'bg-[#060E18]/90 border-white/[0.05]' : 'bg-white/90 border-gray-200/60',
  searchBg: dark
    ? 'bg-white/[0.05] border-white/[0.08] text-white placeholder:text-white/25'
    : 'bg-gray-100 border-gray-200 text-gray-900 placeholder:text-gray-400',
  searchIcon: dark ? 'text-white/30' : 'text-gray-400',
  tabActive: 'bg-[#FF6B00] text-white shadow-lg shadow-[#FF6B00]/25',
  tabInactive: dark
    ? 'bg-white/[0.04] text-white/50 hover:text-white/80 hover:bg-white/[0.08]'
    : 'bg-gray-100 text-gray-500 hover:text-gray-800 hover:bg-gray-200',
  imgPlaceholder: dark ? 'from-white/[0.02] to-white/[0.05]' : 'from-gray-50 to-gray-100',
  shimmerFrom: dark ? 'from-white/[0.02]' : 'from-gray-100',
  shimmerVia: dark ? 'via-white/[0.08]' : 'via-gray-200',
  shimmerTo: dark ? 'to-white/[0.02]' : 'to-gray-100',
  ambientOrange: dark ? 'bg-[#FF6B00]/[0.03]' : 'bg-[#FF6B00]/[0.02]',
  ambientBlue: dark ? 'bg-[#1E3A5F]/[0.08]' : 'bg-[#1E3A5F]/[0.03]',
  searchClear: dark ? 'text-white/30 hover:text-white/60' : 'text-gray-400 hover:text-gray-600',
  toggleBg: dark ? 'bg-white/10' : 'bg-gray-200',
  modalBg: dark ? 'bg-[#0D1B2A] border-white/10' : 'bg-white border-gray-200',
  modalText: dark ? 'text-white' : 'text-gray-900',
  modalSub: dark ? 'text-white/50' : 'text-gray-500',
  modalClose: dark ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700',
  modalGrad: dark ? 'from-[#0D1B2A]' : 'from-white',
  drawerBg: dark ? 'bg-[#0D1B2A]' : 'bg-white',
  drawerBorder: dark ? 'border-white/10' : 'border-gray-100',
  drawerHandle: dark ? 'bg-white/20' : 'bg-gray-300',
  inputBg: dark ? 'bg-white/[0.05] border-white/[0.1] text-white placeholder:text-white/30' : 'bg-gray-100 border-gray-200 text-gray-900 placeholder:text-gray-400',
  qtyBtnBg: dark ? 'bg-white/10' : 'bg-gray-100',
  skeletonBg: dark ? 'bg-white/[0.03]' : 'bg-gray-100',
  skeletonLine: dark ? 'bg-white/[0.05]' : 'bg-gray-200',
});

// ─── Menu Item Card (cardápio style + cart controls) ───────
function MenuItemCard({
  item, index, dark, qty, onAdd, onUpdateQty,
}: {
  item: MenuItem; index: number; dark: boolean;
  qty: number; onAdd: () => void; onUpdateQty: (d: number) => void;
}) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const c = theme(dark);

  return (
    <>
      <div
        style={{ animation: 'fadeInUp 0.4s ease-out both', animationDelay: `${index * 30}ms` }}
        className={`group relative border rounded-2xl overflow-hidden transition-all duration-300 ${c.card} ${qty > 0 ? 'ring-2 ring-[#FF6B00]/50' : ''}`}
      >
        <div className={`relative aspect-[4/3] overflow-hidden bg-gradient-to-br ${c.imgPlaceholder}`} onClick={() => setShowModal(true)}>
          {item.image ? (
            <>
              {!imgLoaded && (
                <div
                  className={`absolute inset-0 animate-pulse bg-gradient-to-r ${c.shimmerFrom} ${c.shimmerVia} ${c.shimmerTo} bg-[length:200%_100%]`}
                  style={{ animation: 'shimmer 1.5s infinite' }}
                />
              )}
              <Image
                src={item.image}
                alt={item.name}
                fill
                className={`object-cover transition-all duration-500 group-hover:scale-105 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                onLoad={() => setImgLoaded(true)}
              />
            </>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-4xl opacity-20">🍽️</div>
          )}
          <div className="absolute bottom-2 right-2 bg-[#FF6B00] text-white text-xs font-bold px-2.5 py-1 rounded-lg shadow-lg shadow-[#FF6B00]/30">
            {fmt(item.price)}
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>

        <div className="p-3 sm:p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0" onClick={() => setShowModal(true)}>
              <h3 className={`font-bold text-sm sm:text-[15px] leading-tight line-clamp-2 group-hover:text-[#FF6B00] transition-colors ${c.cardText}`}>
                {item.name}
              </h3>
              {item.description && (
                <p className={`text-xs mt-1 line-clamp-2 leading-relaxed ${c.cardSub}`}>{item.description}</p>
              )}
            </div>
            {qty === 0 ? (
              <button onClick={onAdd}
                className="w-8 h-8 rounded-full bg-[#FF6B00] text-white flex items-center justify-center flex-shrink-0 transition hover:bg-[#FF8533] active:scale-95 shadow-lg shadow-[#FF6B00]/20">
                <Plus size={16} />
              </button>
            ) : (
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button onClick={() => onUpdateQty(-1)}
                  className={`w-7 h-7 rounded-full flex items-center justify-center transition active:scale-95 ${c.qtyBtnBg}`}>
                  <Minus size={12} className={c.cardText} />
                </button>
                <span className={`font-bold text-sm w-5 text-center ${c.cardText}`}>{qty}</span>
                <button onClick={() => onUpdateQty(1)}
                  className="w-7 h-7 rounded-full bg-[#FF6B00] text-white flex items-center justify-center transition active:scale-95">
                  <Plus size={12} />
                </button>
              </div>
            )}
          </div>
        </div>

        {qty > 0 && (
          <div className="absolute top-2 left-2 bg-[#FF6B00] text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-lg">
            {qty}
          </div>
        )}
      </div>

      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md lightbox-enter"
          onClick={() => setShowModal(false)}
        >
          <div
            onClick={e => e.stopPropagation()}
            className={`border rounded-3xl overflow-hidden w-full max-w-lg shadow-2xl lightbox-img-enter ${c.modalBg}`}
          >
              {item.image && (
                <div className="relative aspect-[16/10] overflow-hidden">
                  <Image src={item.image} alt={item.name} fill className="object-cover" sizes="500px" />
                  <div className={`absolute inset-0 bg-gradient-to-t ${c.modalGrad} via-transparent to-transparent`} />
                </div>
              )}
              <div className="p-6 -mt-8 relative">
                <h2 className={`text-2xl font-black mb-2 ${c.modalText}`}>{item.name}</h2>
                {item.description && <p className={`text-sm leading-relaxed mb-4 ${c.modalSub}`}>{item.description}</p>}
                <div className="flex items-center justify-between">
                  <span className="text-[#FF6B00] font-black text-2xl">{fmt(item.price)}</span>
                  <div className="flex items-center gap-2">
                    {qty === 0 ? (
                      <button onClick={() => { onAdd(); setShowModal(false); }}
                        className="bg-[#FF6B00] hover:bg-[#FF8533] text-white font-semibold px-5 py-2.5 rounded-xl flex items-center gap-1.5 transition active:scale-95">
                        <Plus size={16} /> Adicionar
                      </button>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button onClick={() => onUpdateQty(-1)}
                          className={`w-9 h-9 rounded-xl flex items-center justify-center transition active:scale-95 ${c.modalClose}`}>
                          <Minus size={16} />
                        </button>
                        <span className={`font-bold text-lg w-6 text-center ${c.modalText}`}>{qty}</span>
                        <button onClick={() => onUpdateQty(1)}
                          className="w-9 h-9 rounded-xl bg-[#FF6B00] text-white flex items-center justify-center transition active:scale-95">
                          <Plus size={16} />
                        </button>
                      </div>
                    )}
                    <button onClick={() => setShowModal(false)}
                      className={`px-4 py-2.5 text-sm font-semibold rounded-xl transition-colors ${c.modalClose}`}>
                      Fechar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
    </>
  );
}

// ─── Main Page ─────────────────────────────────────────────
export default function PedidoPage() {
  const router = useRouter();

  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [tableCode, setTableCode] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [expired, setExpired] = useState(false);
  const timeLeftRef = useRef(600);
  const timerDisplayRef = useRef<HTMLSpanElement>(null);
  const cartTimerRef = useRef<HTMLSpanElement>(null);
  const [noSession, setNoSession] = useState(false);

  const [tableInfo, setTableInfo] = useState<{ number: number; name?: string } | null>(null);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [search, setSearch] = useState('');
  const [activeCat, setActiveCat] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [sending, setSending] = useState(false);
  const [orderSent, setOrderSent] = useState<{ orderNumber: number; total: number } | null>(null);
  const [dark, setDark] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const tabsRef = useRef<HTMLDivElement>(null);

  const [activeTab, setActiveTab] = useState<'cardapio' | 'comanda'>('cardapio');
  const [comanda, setComanda] = useState<ComandaOrder[]>([]);
  const [loadingComanda, setLoadingComanda] = useState(false);
  const [closingBill, setClosingBill] = useState(false);
  const [billClosed, setBillClosed] = useState(false);

  const c = theme(dark);

  useEffect(() => {
    const bg = dark ? '#060E18' : '#F8F9FB';
    document.documentElement.style.backgroundColor = bg;
    document.body.style.backgroundColor = bg;
    return () => { document.documentElement.style.backgroundColor = ''; document.body.style.backgroundColor = ''; };
  }, [dark]);

  const toggleTheme = () => setDark(prev => !prev);

  const loadComanda = useCallback(async (code?: string) => {
    const cd = code || tableCode;
    if (!cd) return;
    setLoadingComanda(true);
    try {
      const res = await fetch(`${API_URL}/mesa/${cd}/comanda`);
      if (res.ok) {
        const data = await res.json();
        setComanda(data.orders);
        if (data.table) setTableInfo(data.table);
      }
    } catch {}
    setLoadingComanda(false);
  }, [tableCode]);

  useEffect(() => {
    const stored = sessionStorage.getItem('mesa-session');
    if (!stored) { setNoSession(true); setLoading(false); return; }

    try {
      const { sessionToken: st, expiresAt: ea, table, code } = JSON.parse(stored);
      setTableCode(code);
      if (table) setTableInfo(table);
      const expDate = new Date(ea);
      setExpiresAt(expDate);

      if (expDate <= new Date()) {
        setExpired(true); setLoading(false); loadComanda(code); return;
      }

      setSessionToken(st);
      (async () => {
        try {
          const res = await fetch(`${API_URL}/mesa/session/${st}`);
          if (!res.ok) { setExpired(true); setLoading(false); loadComanda(code); return; }
          const data = await res.json();
          setCategories(data.categories);
          if (data.table) setTableInfo(data.table);
          if (data.categories?.length > 0) setActiveCat(data.categories[0].id);
        } catch { setExpired(true); }
        setLoading(false);
      })();
      loadComanda(code);
    } catch { setNoSession(true); setLoading(false); }
  }, []);

  useEffect(() => {
    if (!expiresAt) return;
    const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
    let iv: NodeJS.Timeout | null = null;
    const tick = () => {
      const diff = Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000));
      timeLeftRef.current = diff;
      const txt = formatTime(diff);
      if (timerDisplayRef.current) timerDisplayRef.current.textContent = txt;
      if (cartTimerRef.current) cartTimerRef.current.textContent = txt;
      // Color update for header timer
      if (timerDisplayRef.current) {
        const parent = timerDisplayRef.current.parentElement;
        if (parent) {
          parent.className = parent.className
            .replace(/bg-\w+-500\/10/g, '')
            .replace(/text-\w+-500/g, '')
            .trim();
          const cls = diff <= 60 ? 'bg-red-500/10 text-red-500' : diff <= 180 ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-500';
          parent.className = `inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-xl ${cls}`;
        }
      }
      if (diff <= 0) {
        if (iv) { clearInterval(iv); iv = null; }
        setExpired(true);
        setSessionToken(null);
        loadComanda();
      }
    };
    tick();
    if (timeLeftRef.current > 0) {
      iv = setInterval(tick, 1000);
    }
    return () => { if (iv) clearInterval(iv); };
  }, [expiresAt, loadComanda]);

  const timerFormatted = useMemo(() => {
    const s = timeLeftRef.current;
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  }, []);

  useEffect(() => {
    if (categories.length === 0 || isScrolling || activeTab !== 'cardapio') return;
    const observer = new IntersectionObserver(
      (entries) => { for (const entry of entries) { if (entry.isIntersecting) setActiveCat(entry.target.id.replace('cat-', '')); } },
      { rootMargin: '-140px 0px -60% 0px', threshold: 0 }
    );
    for (const cat of categories) { const el = sectionRefs.current[cat.id]; if (el) observer.observe(el); }
    return () => observer.disconnect();
  }, [categories, isScrolling, activeTab]);

  useEffect(() => {
    if (!tabsRef.current || !activeCat) return;
    const btn = tabsRef.current.querySelector(`[data-cat-id="${activeCat}"]`) as HTMLElement;
    if (btn) btn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }, [activeCat]);

  const scrollToCategory = useCallback((catId: string) => {
    setActiveCat(catId);
    setIsScrolling(true);
    const el = sectionRefs.current[catId];
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - 140;
      window.scrollTo({ top, behavior: 'smooth' });
    }
    setTimeout(() => setIsScrolling(false), 800);
  }, []);

  const cartCount = useMemo(() => cart.reduce((s, ci) => s + ci.quantity, 0), [cart]);
  const cartTotal = useMemo(() => cart.reduce((s, ci) => s + ci.unitPrice * ci.quantity, 0), [cart]);

  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(ci => ci.menuItemId === item.id);
      if (existing) return prev.map(ci => ci.menuItemId === item.id ? { ...ci, quantity: ci.quantity + 1 } : ci);
      return [...prev, { menuItemId: item.id, name: item.name, quantity: 1, unitPrice: item.price }];
    });
  };

  const updateQty = (menuItemId: string, delta: number) => {
    setCart(prev => prev.map(ci => ci.menuItemId === menuItemId ? { ...ci, quantity: Math.max(0, ci.quantity + delta) } : ci).filter(ci => ci.quantity > 0));
  };

  const removeFromCart = (menuItemId: string) => { setCart(prev => prev.filter(ci => ci.menuItemId !== menuItemId)); };

  const getCartQty = (menuItemId: string) => cart.find(ci => ci.menuItemId === menuItemId)?.quantity || 0;

  const sendOrder = async () => {
    if (cart.length === 0 || !sessionToken) return;
    setSending(true);
    try {
      const res = await fetch(`${API_URL}/mesa/session/${sessionToken}/order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: customerName || undefined,
          notes: orderNotes || undefined,
          items: cart.map(ci => ({ menuItemId: ci.menuItemId, name: ci.name, quantity: ci.quantity, unitPrice: ci.unitPrice })),
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        if (err.message?.includes('expirada')) { setExpired(true); setSessionToken(null); return; }
        throw new Error(err.message || 'Erro ao enviar pedido');
      }
      const data = await res.json();
      setOrderSent({ orderNumber: data.orderNumber, total: data.total });
      setCart([]); setShowCart(false); setCustomerName(''); setOrderNotes('');
      loadComanda();
    } catch (e: any) {
      alert(e.message || 'Erro ao enviar pedido. Tente novamente.');
    } finally { setSending(false); }
  };

  const filteredCategories = useMemo(() => {
    if (!search) return categories;
    const s = search.toLowerCase();
    return categories.map(cat => ({ ...cat, items: cat.items.filter(i => i.name.toLowerCase().includes(s) || i.description?.toLowerCase().includes(s)) })).filter(cat => cat.items.length > 0);
  }, [categories, search]);

  const searchResults = useMemo(() => {
    if (!search) return [];
    const q = search.toLowerCase();
    return categories.flatMap(cat => cat.items.filter(i => i.name.toLowerCase().includes(q) || i.description?.toLowerCase().includes(q)));
  }, [categories, search]);

  const comandaTotal = comanda.filter(o => o.status !== 'CANCELLED').reduce((s, o) => s + o.total, 0);

  const allAwaitingOrDone = comanda.length > 0 && comanda.every(o => o.status === 'DELIVERING' || o.status === 'DONE' || o.status === 'CANCELLED');

  const fecharConta = async () => {
    if (!tableCode || closingBill) return;
    if (!confirm('Deseja solicitar o fechamento da conta? O garçom virá até sua mesa.')) return;
    setClosingBill(true);
    try {
      const res = await fetch(`${API_URL}/mesa/${tableCode}/fechar-conta`, { method: 'POST' });
      if (!res.ok) throw new Error('Erro ao solicitar fechamento');
      setBillClosed(true);
      loadComanda();
    } catch (e: any) {
      alert(e.message || 'Erro ao solicitar fechamento. Tente novamente.');
    } finally { setClosingBill(false); }
  };

  if (loading) {
    return (
      <main className={`min-h-screen relative ${c.bg}`}>
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className={`absolute -top-[40%] -left-[20%] w-[70%] h-[70%] rounded-full blur-[120px] ${c.ambientOrange}`} />
          <div className={`absolute -bottom-[30%] -right-[20%] w-[60%] h-[60%] rounded-full blur-[120px] ${c.ambientBlue}`} />
        </div>
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="w-10 h-10 border-4 border-[#FF6B00] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className={c.heroSub}>Carregando cardápio...</p>
          </div>
        </div>
      </main>
    );
  }

  if (noSession) {
    return (
      <main className={`min-h-screen relative ${c.bg}`}>
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className={`absolute -top-[40%] -left-[20%] w-[70%] h-[70%] rounded-full blur-[120px] ${c.ambientOrange}`} />
          <div className={`absolute -bottom-[30%] -right-[20%] w-[60%] h-[60%] rounded-full blur-[120px] ${c.ambientBlue}`} />
        </div>
        <div className="relative z-10 flex items-center justify-center min-h-screen p-6">
          <div className="text-center max-w-sm">
            <div className="w-20 h-20 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto mb-6">
              <AlertTriangle size={40} className="text-amber-500" />
            </div>
            <h1 className={`text-xl font-bold ${c.heroText} mb-2`}>Nenhuma Sessão Ativa</h1>
            <p className={`${c.heroSub} mb-6`}>Escaneie o QR code da sua mesa para acessar o cardápio.</p>
            <div className={`p-4 rounded-2xl border ${c.card}`}>
              <p className={`text-sm font-medium ${c.cardText} mb-1`}>📱 QR Code da Mesa</p>
              <p className={`text-xs ${c.cardSub}`}>Aponte a câmera do seu celular para o QR code que está na mesa.</p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (orderSent) {
    return (
      <main className={`min-h-screen relative ${c.bg}`}>
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className={`absolute -top-[40%] -left-[20%] w-[70%] h-[70%] rounded-full blur-[120px] ${c.ambientOrange}`} />
          <div className={`absolute -bottom-[30%] -right-[20%] w-[60%] h-[60%] rounded-full blur-[120px] ${c.ambientBlue}`} />
        </div>
        <div className="relative z-10 flex items-center justify-center min-h-screen p-6">
          <div style={{ animation: 'fadeInUp 0.4s ease-out both' }} className="text-center max-w-sm">
            <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-6">
              <CheckCircle size={40} className="text-emerald-500" />
            </div>
            <h1 className={`text-2xl font-bold ${c.heroText} mb-2`}>Pedido Enviado!</h1>
            <p className={`${c.heroSub} mb-4`}>Pedido #{orderSent.orderNumber}</p>
            <p className="text-3xl font-bold text-[#FF6B00] mb-6">{fmt(orderSent.total)}</p>
            <p className={`text-sm ${c.heroSub} mb-8`}>
              Mesa {tableInfo?.number}{tableInfo?.name ? ` — ${tableInfo.name}` : ''}<br />
              Aguarde, seu pedido está sendo preparado!
            </p>
            <button onClick={() => setOrderSent(null)}
              className="bg-[#FF6B00] hover:bg-[#FF8533] text-white font-semibold px-6 py-3 rounded-2xl transition">
              Fazer Novo Pedido
            </button>
            <p className={`text-xs ${c.heroSub} mt-3 flex items-center justify-center gap-1`}>
              <Clock size={12} /> Sessão expira em {timerFormatted}
            </p>
          </div>
        </div>
      </main>
    );
  }

  const comandaContent = (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-4">
      {loadingComanda ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-[#FF6B00] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : comanda.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">📋</p>
          <p className={`font-medium ${c.heroText} mb-1`}>Nenhum pedido ainda</p>
          <p className={`text-sm ${c.heroSub}`}>Seus pedidos aparecerão aqui</p>
        </div>
      ) : (
        <>
          <div className={`p-4 rounded-2xl border ${c.card}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${c.cardSub}`}>Total da Comanda</p>
                <p className="text-2xl font-bold text-[#FF6B00]">{fmt(comandaTotal)}</p>
              </div>
              <div className="text-right">
                <p className={`text-sm font-medium ${c.cardSub}`}>Pedidos</p>
                <p className={`text-2xl font-bold ${c.cardText}`}>{comanda.filter(o => o.status !== 'CANCELLED').length}</p>
              </div>
            </div>
          </div>

          <button onClick={() => loadComanda()} className={`flex items-center gap-1.5 text-xs font-medium ${c.cardSub} hover:text-[#FF6B00] transition ml-auto`}>
            <RefreshCw size={12} /> Atualizar
          </button>

          {/* Fechar Conta */}
          {expired ? (
            <div className={`p-4 rounded-2xl border border-amber-500/30 bg-amber-500/10`}>
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle size={16} className="text-amber-500" />
                <p className="text-sm font-semibold text-amber-600">Sessão expirada</p>
              </div>
              <p className={`text-xs ${c.cardSub}`}>Para fechar a conta, escaneie o QR code da mesa novamente.</p>
            </div>
          ) : !allAwaitingOrDone ? (
            <button onClick={fecharConta} disabled={closingBill}
              className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 transition active:scale-[0.98] shadow-lg shadow-emerald-600/20">
              {closingBill ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>💰 Fechar Conta</>
              )}
            </button>
          ) : null}
          {(billClosed || allAwaitingOrDone) && (
            <div className={`p-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10`}>
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle size={16} className="text-emerald-500" />
                <p className="text-sm font-semibold text-emerald-600">Conta solicitada!</p>
              </div>
              <p className={`text-xs ${c.cardSub}`}>Aguarde, o garçom virá até sua mesa para o fechamento.</p>
            </div>
          )}

          {comanda.map(order => {
            const st = statusLabels[order.status] || { label: order.status, color: 'bg-gray-500/10 text-gray-500' };
            const time = new Date(order.createdAt);
            return (
              <div key={order.number} className={`p-4 rounded-2xl border ${c.card}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-bold ${c.cardText}`}>Pedido #{order.number}</span>
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${st.color}`}>{st.label}</span>
                  </div>
                  <span className={`text-xs ${c.cardSub}`}>
                    {time.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' })}
                  </span>
                </div>
                <div className="space-y-1.5">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <span className={`text-sm ${c.cardText}`}>{item.quantity}x {item.name}</span>
                      <span className={`text-sm ${c.cardSub}`}>{fmt(item.unitPrice * item.quantity)}</span>
                    </div>
                  ))}
                </div>
                <div className={`border-t mt-3 pt-2 flex justify-between ${c.drawerBorder}`}>
                  <span className={`text-sm font-medium ${c.cardSub}`}>Total</span>
                  <span className="text-sm font-bold text-[#FF6B00]">{fmt(order.total)}</span>
                </div>
              </div>
            );
          })}
        </>
      )}
    </div>
  );

  const expiredContent = (
    <div className="flex items-center justify-center p-6" style={{ minHeight: 'calc(100vh - 200px)' }}>
      <div style={{ animation: 'fadeInUp 0.4s ease-out both' }} className="text-center max-w-sm">
        <div className="w-20 h-20 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto mb-6">
          <AlertTriangle size={40} className="text-amber-500" />
        </div>
        <h1 className={`text-xl font-bold ${c.heroText} mb-2`}>Sessão Expirada</h1>
        <p className={`${c.heroSub} mb-6`}>Sua sessão de 10 minutos expirou por segurança.</p>
        <div className={`p-4 rounded-2xl border ${c.card} mb-4`}>
          <p className={`text-sm font-medium ${c.cardText} mb-1`}>📱 Escaneie o QR Code da mesa</p>
          <p className={`text-xs ${c.cardSub}`}>Para iniciar uma nova sessão, escaneie novamente o QR code físico da mesa.</p>
        </div>
        {comanda.length > 0 && (
          <button onClick={() => setActiveTab('comanda')}
            className="text-[#FF6B00] font-medium text-sm hover:underline flex items-center gap-1 mx-auto">
            <Receipt size={14} /> Ver sua Comanda ({comanda.length} {comanda.length === 1 ? 'pedido' : 'pedidos'})
          </button>
        )}
      </div>
    </div>
  );

  return (
    <main className={`min-h-screen relative transition-colors duration-300 ${c.bg}`}>
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className={`absolute -top-[40%] -left-[20%] w-[70%] h-[70%] rounded-full blur-[120px] ${c.ambientOrange}`} />
        <div className={`absolute -bottom-[30%] -right-[20%] w-[60%] h-[60%] rounded-full blur-[120px] ${c.ambientBlue}`} />
      </div>

      <div className="relative z-10 pb-28">
        <header>
          <div className="flex items-center justify-between px-4 sm:px-6 py-4">
            <div className="flex items-center gap-3">
              <Image src="/logo.png" alt="Prize Club" width={110} height={42} className="object-contain" />
              <div>
                <p className={`text-[10px] font-medium tracking-wider uppercase ${c.heroSub}`}>Gastrobar</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {expired ? (
                <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-red-500/10 text-red-500">
                  <AlertTriangle size={12} /> Expirada
                </span>
              ) : (
                <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-500`}>
                  <Clock size={12} /> <span ref={timerDisplayRef}>{timerFormatted}</span>
                </span>
              )}
              <button onClick={toggleTheme}
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${c.toggleBg}`}
                title={dark ? 'Modo claro' : 'Modo escuro'}>
                {dark ? (
                  <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div className="px-4 sm:px-6 pt-2 pb-4 sm:pt-4 sm:pb-6 max-w-4xl mx-auto text-center">
            <div style={{ animation: 'fadeInUp 0.6s ease-out both' }}>
              <p className="text-[#FF6B00] text-xs font-bold tracking-[0.25em] uppercase mb-2">
                Mesa {tableInfo?.number}{tableInfo?.name ? ` — ${tableInfo.name}` : ''}
              </p>
              <h1 className={`text-2xl sm:text-3xl lg:text-4xl font-black leading-tight ${c.heroText}`}>
                Faça seu{' '}
                <span className="bg-gradient-to-r from-[#FF6B00] to-[#FF8C38] bg-clip-text text-transparent">pedido</span>
              </h1>
            </div>
          </div>
        </header>

        <div className={`sticky top-0 z-40 backdrop-blur-xl border-b transition-colors duration-300 ${c.navBg}`}>
          <div className="max-w-6xl mx-auto">
            <div className="px-4 sm:px-6 pt-3 flex gap-1">
              <button onClick={() => setActiveTab('cardapio')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === 'cardapio' ? c.tabActive : c.tabInactive
                }`}>
                🍽️ Cardápio
              </button>
              <button onClick={() => { setActiveTab('comanda'); loadComanda(); }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-semibold transition-all relative ${
                  activeTab === 'comanda' ? c.tabActive : c.tabInactive
                }`}>
                <Receipt size={14} /> Comanda
                {comanda.length > 0 && activeTab !== 'comanda' && (
                  <span className="absolute -top-1 -right-1 bg-[#FF6B00] text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                    {comanda.length}
                  </span>
                )}
              </button>
            </div>

            {activeTab === 'cardapio' && !expired && (
              <>
                <div className="px-4 sm:px-6 pt-3 pb-2">
                  <div className="relative max-w-md mx-auto">
                    <svg className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${c.searchIcon}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input type="text" placeholder="Buscar no cardápio..." value={search} onChange={e => setSearch(e.target.value)}
                      className={`w-full rounded-xl pl-10 pr-4 py-2.5 text-sm border focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/30 focus:border-[#FF6B00]/30 transition-all ${c.searchBg}`} />
                    {search && (
                      <button onClick={() => setSearch('')} className={`absolute right-3 top-1/2 -translate-y-1/2 transition-colors ${c.searchClear}`}>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>

                {!search && (
                  <div ref={tabsRef} className="flex gap-1 overflow-x-auto px-4 sm:px-6 pb-3 scrollbar-hide">
                    {categories.map(cat => (
                      <button key={cat.id} data-cat-id={cat.id} onClick={() => scrollToCategory(cat.id)}
                        className={`relative whitespace-nowrap px-3.5 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 flex items-center gap-1.5 ${
                          activeCat === cat.id ? c.tabActive : c.tabInactive
                        }`}>
                        <span className="text-sm">{getCatIcon(cat.name)}</span>
                        {cat.name}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {activeTab === 'comanda' ? comandaContent : expired ? expiredContent : (
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
            {search ? (
              searchResults.length === 0 ? (
                <div className="text-center py-20">
                  <span className="text-5xl block mb-4">🔍</span>
                  <p className={`text-lg ${c.heroSub}`}>Nenhum item encontrado para &quot;{search}&quot;</p>
                </div>
              ) : (
                <div>
                  <p className={`text-sm mb-4 ${c.cardSub}`}>
                    {searchResults.length} {searchResults.length === 1 ? 'resultado' : 'resultados'}
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                    {searchResults.map((item, i) => (
                      <MenuItemCard key={item.id} item={item} index={i} dark={dark}
                        qty={getCartQty(item.id)} onAdd={() => addToCart(item)} onUpdateQty={(d) => updateQty(item.id, d)} />
                    ))}
                  </div>
                </div>
              )
            ) : (
              <div className="space-y-10 sm:space-y-14">
                {filteredCategories.map(cat => (
                  <div key={cat.id} id={`cat-${cat.id}`} ref={el => { sectionRefs.current[cat.id] = el; }}>
                    <div className="flex items-center gap-2 mb-4 sm:mb-6">
                      <span className="text-xl">{getCatIcon(cat.name)}</span>
                      <h2 className={`text-lg sm:text-xl font-bold ${c.heroText}`}>{cat.name}</h2>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                      {cat.items.map((item, i) => (
                        <MenuItemCard key={item.id} item={item} index={i} dark={dark}
                          qty={getCartQty(item.id)} onAdd={() => addToCart(item)} onUpdateQty={(d) => updateQty(item.id, d)} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {cartCount > 0 && !showCart && activeTab === 'cardapio' && !expired && (
        <button
          onClick={() => setShowCart(true)}
          style={{ animation: 'slideUp 0.3s ease-out both' }}
          className="fixed bottom-6 left-4 right-4 max-w-lg mx-auto bg-[#FF6B00] hover:bg-[#FF8533] text-white rounded-2xl py-4 px-6 flex items-center justify-between shadow-xl shadow-[#FF6B00]/30 transition active:scale-[0.98] z-40">
            <div className="flex items-center gap-3">
              <div className="relative">
                <ShoppingCart size={22} />
                <span className="absolute -top-2 -right-2 bg-white text-[#FF6B00] text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">{cartCount}</span>
              </div>
              <span className="font-semibold">Ver Pedido</span>
            </div>
            <span className="font-bold text-lg">{fmt(cartTotal)}</span>
        </button>
      )}

      {showCart && (
        <>
          <div
            onClick={() => setShowCart(false)} className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lightbox-enter" />
          <div
            style={{ animation: 'slideUp 0.3s ease-out both' }}
            className={`fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl max-h-[85vh] flex flex-col ${c.drawerBg}`}>
              <div className="flex justify-center pt-3 pb-1">
                <div className={`w-10 h-1 rounded-full ${c.drawerHandle}`} />
              </div>

              <div className="px-5 pb-2 flex items-center justify-between">
                <h2 className={`text-lg font-bold ${c.cardText}`}>Seu Pedido</h2>
                <div className="flex items-center gap-2">
                  <span className={`text-xs ${c.cardSub} flex items-center gap-1`}><Clock size={10} /> <span ref={cartTimerRef}>{timerFormatted}</span></span>
                  <button onClick={() => setShowCart(false)} className={`p-2 rounded-full ${dark ? 'hover:bg-white/10' : 'hover:bg-gray-100'}`}>
                    <X size={20} className={c.cardSub} />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-5 space-y-3 pb-4">
                {cart.map(item => (
                  <div key={item.menuItemId} className={`flex items-center gap-3 p-3 rounded-xl border ${c.card}`}>
                    <div className="flex-1">
                      <p className={`font-semibold text-sm ${c.cardText}`}>{item.name}</p>
                      <p className="text-[#FF6B00] text-sm font-medium">{fmt(item.unitPrice)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => updateQty(item.menuItemId, -1)} className={`w-7 h-7 rounded-full flex items-center justify-center ${c.qtyBtnBg}`}>
                        <Minus size={12} className={c.cardText} />
                      </button>
                      <span className={`font-bold text-sm w-5 text-center ${c.cardText}`}>{item.quantity}</span>
                      <button onClick={() => updateQty(item.menuItemId, 1)} className="w-7 h-7 rounded-full bg-[#FF6B00] text-white flex items-center justify-center">
                        <Plus size={12} />
                      </button>
                      <button onClick={() => removeFromCart(item.menuItemId)} className="w-7 h-7 rounded-full flex items-center justify-center ml-1 text-red-500 hover:bg-red-500/10">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))}

                <div>
                  <label className={`text-xs font-medium ${c.cardSub} block mb-1`}>Seu nome (opcional)</label>
                  <input value={customerName} onChange={e => setCustomerName(e.target.value)}
                    placeholder="Ex: João" className={`w-full px-3 py-2.5 rounded-xl text-sm border ${c.inputBg}`} />
                </div>
                <div>
                  <label className={`text-xs font-medium ${c.cardSub} block mb-1`}>Observações (opcional)</label>
                  <textarea value={orderNotes} onChange={e => setOrderNotes(e.target.value)}
                    placeholder="Ex: Sem cebola, ponto mal passado..." rows={2}
                    className={`w-full px-3 py-2.5 rounded-xl text-sm border resize-none ${c.inputBg}`} />
                </div>
              </div>

              <div className={`border-t px-5 py-4 ${c.drawerBorder}`}>
                <div className="flex items-center justify-between mb-3">
                  <span className={`font-medium ${c.cardText}`}>Total</span>
                  <span className="text-xl font-bold text-[#FF6B00]">{fmt(cartTotal)}</span>
                </div>
                <button onClick={sendOrder} disabled={sending || cart.length === 0}
                  className="w-full bg-[#FF6B00] hover:bg-[#FF8533] disabled:opacity-50 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition active:scale-[0.98]">
                  {sending ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <><Send size={18} /> Enviar Pedido</>
                  )}
                </button>
                <p className={`text-center text-[10px] ${c.cardSub} mt-2`}>
                  Mesa {tableInfo?.number} • Pagamento na mesa
                </p>
              </div>
          </div>
        </>
      )}
    </main>
  );
}
