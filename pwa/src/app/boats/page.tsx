'use client';

import { useEffect, useState } from 'react';
import { Ship, AlertTriangle, FileText, ArrowLeftRight, Check, X as XIcon, Calendar, Clock, Anchor, DollarSign, CheckCircle2, AlertCircle } from 'lucide-react';
import Image from 'next/image';
import { useAuth } from '@/contexts/auth';
import { getShares, getBoats, getMyCharges, getPendingSwaps, respondToSwap, getMyReservations, confirmArrival, getWeatherAiSummary } from '@/services/api';
import { format, parseISO, isToday } from 'date-fns';
import WeatherWidget from '@/components/WeatherWidget';

interface Boat {
  id: string;
  name: string;
  model: string;
  length: number;
  year: number;
  registrationNumber: string;
  totalShares: number;
  monthlyFee: number;
  imageUrl?: string;
  notes?: string;
}

interface Share {
  id: string;
  shareNumber: number;
  boat: Boat;
}

interface Charge {
  id: string;
  status: string;
  boatId?: string;
  dueDate: string;
}

interface SwapRequest {
  id: string;
  status: string;
  message?: string;
  createdAt: string;
  reservation: {
    id: string;
    startDate: string;
    endDate: string;
    boat: { id: string; name: string };
    user: { id: string; name: string };
  };
  offeredReservation: {
    id: string;
    startDate: string;
    endDate: string;
    user: { id: string; name: string };
  };
  requester: { id: string; name: string };
}

export default function BoatsPage() {
  const { user } = useAuth();
  const [shares, setShares] = useState<Share[]>([]);
  const [chargesByBoat, setChargesByBoat] = useState<Record<string, { overdue: number; pending: number }>>({});
  const [pendingSwaps, setPendingSwaps] = useState<SwapRequest[]>([]);
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Confirm arrival state
  const [todayReservations, setTodayReservations] = useState<any[]>([]);
  const [showConfirmArrival, setShowConfirmArrival] = useState(false);
  const [confirmReservation, setConfirmReservation] = useState<any | null>(null);
  const [arrivalTime, setArrivalTime] = useState('10:00');
  const [confirmSaving, setConfirmSaving] = useState(false);
  const [confirmError, setConfirmError] = useState('');
  const [aiSummary, setAiSummary] = useState<string | null>(null);

  const HOURS = ['08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00'];

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const { data } = await getShares({ userId: user.id });
        const items = Array.isArray(data) ? data : data.data || [];
        setShares(items);
      } catch {
        try {
          const { data } = await getBoats();
          const boats = Array.isArray(data) ? data : data.data || [];
          setShares(boats.map((b: Boat) => ({ id: b.id, shareNumber: 0, boat: b })));
        } catch { /* empty */ }
      }

      // Load charges grouped by boat
      try {
        const { data: charges } = await getMyCharges();
        const list: Charge[] = Array.isArray(charges) ? charges : charges.data || [];
        const grouped: Record<string, { overdue: number; pending: number }> = {};
        list.forEach((c: Charge) => {
          const bid = c.boatId || '_none';
          if (!grouped[bid]) grouped[bid] = { overdue: 0, pending: 0 };
          if (c.status === 'OVERDUE') grouped[bid].overdue++;
          if (c.status === 'PENDING') grouped[bid].pending++;
        });
        setChargesByBoat(grouped);
      } catch { /* empty */ }

      // Load pending swap requests
      try {
        const { data: swaps } = await getPendingSwaps();
        setPendingSwaps(Array.isArray(swaps) ? swaps : swaps.data || []);
      } catch { /* empty */ }

      // Load today's reservations for confirm presence banner
      try {
        const { data: resData } = await getMyReservations();
        const resList = Array.isArray(resData) ? resData : resData.data || [];
        const todayRes = resList.filter((r: any) =>
          ['CONFIRMED', 'PENDING'].includes(r.status) &&
          isToday(parseISO(r.startDate))
        );
        setTodayReservations(todayRes);
      } catch { /* empty */ }

      // Load AI navigation summary
      try {
        const { data: aiData } = await getWeatherAiSummary();
        if (aiData.ok && aiData.data?.summary) setAiSummary(aiData.data.summary);
      } catch { /* empty */ }

      setLoading(false);
    })();
  }, [user]);

  const openConfirmArrival = (r: any) => {
    setConfirmReservation(r);
    setArrivalTime(format(parseISO(r.startDate), 'HH:mm'));
    setConfirmError('');
    setShowConfirmArrival(true);
  };

  const handleConfirmArrival = async () => {
    if (!confirmReservation) return;
    setConfirmError('');
    setConfirmSaving(true);
    try {
      await confirmArrival(confirmReservation.id, arrivalTime);
      setShowConfirmArrival(false);
      setTodayReservations(prev => prev.map(r =>
        r.id === confirmReservation.id ? { ...r, confirmedAt: new Date().toISOString(), expectedArrivalTime: arrivalTime } : r
      ));
    } catch (err: any) {
      setConfirmError(err?.response?.data?.message || 'Erro ao confirmar presença');
    }
    setConfirmSaving(false);
  };

  const handleSwapRespond = async (swapId: string, accept: boolean) => {
    setRespondingId(swapId);
    try {
      await respondToSwap(swapId, accept);
      setPendingSwaps(prev => prev.filter(s => s.id !== swapId));
    } catch { alert('Erro ao responder solicitação'); }
    setRespondingId(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="py-4 space-y-5">

      {/* Weather + Today's Reservations unified */}
      <WeatherWidget variant="client" todayReservations={todayReservations} onConfirmArrival={openConfirmArrival} aiSummary={aiSummary} />

      {/* Pending swap requests */}
      {pendingSwaps.length > 0 && (
        <div className="space-y-3">
          {pendingSwaps.map(swap => {
            const isResponding = respondingId === swap.id;
            return (
              <div key={swap.id} className="bg-gradient-to-br from-amber-500/5 to-primary-500/5 rounded-3xl border border-amber-400/30 p-4 shadow-sm">
                {/* Header with badge */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-lg bg-amber-500 flex items-center justify-center">
                    <ArrowLeftRight size={14} className="text-white" />
                  </div>
                  <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">Solicitação de Troca</span>
                </div>

                {/* Requester info */}
                <p className="text-sm text-[var(--text)]">
                  <span className="font-bold">{swap.requester.name}</span>
                  <span className="text-[var(--text-muted)]"> quer trocar uma reserva no </span>
                  <span className="font-semibold">{swap.reservation.boat.name}</span>
                </p>

                {/* Swap visualization */}
                <div className="mt-3 rounded-2xl bg-[var(--card)] border border-[var(--border)] overflow-hidden">
                  {/* Your reservation */}
                  <div className="p-3 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-primary-500/10 flex items-center justify-center flex-shrink-0">
                      <Calendar size={16} className="text-primary-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Sua reserva</p>
                      <p className="text-sm font-bold text-[var(--text)]">
                        {new Date(swap.reservation.startDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                        <span className="font-normal text-[var(--text-muted)]"> • </span>
                        {new Date(swap.reservation.startDate).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} — {new Date(swap.reservation.endDate).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>

                  {/* Swap arrow divider */}
                  <div className="flex items-center px-4">
                    <div className="flex-1 h-px bg-[var(--border)]" />
                    <div className="mx-3 w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center shadow-md shadow-primary-500/25">
                      <ArrowLeftRight size={14} className="text-white rotate-90" />
                    </div>
                    <div className="flex-1 h-px bg-[var(--border)]" />
                  </div>

                  {/* Their reservation */}
                  <div className="p-3 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                      <Calendar size={16} className="text-amber-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Reserva de {swap.requester.name}</p>
                      <p className="text-sm font-bold text-primary-500">
                        {new Date(swap.offeredReservation.startDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                        <span className="font-normal text-[var(--text-muted)]"> • </span>
                        {new Date(swap.offeredReservation.startDate).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} — {new Date(swap.offeredReservation.endDate).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                </div>

                {swap.message && (
                  <p className="text-xs text-[var(--text-muted)] italic mt-3 px-1">&ldquo;{swap.message}&rdquo;</p>
                )}

                {/* Action buttons */}
                <div className="flex gap-2.5 mt-4">
                  <button
                    onClick={() => handleSwapRespond(swap.id, true)}
                    disabled={isResponding}
                    className="flex-1 bg-emerald-500 text-white py-3 rounded-2xl text-sm font-bold flex items-center justify-center gap-1.5 active:scale-[0.97] transition-all disabled:opacity-50 shadow-sm shadow-emerald-500/20"
                  >
                    <Check size={16} strokeWidth={2.5} /> Aceitar
                  </button>
                  <button
                    onClick={() => handleSwapRespond(swap.id, false)}
                    disabled={isResponding}
                    className="flex-1 bg-[var(--card)] text-red-500 py-3 rounded-2xl text-sm font-bold flex items-center justify-center gap-1.5 active:scale-[0.97] transition-all disabled:opacity-50 border border-red-500/25"
                  >
                    <XIcon size={16} strokeWidth={2.5} /> Recusar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}



      {/* Boats section */}
      {shares.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-3xl bg-primary-500/10 flex items-center justify-center mx-auto mb-4">
            <Anchor size={32} className="text-primary-500/40" />
          </div>
          <p className="text-sm font-semibold text-[var(--text-secondary)]">Nenhuma embarcação encontrada</p>
          <p className="text-xs text-[var(--text-muted)] mt-1">Entre em contato com a administração</p>
        </div>
      ) : (
        <div className="space-y-4">
          {shares.map((share) => {
            const boat = share.boat;
            const isOwn = boat.notes?.startsWith('[PRÓPRIA]');
            const boatCharges = chargesByBoat[boat.id] || { overdue: 0, pending: 0 };
            return (
              <div key={share.id} className="bg-[var(--card)] rounded-3xl border border-[var(--border)] overflow-hidden shadow-sm">
                {/* Boat photo with gradient overlay */}
                {boat.imageUrl ? (
                  <div className="relative w-full h-44 bg-[var(--subtle)]">
                    <Image
                      src={boat.imageUrl}
                      alt={boat.name}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    {/* Boat name overlay */}
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <div className="flex items-end justify-between">
                        <div>
                          <h3 className="font-bold text-white text-lg leading-tight">{boat.name}</h3>
                          <p className="text-xs text-white/70 mt-0.5">{boat.model} • {boat.year}</p>
                        </div>
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full backdrop-blur-md ${
                          isOwn ? 'bg-blue-500/80 text-white' : 'bg-white/20 text-white'
                        }`}>
                          {isOwn ? 'PRÓPRIA' : `Cota #${share.shareNumber}`}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="relative w-full h-32 bg-gradient-to-br from-primary-500/10 to-primary-500/5 flex items-center justify-center">
                    <Ship size={40} className="text-primary-500/25" />
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <div className="flex items-end justify-between">
                        <div>
                          <h3 className="font-bold text-[var(--text)] text-lg leading-tight">{boat.name}</h3>
                          <p className="text-xs text-[var(--text-muted)] mt-0.5">{boat.model} • {boat.year}</p>
                        </div>
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                          isOwn ? 'bg-blue-500 text-white' : 'bg-primary-500/10 text-primary-500'
                        }`}>
                          {isOwn ? 'PRÓPRIA' : `Cota #${share.shareNumber}`}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Stats row */}
                <div className="p-4">
                  <div className="flex gap-2">
                    {boatCharges.overdue > 0 && (
                      <div className="flex-1 bg-red-500/10 rounded-2xl p-3 flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-red-500/15 flex items-center justify-center flex-shrink-0">
                          <AlertTriangle size={14} className="text-red-500" />
                        </div>
                        <div>
                          <p className="text-lg font-extrabold text-red-500 leading-none">{boatCharges.overdue}</p>
                          <p className="text-[9px] text-red-400 font-semibold uppercase tracking-wider mt-0.5">Vencida{boatCharges.overdue > 1 ? 's' : ''}</p>
                        </div>
                      </div>
                    )}
                    <div className="flex-1 bg-[var(--subtle)] rounded-2xl p-3 flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-[var(--subtle-hover)] flex items-center justify-center flex-shrink-0">
                        <FileText size={14} className="text-[var(--text-muted)]" />
                      </div>
                      <div>
                        <p className="text-lg font-extrabold text-[var(--text)] leading-none">{boatCharges.pending}</p>
                        <p className="text-[9px] text-[var(--text-muted)] font-semibold uppercase tracking-wider mt-0.5">Fatura{boatCharges.pending !== 1 ? 's' : ''}</p>
                      </div>
                    </div>
                    <div className="flex-1 bg-[var(--subtle)] rounded-2xl p-3 flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-[var(--subtle-hover)] flex items-center justify-center flex-shrink-0">
                        <DollarSign size={14} className="text-[var(--text-muted)]" />
                      </div>
                      <div>
                        <p className="text-sm font-extrabold text-[var(--text)] leading-none">R$ {Number(boat.monthlyFee || 0).toLocaleString('pt-BR')}</p>
                        <p className="text-[9px] text-[var(--text-muted)] font-semibold uppercase tracking-wider mt-0.5">Mensal</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Confirm arrival modal */}
      {showConfirmArrival && confirmReservation && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-end" onClick={() => setShowConfirmArrival(false)}>
          <div className="bg-[var(--card)] w-full rounded-t-3xl p-6 max-h-[85vh] overflow-auto" onClick={e => e.stopPropagation()}>
            <div className="w-10 h-1 bg-[var(--subtle-hover)] rounded-full mx-auto mb-4" />
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold text-[var(--text)]">Confirmar Presença</h2>
                <p className="text-sm text-[var(--text-muted)]">
                  {confirmReservation.boat?.name} · {format(parseISO(confirmReservation.startDate), "dd/MM 'às' HH:mm")} — {format(parseISO(confirmReservation.endDate), 'HH:mm')}
                </p>
              </div>
              <button onClick={() => setShowConfirmArrival(false)} className="w-8 h-8 rounded-full bg-[var(--subtle)] flex items-center justify-center">
                <XIcon size={16} className="text-[var(--text-secondary)]" />
              </button>
            </div>

            {confirmError && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-2xl text-sm text-red-400 flex items-start gap-2">
                <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                <span>{confirmError}</span>
              </div>
            )}

            <div className="space-y-5">
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4">
                <p className="text-sm text-emerald-700 dark:text-emerald-400 font-medium mb-1">Confirmando sua presença hoje</p>
                <p className="text-xs text-[var(--text-muted)]">Informe o horário aproximado que você irá chegar à marina. A equipe será avisada para preparar o jet ski.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">Horário previsto de chegada</label>
                <select
                  value={arrivalTime}
                  onChange={e => setArrivalTime(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-[var(--border)] text-sm bg-[var(--subtle)] focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50 transition"
                >
                  {HOURS.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>

              <button
                onClick={handleConfirmArrival}
                disabled={confirmSaving}
                className="w-full bg-emerald-500 text-white py-3.5 rounded-2xl font-semibold disabled:opacity-50 active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
              >
                {confirmSaving ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <CheckCircle2 size={18} />
                )}
                {confirmSaving ? 'Confirmando...' : 'Confirmar Presença'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}