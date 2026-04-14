'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, Clock, X, Camera, Receipt, TrendingUp } from 'lucide-react';
import Image from 'next/image';
import { useAuth } from '@/contexts/auth';
import { getMyCharges, getFuelLog } from '@/services/api';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Charge {
  id: string;
  type: string;
  category?: string;
  description: string;
  amount: number;
  status: string;
  dueDate: string;
  paidAt?: string;
  reference?: string;
  boat?: { id: string; name: string };
  user?: { id: string; name: string };
  createdAt: string;
}

const statusConfig: Record<string, { label: string; color: string; icon: typeof CheckCircle2 }> = {
  PAID:    { label: 'Pago',      color: '#10b981', icon: CheckCircle2 },
  PENDING: { label: 'Pendente',  color: '#f59e0b', icon: Clock },
  OVERDUE: { label: 'Atrasado',  color: '#ef4444', icon: AlertCircle },
};

const typeLabels: Record<string, string> = {
  MONTHLY_FEE: 'Mensalidade',
  FUEL: 'Combustível',
  MAINTENANCE: 'Manutenção',
  RESERVATION: 'Reserva',
  OTHER: 'Outros',
};

export default function InvoicesPage() {
  const { user } = useAuth();
  const [charges, setCharges] = useState<Charge[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('ALL');
  const [fuelPhoto, setFuelPhoto] = useState<{ imageUrl: string; liters: number; totalCost: number; notes?: string } | null>(null);
  const [loadingPhoto, setLoadingPhoto] = useState(false);

  const handleFuelChargeClick = async (charge: Charge) => {
    if (charge.category !== 'FUEL' && charge.type !== 'FUEL') return;
    const ref = charge.reference || '';
    const match = ref.match(/^fuel-(.+)$/);
    if (!match) return;
    setLoadingPhoto(true);
    try {
      const { data } = await getFuelLog(match[1]);
      if (data?.imageUrl) {
        setFuelPhoto({ imageUrl: data.imageUrl, liters: data.liters, totalCost: data.totalCost, notes: data.notes });
      }
    } catch { /* empty */ } finally {
      setLoadingPhoto(false);
    }
  };

  // Compute effective status: PENDING + past due = OVERDUE (frontend-side)
  const effectiveStatus = (c: Charge) => {
    if (c.status === 'PENDING' && new Date(c.dueDate) < new Date()) return 'OVERDUE';
    return c.status;
  };

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const { data } = await getMyCharges({ status: undefined });
        const items = Array.isArray(data) ? data : data.data || [];
        items.sort((a: Charge, b: Charge) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime());
        setCharges(items);
      } catch { /* empty */ }
      setLoading(false);
    })();
  }, [user]);

  const filtered = (() => {
    if (filter === 'PAID') return charges.filter(c => effectiveStatus(c) === 'PAID').sort((a, b) => new Date(b.paidAt || b.dueDate).getTime() - new Date(a.paidAt || a.dueDate).getTime());
    const open = charges.filter(c => effectiveStatus(c) !== 'PAID');
    if (filter !== 'ALL') return open.filter(c => effectiveStatus(c) === filter).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
    return open.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  })();

  const totalPending = charges
    .filter(c => effectiveStatus(c) === 'PENDING' || effectiveStatus(c) === 'OVERDUE')
    .reduce((sum, c) => sum + Number(c.amount), 0);

  const countPending = charges.filter(c => effectiveStatus(c) === 'PENDING').length;
  const countOverdue = charges.filter(c => effectiveStatus(c) === 'OVERDUE').length;
  const countPaid = charges.filter(c => effectiveStatus(c) === 'PAID').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="py-4">
      <h1 className="text-xl font-bold text-[var(--text)] mb-4">Faturas</h1>

      {/* Summary */}
      <div className="bg-[var(--card)] rounded-2xl border border-[var(--border)] p-4 mb-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-primary-500/10 flex items-center justify-center">
              <TrendingUp size={16} className="text-primary-500" />
            </div>
            <div>
              <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wide">Total em aberto</p>
              <p className="text-lg font-bold text-[var(--text)]">
                R$ {totalPending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <div className="flex-1 rounded-xl px-3 py-2 text-center" style={{ background: 'rgba(245,158,11,0.12)' }}>
            <p className="text-lg font-bold" style={{ color: '#f59e0b' }}>{countPending}</p>
            <p className="text-[9px] text-[var(--text-muted)]">Pendentes</p>
          </div>
          <div className="flex-1 rounded-xl px-3 py-2 text-center" style={{ background: 'rgba(239,68,68,0.12)' }}>
            <p className="text-lg font-bold" style={{ color: '#ef4444' }}>{countOverdue}</p>
            <p className="text-[9px] text-[var(--text-muted)]">Atrasadas</p>
          </div>
          <div className="flex-1 rounded-xl px-3 py-2 text-center" style={{ background: 'rgba(16,185,129,0.12)' }}>
            <p className="text-lg font-bold" style={{ color: '#10b981' }}>{countPaid}</p>
            <p className="text-[9px] text-[var(--text-muted)]">Pagas</p>
          </div>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1.5 mb-4 bg-[var(--subtle)] rounded-xl p-1">
        {[
          { key: 'ALL', label: 'Todas' },
          { key: 'PENDING', label: 'Pendentes' },
          { key: 'OVERDUE', label: 'Atrasadas' },
          { key: 'PAID', label: 'Pagas' },
        ].map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`flex-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-all ${
              filter === f.key
                ? 'bg-[var(--card)] text-[var(--text)] shadow-sm'
                : 'text-[var(--text-muted)]'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-[var(--text-muted)]">
          <Receipt size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">Nenhuma fatura encontrada</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(charge => {
            const st = statusConfig[effectiveStatus(charge)] || statusConfig.PENDING;
            const Icon = st.icon;
            const isFuel = charge.category === 'FUEL' || charge.type === 'FUEL';
            const hasFuelRef = isFuel && (charge.reference || '').startsWith('fuel-');
            const typeKey = charge.type || charge.category || 'OTHER';
            return (
              <div
                key={charge.id}
                onClick={() => hasFuelRef ? handleFuelChargeClick(charge) : undefined}
                className={`bg-[var(--card)] rounded-2xl border border-[var(--border)] overflow-hidden ${hasFuelRef ? 'cursor-pointer active:bg-[var(--subtle)]' : ''}`}
              >
                <div className="px-4 py-3 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${st.color}18` }}>
                    <Icon size={16} style={{ color: st.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-[var(--text)] truncate">
                        {charge.description || typeLabels[typeKey] || typeKey}
                      </p>
                      <p className="text-sm font-bold text-[var(--text)] shrink-0">
                        R$ {Number(charge.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-[11px] text-[var(--text-muted)]">
                        Venc. {format(parseISO(charge.dueDate), "dd/MM/yyyy")}
                        {charge.boat && <span> · {charge.boat.name}</span>}
                      </p>
                      <span
                        className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full"
                        style={{ background: `${st.color}18`, color: st.color }}
                      >
                        {st.label}
                      </span>
                    </div>
                    {charge.paidAt && (
                      <p className="text-[10px] mt-0.5" style={{ color: '#10b981' }}>
                        Pago em {format(parseISO(charge.paidAt), "dd/MM/yyyy")}
                      </p>
                    )}
                  </div>
                </div>
                {hasFuelRef && (
                  <div className="px-4 pb-2.5 -mt-1">
                    <p className="text-[10px] text-primary-500 flex items-center gap-1">
                      <Camera size={10} /> Toque para ver foto
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Loading photo indicator */}
      {loadingPhoto && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
          <div className="bg-[var(--card)] rounded-2xl p-6 flex items-center gap-3">
            <div className="animate-spin w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full" />
            <p className="text-sm text-[var(--text)]">Carregando foto...</p>
          </div>
        </div>
      )}

      {/* Fuel photo modal */}
      {fuelPhoto && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setFuelPhoto(null)}>
          <div className="bg-[var(--card)] rounded-3xl w-full max-w-sm overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 pt-5 pb-3">
              <h3 className="font-bold text-[var(--text)]">Foto do Abastecimento</h3>
              <button onClick={() => setFuelPhoto(null)} className="w-8 h-8 rounded-full bg-[var(--subtle)] flex items-center justify-center">
                <X size={16} className="text-[var(--text-secondary)]" />
              </button>
            </div>
            <div className="relative w-full bg-[var(--subtle)]" style={{ aspectRatio: '4/3' }}>
              <Image src={fuelPhoto.imageUrl} alt="Foto do abastecimento" fill className="object-contain" unoptimized />
            </div>
            <div className="p-5 grid grid-cols-2 gap-3">
              <div className="bg-[var(--subtle)] rounded-xl p-3 text-center">
                <p className="text-[10px] text-[var(--text-secondary)]">Litros</p>
                <p className="font-bold text-[var(--text)]">{fuelPhoto.liters?.toFixed(1)}L</p>
              </div>
              <div className="bg-primary-500/10 rounded-xl p-3 text-center">
                <p className="text-[10px] text-[var(--text-secondary)]">Total</p>
                <p className="font-bold text-primary-500">R$ {Number(fuelPhoto.totalCost).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
              {fuelPhoto.notes && (
                <div className="col-span-2 bg-[var(--subtle)] rounded-xl p-3">
                  <p className="text-[10px] text-[var(--text-secondary)] mb-1">Observações</p>
                  <p className="text-xs text-[var(--text)]">{fuelPhoto.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
