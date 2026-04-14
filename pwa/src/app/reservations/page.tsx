'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plus, X, ChevronLeft, ChevronRight, Clock, Ship, User, AlertCircle, Calendar, ArrowLeftRight, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/contexts/auth';
import { getMyReservations, createReservation, cancelReservation, getShares, getBoats, getBoatReservations, getBoatCalendar, getWeatherForecast, createSwapRequest, confirmArrival } from '@/services/api';
import { format, startOfMonth, endOfMonth, addMonths, subMonths, eachDayOfInterval, isSameDay, isToday, parseISO, isBefore, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ForecastDay {
  date: string;
  dayOfWeek: string;
  navigationLevel: string;
  navigationScore: number;
  windSpeedMin: number;
  windSpeedMax: number;
  airTempMin: number;
  airTempMax: number;
  clientSummary: string;
  humidity?: number;
  rainProbability?: number;
  description?: string;
  condition?: string;
}

interface Reservation {
  id: string;
  startDate: string;
  endDate: string;
  status: string;
  confirmedAt?: string | null;
  expectedArrivalTime?: string | null;
  boat?: { id: string; name: string };
  user?: { id: string; name: string };
}

interface BoatOption { id: string; name: string; }

const HOURS = ['10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];

export default function ReservationsPage() {
  const { user } = useAuth();
  const [boats, setBoats] = useState<BoatOption[]>([]);
  const [selectedBoatId, setSelectedBoatId] = useState<string>('');
  const [calendarReservations, setCalendarReservations] = useState<Reservation[]>([]);
  const [boatDayReservations, setBoatDayReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ boatId: '', startTime: '10:00', endTime: '17:00' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [forecastMap, setForecastMap] = useState<Record<string, ForecastDay>>({});
  const [showSwap, setShowSwap] = useState(false);
  const [swapReservation, setSwapReservation] = useState<Reservation | null>(null);
  const [myFutureReservations, setMyFutureReservations] = useState<Reservation[]>([]);
  const [swapForm, setSwapForm] = useState({ offeredReservationId: '', message: '' });
  const [swapSaving, setSwapSaving] = useState(false);
  const [swapError, setSwapError] = useState('');
  const [reservationLimit, setReservationLimit] = useState<{ max: number; active: number } | null>(null);
  const [showConfirmArrival, setShowConfirmArrival] = useState(false);
  const [confirmReservation, setConfirmReservation] = useState<Reservation | null>(null);
  const [arrivalTime, setArrivalTime] = useState('10:00');
  const [confirmSaving, setConfirmSaving] = useState(false);
  const [confirmError, setConfirmError] = useState('');

  // Load forecast data
  useEffect(() => {
    (async () => {
      try {
        const { data } = await getWeatherForecast();
        const days: ForecastDay[] = Array.isArray(data) ? data : data.data || [];
        const map: Record<string, ForecastDay> = {};
        days.forEach(d => { map[d.date] = d; });
        setForecastMap(map);
      } catch { /* empty */ }
    })();
  }, []);

  // Load boats from user's shares
  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const sharesRes = await getShares({ userId: user.id });
        const shareList = Array.isArray(sharesRes.data) ? sharesRes.data : sharesRes.data.data || [];
        const boatList = shareList.map((s: { boat: BoatOption }) => ({ id: s.boat.id, name: s.boat.name }));
        setBoats(boatList);
        if (boatList.length > 0) setSelectedBoatId(boatList[0].id);
      } catch {
        try {
          const boatsRes = await getBoats();
          const all = Array.isArray(boatsRes.data) ? boatsRes.data : boatsRes.data.data || [];
          const boatList = all.map((b: BoatOption) => ({ id: b.id, name: b.name }));
          setBoats(boatList);
          if (boatList.length > 0) setSelectedBoatId(boatList[0].id);
        } catch { /* empty */ }
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  // Load reservation limit for selected boat
  useEffect(() => {
    if (!user || !selectedBoatId) return;
    (async () => {
      try {
        const sharesRes = await getShares({ userId: user.id });
        const shareList = Array.isArray(sharesRes.data) ? sharesRes.data : sharesRes.data.data || [];
        const share = shareList.find((s: any) => s.boat?.id === selectedBoatId || s.boatId === selectedBoatId);
        const max = share?.maxReservations ?? 3;

        const myRes = await getMyReservations();
        const myList: Reservation[] = Array.isArray(myRes.data) ? myRes.data : myRes.data.data || [];
        const active = myList.filter(r =>
          (r.boat?.id === selectedBoatId) &&
          ['CONFIRMED', 'PENDING'].includes(r.status) &&
          new Date(r.endDate) >= new Date()
        ).length;
        setReservationLimit({ max, active });
      } catch { setReservationLimit(null); }
    })();
  }, [user, selectedBoatId]);

  // Load calendar reservations for selected boat + month
  const loadCalendar = useCallback(async () => {
    if (!selectedBoatId) return;
    try {
      const month = currentMonth.getMonth() + 1;
      const year = currentMonth.getFullYear();
      const { data } = await getBoatCalendar(selectedBoatId, month, year);
      const list = Array.isArray(data) ? data : data.data || [];
      setCalendarReservations(list);
    } catch {
      setCalendarReservations([]);
    }
  }, [selectedBoatId, currentMonth]);

  useEffect(() => { loadCalendar(); }, [loadCalendar]);

  // Load day reservations for create modal
  const loadBoatDayReservations = useCallback(async (boatId: string, date: Date) => {
    try {
      const dateStr = format(date, 'yyyy-MM-dd');
      const { data } = await getBoatReservations(boatId, dateStr);
      const list = Array.isArray(data) ? data : data.data || [];
      setBoatDayReservations(list);
    } catch {
      setBoatDayReservations([]);
    }
  }, []);

  useEffect(() => {
    if (showCreate && form.boatId && selectedDate) {
      loadBoatDayReservations(form.boatId, selectedDate);
    } else {
      setBoatDayReservations([]);
    }
  }, [showCreate, form.boatId, selectedDate, loadBoatDayReservations]);

  const days = eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) });
  const startDay = startOfMonth(currentMonth).getDay();

  // Get all reservations for a specific day from the calendar data
  const getResForDay = (date: Date) =>
    calendarReservations.filter(r => {
      if (r.status === 'CANCELLED') return false;
      const s = parseISO(r.startDate);
      const e = parseISO(r.endDate);
      return date >= new Date(s.getFullYear(), s.getMonth(), s.getDate()) &&
             date <= new Date(e.getFullYear(), e.getMonth(), e.getDate());
    });

  // Calculate availability status: 'free' | 'partial' | 'full'
  const OPERATING_HOURS = 7; // 10:00 to 17:00
  const getDayAvailability = (date: Date): 'free' | 'partial' | 'full' => {
    const dayRes = getResForDay(date);
    if (dayRes.length === 0) return 'free';
    const bookedHours = new Set<number>();
    dayRes.forEach(r => {
      const sh = parseISO(r.startDate).getHours();
      const eh = parseISO(r.endDate).getHours();
      for (let h = Math.max(sh, 10); h < Math.min(eh, 17); h++) bookedHours.add(h);
    });
    return bookedHours.size >= OPERATING_HOURS ? 'full' : 'partial';
  };

  const selectedDayRes = selectedDate ? getResForDay(selectedDate) : [];

  // Blocked hours for create modal
  const getBlockedHours = () => {
    const blocked = new Set<string>();
    boatDayReservations.forEach(r => {
      if (r.status === 'CANCELLED') return;
      const startH = parseInt(format(parseISO(r.startDate), 'HH'));
      const endH = parseInt(format(parseISO(r.endDate), 'HH'));
      for (let h = startH; h < endH; h++) {
        blocked.add(`${String(h).padStart(2, '0')}:00`);
      }
    });
    return blocked;
  };

  const blockedHours = getBlockedHours();
  const availableStartHours = HOURS.filter(h => h !== '17:00' && !blockedHours.has(h));

  const getAvailableEndHours = (startTime: string) => {
    const startH = parseInt(startTime);
    const endHours: string[] = [];
    for (let h = startH + 1; h <= 17; h++) {
      const hourStr = `${String(h).padStart(2, '0')}:00`;
      if (blockedHours.has(`${String(h - 1).padStart(2, '0')}:00`) && h - 1 !== startH) break;
      if (h < 17 && blockedHours.has(hourStr)) {
        endHours.push(hourStr);
        break;
      }
      endHours.push(hourStr);
    }
    return endHours;
  };

  const openCreate = (date?: Date) => {
    const d = date || selectedDate || new Date();
    setSelectedDate(d);
    setForm({ boatId: selectedBoatId || (boats.length === 1 ? boats[0].id : ''), startTime: '10:00', endTime: '17:00' });
    setError('');
    setShowCreate(true);
  };

  const handleCreate = async () => {
    if (!form.boatId || !selectedDate) return;
    setError('');
    setSaving(true);
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      await createReservation({
        boatId: form.boatId,
        startDate: `${dateStr}T${form.startTime}:00`,
        endDate: `${dateStr}T${form.endTime}:00`,
      });
      setShowCreate(false);
      await loadCalendar();
      if (reservationLimit) setReservationLimit({ ...reservationLimit, active: reservationLimit.active + 1 });
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Erro ao criar reserva';
      setError(msg);
    }
    setSaving(false);
  };

  const handleCancel = async (id: string) => {
    if (!confirm('Cancelar esta reserva?')) return;
    try {
      await cancelReservation(id);
      await loadCalendar();
    } catch { /* empty */ }
  };

  const openConfirmArrival = (r: Reservation) => {
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
      await loadCalendar();
    } catch (err: any) {
      setConfirmError(err?.response?.data?.message || 'Erro ao confirmar presença');
    }
    setConfirmSaving(false);
  };

  const openSwap = async (r: Reservation) => {
    setSwapReservation(r);
    setSwapForm({ offeredReservationId: '', message: '' });
    setSwapError('');
    try {
      const { data } = await getMyReservations();
      const list: Reservation[] = Array.isArray(data) ? data : data.data || [];
      const boatId = r.boat?.id || selectedBoatId;
      const now = new Date();
      const filtered = list.filter(res =>
        res.boat?.id === boatId &&
        res.status === 'CONFIRMED' &&
        new Date(res.startDate) > now &&
        res.id !== r.id
      );
      setMyFutureReservations(filtered);
    } catch { setMyFutureReservations([]); }
    setShowSwap(true);
  };

  const handleSwap = async () => {
    if (!swapReservation || !swapForm.offeredReservationId) return;
    setSwapError('');
    setSwapSaving(true);
    try {
      await createSwapRequest({
        targetReservationId: swapReservation.id,
        offeredReservationId: swapForm.offeredReservationId,
        message: swapForm.message || undefined,
      });
      setShowSwap(false);
      alert('Solicitação de troca enviada!');
    } catch (err: any) {
      setSwapError(err?.response?.data?.message || 'Erro ao solicitar troca');
    }
    setSwapSaving(false);
  };

  const statusColor: Record<string, string> = {
    CONFIRMED: 'bg-emerald-500', PENDING: 'bg-amber-400', CANCELLED: 'bg-red-400', COMPLETED: 'bg-sky-500', IN_USE: 'bg-primary-500',
  };
  const statusLabel: Record<string, string> = {
    CONFIRMED: 'Confirmada', PENDING: 'Pendente', CANCELLED: 'Cancelada', COMPLETED: 'Concluída', IN_USE: 'Em uso',
  };
  const statusDot: Record<string, string> = {
    CONFIRMED: 'bg-emerald-400', PENDING: 'bg-amber-400', IN_USE: 'bg-primary-400', COMPLETED: 'bg-sky-400',
  };

  const navLevelColor: Record<string, string> = {
    BOM: 'bg-emerald-400',
    ATENCAO: 'bg-amber-400',
    RUIM: 'bg-orange-500',
    PERIGOSO: 'bg-red-500',
  };
  const navLevelTextColor: Record<string, string> = {
    BOM: 'text-emerald-400',
    ATENCAO: 'text-amber-400',
    RUIM: 'text-orange-500',
    PERIGOSO: 'text-red-500',
  };
  const navLevelLabel: Record<string, string> = {
    BOM: 'Bom para navegação',
    ATENCAO: 'Atenção ao navegar',
    RUIM: 'Condições ruins',
    PERIGOSO: 'Perigoso',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="py-4 space-y-4">
      {/* Boat selector */}
      {boats.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
          {boats.map(b => (
            <button
              key={b.id}
              onClick={() => { setSelectedBoatId(b.id); setSelectedDate(null); }}
              className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                selectedBoatId === b.id
                  ? 'bg-primary-500 text-white '
                  : 'bg-[var(--card)] text-[var(--text-secondary)] border border-[var(--border)]'
              }`}
            >
              {b.name}
            </button>
          ))}
        </div>
      )}

      {/* Reservation limit warning */}
      {reservationLimit && reservationLimit.active >= reservationLimit.max && (
        <div className="bg-red-500/10 border border-red-500/25 rounded-2xl p-2.5 flex items-center gap-2">
          <AlertCircle size={14} className="text-red-500 flex-shrink-0" />
          <p className="text-sm font-semibold text-red-500">Limite de reservas atingido</p>
        </div>
      )}
      {reservationLimit && reservationLimit.active > 0 && reservationLimit.active < reservationLimit.max && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-2.5 flex items-center gap-2">
          <AlertCircle size={14} className="text-amber-500 flex-shrink-0" />
          <p className="text-xs text-[var(--text-muted)]">
            Reservas ativas: <span className="font-bold text-[var(--text)]">{reservationLimit.active}/{reservationLimit.max}</span>
          </p>
        </div>
      )}

      {/* Premium Calendar */}
      <div className="bg-[var(--card)] rounded-3xl border border-[var(--border)] overflow-hidden shadow-lg">
        {/* Calendar header */}
        <div className="bg-gradient-to-r from-primary-500 to-primary-600 px-5 py-4">
          <div className="flex items-center justify-between">
            <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center active:bg-white/25 transition backdrop-blur-sm">
              <ChevronLeft size={18} className="text-white" />
            </button>
            <h2 className="font-bold text-white text-base capitalize tracking-wide">
              {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
            </h2>
            <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center active:bg-white/25 transition backdrop-blur-sm">
              <ChevronRight size={18} className="text-white" />
            </button>
          </div>

          {/* Day of week headers */}
          <div className="grid grid-cols-7 gap-1.5 mt-4">
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((d, i) => (
              <div key={i} className="text-center text-[10px] font-bold text-white/60 uppercase tracking-wider">{d}</div>
            ))}
          </div>
        </div>

        {/* Calendar grid */}
        <div className="px-3 py-3">
          <div className="grid grid-cols-7 gap-1.5">
            {Array.from({ length: startDay }).map((_, i) => <div key={`e-${i}`} className="aspect-square" />)}
            {days.map(day => {
              const dayRes = getResForDay(day);
              const isSelected = selectedDate && isSameDay(day, selectedDate);
              const today = isToday(day);
              const isPast = isBefore(day, startOfDay(new Date())) && !today;
              const dayForecast = forecastMap[format(day, 'yyyy-MM-dd')];
              const availability = getDayAvailability(day);
              const hasMine = dayRes.some(r => r.user?.id === user?.id);

              // Background color based on availability (low opacity)
              const availBg = isPast ? '' :
                hasMine ? 'bg-gray-900' :
                availability === 'free' ? 'bg-emerald-500/10' :
                availability === 'partial' ? 'bg-amber-400/12' :
                'bg-red-500/12';

              // Border accent for availability
              const availBorder = isPast ? '' :
                hasMine ? 'border-gray-900' :
                availability === 'free' ? 'border-emerald-500/20' :
                availability === 'partial' ? 'border-amber-400/25' :
                'border-red-500/25';

              // Weather emoji (small in corner)
              const weatherIcon = dayForecast && !isPast ? (
                dayForecast.navigationLevel === 'BOM' ? '☀️' :
                dayForecast.navigationLevel === 'ATENCAO' ? '⛅' :
                dayForecast.navigationLevel === 'RUIM' ? '🌊' : '⛔'
              ) : null;

              return (
                <button
                  key={day.toISOString()}
                  onClick={() => setSelectedDate(day)}
                  className={`relative aspect-square flex flex-col items-center justify-center rounded-xl text-sm font-semibold transition-all border ${
                    isSelected
                      ? 'bg-primary-500 text-white shadow-md shadow-primary-500/30 scale-[1.08] border-primary-500 z-10'
                      : today
                        ? `${availBg} ${hasMine ? 'text-white' : 'text-primary-500'} font-extrabold ring-2 ${hasMine ? 'ring-gray-700' : 'ring-primary-400'} ring-offset-1 ring-offset-[var(--card)] ${availBorder}`
                        : isPast
                          ? 'text-[var(--text-muted)]/40 border-transparent'
                          : `${availBg} ${availBorder} ${hasMine ? 'text-white' : 'text-[var(--text)]'} hover:scale-[1.04] active:scale-95`
                  }`}
                >
                  {/* Weather icon centered above number */}
                  {weatherIcon && !isSelected && (
                    <span className="text-[10px] leading-none -mt-0.5">{weatherIcon}</span>
                  )}

                  {/* Day number */}
                  <span className={`${isSelected ? 'text-white' : ''} ${weatherIcon && !isSelected ? '-mb-0.5' : ''}`}>{day.getDate()}</span>

                  {/* Availability bar at bottom */}
                  {!isPast && !isSelected && !hasMine && (
                    <div className={`absolute bottom-1 left-1.5 right-1.5 h-[3px] rounded-full ${
                      availability === 'free' ? 'bg-emerald-400/60' :
                      availability === 'partial' ? 'bg-amber-400/60' :
                      'bg-red-400/60'
                    }`} />
                  )}

                  {/* Selected day: show weather icon */}
                  {isSelected && weatherIcon && (
                    <span className="text-[10px] leading-none -mt-0.5">{weatherIcon}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="px-4 pb-3 pt-1">
          <div className="flex items-center justify-center gap-4 text-[9px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded-md bg-gray-900" />
              Minha
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded-md bg-emerald-500/15 border border-emerald-500/30" />
              Livre
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded-md bg-amber-400/15 border border-amber-400/30" />
              Parcial
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded-md bg-red-500/15 border border-red-500/30" />
              Ocupado
            </div>
          </div>
        </div>
      </div>

      {/* Selected day — show ALL reservations */}
      {selectedDate && (
        <div>
          {/* Navigation status for the day */}
          {(() => {
            const fc = forecastMap[format(selectedDate, 'yyyy-MM-dd')];
            if (!fc) return null;
            return (
              <div className={`mb-3 rounded-2xl p-3 border flex items-center gap-3 ${
                fc.navigationLevel === 'BOM' ? 'bg-emerald-500/10 border-emerald-500/20' :
                fc.navigationLevel === 'ATENCAO' ? 'bg-amber-500/10 border-amber-500/20' :
                fc.navigationLevel === 'RUIM' ? 'bg-orange-500/10 border-orange-500/20' :
                'bg-red-500/10 border-red-500/20'
              }`}>
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  fc.navigationLevel === 'BOM' ? 'bg-emerald-500/20' :
                  fc.navigationLevel === 'ATENCAO' ? 'bg-amber-500/20' :
                  fc.navigationLevel === 'RUIM' ? 'bg-orange-500/20' :
                  'bg-red-500/20'
                }`}>
                  <span className="text-base">{
                    fc.navigationLevel === 'BOM' ? '☀️' :
                    fc.navigationLevel === 'ATENCAO' ? '⚠️' :
                    fc.navigationLevel === 'RUIM' ? '🌊' : '⛔'
                  }</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-bold ${navLevelTextColor[fc.navigationLevel] || 'text-gray-400'}`}>
                    {navLevelLabel[fc.navigationLevel] || fc.navigationLevel}
                  </p>
                  <p className="text-[11px] text-[var(--text-muted)] truncate">{fc.clientSummary}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-[10px] text-[var(--text-muted)]">{fc.airTempMin}–{fc.airTempMax}°C</p>
                  <p className="text-[10px] text-[var(--text-muted)]">Vento {fc.windSpeedMin}km/h</p>
                </div>
              </div>
            );
          })()}

          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-primary-500/10 flex items-center justify-center">
                <Calendar size={16} className="text-primary-500" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[var(--text)]">
                  {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
                </h3>
                <p className="text-[10px] text-[var(--text-muted)]">
                  {selectedDayRes.length === 0 ? 'Disponível o dia todo' : `${selectedDayRes.length} reserva${selectedDayRes.length > 1 ? 's' : ''}`}
                </p>
              </div>
            </div>
            {!isBefore(selectedDate, startOfDay(new Date())) && (
              <button
                onClick={() => openCreate(selectedDate)}
                className="text-xs text-primary-500 font-semibold flex items-center gap-1 bg-primary-500/10 px-3 py-1.5 rounded-lg active:bg-primary-500/15 transition"
              >
                <Plus size={14} strokeWidth={2.5} /> Reservar
              </button>
            )}
          </div>

          {selectedDayRes.length === 0 ? (
            <div className="bg-[var(--card)] rounded-2xl p-6 border border-[var(--border)] text-center">
              <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto mb-2">
                <Ship size={24} className="text-emerald-400" />
              </div>
              <p className="text-sm text-[var(--text-secondary)]">Nenhuma reserva neste dia</p>
              <p className="text-[11px] text-[var(--text-muted)] mt-0.5">Todos os horários disponíveis</p>
            </div>
          ) : (
            <div className="space-y-2">
              {selectedDayRes.map(r => {
                const isMine = r.user?.id === user?.id;
                return (
                  <div key={r.id} className={`rounded-2xl p-3.5 border transition-all ${
                    isMine ? 'bg-primary-500/10 border-primary-100' : 'bg-[var(--card)] border-[var(--border)]'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                          isMine ? 'bg-primary-500/15' : 'bg-[var(--subtle)]'
                        }`}>
                          <User size={14} className={isMine ? 'text-primary-500' : 'text-[var(--text-muted)]'} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-[var(--text)]">
                            {isMine ? 'Você' : r.user?.name || 'Cotista'}
                          </p>
                          <div className="flex items-center gap-1 text-[11px] text-[var(--text-muted)]">
                            <Clock size={10} />
                            <span>{format(parseISO(r.startDate), 'HH:mm')} — {format(parseISO(r.endDate), 'HH:mm')}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${statusDot[r.status] || 'bg-[var(--text-muted)]'}`} />
                        <span className="text-[10px] font-medium text-[var(--text-muted)]">{statusLabel[r.status] || r.status}</span>
                      </div>
                    </div>
                    {/* Confirmed arrival badge */}
                    {isMine && r.confirmedAt && r.expectedArrivalTime && (
                      <div className="mt-2 flex items-center gap-1.5 bg-emerald-500/10 rounded-lg px-2.5 py-1.5">
                        <CheckCircle2 size={12} className="text-emerald-500 flex-shrink-0" />
                        <span className="text-[11px] text-emerald-600 font-medium">Presença confirmada · Chegada prevista: <strong>{r.expectedArrivalTime}</strong></span>
                      </div>
                    )}
                    {isMine && (r.status === 'CONFIRMED' || r.status === 'PENDING') && (
                      <div className="mt-2 flex gap-2 flex-wrap">
                        {/* Confirm arrival button — shows today only, if not yet confirmed */}
                        {!r.confirmedAt && isToday(selectedDate!) && (
                          <button
                            onClick={() => openConfirmArrival(r)}
                            className="text-xs text-emerald-600 font-semibold bg-emerald-500/10 px-3 py-1.5 rounded-lg active:bg-emerald-500/20 transition flex items-center gap-1 border border-emerald-500/20"
                          >
                            <CheckCircle2 size={12} /> Confirmar presença
                          </button>
                        )}
                        <button
                          onClick={() => handleCancel(r.id)}
                          className="text-xs text-red-500 font-medium bg-red-500/10 px-3 py-1 rounded-lg active:bg-red-100 transition"
                        >
                          Cancelar reserva
                        </button>
                      </div>
                    )}
                    {!isMine && r.status === 'CONFIRMED' && !isBefore(parseISO(r.startDate), new Date()) && (
                      <div className="mt-2">
                        <button
                          onClick={() => openSwap(r)}
                          className="text-xs text-primary-500 font-medium bg-primary-500/10 px-3 py-1 rounded-lg active:bg-primary-500/15 transition flex items-center gap-1"
                        >
                          <ArrowLeftRight size={12} /> Trocar Data
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Create modal */}
      {showCreate && selectedDate && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-end" onClick={() => setShowCreate(false)}>
          <div className="bg-[var(--card)] w-full rounded-t-3xl p-6 max-h-[85vh] overflow-auto" onClick={e => e.stopPropagation()}>
            {/* Drag handle */}
            <div className="w-10 h-1 bg-[var(--subtle-hover)] rounded-full mx-auto mb-4" />
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold text-[var(--text)]">Nova Reserva</h2>
                <p className="text-sm text-[var(--text-muted)]">
                  {format(selectedDate, "EEEE, dd 'de' MMMM", { locale: ptBR })}
                </p>
              </div>
              <button onClick={() => setShowCreate(false)} className="w-8 h-8 rounded-full bg-[var(--subtle)] flex items-center justify-center">
                <X size={16} className="text-[var(--text-secondary)]" />
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-2xl text-sm text-red-400 flex items-start gap-2">
                <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">Embarcação</label>
                <select
                  value={form.boatId}
                  onChange={(e) => setForm({ ...form, boatId: e.target.value, startTime: '10:00', endTime: '17:00' })}
                  className="w-full px-4 py-3 rounded-2xl border border-[var(--border)] text-sm bg-[var(--subtle)] focus:bg-[var(--card)] focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500/50 transition"
                >
                  <option value="">Selecionar...</option>
                  {boats.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>

              {/* Occupied times */}
              {form.boatId && boatDayReservations.filter(r => r.status !== 'CANCELLED').length > 0 && (
                <div className="bg-amber-50 border border-amber-100 rounded-2xl p-3.5">
                  <p className="text-xs font-semibold text-amber-700 mb-2">Horários ocupados</p>
                  <div className="space-y-1.5">
                    {boatDayReservations.filter(r => r.status !== 'CANCELLED').map(r => (
                      <div key={r.id} className="flex items-center gap-2 text-xs text-amber-600">
                        <Clock size={12} />
                        <span className="font-semibold">
                          {format(parseISO(r.startDate), 'HH:mm')} — {format(parseISO(r.endDate), 'HH:mm')}
                        </span>
                        <span className="text-amber-400">
                          {r.user?.id === user?.id ? 'Você' : r.user?.name || 'Cotista'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">Início</label>
                  <select
                    value={form.startTime}
                    onChange={(e) => {
                      const st = e.target.value;
                      const endHours = getAvailableEndHours(st);
                      setForm({ ...form, startTime: st, endTime: endHours[endHours.length - 1] || '17:00' });
                    }}
                    className="w-full px-4 py-3 rounded-2xl border border-[var(--border)] text-sm bg-[var(--subtle)] focus:bg-[var(--card)] focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500/50 transition"
                  >
                    {availableStartHours.length === 0 ? (
                      <option value="">Sem horário</option>
                    ) : (
                      availableStartHours.map(h => <option key={h} value={h}>{h}</option>)
                    )}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">Fim</label>
                  <select
                    value={form.endTime}
                    onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl border border-[var(--border)] text-sm bg-[var(--subtle)] focus:bg-[var(--card)] focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500/50 transition"
                  >
                    {getAvailableEndHours(form.startTime).map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
              </div>

              {availableStartHours.length === 0 && form.boatId && (
                <p className="text-sm text-red-500 text-center">Todos os horários estão ocupados neste dia.</p>
              )}

              <button
                onClick={handleCreate}
                disabled={saving || !form.boatId || availableStartHours.length === 0}
                className="w-full bg-primary-500 text-white py-3.5 rounded-2xl font-semibold disabled:opacity-50  active:scale-[0.98] transition-transform"
              >
                {saving ? 'Salvando...' : 'Confirmar Reserva'}
              </button>
            </div>
          </div>
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
                <X size={16} className="text-[var(--text-secondary)]" />
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

      {/* Swap modal */}
      {showSwap && swapReservation && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-end" onClick={() => setShowSwap(false)}>
          <div className="bg-[var(--card)] w-full rounded-t-3xl p-6 max-h-[85vh] overflow-auto" onClick={e => e.stopPropagation()}>
            <div className="w-10 h-1 bg-[var(--subtle-hover)] rounded-full mx-auto mb-4" />
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold text-[var(--text)]">Trocar Data</h2>
                <p className="text-sm text-[var(--text-muted)]">
                  Reserva de {swapReservation.user?.name}: {format(parseISO(swapReservation.startDate), "dd/MM 'às' HH:mm")} — {format(parseISO(swapReservation.endDate), 'HH:mm')}
                </p>
              </div>
              <button onClick={() => setShowSwap(false)} className="w-8 h-8 rounded-full bg-[var(--subtle)] flex items-center justify-center">
                <X size={16} className="text-[var(--text-secondary)]" />
              </button>
            </div>

            {swapError && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-2xl text-sm text-red-400 flex items-start gap-2">
                <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                <span>{swapError}</span>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">Oferecer sua reserva</label>
                {myFutureReservations.length === 0 ? (
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-3 text-sm text-amber-400">
                    Você não possui reservas futuras confirmadas para trocar.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {myFutureReservations.map(r => (
                      <button
                        key={r.id}
                        onClick={() => setSwapForm({ ...swapForm, offeredReservationId: r.id })}
                        className={`w-full text-left p-3 rounded-2xl border transition-all ${
                          swapForm.offeredReservationId === r.id
                            ? 'border-primary-500 bg-primary-500/10'
                            : 'border-[var(--border)] bg-[var(--subtle)]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                            swapForm.offeredReservationId === r.id ? 'bg-primary-500/20' : 'bg-[var(--subtle-hover)]'
                          }`}>
                            <Calendar size={14} className={swapForm.offeredReservationId === r.id ? 'text-primary-500' : 'text-[var(--text-muted)]'} />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-[var(--text)]">
                              {format(parseISO(r.startDate), "dd 'de' MMMM", { locale: ptBR })}
                            </p>
                            <div className="flex items-center gap-1 text-[11px] text-[var(--text-muted)]">
                              <Clock size={10} />
                              <span>{format(parseISO(r.startDate), 'HH:mm')} — {format(parseISO(r.endDate), 'HH:mm')}</span>
                            </div>
                          </div>
                          {swapForm.offeredReservationId === r.id && (
                            <div className="ml-auto w-5 h-5 rounded-full bg-primary-500 flex items-center justify-center">
                              <span className="text-white text-xs">✓</span>
                            </div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">Mensagem (opcional)</label>
                <textarea
                  value={swapForm.message}
                  onChange={e => setSwapForm({ ...swapForm, message: e.target.value })}
                  placeholder="Ex: Gostaria de trocar a data..."
                  rows={2}
                  className="w-full px-4 py-3 rounded-2xl border border-[var(--border)] text-sm bg-[var(--subtle)] focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500/50 transition resize-none"
                />
              </div>

              <button
                onClick={handleSwap}
                disabled={swapSaving || !swapForm.offeredReservationId}
                className="w-full bg-primary-500 text-white py-3.5 rounded-2xl font-semibold disabled:opacity-50 active:scale-[0.98] transition-transform"
              >
                {swapSaving ? 'Enviando...' : 'Enviar Solicitação de Troca'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
