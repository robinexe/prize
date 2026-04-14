'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronRight, Clock, Volume2, VolumeX, Maximize, Minimize } from 'lucide-react';
import { getOrders, advanceOrder } from '@/services/api';

// ─── Types ─────────────────────────────────────────────────
interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  notes?: string;
}

interface Order {
  id: string;
  number: number;
  status: string;
  type: string;
  tableNumber?: string;
  customerName?: string;
  notes?: string;
  items: OrderItem[];
  createdAt: string;
  waiter?: { id: string; name: string } | null;
}

// ─── Helpers ───────────────────────────────────────────────
function elapsed(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return '0min';
  if (mins < 60) return `${mins}min`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h${mins % 60}min`;
}

function urgencyClass(dateStr: string) {
  const mins = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
  if (mins >= 20) return 'border-red-500 bg-red-500/5';
  if (mins >= 10) return 'border-amber-500 bg-amber-500/5';
  return 'border-zinc-700 bg-zinc-800/80';
}

function urgencyTimerClass(dateStr: string) {
  const mins = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
  if (mins >= 20) return 'text-red-400 animate-pulse';
  if (mins >= 10) return 'text-amber-400';
  return 'text-zinc-400';
}

// ─── KDS Page ──────────────────────────────────────────────
export default function CozinhaKDS() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [muted, setMuted] = useState(false);
  const [, setTick] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const prevCountRef = useRef(0);

  const fetchOrders = useCallback(async () => {
    try {
      const { data } = await getOrders();
      const list = Array.isArray(data) ? data : [];
      // Only show ANALYSIS and PREPARING
      const kdsOrders = list.filter((o: Order) => o.status === 'ANALYSIS' || o.status === 'PREPARING');
      setOrders(kdsOrders);

      // Sound for new incoming orders
      const newCount = kdsOrders.filter((o: Order) => o.status === 'ANALYSIS').length;
      if (!muted && newCount > prevCountRef.current && prevCountRef.current >= 0) {
        try { new Audio('/notification.mp3').play().catch(() => {}); } catch {}
      }
      prevCountRef.current = newCount;
    } catch { /* silent */ }
  }, [muted]);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 4000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  // Timer refresh every 30s
  useEffect(() => {
    const t = setInterval(() => setTick(n => n + 1), 30000);
    return () => clearInterval(t);
  }, []);

  const handleAdvance = async (id: string) => {
    try {
      await advanceOrder(id);
      await fetchOrders();
    } catch { /* silent */ }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const analysisOrders = orders.filter(o => o.status === 'ANALYSIS');
  const preparingOrders = orders.filter(o => o.status === 'PREPARING');

  return (
    <div className="min-h-screen bg-zinc-950 text-white select-none">
      {/* Top bar */}
      <header className="flex items-center justify-between px-6 py-3 bg-zinc-900/80 border-b border-zinc-800 sticky top-0 z-30">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-black tracking-tight">🍳 COZINHA</h1>
          <span className="text-sm text-zinc-400">{new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'short', timeZone: 'America/Sao_Paulo' })}</span>
        </div>
        <div className="flex items-center gap-6">
          {analysisOrders.length > 0 && (
            <div className="flex items-center gap-2 bg-red-500/20 border border-red-500/40 text-red-400 px-4 py-1.5 rounded-full animate-pulse">
              <span className="text-lg font-black">{analysisOrders.length}</span>
              <span className="text-sm font-semibold">NOVO{analysisOrders.length > 1 ? 'S' : ''}</span>
            </div>
          )}
          <div className="flex items-center gap-2 bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 px-4 py-1.5 rounded-full">
            <span className="text-lg font-black">{preparingOrders.length}</span>
            <span className="text-sm font-semibold">EM PREPARO</span>
          </div>
          <button onClick={() => setMuted(!muted)} className={`p-2 rounded-xl transition ${muted ? 'text-red-400 bg-red-500/10' : 'text-zinc-400 hover:text-white'}`}>
            {muted ? <VolumeX size={20} /> : <Volume2 size={20} />}
          </button>
          <button onClick={toggleFullscreen} className="p-2 rounded-xl text-zinc-400 hover:text-white transition">
            {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
          </button>
        </div>
      </header>

      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center" style={{ minHeight: 'calc(100vh - 60px)' }}>
          <span className="text-6xl mb-4">✅</span>
          <p className="text-2xl font-bold text-zinc-500">Nenhum pedido pendente</p>
          <p className="text-sm text-zinc-600 mt-1">Os pedidos aparecerão aqui automaticamente</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-0 min-h-[calc(100vh-60px)]">
          {/* ─── NOVOS (ANALYSIS) ─── */}
          <section className="border-r border-zinc-800 flex flex-col">
            <div className="px-5 py-3 bg-red-500/10 border-b border-zinc-800 flex items-center gap-3">
              <span className="text-2xl">📋</span>
              <h2 className="text-lg font-black text-red-400 tracking-wide">NOVOS PEDIDOS</h2>
              <span className="bg-red-500/20 text-red-400 text-sm font-black px-2.5 py-0.5 rounded-full">{analysisOrders.length}</span>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {analysisOrders.length === 0 ? (
                <p className="text-center text-zinc-600 py-12">Nenhum pedido novo</p>
              ) : analysisOrders.map(order => (
                <KDSCard key={order.id} order={order} onAdvance={handleAdvance} actionLabel="INICIAR PREPARO" actionColor="bg-cyan-500 hover:bg-cyan-400" />
              ))}
            </div>
          </section>

          {/* ─── EM PREPARO (PREPARING) ─── */}
          <section className="flex flex-col">
            <div className="px-5 py-3 bg-cyan-500/10 border-b border-zinc-800 flex items-center gap-3">
              <span className="text-2xl">👨‍🍳</span>
              <h2 className="text-lg font-black text-cyan-400 tracking-wide">EM PREPARO</h2>
              <span className="bg-cyan-500/20 text-cyan-400 text-sm font-black px-2.5 py-0.5 rounded-full">{preparingOrders.length}</span>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {preparingOrders.length === 0 ? (
                <p className="text-center text-zinc-600 py-12">Nenhum pedido em preparo</p>
              ) : preparingOrders.map(order => (
                <KDSCard key={order.id} order={order} onAdvance={handleAdvance} actionLabel="✅ PRONTO" actionColor="bg-green-500 hover:bg-green-400" />
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

// ─── KDS Card ──────────────────────────────────────────────
function KDSCard({ order, onAdvance, actionLabel, actionColor }: {
  order: Order;
  onAdvance: (id: string) => void;
  actionLabel: string;
  actionColor: string;
}) {
  const [advancing, setAdvancing] = useState(false);

  const handleClick = async () => {
    setAdvancing(true);
    await onAdvance(order.id);
    setAdvancing(false);
  };

  return (
    <div className={`rounded-2xl border-2 ${urgencyClass(order.createdAt)} overflow-hidden transition-all`}>
      {/* Card header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-white/5">
        <div className="flex items-center gap-3">
          {order.tableNumber ? (
            <span className="text-xl font-black bg-white/10 px-3 py-1 rounded-xl">
              MESA {order.tableNumber}
            </span>
          ) : (
            <span className="text-base font-bold text-zinc-300">{order.customerName || 'Pedido'}</span>
          )}
          {order.waiter && (
            <span className="text-sm text-violet-400 font-medium">👤 {order.waiter.name}</span>
          )}
        </div>
        <div className={`flex items-center gap-1.5 text-sm font-bold ${urgencyTimerClass(order.createdAt)}`}>
          <Clock size={14} />
          <span>{elapsed(order.createdAt)}</span>
        </div>
      </div>

      {/* Items — the most important part */}
      <div className="px-4 py-3">
        {order.items.map(item => (
          <div key={item.id} className="flex items-start gap-3 py-1.5 border-b border-zinc-700/50 last:border-0">
            <span className="text-xl font-black text-yellow-400 min-w-[36px] text-right">{item.quantity}x</span>
            <div className="flex-1">
              <p className="text-lg font-bold leading-tight">{item.name}</p>
              {item.notes && (
                <p className="text-sm text-amber-400 mt-0.5">⚠️ {item.notes}</p>
              )}
            </div>
          </div>
        ))}
        {order.notes && (
          <div className="mt-2 bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2">
            <p className="text-sm text-amber-400 font-medium">📝 {order.notes}</p>
          </div>
        )}
      </div>

      {/* Action button — big and obvious */}
      <button
        onClick={handleClick}
        disabled={advancing}
        className={`w-full flex items-center justify-center gap-2 ${actionColor} text-white text-base font-black py-4 transition-all active:scale-[0.98] disabled:opacity-50`}
      >
        <ChevronRight size={20} strokeWidth={3} />
        {advancing ? 'PROCESSANDO...' : actionLabel}
      </button>
    </div>
  );
}
