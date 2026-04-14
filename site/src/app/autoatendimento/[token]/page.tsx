'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { ShoppingCart, Plus, Minus, Trash2, Send, ChevronDown, Search, X, CheckCircle } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

interface MenuItem { id: string; name: string; description?: string; price: number; image?: string; }
interface MenuCategory { id: string; name: string; items: MenuItem[]; }
interface TableInfo { id: string; number: number; name?: string; }
interface CartItem { menuItemId: string; name: string; quantity: number; unitPrice: number; notes?: string; }

const categoryIcons: Record<string, string> = {
  'entradas': '🥗', 'sugestoes-do-chef': '👨‍🍳', 'grill': '🔥', 'executivos': '🍽️',
  'petiscos': '🍤', 'sobremesas': '🍫', 'bebidas': '🥤', 'gin-prize': '🍸',
  'prize-drinks': '🍹', 'caips-tropicais': '🍋', 'shots-e-doses': '🥃',
  'cervejas-long-neck-e-600ml': '🍺', 'garrafas': '🍾', 'combos': '🎉',
};

function slugify(s: string) {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function fmt(v: number) { return `R$ ${v.toFixed(2).replace('.', ',')}`; }

export default function AutoAtendimentoPage() {
  const { token } = useParams<{ token: string }>();
  const [table, setTable] = useState<TableInfo | null>(null);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [sending, setSending] = useState(false);
  const [orderSent, setOrderSent] = useState<{ orderNumber: number; total: number } | null>(null);
  const [itemNotes, setItemNotes] = useState<Record<string, string>>({});
  const categoryRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'));
  }, []);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/self-service/${token}`);
      if (!res.ok) throw new Error('Mesa não encontrada');
      const data = await res.json();
      setTable(data.table);
      setCategories(data.categories);
    } catch {
      setError('Link inválido ou mesa desativada.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const cartCount = useMemo(() => cart.reduce((s, c) => s + c.quantity, 0), [cart]);
  const cartTotal = useMemo(() => cart.reduce((s, c) => s + c.unitPrice * c.quantity, 0), [cart]);

  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(c => c.menuItemId === item.id);
      if (existing) {
        return prev.map(c => c.menuItemId === item.id ? { ...c, quantity: c.quantity + 1 } : c);
      }
      return [...prev, { menuItemId: item.id, name: item.name, quantity: 1, unitPrice: item.price, notes: itemNotes[item.id] }];
    });
  };

  const updateQty = (menuItemId: string, delta: number) => {
    setCart(prev => prev.map(c => c.menuItemId === menuItemId ? { ...c, quantity: Math.max(0, c.quantity + delta) } : c).filter(c => c.quantity > 0));
  };

  const removeFromCart = (menuItemId: string) => {
    setCart(prev => prev.filter(c => c.menuItemId !== menuItemId));
  };

  const getCartQty = (menuItemId: string) => cart.find(c => c.menuItemId === menuItemId)?.quantity || 0;

  const sendOrder = async () => {
    if (cart.length === 0) return;
    setSending(true);
    try {
      const res = await fetch(`${API_URL}/self-service/${token}/order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: customerName || undefined,
          notes: orderNotes || undefined,
          items: cart.map(c => ({
            menuItemId: c.menuItemId,
            name: c.name,
            quantity: c.quantity,
            unitPrice: c.unitPrice,
            notes: c.notes,
          })),
        }),
      });
      if (!res.ok) throw new Error('Erro ao enviar pedido');
      const data = await res.json();
      setOrderSent({ orderNumber: data.orderNumber, total: data.total });
      setCart([]);
      setShowCart(false);
      setCustomerName('');
      setOrderNotes('');
    } catch {
      alert('Erro ao enviar pedido. Tente novamente.');
    } finally {
      setSending(false);
    }
  };

  const filteredCategories = useMemo(() => {
    if (!search) return categories;
    const s = search.toLowerCase();
    return categories.map(c => ({
      ...c,
      items: c.items.filter(i => i.name.toLowerCase().includes(s) || i.description?.toLowerCase().includes(s)),
    })).filter(c => c.items.length > 0);
  }, [categories, search]);

  const scrollToCategory = (catId: string) => {
    setActiveCategory(catId);
    categoryRefs.current[catId]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // ── Theme colors ──
  const bg = isDark ? 'bg-[#060E18]' : 'bg-[#F8F9FB]';
  const cardBg = isDark ? 'bg-white/[0.04] border-white/[0.06]' : 'bg-white border-gray-100 shadow-sm';
  const textMain = isDark ? 'text-white' : 'text-gray-900';
  const textMuted = isDark ? 'text-white/50' : 'text-gray-500';
  const inputBg = isDark ? 'bg-white/[0.05] border-white/[0.1] text-white placeholder:text-white/30' : 'bg-gray-100 border-gray-200 text-gray-900 placeholder:text-gray-400';

  // ── Loading ──
  if (loading) {
    return (
      <div className={`min-h-screen ${bg} flex items-center justify-center`}>
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-[#FF6B00] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className={textMuted}>Carregando cardápio...</p>
        </div>
      </div>
    );
  }

  // ── Error ──
  if (error || !table) {
    return (
      <div className={`min-h-screen ${bg} flex items-center justify-center p-6`}>
        <div className="text-center max-w-sm">
          <p className="text-5xl mb-4">😕</p>
          <h1 className={`text-xl font-bold ${textMain} mb-2`}>Link Inválido</h1>
          <p className={textMuted}>{error || 'Não foi possível carregar o cardápio.'}</p>
        </div>
      </div>
    );
  }

  // ── Order Sent ──
  if (orderSent) {
    return (
      <div className={`min-h-screen ${bg} flex items-center justify-center p-6`}>
        <div
          style={{ animation: 'fadeInUp 0.4s ease-out both' }}
          className="text-center max-w-sm"
        >
          <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={40} className="text-emerald-500" />
          </div>
          <h1 className={`text-2xl font-bold ${textMain} mb-2`}>Pedido Enviado!</h1>
          <p className={`${textMuted} mb-4`}>Pedido #{orderSent.orderNumber}</p>
          <p className="text-3xl font-bold text-[#FF6B00] mb-6">{fmt(orderSent.total)}</p>
          <p className={`text-sm ${textMuted} mb-8`}>
            Mesa {table.number}{table.name ? ` — ${table.name}` : ''}<br />
            Aguarde, seu pedido está sendo preparado!
          </p>
          <button
            onClick={() => setOrderSent(null)}
            className="bg-[#FF6B00] hover:bg-[#FF8533] text-white font-semibold px-6 py-3 rounded-2xl transition"
          >
            Fazer Novo Pedido
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${bg} pb-24`}>
      {/* ── Header ── */}
      <div className="sticky top-0 z-30 backdrop-blur-xl border-b" style={{ borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)', background: isDark ? 'rgba(6,14,24,0.92)' : 'rgba(248,249,251,0.92)' }}>
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className={`text-lg font-bold ${textMain}`}>
                Mesa {table.number}{table.name ? ` — ${table.name}` : ''}
              </h1>
              <p className={`text-xs ${textMuted}`}>Prize Club Gastrobar</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-500 text-xs font-medium px-2 py-1 rounded-full">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                Online
              </span>
            </div>
          </div>

          {/* ── Search ── */}
          <div className="mt-3 relative">
            <Search size={16} className={`absolute left-3 top-1/2 -translate-y-1/2 ${textMuted}`} />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar no cardápio..."
              className={`w-full pl-9 pr-9 py-2.5 rounded-xl text-sm border transition ${inputBg}`}
            />
            {search && (
              <button onClick={() => setSearch('')} className={`absolute right-3 top-1/2 -translate-y-1/2 ${textMuted}`}>
                <X size={16} />
              </button>
            )}
          </div>

          {/* ── Category Tabs ── */}
          {!search && (
            <div className="mt-3 -mx-4 px-4 flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
              {categories.map(cat => {
                const slug = slugify(cat.name);
                const icon = categoryIcons[slug] || '🍴';
                return (
                  <button
                    key={cat.id}
                    onClick={() => scrollToCategory(cat.id)}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition ${
                      activeCategory === cat.id
                        ? 'bg-[#FF6B00] text-white'
                        : isDark ? 'bg-white/[0.05] text-white/60' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    <span>{icon}</span> {cat.name}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Menu Items ── */}
      <div className="max-w-2xl mx-auto px-4 mt-4 space-y-6">
        {filteredCategories.map(cat => (
          <div key={cat.id} ref={el => { categoryRefs.current[cat.id] = el; }}>
            <h2 className={`text-base font-bold ${textMain} mb-3 flex items-center gap-2`}>
              <span>{categoryIcons[slugify(cat.name)] || '🍴'}</span> {cat.name}
            </h2>
            <div className="space-y-2">
              {cat.items.map(item => {
                const qty = getCartQty(item.id);
                return (
                  <div
                    key={item.id}
                    className={`flex gap-3 p-3 rounded-xl border transition ${cardBg} ${qty > 0 ? 'ring-1 ring-[#FF6B00]/40' : ''}`}
                  >
                    {item.image && (
                      <div className="w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-gray-200">
                        <Image src={item.image} alt={item.name} width={80} height={80} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className={`font-semibold text-sm ${textMain} leading-tight`}>{item.name}</p>
                      {item.description && (
                        <p className={`text-xs ${textMuted} mt-0.5 line-clamp-2`}>{item.description}</p>
                      )}
                      <p className="text-[#FF6B00] font-bold text-sm mt-1">{fmt(item.price)}</p>
                    </div>
                    <div className="flex flex-col items-end justify-between">
                      {qty === 0 ? (
                        <button
                          onClick={() => addToCart(item)}
                          className="w-9 h-9 rounded-full bg-[#FF6B00] text-white flex items-center justify-center transition hover:bg-[#FF8533] active:scale-95"
                        >
                          <Plus size={18} />
                        </button>
                      ) : (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateQty(item.id, -1)}
                            className="w-8 h-8 rounded-full bg-gray-200 dark:bg-white/10 flex items-center justify-center transition active:scale-95"
                          >
                            <Minus size={14} className={textMain} />
                          </button>
                          <span className={`font-bold text-sm w-5 text-center ${textMain}`}>{qty}</span>
                          <button
                            onClick={() => updateQty(item.id, 1)}
                            className="w-8 h-8 rounded-full bg-[#FF6B00] text-white flex items-center justify-center transition active:scale-95"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {filteredCategories.length === 0 && (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">🔍</p>
            <p className={textMuted}>Nenhum item encontrado</p>
          </div>
        )}
      </div>

      {/* ── Cart Floating Button ── */}
      {cartCount > 0 && !showCart && (
        <button
          onClick={() => setShowCart(true)}
          style={{ animation: 'slideUp 0.3s ease-out both' }}
          className="fixed bottom-6 left-4 right-4 max-w-2xl mx-auto bg-[#FF6B00] hover:bg-[#FF8533] text-white rounded-2xl py-4 px-6 flex items-center justify-between shadow-xl shadow-[#FF6B00]/30 transition active:scale-[0.98] z-40"
        >
            <div className="flex items-center gap-3">
              <div className="relative">
                <ShoppingCart size={22} />
                <span className="absolute -top-2 -right-2 bg-white text-[#FF6B00] text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              </div>
              <span className="font-semibold">Ver Pedido</span>
            </div>
            <span className="font-bold text-lg">{fmt(cartTotal)}</span>
        </button>
      )}

      {/* ── Cart Drawer ── */}
      {showCart && (
        <>
          <div
            onClick={() => setShowCart(false)}
            className="fixed inset-0 bg-black/50 z-40 lightbox-enter"
          />
          <div
            style={{ animation: 'slideUp 0.3s ease-out both' }}
            className={`fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl max-h-[85vh] flex flex-col ${isDark ? 'bg-[#0D1B2A]' : 'bg-white'}`}
          >
              {/* Drag handle */}
              <div className="flex justify-center pt-3 pb-1">
                <div className={`w-10 h-1 rounded-full ${isDark ? 'bg-white/20' : 'bg-gray-300'}`} />
              </div>

              <div className="px-5 pb-2 flex items-center justify-between">
                <h2 className={`text-lg font-bold ${textMain}`}>Seu Pedido</h2>
                <button onClick={() => setShowCart(false)} className={`p-2 rounded-full ${isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'}`}>
                  <X size={20} className={textMuted} />
                </button>
              </div>

              {/* Cart Items */}
              <div className="flex-1 overflow-y-auto px-5 space-y-3 pb-4">
                {cart.map(item => (
                  <div key={item.menuItemId} className={`flex items-center gap-3 p-3 rounded-xl border ${cardBg}`}>
                    <div className="flex-1">
                      <p className={`font-semibold text-sm ${textMain}`}>{item.name}</p>
                      <p className="text-[#FF6B00] text-sm font-medium">{fmt(item.unitPrice)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => updateQty(item.menuItemId, -1)} className={`w-7 h-7 rounded-full flex items-center justify-center ${isDark ? 'bg-white/10' : 'bg-gray-100'}`}>
                        <Minus size={12} className={textMain} />
                      </button>
                      <span className={`font-bold text-sm w-5 text-center ${textMain}`}>{item.quantity}</span>
                      <button onClick={() => updateQty(item.menuItemId, 1)} className="w-7 h-7 rounded-full bg-[#FF6B00] text-white flex items-center justify-center">
                        <Plus size={12} />
                      </button>
                      <button onClick={() => removeFromCart(item.menuItemId)} className="w-7 h-7 rounded-full flex items-center justify-center ml-1 text-red-500 hover:bg-red-500/10">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))}

                {/* Customer Name */}
                <div>
                  <label className={`text-xs font-medium ${textMuted} block mb-1`}>Seu nome (opcional)</label>
                  <input
                    value={customerName}
                    onChange={e => setCustomerName(e.target.value)}
                    placeholder="Ex: João"
                    className={`w-full px-3 py-2.5 rounded-xl text-sm border ${inputBg}`}
                  />
                </div>

                {/* Notes */}
                <div>
                  <label className={`text-xs font-medium ${textMuted} block mb-1`}>Observações (opcional)</label>
                  <textarea
                    value={orderNotes}
                    onChange={e => setOrderNotes(e.target.value)}
                    placeholder="Ex: Sem cebola, ponto mal passado..."
                    rows={2}
                    className={`w-full px-3 py-2.5 rounded-xl text-sm border resize-none ${inputBg}`}
                  />
                </div>
              </div>

              {/* Cart Footer */}
              <div className={`border-t px-5 py-4 ${isDark ? 'border-white/10' : 'border-gray-100'}`}>
                <div className="flex items-center justify-between mb-3">
                  <span className={`font-medium ${textMain}`}>Total</span>
                  <span className="text-xl font-bold text-[#FF6B00]">{fmt(cartTotal)}</span>
                </div>
                <button
                  onClick={sendOrder}
                  disabled={sending || cart.length === 0}
                  className="w-full bg-[#FF6B00] hover:bg-[#FF8533] disabled:opacity-50 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition active:scale-[0.98]"
                >
                  {sending ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Send size={18} /> Enviar Pedido
                    </>
                  )}
                </button>
                <p className={`text-center text-[10px] ${textMuted} mt-2`}>
                  Mesa {table.number} • Pagamento na mesa
                </p>
              </div>
          </div>
        </>
      )}
    </div>
  );
}
