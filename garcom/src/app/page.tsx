'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  LayoutGrid, ClipboardList, PlusCircle, User, LogOut,
  ChevronRight, CreditCard, Banknote, Smartphone, QrCode,
  X, Minus, Plus, Search, ChevronDown, ChevronUp, DollarSign,
  Sun, Moon,
} from 'lucide-react';
import Image from 'next/image';
import { AuthProvider, useAuth } from '@/contexts/auth';
import * as api from '@/services/api';

/* ------------------------------------------------------------------ */
/*  TYPES                                                              */
/* ------------------------------------------------------------------ */
interface OrderItem { id: string; name: string; quantity: number; unitPrice: number; notes?: string; menuItemId?: string; }
interface Waiter { id: string; name: string; commissionRate: number; }
interface Table { id: string; number: number; name?: string; capacity: number; isOccupied: boolean; activeOrdersCount: number; orders: Order[]; }
interface Order {
  id: string; number: number; status: string; type: string; tableNumber?: string;
  customerName?: string; notes?: string; total: number; paymentMethod?: string;
  createdAt: string; items: OrderItem[]; waiter?: Waiter | null;
  restaurantTable?: { id: string; number: number; name?: string } | null;
}
interface MenuItem { id: string; name: string; price: number; description?: string; image?: string; isAvailable: boolean; }
interface MenuCategory { id: string; name: string; items: MenuItem[]; }

/* ------------------------------------------------------------------ */
/*  STATUS CONFIG                                                      */
/* ------------------------------------------------------------------ */
const STATUS_CFG: Record<string, { label: string; color: string; next?: string }> = {
  ANALYSIS:   { label: 'Em Análise',    color: 'bg-yellow-500/15 text-yellow-500', next: 'Iniciar Preparo' },
  PREPARING:  { label: 'Preparando',    color: 'bg-blue-500/15 text-blue-500',     next: 'Marcar Pronto' },
  READY:      { label: 'Pronto',        color: 'bg-emerald-500/15 text-emerald-500', next: 'Na Mesa' },
  SERVED:     { label: 'Na Mesa',       color: 'bg-orange-500/15 text-orange-500', next: 'Finalizar' },
  DELIVERING: { label: 'Aguard. Fechamento', color: 'bg-amber-500/15 text-amber-500', next: 'Finalizar' },
  DONE:       { label: 'Finalizado',    color: 'bg-gray-500/15 text-gray-500' },
  CANCELLED:  { label: 'Cancelado',     color: 'bg-red-500/15 text-red-500' },
};

const PAYMENT_METHODS = [
  { key: 'PIX',    label: 'PIX',     icon: QrCode },
  { key: 'CASH',   label: 'Dinheiro', icon: Banknote },
  { key: 'CREDIT', label: 'Crédito', icon: CreditCard },
  { key: 'DEBIT',  label: 'Débito',  icon: Smartphone },
];

function timeAgo(d: string) {
  const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (m < 1) return 'agora';
  if (m < 60) return `${m}min`;
  return `${Math.floor(m/60)}h${m%60}min`;
}

/* ================================================================== */
/*  MAIN APP (inside AuthProvider)                                     */
/* ================================================================== */
function AppContent() {
  const { user, isLoading, logout } = useAuth();
  const [tab, setTab] = useState<'mesas' | 'pedidos' | 'novo' | 'perfil'>('mesas');

  // Data
  const [tables, setTables] = useState<Table[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [menu, setMenu] = useState<MenuCategory[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [myOnly, setMyOnly] = useState(false);

  // New order state
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [cart, setCart] = useState<{ item: MenuItem; qty: number; notes: string }[]>([]);
  const [orderNotes, setOrderNotes] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [menuSearch, setMenuSearch] = useState('');
  const [expandedCat, setExpandedCat] = useState<string | null>(null);
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [sendToKitchen, setSendToKitchen] = useState(true);

  // Modals
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);
  const [showFinalize, setShowFinalize] = useState<Order | null>(null);
  const [viewingTable, setViewingTable] = useState<Table | null>(null);

  // Theme
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'));
  }, []);
  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('garcom_theme', next ? 'dark' : 'light');
  };

  /* ---------- data loading ---------- */
  const load = useCallback(async () => {
    try {
      const [t, o, s] = await Promise.all([
        api.getTables(), api.getOrders(myOnly), api.getStats(),
      ]);
      // Only update state if data changed (prevents flicker on polling)
      setTables((prev: any) => JSON.stringify(prev) === JSON.stringify(t.data) ? prev : t.data);
      setOrders((prev: any) => JSON.stringify(prev) === JSON.stringify(o.data) ? prev : o.data);
      setStats((prev: any) => JSON.stringify(prev) === JSON.stringify(s.data) ? prev : s.data);
    } catch { /* ignore */ }
  }, [myOnly]);

  const loadMenu = useCallback(async () => {
    try { const { data } = await api.getMenu(); setMenu(data); } catch { /* */ }
  }, []);

  useEffect(() => {
    if (!user) return;
    load();
    const iv = setInterval(load, 5000);
    return () => clearInterval(iv);
  }, [user, load]);

  useEffect(() => {
    if (tab === 'novo' && menu.length === 0) loadMenu();
  }, [tab, menu.length, loadMenu]);

  /* ---------- actions ---------- */
  const handleAdvance = async (id: string) => {
    // Optimistic: advance order status in local state instantly
    const statusOrder = ['ANALYSIS', 'PREPARING', 'READY', 'SERVED', 'DONE'];
    setOrders(prev => prev.map(o => {
      if (o.id !== id) return o;
      const idx = statusOrder.indexOf(o.status);
      const nextStatus = idx >= 0 && idx < statusOrder.length - 1 ? statusOrder[idx + 1] : o.status;
      return { ...o, status: nextStatus };
    }));
    setViewingOrder(null);
    setViewingTable(null);
    try { await api.advanceOrder(id); } catch { /* revert on error */ }
    load();
  };

  const handleFinalize = async (id: string, pm: string) => {
    // Optimistic: mark as DONE locally
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status: 'DONE', paymentMethod: pm } : o));
    setShowFinalize(null);
    setViewingOrder(null);
    setViewingTable(null);
    try { await api.finalizeOrder(id, pm); } catch { /* revert on error */ }
    load();
  };

  const handleCreateOrder = async () => {
    if (cart.length === 0) return;
    setCreatingOrder(true);
    try {
      await api.createOrder({
        restaurantTableId: selectedTable?.id,
        tableNumber: selectedTable ? String(selectedTable.number) : undefined,
        customerName: customerName || undefined,
        notes: orderNotes || undefined,
        sendToKitchen,
        items: cart.map(c => ({
          menuItemId: c.item.id,
          name: c.item.name,
          quantity: c.qty,
          unitPrice: c.item.price,
          notes: c.notes || undefined,
        })),
      });
      // Reset immediately, then background refresh
      setCart([]);
      setSelectedTable(null);
      setOrderNotes('');
      setCustomerName('');
      setSendToKitchen(true);
      setTab('pedidos');
      load();
    } catch { /* */ }
    setCreatingOrder(false);
  };

  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const idx = prev.findIndex(c => c.item.id === item.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], qty: next[idx].qty + 1 };
        return next;
      }
      return [...prev, { item, qty: 1, notes: '' }];
    });
  };

  const updateCartQty = (idx: number, qty: number) => {
    if (qty < 1) { setCart(prev => prev.filter((_, i) => i !== idx)); return; }
    setCart(prev => { const n = [...prev]; n[idx] = { ...n[idx], qty }; return n; });
  };

  /* ---------- rendering guards ---------- */
  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" /></div>;
  if (!user) return null;

  const cartTotal = cart.reduce((s, c) => s + c.item.price * c.qty, 0);

  /* ================================================================ */
  /*  RENDER                                                           */
  /* ================================================================ */
  return (
    <div className="min-h-screen pb-20">
      {/* -------- HEADER -------- */}
      <header className="sticky top-0 z-30 bg-[var(--header-bg)] backdrop-blur border-b border-[var(--border)] px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Image src="/logo.png" alt="Prize Club" width={90} height={34} className="h-7 w-auto dark:brightness-0 dark:invert" />
          <div className="h-5 w-px bg-[var(--border)]" />
          <h1 className="text-sm font-bold text-[var(--text)]">
            {tab === 'mesas' && 'Mesas'}
            {tab === 'pedidos' && 'Pedidos'}
            {tab === 'novo' && 'Novo Pedido'}
            {tab === 'perfil' && 'Perfil'}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {stats && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-[var(--text-muted)]">{stats.todayOrders} pedidos</span>
              <span className="text-primary-500 font-semibold">R$ {stats.todayRevenue?.toFixed(2).replace('.', ',')}</span>
            </div>
          )}
          <button
            onClick={toggleTheme}
            className="p-1.5 rounded-lg bg-[var(--subtle)] text-[var(--text-secondary)] hover:bg-[var(--subtle-hover)] transition"
          >
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>
      </header>

      {/* -------- TAB CONTENT -------- */}
      <main className="px-4 py-4">

        {/* == MESAS TAB == */}
        {tab === 'mesas' && (
          <div className="grid grid-cols-2 gap-3">
            {tables.map(t => (
              <button
                key={t.id}
                onClick={() => setViewingTable(t)}
                className={`relative p-4 rounded-2xl border transition text-left ${
                  t.isOccupied
                    ? 'bg-primary-500/10 border-primary-500/30'
                    : 'bg-[var(--card)] border-[var(--border)]'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-lg font-bold text-[var(--text)]">Mesa {t.number}</span>
                  {t.isOccupied && (
                    <span className="w-2.5 h-2.5 rounded-full bg-primary-500 animate-pulse" />
                  )}
                </div>
                {t.name && <p className="text-xs text-[var(--text-muted)] mb-1">{t.name}</p>}
                <p className="text-xs text-[var(--text-secondary)]">
                  {t.isOccupied ? `${t.activeOrdersCount} pedido${t.activeOrdersCount > 1 ? 's' : ''} ativo${t.activeOrdersCount > 1 ? 's' : ''}` : 'Livre'}
                </p>
              </button>
            ))}
          </div>
        )}

        {/* == PEDIDOS TAB == */}
        {tab === 'pedidos' && (
          <div className="space-y-3">
            <div className="flex gap-2">
              <button
                onClick={() => setMyOnly(false)}
                className={`flex-1 py-2 text-xs font-semibold rounded-xl transition ${!myOnly ? 'bg-primary-500 text-white' : 'bg-[var(--subtle)] text-[var(--text-secondary)]'}`}
              >
                Todos
              </button>
              <button
                onClick={() => setMyOnly(true)}
                className={`flex-1 py-2 text-xs font-semibold rounded-xl transition ${myOnly ? 'bg-primary-500 text-white' : 'bg-[var(--subtle)] text-[var(--text-secondary)]'}`}
              >
                Meus Pedidos
              </button>
            </div>

            {orders.length === 0 && (
              <div className="text-center py-12 text-[var(--text-muted)]">
                <ClipboardList size={40} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">Nenhum pedido aberto</p>
              </div>
            )}

            {orders.map(order => {
              const st = STATUS_CFG[order.status] || { label: order.status, color: 'bg-gray-500/15 text-gray-500' };
              return (
                <div
                  key={order.id}
                  onClick={() => setViewingOrder(order)}
                  className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-4 active:scale-[0.98] transition cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-[var(--text)]">#{order.number}</span>
                      {order.restaurantTable && (
                        <span className="text-xs text-[var(--text-muted)]">Mesa {order.restaurantTable.number}</span>
                      )}
                    </div>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${st.color}`}>{st.label}</span>
                  </div>
                  <div className="space-y-0.5 mb-2">
                    {order.items.slice(0, 3).map((item, i) => (
                      <p key={i} className="text-xs text-[var(--text-secondary)]">{item.quantity}x {item.name}</p>
                    ))}
                    {order.items.length > 3 && <p className="text-[10px] text-[var(--text-muted)]">+{order.items.length - 3} itens</p>}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[var(--text-muted)]">{timeAgo(order.createdAt)}</span>
                    <div className="flex items-center gap-2">
                      {order.waiter && <span className="text-[10px] text-[var(--text-muted)]">{order.waiter.name}</span>}
                      <span className="text-sm font-bold text-primary-500">R$ {order.total.toFixed(2).replace('.', ',')}</span>
                    </div>
                  </div>
                  {st.next && (
                    <div className="flex gap-2 mt-3 pt-3 border-t border-[var(--border)]">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleAdvance(order.id); }}
                        className="flex-1 flex items-center justify-center gap-1 bg-primary-500 hover:bg-primary-400 text-white text-xs font-semibold py-2 rounded-xl transition"
                      >
                        <ChevronRight size={14} /> {st.next}
                      </button>
                      {(order.status === 'SERVED' || order.status === 'DELIVERING') && (
                        <button
                          onClick={(e) => { e.stopPropagation(); setShowFinalize(order); }}
                          className="flex items-center justify-center gap-1 bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-semibold py-2 px-4 rounded-xl transition"
                        >
                          <DollarSign size={14} /> Pagar
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* == NOVO PEDIDO TAB == */}
        {tab === 'novo' && (
          <div className="space-y-4">
            {/* Table selection */}
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-2">Mesa</label>
              <div className="grid grid-cols-4 gap-2">
                {tables.map(t => (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTable(selectedTable?.id === t.id ? null : t)}
                    className={`py-2 text-xs font-semibold rounded-xl transition ${
                      selectedTable?.id === t.id
                        ? 'bg-primary-500 text-white'
                        : 'bg-[var(--subtle)] text-[var(--text-secondary)] hover:bg-[var(--subtle-hover)]'
                    }`}
                  >
                    {t.number}
                  </button>
                ))}
              </div>
            </div>

            {/* Customer name */}
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">Nome do cliente (opcional)</label>
              <input
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--text)] placeholder:text-[var(--text-muted)] outline-none focus:border-primary-500/50 transition text-sm"
                placeholder="Nome"
              />
            </div>

            {/* Menu search */}
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <input
                value={menuSearch}
                onChange={e => setMenuSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--text)] placeholder:text-[var(--text-muted)] outline-none focus:border-primary-500/50 transition text-sm"
                placeholder="Buscar no cardápio..."
              />
            </div>

            {/* Menu categories / items */}
            {expandedCat && !menuSearch ? (
              /* Items grid for selected category */
              <div>
                <button
                  onClick={() => setExpandedCat(null)}
                  className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)] hover:text-[var(--text)] mb-3 transition"
                >
                  <ChevronUp size={14} className="rotate-[-90deg]" /> Voltar às categorias
                </button>
                <p className="text-sm font-bold text-[var(--text)] mb-3">
                  {menu.find(c => c.id === expandedCat)?.name}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {(menu.find(c => c.id === expandedCat)?.items || []).map(item => {
                    const inCart = cart.find(c => c.item.id === item.id);
                    return (
                      <div key={item.id} className="bg-[var(--card)] border border-[var(--border)] rounded-2xl overflow-hidden">
                        {item.image ? (
                          <img src={item.image} alt="" className="w-full h-24 object-cover" />
                        ) : (
                          <div className="w-full h-16 bg-[var(--subtle)] flex items-center justify-center text-[var(--text-muted)] text-2xl">🍽️</div>
                        )}
                        <div className="p-2.5">
                          <p className="text-xs font-semibold text-[var(--text)] truncate">{item.name}</p>
                          <p className="text-xs text-primary-500 font-bold mt-0.5">R$ {item.price.toFixed(2).replace('.', ',')}</p>
                          <div className="mt-2">
                            {inCart ? (
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() => updateCartQty(cart.indexOf(inCart), inCart.qty - 1)}
                                  className="w-7 h-7 flex items-center justify-center rounded-lg bg-[var(--subtle)] text-[var(--text-secondary)]"
                                >
                                  <Minus size={12} />
                                </button>
                                <span className="text-sm font-bold text-[var(--text)] w-5 text-center">{inCart.qty}</span>
                                <button
                                  onClick={() => updateCartQty(cart.indexOf(inCart), inCart.qty + 1)}
                                  className="w-7 h-7 flex items-center justify-center rounded-lg bg-primary-500 text-white"
                                >
                                  <Plus size={12} />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => addToCart(item)}
                                className="w-full text-xs bg-primary-500/15 text-primary-500 font-semibold py-1.5 rounded-lg hover:bg-primary-500/25 transition"
                              >
                                Adicionar
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : menuSearch ? (
              /* Search results - flat grid */
              <div className="grid grid-cols-2 gap-2">
                {menu.flatMap(cat => cat.items).filter(i => i.name.toLowerCase().includes(menuSearch.toLowerCase())).map(item => {
                  const inCart = cart.find(c => c.item.id === item.id);
                  return (
                    <div key={item.id} className="bg-[var(--card)] border border-[var(--border)] rounded-2xl overflow-hidden">
                      {item.image ? (
                        <img src={item.image} alt="" className="w-full h-24 object-cover" />
                      ) : (
                        <div className="w-full h-16 bg-[var(--subtle)] flex items-center justify-center text-[var(--text-muted)] text-2xl">🍽️</div>
                      )}
                      <div className="p-2.5">
                        <p className="text-xs font-semibold text-[var(--text)] truncate">{item.name}</p>
                        <p className="text-xs text-primary-500 font-bold mt-0.5">R$ {item.price.toFixed(2).replace('.', ',')}</p>
                        <div className="mt-2">
                          {inCart ? (
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => updateCartQty(cart.indexOf(inCart), inCart.qty - 1)}
                                className="w-7 h-7 flex items-center justify-center rounded-lg bg-[var(--subtle)] text-[var(--text-secondary)]"
                              >
                                <Minus size={12} />
                              </button>
                              <span className="text-sm font-bold text-[var(--text)] w-5 text-center">{inCart.qty}</span>
                              <button
                                onClick={() => updateCartQty(cart.indexOf(inCart), inCart.qty + 1)}
                                className="w-7 h-7 flex items-center justify-center rounded-lg bg-primary-500 text-white"
                              >
                                <Plus size={12} />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => addToCart(item)}
                              className="w-full text-xs bg-primary-500/15 text-primary-500 font-semibold py-1.5 rounded-lg hover:bg-primary-500/25 transition"
                            >
                              Adicionar
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {menu.flatMap(cat => cat.items).filter(i => i.name.toLowerCase().includes(menuSearch.toLowerCase())).length === 0 && (
                  <div className="col-span-2 text-center py-8 text-[var(--text-muted)] text-sm">Nenhum item encontrado</div>
                )}
              </div>
            ) : (
              /* Category cards */
              <div className="grid grid-cols-2 gap-2">
                {menu.filter(c => c.items.length > 0).map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setExpandedCat(cat.id)}
                    className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-4 text-left hover:border-primary-500/30 hover:bg-primary-500/5 transition flex flex-col items-center justify-center min-h-[80px]"
                  >
                    <span className="text-sm font-bold text-[var(--text)] text-center">{cat.name}</span>
                    <span className="text-xs text-[var(--text-muted)] mt-1">{cat.items.length} {cat.items.length === 1 ? 'item' : 'itens'}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Order notes */}
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">Observações (opcional)</label>
              <textarea
                value={orderNotes}
                onChange={e => setOrderNotes(e.target.value)}
                rows={2}
                className="w-full px-4 py-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--text)] placeholder:text-[var(--text-muted)] outline-none focus:border-primary-500/50 transition text-sm resize-none"
                placeholder="Ex: sem cebola, ponto da carne..."
              />
            </div>

            {/* Send to kitchen toggle */}
            <div className="flex gap-2">
              <button
                onClick={() => setSendToKitchen(true)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold border transition ${
                  sendToKitchen
                    ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-400'
                    : 'bg-[var(--card)] border-[var(--border)] text-[var(--text-muted)]'
                }`}
              >
                👨‍🍳 Enviar p/ Cozinha
              </button>
              <button
                onClick={() => setSendToKitchen(false)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold border transition ${
                  !sendToKitchen
                    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                    : 'bg-[var(--card)] border-[var(--border)] text-[var(--text-muted)]'
                }`}
              >
                🍺 Retirar no Balcão
              </button>
            </div>

            {/* Cart summary */}
            {cart.length > 0 && (
              <div className="bg-[var(--card)] border border-primary-500/20 rounded-2xl p-4">
                <h3 className="text-sm font-semibold text-[var(--text)] mb-3">Resumo do Pedido</h3>
                <div className="space-y-1.5 mb-3">
                  {cart.map((c, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <span className="text-[var(--text-secondary)]">{c.qty}x {c.item.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[var(--text)]">R$ {(c.item.price * c.qty).toFixed(2).replace('.', ',')}</span>
                        <button onClick={() => updateCartQty(i, 0)} className="text-red-400 hover:text-red-300"><X size={12} /></button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-[var(--border)]">
                  <span className="text-sm font-semibold text-[var(--text)]">Total</span>
                  <span className="text-lg font-bold text-primary-500">R$ {cartTotal.toFixed(2).replace('.', ',')}</span>
                </div>
              </div>
            )}

            {/* Spacer for floating button */}
            {cart.length > 0 && <div className="h-20" />}
          </div>
        )}

        {/* Floating send button — above bottom nav */}
        {tab === 'novo' && cart.length > 0 && (
          <div className="fixed bottom-[72px] inset-x-0 z-30 px-4 pb-2">
            <button
              onClick={handleCreateOrder}
              disabled={creatingOrder}
              className="w-full py-3.5 bg-primary-500 hover:bg-primary-400 disabled:opacity-50 text-white font-bold rounded-2xl transition flex items-center justify-center gap-2 shadow-lg shadow-primary-500/30"
            >
              {creatingOrder ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <PlusCircle size={18} />
                  {sendToKitchen ? '👨‍🍳 Enviar p/ Cozinha' : '🍺 Retirar no Balcão'} — R$ {cartTotal.toFixed(2).replace('.', ',')}
                </>
              )}
            </button>
          </div>
        )}

        {/* == PERFIL TAB == */}
        {tab === 'perfil' && (
          <div className="space-y-4">
            <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5 text-center">
              <div className="w-16 h-16 bg-primary-500/15 rounded-full flex items-center justify-center mx-auto mb-3">
                <User size={28} className="text-primary-500" />
              </div>
              <h2 className="text-lg font-bold text-[var(--text)]">{user.name}</h2>
              <p className="text-xs text-[var(--text-muted)]">{user.email}</p>
              <span className="inline-block mt-2 text-[10px] font-semibold bg-primary-500/15 text-primary-500 px-3 py-0.5 rounded-full">GARÇOM</span>
            </div>

            {stats && (
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-4 text-center">
                  <p className="text-2xl font-bold text-[var(--text)]">{stats.todayOrders}</p>
                  <p className="text-[10px] text-[var(--text-muted)]">Pedidos Hoje</p>
                </div>
                <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-4 text-center">
                  <p className="text-2xl font-bold text-primary-500">R$ {stats.todayRevenue?.toFixed(0)}</p>
                  <p className="text-[10px] text-[var(--text-muted)]">Vendas</p>
                </div>
                <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-4 text-center">
                  <p className="text-2xl font-bold text-emerald-500">R$ {stats.todayCommission?.toFixed(0)}</p>
                  <p className="text-[10px] text-[var(--text-muted)]">Comissão</p>
                </div>
              </div>
            )}

            <button
              onClick={logout}
              className="w-full flex items-center justify-center gap-2 py-3 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl font-semibold text-sm transition hover:bg-red-500/20"
            >
              <LogOut size={18} />
              Sair
            </button>
          </div>
        )}
      </main>

      {/* -------- ORDER DETAIL MODAL -------- */}
      {viewingOrder && (
        <div className="fixed inset-0 z-50 bg-[var(--overlay)] flex items-end sm:items-center justify-center" onClick={() => setViewingOrder(null)}>
          <div className="bg-[var(--bg)] w-full max-w-lg rounded-t-3xl sm:rounded-3xl max-h-[85vh] overflow-y-auto border border-[var(--border)]" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-[var(--bg)] border-b border-[var(--border)] px-5 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-[var(--text)]">Pedido #{viewingOrder.number}</h2>
                <p className="text-xs text-[var(--text-muted)]">{new Date(viewingOrder.createdAt).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}</p>
              </div>
              <button onClick={() => setViewingOrder(null)} className="p-1"><X size={20} className="text-[var(--text-muted)]" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex gap-2 flex-wrap">
                {(() => { const s = STATUS_CFG[viewingOrder.status]; return s && <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${s.color}`}>{s.label}</span>; })()}
                {viewingOrder.restaurantTable && <span className="text-xs bg-[var(--subtle)] text-[var(--text-secondary)] px-2.5 py-1 rounded-full">Mesa {viewingOrder.restaurantTable.number}</span>}
                {viewingOrder.waiter && <span className="text-xs bg-[var(--subtle)] text-[var(--text-secondary)] px-2.5 py-1 rounded-full">👤 {viewingOrder.waiter.name}</span>}
              </div>

              {viewingOrder.customerName && <p className="text-sm text-[var(--text-secondary)]">Cliente: {viewingOrder.customerName}</p>}
              {viewingOrder.notes && <p className="text-sm text-[var(--text-muted)] italic">{viewingOrder.notes}</p>}

              <div className="space-y-2">
                {viewingOrder.items.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-[var(--text-secondary)]">{item.quantity}x {item.name}</span>
                    <span className="text-[var(--text-secondary)]">R$ {(item.unitPrice * item.quantity).toFixed(2).replace('.', ',')}</span>
                  </div>
                ))}
              </div>

              <div className="flex justify-between pt-3 border-t border-[var(--border)]">
                <span className="text-sm font-semibold text-[var(--text)]">Total</span>
                <span className="text-lg font-bold text-primary-500">R$ {viewingOrder.total.toFixed(2).replace('.', ',')}</span>
              </div>

              {viewingOrder.paymentMethod && (
                <p className="text-xs text-[var(--text-muted)]">Pagamento: {viewingOrder.paymentMethod}</p>
              )}

              {STATUS_CFG[viewingOrder.status]?.next && (
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => handleAdvance(viewingOrder.id)}
                    className="flex-1 flex items-center justify-center gap-2 bg-primary-500 hover:bg-primary-400 text-white py-3 rounded-xl font-semibold text-sm transition"
                  >
                    <ChevronRight size={16} /> {STATUS_CFG[viewingOrder.status]?.next}
                  </button>
                  {(viewingOrder.status === 'SERVED' || viewingOrder.status === 'DELIVERING') && (
                    <button
                      onClick={() => { setShowFinalize(viewingOrder); setViewingOrder(null); }}
                      className="flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white py-3 px-5 rounded-xl font-semibold text-sm transition"
                    >
                      <DollarSign size={16} /> Pagar
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* -------- TABLE DETAIL MODAL -------- */}
      {viewingTable && (
        <div className="fixed inset-0 z-50 bg-[var(--overlay)] flex items-end sm:items-center justify-center" onClick={() => setViewingTable(null)}>
          <div className="bg-[var(--bg)] w-full max-w-lg rounded-t-3xl sm:rounded-3xl max-h-[85vh] overflow-y-auto border border-[var(--border)]" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-[var(--bg)] border-b border-[var(--border)] px-5 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-[var(--text)]">Mesa {viewingTable.number}</h2>
                <p className="text-xs text-[var(--text-muted)]">{viewingTable.isOccupied ? `${viewingTable.activeOrdersCount} pedidos ativos` : 'Livre'}</p>
              </div>
              <button onClick={() => setViewingTable(null)} className="p-1"><X size={20} className="text-[var(--text-muted)]" /></button>
            </div>
            <div className="p-5 space-y-3">
              {viewingTable.orders.length === 0 && (
                <p className="text-center text-[var(--text-muted)] py-8 text-sm">Nenhum pedido nesta mesa</p>
              )}
              {viewingTable.orders.map(order => {
                const st = STATUS_CFG[order.status] || { label: order.status, color: 'bg-gray-500/15 text-gray-500' };
                return (
                  <div key={order.id} className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-[var(--text)]">#{order.number}</span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${st.color}`}>{st.label}</span>
                    </div>
                    <div className="space-y-0.5">
                      {order.items.map((item, i) => (
                        <p key={i} className="text-xs text-[var(--text-secondary)]">{item.quantity}x {item.name}</p>
                      ))}
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-[var(--border)]">
                      <span className="text-xs text-[var(--text-muted)]">{timeAgo(order.createdAt)}</span>
                      <span className="text-sm font-bold text-primary-500">R$ {order.total.toFixed(2).replace('.', ',')}</span>
                    </div>
                    {st.next && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAdvance(order.id)}
                          className="flex-1 flex items-center justify-center gap-1 bg-primary-500 hover:bg-primary-400 text-white text-xs font-semibold py-2 rounded-xl transition"
                        >
                          <ChevronRight size={12} /> {st.next}
                        </button>
                        {(order.status === 'SERVED' || order.status === 'DELIVERING') && (
                          <button
                            onClick={() => setShowFinalize(order)}
                            className="flex items-center justify-center gap-1 bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-semibold py-2 px-3 rounded-xl transition"
                          >
                            <DollarSign size={12} /> Pagar
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              <button
                onClick={() => { setViewingTable(null); setSelectedTable(viewingTable); setTab('novo'); }}
                className="w-full flex items-center justify-center gap-2 py-3 bg-primary-500/15 text-primary-500 border border-primary-500/20 rounded-xl font-semibold text-sm transition hover:bg-primary-500/25"
              >
                <PlusCircle size={16} /> Novo Pedido nesta Mesa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* -------- FINALIZE / PAYMENT MODAL -------- */}
      {showFinalize && (
        <div className="fixed inset-0 z-50 bg-[var(--overlay)] flex items-end sm:items-center justify-center" onClick={() => setShowFinalize(null)}>
          <div className="bg-[var(--bg)] w-full max-w-sm rounded-t-3xl sm:rounded-3xl border border-[var(--border)] p-6" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-[var(--text)] mb-1">Finalizar Pedido #{showFinalize.number}</h2>
            <p className="text-2xl font-bold text-primary-500 mb-5">R$ {showFinalize.total.toFixed(2).replace('.', ',')}</p>
            <p className="text-xs text-[var(--text-secondary)] mb-3">Forma de pagamento</p>
            <div className="grid grid-cols-2 gap-3">
              {PAYMENT_METHODS.map(pm => (
                <button
                  key={pm.key}
                  onClick={() => handleFinalize(showFinalize.id, pm.key)}
                  className="flex flex-col items-center gap-2 py-4 bg-[var(--card)] border border-[var(--border)] rounded-2xl hover:border-primary-500/30 transition"
                >
                  <pm.icon size={24} className="text-primary-500" />
                  <span className="text-sm font-semibold text-[var(--text)]">{pm.label}</span>
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowFinalize(null)}
              className="w-full mt-4 py-3 text-sm text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* -------- BOTTOM NAV -------- */}
      <nav className="fixed bottom-0 inset-x-0 z-40 bg-[var(--header-bg)] backdrop-blur border-t border-[var(--border)] safe-area-pb">
        <div className="flex justify-around py-2">
          {([
            { key: 'mesas', icon: LayoutGrid, label: 'Mesas' },
            { key: 'pedidos', icon: ClipboardList, label: 'Pedidos' },
            { key: 'novo', icon: PlusCircle, label: 'Novo' },
            { key: 'perfil', icon: User, label: 'Perfil' },
          ] as const).map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 transition ${
                tab === t.key ? 'text-primary-500' : 'text-[var(--text-muted)]'
              }`}
            >
              <t.icon size={22} />
              <span className="text-[10px] font-medium">{t.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}

/* ================================================================== */
/*  PAGE WRAPPER                                                       */
/* ================================================================== */
export default function GarcomPage() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
