'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Monitor, Plus, X, Search, Trash2, Edit2, Save,
  DollarSign, CreditCard, Smartphone, Banknote, Ticket,
  Users, ChefHat, Hash, ArrowRight, ArrowDown, ArrowUp,
  Clock, CheckCircle, XCircle, ShoppingCart, Percent,
  LayoutGrid, History, Settings2, Receipt, Link2, Copy, RefreshCw,
  Grid3X3, List, ArrowLeft,
} from 'lucide-react';
import {
  getPdvTables, createPdvTable, updatePdvTable, deletePdvTable, generateTableToken,
  getPdvWaiters, createPdvWaiter, updatePdvWaiter, deletePdvWaiter, getWaiterCommissions,
  getPdvTerminals, createPdvTerminal, updatePdvTerminal, deletePdvTerminal,
  openCashRegister, closeCashRegister, getCashRegisters, getCashRegister,
  getCashRegisterHistory, addCashTransaction,
  createPdvSell, finalizePdvOrders, getPdvStats,
  getMenuCategories,
  getOrders, advanceOrder,
} from '@/services/api';

// ── Types ──────────────────────────────────────────────────
interface Table { id: string; number: number; name?: string; capacity: number; isActive: boolean; selfServiceToken?: string; }
interface Waiter { id: string; name: string; commissionRate: number; isActive: boolean; }
interface Terminal { id: string; name: string; isActive: boolean; cashRegisters?: any[]; }
interface CashReg { id: string; terminalId: string; operatorName: string; openingAmount: number; closingAmount?: number; expectedAmount?: number; totalSales: number; totalOrders: number; status: string; openedAt: string; closedAt?: string; notes?: string; terminal?: Terminal; orders?: any[]; transactions?: any[]; _count?: { orders: number }; }
interface MenuItem { id: string; name: string; price: number; image?: string; categoryId: string; }
interface MenuCategory { id: string; name: string; items: MenuItem[]; }
interface CartItem { menuItemId?: string; name: string; quantity: number; unitPrice: number; notes?: string; }

// ── Payment methods ────────────────────────────────────────
const PAY_METHODS = [
  { key: 'CASH', label: 'Dinheiro', icon: Banknote, color: 'text-green-500' },
  { key: 'CREDIT', label: 'Crédito', icon: CreditCard, color: 'text-blue-500' },
  { key: 'DEBIT', label: 'Débito', icon: CreditCard, color: 'text-cyan-500' },
  { key: 'PIX', label: 'PIX', icon: Smartphone, color: 'text-purple-500' },
  { key: 'VOUCHER', label: 'Voucher', icon: Ticket, color: 'text-orange-500' },
];

const TABS = [
  { key: 'sell', label: 'Venda', icon: ShoppingCart },
  { key: 'tables', label: 'Mesas', icon: LayoutGrid },
  { key: 'waiters', label: 'Garçons', icon: Users },
  { key: 'terminals', label: 'Terminais', icon: Monitor },
  { key: 'history', label: 'Histórico', icon: History },
  { key: 'settings', label: 'Caixa', icon: Settings2 },
];

function fmt(v: number) { return `R$ ${v.toFixed(2).replace('.', ',')}`; }
function fmtDate(d: string) { return new Date(d).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' }); }

// ╔═══════════════════════════════════════════════════════════
// ║  PDV PAGE
// ╚═══════════════════════════════════════════════════════════
export default function PdvPage() {
  const [tab, setTab] = useState('sell');
  const [tables, setTables] = useState<Table[]>([]);
  const [waiters, setWaiters] = useState<Waiter[]>([]);
  const [terminals, setTerminals] = useState<Terminal[]>([]);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [activeCashRegister, setActiveCashRegister] = useState<CashReg | null>(null);
  const [cashRegisters, setCashRegisters] = useState<CashReg[]>([]);
  const [closedHistory, setClosedHistory] = useState<CashReg[]>([]);
  const [stats, setStats] = useState<any>({});

  // Sell state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedTable, setSelectedTable] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [discount, setDiscount] = useState(0);
  const [discountType, setDiscountType] = useState('PERCENT');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [requiresPrep, setRequiresPrep] = useState(true);
  const [waiterFee, setWaiterFee] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('pdv_waiter_fee') === 'true';
    return false;
  });

  const toggleWaiterFee = (v: boolean) => {
    setWaiterFee(v);
    localStorage.setItem('pdv_waiter_fee', v ? 'true' : 'false');
  };
  const [menuSearch, setMenuSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('');
  const [selling, setSelling] = useState(false);
  const [categoryView, setCategoryView] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('pdv_category_view') === 'true';
    return false;
  });
  const [activeCatId, setActiveCatId] = useState<string | null>(null);

  const toggleCategoryView = (v: boolean) => {
    setCategoryView(v);
    setActiveCatId(null);
    localStorage.setItem('pdv_category_view', v ? 'true' : 'false');
  };

  // Modals
  const [showConfirmSell, setShowConfirmSell] = useState(false);
  const [showCloseAccount, setShowCloseAccount] = useState(false);
  const [showOpenCash, setShowOpenCash] = useState(false);
  const [showCloseCash, setShowCloseCash] = useState(false);
  const [showCashDetails, setShowCashDetails] = useState<CashReg | null>(null);
  const [showTransactionModal, setShowTransactionModal] = useState(false);

  // CRUD modals
  const [editTable, setEditTable] = useState<Table | null>(null);
  const [editWaiter, setEditWaiter] = useState<Waiter | null>(null);
  const [editTerminal, setEditTerminal] = useState<Terminal | null>(null);
  const [showNewTable, setShowNewTable] = useState(false);
  const [showNewWaiter, setShowNewWaiter] = useState(false);
  const [showNewTerminal, setShowNewTerminal] = useState(false);

  // Table orders modal
  const [tableOrdersModal, setTableOrdersModal] = useState<Table | null>(null);
  const [tableOrders, setTableOrders] = useState<any[]>([]);
  const [loadingTableOrders, setLoadingTableOrders] = useState(false);

  // Existing orders for selected table (shown in Venda tab)
  const [tableExistingOrders, setTableExistingOrders] = useState<any[]>([]);

  const openTableOrders = async (t: Table) => {
    setTableOrdersModal(t);
    setLoadingTableOrders(true);
    try {
      const { data } = await getOrders({ restaurantTableId: t.id });
      const open = data.filter((o: any) => !['DONE', 'CANCELLED'].includes(o.status));
      setTableOrders(open);
    } catch { setTableOrders([]); }
    setLoadingTableOrders(false);
  };

  const selectTableAndGoToSell = async (t: Table) => {
    setSelectedTable(t.id);
    setTab('sell');
    try {
      const { data } = await getOrders({ restaurantTableId: t.id });
      const open = data.filter((o: any) => !['DONE', 'CANCELLED'].includes(o.status));
      setTableExistingOrders(open);
    } catch { setTableExistingOrders([]); }
  };

  const handleAdvanceTableOrder = async (orderId: string) => {
    await advanceOrder(orderId);
    if (tableOrdersModal) openTableOrders(tableOrdersModal);
    load();
  };

  // Commission view
  const [viewCommissions, setViewCommissions] = useState<{ waiter: Waiter; data: any } | null>(null);

  const load = useCallback(async () => {
    const [t, w, tm, cats, cr, st] = await Promise.all([
      getPdvTables().then(r => r.data).catch(() => []),
      getPdvWaiters().then(r => r.data).catch(() => []),
      getPdvTerminals().then(r => r.data).catch(() => []),
      getMenuCategories().then(r => r.data).catch(() => []),
      getCashRegisters({ status: 'OPEN' }).then(r => r.data).catch(() => []),
      getPdvStats().then(r => r.data).catch(() => ({})),
    ]);
    setTables(t); setWaiters(w); setTerminals(tm); setCategories(cats);
    setCashRegisters(cr); setStats(st);
    // If there's an active cash register stored, refresh it
    const stored = typeof window !== 'undefined' ? localStorage.getItem('pdv_cash_register_id') : null;
    if (stored) {
      const active = cr.find((c: CashReg) => c.id === stored);
      if (active) setActiveCashRegister(active);
      else { localStorage.removeItem('pdv_cash_register_id'); setActiveCashRegister(null); }
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const loadHistory = useCallback(async () => {
    const h = await getCashRegisterHistory().then(r => r.data).catch(() => []);
    setClosedHistory(h);
  }, []);

  useEffect(() => { if (tab === 'history') loadHistory(); }, [tab, loadHistory]);

  // ── Cart logic ──────────────────────────────────────────
  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(c => c.menuItemId === item.id);
      if (existing) return prev.map(c => c.menuItemId === item.id ? { ...c, quantity: c.quantity + 1 } : c);
      return [...prev, { menuItemId: item.id, name: item.name, quantity: 1, unitPrice: item.price }];
    });
  };

  const updateCartQty = (idx: number, qty: number) => {
    if (qty <= 0) return setCart(prev => prev.filter((_, i) => i !== idx));
    setCart(prev => prev.map((c, i) => i === idx ? { ...c, quantity: qty } : c));
  };

  const removeFromCart = (idx: number) => setCart(prev => prev.filter((_, i) => i !== idx));

  const subtotal = cart.reduce((s, c) => s + c.unitPrice * c.quantity, 0);
  const discountValue = discountType === 'PERCENT' ? subtotal * (discount / 100) : discount;
  const afterDiscount = Math.max(0, subtotal - discountValue);
  const waiterFeeValue = waiterFee ? afterDiscount * 0.1 : 0;
  const total = afterDiscount + waiterFeeValue;

  // ── Enviar Pedido (sem pagamento) ────────────────────────
  const handleSendOrder = async () => {
    if (!activeCashRegister || cart.length === 0) return;
    setSelling(true);
    try {
      await createPdvSell({
        type: selectedTable ? 'TABLE' : 'COUNTER',
        restaurantTableId: selectedTable || undefined,
        cashRegisterId: activeCashRegister.id,
        customerName: customerName || undefined,
        tableNumber: selectedTable ? tables.find(t => t.id === selectedTable)?.number?.toString() : undefined,
        notes: orderNotes || undefined,
        discount: discount || 0,
        discountType: discount > 0 ? discountType : undefined,
        requiresPreparation: requiresPrep,
        items: cart,
      });
      // Reset
      setCart([]); setCustomerName('');
      setOrderNotes(''); setDiscount(0); setRequiresPrep(true);
      // Reload existing orders for the table (if table selected, keep it)
      if (selectedTable) {
        try {
          const { data } = await getOrders({ restaurantTableId: selectedTable });
          setTableExistingOrders(data.filter((o: any) => !['DONE', 'CANCELLED'].includes(o.status)));
        } catch { setTableExistingOrders([]); }
      }
      load();
    } catch (e: any) {
      alert(e.response?.data?.message || 'Erro ao criar pedido');
    }
    setSelling(false);
  };

  // ── Fechar Conta (com pagamento) ──────────────────────
  const handleCloseAccount = async (selectedPayMethod: string) => {
    if (!activeCashRegister) return;
    setSelling(true);
    try {
      // If there are cart items, send them as an order with payment
      let newOrderId: string | null = null;
      if (cart.length > 0) {
        const res = await createPdvSell({
          type: selectedTable ? 'TABLE' : 'COUNTER',
          restaurantTableId: selectedTable || undefined,
          cashRegisterId: activeCashRegister.id,
          customerName: customerName || undefined,
          tableNumber: selectedTable ? tables.find(t => t.id === selectedTable)?.number?.toString() : undefined,
          notes: orderNotes || undefined,
          discount: discount || 0,
          discountType: discount > 0 ? discountType : undefined,
          paymentMethod: selectedPayMethod,
          requiresPreparation: requiresPrep,
          items: cart,
        });
        newOrderId = res.data?.id;
      }

      // Finalize existing open orders on the table (any paymentMethod that isn't already resolved)
      const pendingOrderIds = tableExistingOrders.map((o: any) => o.id);
      if (pendingOrderIds.length > 0) {
        // Compute waiter fee on the FULL combined total (existing orders + new cart after discount)
        const existingOrdersTotal = tableExistingOrders.reduce((s: number, o: any) => s + o.total, 0);
        const combinedBeforeFee = afterDiscount + existingOrdersTotal;
        const waiterFeeAmount = waiterFee ? combinedBeforeFee * 0.1 : 0;
        await finalizePdvOrders({
          orderIds: pendingOrderIds,
          paymentMethod: selectedPayMethod,
          cashRegisterId: activeCashRegister.id,
          waiterFeeAmount: waiterFeeAmount > 0 ? waiterFeeAmount : undefined,
        });
      }

      // Reset
      setCart([]); setSelectedTable(''); setCustomerName('');
      setOrderNotes(''); setDiscount(0); setPaymentMethod('CASH'); setRequiresPrep(true);
      setTableExistingOrders([]);
      load();
    } catch (e: any) {
      alert(e.response?.data?.message || 'Erro ao fechar conta');
    }
    setSelling(false);
  };

  // ── Open/Close cash register ────────────────────────────
  const handleOpenCash = async (terminalId: string, operatorName: string, openingAmount: number) => {
    try {
      const res = await openCashRegister({ terminalId, operatorName, openingAmount });
      setActiveCashRegister(res.data);
      localStorage.setItem('pdv_cash_register_id', res.data.id);
      setShowOpenCash(false);
      load();
    } catch (e: any) {
      alert(e.response?.data?.message || 'Erro ao abrir caixa');
    }
  };

  const handleCloseCash = async (closingAmount: number, notes: string) => {
    if (!activeCashRegister) return;
    try {
      await closeCashRegister(activeCashRegister.id, { closingAmount, notes });
      setActiveCashRegister(null);
      localStorage.removeItem('pdv_cash_register_id');
      setShowCloseCash(false);
      load();
    } catch (e: any) {
      alert(e.response?.data?.message || 'Erro ao fechar caixa');
    }
  };

  // Filter menu items
  const filteredItems = categories.flatMap(cat => {
    if (selectedCat && cat.id !== selectedCat) return [];
    return cat.items.filter(i => {
      if (!menuSearch) return true;
      return i.name.toLowerCase().includes(menuSearch.toLowerCase());
    }).map(i => ({ ...i, categoryName: cat.name }));
  });

  // ═══════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold text-th flex items-center gap-2">
            <Monitor size={24} className="text-primary-500" /> PDV - Ponto de Venda
          </h1>
          <p className="text-sm text-th-muted mt-0.5">
            {activeCashRegister
              ? <span className="text-emerald-500 font-semibold">● Caixa aberto — {activeCashRegister.terminal?.name || 'Terminal'} — {activeCashRegister.operatorName}</span>
              : <span className="text-red-400">● Nenhum caixa aberto</span>
            }
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {!activeCashRegister ? (
            <button onClick={() => setShowOpenCash(true)} className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white px-4 py-2 rounded-xl text-sm font-semibold transition">
              <Plus size={16} /> Abrir Caixa
            </button>
          ) : (
            <>
              <div className="bg-emerald-500/10 text-emerald-500 text-sm font-bold px-4 py-2 rounded-xl">
                {fmt(activeCashRegister.totalSales)} — {activeCashRegister.totalOrders} vendas
              </div>
              <button onClick={() => setShowTransactionModal(true)} className="flex items-center gap-2 bg-blue-500 hover:bg-blue-400 text-white px-3 py-2 rounded-xl text-sm font-semibold transition">
                <ArrowDown size={14} /> Sangria/Suprimento
              </button>
              <button onClick={() => setShowCloseCash(true)} className="flex items-center gap-2 bg-red-500 hover:bg-red-400 text-white px-4 py-2 rounded-xl text-sm font-semibold transition">
                <XCircle size={16} /> Fechar Caixa
              </button>
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-th-card border border-th rounded-xl p-1 overflow-x-auto">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap ${tab === t.key ? 'bg-primary-500 text-white' : 'text-th-muted hover:text-th hover:bg-th-hover'}`}>
            <t.icon size={14} /> {t.label}
          </button>
        ))}
      </div>

      {/* ─── SELL TAB ──────────────────────────────────── */}
      {tab === 'sell' && (
        <div className="grid grid-cols-12 gap-3" style={{ minHeight: 'calc(100vh - 220px)' }}>
          {/* LEFT: Menu Items */}
          <div className="col-span-8 bg-th-card border border-th rounded-2xl p-3 flex flex-col">
            <div className="flex gap-2 mb-2">
              {categoryView && activeCatId && (
                <button onClick={() => setActiveCatId(null)} className="flex items-center gap-1 bg-th border border-th rounded-xl px-3 py-1.5 text-sm text-th-muted hover:text-th transition">
                  <ArrowLeft size={14} /> Voltar
                </button>
              )}
              <div className="relative flex-1">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-th-muted" />
                <input type="text" placeholder="Buscar item..." value={menuSearch} onChange={e => { setMenuSearch(e.target.value); if (categoryView && e.target.value) setActiveCatId(null); }}
                  className="w-full pl-9 pr-3 py-1.5 bg-th border border-th rounded-xl text-sm text-th placeholder:text-th-muted focus:outline-none focus:ring-2 focus:ring-primary-500/30" />
              </div>
              {!categoryView && (
                <select value={selectedCat} onChange={e => setSelectedCat(e.target.value)}
                  className="bg-th border border-th rounded-xl px-3 py-1.5 text-sm text-th focus:outline-none">
                  <option value="">Todas</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              )}
              <button
                onClick={() => toggleCategoryView(!categoryView)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium border transition ${categoryView ? 'bg-primary-500/15 text-primary-500 border-primary-500/30' : 'bg-th border-th text-th-muted hover:text-th'}`}
                title={categoryView ? 'Visualização por categoria' : 'Visualização em lista'}
              >
                {categoryView ? <Grid3X3 size={14} /> : <List size={14} />}
                {categoryView ? 'Categorias' : 'Lista'}
              </button>
            </div>

            {/* Category cards view */}
            {categoryView && !activeCatId && !menuSearch ? (
              <div className="flex-1 overflow-y-auto grid grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 auto-rows-min">
                {categories.filter(c => c.items.length > 0).map(cat => (
                  <button key={cat.id} onClick={() => setActiveCatId(cat.id)}
                    className="text-left bg-th border border-th rounded-2xl p-4 hover:border-primary-500/40 hover:bg-primary-500/5 transition group flex flex-col items-center justify-center min-h-[100px]">
                    <p className="text-base font-bold text-th text-center">{cat.name}</p>
                    <p className="text-xs text-th-muted mt-1">{cat.items.length} {cat.items.length === 1 ? 'item' : 'itens'}</p>
                  </button>
                ))}
                {categories.filter(c => c.items.length > 0).length === 0 && (
                  <div className="col-span-full text-center py-10 text-th-muted text-sm">Nenhuma categoria</div>
                )}
              </div>
            ) : (
              /* Flat item grid (default or inside a category) */
              <div className="flex-1 overflow-y-auto">
                {categoryView && activeCatId && (
                  <p className="text-sm font-bold text-th mb-2 px-1">
                    {categories.find(c => c.id === activeCatId)?.name}
                  </p>
                )}
                <div className="grid grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-2 auto-rows-min">
                  {(categoryView && activeCatId
                    ? categories.find(c => c.id === activeCatId)?.items || []
                    : filteredItems
                  ).map(item => (
                    <button key={item.id} onClick={() => addToCart(item)}
                      className="text-left bg-th border border-th rounded-xl p-2 hover:border-primary-500/40 hover:bg-primary-500/5 transition group">
                      {item.image && (
                        <img src={item.image} alt="" className="w-full h-14 object-cover rounded-lg mb-1.5" />
                      )}
                      <p className="text-[11px] font-semibold text-th truncate">{item.name}</p>
                      <p className="text-[11px] text-primary-500 font-bold">{fmt(item.price)}</p>
                    </button>
                  ))}
                  {((categoryView && activeCatId
                    ? categories.find(c => c.id === activeCatId)?.items || []
                    : filteredItems
                  ).length === 0) && (
                    <div className="col-span-full text-center py-10 text-th-muted text-sm">Nenhum item encontrado</div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT: Cart + Options */}
          <div className="col-span-4 flex flex-col" style={{ height: 'calc(100vh - 220px)' }}>
            {/* Scrollable cart items */}
            <div className="bg-th-card border border-th rounded-t-2xl p-4 flex-1 min-h-0 flex flex-col overflow-hidden">
              <h3 className="font-bold text-sm text-th mb-3 flex items-center gap-2">
                <ShoppingCart size={16} /> Carrinho ({cart.length})
              </h3>
              <div className="flex-1 overflow-y-auto space-y-1.5">
                {/* Existing orders for linked table */}
                {tableExistingOrders.length > 0 && (
                  <div className="mb-2">
                    <p className="text-[10px] font-bold text-th-muted uppercase tracking-wider mb-1.5 flex items-center gap-1">
                      <Clock size={10} /> Já pedido
                    </p>
                    {tableExistingOrders.map((order: any) => (
                      <div key={order.id} className="mb-1.5">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-[10px] font-semibold text-th-muted">#{order.number}</span>
                          <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${
                            order.status === 'PREPARING' ? 'bg-blue-500/15 text-blue-500' :
                            order.status === 'READY' ? 'bg-emerald-500/15 text-emerald-500' :
                            order.status === 'SERVED' ? 'bg-orange-500/15 text-orange-500' :
                            'bg-yellow-500/15 text-yellow-500'
                          }`}>
                            {order.status === 'PREPARING' ? 'Preparando' :
                             order.status === 'READY' ? 'Pronto' :
                             order.status === 'SERVED' ? 'Na Mesa' :
                             order.status === 'ANALYSIS' ? 'Em Análise' : order.status}
                          </span>
                        </div>
                        {order.items.map((item: any, i: number) => (
                          <div key={i} className="flex items-center gap-2 bg-th border border-dashed border-th rounded-xl px-3 py-1.5 opacity-60">
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-th truncate">{item.quantity}x {item.name}</p>
                            </div>
                            <p className="text-[10px] text-th-muted w-14 text-right">{fmt(item.unitPrice * item.quantity)}</p>
                          </div>
                        ))}
                      </div>
                    ))}
                    {cart.length > 0 && (
                      <p className="text-[10px] font-bold text-primary-500 uppercase tracking-wider mt-3 mb-1.5 flex items-center gap-1">
                        <Plus size={10} /> Novos itens
                      </p>
                    )}
                  </div>
                )}
                {cart.length === 0 && tableExistingOrders.length === 0 ? (
                  <div className="text-center py-8 text-th-muted text-xs">Adicione itens ao carrinho</div>
                ) : cart.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-th border border-th rounded-xl px-3 py-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-th truncate">{item.name}</p>
                      <p className="text-[10px] text-th-muted">{fmt(item.unitPrice)} cada</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => updateCartQty(idx, item.quantity - 1)}
                        className="w-6 h-6 flex items-center justify-center rounded-md bg-th-hover text-th text-xs font-bold">−</button>
                      <span className="w-6 text-center text-xs font-bold text-th">{item.quantity}</span>
                      <button onClick={() => updateCartQty(idx, item.quantity + 1)}
                        className="w-6 h-6 flex items-center justify-center rounded-md bg-th-hover text-th text-xs font-bold">+</button>
                    </div>
                    <p className="text-xs font-bold text-primary-500 w-16 text-right">{fmt(item.unitPrice * item.quantity)}</p>
                    <button onClick={() => removeFromCart(idx)} className="text-red-400 hover:text-red-500 transition">
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Fixed bottom: options + totals + payment + sell button */}
            <div className="bg-th-card border border-th border-t-0 rounded-b-2xl p-4 space-y-2 flex-shrink-0">
              {/* Table + Customer row */}
              <div className="grid grid-cols-2 gap-2">
                <select value={selectedTable} onChange={async e => {
                    const tableId = e.target.value;
                    setSelectedTable(tableId);
                    if (tableId) {
                      try {
                        const { data } = await getOrders({ restaurantTableId: tableId });
                        setTableExistingOrders(data.filter((o: any) => !['DONE', 'CANCELLED'].includes(o.status)));
                      } catch { setTableExistingOrders([]); }
                    } else { setTableExistingOrders([]); }
                  }}
                  className="bg-th border border-th rounded-lg px-2 py-1.5 text-xs text-th focus:outline-none">
                  <option value="">Sem mesa</option>
                  {tables.filter(t => t.isActive).map(t => (
                    <option key={t.id} value={t.id}>Mesa {t.number}{t.name ? ` - ${t.name}` : ''}</option>
                  ))}
                </select>
                <input type="text" placeholder="Nome do cliente" value={customerName} onChange={e => setCustomerName(e.target.value)}
                  className="bg-th border border-th rounded-lg px-2 py-1.5 text-xs text-th placeholder:text-th-muted focus:outline-none" />
              </div>
              {/* Discount + Preparation */}
              <div className="flex gap-2 items-center">
                <div className="flex items-center gap-1 bg-th border border-th rounded-lg px-2 py-1.5 flex-1">
                  <Percent size={12} className="text-th-muted" />
                  <input type="number" placeholder="Desconto" value={discount || ''} onChange={e => setDiscount(+e.target.value)}
                    className="bg-transparent text-xs text-th w-full focus:outline-none" min="0" />
                </div>
                <select value={discountType} onChange={e => setDiscountType(e.target.value)}
                  className="bg-th border border-th rounded-lg px-2 py-1.5 text-xs text-th focus:outline-none">
                  <option value="PERCENT">%</option>
                  <option value="FIXED">R$</option>
                </select>
                <label className="flex items-center gap-1.5 text-[10px] text-th cursor-pointer whitespace-nowrap bg-th border border-th rounded-lg px-2 py-1.5">
                  <input type="checkbox" checked={requiresPrep} onChange={e => setRequiresPrep(e.target.checked)}
                    className="accent-primary-500" />
                  <ChefHat size={10} /> Cozinha
                </label>
                <label className="flex items-center gap-1.5 text-[10px] text-th cursor-pointer whitespace-nowrap bg-th border border-th rounded-lg px-2 py-1.5">
                  <input type="checkbox" checked={waiterFee} onChange={e => toggleWaiterFee(e.target.checked)}
                    className="accent-orange-500" />
                  <span className="text-orange-500 font-semibold">10%</span>
                </label>
              </div>
              {/* Totals */}
              <div className="space-y-0.5 pt-1">
                {tableExistingOrders.length > 0 && (
                  <div className="flex justify-between text-xs text-th-muted">
                    <span>Já pedido ({tableExistingOrders.reduce((s: number, o: any) => s + o.items.length, 0)} itens)</span>
                    <span>{fmt(tableExistingOrders.reduce((s: number, o: any) => s + o.total, 0))}</span>
                  </div>
                )}
                <div className="flex justify-between text-xs text-th-muted">
                  <span>Subtotal</span><span>{fmt(subtotal)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-xs text-red-400">
                    <span>Desconto</span><span>-{fmt(discountValue)}</span>
                  </div>
                )}
                {waiterFee && (
                  <div className="flex justify-between text-xs text-orange-400">
                    <span>Taxa garçom (10%)</span><span>+{fmt(waiterFeeValue)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold">
                  <span className="text-th">Total</span><span className="text-primary-500">{fmt(total)}</span>
                </div>
              </div>
              {/* Action buttons */}
              <div className="flex gap-2">
                <button onClick={() => setShowConfirmSell(true)} disabled={!activeCashRegister || cart.length === 0 || selling}
                  className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-400 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-bold rounded-xl text-sm transition flex items-center justify-center gap-2">
                  <ChefHat size={16} />
                  Enviar Pedido
                </button>
                <button onClick={() => setShowCloseAccount(true)} disabled={!activeCashRegister || (cart.length === 0 && tableExistingOrders.length === 0) || selling}
                  className="flex-1 py-3 bg-amber-500 hover:bg-amber-400 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-bold rounded-xl text-sm transition flex items-center justify-center gap-2">
                  <DollarSign size={16} />
                  Fechar Conta — {fmt(total + tableExistingOrders.reduce((s: number, o: any) => s + o.total, 0))}
                </button>
              </div>
              {!activeCashRegister && (
                <p className="text-center text-[10px] text-red-400">Abra um caixa para realizar vendas</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── TABLES TAB ────────────────────────────────── */}
      {tab === 'tables' && (
        <div className="bg-th-card border border-th rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-th text-lg">Mesas</h2>
            <button onClick={() => setShowNewTable(true)} className="flex items-center gap-1 bg-primary-500 hover:bg-primary-400 text-white px-3 py-1.5 rounded-xl text-sm font-semibold transition">
              <Plus size={14} /> Nova Mesa
            </button>
          </div>
          <div className="grid grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3">
            {tables.map(t => {
              const selfServiceUrl = t.selfServiceToken ? `https://marinaprizeclub.com/mesa/${t.selfServiceToken}` : null;
              const copyLink = (url: string) => {
                const ta = document.createElement('textarea');
                ta.value = url; ta.style.position = 'fixed'; ta.style.opacity = '0';
                document.body.appendChild(ta); ta.select();
                document.execCommand('copy'); document.body.removeChild(ta);
                alert('Link copiado!\n' + url);
              };
              return (
                <div key={t.id} className={`border rounded-xl p-4 text-center transition ${t.isActive ? 'border-emerald-500/30 bg-emerald-500/5 hover:border-emerald-500/60 cursor-pointer' : 'border-th bg-th opacity-50'}`}>
                  <div onClick={() => { if (t.isActive) selectTableAndGoToSell(t); }}>
                    <p className="text-2xl font-bold text-th">{t.number}</p>
                    {t.name && <p className="text-xs text-th-muted mt-1">{t.name}</p>}
                    <p className="text-[10px] text-th-muted">{t.capacity} lugares</p>
                  </div>

                  {/* Self-service link */}
                  <div className="mt-2">
                    {selfServiceUrl ? (
                      <button
                        onClick={() => { copyLink(selfServiceUrl!); }}
                        className="flex items-center gap-1 mx-auto text-[10px] text-emerald-500 hover:text-emerald-400 transition"
                        title={selfServiceUrl!}
                      >
                        <Link2 size={10} /> <span>Copiar link</span>
                      </button>
                    ) : (
                      <button
                        onClick={async () => { await generateTableToken(t.id); load(); }}
                        className="flex items-center gap-1 mx-auto text-[10px] text-primary-500 hover:text-primary-400 transition"
                      >
                        <Link2 size={10} /> <span>Gerar link</span>
                      </button>
                    )}
                  </div>

                  <div className="flex gap-1 justify-center mt-2">
                    {selfServiceUrl && (
                      <button onClick={async () => { await generateTableToken(t.id); load(); }} title="Regenerar link"
                        className="p-1.5 rounded-lg bg-th-hover text-th-muted hover:text-amber-500 transition"><RefreshCw size={12} /></button>
                    )}
                    <button onClick={() => setEditTable(t)} className="p-1.5 rounded-lg bg-th-hover text-th-muted hover:text-primary-500 transition"><Edit2 size={12} /></button>
                    <button onClick={async () => { if(confirm('Excluir mesa?')) { await deletePdvTable(t.id); load(); }}}
                      className="p-1.5 rounded-lg bg-th-hover text-th-muted hover:text-red-500 transition"><Trash2 size={12} /></button>
                  </div>
                </div>
              );
            })}
            {tables.length === 0 && <p className="col-span-6 text-center py-10 text-th-muted text-sm">Nenhuma mesa cadastrada</p>}
          </div>
        </div>
      )}

      {/* ─── WAITERS TAB ───────────────────────────────── */}
      {tab === 'waiters' && (
        <div className="bg-th-card border border-th rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-th text-lg">Garçons</h2>
            <button onClick={() => setShowNewWaiter(true)} className="flex items-center gap-1 bg-primary-500 hover:bg-primary-400 text-white px-3 py-1.5 rounded-xl text-sm font-semibold transition">
              <Plus size={14} /> Novo Garçom
            </button>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {waiters.map(w => (
              <div key={w.id} className={`border rounded-xl p-4 transition ${w.isActive ? 'border-th bg-th' : 'border-th bg-th opacity-50'}`}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary-500/10 flex items-center justify-center text-primary-500 font-bold text-sm">
                    {w.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-sm text-th">{w.name}</p>
                    <p className="text-xs text-orange-400">Comissão: {w.commissionRate}%</p>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={async () => {
                      const data = await getWaiterCommissions(w.id).then(r => r.data);
                      setViewCommissions({ waiter: w, data });
                    }} className="p-1.5 rounded-lg bg-th-hover text-th-muted hover:text-emerald-500 transition" title="Ver comissões">
                      <DollarSign size={12} />
                    </button>
                    <button onClick={() => setEditWaiter(w)} className="p-1.5 rounded-lg bg-th-hover text-th-muted hover:text-primary-500 transition"><Edit2 size={12} /></button>
                    <button onClick={async () => { if(confirm('Excluir garçom?')) { await deletePdvWaiter(w.id); load(); }}}
                      className="p-1.5 rounded-lg bg-th-hover text-th-muted hover:text-red-500 transition"><Trash2 size={12} /></button>
                  </div>
                </div>
              </div>
            ))}
            {waiters.length === 0 && <p className="col-span-3 text-center py-10 text-th-muted text-sm">Nenhum garçom cadastrado</p>}
          </div>
        </div>
      )}

      {/* ─── TERMINALS TAB ─────────────────────────────── */}
      {tab === 'terminals' && (
        <div className="bg-th-card border border-th rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-th text-lg">Terminais</h2>
            <button onClick={() => setShowNewTerminal(true)} className="flex items-center gap-1 bg-primary-500 hover:bg-primary-400 text-white px-3 py-1.5 rounded-xl text-sm font-semibold transition">
              <Plus size={14} /> Novo Terminal
            </button>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {terminals.map(tm => {
              const openReg = tm.cashRegisters?.[0];
              return (
                <div key={tm.id} className={`border rounded-xl p-4 transition ${tm.isActive ? 'border-th bg-th' : 'border-th bg-th opacity-50'}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${openReg ? 'bg-emerald-500/10 text-emerald-500' : 'bg-th-hover text-th-muted'}`}>
                      <Monitor size={18} />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-sm text-th">{tm.name}</p>
                      {openReg
                        ? <p className="text-[10px] text-emerald-500 font-semibold">Caixa aberto — {openReg.operatorName}</p>
                        : <p className="text-[10px] text-th-muted">Disponível</p>
                      }
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => setEditTerminal(tm)} className="p-1.5 rounded-lg bg-th-hover text-th-muted hover:text-primary-500 transition"><Edit2 size={12} /></button>
                      <button onClick={async () => { if(confirm('Excluir terminal?')) { await deletePdvTerminal(tm.id); load(); }}}
                        className="p-1.5 rounded-lg bg-th-hover text-th-muted hover:text-red-500 transition"><Trash2 size={12} /></button>
                    </div>
                  </div>
                </div>
              );
            })}
            {terminals.length === 0 && <p className="col-span-3 text-center py-10 text-th-muted text-sm">Nenhum terminal cadastrado</p>}
          </div>
        </div>
      )}

      {/* ─── HISTORY TAB ───────────────────────────────── */}
      {tab === 'history' && (
        <div className="bg-th-card border border-th rounded-2xl p-6">
          <h2 className="font-bold text-th text-lg mb-4">Histórico de Fechamentos</h2>
          <div className="space-y-2">
            {closedHistory.map(cr => {
              const diff = cr.closingAmount != null && cr.expectedAmount != null ? cr.closingAmount - cr.expectedAmount : null;
              return (
                <div key={cr.id} className="border border-th rounded-xl p-4 hover:border-primary-500/20 transition cursor-pointer"
                  onClick={async () => { const d = await getCashRegister(cr.id).then(r => r.data); setShowCashDetails(d); }}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-th-hover flex items-center justify-center text-th-muted"><Receipt size={14} /></div>
                      <div>
                        <p className="text-sm font-bold text-th">{cr.terminal?.name}</p>
                        <p className="text-[10px] text-th-muted">{cr.operatorName} — {fmtDate(cr.openedAt)} → {cr.closedAt ? fmtDate(cr.closedAt) : '—'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-sm text-th">{fmt(cr.totalSales)}</p>
                      <div className="flex items-center gap-2 text-[10px]">
                        <span className="text-th-muted">{cr._count?.orders || 0} vendas</span>
                        {diff !== null && (
                          <span className={diff >= 0 ? 'text-emerald-500' : 'text-red-500'}>
                            {diff >= 0 ? '+' : ''}{fmt(diff)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            {closedHistory.length === 0 && <p className="text-center py-10 text-th-muted text-sm">Nenhum fechamento encontrado</p>}
          </div>
        </div>
      )}

      {/* ─── SETTINGS (CAIXA) TAB ──────────────────────── */}
      {tab === 'settings' && (
        <div className="space-y-4">
          <div className="bg-th-card border border-th rounded-2xl p-6">
            <h2 className="font-bold text-th text-lg mb-4">Caixas Abertos</h2>
            <div className="grid grid-cols-2 gap-3">
              {cashRegisters.map(cr => (
                <div key={cr.id} className="border border-emerald-500/30 bg-emerald-500/5 rounded-xl p-4 cursor-pointer hover:border-emerald-500/50 transition"
                  onClick={async () => { const d = await getCashRegister(cr.id).then(r => r.data); setShowCashDetails(d); }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-sm text-th">{cr.terminal?.name}</p>
                      <p className="text-xs text-th-muted">{cr.operatorName}</p>
                      <p className="text-[10px] text-th-muted">Aberto em {fmtDate(cr.openedAt)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-emerald-500">{fmt(cr.totalSales)}</p>
                      <p className="text-[10px] text-th-muted">{cr._count?.orders || 0} vendas</p>
                    </div>
                  </div>
                </div>
              ))}
              {cashRegisters.length === 0 && <p className="col-span-2 text-center py-10 text-th-muted text-sm">Nenhum caixa aberto</p>}
            </div>
          </div>

          {/* Daily stats */}
          <div className="bg-th-card border border-th rounded-2xl p-6">
            <h2 className="font-bold text-th text-lg mb-4">Resumo do Dia</h2>
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-th border border-th rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-primary-500">{stats.totalOrders || 0}</p>
                <p className="text-xs text-th-muted">Pedidos</p>
              </div>
              <div className="bg-th border border-th rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-emerald-500">{fmt(stats.totalRevenue || 0)}</p>
                <p className="text-xs text-th-muted">Faturamento</p>
              </div>
              <div className="col-span-2 bg-th border border-th rounded-xl p-4">
                <p className="text-xs font-semibold text-th-muted mb-2">Por Pagamento</p>
                {stats.byPayment?.length > 0 ? stats.byPayment.map((p: any) => (
                  <div key={p.method} className="flex justify-between text-xs text-th py-0.5">
                    <span>{p.method}</span>
                    <span className="font-bold">{fmt(p.total)} ({p.count})</span>
                  </div>
                )) : <p className="text-xs text-th-muted">Sem dados</p>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════ */}
      {/* MODALS                                             */}
      {/* ═══════════════════════════════════════════════════ */}

      {/* Open Cash Register Modal */}
      {showOpenCash && <OpenCashModal terminals={terminals} onClose={() => setShowOpenCash(false)} onSubmit={handleOpenCash} />}

      {/* Confirm Send Order Modal */}
      {showConfirmSell && (
        <ConfirmSellModal
          cart={cart}
          subtotal={subtotal}
          discount={discount}
          discountType={discountType}
          discountValue={discountValue}
          waiterFee={waiterFee}
          waiterFeeValue={waiterFeeValue}
          total={total}
          requiresPrep={requiresPrep}
          selectedTable={selectedTable}
          tables={tables}
          customerName={customerName}
          selling={selling}
          onClose={() => setShowConfirmSell(false)}
          onConfirm={() => { setShowConfirmSell(false); handleSendOrder(); }}
        />
      )}

      {/* Close Account Modal */}
      {showCloseAccount && (
        <CloseAccountModal
          cart={cart}
          subtotal={subtotal}
          discount={discount}
          discountType={discountType}
          discountValue={discountValue}
          waiterFee={waiterFee}
          waiterFeeValue={waiterFeeValue}
          total={total}
          tableExistingOrders={tableExistingOrders}
          selectedTable={selectedTable}
          tables={tables}
          customerName={customerName}
          selling={selling}
          onClose={() => setShowCloseAccount(false)}
          onConfirm={(pm: string) => { setShowCloseAccount(false); handleCloseAccount(pm); }}
        />
      )}

      {/* Close Cash Register Modal */}
      {showCloseCash && activeCashRegister && (
        <CloseCashModal register={activeCashRegister} onClose={() => setShowCloseCash(false)} onSubmit={handleCloseCash} />
      )}

      {/* Cash Details Modal */}
      {showCashDetails && (
        <CashDetailsModal register={showCashDetails} onClose={() => setShowCashDetails(null)} />
      )}

      {/* Transaction (Sangria/Suprimento) Modal */}
      {showTransactionModal && activeCashRegister && (
        <TransactionModal cashRegisterId={activeCashRegister.id} onClose={() => { setShowTransactionModal(false); load(); }} />
      )}

      {/* New/Edit Table Modal */}
      {(showNewTable || editTable) && (
        <TableModal table={editTable} onClose={() => { setShowNewTable(false); setEditTable(null); }} onSave={load} />
      )}

      {/* Table Orders Modal */}
      {tableOrdersModal && (
        <ModalWrapper onClose={() => setTableOrdersModal(null)} title={`Mesa ${tableOrdersModal.number}${tableOrdersModal.name ? ` — ${tableOrdersModal.name}` : ''}`} wide>
          {loadingTableOrders ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
            </div>
          ) : tableOrders.length === 0 ? (
            <div className="text-center py-12 text-th-muted text-sm">Nenhum pedido em aberto nesta mesa</div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-th-muted mb-1">
                <span>{tableOrders.length} pedido{tableOrders.length > 1 ? 's' : ''} em aberto</span>
                <span className="font-bold text-primary-500 text-sm">{fmt(tableOrders.reduce((s: number, o: any) => s + o.total, 0))}</span>
              </div>
              {tableOrders.map((order: any) => {
                const statusMap: Record<string, { label: string; color: string; next?: string }> = {
                  ANALYSIS:   { label: 'Em Análise',   color: 'bg-yellow-500/15 text-yellow-500', next: 'Iniciar Preparo' },
                  PREPARING:  { label: 'Preparando',   color: 'bg-blue-500/15 text-blue-500',     next: 'Marcar Pronto' },
                  READY:      { label: 'Pronto',       color: 'bg-emerald-500/15 text-emerald-500', next: 'Servir' },
                  SERVED:     { label: 'Na Mesa',      color: 'bg-orange-500/15 text-orange-500' },
                  DELIVERING: { label: 'Aguard. Fechamento', color: 'bg-amber-500/15 text-amber-500' },
                };
                const st = statusMap[order.status] || { label: order.status, color: 'bg-gray-500/15 text-gray-500' };
                return (
                  <div key={order.id} className="border border-th rounded-xl p-4 hover:border-primary-500/20 transition">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-th">#{order.number}</span>
                        {order.waiter && <span className="text-[10px] text-th-muted">👤 {order.waiter.name}</span>}
                        {order.customerName && <span className="text-[10px] text-th-muted">— {order.customerName}</span>}
                      </div>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${st.color}`}>{st.label}</span>
                    </div>
                    <div className="space-y-1 mb-2">
                      {order.items.map((item: any, i: number) => (
                        <div key={i} className="flex justify-between text-xs">
                          <span className="text-th-muted">{item.quantity}x {item.name}</span>
                          <span className="text-th">{fmt(item.unitPrice * item.quantity)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-th">
                      <span className="text-[10px] text-th-muted">{fmtDate(order.createdAt)}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-primary-500">{fmt(order.total)}</span>
                        {st.next && (
                          <button
                            onClick={() => handleAdvanceTableOrder(order.id)}
                            className="flex items-center gap-1 bg-primary-500 hover:bg-primary-400 text-white text-[10px] font-semibold px-2.5 py-1 rounded-lg transition"
                          >
                            <ArrowRight size={10} /> {st.next}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div className="pt-3 border-t border-th flex gap-2">
                <button
                  onClick={() => { setTableOrdersModal(null); setSelectedTable(tableOrdersModal.id); setTab('sell'); }}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-primary-500 hover:bg-primary-400 text-white font-semibold text-sm rounded-xl transition"
                >
                  <Plus size={14} /> Novo Pedido nesta Mesa
                </button>
              </div>
            </div>
          )}
        </ModalWrapper>
      )}

      {/* New/Edit Waiter Modal */}
      {(showNewWaiter || editWaiter) && (
        <WaiterModal waiter={editWaiter} onClose={() => { setShowNewWaiter(false); setEditWaiter(null); }} onSave={load} />
      )}

      {/* New/Edit Terminal Modal */}
      {(showNewTerminal || editTerminal) && (
        <TerminalModal terminal={editTerminal} onClose={() => { setShowNewTerminal(false); setEditTerminal(null); }} onSave={load} />
      )}

      {/* Commission View Modal */}
      {viewCommissions && (
        <CommissionModal waiter={viewCommissions.waiter} data={viewCommissions.data} onClose={() => setViewCommissions(null)} />
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// SUB-COMPONENTS (Modals)
// ══════════════════════════════════════════════════════════

function ModalWrapper({ children, onClose, title, wide }: { children: React.ReactNode; onClose: () => void; title: string; wide?: boolean }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className={`bg-th-card border border-th rounded-2xl p-6 ${wide ? 'w-full max-w-3xl' : 'w-full max-w-md'} max-h-[90vh] overflow-y-auto`} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-th text-lg">{title}</h2>
          <button onClick={onClose} className="p-1 text-th-muted hover:text-th transition"><X size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function OpenCashModal({ terminals, onClose, onSubmit }: { terminals: Terminal[]; onClose: () => void; onSubmit: (tId: string, op: string, amt: number) => void }) {
  const [terminalId, setTerminalId] = useState('');
  const [operatorName, setOperatorName] = useState('');
  const [openingAmount, setOpeningAmount] = useState(0);
  const activeTerminals = terminals.filter(t => t.isActive);
  return (
    <ModalWrapper onClose={onClose} title="Abrir Caixa">
      <div className="space-y-3">
        <div>
          <label className="text-xs text-th-muted font-semibold">Terminal *</label>
          <select value={terminalId} onChange={e => setTerminalId(e.target.value)}
            className="w-full mt-1 bg-th border border-th rounded-xl px-3 py-2 text-sm text-th focus:outline-none">
            <option value="">Selecione...</option>
            {activeTerminals.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-th-muted font-semibold">Operador *</label>
          <input type="text" value={operatorName} onChange={e => setOperatorName(e.target.value)} placeholder="Nome do operador"
            className="w-full mt-1 bg-th border border-th rounded-xl px-3 py-2 text-sm text-th placeholder:text-th-muted focus:outline-none" />
        </div>
        <div>
          <label className="text-xs text-th-muted font-semibold">Valor inicial (troco)</label>
          <input type="number" value={openingAmount || ''} onChange={e => setOpeningAmount(+e.target.value)} placeholder="0,00" min="0" step="0.01"
            className="w-full mt-1 bg-th border border-th rounded-xl px-3 py-2 text-sm text-th placeholder:text-th-muted focus:outline-none" />
        </div>
        <button onClick={() => { if (terminalId && operatorName) onSubmit(terminalId, operatorName, openingAmount); }}
          disabled={!terminalId || !operatorName}
          className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:bg-gray-400 text-white font-bold rounded-xl text-sm transition">
          Abrir Caixa
        </button>
      </div>
    </ModalWrapper>
  );
}

function CloseCashModal({ register, onClose, onSubmit }: { register: CashReg; onClose: () => void; onSubmit: (amt: number, notes: string) => void }) {
  const [closingAmount, setClosingAmount] = useState(0);
  const [notes, setNotes] = useState('');
  return (
    <ModalWrapper onClose={onClose} title="Fechar Caixa">
      <div className="space-y-3">
        <div className="bg-th border border-th rounded-xl p-3 space-y-1">
          <div className="flex justify-between text-xs"><span className="text-th-muted">Terminal</span><span className="text-th font-bold">{register.terminal?.name}</span></div>
          <div className="flex justify-between text-xs"><span className="text-th-muted">Abertura</span><span className="text-th">{fmt(register.openingAmount)}</span></div>
          <div className="flex justify-between text-xs"><span className="text-th-muted">Vendas</span><span className="text-emerald-500 font-bold">{fmt(register.totalSales)}</span></div>
          <div className="flex justify-between text-xs"><span className="text-th-muted">Qtd vendas</span><span className="text-th">{register.totalOrders}</span></div>
        </div>
        <div>
          <label className="text-xs text-th-muted font-semibold">Valor contado no caixa *</label>
          <input type="number" value={closingAmount || ''} onChange={e => setClosingAmount(+e.target.value)} placeholder="0,00" min="0" step="0.01"
            className="w-full mt-1 bg-th border border-th rounded-xl px-3 py-2 text-sm text-th placeholder:text-th-muted focus:outline-none" />
        </div>
        <div>
          <label className="text-xs text-th-muted font-semibold">Observações</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Opcional"
            className="w-full mt-1 bg-th border border-th rounded-xl px-3 py-2 text-sm text-th placeholder:text-th-muted focus:outline-none resize-none" />
        </div>
        <button onClick={() => onSubmit(closingAmount, notes)}
          className="w-full py-2.5 bg-red-500 hover:bg-red-400 text-white font-bold rounded-xl text-sm transition">
          Confirmar Fechamento
        </button>
      </div>
    </ModalWrapper>
  );
}

function CashDetailsModal({ register, onClose }: { register: CashReg; onClose: () => void }) {
  const diff = register.closingAmount != null && register.expectedAmount != null ? register.closingAmount - register.expectedAmount : null;
  return (
    <ModalWrapper onClose={onClose} title={`Caixa — ${register.terminal?.name}`} wide>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-3">
          <div className="bg-th border border-th rounded-xl p-3 space-y-1.5">
            <p className="text-xs font-bold text-th-muted uppercase">Resumo</p>
            <div className="flex justify-between text-xs"><span className="text-th-muted">Operador</span><span className="text-th font-semibold">{register.operatorName}</span></div>
            <div className="flex justify-between text-xs"><span className="text-th-muted">Aberto</span><span className="text-th">{fmtDate(register.openedAt)}</span></div>
            {register.closedAt && <div className="flex justify-between text-xs"><span className="text-th-muted">Fechado</span><span className="text-th">{fmtDate(register.closedAt)}</span></div>}
            <div className="flex justify-between text-xs"><span className="text-th-muted">Abertura</span><span className="text-th">{fmt(register.openingAmount)}</span></div>
            <div className="flex justify-between text-xs"><span className="text-th-muted">Vendas</span><span className="text-emerald-500 font-bold">{fmt(register.totalSales)}</span></div>
            <div className="flex justify-between text-xs"><span className="text-th-muted">Total pedidos</span><span className="text-th">{register.totalOrders}</span></div>
            {register.expectedAmount != null && <div className="flex justify-between text-xs"><span className="text-th-muted">Esperado</span><span className="text-th font-bold">{fmt(register.expectedAmount)}</span></div>}
            {register.closingAmount != null && <div className="flex justify-between text-xs"><span className="text-th-muted">Contado</span><span className="text-th font-bold">{fmt(register.closingAmount)}</span></div>}
            {diff !== null && (
              <div className={`flex justify-between text-xs font-bold ${diff >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                <span>Diferença</span><span>{diff >= 0 ? '+' : ''}{fmt(diff)}</span>
              </div>
            )}
          </div>
          {/* Transactions */}
          <div className="bg-th border border-th rounded-xl p-3">
            <p className="text-xs font-bold text-th-muted uppercase mb-2">Transações ({register.transactions?.length || 0})</p>
            <div className="space-y-1 max-h-60 overflow-y-auto">
              {register.transactions?.map((tx: any) => (
                <div key={tx.id} className="flex justify-between text-[10px] py-1 border-b border-th last:border-0">
                  <div>
                    <span className={`font-bold ${tx.type === 'SALE' ? 'text-emerald-500' : tx.type === 'WITHDRAWAL' ? 'text-red-500' : 'text-blue-500'}`}>
                      {tx.type === 'SALE' ? 'Venda' : tx.type === 'WITHDRAWAL' ? 'Sangria' : tx.type === 'DEPOSIT' ? 'Suprimento' : tx.type}
                    </span>
                    {tx.description && <span className="text-th-muted ml-1">{tx.description}</span>}
                  </div>
                  <span className="font-bold text-th">{fmt(tx.amount)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        {/* Orders */}
        <div className="bg-th border border-th rounded-xl p-3">
          <p className="text-xs font-bold text-th-muted uppercase mb-2">Pedidos ({register.orders?.length || 0})</p>
          <div className="space-y-1.5 max-h-[400px] overflow-y-auto">
            {register.orders?.map((o: any) => (
              <div key={o.id} className="bg-th-card border border-th rounded-lg p-2.5">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold text-th">#{o.number}</span>
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${o.status === 'DONE' ? 'bg-emerald-500/10 text-emerald-500' : o.status === 'CANCELLED' ? 'bg-red-500/10 text-red-500' : 'bg-yellow-500/10 text-yellow-500'}`}>
                    {o.status}
                  </span>
                </div>
                {o.waiter && <p className="text-[10px] text-th-muted">Garçom: {o.waiter.name}</p>}
                <div className="text-[10px] text-th-muted mt-1">
                  {o.items?.map((i: any) => `${i.quantity}x ${i.name}`).join(', ')}
                </div>
                <div className="flex justify-between mt-1 text-[10px]">
                  <span className="text-th-muted">{o.paymentMethod || '—'}</span>
                  <span className="font-bold text-th">{fmt(o.total)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </ModalWrapper>
  );
}

function TransactionModal({ cashRegisterId, onClose }: { cashRegisterId: string; onClose: () => void }) {
  const [type, setType] = useState('WITHDRAWAL');
  const [amount, setAmount] = useState(0);
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  return (
    <ModalWrapper onClose={onClose} title="Sangria / Suprimento">
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <button onClick={() => setType('WITHDRAWAL')}
            className={`p-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 border transition ${type === 'WITHDRAWAL' ? 'bg-red-500/10 border-red-500 text-red-500' : 'bg-th border-th text-th-muted'}`}>
            <ArrowUp size={14} /> Sangria
          </button>
          <button onClick={() => setType('DEPOSIT')}
            className={`p-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 border transition ${type === 'DEPOSIT' ? 'bg-blue-500/10 border-blue-500 text-blue-500' : 'bg-th border-th text-th-muted'}`}>
            <ArrowDown size={14} /> Suprimento
          </button>
        </div>
        <div>
          <label className="text-xs text-th-muted font-semibold">Valor *</label>
          <input type="number" value={amount || ''} onChange={e => setAmount(+e.target.value)} placeholder="0,00" min="0" step="0.01"
            className="w-full mt-1 bg-th border border-th rounded-xl px-3 py-2 text-sm text-th placeholder:text-th-muted focus:outline-none" />
        </div>
        <div>
          <label className="text-xs text-th-muted font-semibold">Descrição</label>
          <input type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="Motivo"
            className="w-full mt-1 bg-th border border-th rounded-xl px-3 py-2 text-sm text-th placeholder:text-th-muted focus:outline-none" />
        </div>
        <button onClick={async () => {
          if (!amount) return;
          setSaving(true);
          try { await addCashTransaction(cashRegisterId, { type, amount, description }); onClose(); }
          catch (e: any) { alert(e.response?.data?.message || 'Erro'); }
          setSaving(false);
        }} disabled={!amount || saving}
          className="w-full py-2.5 bg-primary-500 hover:bg-primary-400 disabled:bg-gray-400 text-white font-bold rounded-xl text-sm transition">
          {saving ? 'Salvando...' : 'Confirmar'}
        </button>
      </div>
    </ModalWrapper>
  );
}

function TableModal({ table, onClose, onSave }: { table: Table | null; onClose: () => void; onSave: () => void }) {
  const [number, setNumber] = useState(table?.number || 0);
  const [name, setName] = useState(table?.name || '');
  const [capacity, setCapacity] = useState(table?.capacity || 4);
  const [isActive, setIsActive] = useState(table?.isActive ?? true);
  const [saving, setSaving] = useState(false);
  return (
    <ModalWrapper onClose={onClose} title={table ? 'Editar Mesa' : 'Nova Mesa'}>
      <div className="space-y-3">
        <div>
          <label className="text-xs text-th-muted font-semibold">Número *</label>
          <input type="number" value={number || ''} onChange={e => setNumber(+e.target.value)} min="1"
            className="w-full mt-1 bg-th border border-th rounded-xl px-3 py-2 text-sm text-th focus:outline-none" />
        </div>
        <div>
          <label className="text-xs text-th-muted font-semibold">Nome (opcional)</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Ex: VIP, Terraço..."
            className="w-full mt-1 bg-th border border-th rounded-xl px-3 py-2 text-sm text-th placeholder:text-th-muted focus:outline-none" />
        </div>
        <div>
          <label className="text-xs text-th-muted font-semibold">Capacidade</label>
          <input type="number" value={capacity} onChange={e => setCapacity(+e.target.value)} min="1"
            className="w-full mt-1 bg-th border border-th rounded-xl px-3 py-2 text-sm text-th focus:outline-none" />
        </div>
        {table && (
          <label className="flex items-center gap-2 text-xs text-th cursor-pointer">
            <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} className="accent-primary-500" />
            Ativa
          </label>
        )}
        <button onClick={async () => {
          if (!number) return;
          setSaving(true);
          try {
            if (table) await updatePdvTable(table.id, { number, name: name || undefined, capacity, isActive });
            else await createPdvTable({ number, name: name || undefined, capacity });
            onSave(); onClose();
          } catch (e: any) { alert(e.response?.data?.message || 'Erro'); }
          setSaving(false);
        }} disabled={!number || saving}
          className="w-full py-2.5 bg-primary-500 hover:bg-primary-400 disabled:bg-gray-400 text-white font-bold rounded-xl text-sm transition">
          {saving ? 'Salvando...' : 'Salvar'}
        </button>
      </div>
    </ModalWrapper>
  );
}

function WaiterModal({ waiter, onClose, onSave }: { waiter: Waiter | null; onClose: () => void; onSave: () => void }) {
  const [name, setName] = useState(waiter?.name || '');
  const [commissionRate, setCommissionRate] = useState(waiter?.commissionRate ?? 10);
  const [isActive, setIsActive] = useState(waiter?.isActive ?? true);
  const [saving, setSaving] = useState(false);
  return (
    <ModalWrapper onClose={onClose} title={waiter ? 'Editar Garçom' : 'Novo Garçom'}>
      <div className="space-y-3">
        <div>
          <label className="text-xs text-th-muted font-semibold">Nome *</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Nome do garçom"
            className="w-full mt-1 bg-th border border-th rounded-xl px-3 py-2 text-sm text-th placeholder:text-th-muted focus:outline-none" />
        </div>
        <div>
          <label className="text-xs text-th-muted font-semibold">Comissão (%)</label>
          <input type="number" value={commissionRate} onChange={e => setCommissionRate(+e.target.value)} min="0" max="100" step="0.5"
            className="w-full mt-1 bg-th border border-th rounded-xl px-3 py-2 text-sm text-th focus:outline-none" />
        </div>
        {waiter && (
          <label className="flex items-center gap-2 text-xs text-th cursor-pointer">
            <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} className="accent-primary-500" />
            Ativo
          </label>
        )}
        <button onClick={async () => {
          if (!name) return;
          setSaving(true);
          try {
            if (waiter) await updatePdvWaiter(waiter.id, { name, commissionRate, isActive });
            else await createPdvWaiter({ name, commissionRate });
            onSave(); onClose();
          } catch (e: any) { alert(e.response?.data?.message || 'Erro'); }
          setSaving(false);
        }} disabled={!name || saving}
          className="w-full py-2.5 bg-primary-500 hover:bg-primary-400 disabled:bg-gray-400 text-white font-bold rounded-xl text-sm transition">
          {saving ? 'Salvando...' : 'Salvar'}
        </button>
      </div>
    </ModalWrapper>
  );
}

function TerminalModal({ terminal, onClose, onSave }: { terminal: Terminal | null; onClose: () => void; onSave: () => void }) {
  const [name, setName] = useState(terminal?.name || '');
  const [isActive, setIsActive] = useState(terminal?.isActive ?? true);
  const [saving, setSaving] = useState(false);
  return (
    <ModalWrapper onClose={onClose} title={terminal ? 'Editar Terminal' : 'Novo Terminal'}>
      <div className="space-y-3">
        <div>
          <label className="text-xs text-th-muted font-semibold">Nome *</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Caixa 1, Balcão..."
            className="w-full mt-1 bg-th border border-th rounded-xl px-3 py-2 text-sm text-th placeholder:text-th-muted focus:outline-none" />
        </div>
        {terminal && (
          <label className="flex items-center gap-2 text-xs text-th cursor-pointer">
            <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} className="accent-primary-500" />
            Ativo
          </label>
        )}
        <button onClick={async () => {
          if (!name) return;
          setSaving(true);
          try {
            if (terminal) await updatePdvTerminal(terminal.id, { name, isActive });
            else await createPdvTerminal({ name });
            onSave(); onClose();
          } catch (e: any) { alert(e.response?.data?.message || 'Erro'); }
          setSaving(false);
        }} disabled={!name || saving}
          className="w-full py-2.5 bg-primary-500 hover:bg-primary-400 disabled:bg-gray-400 text-white font-bold rounded-xl text-sm transition">
          {saving ? 'Salvando...' : 'Salvar'}
        </button>
      </div>
    </ModalWrapper>
  );
}

function CommissionModal({ waiter, data, onClose }: { waiter: Waiter; data: any; onClose: () => void }) {
  return (
    <ModalWrapper onClose={onClose} title={`Comissões — ${waiter.name}`} wide>
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="bg-th border border-th rounded-xl p-3 text-center">
          <p className="text-lg font-bold text-emerald-500">{fmt(data.totalCommission || 0)}</p>
          <p className="text-[10px] text-th-muted">Comissão Total</p>
        </div>
        <div className="bg-th border border-th rounded-xl p-3 text-center">
          <p className="text-lg font-bold text-primary-500">{fmt(data.totalSales || 0)}</p>
          <p className="text-[10px] text-th-muted">Vendas Total</p>
        </div>
        <div className="bg-th border border-th rounded-xl p-3 text-center">
          <p className="text-lg font-bold text-th">{data.count || 0}</p>
          <p className="text-[10px] text-th-muted">Pedidos</p>
        </div>
      </div>
      <div className="space-y-1 max-h-60 overflow-y-auto">
        {data.orders?.map((o: any) => (
          <div key={o.id} className="flex justify-between items-center text-xs py-1.5 border-b border-th last:border-0">
            <div>
              <span className="font-bold text-th">#{o.number}</span>
              <span className="text-th-muted ml-2">{fmtDate(o.createdAt)}</span>
            </div>
            <div className="flex gap-4">
              <span className="text-th">{fmt(o.total)}</span>
              <span className="text-orange-400 font-bold">{fmt(o.waiterCommission)}</span>
            </div>
          </div>
        ))}
        {(!data.orders || data.orders.length === 0) && <p className="text-center py-4 text-th-muted text-xs">Nenhum pedido encontrado</p>}
      </div>
    </ModalWrapper>
  );
}

function ConfirmSellModal({ cart, subtotal, discount, discountType, discountValue, waiterFee, waiterFeeValue, total, requiresPrep, selectedTable, tables, customerName, selling, onClose, onConfirm }: {
  cart: CartItem[]; subtotal: number; discount: number; discountType: string; discountValue: number; waiterFee: boolean; waiterFeeValue: number; total: number;
  requiresPrep: boolean; selectedTable: string; tables: Table[]; customerName: string;
  selling: boolean; onClose: () => void; onConfirm: () => void;
}) {
  const table = selectedTable ? tables.find(t => t.id === selectedTable) : null;
  return (
    <ModalWrapper onClose={onClose} title="Confirmar Envio do Pedido">
      <div className="space-y-4">
        {/* Info */}
        {(table || customerName) && (
          <div className="flex gap-3 text-xs text-th">
            {table && <span className="bg-primary-500/10 text-primary-500 font-semibold px-2 py-1 rounded-lg">Mesa {table.number}{table.name ? ` - ${table.name}` : ''}</span>}
            {customerName && <span className="bg-th border border-th font-medium px-2 py-1 rounded-lg">{customerName}</span>}
          </div>
        )}

        {/* Items */}
        <div className="border border-th rounded-xl overflow-hidden">
          <div className="bg-th px-3 py-2 text-[10px] font-bold text-th-muted uppercase tracking-wide flex">
            <span className="flex-1">Item</span>
            <span className="w-10 text-center">Qtd</span>
            <span className="w-20 text-right">Valor</span>
          </div>
          <div className="divide-y divide-th max-h-52 overflow-y-auto">
            {cart.map((item, idx) => (
              <div key={idx} className="px-3 py-2 flex items-center text-xs">
                <span className="flex-1 text-th font-medium truncate">{item.name}</span>
                <span className="w-10 text-center text-th-muted">{item.quantity}</span>
                <span className="w-20 text-right font-bold text-th">{fmt(item.unitPrice * item.quantity)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Totals */}
        <div className="bg-th border border-th rounded-xl p-3 space-y-1.5">
          <div className="flex justify-between text-xs text-th-muted">
            <span>Subtotal ({cart.reduce((s, c) => s + c.quantity, 0)} itens)</span>
            <span>{fmt(subtotal)}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-xs text-red-400">
              <span>Desconto {discountType === 'PERCENT' ? `(${discount}%)` : ''}</span>
              <span>-{fmt(discountValue)}</span>
            </div>
          )}
          {waiterFee && (
            <div className="flex justify-between text-xs text-orange-400">
              <span>Taxa garçom (10%)</span>
              <span>+{fmt(waiterFeeValue)}</span>
            </div>
          )}
          <div className="flex justify-between text-lg font-bold pt-1 border-t border-th">
            <span className="text-th">Total</span>
            <span className="text-primary-500">{fmt(total)}</span>
          </div>
        </div>

        {/* Destination */}
        <div className="bg-th border border-th rounded-xl p-2.5 text-center text-xs">
          <p className="text-[10px] text-th-muted mb-0.5">Destino</p>
          <p className="font-bold text-th">{requiresPrep ? '🍳 Cozinha' : '✅ Pronto'}</p>
        </div>

        <p className="text-xs text-th-muted text-center">O pagamento será cobrado ao fechar a conta.</p>

        {/* Buttons */}
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 bg-th border border-th text-th font-semibold rounded-xl text-sm hover:bg-th-hover transition">
            Voltar
          </button>
          <button onClick={onConfirm} disabled={selling}
            className="flex-[2] py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:bg-gray-400 text-white font-bold rounded-xl text-sm transition flex items-center justify-center gap-2">
            {selling ? 'Processando...' : (
              <>
                <ChefHat size={16} /> Enviar Pedido — {fmt(total)}
              </>
            )}
          </button>
        </div>
      </div>
    </ModalWrapper>
  );
}

function CloseAccountModal({ cart, subtotal, discount, discountType, discountValue, waiterFee, waiterFeeValue, total, tableExistingOrders, selectedTable, tables, customerName, selling, onClose, onConfirm }: {
  cart: CartItem[]; subtotal: number; discount: number; discountType: string; discountValue: number; waiterFee: boolean; waiterFeeValue: number; total: number;
  tableExistingOrders: any[]; selectedTable: string; tables: Table[]; customerName: string;
  selling: boolean; onClose: () => void; onConfirm: (paymentMethod: string) => void;
}) {
  const [selectedPay, setSelectedPay] = useState('CASH');
  const table = selectedTable ? tables.find(t => t.id === selectedTable) : null;
  const existingTotal = tableExistingOrders.reduce((s: number, o: any) => s + o.total, 0);
  const afterDiscount = Math.max(0, subtotal - discountValue);
  // Waiter fee applies to the COMBINED total (existing + new cart), not just the cart
  const trueWaiterFeeValue = waiterFee ? (afterDiscount + existingTotal) * 0.1 : 0;
  const grandTotal = afterDiscount + existingTotal + trueWaiterFeeValue;
  return (
    <ModalWrapper onClose={onClose} title="Fechar Conta">
      <div className="space-y-4">
        {/* Info */}
        {(table || customerName) && (
          <div className="flex gap-3 text-xs text-th">
            {table && <span className="bg-primary-500/10 text-primary-500 font-semibold px-2 py-1 rounded-lg">Mesa {table.number}{table.name ? ` - ${table.name}` : ''}</span>}
            {customerName && <span className="bg-th border border-th font-medium px-2 py-1 rounded-lg">{customerName}</span>}
          </div>
        )}

        {/* Existing orders */}
        {tableExistingOrders.length > 0 && (
          <div className="border border-th rounded-xl overflow-hidden">
            <div className="bg-th px-3 py-2 text-[10px] font-bold text-th-muted uppercase tracking-wide">
              Pedidos anteriores
            </div>
            <div className="divide-y divide-th max-h-32 overflow-y-auto">
              {tableExistingOrders.map((o: any) => (
                <div key={o.id} className="px-3 py-2 flex justify-between text-xs">
                  <span className="text-th">Pedido #{o.number} — {o.items?.length || 0} itens</span>
                  <span className="font-bold text-th">{fmt(o.total)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* New cart items */}
        {cart.length > 0 && (
          <div className="border border-th rounded-xl overflow-hidden">
            <div className="bg-th px-3 py-2 text-[10px] font-bold text-th-muted uppercase tracking-wide flex">
              <span className="flex-1">Novos itens</span>
              <span className="w-10 text-center">Qtd</span>
              <span className="w-20 text-right">Valor</span>
            </div>
            <div className="divide-y divide-th max-h-32 overflow-y-auto">
              {cart.map((item, idx) => (
                <div key={idx} className="px-3 py-2 flex items-center text-xs">
                  <span className="flex-1 text-th font-medium truncate">{item.name}</span>
                  <span className="w-10 text-center text-th-muted">{item.quantity}</span>
                  <span className="w-20 text-right font-bold text-th">{fmt(item.unitPrice * item.quantity)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Totals */}
        <div className="bg-th border border-th rounded-xl p-3 space-y-1.5">
          {tableExistingOrders.length > 0 && (
            <div className="flex justify-between text-xs text-th-muted">
              <span>Pedidos anteriores</span>
              <span>{fmt(existingTotal)}</span>
            </div>
          )}
          {cart.length > 0 && (
            <div className="flex justify-between text-xs text-th-muted">
              <span>Novos itens</span>
              <span>{fmt(subtotal)}</span>
            </div>
          )}
          {discount > 0 && (
            <div className="flex justify-between text-xs text-red-400">
              <span>Desconto {discountType === 'PERCENT' ? `(${discount}%)` : ''}</span>
              <span>-{fmt(discountValue)}</span>
            </div>
          )}
          {waiterFee && (
            <div className="flex justify-between text-xs text-orange-400">
              <span>Taxa garçom (10%)</span>
              <span>+{fmt(trueWaiterFeeValue)}</span>
            </div>
          )}
          <div className="flex justify-between text-lg font-bold pt-1 border-t border-th">
            <span className="text-th">Total da Conta</span>
            <span className="text-primary-500">{fmt(grandTotal)}</span>
          </div>
        </div>

        {/* Payment method selection */}
        <div>
          <p className="text-xs font-semibold text-th mb-2">Forma de Pagamento</p>
          <div className="grid grid-cols-5 gap-1.5">
            {PAY_METHODS.map(m => (
              <button key={m.key} onClick={() => setSelectedPay(m.key)}
                className={`flex flex-col items-center gap-1 p-2.5 rounded-xl text-xs font-medium transition border ${selectedPay === m.key ? 'bg-primary-500/10 border-primary-500 text-primary-500' : 'bg-th border-th text-th-muted hover:text-th'}`}>
                <m.icon size={18} /> {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 bg-th border border-th text-th font-semibold rounded-xl text-sm hover:bg-th-hover transition">
            Voltar
          </button>
          <button onClick={() => onConfirm(selectedPay)} disabled={selling}
            className="flex-[2] py-2.5 bg-amber-500 hover:bg-amber-400 disabled:bg-gray-400 text-white font-bold rounded-xl text-sm transition flex items-center justify-center gap-2">
            {selling ? 'Processando...' : (
              <>
                <DollarSign size={16} /> Fechar Conta — {fmt(grandTotal)}
              </>
            )}
          </button>
        </div>
      </div>
    </ModalWrapper>
  );
}
