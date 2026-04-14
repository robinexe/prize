'use client';

import { BarChart3, Download, TrendingUp, Users, Ship, DollarSign, Wrench, Fuel, Calendar, Tag } from 'lucide-react';
import { useState, useEffect } from 'react';
import { getFinanceDashboard, getBoats, getUsers, getCharges, getReservations, getMaintenances } from '@/services/api';

const CATEGORIES_KEY = 'prizeclube_maintenance_categories';

interface Charge { id: string; amount: number; status: string; category: string; description: string; dueDate: string; user?: { name: string }; }
interface MaintenanceItem { id: string; title?: string; description: string; estimatedCost?: number; actualCost?: number; status: string; boat?: { name: string }; createdAt?: string; }

export default function ReportsPage() {
  const [period, setPeriod] = useState('6m');
  const [dashboard, setDashboard] = useState<Record<string, unknown>>({});
  const [boats, setBoats] = useState<Array<Record<string, unknown>>>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalReservations, setTotalReservations] = useState(0);
  const [charges, setCharges] = useState<Charge[]>([]);
  const [maintenances, setMaintenances] = useState<MaintenanceItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [finRes, boatsRes, usersRes, chargesRes, reservRes, maintRes] = await Promise.all([
          getFinanceDashboard().catch(() => ({ data: {} })),
          getBoats().catch(() => ({ data: [] })),
          getUsers({ limit: 100 }).catch(() => ({ data: { total: 0 } })),
          getCharges().catch(() => ({ data: [] })),
          getReservations().catch(() => ({ data: [] })),
          getMaintenances().catch(() => ({ data: [] })),
        ]);
        setDashboard(finRes.data || {});
        const b = Array.isArray(boatsRes.data) ? boatsRes.data : boatsRes.data?.data || [];
        setBoats(b);
        const uData = usersRes.data;
        setTotalUsers(uData?.total ?? (Array.isArray(uData) ? uData.length : uData?.data?.length || 0));
        const cData = chargesRes.data;
        setCharges(Array.isArray(cData) ? cData : cData?.data || []);
        const rData = reservRes.data;
        const rList = Array.isArray(rData) ? rData : rData?.data || [];
        setTotalReservations(rList.length);
        const mData = maintRes.data;
        setMaintenances(Array.isArray(mData) ? mData : mData?.data || []);
      } catch {
        // keep defaults
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const formatCurrency = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  // Compute revenue from charges
  const paidCharges = charges.filter((c) => c.status === 'PAID');
  const totalRevenue = paidCharges.reduce((sum, c) => sum + (c.amount || 0), 0);
  const pendingTotal = charges.filter((c) => c.status === 'PENDING').reduce((sum, c) => sum + (c.amount || 0), 0);
  const overdueTotal = charges.filter((c) => c.status === 'OVERDUE').reduce((sum, c) => sum + (c.amount || 0), 0);

  // Revenue by category
  const catTotals: Record<string, number> = {};
  charges.forEach((c) => {
    const cat = c.category || 'OUTROS';
    catTotals[cat] = (catTotals[cat] || 0) + (c.amount || 0);
  });
  const totalChargesAmount = charges.reduce((s, c) => s + (c.amount || 0), 0);
  const catLabels: Record<string, string> = { MONTHLY_FEE: 'Mensalidades', FUEL: 'Combustível', MAINTENANCE: 'Manutenção', EXTRA: 'Extras', OUTROS: 'Outros' };
  const catColors: Record<string, string> = { MONTHLY_FEE: 'bg-primary-500', FUEL: 'bg-blue-500', MAINTENANCE: 'bg-yellow-500', EXTRA: 'bg-purple-500/100', OUTROS: 'bg-gray-400' };
  const revenueByCat = Object.entries(catTotals)
    .sort((a, b) => b[1] - a[1])
    .map(([cat, val]) => ({
      label: catLabels[cat] || cat,
      pct: totalChargesAmount > 0 ? Math.round((val / totalChargesAmount) * 100) : 0,
      value: val,
      color: catColors[cat] || 'bg-gray-400',
    }));

  // Maintenance by category
  const maintByCat: Record<string, { count: number; cost: number }> = {};
  maintenances.forEach((m) => {
    const title = m.title || m.description || '';
    const catMatch = title.match(/^\[([^\]]+)\]/);
    const cat = catMatch ? catMatch[1] : 'Sem categoria';
    if (!maintByCat[cat]) maintByCat[cat] = { count: 0, cost: 0 };
    maintByCat[cat].count++;
    maintByCat[cat].cost += m.actualCost ?? m.estimatedCost ?? 0;
  });
  const maintCatList = Object.entries(maintByCat).sort((a, b) => b[1].cost - a[1].cost);
  const totalMaintCost = maintenances.reduce((s, m) => s + (m.actualCost ?? m.estimatedCost ?? 0), 0);

  // Boat ranking
  const boatCharges: Record<string, number> = {};
  charges.forEach((c: any) => {
    const bName = c.boat?.name || c.boatName || 'Sem embarcação';
    boatCharges[bName] = (boatCharges[bName] || 0) + (c.amount || 0);
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-th flex items-center gap-2">
            <BarChart3 className="text-primary-500" />
            Relatórios
          </h1>
          <p className="text-th-muted text-sm mt-1">Análise detalhada da operação</p>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Receita (Pago)', value: formatCurrency(totalRevenue), sub: `Pendente: ${formatCurrency(pendingTotal)}`, icon: DollarSign, color: 'text-green-500', bg: 'bg-green-500/10' },
          { label: 'Reservas', value: totalReservations.toString(), sub: 'total no sistema', icon: Calendar, color: 'text-blue-500', bg: 'bg-blue-500/10' },
          { label: 'Clientes Ativos', value: totalUsers.toString(), sub: 'usuários cadastrados', icon: Users, color: 'text-purple-500', bg: 'bg-purple-500/10' },
          { label: 'Embarcações', value: boats.length.toString(), sub: `${maintenances.length} manutenções`, icon: Ship, color: 'text-th-secondary', bg: 'bg-th-surface' },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-th-card rounded-2xl p-5 border border-th shadow-black/10">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${kpi.bg}`}>
                <kpi.icon size={20} className={kpi.color} />
              </div>
            </div>
            <p className="text-2xl font-bold text-th">{kpi.value}</p>
            <p className="text-xs text-th-muted mt-1">{kpi.label}</p>
            <p className="text-xs text-th-muted mt-0.5">{kpi.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6 mb-8">
        {/* Revenue Composition */}
        <div className="bg-th-card rounded-2xl shadow-black/10 border border-th p-6">
          <h3 className="font-semibold text-th mb-2">Composição Financeira</h3>
          <p className="text-xs text-th-muted mb-4">{charges.length} cobranças no total — {formatCurrency(totalChargesAmount)}</p>
          {revenueByCat.length > 0 ? (
            <div className="space-y-4">
              {revenueByCat.map((item) => (
                <div key={item.label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-th-secondary">{item.label}</span>
                    <span className="font-medium text-th">{formatCurrency(item.value)} ({item.pct}%)</span>
                  </div>
                  <div className="w-full bg-th-surface rounded-full h-2.5">
                    <div className={`${item.color} h-2.5 rounded-full`} style={{ width: `${item.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-th-muted text-center py-4">Nenhuma cobrança registrada</p>
          )}
        </div>

        {/* Maintenance by category */}
        <div className="bg-th-card rounded-2xl shadow-black/10 border border-th p-6">
          <h3 className="font-semibold text-th mb-2 flex items-center gap-2">
            <Wrench size={16} className="text-primary-500" />
            Manutenções por Categoria
          </h3>
          <p className="text-xs text-th-muted mb-4">{maintenances.length} manutenções — custo total: {formatCurrency(totalMaintCost)}</p>
          {maintCatList.length > 0 ? (
            <div className="space-y-3">
              {maintCatList.map(([cat, data]) => (
                <div key={cat} className="flex items-center justify-between p-3 bg-th-surface rounded-lg">
                  <div className="flex items-center gap-2">
                    <Tag size={14} className="text-purple-500" />
                    <span className="text-sm font-medium text-th-secondary">{cat}</span>
                    <span className="text-xs bg-th-surface text-th-secondary px-1.5 py-0.5 rounded">{data.count}x</span>
                  </div>
                  <span className="text-sm font-bold text-th">{formatCurrency(data.cost)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-th-muted text-center py-4">Nenhuma manutenção registrada</p>
          )}
        </div>
      </div>

      {/* Charges Table */}
      <div className="bg-th-card rounded-2xl shadow-black/10 border border-th p-6 mb-8">
        <h3 className="font-semibold text-th mb-4">Últimas Cobranças</h3>
        <table className="w-full">
          <thead>
            <tr className="border-b border-th">
              <th className="text-left py-3 text-xs font-semibold text-th-muted uppercase">Descrição</th>
              <th className="text-left py-3 text-xs font-semibold text-th-muted uppercase">Categoria</th>
              <th className="text-right py-3 text-xs font-semibold text-th-muted uppercase">Valor</th>
              <th className="text-center py-3 text-xs font-semibold text-th-muted uppercase">Status</th>
              <th className="text-center py-3 text-xs font-semibold text-th-muted uppercase">Vencimento</th>
            </tr>
          </thead>
          <tbody>
            {charges.slice(0, 10).map((c) => (
              <tr key={c.id} className="border-b border-th">
                <td className="py-3 text-sm text-th">{c.description}</td>
                <td className="py-3">
                  <span className="text-xs font-medium bg-th-surface text-th-secondary px-2 py-1 rounded">{catLabels[c.category] || c.category}</span>
                </td>
                <td className="py-3 text-sm font-medium text-th text-right">{formatCurrency(c.amount)}</td>
                <td className="py-3 text-center">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    c.status === 'PAID' ? 'bg-green-500/15 text-green-600 dark:text-green-400' :
                    c.status === 'OVERDUE' ? 'bg-red-500/15 text-red-600 dark:text-red-400' :
                    'bg-yellow-500/15 text-yellow-600 dark:text-yellow-400'
                  }`}>
                    {c.status === 'PAID' ? 'Pago' : c.status === 'OVERDUE' ? 'Vencido' : 'Pendente'}
                  </span>
                </td>
                <td className="py-3 text-sm text-th-muted text-center">{c.dueDate ? new Date(c.dueDate).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' }) : '-'}</td>
              </tr>
            ))}
            {charges.length === 0 && (
              <tr><td colSpan={5} className="py-6 text-center text-th-muted">Nenhuma cobrança encontrada</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Boat Ranking */}
      <div className="bg-th-card rounded-2xl shadow-black/10 border border-th p-6">
        <h3 className="font-semibold text-th mb-4">Ranking de Embarcações</h3>
        <table className="w-full">
          <thead>
            <tr className="border-b border-th">
              <th className="text-left py-3 text-xs font-semibold text-th-muted uppercase">#</th>
              <th className="text-left py-3 text-xs font-semibold text-th-muted uppercase">Embarcação</th>
              <th className="text-left py-3 text-xs font-semibold text-th-muted uppercase">Modelo</th>
              <th className="text-right py-3 text-xs font-semibold text-th-muted uppercase">Mensal/Cotista</th>
              <th className="text-center py-3 text-xs font-semibold text-th-muted uppercase">Cotas</th>
              <th className="text-center py-3 text-xs font-semibold text-th-muted uppercase">Status</th>
            </tr>
          </thead>
          <tbody>
            {boats.map((boat, i) => (
              <tr key={boat.id as string} className="border-b border-th">
                <td className="py-3 text-sm font-bold text-th-muted">{i + 1}</td>
                <td className="py-3 text-sm font-medium text-th">{boat.name as string}</td>
                <td className="py-3 text-sm text-th-secondary">{boat.model as string}</td>
                <td className="py-3 text-sm font-medium text-green-600 dark:text-green-400 text-right">{formatCurrency((boat.monthlyFee as number) || 0)}</td>
                <td className="py-3 text-sm text-th-secondary text-center">{(boat._count as any)?.shares || 0}/{boat.totalShares as number}</td>
                <td className="py-3 text-sm text-center">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    boat.status === 'AVAILABLE' ? 'bg-green-500/15 text-green-600 dark:text-green-400' :
                    boat.status === 'MAINTENANCE' ? 'bg-yellow-500/15 text-yellow-600 dark:text-yellow-400' :
                    boat.status === 'BLOCKED' ? 'bg-red-500/15 text-red-600 dark:text-red-400' :
                    'bg-blue-500/15 text-blue-600 dark:text-blue-400'
                  }`}>
                    {boat.status === 'AVAILABLE' ? 'Disponível' : boat.status === 'MAINTENANCE' ? 'Manutenção' : boat.status === 'BLOCKED' ? 'Bloqueado' : boat.status as string}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
