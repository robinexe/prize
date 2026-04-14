'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  DollarSign, TrendingUp, TrendingDown, CreditCard,
  FileText, Download, Filter, Eye, X, Trash2, Edit3,
  CheckCircle, Loader2, AlertCircle, Search,
} from 'lucide-react';
import {
  getCharges, getFinanceDashboard, createCharge, updateCharge, deleteCharge,
  registerPayment, getUsers, getBoats,
} from '@/services/api';

const BRT = 'America/Sao_Paulo';
const fmtDate = (s?: string) => s ? new Date(s).toLocaleDateString('pt-BR', { timeZone: BRT }) : '—';
const fmtDateTime = (s?: string) => s ? new Date(s).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit', timeZone: BRT }) : '—';
const fmtCurrency = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

interface Charge {
  id: string;
  userId: string;
  userName?: string;
  user?: { id: string; name: string; email: string };
  description: string;
  amount: number;
  dueDate: string;
  status: string;
  category: string;
  boatId?: string;
  reference?: string;
  paidAt?: string;
  createdAt?: string;
  payments?: { id: string; amount: number; method: string; paidAt: string; transactionId?: string }[];
}

interface UserItem { id: string; name: string; email: string }
interface BoatItem { id: string; name: string; model?: string }

const statusConfig: Record<string, { label: string; color: string }> = {
  PAID:      { label: 'Pago',      color: 'bg-green-500/15 text-green-600 dark:text-green-400' },
  PENDING:   { label: 'Pendente',  color: 'bg-yellow-500/15 text-yellow-600 dark:text-yellow-400' },
  OVERDUE:   { label: 'Vencido',   color: 'bg-red-500/15 text-red-600 dark:text-red-400' },
  CANCELLED: { label: 'Cancelado', color: 'bg-gray-500/15 text-gray-500' },
};

const categoryLabels: Record<string, string> = {
  MONTHLY_FEE: 'Mensalidade',
  FUEL: 'Combustível',
  MAINTENANCE: 'Manutenção',
  EXTRA: 'Extra',
  SHARE_INSTALLMENT: 'Parcela Cota',
};

const paymentMethods: Record<string, string> = {
  PIX: 'PIX',
  CREDIT_CARD: 'Cartão de Crédito',
  BANK_TRANSFER: 'Transferência',
  CASH: 'Dinheiro',
};

export default function FinancePage() {
  const [charges, setCharges] = useState<Charge[]>([]);
  const [dashboard, setDashboard] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [showCreate, setShowCreate] = useState(false);
  const [editingCharge, setEditingCharge] = useState<Charge | null>(null);
  const [viewingCharge, setViewingCharge] = useState<Charge | null>(null);
  const [payingCharge, setPayingCharge] = useState<Charge | null>(null);
  const [deletingCharge, setDeletingCharge] = useState<Charge | null>(null);

  // Users & boats for forms
  const [users, setUsers] = useState<UserItem[]>([]);
  const [boats, setBoats] = useState<BoatItem[]>([]);

  const load = useCallback(async () => {
    try {
      const params: Record<string, string> = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      const [chargesRes, dashRes] = await Promise.all([
        getCharges(params),
        getFinanceDashboard().catch(() => ({ data: {} })),
      ]);
      const d = chargesRes.data;
      setCharges(Array.isArray(d) ? d : d?.data || []);
      setDashboard(dashRes.data || {});
    } catch {
      setCharges([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    Promise.all([
      getUsers({ limit: 500 }).catch(() => ({ data: [] })),
      getBoats({ limit: 100 }).catch(() => ({ data: [] })),
    ]).then(([uRes, bRes]) => {
      const u = uRes.data; setUsers(Array.isArray(u) ? u : u?.data || []);
      const b = bRes.data; setBoats(Array.isArray(b) ? b : b?.data || []);
    });
  }, []);

  const totalRevenue = dashboard.totalRevenue || dashboard.totalPaid || 0;
  const totalPending = dashboard.totalPending || charges.filter(c => c.status === 'PENDING').reduce((s, c) => s + c.amount, 0);
  const totalOverdue = dashboard.totalOverdue || charges.filter(c => c.status === 'OVERDUE').reduce((s, c) => s + c.amount, 0);
  const pendingCount = dashboard.pendingCharges || charges.filter(c => c.status === 'PENDING').length;
  const overdueCount = dashboard.overdueCharges || charges.filter(c => c.status === 'OVERDUE').length;

  const filtered = charges.filter(c => {
    if (typeFilter !== 'all' && c.category !== typeFilter) return false;
    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      const name = (c.userName || c.user?.name || '').toLowerCase();
      const desc = c.description.toLowerCase();
      if (!name.includes(s) && !desc.includes(s)) return false;
    }
    return true;
  });

  async function handleDelete() {
    if (!deletingCharge) return;
    try {
      await deleteCharge(deletingCharge.id);
      setDeletingCharge(null);
      load();
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Erro ao remover');
    }
  }

  function exportCSV() {
    const rows = [['Cliente', 'Descrição', 'Tipo', 'Valor', 'Vencimento', 'Status'].join(';')];
    filtered.forEach(c => {
      rows.push([
        c.userName || c.user?.name || '-',
        c.description,
        categoryLabels[c.category] || c.category,
        c.amount.toFixed(2).replace('.', ','),
        fmtDate(c.dueDate),
        statusConfig[c.status]?.label || c.status,
      ].join(';'));
    });
    const blob = new Blob(['\uFEFF' + rows.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `financeiro_${new Date().toLocaleDateString('en-CA', { timeZone: BRT })}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-th flex items-center gap-2">
            <DollarSign className="text-primary-500" /> Financeiro
          </h1>
          <p className="text-th-muted text-sm mt-1">Gestão de cobranças e pagamentos</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={exportCSV} className="flex items-center gap-2 bg-th-surface text-th-secondary px-4 py-2.5 rounded-lg font-medium hover:bg-primary-500/10 transition text-sm">
            <Download size={16} /> Exportar
          </button>
          <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 bg-primary-500 text-white px-4 py-2.5 rounded-lg font-medium hover:bg-primary-600 transition text-sm">
            <CreditCard size={16} /> Nova Cobrança
          </button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-th-card rounded-2xl p-5 border border-th shadow-black/10">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-th-muted">Receita Recebida</span>
            <TrendingUp size={18} className="text-green-500" />
          </div>
          <p className="text-2xl font-bold text-th">{fmtCurrency(totalRevenue)}</p>
          <p className="text-xs text-green-500 mt-1">Receita mensal: {fmtCurrency(dashboard.monthlyRevenue || 0)}</p>
        </div>
        <div className="bg-th-card rounded-2xl p-5 border border-th shadow-black/10">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-th-muted">A Receber</span>
            <FileText size={18} className="text-yellow-500" />
          </div>
          <p className="text-2xl font-bold text-th">{fmtCurrency(totalPending)}</p>
          <p className="text-xs text-th-muted mt-1">{pendingCount} cobranças pendentes</p>
        </div>
        <div className="bg-th-card rounded-2xl p-5 border border-th shadow-black/10">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-th-muted">Inadimplente</span>
            <TrendingDown size={18} className="text-red-500" />
          </div>
          <p className="text-2xl font-bold text-red-600">{fmtCurrency(totalOverdue)}</p>
          <p className="text-xs text-red-400 mt-1">{overdueCount} cobranças vencidas</p>
        </div>
      </div>

      {/* Filters + Table */}
      <div className="bg-th-card rounded-2xl shadow-black/10 border border-th p-6">
        <div className="flex items-center gap-4 mb-6 flex-wrap">
          <Filter size={18} className="text-th-muted" />
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-th text-sm bg-th-card text-th">
            <option value="all">Todos Status</option>
            <option value="PAID">Pago</option>
            <option value="PENDING">Pendente</option>
            <option value="OVERDUE">Vencido</option>
            <option value="CANCELLED">Cancelado</option>
          </select>
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-th text-sm bg-th-card text-th">
            <option value="all">Todos Tipos</option>
            <option value="MONTHLY_FEE">Mensalidade</option>
            <option value="FUEL">Combustível</option>
            <option value="MAINTENANCE">Manutenção</option>
            <option value="SHARE_INSTALLMENT">Parcela Cota</option>
            <option value="EXTRA">Extra</option>
          </select>
          <div className="relative flex-1 min-w-[200px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-th-muted" />
            <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              placeholder="Buscar cliente ou descrição..."
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-th text-sm bg-th-card text-th focus:outline-none focus:border-primary-400" />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary-500" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-th-muted text-sm">Nenhuma cobrança encontrada</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-th">
                  <th className="text-left py-3 text-xs font-semibold text-th-muted uppercase">Cliente</th>
                  <th className="text-left py-3 text-xs font-semibold text-th-muted uppercase">Descrição</th>
                  <th className="text-left py-3 text-xs font-semibold text-th-muted uppercase">Tipo</th>
                  <th className="text-right py-3 text-xs font-semibold text-th-muted uppercase">Valor</th>
                  <th className="text-center py-3 text-xs font-semibold text-th-muted uppercase">Vencimento</th>
                  <th className="text-center py-3 text-xs font-semibold text-th-muted uppercase">Status</th>
                  <th className="text-center py-3 text-xs font-semibold text-th-muted uppercase">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(charge => {
                  const sc = statusConfig[charge.status] || { label: charge.status, color: 'bg-th-surface text-th-secondary' };
                  return (
                    <tr key={charge.id} className="border-b border-th hover:bg-th-hover transition group">
                      <td className="py-3 text-sm font-medium text-th">{charge.userName || charge.user?.name || '—'}</td>
                      <td className="py-3 text-sm text-th-secondary max-w-[250px] truncate">{charge.description}</td>
                      <td className="py-3">
                        <span className="text-xs font-medium text-th-muted bg-th-surface px-2 py-1 rounded">
                          {categoryLabels[charge.category] || charge.category || '—'}
                        </span>
                      </td>
                      <td className="py-3 text-sm font-semibold text-th text-right">{fmtCurrency(charge.amount)}</td>
                      <td className="py-3 text-sm text-th-muted text-center">{fmtDate(charge.dueDate)}</td>
                      <td className="py-3 text-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${sc.color}`}>{sc.label}</span>
                      </td>
                      <td className="py-3">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => setViewingCharge(charge)} className="p-1.5 hover:bg-primary-500/10 rounded-lg transition" title="Detalhes">
                            <Eye size={15} className="text-th-muted" />
                          </button>
                          {charge.status !== 'PAID' && charge.status !== 'CANCELLED' && (
                            <>
                              <button onClick={() => setPayingCharge(charge)} className="p-1.5 hover:bg-green-500/10 rounded-lg transition" title="Liquidar">
                                <CheckCircle size={15} className="text-green-500" />
                              </button>
                              <button onClick={() => setEditingCharge(charge)} className="p-1.5 hover:bg-blue-500/10 rounded-lg transition" title="Editar">
                                <Edit3 size={15} className="text-blue-500" />
                              </button>
                              <button onClick={() => setDeletingCharge(charge)} className="p-1.5 hover:bg-red-500/10 rounded-lg transition" title="Remover">
                                <Trash2 size={15} className="text-red-400" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ═══ Create / Edit Modal ═══ */}
      {(showCreate || editingCharge) && (
        <ChargeFormModal
          charge={editingCharge}
          users={users}
          boats={boats}
          onClose={() => { setShowCreate(false); setEditingCharge(null); }}
          onSuccess={() => { setShowCreate(false); setEditingCharge(null); load(); }}
        />
      )}

      {/* ═══ Detail Modal ═══ */}
      {viewingCharge && (
        <ChargeDetailModal
          charge={viewingCharge}
          onClose={() => setViewingCharge(null)}
          onPay={() => { setViewingCharge(null); setPayingCharge(viewingCharge); }}
        />
      )}

      {/* ═══ Payment Modal ═══ */}
      {payingCharge && (
        <PaymentModal
          charge={payingCharge}
          onClose={() => setPayingCharge(null)}
          onSuccess={() => { setPayingCharge(null); load(); }}
        />
      )}

      {/* ═══ Delete Confirm ═══ */}
      {deletingCharge && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-th-card rounded-2xl w-full max-w-sm p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h3 className="font-bold text-th">Remover Cobrança</h3>
                <p className="text-xs text-th-muted">Esta ação não pode ser desfeita</p>
              </div>
            </div>
            <p className="text-sm text-th-secondary mb-1"><strong>{deletingCharge.description}</strong></p>
            <p className="text-sm text-th-muted mb-6">
              {fmtCurrency(deletingCharge.amount)} — {deletingCharge.userName || deletingCharge.user?.name}
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeletingCharge(null)} className="flex-1 py-2.5 border border-th rounded-xl text-sm font-medium text-th-secondary hover:bg-th-hover">Cancelar</button>
              <button onClick={handleDelete} className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-sm font-bold hover:bg-red-600">Remover</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Create / Edit Charge Modal
   ═══════════════════════════════════════════════════════════════════════════ */
function ChargeFormModal({ charge, users, boats, onClose, onSuccess }: {
  charge: Charge | null; users: UserItem[]; boats: BoatItem[];
  onClose: () => void; onSuccess: () => void;
}) {
  const isEdit = !!charge;
  const [form, setForm] = useState({
    userId: charge?.userId || charge?.user?.id || '',
    description: charge?.description || '',
    amount: charge?.amount?.toString() || '',
    dueDate: charge?.dueDate ? new Date(charge.dueDate).toLocaleDateString('en-CA', { timeZone: BRT }) : new Date().toLocaleDateString('en-CA', { timeZone: BRT }),
    category: charge?.category || 'EXTRA',
    boatId: charge?.boatId || '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [userSearch, setUserSearch] = useState('');

  const filteredUsers = userSearch
    ? users.filter(u => u.name.toLowerCase().includes(userSearch.toLowerCase()) || u.email.toLowerCase().includes(userSearch.toLowerCase()))
    : users;
  const selectedUser = users.find(u => u.id === form.userId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.userId && !isEdit) return setError('Selecione um cliente');
    if (!form.description) return setError('Descrição é obrigatória');
    if (!form.amount || parseFloat(form.amount) <= 0) return setError('Valor inválido');
    if (!form.dueDate) return setError('Data de vencimento obrigatória');

    setSaving(true); setError('');
    try {
      const data: Record<string, unknown> = {
        description: form.description,
        amount: parseFloat(form.amount),
        dueDate: form.dueDate,
        category: form.category,
        boatId: form.boatId || undefined,
      };
      if (!isEdit) data.userId = form.userId;
      if (isEdit && charge) {
        await updateCharge(charge.id, data);
      } else {
        await createCharge(data);
      }
      onSuccess();
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Erro ao salvar');
    } finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-th-card rounded-2xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-th">
          <h2 className="text-lg font-bold text-th">{isEdit ? 'Editar Cobrança' : 'Nova Cobrança'}</h2>
          <button onClick={onClose} className="text-th-muted hover:text-th p-1"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-500">
              <AlertCircle size={16} />{error}
            </div>
          )}

          {/* Client */}
          {!isEdit && (
            <div>
              <label className="text-xs font-semibold text-th-muted uppercase mb-1.5 block">Cliente *</label>
              {selectedUser ? (
                <div className="flex items-center justify-between bg-th-surface border border-th rounded-xl px-3 py-2.5">
                  <div>
                    <p className="text-sm font-medium text-th">{selectedUser.name}</p>
                    <p className="text-xs text-th-muted">{selectedUser.email}</p>
                  </div>
                  <button type="button" onClick={() => setForm(f => ({ ...f, userId: '' }))} className="text-th-muted hover:text-red-400 p-1"><X size={16} /></button>
                </div>
              ) : (
                <div className="space-y-2">
                  <input value={userSearch} onChange={e => setUserSearch(e.target.value)}
                    placeholder="Buscar cliente..."
                    className="w-full px-3 py-2.5 bg-th-surface border border-th rounded-xl text-sm text-th focus:outline-none focus:border-primary-400" />
                  {userSearch && (
                    <div className="max-h-40 overflow-y-auto bg-th-surface border border-th rounded-xl divide-y divide-th">
                      {filteredUsers.slice(0, 10).map(u => (
                        <button key={u.id} type="button"
                          onClick={() => { setForm(f => ({ ...f, userId: u.id })); setUserSearch(''); }}
                          className="w-full text-left px-3 py-2 hover:bg-primary-500/5 text-sm">
                          <span className="font-medium text-th">{u.name}</span>
                          <span className="text-th-muted ml-2 text-xs">{u.email}</span>
                        </button>
                      ))}
                      {filteredUsers.length === 0 && <p className="px-3 py-2 text-xs text-th-muted">Nenhum usuário</p>}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Description */}
          <div>
            <label className="text-xs font-semibold text-th-muted uppercase mb-1.5 block">Descrição *</label>
            <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Ex: Mensalidade maio — Thunder Jet"
              className="w-full px-3 py-2.5 bg-th-surface border border-th rounded-xl text-sm text-th focus:outline-none focus:border-primary-400" />
          </div>

          {/* Amount + Due Date */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-th-muted uppercase mb-1.5 block">Valor (R$) *</label>
              <input type="number" step="0.01" min="0.01" value={form.amount}
                onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                placeholder="0,00"
                className="w-full px-3 py-2.5 bg-th-surface border border-th rounded-xl text-sm text-th focus:outline-none focus:border-primary-400" />
            </div>
            <div>
              <label className="text-xs font-semibold text-th-muted uppercase mb-1.5 block">Vencimento *</label>
              <input type="date" value={form.dueDate}
                onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
                className="w-full px-3 py-2.5 bg-th-surface border border-th rounded-xl text-sm text-th focus:outline-none focus:border-primary-400" />
            </div>
          </div>

          {/* Category + Boat */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-th-muted uppercase mb-1.5 block">Tipo</label>
              <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                className="w-full px-3 py-2.5 bg-th-surface border border-th rounded-xl text-sm text-th focus:outline-none focus:border-primary-400">
                <option value="EXTRA">Extra</option>
                <option value="MONTHLY_FEE">Mensalidade</option>
                <option value="FUEL">Combustível</option>
                <option value="MAINTENANCE">Manutenção</option>
                <option value="SHARE_INSTALLMENT">Parcela Cota</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-th-muted uppercase mb-1.5 block">Embarcação</label>
              <select value={form.boatId} onChange={e => setForm(f => ({ ...f, boatId: e.target.value }))}
                className="w-full px-3 py-2.5 bg-th-surface border border-th rounded-xl text-sm text-th focus:outline-none focus:border-primary-400">
                <option value="">— Nenhuma —</option>
                {boats.map(b => <option key={b.id} value={b.id}>{b.name}{b.model ? ` (${b.model})` : ''}</option>)}
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-th rounded-xl text-sm font-medium text-th-secondary hover:bg-th-hover">Cancelar</button>
            <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-primary-500 text-white rounded-xl text-sm font-bold hover:bg-primary-600 disabled:opacity-60 flex items-center justify-center gap-2">
              {saving ? <><Loader2 size={16} className="animate-spin" />Salvando...</> : isEdit ? 'Salvar Alterações' : 'Criar Cobrança'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Charge Detail Modal
   ═══════════════════════════════════════════════════════════════════════════ */
function ChargeDetailModal({ charge, onClose, onPay }: { charge: Charge; onClose: () => void; onPay: () => void }) {
  const sc = statusConfig[charge.status] || { label: charge.status, color: 'bg-th-surface text-th-secondary' };
  const totalPaid = (charge.payments || []).reduce((s, p) => s + p.amount, 0);
  const remaining = charge.amount - totalPaid;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-th-card rounded-2xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-th">
          <h2 className="text-lg font-bold text-th">Detalhes da Cobrança</h2>
          <button onClick={onClose} className="text-th-muted hover:text-th p-1"><X size={20} /></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-th">{charge.description}</p>
              <p className="text-xs text-th-muted mt-0.5">{charge.userName || charge.user?.name || '—'} · {charge.user?.email || ''}</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${sc.color}`}>{sc.label}</span>
          </div>

          <div className="bg-th-surface border border-th rounded-xl divide-y divide-th">
            {[
              ['Valor', fmtCurrency(charge.amount)],
              ['Tipo', categoryLabels[charge.category] || charge.category],
              ['Vencimento', fmtDate(charge.dueDate)],
              ['Criado em', fmtDateTime(charge.createdAt)],
              ...(charge.paidAt ? [['Pago em', fmtDateTime(charge.paidAt)]] : []),
              ...(charge.reference ? [['Referência', charge.reference]] : []),
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between px-4 py-2.5">
                <span className="text-sm text-th-muted">{k}</span>
                <span className="text-sm font-medium text-th">{v}</span>
              </div>
            ))}
          </div>

          {/* Payments */}
          {charge.payments && charge.payments.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-th-muted uppercase mb-2">Pagamentos Registrados</h3>
              <div className="space-y-2">
                {charge.payments.map(p => (
                  <div key={p.id} className="flex items-center justify-between bg-green-500/5 border border-green-500/20 rounded-xl px-4 py-2.5">
                    <div>
                      <p className="text-sm font-medium text-green-600 dark:text-green-400">{fmtCurrency(p.amount)}</p>
                      <p className="text-xs text-th-muted">{paymentMethods[p.method] || p.method} · {fmtDateTime(p.paidAt)}</p>
                    </div>
                    {p.transactionId && <span className="text-xs text-th-muted font-mono">{p.transactionId}</span>}
                  </div>
                ))}
              </div>
              {remaining > 0 && (
                <p className="text-xs text-th-muted mt-2">Restante: <strong className="text-yellow-500">{fmtCurrency(remaining)}</strong></p>
              )}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="flex-1 py-2.5 border border-th rounded-xl text-sm font-medium text-th-secondary hover:bg-th-hover">Fechar</button>
            {charge.status !== 'PAID' && charge.status !== 'CANCELLED' && (
              <button onClick={onPay} className="flex-1 py-2.5 bg-green-500 text-white rounded-xl text-sm font-bold hover:bg-green-600 flex items-center justify-center gap-2">
                <CheckCircle size={16} /> Liquidar
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Payment (Liquidar) Modal
   ═══════════════════════════════════════════════════════════════════════════ */
function PaymentModal({ charge, onClose, onSuccess }: { charge: Charge; onClose: () => void; onSuccess: () => void }) {
  const totalPaid = (charge.payments || []).reduce((s, p) => s + p.amount, 0);
  const remaining = charge.amount - totalPaid;

  const [amount, setAmount] = useState(remaining > 0 ? remaining.toFixed(2) : charge.amount.toFixed(2));
  const [method, setMethod] = useState('PIX');
  const [transactionId, setTransactionId] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handlePay(e: React.FormEvent) {
    e.preventDefault();
    const val = parseFloat(amount);
    if (!val || val <= 0) return setError('Valor inválido');

    setSaving(true); setError('');
    try {
      await registerPayment({ chargeId: charge.id, amount: val, method, transactionId: transactionId || undefined });
      onSuccess();
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Erro ao registrar pagamento');
    } finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-th-card rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-th">
          <div>
            <h2 className="text-lg font-bold text-th">Liquidar Cobrança</h2>
            <p className="text-xs text-th-muted mt-0.5">{charge.description}</p>
          </div>
          <button onClick={onClose} className="text-th-muted hover:text-th p-1"><X size={20} /></button>
        </div>
        <form onSubmit={handlePay} className="p-5 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-500">
              <AlertCircle size={16} />{error}
            </div>
          )}

          <div className="bg-th-surface border border-th rounded-xl p-4">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-th-muted">Valor total</span>
              <span className="font-bold text-th">{fmtCurrency(charge.amount)}</span>
            </div>
            {totalPaid > 0 && (
              <div className="flex justify-between text-sm mb-1">
                <span className="text-th-muted">Já pago</span>
                <span className="font-medium text-green-500">{fmtCurrency(totalPaid)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm border-t border-th pt-1 mt-1">
              <span className="text-th-muted font-medium">Restante</span>
              <span className="font-bold text-primary-500">{fmtCurrency(remaining > 0 ? remaining : charge.amount)}</span>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-th-muted uppercase mb-1.5 block">Valor do Pagamento (R$)</label>
            <input type="number" step="0.01" min="0.01" value={amount}
              onChange={e => setAmount(e.target.value)}
              className="w-full px-3 py-2.5 bg-th-surface border border-th rounded-xl text-sm text-th focus:outline-none focus:border-primary-400" />
          </div>

          <div>
            <label className="text-xs font-semibold text-th-muted uppercase mb-1.5 block">Método de Pagamento</label>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(paymentMethods).map(([key, label]) => (
                <button key={key} type="button" onClick={() => setMethod(key)}
                  className={`px-3 py-2.5 rounded-xl text-sm font-medium border-2 transition ${method === key
                    ? 'border-primary-400 bg-primary-500/10 text-primary-500'
                    : 'border-th text-th-secondary hover:border-th-muted'}`}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-th-muted uppercase mb-1.5 block">ID da Transação (opcional)</label>
            <input value={transactionId} onChange={e => setTransactionId(e.target.value)}
              placeholder="Chave PIX, nº cartão, etc."
              className="w-full px-3 py-2.5 bg-th-surface border border-th rounded-xl text-sm text-th focus:outline-none focus:border-primary-400" />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-th rounded-xl text-sm font-medium text-th-secondary hover:bg-th-hover">Cancelar</button>
            <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-green-500 text-white rounded-xl text-sm font-bold hover:bg-green-600 disabled:opacity-60 flex items-center justify-center gap-2">
              {saving ? <><Loader2 size={16} className="animate-spin" />Processando...</> : <><CheckCircle size={16} />Confirmar Pagamento</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
