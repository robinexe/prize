'use client';

import { useState, useEffect, useMemo } from 'react';
import { HandCoins, Plus, Search, X, ChevronDown, RefreshCw, Eye, Ban, Calendar, User, Ship, CheckCircle2 } from 'lucide-react';
import { getShareSales, getShareSale, createShareSale, cancelShareSale, getBoats, getUsers, getShares } from '@/services/api';

interface Boat { id: string; name: string; model: string; totalShares: number; monthlyFee: number }
interface UserItem { id: string; name: string; email: string; phone?: string }
interface ShareSale {
  id: string;
  boatId: string;
  userId: string;
  shareNumber: number;
  paymentType: 'AVISTA' | 'FINANCIADO';
  totalValue: number;
  downPayment: number;
  installments: number;
  installmentValue: number;
  dueDay: number;
  startDate: string;
  notes?: string;
  status: string;
  createdAt: string;
  boat?: { id: string; name: string; model: string; monthlyFee: number };
  user?: { id: string; name: string; email: string; phone?: string };
}
interface SaleDetail extends ShareSale {
  charges?: { id: string; description: string; amount: number; dueDate: string; status: string }[];
}

const fmtBRL = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const fmtDate = (s: string) => new Date(s).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });

export default function ShareSalesPage() {
  const [sales, setSales] = useState<ShareSale[]>([]);
  const [boats, setBoats] = useState<Boat[]>([]);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [takenShares, setTakenShares] = useState<{ boatId: string; shareNumber: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // New Sale modal
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState<'form' | 'preview'>('form');

  // Form state
  const [boatSearch, setBoatSearch] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [showBoatDropdown, setShowBoatDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  const emptyForm = {
    boatId: '', boatName: '',
    userId: '', userName: '',
    shareNumber: 1,
    paymentType: 'FINANCIADO' as 'AVISTA' | 'FINANCIADO',
    totalValue: '',
    downPayment: '',
    installments: 12,
    dueDay: 10,
    monthlyFeeDueDay: 0,
    startDate: new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' }),
    notes: '',
  };
  const [form, setForm] = useState(emptyForm);

  // Detail modal
  const [detail, setDetail] = useState<SaleDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  async function loadData() {
    try {
      const [salesRes, boatsRes, usersRes, sharesRes] = await Promise.all([
        getShareSales().catch(() => ({ data: { data: [] } })),
        getBoats().catch(() => ({ data: [] })),
        getUsers({ limit: 300 }).catch(() => ({ data: [] })),
        getShares().catch(() => ({ data: [] })),
      ]);
      const s = salesRes.data;
      setSales(Array.isArray(s) ? s : s?.data || []);
      const b = boatsRes.data;
      setBoats(Array.isArray(b) ? b : b?.data || []);
      const u = usersRes.data;
      setUsers(Array.isArray(u) ? u : u?.data || []);
      const sh = sharesRes.data;
      const shareList = Array.isArray(sh) ? sh : sh?.data || [];
      setTakenShares(shareList.filter((s: { isActive: boolean }) => s.isActive).map((s: { boatId: string; shareNumber: number }) => ({ boatId: s.boatId, shareNumber: s.shareNumber })));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadData(); }, []);

  const selectedBoat = boats.find((b) => b.id === form.boatId);

  const availableShares = useMemo(() => {
    if (!selectedBoat) return [];
    const taken = new Set(takenShares.filter((s) => s.boatId === form.boatId).map((s) => s.shareNumber));
    return Array.from({ length: selectedBoat.totalShares }, (_, i) => i + 1).filter((n) => !taken.has(n));
  }, [selectedBoat, form.boatId, takenShares]);

  const totalValue = parseFloat(form.totalValue) || 0;
  const downPayment = form.paymentType === 'AVISTA' ? 0 : (parseFloat(form.downPayment) || 0);
  const financedAmount = totalValue - downPayment;
  const installmentValue = form.installments > 0 ? Math.round((financedAmount / form.installments) * 100) / 100 : 0;

  // Preview installments
  const previewInstallments = useMemo(() => {
    if (!totalValue) return [];
    const today = new Date();
    return Array.from({ length: form.installments }, (_, i) => {
      let d: Date;
      if (i === 0) {
        // Entrada: paid today
        d = new Date(today);
      } else {
        // Subsequent installments: from next month onwards
        d = new Date(today.getFullYear(), today.getMonth() + i, form.dueDay);
      }
      return {
        num: i + 1,
        amount: i === 0 && downPayment > 0 ? downPayment : installmentValue,
        dueDate: d,
        label: i === 0 && downPayment > 0 ? 'Entrada' : `Parcela ${i + 1}/${form.installments}`,
      };
    });
  }, [form.installments, form.dueDay, totalValue, downPayment, installmentValue]);

  async function handleSubmit() {
    setSaving(true);
    try {
      await createShareSale({
        boatId: form.boatId,
        userId: form.userId,
        shareNumber: form.shareNumber,
        paymentType: form.paymentType,
        totalValue,
        downPayment: form.paymentType === 'AVISTA' ? 0 : downPayment,
        installments: form.paymentType === 'AVISTA' ? 1 : form.installments,
        dueDay: form.dueDay,
        monthlyFeeDueDay: form.monthlyFeeDueDay || undefined,
        startDate: form.startDate,
        notes: form.notes || undefined,
      });
      setShowCreate(false);
      setForm(emptyForm);
      setStep('form');
      await loadData();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      alert(err?.response?.data?.message || 'Erro ao criar venda');
    } finally {
      setSaving(false);
    }
  }

  async function openDetail(id: string) {
    setLoadingDetail(true);
    try {
      const res = await getShareSale(id);
      setDetail(res.data);
    } finally {
      setLoadingDetail(false);
    }
  }

  async function handleCancel(id: string) {
    if (!confirm('Finalizar esta venda?\n\n• Faturas pagas continuam como lucro\n• Faturas pendentes serão canceladas\n• Usuário será removido da cota')) return;
    await cancelShareSale(id);
    await loadData();
    setDetail(null);
  }

  const filtered = sales.filter((s) => {
    const q = search.toLowerCase();
    return !q || s.boat?.name?.toLowerCase().includes(q) || s.user?.name?.toLowerCase().includes(q);
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
            <HandCoins className="w-5 h-5 text-purple-500" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-th">Venda de Cotas</h1>
            <p className="text-sm text-th-muted">Gerencie vendas de cotas à vista e financiadas</p>
          </div>
        </div>
        <button
          onClick={() => { setShowCreate(true); setStep('form'); setForm(emptyForm); setBoatSearch(''); setUserSearch(''); }}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors text-sm"
        >
          <Plus className="w-4 h-4" />
          Nova Venda
        </button>
      </div>

      {/* Search */}
      <div className="bg-th-card border border-th rounded-xl p-4">
        <div className="relative max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-th-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por cliente ou embarcação..."
            className="pl-9 pr-3 py-2 w-full bg-th-bg border border-th rounded-lg text-sm text-th placeholder:text-th-muted focus:outline-none focus:ring-2 focus:ring-purple-400"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-th-card border border-th rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-th-muted">Carregando...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-th-muted">Nenhuma venda encontrada</div>
        ) : (
          <table className="w-full">
            <thead className="bg-th-bg border-b border-th">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-th-muted uppercase tracking-wide">Cliente</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-th-muted uppercase tracking-wide">Embarcação</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-th-muted uppercase tracking-wide">Cota #</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-th-muted uppercase tracking-wide">Tipo</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-th-muted uppercase tracking-wide">Total</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-th-muted uppercase tracking-wide">Parcelas</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-th-muted uppercase tracking-wide">Vencto</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-th-muted uppercase tracking-wide">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-th-muted uppercase tracking-wide"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-th">
              {filtered.map((sale) => (
                <tr key={sale.id} className="hover:bg-th-bg/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-th-muted flex-shrink-0" />
                      <span className="text-sm text-th font-medium">{sale.user?.name || '—'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Ship className="w-4 h-4 text-th-muted flex-shrink-0" />
                      <span className="text-sm text-th">{sale.boat?.name || '—'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-th">#{sale.shareNumber}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      sale.paymentType === 'AVISTA'
                        ? 'bg-green-500/10 text-green-600'
                        : 'bg-blue-500/10 text-blue-600'
                    }`}>
                      {sale.paymentType === 'AVISTA' ? 'À Vista' : 'Financiado'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-th font-medium">{fmtBRL(sale.totalValue)}</td>
                  <td className="px-4 py-3 text-sm text-th-muted">
                    {sale.paymentType === 'AVISTA' ? '—' : `${sale.installments}x ${fmtBRL(sale.installmentValue)}`}
                  </td>
                  <td className="px-4 py-3 text-sm text-th-muted">Dia {sale.dueDay}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      sale.status === 'ACTIVE' ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-500'
                    }`}>
                      {sale.status === 'ACTIVE' ? 'Ativo' : 'Cancelado'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => openDetail(sale.id)}
                      className="p-1.5 hover:bg-th-bg rounded-lg text-th-muted hover:text-th transition-colors"
                      title="Ver detalhes"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-th-card rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-th">
              <div className="flex items-center gap-3">
                <HandCoins className="w-5 h-5 text-purple-500" />
                <h2 className="text-lg font-bold text-th">Nova Venda de Cota</h2>
              </div>
              <button onClick={() => { setShowCreate(false); setStep('form'); }} className="text-th-muted hover:text-th"><X className="w-5 h-5" /></button>
            </div>

            {step === 'form' ? (
              <div className="p-6 space-y-5">
                {/* Boat selector */}
                <div>
                  <label className="block text-sm font-medium text-th mb-1.5">Embarcação</label>
                  <div className="relative">
                    <div
                      className="flex items-center justify-between px-3 py-2 bg-th-bg border border-th rounded-lg cursor-pointer"
                      onClick={() => { setShowBoatDropdown(!showBoatDropdown); setShowUserDropdown(false); }}
                    >
                      <span className={form.boatId ? 'text-th text-sm' : 'text-th-muted text-sm'}>
                        {form.boatName || 'Selecionar embarcação...'}
                      </span>
                      <ChevronDown className="w-4 h-4 text-th-muted" />
                    </div>
                    {showBoatDropdown && (
                      <div className="absolute z-10 w-full mt-1 bg-th-card border border-th rounded-lg shadow-lg max-h-52 overflow-y-auto">
                        <div className="p-2">
                          <input
                            autoFocus
                            value={boatSearch}
                            onChange={(e) => setBoatSearch(e.target.value)}
                            placeholder="Buscar embarcação..."
                            className="w-full px-3 py-1.5 text-sm bg-th-bg border border-th rounded text-th placeholder:text-th-muted focus:outline-none focus:ring-1 focus:ring-purple-400"
                          />
                        </div>
                        {boats
                          .filter((b) => !boatSearch || b.name.toLowerCase().includes(boatSearch.toLowerCase()))
                          .map((b) => (
                            <button
                              key={b.id}
                              className="w-full text-left px-3 py-2 text-sm text-th hover:bg-th-bg transition-colors"
                              onClick={() => {
                                setForm((f) => ({ ...f, boatId: b.id, boatName: b.name, shareNumber: 1 }));
                                setShowBoatDropdown(false);
                                setBoatSearch('');
                              }}
                            >
                              <span className="font-medium">{b.name}</span>
                              <span className="text-th-muted ml-2 text-xs">{b.model}</span>
                            </button>
                          ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Share number */}
                {selectedBoat && (
                  <div>
                    <label className="block text-sm font-medium text-th mb-1.5">
                      Número da Cota
                      <span className="text-th-muted font-normal ml-2">({availableShares.length} disponíveis de {selectedBoat.totalShares})</span>
                    </label>
                    {availableShares.length === 0 ? (
                      <p className="text-sm text-red-500">Todas as cotas desta embarcação estão ocupadas.</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {Array.from({ length: selectedBoat.totalShares }, (_, i) => i + 1).map((n) => {
                          const available = availableShares.includes(n);
                          return (
                            <button
                              key={n}
                              disabled={!available}
                              onClick={() => setForm((f) => ({ ...f, shareNumber: n }))}
                              className={`w-10 h-10 rounded-lg text-sm font-bold transition-all ${
                                !available
                                  ? 'bg-th-bg text-th-muted cursor-not-allowed opacity-40 line-through'
                                  : form.shareNumber === n
                                    ? 'bg-purple-600 text-white shadow-sm'
                                    : 'bg-th-bg text-th border border-th hover:border-purple-400'
                              }`}
                            >
                              {n}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Client */}
                <div>
                  <label className="block text-sm font-medium text-th mb-1.5">Cliente</label>
                  <div className="relative">
                    <div
                      className="flex items-center justify-between px-3 py-2 bg-th-bg border border-th rounded-lg cursor-pointer"
                      onClick={() => { setShowUserDropdown(!showUserDropdown); setShowBoatDropdown(false); }}
                    >
                      <span className={form.userId ? 'text-th text-sm' : 'text-th-muted text-sm'}>
                        {form.userName || 'Selecionar cliente...'}
                      </span>
                      <ChevronDown className="w-4 h-4 text-th-muted" />
                    </div>
                    {showUserDropdown && (
                      <div className="absolute z-10 w-full mt-1 bg-th-card border border-th rounded-lg shadow-lg max-h-52 overflow-y-auto">
                        <div className="p-2">
                          <input
                            autoFocus
                            value={userSearch}
                            onChange={(e) => setUserSearch(e.target.value)}
                            placeholder="Buscar cliente..."
                            className="w-full px-3 py-1.5 text-sm bg-th-bg border border-th rounded text-th placeholder:text-th-muted focus:outline-none focus:ring-1 focus:ring-purple-400"
                          />
                        </div>
                        {users
                          .filter((u) => !userSearch || u.name.toLowerCase().includes(userSearch.toLowerCase()) || u.email.toLowerCase().includes(userSearch.toLowerCase()))
                          .map((u) => (
                            <button
                              key={u.id}
                              className="w-full text-left px-3 py-2 text-sm text-th hover:bg-th-bg transition-colors"
                              onClick={() => {
                                setForm((f) => ({ ...f, userId: u.id, userName: u.name }));
                                setShowUserDropdown(false);
                                setUserSearch('');
                              }}
                            >
                              <span className="font-medium">{u.name}</span>
                              <span className="text-th-muted ml-2 text-xs">{u.email}</span>
                            </button>
                          ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Payment type */}
                <div>
                  <label className="block text-sm font-medium text-th mb-1.5">Forma de Pagamento</label>
                  <div className="flex gap-2">
                    {(['AVISTA', 'FINANCIADO'] as const).map((t) => (
                      <button
                        key={t}
                        onClick={() => setForm((f) => ({ ...f, paymentType: t }))}
                        className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                          form.paymentType === t
                            ? 'bg-purple-600 text-white'
                            : 'bg-th-bg text-th border border-th hover:border-purple-400'
                        }`}
                      >
                        {t === 'AVISTA' ? 'À Vista' : 'Financiado'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Values */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-th mb-1.5">Valor Total (R$)</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={form.totalValue}
                      onChange={(e) => setForm((f) => ({ ...f, totalValue: e.target.value.replace(/[^0-9.]/g, '') }))}
                      placeholder="0.00"
                      className="w-full px-3 py-2 bg-th-bg border border-th rounded-lg text-sm text-th placeholder:text-th-muted focus:outline-none focus:ring-2 focus:ring-purple-400"
                    />
                  </div>
                  {form.paymentType === 'FINANCIADO' && (
                    <div>
                      <label className="block text-sm font-medium text-th mb-1.5">Entrada (R$)</label>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={form.downPayment}
                        onChange={(e) => setForm((f) => ({ ...f, downPayment: e.target.value.replace(/[^0-9.]/g, '') }))}
                        placeholder="0.00"
                        className="w-full px-3 py-2 bg-th-bg border border-th rounded-lg text-sm text-th placeholder:text-th-muted focus:outline-none focus:ring-2 focus:ring-purple-400"
                      />
                    </div>
                  )}
                </div>

                {/* Installments + Due day */}
                {form.paymentType === 'FINANCIADO' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-th mb-1.5">Parcelas: <span className="text-purple-500 font-bold">{form.installments}x</span></label>
                      <input
                        type="range"
                        min={1}
                        max={15}
                        value={form.installments}
                        onChange={(e) => setForm((f) => ({ ...f, installments: Number(e.target.value) }))}
                        className="w-full accent-purple-600"
                      />
                      <div className="flex justify-between text-xs text-th-muted mt-1">
                        <span>1x</span><span>8x</span><span>15x</span>
                      </div>
                      {installmentValue > 0 && (
                        <p className="text-center text-sm mt-2 font-medium text-purple-500">{fmtBRL(installmentValue)}/mês</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-th mb-1.5">Dia de vencimento</label>
                      <div className="flex flex-wrap gap-2">
                        {[5, 10, 15, 25].map((d) => (
                          <button
                            key={d}
                            onClick={() => setForm((f) => ({ ...f, dueDay: d }))}
                            className={`w-12 h-10 rounded-lg text-sm font-bold transition-all ${
                              form.dueDay === d ? 'bg-purple-600 text-white' : 'bg-th-bg text-th border border-th hover:border-purple-400'
                            }`}
                          >
                            {d}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {form.paymentType === 'AVISTA' && (
                  <div>
                    <label className="block text-sm font-medium text-th mb-1.5">Dia de vencimento (mensalidade)</label>
                    <div className="flex flex-wrap gap-2">
                      {[5, 10, 15, 25].map((d) => (
                        <button
                          key={d}
                          onClick={() => setForm((f) => ({ ...f, dueDay: d }))}
                          className={`w-12 h-10 rounded-lg text-sm font-bold transition-all ${
                            form.dueDay === d ? 'bg-purple-600 text-white' : 'bg-th-bg text-th border border-th hover:border-purple-400'
                          }`}
                        >
                          {d}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Marina fee due day (optional) */}
                <div>
                  <label className="block text-sm font-medium text-th mb-1.5">
                    Dia de vencimento da mensalidade da marina
                    <span className="text-th-muted font-normal ml-1">(opcional, padrão = mesmo da parcela)</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setForm((f) => ({ ...f, monthlyFeeDueDay: 0 }))}
                      className={`px-3 h-10 rounded-lg text-sm font-medium transition-all ${
                        !form.monthlyFeeDueDay ? 'bg-purple-600 text-white' : 'bg-th-bg text-th border border-th hover:border-purple-400'
                      }`}
                    >
                      Mesmo
                    </button>
                    {[5, 10, 15, 25].map((d) => (
                      <button
                        key={d}
                        onClick={() => setForm((f) => ({ ...f, monthlyFeeDueDay: d }))}
                        className={`w-12 h-10 rounded-lg text-sm font-bold transition-all ${
                          form.monthlyFeeDueDay === d ? 'bg-purple-600 text-white' : 'bg-th-bg text-th border border-th hover:border-purple-400'
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Start date + notes */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-th mb-1.5">Data de Início</label>
                    <input
                      type="date"
                      value={form.startDate}
                      onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                      className="w-full px-3 py-2 bg-th-bg border border-th rounded-lg text-sm text-th focus:outline-none focus:ring-2 focus:ring-purple-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-th mb-1.5">Observações</label>
                    <input
                      type="text"
                      value={form.notes}
                      onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                      placeholder="Opcional..."
                      className="w-full px-3 py-2 bg-th-bg border border-th rounded-lg text-sm text-th placeholder:text-th-muted focus:outline-none focus:ring-2 focus:ring-purple-400"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm text-th-muted hover:text-th transition-colors">
                    Cancelar
                  </button>
                  <button
                    disabled={!form.boatId || !form.userId || !totalValue || availableShares.length === 0}
                    onClick={() => setStep('preview')}
                    className="px-5 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    Previsualizar →
                  </button>
                </div>
              </div>
            ) : (
              /* Preview step */
              <div className="p-6 space-y-5">
                <div className="bg-purple-500/5 border border-purple-500/20 rounded-xl p-4 space-y-2">
                  <h3 className="font-semibold text-th text-sm">Resumo da Venda</h3>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
                    <span className="text-th-muted">Embarcação</span><span className="text-th font-medium">{form.boatName}</span>
                    <span className="text-th-muted">Cliente</span><span className="text-th font-medium">{form.userName}</span>
                    <span className="text-th-muted">Cota</span><span className="text-th font-medium">#{form.shareNumber}</span>
                    <span className="text-th-muted">Tipo</span><span className="text-th font-medium">{form.paymentType === 'AVISTA' ? 'À Vista' : 'Financiado'}</span>
                    <span className="text-th-muted">Total</span><span className="text-th font-bold text-purple-500">{fmtBRL(totalValue)}</span>
                    {form.paymentType === 'FINANCIADO' && downPayment > 0 && (
                      <><span className="text-th-muted">Entrada</span><span className="text-th">{fmtBRL(downPayment)}</span></>
                    )}
                    {form.paymentType === 'FINANCIADO' && (
                      <><span className="text-th-muted">Financiado</span><span className="text-th">{form.installments}x {fmtBRL(installmentValue)}</span></>
                    )}
                    <span className="text-th-muted">Vencimento</span><span className="text-th">Todo dia {form.dueDay}</span>
                  </div>
                </div>

                {/* Installment list */}
                <div>
                  <h3 className="font-semibold text-th text-sm mb-2">
                    {form.paymentType === 'AVISTA' ? 'Cobrança à Vista' : `${form.installments} Parcelas geradas`}
                  </h3>
                  <div className="max-h-52 overflow-y-auto space-y-1.5">
                    {previewInstallments.map((inst) => (
                      <div key={inst.num} className="flex items-center justify-between px-3 py-2 bg-th-bg rounded-lg text-sm">
                        <span className="text-th-muted">{inst.label}</span>
                        <div className="flex items-center gap-4">
                          <span className="text-th-muted flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {inst.dueDate.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })}
                          </span>
                          <span className="text-th font-medium w-24 text-right">{fmtBRL(inst.amount)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Monthly fee */}
                {selectedBoat && (
                  <div className="flex items-center justify-between px-3 py-2 bg-green-500/5 border border-green-500/20 rounded-lg text-sm">
                    <span className="text-th flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      1ª Mensalidade (próx. mês, dia {form.monthlyFeeDueDay || form.dueDay})
                    </span>
                    <span className="text-green-600 font-medium">{fmtBRL(Number(selectedBoat.monthlyFee))}</span>
                  </div>
                )}

                <div className="flex justify-between gap-3 pt-2">
                  <button onClick={() => setStep('form')} className="px-4 py-2 text-sm text-th-muted hover:text-th border border-th rounded-lg transition-colors">
                    ← Voltar
                  </button>
                  <button
                    disabled={saving}
                    onClick={handleSubmit}
                    className="flex items-center gap-2 px-5 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    {saving ? 'Criando...' : 'Confirmar Venda'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {(detail || loadingDetail) && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-th-card rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-th">
              <h2 className="text-base font-bold text-th">Detalhes da Venda</h2>
              <button onClick={() => setDetail(null)} className="text-th-muted hover:text-th"><X className="w-5 h-5" /></button>
            </div>
            {loadingDetail ? (
              <div className="p-8 text-center text-th-muted">Carregando...</div>
            ) : detail && (
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                  <span className="text-th-muted">Embarcação</span><span className="text-th font-medium">{detail.boat?.name}</span>
                  <span className="text-th-muted">Cliente</span><span className="text-th font-medium">{detail.user?.name}</span>
                  <span className="text-th-muted">E-mail</span><span className="text-th">{detail.user?.email}</span>
                  <span className="text-th-muted">Cota</span><span className="text-th">#{detail.shareNumber}</span>
                  <span className="text-th-muted">Total</span><span className="text-purple-500 font-bold">{fmtBRL(detail.totalValue)}</span>
                  <span className="text-th-muted">Tipo</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full inline-block font-medium w-fit ${
                    detail.paymentType === 'AVISTA' ? 'bg-green-500/10 text-green-600' : 'bg-blue-500/10 text-blue-600'
                  }`}>{detail.paymentType === 'AVISTA' ? 'À Vista' : 'Financiado'}</span>
                  {detail.paymentType === 'FINANCIADO' && (
                    <><span className="text-th-muted">Parcelas</span><span className="text-th">{detail.installments}x {fmtBRL(detail.installmentValue)}</span></>
                  )}
                  <span className="text-th-muted">Vencimento</span><span className="text-th">Dia {detail.dueDay}</span>
                  <span className="text-th-muted">Início</span><span className="text-th">{fmtDate(detail.startDate)}</span>
                  <span className="text-th-muted">Status</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full inline-block font-medium w-fit ${
                    detail.status === 'ACTIVE' ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-500'
                  }`}>{detail.status === 'ACTIVE' ? 'Ativo' : 'Cancelado'}</span>
                  {detail.notes && (
                    <><span className="text-th-muted">Obs.</span><span className="text-th">{detail.notes}</span></>
                  )}
                </div>

                {detail.charges && detail.charges.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-th mb-2">Parcelas ({detail.charges.length})</h3>
                    <div className="space-y-1.5 max-h-48 overflow-y-auto">
                      {detail.charges.map((c) => (
                        <div key={c.id} className="flex items-center justify-between px-3 py-2 bg-th-bg rounded-lg text-xs">
                          <span className="text-th-muted truncate max-w-[180px]">{c.description}</span>
                          <div className="flex items-center gap-3 ml-2">
                            <span className="text-th-muted">{fmtDate(c.dueDate)}</span>
                            <span className="text-th font-medium">{fmtBRL(c.amount)}</span>
                            <span className={`px-1.5 py-0.5 rounded-full font-medium ${
                              c.status === 'PAID' ? 'bg-green-500/10 text-green-600' :
                              c.status === 'OVERDUE' ? 'bg-red-500/10 text-red-500' :
                              c.status === 'CANCELLED' ? 'bg-gray-500/10 text-gray-500' :
                              'bg-yellow-500/10 text-yellow-600'
                            }`}>{c.status === 'PAID' ? 'Pago' : c.status === 'OVERDUE' ? 'Atrasado' : c.status === 'CANCELLED' ? 'Cancelado' : 'Pendente'}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {detail.status === 'ACTIVE' && (
                  <div className="flex justify-end pt-2">
                    <button
                      onClick={() => handleCancel(detail.id)}
                      className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg text-sm font-medium transition-colors"
                    >
                      <Ban className="w-4 h-4" />
                      Finalizar Venda
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
